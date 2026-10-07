import React, { useState } from 'react';
import { ShieldCheck, Volume2, Square, Check, X, FileText } from 'lucide-react';
import { speechService } from '../services/speechService.js';

export const CONSENT_TEXTS = {
  en: "I give informed consent to the frontline health worker to record my health symptoms, vitals, and village information strictly for clinical triage, medical referral, and outbreak monitoring under India's Digital Personal Data Protection (DPDP) Act 2023. My data will be kept confidential and encrypted.",
  hi: "मैं स्वास्थ्य कार्यकर्ता (आशा दीदी) को अपनी बीमारी के लक्षण, ऑक्सीजन और रक्तचाप जैसी शारीरिक जांच दर्ज करने की सहमति देता/देती हूँ। इस जानकारी का उपयोग केवल मेरे इलाज, डॉक्टर को रेफरल तथा गांव में बीमारी रोकने के लिए किया जाएगा। (डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023)",
  mr: "मी आरोग्य सेविकेला माझी लक्षणे आणि तपासणी नोंदवण्यास संमती देत आहे. ही माहिती केवळ माझ्या उपचारासाठी आणि गावातील आरोग्य संरक्षणासाठी वापरली जाईल. (डीपीडीपी कायदा 2023)"
};

export function ConsentModal({ isOpen, onClose, onAccept, currentLang = 'en', patientName = "" }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const text = CONSENT_TEXTS[currentLang] || CONSENT_TEXTS.en;

  const handlePlayAudio = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    speechService.speak(text, currentLang, () => {
      setIsPlayingAudio(false);
    });
  };

  const handleAccept = () => {
    speechService.stop();
    setIsPlayingAudio(false);
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-inner">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {currentLang === 'hi' ? 'मरीज़ की सूचित सहमति' : currentLang === 'mr' ? 'रुग्णाची संमती' : 'Patient Informed Consent'}
            </h3>
            <p className="text-xs font-semibold text-teal-700 tracking-wide uppercase">
              DPDP Act 2023 & HIPAA Compliant
            </p>
          </div>
        </div>

        {/* Patient Notice */}
        {patientName && (
          <div className="mb-3 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium">
            Patient: <span className="font-bold text-slate-900">{patientName}</span>
          </div>
        )}

        {/* Spoken Text Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-sm text-slate-700 leading-relaxed">
          <p className="font-normal">{text}</p>
        </div>

        {/* Read Aloud Audio Button */}
        <button
          type="button"
          onClick={handlePlayAudio}
          className={`w-full mb-5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
            isPlayingAudio
              ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
              : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
          }`}
        >
          {isPlayingAudio ? <Square className="w-4 h-4 fill-amber-600 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
          <span>
            {isPlayingAudio 
              ? (currentLang === 'hi' ? 'ऑडियो रोकें' : 'Stop Audio Explanation')
              : (currentLang === 'hi' ? '🔊 मरीज़ को बोलकर सुनाएं (Read Aloud)' : '🔊 Read Consent Aloud to Patient')}
          </span>
        </button>

        {/* DPDP Safeguards Points */}
        <div className="space-y-1.5 mb-5 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Data Minimization: Only symptoms and triage vitals collected.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Role-Based Access: Frontline worker only accesses assigned village.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>AES-256 local encrypted storage & immutable audit logging.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-all"
          >
            {currentLang === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-2 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{currentLang === 'hi' ? 'सहमति प्राप्त हुई - जांच शुरू करें' : 'Consent Confirmed - Start Screening'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
