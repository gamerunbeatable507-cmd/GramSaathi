import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { evaluateTriage } from './triage-engine.js';
import { HEALTH_FACILITIES, rankFacilitiesForPatient } from './referral-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'data', 'gramsaathi_db.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const INITIAL_VILLAGES = [
  {
    id: "VIL-01",
    name: "Rampur",
    district: "Lucknow Rural",
    population: 3420,
    ashaWorker: "Sunita Devi (ASHA-01)",
    ashaPhone: "+91-98765-43201",
    coordinates: { lat: 26.8520, lng: 80.9410 },
    waterSources: ["Community Well #3", "Hand Pump #7"],
    activeAlert: "ACUTE_DIARRHOEA_SPIKE"
  },
  {
    id: "VIL-02",
    name: "Chandpur",
    district: "Lucknow Rural",
    population: 2850,
    ashaWorker: "Rekha Sharma (ASHA-02)",
    ashaPhone: "+91-98765-43202",
    coordinates: { lat: 26.8680, lng: 80.9650 },
    waterSources: ["Borewell #2", "Panchayat Tank"],
    activeAlert: "NONE"
  },
  {
    id: "VIL-03",
    name: "Belur",
    district: "Lucknow Rural",
    population: 1980,
    ashaWorker: "Meena Yadav (ASHA-03)",
    ashaPhone: "+91-98765-43203",
    coordinates: { lat: 26.8200, lng: 80.9100 },
    waterSources: ["Hand Pump #1", "Hand Pump #4"],
    activeAlert: "NONE"
  },
  {
    id: "VIL-04",
    name: "Shivpuri",
    district: "Lucknow Rural",
    population: 4100,
    ashaWorker: "Pooja Verma (ASHA-04)",
    ashaPhone: "+91-98765-43204",
    coordinates: { lat: 26.8850, lng: 80.9300 },
    waterSources: ["Canal Supply", "Submersible Well"],
    activeAlert: "NONE"
  },
  {
    id: "VIL-05",
    name: "Khelgaon",
    district: "Lucknow Rural",
    population: 2300,
    ashaWorker: "Anita Patel (ASHA-05)",
    ashaPhone: "+91-98765-43205",
    coordinates: { lat: 26.8350, lng: 80.9800 },
    waterSources: ["Tube Well #5"],
    activeAlert: "NONE"
  }
];

export let db = {
  villages: INITIAL_VILLAGES,
  patients: [],
  screenings: [],
  referrals: [],
  workerTasks: [],
  workerProfile: {
    id: "ASHA-01",
    name: "Sunita Devi",
    role: "ASHA Health Worker",
    assignedVillageId: "VIL-01",
    assignedVillageName: "Rampur",
    phone: "+91-98765-43201",
    points: 1250,
    screeningsCount: 142,
    referralsCompleted: 38,
    followupAdherence: 94, // %
    level: "ASHA Master Champion",
    badges: [
      { id: "b1", title: "Outbreak Sentinel", icon: "🛡️", desc: "Flagged first waterborne cluster early" },
      { id: "b2", title: "Zero Maternal Delay", icon: "🤱", desc: "100% timely maternal red referrals" },
      { id: "b3", title: "Follow-Up Hero", icon: "⭐", desc: ">90% revisit adherence on yellow cases" }
    ]
  }
};

/**
 * Generates synthetic baseline + outbreak data for realistic demos
 */
export function seedSyntheticData() {
  const patients = [];
  const screenings = [];
  const referrals = [];
  const workerTasks = [];

  const firstNamesM = ["Ramesh", "Suresh", "Manoj", "Ajay", "Dharmendra", "Mukesh", "Sonu", "Vikas", "Rohit", "Anand", "Deepak", "Chhotu", "Aarav", "Kabir", "Vihaan"];
  const firstNamesF = ["Geeta", "Sunita", "Anita", "Radha", "Kamla", "Shanti", "Pooja", "Laxmi", "Suman", "Kavita", "Pari", "Ananya", "Aadhya", "Meera", "Champa"];
  const lastNames = ["Kumar", "Singh", "Yadav", "Verma", "Patel", "Sharma", "Devi", "Prasad", "Maurya", "Rawat", "Gupta"];

  let patientIdCounter = 1000;
  let screeningIdCounter = 5000;
  let referralIdCounter = 8000;

  const now = Date.now();

  // Create ~210 patients distributed over 5 villages
  INITIAL_VILLAGES.forEach((village, vIdx) => {
    const isOutbreakVillage = village.id === "VIL-01"; // Rampur has outbreak spike
    const patientCount = isOutbreakVillage ? 65 : 35;

    for (let i = 0; i < patientCount; i++) {
      patientIdCounter++;
      const isFemale = Math.random() > 0.45;
      const fName = isFemale ? firstNamesF[i % firstNamesF.length] : firstNamesM[i % firstNamesM.length];
      const lName = lastNames[(i + vIdx) % lastNames.length];
      
      let category = "general";
      const randCat = Math.random();
      let ageYears = 28;
      let ageMonths = null;

      if (randCat < 0.25) {
        category = "child_under_5";
        ageYears = Math.floor(Math.random() * 5);
        ageMonths = ageYears === 0 ? Math.floor(Math.random() * 11) + 1 : ageYears * 12;
      } else if (randCat < 0.45 && isFemale) {
        category = "maternal";
        ageYears = 20 + Math.floor(Math.random() * 15);
      } else if (randCat < 0.65) {
        category = "adult";
        ageYears = 45 + Math.floor(Math.random() * 30);
      } else {
        category = "general";
        ageYears = 18 + Math.floor(Math.random() * 35);
      }

      const patient = {
        id: `PAT-${patientIdCounter}`,
        name: `${fName} ${lName}`,
        ageYears,
        ageMonths,
        gender: isFemale ? "Female" : "Male",
        category,
        villageId: village.id,
        villageName: village.name,
        abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        phone: `+91-98765-${Math.floor(10000 + Math.random() * 90000)}`,
        houseNo: `Ward ${Math.floor(Math.random() * 6) + 1}, H.No ${10 + i}`,
        createdAt: new Date(now - (12 * 24 * 60 * 60 * 1000)).toISOString()
      };
      patients.push(patient);

      // Generate screening visits
      // 1. Historical baseline (7 to 14 days ago)
      // 2. Recent spike (last 3 days) for Rampur
      const isRecentOutbreakCase = isOutbreakVillage && i < 16;
      const daysAgo = isRecentOutbreakCase 
        ? Math.random() * 2.5 // within last 2.5 days
        : Math.random() * 12 + 1; // spread over 12 days

      screeningIdCounter++;
      const screeningTime = new Date(now - (daysAgo * 24 * 60 * 60 * 1000)).toISOString();

      let symptoms = [];
      let vitals = {
        spo2: 96 + Math.floor(Math.random() * 3),
        temperatureF: 98.4 + (Math.random() * 1.2),
        systolicBP: 118 + Math.floor(Math.random() * 12),
        diastolicBP: 76 + Math.floor(Math.random() * 8),
        bloodSugar: 95 + Math.floor(Math.random() * 25)
      };

      if (category === "child_under_5") {
        vitals.muacCm = (12.8 + Math.random() * 2.0).toFixed(1);
        vitals.respiratoryRate = 28 + Math.floor(Math.random() * 10);
      }

      // If simulated outbreak in Rampur -> induce acute watery diarrhoea & dehydration
      if (isRecentOutbreakCase) {
        symptoms = ["diarrhoea", "vomiting", "extreme thirst"];
        vitals.temperatureF = 100.8 + (Math.random() * 2.0);
        vitals.systolicBP = 96;
        if (Math.random() > 0.4) {
          symptoms.push("ch_sunken_eyes_skin_pinch");
          vitals.spo2 = 92;
        }
      } else if (Math.random() < 0.15) {
        // Random baseline RED/YELLOW cases across villages
        if (category === "maternal") {
          symptoms = ["mat_headache_vision"];
          vitals.systolicBP = 158;
          vitals.diastolicBP = 102;
        } else if (category === "child_under_5") {
          symptoms = ["ch_chest_indrawing", "cough"];
          vitals.spo2 = 91;
          vitals.respiratoryRate = 54;
          vitals.muacCm = "11.2";
        } else {
          symptoms = ["ad_shortness_breath", "fever"];
          vitals.spo2 = 89;
          vitals.temperatureF = 102.6;
        }
      }

      const triageResult = evaluateTriage({
        category,
        ageYears,
        ageMonths,
        symptoms,
        vitals
      });

      const screening = {
        id: `SCR-${screeningIdCounter}`,
        patientId: patient.id,
        patientName: patient.name,
        ageYears: patient.ageYears,
        gender: patient.gender,
        category,
        villageId: village.id,
        villageName: village.name,
        ashaWorkerId: village.ashaWorker,
        consentObtained: true,
        consentType: "Verbal & Audio Recorded",
        symptoms,
        vitals: {
          spo2: vitals.spo2,
          temperatureF: vitals.temperatureF ? Number(vitals.temperatureF).toFixed(1) : null,
          systolicBP: vitals.systolicBP,
          diastolicBP: vitals.diastolicBP,
          bloodSugar: vitals.bloodSugar,
          muacCm: vitals.muacCm,
          respiratoryRate: vitals.respiratoryRate
        },
        triageResult,
        timestamp: screeningTime,
        syncStatus: "SYNCED"
      };
      screenings.push(screening);

      // Create Referrals for RED and some YELLOW cases
      if (triageResult.severity === "RED" || (triageResult.severity === "YELLOW" && Math.random() > 0.5)) {
        referralIdCounter++;
        const facilities = rankFacilitiesForPatient(village.coordinates, triageResult.severity, category);
        const targetFacility = facilities[0] || HEALTH_FACILITIES[0];

        const statuses = ["SENT", "ACCEPTED", "PATIENT_REACHED", "TREATED"];
        const refStatus = daysAgo < 0.8 ? "SENT" : daysAgo < 2 ? "ACCEPTED" : daysAgo < 4 ? "PATIENT_REACHED" : "TREATED";

        const referral = {
          id: `REF-${referralIdCounter}`,
          screeningId: screening.id,
          patientId: patient.id,
          patientName: patient.name,
          ageYears: patient.ageYears,
          gender: patient.gender,
          villageId: village.id,
          villageName: village.name,
          severity: triageResult.severity,
          facilityId: targetFacility.id,
          facilityName: targetFacility.name,
          facilityType: targetFacility.type,
          distanceKm: targetFacility.distanceKm,
          status: refStatus, // SENT -> ACCEPTED -> PATIENT_REACHED -> TREATED
          createdAt: screeningTime,
          updatedAt: new Date(new Date(screeningTime).getTime() + 3600000).toISOString(),
          doctorNotes: refStatus === "TREATED" ? "Patient stabilized with IV fluids and antibiotic coverage. Discharge to home follow-up." : null,
          transportMode: triageResult.severity === "RED" ? "108 Ambulance Dispatched" : "Auto / Village Vehicle"
        };
        referrals.push(referral);
      }

      // Create Follow-up Revisit Task for Frontline Worker
      if (triageResult.severity !== "GREEN" && daysAgo < 3) {
        workerTasks.push({
          id: `TASK-${patient.id}-${Math.floor(Math.random() * 900)}`,
          patientId: patient.id,
          patientName: patient.name,
          villageName: village.name,
          dueDate: new Date(now + ((triageResult.followupDays || 2) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          reason: `Revisit check: ${triageResult.severity} triage (${symptoms.slice(0, 2).join(', ') || 'Vitals follow-up'})`,
          severity: triageResult.severity,
          completed: false,
          previousVitals: screening.vitals
        });
      }
    }
  });

  db.patients = patients;
  db.screenings = screenings;
  db.referrals = referrals;
  db.workerTasks = workerTasks;

  saveDb();
  console.log(`[GramSaathi DB] Seeded ${patients.length} patients, ${screenings.length} screenings, ${referrals.length} referrals across 5 villages.`);
}

export function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving DB to disk:", err);
  }
}

export function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
      console.log(`[GramSaathi DB] Loaded existing database with ${db.screenings.length} screenings.`);
    } else {
      seedSyntheticData();
    }
  } catch (err) {
    console.error("Error loading DB, seeding fresh:", err);
    seedSyntheticData();
  }
}
