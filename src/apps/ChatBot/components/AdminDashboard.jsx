import React, { useState, useEffect } from 'react';
import {
    Users,
    ShieldAlert,
    Link as LinkIcon,
    RefreshCw,
    Plus,
    Video,
    FileText,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    X,
    MessageCircle,
    Car,
    Save,
    Edit2,
    Phone,
    StickyNote,
    Flame,
    Thermometer,
    Trophy,
    Ghost,
    DollarSign,
    Clock,
    ArrowRight
} from 'lucide-react';
import { collection, updateDoc, doc, addDoc, deleteDoc, serverTimestamp, setDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

// --- CONSTANTS ---
const PIPELINE_STAGES = [
    { id: 'phase_1_contact', title: '1. Contact Info', color: 'bg-gray-100 text-gray-600', heat: 10, heatColor: 'bg-blue-200' },
    { id: 'phase_2_interest', title: '2. Interest', color: 'bg-blue-50 text-blue-600', heat: 25, heatColor: 'bg-cyan-300' },
    { id: 'phase_3_needs', title: '3. Needs/Wants', color: 'bg-indigo-50 text-indigo-600', heat: 40, heatColor: 'bg-green-400' },
    { id: 'phase_4_budget', title: '4. Budget', color: 'bg-purple-50 text-purple-600', heat: 55, heatColor: 'bg-yellow-400' },
    { id: 'phase_5_timeline', title: '5. Timeline', color: 'bg-yellow-50 text-yellow-600', heat: 70, heatColor: 'bg-orange-400' },
    { id: 'phase_6_video', title: '6. Video/Issues', color: 'bg-orange-50 text-orange-600', heat: 85, heatColor: 'bg-orange-600' },
    { id: 'phase_7_ready', title: '7. Ready Today', color: 'bg-red-50 text-red-600', heat: 100, heatColor: 'bg-red-600 animate-pulse' },
    { id: 'sold', title: 'SOLD', color: 'bg-green-100 text-green-700', heat: 100, heatColor: 'bg-green-600' },
    { id: 'lost', title: 'LOST', color: 'bg-gray-200 text-gray-400', heat: 0, heatColor: 'bg-gray-300' },
];

const getHeatAttributes = (status) => {
    const stage = PIPELINE_STAGES.find(s => s.id === status);
    return stage || { heat: 0, heatColor: 'bg-gray-200' };
};

// --- STAGE REQUIREMENT MODAL ---
const StageRequirementModal = ({ stageId, lead, onClose, onConfirm }) => {
    const [data, setData] = useState({
        name: lead.name,
        contactInfo: lead.contactInfo,
        vehicleInterest: lead.vehicleInterest,
        notes: lead.notes,
        budget: lead.budget,
        timeline: lead.timeline,
        hwVideo: lead.hwVideo,
        hwIssues: lead.hwIssues
    });

    const stage = PIPELINE_STAGES.find(s => s.id === stageId);

    const handleSave = () => {
        // Validation Logic
        if (stageId === 'phase_1_contact' && (!data.name || !data.contactInfo)) {
            alert("Name and Contact Info are required to move to Phase 1."); return;
        }
        if (stageId === 'phase_2_interest' && !data.vehicleInterest) {
            alert("You must enter a Vehicle of Interest."); return;
        }
        if (stageId === 'phase_3_needs' && !data.notes) {
            alert("Please enter Needs/Wants in the notes."); return;
        }
        if (stageId === 'phase_4_budget' && !data.budget) {
            alert("Budget information is required."); return;
        }
        if (stageId === 'phase_5_timeline' && !data.timeline) {
            alert("Timeline information is required."); return;
        }

        onConfirm(data);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-fade-in-up overflow-hidden">
                {/* Header */}
                <div className={`p-8 ${stage?.color || 'bg-gray-100'}`}>
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-50 mb-1">Moving to</h3>
                    <h2 className="text-3xl font-black uppercase italic leading-none">{stage?.title}</h2>
                </div>

                {/* Form Body */}
                <div className="p-8 space-y-6">
                    <p className="text-sm text-gray-500 font-medium">Please update the following information to proceed.</p>

                    {/* DYNAMIC FIELDS BASED ON STAGE */}
                    {stageId === 'phase_1_contact' && (
                        <>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Customer Name</label>
                                <input value={data.name || ''} onChange={e => setData({ ...data, name: e.target.value })} className="w-full bg-slate-50 border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Contact Info</label>
                                <input value={data.contactInfo || ''} onChange={e => setData({ ...data, contactInfo: e.target.value })} className="w-full bg-slate-50 border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" placeholder="Phone or Email" />
                            </div>
                        </>
                    )}

                    {stageId === 'phase_2_interest' && (
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Vehicle of Interest</label>
                            <input
                                autoFocus
                                value={data.vehicleInterest || ''}
                                onChange={e => setData({ ...data, vehicleInterest: e.target.value })}
                                className="w-full bg-slate-50 border p-4 rounded-xl font-black text-lg outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="e.g. 2015 Chevy Malibu"
                            />
                        </div>
                    )}

                    {stageId === 'phase_3_needs' && (
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Needs & Wants Notes</label>
                            <textarea
                                autoFocus
                                value={data.notes || ''}
                                onChange={e => setData({ ...data, notes: e.target.value })}
                                className="w-full h-32 bg-slate-50 border p-4 rounded-xl font-medium outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="What do they need in a car? (e.g. Good MPG, 3rd Row)"
                            />
                        </div>
                    )}

                    {stageId === 'phase_4_budget' && (
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Budget</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-4 top-4 text-gray-400" />
                                <input
                                    autoFocus
                                    value={data.budget || ''}
                                    onChange={e => setData({ ...data, budget: e.target.value })}
                                    className="w-full bg-slate-50 border p-4 pl-10 rounded-xl font-black text-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="e.g. 5000 Cash"
                                />
                            </div>
                        </div>
                    )}

                    {stageId === 'phase_5_timeline' && (
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Timeline</label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-4 top-4 text-gray-400" />
                                <input
                                    autoFocus
                                    value={data.timeline || ''}
                                    onChange={e => setData({ ...data, timeline: e.target.value })}
                                    className="w-full bg-slate-50 border p-4 pl-10 rounded-xl font-black text-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="e.g. This week"
                                />
                            </div>
                        </div>
                    )}

                    {stageId === 'phase_6_video' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border">
                                <input
                                    type="checkbox"
                                    checked={data.hwVideo || false}
                                    onChange={e => setData({ ...data, hwVideo: e.target.checked })}
                                    className="w-6 h-6 rounded text-orange-600 focus:ring-orange-500"
                                />
                                <span className="font-bold text-gray-700">Customer watched video?</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border">
                                <input
                                    type="checkbox"
                                    checked={data.hwIssues || false}
                                    onChange={e => setData({ ...data, hwIssues: e.target.checked })}
                                    className="w-6 h-6 rounded text-orange-600 focus:ring-orange-500"
                                />
                                <span className="font-bold text-gray-700">Customer aware of known issues?</span>
                            </div>
                        </div>
                    )}

                    {(stageId === 'phase_7_ready' || stageId === 'sold') && (
                        <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-center">
                            <CheckCircle2 size={40} className="mx-auto text-green-600 mb-2" />
                            <p className="font-bold text-green-800">Confirm {stageId === 'sold' ? 'Sale' : 'Readiness'}</p>
                            <p className="text-xs text-green-600 mt-1">This will update the pipeline status.</p>
                        </div>
                    )}

                    {stageId === 'lost' && (
                        <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 text-center">
                            <Ghost size={40} className="mx-auto text-gray-400 mb-2" />
                            <p className="font-bold text-gray-600">Mark as Lost?</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-8">
                        <button onClick={onClose} className="px-6 py-3 font-bold text-xs text-gray-400 hover:text-gray-900 uppercase tracking-widest">Cancel</button>
                        <button onClick={handleSave} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 transition-colors shadow-lg flex items-center gap-2">
                            Save & Move <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MANUAL LEAD FORM (ADD) ---
const ManualLeadForm = ({ userId, onClose, demoMode, onAdd }) => {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [note, setNote] = useState('');

    const handleSubmit = async () => {
        if (!name) return;

        const id = crypto.randomUUID();
        const leadData = {
            id,
            name,
            contactInfo: contact,
            notes: note,
            status: 'phase_1_contact', // Default to Phase 1
            lastMessage: `Manual Entry.`,
            source: 'Manual Entry',
            hwVideo: false,
            hwDescription: false,
            hwIssues: false,
            createdAt: { seconds: Date.now() / 1000 },
            updatedAt: { seconds: Date.now() / 1000 }
        };

        if (demoMode) {
            onAdd(leadData);
        } else {
            await setDoc(doc(db, 'artifacts', appId, 'users', userId, 'leads', id), {
                ...leadData,
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            });
            // Also create a chat placeholder so it doesn't crash if viewed
            const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats', id, 'messages');
            await addDoc(chatRef, { role: 'model', text: 'Lead manually added to system.', createdAt: serverTimestamp() });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black uppercase italic text-gray-900">Add New Lead</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Customer Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. John Doe" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Contact Info</label>
                        <input value={contact} onChange={e => setContact(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" placeholder="Phone or Email" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Initial Notes</label>
                        <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-medium outline-none focus:ring-2 focus:ring-orange-500 h-24" placeholder="What are they looking for?" />
                    </div>
                    <button onClick={handleSubmit} disabled={!name} className="w-full bg-gray-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-600 transition-colors disabled:opacity-50">
                        Save to Pipeline
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- EDIT LEAD FORM ---
const EditLeadForm = ({ userId, lead, onClose, demoMode, onUpdate }) => {
    const [name, setName] = useState(lead.name);
    const [contact, setContact] = useState(lead.contactInfo || '');
    const [note, setNote] = useState(lead.notes || '');
    const [vehicle, setVehicle] = useState(lead.vehicleInterest || '');
    const [budget, setBudget] = useState(lead.budget || '');
    const [timeline, setTimeline] = useState(lead.timeline || '');

    const handleSave = async () => {
        const updates = {
            name,
            contactInfo: contact,
            notes: note,
            vehicleInterest: vehicle,
            budget,
            timeline,
            updatedAt: demoMode ? { seconds: Date.now() / 1000 } : serverTimestamp()
        };

        if (demoMode) {
            onUpdate(lead.id, updates);
        } else {
            await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'leads', lead.id), updates);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black uppercase italic text-gray-900">Edit Lead</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Customer Name</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Contact Info</label>
                            <input value={contact} onChange={e => setContact(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Vehicle Interest</label>
                            <input value={vehicle} onChange={e => setVehicle(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Budget</label>
                            <input value={budget} onChange={e => setBudget(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Timeline</label>
                            <input value={timeline} onChange={e => setTimeline(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Notes</label>
                            <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full bg-slate-50 border p-3 rounded-xl font-medium outline-none focus:ring-2 focus:ring-orange-500 h-24" />
                        </div>
                    </div>
                </div>
                <button onClick={handleSave} className="w-full mt-6 bg-gray-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-600 transition-colors">
                    Update Lead
                </button>
            </div>
        </div>
    );
};

// --- PIPELINE COMPONENT ---
const SalesPipeline = ({ leads, userId, onSelectLead, demoMode, onAddLead, onUpdateLead }) => {
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [stageModal, setStageModal] = useState(null);

    const handleStageClick = (lead, stageId) => {
        // Open modal to confirm or add data
        setStageModal({ lead, stageId });
    };

    const handleStageConfirm = async (updates) => {
        if (!stageModal) return;
        const { lead, stageId } = stageModal;

        const finalUpdates = {
            ...updates,
            status: stageId,
            updatedAt: demoMode ? { seconds: Date.now() / 1000 } : serverTimestamp()
        };

        if (demoMode) {
            onUpdateLead(lead.id, finalUpdates);
        } else {
            await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'leads', lead.id), finalUpdates);
        }
        setStageModal(null);
    };

    // Sort leads: Status Heat Order (High to Low) -> Recency
    const sortedLeads = [...leads].sort((a, b) => {
        const heatA = getHeatAttributes(a.status).heat;
        const heatB = getHeatAttributes(b.status).heat;

        // Sort sold/lost to the bottom visually even if high heat (logic choice: keep active leads top)
        const isSoldLostA = a.status === 'sold' || a.status === 'lost';
        const isSoldLostB = b.status === 'sold' || b.status === 'lost';

        if (isSoldLostA && !isSoldLostB) return 1;
        if (!isSoldLostA && isSoldLostB) return -1;

        // Primary Sort: Heat (Descending) for active leads
        if (heatA !== heatB) return heatB - heatA;

        // Secondary Sort: Recency
        const dateA = a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : Date.now();
        const dateB = b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : Date.now();
        return dateB - dateA;
    });

    return (
        <>
            <div className="flex flex-col h-full bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
                {/* HEADER */}
                <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic leading-none">The Pipeline</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Active Leads: {leads.filter(l => l.status !== 'sold' && l.status !== 'lost').length}</p>
                    </div>
                    <button onClick={() => setShowManualAdd(true)} className="flex items-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg">
                        <Plus size={14} /> Add Lead
                    </button>
                </div>

                {/* TABLE VIEW */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/80 backdrop-blur w-24 text-center">Heat</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/80 backdrop-blur min-w-[300px]">Phase Road</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/80 backdrop-blur">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/80 backdrop-blur">Contact / Notes</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/80 backdrop-blur">Last Activity</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/80 backdrop-blur text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedLeads.map(lead => {
                                const { heat, heatColor } = getHeatAttributes(lead.status);
                                const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === lead.status);
                                const isSold = lead.status === 'sold';
                                const isLost = lead.status === 'lost';

                                return (
                                    <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors group">

                                        {/* HEAT INDICATOR */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {heat > 80 && lead.status !== 'sold' ? (
                                                    <Flame size={16} className="text-red-500 animate-pulse" fill="currentColor" />
                                                ) : (
                                                    <Thermometer size={16} className={`${heat < 30 ? 'text-blue-300' : heat < 60 ? 'text-yellow-400' : 'text-orange-500'}`} />
                                                )}
                                                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className={`h-full ${heatColor}`} style={{ width: `${heat}%` }}></div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* PHASE ROAD (CHECKABLE BOXES) */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                {/* The Road */}
                                                <div className="flex items-center gap-1">
                                                    {PIPELINE_STAGES.slice(0, 7).map((stage, idx) => {
                                                        const isFilled = isSold ? true : (isLost ? false : currentStageIndex >= idx);

                                                        return (
                                                            <button
                                                                key={stage.id}
                                                                onClick={() => handleStageClick(lead, stage.id)}
                                                                className={`h-8 w-8 rounded-md border flex items-center justify-center transition-all shadow-sm ${isFilled
                                                                    ? `${getHeatAttributes(stage.id).heatColor} border-transparent text-white scale-100`
                                                                    : 'bg-white border-gray-200 text-gray-300 hover:border-gray-400 hover:text-gray-500 hover:scale-105'
                                                                    }`}
                                                                title={stage.title}
                                                            >
                                                                <span className="text-[10px] font-black">{idx + 1}</span>
                                                            </button>
                                                        )
                                                    })}

                                                    {/* Separator */}
                                                    <div className="w-px h-6 bg-gray-200 mx-2"></div>

                                                    {/* Sold Toggle */}
                                                    <button
                                                        onClick={() => handleStageClick(lead, isSold ? 'phase_7_ready' : 'sold')}
                                                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-sm ${isSold ? 'bg-green-500 text-white ring-2 ring-green-200' : 'bg-white border border-gray-200 text-gray-300 hover:text-green-500 hover:border-green-500'
                                                            }`}
                                                        title="Mark Sold"
                                                    >
                                                        <Trophy size={14} fill={isSold ? "currentColor" : "none"} />
                                                    </button>

                                                    {/* Lost Toggle */}
                                                    <button
                                                        onClick={() => handleStageClick(lead, isLost ? 'phase_1_contact' : 'lost')}
                                                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-sm ${isLost ? 'bg-gray-800 text-white ring-2 ring-gray-200' : 'bg-white border border-gray-200 text-gray-300 hover:text-red-500 hover:border-red-500'
                                                            }`}
                                                        title="Mark Lost"
                                                    >
                                                        <Ghost size={14} />
                                                    </button>
                                                </div>

                                                {/* Phase Label */}
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                                                    {PIPELINE_STAGES.find(s => s.id === lead.status)?.title || 'Unknown Status'}
                                                </div>
                                            </div>

                                            {/* Indicators */}
                                            <div className="flex mt-2 gap-2 pl-1 opacity-50">
                                                {lead.hwVideo && <Video size={10} className="text-blue-600" title="Watched Video" />}
                                                {lead.hwIssues && <AlertCircle size={10} className="text-red-600" title="Aware of Issues" />}
                                            </div>
                                        </td>

                                        {/* CUSTOMER INFO */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-sm text-gray-900">{lead.name || 'Unknown'}</span>
                                                <span className="text-[10px] text-gray-300">{lead.source === 'Rex (Bot)' ? '🤖' : '👤'}</span>
                                            </div>
                                            <div className="text-[9px] font-mono text-gray-400 mt-1 flex items-center gap-1">
                                                ID: {lead.id.substring(0, 8)}...
                                            </div>
                                            {lead.vehicleInterest && (
                                                <div className="mt-1 bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-1 rounded inline-block">
                                                    🚗 {lead.vehicleInterest}
                                                </div>
                                            )}
                                        </td>

                                        {/* CONTACT & NOTES */}
                                        <td className="px-6 py-4 max-w-xs">
                                            {lead.contactInfo ? (
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700 mb-1">
                                                    <Phone size={10} className="text-gray-400" />
                                                    {lead.contactInfo}
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-gray-300 italic mb-1">No contact info</div>
                                            )}

                                            {/* Important CRM Fields */}
                                            <div className="flex flex-wrap gap-1 mb-1">
                                                {lead.budget && (
                                                    <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                                        ${lead.budget}
                                                    </span>
                                                )}
                                                {lead.timeline && (
                                                    <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                                                        🕒 {lead.timeline}
                                                    </span>
                                                )}
                                            </div>

                                            {lead.notes && (
                                                <div className="text-[10px] text-gray-500 italic bg-yellow-50 p-1.5 rounded border border-yellow-100 line-clamp-2">
                                                    <StickyNote size={8} className="inline mr-1 text-yellow-500" />
                                                    {lead.notes}
                                                </div>
                                            )}
                                        </td>

                                        {/* LAST ACTIVITY */}
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] font-medium text-gray-500 italic line-clamp-1 mb-1">
                                                "{lead.lastMessage}"
                                            </div>
                                            <div className="text-[9px] font-bold text-gray-300">
                                                {lead.updatedAt?.seconds ? new Date(lead.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditingLead(lead)}
                                                    className="p-2 bg-white border rounded-lg text-gray-500 hover:text-orange-600 hover:border-orange-200 transition-colors shadow-sm"
                                                    title="Edit Lead"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onSelectLead(lead)}
                                                    className="p-2 bg-gray-900 rounded-lg text-white hover:bg-orange-600 transition-colors shadow-sm"
                                                    title="View Chat"
                                                >
                                                    <MessageCircle size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {leads.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                        No leads in the pipeline. Start chatting or add one manually!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showManualAdd && <ManualLeadForm userId={userId} onClose={() => setShowManualAdd(false)} demoMode={demoMode} onAdd={onAddLead} />}
            {editingLead && <EditLeadForm userId={userId} lead={editingLead} onClose={() => setEditingLead(null)} demoMode={demoMode} onUpdate={onUpdateLead} />}

            {/* STAGE GATEKEEPER MODAL */}
            {stageModal && (
                <StageRequirementModal
                    stageId={stageModal.stageId}
                    lead={stageModal.lead}
                    onClose={() => setStageModal(null)}
                    onConfirm={handleStageConfirm}
                />
            )}
        </>
    );
};

const TranscriptViewer = ({ lead, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            // In a real app, demo mode would just use mock data
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'chats', lead.id, 'messages'), orderBy('createdAt', 'asc'));
            const snapshot = await getDocs(q);
            const msgs = snapshot.docs.map(d => d.data());
            setMessages(msgs);
            setLoading(false);
        };
        fetchHistory();
    }, [lead.id]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="bg-gray-100 p-6 flex justify-between items-center border-b">
                    <div>
                        <h3 className="text-xl font-black uppercase italic text-gray-900">{lead.name || 'Chat Session'}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {lead.id}</p>
                    </div>
                    <button onClick={onClose} className="bg-white p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400 gap-2">
                            <RefreshCw className="animate-spin" /> Loading Transcript...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-400 italic">No messages found.</div>
                    ) : (
                        messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                                    }`}>
                                    {m.role === 'model' && <div className="text-[9px] font-black uppercase text-gray-300 mb-1">Rex</div>}
                                    {m.text}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const ChatLogs = ({ leads, onSelectLead }) => (
    <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic mb-8 leading-none">Chat History</h2>
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Session ID / Name</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Message</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Phase</th>
                        <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {leads.map(lead => (
                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-6">
                                <div className="font-black text-gray-900 uppercase italic tracking-tighter text-lg leading-none mb-1">{lead.name || 'Web Guest'}</div>
                                <div className="text-[9px] text-gray-400 font-mono tracking-wide">{lead.id.substring(0, 8)}...</div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="text-xs font-medium text-gray-500 italic max-w-sm truncate">"{lead.lastMessage}"</div>
                            </td>
                            <td className="px-8 py-6">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-500`}>
                                    {lead.status.replace(/_/g, ' ').replace('phase ', 'P')}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <button
                                    onClick={() => onSelectLead(lead)}
                                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-orange-600 transition-colors shadow-lg"
                                >
                                    View Chat
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const KnowledgeManager = ({ knowledge, demoMode }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [newRule, setNewRule] = useState('');

    const addRule = async () => {
        if (!newRule) return;
        if (demoMode) {
            alert("Adding rules is simulated in Demo Mode.");
            setNewRule(''); setShowAdd(false);
            return;
        }
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'knowledge'), { content: newRule, createdAt: new Date().toISOString() });
        setNewRule(''); setShowAdd(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Sales Policy</h2>
                <button onClick={() => setShowAdd(true)} className="bg-orange-600 text-white px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-2">
                    <Plus size={14} /> Add Rule
                </button>
            </div>

            {showAdd && (
                <div className="bg-white p-6 rounded-[2rem] border shadow-xl mb-8 animate-fade-in">
                    <textarea
                        value={newRule}
                        onChange={e => setNewRule(e.target.value)}
                        placeholder="e.g. 'If they struggle with tech, offer the shop phone number immediately.'"
                        className="w-full h-24 p-4 bg-slate-50 border rounded-xl font-medium text-sm mb-4 outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowAdd(false)} className="px-4 py-2 font-bold text-xs text-gray-400 hover:text-gray-900">Cancel</button>
                        <button onClick={addRule} className="bg-gray-900 text-white px-6 py-2 rounded-lg font-black uppercase text-xs">Save Rule</button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {knowledge.map(rule => (
                    <div key={rule.id} className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-start gap-4 border-l-8 border-l-orange-500">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><ShieldAlert size={20} /></div>
                        <p className="font-bold text-gray-700 text-sm leading-relaxed flex-1 italic">"{rule.content}"</p>
                    </div>
                ))}
                {knowledge.length === 0 && (
                    <p className="text-center text-gray-400 italic mt-8">No custom knowledge rules set.</p>
                )}
            </div>
        </div>
    );
};


// --- MAIN DASHBOARD EXPORT ---
export const AdminDashboard = ({
    user,
    leads,
    inventory,
    knowledge,
    integrations,
    onSync,
    isSyncing,
    demoMode,
    onAddLead,
    onUpdateLead
}) => {
    const [activeTab, setActiveTab] = useState('pipeline'); // pipeline | rules | chats
    const [selectedLead, setSelectedLead] = useState(null);

    return (
        <div className="flex h-full bg-slate-50">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r flex flex-col items-center py-8 gap-4 px-4 sticky top-0 h-screen">
                <div className="mb-8">
                    <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                        <Car size={32} />
                    </div>
                </div>

                <nav className="w-full space-y-2">
                    <button
                        onClick={() => setActiveTab('pipeline')}
                        className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'pipeline' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <Users size={20} />
                        <span className="font-black uppercase text-xs tracking-widest">Pipeline</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'chats' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <MessageCircle size={20} />
                        <span className="font-black uppercase text-xs tracking-widest">Chat Logs</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'rules' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <ShieldAlert size={20} />
                        <span className="font-black uppercase text-xs tracking-widest">Knowledge</span>
                    </button>
                </nav>

                <div className="mt-auto w-full p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">System Status</div>
                    <div className="flex items-center gap-2 text-xs font-bold text-green-600 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Inventory Synced
                    </div>
                    <button
                        onClick={onSync}
                        disabled={isSyncing}
                        className="w-full bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-gray-400 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                        <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto p-8 relative">
                {activeTab === 'pipeline' && (
                    <SalesPipeline
                        leads={leads}
                        userId={user.uid}
                        onSelectLead={setSelectedLead}
                        demoMode={demoMode}
                        onAddLead={onAddLead}
                        onUpdateLead={onUpdateLead}
                    />
                )}

                {activeTab === 'chats' && (
                    <ChatLogs leads={leads} onSelectLead={setSelectedLead} />
                )}

                {activeTab === 'rules' && (
                    <KnowledgeManager knowledge={knowledge} demoMode={demoMode} />
                )}
            </div>

            {/* TRANSCRIPT VIEWER OVERLAY */}
            {selectedLead && (
                <TranscriptViewer lead={selectedLead} onClose={() => setSelectedLead(null)} />
            )}
        </div>
    );
};
