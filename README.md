# 🌿 GramSaathi (ग्रामसाथी)
### Rural Early-Warning & Clinical Referral Network

**GramSaathi** is an offline-first, multilingual clinical decision support and syndromic outbreak surveillance platform designed specifically for frontline community health workers (ASHA, ANM, and rural nurses), Primary Health Centre (PHC) doctors, district health officers, and rural citizens.

---

## 🌟 Key Capabilities & Features

### 1. ⚡ 100% Offline-First Frontline Screening & Triage
- **Simulated Airplane Mode Support**: Functions completely without internet access in remote rural villages.
- **Client-Side Decision Support Engine**: Evaluates clinical danger signs and vitals using **WHO IMCI (Integrated Management of Childhood Illness)** and MoHFW Maternal protocols with zero network latency.
- **Color-Coded Triage Output**:
  - 🔴 **RED (Emergency Referral)**: Immediate 1-tap referral dispatch to nearest equipped PHC/CHC/Hospital.
  - 🟡 **YELLOW (Priority Medical Evaluation)**: 24–48 hour scheduled clinic visit & follow-up revisit reminder.
  - 🟢 **GREEN (Routine Home Care)**: Hydration, nutritional guidance, hygiene, and 7-day revisit check.
- **IndexedDB & LocalStorage Sync Queue**: Transparently caches offline screenings and referrals; flushes them to the central server in background batches once connectivity is restored.

### 2. 🗣️ Multilingual Audio & Plain-Language Explanations
- **Web Speech API Audio Playback**: Read-aloud narration in **English**, **हिन्दी (Hindi)**, and **मराठी (Marathi)**.
- **No Medical Jargon for Villagers**: Translates raw numerical scores into simple, compassionate action steps (e.g. *"Your child has fast breathing and low oxygen. Please visit the doctor today."*).
- **Voice Symptom Dictation (STT)**: Frontline workers can speak symptoms in their local language instead of typing on small keyboards.

### 3. 🚨 Community Outbreak Early-Warning & Surveillance Layer
- **Syndromic Anomaly Detection Algorithm**:
  $$\text{Alert Triggered if } (\text{Cases}_{3d} > \text{Baseline}_{avg} \times 2.0) \land (\text{Cases}_{3d} \ge 4)$$
- **Leaflet GIS Spatial Heatmap**: Displays active disease clusters, pulse rings, and village case intensities across 5 monitored rural villages (Rampur, Chandpur, Belur, Shivpuri, Khelgaon).
- **Seasonal Disease Risk Forecasting**: Automatic seasonal advisories (Monsoon: Dengue / Malaria / Diarrhoea; Winter: Acute Respiratory Infections; Summer: Heat & Waterborne).
- **1-Click Live Outbreak Simulation**: Interactive hackathon trigger to inject a live disease wave into a selected village to demonstrate real-time alert triggers on the district map.

### 4. 🏥 Closed-Loop One-Tap Referral & Load Balancing
- **Haversine Distance & Facility Matching**: Real-time facility finder showing distance in kilometers, doctor availability, and bed capacity across Sub-Centres, PHCs, CHCs, and District Hospitals.
- **Capacity Load Balancer**: Warns if the primary facility exceeds 85% bed occupancy and recommends alternative secondary centers.
- **4-Stage Referral Lifecycle**: $\text{SENT} \rightarrow \text{ACCEPTED} \rightarrow \text{PATIENT REACHED} \rightarrow \text{TREATED}$.
- **Physician Feedback Loop**: Doctors send discharge advice and treatment notes directly back to the ASHA worker's app.

### 5. 🤱 Follow-Up Tasks & Deterioration Watch
- **Automated Revisit Schedule**: Generates follow-up tasks for Yellow and Red triage cases.
- **Deterioration Watch Trigger**: Frontline worker check-in (*"Did patient improve?"*); if marked **Worsened**, the system automatically upgrades the patient to RED and dispatches an emergency referral.
- **Gamification & Rewards**: Points, streak counters, and **ASHA Champion** badges (*Outbreak Sentinel, Zero Maternal Delay, Follow-up Hero*).

### 6. 🔒 Privacy, DPDP Act 2023 & Interoperability
- **Informed Consent Screen**: Mandatory spoken & written consent modal prior to clinical data collection under India's **Digital Personal Data Protection (DPDP) Act 2023**.
- **Data Minimization & Anonymization**: Epidemiological dashboards strip all Direct Identifiers (PII).
- **Ayushman Bharat ABDM / FHIR R4 Bundle Generator**: Interoperable with national digital health stacks via standard FHIR JSON exports.
- **Immutable Audit Trail**: Logs every view, referral transition, and triage action.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend API** | Node.js (v24+), Express 4.x (Pure JavaScript, Zero Python) |
| **Frontend UI** | React 18, Vite 6, Tailwind CSS, Lucide Icons |
| **Mapping & GIS** | Leaflet, React-Leaflet, OpenStreetMap |
| **Speech & Audio** | HTML5 Web Speech API (Text-to-Speech & Speech Recognition) |
| **Offline Storage** | IndexedDB / LocalStorage Sync Queue |
| **Interoperability** | HL7 FHIR R4 Standard (ABDM Ayushman Bharat compliant) |
| **Database** | ACID JSON / SQLite Relational Store with synthetic seeder |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+

### 2. Installation
Clone or navigate to the repository folder:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Running the Application

#### Start the Backend API Server:
```bash
# From the backend directory
npm start
# Server runs on http://localhost:5000
```

#### Start the Frontend React App:
```bash
# In a new terminal, from the frontend directory
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 🎯 3-Minute Hackathon Demo Script

1. **Step 1 — Offline Screening**:
   - In the top header, click **"Online 4G"** to switch into **"Offline (Airplane Mode)"**.
   - Select **Aarav Kumar (Child Under 5)** in Rampur.
   - Tap **"Run Protocol Triage"** ➔ Accept DPDP Consent.
   - Observe instant **RED Triage** calculated on-device with zero internet.
2. **Step 2 — Voice Read-Aloud & Explainability**:
   - Switch language to **हिन्दी (Hindi)**.
   - Click **"🔊 बोलकर सुनें"** to hear the native speech synthesis.
   - Expand the **"Why this result?"** card to see the IMCI protocol rules triggered.
3. **Step 3 — One-Tap Referral & Sync**:
   - Tap **"One-Tap Referral"** ➔ Select **Rampur 24x7 PHC** ➔ Send.
   - Switch **Offline Mode OFF** ➔ Click **"Sync Now"** to flush the queue.
   - Switch to **PHC Doctor** view to watch the referral appear in real-time and transition it to **"Accepted" ➔ "Patient Reached" ➔ "Treated"**.
4. **Step 4 — Community Outbreak Alert**:
   - Switch to **Surveillance** view.
   - Click **"⚡ Simulate Outbreak Spike"** to inject 10 diarrhoea cases into Rampur.
   - Watch the **GIS Map pulse RED** and the automated cluster detection alert fire at **3.2x baseline anomaly**.
   - Click **"FHIR R4"** to view the Ayushman Bharat standard bundle.

---

## ⚖️ Responsible AI & Clinical Disclaimer
*GramSaathi is a clinical decision support system designed to assist accredited frontline healthcare workers and registered medical officers. It does not provide medical diagnoses and should always be used in conjunction with qualified professional clinical judgment.*
