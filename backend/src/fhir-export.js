/**
 * FHIR R4 Bundle Generator for GramSaathi
 * Interoperable with Ayushman Bharat Digital Mission (ABDM) / NDHM standards
 */

export function generateFhirBundle(screening, referral = null) {
  const patientId = `pat-${screening.patientId || screening.id}`;
  const encounterId = `enc-${screening.id}`;

  const entries = [
    // 1. FHIR Patient Resource
    {
      fullUrl: `urn:uuid:${patientId}`,
      resource: {
        resourceType: "Patient",
        id: patientId,
        identifier: [
          {
            system: "https://healthid.abdm.gov.in",
            value: screening.abhaId || `ABHA-DEMO-${Math.floor(10000000000000 + Math.random() * 90000000000000)}`
          }
        ],
        name: [
          {
            use: "official",
            text: screening.patientName || "Anonymous Patient"
          }
        ],
        gender: (screening.gender || "unknown").toLowerCase(),
        address: [
          {
            city: screening.villageName,
            state: "Uttar Pradesh",
            country: "India"
          }
        ]
      }
    },
    // 2. FHIR Encounter Resource
    {
      fullUrl: `urn:uuid:${encounterId}`,
      resource: {
        resourceType: "Encounter",
        id: encounterId,
        status: "finished",
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "HH",
          display: "home health"
        },
        subject: {
          reference: `urn:uuid:${patientId}`
        },
        period: {
          start: screening.timestamp || new Date().toISOString()
        },
        priority: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ActPriority",
              code: screening.triageResult?.severity === "RED" ? "EM" : screening.triageResult?.severity === "YELLOW" ? "UR" : "R",
              display: screening.triageResult?.urgency || "Routine"
            }
          ]
        }
      }
    }
  ];

  // 3. FHIR Observation for SpO2
  if (screening.vitals?.spo2) {
    entries.push({
      fullUrl: `urn:uuid:obs-spo2-${screening.id}`,
      resource: {
        resourceType: "Observation",
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "2708-6",
              display: "Oxygen saturation in Arterial blood by Pulse oximetry"
            }
          ]
        },
        subject: { reference: `urn:uuid:${patientId}` },
        valueQuantity: {
          value: Number(screening.vitals.spo2),
          unit: "%",
          system: "http://unitsofmeasure.org",
          code: "%"
        }
      }
    });
  }

  // 4. FHIR Observation for Body Temperature
  if (screening.vitals?.temperatureF) {
    entries.push({
      fullUrl: `urn:uuid:obs-temp-${screening.id}`,
      resource: {
        resourceType: "Observation",
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "8310-5",
              display: "Body temperature"
            }
          ]
        },
        subject: { reference: `urn:uuid:${patientId}` },
        valueQuantity: {
          value: Number(screening.vitals.temperatureF),
          unit: "[degF]",
          system: "http://unitsofmeasure.org",
          code: "[degF]"
        }
      }
    });
  }

  // 5. FHIR ServiceRequest (Referral)
  if (referral || screening.triageResult?.severity !== "GREEN") {
    entries.push({
      fullUrl: `urn:uuid:sr-referral-${screening.id}`,
      resource: {
        resourceType: "ServiceRequest",
        status: "active",
        intent: "order",
        priority: screening.triageResult?.severity === "RED" ? "stat" : "urgent",
        subject: { reference: `urn:uuid:${patientId}` },
        performerType: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "306206005",
              display: "Referral to medical practitioner / PHC"
            }
          ]
        },
        note: [
          {
            text: `Triage Result: ${screening.triageResult?.severity}. Reason: ${(screening.triageResult?.redFlags || []).map(f => f.reason).join("; ")}`
          }
        ]
      }
    });
  }

  return {
    resourceType: "Bundle",
    id: `bundle-gramsaathi-${screening.id}`,
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: entries
  };
}
