import React, { useState, useMemo } from 'react';
import { Sale } from '../types';
import { generateInventoryReport } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { TrendingUp, Clock, DollarSign, Loader2, FileText, AlertCircle } from 'lucide-react';

interface VehicleTrendsProps {
  sales: Sale[];
  report: string;
  onUpdateReport: (report: string) => void;
}

const VehicleTrends: React.FC<VehicleTrendsProps> = ({ sales, report, onUpdateReport }) => {
  const [loading, setLoading] = useState(false);

  // Aggregated Data by Type
  const typeData = useMemo(() => {
    const data: Record<string, { count: number, totalProfit: number, totalDays: number }> = {};
    
    sales.forEach(sale => {
      const type = sale.vehicle.type;
      if (!data[type]) data[type] = { count: 0, totalProfit: 0, totalDays: 0 };
      data[type].count += 1;
      data[type].totalProfit += sale.profit;
      data[type].totalDays += sale.daysOnLot;
    });

    return Object.entries(data).map(([type, stats]) => ({
      name: type,
      avgProfit: Math.round(stats.totalProfit / stats.count),
      avgDays: Math.round(stats.totalDays / stats.count),
      volume: stats.count
    })).sort((a, b) => b.avgProfit - a.avgProfit);
  }, [sales]);

  // Scatter Data: Price vs Profit vs Days (Velocity)
  const scatterData = useMemo(() => {
    return sales.map(s => ({
      price: s.vehicle.price,
      days: s.daysOnLot,
      profit: s.profit,
      type: s.vehicle.type
    })).filter(s => s.price > 0 && s.days >= 0); // Filter bad data
  }, [sales]);

  const handleGenerateReport = async () => {
    setLoading(true);
    const text = await generateInventoryReport(sales);
    onUpdateReport(text);
    setLoading(false);
  };

  const bestPerformer = typeData.length > 0 ? typeData[0] : null;
  const fastestMover = [...typeData].sort((a, b) => a.avgDays - b.avgDays)[0];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Most Profitable</p>
            <h3 className="text-xl font-bold text-slate-800">{bestPerformer?.name || 'N/A'}</h3>
            <p className="text-xs text-green-600">Avg. ${bestPerformer?.avgProfit.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Fastest Mover</p>
            <h3 className="text-xl font-bold text-slate-800">{fastestMover?.name || 'N/A'}</h3>
            <p className="text-xs text-blue-600">Avg. {fastestMover?.avgDays} Days</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Inventory Value</p>
            <h3 className="text-xl font-bold text-slate-800">
                ${sales.reduce((acc, s) => acc + s.vehicle.price, 0).toLocaleString()}
            </h3>
            <p className="text-xs text-purple-600">{sales.length} Units Sold</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit by Type Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6">Average Profit by Vehicle Type</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Avg Profit']}
                />
                <Bar dataKey="avgProfit" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Velocity Scatter Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-2">Price vs. Days on Lot</h3>
          <p className="text-xs text-slate-400 mb-4">Do expensive cars sit longer?</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="price" name="Price" unit="$" tick={{fontSize: 12}} />
                <YAxis type="number" dataKey="days" name="Days on Lot" unit="d" tick={{fontSize: 12}} />
                <ZAxis type="number" dataKey="profit" range={[20, 200]} name="Profit" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Vehicles" data={scatterData} fill="#3b82f6" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Report Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileText className="text-emerald-400" />
                        AI Inventory Strategy Report
                    </h2>
                    <p className="text-slate-400 mt-1">
                        Automated analysis of price points, turn rates, and profitability.
                    </p>
                </div>
                <button 
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <FileText size={18} />}
                    {report ? 'Update Report' : 'Generate Report'}
                </button>
            </div>

            {report ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-slate-200 leading-relaxed text-lg border border-white/10 animate-in fade-in slide-in-from-bottom-4">
                    {report.split('\n').map((line, i) => (
                        <p key={i} className="mb-4 last:mb-0">{line}</p>
                    ))}
                </div>
            ) : (
                <div className="bg-white/5 rounded-xl p-12 text-center border-2 border-dashed border-white/10">
                    <AlertCircle className="mx-auto text-slate-500 mb-3" size={48} />
                    <p className="text-slate-400 text-lg">
                        Click "Generate Report" to have Gemini analyze your vehicle data and provide purchasing recommendations.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VehicleTrends;