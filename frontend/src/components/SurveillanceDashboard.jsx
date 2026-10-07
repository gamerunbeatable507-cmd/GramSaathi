import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Circle 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  ShieldAlert, 
  TrendingUp, 
  FileCode, 
  Download, 
  Zap, 
  Layers, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Eye,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';
import { TRANSLATIONS } from '../services/translations.js';

// Fix leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons for alerts
const createCustomIcon = (isAlert, isRed) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="
      background-color: ${isAlert ? '#dc2626' : isRed ? '#ea580c' : '#0d9488'};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 800;
    ">${isAlert ? '🚨' : '📍'}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

export function SurveillanceDashboard({ currentLang = 'en' }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVillageId, setSelectedVillageId] = useState("VIL-01");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simToast, setSimToast] = useState(null);
  const [fhirModalBundle, setFhirModalBundle] = useState(null);
  const [selectedTab, setSelectedTab] = useState("map"); // "map" | "syndromes" | "data"

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.getSurveillanceDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error("Error loading surveillance:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateOutbreak = async (villageId = "VIL-01") => {
    setIsSimulating(true);
    try {
      const res = await api.simulateOutbreak(villageId, 8);
      setSimToast(res.message);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
      await loadDashboard();
      setTimeout(() => setSimToast(null), 6000);
    } catch {
      alert("Error triggering outbreak simulation");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleViewFhir = async (screeningId = "SCR-5001") => {
    try {
      const bundle = await api.getFhirBundle(screeningId);
      setFhirModalBundle(bundle);
    } catch {
      alert("Could not load FHIR bundle");
    }
  };

  const handleDownloadCsv = () => {
    if (!dashboardData?.recentAnonymizedScreenings) return;
    const items = dashboardData.recentAnonymizedScreenings;
    const headers = ["Screening ID", "Village", "Age Category", "Gender", "Severity", "Timestamp"];
    const rows = items.map(s => [s.id, s.villageName, s.ageCategory, s.gender, s.severity, s.timestamp]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gramsaathi_epidemiology_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading District Surveillance Map...
      </div>
    );
  }

  const { summary, outbreakAnalysis, seasonalInfo, recentAnonymizedScreenings } = dashboardData;
  const alerts = outbreakAnalysis?.alerts || [];
  const villageStats = outbreakAnalysis?.villageStats || {};

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-fadeIn">
      
      {/* Top Banner & Quick Trigger */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{t.surveillance.title}</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                  {summary.activeAlertsCount} Active Cluster Alerts
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.surveillance.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Outbreak Simulation Trigger Button */}
            <button
              onClick={() => handleSimulateOutbreak("VIL-01")}
              disabled={isSimulating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              title="Click to simulate sudden outbreak spike in Rampur"
            >
              <Zap className={`w-4 h-4 fill-slate-950 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? "Simulating..." : t.surveillance.triggerSimOutbreak}</span>
            </button>

            {/* FHIR & CSV Export */}
            <button
              onClick={() => handleViewFhir(recentAnonymizedScreenings[0]?.id || "SCR-5001")}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
            >
              <FileCode className="w-4 h-4 text-teal-400" />
              <span>FHIR R4</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Simulation toast */}
        {simToast && (
          <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-semibold animate-fadeIn">
            ⚡ {simToast}
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Screenings</span>
            <span className="text-xl font-black text-white">{summary.totalScreenings}</span>
          </div>
          <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/30">
            <span className="text-[10px] uppercase font-bold text-red-300 block">Urgent RED Triages</span>
            <span className="text-xl font-black text-red-400">{summary.redScreenings}</span>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Yellow Warnings</span>
            <span className="text-xl font-black text-amber-400">{summary.yellowScreenings}</span>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/30">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Green Mild Care</span>
            <span className="text-xl font-black text-emerald-400">{summary.greenScreenings}</span>
          </div>
          <div className="bg-teal-500/10 p-3 rounded-2xl border border-teal-500/30">
            <span className="text-[10px] uppercase font-bold text-teal-300 block">Referral Loop Closed</span>
            <span className="text-xl font-black text-teal-400">{summary.referralCompletionRate}%</span>
          </div>
        </div>
      </div>

      {/* Active Outbreak Cluster Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Active Outbreak Cluster Alerts ({alerts.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 text-red-950 shadow-sm animate-pulse-ring relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">🚨</span>
                      <h4 className="font-extrabold text-sm text-red-900">
                        {alert.villageName}: {alert.syndromeName}
                      </h4>
                    </div>
                    <p className="text-xs text-red-800 font-medium mt-1">
                      Detected <b>{alert.recentCases3d} cases</b> in 3 days vs expected baseline <b>{alert.baselineExpected3d}</b> ({alert.anomalyRatio}x threshold surge).
                    </p>
                    <div className="mt-2 text-[11px] bg-red-100 p-2 rounded-lg text-red-900 font-semibold border border-red-200">
                      💡 <b>Action Directive: </b>{alert.recommendedAction}
                    </div>
                  </div>

                  <span className="text-[10px] font-black uppercase px-2 py-1 bg-red-600 text-white rounded-lg shrink-0">
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GIS Leaflet Map & Village List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Leaflet Map (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-3 px-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>{t.surveillance.mapTitle}</span>
              </h3>
              <p className="text-[11px] text-slate-500">Live syndromic cluster intensity & village coordinates</p>
            </div>
            
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Alert Cluster</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> Normal Baseline</span>
            </div>
          </div>

          {/* Leaflet Map */}
          <div className="flex-1 w-full rounded-2xl overflow-hidden relative border border-slate-100">
            <MapContainer
              center={[26.8520, 80.9500]}
              zoom={12}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Village Markers & Heat Circles */}
              {Object.entries(villageStats).map(([vId, v]) => {
                const isAlertVillage = alerts.some(a => a.villageId === vId);
                const hasRedCases = v.redCount3d > 0;
                
                return (
                  <React.Fragment key={vId}>
                    {/* Pulsing outbreak radius circle */}
                    {isAlertVillage && (
                      <Circle
                        center={[v.coordinates.lat, v.coordinates.lng]}
                        radius={1500}
                        pathOptions={{
                          color: '#dc2626',
                          fillColor: '#ef4444',
                          fillOpacity: 0.35,
                          weight: 2
                        }}
                      />
                    )}

                    <Marker
                      position={[v.coordinates.lat, v.coordinates.lng]}
                      icon={createCustomIcon(isAlertVillage, hasRedCases)}
                    >
                      <Popup>
                        <div className="p-1 text-xs">
                          <h4 className="font-extrabold text-slate-900">{v.villageName}</h4>
                          <p className="text-slate-600">Population: <b>{v.population}</b></p>
                          <p className="text-slate-600">Screenings (3d): <b>{v.recent3dCount}</b></p>
                          <p className="text-red-600 font-bold">Red Triages: <b>{v.redCount3d}</b></p>
                          {isAlertVillage && (
                            <div className="mt-1 text-[10px] font-bold text-red-700 bg-red-50 p-1 rounded">
                              🚨 Active Outbreak Cluster
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Village Risk Breakdown (1 col) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider text-xs">
            Village Anomaly Index
          </h3>

          <div className="space-y-2.5">
            {Object.entries(villageStats).map(([vId, v]) => {
              const isAlert = alerts.some(a => a.villageId === vId);
              return (
                <div
                  key={vId}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isAlert 
                      ? 'bg-red-50/70 border-red-300 ring-1 ring-red-400/30' 
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{v.villageName}</span>
                        {isAlert && <span className="text-xs">🚨</span>}
                      </div>
                      <span className="text-[10px] text-slate-500">Pop: {v.population} • Total: {v.totalScreenings}</span>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isAlert ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isAlert ? "OUTBREAK" : "BASELINE"}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span>3-Day Cases: <b>{v.recent3dCount}</b></span>
                    <span className="text-red-600 font-bold">Red: <b>{v.redCount3d}</b></span>
                    <span>Expected: <b>{v.baselineExpected3d}</b></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seasonal Advisory Card */}
          <div className="mt-4 p-3.5 bg-teal-50 border border-teal-200 rounded-2xl">
            <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span>Seasonal Risk Watch ({seasonalInfo.currentMonth})</span>
            </h4>
            <p className="text-[11px] text-teal-800 leading-snug">
              {seasonalInfo.advisories[0]?.advisoryNote || "Seasonal surveillance active."}
            </p>
          </div>
        </div>

      </div>

      {/* DPDP Act Anonymized Data Privacy Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>DPDP Act 2023 Compliant Epidemiological Stream</span>
            </h3>
            <p className="text-xs text-slate-500">{t.surveillance.privacyNotice}</p>
          </div>

          <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
            🔒 PII Stripped & Encrypted
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-extrabold border-b border-slate-200">
                <th className="py-2.5 px-3">Screening ID</th>
                <th className="py-2.5 px-3">Village</th>
                <th className="py-2.5 px-3">Age Bracket</th>
                <th className="py-2.5 px-3">Gender</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Triage</th>
                <th className="py-2.5 px-3">Reported At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAnonymizedScreenings.slice(0, 8).map(sc => (
                <tr key={sc.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono text-slate-700">{sc.id}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{sc.villageName}</td>
                  <td className="py-2.5 px-3 text-slate-600">{sc.ageCategory}</td>
                  <td className="py-2.5 px-3 text-slate-600">{sc.gender}</td>
                  <td className="py-2.5 px-3 text-slate-600">{sc.category}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      sc.severity === "RED" ? 'bg-red-100 text-red-700' : sc.severity === "YELLOW" ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {sc.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{new Date(sc.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FHIR R4 Bundle Modal */}
      {fhirModalBundle && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm text-white">Ayushman Bharat ABDM - FHIR R4 JSON Bundle</h3>
              </div>
              <button
                onClick={() => setFhirModalBundle(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 bg-slate-950 rounded-2xl font-mono text-[11px] text-teal-300 border border-slate-800">
              <pre>{JSON.stringify(fhirModalBundle, null, 2)}</pre>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFhirModalBundle(null)}
                className="px-4 py-2 bg-teal-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Close Viewer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
