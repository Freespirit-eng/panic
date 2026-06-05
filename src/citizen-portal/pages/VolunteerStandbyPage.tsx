import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  User,
  Phone,
  MapPin,
  Wrench,
  Heart,
  Radio,
  Zap,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  Bell,
  BellRing,
  Navigation,
  ChevronRight,
  UserCheck,
  WifiOff,
  Wifi,
  SlidersHorizontal,
  X,
  RefreshCw,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { citizenApi, RegisterVolunteerRequest } from '../services/citizenApi';
import { Volunteer, SeverityLevel, VolunteerAlertNotification } from '../../shared/types';
import { useToast } from '../components/ToastProvider';

// ─── Constants ────────────────────────────────────────────────────────────────

const SKILLS_OPTIONS = [
  'First Aid',
  'Swift Water Rescue',
  'Search & Rescue',
  'Medical',
  'Communications',
  'Engineering',
];

const EQUIPMENT_OPTIONS = [
  'Zodiac Boat',
  'Life Vests',
  'Trauma Kit',
  'Radio',
  'AED',
  'Generator',
];

const STORAGE_KEY = 'panicsense_volunteer_id';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const severityConfig: Record<SeverityLevel, { badge: string; dot: string; label: string }> = {
  Critical: {
    badge: 'bg-red-500/20 border border-red-500/50 text-red-400',
    dot: 'bg-red-500',
    label: 'CRITICAL',
  },
  High: {
    badge: 'bg-orange-500/20 border border-orange-500/50 text-orange-400',
    dot: 'bg-orange-500',
    label: 'HIGH',
  },
  Medium: {
    badge: 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400',
    dot: 'bg-yellow-400',
    label: 'MEDIUM',
  },
  Low: {
    badge: 'bg-green-500/20 border border-green-500/50 text-green-400',
    dot: 'bg-green-500',
    label: 'LOW',
  },
};

const statusConfig: Record<Volunteer['status'], { color: string; bg: string; icon: React.ReactNode }> = {
  Available: {
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/30',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  'On Mission': {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/30',
    icon: <Navigation className="w-3.5 h-3.5" />,
  },
  Offline: {
    color: 'text-gray-500',
    bg: 'bg-gray-700/20 border-gray-600/30',
    icon: <WifiOff className="w-3.5 h-3.5" />,
  },
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
  icon,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
  icon: React.ReactNode;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
      <label className="text-[10px] font-mono text-gray-500 tracking-widest uppercase flex items-center gap-2 mb-3">
        {icon} {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`text-[11px] font-mono px-3 py-1.5 rounded-md border transition select-none ${
              selected.includes(opt)
                ? 'bg-green-500/15 border-green-500/50 text-green-300'
                : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            {selected.includes(opt) && <span className="mr-1.5">✓</span>}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  onAccept,
  accepting,
}: {
  key?: React.Key;
  alert: VolunteerAlertNotification;
  onAccept: (alertId: string) => void | Promise<void>;
  accepting: boolean;
}) {
  const cfg = severityConfig[alert.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-[#0B1220] border rounded-xl overflow-hidden ${
        alert.accepted ? 'border-gray-800 opacity-60' : 'border-gray-700'
      }`}
    >
      {/* Severity stripe */}
      <div className={`h-0.5 w-full ${cfg.dot}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${cfg.dot} ${!alert.accepted ? 'animate-pulse' : ''}`} />
            <h4 className="text-sm font-mono font-bold text-white leading-tight">{alert.title}</h4>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        <p className="text-xs text-gray-400 mb-3 leading-relaxed">{alert.message}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] font-mono text-gray-600">
            <span className="flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              {alert.distanceKm.toFixed(1)} km away
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(alert.timestamp)}
            </span>
          </div>

          {alert.accepted ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-md">
              <CheckCircle2 className="w-3 h-3" /> ACCEPTED
            </span>
          ) : (
            <button
              type="button"
              id={`accept-alert-${alert.id}`}
              onClick={() => onAccept(alert.id)}
              disabled={accepting}
              className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 px-3 py-1.5 rounded-md transition"
            >
              {accepting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              ACCEPT MISSION
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VolunteerStandbyPage() {
  // — Registration form state —
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [radius, setRadius] = useState(5);

  // — Page state —
  const [volunteerId, setVolunteerId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const toast = useToast();

  // ── Fetch volunteer data ──────────────────────────────────────────────────
  const fetchVolunteer = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const data = await citizenApi.getVolunteerById(id);
      setVolunteer(data);
    } catch {
      // If fetch fails (e.g. server offline), clear stored ID
      localStorage.removeItem(STORAGE_KEY);
      setVolunteerId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load volunteer on mount if ID exists ─────────────────────────────────
  useEffect(() => {
    if (volunteerId) {
      fetchVolunteer(volunteerId);
    }
  }, [volunteerId, fetchVolunteer]);

  // ── Socket.IO real-time connection ────────────────────────────────────────
  useEffect(() => {
    if (!volunteerId) return;

    const socket = io('http://localhost:3000', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_room', 'stats_update');
    });

    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('stats_update', () => {
      // Refresh volunteer data on any system-level stats update
      if (volunteerId) fetchVolunteer(volunteerId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [volunteerId, fetchVolunteer]);

  // ── Registration submit ───────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setRegError('Name and phone are required.');
      return;
    }
    if (!address.trim()) {
      setRegError('Please enter your location address.');
      return;
    }

    setIsRegistering(true);
    setRegError('');

    const payload: RegisterVolunteerRequest = {
      name: name.trim(),
      phone: phone.trim(),
      lat: lat ? parseFloat(lat) : 0,
      lng: lng ? parseFloat(lng) : 0,
      address: address.trim(),
      skills,
      equipment,
      notifyRadiusKm: radius,
    };

    try {
      const result = await citizenApi.registerAsVolunteer(payload);
      localStorage.setItem(STORAGE_KEY, result.id);
      setVolunteerId(result.id);
      setVolunteer(result);
      toast.success(`✓ Welcome, ${result.name}! You are now registered as a volunteer.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Try again.';
      setRegError(msg);
      toast.error(msg);
    } finally {
      setIsRegistering(false);
    }
  };

  // ── Accept alert ─────────────────────────────────────────────────────────
  const handleAcceptAlert = async (alertId: string) => {
    if (!volunteer) return;
    setAcceptingId(alertId);
    try {
      await citizenApi.acceptVolunteerAlert(volunteer.id, alertId);
      // Optimistically update local state
      setVolunteer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'On Mission',
          receivedAlerts: prev.receivedAlerts.map((a) =>
            a.id === alertId ? { ...a, accepted: true } : a
          ),
        };
      });
      toast.success('✓ Mission accepted! Command center has been notified.');
    } catch {
      toast.error('Failed to accept mission. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  // ── Deregister (reset) ───────────────────────────────────────────────────
  const handleDeregister = () => {
    localStorage.removeItem(STORAGE_KEY);
    setVolunteerId(null);
    setVolunteer(null);
    socketRef.current?.disconnect();
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-green-400" />
          </div>
          <h2 className="text-base font-mono font-bold text-white tracking-widest uppercase">
            Volunteer Standby Terminal
          </h2>
          <span className="text-[10px] font-mono bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-0.5 rounded">
            M1
          </span>
        </div>
        <p className="text-xs text-gray-500 ml-11 font-mono">
          Register as a first responder · Receive mission alerts in real-time
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── LOADING ──────────────────────────────────────────────────────── */}
        {volunteerId && isLoading && !volunteer && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
            <p className="text-xs font-mono text-gray-500">Loading volunteer profile…</p>
          </motion.div>
        )}

        {/* ── REGISTRATION FORM ─────────────────────────────────────────────── */}
        {!volunteerId && !isLoading && (
          <motion.form
            key="register"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleRegister}
            className="space-y-4"
          >
            {/* Intro Banner */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-mono font-bold text-green-300 mb-0.5">
                  Join the Emergency Response Network
                </p>
                <p className="text-xs text-gray-400">
                  Register once to start receiving proximity-based mission alerts. Your skills and
                  equipment profile help the AI dispatch the right responder.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {regError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 bg-red-500/10 border border-red-500/40 rounded-xl p-3"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300 font-mono flex-1">{regError}</p>
                  <button type="button" onClick={() => setRegError('')}>
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Identity */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-3">
              <label className="text-[10px] font-mono text-gray-500 tracking-widest uppercase flex items-center gap-2">
                <User className="w-3 h-3" /> Identity
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-600 font-mono mb-1 block">FULL NAME</label>
                  <input
                    id="volunteer-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#0B1220] border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 font-mono mb-1 block">PHONE</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input
                      id="volunteer-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full bg-[#0B1220] border border-gray-700 text-white text-sm rounded-lg pl-9 pr-3 py-2.5 placeholder:text-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-3">
              <label className="text-[10px] font-mono text-gray-500 tracking-widest uppercase flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Your Location
              </label>
              <input
                id="volunteer-address"
                type="text"
                placeholder="Street address / neighbourhood…"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full bg-[#0B1220] border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition"
              />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'volunteer-lat', label: 'LAT', val: lat, set: setLat },
                  { id: 'volunteer-lng', label: 'LNG', val: lng, set: setLng },
                ].map((f) => (
                  <div key={f.id} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono">
                      {f.label}
                    </span>
                    <input
                      id={f.id}
                      type="number"
                      step="any"
                      placeholder="0.000000"
                      value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                      className="w-full bg-[#0B1220] border border-gray-700 text-white text-sm rounded-lg pl-11 pr-3 py-2.5 placeholder:text-gray-700 focus:outline-none focus:border-green-500 transition font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <CheckboxGroup
              label="Skills"
              options={SKILLS_OPTIONS}
              selected={skills}
              onChange={setSkills}
              icon={<Heart className="w-3 h-3" />}
            />

            {/* Equipment */}
            <CheckboxGroup
              label="Available Equipment"
              options={EQUIPMENT_OPTIONS}
              selected={equipment}
              onChange={setEquipment}
              icon={<Wrench className="w-3 h-3" />}
            />

            {/* Notify Radius */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
              <label className="text-[10px] font-mono text-gray-500 tracking-widest uppercase flex items-center gap-2 mb-4">
                <SlidersHorizontal className="w-3 h-3" /> Alert Radius
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="notify-radius"
                  type="range"
                  min={1}
                  max={20}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="flex-1 accent-green-500 cursor-pointer"
                />
                <div className="bg-[#0B1220] border border-gray-700 rounded-lg px-4 py-2 min-w-[72px] text-center">
                  <span className="text-lg font-mono font-bold text-green-400">{radius}</span>
                  <span className="text-[10px] text-gray-500 ml-1 font-mono">km</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 font-mono mt-2">
                You will be alerted for incidents within {radius} km of your location.
              </p>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              id="register-volunteer-btn"
              disabled={isRegistering}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-mono font-bold text-sm rounded-xl py-3.5 transition-colors shadow-lg shadow-green-900/30"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> REGISTERING…
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" /> JOIN VOLUNTEER NETWORK
                </>
              )}
            </motion.button>
          </motion.form>
        )}

        {/* ── STANDBY DASHBOARD ─────────────────────────────────────────────── */}
        {volunteer && !isLoading && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Volunteer Identity Card */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
              {/* Top accent bar */}
              <div
                className={`h-1 w-full ${
                  volunteer.status === 'Available'
                    ? 'bg-green-500'
                    : volunteer.status === 'On Mission'
                    ? 'bg-orange-500'
                    : 'bg-gray-600'
                }`}
              />
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <User className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-mono font-bold text-white">{volunteer.name}</h3>
                    <p className="text-xs text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3" /> {volunteer.phone}
                    </p>
                    <p className="text-xs text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3" /> {volunteer.location.address}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex flex-col items-end gap-2">
                  <div
                    className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-full border ${
                      statusConfig[volunteer.status].bg
                    } ${statusConfig[volunteer.status].color}`}
                  >
                    {statusConfig[volunteer.status].icon}
                    {volunteer.status.toUpperCase()}
                  </div>

                  {/* Socket Connection */}
                  <div
                    className={`flex items-center gap-1.5 text-[10px] font-mono ${
                      socketConnected ? 'text-green-500' : 'text-gray-600'
                    }`}
                  >
                    {socketConnected ? (
                      <Wifi className="w-3 h-3" />
                    ) : (
                      <WifiOff className="w-3 h-3" />
                    )}
                    {socketConnected ? 'LIVE' : 'OFFLINE'}
                  </div>
                </div>
              </div>

              {/* Skills + Equipment Row */}
              <div className="border-t border-gray-800 px-5 py-3 flex flex-wrap gap-1.5">
                {volunteer.skills.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded"
                  >
                    {s}
                  </span>
                ))}
                {volunteer.equipment.map((e) => (
                  <span
                    key={e}
                    className="text-[10px] font-mono bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded"
                  >
                    {e}
                  </span>
                ))}
              </div>

              {/* Notify radius + volunteer ID */}
              <div className="border-t border-gray-800 px-5 py-2.5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-600">
                  Radius: <span className="text-gray-400">{volunteer.notifyRadiusKm} km</span>
                  <span className="mx-2">·</span>
                  ID: <span className="text-gray-400">{volunteer.id.slice(0, 8).toUpperCase()}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    id="refresh-volunteer-btn"
                    type="button"
                    onClick={() => fetchVolunteer(volunteer.id)}
                    className="text-[10px] font-mono text-gray-500 hover:text-green-400 transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> REFRESH
                  </button>
                  <button
                    id="deregister-btn"
                    type="button"
                    onClick={handleDeregister}
                    className="text-[10px] font-mono text-gray-600 hover:text-red-400 transition"
                  >
                    LEAVE NETWORK
                  </button>
                </div>
              </div>
            </div>

            {/* Alert Inbox */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {volunteer.receivedAlerts.some((a) => !a.accepted) ? (
                    <BellRing className="w-4 h-4 text-orange-400 animate-pulse" />
                  ) : (
                    <Bell className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest">
                    Mission Alerts
                  </span>
                  {volunteer.receivedAlerts.length > 0 && (
                    <span className="text-[10px] font-mono bg-gray-700 border border-gray-600 text-gray-400 px-2 py-0.5 rounded-full">
                      {volunteer.receivedAlerts.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-gray-600">
                  {volunteer.receivedAlerts.filter((a) => !a.accepted).length} pending
                </span>
              </div>

              {volunteer.receivedAlerts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#111827] border border-gray-800 rounded-xl p-8 flex flex-col items-center gap-3 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-sm font-mono text-gray-500">No mission alerts yet</p>
                  <p className="text-xs text-gray-600">
                    You will be notified when an incident occurs within {volunteer.notifyRadiusKm} km
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {[...volunteer.receivedAlerts]
                    .sort((a, b) => {
                      // Un-accepted first, then by timestamp desc
                      if (a.accepted !== b.accepted) return a.accepted ? 1 : -1;
                      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                    })
                    .map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onAccept={handleAcceptAlert}
                        accepting={acceptingId === alert.id}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Total Alerts',
                  value: volunteer.receivedAlerts.length,
                  icon: <Bell className="w-4 h-4" />,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10 border-blue-500/20',
                },
                {
                  label: 'Accepted',
                  value: volunteer.receivedAlerts.filter((a) => a.accepted).length,
                  icon: <CheckCircle2 className="w-4 h-4" />,
                  color: 'text-green-400',
                  bg: 'bg-green-500/10 border-green-500/20',
                },
                {
                  label: 'Alert Radius',
                  value: `${volunteer.notifyRadiusKm} km`,
                  icon: <Radio className="w-4 h-4" />,
                  color: 'text-purple-400',
                  bg: 'bg-purple-500/10 border-purple-500/20',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-[#111827] border ${stat.bg} rounded-xl p-4 flex flex-col items-center gap-1.5`}
                >
                  <span className={stat.color}>{stat.icon}</span>
                  <span className={`text-xl font-mono font-bold ${stat.color}`}>{stat.value}</span>
                  <span className="text-[9px] text-gray-600 font-mono uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Mission tip */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 flex items-start gap-3">
              <Zap className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono font-bold text-yellow-300 mb-0.5">
                  Real-time Dispatch Active
                </p>
                <p className="text-xs text-gray-500">
                  The system is monitoring for incidents in your area. Keep this page open to receive
                  instant alerts. Accepting a mission notifies the command center of your deployment.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
