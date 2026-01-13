import React from 'react';
import { GradingResult, Vehicle } from '../types';
import { Shield, X, DollarSign, Activity, Eye, AlertTriangle, Info } from 'lucide-react';

interface Props {
  result: GradingResult;
  vehicle: Vehicle;
  onClose: () => void;
}

export const AnalysisResult: React.FC<Props> = ({ result, vehicle, onClose }) => {
  
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-500 border-green-500 bg-green-500/10';
      case 'B': return 'text-blue-500 border-blue-500 bg-blue-500/10';
      case 'C': return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
      case 'D': return 'text-orange-500 border-orange-500 bg-orange-500/10';
      case 'F': return 'text-red-500 border-red-500 bg-red-500/10';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const ScoreBar = ({ label, category, weight, icon: Icon, colorClass }: any) => {
    const { score, reason } = category;
    return (
      <div className="mb-6 group">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-center gap-2">
             <div className={`p-1.5 rounded-md ${colorClass.replace('text-', 'bg-').replace('500', '900/50')}`}>
               <Icon className={`w-4 h-4 ${colorClass}`} />
             </div>
             <div>
                <span className="block text-sm font-bold text-gray-200">{label}</span>
                <span className="text-xs text-gray-500">Weight: {weight}%</span>
             </div>
          </div>
          <span className={`text-xl font-bold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {score}/100
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-dark-900 rounded-full h-2 border border-gray-700 mb-2">
          <div 
            className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'} transition-all duration-1000 ease-out`} 
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
        
        {/* Reason */}
        <p className="text-xs text-gray-400 italic border-l-2 border-gray-700 pl-2">
          "{reason}"
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              {vehicle.year} {vehicle.make} {vehicle.model}
              <span className={`text-lg px-3 py-0.5 rounded border ${getGradeColor(result.grade)} font-mono`}>
                GRADE {result.grade}
              </span>
            </h2>
            <p className="text-gray-400 text-sm mt-1 font-mono">VIN: {vehicle.vin} • Miles: {vehicle.miles.toLocaleString()}</p>
         </div>
         <button onClick={onClose} className="p-2 hover:bg-dark-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={24} />
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* LEFT COLUMN: THE RECEIPT (Value Proposition) */}
        <div className="bg-[#f8f9fa] text-gray-900 font-mono p-6 rounded-sm shadow-2xl transform rotate-0 lg:-rotate-1 transition-transform relative overflow-hidden max-w-md mx-auto w-full">
          {/* Receipt Top Edge (Zigzag using CSS gradient) */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-dark-900" style={{
            background: 'linear-gradient(45deg, transparent 33.333%, #0f172a 33.333%, #0f172a 66.667%, transparent 66.667%), linear-gradient(-45deg, transparent 33.333%, #0f172a 33.333%, #0f172a 66.667%, transparent 66.667%)',
            backgroundSize: '20px 40px',
            backgroundPosition: '0 -20px'
          }}></div>

          <div className="mt-4 text-center border-b-2 border-dashed border-gray-400 pb-6 mb-6">
            <h3 className="text-2xl font-black uppercase tracking-widest text-black">High Life Auto</h3>
            <p className="text-sm font-bold text-gray-600">OFFICIAL VALUE ASSESSMENT</p>
            <p className="text-xs text-gray-500 mt-2">{new Date().toLocaleDateString().toUpperCase()} • {new Date().toLocaleTimeString()}</p>
          </div>

          <div className="space-y-3 text-sm md:text-base">
            <div className="flex justify-between items-center">
              <span className="font-bold">RETAIL BOOK VALUE</span>
              <span className="font-bold text-lg">${result.estimatedRetailValue.toLocaleString()}</span>
            </div>
            
            <div className="border-b border-gray-300 my-2"></div>
            
            <div className="flex justify-between items-center text-red-700">
              <span>High Life Price</span>
              <span>- ${vehicle.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-red-700">
              <span>Est. Repairs</span>
              <span>- ${result.estimatedRepairs.toLocaleString()}</span>
            </div>
            
            {/* Repair Notes */}
            <div className="bg-gray-100 p-3 rounded text-xs text-gray-600 italic border-l-4 border-gray-400 mt-2">
               DETAILS: {result.repairNotes || "Standard reconditioning estimates applied."}
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-800 my-6"></div>

          <div className="flex justify-between items-center bg-gray-900 text-white p-4 rounded shadow-inner">
            <span className="text-lg font-bold uppercase">YOUR EQUITY</span>
            <span className={`text-2xl font-black ${result.sweatEquity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${result.sweatEquity.toLocaleString()}
            </span>
          </div>

          <div className="mt-6 text-center">
             <div className="inline-block border-2 border-black px-4 py-2 text-xl font-black uppercase tracking-widest transform -rotate-2">
               {result.recommendation}
             </div>
             <p className="text-xs text-gray-500 mt-4 px-4 leading-tight">
               "This validates the 'As-Is' condition. Even with repair costs included, you are capturing significant equity."
             </p>
          </div>
          
          {/* Barcode Mockup */}
          <div className="mt-6 h-12 bg-gray-900 opacity-10 w-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, #000 2px, #000 4px)' }}></div>
        </div>

        {/* RIGHT COLUMN: GRADING MATRIX */}
        <div className="space-y-6">
           <div className="bg-dark-800 rounded-lg p-6 border border-gray-700 shadow-xl">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
               <Shield className="text-brand-500 w-6 h-6" />
               <h3 className="text-xl font-bold text-white">Detailed Scoring Matrix</h3>
             </div>

             <ScoreBar 
               label="MECHANICAL CONDITION" 
               category={result.mechanical} 
               weight={40} 
               icon={Activity} 
               colorClass="text-blue-500" 
             />

             <ScoreBar 
               label="COSMETIC CONDITION" 
               category={result.cosmetics} 
               weight={20} 
               icon={Eye} 
               colorClass="text-purple-500" 
             />

             <ScoreBar 
               label="VALUE PROPOSITION" 
               category={result.value} 
               weight={30} 
               icon={DollarSign} 
               colorClass="text-green-500" 
             />

             <ScoreBar 
               label="SAFETY ITEMS" 
               category={result.safety} 
               weight={10} 
               icon={AlertTriangle} 
               colorClass="text-orange-500" 
             />
           </div>

           {/* Grading Scale Legend */}
           <div className="bg-dark-900 border border-gray-700 rounded-lg p-4">
              <h4 className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-3">
                <Info size={16} className="text-brand-500"/> Understanding Your Grade
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex gap-2">
                   <span className="font-bold text-green-500 w-4">A</span>
                   <span className="text-gray-400">Exceptional Value. High equity even if repairs are needed.</span>
                </div>
                <div className="flex gap-2">
                   <span className="font-bold text-blue-500 w-4">B</span>
                   <span className="text-gray-400">Great Value. Priced well below retail.</span>
                </div>
                <div className="flex gap-2">
                   <span className="font-bold text-yellow-500 w-4">C</span>
                   <span className="text-gray-400">Fair Market Value. Standard retail pricing.</span>
                </div>
                <div className="flex gap-2">
                   <span className="font-bold text-red-500 w-4">D/F</span>
                   <span className="text-gray-400">Overpriced or Negative Equity.</span>
                </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};