import { offlineStorage } from './offlineStorage.js';
import { evaluateClientTriage } from './clientTriageEngine.js';

const BASE_URL = '/api';

export const api = {
  // Check online status (considers simulated offline toggle)
  isOnline() {
    return !offlineStorage.isOfflineSimulated() && navigator.onLine;
  },

  async getVillages() {
    if (!this.isOnline()) {
      return [
        { id: "VIL-01", name: "Rampur", population: 3420, coordinates: { lat: 26.8520, lng: 80.9410 } },
        { id: "VIL-02", name: "Chandpur", population: 2850, coordinates: { lat: 26.8680, lng: 80.9650 } },
        { id: "VIL-03", name: "Belur", population: 1980, coordinates: { lat: 26.8200, lng: 80.9100 } },
        { id: "VIL-04", name: "Shivpuri", population: 4100, coordinates: { lat: 26.8850, lng: 80.9300 } },
        { id: "VIL-05", name: "Khelgaon", population: 2300, coordinates: { lat: 26.8350, lng: 80.9800 } }
      ];
    }
    try {
      const res = await fetch(`${BASE_URL}/villages`);
      const data = await res.json();
      return data.villages || [];
    } catch (err) {
      console.warn("API offline, returning fallback villages:", err);
      return [];
    }
  },

  async getPatients(villageId = "") {
    if (!this.isOnline()) {
      return [
        { id: "PAT-1001", name: "Aarav Kumar", ageYears: 2, ageMonths: 24, gender: "Male", category: "child_under_5", villageId: "VIL-01", villageName: "Rampur", phone: "+91-98765-11223" },
        { id: "PAT-1002", name: "Sunita Sharma", ageYears: 24, gender: "Female", category: "maternal", villageId: "VIL-01", villageName: "Rampur", phone: "+91-98765-44556" },
        { id: "PAT-1003", name: "Ramesh Verma", ageYears: 54, gender: "Male", category: "adult", villageId: "VIL-01", villageName: "Rampur", phone: "+91-98765-77889" },
        { id: "PAT-1004", name: "Pooja Yadav", ageYears: 4, ageMonths: 48, gender: "Female", category: "child_under_5", villageId: "VIL-02", villageName: "Chandpur", phone: "+91-98765-99001" }
      ];
    }
    try {
      const res = await fetch(`${BASE_URL}/patients?villageId=${villageId}`);
      const data = await res.json();
      return data.patients || [];
    } catch {
      return [];
    }
  },

  async createPatient(patientData) {
    if (!this.isOnline()) {
      const newPat = {
        ...patientData,
        id: `PAT-OFFLINE-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString()
      };
      return newPat;
    }
    const res = await fetch(`${BASE_URL}/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patientData)
    });
    const data = await res.json();
    return data.patient;
  },

  async submitScreening(screeningData) {
    // 1. If Offline -> run client triage and save to sync queue
    if (!this.isOnline()) {
      const triageResult = evaluateClientTriage(screeningData);
      const offlineScreening = {
        ...screeningData,
        id: `SCR-OFFLINE-${Date.now().toString().slice(-5)}`,
        triageResult,
        timestamp: new Date().toISOString(),
        syncStatus: "PENDING_OFFLINE"
      };

      offlineStorage.addPendingScreening(offlineScreening);
      return { success: true, screening: offlineScreening, isOfflineSaved: true };
    }

    // 2. If Online -> submit directly to server
    try {
      const res = await fetch(`${BASE_URL}/screenings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(screeningData)
      });
      const data = await res.json();
      return { success: true, screening: data.screening, isOfflineSaved: false };
    } catch (err) {
      // Fallback to offline on network error
      console.warn("Network failed during screening submission, queueing offline:", err);
      const triageResult = evaluateClientTriage(screeningData);
      const offlineScreening = {
        ...screeningData,
        id: `SCR-OFFLINE-${Date.now().toString().slice(-5)}`,
        triageResult,
        timestamp: new Date().toISOString(),
        syncStatus: "PENDING_OFFLINE"
      };
      offlineStorage.addPendingScreening(offlineScreening);
      return { success: true, screening: offlineScreening, isOfflineSaved: true };
    }
  },

  async getFacilities(lat, lng, severity = "GREEN", category = "general") {
    try {
      const res = await fetch(`${BASE_URL}/facilities?lat=${lat || ''}&lng=${lng || ''}&severity=${severity}&category=${category}`);
      const data = await res.json();
      return data.facilities || [];
    } catch {
      return [
        { id: "FAC-PHC-01", name: "Rampur 24x7 PHC", type: "PHC", distanceKm: 2.1, doctorsOnDuty: 2, totalBeds: 12, occupiedBeds: 5, ambulancePhone: "+91-98765-10801" },
        { id: "FAC-CHC-02", name: "Sharda Nagar CHC", type: "CHC", distanceKm: 6.4, doctorsOnDuty: 5, totalBeds: 35, occupiedBeds: 22, ambulancePhone: "+91-98765-10802" }
      ];
    }
  },

  async createReferral(referralData) {
    if (!this.isOnline()) {
      const offRef = {
        ...referralData,
        id: `REF-OFFLINE-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
        status: "SENT",
        syncStatus: "PENDING_OFFLINE"
      };
      offlineStorage.addPendingReferral(offRef);
      return offRef;
    }
    const res = await fetch(`${BASE_URL}/referrals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(referralData)
    });
    const data = await res.json();
    return data.referral;
  },

  async getReferrals(status = "", severity = "") {
    try {
      const res = await fetch(`${BASE_URL}/referrals?status=${status}&severity=${severity}`);
      const data = await res.json();
      return data.referrals || [];
    } catch {
      return [];
    }
  },

  async updateReferralStatus(referralId, status, doctorNotes = "", doctorName = "") {
    const res = await fetch(`${BASE_URL}/referrals/${referralId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, doctorNotes, doctorName })
    });
    return await res.json();
  },

  async getSurveillanceDashboard() {
    const res = await fetch(`${BASE_URL}/surveillance/dashboard`);
    return await res.json();
  },

  async simulateOutbreak(villageId, caseCount = 8) {
    const res = await fetch(`${BASE_URL}/surveillance/simulate-outbreak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ villageId, caseCount })
    });
    return await res.json();
  },

  async getWorkerTasks() {
    const res = await fetch(`${BASE_URL}/worker/tasks`);
    return await res.json();
  },

  async checkinWorkerTask(taskId, conditionStatus, notes = "", currentVitals = {}) {
    const res = await fetch(`${BASE_URL}/worker/tasks/${taskId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditionStatus, notes, currentVitals })
    });
    return await res.json();
  },

  async syncOfflineBatch() {
    const pendingScreenings = offlineStorage.getPendingScreenings();
    const pendingReferrals = offlineStorage.getPendingReferrals();

    if (pendingScreenings.length === 0 && pendingReferrals.length === 0) {
      return { success: true, message: "No pending offline items to sync." };
    }

    const res = await fetch(`${BASE_URL}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingScreenings, pendingReferrals })
    });

    const result = await res.json();
    if (result.success) {
      offlineStorage.clearPendingSync();
    }
    return result;
  },

  async getFhirBundle(screeningId) {
    const res = await fetch(`${BASE_URL}/fhir/${screeningId}`);
    return await res.json();
  },

  async getAuditLogs() {
    const res = await fetch(`${BASE_URL}/audit-logs`);
    return await res.json();
  },

  async loginPatientByAbha(query) {
    const res = await fetch(`${BASE_URL}/patient/by-abha/${encodeURIComponent(query)}`);
    return await res.json();
  },

  async savePatientProblem(payload) {
    const res = await fetch(`${BASE_URL}/patient/save-problem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getDoctorLongitudinalSummary(query = "PAT-1001") {
    const res = await fetch(`${BASE_URL}/doctor/patient-summary/${encodeURIComponent(query)}`);
    return await res.json();
  },

  async sendSmsSimulation(phone, messageText, language = "hi", patientName = "") {
    const res = await fetch(`${BASE_URL}/sms/send-simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, messageText, language, patientName })
    });
    return await res.json();
  }
};
