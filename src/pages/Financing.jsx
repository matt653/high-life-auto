import React from 'react';
import { CreditCard, Wallet, Milestone } from 'lucide-react';

const Financing = () => {
    return (
        <div className="financing-page">
            <section style={{ backgroundColor: '#f9f9f9', padding: '5rem 0' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Simple Financing</h1>
                    <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto', color: '#666' }}>
                        We work with all credit types because we know a credit score doesn't tell your whole story.
                    </p>
                </div>
            </section>

            <section>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
                        {/* Form Section */}
                        <div className="card" style={{ padding: '2.5rem' }}>
                            <h2 style={{ marginBottom: '2rem' }}>Pre-Approval Form</h2>
                            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Full Name</label>
                                    <input type="text" style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Monthly Income (Approx)</label>
                                    <input type="text" placeholder="$" style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current Employment</label>
                                    <input type="text" style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)' }} />
                                </div>
                                <button type="button" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>Submit Secure Application</button>
                                <p style={{ fontSize: '0.75rem', textAlign: 'center', color: '#888' }}>
                                    Your data is encrypted and secure. We do not sell your information to third-party lenders.
                                </p>
                            </form>
                        </div>

                        {/* Info Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ color: 'var(--color-gold)' }}><CreditCard size={32} /></div>
                                <div>
                                    <h3>All Credit Welcome</h3>
                                    <p>First-time buyer? Recent divorce? Rebuilding? We focus on your current ability to pay, not your past mistakes.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ color: 'var(--color-gold)' }}><Wallet size={32} /></div>
                                <div>
                                    <h3>Low Down Payments</h3>
                                    <p>Our cars are affordable, which means your down payment stays low. We want you to keep cash in your pocket.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ color: 'var(--color-gold)' }}><Milestone size={32} /></div>
                                <div>
                                    <h3>Weekly/Bi-Weekly Payments</h3>
                                    <p>We can structure payments to match your pay schedule. No surprises, just clear milestones to ownership.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Financing;
