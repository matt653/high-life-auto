
import React from 'react';
import { Check } from 'lucide-react';

export const SensoryMultiSelect = ({ label, icon, values, options, onToggle }) => (
    <div className="space-y-4">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">{icon} {label}</label>
        <div className="space-y-2">
            {options.map(o => {
                const isSelected = values.includes(o.v);
                return (
                    <button key={o.v} onClick={() => onToggle(o.v)} className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all border flex items-center justify-between group ${isSelected ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/20 scale-[1.02]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                        <span>{o.l}</span>
                        {isSelected && <Check size={16} className="text-white" />}
                    </button>
                );
            })}
        </div>
    </div>
);
