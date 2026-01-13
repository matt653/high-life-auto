
import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    LayoutDashboard,
    Users,
    ChevronRight,
    Plus,
    RefreshCw,
    Zap,
    Car,
    MessageCircle,
    CheckCircle2,
    AlertTriangle,
    Video,
    FileText,
    Send,
    Link as LinkIcon,
    ShieldAlert,
    X,
    Minimize2
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

import './SmartChatbot.css'; // Re-use the CSS for container/bubble styles

// --- Configuration ---
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL;

// --- Mock Database (LocalStorage) ---
const mockDb = {
    get: (collection) => {
        try {
            return JSON.parse(localStorage.getItem(`hla_${collection}`)) || [];
        } catch { return []; }
    },
    set: (collection, data) => {
        localStorage.setItem(`hla_${collection}`, JSON.stringify(data));
    },
    add: (collection, item) => {
        const data = mockDb.get(collection);
        const newItem = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        data.push(newItem);
        mockDb.set(collection, data);
        return newItem;
    },
    update: (collection, id, updates) => {
        const data = mockDb.get(collection);
        const index = data.findIndex(d => d.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            mockDb.set(collection, data);
        }
    },
    delete: (collection, id) => {
        const data = mockDb.get(collection);
        const newData = data.filter(d => d.id !== id);
        mockDb.set(collection, newData);
    }
};

const PIPELINE_STAGES = [
    { id: 'lead', title: 'New Inquiry', color: 'bg-blue-100 text-blue-800' },
    { id: 'qualifying', title: 'Qualifying', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'hot', title: 'Cash Ready/HW Done', color: 'bg-orange-100 text-orange-800' },
    { id: 'sold', title: 'Closed/Delivered', color: 'bg-green-100 text-green-800' },
    { id: 'followup', title: 'Post-Sale Care', color: 'bg-pink-100 text-pink-800' },
];

// --- AI Engine ---
// Initialize dynamically to catch env var changes
const fetchGeminiResponse = async (userText, systemInstruction, history = []) => {
    try {
        // Fallback to hardcoded key if env var fails to load
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBjyT8TsGpcA8ureyU989vbHqWKywBPAPg";

        if (!apiKey) throw new Error("Missing HighLife API Key");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash", // Updated to matches available models for this API key
            systemInstruction: systemInstruction
        });

        // Gemini API requires history to start with 'user'. 
        // We filter out any leading 'model' messages from the history array.
        const formattedHistory = history.map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        // Find the index of the first 'user' message
        const firstUserIndex = formattedHistory.findIndex(msg => msg.role === 'user');

        // If no user message is found (e.g. only AI greeting), pass empty history
        // If found, slice from that index to ensure we start with user
        const validHistory = firstUserIndex !== -1 ? formattedHistory.slice(firstUserIndex) : [];

        const chat = model.startChat({
            history: validHistory
        });

        const result = await chat.sendMessage(userText);
        const response = await result.response;
        return response.text();
    } catch (err) {
        console.error("Gemini Error:", err);
        return `System Error: ${err.message || "Connection Failed"}. Please contact the manager.`;
    }
};

// --- Main Chatbot Component ---
const SmartChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('visitor'); // 'visitor' or 'admin'
    const [adminTab, setAdminTab] = useState('pipeline');
    const [leads, setLeads] = useState([]);
    const [knowledge, setKnowledge] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);

    // Load Data on Mount
    useEffect(() => {
        setLeads(mockDb.get('leads'));
        setKnowledge(mockDb.get('knowledge'));

        // Load Inventory from Real Source
        // Inventory Feed Removed - Placeholder
        setInventory([]);

        // Poll for changes (pseudo-realtime)
        const interval = setInterval(() => {
            setLeads(mockDb.get('leads'));
            setKnowledge(mockDb.get('knowledge'));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Event Listener for External CRM Access (e.g. from Footer)
    useEffect(() => {
        const handleExternalLogin = () => {
            setIsOpen(true);
            setView('admin');
        };
        window.addEventListener('CRM_LOGIN_TRIGGER', handleExternalLogin);
        return () => window.removeEventListener('CRM_LOGIN_TRIGGER', handleExternalLogin);
    }, []);

    const handleAdminAuth = () => {
        const pass = prompt("Enter Admin Password:");
        if (pass === 'highlife2026') {
            setView('admin');
        }
    };

    if (!isOpen) {
        return (
            <button
                className="smart-bot-toggle"
                onClick={() => setIsOpen(true)}
            >
                <MessageCircle size={32} />
            </button>
        );
    }

    // --- RENDER VISITOR VIEW (The actual Chat) ---
    if (view === 'visitor') {
        return (
            <div className="smart-bot-window">
                <div className="smart-bot-header">
                    <div className="smart-header-content">
                        <div className="smart-avatar">
                            <Zap size={28} />
                        </div>
                        <div className="smart-title">
                            <h3>High Life <span>Concierge</span></h3>
                            <p className="smart-subtitle">Helpful • Honest • No BS</p>
                        </div>
                    </div>
                    <div className="smart-controls">
                        <button onClick={handleAdminAuth} title="Admin Access"><ShieldAlert size={14} /></button>
                        <button onClick={() => setIsOpen(false)}><Minimize2 size={18} /></button>
                    </div>
                </div>

                <VisitorChat
                    inventory={inventory}
                    knowledge={knowledge}
                    onLeadUpdate={(lead) => {
                        const existing = leads.find(l => l.id === lead.id);
                        if (existing) {
                            mockDb.update('leads', lead.id, lead);
                        } else {
                            mockDb.add('leads', lead);
                        }
                    }}
                />
            </div>
        );
    }

    // --- RENDER ADMIN VIEW ---
    return (
        <div className="admin-overlay">
            <header className="admin-header">
                <div className="admin-header-brand">
                    <div className="admin-brand-icon"><Car size={22} /></div>
                    <div><h1 className="admin-brand-title">High Life <span className="text-orange-600">Admin</span></h1></div>
                </div>
                <div className="admin-header-actions">
                    <button onClick={() => setView('visitor')} className="admin-button-secondary">Back to Bot</button>
                    <button onClick={() => setIsOpen(false)} className="admin-button-danger">Close</button>
                </div>
            </header>

            <div className="admin-main-content">
                <aside className="admin-sidebar">
                    <SidebarItem icon={LayoutDashboard} label="Pipeline" active={adminTab === 'pipeline'} onClick={() => { setAdminTab('pipeline'); setSelectedLead(null); }} />
                    <SidebarItem icon={Users} label="CRM List" active={adminTab === 'crm'} onClick={() => setAdminTab('crm')} />
                    <SidebarItem icon={ShieldAlert} label="Sales Rules" active={adminTab === 'knowledge'} onClick={() => setAdminTab('knowledge')} />
                </aside>

                <section className="admin-content-area">
                    {selectedLead ? (
                        <LeadProfile lead={selectedLead} onBack={() => setSelectedLead(null)} />
                    ) : (
                        <>
                            {adminTab === 'pipeline' && <SalesPipeline leads={leads} onSelectLead={setSelectedLead} />}
                            {adminTab === 'crm' && <CRMDetails leads={leads} onSelectLead={setSelectedLead} />}
                            {adminTab === 'knowledge' && <KnowledgeManager knowledge={knowledge} onUpdate={() => setKnowledge(mockDb.get('knowledge'))} />}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};

// --- SUB COMPONENTS ---

const VisitorChat = ({ inventory, knowledge, onLeadUpdate }) => {
    // Start fresh every time the component mounts (Page Refresh = New Chat)
    // This prevents "bad history" from crashing the bot
    const [messages, setMessages] = useState([{ role: 'ai', text: "Hey! High Life Auto here. I'm the digital helper. I'm honest, I don't sugar-coat things. What car are you looking at today?", createdAt: new Date() }]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Create a temporary session ID for this specific browse session
    const [sessionId] = useState(() => crypto.randomUUID());
    const scrollRef = useRef(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => scrollToBottom(), [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userText = input;

        // Add User Message to UI
        const newMsgs = [...messages, { role: 'user', text: userText, createdAt: new Date() }];
        setMessages(newMsgs);

        // We do NOT save to localStorage anymore, keeping it "fresh" per browsing session

        setInput('');
        setIsTyping(true);

        const inventoryContext = inventory.map(i => `
      CAR: ${i.year} ${i.make} ${i.model} ${i.trim || ''}
      PRICE: $${i.price}
      MILES: ${i.mileage}
      VIN: ${i.vin}
    `).join('\n---\n');

        const rules = knowledge.map(k => `[POLICY] ${k.content}`).join('\n');

        const systemPrompt = `
      You are the official High Life Auto Concierge. 
      STYLE: Straight-talking Iowa car dealer. Patient, kind, and helpful.
      
      CORE GUIDELINES:
      - We are "Cool to be Uncool". We sell budget cars.
      - Be transparent about miles and price.
      - If they ask about financing: We have options, but Cash is King.
      
      ${rules}
      
      CURRENT INVENTORY:
      ${inventoryContext}
    `;

        const responseText = await fetchGeminiResponse(userText, systemPrompt, messages.slice(-5));

        const finalMsgs = [...newMsgs, { role: 'ai', text: responseText, createdAt: new Date() }];
        setMessages(finalMsgs);
        setIsTyping(false);

        // Sync to CRM
        const lower = responseText.toLowerCase() + " " + userText.toLowerCase();
        const leadData = {
            id: sessionId,
            name: "Web Guest",
            status: lower.includes('buy') || lower.includes('cash') ? 'hot' : 'qualifying',
            lastMessage: userText,
            updatedAt: new Date().toISOString(),
            hwVideo: lower.includes('video'),
            hwDescription: lower.includes('description'),
            hwIssues: lower.includes('issue') || lower.includes('problem'),
            source: 'Helpful Bot'
        };
        onLeadUpdate(leadData);

        if (SHEET_URL) {
            try { fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(leadData) }); } catch (e) { }
        }
    };

    return (
        <>
            <div className="smart-messages-area">
                {messages.map((m, i) => (
                    <div key={i} className={`chat-msg ${m.role === 'user' ? 'user' : 'ai'}`}>
                        <div className={`msg-bubble ${m.role === 'user' ? 'user' : 'ai'}`}>
                            <span className="msg-label">{m.role === 'user' ? 'You' : 'High Life Guide'}</span>
                            {m.text}
                        </div>
                    </div>
                ))}
                {isTyping && <div className="typing-indicator"><RefreshCw size={10} className="animate-spin" /> Checkin' Under the Hood...</div>}
                <div ref={scrollRef} />
            </div>
            <div className="smart-input-area">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about a car..."
                    className="smart-input"
                />
                <button onClick={handleSend} className="smart-send-btn">
                    <Send size={20} />
                </button>
            </div>
        </>
    );
};

// --- CRM & ADMIN COMPONENTS ---

const SalesPipeline = ({ leads, onSelectLead }) => {
    // Group leads by stage
    return (
        <div className="flex space-x-4 overflow-x-auto pb-6 h-full">
            {PIPELINE_STAGES.map(stage => {
                const stageLeads = leads.filter(l => l.status === stage.id);
                return (
                    <div key={stage.id} className="min-w-[300px] w-[300px] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
                        <div className={`p-4 border-b font-bold uppercase text-xs tracking-widest flex justify-between ${stage.color.replace('text', 'bg').split(' ')[0]} bg-opacity-20`}>
                            <span className={stage.color.split(' ')[1]}>{stage.title}</span>
                            <span className="opacity-50">{stageLeads.length}</span>
                        </div>
                        <div className="p-3 space-y-3 overflow-y-auto flex-1">
                            {stageLeads.map(lead => (
                                <div key={lead.id} onClick={() => onSelectLead(lead)} className="bg-white p-4 rounded-lg border hover:border-orange-500 shadow-sm cursor-pointer transition-all">
                                    <h4 className="font-bold text-gray-800 mb-2">{lead.name}</h4>
                                    <div className="text-xs text-gray-500 italic truncate">"{lead.lastMessage}"</div>
                                    <div className="flex gap-2 mt-3">
                                        <Badge active={lead.hwVideo} icon={Video} />
                                        <Badge active={lead.hwIssues} icon={AlertTriangle} color="text-red-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

const Badge = ({ active, icon: Icon, color = "text-indigo-600" }) => (
    <div className={`p-1 rounded ${active ? 'bg-gray-100' : 'opacity-20'}`}>
        <Icon size={12} className={active ? color : 'text-gray-400'} />
    </div>
);

const LeadProfile = ({ lead, onBack }) => {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border">
            <button onClick={onBack} className="text-xs font-bold uppercase text-gray-400 mb-6 flex items-center hover:text-gray-900"><ChevronRight className="rotate-180 mr-1" size={12} /> Back to Board</button>
            <div className="flex items-center gap-6 mb-8 border-b pb-8">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">{lead.name[0]}</div>
                <div>
                    <h2 className="text-2xl font-black uppercase italic">{lead.name}</h2>
                    <p className="text-sm text-gray-500">Source: {lead.source}</p>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-xs font-bold uppercase text-gray-400">Status</div>
                    <div className="font-bold text-orange-600">{PIPELINE_STAGES.find(s => s.id === lead.status)?.title || lead.status}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h3 className="font-bold uppercase text-xs text-gray-400 mb-4">Last Interaction</h3>
                    <div className="p-4 bg-slate-50 rounded-xl italic text-gray-600">"{lead.lastMessage}"</div>
                </div>
                <div>
                    <h3 className="font-bold uppercase text-xs text-gray-400 mb-4">Homework Audit</h3>
                    <div className="space-y-2">
                        <CheckItem label="Watched Walkaround" checked={lead.hwVideo} />
                        <CheckItem label="Aware of Issues" checked={lead.hwIssues} />
                        <CheckItem label="Read Description" checked={lead.hwDescription} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const CheckItem = ({ label, checked }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${checked ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100 opacity-50'}`}>
        <span className="text-sm font-bold text-gray-700">{label}</span>
        {checked ? <CheckCircle2 size={16} className="text-green-600" /> : <div className="w-4 h-4 rounded-full border border-gray-300" />}
    </div>
);

const CRMDetails = ({ leads, onSelectLead }) => (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50 border-b">
                <tr>
                    <th className="text-left p-4 text-xs font-bold uppercase text-gray-500">Name</th>
                    <th className="text-left p-4 text-xs font-bold uppercase text-gray-500">Status</th>
                    <th className="text-left p-4 text-xs font-bold uppercase text-gray-500">Last Message</th>
                    <th className="text-left p-4 text-xs font-bold uppercase text-gray-500">Date</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {leads.map(lead => (
                    <tr key={lead.id} onClick={() => onSelectLead(lead)} className="hover:bg-slate-50 cursor-pointer">
                        <td className="p-4 font-bold text-gray-900">{lead.name}</td>
                        <td className="p-4"><span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">{lead.status}</span></td>
                        <td className="p-4 text-sm text-gray-500 truncate max-w-xs">{lead.lastMessage}</td>
                        <td className="p-4 text-xs text-gray-400">{new Date(lead.updatedAt).toLocaleDateString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const KnowledgeManager = ({ knowledge, onUpdate }) => {
    const [newItem, setNewItem] = useState('');
    const handleAdd = () => {
        if (!newItem) return;
        mockDb.add('knowledge', { content: newItem });
        onUpdate();
        setNewItem('');
    };
    const handleDelete = (id) => {
        mockDb.delete('knowledge', id);
        onUpdate();
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex gap-4">
                <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add a new sales rule..." className="flex-1 p-3 border rounded-xl" />
                <button onClick={handleAdd} className="bg-gray-900 text-white px-6 rounded-xl font-bold uppercase text-xs">Add Rule</button>
            </div>
            <div className="space-y-4">
                {knowledge.map(k => (
                    <div key={k.id} className="bg-white p-4 border rounded-xl flex justify-between items-start shadow-sm">
                        <p className="font-bold text-gray-700 italic">"{k.content}"</p>
                        <button onClick={() => handleDelete(k.id)} className="text-gray-300 hover:text-red-500"><X size={16} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all ${active ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
        <Icon size={18} />
        <span className="font-bold text-xs uppercase tracking-widest">{label}</span>
    </button>
);

export default SmartChatbot;
