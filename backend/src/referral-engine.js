/**
 * GramSaathi Referral & Facility Management Engine
 * Calculates GIS distances, load-balances patient intake, and tracks the referral lifecycle
 */

export const HEALTH_FACILITIES = [
  {
    id: "FAC-PHC-01",
    name: "Rampur 24x7 Primary Health Centre",
    type: "PHC",
    tier: "Primary",
    coordinates: { lat: 26.8520, lng: 80.9410 },
    doctorsOnDuty: 2,
    nurseCount: 4,
    totalBeds: 12,
    occupiedBeds: 6,
    services: ["Normal Delivery", "Emergency Triage", "Basic Lab (Hb, Sugar, Malaria)", "Paediatric IMCI", "Oxygen Concentrator"],
    ambulancePhone: "+91-98765-10801",
    officerInCharge: "Dr. Rajesh Verma (Medical Officer)"
  },
  {
    id: "FAC-CHC-02",
    name: "Sharda Nagar Community Health Centre (CHC)",
    type: "CHC",
    tier: "Secondary Referral",
    coordinates: { lat: 26.8850, lng: 80.9900 },
    doctorsOnDuty: 5,
    nurseCount: 12,
    totalBeds: 35,
    occupiedBeds: 24,
    services: ["Emergency C-Section (EmOC)", "Paediatric Stabilization", "X-Ray & Ultrasound", "Blood Storage Unit", "High-Dependency Unit (HDU)"],
    ambulancePhone: "+91-98765-10802",
    officerInCharge: "Dr. Sunita Deshmukh (Surgeon & Supdt)"
  },
  {
    id: "FAC-DH-03",
    name: "District Civil Hospital & Trauma Centre",
    type: "District Hospital",
    tier: "Tertiary Referral",
    coordinates: { lat: 26.8390, lng: 81.0150 },
    doctorsOnDuty: 18,
    nurseCount: 45,
    totalBeds: 150,
    occupiedBeds: 132,
    services: ["NICU / PICU (Newborn ICU)", "ICU & Ventilator", "Advanced Surgery", "Blood Bank", "24x7 CT Scan"],
    ambulancePhone: "+91-98765-10803",
    officerInCharge: "Dr. V. K. Tripathi (Chief Medical Supdt)"
  },
  {
    id: "FAC-HWC-04",
    name: "Belur Ayushman Arogya Mandir (Sub-Centre)",
    type: "HWC-SubCentre",
    tier: "Sub-Centre",
    coordinates: { lat: 26.8200, lng: 80.9100 },
    doctorsOnDuty: 0,
    nurseCount: 2, // CHO & ANM
    totalBeds: 2,
    occupiedBeds: 0,
    services: ["Antenatal Checkups", "Immunization", "NCD Screening", "Teleconsultation via eSanjeevani"],
    ambulancePhone: "+91-98765-10804",
    officerInCharge: "Smt. Kavita Devi (Community Health Officer)"
  }
];

// Haversine formula to calculate accurate great-circle distance in kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Finds and ranks suitable facilities for a patient based on urgency, distance, and real-time load
 */
export function rankFacilitiesForPatient(patientCoords, severity, category) {
  const pLat = patientCoords?.lat || 26.8450;
  const pLng = patientCoords?.lng || 80.9350;

  const results = HEALTH_FACILITIES.map(fac => {
    const distanceKm = calculateDistanceKm(pLat, pLng, fac.coordinates.lat, fac.coordinates.lng);
    const occupancyRate = fac.occupiedBeds / fac.totalBeds;
    const isOvercrowded = occupancyRate >= 0.85;

    let suitabilityScore = 100 - (distanceKm * 3);
    
    // Facility tier matching
    if (severity === "RED") {
      if (fac.type === "CHC" || fac.type === "District Hospital") suitabilityScore += 30;
      if (fac.type === "HWC-SubCentre") suitabilityScore -= 50; // Subcentres cannot handle RED emergencies
    } else if (severity === "YELLOW") {
      if (fac.type === "PHC" || fac.type === "CHC") suitabilityScore += 25;
    } else {
      if (fac.type === "HWC-SubCentre" || fac.type === "PHC") suitabilityScore += 20;
    }

    // Load balancing penalty
    if (isOvercrowded) {
      suitabilityScore -= 20;
    }

    return {
      ...fac,
      distanceKm,
      occupancyRate: Math.round(occupancyRate * 100),
      isOvercrowded,
      suitabilityScore: Math.max(0, Math.round(suitabilityScore)),
      loadBalancingRecommendation: isOvercrowded 
        ? "⚠️ HIGH CAPACITY LOAD (>85% beds full). Secondary CHC suggested if non-critical."
        : "✅ Optimal capacity available."
    };
  });

  // Sort by suitability score descending
  results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  return results;
}
