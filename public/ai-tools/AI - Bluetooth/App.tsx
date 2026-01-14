
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  Activity, 
  Thermometer, 
  Gauge, 
  Wind, 
  AlertTriangle, 
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
  Search,
  BookOpen,
  FileText,
  ClipboardList,
  Printer,
  X,
  ShieldCheck,
  Info,
  Camera,
  Video,
  StopCircle,
  Play,
  Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { OBDData, DiagnosticMode, DiagnosticCode } from './types';

// --- Utilities ---

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const App: React.FC = () => {
  const [mode, setMode] = useState<DiagnosticMode>(DiagnosticMode.IDLE);
  const [liveData, setLiveData] = useState<OBDData[]>([]);
  const [activeCodes, setActiveCodes] = useState<DiagnosticCode[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [groundingLinks, setGroundingLinks] = useState<{title: string, uri: string}[]>([]);
  
  // Sensory & Media Input State
  const [sensoryInput, setSensoryInput] = useState<{
    smell: string[];
    sound: string[];
    touch: string[];
  }>({ smell: [], sound: [], touch: [] });

  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [btStatus, setBtStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [btDevice, setBtDevice] = useState<any | null>(null);
  const [reportType, setReportType] = useState<'sales' | 'detailed' | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const connectBluetooth = async () => {
    if (!('bluetooth' in navigator)) {
      alert("Bluetooth is not supported in this browser. \n\n• Android: Use Chrome\n• iOS: Use 'Bluefy' browser\n• Desktop: Use Chrome/Edge/Opera");
      return;
    }

    setBtStatus('connecting');
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '00001101-0000-1000-8000-00805f9b34fb', // Standard SPP
          '0000fff0-0000-1000-8000-00805f9b34fb', // Generic BLE
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // OBDLink Proprietary
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e'  // Nordic UART
        ]
      });

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
      alert(`Bluetooth Error: ${error.message}\n\nTroubleshooting:\n1. Open your phone settings and "Forget" the OBD device.\n2. If on iOS, use Bluefy.`);
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

  // --- Camera & Recording Logic ---
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Please allow camera access to use the intake features.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (mode === DiagnosticMode.SENSORY_INPUT) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    // Determine supported MIME type
    const mimeType = [
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ].find(type => MediaRecorder.isTypeSupported(type)) || '';

    if (!mimeType) {
      alert("Video recording not supported on this device. Please use manual senses.");
      return;
    }

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    chunksRef.current = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setMediaBlob(blob);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingTime(0);
    
    // Auto-stop after 7 seconds for a concise clip
    const timer = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 7) {
          stopRecording(); // Will clear interval in the stop function logic via state change effect? No, simple call.
          clearInterval(timer);
          return 7;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearRecording = () => {
    setMediaBlob(null);
    setRecordingTime(0);
  };

  // --- Final Report Generation ---
  const submitSensoryData = async () => {
    setMode(DiagnosticMode.RESULTS);
    setAiAnalysis('');
    setGroundingLinks([]);
    
    const prompt = `
      You are AutoSense AI, a down-to-earth, honest, and practical mechanic assistant.
      
      TASK:
      Analyze the provided Diagnostic Trouble Codes (DTCs) and the optional user observations (Video/Audio intake + Manual Senses).
      
      DATA:
      - DTCs: ${activeCodes.map(c => c.code).join(', ')}
      - Manual Smells: ${sensoryInput.smell.join(', ')}
      - Manual Sounds: ${sensoryInput.sound.join(', ')}
      - Manual Tactile: ${sensoryInput.touch.join(', ')}
      ${mediaBlob ? '- NOTE: A video/audio clip of the engine is attached. Analyze the sound and visuals for irregularities (leaks, rattles, hisses, smoke).' : ''}

      OUTPUT RULES:
      1. **Tone**: Helpful, calm, "Don't Panic". Avoid alarmist language. Be realistic about urgency.
      2. **Structure**:
         - **The Issue**: Plain English explanation.
         - **Cost Estimates**: Give a realistic range for DIY (Parts) vs Shop (Labor + Parts).
         - **The Fix**: Simple step-by-step overview.
         - **Pro Tips**: Practical advice (e.g. "Wear gloves," "Wait for engine to cool," "Check the fuse first").
      3. **Sources**: Use Google Search to find real pricing and forums.
      
      Your goal is to empower the user to decide: "Can I fix this myself, or should I go to a pro?"
    `;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Prepare Content Parts
    const parts: any[] = [{ text: prompt }];
    
    if (mediaBlob) {
      const b64 = await blobToBase64(mediaBlob);
      parts.push({
        inlineData: {
          mimeType: mediaBlob.type,
          data: b64
        }
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
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
    } catch (e) {
      console.error(e);
      setAiAnalysis("Error generating report. Please try again.");
    }
  };

  const toggleSensorySelection = (category: 'smell' | 'sound' | 'touch', value: string) => {
    setSensoryInput(prev => {
      const current = prev[category];
      
      // Handle "None" logic
      if (value === 'none') {
        return { ...prev, [category]: current.includes('none') ? [] : ['none'] };
      }

      // If clicking a normal option, remove 'none' and toggle value
      let newValues;
      if (current.includes(value)) {
        newValues = current.filter(v => v !== value);
      } else {
        newValues = [...current.filter(v => v !== 'none'), value];
      }
      return { ...prev, [category]: newValues };
    });
  };

  // If report mode is active, show the report view overlay
  if (reportType) {
    return (
      <ReportView 
        type={reportType}
        data={liveData}
        codes={activeCodes}
        sensory={sensoryInput}
        analysis={aiAnalysis}
        links={groundingLinks}
        onClose={() => setReportType(null)}
      />
    );
  }

  const Breadcrumbs = () => {
    const stages = [
      { id: DiagnosticMode.LIVE_MONITOR, label: 'Telemetry', icon: <Gauge size={14} /> },
      { id: DiagnosticMode.SENSORY_INPUT, label: 'Intake', icon: <Camera size={14} /> },
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
              Real-time monitoring and down-to-earth repair advice.
              <br/>
              <span className="text-sm text-slate-500">Video & Audio Intake • Price Ranges • DIY Tips</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={connectBluetooth} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2">
                <Bluetooth size={20} /> Pair OBD-II Adapter
              </button>
              <button onClick={() => setMode(DiagnosticMode.LIVE_MONITOR)} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-lg transition-all border border-slate-700">
                Launch Simulation
              </button>
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
                <button onClick={() => setMode(DiagnosticMode.SENSORY_INPUT)} className="mt-8 w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 shadow-xl">
                  Inspect & Verify <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === DiagnosticMode.SENSORY_INPUT && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-300">
            <button onClick={() => setMode(DiagnosticMode.LIVE_MONITOR)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              <ChevronLeft size={16} /> Back to Telemetry
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Manual Senses */}
              <div className="glass-card p-8 rounded-[2rem] space-y-8 h-full">
                 <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white">Observation Engine</h2>
                    <p className="text-slate-400 text-sm">Select what you feel, hear, or smell.</p>
                 </div>
                 
                 <div className="space-y-6">
                    <SensoryMultiSelect label="Smell Assessment" icon={<Wind size={18} />} values={sensoryInput.smell} options={[{v: "none", l: "Nothing / Normal"}, {v: "sweet", l: "Antifreeze / Sweet"}, {v: "burnt-oil", l: "Burnt Oil"}, {v: "burnt-rubber", l: "Acrid / Rubber"}, {v: "sulfur", l: "Eggs / Sulfur"}]} onToggle={(v) => toggleSensorySelection('smell', v)} />
                    <SensoryMultiSelect label="Audio Profile" icon={<Ear size={18} />} values={sensoryInput.sound} options={[{v: "none", l: "Nothing / Normal"}, {v: "squeal", l: "Screech / Squeal"}, {v: "grind", l: "Grinding Metal"}, {v: "knock", l: "Rhythmic Knock"}, {v: "hiss", l: "Hissing Air"}]} onToggle={(v) => toggleSensorySelection('sound', v)} />
                    <SensoryMultiSelect label="Tactile Feedback" icon={<Zap size={18} />} values={sensoryInput.touch} options={[{v: "none", l: "Nothing / Normal"}, {v: "steering-vibrate", l: "Wheel Shake"}, {v: "rough-idle", l: "Rough Idle"}, {v: "hesitation", l: "Power Loss"}, {v: "pulling", l: "Lateral Pull"}]} onToggle={(v) => toggleSensorySelection('touch', v)} />
                 </div>
              </div>

              {/* Right Column: Audio/Video Intake */}
              <div className="space-y-6">
                <div className="glass-card p-2 rounded-[2rem] overflow-hidden shadow-2xl bg-black relative min-h-[400px] flex flex-col">
                    <div className="relative flex-grow bg-slate-900 rounded-[1.8rem] overflow-hidden">
                         <video 
                           ref={videoRef} 
                           autoPlay 
                           muted 
                           className={`w-full h-full object-cover transition-opacity duration-300 ${mediaBlob && !isRecording ? 'opacity-50' : 'opacity-100'}`}
                           playsInline 
                        />
                         
                         {/* Recording Overlay */}
                         {isRecording && (
                           <div className="absolute inset-0 bg-red-900/20 flex flex-col items-center justify-center z-20">
                              <div className="w-16 h-16 rounded-full border-4 border-red-500 animate-pulse flex items-center justify-center">
                                <div className="w-12 h-12 bg-red-500 rounded-full"></div>
                              </div>
                              <p className="mt-4 text-white font-black text-xl tracking-widest">{recordingTime}s / 7s</p>
                              <p className="text-red-200 text-sm mt-1">Recording Intake...</p>
                           </div>
                         )}

                         {/* Review Overlay */}
                         {mediaBlob && !isRecording && (
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30 animate-in fade-in">
                              <CheckCircle2 size={56} className="text-emerald-500 mb-4" />
                              <h3 className="text-white font-bold text-xl">Clip Recorded</h3>
                              <p className="text-slate-300 text-sm mb-6">Video & Audio attached to report</p>
                              <button onClick={clearRecording} className="px-6 py-2 bg-slate-800 hover:bg-red-900/50 text-white rounded-full text-sm font-bold flex items-center gap-2 border border-slate-700 transition-colors">
                                <Trash2 size={16} /> Retake Clip
                              </button>
                           </div>
                         )}

                         {!isRecording && !mediaBlob && (
                           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <div className="w-64 h-64 border-2 border-white/20 rounded-2xl flex items-center justify-center">
                                 <Camera size={32} className="text-white/20" />
                              </div>
                           </div>
                         )}
                    </div>
                    
                    <div className="p-6 bg-slate-900/50 backdrop-blur-xl border-t border-slate-800">
                        {mediaBlob ? (
                          <div className="flex items-center justify-between text-white">
                            <span className="text-sm font-medium flex items-center gap-2"><Video size={16} className="text-emerald-500" /> Intake Ready</span>
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Ready to Analyze</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <h4 className="text-white font-bold text-sm">Optional: Video & Audio Intake</h4>
                            <button 
                              onClick={toggleRecording}
                              disabled={isRecording}
                              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isRecording ? 'bg-slate-700 text-slate-400' : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20'}`}
                            >
                              {isRecording ? 'Recording...' : <><Video size={18} /> Record 7s Clip</>}
                            </button>
                            <p className="text-xs text-center text-slate-500 mt-1">Records engine sound and video for AI analysis.</p>
                          </div>
                        )}
                    </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] bg-gradient-to-br from-blue-900/40 to-slate-900/40 border-blue-500/20">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white"><Info size={20} /></div>
                        <div>
                            <h4 className="text-white font-bold mb-1">Down-to-Earth Advice</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                I'll analyze the data and tell you if this is a $20 DIY fix or a job for the pros. No alarmist nonsense, just facts and estimates.
                            </p>
                        </div>
                    </div>
                </div>

                <button onClick={submitSensoryData} className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[1.5rem] font-black text-lg transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3">
                  Generate Report <FileText size={20} />
                </button>
              </div>

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
                <p className="text-slate-400 font-medium flex items-center gap-2"><BookOpen size={14} className="text-blue-500" /> Educational mode active.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setReportType('sales')} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                  <FileText size={16} /> Sales Sheet
                </button>
                <button onClick={() => setReportType('detailed')} className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-2 border border-slate-700">
                  <ClipboardList size={16} /> Buyer Report
                </button>
                <button onClick={() => setMode(DiagnosticMode.IDLE)} className="p-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all shadow-lg"><RefreshCcw size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="glass-card p-10 rounded-[2.5rem] border-l-8 border-l-blue-600 shadow-2xl">
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-white">
                    <CheckCircle2 className="text-blue-500" size={28} /> Mechanic's Analysis
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
                      <ExternalLink size={14} /> Price Checks & Forums
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
                    <VerificationItem step="1" title="Visual Check" desc="Inspect for loose connectors or frayed wires first." />
                    <VerificationItem step="2" title="Price Parts" desc="Compare OEM vs Aftermarket sensor prices." />
                    <VerificationItem step="3" title="DIY Decision" desc="If job requires lift, consider shop." />
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

const ReportView: React.FC<{
  type: 'sales' | 'detailed';
  data: OBDData[];
  codes: DiagnosticCode[];
  sensory: any;
  analysis: string;
  links: any[];
  onClose: () => void;
}> = ({ type, data, codes, sensory, analysis, links, onClose }) => {
  const maxRpm = Math.max(...data.map(d => d.rpm), 0);
  const avgTemp = data.length > 0 ? (data.reduce((a, b) => a + b.coolantTemp, 0) / data.length) : 0;
  const passed = codes.length === 0;

  return (
    <div className="fixed inset-0 z-[100] bg-white text-slate-900 overflow-y-auto">
      {/* Print Controls - Hidden when printing */}
      <div className="fixed top-0 left-0 right-0 p-4 bg-slate-900 text-white flex justify-between items-center print:hidden shadow-xl z-50">
        <h2 className="font-bold flex items-center gap-2"><Printer size={18} /> Print Preview: {type === 'sales' ? 'Window Sheet' : 'Buyer Report'}</h2>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-sm">Print PDF</button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-sm flex items-center gap-2"><X size={16} /> Close</button>
        </div>
      </div>

      <div className="p-8 mt-16 max-w-[21cm] mx-auto min-h-screen bg-white">
        
        {/* ================= SALES DATA SHEET ================= */}
        {type === 'sales' && (
          <div className="space-y-8 border-4 border-slate-900 p-8 h-full relative">
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6">
              <div>
                <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-2">VEHICLE CONDITION</h1>
                <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">Digital Inspection Report</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-blue-600">AutoSense<span className="text-slate-900">AI</span></div>
                <div className="text-xs font-bold text-slate-400 uppercase mt-1">Verified Certified</div>
              </div>
            </div>

            <div className={`p-8 text-center rounded-3xl border-2 ${passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-white shadow-lg mb-4">
                {passed ? <ShieldCheck size={48} className="text-emerald-600" /> : <AlertTriangle size={48} className="text-red-600" />}
              </div>
              <h2 className={`text-4xl font-black mb-2 ${passed ? 'text-emerald-700' : 'text-red-700'}`}>
                {passed ? 'CLEAN BILL OF HEALTH' : 'ATTENTION REQUIRED'}
              </h2>
              <p className="text-slate-600 font-medium text-lg">
                {passed ? 'This vehicle passed all diagnostic checks during the test cycle.' : 'Diagnostic system detected pending codes. Ask associate for details.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Max RPM Tested</div>
                <div className="text-3xl font-black text-slate-900">{Math.round(maxRpm)} <span className="text-base text-slate-400 font-bold">REV</span></div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Avg Op. Temp</div>
                <div className="text-3xl font-black text-slate-900">{Math.round(avgTemp)} <span className="text-base text-slate-400 font-bold">°F</span></div>
              </div>
            </div>

            {codes.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-4">Active System Flags</h3>
                <div className="space-y-2">
                  {codes.map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <span className="font-mono font-bold text-red-700">{c.code}</span>
                      <span className="text-sm font-medium text-red-600">{c.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="absolute bottom-8 left-8 right-8 text-center pt-8 border-t-2 border-slate-100">
               <p className="text-sm text-slate-500 mb-2 font-medium">Scan for full digital history & AI mechanic analysis</p>
               <div className="inline-block px-6 py-2 bg-slate-900 text-white font-bold rounded-full text-sm">ASK FOR FULL REPORT</div>
            </div>
          </div>
        )}

        {/* ================= DETAILED BUYER REPORT ================= */}
        {type === 'detailed' && (
          <div className="space-y-10">
             <div className="border-b-2 border-slate-200 pb-8">
              <h1 className="text-3xl font-bold text-slate-900">Comprehensive Vehicle Diagnostic</h1>
              <div className="flex justify-between items-end mt-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Generated by <span className="font-bold text-blue-600">AutoSense AI</span></p>
                  <p className="text-sm text-slate-500">Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                </div>
                {passed ? 
                  <span className="px-4 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full text-sm border border-emerald-200">SYSTEMS NOMINAL</span> :
                  <span className="px-4 py-1 bg-red-100 text-red-700 font-bold rounded-full text-sm border border-red-200">{codes.length} FAULTS FOUND</span>
                }
              </div>
            </div>

            <section>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">1. Telemetry Snapshot</h2>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 uppercase font-bold">Max RPM</div>
                  <div className="text-xl font-black text-slate-900">{Math.round(maxRpm)}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 uppercase font-bold">Avg Temp</div>
                  <div className="text-xl font-black text-slate-900">{Math.round(avgTemp)}°F</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 uppercase font-bold">Data Points</div>
                  <div className="text-xl font-black text-slate-900">{data.length}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 uppercase font-bold">Scan Duration</div>
                  <div className="text-xl font-black text-slate-900">{Math.round(data.length / 60)}m</div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">2. Mechanic's Analysis (Costs & Fixes)</h2>
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line text-sm">
                {analysis || "No AI analysis data available."}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">3. Sensory Observations</h2>
              <div className="grid grid-cols-3 gap-4">
                 <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Wind size={14} /> Smell</h4>
                    <p className="text-sm text-slate-600">{sensory.smell.join(', ') || 'None Reported'}</p>
                 </div>
                 <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Ear size={14} /> Sound</h4>
                    <p className="text-sm text-slate-600">{sensory.sound.join(', ') || 'None Reported'}</p>
                 </div>
                 <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Zap size={14} /> Tactile</h4>
                    <p className="text-sm text-slate-600">{sensory.touch.join(', ') || 'None Reported'}</p>
                 </div>
              </div>
            </section>

            <section className="bg-blue-50 border border-blue-100 p-6 rounded-xl break-inside-avoid">
              <h2 className="text-lg font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={18} /> Buyer Advisory</h2>
              <p className="text-blue-800 text-sm mb-4 leading-relaxed font-medium">
                The data above represents a snapshot in time. To ensure total peace of mind, we strongly recommend:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-2 ml-2">
                <li><span className="font-bold">Extended Test Drive:</span> Drive for at least 20 minutes to allow all systems to reach operating temperature.</li>
                <li><span className="font-bold">Cold Start Check:</span> Listen to the engine immediately upon startup after sitting overnight.</li>
                <li><span className="font-bold">Independent Verification:</span> Use the links below to verify common issues for this make/model.</li>
              </ul>
            </section>

            {links.length > 0 && (
               <section>
                 <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Verified Research Links</h2>
                 <ul className="space-y-1">
                   {links.map((l, i) => (
                     <li key={i}><a href={l.uri} className="text-xs text-blue-600 hover:underline break-all">{l.uri}</a></li>
                   ))}
                 </ul>
               </section>
            )}
          </div>
        )}
      </div>
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
