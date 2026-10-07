import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Clock, 
  UserCheck, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Smartphone, 
  MessageSquare, 
  RefreshCw, 
  Building2,
  Zap,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TRANSLATIONS } from '../services/translations.js';

export function SmartTokenManager({ currentLang = 'en', initialTokenData = null }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [token, setToken] = useState(initialTokenData || {
    id: "OPD-RAM-014",
    patientName: "Aarav Kumar",
    age: "3y",
    gender: "Male",
    villageName: "Rampur",
    facilityName: "Rampur 24x7 Primary Health Centre",
    roomNo: "Room 1 (Emergency Triage)",
    doctorName: "Dr. Rajesh Verma (Medical Officer)",
    priority: "FAST_TRACK_EMERGENCY",
    isFastTrack: true,
    waitTimeMins: 2,
    patientsAhead: 0,
    status: "WAITING",
    createdAt: new Date().toISOString()
  });

  const [queueList, setQueueList] = useState([
    { id: "OPD-RAM-011", name: "Kabir Singh (4y)", room: "Room 1", status: "IN_CONSULTATION", priority: "FAST_TRACK" },
    { id: "OPD-RAM-014", name: "Aarav Kumar (3y)", room: "Room 1", status: "NEXT", priority: "FAST_TRACK" },
    { id: "OPD-RAM-012", name: "Mukesh Yadav (48y)", room: "Room 2", status: "WAITING", priority: "NORMAL" },
    { id: "OPD-RAM-013", name: "Geeta Verma (26y)", room: "Room 3", status: "WAITING", priority: "FAST_TRACK" }
  ]);

  const [toastMsg, setToastMsg] = useState(null);

  const handleSendWhatsApp = () => {
    setToastMsg(`📱 Token pass ${token.id} sent to patient's WhatsApp (+91-98765-XXXXX)!`);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSendSms = () => {
    setToastMsg(`✉️ SMS dispatched with Token ${token.id} & Room details.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Ticket className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{t.smartToken.title}</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Line Skip Active
              </span>
            </div>
            <p className="text-xs text-slate-500">{t.smartToken.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Token Digital Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Token Pass (2 cols) */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-700 relative overflow-hidden">
          
          {/* Top Pass Ribbon */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-bold text-slate-300">{token.facilityName}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">ABHA INTEGRATED</span>
          </div>

          {/* Token Number Hero Display */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
                {t.smartToken.yourToken}
              </span>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-amber-400 font-mono">
                {token.id}
              </div>
              <span className="text-xs font-semibold text-slate-300 mt-1 block">
                Patient: <b className="text-white">{token.patientName}</b> ({token.age} • {token.villageName})
              </span>
            </div>

            {/* Simulated QR Code */}
            <div className="w-24 h-24 bg-white rounded-2xl p-2 flex flex-col items-center justify-center shadow-inner">
              <QrCode className="w-16 h-16 text-slate-950" />
              <span className="text-[8px] font-mono text-slate-600 font-bold">SCAN AT PHC</span>
            </div>
          </div>

          {/* Fast Track Priority Badge */}
          {token.isFastTrack && (
            <div className="mb-5 p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-300 text-xs font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
              <span>{t.smartToken.fastTrackBadge}</span>
            </div>
          )}

          {/* Consultation Room & Wait Info Grid */}
          <div className="grid grid-cols-3 gap-2.5 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 text-xs mb-5">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">{t.smartToken.roomNo}</span>
              <span className="font-bold text-teal-300">{token.roomNo}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">{t.smartToken.estimatedWait}</span>
              <span className="font-bold text-amber-400">~{token.waitTimeMins} Mins</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">{t.smartToken.patientsAhead}</span>
              <span className="font-bold text-white">{token.patientsAhead} Patients</span>
            </div>
          </div>

          {/* WhatsApp & SMS Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSendWhatsApp}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.smartToken.sendWhatsapp}</span>
            </button>
            <button
              onClick={handleSendSms}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs border border-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>{t.smartToken.sendSms}</span>
            </button>
          </div>

        </div>

        {/* Live OPD Queue Board (1 col) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{t.smartToken.queueStatus}</span>
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>

          <div className="space-y-2.5">
            {queueList.map((q) => (
              <div
                key={q.id}
                className={`p-3 rounded-2xl border text-xs transition-all ${
                  q.id === token.id 
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30' 
                    : q.status === "IN_CONSULTATION"
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-slate-900">{q.id}</span>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                    q.status === "IN_CONSULTATION" ? 'bg-emerald-600 text-white' : q.id === token.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {q.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-slate-600 mt-1 flex justify-between">
                  <span>{q.name}</span>
                  <span className="font-bold text-teal-700">{q.room}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600">
            💡 <b>Zero-Line Guarantee:</b> Villagers receive an SMS reminder when their turn is 2 patients away.
          </div>
        </div>

      </div>

    </div>
  );
}
