
import React, { useState, useMemo } from 'react';
import {
    ShieldAlert,
    RefreshCw,
    Plus,
    CheckCircle2,
    MessageCircle,
    Car,
    Clock,
    TrendingUp,
    User,
    Search,
    ArrowUpDown,
    Hash
} from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

// --- CONSTANTS ---
const PIPELINE_STAGES = [
    { id: 'phase_1_contact', title: '1. Contact', color: 'bg-gray-100 text-gray-600', heat: 1 },
    { id: 'phase_2_interest', title: '2. Interest', color: 'bg-blue-50 text-blue-600', heat: 2 },
    { id: 'phase_3_needs', title: '3. Needs', color: 'bg-indigo-50 text-indigo-600', heat: 3 },
    { id: 'phase_4_budget', title: '4. Budget', color: 'bg-purple-50 text-purple-600', heat: 4 },
    { id: 'phase_5_timeline', title: '5. Timeline', color: 'bg-yellow-50 text-yellow-600', heat: 5 },
    { id: 'phase_6_video', title: '6. Video/Issues', color: 'bg-orange-50 text-orange-600', heat: 6 },
    { id: 'phase_7_ready', title: '7. HOT - Ready', color: 'bg-red-600 text-white animate-pulse', heat: 7 },
    { id: 'sold', title: 'SOLD', color: 'bg-green-600 text-white', heat: 0 },
    { id: 'lost', title: 'LOST', color: 'bg-gray-400 text-white', heat: -1 },
];

// --- SALES PIPELINE TABLE ---
const SalesPipelineTable = ({ leads, onUpdateLead, userId, demoMode }) => {
    const [updatingId, setUpdatingId] = useState(null);
    const [sortField, setSortField] = useState('status');
    const [sortOrder, setSortOrder] = useState('desc');

    const sortedLeads = useMemo(() => {
        const sorted = [...leads];
        sorted.sort((a, b) => {
            if (sortField === 'status') {
                const heatA = PIPELINE_STAGES.find(s => s.id === a.status)?.heat || 0;
                const heatB = PIPELINE_STAGES.find(s => s.id === b.status)?.heat || 0;
                return sortOrder === 'asc' ? heatA - heatB : heatB - heatA;
            }
            return 0;
        });
        return sorted;
    }, [leads, sortField, sortOrder]);

    const handleStatusChange = async (leadId, newStatus) => {
        setUpdatingId(leadId);
        if (demoMode) {
            onUpdateLead(leadId, { status: newStatus });
        } else {
            const leadRef = doc(db, 'artifacts', appId, 'users', userId, 'leads', leadId);
            await updateDoc(leadRef, { status: newStatus, updatedAt: new Date() });
        }
        setUpdatingId(null);
    };

    return (
        <div className="w-full bg-white rounded-[1.5rem] border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/5">
                                <div className="flex items-center gap-2"><Hash size={12} /> UID</div>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/5">
                                <div className="flex items-center gap-2"><User size={12} /> Customer</div>
                            </th>
                            <th
                                className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/5 cursor-pointer hover:bg-slate-800 transition-colors"
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            >
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={12} /> Status
                                    <ArrowUpDown size={10} className="opacity-50" />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-white/5">
                                <div className="flex items-center gap-2"><MessageCircle size={12} /> Qualifying Notes</div>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedLeads.map((lead) => {
                            const stage = PIPELINE_STAGES.find(s => s.id === lead.status) || PIPELINE_STAGES[0];
                            const shortId = lead.id.slice(0, 6).toUpperCase();

                            return (
                                <tr key={lead.id} className={`hover:bg-slate-50 transition-colors ${updatingId === lead.id ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold">#{shortId}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-black italic uppercase text-slate-900">{lead.name}</div>
                                        <div className="text-[9px] font-bold text-slate-400 mt-0.5">{lead.contactInfo || 'No Contact Info'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={lead.status}
                                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                            className={`w-full border-none rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter cursor-pointer focus:ring-2 focus:ring-orange-500 outline-none ${stage.color}`}
                                        >
                                            {PIPELINE_STAGES.map(s => (
                                                <option key={s.id} value={s.id} className="bg-white text-slate-900">{s.title}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <div className="text-[10px] font-medium text-slate-600 line-clamp-2 italic">
                                            {lead.lastMessage ? `"${lead.lastMessage}"` : 'Awaiting qualifying details...'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                                            <MessageCircle size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {leads.length === 0 && (
                <div className="p-20 text-center">
                    <Search className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No leads in the pipe</p>
                </div>
            )}
        </div>
    );
};

// --- CHAT LOGS ---
const ChatLogs = ({ leads }) => (
    <div className="max-w-4xl mx-auto space-y-4">
        <h2 className="text-3xl font-black italic uppercase mb-8">Lead Conversations</h2>
        {leads.map((lead) => (
            <div key={lead.id} className="bg-white p-6 rounded-[1.5rem] border flex items-center justify-between hover:border-orange-500 transition-all cursor-pointer group shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black italic text-orange-500 text-xl group-hover:scale-110 transition-transform shadow-md">
                        {lead.name[0]}
                    </div>
                    <div>
                        <h4 className="font-black uppercase italic">{lead.name}</h4>
                        <p className="text-xs text-gray-500 font-medium">{lead.lastMessage || 'Waiting for first response...'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${PIPELINE_STAGES.find(s => s.id === lead.status)?.color}`}>
                        {PIPELINE_STAGES.find(s => s.id === lead.status)?.title}
                    </div>
                    <button className="bg-slate-50 p-3 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                        <MessageCircle size={20} />
                    </button>
                </div>
            </div>
        ))}
    </div>
);

// --- KNOWLEDGE MANAGER ---
const KnowledgeManager = ({ knowledge }) => (
    <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black italic uppercase">Sales Rules & Knowledge</h2>
            <button className="bg-slate-950 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">
                <Plus size={14} /> Add Rule
            </button>
        </div>
        <div className="grid gap-4">
            {knowledge.map((k) => (
                <div key={k.id} className="bg-white p-6 rounded-3xl border border-l-4 border-l-orange-500 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-sm font-bold text-gray-800 leading-relaxed italic">"{k.content}"</p>
                        <div className="mt-2 flex items-center gap-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <Clock size={10} /> Added {new Date(k.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <ShieldAlert className="text-orange-100" size={32} />
                </div>
            ))}
        </div>
    </div>
);

export const AdminDashboard = ({ user, leads, inventory, knowledge, onSync, isSyncing, demoMode, onUpdateLead }) => {
    const [activeTab, setActiveTab] = useState('pipeline');

    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all mb-2 ${activeTab === id ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
        >
            <Icon size={18} />
            <span className="font-bold text-[10px] uppercase tracking-widest">{label}</span>
        </button>
    );

    return (
        <div className="flex w-full h-full overflow-hidden bg-slate-50">
            <aside className="w-64 bg-gray-950 text-white p-4 flex flex-col shrink-0 border-r border-white/5">
                <div className="mb-8 px-4 pt-4">
                    <div className="flex items-center gap-2 text-white/90">
                        <Car size={24} className="text-orange-500" />
                        <span className="font-black italic text-xl tracking-tighter">HIGH LIFE</span>
                    </div>
                </div>

                <nav className="flex-1">
                    <TabButton id="pipeline" icon={CheckCircle2} label="Sales Pipeline" />
                    <TabButton id="chats" icon={MessageCircle} label="Full Logs" />
                    <TabButton id="knowledge" icon={ShieldAlert} label="Dealer Rules" />
                </nav>

                <div className="mt-auto pt-6 border-t border-white/10 space-y-3">
                    <div className="p-4 bg-white/5 rounded-2xl mb-4">
                        <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-1">Stock Level</p>
                        <p className="text-xs font-bold text-white flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            {inventory.length} Cars Available
                        </p>
                    </div>
                    <button onClick={onSync} disabled={isSyncing} className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl text-[10px] font-black uppercase transition-all border border-white/5">
                        <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Frazer CSV'}</span>
                    </button>
                </div>
            </aside>

            <section className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto p-8">
                    {activeTab === 'pipeline' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">The Pipeline</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage leads, track hot buyers, and update status</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-gray-400">Total Leads</p>
                                        <p className="text-3xl font-black italic leading-none">{leads.length}</p>
                                    </div>
                                    <div className="text-right border-l pl-6 border-slate-200">
                                        <p className="text-[10px] font-black uppercase text-red-500">Hot Leads</p>
                                        <p className="text-3xl font-black italic leading-none text-red-600">
                                            {leads.filter((l) => l.status === 'phase_7_ready').length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <SalesPipelineTable
                                leads={leads}
                                onUpdateLead={onUpdateLead}
                                userId={user.uid}
                                demoMode={demoMode}
                            />
                        </div>
                    )}
                    {activeTab === 'chats' && <ChatLogs leads={leads} />}
                    {activeTab === 'knowledge' && <KnowledgeManager knowledge={knowledge} />}
                </div>
            </section>
        </div>
    );
};
