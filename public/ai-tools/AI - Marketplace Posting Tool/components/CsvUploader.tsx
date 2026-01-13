import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, Link as LinkIcon, DownloadCloud } from 'lucide-react';
import { SAMPLE_CSV_CONTENT } from '../constants';

interface CsvUploaderProps {
  onUpload: (content: string) => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('https://highlifeauto.com/frazer-inventory-updated.csv');
  const [loading, setLoading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      setError("Please upload a valid CSV file.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onUpload(text);
    };
    reader.readAsText(file);
  };

  const handleFetchUrl = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      const text = await response.text();
      onUpload(text);
    } catch (err) {
      console.error(err);
      setError("Could not auto-fetch content. This is likely a security restriction (CORS) by the hosting website. Please download the file manually using the link below, then upload it.");
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    onUpload(SAMPLE_CSV_CONTENT);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-8">
      
      {/* URL Fetch Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <LinkIcon className="mr-2 text-indigo-600" size={20} />
          Import from URL
        </h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/inventory.csv"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
          />
          <button 
            onClick={handleFetchUrl}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? 'Fetching...' : 'Fetch'}
            {!loading && <DownloadCloud size={16} className="ml-2" />}
          </button>
        </div>
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-md flex flex-col gap-2">
            <div className="flex items-start">
               <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
               <span>{error}</span>
            </div>
            {url && (
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 underline font-medium ml-6 hover:text-indigo-800"
              >
                Download File Manually
              </a>
            )}
          </div>
        )}
      </div>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OR</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      {/* File Upload Section */}
      <div 
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ease-in-out
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-blue-100 rounded-full text-blue-600">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Upload CSV File</h3>
            <p className="text-gray-500 mt-1">Drag and drop your file here</p>
          </div>
          
          <input 
            type="file" 
            id="csv-upload" 
            className="hidden" 
            accept=".csv"
            onChange={handleChange} 
          />
          <label 
            htmlFor="csv-upload"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
          >
            Select File
          </label>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button 
          onClick={loadSample}
          className="text-sm text-gray-500 hover:text-gray-800 hover:underline"
        >
          Load Sample Data
        </button>
      </div>
    </div>
  );
};