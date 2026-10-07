import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Globe, 
  ShieldCheck, 
  User,
  UserCheck, 
  Stethoscope, 
  MapPin, 
  Smartphone,
  PlayCircle,
  Award,
  CheckCircle2,
  Mic,
  Ticket,
  FileText,
  ChevronDown
} from 'lucide-react';
import { offlineStorage } from '../services/offlineStorage.js';
import { api } from '../services/api.js';
import { TRANSLATIONS, LANGUAGES } from '../services/translations.js';

export function Header({ currentRole, setRole, currentLang, setLang, onSyncComplete }) {
  const [isOffline, setIsOffline] = useState(offlineStorage.isOfflineSimulated());
  const [pendingCount, setPendingCount] = useState(offlineStorage.getPendingCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(null);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const currentLangObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  useEffect(() => {
    const handleNetwork = (e) => setIsOffline(e.detail.offline);
    const handleQueue = () => setPendingCount(offlineStorage.getPendingCount());

    window.addEventListener("gramsaathi_network_change", handleNetwork);
    window.addEventListener("gramsaathi_sync_queue_change", handleQueue);

    return () => {
      window.removeEventListener("gramsaathi_network_change", handleNetwork);
      window.removeEventListener("gramsaathi_sync_queue_change", handleQueue);
    };
  }, []);

  const toggleOfflineMode = () => {
    const nextState = !isOffline;
    offlineStorage.setOfflineSimulated(nextState);
    setIsOffline(nextState);
  };

  const handleSyncNow = async () => {
    if (isOffline) {
      alert("Please switch Network ON before synchronizing data.");
      return;
    }
    setIsSyncing(true);
    try {
      const res = await api.syncOfflineBatch();
      setPendingCount(offlineStorage.getPendingCount());
      setSyncToast(res.message || "Sync complete!");
      if (onSyncComplete) onSyncComplete();
      setTimeout(() => setSyncToast(null), 4000);
    } catch (err) {
      alert("Sync failed. Check connection to server.");
    } finally {
      setIsSyncing(false);
    }
  };

  const roles = [
    { id: 'worker', label: t.roles.worker, icon: UserCheck, short: 'ASHA Screen' },
    { id: 'voiceAi', label: t.roles.voiceAi, icon: Mic, short: '🎙️ Voice AI Bot', isHighlight: true },
    { id: 'patientPortal', label: 'ABHA Portal', icon: User, short: '👤 Patient ABHA Locker', isHighlight: true },
    { id: 'token', label: t.roles.token, icon: Ticket, short: '🎫 Smart Token' },
    { id: 'summary', label: t.roles.summary, icon: FileText, short: '📋 Case Slip' },
    { id: 'doctor', label: t.roles.doctor, icon: Stethoscope, short: 'PHC Doctor' },
    { id: 'surveillance', label: t.roles.surveillance, icon: MapPin, short: 'Surveillance' },
    { id: 'tasks', label: t.tasks.title, icon: Award, short: 'Follow-ups' },
    { id: 'patient', label: t.roles.patient, icon: Smartphone, short: 'SMS View' },
    { id: 'demo', label: t.roles.demo, icon: PlayCircle, short: '🎯 Demo Flow', isSpecial: true }
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      {/* Top Bar with branding, offline switch, 8-language selector, and sync queue */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">{t.appName}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Voice AI & Tokens
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">{t.tagline}</p>
            </div>
          </div>

          {/* Right Controls: Offline Toggle, Sync Button, 8-Languages Dropdown */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            
            {/* Simulated Airplane Mode Switch */}
            <button
              onClick={toggleOfflineMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                isOffline 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
              title="Toggle Airplane Mode to test offline screening"
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden xs:inline">{isOffline ? "Offline" : "Online 4G"}</span>
            </button>

            {/* Sync Queue Badge & Button */}
            {pendingCount > 0 ? (
              <button
                onClick={handleSyncNow}
                disabled={isSyncing || isOffline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? "Syncing..." : `${pendingCount} Sync`}</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 px-2.5 py-1 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Synced</span>
              </div>
            )}

            {/* 8 Indian Languages Dropdown Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl border border-slate-700 text-xs font-bold transition-all shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>{currentLangObj.native}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 max-h-72 overflow-y-auto animate-fadeIn">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2.5 py-1 border-b border-slate-800 mb-1">
                    Select Indian Language (8)
                  </div>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLang(lang.code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        currentLang === lang.code
                          ? 'bg-teal-500 text-slate-950 font-bold'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.native}</span>
                        <span className="text-[10px] opacity-70">({lang.name})</span>
                      </span>
                      {currentLang === lang.code && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Sync notification toast */}
        {syncToast && (
          <div className="mt-2 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center justify-between animate-fadeIn">
            <span>✅ {syncToast}</span>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar border-t border-slate-800/80 pt-2.5">
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = currentRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? r.isSpecial
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md'
                      : 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                    : r.isSpecial
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                    : r.isHighlight
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span>{r.short}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
