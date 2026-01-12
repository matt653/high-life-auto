import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react'; // Assuming lucide-react is installed as per package.json
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';
import './Chatbot.css';

// Initialize Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL;

const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `
You are the "High Life Auto AI", a virtual assistant for High Life Auto, a used car dealership in Fort Madison, Iowa.
Your motto is "Cool to be Uncool." You sell reliable, budget-friendly cars so people's money stays theirs. No junk, just freedom.

GOALS:
1. Answer questions about the dealership (location: 519 2nd Street, Fort Madison, IA; phone: 309-337-1049).
2. Explain the philosophy: We don't sell expensive new cars that lose value. We sell solid used cars.
3. QUALIFY CUSTOMERS: engagement is key.
   - Ask for their name.
   - Ask what they are looking for (Budget? Type of car? Commuter?).
   - Ask if they have a trade-in.
   - CRITICAL: Try to get a phone number or email to "text them when fresh inventory arrives".

LEAD CAPTURE PROTOCOL:
If the user provides their Name AND (Phone OR Email) AND valid interest, you MUST output a special tag at the END of your response.
The tag format is: ||LEAD_DATA|| {"name": "...", "contact": "...", "interest": "...", "summary": "..."}
Do NOT show this tag to the user. It is for the system.

TONE:
Friendly, down-to-earth, slightly rebellious against the "big fancy dealership" vibe. Professional but authentic.
`;

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hey! Welcome to High Life Auto. Looking for a reliable ride without the debt trap?", sender: 'bot' }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState(null); // To maintain Gemini chat context

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Initialize Chat Session
    useEffect(() => {
        if (API_KEY) {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: SYSTEM_PROMPT }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "Understood. I am ready to be the High Life Auto AI. I will answer questions, explain the 'Cool to be Uncool' philosophy, and qualify customers. I will use the ||LEAD_DATA|| tag when I have captured a name, contact info, and interest." }],
                    }
                ],
            });
            setChatHistory(chat);
        } else {
            console.error("Gemini API Key is missing in .env");
            setMessages(prev => [...prev, { id: Date.now(), text: "System Error: Chatbot not configured properly (Missing API Key).", sender: 'bot' }]);
        }
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading || !chatHistory) return;

        const userText = inputValue.trim();
        setInputValue("");

        // Add user message
        setMessages(prev => [...prev, { id: Date.now(), text: userText, sender: 'user' }]);
        setIsLoading(true);

        try {
            const result = await chatHistory.sendMessage(userText);
            const response = await result.response;
            const text = response.text();

            // Check for Lead Data
            let displayMessage = text;
            const leadTagIndex = text.indexOf("||LEAD_DATA||");

            if (leadTagIndex !== -1) {
                const leadJsonString = text.substring(leadTagIndex + "||LEAD_DATA||".length).trim();
                displayMessage = text.substring(0, leadTagIndex).trim(); // Remove tag from display

                try {
                    const leadData = JSON.parse(leadJsonString);
                    submitLeadToSheet(leadData);
                } catch (err) {
                    console.error("Failed to parse Lead Data JSON:", err);
                }
            }

            setMessages(prev => [...prev, { id: Date.now() + 1, text: displayMessage, sender: 'bot' }]);
        } catch (error) {
            console.error("Gemini Error:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Sorry, I'm having trouble connecting to the dealership brain right now. Please try again later or call us!", sender: 'bot' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const submitLeadToSheet = async (data) => {
        console.log("Submitting Lead:", data);
        if (!SHEET_URL) {
            console.warn("No Google Sheet URL configured.");
            return;
        }

        try {
            await fetch(SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            console.log("Lead sent to Google Sheet (Note: no-cors mode does not return a response, but it works if URL is correct).");
        } catch (error) {
            console.error("Failed to send lead to sheet:", error);
        }
    };

    return (
        <div className="chatbot-container">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="chatbot-window"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    >
                        <div className="chatbot-header">
                            <div className="chatbot-status"></div>
                            <h3>High Life Assistant</h3>
                            <button onClick={() => setIsOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <Minimize2 size={18} />
                            </button>
                        </div>

                        <div className="chatbot-messages">
                            {messages.map(msg => (
                                <div key={msg.id} className={`message ${msg.sender}`}>
                                    {msg.text}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="message bot loading">
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chatbot-input" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder="Ask about cars, financing..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={isLoading}
                            />
                            <button type="submit" disabled={isLoading || !inputValue.trim()}>
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <motion.button
                    className="chatbot-toggle"
                    onClick={() => setIsOpen(true)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <MessageCircle size={32} />
                </motion.button>
            )}
        </div>
    );
};

export default Chatbot;
