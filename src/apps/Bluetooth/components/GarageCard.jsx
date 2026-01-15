
import React, { useState } from 'react';
import { CheckCircle2, X, FileText, Save } from 'lucide-react';

export const GarageCard = ({ record, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [outcome, setOutcome] = useState(record.outcome === 'waste' ? 'waste' : 'fixed');
    const [fixNote, setFixNote] = useState(record.actualFix || '');
    const [wasteNote, setWasteNote] = useState(record.wastedMoneyNotes || '');

    const handleSave = () => {
        onUpdate(outcome, fixNote, wasteNote);
        setIsEditing(false);
    };

    return (
        <div className={`p-6 rounded-2xl border ${record.outcome === 'fixed' ? 'bg-emerald-900/10 border-emerald-500/30' : record.outcome === 'waste' ? 'bg-red-900/10 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-bold text-white">{record.vehicleName}</h4>
                        <span className="text-xs text-slate-500">{new Date(record.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {record.codes.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-xs font-mono font-bold text-blue-400">{c.code}</span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {record.outcome === 'fixed' && <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12} /> FIXED</span>}
                    {record.outcome === 'waste' && <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold flex items-center gap-1"><X size={12} /> WASTED MONEY</span>}
                    {record.outcome === 'pending' && <span className="px-3 py-1 bg-slate-600 text-white rounded-full text-xs font-bold">PENDING</span>}

                    <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg">
                        {isEditing ? <X size={16} /> : <FileText size={16} />}
                    </button>
                </div>
            </div>

            {!isEditing ? (
                <div className="text-sm text-slate-400">
                    <p className="line-clamp-2 mb-2">{record.aiAnalysis}</p>
                    {record.outcome === 'fixed' && record.actualFix && (
                        <div className="mt-3 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider block mb-1">Verified Fix (Golden Nugget)</span>
                            <p className="text-emerald-100">{record.actualFix}</p>
                        </div>
                    )}
                    {record.outcome === 'waste' && record.wastedMoneyNotes && (
                        <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                            <span className="text-red-400 font-bold text-xs uppercase tracking-wider block mb-1">Waste Warning</span>
                            <p className="text-red-100">{record.wastedMoneyNotes}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mt-4 space-y-4 bg-slate-900/50 p-4 rounded-xl">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Did the fix work?</label>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setOutcome('fixed')} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${outcome === 'fixed' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>Yes, Fixed It</button>
                            <button onClick={() => setOutcome('waste')} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${outcome === 'waste' ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>No, Wasted Money</button>
                        </div>
                    </div>

                    {outcome === 'fixed' && (
                        <div>
                            <label className="text-xs font-bold text-emerald-500 uppercase">What was the actual fix?</label>
                            <textarea
                                value={fixNote}
                                onChange={e => setFixNote(e.target.value)}
                                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-emerald-500 outline-none"
                                placeholder="e.g. Replaced Ignition Coil Cylinder 3, OEM part only."
                                rows={2}
                            />
                        </div>
                    )}

                    {outcome === 'waste' && (
                        <div>
                            <label className="text-xs font-bold text-red-500 uppercase">What parts did you waste money on?</label>
                            <textarea
                                value={wasteNote}
                                onChange={e => setWasteNote(e.target.value)}
                                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-red-500 outline-none"
                                placeholder="e.g. Replaced spark plugs but problem was actually the coil."
                                rows={2}
                            />
                        </div>
                    )}

                    <button onClick={handleSave} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-2">
                        <Save size={16} /> Save to Memory
                    </button>
                </div>
            )}
        </div>
    );
};
