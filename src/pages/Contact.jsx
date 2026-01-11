import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

const Contact = () => {
    return (
        <div className="contact-page">
            <section style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '5rem 0' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Come See Us</h1>
                    <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto', opacity: 0.8 }}>
                        No pressure, no suits. Just honest cars and honest people.
                    </p>
                </div>
            </section>

            <section>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
                        {/* Contact Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <MapPin size={24} color="var(--color-gold)" />
                                <div>
                                    <h3 style={{ marginBottom: '0.5rem' }}>Visit the Lot</h3>
                                    <p>519 2nd Street<br />Fort Madison, IA 52627</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <Phone size={24} color="var(--color-gold)" />
                                <div>
                                    <h3 style={{ marginBottom: '0.5rem' }}>Call or Text</h3>
                                    <p>(309) 337-1049</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <Clock size={24} color="var(--color-gold)" />
                                <div>
                                    <h3 style={{ marginBottom: '0.5rem' }}>Hours</h3>
                                    <p>Mon-Fri: 10am - 5pm<br />Sat-Sun: Closed</p>
                                </div>
                            </div>
                        </div>

                        {/* Google Maps Placeholder */}
                        <div style={{ height: '400px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <MapPin size={48} style={{ marginBottom: '1rem', color: '#ccc' }} />
                                <p style={{ color: '#999' }}>Google Maps View would be embedded here</p>
                                <div style={{ width: '100%', height: '100%', minHeight: '300px', background: '#ddd', marginTop: '1rem' }}>
                                    {/* Real embed would go here */}
                                    <iframe
                                        title="map"
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.142293761919!2d-73.98731968459422!3d40.75889497932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480293%3A0x5119f444669d7212!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1625150000000!5m2!1sen!2sus"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Form Bottom */}
            <section style={{ backgroundColor: 'var(--color-secondary)' }}>
                <div className="container" style={{ maxWidth: '700px' }}>
                    <div style={{ backgroundColor: 'white', padding: '3rem', border: '1px solid var(--color-border)' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '2.5rem' }}>Send Us a Message</h2>
                        <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <input type="text" placeholder="First Name" style={{ padding: '0.75rem', border: '1px solid #ddd' }} />
                            <input type="text" placeholder="Last Name" style={{ padding: '0.75rem', border: '1px solid #ddd' }} />
                            <input type="email" placeholder="Email Address" style={{ gridColumn: '1 / -1', padding: '0.75rem', border: '1px solid #ddd' }} />
                            <textarea placeholder="How can we help you stay debt-free?" rows="5" style={{ gridColumn: '1 / -1', padding: '0.75rem', border: '1px solid #ddd' }}></textarea>
                            <button type="button" className="btn btn-primary" style={{ gridColumn: '1 / -1', padding: '1rem' }}>Send Message</button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
