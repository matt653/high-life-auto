import React, { useState, useEffect } from 'react';
import { RawInventoryItem, EnhancedListing } from '../types';
import { ItemCard } from './ItemCard';
import { generateListingContent } from '../services/geminiService';
import { ArrowLeft, Sparkles, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  initialData: RawInventoryItem[];
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialData, onBack }) => {
  const [items, setItems] = useState<EnhancedListing[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'published'>('all');

  useEffect(() => {
    // Transform raw data into EnhancedListing objects
    const formatted: EnhancedListing[] = initialData.map(item => ({
      id: item.id,
      originalData: item,
      images: item.imageUrls || [], // Load images from CSV if available
      optimizedTitle: '',
      optimizedDescription: '',
      suggestedTags: [],
      suggestedPriceRange: '',
      grade: '',
      status: 'pending',
      isPublished: false
    }));
    setItems(formatted);
  }, [initialData]);

  const handleAddImages = async (id: string, files: File[]) => {
    // Convert files to Base64 strings
    const promises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const base64Images = await Promise.all(promises);
      setItems(prev => prev.map(i => {
        if (i.id === id) {
          // Append new images to existing ones
          return { ...i, images: [...i.images, ...base64Images] };
        }
        return i;
      }));
    } catch (err) {
      console.error("Error reading images", err);
    }
  };

  const handleRemoveImage = (id: string, index: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        const newImages = [...i.images];
        newImages.splice(index, 1);
        return { ...i, images: newImages };
      }
      return i;
    }));
  };

  const handleGenerate = async (id: string) => {
    const itemToUpdate = items.find(i => i.id === id);
    if (!itemToUpdate) return;

    // Set status to generating
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'generating' } : i));

    try {
      // Pass the item and its images to the service
      const result = await generateListingContent(itemToUpdate.originalData, itemToUpdate.images);
      
      setItems(prev => prev.map(i => i.id === id ? {
        ...i,
        optimizedTitle: result.title,
        optimizedDescription: result.description,
        suggestedTags: result.tags,
        suggestedPriceRange: result.priceAnalysis,
        grade: result.grade,
        status: 'completed'
      } : i));

    } catch (error) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'error' } : i));
      alert("Failed to generate content. Please check your API Key or try again.");
    }
  };

  const handleGenerateAll = async () => {
     // Filter only pending items to avoid regenerating completed ones
     const pendingItems = items.filter(i => i.status === 'pending');
     
     // Process in small batches
     for (const item of pendingItems) {
        handleGenerate(item.id);
        await new Promise(r => setTimeout(r, 500)); 
     }
  };

  const toggleStatus = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, isPublished: !i.isPublished } : i));
  };

  const filteredItems = items.filter(item => {
    if (filter === 'published') return item.isPublished;
    if (filter === 'pending') return !item.isPublished;
    return true;
  });

  const pendingCount = items.filter(i => i.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
            <p className="text-sm text-gray-500">{items.length} items total • {items.filter(i => i.isPublished).length} published</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <button
              onClick={handleGenerateAll}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow hover:shadow-lg transition-all"
            >
              <Sparkles size={16} className="mr-2" />
              Auto-Generate All ({pendingCount})
            </button>
          )}
          
          <div className="bg-white rounded-lg p-1 flex border border-gray-200">
            {(['all', 'pending', 'published'] as const).map((f) => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${filter === f ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 {f}
               </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex gap-3 items-start">
         <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
         <div>
            <h3 className="text-sm font-semibold text-amber-800">Browser Security & Facebook Rules</h3>
            <p className="text-sm text-amber-700 mt-1">
               This app cannot automatically open Chrome tabs, type for you, or access your hard drive files without permission. 
               Automated posting bots also violate Facebook's Terms of Service.
               <br/>
               <b>New Feature:</b> We are now fetching photos directly from your file so you don't have to upload them manually!
            </p>
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <ItemCard 
            key={item.id} 
            item={item} 
            onGenerate={handleGenerate} 
            onToggleStatus={toggleStatus}
            onAddImages={handleAddImages}
            onRemoveImage={handleRemoveImage}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No items found matching this filter.</p>
        </div>
      )}
    </div>
  );
};