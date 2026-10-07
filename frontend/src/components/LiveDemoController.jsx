import React, { useState } from 'react';
import { 
  PlayCircle, 
  WifiOff, 
  Wifi, 
  Volume2, 
  Send, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  ShieldAlert, 
  Activity, 
  Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { offlineStorage } from '../services/offlineStorage.js';
import { api } from '../services/api.js';

export function LiveDemoController({ setRole, setLang }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [demoLog, setDemoLog] = useState([]);

  const addLog = (msg) => {
    setDemoLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const executeStep1 = () => {
    // 1. Simulate Airplane Mode ON
    offlineStorage.setOfflineSimulated(true);
    setLang('hi');
    setRole('worker');
    addLog("Step 1 executed: Airplane mode enabled (Zero Internet). Switched to ASHA Worker screening screen in Hindi.");
    setCurrentStep(2);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
  };

  const executeStep2 = () => {
    setRole('worker');
    addLog("Step 2 executed: Viewing local language voice result card & clinical explainability drawer.");
    setCurrentStep(3);
  };

  const executeStep3 = async () => {
    // Switch Network ON and Sync
    offlineStorage.setOfflineSimulated(false);
    await api.syncOfflineBatch();
    setRole('doctor');
    addLog("Step 3 executed: Switched Network ON. Transmitted pending screenings. Opened PHC Doctor Desk.");
    setCurrentStep(4);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const executeStep4 = async () => {
    await api.simulateOutbreak("VIL-01", 10);
    setRole('surveillance');
    addLog("Step 4 executed: Injected 10 acute diarrhoea cases into Rampur. Surveillance algorithm flagged RED outbreak cluster on Leaflet GIS map!");
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 animate-fadeIn">
      
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 text-slate-950 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-widest bg-slate-950 text-amber-400 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-amber-400" /> Hackathon Judge 3-Minute Interactive Flow
            </span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
            GramSaathi End-to-End Live Story Walkthrough
          </h2>
          <p className="text-xs sm:text-sm text-slate-900 font-medium max-w-2xl mt-1.5 opacity-90">
            Click through each guided step below to experience offline screening, local language audio triage, PHC doctor referral loop closure, and district-wide outbreak cluster detection.
          </p>
        </div>
      </div>

      {/* 4 Interactive Step Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Step 1 */}
        <div className={`p-5 rounded-2xl border-2 transition-all ${
          currentStep === 1 
            ? 'bg-white border-amber-500 ring-4 ring-amber-500/20 shadow-lg' 
            : 'bg-white/80 border-slate-200 opacity-90'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              1
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              Offline First
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-slate-900 mb-1">
            Simulate Airplane Mode & Screen Offline
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            Turns internet OFF and navigates to ASHA screening form with on-device WHO IMCI triage.
          </p>
          <button
            onClick={executeStep1}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <WifiOff className="w-4 h-4" />
            <span>Launch Step 1: Go Offline & Screen</span>
          </button>
        </div>

        {/* Step 2 */}
        <div className={`p-5 rounded-2xl border-2 transition-all ${
          currentStep === 2 
            ? 'bg-white border-amber-500 ring-4 ring-amber-500/20 shadow-lg' 
            : 'bg-white/80 border-slate-200 opacity-90'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              2
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
              Voice & Explainability
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-slate-900 mb-1">
            Local Language Voice & Protocol Rules
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            Hears the plain language Hindi/Marathi voice card and inspects why the AI assigned RED triage.
          </p>
          <button
            onClick={executeStep2}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            <span>Launch Step 2: Voice & Reason</span>
          </button>
        </div>

        {/* Step 3 */}
        <div className={`p-5 rounded-2xl border-2 transition-all ${
          currentStep === 3 
            ? 'bg-white border-amber-500 ring-4 ring-amber-500/20 shadow-lg' 
            : 'bg-white/80 border-slate-200 opacity-90'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              3
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Referral Loop
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-slate-900 mb-1">
            Sync Offline Batch & Doctor Accepts
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            Restores 4G network, flushes the offline sync queue, and shows PHC Doctor triage intake.
          </p>
          <button
            onClick={executeStep3}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Wifi className="w-4 h-4" />
            <span>Launch Step 3: Sync & Open Doctor Desk</span>
          </button>
        </div>

        {/* Step 4 */}
        <div className={`p-5 rounded-2xl border-2 transition-all ${
          currentStep === 4 
            ? 'bg-white border-amber-500 ring-4 ring-amber-500/20 shadow-lg' 
            : 'bg-white/80 border-slate-200 opacity-90'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              4
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800">
              Outbreak Surveillance
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-slate-900 mb-1">
            Trigger Outbreak & GIS Map Alert
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            Injects 10 syndromic cases into Rampur and watches the early-warning cluster algorithm fire RED alert.
          </p>
          <button
            onClick={executeStep4}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Launch Step 4: Trigger Outbreak & View GIS</span>
          </button>
        </div>

      </div>

      {/* Live Log Terminal */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 text-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">Live Demo Execution Log</h4>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Real-Time Trace</span>
        </div>

        <div className="font-mono text-xs text-slate-300 space-y-1.5 max-h-40 overflow-y-auto">
          {demoLog.length === 0 ? (
            <div className="text-slate-500 italic">Click any step above to begin interactive demonstration...</div>
          ) : (
            demoLog.map((l, i) => (
              <div key={i} className="text-teal-300">{l}</div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
