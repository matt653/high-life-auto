import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Car, Heart } from 'lucide-react';
import { useGarage } from '../context/GarageContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { savedVehicles } = useGarage();

    const navLinks = [
        { name: 'Inventory', path: '/inventory' },
        { name: 'Garage', path: '/garage' }, // Added Garage
        { name: 'Our Why', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            borderBottom: '1px solid var(--color-border)',
            zIndex: 1000
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '70px'
            }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 1 }}>
                    <div style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        padding: '0.5rem',
                        borderRadius: '4px'
                    }}>
                        <Car size={24} />
                    </div>
                    <span style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 800,
                        fontSize: '1.25rem',
                        letterSpacing: '-0.02em'
                    }}>HIGH LIFE AUTO</span>
                </Link>

                {/* Desktop Nav */}
                <div style={{ display: 'none' }} className="desktop-menu">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            style={{ marginLeft: '2rem', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {link.name}
                            {link.name === 'Garage' && savedVehicles.length > 0 && (
                                <span style={{
                                    backgroundColor: 'var(--color-accent)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem'
                                }}>
                                    {savedVehicles.length}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
                    className="mobile-toggle"
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '70px',
                    left: 0,
                    width: '100%',
                    backgroundColor: 'white',
                    borderBottom: '1px solid var(--color-border)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            onClick={() => setIsOpen(false)}
                            style={{ fontWeight: 700, fontSize: '1.25rem', textTransform: 'uppercase' }}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <Link
                        to="/inventory"
                        className="btn btn-primary"
                        onClick={() => setIsOpen(false)}
                        style={{ marginTop: '0.5rem' }}
                    >
                        Browse Cars
                    </Link>
                </div>
            )}

            <style>{`
        @media (min-width: 769px) {
          .desktop-menu { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
        </nav>
    );
};

export default Navbar;
