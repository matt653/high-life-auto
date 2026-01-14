import React, { useState } from 'react';

const MarketplaceApp = () => {
    const [view, setView] = useState('upload'); // 'upload' | 'dashboard'
    const [listings, setListings] = useState([]);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csvText = event.target.result;
            // Simple Parse (reuse logic if possible, or simplified)
            const lines = csvText.split('\n').slice(1);
            const parsed = lines.map((line, idx) => {
                const cols = line.split(','); // Basic split, should be robust but for quick port
                if (cols.length < 5) return null;
                return {
                    id: idx,
                    title: `${canvasText(cols[5])} ${canvasText(cols[2])} ${canvasText(cols[3])}`, // Year Make Model rough guess
                    price: cols[7] || '0',
                    description: "AI Generated Description would go here..."
                };
            }).filter(i => i);

            setListings(parsed);
            setView('dashboard');
        };
        reader.readAsText(file);
    };

    const canvasText = (t) => t ? t.replace(/"/g, '') : '';

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <span role="img" aria-label="grid">📑</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">Marketplace<span className="text-blue-600">AI</span> Lister</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {view === 'upload' ? (
                    <div className="text-center py-20">
                        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
                            Turn Spreadsheets into <span className="text-blue-600">Sales</span>
                        </h1>
                        <p className="text-lg text-gray-500 mb-8">
                            Upload your inventory CSV to generate listings automatically.
                        </p>

                        <div className="flex justify-center">
                            <label className="cursor-pointer bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition shadow-lg">
                                Upload CSV
                                <input type="file" accept=".csv" className="hidden" onChange={handleUpload} />
                            </label>

                            {/* Option to use Live Feed */}
                            <button
                                onClick={() => alert("Connecting to Live Inventory Feed... (Feature Coming Soon)")}
                                className="ml-4 bg-white text-blue-600 font-bold py-3 px-6 rounded-lg border border-blue-200 hover:bg-blue-50 transition"
                            >
                                Use Live Inventory
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <button onClick={() => setView('upload')} className="mb-4 text-sm text-gray-500 hover:text-gray-900">&larr; Back to Upload</button>
                        <h2 className="text-2xl font-bold mb-6">Generated Listings ({listings.length})</h2>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {listings.map(item => (
                                <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                    <div className="text-2xl font-black text-green-600 mb-4">${item.price}</div>
                                    <p className="text-gray-500 text-sm mb-4 bg-gray-50 p-3 rounded">
                                        {item.description}
                                    </p>
                                    <button className="w-full bg-gray-900 text-white py-2 rounded font-bold hover:bg-black">
                                        Copy to Facebook
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MarketplaceApp;
