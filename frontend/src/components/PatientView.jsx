import React, { useState } from 'react';
import { Smartphone, Volume2, Square, PhoneCall, ShieldCheck, CheckCircle2, MessageSquare } from 'lucide-react';
import { speechService } from '../services/speechService.js';

export function PatientView({ currentLang = 'hi' }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const messages = {
    hi: {
      title: "स्वास्थ्य जांच संदेश (आशा दीदी द्वारा)",
      sender: "GRAMSAATHI-GOVT",
      patientName: "सुरेश कुमार (रामपुर)",
      date: "आज, 10:30 AM",
      triage: "🚨 अति आवश्यक डॉक्टर सलाह (RED)",
      body: "नमस्ते सुरेश जी, आपकी जांच में ऑक्सीजन का स्तर कम पाया गया है। आशा दीदी ने प्राथमिक स्वास्थ्य केंद्र (PHC) रामपुर में आपके लिए रेफरल भेज दिया है। कृपया तुरंत अस्पताल जाएं। 108 एम्बुलेंस सहायता के लिए तैयार है।",
      voiceText: "नमस्ते सुरेश जी। आपकी जांच में ऑक्सीजन कम पाई गई है। कृपया तुरंत स्वास्थ्य केंद्र रामपुर जाएं। आशा दीदी की सलाह का पालन करें।"
    },
    en: {
      title: "Health Screening Alert (From ASHA Worker)",
      sender: "GRAMSAATHI-GOVT",
      patientName: "Suresh Kumar (Rampur)",
      date: "Today, 10:30 AM",
      triage: "🚨 URGENT Doctor Referral (RED)",
      body: "Hello Suresh, during today's screening, your oxygen level was found low. ASHA worker Sunita Devi has sent a referral to Rampur 24x7 PHC. Please reach the health centre immediately. 108 Ambulance is on alert.",
      voiceText: "Hello Suresh. Your oxygen level is low. Please proceed to Rampur Primary Health Centre immediately. Follow your ASHA worker's instructions."
    },
    mr: {
      title: "आरोग्य तपासणी संदेश (आशा सेविकेकडून)",
      sender: "GRAMSAATHI-GOVT",
      patientName: "सुरेश कुमार (रामपूर)",
      date: "आज, 10:30 AM",
      triage: "🚨 तातडीने डॉक्टर भेट (RED)",
      body: "नमस्कार सुरेशजी, तपासणीत ऑक्सिजनची पातळी कमी आढळली आहे. आशा सेविकेने प्राथमिक आरोग्य केंद्र रामपूर येथे रेफरल पाठवले आहे. कृपया त्वरित रुग्णालयात जा.",
      voiceText: "नमस्कार सुरेशजी. आपली ऑक्सिजन पातळी कमी आहे. कृपया तातडीने आरोग्य केंद्रात जा."
    }
  };

  const msg = messages[currentLang] || messages.hi;

  const handleToggleVoice = () => {
    if (isPlaying) {
      speechService.stop();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    speechService.speak(msg.voiceText, currentLang, () => {
      setIsPlaying(false);
    });
  };

  return (
    <div className="max-w-md mx-auto pb-16 space-y-6 animate-fadeIn">
      
      {/* Visual Phone Frame */}
      <div className="bg-slate-900 text-white rounded-[40px] p-4 shadow-2xl border-4 border-slate-800 relative">
        
        {/* Top Speaker / Notch */}
        <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-900 mr-2"></div>
        </div>

        {/* Screen Area */}
        <div className="bg-slate-100 text-slate-900 rounded-[28px] p-4 min-h-[480px] flex flex-col justify-between">
          
          {/* SMS Header */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  GS
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{msg.sender}</h4>
                  <span className="text-[10px] text-slate-500">Government Rural Health SMS</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">{msg.date}</span>
            </div>

            {/* Message Bubble */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-xs leading-relaxed space-y-2">
              <div className="font-extrabold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 inline-block">
                {msg.triage}
              </div>
              
              <p className="text-slate-800 font-medium">
                {msg.body}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Patient: <b>{msg.patientName}</b></span>
                <span className="text-emerald-600 font-bold">✓ Delivered</span>
              </div>
            </div>

            {/* Read Aloud Voice Call Simulation Button */}
            <button
              onClick={handleToggleVoice}
              className={`w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
              <span>{isPlaying ? "ऑडियो रोकें (Stop Voice)" : "🔊 बोलकर सुनें (IVR Voice Playback)"}</span>
            </button>

            {/* Next Steps for Villager */}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
              <span className="font-bold block">मरीज़ के लिए ज़रूरी निर्देश:</span>
              <div>1. घबराएं नहीं, शांत बैठें।</div>
              <div>2. तुरंत आशा दीदी या 108 पर कॉल करें।</div>
              <div>3. प्राथमिक स्वास्थ्य केंद्र पहुंचकर अपना नाम बताएं।</div>
            </div>
          </div>

          {/* Quick Call Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
            <a
              href="tel:108"
              className="flex-1 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call 108
            </a>
            <a
              href="tel:+919876543201"
              className="flex-1 py-2.5 bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call ASHA
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}
