
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RAW_VEHICLE_CSV } from './constants';
import { Vehicle } from './types';
import InventoryTable from './components/InventoryTable';
import VehicleEditor from './components/VehicleEditor';
import PublicInventory from './components/PublicInventory';

const parseCSV = (csv: string): Vehicle[] => {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      else if (line[i] === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += line[i];
      }
    }
    values.push(current.trim());

    const get = (h: string) => (values[headers.indexOf(h)] || "").replace(/"/g, '').trim();
    
    return {
      vin: get("Vehicle Vin"),
      stockNumber: get("Stock Number"),
      make: get("Vehicle Make"),
      model: get("Vehicle Model"),
      trim: get("Vehicle Trim Level"),
      year: get("Vehicle Year"),
      mileage: get("Mileage"),
      retail: get("Retail"),
      cost: get("Cost"),
      youtubeUrl: get("YouTube URL"),
      imageUrls: get("Image URL").split('|'),
      comments: get("Comments"),
      options: get("Option List"),
      type: get("Vehicle Type")
    };
  });
};

type ViewMode = 'manager' | 'public';

function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('manager');
  const [hasApiKey, setHasApiKey] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence Key
  const STORAGE_KEY = 'highlife_inventory_v1';

  // Check for API Key on mount
  useEffect(() => {
    const key = process.env.API_KEY || (window as any).process?.env?.API_KEY;
    setHasApiKey(!!key);
  }, []);

  // Initial Data Load
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        setVehicles(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to parse local storage", e);
        // Fallback to default
        setVehicles(parseCSV(RAW_VEHICLE_CSV));
      }
    } else {
      setVehicles(parseCSV(RAW_VEHICLE_CSV));
    }
  }, []);

  // Persistence Effect
  useEffect(() => {
    if (vehicles.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    }
  }, [vehicles]);

  // Filter Logic
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => 
      `${v.make} ${v.model} ${v.year} ${v.vin} ${v.stockNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);

  // Actions
  const handleSaveVehicle = (updatedVehicle: Vehicle) => {
    setVehicles(prev => prev.map(v => v.vin === updatedVehicle.vin ? updatedVehicle : v));
    setEditingVehicle(null);
  };

  const handleExport = () => {
    const jsonString = JSON.stringify(vehicles, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `highlife_inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification({ message: "Inventory backup downloaded!", type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          const newInventory = parseCSV(content);
          
          // INTELLIGENT MERGE LOGIC
          // 1. Identify VINs present in new CSV
          const newVins = new Set(newInventory.map(v => v.vin));
          
          // 2. Map existing vehicles for quick lookup
          const existingMap = new Map<string, Vehicle>();
          vehicles.forEach(v => existingMap.set(v.vin, v));

          // 3. Construct Merged List
          let addedCount = 0;
          let updatedCount = 0;

          const mergedVehicles = newInventory.map(newVehicle => {
            const existing = existingMap.get(newVehicle.vin);
            
            if (existing) {
              // UPDATE: Keep new CSV core data, but preserve local AI enhancements
              updatedCount++;
              return {
                ...newVehicle, // Take price, mileage, basic info from NEW CSV
                marketingDescription: existing.marketingDescription, // Preserve our work
                aiGrade: existing.aiGrade, // Preserve our work
                lastUpdated: existing.lastUpdated // Keep timestamp
              };
            } else {
              // NEW: Add completely new vehicle
              addedCount++;
              return newVehicle;
            }
          });

          // 4. Determine Removed Count
          // (Old Count) - (Updated Count that remained) = Removed
          // Actually simpler: vehicles.length - (how many existing were found in new)
          // But strict logic: 
          const removedCount = vehicles.length - (newInventory.length - addedCount);

          setVehicles(mergedVehicles);
          setNotification({ 
            message: `Sync Complete: +${addedCount} Added, ${updatedCount} Updated, -${removedCount} Removed`, 
            type: 'success' 
          });
          setTimeout(() => setNotification(null), 5000);

        } catch (error) {
          console.error(error);
          setNotification({ message: "Failed to parse CSV file.", type: 'info' });
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      
      {/* Top Navigation */}
      <header className="bg-gray-900 text-white shadow-md z-20 sticky top-0">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/50">H</div>
            <h1 className="text-lg font-bold tracking-tight">HighLife Auto</h1>
            
            {/* View Switcher */}
            <div className="ml-8 flex bg-gray-800 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('manager')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'manager' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                MANAGER
              </button>
              <button 
                onClick={() => setViewMode('public')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'public' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                WEBSITE PREVIEW
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {notification && (
               <div className={`px-4 py-1 rounded-full text-sm font-bold animate-pulse ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                 {notification.message}
               </div>
             )}
             {viewMode === 'manager' && (
               <>
                 <div className="text-xs text-gray-400 font-mono hidden sm:block">
                    {vehicles.filter(v => v.aiGrade).length} GRADED / {vehicles.length} TOTAL
                 </div>
                 <button 
                    onClick={handleExport}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded text-sm font-medium transition-colors border border-gray-700"
                 >
                   Backup Data
                 </button>
               </>
             )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-auto">
        {!hasApiKey && (
          <div className="bg-red-600 text-white px-4 py-3 text-center font-bold">
            ⚠️ API Configuration Missing: Please set the API_KEY in your environment or index.html for AI features to work.
          </div>
        )}
        
        {viewMode === 'manager' ? (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-8xl mx-auto space-y-6">
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="relative w-full sm:w-96">
                  <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input 
                    type="text" 
                    placeholder="Search inventory by VIN, Stock #, Model..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                  />
                </div>
                <div className="flex gap-2">
                   <input 
                     type="file" 
                     ref={fileInputRef}
                     onChange={handleFileUpload}
                     accept=".csv"
                     className="hidden"
                   />
                   <button 
                     onClick={handleImportClick}
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                     Import CSV Update
                   </button>
                </div>
              </div>

              {/* Data Table */}
              <InventoryTable 
                vehicles={filteredVehicles} 
                onEdit={setEditingVehicle} 
              />
            </div>
          </div>
        ) : (
          <PublicInventory vehicles={vehicles} />
        )}
      </main>

      {/* Editor Modal (Only active in manager mode logically, but state kept here) */}
      {editingVehicle && viewMode === 'manager' && (
        <VehicleEditor 
          vehicle={editingVehicle} 
          onSave={handleSaveVehicle}
          onClose={() => setEditingVehicle(null)} 
        />
      )}
    </div>
  );
}

export default App;
