import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertCircle, RefreshCw, Heart, Settings, Shield, Lock } from 'lucide-react';

import { useGarage } from '../context/GarageContext';
import InventoryTable from '../components/AutoGrader/InventoryTable';
import VehicleEditor from '../components/AutoGrader/VehicleEditor';
import { RAW_VEHICLE_CSV } from '../components/AutoGrader/constants';
import '../components/AutoGrader/AutoGrader.css';

// Firebase Imports
import { db, isFirebaseConfigured } from '../apps/ChatBot/services/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

// Default CSV URL provided in the original tool
const DEFAULT_CSV_URL = "https://highlifeauto.com/frazer-inventory-updated.csv";

const parseCSV = (csv) => {
    // Robust CSV Parser that handles quoted commas and newlines correctly
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Regex to match CSV fields: quoted OR non-quoted
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];

        // Simpler Split for well-formed files, but tolerant of internal commas
        // actually, a manual char-by-char parse is safest for "15, Ram" type issues
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, '')); // Push and clean quotes
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, '')); // Last value

        // Map to headers
        const get = (h) => {
            const idx = headers.indexOf(h);
            return (values[idx] || "").trim();
        };

        result.push({
            vin: get("Vehicle Vin"),
            stockNumber: get("Stock Number"),
            make: get("Vehicle Make"),
            model: get("Vehicle Model"),
            trim: get("Vehicle Trim Level"),
            year: get("Vehicle Year"),
            mileage: get("Mileage"),
            retail: get("Retail").replace(/[^0-9.]/g, ''),
            cost: get("Cost"),
            youtubeUrl: get("YouTube URL"),
            imageUrls: get("Image URL") ? get("Image URL").split('|') : [],
            comments: get("Comments"),
            options: get("Option List"),
            type: get("Vehicle Type"),
            engine: get("Engine"),
            transmission: get("Vehicle Transmission Type"),
            exteriorColor: get("Exterior Color"),
            interiorColor: get("Interior Color"),
            marketPrice: get("Market Value")
        });
    }
    return result;
};

const InventoryManager = () => {
    // --- AutoGrader State ---
    const [vehicles, setVehicles] = useState([]);
    const [editingVehicle, setEditingVehicle] = useState(null);

    // --- Firebase & State ---
    const [csvData, setCsvData] = useState([]);
    const [enhancements, setEnhancements] = useState({});

    // Auth & View Mode
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [viewMode, setViewMode] = useState('manager'); // FORCED MANAGER MODE

    const [googleSheetUrl, setGoogleSheetUrl] = useState(DEFAULT_CSV_URL);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // --- Advanced Filtering State ---
    const [filter, setFilter] = useState('');
    const [sortKey, setSortKey] = useState('retail');
    const [sortOrder, setSortOrder] = useState('asc');
    const [maxMileage, setMaxMileage] = useState(250000);

    // Persistence Keys
    const SETTINGS_KEY = 'highlife_settings_v1';

    // Initial Settings Load
    useEffect(() => {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            if (parsed.googleSheetUrl === "https://highlifeauto.com/frazer-inventory-updated.csv") {
                setGoogleSheetUrl(DEFAULT_CSV_URL);
            } else {
                setGoogleSheetUrl(parsed.googleSheetUrl || DEFAULT_CSV_URL);
            }
            setLastSyncTime(parsed.lastSyncTime || null);
        }

        // Staff Auth Check
        if (localStorage.getItem('highlife_staff_auth') === 'true') {
            setIsAuthenticated(true);
        }
        // No redirect logic here, simply wait for auth or show lock screen
    }, []);

    const [dbStatus, setDbStatus] = useState({ status: 'connecting', count: 0, error: null });

    // 1. Firestore Sync (Enhancements)
    useEffect(() => {
        if (!isFirebaseConfigured) {
            console.warn("Firebase not configured - Enhancements will not save remotely.");
            setDbStatus({ status: 'error', error: 'Firebase Config Missing' });
            return;
        }

        const unsubscribe = onSnapshot(collection(db, 'vehicle_enhancements'), (snapshot) => {
            const data = {};
            let count = 0;
            snapshot.forEach(doc => {
                data[doc.id] = doc.data();
                count++;
            });
            setEnhancements(data);
            setDbStatus({ status: 'connected', count, error: null });
        }, (error) => {
            console.error("Firestore sync error:", error);
            setDbStatus({ status: 'error', error: error.message });
        });

        return () => unsubscribe();
    }, []);

    // 2. CSV Sync (Base Inventory)
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

            setCsvData(remoteInventory);
            setLastSyncTime(new Date().toLocaleString());
            if (manual) alert("Inventory Synced! (Enhancements applied automatically)");

        } catch (error) {
            console.error("Sync Error:", error);
            if (manual) alert(`Failed to sync: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    }, [googleSheetUrl]);

    // 3. The Merger
    useEffect(() => {
        let baseList = csvData;
        if (baseList.length === 0) {
            const rawParsed = parseCSV(RAW_VEHICLE_CSV || "");
            if (rawParsed.length > 0) baseList = rawParsed;
        }

        const merged = baseList.map(car => {
            const vin = car.vin ? car.vin.trim().toUpperCase() : 'NO_VIN';
            const enhancement = enhancements[vin];
            if (enhancement) {
                return { ...car, ...enhancement, id: enhancement.id || car.id };
            }
            return car;
        });

        setVehicles(merged);
    }, [csvData, enhancements]);

    // 4. Auto Sync Interval
    useEffect(() => {
        if (!googleSheetUrl) return;
        performSmartSync(false);
        const intervalId = setInterval(() => {
            const currentHour = new Date().getHours();
            if (currentHour >= 8 && currentHour <= 19) performSmartSync(false);
        }, 60 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [googleSheetUrl, performSmartSync]);

    // Save Settings locally
    useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ googleSheetUrl, lastSyncTime }));
    }, [googleSheetUrl, lastSyncTime]);

    // --- Filtering Logic ---
    const filteredCars = useMemo(() => {
        return vehicles.filter(car =>
            (car.make?.toLowerCase().includes(filter.toLowerCase()) ||
                car.model?.toLowerCase().includes(filter.toLowerCase()) ||
                car.year?.toString().includes(filter) ||
                car.stockNumber?.toLowerCase().includes(filter.toLowerCase())) &&
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
    }, [vehicles, filter, maxMileage, sortKey, sortOrder]);

    const handleSortChange = (e) => {
        const [key, order] = e.target.value.split('-');
        setSortKey(key);
        setSortOrder(order);
    };

    const handleSaveVehicle = async (updatedVehicle) => {
        if (!updatedVehicle.vin) {
            alert("Error: Cannot save vehicle without VIN");
            return;
        }

        if (!isFirebaseConfigured) {
            alert("CANNOT SAVE: Firebase API Key is missing. App is in Read-Only Mode.");
            return;
        }

        const vin = updatedVehicle.vin.trim().toUpperCase();

        const enhancementData = {
            vin: vin,
            aiGrade: updatedVehicle.aiGrade,
            marketingDescription: updatedVehicle.marketingDescription,
            blemishes: updatedVehicle.blemishes,
            groundingSources: updatedVehicle.groundingSources,
            websiteNotes: updatedVehicle.websiteNotes,
            retail: updatedVehicle.retail,
            mileage: updatedVehicle.mileage,
            imageUrls: updatedVehicle.imageUrls,
            comments: updatedVehicle.comments,
            options: updatedVehicle.options,
            engine: updatedVehicle.engine,
            transmission: updatedVehicle.transmission,
            exteriorColor: updatedVehicle.exteriorColor,
            interiorColor: updatedVehicle.interiorColor,
            marketPrice: updatedVehicle.marketPrice,
            lastUpdated: Date.now()
        };

        Object.keys(enhancementData).forEach(key => {
            if (enhancementData[key] === undefined) enhancementData[key] = null;
        });

        try {
            console.log("Saving to Firestore:", vin, enhancementData);
            await setDoc(doc(db, 'vehicle_enhancements', vin), enhancementData, { merge: true });

            setVehicles(prevVehicles => prevVehicles.map(v =>
                v.vin === vin ? { ...v, ...enhancementData } : v
            ));

            setEditingVehicle(null);
        } catch (e) {
            console.error("Error saving to Firestore", e);
            alert(`YOUR SAVE FAILED:\n${e.message}\n\nCheck your internet connection or API Keys.`);
        }
    };

    const handleDealerLogin = () => {
        const password = prompt("Enter Dealer Password:");
        if (password === "Highlife8191!") {
            setIsAuthenticated(true);
            localStorage.setItem('highlife_staff_auth', 'true');
        } else {
            alert("Incorrect password.");
        }
    };

    // --- RENDER ---
    return (
        <div className="inventory-manager" style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}> {/* Dark Background for Admin */}
            {!isAuthenticated ? (
                // --- LOGIN SCREEN ---
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'white' }}>
                    <Lock size={64} style={{ marginBottom: '2rem', opacity: 0.5 }} />
                    <h1 style={{ marginBottom: '2rem' }}>Staff Access Only</h1>
                    <button onClick={handleDealerLogin} style={{
                        padding: '1rem 3rem', fontSize: '1.25rem', backgroundColor: '#2563eb', color: 'white',
                        border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold'
                    }}>
                        Enter Password
                    </button>
                    <Link to="/inventory" style={{ marginTop: '2rem', color: '#64748b', textDecoration: 'none' }}>← Back to Public Site</Link>
                </div>
            ) : (
                // --- ADMIN INTERFACE ---
                <section style={{ padding: '2rem' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                        {/* Admin Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem',
                            color: 'white', border: '1px solid #334155'
                        }}>
                            <div>
                                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                                    Inventory Command Center
                                </h1>
                                <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Targeting CSV Feed from Frazer • {vehicles.length} Vehicles Loaded
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => performSmartSync(true)}
                                    style={{
                                        background: '#047857', border: 'none', borderRadius: '0.5rem',
                                        color: 'white', fontWeight: '600', padding: '0.75rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                    disabled={isSyncing}
                                >
                                    <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Force Sync'}
                                </button>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('highlife_staff_auth');
                                        setIsAuthenticated(false);
                                        window.location.reload();
                                    }}
                                    style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>

                        {/* Admin Toolbar */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem',
                            backgroundColor: '#1e293b', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid #334155'
                        }}>
                            {/* Search */}
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="Quick Search (VIN, Stock, Model)..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.75rem 0.75rem 0.75rem 3rem',
                                        backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem',
                                        color: 'white', outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {/* TABLE AREA */}
                        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'hidden' }}>
                            <InventoryTable
                                vehicles={filteredCars}
                                onEdit={setEditingVehicle}
                            />
                        </div>

                    </div>
                </section>
            )}

            {/* AutoGrader Modal Overhaul */}
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

export default InventoryManager;
