
import React from 'react';

const VehicleCard = ({ vehicle, onGrade, isLoading }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-200 overflow-hidden">
                <img
                    src={vehicle.imageUrls[0] || `https://picsum.photos/seed/${vehicle.vin}/400/300`}
                    alt={vehicle.model}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                        ${vehicle.retail}
                    </span>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                    {vehicle.mileage} miles • {vehicle.trim}
                </p>

                <button
                    onClick={() => onGrade(vehicle)}
                    disabled={isLoading}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${isLoading
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                        }`}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Grading...
                        </span>
                    ) : 'Grade Vehicle'}
                </button>
            </div>
        </div>
    );
};

export default VehicleCard;
