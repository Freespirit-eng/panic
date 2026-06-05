import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, ChevronRight, X, Clock, MapPin,
  Users, AlertTriangle, CheckCircle2, Loader2,
  Tag, FileText, ArrowRight
} from 'lucide-react';
import { commanderApi } from '../services/commanderApi';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../hooks/useToast';
import { Mission, MissionStatus, Incident, SeverityLevel } from '../../shared/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_FLOW: MissionStatus[] = [
  'Awaiting Assignment', 'Dispatched', 'En Route', 'Active', 'Resolved'
];

function statusClasses(s: MissionStatus) {
  switch (s) {
    case 'Awaiting Assignment': return 'text-gray-400 bg-gray-900 border-gray-700';
    case 'Dispatched': return 'text-yellow-400 bg-yellow-950 border-yellow-800';
    case 'En Route': return 'text-blue-400 bg-blue-950 border-blue-800';
    case 'Active': return 'text-green-400 bg-green-950 border-green-800';
    case 'Resolved': return 'text-gray-500 bg-gray-900 border-gray-800';
  }
}

function severityClasses(s: SeverityLevel) {
  return s === 'Critical' ? 'text-red-400 bg-red-950 border-red-800'
    : s === 'High' ? 'text-orange-400 bg-orange-950 border-orange-800'
    : s === 'Medium' ? 'text-yellow-400 bg-yellow-950 border-yellow-800'
    : 'text-green-400 bg-green-950 border-green-800';
}

const RESOURCE_OPTIONS = ['Zodiac Boat', 'Life Vests', 'Trauma Kit', 'Radio', 'AED', 'Fire Truck', 'Ambulance', 'Search Dog'];

// ── Dispatch Form ─────────────────────────────────────────────────────────────

function DispatchForm({
  prefill,
  onSuccess,
  onCancel,
}: {
  prefill?: Partial<Incident>;
  onSuccess: (m: Mission) => void;
  onCancel: () => void;
}) {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    assignedTeam: '',
    eta: '',
    summary: prefill?.recommendedAction ?? '',
    incidentId: prefill?.id ?? '',
  });
  const [resources, setResources] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleResource = (r: string) => {
    setResources(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assignedTeam || !form.eta) {
      addToast('info', 'Validation', 'Assigned Team and ETA are required');
      return;
    }
    setSubmitting(true);
    try {
      const mission = await commanderApi.createMission({
        incidentId: form.incidentId,
        assignedTeam: form.assignedTeam,
        eta: form.eta,
        summary: form.summary,
        requiredResources: resources,
        ...(prefill?.location && { location: prefill.location }),
        ...(prefill?.type && { type: prefill.type }),
        ...(prefill?.severity && { severity: prefill.severity }),
      });
      addToast('mission', '✅ Mission Created', `Mission ${mission.id?.slice(0, 8)} dispatched`);
      onSuccess(mission);
    } catch {
      addToast('info', 'Error', 'Could not create mission');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-bold text-white">DISPATCH MISSION</h3>
        <button type="button" onClick={onCancel} className="text-gray-600 hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      {prefill && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs space-y-1">
          <div className="flex gap-2">
            <span className="text-gray-500 w-20">Incident:</span>
            <span className="text-blue-400 font-mono">{prefill.id?.slice(0, 12)}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-20">Type:</span>
            <span className="text-white">{prefill.type}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-20">Location:</span>
            <span className="text-gray-300 truncate">{prefill.location?.address}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
            Incident ID
          </label>
          <input
            value={form.incidentId}
            onChange={e => setForm(p => ({ ...p, incidentId: e.target.value }))}
            placeholder="INC-..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
            Assigned Team *
          </label>
          <input
            value={form.assignedTeam}
            onChange={e => setForm(p => ({ ...p, assignedTeam: e.target.value }))}
            placeholder="e.g. Alpha-3 Rescue Unit"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
            ETA *
          </label>
          <input
            value={form.eta}
            onChange={e => setForm(p => ({ ...p, eta: e.target.value }))}
            placeholder="e.g. 15 minutes"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
            Mission Summary
          </label>
          <textarea
            value={form.summary}
            onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
            rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600 resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-2">
            Required Resources
          </label>
          <div className="flex flex-wrap gap-1.5">
            {RESOURCE_OPTIONS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => toggleResource(r)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded border transition-all
                  ${resources.includes(r) ? 'bg-blue-950 border-blue-700 text-blue-300' : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-bold py-2.5 rounded-lg transition-colors"
      >
        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        {submitting ? 'DISPATCHING...' : 'DISPATCH MISSION'}
      </button>
    </form>
  );
}

// ── Mission Detail Drawer ─────────────────────────────────────────────────────

function MissionDrawer({
  mission,
  onClose,
  onStatusChange,
}: {
  mission: Mission;
  onClose: () => void;
  onStatusChange: (m: Mission) => void;
}) {
  const { addToast } = useToast();
  const [updating, setUpdating] = useState(false);
  const currentIdx = STATUS_FLOW.indexOf(mission.status);

  const handleStatusUpdate = async (s: MissionStatus) => {
    setUpdating(true);
    try {
      const updated = await commanderApi.updateMissionStatus(mission.id, s);
      onStatusChange(updated);
      addToast('mission', 'Status Updated', `Mission → ${s}`);
    } catch {
      addToast('info', 'Error', 'Could not update mission status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#0d1525] border-t border-gray-800 shadow-2xl max-h-[70vh] overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-mono text-gray-500">{mission.id}</p>
            <h2 className="text-lg font-black text-white font-mono">{mission.type} MISSION</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${statusClasses(mission.status)}`}>
                {mission.status}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${severityClasses(mission.severity)}`}>
                {mission.severity}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Overview */}
          <div className="space-y-4">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                {mission.location?.address}
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-3.5 h-3.5 text-yellow-400" />
                ETA: <span className="text-white font-mono">{mission.eta}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-3.5 h-3.5 text-green-400" />
                Team: <span className="text-white font-mono">{mission.assignedTeam}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                {mission.affectedPopulation} people affected
              </div>
            </div>

            {/* Status Progression */}
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">Update Status</p>
              <div className="flex flex-col gap-1.5">
                {STATUS_FLOW.map((s, idx) => (
                  <button
                    key={s}
                    onClick={() => handleStatusUpdate(s)}
                    disabled={updating || idx <= currentIdx}
                    className={`text-[10px] font-mono py-1.5 px-3 rounded border text-left transition-all flex items-center gap-2
                      ${idx === currentIdx ? statusClasses(s) + ' cursor-default'
                        : idx < currentIdx ? 'border-gray-800 text-gray-700 line-through cursor-not-allowed'
                        : 'border-gray-700 text-gray-500 hover:border-blue-700 hover:text-blue-400 cursor-pointer'}`}
                  >
                    {idx < currentIdx ? '✓' : idx === currentIdx ? '●' : '○'}
                    <span>{s}</span>
                    {idx === currentIdx + 1 && <ArrowRight className="w-3 h-3 ml-auto text-blue-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle: AI + Risk */}
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">AI Findings</p>
              <p className="text-xs text-gray-300 bg-gray-900 border border-gray-800 rounded-lg p-3 leading-relaxed">
                {mission.aiFindings || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Risk Assessment</p>
              <p className="text-xs text-gray-300 bg-gray-900 border border-red-950/50 rounded-lg p-3 leading-relaxed">
                {mission.riskAssessment || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Resources</p>
              <div className="flex flex-wrap gap-1">
                {(mission.requiredResources || []).map(r => (
                  <span key={r} className="text-[10px] bg-blue-950/30 border border-blue-900/50 text-blue-400 px-2 py-0.5 rounded font-mono">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Response Plan + Timeline */}
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">Response Plan</p>
              <ol className="space-y-1.5">
                {(mission.recommendedResponsePlan || []).map((step, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-300">
                    <span className="text-blue-500 font-mono shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">Timeline</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(mission.timeline || []).map((event, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                      {i < (mission.timeline?.length ?? 0) - 1 && (
                        <div className="w-px flex-1 bg-gray-800 mt-1" />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-gray-600 font-mono text-[10px]">{timeAgo(event.timestamp)}</p>
                      <p className="text-gray-300">{event.event}</p>
                    </div>
                  </div>
                ))}
                {(!mission.timeline || mission.timeline.length === 0) && (
                  <p className="text-gray-600 text-xs font-mono">No timeline events</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Mission Table Row ─────────────────────────────────────────────────────────

function MissionRow({
  mission,
  onClick,
}: {
  mission: Mission;
  onClick: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className="border-b border-gray-800 hover:bg-gray-800/40 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 font-mono text-[10px] text-blue-400">{mission.id?.slice(0, 10)}…</td>
      <td className="px-4 py-3 text-xs text-gray-300">{mission.type}</td>
      <td className="px-4 py-3 text-xs text-gray-400 max-w-xs">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-gray-600 shrink-0" />
          <span className="truncate">{mission.location?.address}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-300 font-mono">{mission.assignedTeam || '—'}</td>
      <td className="px-4 py-3">
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${statusClasses(mission.status)}`}>
          {mission.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
          {mission.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{mission.eta}</td>
      <td className="px-4 py-3 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-gray-600" />
          {mission.affectedPopulation}
        </div>
      </td>
      <td className="px-4 py-3">
        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DispatchConsolePage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const { addToast } = useToast();

  const loadMissions = useCallback(async () => {
    try {
      const data = await commanderApi.getMissions();
      setMissions(data);
    } catch {
      addToast('info', 'Error', 'Could not load missions');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadMissions(); }, [loadMissions]);

  const handleMissionCreated = useCallback((data: unknown) => {
    const m = data as Mission;
    setMissions(prev => [m, ...prev]);
  }, []);

  const handleMissionUpdated = useCallback((data: unknown) => {
    const m = data as Mission;
    setMissions(prev => prev.map(ms => ms.id === m.id ? m : ms));
    setSelectedMission(prev => prev?.id === m.id ? m : prev);
  }, []);

  useSocket(
    ['mission_update'],
    {
      mission_created: handleMissionCreated,
      mission_updated: handleMissionUpdated,
    }
  );

  // Status summary counts
  const counts = missions.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white font-mono tracking-wide">DISPATCH CONSOLE</h1>
          <p className="text-xs text-gray-500 font-mono">{missions.length} missions active</p>
        </div>
        <button
          onClick={() => setShowDispatchForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          NEW MISSION
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-5 gap-2">
        {(['Awaiting Assignment', 'Dispatched', 'En Route', 'Active', 'Resolved'] as MissionStatus[]).map(s => (
          <div key={s} className={`bg-[#111827] border border-gray-800 rounded-lg p-3 text-center`}>
            <p className="text-xl font-black font-mono text-white">{counts[s] ?? 0}</p>
            <p className={`text-[10px] font-mono mt-0.5 ${
              s === 'Active' ? 'text-green-400' : s === 'En Route' ? 'text-blue-400' :
              s === 'Dispatched' ? 'text-yellow-400' : 'text-gray-500'
            }`}>{s}</p>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Missions Table */}
        <div className={`${showDispatchForm ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#111827] border border-gray-800 rounded-xl overflow-hidden`}>
          {loading ? (
            <div className="p-8 text-center text-gray-600 font-mono animate-pulse">Loading missions...</div>
          ) : missions.length === 0 ? (
            <div className="p-8 text-center text-gray-600 font-mono">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              No missions yet. Dispatch one from the Incident Feed.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Mission ID', 'Type', 'Location', 'Team', 'Status', 'ETA', 'Affected', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {missions.map(m => (
                    <React.Fragment key={m.id}>
                      <MissionRow mission={m} onClick={() => setSelectedMission(m)} />
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dispatch Form Panel */}
        {showDispatchForm && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#111827] border border-gray-800 rounded-xl p-5"
          >
            <DispatchForm
              onSuccess={(m) => {
                setMissions(prev => [m, ...prev]);
                setShowDispatchForm(false);
              }}
              onCancel={() => setShowDispatchForm(false)}
            />
          </motion.div>
        )}
      </div>

      {/* Mission Detail Drawer */}
      <AnimatePresence>
        {selectedMission && (
          <MissionDrawer
            mission={selectedMission}
            onClose={() => setSelectedMission(null)}
            onStatusChange={(updated) => {
              setMissions(prev => prev.map(m => m.id === updated.id ? updated : m));
              setSelectedMission(updated);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
