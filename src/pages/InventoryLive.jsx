import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RAW_VEHICLE_CSV } from '../components/AutoGrader/constants';
import '../components/AutoGrader/AutoGrader.css';

// -----------------------------------------------------------------------------
// SIMPLE CSV PARSER
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

        // Simple split logic that respects quotes
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
            imageUrls: get("Image URL") ? get("Image URL").split('|') : []
        });
    }
    return result;
};

// -----------------------------------------------------------------------------
// SIMPLE COMPONENT
// -----------------------------------------------------------------------------
const InventoryLive = () => {
    // Start with the embedded data so SOMETHING always shows
    const [vehicles, setVehicles] = useState(parseCSV(RAW_VEHICLE_CSV));
    const [filter, setFilter] = useState('');

    useEffect(() => {
        // Fetch the latest file from the server
        fetch('/frazer-inventory-updated.csv?t=' + Date.now())
            .then(res => res.text())
            .then(text => {
                const fresh = parseCSV(text);
                if (fresh.length > 0) {
                    setVehicles(fresh);
                }
            })
            .catch(err => console.error("Could not load live inventory, sticking to backup.", err));
    }, []);

    // Simple Filter
    const displayVehicles = vehicles.filter(v => {
        if (!filter) return true;
        const text = `${v.year} ${v.make} ${v.model} ${v.stockNumber}`.toLowerCase();
        return text.includes(filter.toLowerCase());
    });

    return (
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', paddingBottom: '50px' }}>
            {/* Header */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderBottom: '1px solid #ddd' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h1 style={{ margin: '0 0 10px 0' }}>Inventory</h1>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="container" style={{ maxWidth: '1200px', margin: '20px auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', padding: '0 20px' }}>
                {displayVehicles.map(car => (
                    <Link to={`/vehicle/${car.stockNumber}`} key={car.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                            {/* Main Image */}
                            <div style={{ height: '220px', backgroundColor: '#eee' }}>
                                {car.imageUrls[0] && (
                                    <img src={car.imageUrls[0]} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                            </div>

                            {/* Info */}
                            <div style={{ padding: '15px' }}>
                                <h3 style={{ margin: '0 0 5px 0' }}>{car.year} {car.make} {car.model}</h3>
                                <p style={{ margin: '0', color: '#666' }}>{car.trim}</p>
                                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                    <span>{Number(car.retail).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('.00', '')}</span>
                                    <span>{car.mileage} miles</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default InventoryLive;
