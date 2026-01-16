import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Info, Camera, Play, CheckCircle2, Award, AlertTriangle } from 'lucide-react';
import { mockInventory } from '../data/mockInventory';


const VehicleDetailWithGrade = () => {
    const { id } = useParams();
    const car = mockInventory.find(c => c.id === id);
    const [vehicleGrade, setVehicleGrade] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);

        // If car has a YouTube video, analyze it for grading
        // Video analysis removed
        if (car && car.youtubeVideoUrl) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setVehicleGrade(null);
        }
    }, [car]);

    if (!car) return <div className="container">Car not found.</div>;

    const getGradeColor = (grade) => {
        if (grade === 'A' || grade === 'A+') return 'var(--color-accent)';
        if (grade === 'B' || grade === 'B+') return 'var(--color-gold)';
        return '#ff6b6b';
    };

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
                            <div style={{ marginBottom: '1rem', border: '5px solid black' }}>
                                <img src={car.photos[0]} alt={car.make} style={{ width: '100%', display: 'block' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                {car.photos.slice(1, 5).map((photo, i) => (
                                    <img key={i} src={photo} alt="Car aspect" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                ))}
                            </div>

                            {/* Video Section */}
                            {car.youtubeVideoUrl || car.videoUrl ? (
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
                                            src={car.youtubeVideoUrl || car.videoUrl}
                                            title="Test Drive Video"
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ backgroundColor: '#000', color: 'white', padding: '3rem 2rem', textAlign: 'center' }}>
                                    <Play size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                    <h3>Video Coming Soon</h3>
                                    <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>Miriam's test drive video is being edited.</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Info & Story */}
                        <div>
                            <span className="badge" style={{ backgroundColor: 'var(--color-gold)', color: 'white' }}>${car.price.toLocaleString()} TOTAL PRICE</span>
                            <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{car.year} {car.make} {car.model}</h1>
                            <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#666' }}>{car.mileage.toLocaleString()} Miles • VIN: {car.vin}</p>

                            <div style={{ borderTop: '2px solid black', paddingTop: '2rem', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>The "Job To Be Done" Story</h2>
                                <p style={{ fontSize: '1.125rem', lineHeight: '1.8' }}>{car.story}</p>
                            </div>

                            {/* Vehicle Grade Card (if video exists) */}
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

                            {/* Consumer Education Section */}
                            {vehicleGrade && vehicleGrade.consumerEducation && (
                                <div style={{
                                    backgroundColor: '#fff3cd',
                                    border: '2px solid #ffc107',
                                    padding: '1.5rem',
                                    marginBottom: '2rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <AlertTriangle size={24} color="#856404" />
                                        <h3 style={{ margin: 0, color: '#856404' }}>Buyer Education & Pro Tips</h3>
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#856404' }}>
                                        {vehicleGrade.consumerEducation.map((tip, i) => (
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
                                    <p style={{ fontWeight: 600 }}>{car.engine}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>Trans</label>
                                    <p style={{ fontWeight: 600 }}>{car.transmission}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>Ext. Color</label>
                                    <p style={{ fontWeight: 600 }}>{car.exteriorColor}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>Int. Color</label>
                                    <p style={{ fontWeight: 600 }}>{car.interiorColor}</p>
                                </div>
                            </div>

                            <Link to="/financing" className="btn btn-primary" style={{ width: '100%', padding: '1.25rem' }}>
                                Apply for Freedom (Pre-Approval)
                            </Link>
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {car.blemishes && car.blemishes.length > 0 ? (
                            car.blemishes.map((b, i) => (
                                <div key={i} className="card" style={{ background: '#333', border: 'none' }}>
                                    <img src={b} alt="Blemish" style={{ width: '100%', marginBottom: '1rem' }} />
                                    <p style={{ fontSize: '0.875rem' }}>{car.blemishDescription}</p>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem' }}>
                                <CheckCircle2 size={48} color="var(--color-accent)" style={{ margin: '0 auto 1rem' }} />
                                <h3>No Major Cosmetic Faults</h3>
                                <p>Surprisingly clean for its age and price. Only minor wear expected for a {car.year}.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Lead Form Mini */}
            <section>
                <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
                    <h2>Intrigued?</h2>
                    <p style={{ marginBottom: '2.5rem' }}>Don't let someone else drive your freedom machine. Ask us a question or schedule a no-pressure visit.</p>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input type="text" placeholder="Your Name" style={{ padding: '1rem', border: '1px solid var(--color-border)' }} />
                        <input type="email" placeholder="Email Address" style={{ padding: '1rem', border: '1px solid var(--color-border)' }} />
                        <textarea placeholder="Tell us what you're looking for..." rows="4" style={{ padding: '1rem', border: '1px solid var(--color-border)' }}></textarea>
                        <button className="btn btn-primary" type="button">Send Honest Message</button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default VehicleDetailWithGrade;
