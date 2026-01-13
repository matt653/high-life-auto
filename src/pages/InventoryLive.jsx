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

    // Persistence Keys
    const STORAGE_KEY = 'highlife_inventory_v1';
    const SETTINGS_KEY = 'highlife_settings_v1';

    // 1. Initial Data Load
    useEffect(() => {
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
                setVehicles(JSON.parse(savedData));
            } catch (e) {
                console.error("Failed to parse local storage", e);
                setVehicles(parseCSV(RAW_VEHICLE_CSV));
            }
        } else {
            setVehicles(parseCSV(RAW_VEHICLE_CSV));
        }
    }, []);

    // 2. Persist Data
    useEffect(() => {
        if (vehicles.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
        }
    }, [vehicles]);

    useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ googleSheetUrl, lastSyncTime }));
    }, [googleSheetUrl, lastSyncTime]);

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

            // Merge logic: Preserve AI content from local storage
            const localMap = new Map();
            vehicles.forEach(v => localMap.set(v.vin, v));

            const mergedVehicles = remoteInventory.map(remoteVehicle => {
                const localMatch = localMap.get(remoteVehicle.vin);
                if (localMatch) {
                    // STRICT SYNC RULE:
                    // If vehicle exists, PRESERVE all local edits (Make, Model, Options, AI Grade, Website Notes, etc.)
                    // ONLY update dynamic fields from the feed: Price, Mileage, Cost, and Internal Comments.
                    return {
                        ...localMatch,
                        retail: remoteVehicle.retail,
                        mileage: remoteVehicle.mileage,
                        cost: remoteVehicle.cost,
                        comments: remoteVehicle.comments,
                        // Update timestamp only if something actually changed? For now, we update it to show it was checked.
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
            if (manual) alert("Failed to sync.");
        } finally {
            setIsSyncing(false);
        }
    }, [googleSheetUrl, vehicles]);

    // 4. Auto Sync Interval
    useEffect(() => {
        if (!googleSheetUrl) return;
        const intervalId = setInterval(() => {
            const now = new Date();
            const currentHour = now.getHours();
            if (currentHour >= 8 && currentHour <= 19) {
                performSmartSync(false);
            }
        }, 60 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [googleSheetUrl, performSmartSync]);


    // --- Filtering Logic ---
    const filteredCars = useMemo(() => {
        return vehicles.filter(car =>
            (car.make?.toLowerCase().includes(filter.toLowerCase()) ||
                car.model?.toLowerCase().includes(filter.toLowerCase()) ||
                car.year?.toString().includes(filter) ||
                car.stockNumber?.toLowerCase().includes(filter.toLowerCase())) &&
            (parseFloat(car.retail || '0') <= priceRange)
        ).sort((a, b) => {
            // Basic sort by price
            return (parseFloat(a.retail) || 0) - (parseFloat(b.retail) || 0);
        });
    }, [vehicles, filter, priceRange]);


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
                            <h1 style={{ marginBottom: '0.5rem' }}>Digital Showroom</h1>
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

                    {/* Filter Controls (Available in both modes, but styled slightly differently if needed) */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        border: '1px solid var(--color-border)',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ flex: '1 1 300px', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input
                                type="text"
                                placeholder="Search Make, Model, or Year..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    border: '1px solid var(--color-border)',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                                Max Price: ${priceRange.toLocaleString()}
                            </label>
                            <input
                                type="range"
                                min="1000"
                                max="100000"
                                step="500"
                                value={priceRange}
                                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                            />
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
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '2.5rem'
                        }}>
                            {filteredCars.length > 0 ? filteredCars.map((car) => (
                                <div key={car.vin} style={{
                                    border: '2px solid var(--color-border)',
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    transition: 'box-shadow 0.2s',
                                    cursor: 'pointer'
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                >
                                    {/* Top: Year Make Model */}
                                    <div style={{
                                        padding: '1rem 1.25rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-secondary)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 style={{
                                                fontSize: '1.25rem',
                                                fontWeight: 700,
                                                margin: 0,
                                                color: 'var(--color-primary)'
                                            }}>
                                                {car.year} {car.make} {car.model}
                                            </h3>
                                            {car.aiGrade && (
                                                <div title={`Rated ${car.aiGrade.overallGrade}`} style={{ backgroundColor: '#2563eb', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Shield size={12} fill="currentColor" /> {car.aiGrade.overallGrade}
                                                </div>
                                            )}
                                        </div>
                                        {car.trim && (
                                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', margin: '0.25rem 0 0' }}>
                                                {car.trim}
                                            </p>
                                        )}
                                    </div>

                                    {/* Middle: Primary Image */}
                                    <Link to={`/vehicle/${car.stockNumber}`} style={{ display: 'block', textDecoration: 'none' }}>
                                        <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                                            {/* Heart Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleGarage(car);
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '0.5rem',
                                                    right: '0.5rem',
                                                    zIndex: 10,
                                                    background: 'rgba(255,255,255,0.9)',
                                                    borderRadius: '50%',
                                                    width: '40px',
                                                    height: '40px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                                    color: isInGarage(car.vin) ? '#ef4444' : '#ccc'
                                                }}
                                                title={isInGarage(car.vin) ? "Remove from Garage" : "Add to Garage"}
                                            >
                                                <Heart fill={isInGarage(car.vin) ? '#ef4444' : 'none'} size={24} />
                                            </button>

                                            {car.imageUrls && car.imageUrls.length > 0 ? (
                                                <img
                                                    src={car.imageUrls[0]}
                                                    alt={`${car.year} ${car.make} ${car.model}`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: '#e2e8f0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <p style={{ color: '#a0aec0', fontWeight: 500 }}>Photo Coming Soon</p>
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Bottom: Price and Mileage */}
                                    <div style={{ padding: '1.25rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '1rem'
                                        }}>
                                            <div>
                                                <p style={{
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    color: 'var(--color-text-light)',
                                                    fontWeight: 600,
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    Price
                                                </p>
                                                <p style={{
                                                    fontSize: '2rem',
                                                    fontWeight: 900,
                                                    color: 'var(--color-primary)',
                                                    margin: 0
                                                }}>
                                                    ${parseFloat(car.retail) > 0 ? parseFloat(car.retail).toLocaleString() : 'Call'}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    color: 'var(--color-text-light)',
                                                    fontWeight: 600,
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    Mileage
                                                </p>
                                                <p style={{
                                                    fontSize: '1.125rem',
                                                    fontWeight: 700,
                                                    color: 'var(--color-dark)',
                                                    margin: 0
                                                }}>
                                                    {parseFloat(car.mileage) > 0 ? parseFloat(car.mileage).toLocaleString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            to={`/vehicle/${car.stockNumber}`}
                                            className="btn btn-primary"
                                            style={{
                                                width: '100%',
                                                padding: '0.875rem',
                                                fontSize: '0.875rem',
                                                fontWeight: 700
                                            }}
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem' }}>
                                    <h3>No "Freedom Machines" found matching those criteria.</h3>
                                    <button onClick={() => { setFilter(''); setPriceRange(50000); }} className="btn btn-outline" style={{ marginTop: '1rem' }}>Clear Filters</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Modal */}
            {editingVehicle && (
                <VehicleEditor
                    vehicle={editingVehicle}
                    onSave={handleSaveVehicle}
                    onClose={() => setEditingVehicle(null)}
                />
            )}

            <footer style={{ backgroundColor: '#1e293b', color: 'white', padding: '3rem 0', marginTop: 'auto' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                        <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Facebook</a>
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Twitter</a>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Instagram</a>
                        <a href="https://youtube.com/playlist?list=PLl7IO3qjXvk6YT6yYeClM1Pn24H0uWGj4&si=fjk0H7RWbmkXIVJL" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>YouTube</a>
                    </div>
                    {/* Dealer Login - Hidden / Discrete */}
                    <div style={{ marginTop: '2rem', opacity: 0.3 }}>
                        {!isAuthenticated ? (
                            <button
                                onClick={handleDealerLogin}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
                            >
                                <Lock size={12} /> Dealer Login
                            </button>
                        ) : (
                            <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>● Authenticated as Manager</span>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default InventoryLive;
