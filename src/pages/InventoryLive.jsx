import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertCircle, RefreshCw, Heart, Settings, Shield, Lock } from 'lucide-react';

import { useGarage } from '../context/GarageContext';
import InventoryTable from '../components/AutoGrader/InventoryTable';
import VehicleEditor from '../components/AutoGrader/VehicleEditor';
import { RAW_VEHICLE_CSV } from '../components/AutoGrader/constants';
import '../components/AutoGrader/AutoGrader.css';

// Default CSV URL provided in the original tool
const DEFAULT_CSV_URL = "https://highlifeauto.com/frazer-inventory-updated.csv";

const parseCSV = (csv) => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    return lines.slice(1).filter(line => line.trim() !== '').map(line => {
        // Handle CSV parsing with potential commas inside quotes
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

const InventoryLive = () => {
    // --- AutoGrader State ---
    const [vehicles, setVehicles] = useState([]);
    const [editingVehicle, setEditingVehicle] = useState(null);

    // Auth & View Mode
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [viewMode, setViewMode] = useState('public'); // Default to public

    const [googleSheetUrl, setGoogleSheetUrl] = useState(DEFAULT_CSV_URL);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // --- Public Viewer State ---
    const [filter, setFilter] = useState('');
    const [priceRange, setPriceRange] = useState(50000);
    const { toggleGarage, isInGarage } = useGarage();

    // --- Advanced Filtering State ---
    const [sortKey, setSortKey] = useState('retail'); // 'retail' | 'mileage' | 'year'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
    const [maxMileage, setMaxMileage] = useState(250000);

    // Persistence Keys
    const STORAGE_KEY = 'highlife_inventory_v1';
    const SETTINGS_KEY = 'highlife_settings_v1';

    // 1. Initial Data Load
    useEffect(() => {
        let loaded = false;

        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            // Fix: If saved URL is the old remote one, revert to local relative path
            if (parsed.googleSheetUrl === "https://highlifeauto.com/frazer-inventory-updated.csv") {
                setGoogleSheetUrl(DEFAULT_CSV_URL);
            } else {
                setGoogleSheetUrl(parsed.googleSheetUrl || DEFAULT_CSV_URL);
            }
            setLastSyncTime(parsed.lastSyncTime || null);
        }

        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed && parsed.length > 0) {
                    setVehicles(parsed);
                    loaded = true;
                }
            } catch (e) {
                console.error("Failed to parse local storage", e);
            }
        }

        if (!loaded) {
            // Fallback 1: Raw CSV Constant
            const rawParsed = parseCSV(RAW_VEHICLE_CSV || "");
            if (rawParsed.length > 0) {
                setVehicles(rawParsed);
            } else {
                // Fallback 2: Hardcoded Emergency Data
                // We load this so something shows, but we also rely on the smart sync effect to catch us.
                console.warn("No inventory source found. Loading Emergency Fallback.");
                setVehicles([
                    {
                        stockNumber: "FALLBACK-001",
                        year: "2015",
                        make: "Chevrolet",
                        model: "Malibu",
                        trim: "LT",
                        retail: "5995",
                        mileage: "120,000",
                        imageUrls: [],
                        aiGrade: { overallGrade: "B+" },
                        comments: "Reliable daily driver. Clean title."
                    },
                    {
                        stockNumber: "FALLBACK-002",
                        year: "2012",
                        make: "Ford",
                        model: "F-150",
                        trim: "XLT",
                        retail: "10995",
                        mileage: "145,000",
                        imageUrls: [],
                        aiGrade: { overallGrade: "A-" },
                        comments: "Solid work truck. Runs great."
                    }
                ]);
            }
        }
    }, []);

    // 2. Persist Data
    useEffect(() => {
        if (vehicles.length > 0 && vehicles[0].stockNumber !== 'FALLBACK-001') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
        }
    }, [vehicles]);

    useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ googleSheetUrl, lastSyncTime }));
    }, [googleSheetUrl, lastSyncTime]);

    // 3. Smart Sync Logic
    // 3. Smart Sync Logic
    const performSmartSync = useCallback(async (manual = false) => {
        if (!googleSheetUrl) return;

        setIsSyncing(true);
        try {
            const cacheBuster = `?t=${new Date().getTime()}`;
            const fetchUrl = googleSheetUrl.includes('?') ? `${googleSheetUrl}&t=${new Date().getTime()}` : `${googleSheetUrl}${cacheBuster}`;

            const response = await fetch(fetchUrl);
            if (!response.ok) throw new Error("Failed to fetch CSV feed");
            const csvText = await response.text();

            const remoteInventory = parseCSV(csvText);

            if (!remoteInventory || remoteInventory.length === 0) {
                throw new Error("Parsed CSV was empty");
            }

            // Merge logic: Robustly Preserve AI content
            const localMap = new Map();
            vehicles.forEach(v => {
                if (v.vin) localMap.set(v.vin.trim().toUpperCase(), v);
            });

            const mergedVehicles = remoteInventory.map(remoteVehicle => {
                // Normalize Remote VIN
                const rVin = remoteVehicle.vin ? remoteVehicle.vin.trim().toUpperCase() : '';
                const localMatch = localMap.get(rVin);

                if (localMatch) {
                    // STRICT PERSISTENCE:
                    // We must ensure that any graded/edited data is NEVER overwritten by the raw CSV.
                    return {
                        // 1. Take the FRESH data from the CSV (Price, Mileage, etc.)
                        ...remoteVehicle,

                        // 2. OVERWRITE with preserved Local User Data if it exists
                        // This ensures that even if we parsed a field from CSV, the Local edit wins 
                        // for these specific "Creative/AI" fields.
                        aiGrade: localMatch.aiGrade,
                        marketingDescription: localMatch.marketingDescription,
                        blemishes: localMatch.blemishes,
                        groundingSources: localMatch.groundingSources,
                        websiteNotes: localMatch.websiteNotes,

                        // 3. Keep stable ID if needed
                        id: localMatch.id || remoteVehicle.id,

                        // 4. Update sync timestamp
                        lastUpdated: Date.now()
                    };
                }
                // New Vehicle: Take full CSV data
                return remoteVehicle;
            });

            setVehicles(mergedVehicles);
            setLastSyncTime(new Date().toLocaleString());
            if (manual) alert("Sync Complete!");

        } catch (error) {
            console.error("Sync Error:", error);
            if (manual) alert(`Failed to sync: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    }, [googleSheetUrl, vehicles]);

    // 4. Auto Sync Interval (AND INITIAL LOAD RESCUE)
    useEffect(() => {
        if (!googleSheetUrl) return;

        // IMMEDIATE RESCUE: If we have fallback data or very little data, run a sync immediately on mount.
        if (vehicles.length <= 2 && (vehicles.length === 0 || vehicles[0].stockNumber === 'FALLBACK-001')) {
            console.log("Triggering immediate rescue sync...");
            performSmartSync(false);
        }

        const intervalId = setInterval(() => {
            const now = new Date();
            const currentHour = now.getHours();
            if (currentHour >= 8 && currentHour <= 19) {
                performSmartSync(false);
            }
        }, 60 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [googleSheetUrl, performSmartSync, vehicles.length]);


    // --- Filtering Logic ---
    const filteredCars = useMemo(() => {
        return vehicles.filter(car =>
            (car.make?.toLowerCase().includes(filter.toLowerCase()) ||
                car.model?.toLowerCase().includes(filter.toLowerCase()) ||
                car.year?.toString().includes(filter) ||
                car.stockNumber?.toLowerCase().includes(filter.toLowerCase())) &&
            (parseFloat(car.retail || '0') <= priceRange) &&
            (parseInt(car.mileage?.replace(/\D/g, '') || 0) <= maxMileage)
        ).sort((a, b) => {
            let valA, valB;

            if (sortKey === 'retail') {
                valA = parseFloat(a.retail) || 0;
                valB = parseFloat(b.retail) || 0;
            } else if (sortKey === 'mileage') {
                valA = parseInt(a.mileage?.replace(/\D/g, '') || 0);
                valB = parseInt(b.mileage?.replace(/\D/g, '') || 0);
            } else if (sortKey === 'year') {
                valA = parseInt(a.year) || 0;
                valB = parseInt(b.year) || 0;
            }

            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });
    }, [vehicles, filter, priceRange, maxMileage, sortKey, sortOrder]);

    const handleSortChange = (e) => {
        const [key, order] = e.target.value.split('-');
        setSortKey(key);
        setSortOrder(order);
    };


    const handleSaveVehicle = (updatedVehicle) => {
        setVehicles(prev => prev.map(v => v.vin === updatedVehicle.vin ? updatedVehicle : v));
        setEditingVehicle(null);
    };

    const handleDealerLogin = () => {
        const password = prompt("Enter Dealer Password:");
        if (password === "Highlife8191!") {
            setIsAuthenticated(true);
            setViewMode('manager');
            alert("Authenticated! Welcome to the Back Office.");
        } else {
            alert("Incorrect password.");
        }
    };

    return (
        <div className="inventory-page">
            <section style={{ backgroundColor: '#f9f9f9', padding: '3rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <div className="container">

                    {/* Header / Mode Switcher */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <h1 style={{ marginBottom: '0.5rem' }}>Digital Showroom</h1>
                                <button
                                    onClick={handleDealerLogin}
                                    style={{
                                        background: 'none',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem',
                                        color: '#999',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}
                                    title="Manager Access"
                                >
                                    <Lock size={12} /> Staff Login
                                </button>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={16} color="var(--color-accent)" />
                                Live inventory from Frazer DMS
                                {lastSyncTime && ` • Synced: ${lastSyncTime}`}
                            </p>
                        </div>

                        {/* Manager Controls - Only visible if Authenticated */}
                        {isAuthenticated && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setViewMode(viewMode === 'manager' ? 'public' : 'manager')}
                                    className="btn btn-outline"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Settings size={18} /> {viewMode === 'manager' ? 'Switch to Public View' : 'Switch to Manager View'}
                                </button>
                                <button
                                    onClick={() => performSmartSync(true)}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    disabled={isSyncing}
                                >
                                    <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync Feed'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ACTIVE FILTERS BAR */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                        marginBottom: '2rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                    }}>
                        {/* 1. Global Search */}
                        <div style={{ position: 'relative' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>Search</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input
                                    type="text"
                                    placeholder="Make, Model, VIN..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        outline: 'none',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                        </div>

                        {/* 2. Max Price */}
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Max Price</span>
                                <span style={{ color: 'var(--color-primary)' }}>${priceRange.toLocaleString()}</span>
                            </label>
                            <input
                                type="range"
                                min="1000"
                                max="50000"
                                step="500"
                                value={priceRange}
                                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-primary)', height: '2rem' }}
                            />
                        </div>

                        {/* 3. Max Mileage */}
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Max Mileage</span>
                                <span style={{ color: 'var(--color-primary)' }}>{maxMileage.toLocaleString()} mi</span>
                            </label>
                            <input
                                type="range"
                                min="50000"
                                max="300000"
                                step="10000"
                                value={maxMileage}
                                onChange={(e) => setMaxMileage(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-primary)', height: '2rem' }}
                            />
                        </div>

                        {/* 4. Sort By */}
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>Sort Inventory</label>
                            <select
                                onChange={handleSortChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'white',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value="retail-asc">Price: Low to High</option>
                                <option value="retail-desc">Price: High to Low</option>
                                <option value="mileage-asc">Mileage: Low to High</option>
                                <option value="year-desc">Year: Newest First</option>
                                <option value="year-asc">Year: Oldest First</option>
                            </select>
                        </div>
                    </div>


                    {/* Content View */}
                    {viewMode === 'manager' ? (
                        <InventoryTable
                            vehicles={filteredCars}
                            onEdit={setEditingVehicle}
                        />
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '2rem',
                            padding: '1rem 0'
                        }}>
                            {filteredCars.map((car) => (
                                <Link to={`/vehicle/${car.stockNumber}`} key={car.stockNumber} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}>
                                        {/* Image Area */}
                                        <div style={{ height: '200px', backgroundColor: '#eee', position: 'relative' }}>
                                            {car.imageUrls && car.imageUrls.length > 0 ? (
                                                <img
                                                    src={car.imageUrls[0]}
                                                    alt={`${car.year} ${car.make} ${car.model}`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                                    No Photo
                                                </div>
                                            )}

                                            {/* Price Tag */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                backgroundColor: 'var(--color-primary)',
                                                color: 'var(--color-gold)',
                                                padding: '0.5rem 1rem',
                                                fontWeight: 800,
                                                fontSize: '1.25rem'
                                            }}>
                                                ${parseFloat(car.retail).toLocaleString()}
                                            </div>

                                            {/* Garage Heart */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    toggleGarage(car);
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '0.5rem',
                                                    right: '0.5rem',
                                                    background: 'rgba(255,255,255,0.9)',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '36px',
                                                    height: '36px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    color: isInGarage(car.stockNumber) ? '#ef4444' : '#ccc'
                                                }}
                                            >
                                                <Heart size={20} fill={isInGarage(car.stockNumber) ? '#ef4444' : 'none'} />
                                            </button>
                                        </div>

                                        {/* Details Area */}
                                        <div style={{ padding: '1.5rem' }}>
                                            <div style={{ color: '#666', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                                {car.year}
                                            </div>
                                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--color-text)' }}>
                                                {car.make} {car.model} {car.trim}
                                            </h3>

                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#888', marginBottom: '1rem' }}>
                                                <span>{parseInt(car.mileage).toLocaleString()} miles</span>
                                                <span>•</span>
                                                <span>Stock #{car.stockNumber}</span>
                                            </div>

                                            {/* Grade Badge */}
                                            {/* Grade Badge */}
                                            {car.aiGrade && (
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    backgroundColor: car.aiGrade.overallGrade ? '#dcfce7' : '#f3f4f6',
                                                    color: car.aiGrade.overallGrade ? '#166534' : '#666',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800,
                                                    border: car.aiGrade.overallGrade ? '1px solid #bbf7d0' : 'none'
                                                }}>
                                                    <Shield size={12} fill={car.aiGrade.overallGrade ? "#166534" : "#ccc"} />
                                                    {car.aiGrade.overallGrade ? `Grade: ${car.aiGrade.overallGrade}` : 'Graded (Reviewing)'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {viewMode === 'manager' && (
                        <div style={{ marginTop: '2rem', textAlign: 'center', opacity: 0.5 }}>
                            <small>Manager Access Active</small>
                        </div>
                    )}
                </div>
            </section>

            {/* AutoGrader Modal */}
            {editingVehicle && (
                <VehicleEditor
                    vehicle={editingVehicle}
                    onSave={handleSaveVehicle}
                    onClose={() => setEditingVehicle(null)}
                />
            )}
        </div>
    );
};

export default InventoryLive;
