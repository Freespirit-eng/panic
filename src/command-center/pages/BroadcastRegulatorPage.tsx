import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radio, Clock, RefreshCw, AlertCircle,
  Download, CheckCircle2, Loader2, MessageSquare
} from 'lucide-react';
import { commanderApi } from '../services/commanderApi';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../hooks/useToast';
import { Broadcast } from '../../shared/types';

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

const BROADCAST_TYPES = ['Emergency Alert', 'Evacuation Notice', 'Road Closure', 'Rescue Update'] as const;
type BroadcastType = typeof BROADCAST_TYPES[number];

function typeBadge(t: string) {
  switch (t) {
    case 'Emergency Alert': return 'text-red-400 bg-red-950 border-red-800';
    case 'Evacuation Notice': return 'text-orange-400 bg-orange-950 border-orange-800';
    case 'Road Closure': return 'text-yellow-400 bg-yellow-950 border-yellow-800';
    case 'Rescue Update': return 'text-green-400 bg-green-950 border-green-800';
    default: return 'text-gray-400 bg-gray-900 border-gray-700';
  }
}

function queueStatusBadge(s: string) {
  switch (s) {
    case 'waiting': return 'text-yellow-400 bg-yellow-950 border-yellow-800';
    case 'active': return 'text-blue-400 bg-blue-950 border-blue-800';
    case 'completed': return 'text-green-400 bg-green-950 border-green-800';
    case 'failed': return 'text-red-400 bg-red-950 border-red-800';
    default: return 'text-gray-400 bg-gray-900 border-gray-700';
  }
}

// ── Analytics Summary ─────────────────────────────────────────────────────────

interface AnalyticsData {
  totalIncidents: number;
  activeIncidents: number;
  criticalEmergencies: number;
  citizensImpacted: number;
  bySeverity: Record<string, number>;
  byVerification: Record<string, number>;
  byMissionStatus: Record<string, number>;
  byType: Record<string, number>;
}

function AnalyticsSection({ data, onExport, exporting }: {
  data: AnalyticsData | null;
  onExport: () => void;
  exporting: boolean;
}) {
  const SEVERITY_COLORS: Record<string, string> = {
    Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e'
  };
  const VERIF_COLORS: Record<string, string> = {
    Verified: '#22c55e', Pending: '#eab308', Flagged: '#ef4444'
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400" />
          ANALYTICS OVERVIEW
        </h3>
        <button
          onClick={onExport}
          disabled={exporting}
          className="flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-blue-800 text-blue-400 hover:bg-blue-950/50 disabled:opacity-50 transition-colors"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          EXPORT CSV
        </button>
      </div>

      {!data ? (
        <div className="text-center text-gray-600 text-xs font-mono py-4 animate-pulse">Loading analytics...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Incidents', value: data.totalIncidents, color: 'text-blue-400' },
            { label: 'Active Incidents', value: data.activeIncidents, color: 'text-orange-400' },
            { label: 'Critical', value: data.criticalEmergencies, color: 'text-red-400' },
            { label: 'Citizens Impacted', value: data.citizensImpacted, color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
              <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-600 font-mono mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Severity */}
          <div>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">By Severity</p>
            <div className="space-y-1.5">
              {Object.entries(data.bySeverity).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-gray-400 font-mono">{k}</span>
                    <span className="text-gray-500">{v}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(v / (data.totalIncidents || 1)) * 100}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: SEVERITY_COLORS[k] ?? '#6b7280' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Funnel */}
          <div>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">Verification Funnel</p>
            <div className="space-y-1.5">
              {Object.entries(data.byVerification).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-gray-400 font-mono">{k}</span>
                    <span className="text-gray-500">{v}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(v / (data.totalIncidents || 1)) * 100}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: VERIF_COLORS[k] ?? '#6b7280' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mission Pipeline */}
          <div>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">Mission Pipeline</p>
            <div className="flex flex-col gap-1.5">
              {['Awaiting Assignment', 'Dispatched', 'En Route', 'Active', 'Resolved'].map(s => {
                const v = data.byMissionStatus?.[s] ?? 0;
                const STATUS_C: Record<string, string> = {
                  'Awaiting Assignment': '#6b7280',
                  Dispatched: '#eab308',
                  'En Route': '#60a5fa',
                  Active: '#22c55e',
                  Resolved: '#374151',
                };
                return (
                  <div key={s} className="flex items-center gap-2 text-[10px]">
                    <span className="text-gray-500 font-mono w-28 truncate">{s}</span>
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(v / 10) * 100}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: STATUS_C[s] }}
                      />
                    </div>
                    <span className="text-gray-600 w-4 text-right">{v}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Queue Monitor ─────────────────────────────────────────────────────────────

interface QueueJob {
  id: string | number;
  broadcastId?: string;
  status: string;
  attempts?: number;
  delay?: number;
}

function QueueMonitor() {
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await commanderApi.getBroadcastQueue();
      setJobs((data as QueueJob[]) ?? []);
    } catch {
      // Queue may be empty or unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
        <h3 className="text-sm font-mono font-bold text-white">DELIVERY QUEUE</h3>
        <span className="text-[10px] text-gray-600 font-mono ml-auto">auto-refreshes every 5s</span>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center text-gray-600 text-xs font-mono py-4">
          {loading ? 'Loading queue...' : 'Queue is empty'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Job ID', 'Broadcast ID', 'Status', 'Attempts', 'Delay (ms)'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-blue-400 text-[10px]">{String(job.id).slice(0, 8)}</td>
                  <td className="px-3 py-2 text-gray-400 font-mono text-[10px]">{job.broadcastId?.slice(0, 8) ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${queueStatusBadge(job.status)}`}>
                      {job.status === 'active' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse mr-1" />}
                      {job.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-400">{job.attempts ?? 0}</td>
                  <td className="px-3 py-2 text-gray-400 font-mono">{job.delay ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Broadcast Log Item ────────────────────────────────────────────────────────

function BroadcastItem({ broadcast }: { broadcast: Broadcast }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
    >
      <div className="shrink-0 mt-0.5">
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border inline-block ${typeBadge(broadcast.type)}`}>
          {broadcast.type.split(' ').map(w => w[0]).join('')}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-white truncate">{broadcast.title}</p>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{broadcast.message}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600 font-mono">
          <span>{broadcast.area}</span>
          <span>·</span>
          <span>{timeAgo(broadcast.timestamp)}</span>
          {broadcast.sentBy && <><span>·</span><span>{broadcast.sentBy}</span></>}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BroadcastRegulatorPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const { addToast } = useToast();

  const [form, setForm] = useState({
    type: 'Emergency Alert' as BroadcastType,
    title: '',
    message: '',
    area: '',
    useDelay: false,
    delayMins: 0,
  });
  const charLimit = 500;
  const sentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load data
  useEffect(() => {
    commanderApi.getBroadcasts().then(setBroadcasts).catch(() => {});
    commanderApi.getAnalyticsSummary().then(setAnalytics).catch(() => {});
  }, []);

  const handleBroadcastSent = useCallback((data: unknown) => {
    const b = data as Broadcast;
    setBroadcasts(prev => [b, ...prev]);
    addToast('broadcast', '📡 Broadcast Delivered', b.title);
  }, [addToast]);

  useSocket(
    ['broadcast_room'],
    { broadcast_sent: handleBroadcastSent }
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message || !form.area) {
      addToast('info', 'Validation', 'Title, message, and area are required');
      return;
    }
    setSending(true);
    try {
      const broadcast = await commanderApi.sendBroadcast({
        type: form.type,
        title: form.title,
        message: form.message,
        area: form.area,
        ...(form.useDelay && form.delayMins > 0 && { delayMs: form.delayMins * 60000 }),
      });
      setBroadcasts(prev => [broadcast, ...prev]);
      addToast('broadcast', '✅ Broadcast Sent', form.title);
      setSentSuccess(true);
      setForm({ type: 'Emergency Alert', title: '', message: '', area: '', useDelay: false, delayMins: 0 });
      if (sentTimer.current) clearTimeout(sentTimer.current);
      sentTimer.current = setTimeout(() => setSentSuccess(false), 4000);
    } catch {
      addToast('info', 'Error', 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await commanderApi.exportAnalytics();
      addToast('mission', 'Export Complete', 'CSV file downloaded');
    } catch {
      addToast('info', 'Error', 'Could not export analytics');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-black text-white font-mono tracking-wide">BROADCAST REGULATOR</h1>
        <p className="text-xs text-gray-500 font-mono">EOC Alert Composer &amp; Delivery Monitor</p>
      </div>

      {/* Composer + Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Composer */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-mono font-bold text-white">BROADCAST COMPOSER</h2>
          </div>

          <AnimatePresence>
            {sentSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-green-950 border border-green-800 rounded-lg px-4 py-3 mb-4"
              >
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-300 font-mono font-bold">Broadcast sent successfully!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-2">
                Broadcast Type
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {BROADCAST_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, type: t }))}
                    className={`text-[10px] font-mono font-bold px-3 py-2 rounded border transition-colors text-left
                      ${form.type === t ? typeBadge(t) : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
                Title
              </label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Immediate Evacuation Required"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
                required
              />
            </div>

            {/* Message */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                  Message
                </label>
                <span className={`text-[10px] font-mono ${form.message.length > charLimit - 50 ? 'text-red-400' : 'text-gray-600'}`}>
                  {form.message.length}/{charLimit}
                </span>
              </div>
              <textarea
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value.slice(0, charLimit) }))}
                rows={4}
                placeholder="Broadcast message..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600 resize-none transition-colors"
                required
              />
            </div>

            {/* Area */}
            <div>
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
                Target Area
              </label>
              <input
                value={form.area}
                onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                placeholder="e.g. Mission District, All Zones"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
                required
              />
            </div>

            {/* Delay toggle */}
            <div className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, useDelay: !p.useDelay }))}
                className={`relative w-9 h-5 rounded-full transition-colors border ${form.useDelay ? 'bg-blue-600 border-blue-500' : 'bg-gray-800 border-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.useDelay ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-xs text-gray-400 font-mono">Scheduled Delay</span>
              {form.useDelay && (
                <div className="flex items-center gap-2 ml-auto">
                  <input
                    type="range" min={0} max={60} step={1}
                    value={form.delayMins}
                    onChange={e => setForm(p => ({ ...p, delayMins: Number(e.target.value) }))}
                    className="w-24 accent-blue-500"
                  />
                  <span className="text-xs text-blue-400 font-mono w-12">{form.delayMins}m</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={sending}
              className={`w-full flex items-center justify-center gap-2 text-white text-xs font-mono font-bold py-3 rounded-lg transition-colors
                ${sending ? 'bg-blue-700 opacity-70' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
              {sending ? 'TRANSMITTING...' : 'SEND BROADCAST'}
            </button>
          </form>
        </div>

        {/* Broadcast Log */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-mono font-bold text-white">BROADCAST LOG</h2>
            <span className="text-[10px] text-gray-600 font-mono ml-auto">{broadcasts.length} total</span>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            <AnimatePresence>
              {broadcasts.length === 0 && (
                <div className="text-center text-gray-600 text-xs font-mono py-8">
                  No broadcasts yet
                </div>
              )}
              {broadcasts.map(b => (
                <div key={b.id}>
                  <BroadcastItem broadcast={b} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Queue Monitor */}
      <QueueMonitor />

      {/* Analytics Section */}
      <AnalyticsSection data={analytics} onExport={handleExport} exporting={exporting} />
    </div>
  );
}
