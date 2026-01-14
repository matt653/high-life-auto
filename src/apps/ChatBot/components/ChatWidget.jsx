import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    RefreshCw
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { generateChatResponse } from '../services/geminiService';

export const ChatWidget = ({ userId, inventory, knowledge, integrations, demoMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    // Session ID for this specific chat instance
    const [sessionId] = useState(() => localStorage.getItem('hla_session') || crypto.randomUUID());
    const [isLeadSaved, setIsLeadSaved] = useState(false);
    const scrollRef = useRef(null);

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
                // If we detect a phase shift, update it, otherwise keep current
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

            // Remove undefined keys
            Object.keys(leadData).forEach(key => leadData[key] === undefined && delete leadData[key]);

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

                    {/* Realistic Animated SVG Avatar - Car Dude (Clean Version) */}
                    <div className="w-48 h-80 animate-float drop-shadow-2xl">
                        <svg viewBox="0 0 200 400" className="w-full h-full" style={{ overflow: 'visible' }}>
                            <defs>
                                <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F5D0A9" />
                                    <stop offset="100%" stopColor="#E0B080" />
                                </linearGradient>
                                <linearGradient id="poloGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#1e3a8a" /> {/* Blue Polo */}
                                    <stop offset="100%" stopColor="#172554" />
                                </linearGradient>
                                <linearGradient id="pantsGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#e5e7eb" /> {/* Khakis/Gray Slacks */}
                                    <stop offset="100%" stopColor="#d1d5db" />
                                </linearGradient>
                            </defs>

                            {/* Shadow */}
                            <ellipse cx="100" cy="390" rx="60" ry="8" fill="black" opacity="0.2" filter="blur(4px)" />

                            {/* --- LEGS --- */}
                            {/* Left Leg */}
                            <path d="M85 240 L80 370 L95 370 L100 240 Z" fill="url(#pantsGrad)" stroke="#9ca3af" strokeWidth="1" />
                            {/* Right Leg */}
                            <path d="M115 240 L120 370 L105 370 L100 240 Z" fill="url(#pantsGrad)" stroke="#9ca3af" strokeWidth="1" />
                            {/* Crotch */}
                            <path d="M85 240 L115 240 L100 280 Z" fill="url(#pantsGrad)" />

                            {/* --- SHOES (Clean Sneakers) --- */}
                            <path d="M75 370 L95 370 L95 385 Q95 390 85 390 L75 390 Q70 390 70 380 Z" fill="#ffffff" />
                            <path d="M125 370 L105 370 L105 385 Q105 390 115 390 L125 390 Q130 390 130 380 Z" fill="#ffffff" />

                            {/* --- TORSO (Polo Shirt) --- */}
                            <path d="M70 100 Q75 90 85 100 L80 250 L120 250 L115 100 Q125 90 130 100 L135 150 L125 250 L75 250 L65 150 Z" fill="url(#poloGrad)" />

                            {/* Collar */}
                            <path d="M85 100 L100 120 L115 100" fill="none" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Logo */}
                            <circle cx="110" cy="130" r="5" fill="#facc15" /> {/* Gold Badge */}

                            {/* --- ARMS --- */}
                            {/* Left Arm (Relaxed) */}
                            <path d="M65 110 Q50 150 60 190" stroke="url(#skinGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
                            <circle cx="60" cy="195" r="8" fill="url(#skinGrad)" />

                            {/* Right Arm (Holding Keys) */}
                            <path d="M135 110 Q150 150 140 190" stroke="url(#skinGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
                            <circle cx="140" cy="195" r="8" fill="url(#skinGrad)" />

                            {/* Car Keys (Fob) */}
                            <rect x="135" y="195" width="10" height="15" rx="2" fill="black" />
                            <rect x="138" y="210" width="4" height="10" fill="#9ca3af" />

                            {/* --- HEAD --- */}
                            <rect x="88" y="85" width="24" height="20" fill="url(#skinGrad)" /> {/* Neck */}

                            {/* Face */}
                            <path d="M75 55 Q75 95 100 95 Q125 95 125 55 Q125 25 100 25 Q75 25 75 55" fill="url(#skinGrad)" />

                            {/* Sunglasses (Cool Vibe) */}
                            <path d="M80 55 L100 55 L120 55 Q125 55 125 60 L120 65 Q110 70 100 65 Q90 70 80 65 L75 60 Q75 55 80 55 Z" fill="#111827" />
                            <line x1="100" y1="55" x2="100" y2="65" stroke="#111827" strokeWidth="1" />

                            {/* Smile */}
                            <path d="M90 80 Q100 85 110 80" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />

                            {/* Hair (Clean Cut) */}
                            <path d="M75 55 Q75 20 100 15 Q125 20 125 55 L125 50 Q120 10 100 10 Q80 10 75 50 Z" fill="#4B5563" />

                        </svg>
                    </div>
                </div>
            </div>

            {/* 2. The Thought Bubble (The Chat Interface) */}
            <div className={`fixed z-40 transition-all duration-500 ease-out origin-bottom-right ${isOpen
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

                                        {/* Hair (Clean Cut) */}
                                        <path d="M25 40 Q25 10 50 5 Q75 10 75 40 L75 35 Q70 0 50 0 Q30 0 25 35 Z" fill="#4B5563" />

                                        {/* Sunglasses */}
                                        <path d="M30 40 L45 40 L55 40 L70 40 Q75 40 75 45 L70 50 Q60 55 50 50 Q40 55 30 50 L25 45 Q25 40 30 40 Z" fill="#111827" />
                                        <line x1="50" y1="40" x2="50" y2="50" stroke="#111827" strokeWidth="1" />

                                        {/* Smile */}
                                        <path d="M35 70 Q50 75 65 70" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" />
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
                                    <div className={`max-w-[80%] p-3 px-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
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
