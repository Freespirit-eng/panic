import React, { useState, useEffect } from 'react';
import { citizenRoutes } from './citizen-portal/routes/citizenRoutes';
import { commanderRoutes } from './command-center/routes/commanderRoutes';
import {
  Compass, ShieldAlert, Users, Map, BarChart3, Radio, Activity, Sliders,
  ShieldCheck, MessageSquare, Phone, ArrowLeft, Shield, Heart, Zap
} from 'lucide-react';
import { useSocket } from './command-center/hooks/useSocket';
import { commanderApi } from './command-center/services/commanderApi';
import { ToastProvider as CitizenToastProvider } from './citizen-portal/components/ToastProvider';

type AppMode = 'landing' | 'command' | 'citizen';

// ─── Landing / Portal-Selection Screen ───────────────────────────────────────
function LandingScreen({ onSelect }: { onSelect: (mode: 'command' | 'citizen') => void }) {
  const [hovered, setHovered] = useState<'command' | 'citizen' | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 80);
    return () => clearInterval(t);
  }, []);

  const glitchChars = '!@#$%^&*01'.split('');
  const glitch = (seed: number) => glitchChars[(tick + seed) % glitchChars.length];

  return (
    <div className="min-h-screen bg-[#060A12] flex flex-col items-center justify-center relative overflow-hidden">
      {/* animated grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(30,60,120,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,60,120,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* radial glow center */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30,80,200,0.06) 0%, transparent 70%)' }}
      />

      {/* scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,#fff 2px,#fff 4px)' }}
      />

      {/* top corner labels */}
      <div className="absolute top-6 left-8 font-mono text-[9px] text-gray-700 tracking-widest uppercase">
        PANIC/SENSE // CORE v1.2.4-BETA
      </div>
      <div className="absolute top-6 right-8 font-mono text-[9px] text-gray-700 tracking-widest uppercase">
        SELECT ACCESS PROFILE
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center mb-16">
        <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-900 rounded-2xl flex items-center justify-center font-mono font-black text-2xl text-white shadow-[0_0_40px_rgba(239,68,68,0.35)] border border-red-500/30 mb-5">
          !!!
        </div>
        <h1 className="font-mono font-black text-white text-3xl tracking-[0.25em] uppercase">
          PANIC<span className="text-blue-400">SENSE</span>
        </h1>
        <p className="font-mono text-[10px] text-gray-500 tracking-[0.4em] uppercase mt-2">
          DISASTER INTELLIGENCE CORE
        </p>
        <div className="mt-4 font-mono text-[10px] text-gray-600 tracking-widest">
          <span className="text-red-500">{glitch(0)}</span>
          <span className="text-blue-400">{glitch(3)}</span>
          <span className="text-green-400">{glitch(6)}</span>
          &nbsp;&mdash;&nbsp;INITIALIZING PROFILE SELECTION&nbsp;&mdash;&nbsp;
          <span className="text-red-500">{glitch(9)}</span>
          <span className="text-blue-400">{glitch(1)}</span>
          <span className="text-green-400">{glitch(4)}</span>
        </div>
      </div>

      {/* Portal cards */}
      <div className="flex gap-8 z-10">
        {/* Citizen Portal Card */}
        <button
          id="portal-citizen"
          onClick={() => onSelect('citizen')}
          onMouseEnter={() => setHovered('citizen')}
          onMouseLeave={() => setHovered(null)}
          className="group relative w-72 h-80 rounded-2xl border transition-all duration-300 text-left overflow-hidden focus:outline-none"
          style={{
            background: hovered === 'citizen'
              ? 'linear-gradient(145deg,#0a2018,#051a10)'
              : 'linear-gradient(145deg,#0b1a14,#060e0a)',
            borderColor: hovered === 'citizen' ? '#22c55e' : '#1a3020',
            boxShadow: hovered === 'citizen'
              ? '0 0 40px rgba(34,197,94,0.2), inset 0 1px 0 rgba(34,197,94,0.15)'
              : '0 4px 24px rgba(0,0,0,0.4)',
            transform: hovered === 'citizen' ? 'translateY(-4px) scale(1.01)' : 'none',
          }}
        >
          {/* top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl transition-all duration-300"
            style={{ background: hovered === 'citizen' ? 'linear-gradient(90deg,transparent,#22c55e,transparent)' : 'transparent' }}
          />

          <div className="p-8 flex flex-col h-full">
            {/* Icon */}
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300"
              style={{
                background: hovered === 'citizen' ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.07)',
                border: '1px solid rgba(34,197,94,0.25)',
                boxShadow: hovered === 'citizen' ? '0 0 20px rgba(34,197,94,0.2)' : 'none',
              }}>
              <Heart className="w-7 h-7 text-green-400" />
            </div>

            <div className="font-mono font-black text-white text-xl tracking-wider mb-1">
              CITIZEN
            </div>
            <div className="font-mono text-green-400 text-xs tracking-widest mb-4 uppercase">
              Public Access Portal
            </div>
            <p className="text-gray-500 text-xs leading-relaxed font-mono mb-6 flex-1">
              Report emergencies, coordinate volunteer response, access AI assistance, and find emergency resources in your area.
            </p>

            <div className="space-y-1.5">
              {['Incident Reporting', 'Volunteer Standby', 'AI Chat Assistant', 'Resource Directory'].map(f => (
                <div key={f} className="flex items-center gap-2 font-mono text-[10px] text-gray-500">
                  <div className="w-1 h-1 rounded-full bg-green-500/60" />
                  {f}
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="font-mono text-[9px] text-green-500/60 tracking-widest uppercase">
                {hovered === 'citizen' ? '[ ENTER PORTAL → ]' : 'CLICK TO ACCESS'}
              </span>
              <div className="w-7 h-7 rounded-lg border border-green-800/50 flex items-center justify-center transition-all duration-300"
                style={{ background: hovered === 'citizen' ? 'rgba(34,197,94,0.15)' : 'transparent' }}>
                <Zap className="w-3.5 h-3.5 text-green-500" />
              </div>
            </div>
          </div>
        </button>

        {/* Enforcement / Command Card */}
        <button
          id="portal-enforcement"
          onClick={() => onSelect('command')}
          onMouseEnter={() => setHovered('command')}
          onMouseLeave={() => setHovered(null)}
          className="group relative w-72 h-80 rounded-2xl border transition-all duration-300 text-left overflow-hidden focus:outline-none"
          style={{
            background: hovered === 'command'
              ? 'linear-gradient(145deg,#0a1528,#060d1c)'
              : 'linear-gradient(145deg,#0b1220,#060a14)',
            borderColor: hovered === 'command' ? '#3b82f6' : '#1a2540',
            boxShadow: hovered === 'command'
              ? '0 0 40px rgba(59,130,246,0.2), inset 0 1px 0 rgba(59,130,246,0.15)'
              : '0 4px 24px rgba(0,0,0,0.4)',
            transform: hovered === 'command' ? 'translateY(-4px) scale(1.01)' : 'none',
          }}
        >
          {/* top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl transition-all duration-300"
            style={{ background: hovered === 'command' ? 'linear-gradient(90deg,transparent,#3b82f6,transparent)' : 'transparent' }}
          />

          <div className="p-8 flex flex-col h-full">
            {/* Icon */}
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300"
              style={{
                background: hovered === 'command' ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.07)',
                border: '1px solid rgba(59,130,246,0.25)',
                boxShadow: hovered === 'command' ? '0 0 20px rgba(59,130,246,0.2)' : 'none',
              }}>
              <Shield className="w-7 h-7 text-blue-400" />
            </div>

            <div className="font-mono font-black text-white text-xl tracking-wider mb-1">
              ENFORCEMENT
            </div>
            <div className="font-mono text-blue-400 text-xs tracking-widest mb-4 uppercase">
              EOC Command Center
            </div>
            <p className="text-gray-500 text-xs leading-relaxed font-mono mb-6 flex-1">
              Command & control operations, live incident triage, dispatch management, GIS intelligence, and system-wide analytics.
            </p>

            <div className="space-y-1.5">
              {['Live Incident Feed', 'Dispatch Operations', 'Intelligence Map', 'Broadcast & Analytics'].map(f => (
                <div key={f} className="flex items-center gap-2 font-mono text-[10px] text-gray-500">
                  <div className="w-1 h-1 rounded-full bg-blue-500/60" />
                  {f}
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="font-mono text-[9px] text-blue-500/60 tracking-widest uppercase">
                {hovered === 'command' ? '[ ENTER PORTAL → ]' : 'CLICK TO ACCESS'}
              </span>
              <div className="w-7 h-7 rounded-lg border border-blue-800/50 flex items-center justify-center transition-all duration-300"
                style={{ background: hovered === 'command' ? 'rgba(59,130,246,0.15)' : 'transparent' }}>
                <Zap className="w-3.5 h-3.5 text-blue-500" />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* bottom label */}
      <div className="absolute bottom-6 font-mono text-[9px] text-gray-700 tracking-widest uppercase">
        AUTHORIZED ACCESS ONLY // PANIC-SENSE FOUNDATION CORE
      </div>
    </div>
  );
}

// ─── Citizen Portal Shell ─────────────────────────────────────────────────────
function CitizenPortal({ onExit }: { onExit: () => void }) {
  const [currentPath, setCurrentPath] = useState('report');
  const [epochTime, setEpochTime] = useState('');

  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.path) {
        setCurrentPath(customEvent.detail.path);
      }
    };
    window.addEventListener('navigate-citizen-portal', handleNav);
    return () => window.removeEventListener('navigate-citizen-portal', handleNav);
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setEpochTime(`${h}:${m}:${s} UTC`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const navItems = [
    { label: 'Incident Reporting', path: 'report', icon: Activity },
    { label: 'Volunteer Standby', path: 'volunteer', icon: ShieldCheck },
    { label: 'AI Assistant Chat', path: 'chat', icon: MessageSquare },
    { label: 'Resource Directory', path: 'directory', icon: Phone },
  ];

  const renderPage = () => {
    const route = citizenRoutes.find(r => r.path === currentPath);
    return route ? route.element : <div className="text-white font-mono p-4">Page not found</div>;
  };

  return (
    <div className="flex h-screen bg-[#060e0a] overflow-hidden text-gray-200">
      {/* Sidebar */}
      <aside className="w-72 bg-[#040b07] border-r border-green-900/30 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-green-900/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-10 bg-gradient-to-br from-green-600 to-green-900 rounded-lg flex items-center justify-center font-mono font-black text-lg text-white tracking-tighter shadow-[0_0_12px_rgba(34,197,94,0.35)] border border-green-500/30 shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-sm tracking-widest font-mono">PANIC SENSE</span>
                <span className="text-[10px] font-black text-green-400 bg-green-950/60 border border-green-800 px-1 py-0.5 rounded leading-none shrink-0 font-mono">CIT</span>
              </div>
              <p className="text-[8px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">CITIZEN ACCESS PORTAL</p>
            </div>
          </div>
        </div>

        {/* Profile badge */}
        <div className="px-5 pt-4">
          <div className="border border-green-900/40 rounded-lg p-3 bg-green-950/10">
            <div className="flex justify-between text-[9px] font-mono tracking-wider">
              <span className="text-gray-500">ACCESS LEVEL</span>
              <span className="text-green-400 font-bold">PUBLIC [L1]</span>
            </div>
            <div className="h-1 bg-green-950 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full w-3/4 shadow-[0_0_8px_#22c55e]" />
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="px-3 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-bold mb-2">CITIZEN SERVICES</p>
          <nav className="space-y-1">
            {navItems.map(item => {
              const active = currentPath === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  id={`citizen-nav-${item.path}`}
                  onClick={() => setCurrentPath(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all text-left
                    ${active
                      ? 'text-green-400 border-l-4 border-green-500 pl-2 bg-[#071a0f]'
                      : 'text-gray-400 hover:bg-green-950/20 hover:text-white border-l-4 border-transparent'}`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-green-400' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-green-900/20 bg-green-950/10">
          <button
            id="citizen-exit-btn"
            onClick={onExit}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono text-gray-500 hover:text-white hover:bg-gray-800/40 transition-all border border-transparent hover:border-gray-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            CHANGE PORTAL
          </button>
          <div className="mt-3 font-mono text-[9px] text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>LOCAL EPOCH:</span>
              <span className="text-gray-400 font-bold">{epochTime || '00:00:00 UTC'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#060d0a] overflow-hidden">
        <header className="h-14 border-b border-green-900/20 px-6 flex items-center justify-between shrink-0 bg-[#040a06]/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#22c55e] animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">
              CITIZEN ACCESS // {navItems.find(n => n.path === currentPath)?.label ?? currentPath}
            </span>
          </div>
          <span className="text-[10px] font-mono text-green-600 font-bold">PUBLIC PORTAL ACTIVE</span>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

// ─── Enforcement / Command Portal Shell ───────────────────────────────────────
function EnforcementPortal({ onExit }: { onExit: () => void }) {
  const [currentPath, setCurrentPath] = useState('dashboard');
  const [incidentCount, setIncidentCount] = useState(0);
  const [missionCount, setMissionCount] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const [epochTime, setEpochTime] = useState('');

  useEffect(() => {
    commanderApi.getIncidents()
      .then(inc => setIncidentCount(inc.filter(i => i.verification !== 'Flagged').length))
      .catch(() => {});
    commanderApi.getMissions()
      .then(mis => setMissionCount(mis.filter(m => m.status !== 'Resolved').length))
      .catch(() => {});
  }, []);

  const socketRef = useSocket(
    ['incidents_feed', 'missions_feed'],
    {
      connect: () => setSocketConnected(true),
      disconnect: () => setSocketConnected(false),
      incident_created: () => commanderApi.getIncidents().then(inc => setIncidentCount(inc.filter(i => i.verification !== 'Flagged').length)).catch(() => {}),
      incident_updated: () => commanderApi.getIncidents().then(inc => setIncidentCount(inc.filter(i => i.verification !== 'Flagged').length)).catch(() => {}),
      incident_deleted: () => commanderApi.getIncidents().then(inc => setIncidentCount(inc.filter(i => i.verification !== 'Flagged').length)).catch(() => {}),
      mission_created: () => commanderApi.getMissions().then(mis => setMissionCount(mis.filter(m => m.status !== 'Resolved').length)).catch(() => {}),
      mission_updated: () => commanderApi.getMissions().then(mis => setMissionCount(mis.filter(m => m.status !== 'Resolved').length)).catch(() => {}),
    }
  );

  useEffect(() => {
    const interval = setInterval(() => setSocketConnected(socketRef.current?.connected ?? false), 2000);
    return () => clearInterval(interval);
  }, [socketRef]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setEpochTime(`${h}:${m}:${s} UTC`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const navItems = [
    { label: 'Overview', path: 'dashboard', icon: Compass },
    { label: 'Live Incidents', path: 'incidents', icon: ShieldAlert, badge: incidentCount },
    { label: 'Dispatch Ops', path: 'dispatch', icon: Users, badge: missionCount },
    { label: 'Intelligence Map', path: 'map', icon: Map },
    { label: 'Analytics', path: 'analytics', icon: BarChart3 },
    { label: 'Alert Center', path: 'broadcast', icon: Radio },
    { label: 'Settings', path: 'settings', icon: Sliders },
  ];

  const renderPage = () => {
    const route = commanderRoutes.find(r => r.path === currentPath);
    return route ? route.element : <div className="text-white font-mono p-4">Page not found</div>;
  };

  return (
    <div className="flex h-screen bg-[#0B1220] overflow-hidden text-gray-200">
      {/* Sidebar */}
      <aside className="w-72 bg-[#070B13] border-r border-gray-800 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-10 bg-gradient-to-br from-blue-600 to-blue-900 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.4)] border border-blue-500/30 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-sm tracking-widest font-mono">PANIC SENSE</span>
                <span className="text-[10px] font-black text-blue-400 bg-blue-950/60 border border-blue-800 px-1 py-0.5 rounded leading-none shrink-0 font-mono">EOC</span>
              </div>
              <p className="text-[8px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">ENFORCEMENT COMMAND CENTER</p>
            </div>
          </div>
        </div>

        {/* Access level */}
        <div className="px-5 pt-4">
          <div className="border border-gray-800 rounded-lg p-3 bg-gray-900/10">
            <div className="flex justify-between text-[9px] font-mono tracking-wider">
              <span className="text-gray-500">CRYPTO CIPHER LEVEL</span>
              <span className="text-blue-400 font-bold">SECURE [512]</span>
            </div>
            <div className="h-1 bg-blue-950 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full w-full shadow-[0_0_8px_#3b82f6]" />
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="px-3 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-bold mb-2">EOC COMMAND DIVISION</p>
          <nav className="space-y-1">
            {navItems.map(item => {
              const active = currentPath === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  id={`enforcement-nav-${item.path}`}
                  onClick={() => setCurrentPath(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all text-left
                    ${active
                      ? 'text-blue-400 border-l-4 border-blue-500 pl-2 bg-[#0B1528]'
                      : 'text-gray-400 hover:bg-gray-900/30 hover:text-white border-l-4 border-transparent'}`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 ? (
                    <span className="ml-auto bg-red-950/60 border border-red-800 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold leading-none">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800/50 bg-gray-950/20">
          <button
            id="enforcement-exit-btn"
            onClick={onExit}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono text-gray-500 hover:text-white hover:bg-gray-800/40 transition-all border border-transparent hover:border-gray-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            CHANGE PORTAL
          </button>
          <div className="mt-3 font-mono text-[9px] text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>LOCAL EPOCH:</span>
              <span className="text-gray-400 font-bold">{epochTime || '00:00:00 UTC'}</span>
            </div>
            <div className="flex justify-between">
              <span>GIS INTERLINK:</span>
              <span className="text-teal-400 font-bold">SF-GRID-ACTIVE</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0A0F1D] overflow-hidden">
        <header className="h-14 border-b border-gray-800 px-6 flex items-center justify-between shrink-0 bg-[#080d16]/30">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`} />
            <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">
              SECURE SECTOR // EOC COMMAND
            </span>
          </div>
          <div className="text-[10px] font-mono text-gray-600 flex items-center gap-2">
            {socketConnected
              ? <span className="text-green-500 font-bold">CONNECTED</span>
              : <span className="text-red-500 font-bold">DISCONNECTED</span>
            }
            <span>|</span>
            <span>v1.2.4-BETA</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('landing');

  if (appMode === 'landing') {
    return <LandingScreen onSelect={setAppMode} />;
  }
  if (appMode === 'citizen') {
    return (
      <CitizenToastProvider>
        <CitizenPortal onExit={() => setAppMode('landing')} />
      </CitizenToastProvider>
    );
  }
  return <EnforcementPortal onExit={() => setAppMode('landing')} />;
}
