import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Play } from 'lucide-react';
import { RAW_VEHICLE_CSV } from '../components/AutoGrader/constants';

// -----------------------------------------------------------------------------
// HELPER: Simple CSV Parser (Same as InventoryLive)
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
            retail: get("Retail").replace(/[^0-9.]/g, ''),
            imageUrls: get("Image URL") ? get("Image URL").split('|') : [],
            engine: get("Engine"),
            transmission: get("Vehicle Transmission Type"),
            exteriorColor: get("Exterior Color"),
            youtubeUrl: get("YouTube URL"),
            options: get("Option List"),
            comments: get("Comments")
        });
    }
    return result;
};

// -----------------------------------------------------------------------------
// HELPER: YouTube URL Parser
// -----------------------------------------------------------------------------
const getEmbedUrl = (url) => {
    if (!url) return null;
    try {
        let videoId = null;
        if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];

        if (videoId) return `https://www.youtube.com/embed/${videoId}?rel=0`;
    } catch (e) {
        console.error("Youtube Parse Error", e);
    }
    return null;
};

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------
const VehicleDetailLive = () => {
    const { id } = useParams(); // Start with Stock Number
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Try Bundled Data Immediately
        const bundled = parseCSV(RAW_VEHICLE_CSV);
        let found = bundled.find(v => v.stockNumber === id);
        if (found) setCar(found);

        // 2. Try Fetching Fresh Data
        fetch('/frazer-inventory-updated.csv?t=' + Date.now())
            .then(res => res.text())
            .then(text => {
                const fresh = parseCSV(text);
                const freshFound = fresh.find(v => v.stockNumber === id);
                if (freshFound) {
                    setCar(freshFound);
                } else if (!found) {
                    // ID not found in either
                    setCar(null);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch failed", err);
                setLoading(false);
            });
    }, [id]);

    if (loading && !car) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
    if (!car) return <div style={{ padding: '50px', textAlign: 'center' }}><h2>Vehicle Not Found</h2><Link to="/inventory">Back to Inventory</Link></div>;

    const price = parseFloat(car.retail) || 0;
    const embedUrl = getEmbedUrl(car.youtubeUrl);

    return (
        <div style={{ backgroundColor: 'white', minHeight: '100vh' }}>
            {/* Nav */}
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
                <Link to="/inventory" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
                    <ChevronLeft size={20} /> Back to Inventory
                </Link>
            </div>

            <div className="container" style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>

                {/* LEFT: MEDIA */}
                <div>
                    {car.imageUrls[0] ? (
                        <div style={{ marginBottom: '20px' }}>
                            <img src={car.imageUrls[0]} alt="Main" style={{ width: '100%', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                        </div>
                    ) : <div style={{ height: '300px', background: '#eee', borderRadius: '10px' }} />}

                    {/* Thumbnails */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                        {car.imageUrls.slice(1, 5).map((url, i) => (
                            <img key={i} src={url} alt="Thumbnail" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '5px', cursor: 'pointer' }} />
                        ))}
                    </div>

                    {/* Video */}
                    {embedUrl && (
                        <div style={{ marginTop: '30px', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: '#000', color: 'white', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Play size={20} /> <span style={{ fontWeight: 'bold' }}>Video Tour</span>
                            </div>
                            <iframe
                                src={embedUrl}
                                title="Car Video"
                                style={{ width: '100%', aspectRatio: '16/9', border: 'none' }}
                                allowFullScreen
                            />
                        </div>
                    )}
                </div>

                {/* RIGHT: DETAILS */}
                <div>
                    <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0' }}>{car.year} {car.make} {car.model}</h1>
                    <p style={{ fontSize: '1.2rem', color: '#666', margin: '0 0 20px 0' }}>It's the {car.trim} Edition!</p>

                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a', marginBottom: '20px' }}>
                        {price > 0 ? `$${price.toLocaleString()}` : "Call for Price"}
                    </div>

                    <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div><strong>Mileage:</strong> {car.mileage || 'N/A'}</div>
                            <div><strong>VIN:</strong> {car.vin || 'N/A'}</div>
                            <div><strong>Stock #:</strong> {car.stockNumber || 'N/A'}</div>
                            <div><strong>Engine:</strong> {car.engine || 'N/A'}</div>
                            <div><strong>Trans:</strong> {car.transmission || 'N/A'}</div>
                            <div><strong>Color:</strong> {car.exteriorColor || 'N/A'}</div>
                        </div>
                    </div>

                    {car.comments && (
                        <div style={{ marginBottom: '30px' }}>
                            <h3>Seller's Notes</h3>
                            <p style={{ lineHeight: '1.6', color: '#444' }}>{car.comments}</p>
                        </div>
                    )}

                    {car.options && (
                        <div>
                            <h3>Options</h3>
                            <p style={{ fontSize: '0.9rem', color: '#555' }}>{car.options.replace(/\|/g, ', ')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VehicleDetailLive;
