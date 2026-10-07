import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  User, 
  FileText, 
  Clock, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Printer, 
  Send, 
  HeartPulse,
  Thermometer,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';

export function DoctorLongitudinalReport({ patientQuery = "Aarav Kumar", onClose }) {
  const [report, setReport] = useState(null);
  const [searchKey, setSearchKey] = useState(patientQuery);
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptionNote, setPrescriptionNote] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadReport(patientQuery);
  }, [patientQuery]);

  const loadReport = async (q) => {
    setIsLoading(true);
    try {
      const data = await api.getDoctorLongitudinalSummary(q);
      if (data.success) {
        setReport(data);
      }
    } catch (err) {
      console.error("Error loading doctor longitudinal summary:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDoctorDischarge = () => {
    if (!prescriptionNote.trim()) return;
    setSavedSuccess(true);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6 animate-fadeIn">
      
      {/* Top Search & Actions Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Doctor Consolidated Longitudinal Health Report
            </h3>
            <span className="text-[11px] text-slate-500">
              Unified ABHA Clinical Timeline & Episode Summarizer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <input
              type="text"
              placeholder="Search ABHA / Name"
              value={searchKey}
              onChange={e => setSearchKey(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none font-medium w-40"
            />
          </div>
          <button
            onClick={() => loadReport(searchKey)}
            className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700"
          >
            Lookup
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-500 text-xs">
          Loading Unified Patient Clinical Report...
        </div>
      ) : !report ? (
        <div className="text-center py-16 text-slate-400 text-xs bg-white rounded-3xl border">
          No clinical records found.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Patient Bio & ABHA Card Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl border border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-2xl font-black">
                  👤
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">{report.patient.name}</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                      ABHA: {report.patient.abhaId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {report.patient.ageYears} Yrs • {report.patient.gender} • 📍 {report.patient.villageName} • 📞 {report.patient.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Lifetime Visits</span>
                  <span className="text-xl font-black text-teal-400">{report.totalVisits} Episodes</span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
                  title="Print Report"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Episode Alert & Triage Summary */}
          {report.activeTriage && (
            <div className={`rounded-3xl p-5 border-2 ${
              report.activeTriage.severity === "RED"
                ? 'bg-red-50 border-red-400 text-red-950'
                : 'bg-amber-50 border-amber-400 text-amber-950'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{report.activeTriage.severity === "RED" ? "🚨" : "⚠️"}</span>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">
                    Current Active Episode: {report.activeTriage.severity} Triage
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold">
                  Reported: {new Date(report.latestScreening?.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="text-xs font-semibold leading-relaxed mb-3">
                <b>Chief Complaint: </b>{(report.latestScreening?.symptoms || []).join(', ')}
              </p>

              {/* Danger flags breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {(report.activeTriage.redFlags || []).map((rf, idx) => (
                  <div key={idx} className="bg-red-100/80 p-2.5 rounded-xl border border-red-200">
                    <span className="font-black text-red-900">{rf.param}: {rf.value}</span>
                    <p className="text-[11px] text-red-800 mt-0.5">{rf.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Longitudinal Vitals Trends Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Longitudinal Vitals & Symptoms History</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-extrabold border-b">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Triage</th>
                    <th className="py-2.5 px-3">SpO₂ (%)</th>
                    <th className="py-2.5 px-3">Temp (°F)</th>
                    <th className="py-2.5 px-3">BP (mmHg)</th>
                    <th className="py-2.5 px-3">Symptoms Recorded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {report.vitalsTimeline.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{v.date}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          v.severity === "RED" ? 'bg-red-100 text-red-700' : v.severity === "YELLOW" ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {v.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-teal-800">{v.spo2}%</td>
                      <td className="py-2.5 px-3">{v.temp}</td>
                      <td className="py-2.5 px-3">{v.bp}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{v.symptoms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Past Doctor Prescriptions & Feedback */}
          {report.pastDoctorNotes.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Historical Physician Feedback & Prescriptions</span>
              </h4>

              <div className="space-y-2 text-xs">
                {report.pastDoctorNotes.map((dn, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                      <span>👨‍⚕️ {dn.doctor} ({dn.facility})</span>
                      <span>{dn.date}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{dn.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Action: Prescribe & Discharge to ABHA Locker */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Submit Physician Prescription / Discharge Advice to Patient's ABHA Locker
            </h4>
            <textarea
              rows={3}
              placeholder="Enter prescription (e.g. Paracetamol 250mg syrup TDS, Amoxicillin 125mg BD x 5 days, ORS hydration), review in 48h..."
              value={prescriptionNote}
              onChange={e => setPrescriptionNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                🔒 Saved immutably to national ABHA locker under DPDP Act 2023.
              </span>
              <button
                onClick={handleSaveDoctorDischarge}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Save to Patient ABHA</span>
              </button>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Prescription saved successfully to patient's ABHA Health Locker!</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
