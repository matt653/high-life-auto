
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, RefreshCw, Zap, Globe } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

export const ChatWidget = ({ userId, inventory, knowledge, integrations, demoMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId] = useState(() => localStorage.getItem('hla_session') || crypto.randomUUID());
    const scrollRef = useRef(null);

    useEffect(() => {
        if (demoMode) return;
        localStorage.setItem('hla_session', sessionId);
        const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats', sessionId, 'messages');

        const unsubscribe = onSnapshot(query(chatRef, orderBy('createdAt', 'asc')), (snap) => {
            if (!snap.empty) {
                setMessages(snap.docs.map(d => d.data()));
            }
        });
        return () => unsubscribe();
    }, [sessionId, userId, demoMode]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = {
                role: 'model',
                text: "Yo! I'm Turbo. 🏎️ I'm the fastest car expert on the block. Before we dive into the inventory, tell me—what kind of ride are you hunting for today?",
                createdAt: new Date()
            };
            if (demoMode) setMessages([greeting]);
            else addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats', sessionId, 'messages'), { ...greeting, createdAt: serverTimestamp() });
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

        if (demoMode) {
            setMessages(prev => [...prev, { role: 'user', text: userText, createdAt: new Date() }]);
        } else {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats', sessionId, 'messages'), { role: 'user', text: userText, createdAt: serverTimestamp() });
        }

        // Simulating delay
        setTimeout(async () => {
            setIsTyping(false);
            const text = "Turbo is currently undergoing maintenance. Please call us directly at 319-372-8191.";

            const modelMsg = { role: 'model', text, createdAt: demoMode ? new Date() : serverTimestamp() };
            if (demoMode) setMessages(prev => [...prev, modelMsg]);
            else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chats', sessionId, 'messages'), modelMsg);
        }, 1000);
    };

    return (
        <>
            {/* MASCOT TOGGLE */}
            <div
                onClick={() => setIsOpen(true)}
                className={`fixed z-50 cursor-pointer transition-all duration-700 ease-in-out hover:scale-105 
        ${isOpen ? 'bottom-0 right-0 opacity-0 translate-y-20 pointer-events-none' : 'bottom-4 right-4 md:bottom-6 md:right-6 opacity-100'}`}
            >
                <div className="relative group flex flex-col items-center">
                    <div className="absolute -top-12 bg-gray-950 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full shadow-xl animate-bounce z-10">
                        Chat with Turbo
                    </div>
                    <div className="w-14 h-24 md:w-18 md:h-30 animate-float drop-shadow-2xl">
                        <svg viewBox="0 0 200 400" className="w-full h-full" style={{ overflow: 'visible' }}>
                            <ellipse cx="100" cy="390" rx="40" ry="4" fill="black" opacity="0.3" filter="blur(5px)" />
                            {/* Legs */}
                            <rect x="84" y="240" width="14" height="90" fill="#0f172a" rx="4" />
                            <rect x="102" y="240" width="14" height="90" fill="#0f172a" rx="4" />
                            {/* Body */}
                            <rect x="72" y="135" width="56" height="105" fill="#1e293b" rx="10" />
                            <rect x="77" y="140" width="46" height="95" fill="#f8fafc" rx="6" />
                            {/* Head */}
                            <circle cx="100" cy="95" r="36" fill="#f5d0a9" />
                            {/* Cap */}
                            <path d="M64 75 Q100 40 136 75" fill="#ea580c" />
                            <rect x="64" y="70" width="72" height="10" fill="#ea580c" rx="2" />
                            {/* Eyes */}
                            <g className="animate-blink">
                                <circle cx="88" cy="95" r="3" fill="#0f172a" />
                                <circle cx="112" cy="95" r="3" fill="#0f172a" />
                            </g>
                            <path d="M94 112 Q100 117 106 112" stroke="#451a03" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* CHAT WINDOW */}
            <div className={`fixed z-[100] transition-all duration-500 ease-out origin-bottom-right ${isOpen ? 'bottom-4 right-4 md:bottom-5 md:right-5 opacity-100 scale-100' : 'bottom-6 right-6 opacity-0 scale-75 pointer-events-none'
                }`}>
                <div className="w-[calc(100vw-2rem)] md:w-[340px] h-[min(500px,75vh)] bg-white rounded-[1.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-gray-100 flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="bg-slate-900 px-4 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center font-black text-white italic text-sm shadow-lg">T</div>
                            <div>
                                <h3 className="text-white font-black italic text-xs leading-none">TURBO</h3>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                                    <p className="text-orange-400 text-[7px] font-black uppercase tracking-widest">Deal Expert</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="bg-white/10 p-1.5 rounded-lg text-white/50 hover:text-white transition-all">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Chat Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 scrollbar-hide">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3 py-2.5 rounded-xl text-[12px] font-medium leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                    {m.text}
                                    {m.sources && (
                                        <div className="mt-2 pt-1 border-t border-gray-100 flex items-center gap-1">
                                            <Globe size={9} className="text-blue-500" />
                                            <span className="text-[8px] font-bold text-blue-600 uppercase tracking-tighter">Verified Info</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && <div className="text-[9px] font-bold text-gray-400 italic px-2">Turbo is checking the yard...</div>}
                        <div ref={scrollRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t shrink-0">
                        <div className="flex gap-2 items-center bg-gray-100 p-1 rounded-lg focus-within:ring-2 focus-within:ring-orange-500/20">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent px-2 py-1.5 text-xs font-semibold outline-none"
                            />
                            <button onClick={handleSend} className="bg-slate-950 text-white p-2 rounded-lg hover:bg-orange-600 transition-all">
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
