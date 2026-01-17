
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RAW_VEHICLE_CSV } from '../components/showroom/constants';
import InventoryTable from '../components/showroom/InventoryTable';
import VehicleEditor from '../components/AutoGrader/VehicleEditor';
import PublicInventory from '../components/showroom/PublicInventory';

// CSV Helper
const parseCSV = (csv) => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    return lines.slice(1).map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQuotes = !inQuotes;
            else if (line[i] === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += line[i];
            }
        }
        values.push(current.trim());

        const get = (h) => (values[headers.indexOf(h)] || "").replace(/"/g, '').trim();

        return {
            vin: get("Vehicle Vin"),
            stockNumber: get("Stock Number"),
            make: get("Vehicle Make"),
            model: get("Vehicle Model"),
            trim: get("Vehicle Trim Level"),
            year: get("Vehicle Year"),
            mileage: get("Mileage"),
            retail: get("Retail"),
            cost: get("Cost"),
            youtubeUrl: get("YouTube URL"),
            imageUrls: get("Image URL").split('|'),
            comments: get("Comments"),
            options: get("Option List"),
            type: get("Vehicle Type")
        };
    });
};



// ... (parseCSV function remains for manual imports)

const Showroom = () => {
    const [vehicles, setVehicles] = useState([]);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState(null);
    const [viewMode, setViewMode] = useState('public'); // Default to public
    const [isAuthenticated, setIsAuthenticated] = useState(false); // New auth state
    const fileInputRef = useRef(null);


    // Secret Admin Access (Double Click Logo)
    const handleAdminAccess = () => {
        const password = prompt("Enter Manager Password:");
        if (password === "highlife2026") {
            setIsAuthenticated(true);
            setViewMode('manager');
            setNotification({ message: "Manager Mode Unlocked", type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleCrmAccess = () => {
        const password = prompt("Enter CRM Password:");
        if (password === "highlife2026") {
            window.dispatchEvent(new Event('CRM_LOGIN_TRIGGER'));
            setNotification({ message: "Opening CRM Dashboard...", type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    // Persistence Key
    const STORAGE_KEY = 'highlife_inventory_v1';

    // Initial Data Load
    useEffect(() => {
        const loadData = async () => {
            let localData = [];
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                try {
                    localData = JSON.parse(savedData);
                    setVehicles(localData); // Show cached data immediately while fetching
                } catch (e) {
                    console.error("Local storage error", e);
                }
            }

            // Only load from LocalStorage or Fallback for now - Feed Removed
            if (!savedData && vehicles.length === 0) {
                setVehicles(parseCSV(RAW_VEHICLE_CSV));
            }
        };
        loadData();
    }, []);

    // Persistence Effect
    useEffect(() => {
        if (vehicles.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
        }
    }, [vehicles]);

    // Filter Logic
    const filteredVehicles = useMemo(() => {
        return vehicles.filter(v =>
            `${v.make} ${v.model} ${v.year} ${v.vin} ${v.stockNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [vehicles, searchTerm]);

    // Actions
    const handleSaveVehicle = (updatedVehicle) => {
        setVehicles(prev => prev.map(v => v.vin === updatedVehicle.vin ? updatedVehicle : v));
        setEditingVehicle(null);
    };

    const handleExport = () => {
        const jsonString = JSON.stringify(vehicles, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `highlife_inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setNotification({ message: "Inventory backup downloaded!", type: 'success' });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            if (content) {
                try {
                    const newInventory = parseCSV(content);

                    // INTELLIGENT MERGE LOGIC
                    const newVins = new Set(newInventory.map(v => v.vin));

                    const existingMap = new Map();
                    vehicles.forEach(v => existingMap.set(v.vin, v));

                    let addedCount = 0;
                    let updatedCount = 0;



                    const mergedVehicles = newInventory.map(newVehicle => {
                        const existing = existingMap.get(newVehicle.vin);

                        if (existing) {
                            updatedCount++;
                            return {
                                ...newVehicle,
                                marketingDescription: existing.marketingDescription,
                                aiGrade: existing.aiGrade,
                                lastUpdated: existing.lastUpdated
                            };
                        } else {
                            addedCount++;
                            return newVehicle;
                        }
                    });

                    const removedCount = vehicles.length - (newInventory.length - addedCount);

                    setVehicles(mergedVehicles);
                    setNotification({
                        message: `Sync Complete: +${addedCount} Added, ${updatedCount} Updated, -${removedCount} Removed`,
                        type: 'success'
                    });
                    setTimeout(() => setNotification(null), 5000);

                } catch (error) {
                    console.error(error);
                    setNotification({ message: "Failed to parse CSV file.", type: 'info' });
                }
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">

            {/* Top Navigation - Internal to Showroom App */}
            <header className="bg-gray-900 text-white shadow-md z-20 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                            <span className="text-2xl">🏛️</span> The Showroom
                        </h1>

                        {/* View Switcher - Only shown if authenticated */}
                        {isAuthenticated && (
                            <div className="ml-8 flex bg-gray-800 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('manager')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'manager' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                >
                                    MANAGER
                                </button>
                                <button
                                    onClick={() => setViewMode('public')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'public' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                >
                                    PUBLIC PREVIEW
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {notification && (
                            <div className={`px-4 py-1 rounded-full text-sm font-bold animate-pulse ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {notification.message}
                            </div>
                        )}
                        {viewMode === 'manager' && (
                            <>
                                <div className="text-xs text-gray-400 font-mono hidden sm:block">
                                    {vehicles.filter(v => v.aiGrade).length} GRADED / {vehicles.length} TOTAL
                                </div>
                                <button
                                    onClick={handleExport}
                                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded text-sm font-medium transition-colors border border-gray-700"
                                >
                                    Backup Data
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 overflow-auto">

                {viewMode === 'manager' ? (
                    <div className="p-4 sm:p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto space-y-6">

                            {/* Controls */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <div className="relative w-full sm:w-96">
                                    <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    <input
                                        type="text"
                                        placeholder="Search inventory by VIN, Stock #, Model..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".csv"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={handleImportClick}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                        Import CSV Update
                                    </button>
                                </div>
                            </div>

                            {/* Data Table */}
                            <InventoryTable
                                vehicles={filteredVehicles}
                                onEdit={setEditingVehicle}
                            />
                        </div>
                    </div>
                ) : (
                    <PublicInventory vehicles={vehicles} />
                )}
            </main>

            {/* Footer with Logic Access */}
            <footer className="bg-gray-900 border-t border-gray-800 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-gray-500 text-xs uppercase tracking-wider">
                        &copy; {new Date().getFullYear()} HighLife Auto Showroom.
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleAdminAccess}
                            className="text-gray-600 hover:text-white text-xs uppercase font-bold tracking-wider transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            Inventory Login
                        </button>
                        <div className="w-px h-4 bg-gray-700"></div>
                        <button
                            onClick={handleCrmAccess}
                            className="text-gray-600 hover:text-white text-xs uppercase font-bold tracking-wider transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            CRM Login
                        </button>
                    </div>
                </div>
            </footer>

            {/* Editor Modal */}
            {editingVehicle && viewMode === 'manager' && (
                <VehicleEditor
                    vehicle={editingVehicle}
                    onSave={handleSaveVehicle}
                    onClose={() => setEditingVehicle(null)}
                />
            )}
        </div>
    );
};

export default Showroom;

