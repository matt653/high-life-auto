import React, { useState } from 'react';
import '../components/AutoGrader/AutoGrader.css';
import { Search, Bluetooth, Smartphone } from 'lucide-react';

const BluetoothApp = () => {
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [results, setResults] = useState(null);

    const handleSearch = () => {
        // Placeholder logic - In real app, this would hit an API or Database
        setResults({
            found: true,
            title: `Bluetooth Pairing: ${year} ${make} ${model}`,
            steps: [
                "1. Enable Bluetooth on your phone.",
                "2. Turn ignition to accessory mode.",
                "3. Press 'Phone' or 'Setup' button on vehicle information screen.",
                "4. Select 'Add Device' or 'Pair Phone'.",
                "5. Select your vehicle name on your phone's Bluetooth list.",
                "6. Confirm the PIN code matches on both screens."
            ]
        });
    };

    return (
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <Bluetooth size={48} color="#2563eb" />
                    Bluetooth Assistant
                </h1>
                <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>
                    Find pairing instructions for any vehicle in stock.
                </p>
            </div>

            <div className="ag-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="ag-form-group">
                        <label className="ag-label">Year</label>
                        <input type="number" className="ag-input" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2018" />
                    </div>
                    <div className="ag-form-group">
                        <label className="ag-label">Make</label>
                        <input type="text" className="ag-input" value={make} onChange={e => setMake(e.target.value)} placeholder="e.g. Ford" />
                    </div>
                    <div className="ag-form-group">
                        <label className="ag-label">Model</label>
                        <input type="text" className="ag-input" value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. F-150" />
                    </div>
                </div>

                <button onClick={handleSearch} className="ag-btn-primary" style={{ width: '100%', justifyContent: 'center', height: '48px', fontSize: '1.1rem' }}>
                    <Search size={20} style={{ marginRight: '0.5rem' }} /> Find Instructions
                </button>
            </div>

            {results && (
                <div style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
                    <div className="ag-card" style={{ borderLeft: '5px solid #2563eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                            <Smartphone size={32} color="#2563eb" />
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{results.title}</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {results.steps.map((step, index) => (
                                <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: '24px', height: '24px', backgroundColor: '#eff6ff',
                                        borderRadius: '50%', flexShrink: 0, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        color: '#2563eb', fontWeight: 'bold', fontSize: '0.8rem'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.5' }}>{step.substring(3)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BluetoothApp;
