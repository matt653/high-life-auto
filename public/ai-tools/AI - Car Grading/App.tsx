import React, { useState, useEffect } from 'react';
import { Vehicle, AppState, GradingResult, GradingInput } from './types';
import { fetchInventoryCSV, parseCSV } from './services/csvService';
import { gradeVehicle } from './services/geminiService';
import { DEFAULT_INVENTORY_URL } from './constants';
import { InventoryTable } from './components/InventoryTable';
import { NewVehicleTab } from './components/NewVehicleTab';
import { VehicleGrader } from './components/VehicleGrader';
import { AnalysisResult } from './components/AnalysisResult';
import { Car, Upload, AlertCircle, PlusCircle, List, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INVENTORY);
  // Add a sub-state for the Inventory Tab view (Active List vs Intake Form)
  const [activeTab, setActiveTab] = useState<'inventory' | 'new'>('inventory');
  
  const [inventory, setInventory] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GradingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDefaultInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchInventoryCSV(DEFAULT_INVENTORY_URL);
      if (data.length === 0) {
        setError("Fetched CSV was empty or format unrecognized.");
      } else {
        setInventory(data);
      }
    } catch (err: any) {
      console.warn("Auto-fetch failed.", err);
      setError("Could not load active inventory. Check connection or upload CSV manually.");
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadDefaultInventory();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string;
          const data = parseCSV(csvText);
          setInventory(data);
          setActiveTab('inventory'); // Switch to list view to see imported data
        } catch (err) {
          setError("Failed to parse CSV file.");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setAppState(AppState.GRADING);
    setAnalysisResult(null);
  };

  // Handlers for New Vehicle Tab
  const handleAddNewVehicle = (vehicle: Vehicle) => {
    setInventory(prev => [vehicle, ...prev]);
    setActiveTab('inventory');
  };

  const handleGradeNewVehicle = (vehicle: Vehicle) => {
    // Add to inventory temporarily and jump to grading
    setInventory(prev => [vehicle, ...prev]);
    handleSelectVehicle(vehicle);
  };

  const handleImportFeed = (vehicles: Vehicle[]) => {
    // Merge, avoiding duplicates by VIN if possible
    setInventory(prev => {
      const existingVins = new Set(prev.map(v => v.vin));
      const newUnique = vehicles.filter(v => !existingVins.has(v.vin));
      return [...newUnique, ...prev];
    });
    setActiveTab('inventory');
  };

  const handleRunAnalysis = async (input: GradingInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await gradeVehicle(input);
      setAnalysisResult(result);
      setAppState(AppState.RESULTS);
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setAppState(AppState.INVENTORY);
    setSelectedVehicle(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 font-sans">
      {/* Navbar */}
      <nav className="border-b border-gray-700 bg-dark-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={resetAnalysis}>
              <div className="bg-brand-600 p-2 rounded-lg">
                <Car className="text-white h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">AutoGrade<span className="text-brand-500">Pro</span></span>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Refresh Button */}
               <button 
                 onClick={loadDefaultInventory}
                 disabled={isLoading}
                 className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
                 title="Refresh Active Inventory"
               >
                 <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
               </button>

               {/* Upload Button */}
               <div className="relative">
                 <input 
                   type="file" 
                   accept=".csv" 
                   onChange={handleFileUpload} 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <button className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 px-4 py-2 rounded text-sm transition-colors border border-gray-600">
                   <Upload size={16} />
                   Import CSV
                 </button>
               </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-800 text-red-200 px-4 py-3 rounded flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="hover:text-white"><AlertCircle size={16} /></button>
          </div>
        )}

        {/* Tab Navigation (Only show in Inventory Mode) */}
        {appState === AppState.INVENTORY && (
          <div className="flex gap-4 mb-6 border-b border-gray-700">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`pb-3 px-4 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'inventory' 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <List size={16} /> Active Inventory
              <span className="bg-dark-800 text-gray-400 px-2 py-0.5 rounded-full text-xs">
                {inventory.length}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('new')}
              className={`pb-3 px-4 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'new' 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <PlusCircle size={16} /> New / Intake
            </button>
          </div>
        )}

        {/* View Switcher */}
        {appState === AppState.INVENTORY && activeTab === 'inventory' && (
          <div className="h-[calc(100vh-250px)]">
             {isLoading && inventory.length === 0 ? (
               <div className="flex h-full items-center justify-center flex-col gap-4">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
                 <p className="text-gray-500">Loading Active Inventory...</p>
               </div>
             ) : (
               <InventoryTable inventory={inventory} onSelect={handleSelectVehicle} />
             )}
          </div>
        )}

        {appState === AppState.INVENTORY && activeTab === 'new' && (
           <NewVehicleTab 
             onAddVehicle={handleAddNewVehicle} 
             onGradeNow={handleGradeNewVehicle}
             onImportFeed={handleImportFeed}
           />
        )}

        {appState === AppState.GRADING && selectedVehicle && (
          <VehicleGrader 
            vehicle={selectedVehicle} 
            onGrade={handleRunAnalysis} 
            isProcessing={isLoading}
            onCancel={resetAnalysis}
          />
        )}

        {appState === AppState.RESULTS && analysisResult && selectedVehicle && (
          <AnalysisResult 
            result={analysisResult} 
            vehicle={selectedVehicle} 
            onClose={resetAnalysis}
          />
        )}
      </main>
    </div>
  );
};

export default App;