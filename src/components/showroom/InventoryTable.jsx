
import React from 'react';

const InventoryTable = ({ vehicles, onEdit }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Vehicle</th>
                        <th className="px-6 py-4">Stock #</th>
                        <th className="px-6 py-4">Price / Miles</th>
                        <th className="px-6 py-4">AI Content</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {vehicles.map((v) => (
                        <tr key={v.vin} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4">
                                {v.aiGrade ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Graded
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        New
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    <div className="h-10 w-16 shrink-0 overflow-hidden rounded bg-gray-200 mr-3">
                                        <img className="h-full w-full object-cover" src={v.imageUrls[0]} alt="" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{v.year} {v.make}</div>
                                        <div className="text-sm text-gray-500">{v.model} {v.trim}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-700">
                                {v.stockNumber}
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">${v.retail}</div>
                                <div className="text-xs text-gray-500">{Number(v.mileage).toLocaleString()} mi</div>
                            </td>
                            <td className="px-6 py-4">
                                {v.aiGrade ? (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-blue-600">Grade: {v.aiGrade.overallGrade}</span>
                                        <span className="text-xs text-gray-400 truncate max-w-[150px]">Desc: {v.marketingDescription ? 'Ready' : 'Missing'}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400 italic">No analysis</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => onEdit(v)}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
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
