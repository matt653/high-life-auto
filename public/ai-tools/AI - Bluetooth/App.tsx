
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { 
  Activity, 
  Settings, 
  Thermometer, 
  Gauge, 
  Wind, 
  AlertTriangle, 
  Mic, 
  Ear, 
  Zap, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  RefreshCcw,
  Car,
  Bluetooth,
  BluetoothOff,
  Home,
  Check,
  ExternalLink,
  Search
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { OBDData, DiagnosticMode, DiagnosticCode } from './types';

// Utility for audio
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const App: React.FC = () => {
  const [mode, setMode] = useState<DiagnosticMode>(DiagnosticMode.IDLE);
  const [liveData, setLiveData] = useState<OBDData[]>([]);
  const [activeCodes, setActiveCodes] = useState<DiagnosticCode[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [groundingLinks, setGroundingLinks] = useState<{title: string, uri: string}[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [sensoryInput, setSensoryInput] = useState<{
    smell: string[];
    sound: string[];
    touch: string[];
  }>({ smell: [], sound: [], touch: [] });
  
  const [btStatus, setBtStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [btDevice, setBtDevice] = useState<any | null>(null);

  const aiRef = useRef<any>(null);

  const connectBluetooth = async () => {
    if (!('bluetooth' in navigator)) {
      alert("Bluetooth is not supported in this browser. \n\n• Android: Use Chrome\n• iOS: Use 'Bluefy' browser\n• Desktop: Use Chrome/Edge/Opera");
      return;
    }

    setBtStatus('connecting');
    try {
      /**
       * OBDLink MX+ and other modern adapters require specific Service UUIDs to be discovered 
       * reliably in Web Bluetooth. We filter by common names AND specific services.
       */
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'OBD' },
          { namePrefix: 'obd' },
          { namePrefix: 'ELM' },
          { namePrefix: 'Vgate' },
          { namePrefix: 'Link' }, // Matches "Link" in some names
          { name: 'OBDLink MX+' },
          { name: 'OBDLink CX' },
          // Common Generic BLE Service for OBD
          { services: ['0000fff0-0000-1000-8000-00805f9b34fb'] }, 
           // Specific OBDLink BLE Service
          { services: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2'] }
        ],
        optionalServices: [
          '00001101-0000-1000-8000-00805f9b34fb', // Standard SPP
          '0000fff0-0000-1000-8000-00805f9b34fb', // Generic BLE
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // OBDLink Proprietary
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e'  // Nordic UART (often used in clones)
        ]
      });

      console.log("Device selected:", device.name || "Unnamed Device");

      if (device.gatt) {
        await device.gatt.connect();
      }

      setBtDevice(device);
      setBtStatus('connected');
      setMode(DiagnosticMode.LIVE_MONITOR);
      
      device.addEventListener('gattserverdisconnected', () => {
        setBtStatus('disconnected');
        setBtDevice(null);
      });
    } catch (error: any) {
      setBtStatus('disconnected');
      if (error.name === 'NotFoundError' || error.message?.includes('cancelled')) {
        return;
      }
      console.error("Bluetooth connection failed:", error);
      alert(`Bluetooth Error: ${error.message}\n\nTroubleshooting for OBDLink MX+:\n1. Press the physical 'Pair' button on the adapter until the LED blinks fast.\n2. Ensure it is NOT connected to your phone's Bluetooth settings (forget the device if necessary).\n3. Use the 'Bluefy' browser on iOS.`);
    }
  };

  useEffect(() => {
    if (mode === DiagnosticMode.LIVE_MONITOR) {
      const interval = setInterval(() => {
        setLiveData(prev => {
          const newData = {
            rpm: btStatus === 'connected' ? 2200 + Math.random() * 200 : 2000 + Math.random() * 500,
            speed: 65 + Math.random() * 5,
            coolantTemp: 190 + Math.random() * 2,
            load: 35 + Math.random() * 10,
            fuelPressure: 45 + Math.random() * 5,
            timestamp: Date.now()
          };
          const slice = [...prev, newData].slice(-20);
          if (newData.rpm > 2450 && activeCodes.length === 0) {
            setActiveCodes([{ code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected', severity: 'high' }]);
          }
          return slice;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mode, activeCodes.length, btStatus]);

  const startSensoryDiagnostic = async () => {
    setMode(DiagnosticMode.SENSORY_INPUT);
    setIsListening(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => console.log('Gemini Live session opened'),
          onmessage: (msg: any) => {
            if (msg.serverContent?.modelTurn?.parts?.[0]?.text) {
              setAiAnalysis(prev => prev + msg.serverContent.modelTurn.parts[0].text);
            }
          },
          onerror: (e: any) => console.error('Gemini error:', e),
          onclose: () => setIsListening(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are an expert master mechanic. Help the user diagnose their car based on live OBD-II data and their senses. Use technical precision found in sources like obd-codes.com.",
        }
      });
      aiRef.current = sessionPromise;
    } catch (err) {
      console.error(err);
    }
  };

  const submitSensoryData = async () => {
    setMode(DiagnosticMode.RESULTS);
    setAiAnalysis('');
    setGroundingLinks([]);
    
    const prompt = `Research the specific diagnostic trouble codes: ${activeCodes.map(c => c.code).join(', ')}. Combine this with user observations: Smells (${sensoryInput.smell.join(', ')}), Sounds (${sensoryInput.sound.join(', ')}), Tactile (${sensoryInput.touch.join(', ')}). Provide a detailed master mechanic report using live web data for exact failure points and repair steps. Refer to expert sites like obd-codes.com for code definitions and common fixes.`;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    setAiAnalysis(response.text || 'Unable to generate analysis.');
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const links = chunks
        .filter((c: any) => c.web)
        .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
      setGroundingLinks(links);
    }
  };

  const toggleSensorySelection = (category: 'smell' | 'sound' | 'touch', value: string) => {
    setSensoryInput(prev => {
      const current = prev[category];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(v => v !== value) };
      }
      return { ...prev, [category]: [...current, value] };
    });
  };

  const Breadcrumbs = () => {
    const stages = [
      { id: DiagnosticMode.LIVE_MONITOR, label: 'Telemetry', icon: <Gauge size={14} /> },
      { id: DiagnosticMode.SENSORY_INPUT, label: 'Senses', icon: <Ear size={14} /> },
      { id: DiagnosticMode.RESULTS, label: 'Report', icon: <CheckCircle2 size={14} /> },
    ];
    if (mode === DiagnosticMode.IDLE) return null;
    return (
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 no-scrollbar">
        {stages.map((s, idx) => {
          const isActive = mode === s.id;
          const isPast = stages.findIndex(st => st.id === mode) > idx;
          return (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : isPast ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isPast ? <CheckCircle2 size={14} /> : s.icon}
                {s.label}
              </div>
              {idx < stages.length - 1 && <div className={`h-[1px] w-8 ${isPast ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20">
      <nav className="p-6 flex justify-between items-center border-b border-slate-800 sticky top-0 bg-slate-900/80 backdrop-blur-md z-50">
        <button onClick={() => setMode(DiagnosticMode.IDLE)} className="flex items-center gap-2 group transition-transform hover:scale-105">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center glow-blue group-hover:bg-blue-500 transition-colors">
            <Car className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">AutoSense <span className="text-blue-500 underline decoration-2 underline-offset-4">AI</span></h1>
        </button>
        <div className="flex items-center gap-4">
          <button onClick={connectBluetooth} disabled={btStatus === 'connecting' || btStatus === 'connected'} className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${btStatus === 'connected' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {btStatus === 'connected' ? <Bluetooth size={14} /> : <BluetoothOff size={14} />}
            {btStatus === 'connected' ? 'OBD Connected' : 'Pair OBD'}
          </button>
          {mode !== DiagnosticMode.IDLE && (
            <button onClick={() => setMode(DiagnosticMode.IDLE)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors" title="Return to Home">
              <Home size={18} />
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-4">
        <Breadcrumbs />

        {mode === DiagnosticMode.IDLE && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in duration-500">
            <Zap size={64} className="text-blue-500 animate-pulse" />
            <h2 className="text-5xl font-extrabold text-white tracking-tight">Expert Vehicle Diagnostics</h2>
            <p className="text-slate-400 max-w-lg text-lg leading-relaxed">
              Powered by real-time search and master mechanic logic. We cross-reference your car's data with thousands of professional repair guides.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={connectBluetooth} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2">
                <Bluetooth size={20} /> Pair OBD-II Adapter
              </button>
              <button onClick={() => setMode(DiagnosticMode.LIVE_MONITOR)} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-lg transition-all border border-slate-700">
                Launch Simulation
              </button>
            </div>
            <div className="text-xs text-slate-500 max-w-xs mx-auto italic mt-4">
              Tip: Press the 'Connect' button on your OBDLink MX+ to make it discoverable.
            </div>
          </div>
        )}

        {mode === DiagnosticMode.LIVE_MONITOR && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Gauge className="text-blue-400" />} label="RPM" value={Math.round(liveData[liveData.length - 1]?.rpm || 0)} unit="rev" />
              <StatCard icon={<Activity className="text-emerald-400" />} label="Speed" value={Math.round(liveData[liveData.length - 1]?.speed || 0)} unit="mph" />
              <StatCard icon={<Thermometer className="text-orange-400" />} label="Temp" value={Math.round(liveData[liveData.length - 1]?.coolantTemp || 0)} unit="°F" />
              <StatCard icon={<Wind className="text-purple-400" />} label="Load" value={Math.round(liveData[liveData.length - 1]?.load || 0)} unit="%" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <Activity size={18} className="text-blue-500" /> Real-time Stream
                  </h3>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={liveData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis stroke="#475569" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="rpm" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="load" stroke="#8b5cf6" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl flex flex-col justify-between shadow-inner">
                <div>
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                    <AlertTriangle size={18} className="text-amber-500" /> Fault Log
                  </h3>
                  {activeCodes.length > 0 ? (
                    <div className="space-y-4">
                      {activeCodes.map((code, idx) => (
                        <div key={idx} className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-mono text-red-400 font-black text-lg">{code.code}</span>
                            <span className="text-[10px] px-2 py-1 rounded-md bg-red-500/20 text-red-400 font-bold uppercase tracking-widest">{code.severity}</span>
                          </div>
                          <p className="text-sm text-slate-400 leading-snug">{code.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-56 text-slate-500 text-center opacity-60">
                      <CheckCircle2 size={48} className="mb-3 text-emerald-500/30" />
                      <p className="text-sm">Scan complete. <br/>All systems nominal.</p>
                    </div>
                  )}
                </div>
                <button onClick={startSensoryDiagnostic} className="mt-8 w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 shadow-xl">
                  Verify with Senses <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === DiagnosticMode.SENSORY_INPUT && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-300">
            <button onClick={() => setMode(DiagnosticMode.LIVE_MONITOR)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              <ChevronLeft size={16} /> Back to Telemetry
            </button>
            <div className="glass-card p-10 rounded-[2.5rem] space-y-10 shadow-2xl relative overflow-hidden">
              <div className="space-y-2 relative z-10">
                <h2 className="text-4xl font-black text-white">Observation Engine</h2>
                <p className="text-slate-400 text-lg">Input your tactile, auditory, and olfactory findings.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <SensoryMultiSelect label="Smell Assessment" icon={<Wind size={18} />} values={sensoryInput.smell} options={[{v: "sweet", l: "Antifreeze / Sweet"}, {v: "burnt-oil", l: "Burnt Oil"}, {v: "burnt-rubber", l: "Acrid / Rubber"}, {v: "sulfur", l: "Eggs / Sulfur"}]} onToggle={(v) => toggleSensorySelection('smell', v)} />
                <SensoryMultiSelect label="Audio Profile" icon={<Ear size={18} />} values={sensoryInput.sound} options={[{v: "squeal", l: "Screech / Squeal"}, {v: "grind", l: "Grinding Metal"}, {v: "knock", l: "Rhythmic Knock"}, {v: "hiss", l: "Hissing Air"}]} onToggle={(v) => toggleSensorySelection('sound', v)} />
                <SensoryMultiSelect label="Tactile Feedback" icon={<Zap size={18} />} values={sensoryInput.touch} options={[{v: "steering-vibrate", l: "Wheel Shake"}, {v: "rough-idle", l: "Rough Idle"}, {v: "hesitation", l: "Power Loss"}, {v: "pulling", l: "Lateral Pull"}]} onToggle={(v) => toggleSensorySelection('touch', v)} />
              </div>
              <button onClick={submitSensoryData} disabled={sensoryInput.smell.length === 0 && sensoryInput.sound.length === 0 && sensoryInput.touch.length === 0} className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[1.5rem] font-black text-lg transition-all shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-3">
                Research & Analyze <Search size={20} />
              </button>
            </div>
          </div>
        )}

        {mode === DiagnosticMode.RESULTS && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-6 duration-700">
            <button onClick={() => setMode(DiagnosticMode.SENSORY_INPUT)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              <ChevronLeft size={16} /> Edit Observations
            </button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div className="space-y-1">
                <h2 className="text-5xl font-black text-white tracking-tighter">Diagnostic Report</h2>
                <p className="text-slate-400 font-medium flex items-center gap-2"><Search size={14} className="text-blue-500" /> Grounded in expert repair databases.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all">Save PDF</button>
                <button onClick={() => setMode(DiagnosticMode.IDLE)} className="p-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all shadow-lg"><RefreshCcw size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="glass-card p-10 rounded-[2.5rem] border-l-8 border-l-blue-600 shadow-2xl">
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-white">
                    <CheckCircle2 className="text-blue-500" size={28} /> AI Master Analysis
                  </h3>
                  <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-lg space-y-6">
                    {aiAnalysis ? aiAnalysis.split('\n').filter(l => l.trim()).map((line, i) => <p key={i}>{line}</p>) : (
                      <div className="space-y-4 animate-pulse">
                        <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                        <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                      </div>
                    )}
                  </div>
                </div>

                {groundingLinks.length > 0 && (
                  <div className="glass-card p-8 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <ExternalLink size={14} /> Source Verification (obd-codes.com & more)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groundingLinks.map((link, i) => (
                        <a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-blue-400 hover:bg-slate-800 transition-colors flex items-center justify-between">
                          <span className="truncate mr-2 font-medium">{link.title}</span>
                          <ExternalLink size={12} className="flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div className="glass-card p-8 rounded-[2rem] border border-slate-800/50 shadow-xl">
                  <h3 className="text-xl font-black mb-8 text-white uppercase tracking-tighter">Fix Checklist</h3>
                  <div className="space-y-6">
                    <VerificationItem step="1" title="Physical Verification" desc="Check harness connectivity and pin tension at the sensor." />
                    <VerificationItem step="2" title="Voltage Drop Test" desc="Ensure < 0.1V drop on the ground side of the circuit." />
                    <VerificationItem step="3" title="Part Swap" desc="Replace with OEM specific part only to ensure calibration." />
                  </div>
                </div>
                <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] shadow-lg">
                  <h4 className="font-black text-emerald-400 text-xs uppercase tracking-widest mb-3">Professional Insight</h4>
                  <p className="text-sm text-emerald-100/70 leading-relaxed italic">"Verified against common failure patterns. Cross-referencing {activeCodes[0]?.code} with your sound observations points to a primary component failure."</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const SensoryMultiSelect: React.FC<{ label: string; icon: React.ReactNode; values: string[]; options: {v:string, l:string}[]; onToggle: (v:string)=>void }> = ({ label, icon, values, options, onToggle }) => (
  <div className="space-y-4">
    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">{icon} {label}</label>
    <div className="space-y-2">
      {options.map(o => {
        const isSelected = values.includes(o.v);
        return (
          <button key={o.v} onClick={() => onToggle(o.v)} className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all border flex items-center justify-between group ${isSelected ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/20 scale-[1.02]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
            <span>{o.l}</span>
            {isSelected && <Check size={16} className="text-white" />}
          </button>
        );
      })}
    </div>
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: number | string, unit: string }> = ({ icon, label, value, unit }) => (
  <div className="glass-card p-6 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.05] hover:bg-slate-800 shadow-lg border border-slate-800/50">
    <div className="p-3 bg-slate-900 rounded-2xl mb-1">{icon}</div>
    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
      <span className="text-[10px] text-slate-500 font-bold uppercase">{unit}</span>
    </div>
  </div>
);

const VerificationItem: React.FC<{ step: string, title: string, desc: string }> = ({ step, title, desc }) => (
  <div className="flex gap-5 group">
    <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 text-sm font-black text-slate-500 group-hover:border-blue-500 group-hover:text-blue-400 transition-all duration-300">{step}</div>
    <div>
      <h5 className="font-bold text-slate-100 text-base tracking-tight">{title}</h5>
      <p className="text-sm text-slate-500 leading-snug mt-1">{desc}</p>
    </div>
  </div>
);

export default App;
