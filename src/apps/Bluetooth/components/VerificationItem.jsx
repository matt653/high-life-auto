
import React from 'react';

export const VerificationItem = ({ step, title, desc }) => (
    <div className="flex gap-5 group">
        <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 text-sm font-black text-slate-500 group-hover:border-blue-500 group-hover:text-blue-400 transition-all duration-300">{step}</div>
        <div>
            <h5 className="font-bold text-slate-100 text-base tracking-tight">{title}</h5>
            <p className="text-sm text-slate-500 leading-snug mt-1">{desc}</p>
        </div>
    </div>
);
