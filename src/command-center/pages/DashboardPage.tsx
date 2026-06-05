import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, AlertTriangle, Users, Building2,
  CheckCircle2, Wifi, WifiOff, TrendingUp, TrendingDown,
  MapPin, Clock, Shield, ShieldAlert, ShieldCheck,
  BarChart3, PieChart, Flame, Droplets, Zap, Construction, Building,
  Radio
} from 'lucide-react';
import { commanderApi } from '../services/commanderApi';
import { useSocket } from '../hooks/useSocket';
import { Incident, Volunteer } from '../../shared/types';
import { useToast } from '../hooks/useToast';

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function severityColor(s: string) {
  return s === 'Critical' ? 'text-red-400 bg-red-950 border-red-800'
    : s === 'High' ? 'text-orange-400 bg-orange-950 border-orange-800'
    : s === 'Medium' ? 'text-yellow-400 bg-yellow-950 border-yellow-800'
    : 'text-green-400 bg-green-950 border-green-800';
}

function severityBorder(s: string) {
  return s === 'Critical' ? 'border-l-red-500'
    : s === 'High' ? 'border-l-orange-500'
    : s === 'Medium' ? 'border-l-yellow-500'
    : 'border-l-green-500';
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Flood: <Droplets className="w-4 h-4" />,
  Fire: <Flame className="w-4 h-4" />,
  Earthquake: <Zap className="w-4 h-4" />,
  'Road Collapse': <Construction className="w-4 h-4" />,
  'Building Damage': <Building className="w-4 h-4" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e'
};

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MISSION_STATUS_COLORS: Record<string, string> = {
  'Awaiting Assignment': '#6b7280',
  'Dispatched': '#eab308',
  'En Route': '#60a5fa',
  'Active': '#22c55e',
  'Resolved': '#374151',
};

// ── Animated Count-Up ────────────────────────────────────────────────────────

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const delta = target - start;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(start + delta * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{val.toLocaleString()}</>;
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, color, trend
}: {
  label: string; value: number; icon: React.ElementType;
  color: string; trend: 'up' | 'down' | 'neutral';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-[#111827] border border-gray-800 rounded-xl p-5 border-l-4 ${color} relative overflow-hidden`}
    >
      <div className="absolute inset-0 opacity-5"
        style={{ background: 'radial-gradient(circle at top right, #fff, transparent)' }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-black text-white font-mono">
            <CountUp target={value} />
          </p>
        </div>
        <div className="p-2 bg-gray-900 rounded-lg">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {trend === 'up' ? (
          <TrendingUp className="w-3.5 h-3.5 text-red-400" />
        ) : trend === 'down' ? (
          <TrendingDown className="w-3.5 h-3.5 text-green-400" />
        ) : null}
        <span className="text-xs text-gray-500">Live data</span>
      </div>
    </motion.div>
  );
}

// ── SVG Donut Chart ──────────────────────────────────────────────────────────

function DonutChart({ data }: { data: Record<string, number> }) {
  const SIZE = 140;
  const R = 52;
  const CX = 70;
  const CY = 70;
  const circumference = 2 * Math.PI * R;

  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return <p className="text-gray-600 text-xs text-center py-4">No data</p>;

  const TYPE_COLORS: Record<string, string> = {
    Flood: '#3b82f6', Fire: '#ef4444', Earthquake: '#a78bfa',
    'Road Collapse': '#f97316', 'Building Damage': '#eab308'
  };

  let offset = 0;
  const slices = entries.map(([k, v]) => {
    const pct = v / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const slice = { key: k, dashOffset: offset, dash, gap, color: TYPE_COLORS[k] ?? '#6b7280' };
    offset += dash;
    return slice;
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1f2937" strokeWidth={16} />
        {slices.map(s => (
          <circle
            key={s.key} cx={CX} cy={CY} r={R}
            fill="none" stroke={s.color} strokeWidth={14}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.dashOffset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        ))}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="18" fontWeight="bold" fontFamily="monospace">
          {total}
        </text>
        <text x={CX} y={CY + 14} textAnchor="middle" dominantBaseline="middle"
          fill="#6b7280" fontSize="8" fontFamily="monospace">
          TOTAL
        </text>
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
        {slices.map(s => (
          <div key={s.key} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-gray-400 font-mono">{s.key.split(' ')[0]}</span>
            <span className="text-xs text-gray-600">{s.dash > 0 ? Math.round((s.dash / circumference) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal Bar Chart ─────────────────────────────────────────────────────

function HBarChart({ data }: { data: Record<string, number> }) {
  const total = Math.max(...Object.values(data), 1);
  const entries = Object.entries(data);
  if (entries.length === 0) return <p className="text-gray-600 text-xs">No data</p>;
  return (
    <div className="flex flex-col gap-2.5">
      {entries.map(([label, val]) => (
        <div key={label}>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400 font-mono truncate max-w-[160px]">{label}</span>
            <span className="text-xs text-gray-500 font-mono">{val}</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(val / total) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: MISSION_STATUS_COLORS[label] ?? '#60a5fa' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── System Status ────────────────────────────────────────────────────────────

function StatusDot({ ok, label }: { ok: boolean | null; label: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <span className={`w-2 h-2 rounded-full ${ok === null ? 'bg-gray-600 animate-pulse' : ok ? 'bg-green-400' : 'bg-red-500'}`} />
      <span className="text-xs text-gray-400 font-mono">{label}</span>
      <span className={`text-xs ml-auto font-mono ${ok === null ? 'text-gray-600' : ok ? 'text-green-400' : 'text-red-400'}`}>
        {ok === null ? 'checking...' : ok ? 'ONLINE' : 'OFFLINE'}
      </span>
    </div>
  );
}

// ── Verification Badge ────────────────────────────────────────────────────────

function VerifBadge({ v }: { v: string }) {
  const cls = v === 'Verified' ? 'text-green-400 bg-green-950 border-green-800'
    : v === 'Flagged' ? 'text-red-400 bg-red-950 border-red-800'
    : 'text-yellow-400 bg-yellow-950 border-yellow-800';
  const Icon = v === 'Verified' ? ShieldCheck : v === 'Flagged' ? ShieldAlert : Shield;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${cls}`}>
      <Icon className="w-2.5 h-2.5" />{v}
    </span>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [kpi, setKpi] = useState({
    activeIncidents: 0, criticalEmergencies: 0,
    respondersDeployed: 0, citizensImpacted: 0,
  });
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [analytics, setAnalytics] = useState<{
    byType: Record<string, number>;
    byMissionStatus: Record<string, number>;
  } | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [aiOk, setAiOk] = useState<boolean | null>(null);
  const [breachCount, setBreachCount] = useState(0);
  const [newIncidentFlash, setNewIncidentFlash] = useState<Incident | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [totalVolunteers, setTotalVolunteers] = useState(0);
  const [nearestVolunteer, setNearestVolunteer] = useState<Volunteer | null>(null);
  const [nearestDistance, setNearestDistance] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const { addToast } = useToast();

  // Load initial data
  useEffect(() => {
    commanderApi.getIncidentStats()
      .then(s => setKpi({
        activeIncidents: s.activeIncidents,
        criticalEmergencies: s.criticalEmergencies,
        respondersDeployed: s.respondersDeployed,
        citizensImpacted: s.citizensImpacted,
      }))
      .catch(() => {});

    commanderApi.getIncidents()
      .then(incidents => setRecentIncidents(incidents.slice(0, 5)))
      .catch(() => {});

    commanderApi.getAnalyticsSummary()
      .then(s => setAnalytics({ byType: s.byType ?? {}, byMissionStatus: s.byMissionStatus ?? {} }))
      .catch(() => {});

    commanderApi.getVolunteers()
      .then(vols => {
        setVolunteers(vols);
        setTotalVolunteers(vols.length);
      })
      .catch(() => {});

    // Health checks
    fetch('http://localhost:3000/api/incidents/stats')
      .then(r => setBackendOk(r.ok))
      .catch(() => setBackendOk(false));

    fetch('http://localhost:8001/health')
      .then(r => setAiOk(r.ok))
      .catch(() => setAiOk(false));
  }, []);

  useEffect(() => {
    if (!selectedIncident) {
      setNearestVolunteer(null);
      setNearestDistance(null);
      return;
    }
    const available = volunteers.filter(v => v.status === 'Available');
    if (available.length === 0) {
      setNearestVolunteer(null);
      setNearestDistance(null);
      return;
    }

    let minVol: Volunteer | null = null;
    let minDistance = Infinity;

    available.forEach(v => {
      const dist = getHaversineDistance(
        selectedIncident.location.lat,
        selectedIncident.location.lng,
        v.location.lat,
        v.location.lng
      );
      if (dist < minDistance) {
        minDistance = dist;
        minVol = v;
      }
    });

    setNearestVolunteer(minVol);
    setNearestDistance(minVol ? minDistance : null);
  }, [selectedIncident, volunteers]);

  const handleStatsUpdate = useCallback((data: unknown) => {
    const s = data as typeof kpi;
    setKpi(prev => ({ ...prev, ...s }));
  }, []);

  const handleIncidentCreated = useCallback((incident: unknown) => {
    const inc = incident as Incident;
    setRecentIncidents(prev => [inc, ...prev].slice(0, 5));
    setNewIncidentFlash(inc);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setNewIncidentFlash(null), 5000);
  }, []);

  const handleGeofenceBreached = useCallback(() => {
    setBreachCount(c => c + 1);
  }, []);

  const handleVolunteerRegistered = useCallback((volunteer: unknown) => {
    const vol = volunteer as Volunteer;
    setVolunteers(prev => {
      if (prev.some(v => v.id === vol.id)) {
        return prev.map(v => v.id === vol.id ? vol : v);
      }
      setTotalVolunteers(prevTotal => prevTotal + 1);
      addToast('mission', 'New Volunteer Standby', `${vol.name} is available for dispatch.`);
      return [...prev, vol];
    });
  }, [addToast]);

  const socketRef = useSocket(
    ['stats_update', 'incidents_feed', 'geofence_alerts', 'resource_positions'],
    {
      connect: () => setSocketConnected(true),
      disconnect: () => setSocketConnected(false),
      stats_update: handleStatsUpdate,
      incident_created: handleIncidentCreated,
      geofence_breached: handleGeofenceBreached,
      volunteer_registered: handleVolunteerRegistered,
    }
  );

  // Check socket connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setSocketConnected(socketRef.current?.connected ?? false);
    }, 2000);
    return () => clearInterval(interval);
  }, [socketRef]);

  const handleAssign = async () => {
    if (!selectedIncident || !nearestVolunteer) return;
    setIsAssigning(true);
    try {
      const updatedVol = await commanderApi.assignIncidentToVolunteer(nearestVolunteer.id, selectedIncident.id);
      addToast('mission', 'Volunteer Dispatched', `Task assigned to ${updatedVol.name}.`);
      setVolunteers(prev => prev.map(v => v.id === updatedVol.id ? updatedVol : v));
    } catch (err) {
      console.error(err);
      addToast('critical', 'Dispatch Failed', 'Failed to assign task to volunteer.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedIncident) return;
    setIsResolving(true);
    try {
      await commanderApi.deleteIncident(selectedIncident.id);
      addToast('mission', 'Incident Resolved', `Incident ${selectedIncident.id} has been resolved.`);
      setRecentIncidents(prev => prev.filter(inc => inc.id !== selectedIncident.id));
      setSelectedIncident(null);
      commanderApi.getIncidentStats()
        .then(s => setKpi({
          activeIncidents: s.activeIncidents,
          criticalEmergencies: s.criticalEmergencies,
          respondersDeployed: s.respondersDeployed,
          citizensImpacted: s.citizensImpacted,
        }))
        .catch(() => {});
      commanderApi.getAnalyticsSummary()
        .then(s => setAnalytics({ byType: s.byType ?? {}, byMissionStatus: s.byMissionStatus ?? {} }))
        .catch(() => {});
    } catch (err) {
      console.error(err);
      addToast('critical', 'Resolution Failed', 'Failed to resolve the incident.');
    } finally {
      setIsResolving(false);
    }
  };

  const [isDispatchingProfessional, setIsDispatchingProfessional] = useState<string | null>(null);

  const handleProfessionalDispatch = async (team: string) => {
    if (!selectedIncident) return;
    setIsDispatchingProfessional(team);
    try {
      const payload = {
        incidentId: selectedIncident.id,
        location: selectedIncident.location,
        type: selectedIncident.type,
        severity: selectedIncident.severity,
        recommendedTeam: `${team} Dispatch`,
        assignedTeam: `${team} ${Math.floor(Math.random() * 90 + 10)}`,
        status: 'Dispatched' as const,
        eta: '8 mins',
        summary: `Dispatched ${team} to ${selectedIncident.location.address} for a ${selectedIncident.severity} ${selectedIncident.type} emergency.`,
        aiFindings: `Priority Score: ${selectedIncident.priorityScore}/100. People affected: ${selectedIncident.peopleDetected}.`,
        riskAssessment: `Severity is ${selectedIncident.severity}. Direct command line dispatch.`,
        affectedPopulation: selectedIncident.peopleDetected,
        requiredResources: team === 'Fire Brigade' ? ['Fire Hoses', 'Aerosol Extinguishers'] 
                         : team === 'Ambulance Unit' ? ['AED', 'Oxygen Tanks', 'Trauma Kit']
                         : team === 'Rescue Squad' ? ['Zodiac Boat', 'Life Vests', 'Ropes']
                         : ['Traffic Cones', 'Barricades'],
        recommendedResponsePlan: [`Deploy ${team} immediately to coordinate on-scene response.`],
        timeline: [
          { timestamp: new Date().toISOString(), event: `${team} dispatched from EOC Command.` }
        ]
      };
      await commanderApi.createMission(payload);
      addToast('mission', 'Professional Dispatched', `${team} is en route.`);
    } catch (err) {
      console.error(err);
      addToast('critical', 'Dispatch Failed', `Failed to dispatch ${team}.`);
    } finally {
      setIsDispatchingProfessional(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white font-mono tracking-wide">
            EOC COMMAND OVERVIEW
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            Emergency Operations Center — Live Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
          {socketConnected
            ? <><Wifi className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400 font-bold font-mono">LIVE</span></>
            : <><WifiOff className="w-3.5 h-3.5 text-red-400" /><span className="text-red-400 font-bold font-mono">OFFLINE</span></>
          }
          <span className="text-gray-700">|</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* New Incident Flash */}
      <AnimatePresence>
        {newIncidentFlash && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 bg-red-950/60 border border-red-700 rounded-lg px-4 py-2.5"
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-red-300">NEW INCIDENT:</span>
            <span className="text-xs text-gray-300 flex items-center gap-1.5 font-mono">
              <span className="text-red-400 shrink-0">{TYPE_ICONS[newIncidentFlash.type]}</span>
              {newIncidentFlash.type} — {newIncidentFlash.location.address}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ml-auto ${severityColor(newIncidentFlash.severity)}`}>
              {newIncidentFlash.severity}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Incidents" value={kpi.activeIncidents} icon={Activity}
          color="border-l-blue-500" trend="up" />
        <KpiCard label="Critical Emergencies" value={kpi.criticalEmergencies} icon={AlertTriangle}
          color="border-l-red-500" trend="up" />
        <KpiCard label="Responders Deployed" value={kpi.respondersDeployed} icon={Users}
          color="border-l-orange-500" trend="neutral" />
        <KpiCard label="Citizens Impacted" value={kpi.citizensImpacted} icon={Building2}
          color="border-l-yellow-500" trend="up" />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Activity Feed */}
        <div className="lg:col-span-2 bg-[#111827] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-mono font-bold text-white tracking-wide">LIVE INCIDENT FEED</h2>
            <span className="ml-auto text-[10px] text-gray-600 font-mono">Last 5</span>
          </div>

          <div className="space-y-2">
            {recentIncidents.length === 0 && (
              <div className="text-center text-gray-600 text-xs font-mono py-8">
                Awaiting incident data...
              </div>
            )}
            {recentIncidents.map((inc, i) => (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedIncident(sel => sel?.id === inc.id ? null : inc)}
                className={`flex items-center gap-3 p-3 rounded-lg border border-l-4 cursor-pointer transition-all
                  ${selectedIncident?.id === inc.id
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-900/50 border-gray-800/50 hover:bg-gray-800/80'}
                  ${severityBorder(inc.severity)}`}
              >
                <span className="p-1.5 rounded-lg bg-gray-950 text-gray-400 shrink-0 flex items-center justify-center border border-gray-800">
                  {TYPE_ICONS[inc.type] ?? <Zap className="w-4 h-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${severityColor(inc.severity)}`}>
                      {inc.severity}
                    </span>
                    <span className="text-xs text-gray-300 font-mono truncate">{inc.type}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-600 shrink-0" />
                    <span className="text-xs text-gray-500 truncate">{inc.location.address}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono">{timeAgo(inc.timestamp)}</span>
                  </div>
                  <VerifBadge v={inc.verification} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mini detail */}
          <AnimatePresence>
            {selectedIncident && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-400">{selectedIncident.id}</span>
                    <span className="text-gray-500">Priority: <span className="text-white font-bold">{selectedIncident.priorityScore}/100</span></span>
                  </div>
                  <p className="text-gray-400 leading-relaxed">{selectedIncident.recommendedAction}</p>
                  <div className="flex gap-4 text-gray-500 items-center font-mono text-[10px] pt-1 pb-1">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {selectedIncident.peopleDetected} people</span>
                    <span className="flex items-center gap-1"><span className="text-[10px] text-gray-600 uppercase">Minors:</span> {selectedIncident.childrenDetected}</span>
                    {selectedIncident.waterLevel !== 'N/A' && (
                      <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-blue-500" /> Water: {selectedIncident.waterLevel}</span>
                    )}
                  </div>

                  {/* Dispatch & Resolution Section */}
                  <hr className="border-gray-800 my-2" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Nearest Volunteer Block */}
                    <div className="bg-gray-950/45 border border-gray-800 rounded-lg p-3 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                          <Users className="w-3 h-3 text-blue-400" />
                          <span>Nearest Volunteer</span>
                        </div>
                        {nearestVolunteer ? (
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-white font-mono truncate">{nearestVolunteer.name}</span>
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded border text-green-400 bg-green-950/50 border-green-900/60 shrink-0">
                                {nearestVolunteer.status}
                              </span>
                            </div>
                            <p className="text-gray-500 text-[10px] font-mono">
                              {nearestDistance !== null ? `${nearestDistance.toFixed(2)} km away` : 'Calculating...'}
                            </p>
                            
                            {/* Skills, Age, Gender Tags */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {nearestVolunteer.skills.slice(0, 2).map((skill, idx) => (
                                <span key={idx} className="text-[9px] font-mono text-gray-400 bg-gray-900 px-1 py-0.2 rounded border border-gray-800">
                                  {skill}
                                </span>
                              ))}
                              {nearestVolunteer.age && (
                                <span className="text-[9px] font-mono text-blue-400 bg-blue-950/20 px-1 py-0.2 rounded border border-blue-900/30">
                                  {nearestVolunteer.age} yrs
                                </span>
                              )}
                              {nearestVolunteer.gender && (
                                <span className="text-[9px] font-mono text-pink-400 bg-pink-950/20 px-1 py-0.2 rounded border border-pink-900/30">
                                  {nearestVolunteer.gender.split('-')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-600 font-mono text-[10px] py-2">
                            No available standby volunteers
                          </p>
                        )}
                      </div>

                      {nearestVolunteer && (
                        <button
                          type="button"
                          onClick={handleAssign}
                          disabled={isAssigning}
                          className="w-full mt-2 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/40 disabled:text-gray-500 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded-md transition-colors cursor-pointer"
                        >
                          <Radio className="w-3 h-3 animate-pulse" />
                          {isAssigning ? 'DISPATCHING...' : 'DISPATCH TASK'}
                        </button>
                      )}
                    </div>

                    {/* Resolution Block */}
                    <div className="flex flex-col justify-between bg-gray-950/45 border border-gray-800 rounded-lg p-3 space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          <span>Close Incident</span>
                        </div>
                        <p className="text-gray-500 text-[10px] font-mono leading-relaxed">
                          Close case and archive thread once hazard is mitigated.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleResolve}
                        disabled={isResolving}
                        className="w-full flex items-center justify-center gap-1.5 border border-green-500/60 hover:bg-green-500/15 text-green-400 font-mono text-[10px] font-bold py-1.5 px-3 rounded-md transition-colors cursor-pointer mt-auto"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {isResolving ? 'RESOLVING...' : 'RESOLVE INCIDENT'}
                      </button>
                    </div>
                  </div>

                  {/* Professional Dispatch Block */}
                  {(selectedIncident.severity === 'Critical' || selectedIncident.severity === 'High') && (
                    <div className="pt-1">
                      <hr className="border-gray-800 my-2" />
                      <div className="bg-gray-950/45 border border-red-900/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                          <span>Professional Emergency Dispatch Required</span>
                        </div>
                        <p className="text-gray-500 text-[10px] font-mono leading-relaxed pb-1">
                          Severe incident detected. Dispatch professional emergency responder units immediately.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { team: 'Ambulance Unit', label: 'Ambulance', icon: '🚑', color: 'border-red-500/40 text-red-400 bg-red-950/20 hover:bg-red-950/45' },
                            { team: 'Fire Brigade', label: 'Fire Brigade', icon: '🚒', color: 'border-orange-500/40 text-orange-400 bg-orange-950/20 hover:bg-orange-950/45' },
                            { team: 'Rescue Squad', label: 'Rescue Team', icon: '🚁', color: 'border-blue-500/40 text-blue-400 bg-blue-950/20 hover:bg-blue-950/45' },
                            { team: 'Police Squad', label: 'Police Patrol', icon: '🚓', color: 'border-gray-500/40 text-gray-400 bg-gray-950/20 hover:bg-gray-950/45' }
                          ].map(opt => (
                            <button
                              key={opt.team}
                              type="button"
                              onClick={() => handleProfessionalDispatch(opt.team)}
                              disabled={isDispatchingProfessional !== null}
                              className={`flex flex-col sm:flex-row items-center justify-center gap-1 border rounded px-2 py-2 text-[9px] font-bold font-mono transition-colors cursor-pointer disabled:opacity-50 ${opt.color}`}
                            >
                              <span>{opt.icon}</span>
                              <span className="truncate">{isDispatchingProfessional === opt.team ? 'SENDING...' : opt.label.toUpperCase()}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* System Status */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-mono font-bold text-white tracking-wide">SYSTEM STATUS</h2>
          </div>
          <div className="divide-y divide-gray-800">
            <StatusDot ok={socketConnected} label="Socket.IO Feed" />
            <StatusDot ok={backendOk} label="Backend API" />
            <StatusDot ok={aiOk} label="AI Engine" />
          </div>
          <div className="mt-4 p-3 bg-gray-900 rounded-lg">
            <p className="text-xs font-mono text-gray-500 mb-1">GEOFENCE BREACHES</p>
            <p className={`text-2xl font-black font-mono ${breachCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {breachCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">since session start</p>
          </div>

          <div className="mt-3 p-3 bg-gray-900 rounded-lg">
            <p className="text-xs font-mono text-gray-500 mb-1">TOTAL ACTIVE VOLUNTEERS</p>
            <p className="text-2xl font-black font-mono text-blue-400">
              <CountUp target={totalVolunteers} />
            </p>
            <p className="text-xs text-gray-600 mt-1">registered in system</p>
          </div>

          <div className="mt-3 p-3 bg-blue-950/30 border border-blue-900/40 rounded-lg">
            <p className="text-xs font-mono text-blue-400 font-bold">COMMAND STATUS</p>
            <p className="text-xs text-gray-400 mt-1">Operations Active</p>
            <div className="h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '73%' }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut Chart */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-mono font-bold text-white tracking-wide">INCIDENTS BY TYPE</h2>
          </div>
          {analytics
            ? <DonutChart data={analytics.byType} />
            : <div className="h-32 flex items-center justify-center text-gray-600 text-xs font-mono animate-pulse">Loading...</div>
          }
        </div>

        {/* Bar Chart */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-mono font-bold text-white tracking-wide">MISSION STATUS BREAKDOWN</h2>
          </div>
          {analytics
            ? <HBarChart data={analytics.byMissionStatus} />
            : <div className="h-32 flex items-center justify-center text-gray-600 text-xs font-mono animate-pulse">Loading...</div>
          }
        </div>
      </div>
    </div>
  );
}
