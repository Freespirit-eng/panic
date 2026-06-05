import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Map, 
  Users, 
  BarChart3, 
  Radio, 
  HelpCircle, 
  RefreshCw, 
  Search, 
  Bell, 
  User, 
  Compass, 
  ShieldAlert, 
  Activity, 
  Sliders,
  Settings as SettingsIcon,
  ServerCrash,
  ExternalLink
} from 'lucide-react';
import { Incident, Mission, Alert, EOCStats, Geofence, Hotspot, SensorFeed, Volunteer } from './types';

// Importing Views
import Overview from './components/Overview';
import IncidentFeed from './components/IncidentFeed';
import IntelligenceMap from './components/IntelligenceMap';
import DispatchOperations from './components/DispatchOperations';
import AnalyticsView from './components/AnalyticsView';
import AlertCenter from './components/AlertCenter';
import CitizenReporting from './components/CitizenReporting';
import CitizenPortal from './components/CitizenPortal';

export default function App() {
  const [appMode, setAppMode] = useState<'command' | 'citizen'>('command');
  const [currentView, setCurrentView] = useState<string>('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [broadcasts, setBroadcasts] = useState<Alert[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [sensors, setSensors] = useState<SensorFeed[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [stats, setStats] = useState<EOCStats>({
    activeIncidents: 0,
    criticalEmergencies: 0,
    respondersDeployed: 0,
    citizensImpacted: 0,
    aiVerifiedReports: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Re-sync all EOC parameters from backend
  const syncPlatformData = async () => {
    try {
      setErrorState(null);
      const [statsRes, incidentsRes, missionsRes, broadcastsRes, geofencesRes, hotspotsRes, sensorsRes, volunteersRes] = await Promise.all([
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/incidents').then(r => r.json()),
        fetch('/api/missions').then(r => r.json()),
        fetch('/api/broadcasts').then(r => r.json()),
        fetch('/api/geofences').then(r => r.json()),
        fetch('/api/hotspots').then(r => r.json()),
        fetch('/api/sensors').then(r => r.json()),
        fetch('/api/volunteers').then(r => r.json())
      ]);

      setStats(statsRes);
      setIncidents(incidentsRes);
      setMissions(missionsRes);
      setBroadcasts(broadcastsRes);
      setGeofences(geofencesRes);
      setHotspots(hotspotsRes);
      setSensors(sensorsRes);
      setVolunteers(volunteersRes);
    } catch (err: any) {
      console.error("Express synchronization mismatch:", err);
      setErrorState("FEMA Secure Comm Pipeline disconnected. Resynchronizing radio cells...");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterVolunteer = async (volunteerData: { name: string; phone: string; lat: number; lng: number; skills: string[]; equipment: string[]; notifyRadiusKm: number }) => {
    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(volunteerData)
      });
      if (res.ok) {
        await syncPlatformData();
      }
    } catch (err) {
      console.error("Volunteer registration error:", err);
    }
  };

  const handleAcceptVolunteerAlert = async (volId: string, alertId: string) => {
    try {
      const res = await fetch(`/api/volunteers/${volId}/alert/${alertId}/accept`, {
        method: 'POST'
      });
      if (res.ok) {
        await syncPlatformData();
      }
    } catch (err) {
      console.error("Volunteer alert acceptance error:", err);
    }
  };


  useEffect(() => {
    syncPlatformData();
    // Automated sync polling every 10 seconds to mimic real-time telemetry
    const interval = setInterval(syncPlatformData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Dispatch Mission Creation API flow
  const handleTriggerMission = async (incidentId: string) => {
    try {
      const res = await fetch('/api/missions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId })
      });
      if (res.ok) {
        await syncPlatformData();
        setCurrentView('Dispatch Operations'); // Shift control to action center
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Perform operational dispatch actions
  const handleDispatchAction = async (id: string, action: 'Assign' | 'Dispatch' | 'Resolve', assignedTeam?: string) => {
    try {
      const res = await fetch(`/api/missions/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, assignedTeam })
      });
      if (res.ok) {
        await syncPlatformData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upate manual incident assessment validation
  const handleUpdateVerification = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await syncPlatformData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Broadcast Alert Notification
  const handleBroadcastAlert = async (alertData: Omit<Alert, 'id' | 'timestamp'>) => {
    try {
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
      if (res.ok) {
        await syncPlatformData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Citizen report submission API Proxy
  const handleCitizenReportSubmit = async (data: { description: string; locationInput: string; imageBase64: string }) => {
    const res = await fetch('/api/citizens/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("EOC citizen upload stream failed");
    const json = await res.json();
    await syncPlatformData();
    return json;
  };

  const handleAddGeofence = async (name: string, lat: number, lng: number, radiusKm: number, severityLimit: string) => {
    try {
      const res = await fetch('/api/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lat, lng, radiusKm, severityLimit })
      });
      if (res.ok) {
        await syncPlatformData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGeofence = async (id: string) => {
    try {
      const res = await fetch(`/api/geofences/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await syncPlatformData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Global search filtering
  const filteredIncidents = incidents.filter(i => 
    i.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMissions = missions.filter(m => 
    m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.assignedTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBroadcasts = broadcasts.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigationItems = [
    { name: 'Overview', icon: <Compass className="h-4 w-4" /> },
    { name: 'Live Incidents', icon: <ShieldAlert className="h-4 w-4" />, badge: stats.activeIncidents },
    { name: 'Dispatch Operations', icon: <Users className="h-4 w-4" />, badge: missions.filter(m => m.status === 'Awaiting Assignment').length },
    { name: 'Intelligence Map', icon: <Map className="h-4 w-4" /> },
    { name: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { name: 'Alert Center', icon: <Radio className="h-4 w-4" /> },
    { name: 'Citizen Reporting', icon: <Activity className="h-4 w-4" /> },
    { name: 'Settings', icon: <Sliders className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col selection:bg-blue-600/30 font-sans text-gray-200">
      
      {/* Top Administration Navigation Bar */}
      <header className="sticky top-0 bg-[#0B1220] border-b border-gray-805 px-4 h-16 flex items-center justify-between z-40">
        
        {/* Brand Logo and Code status */}
        <div className="flex items-center gap-2">
          <div 
            onClick={() => {
              setAppMode('command');
              setCurrentView('Overview');
            }}
            className="px-2.5 py-1 bg-[#dc2626] hover:bg-red-700 text-white font-mono font-black text-sm tracking-tight rounded cursor-pointer transition shrink-0 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.4)] border border-red-400 animate-pulse select-none"
            title="Panic Sense Core"
          >
            !!!
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-white tracking-widest font-mono flex items-center gap-1.5 leading-none">
              PANIC SENSE <span className="text-blue-500 font-extrabold text-[11px] bg-blue-950 px-1 border border-blue-900 rounded">CORE</span>
            </h1>
            <span className="text-[9px] font-mono text-gray-500 font-bold uppercase tracking-widest block mt-0.5">
              {appMode === 'command' ? 'Disaster Intelligence Core' : 'Citizen Safety Network'}
            </span>
          </div>
        </div>

        {/* Dual Mode Switcher Segmented Controller */}
        <div className="flex bg-gray-950 border border-gray-850 p-1 rounded-lg select-none gap-1 max-w-[280px] xs:max-w-[340px] w-full mx-2 sm:mx-4">
          <button
            id="header-desk-toggle"
            onClick={() => {
              setAppMode('command');
              setCurrentView('Overview');
              setSearchQuery('');
            }}
            className={`flex-1 py-1.5 px-2 text-[10px] sm:text-xs font-mono font-black rounded transition flex items-center justify-center gap-1.5 ${
              appMode === 'command' 
                ? 'bg-blue-600 text-white shadow shadow-blue-950' 
                : 'text-gray-400 hover:text-white hover:bg-gray-900/35'
            }`}
          >
            <Shield className="h-3.5 w-3.5 shrink-0" />
            <span>COMMAND DESK</span>
          </button>
          <button
            id="header-citizen-toggle"
            onClick={() => {
              setAppMode('citizen');
              setSearchQuery('');
            }}
            className={`flex-1 py-1.5 px-2 text-[10px] sm:text-xs font-mono font-black rounded transition flex items-center justify-center gap-1.5 ${
              appMode === 'citizen' 
                ? 'bg-green-600 text-white shadow shadow-green-950' 
                : 'text-gray-400 hover:text-white hover:bg-gray-900/35'
            }`}
          >
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>CITIZEN PORTAL</span>
          </button>
        </div>

        {/* Counters & Commander Badge */}
        <div className="flex items-center gap-4 shrink-0">
          
          {/* Active Counters Indicator badge / Connection Status */}
          {appMode === 'command' ? (
            <div className="hidden xl:flex items-center gap-3 font-mono text-[10px] bg-gray-950 border border-gray-850 px-3 py-1.5 rounded-lg select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-650 animate-ping" />
                <span className="text-gray-450 uppercase">ACTIVE RADAR SECTORS:</span>
                <strong className="text-white text-xs">{stats.activeIncidents}</strong>
              </div>
              <span className="text-gray-800">|</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-450 uppercase">CRITICAL CRITICALS:</span>
                <strong className="text-red-500 text-xs animate-pulse">{stats.criticalEmergencies}</strong>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] bg-[#111c16]/70 border border-green-800/45 px-3 py-1.5 rounded-lg text-green-400 font-extrabold select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              PORTAL SECURED
            </div>
          )}

          {/* User Bio badges */}
          {appMode === 'command' ? (
            <div className="flex items-center gap-2 hover:bg-gray-900/40 p-1.5 px-2.5 rounded border border-transparent hover:border-gray-800 transition cursor-pointer select-none">
              <div className="w-7 h-7 bg-blue-950 border border-blue-900 text-blue-400 font-mono text-xs font-black flex items-center justify-center rounded">
                RC
              </div>
              <div className="hidden lg:block text-left text-[10px] leading-tight font-mono">
                <div className="text-white font-extrabold uppercase">CMD. KAILASH</div>
                <div className="text-gray-500 font-bold mt-0.5">EOC ZONAL COMPTROLLER</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 hover:bg-gray-900/40 p-1.5 px-2.5 rounded border border-transparent hover:border-gray-800 transition cursor-pointer select-none">
              <div className="w-7 h-7 bg-green-950 border border-green-905 text-green-400 font-mono text-xs font-black flex items-center justify-center rounded">
                CZ
              </div>
              <div className="hidden lg:block text-left text-[10px] leading-tight font-mono font-sans font-bold">
                <div className="text-white font-extrabold uppercase">CIVILIAN USER</div>
                <div className="text-gray-500 font-bold mt-0.5 font-sans">SECURE DATA VIEW</div>
              </div>
            </div>
          )}

        </div>
      </header>

      {/* Dynamic Live Emergency Alert / Geofence Marquee Ribbon */}
      <div className={`backdrop-blur-sm border-b h-10 flex items-center px-4 font-mono text-xs overflow-hidden shrink-0 select-none ${
        appMode === 'command' 
          ? 'bg-red-950/40 border-red-900/40 text-red-100' 
          : 'bg-green-950/20 border-green-950/40 text-green-455'
      }`}>
        <div className={`flex items-center gap-1.5 font-black tracking-widest shrink-0 uppercase mr-6 border px-2 py-0.5 rounded text-[10px] animate-pulse ${
          appMode === 'command'
            ? 'bg-red-900/85 border-red-800 text-white'
            : 'bg-green-900/60 border-green-800 text-white'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          {appMode === 'command' ? 'SECURE INTEL SENTRY' : 'SAFETY BROADCAST'}
        </div>
        <div className="flex-1 overflow-hidden relative h-5 flex items-center">
          <div className="animate-marquee whitespace-nowrap flex gap-12 items-center text-[11.5px] select-none text-red-200">
            {broadcasts.length > 0 ? (
              [0, 1].map((setIndex) => (
                <div key={setIndex} className="flex gap-12 items-center">
                  {broadcasts.slice(0, 5).map((b, bIdx) => (
                    <span key={`${b.id}-${bIdx}-${setIndex}`} className="flex items-center gap-2">
                      <span className={`font-extrabold pb-0.5 px-1 border rounded text-[9px] ${
                        appMode === 'command'
                          ? 'text-red-400 bg-red-950/80 border-red-905/30'
                          : 'text-green-400 bg-green-950/80 border-green-905/30'
                      }`}>[{b.type.toUpperCase()}]</span>
                      <span className="font-sans font-medium text-gray-200">{b.title}:</span>
                      <span className="text-gray-400">{b.message}</span>
                      <span className="text-red-950/70">•</span>
                    </span>
                  ))}
                </div>
              ))
            ) : (
              <span className="text-gray-455">All sectors within nominal limits. Grid North clear. Autonomous active geofence boundaries monitoring live.</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Structural Splitter layout */}
      <div className="flex flex-1 items-stretch">
        
        {/* Left Side Navigation Sidebar */}
        {appMode === 'command' && (
          <aside className="hidden md:flex w-64 bg-[#0B1220] border-r border-gray-805 flex-col h-[calc(100vh-64px)] justify-between sticky top-16 select-none shrink-0">
          <div className="py-5 space-y-4">
            
            {/* Sec Net Status decoration */}
            <div className="px-5">
              <div className="bg-gray-950/70 border border-gray-850 p-2.5 rounded font-mono text-[9px] text-gray-400">
                <div className="flex items-center justify-between text-gray-450 mb-1">
                  <span>CRYPTO CIPHER LEVEL</span>
                  <span className="text-green-500">SECURE [512]</span>
                </div>
                <div className="w-full bg-gray-850 h-1 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded" style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1 px-3">
              {navigationItems.map((item) => {
                const isActive = currentView === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setCurrentView(item.name);
                      setSearchQuery(''); // Reset search on route jump
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded font-mono text-xs transition duration-150 ${
                      isActive 
                        ? 'bg-blue-600/10 text-blue-400 font-bold border-l-3 border-blue-500' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-sans font-medium tracking-tight whitespace-nowrap">{item.name}</span>
                    </div>

                    {/* Numeric counts badge inside button */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-red-950 border border-red-900 text-red-500 text-[9px] font-extrabold px-1.5 py-0.5 rounded animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Infrastructure Footer details */}
          <div className="p-5 border-t border-gray-805 space-y-2 text-[9px] font-mono text-gray-500">
            <div className="flex items-center justify-between">
              <span>LOCAL EPOCH:</span>
              <span className="text-gray-400">{new Date().toISOString().slice(11, 19)} UTC</span>
            </div>
            <div className="flex items-center justify-between">
              <span>GIS INTERLINK:</span>
              <span className="text-teal-400 select-all">BANGALORE-GRID</span>
            </div>
          </div>
        </aside>
        )}

        {/* Mobile Nav Header overlay wrapper for small viewports */}
        {appMode === 'command' && (
          <div className="md:hidden sticky top-16 bg-[#0B1220]/95 backdrop-blur-md px-3 py-2 flex items-center gap-1.5 overflow-x-auto border-b border-gray-805 select-none z-30">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setCurrentView(item.name)}
                className={`px-3 py-1 text-[11px] font-sans font-bold rounded transition whitespace-nowrap ${
                  currentView === item.name ? 'bg-blue-600 font-extrabold text-white' : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}

        {/* Central Layout Canvas Viewport */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full">
          
          {/* Signal failure Warning bars */}
          {errorState && (
            <div className="mb-4 bg-red-950 border border-red-900 text-red-400 text-xs p-3.5 rounded font-mono animate-pulse flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ServerCrash className="h-4.5 w-4.5" />
                {errorState}
              </span>
              <button 
                onClick={syncPlatformData}
                className="bg-red-900/40 border border-red-800 text-red-100 hover:bg-red-850 px-2.5 py-1 rounded"
              >
                RE-KEY COARDS
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="h-[500px] flex flex-col items-center justify-center font-mono space-y-3">
              <RefreshCw className="h-9 w-9 text-blue-500 animate-spin" />
              <div className="text-xs text-gray-450">LOADING INTEGRATED DISASTER TELEMETRY LEDGER...</div>
            </div>
          ) : appMode === 'citizen' ? (
            <CitizenPortal 
              onSubmitReport={handleCitizenReportSubmit} 
              broadcasts={broadcasts}
              volunteers={volunteers}
              onRegisterVolunteer={handleRegisterVolunteer}
              onAcceptAlert={handleAcceptVolunteerAlert}
              onBackToCommand={() => {
                setAppMode('command');
                setCurrentView('Overview');
              }}
            />
          ) : (
            /* Selected Component Switchboard Routing */
            <div>
              {currentView === 'Overview' && (
                <Overview 
                  stats={stats} 
                  incidents={incidents} 
                  missions={missions} 
                  sensors={sensors}
                  hotspots={hotspots}
                  onNavigateTo={(view) => {
                    setCurrentView(view);
                    setSearchQuery('');
                  }}
                />
              )}

              {currentView === 'Live Incidents' && (
                <IncidentFeed 
                  incidents={searchQuery ? filteredIncidents : incidents} 
                  onTriggerMission={handleTriggerMission}
                  onRefresh={syncPlatformData}
                  onUpdateVerification={handleUpdateVerification}
                />
              )}

              {currentView === 'Dispatch Operations' && (
                <DispatchOperations 
                  missions={searchQuery ? filteredMissions : missions} 
                  onAction={handleDispatchAction}
                  onRefresh={syncPlatformData}
                />
              )}

              {currentView === 'Intelligence Map' && (
                <IntelligenceMap 
                  incidents={searchQuery ? filteredIncidents : incidents} 
                  onTriggerMission={handleTriggerMission}
                  missions={missions}
                  geofences={geofences}
                  hotspots={hotspots}
                  sensors={sensors}
                  onAddGeofence={handleAddGeofence}
                  onDeleteGeofence={handleDeleteGeofence}
                  volunteers={volunteers}
                />
              )}

              {currentView === 'Analytics' && (
                <AnalyticsView incidents={incidents} />
              )}

              {currentView === 'Alert Center' && (
                <AlertCenter 
                  alerts={searchQuery ? filteredBroadcasts : broadcasts} 
                  onBroadcastAlert={handleBroadcastAlert}
                />
              )}

              {currentView === 'Citizen Reporting' && (
                <div id="portal-redirect-card" className="max-w-xl mx-auto bg-card border border-gray-805 p-8 rounded-lg text-center space-y-6 glow-blue text-gray-300">
                  <div className="w-16 h-16 bg-[#162721] border border-green-800 text-green-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-mono font-extrabold text-white tracking-widest uppercase">
                      CITIZEN SUBMISSIONS SEGREGATED
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto font-sans">
                      Per high-integrity operational specifications, the citizen submission terminal has been separated from secure EOC dispatch operations.
                    </p>
                  </div>
                  <div className="p-3.5 bg-gray-950 border border-gray-850 rounded-lg text-left font-sans text-xs space-y-1.5 leading-relaxed">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-black text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      SEPARATE PUBLIC WORKSPACE
                    </div>
                    Citizens have their own customized, safe public gateway dashboard, completely independent of responder database tables, alerts, maps, and dispatch rosters.
                  </div>
                  <button
                    id="redirect-to-portal-btn"
                    onClick={() => setAppMode('citizen')}
                    className="w-full py-2.5 bg-green-650 hover:bg-green-700 text-xs font-mono font-black text-white rounded transition tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Open Active Citizen Portal View
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Dynamic Emergency Settings Center */}
              {currentView === 'Settings' && (
                <div className="max-w-xl mx-auto bg-card border border-gray-800 p-6 rounded-lg space-y-6 glow-blue">
                  <div className="border-b border-gray-800 pb-3">
                    <h3 className="text-sm font-mono font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-blue-500" />
                      EOC COGNITIVE CONTROL ADJUSTER
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">PLATFORM BUILD ID: RESCUE-V2-SECURE • MODULE: CORE-SETTINGS</p>
                  </div>

                  <div className="space-y-4 text-xs font-mono text-gray-300">
                    <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-850 rounded">
                      <div>
                        <strong>SECURE VISION LEVEL RED AUTO-TRIP</strong>
                        <p className="text-[10px] text-gray-500 mt-1 font-sans">Trips red-code automatic evacuation notices when vision flood risk metrics cross 90%.</p>
                      </div>
                      <span className="bg-red-950 text-red-500 px-2.5 py-1 text-[10px] border border-red-900 rounded font-bold uppercase animate-pulse">ACTIVE</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-850 rounded">
                      <div>
                        <strong>INTEGRATED GEMINI MODEL TARGET</strong>
                        <p className="text-[10px] text-gray-500 mt-1 font-sans">Dynamic cognitive parser models associated with incoming social media text extraction.</p>
                      </div>
                      <span className="bg-blue-950 text-blue-400 px-2.5 py-1 text-[10px] border border-blue-900 rounded font-bold">gemini-3.5-flash</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-850 rounded">
                      <div>
                        <strong>BANGALORE SECTOR CELL MAP RATIO</strong>
                        <p className="text-[10px] text-gray-500 mt-1 font-sans">Calibrated geometric coordinate ratios centered around urban Bangalore grids.</p>
                      </div>
                      <span className="text-gray-300 px-2 py-1 bg-gray-900 rounded">1.00 BASE</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-850 rounded">
                      <div>
                        <strong>EOC LOCAL SERVER INTEGRITY LINK</strong>
                        <p className="text-[10px] text-gray-550 mt-1 font-sans">Real-time dynamic dynamic state replication connection with local database system.</p>
                      </div>
                      <span className="text-green-500 font-extrabold uppercase">CONNECTED</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <button
                      onClick={syncPlatformData}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-xs font-mono font-bold text-white rounded transition"
                    >
                      FORCE MANIFEST UPDATE SYNC
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
