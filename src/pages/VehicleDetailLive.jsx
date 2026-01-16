import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Info, Play, AlertTriangle, Heart, AlertCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../apps/ChatBot/services/firebase';

import { useGarage } from '../context/GarageContext';

const DEFAULT_CSV_URL = "/frazer-inventory-updated.csv";

const parseCSV = (csv) => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    return lines.slice(1).filter(line => line.trim() !== '').map(line => {
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
            retail: get("Retail").replace(/[^0-9.]/g, ''),
            cost: get("Cost"),
            youtubeUrl: get("YouTube URL"),
            imageUrls: get("Image URL").split('|'),
            comments: get("Comments"),
            options: get("Option List"),
            type: get("Vehicle Type"),
            // Added Spec Fields
            engine: get("Engine"),
            transmission: get("Vehicle Transmission Type"),
            exteriorColor: get("Exterior Color"),
            interiorColor: get("Interior Color"),
            marketPrice: get("Market Value"),
            // Try to recover potential AI fields even if fresh fetch
            marketingDescription: get("marketingDescription"),
            websiteNotes: get("websiteNotes")
        };
    });
};

const VehicleDetailLive = () => {
    const { id } = useParams(); // 'id' here corresponds to the Stock Number
    const location = useLocation();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);

    // Safety check for context
    const garageContext = useGarage();
    const toggleGarage = garageContext?.toggleGarage || (() => console.warn('Garage Context missing'));
    const isInGarage = garageContext?.isInGarage || (() => false);

    useEffect(() => {
        window.scrollTo(0, 0);

        // Safety Timeout to prevent infinite loading
        const safetyTimer = setTimeout(() => {
            setLoading(prev => {
                if (prev) {
                    console.warn("Vehicle Load Timed Out - Forcing Render");
                    return false;
                }
                return prev;
            });
        }, 5000);

        loadVehicle().then(() => clearTimeout(safetyTimer));

        return () => clearTimeout(safetyTimer);
    }, [id]); // Removed loadVehicle from deps to prevent loop

    const loadVehicle = async () => {
        setLoading(true);
        try {
            // Strategy 0: Check Router State (Instant Load)
            if (location.state?.vehicle && location.state.vehicle.stockNumber === id) {
                console.log("Loading from Router State");
                let foundCar = location.state.vehicle;
                setCar({
                    ...foundCar,
                    id: foundCar.stockNumber,
                    photos: foundCar.imageUrls || [],
                    youtubeVideoUrl: foundCar.youtubeUrl,
                    story: foundCar.marketingDescription || foundCar.comments || "No description available.",
                    price: parseFloat(foundCar.retail) || 0,
                });
                setLoading(false);
                return;
            }

            // Strategy 1: Data from Inventory (if available)
            const STORAGE_KEY = 'highlife_inventory_v1';
            let vehicles = [];
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) vehicles = JSON.parse(savedData);

            // Strategy 2: Fetch CSV if needed
            if (!vehicles.length) {
                try {
                    const response = await fetch(DEFAULT_CSV_URL);
                    const csvText = await response.text();
                    vehicles = parseCSV(csvText);
                } catch (e) { console.error("CSV Fetch Error", e); }
            }

            // Find car
            let foundCar = vehicles.find(v => v.stockNumber === id);

            if (foundCar) {
                // FETCH LIVE DATA FROM FIRESTORE (Crucial Step!)
                // This ensures we get the latest Grade/Story even if not in CSV/Local Storage
                if (foundCar.vin) {
                    try {
                        const docRef = doc(db, 'vehicle_enhancements', foundCar.vin);
                        const docSnap = await getDoc(docRef);

                        if (docSnap.exists()) {
                            const liveData = docSnap.data();
                            console.log("Found Live Firestore Data:", liveData);

                            // Merge Live Data
                            foundCar = {
                                ...foundCar,
                                // MERGE STRATEGY: Backend trumps CSV *EXCEPT* for protected fields
                                ...liveData,

                                // RESTORE PROTECTED CSV FIELDS (User Requirement)
                                // "Backend should trump the csv file except for price, stock number, year, make, vin, and description"
                                retail: foundCar.retail,           // Price
                                stockNumber: foundCar.stockNumber, // Stock
                                year: foundCar.year,               // Year
                                make: foundCar.make,               // Make
                                vin: foundCar.vin,                 // VIN
                                comments: foundCar.comments,       // Description 
                                model: foundCar.model,             // Model (Safe to protect)

                                // Keep Backend fields if they exist
                                marketingDescription: liveData.marketingDescription || foundCar.marketingDescription,
                                blemishes: liveData.blemishes || foundCar.blemishes,
                                websiteNotes: liveData.websiteNotes || foundCar.websiteNotes,
                                marketPrice: liveData.marketPrice || foundCar.marketPrice,
                                imageUrls: liveData.imageUrls || foundCar.imageUrls,
                                // Note: Mileage is NOT protected by user rule, so Backend wins (liveData.mileage)
                                mileage: liveData.mileage || foundCar.mileage,
                                youtubeUrl: liveData.youtubeUrl || foundCar.youtubeUrl
                            };
                        }
                    } catch (err) {
                        console.error("Firestore Fetch Error in Detail View:", err);
                    }
                }

                setCar({
                    ...foundCar,
                    id: foundCar.stockNumber,
                    photos: foundCar.imageUrls || [],
                    youtubeVideoUrl: foundCar.youtubeUrl,
                    story: foundCar.marketingDescription || foundCar.comments || "No description available.",
                    price: parseFloat(foundCar.retail) || 0,
                });

            } else {
                console.log("Vehicle not found in data");
                setCar(null);
            }
        } catch (error) {
            console.error('Error loading vehicle:', error);
            setCar(null);
        } finally {
            setLoading(false);
        }
    };

    const getEmbedUrl = (url) => {
        if (!url) return null;
        let videoId = null;
        try {
            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('v=')) {
                videoId = url.split('v=')[1].split('&')[0];
            } else if (url.includes('embed/')) {
                return url; // Already an embed link
            } else if (url.includes('youtube.com/watch')) // Handle standard watch URL
            {
                const urlObj = new URL(url);
                videoId = urlObj.searchParams.get("v");
            }

            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?rel=0`;
            }
        } catch (e) {
            console.error("Error parsing YouTube URL", e);
        }
        return url; // Fallback
    };


    if (loading) {
        return (
            <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
                <p>Loading vehicle details...</p>
            </div>
        );
    }

    if (!car) {
        return (
            <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
                <h2>Vehicle not found</h2>
                <p>This car might have been sold or the inventory hasn't synced yet.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                    <Link to="/inventory" className="btn btn-outline">
                        Back to Showroom
                    </Link>
                    <button
                        onClick={() => {
                            localStorage.removeItem('highlife_inventory_v1');
                            window.location.reload();
                        }}
                        className="btn btn-primary"
                    >
                        ↻ Force Refresh Data
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="vehicle-detail">
            <div style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid var(--color-border)' }}>
                <div className="container" style={{ padding: '1rem 1.5rem' }}>
                    <Link to="/inventory" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <ChevronLeft size={20} /> Back to Showroom
                    </Link>
                </div>
            </div>

            <section style={{ padding: '2rem 0' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                        {/* Left: Photos & Video */}
                        <div>
                            {car.photos && car.photos.length > 0 ? (
                                <>
                                    <div style={{ marginBottom: '1rem', border: '5px solid black' }}>
                                        <img src={car.photos[0]} alt={car.make} style={{ width: '100%', display: 'block' }} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                        {car.photos.slice(1, 5).map((photo, i) => (
                                            <img key={i} src={photo} alt="Car aspect" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div style={{ backgroundColor: '#ddd', padding: '5rem 2rem', marginBottom: '2rem', textAlign: 'center' }}>
                                    <p style={{ color: '#999' }}>Photos coming soon</p>
                                </div>
                            )}

                            {/* Video Section or Blemish Highlight */}
                            {car.youtubeVideoUrl && car.youtubeVideoUrl.length > 5 ? (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ backgroundColor: '#000', padding: '1rem 1rem 0.5rem', color: 'white' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <Play size={20} />
                                            <h3 style={{ fontSize: '1rem', margin: 0 }}>Miriam's Test Drive Video</h3>
                                        </div>
                                        <p style={{ opacity: 0.7, fontSize: '0.75rem', margin: 0 }}>Unfiltered walkaround & honest review</p>
                                    </div>
                                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, backgroundColor: '#000' }}>
                                        <iframe
                                            src={getEmbedUrl(car.youtubeVideoUrl)}
                                            title="Test Drive Video"
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ backgroundColor: '#f8f9fa', padding: '2rem', marginBottom: '2rem', border: '1px solid #ddd' }}>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <AlertTriangle size={24} color="var(--color-accent)" />
                                        Honest Blemishes
                                    </h3>
                                    {car.blemishes && car.blemishes.length > 0 ? (
                                        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                                            {car.blemishes.map((b, i) => (
                                                <li key={i} style={{ marginBottom: '0.5rem', color: '#555' }}>{b}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>No major cosmetic issues noted. See photos for details.</p>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Right: Info & Story */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <span className="badge" style={{ backgroundColor: 'var(--color-gold)', color: 'white', padding: '0.5rem 1rem', fontSize: '1.25rem' }}>
                                    {car.price > 0 ? `$${car.price.toLocaleString()}` : 'CALL FOR PRICE'}
                                </span>
                                <button
                                    onClick={() => toggleGarage(car)}
                                    style={{
                                        background: isInGarage(car.id) ? '#fee2e2' : 'white',
                                        border: '1px solid #ddd',
                                        borderRadius: '50%',
                                        width: '48px',
                                        height: '48px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: isInGarage(car.id) ? '#ef4444' : '#666'
                                    }}
                                    title={isInGarage(car.id) ? "Remove from Garage" : "Add to Garage"}
                                >
                                    <Heart fill={isInGarage(car.id) ? '#ef4444' : 'none'} size={24} />
                                </button>
                            </div>
                            <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{car.year} {car.make} {car.model}</h1>
                            <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#666' }}>
                                {(() => {
                                    const safeInt = (v) => parseInt(String(v || '0').replace(/\D/g, '')) || 0;
                                    const m = safeInt(car.mileage);
                                    return m > 0 ? `${m.toLocaleString()} Miles` : 'Mileage TBD';
                                })()} • VIN: {car.vin}
                            </p>

                            {/* Special Online Notes (Manager Override) */}
                            {car.websiteNotes && (
                                <div style={{
                                    backgroundColor: '#fff1f2', // Light red/pink
                                    border: '2px solid #e11d48',
                                    borderRadius: '0.5rem',
                                    padding: '1.5rem',
                                    marginBottom: '2rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h2 style={{
                                        fontSize: '1.25rem',
                                        marginBottom: '0.75rem',
                                        color: '#be123c',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase'
                                    }}>
                                        <AlertCircle size={24} />
                                        Special Online Notes
                                    </h2>
                                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#881337', margin: 0, lineHeight: '1.5' }}>
                                        {car.websiteNotes}
                                    </p>
                                </div>
                            )}

                            {/* Brief AI Description */}
                            <div style={{
                                backgroundColor: '#f0f4f8',
                                borderLeft: '4px solid var(--color-primary)',
                                padding: '1.5rem',
                                marginBottom: '2rem'
                            }}>
                                <h2 style={{
                                    fontSize: '1.25rem',
                                    marginBottom: '1rem',
                                    color: 'var(--color-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 700
                                }}>
                                    <Info size={24} />
                                    What You Need To Know
                                </h2>
                                <div
                                    style={{ fontSize: '1.125rem', lineHeight: '1.6', margin: 0 }}
                                    dangerouslySetInnerHTML={{ __html: car.story }}
                                />
                            </div>


                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1rem',
                                backgroundColor: 'var(--color-secondary)',
                                padding: '1.5rem',
                                marginBottom: '2rem'
                            }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>Engine</label>
                                    <p style={{ fontWeight: 600 }}>{car.engine || 'N/A'}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>Trans</label>
                                    <p style={{ fontWeight: 600 }}>{car.transmission || 'N/A'}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>Ext. Color</label>
                                    <p style={{ fontWeight: 600 }}>{car.exteriorColor || 'N/A'}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>Market Price</label>
                                    <p style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{car.marketPrice || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Features & Options */}
                            {car.options && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
                                        Factory Options & Features
                                    </h3>
                                    <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>
                                        {car.options.includes('|') || car.options.includes(',') ? (
                                            <ul style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingLeft: '1.5rem', margin: 0 }}>
                                                {car.options.split(/[,|]/).map((opt, i) => (
                                                    opt.trim() && <li key={i}>{opt.trim()}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>{car.options}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <a href="https://youtube.com/playlist?list=PLl7IO3qjXvk6YT6yYeClM1Pn24H0uWGj4&si=fjk0H7RWbmkXIVJL" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', textAlign: 'center' }}>
                                Watch More on YouTube
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Lead Form */}
            <section>
                <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
                    <h2>Intrigued?</h2>
                    <p style={{ marginBottom: '2.5rem' }}>Don't let someone else drive your freedom machine. Ask us a question or schedule a no-pressure visit.</p>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input type="text" placeholder="Your Name" style={{ padding: '1rem', border: '1px solid var(--color-border)' }} />
                        <input type="email" placeholder="Email Address" style={{ padding: '1rem', border: '1px solid var(--color-border)' }} />
                        <textarea placeholder="Tell us what you're looking for..." rows="4" style={{ padding: '1rem', border: '1px solid var(--color-border)' }}></textarea>
                        <input type="hidden" value={`Interested in Stock #${car.stockNumber}: ${car.year} ${car.make} ${car.model}`} />
                        <button className="btn btn-primary" type="button">Send Honest Message</button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default VehicleDetailLive;
