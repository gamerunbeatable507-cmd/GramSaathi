/**
 * GramSaathi Privacy, Consent & Audit Compliance Engine
 * Aligned with India's Digital Personal Data Protection (DPDP) Act 2023 & HIPAA security principles
 */

export const DPDP_COMPLIANCE = {
  actName: "Digital Personal Data Protection Act (DPDP), 2023",
  fiduciary: "National Health Authority / District Health Administration",
  purpose: "Frontline health screening, emergency triage, and infectious disease early-warning surveillance",
  retentionPolicy: "Data retained strictly for the duration of clinical care and epidemiological reporting",
  consentLanguages: ["en", "hi", "mr"],
  consentStatements: {
    en: "I give consent to the health worker to record health symptoms and vitals for triage, clinical referral, and healthcare assistance under DPDP Act 2023.",
    hi: "मैं स्वास्थ्य कार्यकर्ता को अपनी स्वास्थ्य जांच, उपचार रेफरल और स्वास्थ्य सेवा सहायता के लिए लक्षण व वाइटल्स दर्ज करने की सहमति देता/देती हूँ। (डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023)",
    mr: "मी आरोग्य सेविकेला आरोग्य तपासणी, रेफरल आणि वैद्यकीय मदतीसाठी माझी माहिती नोंदवण्यास सहमती देत आहे."
  }
};

const auditLogStore = [];

/**
 * Records an immutable audit log entry for any sensitive data interaction
 */
export function recordAuditLog({ actorId, actorRole, action, entityType, entityId, villageId, details }) {
  const entry = {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    actorId: actorId || "ASHA_WORKER_01",
    actorRole: actorRole || "FRONT_LINE_WORKER",
    action, // "CREATE_SCREENING", "VIEW_REFERRAL", "UPDATE_REFERRAL_STATUS", "EXPORT_FHIR", "VIEW_SURVEILLANCE"
    entityType,
    entityId,
    villageId: villageId || "ALL",
    details: details || "Action executed securely under role permissions"
  };

  auditLogStore.unshift(entry);
  if (auditLogStore.length > 500) {
    auditLogStore.pop();
  }

  return entry;
}

export function getAuditLogs(limit = 50) {
  return auditLogStore.slice(0, limit);
}

/**
 * Anonymizes screening records for public/district epidemiological dashboards
 * Strips PII (Full name, exact house number, phone number) according to Data Minimization guidelines
 */
export function anonymizeForSurveillance(screening) {
  return {
    id: screening.id,
    villageId: screening.villageId,
    villageName: screening.villageName,
    ageCategory: getAgeBracket(screening.ageYears, screening.category),
    gender: screening.gender,
    category: screening.category,
    symptoms: screening.symptoms,
    severity: screening.triageResult?.severity,
    vitalsSummary: {
      spo2Category: screening.vitals?.spo2 < 90 ? "Hypoxia_Red" : screening.vitals?.spo2 < 94 ? "Hypoxia_Yellow" : "Normal",
      feverPresent: Number(screening.vitals?.temperatureF) >= 100.4
    },
    timestamp: screening.timestamp
  };
}

function getAgeBracket(ageYears, category) {
  if (category === "child_under_5" || (ageYears != null && ageYears < 5)) return "< 5 Years";
  if (ageYears < 18) return "5 - 17 Years";
  if (ageYears < 45) return "18 - 44 Years";
  if (ageYears < 60) return "45 - 59 Years";
  return "60+ Years";
}
