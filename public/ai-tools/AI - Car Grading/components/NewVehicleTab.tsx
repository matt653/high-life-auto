import React, { useState } from 'react';
import { Vehicle } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Download, Play, FileInput } from 'lucide-react';
import { fetchInventoryCSV } from '../services/csvService';

interface Props {
  onAddVehicle: (v: Vehicle) => void;
  onGradeNow: (v: Vehicle) => void;
  onImportFeed: (vehicles: Vehicle[]) => void;
}

export const NewVehicleTab: React.FC<Props> = ({ onAddVehicle, onGradeNow, onImportFeed }) => {
  const [loading, setLoading] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');
  const [feedError, setFeedError] = useState('');

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    year: '',
    make: '',
    model: '',
    trim: '',
    vin: '',
    miles: '',
    price: '',
    color: ''
  });

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualForm({ ...manualForm, [e.target.name]: e.target.value });
  };

  const createVehicleFromForm = (): Vehicle => {
    return {
      id: uuidv4(),
      year: manualForm.year || '2024',
      make: manualForm.make || 'Unknown',
      model: manualForm.model || 'Unknown',
      trim: manualForm.trim,
      vin: manualForm.vin || 'N/A',
      miles: parseInt(manualForm.miles) || 0,
      price: parseFloat(manualForm.price) || 0,
      color: manualForm.color,
      location: 'Manual Entry',
      imageUrls: [] // Initialize empty for manual
    };
  };

  const handleManualSubmit = (gradeNow: boolean) => {
    const vehicle = createVehicleFromForm();
    if (gradeNow) {
      onGradeNow(vehicle);
    } else {
      onAddVehicle(vehicle);
      // Reset form
      setManualForm({
        year: '', make: '', model: '', trim: '', vin: '', miles: '', price: '', color: ''
      });
    }
  };

  const handleFeedImport = async () => {
    if (!feedUrl) return;
    setLoading(true);
    setFeedError('');
    try {
      const vehicles = await fetchInventoryCSV(feedUrl);
      if (vehicles.length === 0) {
        setFeedError("No vehicles found in CSV.");
      } else {
        onImportFeed(vehicles);
        setFeedUrl('');
      }
    } catch (err) {
      setFeedError("Failed to fetch or parse CSV. Check URL and permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* LEFT: Manual Entry */}
      <div className="bg-dark-800 rounded-lg shadow-xl border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
          <div className="bg-brand-900/50 p-2 rounded">
            <Plus className="text-brand-400" size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Manual Entry</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Year</label>
            <input name="year" value={manualForm.year} onChange={handleManualChange} className="w-full bg-dark-900 border border-gray-600 rounded p-2 text-white focus:border-brand-500 outline-none" placeholder="2015" />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-400 mb-1">Make</label>
            <input name="make" value={manualForm.make} onChange={handleManualChange} className="w-full bg-dark-900 border border-gray-600 rounded p-2 text-white focus:border-brand-500 outline-none" placeholder="Toyota" />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-400 mb-1">Model</label>
            <input name="model" value={manualForm.model} onChange={handleManualChange} className="w-full bg-dark-900 border border-gray-600 rounded p-2 text-white focus:border-brand-500 outline-none" placeholder="Camry" />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-400 mb-1">Trim</label>
            <input name="trim" value={manualForm.trim} onChange={handleManualChange} className="w-full bg-dark-900 border border-gray-600 rounded p-2 text-white focus:border-brand-500 outline-none" placeholder="LE" />
          </div>
          <div className="col-span-2">
             <label className="block text-xs font-medium text-gray-400 mb-1">VIN</label>
            <input name="vin" value={manualForm.vin} onChange={handleManualChange} className="w-full bg-dark-900 border border-gray-600 rounded p-2 text-white focus:border-brand-500 outline-none" placeholder="1G1..." />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-400 mb-1">Price ($)</label>
            <input name="price" type="number" value={manualForm.price} onChange={handleManualChange} className="w-full bg-dark-900 border border-gray-600 rounded p-2 text-white focus:border-brand-500 outline-none" placeholder="5000" />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-400 mb-1">Miles</label>
            <input name="miles" type="number" value={manualForm.miles} onChange={handleManualChange} className="w-full bg-dark-900 border border-gray-600 rounded p-2 text-white focus:border-brand-500 outline-none" placeholder="120000" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => handleManualSubmit(false)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-medium transition-colors"
          >
            Add to Inventory
          </button>
          <button 
            onClick={() => handleManualSubmit(true)}
            className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2 rounded font-medium transition-colors flex justify-center items-center gap-2"
          >
            <Play size={16} fill="currentColor" />
            Grade Now
          </button>
        </div>
      </div>

      {/* RIGHT: Feed Import */}
      <div className="bg-dark-800 rounded-lg shadow-xl border border-gray-700 p-6 h-fit">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
          <div className="bg-green-900/50 p-2 rounded">
            <Download className="text-green-400" size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Import External Feed</h2>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Paste a CSV URL from an auction site or other dealer source. The system will parse it and add unique vehicles to your active inventory.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Feed / CSV URL</label>
            <input 
              value={feedUrl} 
              onChange={(e) => setFeedUrl(e.target.value)} 
              className="w-full bg-dark-900 border border-gray-600 rounded p-2 text-white focus:border-brand-500 outline-none font-mono text-sm" 
              placeholder="https://example.com/auction_list.csv" 
            />
          </div>
          
          {feedError && (
            <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-900">
              {feedError}
            </div>
          )}

          <button 
            onClick={handleFeedImport}
            disabled={loading || !feedUrl}
            className={`w-full py-2 rounded font-medium transition-colors flex justify-center items-center gap-2 ${
              loading || !feedUrl 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {loading ? 'Fetching...' : 'Import Feed'}
          </button>
        </div>
      </div>

    </div>
  );
};