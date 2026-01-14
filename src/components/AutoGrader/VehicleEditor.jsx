import React, { useState, useEffect } from 'react';
import { analyzeVehicle } from '../../services/geminiService';
import './AutoGrader.css';
import { RefreshCw, Play, FileText, CheckCircle, ArrowLeft, ArrowRight, Save, X, Image as ImageIcon, Layout, Box } from 'lucide-react';

const VehicleEditor = ({ vehicle, onSave, onClose }) => {
    const [formData, setFormData] = useState({ ...vehicle });
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // NEW: Simplied tabs - just Data vs Media
    const [section, setSection] = useState('data'); // 'data', 'media', 'ai'

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

    const handleRunAI = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeVehicle(formData);
            setFormData(prev => ({
                ...prev,
                marketingDescription: result.marketingDescription,
                aiGrade: result.grade,
                blemishes: result.blemishes,
                groundingSources: result.groundingSources,
                lastUpdated: Date.now()
            }));
        } catch (error) {
            alert("AI Analysis failed. Please check API Key.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGradeChange = (field, value, category = null) => {
        setFormData(prev => {
            const newGrade = JSON.parse(JSON.stringify(prev.aiGrade || {}));
            if (category) {
                if (!newGrade.categories) newGrade.categories = {};
                if (!newGrade.categories[category]) newGrade.categories[category] = {};
                newGrade.categories[category][field] = value;
            } else {
                newGrade[field] = value;
            }
            return { ...prev, aiGrade: newGrade, lastUpdated: Date.now() };
        });
    };

    const moveImage = (index, direction) => {
        const newImages = [...(formData.imageUrls || [])];
        if (direction === -1 && index > 0) {
            [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
        } else if (direction === 1 && index < newImages.length - 1) {
            [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
        }
        setFormData(prev => ({ ...prev, imageUrls: newImages }));
    };

    const makePrimary = (index) => {
        if (index === 0) return;
        const newImages = [...(formData.imageUrls || [])];
        const [selected] = newImages.splice(index, 1);
        newImages.unshift(selected);
        setFormData(prev => ({ ...prev, imageUrls: newImages }));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#f3f4f6',
            zIndex: 99999, // On top of everything
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* 1. TOP BAR - Distinct Backend Feel */}
            <div style={{
                height: '60px',
                backgroundColor: '#1f2937', // Dark Slate
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2rem',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: '#dc2626', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '900', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        Admin
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                        {formData.year} {formData.make} {formData.model}
                    </h2>
                    <span style={{ opacity: 0.5 }}>#{formData.stockNumber}</span>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={onClose} style={{
                        background: 'transparent',
                        border: '1px solid #4b5563',
                        color: '#9ca3af',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}>
                        Exit / Cancel
                    </button>
                    <button onClick={() => onSave(formData)} style={{
                        backgroundColor: '#2563eb',
                        border: 'none',
                        color: 'white',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                    }}>
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </div>

            {/* 2. MAIN WORKSPACE */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* NAVIGATION TABS (Horizontal, Simple) */}
                <div style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '0 2rem',
                    display: 'flex',
                    gap: '2rem'
                }}>
                    <button
                        onClick={() => setSection('data')}
                        style={{
                            padding: '1rem 0',
                            border: 'none',
                            borderBottom: section === 'data' ? '3px solid #2563eb' : '3px solid transparent',
                            backgroundColor: 'transparent',
                            color: section === 'data' ? '#2563eb' : '#6b7280',
                            fontWeight: section === 'data' ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}
                    >
                        <Box size={18} /> Specs & Pricing
                    </button>
                    <button
                        onClick={() => setSection('media')}
                        style={{
                            padding: '1rem 0',
                            border: 'none',
                            borderBottom: section === 'media' ? '3px solid #da2626' : '3px solid transparent', // Red for emphasis
                            backgroundColor: 'transparent',
                            color: section === 'media' ? '#da2626' : '#6b7280',
                            fontWeight: section === 'media' ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}
                    >
                        <ImageIcon size={18} /> Photos
                    </button>
                    <button
                        onClick={() => setSection('ai')}
                        style={{
                            padding: '1rem 0',
                            border: 'none',
                            borderBottom: section === 'ai' ? '3px solid #7c3aed' : '3px solid transparent', // Purple for AI
                            backgroundColor: 'transparent',
                            color: section === 'ai' ? '#7c3aed' : '#6b7280',
                            fontWeight: section === 'ai' ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}
                    >
                        <Layout size={18} /> AI Content
                    </button>
                </div>

                {/* CONTENT AREA - SCROLLABLE */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: '#f3f4f6' }}>
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                        {/* SECTION: DATA */}
                        {section === 'data' && (
                            <div style={{ maxWidth: '800px' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>Vehicle Specs</h2>

                                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
                            </div>
                        )}


                        {/* SECTION: MEDIA */}
                        {section === 'media' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Photo Lab</h2>
                                    <a href="https://www.remove.bg/upload" target="_blank" rel="noreferrer" className="btn" style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none' }}>
                                        Open BG Remover Tool ↗
                                    </a>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                                    {formData.imageUrls && formData.imageUrls.map((url, index) => (
                                        <div key={index} style={{
                                            width: '240px',
                                            backgroundColor: 'white',
                                            borderRadius: '0.5rem',
                                            overflow: 'hidden',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                            border: index === 0 ? '3px solid #2563eb' : '1px solid #e5e7eb',
                                            position: 'relative'
                                        }}>
                                            {/* Drag Handles / Position Info */}
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0,
                                                padding: '0.25rem', backgroundColor: 'rgba(0,0,0,0.6)',
                                                color: 'white', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between'
                                            }}>
                                                <span>Pos: {index + 1}</span>
                                                {index === 0 && <span style={{ color: '#93c5fd', fontWeight: 'bold' }}>MAIN PHOTO</span>}
                                            </div>

                                            <div style={{ height: '180px', backgroundColor: '#eee' }}>
                                                <img src={url} alt={`img-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>

                                            {/* Action Buttons */}
                                            <div style={{ padding: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                                                <button onClick={() => moveImage(index, -1)} disabled={index === 0} style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: 'white' }} title="Move Left">
                                                    <ArrowLeft size={16} />
                                                </button>
                                                <button onClick={() => moveImage(index, 1)} disabled={index === (formData.imageUrls.length - 1)} style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: 'white' }} title="Move Right">
                                                    <ArrowRight size={16} />
                                                </button>
                                                <button onClick={() => makePrimary(index)} disabled={index === 0} style={{ gridColumn: 'span 2', padding: '0.5rem', backgroundColor: index === 0 ? '#f3f4f6' : '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: index === 0 ? 'default' : 'pointer' }}>
                                                    {index === 0 ? 'Is Primary' : 'Make Primary'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* SECTION: AI CONTENT */}
                        {section === 'ai' && (
                            <div style={{ maxWidth: '900px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h2>AI Page Content</h2>
                                    <button
                                        onClick={handleRunAI}
                                        disabled={isAnalyzing}
                                        style={{
                                            backgroundColor: '#7c3aed', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                                            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px rgba(124, 58, 237, 0.3)'
                                        }}
                                    >
                                        {isAnalyzing ? <RefreshCw className="animate-spin" /> : <Play size={20} />}
                                        {isAnalyzing ? 'Thinking...' : 'Run Auto-Grader'}
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <div className="ag-card" style={{ marginBottom: '2rem' }}>
                                            <h3 style={{ margin: '0 0 1rem 0' }}>Marketing Description</h3>
                                            <textarea
                                                name="marketingDescription"
                                                value={formData.marketingDescription || ''}
                                                onChange={handleInputChange}
                                                rows={12}
                                                className="ag-textarea"
                                                style={{ fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6' }}
                                            />
                                        </div>

                                        {/* Blemishes */}
                                        <div className="ag-card">
                                            <h3 style={{ margin: '0 0 1rem 0', color: '#b91c1c' }}>Known Blemishes</h3>
                                            <textarea
                                                value={formData.blemishes ? formData.blemishes.join('\n') : ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, blemishes: e.target.value.split('\n') }))}
                                                rows={6}
                                                className="ag-textarea"
                                                placeholder="One blemish per line..."
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Overall Grade</div>
                                            <input
                                                value={formData.aiGrade?.overallGrade || 'N/A'}
                                                onChange={(e) => handleGradeChange('overallGrade', e.target.value)}
                                                style={{ fontSize: '3rem', fontWeight: '900', color: '#2563eb', border: 'none', width: '100%', textAlign: 'center', backgroundColor: 'transparent' }}
                                            />
                                        </div>

                                        {/* Categories */}
                                        {formData.aiGrade?.categories && Object.entries(formData.aiGrade.categories).map(([key, cat]) => (
                                            <div key={key} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <strong style={{ fontSize: '0.875rem' }}>{cat.name || key}</strong>
                                                    <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{cat.grade}</span>
                                                </div>
                                                <textarea
                                                    value={cat.reasoning}
                                                    onChange={(e) => handleGradeChange('reasoning', e.target.value, key)}
                                                    style={{ width: '100%', fontSize: '0.8rem', padding: '0.25rem', border: '1px solid #eee' }}
                                                    rows={3}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Sticky Footer - Outside the scrollable area, pinned to bottom */}
                <div style={{
                    padding: '1rem 2rem',
                    borderTop: '1px solid #e2e8f0',
                    backgroundColor: '#fff',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem',
                    flexShrink: 0
                }}>
                    <button onClick={onClose} className="ag-btn-cancel">Cancel</button>
                    <button
                        onClick={() => {
                            console.log("Saving formData...", formData);
                            onSave(formData);
                        }}
                        className="ag-btn-primary"
                    >
                        Save & Publish
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleEditor;
