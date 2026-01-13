import React from 'react';
import { Vehicle } from '../types';
import { Car, Search } from 'lucide-react';

interface Props {
  inventory: Vehicle[];
  onSelect: (v: Vehicle) => void;
}

export const InventoryTable: React.FC<Props> = ({ inventory, onSelect }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredAndSorted = inventory
    .filter(v => 
      `${v.year} ${v.make} ${v.model} ${v.vin} ${v.stockNumber || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // 1. Sort by Year (Descending - Newest first)
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;
      if (yearB !== yearA) return yearB - yearA;

      // 2. Sort by Make (Ascending - A-Z)
      const makeCompare = a.make.localeCompare(b.make);
      if (makeCompare !== 0) return makeCompare;

      // 3. Sort by Model (Ascending - A-Z)
      return a.model.localeCompare(b.model);
    });

  return (
    <div className="bg-dark-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-700 bg-dark-900 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Car className="text-brand-500" />
          Active Inventory
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search stock, VIN, year..." 
            className="bg-dark-800 border border-gray-600 text-white pl-9 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-dark-900 text-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 font-medium">Stock #</th>
              <th className="px-6 py-3 font-medium">Vehicle</th>
              <th className="px-6 py-3 font-medium">VIN</th>
              <th className="px-6 py-3 font-medium text-right">Miles</th>
              <th className="px-6 py-3 font-medium text-right">Price</th>
              <th className="px-6 py-3 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No vehicles found. Upload a CSV or change filters.
                </td>
              </tr>
            ) : filteredAndSorted.map((v) => {
              // Determine thumbnail
              const thumb = v.imageUrls?.[0] || v.imageUrl || '';
              
              return (
                <tr key={v.id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 font-mono text-white font-bold flex items-center gap-3">
                     {thumb && (
                       <img src={thumb} alt="thumb" className="w-10 h-10 object-cover rounded border border-gray-600" />
                     )}
                     {v.stockNumber || '-'}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {v.year} {v.make} {v.model} <span className="text-xs text-gray-500 ml-1">{v.trim}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{v.vin}</td>
                  <td className="px-6 py-4 text-right">{v.miles.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-brand-400 font-bold">${v.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onSelect(v)}
                      className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Grade
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-2 border-t border-gray-700 bg-dark-900 text-xs text-gray-500 text-center">
        Showing {filteredAndSorted.length} vehicles
      </div>
    </div>
  );
};