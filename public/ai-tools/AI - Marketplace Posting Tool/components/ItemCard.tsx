import React, { useState } from 'react';
import { EnhancedListing } from '../types';
import { Copy, Check, Sparkles, ExternalLink, ImagePlus, X, Download } from 'lucide-react';
import JSZip from 'jszip';

interface ItemCardProps {
  item: EnhancedListing;
  onGenerate: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onAddImages: (id: string, files: File[]) => void;
  onRemoveImage: (id: string, index: number) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onGenerate, onToggleStatus, onAddImages, onRemoveImage }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isGenerated && !isGenerating) {
        if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
        } else if (e.type === "dragleave") {
        setDragActive(false);
        }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (item.status === 'completed' || item.status === 'generating') return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
      if (filesArray.length > 0) {
        onAddImages(item.id, filesArray);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).filter((file: File) => file.type.startsWith('image/'));
      if (filesArray.length > 0) {
        onAddImages(item.id, filesArray);
      }
    }
  };

  const handlePostAndDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (item.images.length === 0) {
      window.open("https://www.facebook.com/marketplace/create/item", "_blank");
      return;
    }

    setIsDownloading(true);
    
    try {
        const zip = new JSZip();
        // Create a clean folder name from the product title
        const folderName = item.originalData.productName.replace(/[^a-z0-9]/gi, '_').substring(0, 30) || 'listing_photos';
        
        // Fetch all images
        const promises = item.images.map(async (img, index) => {
            try {
                let blob: Blob;

                if (img.startsWith('http')) {
                     try {
                        // Try direct fetch
                        const response = await fetch(img);
                        if (!response.ok) throw new Error('Direct fetch failed');
                        blob = await response.blob();
                     } catch (directErr) {
                        console.warn(`Direct download failed for ${img}, attempting proxy...`);
                        // Try proxy fetch
                        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(img)}`;
                        const response = await fetch(proxyUrl);
                        if (!response.ok) throw new Error('Proxy fetch failed');
                        blob = await response.blob();
                     }
                } else {
                    // Base64 string
                    const response = await fetch(img);
                    blob = await response.blob();
                }
                
                // Add to zip with a sequential name
                zip.file(`${folderName}/image_${index + 1}.jpg`, blob);
                
            } catch (err) {
                console.error("Failed to download image for zip", img, err);
            }
        });

        await Promise.all(promises);

        // Generate the zip file
        const content = await zip.generateAsync({ type: "blob" });
        
        // Trigger download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${folderName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Open FB Marketplace
        window.open("https://www.facebook.com/marketplace/create/item", "_blank");

    } catch (error) {
        console.error("Error creating zip file", error);
        alert("There was an issue creating the image folder. Opening Marketplace anyway.");
        window.open("https://www.facebook.com/marketplace/create/item", "_blank");
    } finally {
        setIsDownloading(false);
    }
  };

  const isGenerated = item.status === 'completed';
  const isGenerating = item.status === 'generating';

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all duration-200 flex flex-col h-full ${item.isPublished ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:shadow-md'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-start">
        <div>
          <h3 className="font-bold text-gray-900 line-clamp-1">{item.originalData.productName}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">{item.originalData.condition}</span>
            <span>${item.originalData.price}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {isGenerated && item.grade && (
            <div className={`
              flex flex-col items-center justify-center w-10 h-10 rounded-lg font-bold text-sm border
              ${item.grade.startsWith('A') ? 'bg-green-100 text-green-700 border-green-200' : 
                item.grade.startsWith('B') ? 'bg-blue-100 text-blue-700 border-blue-200' :
                'bg-yellow-100 text-yellow-700 border-yellow-200'}
            `}>
              {item.grade}
            </div>
          )}
          <button
            onClick={() => onToggleStatus(item.id)}
            className={`p-1.5 rounded-full transition-colors h-10 w-10 flex items-center justify-center ${item.isPublished ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
            title="Toggle Published Status"
          >
            <Check size={18} />
          </button>
        </div>
      </div>

      {/* Image Area */}
      {!isGenerated && (
          <div 
            className={`mx-4 mt-4 relative border-2 border-dashed rounded-lg transition-colors duration-200 
                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}
                ${item.images.length > 0 ? 'p-2' : 'p-6'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
             {item.images.length === 0 ? (
                 <div className="text-center">
                    <ImagePlus className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-1 text-xs text-gray-500">Drag photos here</p>
                    <label className="mt-2 inline-block cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileInput} />
                    </label>
                 </div>
             ) : (
                 <div className="grid grid-cols-4 gap-2">
                     {item.images.map((img, idx) => (
                         <div key={idx} className="relative group aspect-square">
                             <img src={img} alt="preview" className="w-full h-full object-cover rounded" />
                             <button 
                                onClick={() => onRemoveImage(item.id, idx)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 <X size={10} />
                             </button>
                         </div>
                     ))}
                      <label className="flex items-center justify-center border border-dashed border-gray-300 rounded aspect-square cursor-pointer hover:bg-gray-100">
                        <ImagePlus size={16} className="text-gray-400" />
                        <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileInput} />
                    </label>
                 </div>
             )}
          </div>
      )}

      {/* Content Area */}
      <div className="p-4 space-y-4 flex-1">
        {!isGenerated && !isGenerating && (
          <div className="text-center py-2">
            <button
              onClick={() => onGenerate(item.id)}
              className="w-full inline-flex justify-center items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Sparkles size={16} className="mr-2" />
              Generate Listing
            </button>
            <p className="text-xs text-gray-400 mt-2">
                {item.images.length > 0 ? 'Will analyze images & text' : 'Text only generation'}
            </p>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-8 text-indigo-600 animate-pulse">
            <Sparkles size={24} className="mb-2" />
            <span className="text-sm font-medium">Gemini is evaluating value...</span>
          </div>
        )}

        {isGenerated && (
          <>
            {/* Title Section */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Title</label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={item.optimizedTitle} 
                  className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={() => copyToClipboard(item.optimizedTitle, 'title')}
                  className={`p-1.5 rounded border transition-all ${copiedField === 'title' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                >
                  {copiedField === 'title' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
              <div className="relative group">
                <textarea 
                  readOnly 
                  value={item.optimizedDescription} 
                  rows={4}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:outline-none resize-none"
                />
                <button
                  onClick={() => copyToClipboard(item.optimizedDescription, 'desc')}
                  className={`absolute top-2 right-2 p-1.5 rounded border shadow-sm transition-all ${copiedField === 'desc' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                >
                  {copiedField === 'desc' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Tags & Price */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Tags</label>
                <div className="flex gap-1">
                   <div className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 truncate text-gray-600">
                     {item.suggestedTags.join(', ')}
                   </div>
                   <button
                    onClick={() => copyToClipboard(item.suggestedTags.join(', '), 'tags')}
                    className={`p-1.5 rounded border transition-all ${copiedField === 'tags' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {copiedField === 'tags' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
             
             {/* AI Insight */}
            <div className="mt-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-1.5 rounded border border-indigo-100 flex items-start gap-1">
               <span className="font-bold">AI Tip:</span> {item.suggestedPriceRange}
            </div>
          </>
        )}
      </div>
      
      {isGenerated && (
         <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-between items-center rounded-b-xl mt-auto">
             <span className="text-xs text-gray-400">
                {item.isPublished ? 'Published' : 'Ready to post'}
             </span>
             <button
               onClick={handlePostAndDownload}
               disabled={isDownloading}
               className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
             >
                {isDownloading ? (
                    <>Downloading Folder...</>
                ) : (
                    <>
                        Download & Open FB <ExternalLink size={12} className="ml-1"/>
                    </>
                )}
             </button>
         </div>
      )}
    </div>
  );
};