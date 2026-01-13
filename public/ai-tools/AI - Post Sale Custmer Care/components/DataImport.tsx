import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { parseFrazerCSV } from '../utils';
import { Sale } from '../types';

interface DataImportProps {
  onImport: (newSales: Sale[]) => void;
  onCancel: () => void;
}

const DataImport: React.FC<DataImportProps> = ({ onImport, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<Sale[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select all when new data arrives
  useEffect(() => {
    if (parsedData.length > 0) {
      setSelectedIds(new Set(parsedData.map(s => s.id)));
    }
  }, [parsedData]);

  const handleFile = async (file: File) => {
    setError('');
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    try {
      const text = await file.text();
      const sales = await parseFrazerCSV(text);
      setParsedData(sales);
    } catch (e) {
      console.error(e);
      setError('Failed to parse the CSV file. Please check the format.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === parsedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(parsedData.map(s => s.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleConfirm = () => {
    const selectedSales = parsedData.filter(s => selectedIds.has(s.id));
    onImport(selectedSales);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Import Sales Data</h2>
          <p className="text-slate-500">Upload your Frazer export CSV file to populate the system.</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">Cancel</button>
      </div>

      {parsedData.length === 0 ? (
        <div 
          className={`border-4 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer bg-white ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Upload size={40} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Drag & Drop your CSV file here
          </h3>
          <p className="text-slate-500 mb-6 text-center max-w-md">
            Compatible with Frazer DMS exports. Ensure your file has columns like "Stock #", "First Name", "Vehicle Make", etc.
          </p>
          <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Browse Files
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {error && (
            <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Review Data</h3>
                <p className="text-sm text-slate-500">Selected {selectedIds.size} of {parsedData.length} records</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setParsedData([])}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={handleConfirm}
                disabled={selectedIds.size === 0}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {selectedIds.size} Selected
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-sm text-slate-600 relative">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 w-12 text-center cursor-pointer" onClick={toggleSelectAll}>
                    {selectedIds.size === parsedData.length ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                  </th>
                  <th className="px-6 py-4">Stock #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Sale Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedData.map((sale) => {
                  const isSelected = selectedIds.has(sale.id);
                  return (
                    <tr 
                      key={sale.id} 
                      className={`hover:bg-slate-50 cursor-pointer ${isSelected ? 'bg-blue-50/30' : ''}`}
                      onClick={() => toggleSelectRow(sale.id)}
                    >
                      <td className="px-6 py-4 text-center">
                        {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="text-slate-400" />}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{sale.id}</td>
                      <td className="px-6 py-4">{sale.customer.lastName}, {sale.customer.firstName}</td>
                      <td className="px-6 py-4">{sale.vehicle.year} {sale.vehicle.make} {sale.vehicle.model}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          sale.vehicle.type === 'Truck' ? 'bg-amber-100 text-amber-700' :
                          sale.vehicle.type === 'SUV' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {sale.vehicle.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">{sale.saleDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImport;