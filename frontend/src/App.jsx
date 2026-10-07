import React, { useState } from 'react';
import { Header } from './components/Header.jsx';
import { WorkerScreening } from './components/WorkerScreening.jsx';
import { VoiceHealthAssistant } from './components/VoiceHealthAssistant.jsx';
import { SmartTokenManager } from './components/SmartTokenManager.jsx';
import { PatientSummarySlip } from './components/PatientSummarySlip.jsx';
import { PatientPortal } from './components/PatientPortal.jsx';
import { DoctorLongitudinalReport } from './components/DoctorLongitudinalReport.jsx';
import { DoctorPortal } from './components/DoctorPortal.jsx';
import { SurveillanceDashboard } from './components/SurveillanceDashboard.jsx';
import { FollowUpTasks } from './components/FollowUpTasks.jsx';
import { PatientView } from './components/PatientView.jsx';
import { LiveDemoController } from './components/LiveDemoController.jsx';
import { offlineStorage } from './services/offlineStorage.js';
import { ShieldCheck, Heart, Info, RefreshCw } from 'lucide-react';

export function App() {
  const [currentRole, setCurrentRole] = useState(offlineStorage.getRole());
  const [currentLang, setCurrentLang] = useState(offlineStorage.getLang());
  const [lastReferralUpdated, setLastReferralUpdated] = useState(Date.now());
  const [activeCaseData, setActiveCaseData] = useState(null);
  const [doctorReportPatientId, setDoctorReportPatientId] = useState(null);

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    offlineStorage.setRole(role);
  };

  const handleLangChange = (lang) => {
    setCurrentLang(lang);
    offlineStorage.setLang(lang);
  };

  const triggerReferralSync = () => {
    setLastReferralUpdated(Date.now());
  };

  const handleGenerateTokenFromAi = (caseResult) => {
    setActiveCaseData(caseResult);
    handleRoleChange('token');
  };

  const handleViewSummaryFromAi = (caseResult) => {
    setActiveCaseData(caseResult);
    handleRoleChange('summary');
  };

  const handleOpenDoctorSummary = (patientIdOrName) => {
    setDoctorReportPatientId(patientIdOrName);
    handleRoleChange('doctorReport');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Universal Top Header */}
      <Header
        currentRole={currentRole}
        setRole={handleRoleChange}
        currentLang={currentLang}
        setLang={handleLangChange}
        onSyncComplete={triggerReferralSync}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        
        {/* Frontline ASHA Screening */}
        {currentRole === 'worker' && (
          <WorkerScreening
            currentLang={currentLang}
            onReferralCreated={triggerReferralSync}
          />
        )}

        {/* 🎙️ Voice-First AI Doctor Bot & Case-Taking */}
        {currentRole === 'voiceAi' && (
          <VoiceHealthAssistant
            currentLang={currentLang}
            onGenerateToken={handleGenerateTokenFromAi}
            onViewSummary={handleViewSummaryFromAi}
          />
        )}

        {/* 👤 Patient ABHA Portal & Health Locker */}
        {currentRole === 'patientPortal' && (
          <PatientPortal
            currentLang={currentLang}
            onOpenDoctorSummary={handleOpenDoctorSummary}
            onGenerateToken={handleGenerateTokenFromAi}
          />
        )}

        {/* 📋 Doctor Longitudinal Clinical Report */}
        {currentRole === 'doctorReport' && (
          <DoctorLongitudinalReport
            patientQuery={doctorReportPatientId || "Aarav Kumar"}
            onClose={() => handleRoleChange('patientPortal')}
          />
        )}

        {/* 🎫 Smart OPD Hospital Token & Fast-Track Line Avoidance */}
        {currentRole === 'token' && (
          <SmartTokenManager
            currentLang={currentLang}
            initialTokenData={activeCaseData ? {
              id: "OPD-RAM-014",
              patientName: activeCaseData.patientName,
              age: activeCaseData.age,
              villageName: "Rampur",
              facilityName: "Rampur 24x7 Primary Health Centre",
              roomNo: activeCaseData.recommendedOpdRoom,
              doctorName: "Dr. Rajesh Verma (Medical Officer)",
              priority: activeCaseData.triageSeverity === "RED" ? "FAST_TRACK_EMERGENCY" : "NORMAL",
              isFastTrack: activeCaseData.triageSeverity === "RED",
              waitTimeMins: activeCaseData.tokenEstimatedWaitMins,
              patientsAhead: activeCaseData.triageSeverity === "RED" ? 0 : 2,
              status: "WAITING"
            } : null}
          />
        )}

        {/* 📋 Official Patient Problem & Clinical Case Slip */}
        {currentRole === 'summary' && (
          <PatientSummarySlip
            currentLang={currentLang}
            caseData={activeCaseData}
          />
        )}

        {/* PHC Doctor Desk */}
        {currentRole === 'doctor' && (
          <DoctorPortal
            key={lastReferralUpdated}
            currentLang={currentLang}
          />
        )}

        {/* District Outbreak Early-Warning Surveillance */}
        {currentRole === 'surveillance' && (
          <SurveillanceDashboard
            currentLang={currentLang}
          />
        )}

        {/* Follow-up Revisit Tasks */}
        {currentRole === 'tasks' && (
          <FollowUpTasks
            currentLang={currentLang}
            onEscalation={() => {
              triggerReferralSync();
              handleRoleChange('doctor');
            }}
          />
        )}

        {/* Patient SMS / WhatsApp Simulator */}
        {currentRole === 'patient' && (
          <PatientView
            currentLang={currentLang}
          />
        )}

        {/* Guided Demo Flow */}
        {currentRole === 'demo' && (
          <LiveDemoController
            setRole={handleRoleChange}
            setLang={handleLangChange}
          />
        )}

      </main>

      {/* Footer & Compliance Notice */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-teal-500 text-white flex items-center justify-center font-bold text-[10px]">
              GS
            </div>
            <span className="font-bold text-slate-800">GramSaathi v2.5.0</span>
            <span className="text-slate-400">•</span>
            <span>8 Indian Languages • Smart OPD Tokens • WHO IMCI Decision Support</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-teal-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> DPDP Act 2023 & ABDM FHIR R4 Ready
            </span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-500">
              Clinical Decision Support • Non-diagnostic triage assistance
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
}
export default App;
