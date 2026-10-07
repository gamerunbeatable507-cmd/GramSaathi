/**
 * GramSaathi Early-Warning & Outbreak Surveillance Engine
 * Analyzes village-level screening streams for syndromic cluster anomalies
 */

export const SYNDROMIC_CATEGORIES = {
  DIARRHOEA_WATERBORNE: {
    name: "Acute Diarrhoea & Waterborne",
    keywords: ["diarrhoea", "vomiting", "sunken eyes", "ch_sunken_eyes_skin_pinch", "watery diarrhoea", "cholera"],
    seasonalHigh: ["July", "August", "September", "June"], // Monsoon
    criticalThresholdMultiplier: 2.2,
    minCases: 4,
    actionAdvice: "Inspect community tube wells, test chlorine levels, dispatch ORS & Zinc depot to village sub-centre."
  },
  FEVER_RASH_EXANTHEM: {
    name: "Fever with Rash (Measles / Dengue / Chikungunya)",
    keywords: ["fever", "rash", "ch_fever_rash", "petechiae", "joint pain", "dengue"],
    seasonalHigh: ["August", "September", "October", "November"],
    criticalThresholdMultiplier: 2.0,
    minCases: 3,
    actionAdvice: "Conduct house-to-house fever search, check vector breeding containers, verify child MR/Measles immunization records."
  },
  ACUTE_RESPIRATORY: {
    name: "Acute Respiratory Infection (ARI / Pneumonia)",
    keywords: ["cough", "breathlessness", "fast breathing", "ch_chest_indrawing", "ad_shortness_breath", "spo2"],
    seasonalHigh: ["November", "December", "January", "February"], // Winter
    criticalThresholdMultiplier: 2.5,
    minCases: 5,
    actionAdvice: "Stock paediatric amoxicillin, ensure pulse oximeters functional in all ASHA kits, mobilize mobile clinic."
  },
  MATERNAL_COMPLICATIONS: {
    name: "Maternal Acute Complications Cluster",
    keywords: ["mat_bleed", "mat_headache_vision", "mat_convulsions", "preeclampsia"],
    seasonalHigh: [],
    criticalThresholdMultiplier: 1.8,
    minCases: 2,
    actionAdvice: "Audit antenatal checkup register, verify iron-folic acid and calcium distribution, review high-risk pregnancy list."
  }
};

/**
 * Computes outbreak cluster alerts for all villages given the historical and recent screenings
 */
export function detectOutbreakClusters(villages, allScreenings) {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
  const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

  const alerts = [];
  const villageStats = {};

  for (const village of villages) {
    const vScreenings = allScreenings.filter(s => s.villageId === village.id);

    // Screenings in last 3 days
    const recent3d = vScreenings.filter(s => new Date(s.timestamp) >= threeDaysAgo);
    
    // Baseline screenings (prior 11 days of the 14-day window)
    const baselineScreenings = vScreenings.filter(s => {
      const d = new Date(s.timestamp);
      return d >= fourteenDaysAgo && d < threeDaysAgo;
    });

    const baselineDays = 11;
    const baselineDailyAvg = Math.max(0.4, (baselineScreenings.length / baselineDays));
    const baselineExpected3d = baselineDailyAvg * 3;

    villageStats[village.id] = {
      villageName: village.name,
      population: village.population,
      coordinates: village.coordinates,
      totalScreenings: vScreenings.length,
      recent3dCount: recent3d.length,
      redCount3d: recent3d.filter(s => s.triageResult?.severity === "RED").length,
      yellowCount3d: recent3d.filter(s => s.triageResult?.severity === "YELLOW").length,
      baselineExpected3d: Number(baselineExpected3d.toFixed(1)),
      syndromeCounts: {}
    };

    // Analyze by syndrome category
    for (const [syndromeKey, config] of Object.entries(SYNDROMIC_CATEGORIES)) {
      const matchingRecent = recent3d.filter(s => matchesSyndrome(s, config.keywords));
      const countRecent = matchingRecent.length;
      villageStats[village.id].syndromeCounts[syndromeKey] = countRecent;

      const matchingBaseline = baselineScreenings.filter(s => matchesSyndrome(s, config.keywords));
      const baselineSyndromeAvg3d = Math.max(0.3, (matchingBaseline.length / baselineDays) * 3);

      const anomalyRatio = countRecent / baselineSyndromeAvg3d;

      // Detection condition: count exceeds baseline * multiplier and reaches minimum case count
      if (countRecent >= config.minCases && anomalyRatio >= config.criticalThresholdMultiplier) {
        alerts.push({
          id: `ALERT-${village.id}-${syndromeKey}-${Date.now().toString().slice(-4)}`,
          villageId: village.id,
          villageName: village.name,
          coordinates: village.coordinates,
          syndromeKey,
          syndromeName: config.name,
          recentCases3d: countRecent,
          baselineExpected3d: Number(baselineSyndromeAvg3d.toFixed(1)),
          anomalyRatio: Number(anomalyRatio.toFixed(2)),
          severity: countRecent >= (config.minCases * 2) || anomalyRatio >= 3.0 ? "CRITICAL_OUTBREAK" : "ELEVATED_WATCH",
          triggeredAt: new Date().toISOString(),
          recommendedAction: config.actionAdvice,
          affectedDemographics: getDemographicBreakdown(matchingRecent),
          status: "ACTIVE"
        });
      }
    }
  }

  return {
    alerts,
    villageStats,
    evaluatedAt: now.toISOString(),
    totalActiveAlerts: alerts.length
  };
}

function matchesSyndrome(screening, keywords) {
  const syms = (screening.symptoms || []).map(s => String(s).toLowerCase());
  const flags = (screening.triageResult?.redFlags || []).concat(screening.triageResult?.yellowFlags || []);
  const reasons = flags.map(f => `${f.param} ${f.value} ${f.reason}`.toLowerCase()).join(" ");

  return keywords.some(kw => {
    const kwLow = kw.toLowerCase();
    return syms.some(s => s.includes(kwLow)) || reasons.includes(kwLow);
  });
}

function getDemographicBreakdown(screenings) {
  let childrenUnder5 = 0;
  let maternal = 0;
  let adults = 0;

  for (const s of screenings) {
    if (s.category === "child_under_5" || (s.ageYears != null && s.ageYears < 5)) childrenUnder5++;
    else if (s.category === "maternal") maternal++;
    else adults++;
  }

  return { childrenUnder5, maternal, adults, total: screenings.length };
}

/**
 * Returns seasonal disease advisories based on the current calendar month
 */
export function getSeasonalAdvisories() {
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const advisories = [];

  for (const [key, conf] of Object.entries(SYNDROMIC_CATEGORIES)) {
    const isPeak = conf.seasonalHigh.includes(currentMonth);
    advisories.push({
      syndromeKey: key,
      syndromeName: conf.name,
      isPeakSeason: isPeak,
      peakMonths: conf.seasonalHigh,
      advisoryNote: isPeak 
        ? `⚠️ PEAK SEASON (${currentMonth}): Enhanced surveillance active. Expect higher incidence.`
        : `Normal baseline season. Standard monitoring.`
    });
  }

  return {
    currentMonth,
    advisories
  };
}
