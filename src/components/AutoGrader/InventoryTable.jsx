import React from 'react';
import { Link } from 'react-router-dom';
import './AutoGrader.css';

const InventoryTable = ({ vehicles }) => {
    return (
        <div className="ag-table-container">
            <table className="ag-table">
                <thead>
                    <tr>
                        <th style={{ width: '80px' }}>Photo</th>
                        <th>Year Make Model</th>
                        <th>Trim</th>
                        <th>VIN</th>
                        <th>Stock #</th>
                        <th>Price</th>
                        <th>Mileage</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {vehicles.map((v) => (
                        <tr key={v.id || v.vin}>
                            <td>
                                {v.imageUrls && v.imageUrls[0] ? (
                                    <img
                                        src={v.imageUrls[0]}
                                        alt="Thumbnail"
                                        style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                ) : (
                                    <div style={{ width: '60px', height: '40px', background: '#e5e7eb', borderRadius: '4px' }} />
                                )}
                            </td>
                            <td style={{ fontWeight: 'bold' }}>
                                {v.year} {v.make} {v.model}
                            </td>
                            <td style={{ color: '#666' }}>{v.trim}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{v.vin}</td>
                            <td style={{ fontWeight: 'bold' }}>{v.stockNumber}</td>
                            <td style={{ color: '#16a34a', fontWeight: 'bold' }}>
                                ${Number(v.retail || 0).toLocaleString()}
                            </td>
                            <td>{Number(v.mileage || 0).toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>
                                <Link
                                    to={`/vehicle/${v.stockNumber}`}
                                    target="_blank"
                                    style={{
                                        padding: '5px 10px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        textDecoration: 'none',
                                        borderRadius: '4px',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    View Live
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default InventoryTable;
