import React, { useState, useEffect } from 'react';
import { 
  Car, 
  ExternalLink,
  Bot
} from 'lucide-react';
import firebase from 'firebase/compat/app';
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db, appId, isFirebaseConfigured } from './services/firebase';
import { AdminDashboard } from './components/AdminDashboard';
import { ChatWidget } from './components/ChatWidget';
import { InventoryItem, KnowledgeItem, Lead } from './types';

// Simple CSV Parser
const parseCSV = (text: string): InventoryItem[] => {
  const lines = text.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  return lines.slice(1).map((line, idx) => {
    // Handle quotes in CSV if simple split fails, but for this simpler implementation:
    const values = line.split(','); 
    // Basic mapping based on expected Frazer CSV structure or generic
    // Adjust indices based on actual CSV format. 
    // Assuming a standard format or trying to find key columns.
    // Ideally we map headers to our types.
    
    // Safety fallback for mapping
    const getVal = (includes: string) => {
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

const App = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [view, setView] = useState<'visitor' | 'admin'>('visitor'); 
  const [leads, setLeads] = useState<Lead[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [integrations, setIntegrations] = useState({ sheetUrl: '' });
  const [demoMode, setDemoMode] = useState(!isFirebaseConfigured);

  // Auth & Data Subscription
  useEffect(() => {
    if (demoMode) {
      // Setup Mock Data for Demo Mode
      setUser({ uid: 'demo-user', isAnonymous: true } as firebase.User);
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
    const unsubInv = onSnapshot(invRef, (snap) => setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))));
    const unsubKnow = onSnapshot(knowRef, (snap) => setKnowledge(snap.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgeItem))));
    const unsubLeads = onSnapshot(leadsRef, (snap) => setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead))));
    const unsubInt = onSnapshot(intRef, (snap) => snap.exists() && setIntegrations(snap.data() as any));

    return () => { unsubInv(); unsubKnow(); unsubLeads(); unsubInt(); };
  }, [user, demoMode]);

  // Inventory Sync
  const handleInventorySync = async () => {
    setIsSyncing(true);
    let itemsToSync: InventoryItem[] = [];

    try {
      // 1. Try to fetch from real URL
      // Note: This might block due to CORS in a browser environment unless the server allows it.
      // If it fails, we fall back to mock data or manual entry logic.
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
        // Note: Real world would use batch writes
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

  const handleAddLead = (lead: Lead) => {
    if (demoMode) {
      setLeads(prev => [lead, ...prev]);
    }
  };

  const handleUpdateLead = (leadId: string, updates: Partial<Lead>) => {
    if (demoMode) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates, updatedAt: { seconds: Date.now() / 1000 } } : l));
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
          <div className="bg-orange-600 p-2 rounded-lg text-white shadow-lg rotate-3">
            <Car size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none">High Life <span className="text-orange-600">Auto</span></h1>
            <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">Inventory Intelligence {demoMode && "(DEMO MODE)"}</span>
          </div>
        </div>
        
        {/* View Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-full border">
          <button 
            onClick={() => setView('visitor')} 
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${view === 'visitor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-800'}`}
          >
            <Bot size={14} /> Visitor View
          </button>
          <button 
            onClick={() => setView('admin')} 
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${view === 'admin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-800'}`}
          >
            <ExternalLink size={14} /> Admin CRM
          </button>
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

export default App;