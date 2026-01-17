import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertCircle, Heart, Shield } from 'lucide-react';

import { useGarage } from '../context/GarageContext';
import InventoryTable from '../components/AutoGrader/InventoryTable';
import VehicleEditor from '../components/AutoGrader/VehicleEditor';
import { RAW_VEHICLE_CSV } from '../components/AutoGrader/constants';
import '../components/AutoGrader/AutoGrader.css';

// Firebase Imports
import { db, isFirebaseConfigured } from '../apps/ChatBot/services/firebase';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';

// Default CSV URL provided in the original tool
const DEFAULT_CSV_URL = "/frazer-inventory-updated.csv";

// Helper functions for safe number parsing
const safeFloat = (v) => {
    if (typeof v === 'number') return v;
    return parseFloat(String(v || '0').replace(/[^0-9.-]/g, '')) || 0;
};

const safeInt = (v) => {
    if (typeof v === 'number') return v;
    return parseInt(String(v || '0').replace(/\D/g, '')) || 0;
};

const parseCSV = (csv) => {
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const headerMap = {};
    headers.forEach((h, i) => { headerMap[h] = i; });

    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));

        const get = (h) => {
            const idx = headerMap[h];
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

const InventoryLive = () => {
    // --- State ---
    const [vehicles, setVehicles] = useState([]);
    const [editingVehicle, setEditingVehicle] = useState(null); // Keep for consistency if needed
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Data Sources
    const [csvData, setCsvData] = useState([]);
    const [enhancements, setEnhancements] = useState({});
    const [soldVehicles, setSoldVehicles] = useState([]);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [dbStatus, setDbStatus] = useState({ status: 'connecting', count: 0, error: null });

    // Filtering & Sorting
    const [filter, setFilter] = useState('');
    const [priceRange, setPriceRange] = useState(50000);
    const [maxMileage, setMaxMileage] = useState(300000);
    const [sortKey, setSortKey] = useState('retail');
    const [sortOrder, setSortOrder] = useState('asc');

    // Context Safety
    const garageContext = useGarage();
    const { toggleGarage, isInGarage } = garageContext || { toggleGarage: () => { }, isInGarage: () => false };

    // --- Effects ---

    // 1. Load Settings & Auth
    useEffect(() => {
        const savedSettings = localStorage.getItem('highlife_settings_v1');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setLastSyncTime(parsed.lastSyncTime || null);
            } catch (e) {
                console.error("Settings parse error", e);
            }
        }
        if (sessionStorage.getItem('highlife_staff_auth') === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    // 2. Firestore Sync (Enhancements)
    useEffect(() => {
        if (!isFirebaseConfigured) {
            setDbStatus({ status: 'error', error: 'Firebase Config Missing' });
            return;
        }

        const unsubscribe = onSnapshot(collection(db, 'vehicle_enhancements'), (snapshot) => {
            const data = {};
            snapshot.forEach(doc => {
                data[doc.id] = doc.data();
            });
            setEnhancements(data);
            setDbStatus({ status: 'connected', count: Object.keys(data).length, error: null });
        }, (error) => {
            console.error("Firestore sync error:", error);
            setDbStatus({ status: 'error', error: error.message });
        });

        return () => unsubscribe();
    }, []);

    // 3. Sync CSV Data
    const performSmartSync = useCallback(async () => {
        setIsSyncing(true);
        try {
            const response = await fetch(`${DEFAULT_CSV_URL}?t=${Date.now()}`);
            if (!response.ok) throw new Error("Failed to fetch CSV");
            const text = await response.text();
            const parsed = parseCSV(text);
            if (parsed && parsed.length > 0) {
                setCsvData(parsed);
                setLastSyncTime(new Date().toLocaleString());
            } else {
                console.warn("Parsed CSV Empty, using fallback");
                setCsvData(parseCSV(RAW_VEHICLE_CSV || ""));
            }
        } catch (error) {
            console.error("Sync failed", error);
            // Fallback
            setCsvData(parseCSV(RAW_VEHICLE_CSV || ""));
        } finally {
            setIsSyncing(false);
        }
    }, []);

    // Initial Sync
    useEffect(() => {
        performSmartSync();
    }, [performSmartSync]);

    // 4. Sold Vehicles Sync
    useEffect(() => {
        if (!isFirebaseConfigured) return;
        const q = query(collection(db, 'inventory_state'), where('status', '==', 'sold'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sold = [];
            const now = Date.now();
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.soldAt && (now - data.soldAt < 172800000)) { // 48 hours
                    sold.push({ ...data, isSold: true, id: data.vin });
                }
            });
            setSoldVehicles(sold);
        });
        return () => unsubscribe();
    }, []);

    // 5. Merge Data
    useEffect(() => {
        if (csvData.length === 0) return;

        const merged = csvData.map(car => {
            const vin = car.vin ? car.vin.trim().toUpperCase() : 'NO_VIN';
            const enhancement = enhancements[vin];
            if (enhancement) {
                return {
                    ...car,
                    ...enhancement,
                    // Restore key fields to prevent overwrites
                    retail: car.retail,
                    mileage: car.mileage,
                    id: enhancement.id || car.vin || car.stockNumber // Ensure ID
                };
            }
            return { ...car, id: car.vin || car.stockNumber }; // Ensure ID
        });

        setVehicles([...merged, ...soldVehicles]);
    }, [csvData, enhancements, soldVehicles]);

    // 6. Filtering
    const filteredCars = useMemo(() => {
        return vehicles.filter(car => {
            const searchMatch = !filter ||
                (car.make || '').toLowerCase().includes(filter.toLowerCase()) ||
                (car.model || '').toLowerCase().includes(filter.toLowerCase()) ||
                (car.year || '').toString().includes(filter) ||
                (car.stockNumber || '').toLowerCase().includes(filter.toLowerCase());

            const priceMatch = safeFloat(car.retail) <= priceRange;
            const mileMatch = safeInt(car.mileage) <= maxMileage;

            return searchMatch && priceMatch && mileMatch;
        }).sort((a, b) => {
            if (sortKey === 'retail') return sortOrder === 'asc' ? safeFloat(a.retail) - safeFloat(b.retail) : safeFloat(b.retail) - safeFloat(a.retail);
            if (sortKey === 'mileage') return sortOrder === 'asc' ? safeInt(a.mileage) - safeInt(b.mileage) : safeInt(b.mileage) - safeInt(a.mileage);
            if (sortKey === 'year') return sortOrder === 'asc' ? parseInt(a.year) - parseInt(b.year) : parseInt(b.year) - parseInt(a.year);
            return 0;
        });
    }, [vehicles, filter, priceRange, maxMileage, sortKey, sortOrder]);

    const handleSortChange = (e) => {
        const [key, order] = e.target.value.split('-');
        setSortKey(key);
        setSortOrder(order);
    };

    const handleDealerLogin = () => {
        const password = prompt("Enter Dealer Password:");
        if (password === "Highlife8191!") {
            setIsAuthenticated(true);
            sessionStorage.setItem('highlife_staff_auth', 'true');
            alert("Authenticated.");
        } else {
            alert("Incorrect password.");
        }
    };

    return (
        <div className="inventory-page">
            <section style={{ backgroundColor: '#f9f9f9', padding: '3rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <div className="container">
                    {/* Header */}
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ marginBottom: '0.5rem' }}>Digital Showroom</h1>
                            <p style={{ fontSize: '0.875rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={16} color="var(--color-accent)" />
                                Live Inventory
                                {lastSyncTime && ` • Synced: ${lastSyncTime}`}
                            </p>
                        </div>
                        <button onClick={handleDealerLogin} style={{ opacity: 0.3, fontSize: '0.7rem', border: 'none', background: 'none', cursor: 'pointer' }}>
                            Start Engine
                        </button>
                    </div>

                    {/* Filters */}
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
                        <div style={{ position: 'relative' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>Search</label>
                            <input
                                type="text"
                                placeholder="Make, Model, VIN..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    outline: 'none',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Max Price</span>
                                <span style={{ color: 'var(--color-primary)' }}>${priceRange.toLocaleString()}</span>
                            </label>
                            <input
                                type="range"
                                min="1000"
                                max="100000"
                                step="1000"
                                value={priceRange}
                                onChange={(e) => setPriceRange(parseInt(e.target.value) || 50000)}
                                style={{ width: '100%', accentColor: 'var(--color-primary)', height: '2rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>Sort</label>
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
                            </select>
                        </div>
                    </div>

                    {/* Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem',
                        padding: '1rem 0'
                    }}>
                        {filteredCars.map((car) => (
                            <Link
                                to={car.isSold ? '#' : `/vehicle/${car.stockNumber}`}
                                key={car.id || car.vin || car.stockNumber}
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    cursor: car.isSold ? 'default' : 'pointer',
                                    opacity: car.isSold ? 0.8 : 1,
                                    pointerEvents: car.isSold ? 'none' : 'auto'
                                }}
                            >
                                <div style={{
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    position: 'relative',
                                    borderRadius: '0.5rem'
                                }}>
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
                                            ${safeFloat(car.retail).toLocaleString()}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (car.id || car.stockNumber) toggleGarage(car);
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
                                                color: isInGarage(car.id || car.stockNumber) ? '#ef4444' : '#ccc'
                                            }}
                                        >
                                            <Heart size={20} fill={isInGarage(car.id || car.stockNumber) ? '#ef4444' : 'none'} />
                                        </button>
                                    </div>
                                    <div style={{ padding: '1.5rem' }}>
                                        <div style={{ color: '#666', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                            {car.year}
                                        </div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--color-text)' }}>
                                            {car.make} {car.model} {car.trim}
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#888', marginBottom: '1rem' }}>
                                            <span>{safeInt(car.mileage).toLocaleString()} miles</span>
                                            <span>•</span>
                                            <span>Stock #{car.stockNumber}</span>
                                        </div>
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
                                                fontWeight: 800
                                            }}>
                                                <Shield size={12} fill={car.aiGrade.overallGrade ? "#166534" : "#ccc"} />
                                                {car.aiGrade.overallGrade ? `Grade: ${car.aiGrade.overallGrade}` : 'Graded'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default InventoryLive;
