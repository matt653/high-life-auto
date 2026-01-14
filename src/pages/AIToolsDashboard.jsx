import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Lock } from 'lucide-react';

const AI_TOOLS_BASE_PATH = '/ai-tools';

const AIToolsDashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [tools, setTools] = useState([]);

    useEffect(() => {
        const auth = localStorage.getItem('highlife_staff_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    // Manually define tools for now, or fetch if we had a manifest
    // Since we are linking to a local folder, we can't easily "scan" it with client-side JS.
    // We will list the known tools here.
    const KNOWN_TOOLS = [
        {
            name: "Inventory Online",
            path: "/AI - Inventory online/index.html",
            description: "Manage inventory and sync data.",
            color: "bg-blue-500"
        },
        {
            name: "Frazer Feed",
            path: "/AI - frazer feed/index.html",
            description: "Process Frazer CSV feeds.",
            color: "bg-green-500"
        },
        {
            name: "Edmunds Toolkit",
            path: "/apps/edmunds",
            description: "TMV Valuation & Maintenance Schedules.",
            color: "bg-blue-600",
            isInternal: true
        },
        {
            name: "Chat Bot",
            path: "/apps/chatbot",
            description: "AI Customer Service Agent.",
            color: "bg-purple-500",
            isInternal: true
        },
        {
            name: "Marketplace Poster",
            path: "/AI - Marketplace Posting Tool/index.html",
            description: "Automated listing tool.",
            color: "bg-orange-500"
        },
        {
            name: "Customer Care",
            path: "/AI - Post Sale Custmer Care/index.html",
            description: "Post-sale follow up workflows.",
            color: "bg-pink-500"
        },
        {
            name: "Car Grading",
            path: "/AI - Car Grading/index.html",
            description: "Vehicle inspection and grading.",
            color: "bg-red-500"
        },
        {
            name: "CSV to Web",
            path: "/AI - send csv to  web/index.html",
            description: "Sync CSV data to website.",
            color: "bg-indigo-500"
        },
        // Add more tools here manually as you build them
    ];

    const handleLogin = () => {
        const password = prompt("Enter Master Password:");
        if (password === "Highlife8191!") {
            setIsAuthenticated(true);
            localStorage.setItem('highlife_staff_auth', 'true');
        } else {
            alert("Incorrect password.");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                    <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Restricted Access</h1>
                    <p className="text-gray-500 mb-8">This dashboard connects directly to your local AI Tools folder.</p>
                    <button
                        onClick={handleLogin}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                    >
                        Enter Password
                    </button>
                    <p className="mt-8 text-xs text-gray-400">System: {AI_TOOLS_BASE_PATH}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">AI Lab</h1>
                        <p className="text-gray-500 mt-2">Experimental tools loaded from {AI_TOOLS_BASE_PATH}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {KNOWN_TOOLS.map((tool, idx) => (
                        <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                            <div className={`h-2 ${tool.color}`} />
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.name}</h3>
                                <p className="text-gray-500 text-sm mb-6">{tool.description}</p>
                                {tool.isInternal ? (
                                    <Link
                                        to={tool.path}
                                        className="inline-flex items-center justify-center w-full bg-gray-900 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                                    >
                                        Launch Tool
                                    </Link>
                                ) : (
                                    <a
                                        href={`${AI_TOOLS_BASE_PATH}${tool.path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center w-full bg-gray-900 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                                    >
                                        Launch Tool
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Add New Placeholer */}
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-gray-400">
                        <Settings className="mb-2" size={32} />
                        <p className="font-medium">Add New Tool</p>
                        <p className="text-xs mt-1">Create folder in Desktop/AI Tools</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIToolsDashboard;
