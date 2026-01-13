import React, { useState } from 'react';
import { ViewState, Sale, SalesInsight, SalesPersona } from './types';
import { MOCK_SALES } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DataImport from './components/DataImport';
import TaskAutomation from './components/TaskAutomation';
import SmartAnalytics from './components/SmartAnalytics';
import VehicleTrends from './components/VehicleTrends';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);

  // Persistent State for Reports
  const [trendsReport, setTrendsReport] = useState<string>('');
  const [analyticsInsights, setAnalyticsInsights] = useState<SalesInsight[]>([]);
  const [buyerPersona, setBuyerPersona] = useState<SalesPersona | null>(null);

  const handleImportSales = (newSales: Sale[]) => {
    const existingIds = new Set(sales.map(s => s.id));
    const uniqueNewSales = newSales.filter(s => !existingIds.has(s.id));
    
    setSales(prev => [...uniqueNewSales, ...prev]);
    // Optional: Clear old reports when new data comes in so they are forced to regenerate
    // setTrendsReport('');
    // setAnalyticsInsights([]);
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard sales={sales} />;
      case 'import':
        return (
          <DataImport 
            onImport={handleImportSales}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      case 'trends':
        return (
          <VehicleTrends 
            sales={sales} 
            report={trendsReport}
            onUpdateReport={setTrendsReport}
          />
        );
      case 'automation':
        return <TaskAutomation sales={sales} />;
      case 'analytics':
        return (
          <SmartAnalytics 
            sales={sales} 
            insights={analyticsInsights}
            onUpdateInsights={setAnalyticsInsights}
            persona={buyerPersona}
            onUpdatePersona={setBuyerPersona}
          />
        );
      default:
        return <Dashboard sales={sales} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;