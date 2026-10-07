import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Thermometer, 
  Activity, 
  Baby, 
  User, 
  Mic, 
  MicOff, 
  Volume2, 
  Square, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  PhoneCall, 
  PlusCircle, 
  Clock, 
  HelpCircle,
  Building2,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TRANSLATIONS } from '../services/translations.js';
import { DANGER_SIGNS_LIST, evaluateClientTriage } from '../services/clientTriageEngine.js';
import { speechService } from '../services/speechService.js';
import { api } from '../services/api.js';
import { ConsentModal } from './ConsentModal.jsx';

export function WorkerScreening({ currentLang = 'en', onReferralCreated }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Form State
  const [villages, setVillages] = useState([]);
  const [selectedVillageId, setSelectedVillageId] = useState("VIL-01");
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  
  // New Patient Quick Modal
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientAge, setNewPatientAge] = useState("");
  const [newPatientGender, setNewPatientGender] = useState("Female");
  const [newPatientPhone, setNewPatientPhone] = useState("");

  // Screening Data
  const [category, setCategory] = useState("child_under_5");
  const [symptoms, setSymptoms] = useState([]);
  const [vitals, setVitals] = useState({
    spo2: "",
    temperatureF: "",
    systolicBP: "",
    diastolicBP: "",
    bloodSugar: "",
    muacCm: "",
    respiratoryRate: ""
  });

  // Consent & Voice State
  const [consentObtained, setConsentObtained] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  // Result & Audio
  const [triageResult, setTriageResult] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showExplainability, setShowExplainability] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [nearbyFacilities, setNearbyFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  useEffect(() => {
    loadVillages();
  }, []);

  useEffect(() => {
    loadPatients(selectedVillageId);
  }, [selectedVillageId]);

  const loadVillages = async () => {
    const list = await api.getVillages();
    setVillages(list);
    if (list.length > 0 && !selectedVillageId) {
      setSelectedVillageId(list[0].id);
    }
  };

  const loadPatients = async (vId) => {
    const list = await api.getPatients(vId);
    setPatients(list);
    if (list.length > 0) {
      setSelectedPatientId(list[0].id);
      if (list[0].category) setCategory(list[0].category);
    } else {
      setSelectedPatientId("");
    }
  };

  const handlePatientSelect = (patId) => {
    setSelectedPatientId(patId);
    const pat = patients.find(p => p.id === patId);
    if (pat && pat.category) {
      setCategory(pat.category);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const newPat = await api.createPatient({
      name: newPatientName,
      ageYears: Number(newPatientAge) || 25,
      gender: newPatientGender,
      category,
      villageId: selectedVillageId,
      phone: newPatientPhone || "+91-98765-00000"
    });

    setPatients([newPat, ...patients]);
    setSelectedPatientId(newPat.id);
    setShowNewPatientModal(false);
    setNewPatientName("");
    setNewPatientAge("");
    setNewPatientPhone("");
  };

  const toggleSymptom = (symId) => {
    setSymptoms(prev => 
      prev.includes(symId) ? prev.filter(s => s !== symId) : [...prev, symId]
    );
  };

  // Voice Symptom Recognition
  const handleToggleVoice = () => {
    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    setIsListeningVoice(true);
    speechService.startVoiceRecognition(
      currentLang,
      (text) => {
        setIsListeningVoice(false);
        setVoiceTranscript(text);
        // Match spoken words to danger signs
        const textLow = text.toLowerCase();
        const availableSigns = DANGER_SIGNS_LIST[category] || [];
        const detected = [];
        
        availableSigns.forEach(sign => {
          const kw = sign.label.toLowerCase();
          if (textLow.includes('fever') || textLow.includes('बुखार') || textLow.includes('ताप')) {
            if (sign.id.includes('fever')) detected.push(sign.id);
          }
          if (textLow.includes('cough') || textLow.includes('खांसी') || textLow.includes('खोborder')) {
            if (sign.id.includes('cough') || sign.id.includes('breath') || sign.id.includes('indrawing')) detected.push(sign.id);
          }
          if (textLow.includes('vomit') || textLow.includes('उल्टी') || textLow.includes('उलटी')) {
            if (sign.id.includes('vomit')) detected.push(sign.id);
          }
          if (textLow.includes('diarrhoea') || textLow.includes('दस्त') || textLow.includes('जुलाब')) {
            if (sign.id.includes('diarrhoea') || sign.id.includes('water')) detected.push(sign.id);
          }
        });

        if (detected.length > 0) {
          setSymptoms(prev => Array.from(new Set([...prev, ...detected])));
        }
      },
      (err) => {
        setIsListeningVoice(false);
      }
    );
  };

  // Run Triage
  const handleStartTriage = () => {
    if (!consentObtained) {
      setShowConsentModal(true);
      return;
    }
    executeTriage();
  };

  const executeTriage = () => {
    const pat = patients.find(p => p.id === selectedPatientId) || {
      name: "Villager",
      ageYears: 25,
      gender: "Female"
    };

    const res = evaluateClientTriage({
      category,
      ageYears: pat.ageYears,
      ageMonths: pat.ageMonths,
      symptoms,
      vitals
    });

    setTriageResult(res);

    if (res.severity === "GREEN") {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
    }

    // Pre-fetch nearby facilities if RED or YELLOW
    if (res.severity !== "GREEN") {
      const v = villages.find(vil => vil.id === selectedVillageId);
      api.getFacilities(v?.coordinates?.lat, v?.coordinates?.lng, res.severity, category).then(facs => {
        setNearbyFacilities(facs);
        if (facs.length > 0) setSelectedFacilityId(facs[0].id);
      });
    }
  };

  const handlePlayAudioResult = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      return;
    }

    const voiceText = triageResult?.plainLanguage?.[currentLang]?.voiceText || 
                      triageResult?.plainLanguage?.en?.voiceText || 
                      "Triage complete";

    setIsPlayingAudio(true);
    speechService.speak(voiceText, currentLang, () => {
      setIsPlayingAudio(false);
    });
  };

  const handleOpenReferral = () => {
    setShowReferralModal(true);
  };

  const handleSubmitReferral = async (transportMode = "108 Emergency Ambulance") => {
    setIsSubmitting(true);
    const pat = patients.find(p => p.id === selectedPatientId) || { id: "PAT-001", name: "Patient", ageYears: 28, gender: "Female" };
    const targetFac = nearbyFacilities.find(f => f.id === selectedFacilityId) || nearbyFacilities[0];

    try {
      const screeningPayload = {
        patientId: pat.id,
        patientName: pat.name,
        ageYears: pat.ageYears,
        gender: pat.gender,
        category,
        villageId: selectedVillageId,
        consentObtained: true,
        symptoms,
        vitals,
        triageResult
      };

      const screeningRes = await api.submitScreening(screeningPayload);

      const refPayload = {
        screeningId: screeningRes.screening?.id,
        patientId: pat.id,
        patientName: pat.name,
        ageYears: pat.ageYears,
        gender: pat.gender,
        villageId: selectedVillageId,
        severity: triageResult.severity,
        facilityId: targetFac?.id || "FAC-PHC-01",
        transportMode
      };

      await api.createReferral(refPayload);

      setSubmissionSuccess({
        type: "REFERRAL_SENT",
        facilityName: targetFac?.name || "Rampur 24x7 PHC",
        isOffline: screeningRes.isOfflineSaved
      });
      setShowReferralModal(false);
      if (onReferralCreated) onReferralCreated();
    } catch (err) {
      alert("Error saving referral");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveHomeCare = async () => {
    setIsSubmitting(true);
    const pat = patients.find(p => p.id === selectedPatientId) || { id: "PAT-001", name: "Patient", ageYears: 28, gender: "Female" };

    try {
      const screeningPayload = {
        patientId: pat.id,
        patientName: pat.name,
        ageYears: pat.ageYears,
        gender: pat.gender,
        category,
        villageId: selectedVillageId,
        consentObtained: true,
        symptoms,
        vitals,
        triageResult
      };

      const res = await api.submitScreening(screeningPayload);
      setSubmissionSuccess({
        type: "HOME_CARE_SAVED",
        isOffline: res.isOfflineSaved
      });
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    } catch {
      alert("Saved locally to offline sync queue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetScreening = () => {
    setTriageResult(null);
    setSubmissionSuccess(null);
    setSymptoms([]);
    setVitals({
      spo2: "",
      temperatureF: "",
      systolicBP: "",
      diastolicBP: "",
      bloodSugar: "",
      muacCm: "",
      respiratoryRate: ""
    });
    setVoiceTranscript("");
    setConsentObtained(false);
  };

  const currentPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="max-w-4xl mx-auto pb-16">
      
      {/* Consent Modal */}
      <ConsentModal
        isOpen={showConsentModal}
        currentLang={currentLang}
        patientName={currentPatient?.name}
        onClose={() => setShowConsentModal(false)}
        onAccept={() => {
          setConsentObtained(true);
          setShowConsentModal(false);
          executeTriage();
        }}
      />

      {/* Top Banner / Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
        
        {/* Village & Patient Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-1">
              Frontline ASHA Worker Screening
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">{t.screening.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Village selector */}
            <select
              value={selectedVillageId}
              onChange={(e) => setSelectedVillageId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              {villages.map(v => (
                <option key={v.id} value={v.id}>📍 {v.name} ({v.population} pop)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Patient Select / Add */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.screening.selectPatient}
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientSelect(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} • {p.ageYears ? `${p.ageYears}y` : `${p.ageMonths}m`} • {p.gender} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:pt-5">
            <button
              type="button"
              onClick={() => setShowNewPatientModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Register New Villager</span>
            </button>
          </div>
        </div>

        {/* Quick Add Patient Modal */}
        {showNewPatientModal && (
          <div className="mt-4 p-4 bg-teal-50/70 border border-teal-200 rounded-2xl animate-fadeIn">
            <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-3">Quick Register New Patient</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Full Name"
                value={newPatientName}
                onChange={e => setNewPatientName(e.target.value)}
                className="bg-white border border-teal-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="number"
                placeholder="Age (Years)"
                value={newPatientAge}
                onChange={e => setNewPatientAge(e.target.value)}
                className="bg-white border border-teal-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <select
                value={newPatientGender}
                onChange={e => setNewPatientGender(e.target.value)}
                className="bg-white border border-teal-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
              <button
                type="button"
                onClick={handleCreatePatient}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl px-4 py-2 shadow-sm transition-all"
              >
                Save Patient
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Screening Workflow Form (When No Active Result) */}
      {!triageResult && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* 1. Category Selector */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              {t.screening.category}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "child_under_5", label: t.screening.childUnder5, icon: Baby, desc: "IMCI Protocols" },
                { id: "maternal", label: t.screening.maternal, icon: HeartPulse, desc: "Danger Signs" },
                { id: "adult", label: t.screening.adult, icon: User, desc: "NCD & Emergency" },
                { id: "general", label: t.screening.general, icon: Activity, desc: "Acute Triage" }
              ].map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      setSymptoms([]);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500 text-teal-900 ring-2 ring-teal-500/30'
                        : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-teal-600 stroke-[2.5]' : 'text-slate-500'}`} />
                    <div className="font-bold text-xs leading-tight">{cat.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{cat.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Danger Signs Checklist & Voice Dictation */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.screening.symptomsSection}
                </label>
                <p className="text-xs text-slate-500 mt-0.5">Tap all observed signs or use voice dictation</p>
              </div>

              {/* Voice Dictation Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  isListeningVoice
                    ? 'bg-red-50 text-red-600 border-red-300 animate-pulse ring-2 ring-red-400/40'
                    : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                }`}
              >
                {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isListeningVoice ? t.screening.listening : t.screening.voiceInput}</span>
              </button>
            </div>

            {/* Spoken Transcript Preview */}
            {voiceTranscript && (
              <div className="mb-4 p-3 bg-teal-50/60 border border-teal-100 rounded-xl text-xs text-teal-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Voice Recognized: </span>
                  <span>"{voiceTranscript}"</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVoiceTranscript("")}
                  className="text-[11px] text-teal-700 underline font-semibold ml-2"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Danger Signs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(DANGER_SIGNS_LIST[category] || DANGER_SIGNS_LIST.general).map(sign => {
                const isChecked = symptoms.includes(sign.id);
                return (
                  <button
                    key={sign.id}
                    type="button"
                    onClick={() => toggleSymptom(sign.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isChecked
                        ? sign.severity === "RED"
                          ? 'bg-red-50 border-red-300 text-red-900 ring-2 ring-red-400/20'
                          : 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/20'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{sign.icon || "⚠️"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-snug">{sign.label}</div>
                      <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded mt-1 ${
                        sign.severity === "RED" ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                      }`}>
                        {sign.severity === "RED" ? "Critical Danger" : "Warning Sign"}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                      isChecked 
                        ? sign.severity === "RED" ? 'bg-red-600 border-red-600 text-white' : 'bg-amber-600 border-amber-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Vitals Inputs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
              {t.screening.vitalsSection}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* SpO2 */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">{t.screening.spo2}</span>
                  <Activity className="w-4 h-4 text-teal-600" />
                </div>
                <input
                  type="number"
                  placeholder="e.g. 96"
                  min="50"
                  max="100"
                  value={vitals.spo2}
                  onChange={e => setVitals({ ...vitals, spo2: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  &lt;90% = Severe Red, 90-93% = Yellow
                </span>
              </div>

              {/* Temperature */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">{t.screening.temp}</span>
                  <Thermometer className="w-4 h-4 text-amber-600" />
                </div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 98.6"
                  value={vitals.temperatureF}
                  onChange={e => setVitals({ ...vitals, temperatureF: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  &gt;100.4°F = Fever, &gt;103.5°F = High Red
                </span>
              </div>

              {/* Blood Pressure */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">{t.screening.bp}</span>
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Sys (120)"
                    value={vitals.systolicBP}
                    onChange={e => setVitals({ ...vitals, systolicBP: e.target.value })}
                    className="w-1/2 bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="text-slate-400 font-bold">/</span>
                  <input
                    type="number"
                    placeholder="Dia (80)"
                    value={vitals.diastolicBP}
                    onChange={e => setVitals({ ...vitals, diastolicBP: e.target.value })}
                    className="w-1/2 bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  &gt;160/100 = Crisis Red
                </span>
              </div>

              {/* Blood Sugar */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">{t.screening.sugar}</span>
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                <input
                  type="number"
                  placeholder="e.g. 110"
                  value={vitals.bloodSugar}
                  onChange={e => setVitals({ ...vitals, bloodSugar: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  &lt;60 = Hypo Red, &gt;300 = Hyper Red
                </span>
              </div>

              {/* Child MUAC (Only for Under-5) */}
              {category === "child_under_5" && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800">{t.screening.muac}</span>
                    <Baby className="w-4 h-4 text-teal-600" />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 13.0"
                    value={vitals.muacCm}
                    onChange={e => setVitals({ ...vitals, muacCm: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-1 mt-1 text-[9px] font-bold">
                    <span className="text-red-600">&lt;11.5cm SAM</span> • 
                    <span className="text-amber-600">11.5-12.5 MAM</span> • 
                    <span className="text-emerald-600">&gt;12.5 OK</span>
                  </div>
                </div>
              )}

              {/* Child Respiratory Rate */}
              {category === "child_under_5" && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800">{t.screening.respRate}</span>
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    type="number"
                    placeholder="e.g. 32"
                    value={vitals.respiratoryRate}
                    onChange={e => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Fast breathing = Pneumonia sign
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* 4. Action Button - Run Triage */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleStartTriage}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-teal-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
            >
              <HeartPulse className="w-6 h-6 stroke-[2.5]" />
              <span>{t.screening.triageButton}</span>
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              🔒 Works 100% offline with zero internet • WHO IMCI protocols • DPDP 2023 Consent verified
            </p>
          </div>

        </div>
      )}

      {/* 5. Triage Result Card (Rendered after evaluation) */}
      {triageResult && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Main Result Banner */}
          <div className={`rounded-3xl p-6 shadow-xl border-2 transition-all ${
            triageResult.severity === "RED"
              ? 'bg-gradient-to-br from-red-600 to-red-700 text-white border-red-500 ring-4 ring-red-500/20'
              : triageResult.severity === "YELLOW"
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400 ring-4 ring-amber-500/20'
              : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-400 ring-4 ring-emerald-500/20'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner">
                  {triageResult.severity === "RED" ? "🚨" : triageResult.severity === "YELLOW" ? "⚠️" : "✅"}
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest bg-white/25 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    {triageResult.severity} TRIAGE • {triageResult.urgency}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black leading-tight">
                    {triageResult.plainLanguage?.[currentLang]?.headline || triageResult.plainLanguage?.en?.headline}
                  </h3>
                </div>
              </div>

              {/* Audio Read-Aloud Button */}
              <button
                type="button"
                onClick={handlePlayAudioResult}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                  isPlayingAudio
                    ? 'bg-white text-slate-900 animate-pulse'
                    : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm'
                }`}
              >
                {isPlayingAudio ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
                <span>{isPlayingAudio ? t.screening.stopAudio : t.screening.readAloud}</span>
              </button>
            </div>

            {/* Plain Language Meaning Box */}
            <div className="bg-black/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-sm sm:text-base font-medium leading-relaxed mb-4">
              {triageResult.plainLanguage?.[currentLang]?.summary || triageResult.plainLanguage?.en?.summary}
            </div>

            {/* Recommended Action Summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold opacity-95">
              <span>📍 Recommended Facility: <b>{triageResult.recommendedFacility}</b></span>
              <span>⏱️ Follow-up window: <b>Within {triageResult.followupDays} day(s)</b></span>
            </div>
          </div>

          {/* Actionable Next Steps & Explainable Drawer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Action Steps */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600" />
                <span>{t.screening.whatNext}</span>
              </h4>
              <ul className="space-y-2 text-xs font-medium text-slate-700">
                {triageResult.actionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-bold text-teal-600">{idx + 1}.</span>
                    <span>{step.replace(/^\d+\.\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Explainable AI / Protocol Triggers */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>{t.screening.whyThisResult}</span>
              </h4>
              
              <div className="space-y-2 text-xs">
                {/* Red Flags */}
                {triageResult.redFlags.map((rf, i) => (
                  <div key={i} className="bg-red-50 border border-red-200 p-2.5 rounded-lg text-red-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                      <span>{rf.param}: {rf.value}</span>
                    </div>
                    <div className="text-[11px] text-red-700 mt-0.5">{rf.reason}</div>
                  </div>
                ))}

                {/* Yellow Flags */}
                {triageResult.yellowFlags.map((yf, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      <span>{yf.param}: {yf.value}</span>
                    </div>
                    <div className="text-[11px] text-amber-700 mt-0.5">{yf.reason}</div>
                  </div>
                ))}

                {triageResult.redFlags.length === 0 && triageResult.yellowFlags.length === 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 text-xs">
                    All evaluated vitals and observed clinical signs are within normal baseline thresholds.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Action Buttons: One-Tap Referral OR Complete Home Care */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            
            {triageResult.severity !== "GREEN" ? (
              <button
                type="button"
                onClick={handleOpenReferral}
                className="flex-1 py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm sm:text-base shadow-lg shadow-red-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
              >
                <Send className="w-5 h-5 stroke-[2.5]" />
                <span>{t.screening.referButton}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveHomeCare}
                disabled={isSubmitting}
                className="flex-1 py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm sm:text-base shadow-lg shadow-teal-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle className="w-5 h-5 stroke-[2.5]" />
                <span>{isSubmitting ? "Saving..." : t.screening.finishHomeCare}</span>
              </button>
            )}

            <button
              type="button"
              onClick={resetScreening}
              className="py-4 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
            >
              Start Next Patient
            </button>
          </div>

          {/* Success Toast */}
          {submissionSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>
                  {submissionSuccess.type === "REFERRAL_SENT" 
                    ? `One-Tap Referral sent to ${submissionSuccess.facilityName}!` 
                    : "Routine home-care screening logged successfully!"}
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                {submissionSuccess.isOffline 
                  ? "Saved to local offline queue. Will auto-sync when network reconnects." 
                  : "Synced to PHC doctor live dashboard & District surveillance."}
              </p>
            </div>
          )}

        </div>
      )}

      {/* One-Tap Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">One-Tap Facility Referral</h3>
                  <p className="text-xs text-slate-500">Auto-ranked by distance, doctors & bed load</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReferralModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Emergency 108 Call Banner */}
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                <PhoneCall className="w-4 h-4 text-red-600" />
                <span>Call 108 Emergency Ambulance</span>
              </div>
              <a
                href="tel:108"
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm"
              >
                Call 108
              </a>
            </div>

            {/* Facilities List */}
            <div className="space-y-3 mb-5">
              {nearbyFacilities.map(fac => {
                const isSelected = selectedFacilityId === fac.id;
                return (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFacilityId(fac.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-sm'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{fac.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-slate-200 text-slate-700 uppercase">
                            {fac.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap gap-x-3">
                          <span>📍 <b>{fac.distanceKm} km</b> away</span>
                          <span>👨‍⚕️ <b>{fac.doctorsOnDuty} Doctors</b> on duty</span>
                          <span>🛏️ Beds: <b>{fac.occupiedBeds}/{fac.totalBeds}</b></span>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                        isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    {fac.isOvercrowded && (
                      <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-semibold">
                        {fac.loadBalancingRecommendation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Confirm & Send Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowReferralModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmitReferral("108 Emergency Ambulance")}
                disabled={isSubmitting}
                className="flex-2 py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Transmitting..." : "Send Referral Summary Now"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
