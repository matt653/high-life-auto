
import React from 'react';
import { Link } from 'react-router-dom';
import { useGarage } from '../context/GarageContext';
import { Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Garage = () => {
    const { savedVehicles, removeFromGarage } = useGarage();

    if (savedVehicles.length === 0) {
        return (
            <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Your Garage is Empty</h1>
                <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem' }}>
                    You haven't saved any Freedom Machines yet. Go find some gems!
                </p>
                <Link to="/inventory" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                    Browse Inventory
                </Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }}>My Garage ({savedVehicles.length})</h1>
                <Link to="/inventory" className="btn btn-outline">
                    Browse More Cars
                </Link>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2.5rem'
            }}>
                {savedVehicles.map((car) => (
                    <div key={car.id} style={{
                        border: '2px solid var(--color-border)',
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <Link to={`/vehicle/${car.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                                <img src={car.photos[0]} alt={car.make} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    backgroundColor: 'var(--color-gold)',
                                    color: 'var(--color-primary)',
                                    padding: '0.25rem 1rem',
                                    fontWeight: 800,
                                    fontSize: '1.25rem'
                                }}>
                                    ${car.price?.toLocaleString()}
                                </div>
                            </div>
                        </Link>

                        <div style={{ padding: '1.5rem' }}>
                            <Link to={`/vehicle/${car.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
                                    {car.year} {car.make} {car.model}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                                    {car.mileage?.toLocaleString()} miles • {car.trim}
                                </p>
                            </Link>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Link to={`/vehicle/${car.id}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                                    View Details
                                </Link>
                                <button
                                    onClick={() => removeFromGarage(car.id)}
                                    style={{
                                        background: '#fee2e2',
                                        color: '#ef4444',
                                        border: 'none',
                                        padding: '0.75rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title="Remove from Garage"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Garage;
