import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Filter, ChevronRight, X, Send, Loader2,
  MapPin, Clock, Users, AlertTriangle, CheckCircle2,
  Shield, ShieldCheck, ShieldAlert, Flame, Droplets,
  Zap, Construction, Building, Trash2, Eye
} from 'lucide-react';
import { commanderApi } from '../services/commanderApi';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../hooks/useToast';
import {
  Incident, SeverityLevel, VerificationStatus, IncidentType, Volunteer
} from '../../shared/types';

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

const SEVERITY_LEVELS: SeverityLevel[] = ['Critical', 'High', 'Medium', 'Low'];
const VERIFICATION_STATUSES: VerificationStatus[] = ['Verified', 'Pending', 'Flagged'];
const INCIDENT_TYPES: IncidentType[] = ['Flood', 'Road Collapse', 'Fire', 'Earthquake', 'Building Damage'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Flood: <Droplets className="w-4 h-4" />,
  Fire: <Flame className="w-4 h-4" />,
  Earthquake: <Zap className="w-4 h-4" />,
  'Road Collapse': <Construction className="w-4 h-4" />,
  'Building Damage': <Building className="w-4 h-4" />,
};

function severityClasses(s: string) {
  return s === 'Critical' ? 'text-red-400 bg-red-950 border-red-800'
    : s === 'High' ? 'text-orange-400 bg-orange-950 border-orange-800'
    : s === 'Medium' ? 'text-yellow-400 bg-yellow-950 border-yellow-800'
    : 'text-green-400 bg-green-950 border-green-800';
}

function severityBorderL(s: string) {
  return s === 'Critical' ? 'border-l-red-500'
    : s === 'High' ? 'border-l-orange-500'
    : s === 'Medium' ? 'border-l-yellow-500'
    : 'border-l-green-500';
}

function priorityBarColor(p: number) {
  return p > 70 ? 'bg-red-500' : p > 40 ? 'bg-yellow-500' : 'bg-green-500';
}

function VerifBadge({ v }: { v: string }) {
  const cls = v === 'Verified' ? 'text-green-400 bg-green-950 border-green-800'
    : v === 'Flagged' ? 'text-red-400 bg-red-950 border-red-800'
    : 'text-yellow-400 bg-yellow-950 border-yellow-800';
  const Icon = v === 'Verified' ? ShieldCheck : v === 'Flagged' ? ShieldAlert : Shield;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${cls}`}>
      <Icon className="w-2.5 h-2.5" />{v}
    </span>
  );
}

// ── Responder Chat ────────────────────────────────────────────────────────────

interface ChatMsg { role: 'user' | 'ai'; text: string; actions?: string[] }

function ResponderChat({ incidentId }: { incidentId: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(p => [...p, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await commanderApi.sendResponderChat(incidentId, text);
      setMessages(p => [...p, { role: 'ai', text: res.response, actions: res.actions }]);
    } catch {
      setMessages(p => [...p, { role: 'ai', text: 'AI responder unavailable.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-48 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-700 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs font-mono text-gray-400 font-bold">AI RESPONDER CHAT</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-gray-600 font-mono italic">
            Ask the AI responder about this incident...
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-xs ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-2.5 py-1.5 rounded-lg max-w-[85%] text-left ${
              m.role === 'user'
                ? 'bg-blue-900 text-blue-100 border border-blue-800'
                : 'bg-gray-800 text-gray-200 border border-gray-700'
            }`}>
              {m.text}
            </span>
            {m.actions && m.actions.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {m.actions.map((a, j) => (
                  <span key={j} className="text-[10px] bg-gray-800 border border-gray-700 text-gray-400 px-1.5 py-0.5 rounded font-mono">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>AI thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t border-gray-700 flex gap-2">
        <input
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
          placeholder="Message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Emergency Services config ─────────────────────────────────────────────────

const EMERGENCY_SERVICES: Record<string, { label: string; emoji: string; color: string; border: string; bg: string }[]> = {
  Fire: [
    { label: 'Fire Brigade', emoji: '🚒', color: 'text-red-300', border: 'border-red-700', bg: 'hover:bg-red-950' },
    { label: 'Ambulance', emoji: '🚑', color: 'text-orange-300', border: 'border-orange-700', bg: 'hover:bg-orange-950' },
  ],
  Flood: [
    { label: 'Rescue Boat', emoji: '⛵', color: 'text-blue-300', border: 'border-blue-700', bg: 'hover:bg-blue-950' },
    { label: 'Ambulance', emoji: '🚑', color: 'text-orange-300', border: 'border-orange-700', bg: 'hover:bg-orange-950' },
    { label: 'NDRF Team', emoji: '🪖', color: 'text-green-300', border: 'border-green-700', bg: 'hover:bg-green-950' },
  ],
  Earthquake: [
    { label: 'NDRF Team', emoji: '🪖', color: 'text-green-300', border: 'border-green-700', bg: 'hover:bg-green-950' },
    { label: 'Ambulance', emoji: '🚑', color: 'text-orange-300', border: 'border-orange-700', bg: 'hover:bg-orange-950' },
    { label: 'Fire Brigade', emoji: '🚒', color: 'text-red-300', border: 'border-red-700', bg: 'hover:bg-red-950' },
  ],
  'Road Collapse': [
    { label: 'Police', emoji: '🚔', color: 'text-blue-300', border: 'border-blue-700', bg: 'hover:bg-blue-950' },
    { label: 'Ambulance', emoji: '🚑', color: 'text-orange-300', border: 'border-orange-700', bg: 'hover:bg-orange-950' },
    { label: 'Fire Brigade', emoji: '🚒', color: 'text-red-300', border: 'border-red-700', bg: 'hover:bg-red-950' },
  ],
  'Building Damage': [
    { label: 'Fire Brigade', emoji: '🚒', color: 'text-red-300', border: 'border-red-700', bg: 'hover:bg-red-950' },
    { label: 'NDRF Team', emoji: '🪖', color: 'text-green-300', border: 'border-green-700', bg: 'hover:bg-green-950' },
    { label: 'Ambulance', emoji: '🚑', color: 'text-orange-300', border: 'border-orange-700', bg: 'hover:bg-orange-950' },
  ],
};

function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Inline Dispatch Form ──────────────────────────────────────────────────────

function InlineDispatchForm({
  incident,
  onDone,
  onCancel,
}: {
  incident: Incident;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { addToast } = useToast();
  const [assignedTeam, setAssignedTeam] = useState('');
  const [eta, setEta] = useState('');
  const [summary, setSummary] = useState(incident.recommendedAction ?? '');
  const [resources, setResources] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const RESOURCE_OPTIONS = ['Zodiac Boat', 'Life Vests', 'Trauma Kit', 'Radio', 'AED', 'Fire Truck', 'Ambulance', 'Search Dog'];

  const toggleResource = (r: string) =>
    setResources(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedTeam || !eta) {
      addToast('info', 'Validation', 'Assigned Team and ETA are required');
      return;
    }
    setSubmitting(true);
    try {
      await commanderApi.createMission({
        incidentId: incident.id,
        assignedTeam,
        eta,
        summary,
        requiredResources: resources,
        location: incident.location,
        type: incident.type,
        severity: incident.severity,
      });
      addToast('mission', 'Mission Dispatched', `Mission created for ${incident.type}`);
      onDone();
    } catch {
      addToast('info', 'Error', 'Could not create mission');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-[#0a1020] border border-blue-800/40 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">Dispatch Mission</p>
        <button type="button" onClick={onCancel} className="text-gray-600 hover:text-gray-300">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Assigned Team *</label>
        <input
          value={assignedTeam}
          onChange={e => setAssignedTeam(e.target.value)}
          placeholder="e.g. Alpha-3 Rescue Unit"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
          required
        />
      </div>
      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">ETA *</label>
        <input
          value={eta}
          onChange={e => setEta(e.target.value)}
          placeholder="e.g. 15 minutes"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
          required
        />
      </div>
      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Summary</label>
        <textarea
          value={summary}
          onChange={e => setSummary(e.target.value)}
          rows={2}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600 resize-none"
        />
      </div>
      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1.5">Resources</label>
        <div className="flex flex-wrap gap-1">
          {RESOURCE_OPTIONS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => toggleResource(r)}
              className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-all
                ${resources.includes(r) ? 'bg-blue-950 border-blue-700 text-blue-300' : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-bold py-2 rounded-lg transition-colors"
      >
        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
        {submitting ? 'DISPATCHING...' : 'CONFIRM DISPATCH'}
      </button>
    </motion.form>
  );
}

// ── Detail Sidebar ────────────────────────────────────────────────────────────

function DetailSidebar({
  incident,
  onClose,
}: {
  incident: Incident;
  onClose: () => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [volLoading, setVolLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [dispatchingSvc, setDispatchingSvc] = useState<string | null>(null);
  const [dispatchedSvcs, setDispatchedSvcs] = useState<Set<string>>(new Set());
  const [showDispatch, setShowDispatch] = useState(false);
  const { addToast } = useToast();

  // Load and sort volunteers by proximity
  useEffect(() => {
    setVolLoading(true);
    commanderApi.getVolunteers()
      .then(all => {
        const available = all
          .filter(v => v.status === 'Available')
          .map(v => ({
            ...v,
            _dist: distKm(incident.location.lat, incident.location.lng, v.location.lat, v.location.lng),
          }))
          .sort((a, b) => a._dist - b._dist)
          .slice(0, 5);
        setVolunteers(available as Volunteer[]);
      })
      .catch(() => {})
      .finally(() => setVolLoading(false));
  }, [incident.id, incident.location.lat, incident.location.lng]);

  const handleVerify = async (v: VerificationStatus) => {
    setVerifying(true);
    try {
      await commanderApi.verifyIncident(incident.id, v);
      addToast('mission', 'Incident Updated', `Verification set to ${v}`);
    } catch {
      addToast('info', 'Error', 'Could not update verification');
    } finally {
      setVerifying(false);
    }
  };

  const handleAssignVolunteer = async (vol: Volunteer) => {
    setAssigningId(vol.id);
    try {
      await commanderApi.assignIncidentToVolunteer(vol.id, incident.id);
      setAssignedIds(prev => new Set([...prev, vol.id]));
      addToast('mission', 'Volunteer Assigned', `${vol.name} dispatched to ${incident.type}`);
    } catch {
      addToast('info', 'Error', 'Could not assign volunteer');
    } finally {
      setAssigningId(null);
    }
  };

  const handleDispatchService = (svc: string) => {
    setDispatchingSvc(svc);
    setTimeout(() => {
      setDispatchedSvcs(prev => new Set([...prev, svc]));
      setDispatchingSvc(null);
      addToast('critical', `${svc} Dispatched`, `${svc} en route to ${incident.location.address}`);
    }, 1200);
  };

  const services = EMERGENCY_SERVICES[incident.type] ?? EMERGENCY_SERVICES['Flood'];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-16 bottom-0 w-[420px] bg-[#0d1525] border-l border-gray-800 z-30 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className={`p-4 border-b border-gray-800 border-l-4 ${severityBorderL(incident.severity)} shrink-0`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-mono text-gray-500">{incident.id}</p>
            <h2 className="text-base font-black text-white font-mono mt-0.5">{incident.type}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${severityClasses(incident.severity)}`}>
                {incident.severity}
              </span>
              <VerifBadge v={incident.verification} />
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Location */}
        <div className="flex items-start gap-2 text-sm text-gray-400">
          <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <span>{incident.location.address}</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'People', value: incident.peopleDetected },
            { label: 'Children', value: incident.childrenDetected },
            { label: 'Priority', value: `${incident.priorityScore}` },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-center">
              <p className="text-lg font-black text-white font-mono">{s.value}</p>
              <p className="text-[10px] text-gray-600 font-mono">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── EMERGENCY SERVICES ──────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Send Emergency Services
          </p>
          <div className="flex flex-wrap gap-2">
            {services.map(svc => {
              const dispatched = dispatchedSvcs.has(svc.label);
              const loading = dispatchingSvc === svc.label;
              return (
                <motion.button
                  key={svc.label}
                  whileHover={!dispatched ? { scale: 1.04 } : {}}
                  whileTap={!dispatched ? { scale: 0.97 } : {}}
                  onClick={() => !dispatched && handleDispatchService(svc.label)}
                  disabled={dispatched || loading}
                  className={`flex items-center gap-1.5 text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg border transition-all
                    ${dispatched
                      ? 'bg-gray-900 border-gray-700 text-gray-500 cursor-default'
                      : `bg-transparent ${svc.border} ${svc.color} ${svc.bg} cursor-pointer`}`}
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : dispatched ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <span className="text-sm">{svc.emoji}</span>
                  )}
                  {dispatched ? `${svc.label} Dispatched` : svc.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── NEAREST VOLUNTEERS ─────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Users className="w-3 h-3" />
            Nearest Available Volunteers
          </p>
          {volLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gray-900 border border-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : volunteers.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center text-xs text-gray-600 font-mono">
              No available volunteers nearby
            </div>
          ) : (
            <div className="space-y-2">
              {volunteers.map((vol: any) => {
                const assigned = assignedIds.has(vol.id);
                const loading = assigningId === vol.id;
                return (
                  <div
                    key={vol.id}
                    className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                        <p className="text-xs text-white font-mono font-bold truncate">{vol.name}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 ml-3.5">
                        <span className="text-[10px] text-gray-500 font-mono">
                          📍 {vol._dist.toFixed(1)} km away
                        </span>
                        {vol.skills?.[0] && (
                          <span className="text-[10px] text-blue-400 font-mono truncate">
                            · {vol.skills[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <motion.button
                      whileHover={!assigned ? { scale: 1.05 } : {}}
                      whileTap={!assigned ? { scale: 0.95 } : {}}
                      onClick={() => !assigned && handleAssignVolunteer(vol)}
                      disabled={assigned || loading}
                      className={`ml-2 shrink-0 flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg border transition-all
                        ${assigned
                          ? 'bg-green-950/40 border-green-800 text-green-400 cursor-default'
                          : 'bg-blue-950/30 border-blue-800 text-blue-300 hover:bg-blue-900/50 cursor-pointer'}`}
                    >
                      {loading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : assigned ? (
                        <><CheckCircle2 className="w-3 h-3" />Assigned</>
                      ) : (
                        <><Users className="w-3 h-3" />Assign</>
                      )}
                    </motion.button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── VERIFICATION ───────────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">Set Verification</p>
          <div className="flex gap-2">
            {VERIFICATION_STATUSES.map(v => (
              <button
                key={v}
                onClick={() => handleVerify(v)}
                disabled={verifying}
                className={`flex-1 text-[10px] font-mono font-bold py-1.5 rounded border transition-all
                  ${v === 'Verified' ? 'border-green-800 text-green-400 hover:bg-green-950'
                    : v === 'Flagged' ? 'border-red-800 text-red-400 hover:bg-red-950'
                    : 'border-yellow-800 text-yellow-400 hover:bg-yellow-950'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* ── RECOMMENDED ACTION ─────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">Recommended Action</p>
          <p className="text-xs text-gray-300 leading-relaxed bg-gray-900 border border-gray-800 rounded-lg p-3">
            {incident.recommendedAction}
          </p>
        </div>

        {/* ── AI Reasoning ───────────────────────────────────────────────── */}
        {(incident.reasoning?.length ?? 0) > 0 && (
          <div>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">AI Reasoning</p>
            <ul className="space-y-1.5">
              {(incident.reasoning || []).map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="text-blue-500 mt-0.5 shrink-0">▸</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── CREATE MISSION / DISPATCH ───────────────────────────────────── */}
        {!showDispatch ? (
          <button
            onClick={() => setShowDispatch(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold py-2.5 rounded-lg transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            CREATE MISSION / DISPATCH
          </button>
        ) : (
          <InlineDispatchForm
            incident={incident}
            onDone={() => setShowDispatch(false)}
            onCancel={() => setShowDispatch(false)}
          />
        )}

        {/* ── AI Chat ────────────────────────────────────────────────────── */}
        <ResponderChat incidentId={incident.id} />
      </div>
    </motion.div>
  );
}


// ── Incident Card ─────────────────────────────────────────────────────────────

function IncidentCard({
  incident,
  isSelected,
  onClick,
  onDispatch,
}: {
  incident: Incident;
  isSelected: boolean;
  onClick: () => void;
  onDispatch: () => void;
}) {
  const { addToast } = useToast();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await commanderApi.deleteIncident(incident.id);
      addToast('mission', 'Deleted', `Incident ${incident.id} removed`);
    } catch {
      addToast('info', 'Error', 'Could not delete incident');
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-[#111827] border border-l-4 rounded-xl p-4 cursor-pointer transition-all
        ${isSelected ? 'border-blue-600 shadow-lg shadow-blue-900/20' : 'border-gray-800 hover:border-gray-700'}
        ${severityBorderL(incident.severity)}`}
      onClick={onClick}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg bg-gray-900 ${
            incident.severity === 'Critical' ? 'text-red-400' :
            incident.severity === 'High' ? 'text-orange-400' :
            incident.severity === 'Medium' ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {TYPE_ICONS[incident.type]}
          </span>
          <div>
            <p className="text-xs font-mono text-gray-500">{incident.id.slice(0, 12)}…</p>
            <p className="text-sm font-bold text-white">{incident.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {incident.duplicates > 0 && (
            <span className="text-[10px] bg-purple-950 border border-purple-800 text-purple-400 px-1.5 py-0.5 rounded font-mono font-bold">
              ×{incident.duplicates}
            </span>
          )}
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${severityClasses(incident.severity)}`}>
            {incident.severity}
          </span>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 mb-3">
        <MapPin className="w-3 h-3 text-gray-600 shrink-0" />
        <span className="text-xs text-gray-400 truncate">{incident.location.address}</span>
      </div>

      {/* Priority bar */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-gray-600 font-mono">PRIORITY SCORE</span>
          <span className="text-[10px] text-gray-400 font-mono font-bold">{incident.priorityScore}/100</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${priorityBarColor(incident.priorityScore)}`}
            style={{ width: `${incident.priorityScore}%` }}
          />
        </div>
      </div>

      {/* People */}
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{incident.peopleDetected}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider font-bold">Minors:</span>
          <span>{incident.childrenDetected}</span>
        </div>
        <div className="ml-auto">
          <VerifBadge v={incident.verification} />
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-3">
        <Clock className="w-3 h-3" />
        <span className="font-mono">{timeAgo(incident.timestamp)}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClick}
          className="flex-1 flex items-center justify-center gap-1 text-[10px] font-mono py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          <Eye className="w-3 h-3" />Detail
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDispatch(); }}
          className="flex-1 flex items-center justify-center gap-1 text-[10px] font-mono py-1 rounded bg-blue-900/50 hover:bg-blue-900 text-blue-400 border border-blue-900 transition-colors"
        >
          <ChevronRight className="w-3 h-3" />Dispatch
        </button>
        <button
          onClick={handleDelete}
          className="p-1 rounded bg-red-950/30 hover:bg-red-950 text-red-700 hover:text-red-400 border border-red-950 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Severity Filter Pill ──────────────────────────────────────────────────────

function SeverityPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const color = label === 'Critical' ? 'red' : label === 'High' ? 'orange' : label === 'Medium' ? 'yellow' : 'green';
  const activeClasses = `bg-${color}-950 border-${color}-700 text-${color}-400`;
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border transition-all
        ${active ? activeClasses : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'}`}
    >
      {label}
    </button>
  );
}

// ── Dispatch Context ──────────────────────────────────────────────────────────

interface DispatchContext {
  setDispatchIncident: (inc: Incident) => void;
}
export const DispatchCtx = React.createContext<DispatchContext>({ setDispatchIncident: () => {} });

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IncidentFeedPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Set<SeverityLevel>>(new Set());
  const [verifFilter, setVerifFilter] = useState<Set<VerificationStatus>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<IncidentType>>(new Set());
  const [sortBy, setSortBy] = useState<'priority' | 'timestamp' | 'severity'>('priority');
  const { addToast } = useToast();

  const loadIncidents = useCallback(async () => {
    try {
      const data = await commanderApi.getIncidents();
      setIncidents(data);
    } catch {
      addToast('info', 'Error', 'Could not load incidents');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadIncidents(); }, [loadIncidents]);

  const handleIncidentCreated = useCallback((data: unknown) => {
    const inc = data as Incident;
    setIncidents(prev => [inc, ...prev]);
    addToast('critical', 'New Incident Alert', `${inc.type} — ${inc.location.address}`);
  }, [addToast]);

  const handleIncidentUpdated = useCallback((data: unknown) => {
    const inc = data as Incident;
    setIncidents(prev => prev.map(i => i.id === inc.id ? inc : i));
  }, []);

  useSocket(
    ['incidents_feed'],
    {
      incident_created: handleIncidentCreated,
      incident_updated: handleIncidentUpdated,
    }
  );

  // Filtering + sorting
  const SEVERITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

  const filtered = incidents
    .filter(inc => {
      if (search && !`${inc.type} ${inc.location.address} ${inc.id}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (severityFilter.size > 0 && !severityFilter.has(inc.severity)) return false;
      if (verifFilter.size > 0 && !verifFilter.has(inc.verification)) return false;
      if (typeFilter.size > 0 && !typeFilter.has(inc.type)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return b.priorityScore - a.priorityScore;
      if (sortBy === 'timestamp') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === 'severity') return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      return 0;
    });

  const selectedIncident = incidents.find(i => i.id === selectedId) ?? null;

  const toggleSeverity = (s: SeverityLevel) => {
    setSeverityFilter(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const toggleVerif = (v: VerificationStatus) => {
    setVerifFilter(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  const toggleType = (t: IncidentType) => {
    setTypeFilter(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-black text-white font-mono tracking-wide">LIVE INCIDENT FEED</h1>
          <p className="text-xs text-gray-500 font-mono">{filtered.length} incidents matching filters</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
          <span className="text-xs font-mono text-red-400">LIVE</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 mb-4 space-y-3">
        {/* Search + Sort */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by type, location, ID..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-600 font-mono"
          >
            <option value="priority">Sort: Priority</option>
            <option value="timestamp">Sort: Time</option>
            <option value="severity">Sort: Severity</option>
          </select>
        </div>

        {/* Severity pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
            <Filter className="w-3 h-3" />SEV:
          </span>
          {SEVERITY_LEVELS.map(s => (
            <div key={s}>
              <SeverityPill label={s} active={severityFilter.has(s)} onClick={() => toggleSeverity(s)} />
            </div>
          ))}
          <span className="text-gray-700 mx-1">|</span>
          {VERIFICATION_STATUSES.map(v => (
            <button
              key={v}
              onClick={() => toggleVerif(v)}
              className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border transition-all
                ${verifFilter.has(v)
                  ? v === 'Verified' ? 'bg-green-950 border-green-700 text-green-400'
                    : v === 'Flagged' ? 'bg-red-950 border-red-700 text-red-400'
                    : 'bg-yellow-950 border-yellow-700 text-yellow-400'
                  : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}
            >
              {v}
            </button>
          ))}
          <span className="text-gray-700 mx-1">|</span>
          {INCIDENT_TYPES.map(t => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all
                ${typeFilter.has(t) ? 'bg-blue-950 border-blue-700 text-blue-400' : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}
            >
              {t}
            </button>
          ))}
          {(severityFilter.size > 0 || verifFilter.size > 0 || typeFilter.size > 0) && (
            <button
              onClick={() => { setSeverityFilter(new Set()); setVerifFilter(new Set()); setTypeFilter(new Set()); }}
              className="text-[10px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1 ml-auto"
            >
              <X className="w-3 h-3" />Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111827] border border-gray-800 rounded-xl p-4 h-52 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600 font-mono">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No incidents match your filters</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${selectedIncident ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
          <AnimatePresence>
            {filtered.map(inc => (
              <div key={inc.id}>
                <IncidentCard
                  incident={inc}
                  isSelected={selectedId === inc.id}
                  onClick={() => setSelectedId(prev => prev === inc.id ? null : inc.id)}
                  onDispatch={() => setSelectedId(inc.id)}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Sidebar */}
      <AnimatePresence>
        {selectedIncident && (
          <DetailSidebar
            incident={selectedIncident}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
