import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertCircle, RefreshCw, Heart, Settings, Shield, Lock, FileUp } from 'lucide-react';

// import { useGarage } from '../context/GarageContext';
import InventoryTable from '../components/AutoGrader/InventoryTable';
import VehicleEditor from '../components/AutoGrader/VehicleEditor';
import { RAW_VEHICLE_CSV } from '../components/AutoGrader/constants';
import '../components/AutoGrader/AutoGrader.css';

// Firebase Imports
import { db, isFirebaseConfigured, storage } from '../apps/ChatBot/services/firebase';
import { collection, onSnapshot, doc, setDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Default CSV URL provided in the original tool
const DEFAULT_CSV_URL = "/frazer-inventory-updated.csv";

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
        // const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];

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
    // --- AutoGrader State ---
    // Optimistic Load: Start with bundled data instantly
    const [vehicles, setVehicles] = useState(() => {
        const raw = parseCSV(RAW_VEHICLE_CSV || "");
        // Basic map to ensure ID exists
        return raw.map(car => ({ ...car, id: car.vin || car.stockNumber }));
    });
    const [editingVehicle, setEditingVehicle] = useState(null);

    // --- Firebase & State ---
    const [csvData, setCsvData] = useState(() => parseCSV(RAW_VEHICLE_CSV || ""));
    const [enhancements, setEnhancements] = useState({});

    // Auth & View Mode
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [viewMode, setViewMode] = useState('grid');


    const [googleSheetUrl, setGoogleSheetUrl] = useState(DEFAULT_CSV_URL);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

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

        // Staff Auth Check - Session Only
        if (sessionStorage.getItem('highlife_staff_auth') === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    // eslint-disable-next-line no-unused-vars
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

    // Handle CSV Upload to Firebase
    const handleCsvUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Read locally to validate
            const text = await file.text();
            const localParsed = parseCSV(text);
            if (localParsed.length === 0) throw new Error("File appears empty or invalid CSV.");

            // 2. Upload to Firebase Storage
            const storageRef = ref(storage, 'inventory/imported_feed.csv');
            await uploadBytes(storageRef, file);
            const publicUrl = await getDownloadURL(storageRef);

            console.log("CSV Uploaded to:", publicUrl);

            // 3. Update Sync URL to point to this new cloud file
            setGoogleSheetUrl(publicUrl);
            setCsvData(localParsed);
            setLastSyncTime(new Date().toLocaleString());

            alert(`✅ Success! Imported ${localParsed.length} vehicles from ${file.name}. \n\nSystem will now use this uploaded file as the primary feed.`);

        } catch (error) {
            console.error("Upload failed:", error);
            alert(`Upload Failed: ${error.message}`);
        } finally {
            setIsUploading(false);
            event.target.value = null; // Reset input
        }
    };

    // 3. The Merger
    // --- Missing Vehicle Reconciliation ---
    const [missingVehicles, setMissingVehicles] = useState([]);

    const checkMissingVehicles = async (currentList) => {
        // 1. Get Snapshot of "Active" vehicles from Firestore
        const snapshotRef = collection(db, 'inventory_state');
        const snapshot = await getDocs(snapshotRef);

        const currentVins = new Set(currentList.map(v => v.vin));
        const missing = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            // If it WAS active, but is NOT in current CSV, it's missing
            if (data.status === 'active' && !currentVins.has(data.vin)) {
                missing.push(data);
            }
        });

        if (missing.length > 0) {
            setMissingVehicles(missing);
        }

        // 2. Upsert Current Inventory as "Active"
        // This ensures checking against the latest state next time
        currentList.forEach(vehicle => {
            if (vehicle.vin && vehicle.vin !== 'NO_VIN') {
                const vRef = doc(db, 'inventory_state', vehicle.vin);
                // We only update if necessary, but setDoc with merge is fine/cheap enough here
                setDoc(vRef, {
                    vin: vehicle.vin,
                    status: 'active',
                    lastSeen: Date.now(),
                    // Store details for "Sold" display
                    year: vehicle.year || '',
                    make: vehicle.make || '',
                    model: vehicle.model || '',
                    trim: vehicle.trim || '',
                    imageUrls: vehicle.imageUrls || [],
                    retail: vehicle.retail || '',
                    stockNumber: vehicle.stockNumber || ''
                }, { merge: true });
            }
        });
    };

    const handleMarkSold = async (vin) => {
        try {
            await setDoc(doc(db, 'inventory_state', vin), {
                status: 'sold',
                soldAt: Date.now()
            }, { merge: true });

            // Remove from local missing list
            setMissingVehicles(prev => prev.filter(v => v.vin !== vin));
        } catch (e) {
            console.error("Error marking sold:", e);
        }
    };

    const handleRemovePermanent = async (vin) => {
        try {
            // Option A: Delete entirely
            // await deleteDoc(doc(db, 'inventory_state', vin));

            // Option B: Mark removed (history)
            await setDoc(doc(db, 'inventory_state', vin), {
                status: 'removed',
                removedAt: Date.now()
            }, { merge: true });

            setMissingVehicles(prev => prev.filter(v => v.vin !== vin));
        } catch (e) {
            console.error("Error removing:", e);
        }
    };

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

        // Trigger Reconciliation (Check for missing cars) after merge
        if (merged.length > 0 && isFirebaseConfigured) {
            checkMissingVehicles(merged);
        }
    }, [csvData, enhancements]);


    const checkMissingVehicles_OLD = async (currentList) => {
        // 1. Get Snapshot of "Active" vehicles from Firestore
        const snapshotRef = collection(db, 'inventory_state');
        const snapshot = await getDocs(snapshotRef);

        const currentVins = new Set(currentList.map(v => v.vin));
        const missing = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            // If it WAS active, but is NOT in current CSV, it's missing
            if (data.status === 'active' && !currentVins.has(data.vin)) {
                missing.push(data);
            }
        });

        if (missing.length > 0) {
            setMissingVehicles(missing);
        }

        // 2. Upsert Current Inventory as "Active"
        // This ensures checking against the latest state next time
        currentList.forEach(vehicle => {
            if (vehicle.vin && vehicle.vin !== 'NO_VIN') {
                const vRef = doc(db, 'inventory_state', vehicle.vin);
                // We only update if necessary, but setDoc with merge is fine/cheap enough here
                setDoc(vRef, {
                    vin: vehicle.vin,
                    status: 'active',
                    lastSeen: Date.now(),
                    // Store details for "Sold" display
                    year: vehicle.year || '',
                    make: vehicle.make || '',
                    model: vehicle.model || '',
                    trim: vehicle.trim || '',
                    imageUrls: vehicle.imageUrls || [],
                    retail: vehicle.retail || '',
                    stockNumber: vehicle.stockNumber || ''
                }, { merge: true });
            }
        });
    };

    const handleMarkSold_OLD = async (vin) => {
        try {
            await setDoc(doc(db, 'inventory_state', vin), {
                status: 'sold',
                soldAt: Date.now()
            }, { merge: true });

            // Remove from local missing list
            setMissingVehicles(prev => prev.filter(v => v.vin !== vin));
        } catch (e) {
            console.error("Error marking sold:", e);
        }
    };

    const handleRemovePermanent_OLD = async (vin) => {
        try {
            // Option A: Delete entirely
            // await deleteDoc(doc(db, 'inventory_state', vin));

            // Option B: Mark removed (history)
            await setDoc(doc(db, 'inventory_state', vin), {
                status: 'removed',
                removedAt: Date.now()
            }, { merge: true });

            setMissingVehicles(prev => prev.filter(v => v.vin !== vin));
        } catch (e) {
            console.error("Error removing:", e);
        }
    };

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

        // MERGE STRATEGY: We explicitly save ALL editable fields to Firestore
        // so they override the CSV feed on the frontend.
        const enhancementData = {
            vin: vin, // Key
            // AI Data
            aiGrade: updatedVehicle.aiGrade,
            marketingDescription: updatedVehicle.marketingDescription,
            blemishes: updatedVehicle.blemishes,
            groundingSources: updatedVehicle.groundingSources,
            // Manual Edits
            stockNumber: updatedVehicle.stockNumber,
            year: updatedVehicle.year,
            make: updatedVehicle.make,
            model: updatedVehicle.model,
            trim: updatedVehicle.trim,
            retail: updatedVehicle.retail,
            mileage: updatedVehicle.mileage,
            imageUrls: updatedVehicle.imageUrls,
            comments: updatedVehicle.comments,
            websiteNotes: updatedVehicle.websiteNotes,
            options: updatedVehicle.options,
            engine: updatedVehicle.engine,
            transmission: updatedVehicle.transmission,
            exteriorColor: updatedVehicle.exteriorColor,
            interiorColor: updatedVehicle.interiorColor,
            marketPrice: updatedVehicle.marketPrice,
            // Meta
            lastUpdated: Date.now()
        };

        // Sanitize undefined -> null for Firestore
        Object.keys(enhancementData).forEach(key => {
            if (enhancementData[key] === undefined) enhancementData[key] = null;
        });

        try {
            console.log("Saving to Firestore:", vin, enhancementData);
            await setDoc(doc(db, 'vehicle_enhancements', vin), enhancementData, { merge: true });

            // Optimistic Update
            setVehicles(prevVehicles => prevVehicles.map(v =>
                v.vin === vin ? { ...v, ...enhancementData } : v
            ));

            setEditingVehicle(null);
            alert("✅ SUCCESS: Vehicle Data Saved to Cloud!");
        } catch (e) {
            console.error("Error saving to Firestore", e);
            alert(`YOUR SAVE FAILED:\n${e.message}\n\nCheck your internet connection or API Keys.`);
        }
    };

    const handleDealerLogin = () => {
        const password = prompt("Enter Dealer Password:");
        if (password === "Highlife8191!") {
            setIsAuthenticated(true);
            sessionStorage.setItem('highlife_staff_auth', 'true');
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
                    <button onClick={handleDealerLogin} style={{
                        padding: '1rem 3rem', fontSize: '1.25rem', backgroundColor: '#334155', color: 'white',
                        border: '1px solid #475569', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold'
                    }}>
                        Enter Password
                    </button>
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
                                    Rear End
                                </h1>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Link to="/inventory" target="_blank" style={{
                                    background: '#3b82f6', border: 'none', borderRadius: '0.5rem',
                                    color: 'white', fontWeight: '600', padding: '0.75rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    textDecoration: 'none'
                                }}>
                                    <Search size={16} /> Live View
                                </Link>

                                <label
                                    style={{
                                        background: '#ea580c', border: 'none', borderRadius: '0.5rem',
                                        color: 'white', fontWeight: '600', padding: '0.75rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <FileUp size={16} /> {isUploading ? 'Uploading...' : 'Import CSV'}
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCsvUpload}
                                        style={{ display: 'none' }}
                                        disabled={isUploading}
                                    />
                                </label>

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
                                        sessionStorage.removeItem('highlife_staff_auth');
                                        setIsAuthenticated(false);
                                        window.location.reload();
                                    }}
                                    style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>

                        {!isFirebaseConfigured && (
                            <div style={{ backgroundColor: '#ef4444', color: 'white', padding: '1rem', marginBottom: '2rem', borderRadius: '0.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={24} />
                                <div>
                                    DATABASE DISCONNECTED: Firebase API Keys are missing or invalid.
                                    <div style={{ fontSize: '0.85rem', fontWeight: 'normal', opacity: 0.9 }}>AI grades and edits will NOT be saved. Please check your .env file or deployment settings.</div>
                                </div>
                            </div>
                        )}

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

            {/* MISSING VEHICLES PROMPT */}
            {missingVehicles.length > 0 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#1e293b', padding: '2rem', borderRadius: '1rem',
                        maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
                        border: '1px solid #475569', color: 'white'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: '#f59e0b' }}>
                            <AlertCircle size={32} />
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Inventory Update Detected</h2>
                        </div>
                        <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>
                            The following vehicles have been removed from the CSV feed.
                            Please confirm their status to update the website accordingly.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {missingVehicles.map(vehicle => (
                                <div key={vehicle.vin} style={{
                                    backgroundColor: '#0f172a', padding: '1rem', borderRadius: '0.5rem',
                                    border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '1rem'
                                }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {vehicle.imageUrls && vehicle.imageUrls[0] && (
                                            <img src={vehicle.imageUrls[0]} alt="" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{vehicle.year} {vehicle.make} {vehicle.model}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Stock: {vehicle.stockNumber} • VIN: {vehicle.vin}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            onClick={() => handleMarkSold(vehicle.vin)}
                                            style={{
                                                flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
                                                backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer'
                                            }}
                                        >
                                            Did this Sell? (Mark Sold)
                                        </button>
                                        <button
                                            onClick={() => handleRemovePermanent(vehicle.vin)}
                                            style={{
                                                flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ef4444',
                                                backgroundColor: 'transparent', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer'
                                            }}
                                        >
                                            Remove Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button
                                onClick={() => setMissingVehicles([])}
                                style={{
                                    color: '#64748b', background: 'none', border: 'none',
                                    textDecoration: 'underline', cursor: 'pointer'
                                }}
                            >
                                Remind me later (Dismiss)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManager;
