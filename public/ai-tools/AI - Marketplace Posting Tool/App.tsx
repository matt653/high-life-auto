import React, { useState } from 'react';
import { AppView, RawInventoryItem } from './types';
import { CsvUploader } from './components/CsvUploader';
import { Dashboard } from './components/Dashboard';
import { parseCSV } from './services/csvService';
import { LayoutGrid } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.UPLOAD);
  const [inventoryData, setInventoryData] = useState<RawInventoryItem[]>([]);

  const handleUpload = (csvContent: string) => {
    const parsedData = parseCSV(csvContent);
    if (parsedData.length > 0) {
      setInventoryData(parsedData);
      setView(AppView.DASHBOARD);
    } else {
      alert("Could not parse any items from the CSV. Please check the format.");
    }
  };

  const handleBack = () => {
    if (confirm("Going back will clear current unsaved progress. Are you sure?")) {
      setView(AppView.UPLOAD);
      setInventoryData([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Global Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <LayoutGrid size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">Marketplace<span className="text-blue-600">AI</span> Lister</span>
          </div>
          <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {view === AppView.UPLOAD ? (
          <div className="px-4">
             <div className="max-w-2xl mx-auto text-center mt-12 mb-8">
               <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                 Turn Spreadsheets into <br/><span className="text-blue-600">Sales</span>
               </h1>
               <p className="mt-4 text-lg text-gray-500">
                 Upload your inventory CSV. We'll use AI to write catchy titles, persuasive descriptions, and price suggestions instantly.
               </p>
             </div>
             <CsvUploader onUpload={handleUpload} />
          </div>
        ) : (
          <Dashboard 
            initialData={inventoryData} 
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
};

export default App;