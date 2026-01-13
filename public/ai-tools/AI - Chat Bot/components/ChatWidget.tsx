import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  RefreshCw, 
  Zap 
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { generateChatResponse } from '../services/geminiService';
import { InventoryItem, KnowledgeItem } from '../types';

interface ChatWidgetProps {
  userId: string;
  inventory: InventoryItem[];
  knowledge: KnowledgeItem[];
  integrations: { sheetUrl?: string };
  demoMode: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ userId, inventory, knowledge, integrations, demoMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // Session ID for this specific chat instance
  const [sessionId] = useState(() => localStorage.getItem('hla_session') || crypto.randomUUID());
  const [isLeadSaved, setIsLeadSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize session
  useEffect(() => {
    if (demoMode) return;

    localStorage.setItem('hla_session', sessionId);
    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats', sessionId, 'messages');
    
    // Check if we already saved this lead previously
    const checkSaved = async () => {
      const docRef = doc(db, 'artifacts', appId, 'users', userId, 'leads', sessionId);
      const snap = await getDoc(docRef);
      if (snap.exists()) setIsLeadSaved(true);
    };
    checkSaved();

    const unsubscribe = onSnapshot(query(chatRef, orderBy('createdAt', 'asc')), (snap) => {
      if (!snap.empty) {
        setMessages(snap.docs.map(d => d.data()));
      }
    });
    return () => unsubscribe();
  }, [sessionId, isOpen, demoMode, userId]);

  // Initial greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
       const greeting = { 
         role: 'model', 
         text: "Hey! I'm Rex. I'm here to serve and help you find the perfect ride. Before we jump into the lot, what's your name and a good number to reach you at if we get disconnected?", 
         createdAt: new Date()
       };
       
       if (demoMode) {
         setMessages([greeting]);
       } else {
         const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats', sessionId, 'messages');
         addDoc(chatRef, { ...greeting, createdAt: serverTimestamp() });
       }
    }
  }, [isOpen, messages.length, sessionId, demoMode]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    setIsTyping(true);

    // Add User Message
    if (demoMode) {
      setMessages(prev => [...prev, { role: 'user', text: userText, createdAt: new Date() }]);
    } else {
      const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats', sessionId, 'messages');
      await addDoc(chatRef, { role: 'user', text: userText, createdAt: serverTimestamp() });
    }

    // Construct Context
    const inventoryContext = inventory.map(i => `
      VEHICLE: ${i.name}
      VIN: ${i.vin}
      PRICE: $${i.price} (No-Haggle)
      MILES: ${i.miles}
      VIDEO LINK: ${i.youtube || 'No video link available, ask agent'}
      DETAILS: ${i.comments}
    `).join('\n---\n');
    
    const rules = knowledge.map(k => `[COMPANY RULE] ${k.content}`).join('\n');
    
    // THE 7-PHASE ROAD TO SALE PROMPT (UPDATED)
    const systemPrompt = `
      You are Rex, the High Life Auto Bot. 
      
      CORE MISSION: HELP, SERVE, AND ASSIST.
      - Your goal is to be helpful and knowledgeable, using the inventory data provided.
      - Be playful but professional.
      
      INVENTORY DATA SOURCE:
      - Use the provided inventory list to answer specific questions about features, miles, and condition.
      - If a user asks about a car, SHARE THE VIDEO LINK if available.
      
      THE PIPELINE (7 PHASES):
      Guide the user through these steps naturally.
      
      1. CONTACT INFO: Get name/phone. If missing, ask politely.
      2. INTEREST: What are they looking for? (SUV, Truck, Sedan?)
      3. NEEDS vs WANTS: Help them focus on what they *need* based on our inventory.
      4. BUDGET: 
         - WE ARE CASH ONLY. NO FINANCING. NO HAGGLE.
         - Be gentle: "That's how we keep prices this low!"
      5. TIMELINE: We don't hold cars. First come, first served.
      6. VIDEO/ISSUES: 
         - "Have you watched the video for the [Car Name]?"
         - Confirm they accept known issues mentioned in the DETAILS.
      7. READY TODAY: "Are you ready to come in today with cash?"
      
      CRITICAL ESCALATION (OWNER NOTIFICATION):
      - If the user is ANGRY or has a COMPLAINT: Do not argue. Apologize and say, "I'm going to get the owner involved right away to help you."
      - TRADES: If they insist on a trade, say, "I need to check with the owner on that specific trade. Let me flag this for them."
      
      ${rules}
      
      CURRENT INVENTORY:
      ${inventoryContext}
    `;

    // format history for API
    const history = messages.map(m => ({ role: m.role, text: m.text })).slice(-8);

    const responseText = await generateChatResponse(userText, systemPrompt, history);
    
    setIsTyping(false);

    // Add Model Response
    if (demoMode) {
      setMessages(prev => [...prev, { role: 'model', text: responseText, createdAt: new Date() }]);
    } else {
      const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats', sessionId, 'messages');
      await addDoc(chatRef, { role: 'model', text: responseText, createdAt: serverTimestamp() });
    }

    // --- ANALYZE FOR CRM ---
    const lower = responseText.toLowerCase();
    const userLower = userText.toLowerCase();
    
    // Simple heuristic to detect contact info
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phoneRegex = /\b(\+?1[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b/;
    const hasContactInfo = emailRegex.test(userText) || phoneRegex.test(userText);

    // Detect "Hot" Phrases or Escalations
    const isAngry = userLower.includes('angry') || userLower.includes('upset') || userLower.includes('manager') || userLower.includes('complain');
    const isTrade = userLower.includes('trade');
    const isReady = lower.includes('come in') || lower.includes('ready');

    // Only save to the "Leads/Chats" database if we found contact info OR if it's already a known lead
    if (!demoMode && (hasContactInfo || isLeadSaved || isAngry || isTrade)) {
      
      let newStatus = undefined;
      // Auto-move phase based on conversation keywords (Simplistic AI agent behavior)
      if (hasContactInfo) newStatus = 'phase_1_contact';
      if (lower.includes('need') || lower.includes('looking for')) newStatus = 'phase_3_needs';
      if (lower.includes('cash') || lower.includes('budget')) newStatus = 'phase_4_budget';
      if (lower.includes('video')) newStatus = 'phase_6_video';
      if (isReady) newStatus = 'phase_7_ready';

      const leadData = { 
        id: sessionId, 
        name: isLeadSaved ? undefined : "New Customer", 
        // If we detect a phase shift, update it, otherwise keep current (undefined will be ignored by merge if properly handled, but here we might overwrite if not careful. Firestore merge ignores undefined usually)
        status: newStatus,
        lastMessage: userText, 
        updatedAt: serverTimestamp(),
        hwVideo: lower.includes('video') && lower.includes('here'),
        hwDescription: lower.includes('description') || lower.includes('disclosure'),
        hwIssues: lower.includes('quirks') || lower.includes('issues'),
        source: 'Rex (Bot)',
        hasContactInfo: true,
        // Mark for owner attention
        notes: isAngry ? "CUSTOMER ANGRY - NEEDS ATTENTION" : isTrade ? "Requested Trade - Needs Approval" : undefined
      };
      
      // Remove undefined keys to prevent overwriting existing data with nothing
      Object.keys(leadData).forEach(key => (leadData as any)[key] === undefined && delete (leadData as any)[key]);

      const leadsRef = collection(db, 'artifacts', appId, 'users', userId, 'leads');
      await setDoc(doc(leadsRef, sessionId), leadData, { merge: true });
      setIsLeadSaved(true);

      // Webhook (Only fire if new info)
      if (integrations.sheetUrl && hasContactInfo) {
        try {
          fetch(integrations.sheetUrl, { 
            method: 'POST', 
            mode: 'no-cors', 
            body: JSON.stringify(leadData) 
          });
        } catch (e) { console.error("Webhook fail", e); }
      }
    }
  };

  return (
    <>
      {/* 1. The Mascot (Disappears when chat opens) */}
      <div 
        onClick={() => setIsOpen(true)}
        className={`fixed z-50 cursor-pointer transition-all duration-700 ease-in-out hover:scale-105 
        ${isOpen 
            ? 'bottom-0 right-0 opacity-0 translate-y-20 pointer-events-none scale-75' 
            : 'bottom-4 right-4 md:bottom-8 md:right-8 opacity-100 translate-y-0 scale-100'
        }`}
      >
         <div className="relative group flex flex-col items-center">
            
            {/* Speech Bubble Prompt */}
            <div className="absolute -top-16 bg-white text-gray-900 text-[11px] font-black uppercase px-4 py-3 rounded-2xl shadow-xl border border-gray-100 animate-bounce whitespace-nowrap z-10 flex flex-col items-center">
               <span>Hey! I'm Rex.</span>
               <span className="text-orange-600 text-[9px]">Check inventory?</span>
               <div className="absolute -bottom-2 w-4 h-4 bg-white transform rotate-45 border-r border-b border-gray-100"></div>
            </div>

            {/* Realistic Animated SVG Avatar - Car Dude */}
            <div className="w-48 h-80 animate-float drop-shadow-2xl">
              <svg viewBox="0 0 200 400" className="w-full h-full" style={{ overflow: 'visible' }}>
                 <defs>
                    <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F5D0A9" />
                        <stop offset="100%" stopColor="#E0B080" />
                    </linearGradient>
                    <linearGradient id="denimGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#374151" />
                        <stop offset="100%" stopColor="#1F2937" />
                    </linearGradient>
                    <linearGradient id="shirtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F3F4F6" />
                        <stop offset="100%" stopColor="#D1D5DB" />
                    </linearGradient>
                    <linearGradient id="jeansGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#1E40AF" />
                    </linearGradient>
                 </defs>

                 {/* Shadow */}
                 <ellipse cx="100" cy="390" rx="80" ry="10" fill="black" opacity="0.3" filter="blur(5px)" />

                 {/* --- LEGS (Distinct Pants!) --- */}
                 {/* Left Leg */}
                 <path d="M85 240 L70 360 L95 360 L100 240 Z" fill="url(#jeansGrad)" stroke="#1E3A8A" strokeWidth="1" />
                 {/* Right Leg */}
                 <path d="M115 240 L130 360 L105 360 L100 240 Z" fill="url(#jeansGrad)" stroke="#1E3A8A" strokeWidth="1" />
                 {/* Crotch Area */}
                 <path d="M85 240 L115 240 L100 260 Z" fill="url(#jeansGrad)" />
                 
                 {/* Grease stains / Distress on jeans */}
                 <path d="M75 300 Q80 295 85 300" fill="none" stroke="#60A5FA" strokeWidth="2" opacity="0.5" />
                 <path d="M120 320 Q125 315 130 320" fill="none" stroke="#60A5FA" strokeWidth="2" opacity="0.5" />
                 <circle cx="80" cy="280" r="3" fill="#1F2937" opacity="0.3" /> {/* Grease spot */}

                 {/* --- BOOTS (Work Boots) --- */}
                 <path d="M60 360 L95 360 L95 375 Q95 385 85 385 L70 385 Q60 385 60 375 Z" fill="#78350F" />
                 <rect x="60" y="380" width="35" height="5" fill="#451a03" /> {/* Sole */}
                 
                 <path d="M140 360 L105 360 L105 375 Q105 385 115 385 L130 385 Q140 385 140 375 Z" fill="#78350F" />
                 <rect x="105" y="380" width="35" height="5" fill="#451a03" /> {/* Sole */}

                 {/* --- TORSO --- */}
                 {/* Undershirt (White Tee) - Dirty */}
                 <path d="M75 110 L125 110 L125 250 L75 250 Z" fill="url(#shirtGrad)" />
                 <circle cx="100" cy="180" r="15" fill="none" stroke="#E5E7EB" strokeWidth="2" /> {/* Logo hint */}
                 <path d="M90 200 Q100 210 110 200" stroke="#9CA3AF" strokeWidth="2" fill="none" /> {/* Wrinkle */}

                 {/* Work Shirt / Vest (Unbuttoned) */}
                 <path d="M60 110 Q70 100 80 110 L80 250 L65 240 Z" fill="url(#denimGrad)" /> {/* Left Panel */}
                 <path d="M140 110 Q130 100 120 110 L120 250 L135 240 Z" fill="url(#denimGrad)" /> {/* Right Panel */}
                 
                 {/* Shoulders/Arms */}
                 {/* Left Arm (Relaxed) */}
                 <path d="M60 120 Q40 160 55 200" stroke="url(#skinGrad)" strokeWidth="16" strokeLinecap="round" fill="none" />
                 <circle cx="55" cy="205" r="9" fill="url(#skinGrad)" /> {/* Hand */}
                 
                 {/* Right Arm (Holding Wrench) */}
                 <path d="M140 120 Q160 160 145 200" stroke="url(#skinGrad)" strokeWidth="16" strokeLinecap="round" fill="none" />
                 <circle cx="145" cy="205" r="9" fill="url(#skinGrad)" /> {/* Hand */}
                 
                 {/* Wrench */}
                 <g transform="translate(145, 205) rotate(-20)">
                    <rect x="-5" y="-15" width="10" height="40" fill="#9CA3AF" rx="2" />
                    <circle cx="0" cy="-20" r="8" fill="#9CA3AF" />
                    <circle cx="0" cy="-20" r="4" fill="#374151" /> {/* Wrench hole */}
                 </g>

                 {/* --- HEAD --- */}
                 {/* Neck */}
                 <rect x="85" y="90" width="30" height="25" fill="url(#skinGrad)" />
                 
                 {/* Face */}
                 <path d="M75 60 Q75 105 100 105 Q125 105 125 60 Q125 20 100 20 Q75 20 75 60" fill="url(#skinGrad)" />

                 {/* Cap (Backwards) */}
                 <path d="M72 50 Q75 20 100 20 Q125 20 128 50 L125 60 Q100 55 75 60 Z" fill="#EA580C" />
                 <rect x="85" y="55" width="30" height="5" fill="#C2410C" rx="2"/> {/* Cap adjust strap area */}

                 {/* Hair (Messy under cap) */}
                 <path d="M72 60 L70 70 L75 65" fill="#3E2723" />
                 <path d="M128 60 L130 70 L125 65" fill="#3E2723" />

                 {/* Facial Features */}
                 <g className="animate-blink">
                    <circle cx="90" cy="70" r="2.5" fill="#1F2937" />
                    <circle cx="110" cy="70" r="2.5" fill="#1F2937" />
                 </g>
                 
                 {/* Grease Smudge on Cheek */}
                 <path d="M82 78 Q85 80 88 78" stroke="#4B5563" strokeWidth="2" opacity="0.4" />

                 {/* Nose */}
                 <path d="M100 70 L98 80 L102 80 Z" fill="#C18C5D" opacity="0.4" />
                 
                 {/* Mouth (Confidence Smirk) */}
                 <path d="M92 90 Q100 95 112 88" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
                 
                 {/* 5 o'clock shadow */}
                 <path d="M80 85 Q100 110 120 85" fill="#000" opacity="0.08" />
              </svg>
            </div>
         </div>
      </div>

      {/* 2. The Thought Bubble (The Chat Interface) */}
      <div className={`fixed z-40 transition-all duration-500 ease-out origin-bottom-right ${
          isOpen 
            ? 'bottom-20 right-4 md:right-8 opacity-100 scale-100 translate-y-0' 
            : 'bottom-20 right-8 opacity-0 scale-50 translate-y-10 pointer-events-none'
      }`}>
         <div className="relative">
            {/* Thought Bubbles Connector */}
            <div className={`absolute -bottom-16 right-20 w-4 h-4 bg-white rounded-full shadow-sm border border-gray-100 transition-opacity duration-300 ${isOpen ? 'opacity-100 delay-300' : 'opacity-0'}`}></div>
            <div className={`absolute -bottom-8 right-32 w-8 h-8 bg-white rounded-full shadow-sm border border-gray-100 transition-opacity duration-300 ${isOpen ? 'opacity-100 delay-200' : 'opacity-0'}`}></div>

            {/* Main Bubble Container */}
            <div className="w-[90vw] md:w-[380px] h-[500px] max-h-[70vh] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden relative">
               
               {/* Header */}
               <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-white shadow-lg border-2 border-white overflow-hidden relative">
                       {/* Face Only for Header - Matching the Car Dude */}
                       <svg viewBox="0 0 100 100" className="w-full h-full absolute top-1">
                          <rect width="100" height="100" fill="#E0F2FE" />
                          
                          {/* Face Shape */}
                          <path d="M25 40 Q25 90 50 90 Q75 90 75 40 Q75 10 50 10 Q25 10 25 40" fill="#F5D0A9" />
                          
                          {/* Cap */}
                          <path d="M22 30 Q50 15 78 30 L75 40 Q50 35 25 40 Z" fill="#EA580C" />
                          
                          {/* Eyes */}
                          <circle cx="40" cy="55" r="3" fill="#1F2937" />
                          <circle cx="60" cy="55" r="3" fill="#1F2937" />
                          
                          {/* Grease */}
                          <path d="M30 65 Q35 68 38 65" stroke="#4B5563" strokeWidth="2" opacity="0.4" />

                          {/* Smirk */}
                          <path d="M40 75 Q50 80 65 72" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" />
                          
                          {/* Stubble */}
                          <path d="M30 70 Q50 95 70 70" fill="#000" opacity="0.08" />
                       </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-black italic text-md leading-none">REX</h3>
                      <p className="text-blue-200 text-[9px] font-bold uppercase tracking-widest">Master Tech</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-white/10 rounded-full p-1">
                    <X size={18} />
                  </button>
               </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex-shrink-0 mr-2 mt-auto mb-1 flex items-center justify-center overflow-hidden">
                            <span className="text-xs">🔧</span>
                        </div>
                      )}
                      <div className={`max-w-[80%] p-3 px-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        m.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start w-full animate-pulse pl-10">
                      <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
                          <RefreshCw size={12} className="animate-spin text-gray-400" />
                          <span className="text-xs font-bold text-gray-400 italic">Rex is looking under the hood...</span>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t flex gap-2">
                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask Rex about a car..."
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={isTyping || !input.trim()}
                    className="bg-gray-900 text-white p-3 rounded-xl hover:bg-black transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>

            </div>
         </div>
      </div>
    </>
  );
};