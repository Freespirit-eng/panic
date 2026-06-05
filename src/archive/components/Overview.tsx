import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  UserCheck, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  Layers,
  Flame,
  Construction,
  Anchor
} from 'lucide-react';
import { EOCStats, Incident, Mission, SensorFeed, Hotspot } from '../types';

interface OverviewProps {
  stats: EOCStats;
  incidents: Incident[];
  missions: Mission[];
  onNavigateTo: (view: string) => void;
  sensors?: SensorFeed[];
  hotspots?: Hotspot[];
}

export default function Overview({ 
  stats, 
  incidents, 
  missions, 
  onNavigateTo,
  sensors = [],
  hotspots = []
}: OverviewProps) {
  // Compute regional severity matrix
  const typeCounts = incidents.reduce((acc, inc) => {
    acc[inc.type] = (acc[inc.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const criticalIncidents = incidents.filter(i => i.severity === 'Critical');
  const recentCritical = criticalIncidents.slice(0, 3);

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'Flood': return <Anchor className="h-5 w-5 text-blue-500" />;
      case 'Fire': return <Flame className="h-5 w-5 text-red-500" />;
      case 'Road Collapse': return <Construction className="h-5 w-5 text-orange-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            EMERGENCY INTEGRATED OPERATIONS COMMAND
          </h1>
          <p className="text-xs font-mono text-gray-400 mt-1">
            UNIT: RESCUE CONNECT SECURE CORE • DATA SYNCHRONIZATION ONLINE
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2 text-xs bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-gray-300 font-mono">
          <Calendar className="h-3 w-3 text-blue-500" />
          SYSTEM EPOCH: {new Date().toLocaleDateString()}
        </div>
      </div>      {/* Top KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Incidents */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-card border border-gray-800 p-4 rounded-lg relative overflow-hidden flex flex-col justify-between"
          id="kpi-active-incidents"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-gray-500 font-bold">Active Incidents</span>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{stats.activeIncidents}</span>
            <span className="text-[10px] text-red-500 font-mono font-bold">+12%</span>
          </div>
          <div className="mt-2 w-full bg-gray-800 h-1 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.activeIncidents * 12)}%` }} />
          </div>
        </motion.div>

        {/* Critical Emergencies */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-card border border-gray-800 border-l-4 border-l-red-600 p-4 rounded-lg relative overflow-hidden flex flex-col justify-between"
          id="kpi-critical"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-gray-400 font-bold">Critical</span>
            <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">0{stats.criticalEmergencies}</span>
            <span className="text-[10px] text-red-500 font-mono font-bold uppercase tracking-wider animate-pulse">URGENT</span>
          </div>
          <div className="mt-2 w-full bg-gray-800 h-1 rounded-full overflow-hidden">
            <div className="bg-red-650 h-full rounded-full" style={{ width: `${Math.min(100, stats.criticalEmergencies * 20)}%` }} />
          </div>
        </motion.div>

        {/* Responders Deployed */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-card border border-gray-800 p-4 rounded-lg relative overflow-hidden flex flex-col justify-between"
          id="kpi-responders"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-gray-500 font-bold">Responders Deployed</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{stats.respondersDeployed}</span>
            <span className="text-[10px] text-blue-500 font-mono font-bold">ACTIVE</span>
          </div>
          <div className="mt-2 w-full bg-gray-800 h-1 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, stats.respondersDeployed * 1.5)}%` }} />
          </div>
        </motion.div>

        {/* Citizens Impacted */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-card border border-gray-800 p-4 rounded-lg relative overflow-hidden flex flex-col justify-between"
          id="kpi-impacted"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-gray-500 font-bold">Citizens At Risk</span>
            <UserCheck className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">1.2k</span>
            <span className="text-[10px] text-orange-500 font-mono font-bold">EVAC</span>
          </div>
          <div className="mt-2 w-full bg-gray-800 h-1 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.citizensImpacted * 0.5)}%` }} />
          </div>
        </motion.div>

        {/* AI Verified Reports */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-card border border-blue-500/50 p-4 rounded-lg relative overflow-hidden glow-blue flex flex-col justify-between"
          id="kpi-ai-verified"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-blue-400 font-bold">AI Verification</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">98.4%</span>
            <span className="text-[10px] text-green-500 font-mono font-bold">ACC</span>
          </div>
          <div className="mt-2 w-full bg-gray-800 h-1 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full rounded-full" style={{ width: '98.4%' }} />
          </div>
        </motion.div>
      </div>

      {/* METROLOGICAL METRICS & AI PREDICTIONS HUD PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-r from-[#111827] to-[#0D1525] border border-blue-500/30 p-5 rounded-lg select-none glow-blue">
        
        {/* METROLOGY SENSOR GRIDS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-xs font-black text-blue-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              METROLOGICAL TELEMETRY SENSOR MATRIX
            </h3>
            <span className="text-[9px] font-mono text-gray-500 uppercase">ACTIVE RADAR CELLS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
            {sensors && sensors.length > 0 ? (
              sensors.map(sen => (
                <div key={sen.id} className="bg-gray-950 p-2.5 rounded border border-gray-850 font-mono text-[10px]">
                  <div className="flex justify-between items-center bg-[#0b1220]/60 p-1.5 rounded mb-1.5">
                    <span className="text-white font-bold truncate block max-w-[110px]">{sen.name}</span>
                    <span className={`px-1 py-0.2 rounded text-[7px] font-black uppercase ${
                      sen.status === 'Critical' ? 'bg-red-950 text-red-500 animate-pulse' : sen.status === 'Elevated' ? 'bg-yellow-950 text-yellow-500' : 'bg-green-950 text-green-400'
                    }`}>
                      {sen.status}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-400 flex justify-between pr-0.5">
                    <span>SECTOR: <strong>{sen.sector.split(' ')[0]}</strong></span>
                    <span className="text-blue-400 font-bold">{sen.value.split('[')[0]}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4 font-mono text-[10px]">NO MONITORED RADAR CELLS LOADED</div>
            )}
          </div>
        </div>

        {/* AI POTENTIAL DISASTER ESCALATION HOTSPOTS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-xs font-black text-red-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-650 animate-ping" />
              AI HOTSPOT CASCADE PREDICTIONS
            </h3>
            <span className="text-[9px] font-mono text-gray-500 uppercase">COV RISK INDICES</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
            {hotspots && hotspots.length > 0 ? (
              hotspots.map(hs => (
                <div 
                  key={hs.id} 
                  onClick={() => onNavigateTo('Intelligence Map')}
                  className="bg-gray-950 p-2.5 rounded border border-gray-850 font-mono text-[10px] cursor-pointer hover:border-red-500/50 transition duration-150"
                >
                  <div className="flex justify-between items-center bg-[#170a0a]/60 p-1.5 rounded mb-1.5 border border-red-950/40">
                    <span className="text-red-400 font-bold truncate block">{hs.name.split(' ')[0]} Sector</span>
                    <span className="text-[9px] text-red-400 font-black">{hs.riskScore}% RISK</span>
                  </div>
                  <div className="text-[9px] text-gray-400 flex justify-between items-center pr-0.5">
                    <span>COEF: {hs.escalationProbability}% PROB</span>
                    <span className="text-[8px] bg-red-950 text-red-400 px-1 rounded font-black">{hs.type}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4 font-mono text-[10px]">NO HOTSPOT SECTORS TRACED</div>
            )}
          </div>
        </div>

      </div>

      {/* Main Grid: Live Analytics Map & Critical Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: System Threat Level Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111827] border border-gray-800 rounded p-5 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                Live Sector Vulnerability Indexes
              </h3>
              <span className="text-xs bg-gray-800 text-gray-400 font-mono px-2 py-0.5 rounded">
                CRISIS VECTORS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['Flood', 'Fire', 'Road Collapse', 'Earthquake', 'Building Damage'].map((type) => {
                const count = typeCounts[type] || 0;
                const percent = Math.min(100, Math.max(10, count * 20));
                let colorClass = 'bg-blue-600';
                let textClass = 'text-blue-500';

                if (type === 'Flood') { colorClass = 'bg-blue-600'; textClass = 'text-blue-400'; }
                if (type === 'Fire') { colorClass = 'bg-red-600'; textClass = 'text-red-400'; }
                if (type === 'Road Collapse') { colorClass = 'bg-orange-600'; textClass = 'text-orange-400'; }
                if (type === 'Earthquake') { colorClass = 'bg-yellow-600'; textClass = 'text-yellow-400'; }

                return (
                  <div key={type} className="bg-[#0B1220] p-3 border border-gray-850 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-300">{type}</span>
                      <span className={`text-xs font-mono font-bold ${textClass}`}>{count} active</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 bg-[#0B1220] p-4 border border-gray-800 rounded-lg flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-950/50 border border-blue-900 rounded">
                  <TrendingUp className="h-5 w-5 text-blue-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">AI-Engine Predictive Response Match</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Automated responder recommendations have reduced EOC dispatch lag by 78%.</p>
                </div>
              </div>
              <button 
                onClick={() => onNavigateTo('Dispatch Operations')}
                className="w-full sm:w-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-mono font-bold text-white rounded transition"
              >
                TACTICAL CONTROL PANEL
              </button>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-[#111827] border border-gray-800 rounded p-5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono mb-3">
              How the EOC Platform Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="border border-gray-800/40 p-3 rounded bg-gray-900/30">
                <div className="text-blue-500 font-mono font-bold text-sm mb-1">01</div>
                <strong className="text-gray-300 block mb-1">Multi-source Ingestion</strong>
                <p className="text-gray-400">Receives real-time local updates and citizen uploads in Bangalore sectors.</p>
              </div>
              <div className="border border-gray-800/40 p-3 rounded bg-gray-900/30">
                <div className="text-red-500 font-mono font-bold text-sm mb-1">02</div>
                <strong className="text-gray-300 block mb-1">AI Vision & Text Analytics</strong>
                <p className="text-gray-400">Processes image files to isolate victims, assess hazard depth, and filter duplicates.</p>
              </div>
              <div className="border border-gray-800/40 p-3 rounded bg-gray-900/30">
                <div className="text-green-500 font-mono font-bold text-sm mb-1">03</div>
                <strong className="text-gray-300 block mb-1">Autonomous Strategy</strong>
                <p className="text-gray-400">Suggests optimal response details and directly syncs to the dispatch map ledger.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Top Hotspots & Actions */}
        <div className="space-y-6">
          <div className="bg-[#111827] border border-gray-800 rounded p-5 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                <h3 className="text-xs font-bold text-[#DC2626] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-650 animate-ping" />
                  HIGH PRIORITY CRISES
                </h3>
                <span className="text-[10px] font-mono text-gray-500">SORTED: PRIORITY INDEX</span>
              </div>

              {recentCritical.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 font-mono">
                  NO CRITICAL CRISES DETECTED
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCritical.map((inc) => (
                    <div 
                      key={inc.id}
                      onClick={() => onNavigateTo('Live Incidents')}
                      className="bg-[#0B1220] hover:bg-[#131b2c] transition p-3 border border-gray-800 rounded cursor-pointer flex items-start gap-3"
                    >
                      <div className="p-2 bg-red-950/80 border border-red-900 rounded mt-0.5 shrink-0">
                        {getIncidentIcon(inc.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-red-500">{inc.id}</span>
                          <span className="text-[10px] bg-red-950 text-red-400 border border-red-900 font-mono px-1.5 rounded">
                            INDEX: {inc.priorityScore}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1 truncate">{inc.type} - {inc.location}</h4>
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{inc.reasoning[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-gray-800 pt-4 space-y-2">
              <button 
                onClick={() => onNavigateTo('Live Incidents')}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-900 hover:bg-gray-850 text-xs font-mono text-gray-300 rounded border border-gray-800 transition"
              >
                <span>MONITOR LIVE ALGORITHMIC INTEGRATIONS</span>
                <span className="text-blue-500">→</span>
              </button>

              <button 
                onClick={() => onNavigateTo('Intelligence Map')}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-900 hover:bg-gray-850 text-xs font-mono text-gray-300 rounded border border-gray-800 transition"
              >
                <span>LAUNCH GEOSPATIAL MAP VIEW</span>
                <span className="text-blue-500">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
