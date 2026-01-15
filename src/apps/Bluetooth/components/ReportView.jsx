
import React from 'react';
import { Printer, X, ShieldCheck, AlertTriangle, Wind, Ear, Zap, Info, ExternalLink } from 'lucide-react';

export const ReportView = ({ type, data, codes, sensory, analysis, links, onClose }) => {
    const maxRpm = Math.max(...data.map(d => d.rpm), 0);
    const avgTemp = data.length > 0 ? (data.reduce((a, b) => a + b.coolantTemp, 0) / data.length) : 0;
    const passed = codes.length === 0;

    return (
        <div className="fixed inset-0 z-[100] bg-white text-slate-900 overflow-y-auto">
            {/* Print Controls - Hidden when printing */}
            <div className="fixed top-0 left-0 right-0 p-4 bg-slate-900 text-white flex justify-between items-center print:hidden shadow-xl z-50">
                <h2 className="font-bold flex items-center gap-2"><Printer size={18} /> Print Preview: {type === 'sales' ? 'Window Sheet' : 'Buyer Report'}</h2>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-sm">Print PDF</button>
                    <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-sm flex items-center gap-2"><X size={16} /> Close</button>
                </div>
            </div>

            <div className="p-8 mt-16 max-w-[21cm] mx-auto min-h-screen bg-white">

                {/* ================= SALES DATA SHEET ================= */}
                {type === 'sales' && (
                    <div className="space-y-8 border-4 border-slate-900 p-8 h-full relative">
                        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6">
                            <div>
                                <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-2">VEHICLE CONDITION</h1>
                                <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">Digital Inspection Report</p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black text-blue-600">AutoSense<span className="text-slate-900">AI</span></div>
                                <div className="text-xs font-bold text-slate-400 uppercase mt-1">Verified Certified</div>
                            </div>
                        </div>

                        <div className={`p-8 text-center rounded-3xl border-2 ${passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="inline-flex items-center justify-center p-4 rounded-full bg-white shadow-lg mb-4">
                                {passed ? <ShieldCheck size={48} className="text-emerald-600" /> : <AlertTriangle size={48} className="text-red-600" />}
                            </div>
                            <h2 className={`text-4xl font-black mb-2 ${passed ? 'text-emerald-700' : 'text-red-700'}`}>
                                {passed ? 'CLEAN BILL OF HEALTH' : 'ATTENTION REQUIRED'}
                            </h2>
                            <p className="text-slate-600 font-medium text-lg">
                                {passed ? 'This vehicle passed all diagnostic checks during the test cycle.' : 'Diagnostic system detected pending codes. Ask associate for details.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Max RPM Tested</div>
                                <div className="text-3xl font-black text-slate-900">{Math.round(maxRpm)} <span className="text-base text-slate-400 font-bold">REV</span></div>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Avg Op. Temp</div>
                                <div className="text-3xl font-black text-slate-900">{Math.round(avgTemp)} <span className="text-base text-slate-400 font-bold">°F</span></div>
                            </div>
                        </div>

                        {codes.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-4">Active System Flags</h3>
                                <div className="space-y-2">
                                    {codes.map((c, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                                            <span className="font-mono font-bold text-red-700">{c.code}</span>
                                            <span className="text-sm font-medium text-red-600">{c.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-8 left-8 right-8 text-center pt-8 border-t-2 border-slate-100">
                            <p className="text-sm text-slate-500 mb-2 font-medium">Scan for full digital history & AI mechanic analysis</p>
                            <div className="inline-block px-6 py-2 bg-slate-900 text-white font-bold rounded-full text-sm">ASK FOR FULL REPORT</div>
                        </div>
                    </div>
                )}

                {/* ================= DETAILED BUYER REPORT ================= */}
                {type === 'detailed' && (
                    <div className="space-y-10">
                        <div className="border-b-2 border-slate-200 pb-8">
                            <h1 className="text-3xl font-bold text-slate-900">Comprehensive Vehicle Diagnostic</h1>
                            <div className="flex justify-between items-end mt-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500">Generated by <span className="font-bold text-blue-600">AutoSense AI</span></p>
                                    <p className="text-sm text-slate-500">Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                                </div>
                                {passed ?
                                    <span className="px-4 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full text-sm border border-emerald-200">SYSTEMS NOMINAL</span> :
                                    <span className="px-4 py-1 bg-red-100 text-red-700 font-bold rounded-full text-sm border border-red-200">{codes.length} FAULTS FOUND</span>
                                }
                            </div>
                        </div>

                        <section>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">1. Telemetry Snapshot</h2>
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="text-xs text-slate-500 uppercase font-bold">Max RPM</div>
                                    <div className="text-xl font-black text-slate-900">{Math.round(maxRpm)}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="text-xs text-slate-500 uppercase font-bold">Avg Temp</div>
                                    <div className="text-xl font-black text-slate-900">{Math.round(avgTemp)}°F</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="text-xs text-slate-500 uppercase font-bold">Data Points</div>
                                    <div className="text-xl font-black text-slate-900">{data.length}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="text-xs text-slate-500 uppercase font-bold">Scan Duration</div>
                                    <div className="text-xl font-black text-slate-900">{Math.round(data.length / 60)}m</div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">2. Mechanic's Analysis (Costs & Fixes)</h2>
                            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line text-sm">
                                {analysis || "No AI analysis data available."}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">3. Sensory Observations</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 border border-slate-200 rounded-lg">
                                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Wind size={14} /> Smell</h4>
                                    <p className="text-sm text-slate-600">{sensory.smell.join(', ') || 'None Reported'}</p>
                                </div>
                                <div className="p-4 border border-slate-200 rounded-lg">
                                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Ear size={14} /> Sound</h4>
                                    <p className="text-sm text-slate-600">{sensory.sound.join(', ') || 'None Reported'}</p>
                                </div>
                                <div className="p-4 border border-slate-200 rounded-lg">
                                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Zap size={14} /> Tactile</h4>
                                    <p className="text-sm text-slate-600">{sensory.touch.join(', ') || 'None Reported'}</p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-blue-50 border border-blue-100 p-6 rounded-xl break-inside-avoid">
                            <h2 className="text-lg font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={18} /> Buyer Advisory</h2>
                            <p className="text-blue-800 text-sm mb-4 leading-relaxed font-medium">
                                The data above represents a snapshot in time. To ensure total peace of mind, we strongly recommend:
                            </p>
                            <ul className="list-disc list-inside text-sm text-blue-800 space-y-2 ml-2">
                                <li><span className="font-bold">Extended Test Drive:</span> Drive for at least 20 minutes to allow all systems to reach operating temperature.</li>
                                <li><span className="font-bold">Cold Start Check:</span> Listen to the engine immediately upon startup after sitting overnight.</li>
                                <li><span className="font-bold">Independent Verification:</span> Use the links below to verify common issues for this make/model.</li>
                            </ul>
                        </section>

                        {links.length > 0 && (
                            <section>
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Verified Research Links</h2>
                                <ul className="space-y-1">
                                    {links.map((l, i) => (
                                        <li key={i}><a href={l.uri} className="text-xs text-blue-600 hover:underline break-all">{l.uri}</a></li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
