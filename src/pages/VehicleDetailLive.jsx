import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Info, Play, CheckCircle2, Award, AlertTriangle } from 'lucide-react';
import { loadInventoryFromFrazerCSV, analyzeVideoTranscript } from '../services/FrazerFeedService';

const VehicleDetailLive = () => {
    const { id } = useParams();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toggleGarage, isInGarage } = useGarage();
    const [vehicleGrade, setVehicleGrade] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadVehicle();
    }, [id]);

    const loadVehicle = async () => {
        setLoading(true);
        try {
            const inventory = await loadInventoryFromFrazerCSV('/frazer-inventory.csv');
            const vehicle = inventory.find(v => v.stock === id || v.id === id);
            setCar(vehicle);

            // If car has YouTube video, analyze it for grading
            if (vehicle && vehicle.youtubeVideoUrl) {
                const grade = await analyzeVideoTranscript(vehicle.youtubeVideoUrl, vehicle);
                setVehicleGrade(grade);
            }
        } catch (error) {
            console.error('Error loading vehicle:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (grade) => {
        if (grade === 'A' || grade === 'A+') return 'var(--color-accent)';
        if (grade === 'B' || grade === 'B+') return 'var(--color-gold)';
        return '#ff6b6b';
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
                            {car.youtubeVideoUrl ? (
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
                                            src={car.youtubeVideoUrl}
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
                                    ${car.price > 0 ? car.price.toLocaleString() : 'CALL FOR PRICE'}
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
                                <p style={{ fontSize: '1.125rem', lineHeight: '1.6', margin: 0 }}>
                                    {car.story}
                                </p>
                            </div>

                            {/* Vehicle Grade Card */}
                            {vehicleGrade && (
                                <div style={{
                                    backgroundColor: 'var(--color-secondary)',
                                    padding: '2rem',
                                    marginBottom: '2rem',
                                    border: `3px solid ${getGradeColor(vehicleGrade.overallGrade)}`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <Award size={40} color={getGradeColor(vehicleGrade.overallGrade)} />
                                        <div>
                                            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Vehicle Grade: {vehicleGrade.overallGrade}</h2>
                                            <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: 0 }}>Based on Miriam's test drive analysis</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #ddd' }}>
                                            <span style={{ fontWeight: 600 }}>Mechanical Condition:</span>
                                            <span style={{ color: getGradeColor(vehicleGrade.mechanical.grade), fontWeight: 800 }}>{vehicleGrade.mechanical.grade}</span>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', marginTop: '-0.5rem' }}>{vehicleGrade.mechanical.notes}</p>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #ddd' }}>
                                            <span style={{ fontWeight: 600 }}>Cosmetic Condition:</span>
                                            <span style={{ color: getGradeColor(vehicleGrade.cosmetic.grade), fontWeight: 800 }}>{vehicleGrade.cosmetic.grade}</span>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', marginTop: '-0.5rem' }}>{vehicleGrade.cosmetic.notes}</p>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #ddd' }}>
                                            <span style={{ fontWeight: 600 }}>Value Rating:</span>
                                            <span style={{ color: getGradeColor(vehicleGrade.value.grade), fontWeight: 800 }}>{vehicleGrade.value.grade}</span>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', marginTop: '-0.5rem' }}>{vehicleGrade.value.notes}</p>
                                    </div>
                                </div>
                            )}

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
                                        {(vehicleGrade.buyerTips || vehicleGrade.consumerEducation).map((tip, i) => (
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

                            <a href="https://www.youtube.com/@HighLifeAuto" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', textAlign: 'center' }}>
                                Watch More on YouTube
                            </a>
                        </div>
                    </div>
                </div>
            </section>

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
                        <input type="hidden" value={`Interested in Stock #${car.stock}: ${car.year} ${car.make} ${car.model}`} />
                        <button className="btn btn-primary" type="button">Send Honest Message</button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default VehicleDetailLive;
