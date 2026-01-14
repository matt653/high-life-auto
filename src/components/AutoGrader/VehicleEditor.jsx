import React, { useState } from 'react';
import { analyzeVehicle } from '../../services/geminiService';
import './AutoGrader.css';
import { RefreshCw, Play, FileText, CheckCircle } from 'lucide-react';

const VehicleEditor = ({ vehicle, onSave, onClose }) => {
    const [formData, setFormData] = useState({ ...vehicle });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('ai'); // 'details' | 'ai'

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
                blemishes: result.blemishes, // Capture blemishes
                groundingSources: result.groundingSources,
                lastUpdated: Date.now()
            }));
        } catch (error) {
            alert("AI Analysis failed. Please check API Key in .env file.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGradeChange = (field, value, category = null) => {
        setFormData(prev => {
            // Deep copy to avoid mutation
            const newGrade = JSON.parse(JSON.stringify(prev.aiGrade));

            if (category) {
                if (newGrade.categories[category]) {
                    newGrade.categories[category][field] = value;
                }
            } else {
                newGrade[field] = value;
            }

            return { ...prev, aiGrade: newGrade, lastUpdated: Date.now() };
        });
    };

    return (
        <div className="ag-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 9999 }}>
            {/* Modal Container with Fixed Height and Hidden Overflow for scrolling inner content */}
            <div className="ag-modal-content" style={{
                display: 'flex',
                flexDirection: 'column',
                height: '80vh', // Fixed height based on viewport
                maxHeight: '800px', // Max pixel height for really large screens
                width: '100%',
                maxWidth: '1200px',
                overflow: 'hidden',
                borderRadius: '1rem',
                backgroundColor: 'white',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative' // Ensure stacking context
            }}>
                {/* Header - Fixed at Top */}
                <div className="ag-modal-header" style={{ flexShrink: 0, padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 className="ag-modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>
                                <span className="ag-tag-editor" style={{ marginRight: '0.5rem' }}>Editor</span>
                                {formData.year} {formData.make} {formData.model}
                            </h2>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.875rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                                <span>VIN: {formData.vin}</span>
                                <span>|</span>
                                <span>Stock: {formData.stockNumber}</span>
                            </div>
                        </div>
                        {/* Close Button X */}
                        <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
                    </div>
                </div>

                {/* Scrollable Body Section */}
                <div className="ag-layout-split" style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>

                    {/* Left Column: Data Input */}
                    <div className="ag-col-left">
                        <h3 className="ag-section-title">Inventory Data</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div className="ag-form-group">
                                <label className="ag-label">Stock Number</label>
                                <input
                                    type="text"
                                    name="stockNumber"
                                    value={formData.stockNumber || ''}
                                    onChange={handleInputChange}
                                    className="ag-input"
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </div>
                            <div className="ag-form-group">
                                <label className="ag-label">Mileage</label>
                                <input
                                    type="text"
                                    name="mileage"
                                    value={formData.mileage || ''}
                                    onChange={handleInputChange}
                                    className="ag-input"
                                />
                            </div>
                        </div>

                        <div className="ag-form-group">
                            <label className="ag-label">Retail Price</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '0.75rem', top: '0.5rem', color: '#6b7280' }}>$</span>
                                <input
                                    type="text"
                                    name="retail"
                                    value={formData.retail || ''}
                                    onChange={handleInputChange}
                                    className="ag-input"
                                    style={{ paddingLeft: '1.5rem' }}
                                />
                            </div>
                        </div>

                        <div className="ag-form-group">
                            <label className="ag-label" style={{ fontWeight: 'bold', color: '#1f2937' }}>Internal Comments (CSV Source)</label>
                            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>The AI uses this to understand the vehicle condition.</p>
                            <textarea
                                name="comments"
                                value={formData.comments || ''}
                                onChange={handleInputChange}
                                rows={3}
                                className="ag-textarea"
                                style={{ backgroundColor: '#f3f4f6' }}
                            />
                        </div>

                        <div className="ag-form-group">
                            <label className="ag-label" style={{ fontWeight: 'bold', color: '#1e40af' }}>Additional Note for Website</label>
                            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>Add specific notes here (e.g. "Cash Only")</p>
                            <textarea
                                name="websiteNotes"
                                value={formData.websiteNotes || ''}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="e.g. Needs transmission work, Selling as-is..."
                                className="ag-textarea"
                                style={{ borderColor: '#bfdbfe' }}
                            />
                        </div>

                        <div className="ag-form-group">
                            <label className="ag-label">Option List</label>
                            <textarea
                                name="options"
                                value={formData.options || ''}
                                onChange={handleInputChange}
                                rows={4}
                                className="ag-textarea"
                                style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                            />
                        </div>

                        <div className="ag-form-group">
                            <label className="ag-label">YouTube URL</label>
                            <input
                                type="text"
                                name="youtubeUrl"
                                value={formData.youtubeUrl || ''}
                                onChange={handleInputChange}
                                className="ag-input"
                                style={{ color: '#2563eb' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div className="ag-form-group">
                            <label className="ag-label">Engine</label>
                            <input name="engine" value={formData.engine || ''} onChange={handleInputChange} className="ag-input" />
                        </div>
                        <div className="ag-form-group">
                            <label className="ag-label">Transmission</label>
                            <input name="transmission" value={formData.transmission || ''} onChange={handleInputChange} className="ag-input" />
                        </div>
                        <div className="ag-form-group">
                            <label className="ag-label">Ext. Color</label>
                            <input name="exteriorColor" value={formData.exteriorColor || ''} onChange={handleInputChange} className="ag-input" />
                        </div>
                        <div className="ag-form-group">
                            <label className="ag-label">Market Price</label>
                            <input name="marketPrice" value={formData.marketPrice || ''} onChange={handleInputChange} className="ag-input" />
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Analysis */}
                <div className="ag-col-right">

                    {/* Toolbar */}
                    <div className="ag-tabs">
                        <div style={{ display: 'flex' }}>
                            <button
                                onClick={() => setActiveTab('ai')}
                                className={`ag-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
                            >
                                AI Grading & Copy
                            </button>
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`ag-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                            >
                                Edit Report Card
                            </button>
                            <button
                                onClick={() => setActiveTab('images')}
                                className={`ag-tab-btn ${activeTab === 'images' ? 'active' : ''}`}
                            >
                                Images
                            </button>
                        </div>
                        <button
                            onClick={handleRunAI}
                            disabled={isAnalyzing}
                            className="ag-ai-btn"
                        >
                            {isAnalyzing ? (
                                <>
                                    <RefreshCw size={12} className="animate-spin" />
                                    Listening...
                                </>
                            ) : (
                                <>
                                    <Play size={12} fill="currentColor" />
                                    Analyze Video & Grade
                                </>
                            )}
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="ag-scroll-content">
                        {activeTab === 'ai' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                                {/* Generated Description Editor */}
                                <div className="ag-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                            <FileText size={20} color="#9333ea" />
                                            Marketing Description
                                        </h4>
                                        {formData.lastUpdated && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Updated: {new Date(formData.lastUpdated).toLocaleTimeString()}</span>}
                                    </div>
                                    {formData.marketingDescription ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <textarea
                                                name="marketingDescription"
                                                value={formData.marketingDescription}
                                                onChange={handleInputChange}
                                                className="ag-textarea"
                                                style={{ minHeight: '16rem', fontFamily: 'monospace', lineHeight: '1.5' }}
                                            />
                                            <div style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                                <CheckCircle size={16} />
                                                This description contains HTML tags for formatting on your website. Edit carefully.
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ height: '10rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
                                            <p style={{ fontSize: '0.875rem' }}>Click "Analyze Video" to generate description.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Blemishes Section - Editable */}
                                <div className="ag-card">
                                    <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#b91c1c' }}>Identified Blemishes (One per line)</h4>
                                    <textarea
                                        value={formData.blemishes ? formData.blemishes.join('\n') : ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            blemishes: e.target.value.split('\n')
                                        }))}
                                        className="ag-textarea"
                                        rows={5}
                                        placeholder="Enter blemishes here, one per line..."
                                        style={{ color: '#4b5563', fontSize: '0.875rem' }}
                                    />
                                </div>

                                {/* Quick Stats Summary */}
                                {formData.aiGrade && (
                                    <div className="ag-grade-grid">
                                        <div className="ag-grade-box">
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Grade</div>
                                            <div style={{ fontSize: '1.875rem', fontWeight: '900', color: '#2563eb' }}>{formData.aiGrade.overallGrade}</div>
                                        </div>
                                        <div className="ag-grade-box">
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>GPA Score</div>
                                            <div style={{ fontSize: '1.875rem', fontWeight: '900', color: '#1f2937' }}>{formData.aiGrade.overallScore}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Grounding Sources */}
                                {formData.groundingSources && formData.groundingSources.length > 0 && (
                                    <div className="ag-card">
                                        <h5 className="ag-section-title">Sources Used</h5>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {formData.groundingSources.map((source, i) => (
                                                <li key={i}>
                                                    <a href={source.uri} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none' }}>
                                                        {source.title}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'images' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                <div className="ag-card" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
                                    <h4 style={{ margin: 0, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.25rem' }}>📸</span> Image Manager
                                    </h4>
                                    <p style={{ fontSize: '0.875rem', color: '#0c4a6e', marginTop: '0.5rem' }}>
                                        Drag and drop support coming soon. For now, use the buttons to reorder.
                                        The first image is the <strong>Primary</strong> photo.
                                    </p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                                    {formData.imageUrls && formData.imageUrls.map((url, index) => (
                                        <div key={index} style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: index === 0 ? '3px solid #2563eb' : '1px solid #e5e7eb' }}>
                                            {index === 0 && (
                                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#2563eb', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', textAlign: 'center', padding: '0.1rem' }}>PRIMARY</div>
                                            )}

                                            <div style={{ aspectRatio: '4/3', backgroundColor: '#eee' }}>
                                                <img src={url} alt={`Vehicle ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                {index !== 0 && (
                                                    <button
                                                        onClick={() => {
                                                            const newImages = [...formData.imageUrls];
                                                            // Swap with 0 (Make Primary)
                                                            [newImages[0], newImages[index]] = [newImages[index], newImages[0]];
                                                            setFormData(prev => ({ ...prev, imageUrls: newImages }));
                                                        }}
                                                        style={{ padding: '0.25rem', backgroundColor: '#eff6ff', border: 'none', fontSize: '0.7rem', color: '#1d4ed8', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        Make Primary
                                                    </button>
                                                )}

                                                <div style={{ display: 'flex' }}>
                                                    <button
                                                        disabled={index === 0}
                                                        onClick={() => {
                                                            if (index === 0) return;
                                                            const newImages = [...formData.imageUrls];
                                                            [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
                                                            setFormData(prev => ({ ...prev, imageUrls: newImages }));
                                                        }}
                                                        style={{ flex: 1, padding: '0.25rem', backgroundColor: 'white', border: 'none', borderRight: '1px solid #eee', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? '#ccc' : '#333' }}
                                                    >
                                                        &larr;
                                                    </button>
                                                    <button
                                                        disabled={index === formData.imageUrls.length - 1}
                                                        onClick={() => {
                                                            if (index === formData.imageUrls.length - 1) return;
                                                            const newImages = [...formData.imageUrls];
                                                            [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
                                                            setFormData(prev => ({ ...prev, imageUrls: newImages }));
                                                        }}
                                                        style={{ flex: 1, padding: '0.25rem', backgroundColor: 'white', border: 'none', cursor: index === formData.imageUrls.length - 1 ? 'not-allowed' : 'pointer', color: index === formData.imageUrls.length - 1 ? '#ccc' : '#333' }}
                                                    >
                                                        &rarr;
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        // Mock "AI Enhance" - just append a query param to bust cache or simulated effect?
                                                        // For now, let's just alert
                                                        alert("AI Enhancement: Auto-adjusting brightness and removing background noise... (Simulation)");
                                                    }}
                                                    style={{ padding: '0.25rem', backgroundColor: '#fdf2f8', border: 'none', fontSize: '0.7rem', color: '#db2777', cursor: 'pointer', borderTop: '1px solid #fce7f3' }}
                                                    title="Auto-Fix Lighting & Color"
                                                >
                                                    ✨ Auto-Fix
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'details' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {formData.aiGrade ? (
                                    <>
                                        {/* Editable Header Section */}
                                        <div style={{ background: 'linear-gradient(to bottom right, #1e3a8a, #312e81)', borderRadius: '1rem', padding: '1.5rem', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div>
                                                    <h3 style={{ color: '#bfdbfe', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Overall Assessment</h3>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                                        <input
                                                            type="text"
                                                            value={formData.aiGrade.overallGrade}
                                                            onChange={(e) => handleGradeChange('overallGrade', e.target.value)}
                                                            style={{
                                                                backgroundColor: 'transparent',
                                                                border: 'none',
                                                                borderBottom: '2px solid rgba(255,255,255,0.3)',
                                                                color: 'white',
                                                                fontSize: '2.5rem',
                                                                fontWeight: '900',
                                                                width: '80px'
                                                            }}
                                                        />
                                                        <span style={{ fontSize: '1.5rem', fontWeight: '500', color: '#93c5fd', opacity: 0.75 }}>GPA (0-5)</span>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={formData.aiGrade.overallScore}
                                                            onChange={(e) => handleGradeChange('overallScore', parseFloat(e.target.value))}
                                                            style={{
                                                                backgroundColor: 'transparent',
                                                                border: 'none',
                                                                borderBottom: '1px solid rgba(255,255,255,0.3)',
                                                                color: 'white',
                                                                fontSize: '1.5rem',
                                                                fontWeight: 'bold',
                                                                width: '60px',
                                                                marginLeft: '1rem'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#93c5fd', marginBottom: '0.25rem' }}>Instructor Comments (Summary)</label>
                                                <textarea
                                                    value={formData.aiGrade.summary}
                                                    onChange={(e) => handleGradeChange('summary', e.target.value)}
                                                    rows={3}
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        borderRadius: '0.5rem',
                                                        color: 'white',
                                                        padding: '0.75rem',
                                                        fontFamily: 'inherit'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Editable Categories */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {formData.aiGrade.categories && Object.entries(formData.aiGrade.categories).map(([key, cat]) => (
                                                <div key={key} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <h5 style={{ fontWeight: 'bold', color: '#111827', margin: 0, textTransform: 'capitalize' }}>
                                                            {cat.name ? cat.name : key.replace(/_/g, ' ')}
                                                        </h5>
                                                        <textarea
                                                            value={cat.reasoning}
                                                            onChange={(e) => handleGradeChange('reasoning', e.target.value, key)}
                                                            rows={2}
                                                            style={{
                                                                width: '100%',
                                                                marginTop: '0.5rem',
                                                                padding: '0.5rem',
                                                                fontSize: '0.875rem',
                                                                color: '#4b5563',
                                                                border: '1px solid #d1d5db',
                                                                borderRadius: '0.25rem'
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#6b7280' }}>Score (0-5)</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            max="5"
                                                            value={cat.score !== undefined ? cat.score : (cat.grade === 'A' ? 5 : 3)} // Fallback if old data
                                                            onChange={(e) => handleGradeChange('score', parseFloat(e.target.value), key)}
                                                            style={{
                                                                width: '4rem',
                                                                textAlign: 'center',
                                                                backgroundColor: '#f3f4f6',
                                                                padding: '0.25rem',
                                                                borderRadius: '0.25rem',
                                                                fontSize: '1.125rem',
                                                                fontWeight: 'bold',
                                                                border: '1px solid #d1d5db'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ height: '16rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                        <p>No grading data available yet. Run the AI first.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Footer - Always Visible */}
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
    );
};

export default VehicleEditor;
