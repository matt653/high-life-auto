import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Info, Play, CheckCircle2, Award, AlertTriangle, Heart, AlertCircle, ClipboardCheck } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../apps/ChatBot/services/firebase';

import { useGarage } from '../context/GarageContext';

const DEFAULT_CSV_URL = "https://highlifeauto.com/frazer-inventory-updated.csv";

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
            engine: get("Vehicle Engine"),
            transmission: get("Vehicle Transmission"),
            exteriorColor: get("Vehicle Exterior Color"),
            interiorColor: get("Vehicle Interior Color"),
            // Try to recover potential AI fields even if fresh fetch
            marketingDescription: get("marketingDescription"),
            websiteNotes: get("websiteNotes")
        };
    });
};

const InteractiveGrader = ({ gradeData }) => {
    const [userWeights, setUserWeights] = useState({});
    const [personal, setPersonal] = useState({ score: '0.0', letter: 'N/A' });
    const [isExpanded, setIsExpanded] = useState(false);

    // Initialize weights
    useEffect(() => {
        if (gradeData?.categories) {
            const initial = {};
            // Default 50% importance for all categories
            Object.keys(gradeData.categories).forEach(k => initial[k] = 50);
            setUserWeights(initial);
        }
    }, [gradeData]);

    // Calculate Personal Grade
    useEffect(() => {
        if (!gradeData?.categories) return;

        let totalWeightedScore = 0;
        let totalPossibleWeight = 0;

        Object.entries(gradeData.categories).forEach(([key, cat]) => {
            const weight = userWeights[key] || 50;

            // Normalize score to 0-5 scale
            let score = 2.5; // default C
            if (typeof cat.score === 'number') {
                score = cat.score;
                // Handle legacy 0-100 scores if present
                if (score > 5) score = score / 20;
            } else if (cat.grade === 'A') score = 4.5;
            else if (cat.grade === 'B') score = 3.5;
            else if (cat.grade === 'C') score = 2.5;
            else if (cat.grade === 'D') score = 1.5;
            else if (cat.grade === 'F') score = 0.5;

            totalWeightedScore += (score * weight);
            totalPossibleWeight += weight;
        });

        if (totalPossibleWeight === 0) {
            setPersonal({ score: '0.0', letter: 'N/A' });
            return;
        }

        const finalScore = totalWeightedScore / totalPossibleWeight;
        const roundedScore = parseFloat(finalScore.toFixed(1));

        // Map 0-5 to Letter (User Rubric: 2.x=C, 3.x=B, 4.x=A)
        let letter = 'F';
        if (roundedScore >= 4.8) letter = 'A+';
        else if (roundedScore >= 4.0) letter = 'A'; // 4.0 - 4.7
        else if (roundedScore >= 3.8) letter = 'B+';
        else if (roundedScore >= 3.0) letter = 'B'; // 3.0 - 3.7
        else if (roundedScore >= 2.8) letter = 'C+';
        else if (roundedScore >= 2.0) letter = 'C'; // 2.0 - 2.7
        else if (roundedScore >= 1.0) letter = 'D'; // 1.0 - 1.9

        setPersonal({
            score: roundedScore.toFixed(1),
            letter
        });

    }, [userWeights, gradeData]);

    if (!gradeData?.categories) return null;

    return (
        <div style={{ marginTop: '3rem', padding: '0', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div
                style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Try It Yourself: Interactive Grading Scale
                    </h3>
                </div>
                <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>{isExpanded ? '−' : '+'}</span>
            </div>

            {isExpanded && (
                <div style={{ padding: '1.5rem' }}>
                    <p style={{ color: '#475569', marginBottom: '2rem', fontSize: '0.9rem' }}>
                        Adjust the sliders to change how much each category matters to <strong>YOU</strong>.
                        Don't care about curb appeal? Slide "Body Condition" down. Care a lot about reliability? Slide it up!
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {/* Sliders */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {Object.entries(gradeData.categories).map(([key, cat]) => (
                                <div key={key}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#64748b' }}>
                                        <span>{cat.name || key.replace(/_/g, ' ')}</span>
                                        <span>{userWeights[key] || 50}% Importance</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={userWeights[key] || 50}
                                        onChange={(e) => setUserWeights(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                        style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                        <span>Don't Care</span>
                                        <span>Critical</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Result Card */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', borderRadius: '1rem', border: '2px solid #bfdbfe', padding: '2rem' }}>
                            <h4 style={{ color: '#1e3a8a', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em', marginBottom: '1rem' }}>Your Personal Grade</h4>
                            <div style={{ fontSize: '6rem', fontWeight: 900, lineHeight: 1, color: '#2563eb', marginBottom: '0.5rem' }}>{personal.letter}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{personal.score}</span>
                                <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>/ 5.0 GPA</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#1e40af', marginTop: '1rem', opacity: 0.8, maxWidth: '200px', textAlign: 'center' }}>
                                Based on not just the car's condition, but your personal priorities.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const VehicleDetailLive = () => {
    const { id } = useParams(); // 'id' here corresponds to the Stock Number
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);

    // Safety check for context
    const garageContext = useGarage();
    const toggleGarage = garageContext?.toggleGarage || (() => console.warn('Garage Context missing'));
    const isInGarage = garageContext?.isInGarage || (() => false);

    const [vehicleGrade, setVehicleGrade] = useState(null);

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
    }, [id]);

    const loadVehicle = async () => {
        setLoading(true);
        try {
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
                                aiGrade: liveData.aiGrade || foundCar.aiGrade,
                                marketingDescription: liveData.marketingDescription || foundCar.marketingDescription,
                                blemishes: liveData.blemishes || foundCar.blemishes,
                                websiteNotes: liveData.websiteNotes || foundCar.websiteNotes
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

                if (foundCar.aiGrade) {
                    setVehicleGrade(foundCar.aiGrade);
                }
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

    const getGradeColor = (grade) => {
        if (!grade) return '#999';
        if (grade === 'A' || grade === 'A+') return 'var(--color-accent)';
        if (grade === 'B' || grade === 'B+') return 'var(--color-gold)';
        return '#ff6b6b';
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
                <Link to="/inventory" className="btn btn-primary" style={{ marginTop: '2rem' }}>
                    Back to Showroom
                </Link>
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
                                {car.mileage > 0 ? `${car.mileage.toLocaleString()} Miles` : 'Mileage TBD'} • VIN: {car.vin}
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

                            {/* Consumer Education */}
                            {(vehicleGrade?.buyerTips || vehicleGrade?.consumerEducation) && (
                                <div style={{
                                    backgroundColor: '#fff3cd',
                                    border: '2px solid #ffc107',
                                    padding: '1.5rem',
                                    marginBottom: '2rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <AlertTriangle size={24} color="#856404" />
                                        <h3 style={{ margin: 0, color: '#856404' }}>Miriam's Mechanic Notes: Common Known Issues</h3>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#856404', marginBottom: '1rem', fontStyle: 'italic' }}>
                                        (These are common things for this model year/engine, not necessarily present on this specific car. We checked them!)
                                    </p>
                                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#856404' }}>
                                        {(vehicleGrade?.buyerTips || vehicleGrade?.consumerEducation || []).map((tip, i) => (
                                            <li key={i} style={{ marginBottom: '0.5rem' }}>{tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

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
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>Int. Color</label>
                                    <p style={{ fontWeight: 600 }}>{car.interiorColor || 'N/A'}</p>
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

            {/* FULL WIDTH REPORT CARD SECTION */}
            {vehicleGrade && (
                <section style={{ backgroundColor: '#fff', padding: '3rem 0', borderTop: '4px solid var(--color-primary)' }}>
                    <div className="container">
                        <div style={{
                            border: '4px double #1f2937', // Double border for report card look
                            padding: '2rem',
                            backgroundColor: '#fffdf5', // Slight paper tint
                            position: 'relative'
                        }}>
                            {/* Report Card Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1f2937', paddingBottom: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <ClipboardCheck size={48} color="#1f2937" />
                                    <div>
                                        <h2 style={{ fontSize: '2rem', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', color: '#1f2937' }}>Official Report Card</h2>
                                        <p style={{ margin: 0, fontFamily: 'monospace', color: '#666' }}>ID: {car.stockNumber} | DATE: {new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Final Grade</div>
                                        <div style={{ fontSize: '3rem', fontWeight: '900', color: getGradeColor(vehicleGrade.overallGrade), lineHeight: 1 }}>
                                            {vehicleGrade.overallGrade}
                                        </div>
                                    </div>
                                    {/* Stamp Look */}
                                    <div style={{
                                        border: `3px solid ${getGradeColor(vehicleGrade.overallGrade)}`,
                                        color: getGradeColor(vehicleGrade.overallGrade),
                                        padding: '0.5rem 1rem',
                                        transform: 'rotate(-5deg)',
                                        fontWeight: '900',
                                        fontSize: '1.25rem',
                                        textTransform: 'uppercase',
                                        opacity: 0.8
                                    }}>
                                        Verified
                                    </div>
                                </div>
                            </div>

                            {/* Report Card Body - Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0', border: '1px solid #1f2937' }}>
                                {vehicleGrade.categories && Object.entries(vehicleGrade.categories).map(([key, cat], index) => (
                                    <div key={key} style={{
                                        padding: '1.5rem',
                                        borderRight: '1px solid #1f2937',
                                        borderBottom: '1px solid #1f2937',
                                        backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <h3 style={{ margin: 0, textTransform: 'uppercase', fontSize: '1rem', fontWeight: 800 }}>{cat.name || key}</h3>
                                            <span style={{ fontWeight: 900, color: getGradeColor(cat.grade), fontSize: '1.5rem' }}>{cat.grade}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', fontFamily: 'serif', color: '#333' }}>
                                            {cat.reasoning}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Instructor Comments */}
                            <div style={{ marginTop: '2rem', fontFamily: 'serif', fontStyle: 'italic', color: '#444' }}>
                                <strong style={{ fontFamily: 'sans-serif', textTransform: 'uppercase', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem', color: '#000' }}>Instructor Comments:</strong>
                                "{vehicleGrade.summary}"
                            </div>

                            {/* Signature Line */}
                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontFamily: 'Noteworthy, "Segoe Print", sans-serif', fontSize: '1.5rem', color: '#2563eb' }}>Miriam</div>
                                    <div style={{ borderTop: '1px solid #000', width: '200px', margin: '0.5rem auto 0' }}></div>
                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Certified Evaluator</div>
                                </div>
                            </div>

                        </div>

                        {/* Interactive Grader Section */}
                        <InteractiveGrader gradeData={vehicleGrade} />

                    </div>
                </section>
            )}

            {/* Honest Blemishes */}
            <section style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                        <Info size={32} color="var(--color-gold)" />
                        <div>
                            <h2 style={{ fontSize: '2rem' }}>The Honest Blemishes</h2>
                            <p style={{ opacity: 0.7 }}>We don't hide the character marks. Here's exactly what's not perfect.</p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <CheckCircle2 size={48} color="var(--color-accent)" style={{ margin: '0 auto 1rem' }} />
                        <h3>Review the Video & Photos</h3>
                        <p>Miriam shows you everything in the test drive video. All imperfections are visible in the photo gallery above.</p>
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
