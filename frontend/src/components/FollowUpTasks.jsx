import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, Flame, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';
import { TRANSLATIONS } from '../services/translations.js';

export function FollowUpTasks({ currentLang = 'en', onEscalation }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [conditionStatus, setConditionStatus] = useState("IMPROVED");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [escalationAlert, setEscalationAlert] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const res = await api.getWorkerTasks();
    if (res.tasks) setTasks(res.tasks);
    if (res.profile) setProfile(res.profile);
  };

  const handleOpenCheckin = (task) => {
    setSelectedTask(task);
    setConditionStatus("IMPROVED");
    setNotes("");
    setEscalationAlert(null);
  };

  const handleSubmitCheckin = async () => {
    if (!selectedTask) return;
    setIsSubmitting(true);

    try {
      const res = await api.checkinWorkerTask(
        selectedTask.id,
        conditionStatus,
        notes,
        { spo2: conditionStatus === "WORSENED" ? 89 : 97 }
      );

      if (res.escalationResult?.autoEscalated) {
        setEscalationAlert(res.escalationResult);
        if (onEscalation) onEscalation();
      } else {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        setSelectedTask(null);
      }

      await loadTasks();
    } catch {
      alert("Error submitting check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 animate-fadeIn">
      
      {/* Gamification & Points Card */}
      {profile && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-2xl shadow-inner">
                👩‍⚕️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">{profile.name}</h2>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Award className="w-3 h-3" /> {profile.level}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Assigned Village: <b>{profile.assignedVillageName}</b></p>
              </div>
            </div>

            {/* Stats Pills */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Screenings</span>
                <span className="text-base font-black text-white">{profile.screeningsCount}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Follow-Up Adherence</span>
                <span className="text-base font-black text-emerald-400">{profile.followupAdherence}%</span>
              </div>
              <div className="bg-amber-500/20 border border-amber-500/30 px-3.5 py-2 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-amber-300 block flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 fill-amber-400 text-amber-400" /> Points
                </span>
                <span className="text-base font-black text-amber-300">{profile.points} pts</span>
              </div>
            </div>
          </div>

          {/* Badges List */}
          <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">Earned Badges:</span>
            {profile.badges.map(b => (
              <div key={b.id} className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs shrink-0" title={b.desc}>
                <span>{b.icon}</span>
                <span className="font-bold text-slate-200">{b.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task List Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t.tasks.title}</h3>
            <p className="text-xs text-slate-500">Automated revisit schedule & deterioration monitoring</p>
          </div>
          <button
            onClick={loadTasks}
            className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 px-3 py-1.5 bg-teal-50 rounded-lg border border-teal-100"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            🎉 All scheduled revisit check-ins completed! Great job.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all ${
                  task.completed 
                    ? 'bg-slate-50/60 border-slate-200 opacity-60' 
                    : task.severity === "RED"
                    ? 'bg-red-50/40 border-red-200'
                    : 'bg-white border-slate-200 hover:border-teal-300 shadow-sm'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      task.completed 
                        ? 'bg-slate-200 text-slate-600'
                        : task.severity === "RED"
                        ? 'bg-red-100 text-red-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {task.completed ? "✓" : task.severity === "RED" ? "🚨" : "⏳"}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{task.patientName}</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.2 rounded ${
                          task.severity === "RED" ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {task.severity}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">({task.villageName})</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{task.reason}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due: <b>{task.dueDate}</b>
                        </span>
                        {task.conditionStatus && (
                          <span>Status: <b>{task.conditionStatus}</b></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!task.completed ? (
                    <button
                      type="button"
                      onClick={() => handleOpenCheckin(task)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      {t.tasks.checkin}
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-in Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Revisit Check-in</h3>
                <p className="text-xs text-slate-500">Patient: <b>{selectedTask.patientName}</b> ({selectedTask.villageName})</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Condition Status Selector */}
            <div className="space-y-3 mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.tasks.patientCondition}
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "IMPROVED", label: t.tasks.improved, color: "border-emerald-500 bg-emerald-50 text-emerald-900", icon: "🟢" },
                  { id: "SAME", label: t.tasks.same, color: "border-amber-500 bg-amber-50 text-amber-900", icon: "🟡" },
                  { id: "WORSENED", label: t.tasks.worsened, color: "border-red-500 bg-red-50 text-red-900", icon: "🔴" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setConditionStatus(opt.id)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      conditionStatus === opt.id
                        ? `${opt.color} ring-2 ring-current font-bold`
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xl mb-1">{opt.icon}</div>
                    <div className="text-[11px] leading-tight">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Deterioration Warning Banner */}
            {conditionStatus === "WORSENED" && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl mb-4 text-xs text-red-900 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-black text-red-700 mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>DETERIORATION WATCH TRIGGER</span>
                </div>
                <p>
                  Marking "Worsened" will <b>auto-escalate this patient from Yellow to Urgent RED Referral</b> and transmit an immediate alert to the Primary Health Centre doctor!
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Observations</label>
              <textarea
                rows={2}
                placeholder="Patient taking ORS, fever resolved, or complains of breathlessness..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Escalation Alert Result */}
            {escalationAlert && (
              <div className="mb-4 p-4 bg-red-600 text-white rounded-2xl animate-fadeIn">
                <div className="font-black text-sm mb-1">{escalationAlert.message}</div>
                <div className="text-xs opacity-90">
                  Referral ID: <b>{escalationAlert.newReferral.id}</b> transmitted to {escalationAlert.newReferral.facilityName}. 108 Ambulance notified.
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="mt-3 w-full py-2 bg-white text-red-700 font-bold text-xs rounded-xl"
                >
                  Close & View Referral
                </button>
              </div>
            )}

            {!escalationAlert && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitCheckin}
                  disabled={isSubmitting}
                  className={`flex-2 py-2.5 px-5 rounded-xl text-white font-bold text-xs shadow-md transition-all ${
                    conditionStatus === "WORSENED"
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Save Check-in (+50 pts)"}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
