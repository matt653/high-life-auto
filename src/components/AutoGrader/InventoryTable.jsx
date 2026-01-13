
import React from 'react';
import './AutoGrader.css';

const InventoryTable = ({ vehicles, onEdit }) => {
    return (
        <div className="ag-table-container">
            <table className="ag-table">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Vehicle</th>
                        <th>Stock #</th>
                        <th>Price / Miles</th>
                        <th>AI Content</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {vehicles.map((v) => (
                        <tr key={v.vin}>
                            <td>
                                {v.aiGrade ? (
                                    <span className="ag-badge ag-badge-green">
                                        Graded
                                    </span>
                                ) : (
                                    <span className="ag-badge ag-badge-gray">
                                        New
                                    </span>
                                )}
                            </td>
                            <td>
                                <div className="ag-vehicle-cell">
                                    <div className="ag-vehicle-img">
                                        <img src={v.imageUrls[0]} alt="" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#111827' }}>{v.year} {v.make}</div>
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{v.model} {v.trim}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ fontWeight: 'bold', color: '#374151', fontSize: '0.875rem' }}>
                                {v.stockNumber}
                            </td>
                            <td>
                                <div style={{ fontWeight: '500', color: '#111827' }}>${v.retail}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{Number(v.mileage).toLocaleString()} mi</div>
                            </td>
                            <td>
                                {v.aiGrade ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#2563eb' }}>Grade: {v.aiGrade.overallGrade}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            Desc: {v.marketingDescription ? 'Ready' : 'Missing'}
                                        </span>
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>No analysis</span>
                                )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <button
                                    onClick={() => onEdit(v)}
                                    className="ag-btn-link"
                                >
                                    Manage
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default InventoryTable;
