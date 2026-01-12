
import React, { useState, useMemo } from 'react';
import PublicVehicleDetails from './PublicVehicleDetails';

const PublicInventory = ({ vehicles }) => {
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [filter, setFilter] = useState('');

    const displayedVehicles = useMemo(() => {
        // 1. Filter
        const filtered = vehicles.filter(v =>
            `${v.year} ${v.make} ${v.model} ${v.stockNumber}`.toLowerCase().includes(filter.toLowerCase())
        );

        // 2. Sort: Price Low to High, with $0/Call for Price at the bottom
        return filtered.sort((a, b) => {
            const priceA = parseFloat(a.retail.replace(/[^0-9.]/g, '')) || 0;
            const priceB = parseFloat(b.retail.replace(/[^0-9.]/g, '')) || 0;

            // Handle $0 cases - push to bottom
            if (priceA === 0 && priceB > 0) return 1;
            if (priceB === 0 && priceA > 0) return -1;

            // Standard Low-to-High sort
            return priceA - priceB;
        });
    }, [vehicles, filter]);

    return (
        <div className="bg-gray-50 min-h-screen pb-20">

            {/* Hero / Filter Section */}
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800">Current Inventory <span className="text-gray-400 font-normal">({displayedVehicles.length})</span></h2>
                        <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                placeholder="Filter by Make, Model or Stock #..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-full outline-none transition-all"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayedVehicles.map((vehicle) => (
                        <div
                            key={vehicle.vin}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                            onClick={() => setSelectedVehicle(vehicle)}
                        >
                            {/* Image Container */}
                            <div className="relative h-56 overflow-hidden bg-gray-200">
                                <img
                                    src={vehicle.imageUrls[0]}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    alt={`${vehicle.year} ${vehicle.make}`}
                                />

                                {/* AI Badge Overlay */}
                                {vehicle.aiGrade && (
                                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                                        {vehicle.aiGrade.overallGrade.startsWith('A') && (
                                            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                                ★ HighLife Certified
                                            </span>
                                        )}
                                        <span className="bg-white/90 backdrop-blur text-gray-900 text-xs font-bold px-2 py-1 rounded border border-gray-200 shadow-sm">
                                            Grade: {vehicle.aiGrade.overallGrade}
                                        </span>
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                                    <p className="text-white font-bold text-lg drop-shadow-md">
                                        {(parseFloat(vehicle.retail.replace(/[^0-9.]/g, '')) || 0) === 0 ? 'Call for Price' : `$${vehicle.retail}`}
                                    </p>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <div className="mb-2">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                    </h3>
                                    <p className="text-gray-500 text-sm">{vehicle.trim}</p>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        {Number(vehicle.mileage).toLocaleString()} mi
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                        Stock: {vehicle.stockNumber || vehicle.vin.slice(-6)}
                                    </div>
                                </div>

                                <button className="w-full py-2 bg-gray-50 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors text-sm border border-gray-100">
                                    View Inspection Report &rarr;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedVehicle && (
                <PublicVehicleDetails
                    vehicle={selectedVehicle}
                    onClose={() => setSelectedVehicle(null)}
                />
            )}
        </div>
    );
};

export default PublicInventory;
