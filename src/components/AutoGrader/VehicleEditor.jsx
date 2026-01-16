import React, { useState, useEffect } from 'react';
import './AutoGrader.css';
import { Save, X } from 'lucide-react';

const VehicleEditor = ({ vehicle, onSave, onClose }) => {
    const [formData, setFormData] = useState({ ...vehicle });

    // Prevent body scroll when manager is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <div style={{
                backgroundColor: 'white',
                width: '90%',
                maxWidth: '800px',
                height: '90vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                            Edit Vehicle: {formData.year} {formData.make}
                        </h2>
                        <span style={{ opacity: 0.7, fontSize: '0.875rem' }}>Stock: {formData.stockNumber}</span>
                    </div>
                    <button onClick={onClose} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div className="ag-form-group">
                            <label className="ag-label">Stock Number</label>
                            <input name="stockNumber" value={formData.stockNumber || ''} onChange={handleInputChange} className="ag-input" />
                        </div>
                        <div className="ag-form-group">
                            <label className="ag-label">VIN</label>
                            <input name="vin" value={formData.vin || ''} onChange={handleInputChange} className="ag-input" disabled style={{ opacity: 0.5 }} />
                        </div>
                        <div className="ag-form-group">
                            <label className="ag-label">Mileage</label>
                            <input name="mileage" value={formData.mileage || ''} onChange={handleInputChange} className="ag-input" />
                        </div>
                        <div className="ag-form-group">
                            <label className="ag-label">Retail Price ($)</label>
                            <input name="retail" value={formData.retail || ''} onChange={handleInputChange} className="ag-input" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#166534' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                        <div className="ag-form-group"><label className="ag-label">Engine</label><input name="engine" value={formData.engine || ''} onChange={handleInputChange} className="ag-input" /></div>
                        <div className="ag-form-group"><label className="ag-label">Transmission</label><input name="transmission" value={formData.transmission || ''} onChange={handleInputChange} className="ag-input" /></div>
                        <div className="ag-form-group"><label className="ag-label">Ext. Color</label><input name="exteriorColor" value={formData.exteriorColor || ''} onChange={handleInputChange} className="ag-input" /></div>
                        <div className="ag-form-group"><label className="ag-label">Market Value ($)</label><input name="marketPrice" value={formData.marketPrice || ''} onChange={handleInputChange} className="ag-input" /></div>
                    </div>

                    <div className="ag-form-group">
                        <label className="ag-label">Internal Comments (Hidden)</label>
                        <textarea name="comments" value={formData.comments || ''} onChange={handleInputChange} rows={3} className="ag-textarea" />
                    </div>
                    <div className="ag-form-group">
                        <label className="ag-label">Website Notes (Red Banner)</label>
                        <textarea name="websiteNotes" value={formData.websiteNotes || ''} onChange={handleInputChange} rows={3} className="ag-textarea" style={{ borderColor: '#fca5a5' }} />
                    </div>

                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#f9fafb',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem'
                }}>
                    <button onClick={onClose} style={{
                        padding: '0.75rem 1.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        background: 'white',
                        cursor: 'pointer'
                    }}>
                        Cancel
                    </button>
                    <button onClick={() => onSave(formData)} style={{
                        padding: '0.75rem 1.5rem',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleEditor;
