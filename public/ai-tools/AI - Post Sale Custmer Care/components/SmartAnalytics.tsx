import React, { useState } from 'react';
import { Sale, SalesInsight, SalesPersona } from '../types';
import { generateStrategicAnalysis, generateBuyerPersona } from '../services/geminiService';
import { BrainCircuit, Target, TrendingUp, Lightbulb, Loader2, User, Wallet, UserCheck } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SmartAnalyticsProps {
  sales: Sale[];
  insights: SalesInsight[];
  onUpdateInsights: (insights: SalesInsight[]) => void;
  persona: SalesPersona | null;
  onUpdatePersona: (persona: SalesPersona) => void;
}

const SmartAnalytics: React.FC<SmartAnalyticsProps> = ({ sales, insights, onUpdateInsights, persona, onUpdatePersona }) => {
  const [loading, setLoading] = useState(false);
  const hasData = insights.length > 0;

  const runAnalysis = async () => {
    setLoading(true);
    // Run both AI tasks in parallel
    const [newInsights, newPersona] = await Promise.all([
      generateStrategicAnalysis(sales),
      generateBuyerPersona(sales)
    ]);
    
    onUpdateInsights(newInsights);
    if (newPersona) onUpdatePersona(newPersona);
    setLoading(false);
  };

  // Prepare data for demographics chart
  const ageGroups = sales.reduce((acc, sale) => {
    const year = new Date(sale.customer.birthDate).getFullYear();
    const age = new Date().getFullYear() - year;
    const group = age < 35 ? '18-34' : age < 50 ? '35-49' : age < 65 ? '50-64' : '65+';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ['#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl shadow-xl text-white">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <BrainCircuit className="text-blue-400" size={32} />
            Strategic Intelligence
          </h2>
          <p className="text-slate-300 mt-2 max-w-xl">
            Leverage Gemini AI to analyze your sales data, identify buying patterns, and build the perfect target customer profile.
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" /> : <SparklesIcon />}
          {hasData ? 'Refresh Analysis' : 'Run AI Analysis'}
        </button>
      </div>

      {persona && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 mb-4">
             <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                <UserCheck size={24} />
             </div>
             <h3 className="text-xl font-bold text-slate-800">Target Buyer Persona</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3 bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                    {persona.archetype.charAt(0)}
                </div>
                <h4 className="text-center text-xl font-bold text-slate-900">{persona.archetype}</h4>
                <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                        <span className="text-slate-500 flex items-center gap-2"><User size={14}/> Age Range</span>
                        <span className="font-semibold text-slate-800">{persona.ageRange}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                        <span className="text-slate-500 flex items-center gap-2"><Wallet size={14}/> Est. Income</span>
                        <span className="font-semibold text-slate-800">{persona.incomeLevel}</span>
                    </div>
                </div>
            </div>
            <div className="flex-1">
                <h4 className="font-semibold text-slate-800 mb-2">Bio & Lifestyle</h4>
                <p className="text-slate-600 leading-relaxed mb-6">{persona.bio}</p>
                
                <h4 className="font-semibold text-slate-800 mb-2">Key Interests</h4>
                <div className="flex flex-wrap gap-2">
                    {persona.interests.map((int, i) => (
                        <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                            {int}
                        </span>
                    ))}
                </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Demographics */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target size={20} className="text-blue-600" />
            Demographic Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: AI Insights */}
        <div className="lg:col-span-2 space-y-4">
            {!hasData && !loading && (
                <div className="h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl min-h-[300px]">
                    <BrainCircuit size={48} className="text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Click "Run AI Analysis" to generate insights.</p>
                </div>
            )}

            {loading && (
                <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl min-h-[300px]">
                    <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-600 font-medium animate-pulse">Analyzing sales patterns...</p>
                </div>
            )}

            {hasData && !loading && (
                <div className="grid gap-4">
                    {insights.map((insight, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-in slide-in-from-bottom-5 duration-500" style={{animationDelay: `${idx * 150}ms`}}>
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg shrink-0 ${
                                    idx === 0 ? 'bg-amber-100 text-amber-600' : 
                                    idx === 1 ? 'bg-emerald-100 text-emerald-600' : 
                                    'bg-purple-100 text-purple-600'
                                }`}>
                                    {idx === 0 ? <Lightbulb size={24} /> : idx === 1 ? <TrendingUp size={24} /> : <Target size={24} />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-1">{insight.title}</h4>
                                    <p className="text-slate-600 mb-3 leading-relaxed">{insight.content}</p>
                                    <div className="bg-slate-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
                                        <p className="text-sm font-semibold text-slate-700">
                                            <span className="text-blue-600 uppercase text-xs tracking-wider mr-2">Action Plan:</span>
                                            {insight.recommendation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/></svg>
)

export default SmartAnalytics;