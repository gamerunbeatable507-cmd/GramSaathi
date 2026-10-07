/**
 * Client-Side Offline Triage Engine
 * Fully autonomous on-device decision support logic based on WHO IMCI and Maternal Danger Signs
 */

export const DANGER_SIGNS_LIST = {
  child_under_5: [
    { id: "ch_unable_feed", label: "Unable to drink or breastfeed", severity: "RED", icon: "🍼" },
    { id: "ch_vomit_all", label: "Vomiting everything consumed", severity: "RED", icon: "🤢" },
    { id: "ch_convulsions", label: "Convulsions / seizures during illness", severity: "RED", icon: "⚡" },
    { id: "ch_lethargic", label: "Abnormally lethargic or unconscious", severity: "RED", icon: "😴" },
    { id: "ch_chest_indrawing", label: "Chest indrawing (subcostal retraction)", severity: "RED", icon: "🫁" },
    { id: "ch_stridor", label: "Harsh stridor sound while resting", severity: "RED", icon: "🔊" },
    { id: "ch_sunken_eyes_skin_pinch", label: "Sunken eyes & skin pinch goes back very slowly", severity: "RED", icon: "💧" },
    { id: "ch_persistent_diarrhoea", label: "Diarrhoea lasting >= 14 days", severity: "YELLOW", icon: "🚽" },
    { id: "ch_fever_rash", label: "Fever with generalized skin rash", severity: "YELLOW", icon: "🌡️" }
  ],
  maternal: [
    { id: "mat_bleed", label: "Vaginal bleeding (any trimester)", severity: "RED", icon: "🩸" },
    { id: "mat_headache_vision", label: "Severe headache, blurred vision, epigastric pain", severity: "RED", icon: "👁️" },
    { id: "mat_convulsions", label: "Convulsions or loss of consciousness", severity: "RED", icon: "⚡" },
    { id: "mat_fever_discharge", label: "High fever with foul-smelling discharge", severity: "RED", icon: "🌡️" },
    { id: "mat_reduced_movement", label: "Decreased or absent fetal movements", severity: "RED", icon: "🤰" },
    { id: "mat_leaking_water", label: "Water broke before due date (PROM)", severity: "RED", icon: "💧" },
    { id: "mat_swelling_severe", label: "Puffy face & severe hand swelling", severity: "YELLOW", icon: "⚠️" }
  ],
  adult: [
    { id: "ad_chest_pain", label: "Crushing chest pain / radiating to left arm", severity: "RED", icon: "💔" },
    { id: "ad_shortness_breath", label: "Severe breathlessness / unable to talk", severity: "RED", icon: "🫁" },
    { id: "ad_stroke_signs", label: "Face droop, arm weakness, slurred speech (FAST)", severity: "RED", icon: "🧠" },
    { id: "ad_stiff_neck_fever", label: "High fever with stiff neck & light sensitivity", severity: "RED", icon: "🌡️" },
    { id: "ad_blood_cough", label: "Coughing up fresh blood", severity: "RED", icon: "🩸" },
    { id: "ad_tb_cough_chronic", label: "Cough > 2 weeks with night sweats & weight loss", severity: "YELLOW", icon: "😷" },
    { id: "ad_persistent_diarrhoea_vomit", label: "Frequent watery diarrhoea with intense thirst", severity: "YELLOW", icon: "💧" }
  ],
  general: [
    { id: "gen_high_fever", label: "High fever lasting > 3 days", severity: "YELLOW", icon: "🌡️" },
    { id: "gen_severe_pain", label: "Severe unmanageable abdominal or body pain", severity: "YELLOW", icon: "⚡" },
    { id: "gen_dizziness", label: "Extreme dizziness or fainting spell", severity: "YELLOW", icon: "😵" },
    { id: "gen_rash", label: "Sudden spreading itchy skin rash", severity: "YELLOW", icon: "🔴" }
  ]
};

export function evaluateClientTriage(data) {
  const {
    category = "general",
    ageYears = 30,
    ageMonths = null,
    symptoms = [],
    vitals = {}
  } = data;

  const redFlags = [];
  const yellowFlags = [];
  const normalObservations = [];

  // 1. Evaluate SpO2
  if (vitals.spo2) {
    const spo2 = Number(vitals.spo2);
    if (spo2 < 90) {
      redFlags.push({
        param: "SpO2 Oxygen",
        value: `${spo2}%`,
        reason: "Critical Hypoxia (<90%). Severe respiratory failure danger."
      });
    } else if (spo2 < 94) {
      yellowFlags.push({
        param: "SpO2 Oxygen",
        value: `${spo2}%`,
        reason: "Mild Hypoxia (90-93%). Requires medical checkup."
      });
    } else {
      normalObservations.push(`SpO2 normal (${spo2}%)`);
    }
  }

  // 2. Evaluate Temperature
  if (vitals.temperatureF) {
    const temp = Number(vitals.temperatureF);
    if (temp >= 103.5) {
      redFlags.push({
        param: "Temperature",
        value: `${temp}°F`,
        reason: "Severe Hyperpyrexia (>=103.5°F). High risk of convulsions or sepsis."
      });
    } else if (temp >= 100.4) {
      yellowFlags.push({
        param: "Temperature",
        value: `${temp}°F`,
        reason: `Elevated Fever (${temp}°F). Infection monitoring required.`
      });
    } else if (temp < 95.0) {
      redFlags.push({
        param: "Temperature",
        value: `${temp}°F`,
        reason: "Hypothermia (<95°F). Immediate thermal stabilization required."
      });
    } else {
      normalObservations.push(`Temperature normal (${temp}°F)`);
    }
  }

  // 3. Evaluate Blood Pressure
  if (vitals.systolicBP && vitals.diastolicBP) {
    const sys = Number(vitals.systolicBP);
    const dia = Number(vitals.diastolicBP);
    if (sys >= 160 || dia >= 100) {
      redFlags.push({
        param: "Blood Pressure",
        value: `${sys}/${dia} mmHg`,
        reason: "Hypertensive Crisis (>=160/100 mmHg). Risk of stroke or eclampsia."
      });
    } else if (sys < 90) {
      redFlags.push({
        param: "Blood Pressure",
        value: `${sys}/${dia} mmHg`,
        reason: "Severe Hypotension (<90 mmHg). Shock or severe dehydration."
      });
    } else if (sys >= 140 || dia >= 90) {
      yellowFlags.push({
        param: "Blood Pressure",
        value: `${sys}/${dia} mmHg`,
        reason: "Stage 2 Hypertension. Doctor review needed."
      });
    } else {
      normalObservations.push(`Blood Pressure normal (${sys}/${dia} mmHg)`);
    }
  }

  // 4. Evaluate Blood Sugar
  if (vitals.bloodSugar) {
    const sugar = Number(vitals.bloodSugar);
    if (sugar < 60) {
      redFlags.push({
        param: "Blood Sugar",
        value: `${sugar} mg/dL`,
        reason: "Severe Hypoglycemia (<60 mg/dL). Immediate glucose/dextrose required."
      });
    } else if (sugar >= 300) {
      redFlags.push({
        param: "Blood Sugar",
        value: `${sugar} mg/dL`,
        reason: "Severe Hyperglycemia (>=300 mg/dL). Ketoacidosis risk."
      });
    } else if (sugar >= 200) {
      yellowFlags.push({
        param: "Blood Sugar",
        value: `${sugar} mg/dL`,
        reason: "Elevated Glycemia (>=200 mg/dL). Needs diabetes management."
      });
    }
  }

  // 5. Child MUAC
  if (category === "child_under_5" && vitals.muacCm) {
    const muac = Number(vitals.muacCm);
    if (muac < 11.5) {
      redFlags.push({
        param: "Child MUAC",
        value: `${muac} cm (Red Band)`,
        reason: "Severe Acute Malnutrition (SAM < 11.5 cm). Nutrition Rehabilitation Centre (NRC) referral needed."
      });
    } else if (muac < 12.5) {
      yellowFlags.push({
        param: "Child MUAC",
        value: `${muac} cm (Yellow Band)`,
        reason: "Moderate Acute Malnutrition (MAM 11.5-12.5 cm). Requires supplementary feeding."
      });
    } else {
      normalObservations.push(`MUAC normal nutrition (${muac} cm)`);
    }
  }

  // 6. Child Fast Breathing
  if (category === "child_under_5" && vitals.respiratoryRate) {
    const rr = Number(vitals.respiratoryRate);
    const months = ageMonths || (ageYears * 12);
    const threshold = months < 2 ? 60 : months < 12 ? 50 : 40;
    if (rr > threshold) {
      redFlags.push({
        param: "Respiratory Rate",
        value: `${rr} bpm`,
        reason: `Fast breathing for age (> ${threshold} bpm). IMCI indicator for Pneumonia.`
      });
    }
  }

  // 7. Check Symptom Checklist against Danger Signs
  const categoryDangerSigns = DANGER_SIGNS_LIST[category] || DANGER_SIGNS_LIST.general;
  for (const symId of symptoms) {
    const found = categoryDangerSigns.find(d => d.id === symId || d.label.toLowerCase().includes(String(symId).toLowerCase()));
    if (found) {
      if (found.severity === "RED") {
        redFlags.push({
          param: "Danger Sign",
          value: found.label,
          reason: `Critical clinical danger sign: ${found.label}`
        });
      } else if (found.severity === "YELLOW") {
        yellowFlags.push({
          param: "Warning Sign",
          value: found.label,
          reason: `Moderate warning sign: ${found.label}`
        });
      }
    }
  }

  // Final Severity Determination
  let severity = "GREEN";
  let recommendedFacility = "Sub-Centre / Home Monitoring";
  let urgency = "Routine";
  let followupDays = 7;

  if (redFlags.length > 0) {
    severity = "RED";
    recommendedFacility = "Primary Health Centre (PHC) / CHC Emergency";
    urgency = "URGENT_EMERGENCY";
    followupDays = 1;
  } else if (yellowFlags.length > 0) {
    severity = "YELLOW";
    recommendedFacility = "Primary Health Centre (PHC) Medical Officer";
    urgency = "PRIORITY_REFERRAL";
    followupDays = 2;
  }

  // Plain language layperson card
  const plainLanguage = {
    en: {
      headline: severity === "RED" ? "URGENT: Patient needs a doctor immediately today." : severity === "YELLOW" ? "ATTENTION: Patient needs checkup within 24-48 hours." : "NORMAL: No critical danger signs detected.",
      summary: severity === "RED" ? `Critical signs detected (${redFlags.map(f => f.param).join(', ')}). Transport to hospital now.` : severity === "YELLOW" ? `Moderate symptoms noticed (${yellowFlags.map(f => f.param).join(', ')}). Visit the PHC doctor.` : "Patient can recover with rest, safe drinking water and home care.",
      voiceText: severity === "RED" ? "Urgent medical attention required. Please take the patient to the hospital immediately." : severity === "YELLOW" ? "Please visit the health centre doctor within one to two days for a checkup." : "No danger signs detected. Follow regular home care and rest."
    },
    hi: {
      headline: severity === "RED" ? "अति आवश्यक: मरीज़ को आज ही तुरंत डॉक्टर के पास ले जाएं।" : severity === "YELLOW" ? "सावधानी: 24 से 48 घंटे में स्वास्थ्य केंद्र के डॉक्टर को दिखाएं।" : "सामान्य: कोई गंभीर खतरे का लक्षण नहीं है।",
      summary: severity === "RED" ? `गंभीर लक्षण मिले हैं (${redFlags.map(f => f.param).join(', ')})। तुरंत नजदीकी अस्पताल ले जाएं।` : severity === "YELLOW" ? `मध्यम लक्षण दिखे हैं (${yellowFlags.map(f => f.param).join(', ')})। कल डॉक्टर से जांच कराएं।` : "घर पर आराम करें, ओआरएस और साफ पानी पिएं।",
      voiceText: severity === "RED" ? "अति आवश्यक। मरीज़ में गंभीर खतरे के लक्षण हैं। तुरंत अस्पताल ले जाएं।" : severity === "YELLOW" ? "मरीज़ को एक से दो दिन में स्वास्थ्य केंद्र के डॉक्टर को दिखाना आवश्यक है।" : "चिंता की बात नहीं है। घर पर आराम करें और पर्याप्त पानी पिएं।"
    },
    mr: {
      headline: severity === "RED" ? "अति तातडीचे: रुग्णाला आजच ताबडतोब डॉक्टरांकडे न्या." : severity === "YELLOW" ? "लक्ष द्या: 24 ते 48 तासांत डॉक्टरांकडे नेणे आवश्यक आहे." : "सामान्य: कोणताही गंभीर धोका नाही.",
      summary: severity === "RED" ? `धोक्याची लक्षणे आढळली आहेत (${redFlags.map(f => f.param).join(', ')}). त्वरित रुग्णालयात न्या.` : severity === "YELLOW" ? `काही मध्यम लक्षणे आढळली आहेत (${yellowFlags.map(f => f.param).join(', ')}). आरोग्य केंद्रात जा.` : "घरी विश्रांती घ्या आणि पुरेसे पाणी प्या.",
      voiceText: severity === "RED" ? "अति तातडीचे. रुग्णाला तातडीने वैद्यकीय मदतीची गरज आहे. त्वरित रुग्णालयात घेऊन जा." : severity === "YELLOW" ? "रुग्णाला एक-दोन दिवसात प्राथमिक आरोग्य केंद्रात नेऊन तपासणी करून घ्या." : "काळजीचे कारण नाही. घरी विश्रांती घ्या आणि पुरेसे पाणी प्या."
    }
  };

  const actionSteps = severity === "RED" ? [
    "1. Keep patient in comfortable posture (elevate head if breathless).",
    "2. Arrange 108 Emergency Ambulance or village vehicle.",
    "3. Tap 'One-Tap Referral' to alert the receiving PHC doctor in advance.",
    "4. Do NOT give heavy food or oral liquids if drowsy.",
    "5. Re-check SpO2 & Pulse during transit."
  ] : severity === "YELLOW" ? [
    "1. Schedule PHC visit within 24-48 hours.",
    "2. Start Oral Rehydration Salts (ORS) & boiled water.",
    "3. Frontline worker to log a 48h follow-up revisit.",
    "4. If fever rises >102°F or breathlessness develops, alert ASHA immediately."
  ] : [
    "1. Ensure adequate hydration, rest, and nutritious diet.",
    "2. Verify age-appropriate immunizations.",
    "3. Standard 7-day follow-up revisit."
  ];

  return {
    severity,
    urgency,
    followupDays,
    recommendedFacility,
    redFlags,
    yellowFlags,
    normalObservations,
    plainLanguage,
    actionSteps,
    protocolVersion: "2.4.0 (Client On-Device)",
    evaluatedAt: new Date().toISOString()
  };
}
