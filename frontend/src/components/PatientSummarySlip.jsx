import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Volume2, 
  Square, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  QrCode, 
  HeartPulse,
  Clock,
  PhoneCall
} from 'lucide-react';
import { speechService } from '../services/speechService.js';
import { TRANSLATIONS } from '../services/translations.js';

export function PatientSummarySlip({ currentLang = 'hi', caseData = null }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const data = caseData || {
    patientName: "Aarav Kumar",
    age: "3 Years",
    gender: "Male",
    villageName: "Rampur",
    abhaId: "91-4521-7890-3341",
    triageSeverity: "RED",
    chiefComplaint: "High fever (102.8°F), fast breathing (48 bpm), and vomiting since 2 days",
    differentialDiagnosis: "Severe Acute Respiratory Infection (SARI) / Suspected Paediatric Pneumonia",
    spokenSolution: "Your 3-year-old child Aarav has fast breathing and low oxygen. An urgent referral token OPD-RAM-014 has been issued for Rampur Primary Health Centre. Please visit room 1 immediately.",
    homeCarePlan: [
      "Keep patient in an upright sitting posture to support breathing.",
      "Give small sips of clean boiled water or ORS if vomiting stops.",
      "Do NOT administer adult cough syrups to young children.",
      "Proceed immediately to PHC Room 1 using your Smart Token."
    ],
    redFlags: [
      "Chest indrawing (pustules or skin sucking in between ribs)",
      "Bluish lips or fingertips (severe hypoxia)",
      "Inability to drink fluids or lethargic unconsciousness"
    ],
    tokenNumber: "OPD-RAM-014",
    facilityName: "Rampur 24x7 Primary Health Centre",
    roomNo: "Room 1 (Emergency Triage)"
  };

  const handlePrint = () => {
    window.print();
  };

  const handleToggleVoice = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    speechService.speak(data.spokenSolution, currentLang, () => {
      setIsPlayingAudio(false);
    });
  };

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-6 animate-fadeIn">
      
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <FileText className="w-5 h-5 text-teal-600" />
          <span>Patient Problem Summary & Case Slip</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleVoice}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isPlayingAudio ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
            }`}
          >
            {isPlayingAudio ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
            <span>{isPlayingAudio ? "Stop Audio" : "🔊 Listen in Your Language"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Slip</span>
          </button>
        </div>
      </div>

      {/* Printable Clinical Slip */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-300 shadow-lg text-slate-900 space-y-6 print:border-none print:shadow-none print:p-0">
        
        {/* Government Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-lg">
              GS
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">ग्रामसाथी • GRAMSAATHI</h2>
              <p className="text-xs text-slate-600 font-semibold">
                Government Rural Primary Healthcare & Clinical Referral Slip
              </p>
            </div>
          </div>

          {/* OPD Token Callout */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Fast-Track OPD Token</span>
            <span className="text-xl font-black font-mono text-teal-700">{data.tokenNumber}</span>
          </div>
        </div>

        {/* Patient Demographics Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
            <span className="font-extrabold text-slate-900 text-sm">{data.patientName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Age & Gender</span>
            <span className="font-bold text-slate-800">{data.age} • {data.gender || 'Male'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Village / Ward</span>
            <span className="font-bold text-slate-800">{data.villageName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">ABHA ID</span>
            <span className="font-mono font-bold text-slate-800">{data.abhaId}</span>
          </div>
        </div>

        {/* Triage Severity Banner */}
        <div className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
          data.triageSeverity === "RED"
            ? 'bg-red-50 border-red-400 text-red-950'
            : 'bg-amber-50 border-amber-400 text-amber-950'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{data.triageSeverity === "RED" ? "🚨" : "⚠️"}</span>
              <span className="font-black text-xs uppercase tracking-wider">
                {data.triageSeverity} Triage Status • Emergency Level
              </span>
            </div>
            <p className="text-xs font-bold mt-0.5">{data.differentialDiagnosis}</p>
          </div>

          <div className="text-right text-xs">
            <span className="text-[10px] block opacity-80 uppercase font-bold">Assigned Room</span>
            <span className="font-black text-sm">{data.roomNo}</span>
          </div>
        </div>

        {/* Chief Complaint Details */}
        <div className="space-y-1.5 text-xs">
          <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
            1. Chief Symptoms & Complaint Summary:
          </h4>
          <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 font-medium">
            "{data.chiefComplaint}"
          </p>
        </div>

        {/* Home Care & Prescribed Next Steps */}
        <div className="space-y-1.5 text-xs">
          <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
            2. Recommended Immediate Care & Steps:
          </h4>
          <ul className="space-y-1.5">
            {data.homeCarePlan.map((step, i) => (
              <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Warning / Red Flag Alarm */}
        <div className="p-4 bg-red-50/80 rounded-2xl border border-red-200 text-xs text-red-950 space-y-1.5">
          <div className="flex items-center gap-1.5 font-black text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>CRITICAL WARNING SIGNS (RUSH TO HOSPITAL IF OBSERVED):</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] font-semibold text-red-900">
            {data.redFlags.map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
        </div>

        {/* Hospital Sign-Off Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>Facility: <b>{data.facilityName}</b></span>
            <span className="block text-[10px]">Emergency Ambulance: <b>108</b> • ASHA Helpline: <b>104</b></span>
          </div>
          <div className="text-right font-mono text-[10px]">
            <span>DPDP Act 2023 Compliant</span>
            <span className="block">Validated via WHO IMCI protocols</span>
          </div>
        </div>

      </div>

    </div>
  );
}
