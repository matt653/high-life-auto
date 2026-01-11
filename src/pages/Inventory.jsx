import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { mockInventory } from '../data/mockInventory';

const Inventory = () => {
    const [filter, setFilter] = useState('');
    const [priceRange, setPriceRange] = useState(6000);

    const filteredCars = mockInventory.filter(car =>
        (car.make.toLowerCase().includes(filter.toLowerCase()) ||
            car.model.toLowerCase().includes(filter.toLowerCase())) &&
        car.price <= priceRange
    );

    return (
        <div className="inventory-page">
            <section style={{ backgroundColor: '#f9f9f9', padding: '3rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <div className="container">
                    <h1 style={{ marginBottom: '1.5rem' }}>Digital Showroom</h1>

                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        border: '1px solid var(--color-border)'
                    }}>
                        <div style={{ flex: '1 1 300px', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input
                                type="text"
                                placeholder="Search Make or Model..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    border: '1px solid var(--color-border)',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                                Max Price: ${priceRange.toLocaleString()}
                            </label>
                            <input
                                type="range"
                                min="1000"
                                max="6000"
                                step="500"
                                value={priceRange}
                                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div className="container">
                    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={18} color="var(--color-gold)" />
                        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Fresh Data: Inventory auto-syncs from Frazer DMS every 15 minutes.</p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '2.5rem'
                    }}>
                        {filteredCars.length > 0 ? filteredCars.map((car) => (
                            <div key={car.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'relative', height: '220px', margin: '-1.5rem -1.5rem 1.5rem', overflow: 'hidden' }}>
                                    <img src={car.photos[0]} alt={car.make} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        backgroundColor: 'white',
                                        padding: '0.5rem 1rem',
                                        fontWeight: 800,
                                        fontSize: '1.25rem'
                                    }}>
                                        ${car.price.toLocaleString()}
                                    </div>
                                    {car.status && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '0',
                                            left: '0',
                                            backgroundColor: 'var(--color-accent)',
                                            color: 'white',
                                            padding: '0.25rem 1rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase'
                                        }}>
                                            {car.status}
                                        </div>
                                    )}
                                </div>

                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{car.year} {car.make} {car.model}</h3>
                                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', marginBottom: '1rem' }}>
                                    {car.mileage.toLocaleString()} Miles • {car.engine} • {car.bodyType}
                                </p>

                                <div style={{
                                    backgroundColor: '#f5f5f5',
                                    padding: '1rem',
                                    marginBottom: '1.5rem',
                                    fontSize: '0.9rem',
                                    borderLeft: '4px solid var(--color-gold)'
                                }}>
                                    <strong>The Mission:</strong> {car.story.split('.')[0]}.
                                </div>

                                <div style={{ marginTop: 'auto' }}>
                                    <Link to={`/vehicle/${car.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                                        Start Transparent Tour
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem' }}>
                                <h3>No "Freedom Machines" found matching those criteria.</h3>
                                <button onClick={() => { setFilter(''); setPriceRange(6000); }} className="btn btn-outline" style={{ marginTop: '1rem' }}>Clear Filters</button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Inventory;
