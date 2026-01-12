import React from 'react';
import { Quote } from 'lucide-react';

const About = () => {
    return (
        <div className="about-page">
            <section style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                padding: '6rem 0',
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1600&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>Our Why</h1>
                    <p style={{ fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto' }}>
                        We're not car dealers. We're freedom brokers.
                    </p>
                </div>
            </section>

            <section>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div style={{ marginBottom: '4rem' }}>
                        <Quote size={48} color="var(--color-gold)" style={{ marginBottom: '2rem' }} />
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--color-primary)' }}>We're not for everyone.</h2>
                        <p style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 500 }}>
                            And that's exactly the point.
                        </p>
                        <p style={{ marginBottom: '1.5rem' }}>
                            This dealership is for people who aren't afraid to get their hands dirty. People who know the pride of turning a wrench. People who understand that a car with "character" beats a boring new one any day of the week.
                        </p>
                        <p style={{ marginBottom: '1.5rem' }}>
                            We believe in the thrill of a good bargain. The satisfaction of fixing something yourself. The freedom that comes from owning a car outright instead of making payments to a bank for seven years.
                        </p>
                        <p style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.1rem', color: 'var(--color-accent)' }}>
                            If you're looking for leather seats and a warranty, we're not your place. But if you want good bones at a great price? Welcome home.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', margin: '4rem 0' }}>
                        <img src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80" alt="Garage" style={{ width: '100%', height: '400px', objectFit: 'cover', filter: 'grayscale(30%)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h3 style={{ color: 'var(--color-primary)' }}>Built Different.</h3>
                            <p style={{ marginBottom: '1rem' }}>
                                We don't sell status. We sell solutions. Every car on our lot has been hand-picked because it's got good bones—solid mechanicals, honest pricing, and a story worth telling.
                            </p>
                            <p>
                                You won't find salespeople in suits here. You'll find people who know the difference between a timing belt and a serpentine belt. People who respect a car that's earned its miles.
                            </p>
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#2a2a2a', color: 'white', padding: '3rem', borderLeft: '8px solid var(--color-gold)' }}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--color-gold)' }}>The Garage Code</h2>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                                <strong style={{ color: 'var(--color-gold)', minWidth: '30px' }}>01.</strong> <span>We strive to be the area's largest <span style={{ color: 'var(--color-gold)' }}>$3k and under</span> dealership in the Tri-States.</span>
                            </li>
                            <li style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                                <strong style={{ color: 'var(--color-gold)', minWidth: '30px' }}>02.</strong> <span>We show you the rust, the dents, the quirks. Honesty over hype. We do our best to be real.</span>
                            </li>
                            <li style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                                <strong style={{ color: 'var(--color-gold)', minWidth: '30px' }}>03.</strong> <span>Matt buys cars with 1 question... would he own it for the price it's selling for? If it's a yes — you'll see it on the lot!</span>
                            </li>
                            <li style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                                <strong style={{ color: 'var(--color-gold)', minWidth: '30px' }}>04.</strong> <span>Character over chrome. Function over flash. Why overpay for looks that fade away?</span>
                            </li>
                        </ul>

                        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '1rem', color: '#888', marginBottom: '1rem' }}>The High Life Mission</h3>
                            <p style={{ fontSize: '1.5rem', fontWeight: 300, lineHeight: 1.4, marginBottom: '1.5rem', fontStyle: 'italic' }}>
                                "To put people in a better place with transportation - yeah it's that simple!"
                            </p>
                            <p style={{ color: 'var(--color-gold)', fontWeight: 700, letterSpacing: '0.05em' }}>
                                No games. No BS. Just real people being real.
                            </p>
                            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>
                                (Why that is a "selling point" blows our mind too!)
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
