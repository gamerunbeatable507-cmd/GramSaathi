import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Square, 
  Sparkles, 
  HeartPulse, 
  ShieldCheck, 
  Ticket, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Send,
  RefreshCw,
  User,
  Stethoscope,
  Bot
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { speechService } from '../services/speechService.js';
import { analyzeCaseInput } from '../services/aiVoiceCaseEngine.js';
import { TRANSLATIONS, LANGUAGES } from '../services/translations.js';
import { api } from '../services/api.js';

export function VoiceHealthAssistant({ currentLang = 'en', onGenerateToken, onViewSummary, loggedInPatient = null }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [analyzedCase, setAnalyzedCase] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoPromptSpoken, setAutoPromptSpoken] = useState(false);
  const [isAutoPrompting, setIsAutoPrompting] = useState(true);

  const greetingAudios = {
    en: "Hello! I am your GramSaathi Health Assistant. Please tell me, what problem or symptoms are you facing today?",
    hi: "नमस्ते! मैं आपका ग्रामसाथी स्वास्थ्य सहायक हूँ। कृपया मुझे बताएं, आज आपको क्या परेशानी या लक्षण महसूस हो रहे हैं?",
    mr: "नमस्कार! मी तुमचा ग्रामसाथी आरोग्य सहाय्यक आहे. कृपया सांगा, आज तुम्हाला काय त्रास किंवा लक्षणे जाणवत आहेत?",
    ta: "வணக்கம்! நான் உங்கள் கிராமசாதி சுகாதார உதவியாளர். இன்று உங்களுக்கு என்ன உடல்நல பிரச்சனை அல்லது அறிகுறிகள் உள்ளன என்று சொல்லுங்கள்.",
    te: "నమస్కారం! నేను మీ గ్రామసాథి ఆరోగ్య సహాయకుడిని. దయచేసి చెప్పండి, ఈరోజు మీకు ఎలాంటి సమస్య లేదా లక్షణాలు ఉన్నాయి?",
    bn: "নমস্কার! আমি আপনার গ্রামসাথী স্বাস্থ্য সহকারী। দয়া করে বলুন, আজ আপনার কি সমস্যা বা উপসর্গ হচ্ছে?",
    gu: "નમસ્તે! હું તમારો ગ્રામસાથી સ્વાસ્થ્ય સહાયક છું. કૃપા કરીને કહો, આજે તમને શું તકલીફ કે લક્ષણો જણાય છે?",
    kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಗ್ರಾಮಸಾಥಿ ಆರೋಗ್ಯ ಸಹಾಯಕ. ದಯವಿಟ್ಟು ತಿಳಿಸಿ, ಇಂದು ನಿಮಗೆ ಯಾವ ರೀತಿಯ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಅಥವಾ ರೋಗಲಕ್ಷಣಗಳಿವೆ?"
  };

  // Auto ask patient when the bot mounts or language changes
  useEffect(() => {
    const greetingText = greetingAudios[currentLang] || greetingAudios.en;
    
    // Auto speak greeting
    const timer = setTimeout(() => {
      setIsPlayingAudio(true);
      speechService.speak(greetingText, currentLang, () => {
        setIsPlayingAudio(false);
        setAutoPromptSpoken(true);
      });
    }, 600);

    return () => {
      clearTimeout(timer);
      speechService.stop();
    };
  }, [currentLang]);

  // Suggested quick symptoms prompts in current language
  const promptExamples = {
    en: [
      "My 3-year-old child has high fever, fast breathing, and is vomiting since 2 days",
      "Severe watery diarrhoea and sunken eyes with dizziness since yesterday",
      "Pregnant woman with severe headache, blurred vision, and high blood pressure"
    ],
    hi: [
      "मेरे 3 साल के बच्चे को 2 दिन से तेज बुखार है, सांस फूल रही है और उल्टी हो रही है",
      "कल रात से बार-बार पानी जैसे पतले दस्त हो रहे हैं और चक्कर आ रहे हैं",
      "गर्भवती महिला को सिर में तेज दर्द और आंखों से धुंधला दिखाई दे रहा है"
    ],
    mr: [
      "माझ्या ३ वर्षांच्या मुलाला २ दिवसांपासून ताप आहे आणि श्वास जोरात चालू आहे",
      "कालपासून सतत पातळ जुलाब आणि उलट्या होत आहेत, खूप अशक्तपणा आला आहे",
      "गरोदर मातेला तीव्र डोकेदुखी आणि चक्कर येत आहे"
    ],
    ta: [
      "எனது 3 வயது குழந்தைக்கு 2 நாட்களாக கடுமையான காய்ச்சல் மற்றும் வேகமான சுவாசம் உள்ளது",
      "நேற்றிலிருந்து தீவிர வயிற்றுப்போக்கு மற்றும் வாந்தி உள்ளது",
      "கர்ப்பிணி பெண்ணுக்கு கடுமையான தலைவலி மற்றும் பார்வை மங்குதல்"
    ],
    te: [
      "నా 3 సంవత్సరాల బిడ్డకు 2 రోజుల నుండి తీవ్రమైన జ్వరం మరియు వేగంగా శ్వాస తీసుకుంటోంది",
      "నిన్నటి నుండి తీవ్రమైన విరేచనాలు మరియు వాంతులు అవుతున్నాయి",
      "గర్భిణీ స్త్రీకి తీవ్రమైన తలనొప్పి మరియు కళ్ళు మసకబారడం"
    ],
    bn: [
      "আমার ৩ বছরের বাচ্চার ২ দিন ধরে তীব্র জ্বর ও দ্রুত শ্বাস নিচ্ছে",
      "গতকাল থেকে ঘনঘন পাতলা পায়খানা ও বমি হচ্ছে",
      "গর্ভবতী মায়ের তীব্র মাথাব্যথা ও চোখে ঝাপসা দেখা যাচ্ছে"
    ],
    gu: [
      "મારા ૩ વર્ષના બાળકને ૨ દિવસથી તાવ છે અને શ્વાસ ઝડપથી ચાલે છે",
      "ગઈકાલથી ઝાડા-ઉલટી છે અને ખૂબ નબળાઈ લાગે છે",
      "સગર્ભા બહેનને માથામાં ખૂબ દુખાવો અને ચક્કર આવે છે"
    ],
    kn: [
      "ನನ್ನ 3 ವರ್ಷದ ಮಗುವಿಗೆ 2 ದಿನಗಳಿಂದ ಜ್ವರವಿದೆ ಮತ್ತು ವೇಗವಾಗಿ ಉಸಿರಾಡುತ್ತಿದೆ",
      "ನಿನ್ನೆಯಿಂದ ತೀವ್ರ ಭೇದಿ ಮತ್ತು ವಾಂತಿಯಾಗುತ್ತಿದೆ",
      "ಗರ್ಭಿಣಿ ತಾಯಿಗೆ ತೀವ್ರ ತಲೆನೋವು ಮತ್ತು ದೃಷ್ಟಿ ಮಂದವಾಗಿದೆ"
    ]
  };

  const currentExamples = promptExamples[currentLang] || promptExamples.en;

  const handleToggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    speechService.stop();
    setIsPlayingAudio(false);
    setIsListening(true);

    speechService.startVoiceRecognition(
      currentLang,
      (text) => {
        setIsListening(false);
        setUserQuery(text);
        processCase(text);
      },
      (err) => {
        setIsListening(false);
      },
      () => {
        setIsListening(true);
      }
    );
  };

  const handleReplayGreeting = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      return;
    }
    const greetingText = greetingAudios[currentLang] || greetingAudios.en;
    setIsPlayingAudio(true);
    speechService.speak(greetingText, currentLang, () => {
      setIsPlayingAudio(false);
    });
  };

  const processCase = (text) => {
    if (!text.trim()) return;
    setIsProcessing(true);

    setTimeout(() => {
      const caseResult = analyzeCaseInput(text, currentLang, loggedInPatient);
      setAnalyzedCase(caseResult);
      setIsProcessing(false);
      setActiveStep(4);

      if (caseResult.triageSeverity === "RED") {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      }

      // Auto-play speech solution in selected Indian language
      if (caseResult.spokenSolution) {
        setIsPlayingAudio(true);
        speechService.speak(caseResult.spokenSolution, currentLang, () => {
          setIsPlayingAudio(false);
        });
      }
    }, 600);
  };

  const handlePlaySpokenSolution = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      return;
    }

    if (analyzedCase?.spokenSolution) {
      setIsPlayingAudio(true);
      speechService.speak(analyzedCase.spokenSolution, currentLang, () => {
        setIsPlayingAudio(false);
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 animate-fadeIn">
      
      {/* Voice Bot Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-teal-400" /> Auto-Prompting Voice AI Doctor
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t.voiceBot.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl mt-1.5 opacity-90">
            {t.voiceBot.subtitle}
          </p>
        </div>
      </div>

      {/* Auto-Prompt Bot Greeting Speech Bubble */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-300 rounded-3xl p-5 shadow-sm flex items-start gap-4 animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-md">
          🤖
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-teal-900">
              GramSaathi AI Health Assistant (Auto-Speaking)
            </span>
            <button
              onClick={handleReplayGreeting}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                isPlayingAudio ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-white text-teal-700 border border-teal-200 hover:bg-teal-100'
              }`}
            >
              {isPlayingAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isPlayingAudio ? "Speaking..." : "🔊 Replay Question"}</span>
            </button>
          </div>
          <p className="text-sm font-semibold text-teal-950 leading-relaxed">
            "{greetingAudios[currentLang] || greetingAudios.en}"
          </p>
        </div>
      </div>

      {/* Main Interactive Mic & Text Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        
        {/* Big Touch-Friendly Microphone Action */}
        <div className="flex flex-col items-center justify-center py-6 text-center border-b border-slate-100">
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
              isListening
                ? 'bg-red-600 text-white animate-pulse ring-8 ring-red-400/30'
                : 'bg-gradient-to-tr from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-teal-500/30'
            }`}
          >
            {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </button>

          <h3 className="mt-4 font-black text-base text-slate-900">
            {isListening ? t.voiceBot.listening : t.voiceBot.tapToSpeak}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-listening in Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, & English
          </p>
        </div>

        {/* Text Input Option */}
        <div className="mt-5">
          <form onSubmit={(e) => { e.preventDefault(); processCase(userQuery); }} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t.voiceBot.askPlaceholder}
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isProcessing || !userQuery.trim()}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Analyze</span>
            </button>
          </form>
        </div>

        {/* Example Quick Prompts */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            💡 Quick Symptom Examples (Tap to test):
          </span>
          <div className="flex flex-wrap gap-2">
            {currentExamples.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setUserQuery(ex); processCase(ex); }}
                className="text-left text-xs bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 hover:border-teal-300 px-3 py-1.5 rounded-xl text-slate-700 transition-all font-medium"
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* AI Case Taking & Solution Card */}
      {analyzedCase && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Spoken Solution Audio Banner */}
          <div className={`p-6 rounded-3xl shadow-lg border-2 transition-all ${
            analyzedCase.triageSeverity === "RED"
              ? 'bg-gradient-to-br from-red-600 to-red-700 text-white border-red-500'
              : 'bg-gradient-to-br from-teal-700 to-teal-800 text-white border-teal-600'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                  {analyzedCase.triageSeverity === "RED" ? "🚨" : "💡"}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full inline-block mb-0.5">
                    {analyzedCase.triageSeverity === "RED" ? "EMERGENCY CLINICAL TRIAGE" : "HOME CARE & OPD ADVISORY"}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black">
                    AI Voice Diagnosis & Action Guidance
                  </h3>
                </div>
              </div>

              {/* Audio Play/Stop Button */}
              <button
                type="button"
                onClick={handlePlaySpokenSolution}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                  isPlayingAudio
                    ? 'bg-amber-400 text-slate-950 animate-pulse'
                    : 'bg-white text-slate-900 hover:bg-slate-100'
                }`}
              >
                {isPlayingAudio ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
                <span>{isPlayingAudio ? t.voiceBot.stopVoice : t.voiceBot.replayVoice}</span>
              </button>
            </div>

            {/* Spoken Text Box */}
            <div className="bg-black/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-sm font-medium leading-relaxed">
              "{analyzedCase.spokenSolution}"
            </div>
          </div>

          {/* Structured Clinical SOAP Note & Home Care */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Step-by-Step Home Care Guidance */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Immediate Home Care & Management</span>
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {analyzedCase.homeCarePlan.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold text-teal-600 shrink-0">{idx + 1}.</span>
                    <span className="font-medium">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Structured SOAP Clinical Summary */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>{t.voiceBot.caseTakingTitle}</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-500 block text-[10px] uppercase">S - Subjective (Chief Complaint)</span>
                  <p className="text-slate-800 font-medium">{analyzedCase.chiefComplaint} ({analyzedCase.duration})</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-500 block text-[10px] uppercase">O - Objective (Danger Flags)</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {analyzedCase.detectedRedFlags.map((flag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold text-[10px]">
                        ⚠️ {flag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-500 block text-[10px] uppercase">A - Assessment (Differential Diagnosis)</span>
                  <p className="font-bold text-teal-900">{analyzedCase.differentialDiagnosis}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-500 block text-[10px] uppercase">P - Plan (OPD Room & Priority)</span>
                  <p className="text-slate-700">{analyzedCase.recommendedOpdRoom} • Est Wait: <b>{analyzedCase.tokenEstimatedWaitMins} mins</b></p>
                </div>
              </div>
            </div>

          </div>

          {/* Action CTAs: Smart OPD Token + Patient Summary Slip */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (onGenerateToken) onGenerateToken(analyzedCase);
              }}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5"
            >
              <Ticket className="w-5 h-5 fill-slate-950 stroke-slate-950" />
              <span>{t.voiceBot.generateTokenBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onViewSummary) onViewSummary(analyzedCase);
              }}
              className="flex-1 py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2.5"
            >
              <FileText className="w-5 h-5 text-teal-400" />
              <span>{t.voiceBot.downloadSummary}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
