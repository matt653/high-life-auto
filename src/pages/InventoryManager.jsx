import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Lock, RefreshCw } from 'lucide-react';
import InventoryTable from '../components/AutoGrader/InventoryTable';
import { RAW_VEHICLE_CSV } from '../components/AutoGrader/constants';
import '../components/AutoGrader/AutoGrader.css';

// -----------------------------------------------------------------------------
// SIMPLE CSV PARSER (Shared logic, could be a util but kept here for stability)
// -----------------------------------------------------------------------------
const parseCSV = (csv = "") => {
    if (!csv) return [];

    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const headerMap = new Map();
    headers.forEach((h, i) => headerMap.set(h, i));

    const result = [];
    for (let i = 1; i < lines.length; i++) {
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
            id: get("Vehicle Vin") || `row-${i}`,
            vin: get("Vehicle Vin"),
            stockNumber: get("Stock Number"),
            year: get("Vehicle Year"),
            make: get("Vehicle Make"),
            model: get("Vehicle Model"),
            trim: get("Vehicle Trim Level"),
            mileage: get("Mileage"),
            retail: get("Retail"),
            cost: get("Cost"),
            imageUrls: get("Image URL") ? get("Image URL").split('|') : [],
            type: get("Vehicle Type")
        });
    }
    return result;
};

const InventoryManager = () => {
    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    const [vehicles, setVehicles] = useState(parseCSV(RAW_VEHICLE_CSV));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [filter, setFilter] = useState('');

    // -------------------------------------------------------------------------
    // AUTH & LOAD
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (sessionStorage.getItem('highlife_staff_auth') === 'true') {
            setIsAuthenticated(true);
        }

        // Fetch latest data on mount
        refreshData();
    }, []);

    const refreshData = () => {
        fetch('/frazer-inventory-updated.csv?t=' + Date.now())
            .then(res => res.text())
            .then(text => {
                const fresh = parseCSV(text);
                if (fresh.length > 0) setVehicles(fresh);
            })
            .catch(e => console.error("Sync failed", e));
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

    // -------------------------------------------------------------------------
    // FILTERING
    // -------------------------------------------------------------------------
    const filteredVehicles = useMemo(() => {
        if (!filter) return vehicles;
        const low = filter.toLowerCase();
        return vehicles.filter(v =>
            (v.make + v.model + v.year + v.stockNumber + v.vin).toLowerCase().includes(low)
        );
    }, [vehicles, filter]);

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    if (!isAuthenticated) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
                <Lock size={64} style={{ marginBottom: '2rem', opacity: 0.5 }} />
                <button onClick={handleDealerLogin} style={{
                    padding: '1rem 3rem', fontSize: '1.25rem', backgroundColor: '#334155', color: 'white',
                    border: '1px solid #475569', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold'
                }}>
                    Enter Password
                </button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '2rem' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', color: 'white', border: '1px solid #334155' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>Rear End</h1>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/inventory" target="_blank" style={{
                            background: '#3b82f6', border: 'none', borderRadius: '0.5rem', color: 'white',
                            fontWeight: '600', padding: '0.75rem 1.5rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <Search size={16} /> Live View
                        </Link>
                        <button onClick={refreshData} style={{
                            background: '#047857', border: 'none', borderRadius: '0.5rem', color: 'white',
                            fontWeight: '600', padding: '0.75rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <RefreshCw size={16} /> Force Sync
                        </button>
                    </div>
                </div>

                {/* Filter */}
                <div style={{ marginBottom: '2rem' }}>
                    <input
                        type="text"
                        placeholder="Quick Search (VIN, Stock, Model)..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: '100%', padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: 'white', fontSize: '16px' }}
                    />
                </div>

                {/* Table */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'hidden' }}>
                    <InventoryTable vehicles={filteredVehicles} />
                </div>

                <div style={{ marginTop: '20px', color: '#64748b', textAlign: 'center' }}>
                    Showing {filteredVehicles.length} vehicles from CSV feed.
                </div>
            </div>
        </div>
    );
};

export default InventoryManager;
