import React, { useState } from 'react';

const EdmundsApp = () => {
    const [activeTab, setActiveTab] = useState('valuation');
    const [apiKey, setApiKey] = useState('');

    // Shared Inputs
    const [year, setYear] = useState('2013');
    const [make, setMake] = useState('acura');
    const [model, setModel] = useState('ilx');

    // Tool Specific Inputs
    const [styleId, setStyleId] = useState('200419751'); // For TMV
    const [zip, setZip] = useState('90019'); // For TMV
    const [modelYearId, setModelYearId] = useState('100502677'); // For Maintenance

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const resetState = () => {
        setResult(null);
        setError(null);
    };

    const handleFetch = async () => {
        if (!apiKey) {
            setError("Please enter an API Key.");
            return;
        }

        setLoading(true);
        resetState();

        try {
            let url = '';

            if (activeTab === 'valuation') {
                url = `https://api.edmunds.com/api/v2/usedtmv/getalltmvbands?styleid=${styleId}&zip=${zip}&fmt=json&api_key=${apiKey}`;
            } else if (activeTab === 'maintenance') {
                url = `https://api.edmunds.com/v1/api/maintenance/actionrepository/findbymodelyearid?modelyearid=${modelYearId}&fmt=json&api_key=${apiKey}`;
            } else if (activeTab === 'safety') {
                url = `https://api.edmunds.com/api/vehicle/v2/${make}/${model}/${year}/safety?fmt=json&api_key=${apiKey}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`API Error: ${response.status} - ${text}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            console.error("Edmunds API Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-8">
            <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <header className="mb-8 border-b pb-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Edmunds Toolkit</h1>
                        <p className="text-gray-500 mt-1">Valuation, Maintenance & Safety Data</p>
                    </div>
                </header>

                {/* API Key Section */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Edmunds API Key</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Edmunds API Key"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">Key is not saved permanently for security.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => { setActiveTab('valuation'); resetState(); }}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'valuation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        💰 TMV Valuation
                    </button>
                    <button
                        onClick={() => { setActiveTab('maintenance'); resetState(); }}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'maintenance' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        🔧 Maintenance
                    </button>
                    <button
                        onClick={() => { setActiveTab('safety'); resetState(); }}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'safety' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        🛡️ Safety
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Controls Column */}
                    <div className="md:col-span-1 space-y-6">
                        {activeTab === 'valuation' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Style ID</label>
                                    <input type="text" value={styleId} onChange={(e) => setStyleId(e.target.value)} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Zip Code</label>
                                    <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} className="w-full p-2 border rounded" />
                                </div>
                            </>
                        )}

                        {activeTab === 'maintenance' && (
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Model Year ID</label>
                                <input type="text" value={modelYearId} onChange={(e) => setModelYearId(e.target.value)} className="w-full p-2 border rounded" />
                            </div>
                        )}

                        {activeTab === 'safety' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Year</label>
                                    <input type="text" value={year} onChange={(e) => setYear(e.target.value)} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Make</label>
                                    <input type="text" value={make} onChange={(e) => setMake(e.target.value)} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Model</label>
                                    <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="w-full p-2 border rounded" />
                                </div>
                            </>
                        )}

                        <button
                            onClick={handleFetch}
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black'
                                }`}
                        >
                            {loading ? "Fetching..." : "Run Query"}
                        </button>
                    </div>

                    {/* Results Column */}
                    <div className="md:col-span-2">
                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-4">
                                <h3 className="font-bold text-sm uppercase">Error</h3>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {!result && !loading && !error && (
                            <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                Select a tool and run query
                            </div>
                        )}

                        {result && (
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 animate-fade-in">
                                <h2 className="text-sm font-bold uppercase text-gray-500 mb-4 tracking-wider border-b pb-2">Results</h2>

                                {/* Custom Views based on active tab */}
                                {activeTab === 'valuation' && (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500 mb-2">Used TMV® Retail Base Price (Outstanding)</p>
                                        <div className="text-4xl font-black text-green-700">
                                            ${result.tmvconditions?.OUTSTANDING?.Current?.nationalBasePrice?.usedTmvRetail?.toLocaleString() || "N/A"}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'maintenance' && (
                                    <div>
                                        <p className="font-bold mb-2">First Action Item:</p>
                                        <p className="text-xl text-gray-800">
                                            {result.actionHolder && result.actionHolder.length > 0
                                                ? result.actionHolder[0].action
                                                : "No action items found."}
                                        </p>
                                    </div>
                                )}

                                {activeTab === 'safety' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                            <div className="text-xs text-gray-500 uppercase">Overall Rating</div>
                                            <div className="text-3xl font-black text-blue-600">
                                                {result.nhtsa?.overallRating || "N/A"} / 5
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                            <div className="text-xs text-gray-500 uppercase">Complaints Count</div>
                                            <div className="text-3xl font-black text-gray-800">
                                                {result.nhtsa?.complaintsCount || "0"}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Raw JSON Fallback / Debug */}
                                <details className="mt-8">
                                    <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">View Raw JSON Response</summary>
                                    <pre className="mt-2 bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EdmundsApp;
