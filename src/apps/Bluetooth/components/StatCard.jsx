
import React from 'react';

export const StatCard = ({ icon, label, value, unit }) => (
    <div className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.05] hover:bg-slate-800 shadow-lg border border-slate-800/50">
        <div className="p-3 bg-slate-900 rounded-2xl mb-1">{icon}</div>
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{label}</p>
        <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">{unit}</span>
        </div>
    </div>
);
