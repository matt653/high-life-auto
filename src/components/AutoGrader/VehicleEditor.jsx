
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
                groundingSources: result.groundingSources,
                lastUpdated: Date.now()
            }));
        } catch (error) {
            alert("AI Analysis failed. Please check API Key in .env file.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="ag-modal-overlay">
            <div className="ag-modal-content">

                {/* Header */}
                <div className="ag-modal-header">
                    <div>
                        <h2 className="ag-modal-title">
                            <span className="ag-tag-editor">Editor</span>
                            {formData.year} {formData.make} {formData.model}
                        </h2>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.875rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                            <span>VIN: {formData.vin}</span>
                            <span>|</span>
                            <span>Stock: {formData.stockNumber}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={onClose} className="ag-btn-cancel">Cancel</button>
                        <button
                            onClick={() => onSave(formData)}
                            className="ag-btn-primary"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Layout */}
                <div className="ag-layout-split">

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
                                    Preview Report Card
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
                                <div style={{ maxWidth: '48rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

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

                                    {/* Quick Stats Summary */}
                                    {formData.aiGrade && (
                                        <div className="ag-grade-grid">
                                            <div className="ag-grade-box">
                                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Grade</div>
                                                <div style={{ fontSize: '1.875rem', fontWeight: '900', color: '#2563eb' }}>{formData.aiGrade.overallGrade}</div>
                                            </div>
                                            <div className="ag-grade-box">
                                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Score</div>
                                                <div style={{ fontSize: '1.875rem', fontWeight: '900', color: '#1f2937' }}>{formData.aiGrade.overallScore}</div>
                                            </div>
                                            <div className="ag-grade-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <button onClick={() => setActiveTab('details')} style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>View Full Report &rarr;</button>
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

                            {activeTab === 'details' && (
                                <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
                                    {formData.aiGrade ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <div style={{ background: 'linear-gradient(to bottom right, #1e3a8a, #312e81)', borderRadius: '1rem', padding: '1.5rem', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                                                <h3 style={{ color: '#bfdbfe', fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Overall Assessment</h3>
                                                <div style={{ fontSize: '3rem', fontWeight: '900', lineHeight: 1, marginBottom: '0.5rem' }}>{formData.aiGrade.overallGrade} <span style={{ fontSize: '1.5rem', fontWeight: '500', color: '#93c5fd', opacity: 0.75 }}>/ 100</span></div>
                                                <p style={{ color: '#dbeafe', fontStyle: 'italic' }}>"{formData.aiGrade.summary}"</p>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {Object.values(formData.aiGrade.categories).map((cat, idx) => (
                                                    <div key={idx} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <h5 style={{ fontWeight: 'bold', color: '#111827', margin: 0 }}>{cat.name}</h5>
                                                            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem' }}>{cat.reasoning}</p>
                                                        </div>
                                                        <div style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', fontSize: '1.125rem', fontWeight: 'bold' }}>{cat.grade}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ height: '16rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                            <p>No grading data available yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleEditor;
