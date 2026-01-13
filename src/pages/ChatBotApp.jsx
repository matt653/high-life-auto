import React, { useState, useEffect } from 'react';
import {
    Car,
    ExternalLink,
    Bot,
    Lock
} from 'lucide-react';
import {
    collection,
    onSnapshot,
    doc,
    addDoc,
    updateDoc
} from 'firebase/firestore';

// Adjusted imports for the moved components/services
import { auth, db, appId, isFirebaseConfigured } from '../apps/ChatBot/services/firebase';
import { AdminDashboard } from '../apps/ChatBot/components/AdminDashboard';
import { ChatWidget } from '../apps/ChatBot/components/ChatWidget';

// Simple CSV Parser
const parseCSV = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    return lines.slice(1).map((line, idx) => {
        // Handle quotes in CSV if simple split fails, but for this simpler implementation:
        const values = line.split(',');

        // Safety fallback for mapping
        const getVal = (includes) => {
            const idx = headers.findIndex(h => h.includes(includes));
            return idx !== -1 ? values[idx]?.trim() : '';
        };

        return {
            id: getVal('vin') || `csv-${idx}`,
            vin: getVal('vin') || 'UNKNOWN',
            name: `${getVal('year') || ''} ${getVal('make') || ''} ${getVal('model') || ''}`.trim() || 'Unknown Vehicle',
            price: getVal('price') || 'Call for Price',
            miles: getVal('miles') || 'TMU',
            comments: getVal('description') || getVal('notes') || getVal('comments') || 'No details available.',
            youtube: getVal('video') || getVal('youtube') || '',
            lastSynced: new Date().toISOString()
        };
    }).filter(i => i.name !== 'Unknown Vehicle'); // Filter bad rows
};

const ChatBotApp = () => {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('visitor');
    const [leads, setLeads] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [knowledge, setKnowledge] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [integrations, setIntegrations] = useState({ sheetUrl: '' });
    const [demoMode, setDemoMode] = useState(!isFirebaseConfigured);

    // Auth & Data Subscription
    useEffect(() => {
        if (demoMode) {
            // Setup Mock Data for Demo Mode
            setUser({ uid: 'demo-user', isAnonymous: true });
            setInventory([
                { id: '1', vin: "1G1JC12345", name: "2015 Chevrolet Malibu LT", price: "5900", miles: "125000", comments: "Clean title. Needs rear tires. Small dent on bumper.", youtube: "https://youtu.be/example", lastSynced: new Date().toISOString() },
                { id: '2', vin: "1F45678901", name: "2011 Ford F-150 XLT", price: "8500", miles: "190000", comments: "Rust on wheel wells. Runs strong. AC blows cold.", youtube: "", lastSynced: new Date().toISOString() }
            ]);
            setLeads([
                { id: '1', name: "Alex Rover", status: 'phase_2_interest', lastMessage: "How much is the Malibu?", source: "Rex (Bot)", hwVideo: false, hwDescription: true, hwIssues: false, createdAt: { seconds: Date.now() / 1000 }, updatedAt: { seconds: Date.now() / 1000 } }
            ]);
            setKnowledge([
                { id: '1', content: "Always be transparent about dents.", createdAt: new Date().toISOString() }
            ]);
            return;
        }

        // Real Firebase Auth
        auth.signInAnonymously()
            .catch((err) => {
                console.warn("Firebase Auth failed (likely missing config). Falling back to Demo Mode.", err);
                setDemoMode(true);
            });

        return auth.onAuthStateChanged((u) => {
            if (u) setUser(u);
        });
    }, [demoMode]);

    useEffect(() => {
        if (!user || demoMode) return;

        // Paths
        const invRef = collection(db, 'artifacts', appId, 'public', 'data', 'inventory');
        const knowRef = collection(db, 'artifacts', appId, 'public', 'data', 'knowledge');
        const leadsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'leads');
        const intRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'integrations');

        // Subscriptions
        const unsubInv = onSnapshot(invRef, (snap) => setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubKnow = onSnapshot(knowRef, (snap) => setKnowledge(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubLeads = onSnapshot(leadsRef, (snap) => setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubInt = onSnapshot(intRef, (snap) => snap.exists() && setIntegrations(snap.data()));

        return () => { unsubInv(); unsubKnow(); unsubLeads(); unsubInt(); };
    }, [user, demoMode]);

    // Inventory Sync
    const handleInventorySync = async () => {
        setIsSyncing(true);
        let itemsToSync = [];

        try {
            // 1. Try to fetch from real URL
            const response = await fetch('https://highlifeauto.com/frazer-inventory-updated.csv');
            if (!response.ok) throw new Error("Failed to fetch CSV");
            const text = await response.text();
            itemsToSync = parseCSV(text);
            console.log("Parsed CSV Items:", itemsToSync.length);
        } catch (err) {
            console.warn("CSV Sync failed (likely CORS), falling back to mock update for demo.", err);
            // Fallback Mock Data
            itemsToSync = [
                { id: '1', vin: "1G1JC12345", name: "2015 Chevrolet Malibu LT", price: "5900", miles: "125000", comments: "Clean title. Needs rear tires. Small dent on bumper.", youtube: "https://youtu.be/example", lastSynced: new Date().toISOString() },
                { id: '2', vin: "1F45678901", name: "2011 Ford F-150 XLT", price: "8500", miles: "190000", comments: "Rust on wheel wells. Runs strong. AC blows cold.", youtube: "", lastSynced: new Date().toISOString() }
            ];
        }

        if (!demoMode) {
            // Upsert to Firestore
            for (const item of itemsToSync) {
                // Simple dedupe by VIN or ID
                const existing = inventory.find(i => i.vin === item.vin);
                if (existing) {
                    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory', existing.id), { ...item, lastSynced: new Date().toISOString() });
                } else {
                    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'inventory'), { ...item, lastSynced: new Date().toISOString() });
                }
            }
        } else {
            // Local update for demo (simulate sync delay)
            await new Promise(r => setTimeout(r, 1000));
            setInventory(itemsToSync);
        }
        setTimeout(() => setIsSyncing(false), 500);
    };

    const handleAddLead = (lead) => {
        if (demoMode) {
            setLeads(prev => [lead, ...prev]);
        }
    };

    const handleUpdateLead = (leadId, updates) => {
        if (demoMode) {
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates, updatedAt: { seconds: Date.now() / 1000 } } : l));
        }
    };

    const handleAdminAuth = () => {
        const password = prompt("Enter Master Password:");
        if (password === "Highlife8191!") {
            setView('admin');
        } else {
            alert("Access Denied");
        }
    };

    if (!user) return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-950 text-white font-black italic tracking-tighter">
            <Car className="animate-bounce mr-2" />
            INITIALIZING HIGH LIFE...
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* GLOBAL HEADER */}
            <header className="bg-white border-b px-6 py-3 flex justify-between items-center z-20 shadow-sm shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="bg-orange-600 p-2 rounded-lg text-white shadow-lg rotate-3" onClick={handleAdminAuth}>
                        <Car size={22} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none">High Life <span className="text-orange-600">Auto</span></h1>
                        <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">Inventory Intelligence {demoMode && "(DEMO MODE)"}</span>
                    </div>
                </div>

                {/* View Switcher Controls */}
                <div className="flex gap-2">
                    {view === 'admin' ? (
                        <button
                            onClick={() => setView('visitor')}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wide hover:bg-gray-200"
                        >
                            Exit CRM
                        </button>
                    ) : (
                        <button
                            onClick={handleAdminAuth}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-400 transition-colors text-[10px] font-bold uppercase tracking-wide"
                            title="Staff Login"
                        >
                            <Lock size={12} /> Staff Login
                        </button>
                    )}
                </div>
            </header>

            {/* VIEWPORT */}
            <main className="flex-1 relative overflow-hidden">
                {view === 'admin' ? (
                    <AdminDashboard
                        user={user}
                        leads={leads}
                        inventory={inventory}
                        knowledge={knowledge}
                        integrations={integrations}
                        onSync={handleInventorySync}
                        isSyncing={isSyncing}
                        demoMode={demoMode}
                        onAddLead={handleAddLead}
                        onUpdateLead={handleUpdateLead}
                    />
                ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
                        {/* Mock Website Content */}
                        <div className="max-w-5xl w-full text-center space-y-8 opacity-40 select-none pointer-events-none grayscale">
                            <h2 className="text-8xl font-black italic text-gray-300">YOUR WEBSITE</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="h-64 bg-gray-200 rounded-3xl"></div>
                                <div className="h-64 bg-gray-200 rounded-3xl"></div>
                                <div className="h-64 bg-gray-200 rounded-3xl"></div>
                            </div>
                        </div>

                        {/* THE BOT */}
                        <ChatWidget
                            userId={user.uid}
                            inventory={inventory}
                            knowledge={knowledge}
                            integrations={integrations}
                            demoMode={demoMode}
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChatBotApp;
