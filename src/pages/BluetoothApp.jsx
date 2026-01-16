
import React, { useState, useEffect, useRef } from 'react';
import {
    Activity,
    Bluetooth,
    Zap,
    Thermometer,
    Settings,
    FileText,
    CheckCircle2,
    AlertTriangle,
    Play,
    Square,
    Mic,
    Video,
    BarChart3,
    Search,
    Wind,
    Ear,
    ScanLine,
    ChevronRight,
    Database,
    History
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { ReportView } from '../apps/Bluetooth/components/ReportView';
import { GarageCard } from '../apps/Bluetooth/components/GarageCard';
import { StatCard } from '../apps/Bluetooth/components/StatCard';
import { SensoryMultiSelect } from '../apps/Bluetooth/components/SensoryMultiSelect';
import { VerificationItem } from '../apps/Bluetooth/components/VerificationItem';

// --- CONFIG ---
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Common OBD-II BLE Service UUIDs
const OPTIONAL_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Generic
    '0000fff0-0000-1000-8000-00805f9b34fb', // Vgate / ELM327 BLE / iCar
    '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART (OBDLink MX+ LE often uses specific UARTs)
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC
    '00001101-0000-1000-8000-00805f9b34fb'  // Serial Port Profile (Rarely works in Web BLE but worth listing)
];

const BluetoothApp = () => {
    // Mode State: 'idle' | 'live' | 'sensory' | 'results' | 'garage'
    const [mode, setMode] = useState('idle');
    const [isScanning, setIsScanning] = useState(false);
    const [device, setDevice] = useState(null);
    const [data, setData] = useState([]);
    const [codes, setCodes] = useState([]);
    const [analysis, setAnalysis] = useState('');
    const [researchLinks, setResearchLinks] = useState([]);
    const [sensoryInputs, setSensoryInputs] = useState({
        smell: [],
        sound: [],
        touch: []
    });
    const [vehicleId, setVehicleId] = useState(''); // VIN or ID
    const [garage, setGarage] = useState([]);

    // Simulation / Demo Mode
    const [isDemo, setIsDemo] = useState(false);

    // Load Garage
    useEffect(() => {
        const saved = localStorage.getItem('autosense_garage');
        if (saved) setGarage(JSON.parse(saved));
    }, []);

    const connectBluetooth = async () => {
        try {
            console.log("Requesting Bluetooth Device...");
            const dev = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: OPTIONAL_SERVICES
            });

            console.log("Device selected:", dev.name);
            const server = await dev.gatt.connect();
            console.log("GATT Connected");

            setDevice(dev);
            setIsScanning(true);
            setMode('live');

            // Real implementation would subscribe to notifications here
            // For this prototype, we'll simulate data if connection "succeeds" or fails
            simulateObdStream();

        } catch (err) {
            console.warn("Bluetooth connection failed:", err);

            // User-facing Error Handling
            let msg = "Could not connect to Bluetooth device.\n\n";
            if (err.name === 'NotFoundError') {
                msg += "• No device was selected.\n";
            } else if (err.name === 'SecurityError') {
                msg += "• Security restriction. Ensure you are using HTTPS or Localhost.\n";
            } else {
                msg += "• If using OBDLink MX+ on Windows: Unpair it from Windows Settings first, then try again here.\n";
                msg += "• Ensure your dongle supports Bluetooth LE (Low Energy).\n";
            }

            alert(msg + "\nStarting DEMO MODE for review.");

            setIsDemo(true);
            setMode('live');
            simulateObdStream();
        }
    };

    const simulateObdStream = () => {
        const interval = setInterval(() => {
            setData(prev => {
                const newData = [...prev, {
                    time: new Date().toLocaleTimeString(),
                    rpm: 800 + Math.random() * 200, // Idle variance
                    coolantTemp: 195 + Math.random() * 5,
                    voltage: 13.8 + Math.random() * 0.4,
                    maf: 3.5 + Math.random() * 0.5
                }].slice(-50); // Keep last 50 points
                return newData;
            });
        }, 1000);
        return () => clearInterval(interval);
    };

    const stopScan = () => {
        setIsScanning(false);
        // Determine random codes for demo
        const randomCodes = Math.random() > 0.5 ? [
            { code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected' },
            { code: 'P0171', description: 'System Too Lean (Bank 1)' }
        ] : [];
        setCodes(randomCodes);
        setMode('sensory');
    };

    const handleSensoryScan = async () => {
        setMode('results'); // Show loading state in results

        // Compile Prompt
        const prompt = `
      You are AutoSense AI, a master mechanic diagnostic tool.
      
      VEHICLE TELEMETRY:
      - Max RPM: ${Math.max(...data.map(d => d.rpm), 0).toFixed(0)}
      - Avg Temp: ${(data.reduce((a, b) => a + b.coolantTemp, 0) / data.length || 0).toFixed(1)}°F
      
      OBD-II CODES:
      ${codes.length > 0 ? codes.map(c => `${c.code}: ${c.description}`).join('\n') : "NONE - CLEAN SCAN"}
      
      SENSORY OBSERVATIONS:
      - Smell: ${sensoryInputs.smell.join(', ') || "None"}
      - Sound: ${sensoryInputs.sound.join(', ') || "None"}
      - Feel: ${sensoryInputs.touch.join(', ') || "None"}
      
      TASK:
      1. Analyze the correlation between the OBD codes and sensory inputs.
      2. Provide a "Golden Nugget" verification step (e.g., "Check the vacuum hose behind the intake").
      3. Create a bulleted list of potential costs (Parts & Labor).
      4. Provide 3 Verified Search Queries for the user to research.
    `;

        try {
            if (!API_KEY) throw new Error("Missing API Key");

            const genAI = new GoogleGenAI({ apiKey: API_KEY });
            const modelResult = await genAI.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    tools: [{ googleSearch: {} }] // Enable Grounding
                }
            });

            const responseText = modelResult.text;
            const groundingLinks = modelResult.candidates[0]?.groundingMetadata?.groundingChunks || [];

            setAnalysis(responseText);
            setResearchLinks(groundingLinks);

            // Save to Garage Logic
            const newRecord = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                vehicleName: vehicleId || "Unknown Vehicle",
                codes,
                sensory: sensoryInputs,
                aiAnalysis: responseText,
                outcome: 'pending', // pending | fixed | waste
                actualFix: '',
                wastedMoneyNotes: ''
            };

            const updatedGarage = [newRecord, ...garage];
            setGarage(updatedGarage);
            localStorage.setItem('autosense_garage', JSON.stringify(updatedGarage));

        } catch (err) {
            console.error(err);
            setAnalysis("AI DIAGNOSTIC FAILED: Check API Key or Network.");
        }
    };

    const handleUpdateRecord = (outcome, fixNote, wasteNote) => {
        // In a real app, update by specific ID. Here we just update the specific record passed.
        // Simplifying for this snippet.
        const updated = garage.map(r => {
            // Find matching record (assuming we passed ID or context, here just updating local state for display)
            return r;
        });
        // This part requires passing the ID from GarageCard properly. 
        // For now we assume local update.
        console.log("Saving outcome:", outcome, fixNote, wasteNote);
    };

    // --- RENDER ---
    return (
        <div className="bg-slate-950 min-h-screen text-slate-200 font-sans selection:bg-blue-500/30">

            {/* HEADER */}
            <header className="fixed top-0 inset-x-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isScanning ? 'bg-blue-600 animate-pulse shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'bg-slate-800'}`}>
                            <Bluetooth className={isScanning ? 'text-white' : 'text-slate-500'} size={20} />
                        </div>
                        <div>
                            <h1 className="font-black text-lg tracking-tight text-white leading-none">AutoSense<span className="text-blue-500">AI</span></h1>
                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{isScanning ? 'LIVE MONITORING...' : 'DIAGNOSTIC LAB'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setMode('garage')} className={`p-2 rounded-lg transition-colors ${mode === 'garage' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
                            <History size={20} />
                        </button>
                        {mode !== 'idle' && (
                            <button onClick={() => setMode('idle')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-24 pb-12 px-4 max-w-5xl mx-auto min-h-screen">

                {/* === IDLE MODE === */}
                {mode === 'idle' && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in-up">
                        <div className="relative group cursor-pointer" onClick={connectBluetooth}>
                            <div className="absolute inset-0 bg-blue-600 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                            <div className="w-40 h-40 bg-slate-900 border-2 border-slate-800 rounded-full flex items-center justify-center relative z-10 group-hover:scale-105 group-hover:border-blue-500 transition-all duration-300 shadow-2xl">
                                <ScanLine size={64} className="text-slate-500 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div className="absolute -bottom-12 inset-x-0">
                                <p className="font-bold text-slate-400 uppercase tracking-widest text-sm animate-pulse">Tap to Connect OBD-II</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mt-12">
                            <VerificationItem step="1" title="Plug In" desc="Connect AutoSense dongle to OBD-II port under dash." />
                            <VerificationItem step="2" title="Pair App" desc="Tap the button above to link via Bluetooth." />
                            <VerificationItem step="3" title="AI Diagnose" desc="Get instant analysis of codes + sensory data." />
                        </div>
                    </div>
                )}

                {/* === LIVE MODE === */}
                {mode === 'live' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Readout Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard icon={<Activity size={20} className="text-emerald-400" />} label="Engine RPM" value={(data[data.length - 1] || {}).rpm?.toFixed(0) || 0} unit="RPM" />
                            <StatCard icon={<Thermometer size={20} className="text-orange-400" />} label="Coolant Temp" value={(data[data.length - 1] || {}).coolantTemp?.toFixed(0) || 0} unit="°F" />
                            <StatCard icon={<Zap size={20} className="text-yellow-400" />} label="Battery" value={(data[data.length - 1] || {}).voltage?.toFixed(1) || 0} unit="V" />
                            <StatCard icon={<Wind size={20} className="text-blue-400" />} label="Mass Airflow" value={(data[data.length - 1] || {}).maf?.toFixed(1) || 0} unit="g/s" />
                        </div>

                        {/* Live Chart */}
                        <div className="glass-card p-6 rounded-3xl border border-slate-800/50 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorRpm" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" hide />
                                    <YAxis domain={['auto', 'auto']} hide />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                                    <Area type="monotone" dataKey="rpm" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRpm)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Control Deck */}
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur border border-white/10 p-2 rounded-2xl flex items-center gap-2 shadow-2xl z-40">
                            {(isScanning && data.length === 0) ? (
                                <div className="flex items-center gap-2 px-6 py-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Connecting Data Stream...</span>
                                </div>
                            ) : (
                                <button onClick={stopScan} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all">
                                    <Square size={16} fill="white" /> STOP SCAN
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* === SENSORY INPUT MODE === */}
                {mode === 'sensory' && (
                    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-white">SENSORY CHECK</h2>
                            <p className="text-slate-400 mt-2">The OBD scanner found {codes.length} codes. Now AutoSense needs your human input to pinpoint the root cause.</p>
                        </div>

                        <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-8">
                            <SensoryMultiSelect
                                label="Do you smell anything?"
                                icon={<Wind size={16} />}
                                values={sensoryInputs.smell}
                                options={[{ v: 'sweet', l: 'Sweet (Maple Syrup)' }, { v: 'rotten', l: 'Rotten Eggs (Sulfur)' }, { v: 'gas', l: 'Raw Gasoline' }, { v: 'burning', l: 'Burning Plastic/Oil' }]}
                                onToggle={(v) => setSensoryInputs(prev => ({ ...prev, smell: prev.smell.includes(v) ? prev.smell.filter(i => i !== v) : [...prev.smell, v] }))}
                            />

                            <SensoryMultiSelect
                                label="Do you hear anything?"
                                icon={<Ear size={16} />}
                                values={sensoryInputs.sound}
                                options={[{ v: 'grinding', l: 'Metal Grinding' }, { v: 'hissing', l: 'Hissing/Vacuum Leak' }, { v: 'clicking', l: 'Rhythmic Clicking' }, { v: 'squealing', l: 'High-pitch Squeal' }]}
                                onToggle={(v) => setSensoryInputs(prev => ({ ...prev, sound: prev.sound.includes(v) ? prev.sound.filter(i => i !== v) : [...prev.sound, v] }))}
                            />

                            <button onClick={handleSensoryScan} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-2xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all hover:scale-105">
                                <Zap size={20} className="fill-white" /> RUN AI DIAGNOSTIC
                            </button>
                        </div>
                    </div>
                )}

                {/* === RESULTS MODE === */}
                {mode === 'results' && (
                    <ReportView
                        type="detailed"
                        data={data}
                        codes={codes}
                        sensory={sensoryInputs}
                        analysis={analysis}
                        links={researchLinks}
                        onClose={() => setMode('idle')}
                    />
                )}

                {/* === GARAGE MODE === */}
                {mode === 'garage' && (
                    <div className="max-w-3xl mx-auto space-y-8 animate-slide-in">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-black text-white">SHOP MEMORY</h2>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lifetime Savings</p>
                                <p className="text-2xl font-black text-emerald-500">$1,250</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {garage.length === 0 && (
                                <div className="text-center py-20 text-slate-500">
                                    <Database size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-bold uppercase tracking-widest text-sm">No scans in memory</p>
                                </div>
                            )}
                            {garage.map((record) => (
                                <GarageCard key={record.id} record={record} onUpdate={handleUpdateRecord} />
                            ))}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default BluetoothApp;
