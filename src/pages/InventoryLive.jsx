import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, AlertCircle, RefreshCw, Heart } from 'lucide-react';
import { loadInventoryFromFrazerCSV } from '../services/FrazerFeedService';
import { useGarage } from '../context/GarageContext';

const InventoryLive = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [priceRange, setPriceRange] = useState(25000);
    const [lastSync, setLastSync] = useState(null);
    const { toggleGarage, isInGarage } = useGarage();

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const data = await loadInventoryFromFrazerCSV('/frazer-inventory.csv');
            // Sort by price: Low to High by default, forcing 0 (Call for Price) to the bottom
            const sortedData = data.sort((a, b) => {
                const priceA = a.price || 0;
                const priceB = b.price || 0;
                if (priceA === 0 && priceB === 0) return 0;
                if (priceA === 0) return 1;
                if (priceB === 0) return -1;
                return priceA - priceB;
            });
            setInventory(sortedData);
            setLastSync(new Date());

            // Calculate max price from inventory
            const maxPrice = Math.max(...data.map(car => car.price || 0), 25000);
            setPriceRange(maxPrice);
        } catch (error) {
            console.error('Error loading inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCars = inventory.filter(car =>
        (car.make?.toLowerCase().includes(filter.toLowerCase()) ||
            car.model?.toLowerCase().includes(filter.toLowerCase()) ||
            car.year?.toString().includes(filter)) &&
        (car.price || 0) <= priceRange
    ).sort((a, b) => {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        if (priceA === 0 && priceB === 0) return 0;
        if (priceA === 0) return 1;
        if (priceB === 0) return -1;
        return priceA - priceB;
    });

    return (
        <div className="inventory-page">
            <section style={{ backgroundColor: '#f9f9f9', padding: '3rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{ marginBottom: '0.5rem' }}>Digital Showroom</h1>
                            <p style={{ fontSize: '0.875rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={16} color="var(--color-accent)" />
                                Live inventory from Frazer DMS
                                {lastSync && ` • Last synced: ${lastSync.toLocaleTimeString()}`}
                            </p>
                        </div>
                        <button
                            onClick={loadInventory}
                            className="btn btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <RefreshCw size={18} /> Refresh Feed
                        </button>
                    </div>

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
                                placeholder="Search Make, Model, or Year..."
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
                                max="30000"
                                step="500"
                                value={priceRange}
                                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                            />
                        </div>
                    </div>

                    {loading && (
                        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', marginTop: '1rem' }}>
                            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
                            <p style={{ marginTop: '1rem' }}>Loading live inventory from Frazer DMS...</p>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
                        </div>
                    )}
                </div>
            </section>

            {!loading && (
                <section>
                    <div className="container">
                        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                {filteredCars.length} Freedom Machine{filteredCars.length !== 1 ? 's' : ''} Available
                            </p>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '2.5rem'
                        }}>
                            {filteredCars.length > 0 ? filteredCars.map((car) => (
                                <div key={car.id} style={{
                                    border: '2px solid var(--color-border)',
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    transition: 'box-shadow 0.2s',
                                    cursor: 'pointer'
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                >
                                    {/* Top: Year Make Model */}
                                    <div style={{
                                        padding: '1rem 1.25rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-secondary)'
                                    }}>
                                        <h3 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 700,
                                            margin: 0,
                                            color: 'var(--color-primary)'
                                        }}>
                                            {car.year} {car.make} {car.model}
                                        </h3>
                                        {car.trim && (
                                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', margin: '0.25rem 0 0' }}>
                                                {car.trim}
                                            </p>
                                        )}
                                    </div>

                                    {/* Middle: Primary Image */}
                                    <Link to={`/vehicle/${car.stock}`} style={{ display: 'block', textDecoration: 'none' }}>
                                        <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                                            {/* Heart Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation(); // Safe guard
                                                    toggleGarage(car);
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '0.5rem',
                                                    right: '0.5rem',
                                                    zIndex: 10,
                                                    background: 'rgba(255,255,255,0.9)',
                                                    borderRadius: '50%',
                                                    width: '40px',
                                                    height: '40px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                                    color: isInGarage(car.id) ? '#ef4444' : '#ccc'
                                                }}
                                                title={isInGarage(car.id) ? "Remove from Garage" : "Add to Garage"}
                                            >
                                                <Heart fill={isInGarage(car.id) ? '#ef4444' : 'none'} size={24} />
                                            </button>

                                            {car.photos && car.photos.length > 0 ? (
                                                <img
                                                    src={car.photos[0]}
                                                    alt={`${car.year} ${car.make} ${car.model}`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: '#e2e8f0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <p style={{ color: '#a0aec0', fontWeight: 500 }}>Photo Coming Soon</p>
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Bottom: Price and Mileage */}
                                    <div style={{ padding: '1.25rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '1rem'
                                        }}>
                                            <div>
                                                <p style={{
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    color: 'var(--color-text-light)',
                                                    fontWeight: 600,
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    Price
                                                </p>
                                                <p style={{
                                                    fontSize: '2rem',
                                                    fontWeight: 900,
                                                    color: 'var(--color-primary)',
                                                    margin: 0
                                                }}>
                                                    ${car.price > 0 ? car.price.toLocaleString() : 'Call'}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    color: 'var(--color-text-light)',
                                                    fontWeight: 600,
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    Mileage
                                                </p>
                                                <p style={{
                                                    fontSize: '1.125rem',
                                                    fontWeight: 700,
                                                    color: 'var(--color-dark)',
                                                    margin: 0
                                                }}>
                                                    {car.mileage > 0 ? car.mileage.toLocaleString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            to={`/vehicle/${car.stock}`}
                                            className="btn btn-primary"
                                            style={{
                                                width: '100%',
                                                padding: '0.875rem',
                                                fontSize: '0.875rem',
                                                fontWeight: 700
                                            }}
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem' }}>
                                    <h3>No "Freedom Machines" found matching those criteria.</h3>
                                    <button onClick={() => { setFilter(''); setPriceRange(30000); }} className="btn btn-outline" style={{ marginTop: '1rem' }}>Clear Filters</button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            <footer style={{ backgroundColor: '#1e293b', color: 'white', padding: '3rem 0', marginTop: 'auto' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                        <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Facebook</a>
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Twitter</a>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Instagram</a>
                        <a href="https://youtube.com/playlist?list=PLl7IO3qjXvk6YT6yYeClM1Pn24H0uWGj4&si=fjk0H7RWbmkXIVJL" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>YouTube</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default InventoryLive;
