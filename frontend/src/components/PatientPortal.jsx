import React, { useState, useEffect } from 'react';
import { 
  User, 
  QrCode, 
  ShieldCheck, 
  FileText, 
  Clock, 
  Activity, 
  PlusCircle, 
  Ticket, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  PhoneCall, 
  LogOut, 
  Search, 
  Scan, 
  Mic, 
  Send,
  Building2,
  Sparkles,
  Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';
import { TRANSLATIONS } from '../services/translations.js';

export function PatientPortal({ currentLang = 'en', onOpenDoctorSummary, onGenerateToken }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Login / Scan state
  const [authMode, setAuthMode] = useState("login"); // "login" | "scan" | "register"
  const [abhaQuery, setAbhaQuery] = useState("91-4521-7890-3341");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Logged-in Patient state
  const [patientData, setPatientData] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [patientTokens, setPatientTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // New Problem Entry state
  const [newSymptomText, setNewSymptomText] = useState("");
  const [isSavingProblem, setIsSavingProblem] = useState(false);
  const [problemSavedToast, setProblemSavedToast] = useState(null);

  // Register state
  const [regName, setRegName] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regGender, setRegGender] = useState("Female");
  const [regCategory, setRegCategory] = useState("general");
  const [regPhone, setRegPhone] = useState("+91-98765-");
  const [regVillage, setRegVillage] = useState("VIL-01");

  // Load default demo patient if available
  useEffect(() => {
    handleLogin("Aarav Kumar");
  }, []);

  const handleLogin = async (query = abhaQuery) => {
    if (!query) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.loginPatientByAbha(query);
      if (res.success && res.patient) {
        setPatientData(res.patient);
        setPatientHistory(res.screenings || []);
        setPatientTokens(res.tokens || []);
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      } else {
        setErrorMsg("Patient not found. Please try another ABHA ID or register.");
      }
    } catch {
      setErrorMsg("Could not fetch patient record. Try quick select below.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartScanner = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          handleLogin("Aarav Kumar");
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (!regName.trim()) return;
    setIsLoading(true);

    try {
      const newPat = await api.createPatient({
        name: regName,
        ageYears: Number(regAge) || 28,
        gender: regGender,
        category: regCategory,
        villageId: regVillage,
        phone: regPhone || "+91-98765-11223"
      });

      setPatientData(newPat);
      setPatientHistory([]);
      setPatientTokens([]);
      setAuthMode("login");
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {
      alert("Error registering patient");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProblem = async (e) => {
    e.preventDefault();
    if (!newSymptomText.trim() || !patientData) return;
    setIsSavingProblem(true);

    try {
      const res = await api.savePatientProblem({
        patientId: patientData.id,
        chiefComplaint: newSymptomText,
        symptoms: [newSymptomText],
        vitals: {
          spo2: newSymptomText.toLowerCase().includes('breath') ? 91 : 97,
          temperatureF: newSymptomText.toLowerCase().includes('fever') ? "102.4" : "98.6"
        },
        currentLang
      });

      if (res.success) {
        setPatientHistory([res.screening, ...patientHistory]);
        if (res.token) {
          setPatientTokens([res.token, ...patientTokens]);
        }
        setProblemSavedToast({
          text: `✅ Problem recorded & triaged as ${res.triageResult?.severity}! Saved persistently to ABHA account.`,
          token: res.token
        });
        setNewSymptomText("");
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setTimeout(() => setProblemSavedToast(null), 6000);
      }
    } catch {
      alert("Error saving problem");
    } finally {
      setIsSavingProblem(false);
    }
  };

  const handleLogout = () => {
    setPatientData(null);
    setPatientHistory([]);
    setPatientTokens([]);
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 animate-fadeIn">
      
      {/* 1. Header Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <User className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">
                  Ayushman Bharat (ABHA) Patient Portal
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Health Locker
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Access your complete lifetime health history, record new symptoms, and get fast-track OPD tokens
              </p>
            </div>
          </div>

          {patientData && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Login / Scanner / Register Card (When Not Logged In) */}
      {!patientData && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
          
          {/* Mode Switcher */}
          <div className="flex items-center justify-center gap-2 bg-slate-100 p-1.5 rounded-2xl max-w-md mx-auto">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                authMode === "login" ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔑 ABHA Login
            </button>
            <button
              onClick={() => setAuthMode("scan")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === "scan" ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scan className="w-3.5 h-3.5 text-teal-600" />
              <span>QR Scanner</span>
            </button>
            <button
              onClick={() => setAuthMode("register")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                authMode === "register" ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Register New
            </button>
          </div>

          {/* Option 1: Direct ABHA Entry */}
          {authMode === "login" && (
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 14-Digit ABHA ID / Phone / Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 91-4521-7890-3341 or Aarav Kumar"
                    value={abhaQuery}
                    onChange={e => setAbhaQuery(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleLogin(abhaQuery)}
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all"
                  >
                    {isLoading ? "Searching..." : "Access Locker"}
                  </button>
                </div>
              </div>

              {/* Quick Select Preset Villagers */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  💡 Quick Select Villager Profile:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "Aarav Kumar", age: "3y (Child)", abha: "91-4521-7890-3341", village: "Rampur" },
                    { name: "Sunita Sharma", age: "24y (Maternal)", abha: "91-8842-1209-5561", village: "Rampur" },
                    { name: "Ramesh Verma", age: "54y (Adult)", abha: "91-9921-6543-1102", village: "Rampur" },
                    { name: "Pooja Yadav", age: "4y (Child)", abha: "91-3312-8874-9901", village: "Chandpur" }
                  ].map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleLogin(p.name)}
                      className="p-2.5 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-xl text-left transition-all text-xs"
                    >
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-500">{p.age} • 📍 {p.village}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Option 2: QR Scanner Simulator */}
          {authMode === "scan" && (
            <div className="max-w-md mx-auto text-center space-y-4">
              <div className="relative w-64 h-64 mx-auto bg-slate-950 rounded-3xl border-4 border-teal-500 flex flex-col items-center justify-center p-4 overflow-hidden shadow-2xl">
                {/* Laser animation */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-400 animate-pulse-ring shadow-lg shadow-teal-500"></div>
                
                <QrCode className="w-32 h-32 text-teal-400 opacity-80" />
                
                {isScanning && (
                  <div className="absolute inset-0 bg-teal-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-teal-300 font-mono text-xs">
                    <Camera className="w-8 h-8 animate-bounce mb-2" />
                    <span>Scanning ABHA Card... {scanProgress}%</span>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={handleStartScanner}
                  disabled={isScanning}
                  className="w-full py-3 px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Scan className="w-4 h-4" />
                  <span>{isScanning ? "Scanning Card..." : "📸 Tap to Simulate ABHA Card Scan"}</span>
                </button>
                <p className="text-[11px] text-slate-500 mt-2">
                  Instantly scans physical ABHA card QR barcode to load records.
                </p>
              </div>
            </div>
          )}

          {/* Option 3: Register New Villager */}
          {authMode === "register" && (
            <form onSubmit={handleRegisterPatient} className="max-w-md mx-auto space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="number"
                  placeholder="Age (Years)"
                  required
                  value={regAge}
                  onChange={e => setRegAge(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={regGender}
                  onChange={e => setRegGender(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>

                <select
                  value={regCategory}
                  onChange={e => setRegCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="general">General</option>
                  <option value="child_under_5">Child Under 5</option>
                  <option value="maternal">Maternal</option>
                  <option value="adult">Adult / Elderly</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Mobile Number"
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register Patient & Generate ABHA ID</span>
              </button>
            </form>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

        </div>
      )}

      {/* 3. Logged-in Patient Dashboard */}
      {patientData && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Digital ABHA Card Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-teal-700/60 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-teal-800/80 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black">
                  ABHA
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Ayushman Bharat Health Card</h3>
                  <span className="text-[10px] text-teal-300 font-mono">National Digital Health Mission</span>
                </div>
              </div>

              <span className="text-xs font-mono font-black bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full border border-teal-500/40">
                {patientData.abhaId}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Patient Name</span>
                <span className="font-black text-base text-white">{patientData.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Age & Gender</span>
                <span className="font-bold text-slate-200">{patientData.ageYears}y • {patientData.gender}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Village</span>
                <span className="font-bold text-slate-200">{patientData.villageName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Category</span>
                <span className="font-bold text-amber-300 uppercase">{patientData.category}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-teal-800/60 text-xs">
              <span className="text-slate-400 font-medium">
                Total Lifetime Hospital Visits: <b className="text-white">{patientHistory.length} Recorded</b>
              </span>

              <button
                onClick={() => {
                  if (onOpenDoctorSummary) onOpenDoctorSummary(patientData.id);
                }}
                className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Doctor Consolidated Summary</span>
              </button>
            </div>
          </div>

          {/* Tell My Problem / Record New Symptoms Form */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Record Current Problem / Symptoms for {patientData.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Describe how you are feeling today — automatically saves to your ABHA health timeline and issues a Smart OPD Token.
            </p>

            <form onSubmit={handleSaveProblem} className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Having severe watery diarrhoea and fever since 2 days..."
                  value={newSymptomText}
                  onChange={e => setNewSymptomText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSavingProblem || !newSymptomText.trim()}
                  className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSavingProblem ? "Saving..." : "Save & Triage"}</span>
                </button>
              </div>
            </form>

            {/* Success Toast */}
            {problemSavedToast && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 animate-fadeIn space-y-1">
                <div className="font-bold">{problemSavedToast.text}</div>
                {problemSavedToast.token && (
                  <div className="text-[11px] text-emerald-800">
                    Smart OPD Token <b>{problemSavedToast.token.id}</b> issued for Room: {problemSavedToast.token.roomNo}.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Tokens Card */}
          {patientTokens.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-300 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-amber-700" />
                  <span>Active Smart OPD Tokens ({patientTokens.length})</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {patientTokens.map((tok, i) => (
                  <div key={i} className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-sm text-amber-900">{tok.id}</span>
                      <span className="text-xs text-slate-600 block">{tok.roomNo || tok.room}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {tok.status || "WAITING"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Longitudinal Medical Timeline & Previous Problems */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>Longitudinal Health Records Timeline</span>
                </h3>
                <p className="text-xs text-slate-500">All past screenings, vitals, and physician notes</p>
              </div>

              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {patientHistory.length} Episodes
              </span>
            </div>

            {patientHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No past visit records found. Enter a problem above to start your health timeline.
              </div>
            ) : (
              <div className="space-y-3">
                {patientHistory.map((sc, i) => (
                  <div
                    key={sc.id || i}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 transition-all text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          sc.triageResult?.severity === "RED" 
                            ? 'bg-red-600 text-white' 
                            : sc.triageResult?.severity === "YELLOW"
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {sc.triageResult?.severity || 'NORMAL'}
                        </span>
                        <span className="font-bold text-slate-800">{sc.id}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">{new Date(sc.timestamp).toLocaleDateString()}</span>
                      </div>

                      <span className="text-[11px] text-slate-600 font-medium">
                        Recorded by: <b>{sc.ashaWorkerId || 'Self (ABHA)'}</b>
                      </span>
                    </div>

                    <div className="text-slate-800 font-medium mb-2">
                      <b>Symptoms: </b>{(sc.symptoms || []).join(', ') || 'General routine visit'}
                    </div>

                    {/* Vitals pill */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                      {sc.vitals?.spo2 && <span className="bg-white px-2 py-0.5 rounded border">SpO₂: <b>{sc.vitals.spo2}%</b></span>}
                      {sc.vitals?.temperatureF && <span className="bg-white px-2 py-0.5 rounded border">Temp: <b>{sc.vitals.temperatureF}°F</b></span>}
                      {sc.vitals?.systolicBP && <span className="bg-white px-2 py-0.5 rounded border">BP: <b>{sc.vitals.systolicBP}/{sc.vitals.diastolicBP}</b></span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
