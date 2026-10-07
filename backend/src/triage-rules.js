/**
 * GramSaathi Triage Protocol Rules & Danger Sign Specifications
 * Based on WHO IMCI (Integrated Management of Childhood Illness),
 * MoHFW Maternal Danger Sign Guidelines, and Rural Emergency Triage Protocols.
 */

export const TRIAGE_PROTOCOLS = {
  version: "2.4.0",
  lastReviewed: "2026-09-15",
  clinicalReviewer: "Dr. Ananya Sharma, MD Community Medicine (AIIMS)",
  disclaimer: "GramSaathi is a clinical decision support tool for frontline health workers (ASHA/ANM). It does not replace clinical diagnosis by a registered medical practitioner.",
  
  vitalsThresholds: {
    spo2: {
      criticalRed: 90,     // < 90% severe hypoxia emergency
      warningYellow: 94,   // 90-93% moderate hypoxia requiring medical evaluation
      normalMin: 94        // >= 94% normal
    },
    temperatureF: {
      highFeverRed: 103.5, // > 103.5 F hyperpyrexia
      feverYellow: 100.4,  // >= 100.4 F fever
      hypothermiaRed: 95.0 // < 95 F hypothermia
    },
    bloodPressure: {
      systolicCrisisRed: 160,
      diastolicCrisisRed: 100,
      systolicStage2Yellow: 140,
      diastolicStage2Yellow: 90,
      systolicHypotensionRed: 90
    },
    bloodSugarMgDl: {
      severeHypoglycemiaRed: 60,
      hypoglycemiaYellow: 70,
      hyperglycemiaYellow: 200,
      severeHyperglycemiaRed: 300
    },
    childMUAC_cm: {
      samRed: 11.5,        // < 11.5 cm Severe Acute Malnutrition
      mamYellow: 12.5,     // 11.5 - 12.5 cm Moderate Acute Malnutrition
      normalGreen: 12.5    // >= 12.5 cm Normal nutrition
    },
    childRespRateBreathsPerMin: {
      under2Months: 60,
      twoToElevenMonths: 50,
      twelveToFiftyNineMonths: 40
    }
  },

  maternalDangerSigns: [
    { id: "mat_bleed", label: "Vaginal bleeding (any stage)", severity: "RED", prompt: "Immediate referral - hemorrhage/placental risk" },
    { id: "mat_headache_vision", label: "Severe headache, blurred vision, epigastric pain", severity: "RED", prompt: "Suspected severe preeclampsia/eclampsia" },
    { id: "mat_convulsions", label: "Convulsions or loss of consciousness", severity: "RED", prompt: "Eclampsia emergency" },
    { id: "mat_fever_discharge", label: "High fever with foul-smelling vaginal discharge", severity: "RED", prompt: "Suspected puerperal sepsis" },
    { id: "mat_reduced_movement", label: "Reduced or absent fetal movements", severity: "RED", prompt: "Fetal distress risk" },
    { id: "mat_swelling_severe", label: "Severe swelling of face and hands", severity: "YELLOW", prompt: "Hypertension / edema monitoring" },
    { id: "mat_leaking_water", label: "Premature rupture of membranes (water broke early)", severity: "RED", prompt: "Preterm labor / infection risk" }
  ],

  childUnder5DangerSigns: [
    { id: "ch_unable_feed", label: "Unable to drink or breastfeed", severity: "RED", prompt: "Severe general danger sign (IMCI)" },
    { id: "ch_vomit_all", label: "Vomiting everything consumed", severity: "RED", prompt: "Severe general danger sign (IMCI)" },
    { id: "ch_convulsions", label: "Convulsions during present illness", severity: "RED", prompt: "Febrile/neurological emergency" },
    { id: "ch_lethargic", label: "Abnormally sleepy, lethargic or unconscious", severity: "RED", prompt: "Altered mental status emergency" },
    { id: "ch_chest_indrawing", label: "Chest indrawing (subcostal retraction)", severity: "RED", prompt: "Severe pneumonia / respiratory failure" },
    { id: "ch_stridor", label: "Stridor (harsh sound) when calm", severity: "RED", prompt: "Severe upper airway obstruction" },
    { id: "ch_sunken_eyes_skin_pinch", label: "Sunken eyes & skin pinch goes back very slowly (>2 sec)", severity: "RED", prompt: "Severe dehydration shock risk" },
    { id: "ch_persistent_diarrhoea", label: "Diarrhoea lasting >= 14 days", severity: "YELLOW", prompt: "Persistent diarrhoea evaluation" },
    { id: "ch_fever_rash", label: "Fever accompanied by generalized rash", severity: "YELLOW", prompt: "Suspected measles/rubella or viral exanthem" }
  ],

  adultGeneralDangerSigns: [
    { id: "ad_chest_pain", label: "Crushing chest pain or radiating pain to arm/jaw", severity: "RED", prompt: "Acute Coronary Syndrome / Heart attack emergency" },
    { id: "ad_shortness_breath", label: "Severe breathlessness / unable to speak full sentences", severity: "RED", prompt: "Severe respiratory failure" },
    { id: "ad_stroke_signs", label: "Sudden weakness in one side of face/arm/speech slurring (FAST)", severity: "RED", prompt: "Acute Stroke emergency" },
    { id: "ad_stiff_neck_fever", label: "High fever with stiff neck & photophobia", severity: "RED", prompt: "Suspected acute meningitis" },
    { id: "ad_blood_cough", label: "Coughing up blood (Hemoptysis)", severity: "RED", prompt: "TB / pulmonary hemorrhage risk" },
    { id: "ad_tb_cough_chronic", label: "Cough lasting > 2 weeks + fever + night sweats + weight loss", severity: "YELLOW", prompt: "Presumptive Tuberculosis" },
    { id: "ad_persistent_diarrhoea_vomit", label: "Profuse watery diarrhoea (>5 episodes in 24h) + extreme thirst", severity: "YELLOW", prompt: "Cholera / acute gastroenteritis dehydration" }
  ]
};
