
import React, { useState } from 'react';
import { analyzeVehicle } from '../../services/geminiService';

const VehicleEditor = ({ vehicle, onSave, onClose }) => {
    const [formData, setFormData] = useState({ ...vehicle });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('ai');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRunAI = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeVehicle(formData);
            setFormData(prev => ({
                ...prev,
                marketingDescription: result.marketingDescription,
                aiGrade: result.grade,
                groundingSources: result.groundingSources,
                lastUpdated: Date.now()
            }));
        } catch (error) {
            alert("AI Analysis failed. Please check API Key.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
                            <span className="bg-blue-600 px-2 py-1 rounded text-xs uppercase font-bold tracking-wider">Editor</span>
                            {formData.year} {formData.make} {formData.model}
                        </h2>
                        <div className="flex gap-4 mt-1 text-sm text-gray-400 font-mono">
                            <span>VIN: {formData.vin}</span>
                            <span className="text-gray-600">|</span>
                            <span>Stock: {formData.stockNumber}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">Cancel</button>
                        <button
                            onClick={() => onSave(formData)}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Layout */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left Column: Data Input */}
                    <div className="w-1/3 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Inventory Data</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Stock Number</label>
                                    <input
                                        type="text"
                                        name="stockNumber"
                                        value={formData.stockNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Mileage</label>
                                    <input
                                        type="text"
                                        name="mileage"
                                        value={formData.mileage}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Retail Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                    <input
                                        type="text"
                                        name="retail"
                                        value={formData.retail}
                                        onChange={handleInputChange}
                                        className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <label className="block text-xs font-bold text-gray-800 mb-1">Internal Comments (CSV Source)</label>
                                <p className="text-xs text-gray-400 mb-2">These are the raw notes from your CSV file. The AI uses this to understand the vehicle condition.</p>
                                <textarea
                                    name="comments"
                                    value={formData.comments}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-100"
                                />
                            </div>

                            <div className="pt-2">
                                <label className="block text-xs font-bold text-blue-800 mb-1">Additional Note for Website</label>
                                <p className="text-xs text-gray-400 mb-2">Add specific notes here (e.g. "New Tires", "Cash Only") to include in the public description.</p>
                                <textarea
                                    name="websiteNotes"
                                    value={formData.websiteNotes || ''}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="e.g. Needs transmission work, Selling as-is..."
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white shadow-sm"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Options List</label>
                                <textarea
                                    name="options"
                                    value={formData.options}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">YouTube URL</label>
                                <input
                                    type="text"
                                    name="youtubeUrl"
                                    value={formData.youtubeUrl}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-blue-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Analysis */}
                    <div className="w-2/3 bg-white flex flex-col">

                        {/* Toolbar */}
                        <div className="border-b border-gray-200 px-6 py-3 flex justify-between items-center bg-white">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setActiveTab('ai')}
                                    className={`pb-3 -mb-3.5 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ai' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                                >
                                    AI Grading & Copy
                                </button>
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`pb-3 -mb-3.5 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                                >
                                    Preview Report Card
                                </button>
                            </div>
                            <button
                                onClick={handleRunAI}
                                disabled={isAnalyzing}
                                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                        Listening to Video...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                        Analyze Video & Grade
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 relative bg-gray-50/50">
                            {activeTab === 'ai' && (
                                <div className="max-w-3xl mx-auto space-y-8">

                                    {/* Generated Description Editor */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                Marketing Description
                                            </h4>
                                            {formData.lastUpdated && <span className="text-xs text-gray-400">Updated: {new Date(formData.lastUpdated).toLocaleTimeString()}</span>}
                                        </div>
                                        {formData.marketingDescription ? (
                                            <div className="space-y-4">
                                                <textarea
                                                    name="marketingDescription"
                                                    value={formData.marketingDescription}
                                                    onChange={handleInputChange}
                                                    className="w-full h-64 p-4 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm leading-relaxed"
                                                />
                                                <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg flex items-start gap-2">
                                                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    This description contains HTML tags for formatting on your website. Edit carefully.
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                                <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                                <p className="text-sm">Click "Analyze Video" to generate description.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Stats Summary */}
                                    {formData.aiGrade && (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Grade</div>
                                                <div className="text-3xl font-black text-blue-600">{formData.aiGrade.overallGrade}</div>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Score</div>
                                                <div className="text-3xl font-black text-gray-800">{formData.aiGrade.overallScore}</div>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-gray-200 text-center flex items-center justify-center">
                                                <button onClick={() => setActiveTab('details')} className="text-sm font-bold text-blue-600 hover:underline">View Full Report &rarr;</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Grounding Sources */}
                                    {formData.groundingSources && formData.groundingSources.length > 0 && (
                                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Sources Used</h5>
                                            <ul className="space-y-1">
                                                {formData.groundingSources.map((source, i) => (
                                                    <li key={i}>
                                                        <a href={source.uri} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate block">
                                                            {source.title}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                </div>
                            )}

                            {activeTab === 'details' && (
                                <div className="max-w-4xl mx-auto">
                                    {formData.aiGrade ? (
                                        <div className="space-y-6">
                                            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg">
                                                <h3 className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-1">Overall Assessment</h3>
                                                <div className="text-5xl font-black tracking-tighter mb-2">{formData.aiGrade.overallGrade} <span className="text-2xl font-medium text-blue-300 opacity-75">/ 100</span></div>
                                                <p className="text-blue-100 italic">"{formData.aiGrade.summary}"</p>
                                            </div>
                                            <div className="space-y-3">
                                                {Object.values(formData.aiGrade.categories).map((cat, idx) => (
                                                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-start">
                                                        <div>
                                                            <h5 className="font-bold text-gray-900">{cat.name}</h5>
                                                            <p className="text-sm text-gray-600 mt-1">{cat.reasoning}</p>
                                                        </div>
                                                        <div className="bg-gray-100 px-3 py-1 rounded text-lg font-bold">{cat.grade}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                                            <p>No grading data available yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleEditor;
