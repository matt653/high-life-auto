import React, { useState, useRef } from 'react';
import { Vehicle, GradingInput } from '../types';
import { Camera, Youtube, Activity, FileText, Upload, X, AlertCircle, CheckCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { fetchImageAsBase64 } from '../services/csvService';

interface Props {
  vehicle: Vehicle;
  onGrade: (input: GradingInput) => void;
  isProcessing: boolean;
  onCancel: () => void;
}

export const VehicleGrader: React.FC<Props> = ({ vehicle, onGrade, isProcessing, onCancel }) => {
  const [obdCodes, setObdCodes] = useState('');
  const [youtubeLink, setYoutubeLink] = useState(vehicle.youtubeUrl || '');
  const [visualNotes, setVisualNotes] = useState('');
  const [salesComments] = useState(vehicle.description || ''); 
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // User Uploaded Images
  const [userImages, setUserImages] = useState<string[]>([]);
  
  // CSV Linked Images Management
  const [selectedCsvIndices, setSelectedCsvIndices] = useState<Set<number>>(new Set());
  const [isFetchingImages, setIsFetchingImages] = useState(false);
  const [fetchProgress, setFetchProgress] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUserImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const removeUserImage = (index: number) => {
    setUserImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleCsvImage = (index: number) => {
    const next = new Set(selectedCsvIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedCsvIndices(next);
  };

  const selectAllCsvImages = () => {
    if (selectedCsvIndices.size === vehicle.imageUrls.length) {
      setSelectedCsvIndices(new Set()); // Deselect all
    } else {
      const all = new Set(vehicle.imageUrls.map((_, i) => i));
      setSelectedCsvIndices(all);
    }
  };

  const handleSubmit = async () => {
    // 1. Prepare base images (User uploaded)
    let finalImages = [...userImages];

    // 2. Fetch selected CSV images if any
    if (selectedCsvIndices.size > 0) {
      setIsFetchingImages(true);
      setFetchProgress(`Preparing ${selectedCsvIndices.size} external images...`);
      
      const indices = Array.from(selectedCsvIndices);
      
      // Limit to 10 max to prevent timeout/token limits
      const maxImages = 10;
      const imagesToFetch = indices.slice(0, maxImages);
      
      try {
        const fetchedBase64 = await Promise.all(
          imagesToFetch.map(async (idx: number) => {
             const url = vehicle.imageUrls[idx];
             return await fetchImageAsBase64(url);
          })
        );
        
        // Filter out failures (empty strings)
        const validFetched = fetchedBase64.filter(img => !!img);
        finalImages = [...finalImages, ...validFetched];
        
      } catch (err) {
        console.error("Error fetching linked images:", err);
        // Continue with what we have
      } finally {
        setIsFetchingImages(false);
      }
    }

    const codes = obdCodes.split(',').map(s => s.trim()).filter(Boolean);
    onGrade({
      vehicle,
      obdCodes: codes,
      youtubeLink,
      visualConditionNotes: visualNotes,
      salesComments,
      additionalNotes,
      images: finalImages
    });
  };

  return (
    <div className="bg-dark-800 rounded-lg shadow-xl border border-gray-700 p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-4">
        <div className="flex gap-6 items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>
            <div className="flex gap-4 text-sm text-gray-400">
              <span>VIN: <span className="font-mono text-gray-300">{vehicle.vin}</span></span>
              <span>Miles: <span className="text-gray-300">{vehicle.miles.toLocaleString()}</span></span>
              <span>Price: <span className="text-brand-400 font-bold">${vehicle.price.toLocaleString()}</span></span>
            </div>
            {vehicle.imageUrls.length > 0 && (
                <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                  <ImageIcon size={12} /> {vehicle.imageUrls.length} Photos in CSV
                </p>
            )}
          </div>
        </div>
        <button onClick={onCancel} className="text-gray-500 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Mechanical & Context */}
        <div className="space-y-6">
          
          {/* Sales Comments (Read Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              CSV Sales Comments
            </label>
            <div className="w-full bg-dark-900 border border-gray-700 rounded p-3 text-sm text-gray-400 min-h-[60px] max-h-[120px] overflow-y-auto">
              {salesComments || "No comments from CSV."}
            </div>
          </div>

          {/* Additional Notes (Editable) */}
          <div>
            <label className="block text-sm font-medium text-brand-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Additional Notes (Your Input)
            </label>
            <textarea
              rows={3}
              className="w-full bg-dark-900 border border-gray-600 rounded p-2 text-white focus:border-brand-500 focus:outline-none"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Add extra details not in CSV..."
            />
          </div>

          {/* OBD Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400" />
              OBD2 Codes
            </label>
            <input
              type="text"
              placeholder="e.g. P0420, P0300"
              className="w-full bg-dark-900 border border-gray-600 rounded p-2 text-white focus:border-brand-500 focus:outline-none"
              value={obdCodes}
              onChange={(e) => setObdCodes(e.target.value)}
            />
          </div>
          
           {/* YouTube Link */}
           <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              YouTube / Video Link
            </label>
            <input
              type="text"
              placeholder="https://youtube.com/..."
              className="w-full bg-dark-900 border border-gray-600 rounded p-2 text-white focus:border-brand-500 focus:outline-none"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Visuals */}
        <div className="space-y-6">
          
          {/* Visual Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" />
              Visual Condition Notes
            </label>
            <textarea
              rows={3}
              className="w-full bg-dark-900 border border-gray-600 rounded p-2 text-white focus:border-brand-500 focus:outline-none"
              value={visualNotes}
              onChange={(e) => setVisualNotes(e.target.value)}
              placeholder="Describe dents, scratches, interior condition, tire tread..."
            />
          </div>

          {/* CSV Image Gallery */}
          {vehicle.imageUrls.length > 0 && (
            <div className="border border-gray-700 rounded-lg p-4 bg-dark-900/50">
               <div className="flex justify-between items-center mb-3">
                 <label className="text-sm font-medium text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    Linked CSV Photos
                 </label>
                 <button 
                   onClick={selectAllCsvImages}
                   className="text-xs text-brand-400 hover:text-brand-300"
                 >
                   {selectedCsvIndices.size === vehicle.imageUrls.length ? "Deselect All" : "Select All"}
                 </button>
               </div>
               
               <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
                 {vehicle.imageUrls.map((url, idx) => {
                   const isSelected = selectedCsvIndices.has(idx);
                   return (
                     <div 
                       key={idx} 
                       onClick={() => toggleCsvImage(idx)}
                       className={`relative group aspect-square cursor-pointer rounded overflow-hidden border-2 transition-all ${
                         isSelected ? 'border-brand-500 opacity-100 ring-2 ring-brand-500/50' : 'border-transparent opacity-60 hover:opacity-90'
                       }`}
                     >
                       <img src={url} alt={`CSV ${idx}`} className="w-full h-full object-cover" loading="lazy" />
                       {isSelected && (
                         <div className="absolute top-1 right-1 bg-brand-500 text-white rounded-full p-0.5">
                           <CheckCircle size={12} />
                         </div>
                       )}
                     </div>
                   )
                 })}
               </div>
               <p className="text-xs text-gray-500 mt-2">
                 Selected: {selectedCsvIndices.size} photos. (Analysis works best with < 10 photos)
               </p>
            </div>
          )}

          {/* User Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload New Photos (Optional)
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-brand-500 hover:bg-dark-900 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Click to upload files</p>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleImageUpload}
              />
            </div>

            {/* User Image Preview Grid */}
            {userImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {userImages.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square">
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover rounded border border-gray-600" />
                    <button 
                      onClick={() => removeUserImage(idx)}
                      className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-700 flex justify-end gap-4 items-center">
        {isFetchingImages && (
          <div className="flex items-center gap-2 text-brand-400 text-sm animate-pulse mr-4">
            <Loader2 size={16} className="animate-spin" />
            {fetchProgress}
          </div>
        )}
        
        <button 
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          disabled={isProcessing || isFetchingImages}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isProcessing || isFetchingImages}
          className={`px-6 py-2 rounded font-semibold text-white transition-colors flex items-center gap-2 ${
            isProcessing || isFetchingImages
              ? 'bg-brand-900 cursor-not-allowed' 
              : 'bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 shadow-lg shadow-blue-900/20'
          }`}
        >
          {isProcessing ? (
             <>
               <Loader2 size={18} className="animate-spin" />
               Analyzing Value...
             </>
          ) : (
             'Calculate Grade & Equity'
          )}
        </button>
      </div>
    </div>
  );
};