import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Banknote, HeartHandshake, ArrowRight, Mail, Wrench } from 'lucide-react';

import { motion } from 'framer-motion';

const Homepage = () => {
    const [featuredCars, setFeaturedCars] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCars = async () => {
            setFeaturedCars([]);
            setLoading(false);
        };
        loadCars();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Success! You're on the list for weekly price drops.");
    };

    return (
        <div className="homepage">
            {/* Hero Section */}
            <section style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                padding: '4rem 0 6rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Construction Warning Banner */}
                <div style={{
                    backgroundColor: '#fbbf24', // Amber-400
                    color: '#000',
                    padding: '0.75rem',
                    fontWeight: 'bold',
                    position: 'absolute',
                    top: 0,
                    width: '100%',
                    zIndex: 10,
                    fontSize: '0.9rem',
                    borderBottom: '2px solid #b45309'
                }}>
                    🚧 WEBSITE UNDER RENOVATION 🚧 <br className="md:hidden" />
                    We are building a new experience! If you have any trouble, call or text <a href="tel:309-267-7200" style={{ textDecoration: 'underline', color: '#000' }}>Miriam (309-267-7200)</a> for immediate help.
                </div>

                <div className="container" style={{ position: 'relative', zIndex: 2, marginTop: '2rem' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            fontWeight: 900,
                            lineHeight: 1.1,
                            marginBottom: '1rem',
                            maxWidth: '900px',
                            margin: '0 auto 1.5rem'
                        }}
                    >
                        Reliable Transportation at Your <span style={{ color: 'var(--color-gold)' }}>Under $3,000</span> Headquarters.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: 300,
                            letterSpacing: '0.05em',
                            opacity: 0.9,
                            marginBottom: '2rem'
                        }}
                    >
                        HONEST DEALS. NO HAGGLING.
                    </motion.p>

                    {/* Tax Season Hook / Lead Magnet */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            backgroundColor: 'white',
                            color: 'var(--color-text)',
                            maxWidth: '600px',
                            margin: '0 auto',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
                        }}
                    >
                        <h3 style={{
                            color: 'var(--color-primary)',
                            fontSize: '1.2rem',
                            marginBottom: '0.5rem',
                            fontWeight: 800
                        }}>
                            DON'T MISS THE NEXT PRICE DROP
                        </h3>
                        <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#666' }}>
                            Get our weekly inventory list sent to your inbox.
                        </p>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                required
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    border: '2px solid #ddd',
                                    borderRadius: '4px',
                                    minWidth: '200px'
                                }}
                            />
                            <button
                                type="submit"
                                className="btn"
                                style={{
                                    backgroundColor: 'var(--color-accent)',
                                    color: 'white',
                                    fontWeight: 700,
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '4px'
                                }}
                            >
                                Get The List
                            </button>
                        </form>
                    </motion.div>
                </div>

                {/* Background decoration */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(45deg, rgba(30, 58, 95, 1) 0%, rgba(44, 82, 130, 0.9) 100%)',
                    zIndex: 1
                }}></div>
            </section>

            {/* Inventory Teaser */}
            <section style={{ backgroundColor: '#f8f9fa', padding: '5rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                            Fresh Arrivals Under $5,000
                        </h2>
                        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-light)' }}>
                            Mechanically inspected. Priced to move.
                        </p>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Inventory...</div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            {featuredCars.map((car) => (
                                <Link to={`/vehicle/${car.id}`} key={car.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        style={{
                                            border: '1px solid #ddd',
                                            backgroundColor: 'white',
                                            overflow: 'hidden',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                                            <img src={car.photos[0]} alt={car.make} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '0',
                                                left: '0',
                                                backgroundColor: 'var(--color-gold)',
                                                color: 'var(--color-primary)',
                                                padding: '0.25rem 1rem',
                                                fontWeight: 800,
                                                fontSize: '1.25rem'
                                            }}>
                                                ${car.price.toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
                                                {car.year} {car.make} {car.model}
                                            </h3>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                                                <span>{car.mileage.toLocaleString()} mi</span>
                                                <span>•</span>
                                                <span>{car.transmission}</span>
                                            </div>
                                            <div style={{ marginTop: 'auto' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    color: 'var(--color-accent)',
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem',
                                                    borderBottom: '1px solid var(--color-accent)'
                                                }}>
                                                    View Details &rarr;
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div style={{ textAlign: 'center' }}>
                        <Link to="/inventory" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                            View Full Inventory
                        </Link>
                    </div>
                </div>
            </section>

            {/* The Real Deal Section */}
            <section style={{ backgroundColor: 'white', padding: '5rem 0' }}>
                <div className="container">
                    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                        <Wrench size={48} color="var(--color-accent)" style={{ margin: '0 auto 1.5rem' }} />
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
                            Save Big, Fix It Yourself
                        </h2>
                        <p style={{ fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '2rem' }}>
                            Matt picked up a wrench in 2018 because he loved cars, not because it was a job. We're not a big corporate shop with massive overhead.
                            We partner with trusted local mechanics for the big stuff, but we list our inventory immediately—flaws and all.
                        </p>
                        <p style={{ fontSize: '1.125rem', lineHeight: 1.8, fontWeight: 600, color: 'var(--color-accent)' }}>
                            This means you can often beat us to the fix and save a fortune. If you're willing to turn a wrench (or know someone who can), you'll get a killer deal.
                        </p>
                    </div>
                </div>
            </section>

            {/* Trust Signals: The High Life Promise */}
            <section style={{ backgroundColor: 'white', padding: '5rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }}>
                            The High Life Promise
                        </h2>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '4rem',
                        textAlign: 'center'
                    }}>
                        <div>
                            <div style={{
                                width: '80px', height: '80px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }}>
                                <HeartHandshake size={40} color="var(--color-primary)" />
                            </div>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Faith-Based Business</h3>
                            <p style={{ lineHeight: 1.6, color: '#666' }}>
                                We operate with integrity and purpose. We treat every customer the way we'd want to be treated.
                            </p>
                        </div>

                        <div>
                            <div style={{
                                width: '80px', height: '80px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }}>
                                <ShieldCheck size={40} color="var(--color-primary)" />
                            </div>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Upfront Condition Reports</h3>
                            <p style={{ lineHeight: 1.6, color: '#666' }}>
                                No hiding flaws. We show you the dents, dings, and quirks before you even test drive.
                            </p>
                        </div>

                        <div>
                            <div style={{
                                width: '80px', height: '80px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }}>
                                <Banknote size={40} color="var(--color-primary)" />
                            </div>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Firm Pricing (No Games)</h3>
                            <p style={{ lineHeight: 1.6, color: '#666' }}>
                                The price you see is the price you pay. No fake "market adjustments" or surprise fees.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Homepage;
