import React, { useState, useEffect } from 'react';
import { citizenRoutes } from './citizen-portal/routes/citizenRoutes';
import { commanderRoutes } from './command-center/routes/commanderRoutes';
import {
  Compass, ShieldAlert, Users, Map, BarChart3, Radio, Activity, Sliders,
  ShieldCheck, MessageSquare, Phone, Wifi, WifiOff
} from 'lucide-react';
import { useSocket } from './command-center/hooks/useSocket';
import { commanderApi } from './command-center/services/commanderApi';

export default function App() {
  const [appMode, setAppMode] = useState<'command' | 'citizen'>('command');
  const [currentPath, setCurrentPath] = useState<string>('dashboard');

  const [incidentCount, setIncidentCount] = useState(0);
  const [missionCount, setMissionCount] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const [epochTime, setEpochTime] = useState('');

  // Initial fetch for count badges
  useEffect(() => {
    commanderApi.getIncidents()
      .then(inc => {
        const active = inc.filter(i => i.verification !== 'Flagged').length;
        setIncidentCount(active);
      })
      .catch(() => {});

    commanderApi.getMissions()
      .then(mis => {
        const active = mis.filter(m => m.status !== 'Resolved').length;
        setMissionCount(active);
      })
      .catch(() => {});
  }, []);

  // Sync count badges in real-time using socket
  const socketRef = useSocket(
    ['incidents_feed', 'missions_feed'],
    {
      connect: () => setSocketConnected(true),
      disconnect: () => setSocketConnected(false),
      incident_created: () => {
        commanderApi.getIncidents()
          .then(inc => setIncidentCount(inc.filter(i => i.verification !== 'Flagged').length))
          .catch(() => {});
      },
      incident_updated: () => {
        commanderApi.getIncidents()
          .then(inc => setIncidentCount(inc.filter(i => i.verification !== 'Flagged').length))
          .catch(() => {});
      },
      incident_deleted: () => {
        commanderApi.getIncidents()
          .then(inc => setIncidentCount(inc.filter(i => i.verification !== 'Flagged').length))
          .catch(() => {});
      },
      mission_created: () => {
        commanderApi.getMissions()
          .then(mis => setMissionCount(mis.filter(m => m.status !== 'Resolved').length))
          .catch(() => {});
      },
      mission_updated: () => {
        commanderApi.getMissions()
          .then(mis => setMissionCount(mis.filter(m => m.status !== 'Resolved').length))
          .catch(() => {});
      }
    }
  );

  // Connection check loop
  useEffect(() => {
    const interval = setInterval(() => {
      setSocketConnected(socketRef.current?.connected ?? false);
    }, 2000);
    return () => clearInterval(interval);
  }, [socketRef]);

  // UTC clock update loop
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setEpochTime(`${hrs}:${mins}:${secs} UTC`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Resolve active page component based on simple path routing state
  const renderActiveRoute = () => {
    if (appMode === 'citizen') {
      const route = citizenRoutes.find(r => r.path === currentPath);
      return route ? route.element : <div className="text-white font-mono p-4">Citizen Portal Route Not Found</div>;
    } else {
      const route = commanderRoutes.find(r => r.path === currentPath);
      return route ? route.element : <div className="text-white font-mono p-4">Command Center Route Not Found</div>;
    }
  };

  const commandItems = [
    { label: 'Overview', path: 'dashboard', icon: Compass },
    { label: 'Live Incidents', path: 'incidents', icon: ShieldAlert, badge: incidentCount },
    { label: 'Dispatch Operations', path: 'dispatch', icon: Users, badge: missionCount },
    { label: 'Intelligence Map', path: 'map', icon: Map },
    { label: 'Analytics', path: 'analytics', icon: BarChart3 },
    { label: 'Alert Center', path: 'broadcast', icon: Radio },
    { label: 'Settings', path: 'settings', icon: Sliders },
  ];

  const citizenItems = [
    { label: 'Citizen Reporting', path: 'report', icon: Activity },
    { label: 'Volunteer Standby', path: 'volunteer', icon: ShieldCheck },
    { label: 'AI Assistant Chat', path: 'chat', icon: MessageSquare },
    { label: 'Resource Directory', path: 'directory', icon: Phone },
  ];

  return (
    <div className="flex h-screen bg-[#0B1220] overflow-hidden text-gray-200">
      {/* Left Sidebar */}
      <aside className="w-72 bg-[#070B13] border-r border-gray-800 flex flex-col shrink-0">
        {/* Header Logo */}
        <div className="p-5 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center font-mono font-black text-lg text-white tracking-tighter shadow-[0_0_12px_rgba(239,68,68,0.4)] border border-red-500/30 shrink-0">
              !!!
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-sm tracking-widest font-mono">PANIC SENSE</span>
                <span className="text-[10px] font-black text-blue-400 bg-blue-950/60 border border-blue-800 px-1 py-0.5 rounded leading-none shrink-0 font-mono">CORE</span>
              </div>
              <p className="text-[8px] text-gray-500 font-mono tracking-widest uppercase mt-0.5">DISASTER INTELLIGENCE CORE</p>
            </div>
          </div>
        </div>

        {/* Crypto Cipher Level box */}
        <div className="px-5 pt-4">
          <div className="border border-gray-800 rounded-lg p-3 bg-gray-900/10">
            <div className="flex justify-between text-[9px] font-mono tracking-wider">
              <span className="text-gray-500">CRYPTO CIPHER LEVEL</span>
              <span className="text-green-400 font-bold">SECURE [512]</span>
            </div>
            <div className="h-1 bg-green-950 rounded-full mt-2 overflow-hidden relative">
              <div className="h-full bg-green-500 rounded-full w-full shadow-[0_0_8px_#22c55e]" />
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Section 1: Command Center */}
          <div className="space-y-1">
            <p className="px-3 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-bold">EOC COMMAND DIVISION</p>
            <nav className="space-y-1 mt-2">
              {commandItems.map(item => {
                const active = appMode === 'command' && currentPath === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      setAppMode('command');
                      setCurrentPath(item.path);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all text-left
                      ${active 
                        ? 'bg-blue-955/40 text-blue-400 border-l-4 border-blue-500 pl-2 bg-[#0B1528]' 
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

          {/* Section 2: Citizen Services */}
          <div className="space-y-1">
            <p className="px-3 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-bold">CITIZEN SERVICES</p>
            <nav className="space-y-1 mt-2">
              {citizenItems.map(item => {
                const active = appMode === 'citizen' && currentPath === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      setAppMode('citizen');
                      setCurrentPath(item.path);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all text-left
                      ${active 
                        ? 'bg-green-955/40 text-green-400 border-l-4 border-green-500 pl-2 bg-[#0B2815]' 
                        : 'text-gray-400 hover:bg-gray-900/30 hover:text-white border-l-4 border-transparent'}`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-green-400' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-805 bg-gray-950/20 font-mono text-[9px] text-gray-500 space-y-1 shrink-0">
          <div className="flex justify-between">
            <span>LOCAL EPOCH:</span>
            <span className="text-gray-400 font-bold font-mono">{epochTime || '00:00:00 UTC'}</span>
          </div>
          <div className="flex justify-between">
            <span>GIS INTERLINK:</span>
            <span className="text-teal-400 font-bold font-mono">SF-GRID-ACTIVE</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0A0F1D] overflow-hidden">
        {/* Sleek Header Bar */}
        <header className="h-14 border-b border-gray-800 px-6 flex items-center justify-between shrink-0 bg-[#080d16]/30">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`} />
            <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">
              SECURE SECTOR // {appMode === 'command' ? 'EOC COMMAND' : 'CITIZEN ACCESS'}
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

        {/* Scrollable Page Wrapper */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderActiveRoute()}
        </div>
      </main>
    </div>
  );
}
