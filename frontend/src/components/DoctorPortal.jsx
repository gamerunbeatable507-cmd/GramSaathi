import React, { useState, useEffect } from 'react';
import { Stethoscope, CheckCircle2, Clock, Send, AlertCircle, Building2, User, PhoneCall, RefreshCw, Check, ArrowRight, FileText, Search } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';
import { TRANSLATIONS } from '../services/translations.js';
import { DoctorLongitudinalReport } from './DoctorLongitudinalReport.jsx';

export function DoctorPortal({ currentLang = 'en' }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [referrals, setReferrals] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState("FAC-PHC-01");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [activeTab, setActiveTab] = useState("incoming"); // "incoming" | "all"
  
  // Selected Referral for Treatment / Notes
  const [treatingRef, setTreatingRef] = useState(null);
  const [selectedAbhaPatient, setSelectedAbhaPatient] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedFacilityId, filterSeverity]);

  const loadData = async () => {
    const facList = await api.getFacilities();
    setFacilities(facList);

    const refList = await api.getReferrals("", filterSeverity);
    setReferrals(refList);
  };

  const handleUpdateStatus = async (refId, nextStatus) => {
    setIsUpdating(true);
    try {
      await api.updateReferralStatus(refId, nextStatus, "", "Dr. Rajesh Verma (Medical Officer)");
      if (nextStatus === "TREATED") {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }
      await loadData();
    } catch {
      alert("Error updating referral status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteTreatmentWithNotes = async () => {
    if (!treatingRef) return;
    setIsUpdating(true);
    try {
      await api.updateReferralStatus(
        treatingRef.id,
        "TREATED",
        doctorNotes || "Patient treated and discharged with prescribed oral medications and hydration therapy.",
        "Dr. Rajesh Verma (Medical Officer)"
      );
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
      setTreatingRef(null);
      setDoctorNotes("");
      await loadData();
    } catch {
      alert("Error completing treatment");
    } finally {
      setIsUpdating(false);
    }
  };

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId) || facilities[0];
  const filteredReferrals = activeTab === "incoming" 
    ? referrals.filter(r => r.status === "SENT" || r.status === "ACCEPTED" || r.status === "PATIENT_REACHED")
    : referrals;

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6 animate-fadeIn">
      
      {/* Header & Facility Selector */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center font-bold">
              <Stethoscope className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">{t.doctor.title}</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live Referral Gateway
                </span>
              </div>
              <p className="text-xs text-slate-500">{t.doctor.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedFacilityId}
              onChange={e => setSelectedFacilityId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              {facilities.map(f => (
                <option key={f.id} value={f.id}>🏥 {f.name} ({f.type})</option>
              ))}
            </select>

            <button
              onClick={loadData}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
              title="Refresh Queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Facility Load Stats */}
        {selectedFacility && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">In-Charge</span>
              <span className="font-bold text-slate-800">{selectedFacility.officerInCharge}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Doctors On Duty</span>
              <span className="font-bold text-teal-700 text-sm">👨‍⚕️ {selectedFacility.doctorsOnDuty} Doctors</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Bed Occupancy</span>
              <span className="font-bold text-slate-800 text-sm">
                🛏️ {selectedFacility.occupiedBeds} / {selectedFacility.totalBeds} ({selectedFacility.occupancyRate || 50}%)
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Ambulance Line</span>
              <a href={`tel:${selectedFacility.ambulancePhone}`} className="font-bold text-red-600 hover:underline flex items-center gap-1">
                <PhoneCall className="w-3 h-3" /> {selectedFacility.ambulancePhone}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Tabs & Severity Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("incoming")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "incoming" ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚨 Active Incoming ({referrals.filter(r => r.status !== "TREATED").length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "all" ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 All Records ({referrals.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filter:</span>
          <button
            onClick={() => setFilterSeverity("")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              filterSeverity === "" ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterSeverity("RED")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              filterSeverity === "RED" ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            RED Only
          </button>
          <button
            onClick={() => setFilterSeverity("YELLOW")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              filterSeverity === "YELLOW" ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            YELLOW Only
          </button>
        </div>
      </div>

      {/* Referrals Queue Cards */}
      <div className="space-y-3">
        {filteredReferrals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-200">
            No active referrals matching criteria.
          </div>
        ) : (
          filteredReferrals.map(ref => {
            const isRed = ref.severity === "RED";
            return (
              <div
                key={ref.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
                  isRed ? 'border-red-200 ring-1 ring-red-300/30' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  
                  {/* Patient & Triage Info */}
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                      isRed ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isRed ? "🚨" : "⚠️"}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-slate-900">{ref.patientName}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isRed ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {ref.severity} TRIAGE
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          • {ref.ageYears} yrs • {ref.gender} • 📍 {ref.villageName}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Ref ID: <b>{ref.id}</b></span>
                        <span>Facility: <b>{ref.facilityName}</b> (~{ref.distanceKm} km)</span>
                        <span>Transport: <b>{ref.transportMode || 'Ambulance'}</b></span>
                      </div>

                      {/* Doctor Notes if present */}
                      {ref.doctorNotes && (
                        <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700">
                          <span className="font-bold text-teal-800">Doctor Feedback: </span>
                          <span>{ref.doctorNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Pipeline & Action Buttons */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    
                    {/* Status Badge */}
                    <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full text-center ${
                      ref.status === "TREATED" 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : ref.status === "PATIENT_REACHED"
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : ref.status === "ACCEPTED"
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    }`}>
                      ● Status: {ref.status.replace('_', ' ')}
                    </span>

                    {/* Step Transitions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ref.status === "SENT" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ref.id, "ACCEPTED")}
                          disabled={isUpdating}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                        >
                          Accept Referral
                        </button>
                      )}

                      {ref.status === "ACCEPTED" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ref.id, "PATIENT_REACHED")}
                          disabled={isUpdating}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                        >
                          Mark Patient Reached
                        </button>
                      )}

                      {ref.status === "PATIENT_REACHED" && (
                        <button
                          type="button"
                          onClick={() => setTreatingRef(ref)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Complete & Send Notes</span>
                        </button>
                      )}

                      {/* ABHA Single Summary Lookup Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedAbhaPatient(ref.patientName || ref.patientId)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                        title="View complete longitudinal lifetime records for this patient"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        <span>ABHA History</span>
                      </button>

                      {ref.status === "TREATED" && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Loop Closed
                        </span>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Complete Treatment & Notes Modal */}
      {treatingRef && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Close Referral Loop</h3>
                <p className="text-xs text-slate-500">Patient: <b>{treatingRef.patientName}</b> ({treatingRef.villageName})</p>
              </div>
              <button
                type="button"
                onClick={() => setTreatingRef(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Doctor's Treatment & Discharge Prescription
              </label>
              <textarea
                rows={4}
                placeholder={t.doctor.doctorNotesPlaceholder}
                value={doctorNotes}
                onChange={e => setDoctorNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                This advice will be automatically synced back to the frontline ASHA worker's app.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTreatingRef(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteTreatmentWithNotes}
                disabled={isUpdating}
                className="flex-2 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{isUpdating ? "Saving..." : "Save & Close Loop"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Doctor Longitudinal Summary Modal */}
      {selectedAbhaPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <DoctorLongitudinalReport
              patientQuery={selectedAbhaPatient}
              onClose={() => setSelectedAbhaPatient(null)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
