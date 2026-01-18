import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertCircle, Heart, Shield } from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { RAW_VEHICLE_CSV } from '../components/AutoGrader/constants';
import '../components/AutoGrader/AutoGrader.css';

// Firebase Imports for LIVE UPDATES
import { db, isFirebaseConfigured } from '../apps/ChatBot/services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// -----------------------------------------------------------------------------
// 1. FAST PARSER (Outcome: Sub-millisecond parsing)
// -----------------------------------------------------------------------------
const parseCSV = (csv = "") => {
    if (!csv) return [];

    // Split by new line
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    // Header Optimization
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const headerMap = new Map();
    headers.forEach((h, i) => headerMap.set(h, i));

    const result = [];
    const len = lines.length;

    for (let i = 1; i < len; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') { inQuotes = !inQuotes; }
            else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));

        const get = (key) => {
            const idx = headerMap.get(key);
            return (values[idx] || "").trim();
        };

        result.push({
            id: get("Vehicle Vin") || get("Stock Number") || `VID-${i}`,
            vin: get("Vehicle Vin"),
            stockNumber: get("Stock Number"),
            make: get("Vehicle Make"),
            model: get("Vehicle Model"),
            trim: get("Vehicle Trim Level"),
            year: get("Vehicle Year"),
            mileage: get("Mileage"),
            retail: parseFloat(get("Retail").replace(/[^0-9.]/g, '')) || 0,
            imageUrls: get("Image URL") ? get("Image URL").split('|') : [],
            type: get("Vehicle Type")
        });
    }
    return result;
};

// -----------------------------------------------------------------------------
// 2. COMPONENT (Outcome: Instant Load + Silent Updating)
// -----------------------------------------------------------------------------
const InventoryLive = () => {
    // A. INSTANT LOAD
    const [baseVehicles, setBaseVehicles] = useState(() => {
        return parseCSV(RAW_VEHICLE_CSV);
    });

    const [enhancements, setEnhancements] = useState({});
    const [soldStates, setSoldStates] = useState({});
    const [filter, setFilter] = useState('');
    const [lastUpdated, setLastUpdated] = useState('Instant');

    // Safe context usage
    const garage = useGarage();
    const { toggleGarage, isInGarage } = garage || { toggleGarage: () => { }, isInGarage: () => false };


    // B. BACKGROUND SYNC
    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const res = await fetch(`/frazer-inventory-updated.csv?t=${Date.now()}`);
                if (res.ok) {
                    const text = await res.text();
                    const freshData = parseCSV(text);
                    if (freshData.length > 0) {
                        setBaseVehicles(freshData);
                        setLastUpdated('Live Feed');
                    }
                }
            } catch (e) {
                console.log("Using backup inventory.");
            }
        };
        checkForUpdates();
    }, []);

    // C. FILTERING
    const filteredVehicles = useMemo(() => {
        if (!filter) return vehicles;
        const lowerFilter = filter.toLowerCase();
        return vehicles.filter(v =>
            (v.make + ' ' + v.model + ' ' + v.year + ' ' + v.stockNumber)
                .toLowerCase().includes(lowerFilter)
        );
    }, [vehicles, filter]);

    return (
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', paddingBottom: '4rem' }}>
            {/* Header / Search */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Inventory</h1>
                        <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 'bold' }}>● {lastUpdated}</span>
                    </div>

                    <input
                        type="text"
                        placeholder="Search specific models..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '1rem' }}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {filteredVehicles.map(car => (
                        <Link to={`/vehicle/${car.stockNumber}`} key={car.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'transform 0.2s', height: '100%' }}>
                                {/* Image Area */}
                                <div style={{ height: '220px', backgroundColor: '#e5e7eb', position: 'relative' }}>
                                    {car.imageUrls[0] ? (
                                        <img src={car.imageUrls[0]} alt={car.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>No Photo</div>
                                    )}
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, background: '#2563eb', color: 'white', fontWeight: 'bold', padding: '0.25rem 0.75rem' }}>
                                        ${car.retail.toLocaleString()}
                                    </div>
                                </div>
                                {/* Details */}
                                <div style={{ padding: '1rem' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: '800', fontSize: '1.1rem' }}>{car.year} {car.make} {car.model}</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', fontSize: '0.9rem' }}>
                                        <span>{car.trim}</span>
                                        <span>{parseInt(car.mileage).toLocaleString()} mi</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                {filteredVehicles.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
                        No vehicles found matching "{filter}"
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryLive;
