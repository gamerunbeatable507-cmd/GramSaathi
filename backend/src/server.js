import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, loadDb, saveDb, seedSyntheticData, INITIAL_VILLAGES } from './data-store.js';
import { evaluateTriage } from './triage-engine.js';
import { detectOutbreakClusters, getSeasonalAdvisories } from './surveillance-engine.js';
import { HEALTH_FACILITIES, rankFacilitiesForPatient } from './referral-engine.js';
import { recordAuditLog, getAuditLogs, anonymizeForSurveillance, DPDP_COMPLIANCE } from './audit-privacy.js';
import { generateFhirBundle } from './fhir-export.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize database
loadDb();

// ----------------------------------------------------
// 1. HEALTH & SYSTEM INFO
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: "online",
    service: "GramSaathi Rural Early-Warning & Referral API",
    version: "2.4.0",
    compliance: "DPDP Act 2023 & ABDM FHIR R4 Ready",
    timestamp: new Date().toISOString()
  });
});

// ----------------------------------------------------
// 2. TRIAGE EVALUATION (ONLINE / STANDALONE)
// ----------------------------------------------------
app.post('/api/triage/evaluate', (req, res) => {
  try {
    const result = evaluateTriage(req.body);
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. VILLAGES & FACILITIES
// ----------------------------------------------------
app.get('/api/villages', (req, res) => {
  res.json({ success: true, villages: db.villages });
});

app.get('/api/facilities', (req, res) => {
  const { lat, lng, severity, category } = req.query;
  if (lat && lng) {
    const ranked = rankFacilitiesForPatient(
      { lat: Number(lat), lng: Number(lng) },
      severity || "GREEN",
      category || "general"
    );
    return res.json({ success: true, facilities: ranked });
  }
  res.json({ success: true, facilities: HEALTH_FACILITIES });
});

// ----------------------------------------------------
// 4. PATIENTS & SCREENINGS
// ----------------------------------------------------
app.get('/api/patients', (req, res) => {
  const { villageId, search } = req.query;
  let list = db.patients;
  if (villageId) list = list.filter(p => p.villageId === villageId);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(s) || p.phone.includes(s) || p.id.toLowerCase().includes(s));
  }
  res.json({ success: true, count: list.length, patients: list.slice(0, 100) });
});

app.post('/api/patients', (req, res) => {
  const { name, ageYears, ageMonths, gender, category, villageId, phone, houseNo } = req.body;
  const village = db.villages.find(v => v.id === villageId) || db.villages[0];
  
  const newPatient = {
    id: `PAT-${Date.now().toString().slice(-5)}`,
    name,
    ageYears: Number(ageYears) || 30,
    ageMonths: ageMonths ? Number(ageMonths) : null,
    gender: gender || "Female",
    category: category || "general",
    villageId: village.id,
    villageName: village.name,
    abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    phone: phone || "+91-98765-00000",
    houseNo: houseNo || "Ward 1",
    createdAt: new Date().toISOString()
  };

  db.patients.unshift(newPatient);
  saveDb();

  recordAuditLog({
    actorRole: "FRONT_LINE_WORKER",
    action: "CREATE_PATIENT",
    entityType: "PATIENT",
    entityId: newPatient.id,
    villageId: newPatient.villageId,
    details: `Registered new villager patient: ${newPatient.name}`
  });

  res.json({ success: true, patient: newPatient });
});

// ----------------------------------------------------
// 4B. ABHA PATIENT PORTAL & LONGITUDINAL HEALTH LOCKER
// ----------------------------------------------------
app.get('/api/patient/by-abha/:query', (req, res) => {
  const query = req.params.query.trim().toLowerCase();
  
  // Match by ABHA ID, Patient ID, Phone, or Name
  const patient = db.patients.find(p => 
    (p.abhaId && p.abhaId.toLowerCase().replace(/[^a-z0-9]/g, '').includes(query.replace(/[^a-z0-9]/g, ''))) ||
    (p.id && p.id.toLowerCase() === query) ||
    (p.phone && p.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''))) ||
    (p.name && p.name.toLowerCase().includes(query))
  );

  if (!patient) {
    return res.status(404).json({ success: false, error: "Patient not found with provided ABHA ID or Phone number." });
  }

  // Gather longitudinal history
  const patientScreenings = db.screenings.filter(s => s.patientId === patient.id);
  const patientReferrals = db.referrals.filter(r => r.patientId === patient.id);
  const patientTokens = (db.tokens || []).filter(t => t.patientName === patient.name || t.patientId === patient.id);

  recordAuditLog({
    actorRole: "PATIENT_ABHA_PORTAL",
    action: "PATIENT_ABHA_LOGIN",
    entityType: "PATIENT_HEALTH_LOCKER",
    entityId: patient.id,
    villageId: patient.villageId,
    details: `Patient ${patient.name} logged into ABHA Health Locker (${patient.abhaId})`
  });

  res.json({
    success: true,
    patient,
    screenings: patientScreenings,
    referrals: patientReferrals,
    tokens: patientTokens,
    totalVisits: patientScreenings.length
  });
});

app.post('/api/patient/save-problem', (req, res) => {
  const { patientId, symptoms = [], vitals = {}, chiefComplaint, currentLang = 'en' } = req.body;
  const patient = db.patients.find(p => p.id === patientId) || db.patients[0];

  const triageResult = evaluateTriage({
    category: patient.category || "general",
    ageYears: patient.ageYears,
    ageMonths: patient.ageMonths,
    symptoms,
    vitals
  });

  const newScreening = {
    id: `SCR-PAT-${Date.now().toString().slice(-5)}`,
    patientId: patient.id,
    patientName: patient.name,
    ageYears: patient.ageYears,
    gender: patient.gender,
    category: patient.category || "general",
    villageId: patient.villageId,
    villageName: patient.villageName,
    ashaWorkerId: "Direct Patient ABHA Entry",
    consentObtained: true,
    consentType: "Digital Self-Consent via ABHA",
    symptoms: symptoms.length > 0 ? symptoms : [chiefComplaint || "General malaise"],
    vitals,
    triageResult,
    timestamp: new Date().toISOString(),
    syncStatus: "SYNCED"
  };

  db.screenings.unshift(newScreening);

  // Auto generate OPD Token if Yellow or Red
  let token = null;
  if (triageResult.severity !== "GREEN") {
    const isFastTrack = triageResult.severity === "RED";
    const tokenCount = (db.tokens || []).length + 1;
    token = {
      id: `OPD-RAM-${String(tokenCount).padStart(3, '0')}`,
      patientId: patient.id,
      patientName: patient.name,
      age: `${patient.ageYears}y`,
      gender: patient.gender,
      villageName: patient.villageName,
      facilityId: "FAC-PHC-01",
      facilityName: "Rampur 24x7 Primary Health Centre",
      roomNo: isFastTrack ? "Room 1 (Emergency Triage)" : "Room 2 (General OPD)",
      doctorName: "Dr. Rajesh Verma (Medical Officer)",
      priority: isFastTrack ? "FAST_TRACK_EMERGENCY" : "NORMAL",
      isFastTrack,
      status: "WAITING",
      waitTimeMins: isFastTrack ? 2 : 10,
      patientsAhead: isFastTrack ? 0 : 2,
      createdAt: new Date().toISOString()
    };
    if (!db.tokens) db.tokens = [];
    db.tokens.unshift(token);
  }

  saveDb();

  recordAuditLog({
    actorRole: "PATIENT_ABHA_PORTAL",
    action: "RECORD_NEW_PROBLEM",
    entityType: "SCREENING",
    entityId: newScreening.id,
    villageId: patient.villageId,
    details: `Patient saved new problem via ABHA Locker (${triageResult.severity})`
  });

  res.json({
    success: true,
    screening: newScreening,
    token,
    triageResult
  });
});

// ----------------------------------------------------
// 4C. DOCTOR SINGLE CONSOLIDATED LONGITUDINAL SUMMARY
// ----------------------------------------------------
app.get('/api/doctor/patient-summary/:query', (req, res) => {
  const query = req.params.query.trim().toLowerCase();
  const patient = db.patients.find(p => 
    (p.id && p.id.toLowerCase() === query) ||
    (p.abhaId && p.abhaId.toLowerCase().replace(/[^a-z0-9]/g, '').includes(query.replace(/[^a-z0-9]/g, ''))) ||
    (p.name && p.name.toLowerCase().includes(query))
  ) || db.patients[0];

  const screenings = db.screenings.filter(s => s.patientId === patient.id);
  const referrals = db.referrals.filter(r => r.patientId === patient.id);
  const latestScreening = screenings[0] || null;

  // Build longitudinal vitals array
  const vitalsTimeline = screenings.map(s => ({
    date: new Date(s.timestamp).toLocaleDateString(),
    spo2: s.vitals?.spo2 || "--",
    temp: s.vitals?.temperatureF || "--",
    bp: s.vitals?.systolicBP ? `${s.vitals.systolicBP}/${s.vitals.diastolicBP}` : "--",
    severity: s.triageResult?.severity || "GREEN",
    symptoms: (s.symptoms || []).join(', ')
  }));

  const pastDoctorNotes = referrals.filter(r => r.doctorNotes).map(r => ({
    date: new Date(r.updatedAt || r.createdAt).toLocaleDateString(),
    notes: r.doctorNotes,
    doctor: r.doctorName || "Dr. Rajesh Verma",
    facility: r.facilityName
  }));

  recordAuditLog({
    actorRole: "DOCTOR_PHC",
    action: "VIEW_LONGITUDINAL_PATIENT_REPORT",
    entityType: "PATIENT",
    entityId: patient.id,
    villageId: patient.villageId,
    details: `Medical officer viewed consolidated ABHA longitudinal history for ${patient.name}`
  });

  res.json({
    success: true,
    patient,
    totalVisits: screenings.length,
    activeTriage: latestScreening?.triageResult || null,
    latestScreening,
    vitalsTimeline,
    pastDoctorNotes,
    referrals
  });
});

app.get('/api/screenings', (req, res) => {
  const { villageId, patientId, severity, limit = 50 } = req.query;
  let list = db.screenings;
  if (villageId) list = list.filter(s => s.villageId === villageId);
  if (patientId) list = list.filter(s => s.patientId === patientId);
  if (severity) list = list.filter(s => s.triageResult?.severity === severity);

  res.json({ success: true, count: list.length, screenings: list.slice(0, Number(limit)) });
});

app.post('/api/screenings', (req, res) => {
  const data = req.body;
  const triageResult = evaluateTriage(data);

  const village = db.villages.find(v => v.id === data.villageId) || db.villages[0];

  const newScreening = {
    id: `SCR-${Date.now().toString().slice(-6)}`,
    patientId: data.patientId || `PAT-${Date.now().toString().slice(-4)}`,
    patientName: data.patientName || "Anonymous Villager",
    ageYears: data.ageYears,
    gender: data.gender,
    category: data.category || "general",
    villageId: village.id,
    villageName: village.name,
    ashaWorkerId: data.ashaWorkerId || "Sunita Devi (ASHA-01)",
    consentObtained: Boolean(data.consentObtained),
    consentType: data.consentType || "Verbal Informed Consent under DPDP",
    symptoms: data.symptoms || [],
    vitals: data.vitals || {},
    triageResult,
    timestamp: new Date().toISOString(),
    syncStatus: "SYNCED"
  };

  db.screenings.unshift(newScreening);

  // If RED or YELLOW, create follow-up task and optional referral
  if (triageResult.severity !== "GREEN") {
    db.workerTasks.unshift({
      id: `TASK-${Date.now().toString().slice(-5)}`,
      patientId: newScreening.patientId,
      patientName: newScreening.patientName,
      villageName: village.name,
      dueDate: new Date(Date.now() + ((triageResult.followupDays || 2) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      reason: `Revisit check: ${triageResult.severity} triage (${(data.symptoms || []).slice(0, 2).join(', ') || 'Vitals monitor'})`,
      severity: triageResult.severity,
      completed: false,
      previousVitals: newScreening.vitals
    });
  }

  // Update ASHA points & gamification
  db.workerProfile.points += 20;
  db.workerProfile.screeningsCount += 1;

  saveDb();

  recordAuditLog({
    actorRole: "FRONT_LINE_WORKER",
    action: "CREATE_SCREENING",
    entityType: "SCREENING",
    entityId: newScreening.id,
    villageId: village.id,
    details: `Completed screening: ${triageResult.severity} triage`
  });

  res.json({ success: true, screening: newScreening });
});

// ----------------------------------------------------
// 5. OFFLINE SYNC BATCH ENDPOINT
// ----------------------------------------------------
app.post('/api/sync', (req, res) => {
  const { pendingScreenings = [], pendingReferrals = [] } = req.body;
  let syncedScreeningsCount = 0;
  let syncedReferralsCount = 0;

  for (const item of pendingScreenings) {
    // Check if screening already exists
    const exists = db.screenings.find(s => s.id === item.id);
    if (!exists) {
      const triageResult = item.triageResult || evaluateTriage(item);
      const syncedItem = {
        ...item,
        triageResult,
        syncStatus: "SYNCED",
        syncedAt: new Date().toISOString()
      };
      db.screenings.unshift(syncedItem);
      syncedScreeningsCount++;
    }
  }

  for (const ref of pendingReferrals) {
    const exists = db.referrals.find(r => r.id === ref.id);
    if (!exists) {
      db.referrals.unshift({
        ...ref,
        syncStatus: "SYNCED",
        syncedAt: new Date().toISOString()
      });
      syncedReferralsCount++;
    }
  }

  db.workerProfile.points += (syncedScreeningsCount * 25);
  saveDb();

  recordAuditLog({
    actorRole: "FRONT_LINE_WORKER",
    action: "OFFLINE_SYNC_BATCH",
    entityType: "SYNC_QUEUE",
    entityId: `BATCH-${Date.now().toString().slice(-4)}`,
    details: `Synced ${syncedScreeningsCount} screenings & ${syncedReferralsCount} referrals from offline store`
  });

  res.json({
    success: true,
    syncedScreeningsCount,
    syncedReferralsCount,
    message: `Successfully synchronized ${syncedScreeningsCount + syncedReferralsCount} records with central server.`
  });
});

// ----------------------------------------------------
// 6. REFERRALS LIFECYCLE
// ----------------------------------------------------
app.get('/api/referrals', (req, res) => {
  const { facilityId, status, severity } = req.query;
  let list = db.referrals;
  if (facilityId) list = list.filter(r => r.facilityId === facilityId);
  if (status) list = list.filter(r => r.status === status);
  if (severity) list = list.filter(r => r.severity === severity);

  res.json({ success: true, count: list.length, referrals: list });
});

app.post('/api/referrals', (req, res) => {
  const { screeningId, patientId, patientName, ageYears, gender, villageId, severity, facilityId, transportMode } = req.body;
  const village = db.villages.find(v => v.id === villageId) || db.villages[0];
  const facility = HEALTH_FACILITIES.find(f => f.id === facilityId) || HEALTH_FACILITIES[0];

  const newReferral = {
    id: `REF-${Date.now().toString().slice(-5)}`,
    screeningId,
    patientId,
    patientName,
    ageYears,
    gender,
    villageId: village.id,
    villageName: village.name,
    severity: severity || "RED",
    facilityId: facility.id,
    facilityName: facility.name,
    facilityType: facility.type,
    distanceKm: 4.2,
    status: "SENT", // SENT -> ACCEPTED -> PATIENT_REACHED -> TREATED
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    doctorNotes: null,
    transportMode: transportMode || "108 Ambulance"
  };

  db.referrals.unshift(newReferral);
  db.workerProfile.referralsCompleted += 1;
  saveDb();

  recordAuditLog({
    actorRole: "FRONT_LINE_WORKER",
    action: "CREATE_REFERRAL",
    entityType: "REFERRAL",
    entityId: newReferral.id,
    villageId: village.id,
    details: `One-Tap Referral sent to ${facility.name} (${newReferral.severity})`
  });

  res.json({ success: true, referral: newReferral });
});

app.patch('/api/referrals/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, doctorNotes, doctorName } = req.body;

  const referral = db.referrals.find(r => r.id === id);
  if (!referral) {
    return res.status(404).json({ error: "Referral not found" });
  }

  referral.status = status;
  referral.updatedAt = new Date().toISOString();
  if (doctorNotes) referral.doctorNotes = doctorNotes;
  if (doctorName) referral.doctorName = doctorName;

  saveDb();

  recordAuditLog({
    actorRole: "DOCTOR_PHC",
    action: `UPDATE_REFERRAL_${status}`,
    entityType: "REFERRAL",
    entityId: referral.id,
    villageId: referral.villageId,
    details: `Doctor updated status to ${status}. Notes: ${doctorNotes || 'None'}`
  });

  res.json({ success: true, referral });
});

// ----------------------------------------------------
// 7. SURVEILLANCE & OUTBREAK EARLY-WARNING
// ----------------------------------------------------
app.get('/api/surveillance/dashboard', (req, res) => {
  const outbreakAnalysis = detectOutbreakClusters(db.villages, db.screenings);
  const seasonalInfo = getSeasonalAdvisories();

  // Aggregate stats
  const totalScreenings = db.screenings.length;
  const redScreenings = db.screenings.filter(s => s.triageResult?.severity === "RED").length;
  const yellowScreenings = db.screenings.filter(s => s.triageResult?.severity === "YELLOW").length;
  const greenScreenings = db.screenings.filter(s => s.triageResult?.severity === "GREEN").length;
  const totalReferrals = db.referrals.length;
  const closedReferrals = db.referrals.filter(r => r.status === "TREATED").length;

  recordAuditLog({
    actorRole: "DISTRICT_HEALTH_OFFICER",
    action: "VIEW_SURVEILLANCE_DASHBOARD",
    entityType: "EPIDEMIOLOGY_DASHBOARD",
    entityId: "DISTRICT_LUCKNOW_RURAL",
    details: "District Epidemiologist accessed aggregated early-warning map"
  });

  res.json({
    success: true,
    summary: {
      totalScreenings,
      redScreenings,
      yellowScreenings,
      greenScreenings,
      totalReferrals,
      closedReferrals,
      referralCompletionRate: totalReferrals > 0 ? Math.round((closedReferrals / totalReferrals) * 100) : 100,
      activeAlertsCount: outbreakAnalysis.totalActiveAlerts
    },
    outbreakAnalysis,
    seasonalInfo,
    recentAnonymizedScreenings: db.screenings.slice(0, 30).map(anonymizeForSurveillance)
  });
});

// 1-Click Simulated Outbreak Trigger for live demo
app.post('/api/surveillance/simulate-outbreak', (req, res) => {
  const { villageId = "VIL-01", syndrome = "DIARRHOEA_WATERBORNE", caseCount = 8 } = req.body;
  const village = db.villages.find(v => v.id === villageId) || db.villages[0];

  const now = Date.now();
  for (let i = 0; i < Number(caseCount); i++) {
    const isChild = i % 2 === 0;
    const cat = isChild ? "child_under_5" : "adult";
    const newSc = {
      id: `SCR-OUTBREAK-${Date.now()}-${i}`,
      patientId: `PAT-OUT-${i}`,
      patientName: `Villager ${String.fromCharCode(65 + i)} (${village.name})`,
      ageYears: isChild ? 3 : 34,
      gender: i % 2 === 0 ? "Female" : "Male",
      category: cat,
      villageId: village.id,
      villageName: village.name,
      ashaWorkerId: village.ashaWorker,
      consentObtained: true,
      consentType: "Verbal Informed Consent",
      symptoms: ["diarrhoea", "vomiting", "extreme thirst", "ch_sunken_eyes_skin_pinch"],
      vitals: {
        spo2: 93,
        temperatureF: "101.4",
        systolicBP: 94,
        diastolicBP: 60,
        muacCm: isChild ? "11.4" : null
      },
      timestamp: new Date(now - (Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
      syncStatus: "SYNCED"
    };

    newSc.triageResult = evaluateTriage(newSc);
    db.screenings.unshift(newSc);
  }

  saveDb();

  recordAuditLog({
    actorRole: "SURVEILLANCE_ADMIN",
    action: "TRIGGER_SIMULATED_OUTBREAK",
    entityType: "VILLAGE",
    entityId: village.id,
    details: `Simulated outbreak of ${caseCount} ${syndrome} cases injected into ${village.name}`
  });

  const updatedAnalysis = detectOutbreakClusters(db.villages, db.screenings);

  res.json({
    success: true,
    message: `Generated ${caseCount} outbreak cases in ${village.name}. Surveillance early-warning algorithm updated!`,
    updatedAnalysis
  });
});

// ----------------------------------------------------
// 8. FRONTLINE WORKER TASKS & DETERIORATION REVISITS
// ----------------------------------------------------
app.get('/api/worker/tasks', (req, res) => {
  res.json({
    success: true,
    tasks: db.workerTasks,
    profile: db.workerProfile
  });
});

app.post('/api/worker/tasks/:id/checkin', (req, res) => {
  const { id } = req.params;
  const { conditionStatus, currentVitals = {}, notes } = req.body; // "IMPROVED", "SAME", "WORSENED"
  
  const task = db.workerTasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  task.completed = true;
  task.completedAt = new Date().toISOString();
  task.conditionStatus = conditionStatus;
  task.notes = notes;

  let escalationResult = null;

  // If patient got worse (Deterioration Watch), auto-escalate to RED referral
  if (conditionStatus === "WORSENED") {
    task.severity = "RED";
    
    // Evaluate new triage
    const newTriage = evaluateTriage({
      symptoms: ["condition_worsened_on_followup"],
      vitals: currentVitals
    });

    const newRef = {
      id: `REF-ESC-${Date.now().toString().slice(-4)}`,
      screeningId: `SCR-REVISIT-${Date.now().toString().slice(-4)}`,
      patientId: task.patientId,
      patientName: task.patientName,
      villageName: task.villageName,
      severity: "RED",
      facilityId: HEALTH_FACILITIES[0].id,
      facilityName: HEALTH_FACILITIES[0].name,
      facilityType: HEALTH_FACILITIES[0].type,
      distanceKm: 3.5,
      status: "SENT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      doctorNotes: "AUTO-ESCALATED: Patient condition deteriorated during ASHA 48h revisit.",
      transportMode: "108 Emergency Ambulance"
    };

    db.referrals.unshift(newRef);
    escalationResult = {
      autoEscalated: true,
      newReferral: newRef,
      message: "⚠️ Patient condition deteriorated! Automatic emergency RED referral created."
    };
  }

  db.workerProfile.points += 50; // Bonus for follow-up completion
  saveDb();

  res.json({
    success: true,
    task,
    escalationResult,
    profile: db.workerProfile
  });
});

app.post('/api/worker/reset-demo-data', (req, res) => {
  seedSyntheticData();
  res.json({ success: true, message: "Demo data reset successfully." });
});

// ----------------------------------------------------
// 9. FHIR & AUDIT LOGS
// ----------------------------------------------------
app.get('/api/fhir/:screeningId', (req, res) => {
  const { screeningId } = req.params;
  const sc = db.screenings.find(s => s.id === screeningId) || db.screenings[0];
  const ref = db.referrals.find(r => r.screeningId === sc.id);

  const bundle = generateFhirBundle(sc, ref);

  recordAuditLog({
    actorRole: "ABDM_GATEWAY",
    action: "EXPORT_FHIR_BUNDLE",
    entityType: "FHIR_BUNDLE",
    entityId: bundle.id,
    villageId: sc.villageId,
    details: "Exported Ayushman Bharat ABDM compatible FHIR R4 JSON bundle"
  });

  res.json(bundle);
});

app.get('/api/audit-logs', (req, res) => {
  res.json({
    success: true,
    compliance: DPDP_COMPLIANCE,
    logs: getAuditLogs(100)
  });
});

// ----------------------------------------------------
// 10. SMS / WHATSAPP PATIENT NOTIFICATION SIMULATION
// ----------------------------------------------------
app.post('/api/sms/send-simulation', (req, res) => {
  const { phone, language = "hi", messageText, patientName } = req.body;
  
  res.json({
    success: true,
    channel: "SMS / WhatsApp / IVR Voice Gateway",
    deliveryStatus: "DELIVERED_INSTANTLY",
    recipient: phone || "+91-98765-XXXXX",
    language,
    messageText,
    timestamp: new Date().toISOString()
  });
});

// ----------------------------------------------------
// 11. SMART OPD QUEUE & FAST-TRACK TOKEN ENGINE
// ----------------------------------------------------
if (!db.tokens) {
  db.tokens = [
    { id: "OPD-RAM-010", patientName: "Radha Devi", age: "32y", village: "Rampur", roomNo: "Room 2", doctorName: "Dr. Rajesh Verma", priority: "NORMAL", status: "COMPLETED", waitTimeMins: 0, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "OPD-RAM-011", patientName: "Kabir Singh", age: "4y", village: "Rampur", roomNo: "Room 1 (Emergency)", doctorName: "Dr. Rajesh Verma", priority: "FAST_TRACK_SAM_CHILD", status: "IN_CONSULTATION", waitTimeMins: 0, createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: "OPD-RAM-012", patientName: "Mukesh Yadav", age: "48y", village: "Rampur", roomNo: "Room 2", doctorName: "Dr. Rajesh Verma", priority: "NORMAL", status: "WAITING", waitTimeMins: 6, createdAt: new Date(Date.now() - 600000).toISOString() },
    { id: "OPD-RAM-013", patientName: "Geeta Verma", age: "26y", village: "Rampur", roomNo: "Room 3 (Maternal)", doctorName: "Dr. Sunita Deshmukh", priority: "FAST_TRACK_MATERNAL", status: "WAITING", waitTimeMins: 12, createdAt: new Date(Date.now() - 300000).toISOString() }
  ];
}

app.get('/api/token/queue/:facilityId?', (req, res) => {
  const list = db.tokens || [];
  const waiting = list.filter(t => t.status === "WAITING");
  const inConsultation = list.filter(t => t.status === "IN_CONSULTATION");
  const completed = list.filter(t => t.status === "COMPLETED");

  res.json({
    success: true,
    totalWaiting: waiting.length,
    activeDoctor: "Dr. Rajesh Verma (Medical Officer)",
    queue: list
  });
});

app.post('/api/token/generate', (req, res) => {
  const {
    patientName = "Aarav Kumar",
    age = "3y",
    gender = "Male",
    villageName = "Rampur",
    category = "child_under_5",
    severity = "RED",
    facilityId = "FAC-PHC-01",
    symptoms = []
  } = req.body;

  const isFastTrack = severity === "RED" || category === "maternal" || category === "child_under_5";
  const tokenCount = (db.tokens || []).length + 14;
  const tokenNumber = `OPD-RAM-${String(tokenCount).padStart(3, '0')}`;

  const waitingCount = (db.tokens || []).filter(t => t.status === "WAITING").length;
  const waitMins = isFastTrack ? 2 : Math.max(5, waitingCount * 5);

  const newToken = {
    id: tokenNumber,
    patientName,
    age,
    gender,
    villageName,
    facilityId,
    facilityName: "Rampur 24x7 Primary Health Centre",
    roomNo: isFastTrack ? (severity === "RED" ? "Room 1 (Emergency Triage)" : "Room 3 (Maternal & Child)") : "Room 2 (General OPD)",
    doctorName: "Dr. Rajesh Verma (Medical Officer)",
    priority: isFastTrack ? (severity === "RED" ? "FAST_TRACK_EMERGENCY" : "FAST_TRACK_PRIORITY") : "NORMAL",
    isFastTrack,
    status: "WAITING",
    waitTimeMins: waitMins,
    patientsAhead: isFastTrack ? 0 : waitingCount,
    qrPayload: `GRAMSAATHI-OPD|${tokenNumber}|${patientName}|${severity}|${new Date().toISOString()}`,
    symptoms,
    createdAt: new Date().toISOString()
  };

  if (!db.tokens) db.tokens = [];
  if (isFastTrack) {
    db.tokens.unshift(newToken);
  } else {
    db.tokens.push(newToken);
  }

  saveDb();

  recordAuditLog({
    actorRole: "SMART_TOKEN_KIOSK",
    action: "GENERATE_OPD_TOKEN",
    entityType: "OPD_TOKEN",
    entityId: newToken.id,
    villageId: villageName,
    details: `Generated OPD Token ${newToken.id} (${newToken.priority}) for ${newToken.patientName}`
  });

  res.json({
    success: true,
    token: newToken
  });
});

app.patch('/api/token/:id/call', (req, res) => {
  const { id } = req.params;
  const { status = "IN_CONSULTATION" } = req.body;
  const token = (db.tokens || []).find(t => t.id === id);
  if (!token) return res.status(404).json({ error: "Token not found" });

  token.status = status;
  token.updatedAt = new Date().toISOString();
  saveDb();

  res.json({ success: true, token });
});

// Serve frontend production build if dist directory exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` GramSaathi Backend API running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Outbreak surveillance: http://localhost:${PORT}/api/surveillance/dashboard`);
  console.log(`====================================================`);
});
