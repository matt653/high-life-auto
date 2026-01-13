import React, { useState } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Wand2, 
  Download, 
  Upload, 
  RefreshCw,
  AlertTriangle,
  Zap 
} from 'lucide-react';
import { generateMarketingImage, editInventoryPhoto } from '../services/geminiService';
import { ImageSize, ImageGenConfig } from '../types';

export const ImageStudio: React.FC = () => {
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  
  // Generation State
  const [genPrompt, setGenPrompt] = useState('');
  const [genSize, setGenSize] = useState<ImageSize>(ImageSize.OneK);
  const [genRatio, setGenRatio] = useState<ImageGenConfig['aspectRatio']>('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // Editing State
  const [editPrompt, setEditPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');

  const handleGenerate = async () => {
    if (!genPrompt) return;
    setIsGenerating(true);
    setGenError('');
    setGeneratedImage(null);
    try {
      const result = await generateMarketingImage({
        prompt: genPrompt,
        size: genSize,
        aspectRatio: genRatio
      });
      if (result) {
        setGeneratedImage(result);
      } else {
        setGenError('No image generated. Please check your prompt and API key.');
      }
    } catch (e: any) {
      setGenError(e.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt || !uploadedImage) return;
    setIsEditing(true);
    setEditError('');
    setEditedImage(null);
    try {
      const result = await editInventoryPhoto(uploadedImage, editPrompt);
      if (result) {
        setEditedImage(result);
      } else {
        setEditError('Could not edit image.');
      }
    } catch (e: any) {
      setEditError(e.message || 'Editing failed.');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter">Creative Studio</h2>
        <div className="bg-white p-1 rounded-xl border flex shadow-sm">
          <button 
            onClick={() => setMode('generate')}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'generate' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-900'}`}
          >
            Generator (Pro)
          </button>
          <button 
            onClick={() => setMode('edit')}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'edit' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-900'}`}
          >
            Editor (Nano)
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
        {/* CONTROLS */}
        <div className="col-span-4 bg-white p-8 rounded-[2.5rem] border shadow-sm h-fit">
          {mode === 'generate' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Prompt</label>
                <textarea 
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="e.g. A futuristic silver sedan driving on Mars..."
                  className="w-full h-32 p-4 bg-slate-50 border rounded-2xl font-medium text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Size</label>
                  <select 
                    value={genSize}
                    onChange={(e) => setGenSize(e.target.value as ImageSize)}
                    className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none"
                  >
                    <option value={ImageSize.OneK}>1K</option>
                    <option value={ImageSize.TwoK}>2K (Pro)</option>
                    <option value={ImageSize.FourK}>4K (Pro)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Ratio</label>
                  <select 
                    value={genRatio}
                    onChange={(e) => setGenRatio(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none"
                  >
                    <option value="1:1">Square (1:1)</option>
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="9:16">Portrait (9:16)</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-800 font-bold flex items-center gap-2">
                  <Sparkles size={12} />
                  Uses Gemini 3 Pro Image. Requires Paid Key.
                </p>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !genPrompt}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                {isGenerating ? 'Dreaming...' : 'Generate Asset'}
              </button>
              {genError && <p className="text-xs font-bold text-red-500 mt-2">{genError}</p>}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Source Image</label>
                <div className="relative group">
                   <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                   <div className="w-full h-32 bg-slate-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 group-hover:border-orange-500 transition-colors">
                      {uploadedImage ? (
                        <img src={uploadedImage} alt="Upload" className="h-full w-full object-cover rounded-2xl opacity-50" />
                      ) : (
                        <>
                          <Upload size={24} className="mb-2" />
                          <span className="text-[10px] font-bold uppercase">Click to Upload</span>
                        </>
                      )}
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Edit Instruction</label>
                <textarea 
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g. Add snow to the ground, remove the background..."
                  className="w-full h-24 p-4 bg-slate-50 border rounded-2xl font-medium text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                <p className="text-[10px] text-green-800 font-bold flex items-center gap-2">
                  <Zap size={12} />
                  Uses Gemini 2.5 Flash Image.
                </p>
              </div>

              <button 
                onClick={handleEdit}
                disabled={isEditing || !editPrompt || !uploadedImage}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isEditing ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                {isEditing ? 'Editing...' : 'Apply Magic'}
              </button>
              {editError && <p className="text-xs font-bold text-red-500 mt-2">{editError}</p>}
            </div>
          )}
        </div>

        {/* PREVIEW AREA */}
        <div className="col-span-8 bg-gray-900 rounded-[2.5rem] p-2 relative overflow-hidden flex items-center justify-center border border-gray-800">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
          
          {(mode === 'generate' && generatedImage) || (mode === 'edit' && editedImage) ? (
            <div className="relative max-w-full max-h-full">
              <img 
                src={mode === 'generate' ? generatedImage! : editedImage!} 
                alt="Result" 
                className="rounded-2xl shadow-2xl max-h-[70vh] object-contain"
              />
              <a 
                href={mode === 'generate' ? generatedImage! : editedImage!}
                download={`high-life-${Date.now()}.png`}
                className="absolute bottom-4 right-4 bg-white text-gray-900 p-3 rounded-xl shadow-lg hover:scale-105 transition-transform"
              >
                <Download size={20} />
              </a>
            </div>
          ) : (
            <div className="text-center">
               <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Sparkles className="text-gray-600" size={40} />
               </div>
               <h3 className="text-white font-black text-2xl uppercase italic tracking-tighter opacity-50">
                 {mode === 'generate' ? 'Canvas Empty' : 'No Edits Yet'}
               </h3>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
                 {mode === 'generate' ? 'Enter a prompt to start dreaming' : 'Upload and prompt to remix'}
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};