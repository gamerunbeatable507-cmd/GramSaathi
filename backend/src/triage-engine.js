import { TRIAGE_PROTOCOLS } from './triage-rules.js';

/**
 * Triage Evaluation Engine
 * Evaluates patient symptoms and vitals offline or online
 * Outputs color triage (RED, YELLOW, GREEN), clinical justifications, and plain language explanations
 */
export function evaluateTriage(data) {
  const {
    category = "general", // "child_under_5", "maternal", "adult", "general"
    ageYears = 30,
    ageMonths = null,
    symptoms = [],
    vitals = {},
    pregnancyWeeks = null
  } = data;

  const redFlags = [];
  const yellowFlags = [];
  const normalObservations = [];
  const explanations = [];

  const t = TRIAGE_PROTOCOLS.vitalsThresholds;

  // 1. Evaluate Vitals
  // SpO2
  if (vitals.spo2 != null && vitals.spo2 !== "") {
    const spo2 = Number(vitals.spo2);
    if (spo2 < t.spo2.criticalRed) {
      redFlags.push({
        param: "SpO2",
        value: `${spo2}%`,
        reason: `Critically low oxygen saturation (<${t.spo2.criticalRed}%). High risk of severe respiratory failure.`
      });
    } else if (spo2 < t.spo2.warningYellow) {
      yellowFlags.push({
        param: "SpO2",
        value: `${spo2}%`,
        reason: `Mild-to-moderate hypoxia (${spo2}%). Requires medical evaluation and oxygen monitoring.`
      });
    } else {
      normalObservations.push(`SpO2 normal (${spo2}%)`);
    }
  }

  // Temperature
  if (vitals.temperatureF != null && vitals.temperatureF !== "") {
    const temp = Number(vitals.temperatureF);
    if (temp >= t.temperatureF.highFeverRed) {
      redFlags.push({
        param: "Temperature",
        value: `${temp}°F`,
        reason: `Hyperpyrexia (severe high fever >= ${t.temperatureF.highFeverRed}°F). Risk of febrile convulsions or sepsis.`
      });
    } else if (temp >= t.temperatureF.feverYellow) {
      yellowFlags.push({
        param: "Temperature",
        value: `${temp}°F`,
        reason: `Elevated body temperature (${temp}°F). Suspected acute infection.`
      });
    } else if (temp < t.temperatureF.hypothermiaRed) {
      redFlags.push({
        param: "Temperature",
        value: `${temp}°F`,
        reason: `Hypothermia (< ${t.temperatureF.hypothermiaRed}°F). Critical warning especially for infants.`
      });
    } else {
      normalObservations.push(`Temperature normal (${temp}°F)`);
    }
  }

  // Blood Pressure
  if (vitals.systolicBP != null && vitals.diastolicBP != null && vitals.systolicBP !== "") {
    const sys = Number(vitals.systolicBP);
    const dia = Number(vitals.diastolicBP);
    if (sys >= t.bloodPressure.systolicCrisisRed || dia >= t.bloodPressure.diastolicCrisisRed) {
      redFlags.push({
        param: "Blood Pressure",
        value: `${sys}/${dia} mmHg`,
        reason: `Hypertensive Crisis (BP >= ${t.bloodPressure.systolicCrisisRed}/${t.bloodPressure.diastolicCrisisRed} mmHg). Risk of stroke, eclampsia or organ damage.`
      });
    } else if (sys < t.bloodPressure.systolicHypotensionRed) {
      redFlags.push({
        param: "Blood Pressure",
        value: `${sys}/${dia} mmHg`,
        reason: `Severe Hypotension (Systolic < ${t.bloodPressure.systolicHypotensionRed} mmHg). Risk of circulatory shock or severe dehydration.`
      });
    } else if (sys >= t.bloodPressure.systolicStage2Yellow || dia >= t.bloodPressure.diastolicStage2Yellow) {
      yellowFlags.push({
        param: "Blood Pressure",
        value: `${sys}/${dia} mmHg`,
        reason: `Stage 2 Hypertension (${sys}/${dia} mmHg). Needs doctor review and medication management.`
      });
    } else {
      normalObservations.push(`Blood Pressure normal (${sys}/${dia} mmHg)`);
    }
  }

  // Blood Sugar
  if (vitals.bloodSugar != null && vitals.bloodSugar !== "") {
    const sugar = Number(vitals.bloodSugar);
    if (sugar < t.bloodSugarMgDl.severeHypoglycemiaRed) {
      redFlags.push({
        param: "Blood Sugar",
        value: `${sugar} mg/dL`,
        reason: `Severe Hypoglycemia (< ${t.bloodSugarMgDl.severeHypoglycemiaRed} mg/dL). Immediate glucose/IV dextrose required.`
      });
    } else if (sugar >= t.bloodSugarMgDl.severeHyperglycemiaRed) {
      redFlags.push({
        param: "Blood Sugar",
        value: `${sugar} mg/dL`,
        reason: `Severe Hyperglycemia (>= ${t.bloodSugarMgDl.severeHyperglycemiaRed} mg/dL). Diabetic ketoacidosis / hyperosmolar risk.`
      });
    } else if (sugar >= t.bloodSugarMgDl.hyperglycemiaYellow) {
      yellowFlags.push({
        param: "Blood Sugar",
        value: `${sugar} mg/dL`,
        reason: `Elevated Blood Sugar (${sugar} mg/dL). Requires PHC diabetic check.`
      });
    }
  }

  // Child MUAC
  if (category === "child_under_5" && vitals.muacCm != null && vitals.muacCm !== "") {
    const muac = Number(vitals.muacCm);
    if (muac < t.childMUAC_cm.samRed) {
      redFlags.push({
        param: "MUAC",
        value: `${muac} cm (Red Band)`,
        reason: `Severe Acute Malnutrition (MUAC < 11.5 cm). Requires immediate Nutrition Rehabilitation Centre (NRC) referral.`
      });
    } else if (muac < t.childMUAC_cm.mamYellow) {
      yellowFlags.push({
        param: "MUAC",
        value: `${muac} cm (Yellow Band)`,
        reason: `Moderate Acute Malnutrition (MUAC 11.5 - 12.5 cm). Requires targeted supplemental nutrition.`
      });
    } else {
      normalObservations.push(`MUAC normal nutrition (${muac} cm)`);
    }
  }

  // Child Respiratory Rate
  if (category === "child_under_5" && vitals.respiratoryRate != null && vitals.respiratoryRate !== "") {
    const rr = Number(vitals.respiratoryRate);
    const months = ageMonths || (ageYears * 12);
    let threshold = 40;
    if (months < 2) threshold = t.childRespRateBreathsPerMin.under2Months;
    else if (months < 12) threshold = t.childRespRateBreathsPerMin.twoToElevenMonths;
    else threshold = t.childRespRateBreathsPerMin.twelveToFiftyNineMonths;

    if (rr > threshold) {
      redFlags.push({
        param: "Respiratory Rate",
        value: `${rr} breaths/min`,
        reason: `Fast Breathing for age (Threshold: >${threshold} bpm). IMCI indicator for Pneumonia.`
      });
    }
  }

  // 2. Check Specific Danger Signs against protocols
  const allDangerSigns = [
    ...TRIAGE_PROTOCOLS.maternalDangerSigns,
    ...TRIAGE_PROTOCOLS.childUnder5DangerSigns,
    ...TRIAGE_PROTOCOLS.adultGeneralDangerSigns
  ];

  for (const sym of symptoms) {
    const match = allDangerSigns.find(ds => ds.id === sym || ds.label.toLowerCase().includes(String(sym).toLowerCase()));
    if (match) {
      if (match.severity === "RED") {
        redFlags.push({
          param: "Danger Sign",
          value: match.label,
          reason: match.prompt
        });
      } else if (match.severity === "YELLOW") {
        yellowFlags.push({
          param: "Warning Sign",
          value: match.label,
          reason: match.prompt
        });
      }
    }
  }

  // 3. Determine Overall Severity
  let severity = "GREEN";
  let recommendedFacility = "Sub-Centre / Home Monitoring";
  let urgency = "Routine";
  let followupDays = 7;

  if (redFlags.length > 0) {
    severity = "RED";
    recommendedFacility = "Primary Health Centre (PHC) / Community Health Centre (CHC) Emergency";
    urgency = "URGENT_EMERGENCY (Within 1-2 hours)";
    followupDays = 1;
  } else if (yellowFlags.length > 0) {
    severity = "YELLOW";
    recommendedFacility = "Primary Health Centre (PHC) Outpatient / Medical Officer Visit";
    urgency = "PRIORITY_REFERRAL (Within 24-48 hours)";
    followupDays = 2;
  } else {
    severity = "GREEN";
    recommendedFacility = "Home Care & Sub-Centre Monitoring";
    urgency = "ROUTINE_FOLLOWUP";
    followupDays = 7;
  }

  // 4. Generate Multilingual Layperson Plain Language Summaries
  const plainLanguage = generatePlainLanguage(severity, category, redFlags, yellowFlags);

  // 5. Generate Actionable Next Steps
  const actionSteps = generateActionSteps(severity, category, redFlags, yellowFlags);

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
    protocolVersion: TRIAGE_PROTOCOLS.version,
    evaluatedAt: new Date().toISOString()
  };
}

function generatePlainLanguage(severity, category, redFlags, yellowFlags) {
  if (severity === "RED") {
    let keySigns = redFlags.map(f => f.param).join(", ");
    return {
      en: {
        headline: "URGENT: Patient needs a doctor immediately today.",
        summary: `Danger signs detected (${keySigns}). Please transport the patient to the nearest PHC/Hospital right away.`,
        voiceText: "Urgent medical attention required. Please take the patient to the nearest hospital immediately. Danger signs have been detected."
      },
      hi: {
        headline: "अति आवश्यक: मरीज़ को आज ही तुरंत डॉक्टर के पास ले जाएं।",
        summary: `गंभीर लक्षण मिले हैं (${keySigns})। मरीज़ को तुरंत नजदीकी प्राथमिक स्वास्थ्य केंद्र या अस्पताल ले जाएं।`,
        voiceText: "अति आवश्यक। मरीज़ में गंभीर खतरे के लक्षण हैं। कृपया तुरंत नजदीकी अस्पताल या डॉक्टर के पास ले जाएं।"
      },
      mr: {
        headline: "अति तातडीचे: रुग्णाला आजच ताबडतोब डॉक्टरांकडे न्या.",
        summary: `धोक्याची लक्षणे आढळली आहेत (${keySigns}). रुग्णाला लगेच जवळच्या प्राथमिक आरोग्य केंद्रात किंवा रुग्णालयात न्या.`,
        voiceText: "अति तातडीचे. रुग्णाला तातडीने वैद्यकीय मदतीची गरज आहे. कृपया त्वरित जवळच्या रुग्णालयात घेऊन जा."
      }
    };
  }

  if (severity === "YELLOW") {
    let keySigns = yellowFlags.map(f => f.param).join(", ");
    return {
      en: {
        headline: "ATTENTION: Patient needs medical checkup within 24-48 hours.",
        summary: `Mild to moderate symptoms noticed (${keySigns}). Visit the PHC doctor tomorrow for evaluation.`,
        voiceText: "Attention needed. Please visit the Primary Health Centre doctor within one to two days for a checkup."
      },
      hi: {
        headline: "सावधानी: मरीज़ को 24 से 48 घंटे के भीतर डॉक्टर को दिखाना जरूरी है।",
        summary: `मध्यम लक्षण दिखे हैं (${keySigns})। कल प्राथमिक स्वास्थ्य केंद्र जाकर डॉक्टर से जांच कराएं।`,
        voiceText: "मरीज़ को एक से दो दिन के भीतर स्वास्थ्य केंद्र के डॉक्टर को दिखाना आवश्यक है।"
      },
      mr: {
        headline: "लक्ष द्या: रुग्णाला 24 ते 48 तासांत डॉक्टरांकडे नेणे आवश्यक आहे.",
        summary: `काही मध्यम लक्षणे आढळली आहेत (${keySigns}). उद्या आरोग्य केंद्रात जाऊन डॉक्टरांचा सल्ला घ्या.`,
        voiceText: "रुग्णाला एक-दोन दिवसात प्राथमिक आरोग्य केंद्रात नेऊन तपासणी करून घ्या."
      }
    };
  }

  return {
    en: {
      headline: "NORMAL: No critical danger signs detected.",
      summary: "Patient can recover with rest, safe drinking water, and prescribed home care. Revisit if condition worsens.",
      voiceText: "No danger signs detected. Follow regular home care and rest. Call the ASHA worker if symptoms worsen."
    },
    hi: {
      headline: "सामान्य: कोई गंभीर खतरे का लक्षण नहीं है।",
      summary: "मरीज़ घर पर आराम करे, ओआरएस और साफ पानी पिएं। यदि तबीयत बिगड़े तो आशा दीदी को तुरंत बताएं।",
      voiceText: "चिंता की कोई बात नहीं है। घर पर आराम करें और पर्याप्त पानी पिएं।"
    },
    mr: {
      headline: "सामान्य: कोणताही गंभीर धोका नाही.",
      summary: "रुग्णाने घरी विश्रांती घ्यावी आणि स्वच्छ पाणी प्यावे. लक्षणे वाढल्यास आशा कार्यकर्तीशी संपर्क साधावा.",
      voiceText: "काळजीचे कारण नाही. घरी विश्रांती घ्या आणि पुरेसे पाणी प्या."
    }
  };
}

function generateActionSteps(severity, category, redFlags, yellowFlags) {
  if (severity === "RED") {
    return [
      "1. Keep the patient calm and in a comfortable posture (elevate head if breathless).",
      "2. Arrange 108 Emergency Ambulance or immediate village vehicle.",
      "3. Frontline worker to tap 'One-Tap Referral' to alert the receiving PHC doctor in advance.",
      "4. Do NOT give heavy food or oral fluids if patient is drowsy or convulsing.",
      "5. Re-check vitals (SpO2 & Pulse) during transit."
    ];
  }
  if (severity === "YELLOW") {
    return [
      "1. Schedule appointment at the nearest PHC / sub-centre within 24-48 hours.",
      "2. Continue oral rehydration (ORS / clean boiled water) if diarrhoea or fever is present.",
      "3. Frontline worker to log a 48-hour follow-up revisit task.",
      "4. If fever rises >102°F or breathlessness develops, immediately call ASHA worker."
    ];
  }
  return [
    "1. Practice standard hygiene, adequate hydration, and balanced nutrition.",
    "2. If child, ensure age-appropriate immunization is up-to-date.",
    "3. Monitor for fever or cough over the next 3 days.",
    "4. Routine revisit scheduled in 7 days."
  ];
}
