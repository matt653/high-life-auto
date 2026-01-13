
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { RAW_VEHICLE_CSV } from './constants';
import { Vehicle } from './types';
import InventoryTable from './components/InventoryTable';
import VehicleEditor from './components/VehicleEditor';
import PublicInventory from './components/PublicInventory';

// The live feed URL provided
const DEFAULT_CSV_URL = "https://highlifeauto.com/frazer-inventory-updated.csv";

const parseCSV = (csv: string): Vehicle[] => {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    // Handle CSV parsing with potential commas inside quotes
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
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('manager');
  const [hasApiKey, setHasApiKey] = useState(true);
  
  // Settings State - Defaulting to the live URL
  const [showSettings, setShowSettings] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(DEFAULT_CSV_URL);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence Keys
  const STORAGE_KEY = 'highlife_inventory_v1';
  const SETTINGS_KEY = 'highlife_settings_v1';

  // Check for API Key on mount
  useEffect(() => {
    const key = process.env.API_KEY || (window as any).process?.env?.API_KEY;
    setHasApiKey(!!key);
  }, []);

  // Initial Data Load (Inventory & Settings)
  useEffect(() => {
    // 1. Load Settings
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Use saved URL if available, otherwise fall back to default
      setGoogleSheetUrl(parsed.googleSheetUrl || DEFAULT_CSV_URL);
      setLastSyncTime(parsed.lastSyncTime || null);
    }

    // 2. Load Inventory
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        setVehicles(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to parse local storage", e);
        setVehicles(parseCSV(RAW_VEHICLE_CSV));
      }
    } else {
      setVehicles(parseCSV(RAW_VEHICLE_CSV));
    }
  }, []);

  // Save Inventory Effect
  useEffect(() => {
    if (vehicles.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    }
  }, [vehicles]);

  // Save Settings Effect
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ googleSheetUrl, lastSyncTime }));
  }, [googleSheetUrl, lastSyncTime]);


  // ==========================================
  // SYNC ENGINE
  // ==========================================
  const performSmartSync = useCallback(async (manual = false) => {
    if (!googleSheetUrl) {
      if (manual) setNotification({ message: "Please configure Feed URL in Settings first.", type: 'error' });
      return;
    }

    setIsSyncing(true);
    try {
      // Add a timestamp to prevent caching of the CSV file
      const cacheBuster = `?t=${new Date().getTime()}`;
      const fetchUrl = googleSheetUrl.includes('?') ? `${googleSheetUrl}&t=${new Date().getTime()}` : `${googleSheetUrl}${cacheBuster}`;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error("Failed to fetch CSV feed");
      const csvText = await response.text();
      
      const remoteInventory = parseCSV(csvText);
      
      // ------------------------------------------
      // SMART MERGE LOGIC
      // ------------------------------------------
      // 1. Map existing vehicles (Source of Truth for AI Data)
      const localMap = new Map<string, Vehicle>();
      vehicles.forEach(v => localMap.set(v.vin, v));

      let addedCount = 0;
      let updatedCount = 0;

      const mergedVehicles = remoteInventory.map(remoteVehicle => {
        const localMatch = localMap.get(remoteVehicle.vin);
        
        if (localMatch) {
          // UPDATE EXISTING
          // We take the "Hard Data" (Price, Miles, Comments) from the CSV (remoteVehicle)
          // We keep the "AI Data" (Grades, Description, WebsiteNotes) from Local (localMatch)
          updatedCount++;
          return {
            ...remoteVehicle, // Overwrites price, miles, comments, youtube link from CSV
            marketingDescription: localMatch.marketingDescription, // Preserve AI
            aiGrade: localMatch.aiGrade, // Preserve AI
            groundingSources: localMatch.groundingSources, // Preserve AI
            websiteNotes: localMatch.websiteNotes, // Preserve manual website notes
            lastUpdated: localMatch.lastUpdated
          };
        } else {
          // NEW VEHICLE
          addedCount++;
          return remoteVehicle;
        }
      });

      // REMOVED VEHICLES
      // If it was in Local but NOT in Remote, it is gone (Sold).
      const removedCount = vehicles.length - (remoteInventory.length - addedCount);

      setVehicles(mergedVehicles);
      const now = new Date().toLocaleString();
      setLastSyncTime(now);
      
      if (manual || addedCount > 0 || removedCount > 0 || updatedCount > 0) {
        setNotification({ 
          message: `Sync Complete: +${addedCount} New, ${updatedCount} Updated, -${removedCount} Sold`, 
          type: 'success' 
        });
        setTimeout(() => setNotification(null), 5000);
      } else if (manual) {
        setNotification({ message: "Sync Complete: Inventory is up to date.", type: 'info' });
        setTimeout(() => setNotification(null), 3000);
      }

    } catch (error) {
      console.error("Sync Error:", error);
      if (manual) setNotification({ message: "Failed to sync. Check URL or CORS settings.", type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  }, [googleSheetUrl, vehicles]);

  // Automatic Hourly Sync (8am - 7pm)
  useEffect(() => {
    if (!googleSheetUrl) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // LOGIC: Only sync between 8:00 AM and 7:00 PM (19:00)
      if (currentHour >= 8 && currentHour <= 19) {
        console.log(`[AutoSync] Time is ${now.toLocaleTimeString()}. Within business hours (8am-7pm). Syncing...`);
        performSmartSync(false);
      } else {
        console.log(`[AutoSync] Time is ${now.toLocaleTimeString()}. Outside business hours. Skipping sync.`);
      }
    }, 60 * 60 * 1000); // Check every 60 minutes

    return () => clearInterval(intervalId);
  }, [googleSheetUrl, performSmartSync]);


  // ==========================================
  // HANDLERS
  // ==========================================

  // Filter Logic
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => 
      `${v.make} ${v.model} ${v.year} ${v.vin} ${v.stockNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);

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

  // Manual Import (Legacy File Upload)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const remoteInventory = parseCSV(content);
        const localMap = new Map<string, Vehicle>();
        vehicles.forEach(v => localMap.set(v.vin, v));

        const mergedVehicles = remoteInventory.map(remoteVehicle => {
          const localMatch = localMap.get(remoteVehicle.vin);
          if (localMatch) {
            return {
              ...remoteVehicle,
              marketingDescription: localMatch.marketingDescription,
              aiGrade: localMatch.aiGrade,
              groundingSources: localMatch.groundingSources,
              websiteNotes: localMatch.websiteNotes,
              lastUpdated: localMatch.lastUpdated
            };
          } else {
            return remoteVehicle;
          }
        });
        setVehicles(mergedVehicles);
        setNotification({ message: "Manual CSV Upload Complete.", type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Settings Modal Component
  const SettingsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold">Feed Settings</h3>
          <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Inventory Feed URL (CSV)</label>
          <input 
            type="text" 
            value={googleSheetUrl}
            onChange={(e) => setGoogleSheetUrl(e.target.value)}
            placeholder="https://..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-gray-500 mb-6">
            This URL is checked for updates. Ensure it points to a raw CSV file.
          </p>
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6">
             <h4 className="text-blue-800 font-bold text-xs uppercase mb-1">Smart Sync Active</h4>
             <p className="text-blue-700 text-sm mb-2">
               The app will automatically check this feed <strong>every hour between 8:00 AM and 7:00 PM</strong> while the tab is open.
             </p>
             <ul className="text-blue-700 text-xs list-disc pl-4">
                <li>New vehicles are added automatically.</li>
                <li>Sold vehicles (missing from feed) are removed.</li>
                <li>Price/Mileage updates are applied.</li>
                <li><strong>AI Grades & Descriptions are preserved.</strong></li>
             </ul>
          </div>

          <div className="flex justify-end gap-3">
             <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-gray-600 font-bold text-sm">Close</button>
             <button 
               onClick={() => { performSmartSync(true); setShowSettings(false); }}
               disabled={!googleSheetUrl}
               className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm disabled:opacity-50"
             >
               Save & Sync Now
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      
      {/* Top Navigation */}
      <header className="bg-gray-900 text-white shadow-md z-20 sticky top-0">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/50">H</div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">HighLife Auto</h1>
            
            {/* View Switcher */}
            <div className="sm:ml-8 flex bg-gray-800 rounded-lg p-1">
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
                PREVIEW
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {notification && (
               <div className={`px-4 py-1 rounded-full text-sm font-bold animate-pulse ${notification.type === 'error' ? 'bg-red-500' : notification.type === 'info' ? 'bg-blue-500' : 'bg-green-500'} text-white shadow-lg`}>
                 {notification.message}
               </div>
             )}
             
             {viewMode === 'manager' && (
               <>
                 <div className="text-xs text-right hidden lg:block">
                    <div className="text-gray-400 font-mono">{vehicles.filter(v => v.aiGrade).length} GRADED / {vehicles.length} TOTAL</div>
                    {lastSyncTime && <div className="text-gray-600 text-[10px]">Synced: {lastSyncTime}</div>}
                 </div>
                 
                 <div className="h-6 w-px bg-gray-700 mx-2 hidden sm:block"></div>

                 <button 
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
                    title="Sync Settings"
                 >
                   <svg className={`w-5 h-5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                 </button>

                 <button 
                    onClick={handleExport}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded text-sm font-medium transition-colors border border-gray-700 hidden sm:block"
                 >
                   Backup
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
                     onClick={() => fileInputRef.current?.click()}
                     className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-bold transition-colors border border-blue-200"
                   >
                     Import File
                   </button>
                   <button 
                     onClick={() => performSmartSync(true)}
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                   >
                     {isSyncing ? 'Syncing...' : 'Sync Now'}
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

      {/* Settings Modal */}
      {showSettings && <SettingsModal />}

      {/* Editor Modal */}
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
