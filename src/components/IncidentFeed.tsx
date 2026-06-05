import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Layers, 
  TrendingUp, 
  PlusCircle, 
  UserPlus, 
  CheckCircle2, 
  Compass, 
  UserCheck, 
  Eye, 
  Sparkles,
  Flame,
  Anchor,
  Construction,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Incident, SeverityLevel } from '../types';

interface IncidentFeedProps {
  incidents: Incident[];
  onTriggerMission: (incidentId: string) => void;
  onRefresh: () => void;
  onUpdateVerification: (id: string, newStatus: string) => void;
}

export default function IncidentFeed({ 
  incidents, 
  onTriggerMission, 
  onRefresh, 
  onUpdateVerification 
}: IncidentFeedProps) {
  const [selectedId, setSelectedId] = useState<string>(incidents[0]?.id || '');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('severity-desc');

  const severityWeight: Record<SeverityLevel, number> = {
    'Critical': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1
  };

  const selectedIncident = incidents.find(i => i.id === selectedId) || incidents[0];

  const getSeverityStyles = (sev: SeverityLevel) => {
    switch (sev) {
      case 'Critical':
        return {
          bg: 'bg-red-950/80',
          text: 'text-red-400',
          border: 'border-red-900',
          badge: 'bg-red-600 text-white'
        };
      case 'High':
        return {
          bg: 'bg-orange-950/60',
          text: 'text-orange-400',
          border: 'border-orange-900',
          badge: 'bg-[#EA580C] text-white'
        };
      case 'Medium':
        return {
          bg: 'bg-yellow-950/40',
          text: 'text-yellow-400',
          border: 'border-yellow-900',
          badge: 'bg-[#EAB308] text-black'
        };
      case 'Low':
        return {
          bg: 'bg-green-950/30',
          text: 'text-green-400',
          border: 'border-green-950',
          badge: 'bg-[#16A34A] text-white'
        };
    }
  };

  const getDisasterIcon = (type: string) => {
    switch (type) {
      case 'Flood': return <Anchor className="h-4 w-4" />;
      case 'Fire': return <Flame className="h-4 w-4" />;
      case 'Road Collapse': return <Construction className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Filter list
  const filteredIncidents = incidents.filter(inc => {
    if (filterType !== 'ALL' && inc.type !== filterType) return false;
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;
    return true;
  });

  const sortedAndFilteredIncidents = [...filteredIncidents].sort((a, b) => {
    if (sortBy === 'severity-desc') {
      const weightDiff = severityWeight[b.severity] - severityWeight[a.severity];
      if (weightDiff !== 0) return weightDiff;
      return b.priorityScore - a.priorityScore; // High priorityScore first for same severity
    }
    if (sortBy === 'severity-asc') {
      const weightDiff = severityWeight[a.severity] - severityWeight[b.severity];
      if (weightDiff !== 0) return weightDiff;
      return a.priorityScore - b.priorityScore; // Low priorityScore first for same severity
    }
    if (sortBy === 'newest') {
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    }
    if (sortBy === 'priority-desc') {
      return b.priorityScore - a.priorityScore;
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="h-5 w-5 text-blue-500" />
            LIVE CRITICAL INTEL FEED
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">ALGORITHMIC DEDUPLICATION STATUS: OPERATIONAL</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh button */}
          <button 
            onClick={onRefresh}
            className="p-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 rounded hover:text-white transition"
            title="Refresh feeds"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Sort Selector dropdown */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-950 border border-blue-900 text-blue-400 text-xs px-2.5 py-1.5 focus:outline-none focus:border-blue-500 rounded font-mono font-bold"
            title="Sort Incidents Level"
          >
            <option value="severity-desc">SORT: SEVERITY (HIGH ➔ LOW)</option>
            <option value="severity-asc">SORT: SEVERITY (LOW ➔ HIGH)</option>
            <option value="priority-desc">SORT: AI PRIORITY SCORE</option>
            <option value="newest">SORT: CHRONOLOGICAL (NEWEST)</option>
          </select>

          {/* Severity Filter */}
          <select 
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-gray-950 border border-gray-800 text-gray-300 text-xs px-2.5 py-1.5 focus:outline-none focus:border-blue-500 rounded font-mono"
          >
            <option value="ALL">ALL SEVERITIES</option>
            <option value="Critical">CRITICAL ONLY</option>
            <option value="High">HIGH ONLY</option>
            <option value="Medium">MEDIUM ONLY</option>
            <option value="Low">LOW ONLY</option>
          </select>

          {/* Type Filter */}
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-950 border border-gray-800 text-gray-300 text-xs px-2.5 py-1.5 focus:outline-none focus:border-blue-500 rounded font-mono"
          >
            <option value="ALL">ALL TYPES</option>
            <option value="Flood">FLOODS</option>
            <option value="Fire">FIRES</option>
            <option value="Road Collapse">ROAD COLLAPSE</option>
            <option value="Building Damage">BUILDING DAMAGE</option>
          </select>
        </div>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Side: Incidents List (8 columns) */}
        <div className="lg:col-span-7 space-y-3 max-h-[750px] overflow-y-auto pr-1">
          {sortedAndFilteredIncidents.length === 0 ? (
            <div className="text-center py-16 bg-[#111827] border border-gray-800 rounded">
              <Compass className="h-8 w-8 text-gray-650 mx-auto animate-pulse" />
              <p className="text-xs text-gray-400 font-mono mt-3">NO TELEMETRY REPORTS FOUND MATCHING FILTER CRITERIA</p>
            </div>
          ) : (
            sortedAndFilteredIncidents.map((inc) => {
              const styles = getSeverityStyles(inc.severity);
              const isSelected = selectedId === inc.id;
              
              // Immersive UI style pairing based on disaster severity
              const severityBorderClass = 
                inc.severity === 'Critical' ? 'critical glow-red ring-1 ring-red-500/20 shadow-md border-y border-r border-gray-800' :
                inc.severity === 'High' ? 'high border-y border-r border-gray-800' :
                inc.severity === 'Medium' ? 'medium border-y border-r border-gray-850' :
                'low border-y border-r border-gray-900';

              return (
                <motion.div
                  key={inc.id}
                  onClick={() => setSelectedId(inc.id)}
                  whileHover={{ scale: 1.005 }}
                  className={`bg-card relative cursor-pointer border rounded-r-lg transition-all duration-200 overflow-hidden flex flex-col md:flex-row items-stretch ${severityBorderClass} ${
                    isSelected ? 'border-blue-500 shadow-xl shadow-blue-950/30 ring-1 ring-blue-500/50 glow-blue scale-[1.01]' : 'border-gray-800 hover:border-gray-750'
                  }`}
                  id={`incident-${inc.id}`}
                >
                  {/* Photo Thumbnail */}
                  <div className="w-full md:w-36 h-32 md:h-auto shrink-0 relative bg-gray-900">
                    <img 
                      src={inc.image} 
                      alt={inc.type} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 bg-gray-950/80 px-2 py-0.5 rounded text-[9px] font-mono border border-gray-800 text-gray-300">
                      ID: {inc.id}
                    </div>
                  </div>

                  {/* Incident Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`${styles.text} bg-gray-900 border ${styles.border} px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-tight flex items-center gap-1`}>
                            {getDisasterIcon(inc.type)}
                            {inc.type.toUpperCase()}
                          </span>
                          <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${styles.badge} font-bold`}>
                            {inc.severity}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(inc.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="text-white text-sm font-bold mt-2 hover:text-blue-400 font-sans tracking-tight">
                        {inc.location}
                      </h3>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-800/65 flex flex-wrap items-center justify-between text-[11px] font-mono text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          AI Match: <span className="text-blue-400 font-bold">{inc.confidence}%</span>
                        </span>
                        <span className="text-gray-700">•</span>
                        <span className="text-gray-300">
                          Dup: <span className="text-gray-400">{inc.duplicates > 0 ? `${inc.duplicates} merged` : 'Unique'}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                        <span className={`w-2 h-2 rounded-full ${
                          inc.verification === 'Verified' ? 'bg-green-500' : inc.verification === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span>{inc.verification}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Right Side: AI Analysis Panel (5 columns) */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {selectedIncident && (
              <motion.div
                key={selectedIncident.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card border border-blue-500/40 shadow-2xl rounded-lg p-5 relative overflow-hidden bg-gradient-to-b from-[#111827] to-[#0D1525] glow-blue"
                id="ai-analysis-panel"
              >
                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500/30 animate-pulse pointer-events-none" />

                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                    <h3 className="text-xs font-extrabold text-blue-400 uppercase tracking-widest font-mono">AI REAL-TIME DIAGNOSTICS</h3>
                  </div>
                  <span className="text-[9px] bg-blue-900/30 border border-blue-800 text-blue-400 font-mono px-2 py-0.5 rounded font-bold">
                    ACTIVE SENSOR {selectedIncident.id}
                  </span>
                </div>

                {/* Main Metrics Block */}
                <div className="space-y-4">
                  {/* Classifications Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-950 p-2.5 rounded border border-gray-850">
                      <div className="text-[10px] text-gray-500 font-mono uppercase">AI CLASSIFICATION</div>
                      <div className="text-white font-bold text-xs mt-0.5 flex items-center gap-1.5">
                        {getDisasterIcon(selectedIncident.type)}
                        {selectedIncident.type}
                      </div>
                    </div>

                    <div className="bg-gray-950 p-2.5 rounded border border-gray-850">
                      <div className="text-[10px] text-gray-500 font-mono uppercase">CLASSIFICATION CONFIDENCE</div>
                      <div className="text-blue-400 font-bold text-xs mt-0.5 font-mono">{selectedIncident.confidence}%</div>
                    </div>

                    <div className="bg-gray-950 p-2.5 rounded border border-gray-850">
                      <div className="text-[10px] text-gray-500 font-mono uppercase">SEVERITY CALCULATION</div>
                      <div className="text-white font-bold text-xs mt-0.5 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedIncident.severity === 'Critical' ? 'bg-red-500' : 'bg-orange-500'}`} />
                        {selectedIncident.severity}
                      </div>
                    </div>

                    <div className="bg-gray-950 p-2.5 rounded border border-gray-850">
                      <div className="text-[10px] text-gray-500 font-mono uppercase">PRIORITY SCORE</div>
                      <div className="text-red-400 font-mono font-bold text-xs mt-0.5">{selectedIncident.priorityScore} / 100</div>
                    </div>
                  </div>

                  {/* Core Intel Parameters */}
                  <div className="border border-gray-800 rounded bg-[#0b1220] divide-y divide-gray-800 p-1">
                    <div className="p-2.5 flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-mono">PEOPLE DETECTED</span>
                      <span className="text-white font-mono font-bold font-bold">{selectedIncident.peopleDetected}</span>
                    </div>
                    <div className="p-2.5 flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-mono">CHILDREN ISOLATED</span>
                      <span className="text-red-400 font-mono font-bold">{selectedIncident.childrenDetected}</span>
                    </div>
                    <div className="p-2.5 flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-mono">MEASURED WATER LEVEL</span>
                      <span className="text-blue-400 font-mono font-bold">{selectedIncident.waterLevel}</span>
                    </div>
                    <div className="p-2.5 flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-mono">DUPLICATE CONFLICTS MERGED</span>
                      <span className="text-gray-300 font-mono font-bold">{selectedIncident.duplicates} Reports</span>
                    </div>
                  </div>

                  {/* Recommended Tactical Intervention */}
                  <div className="bg-[#1f2010]/30 border border-yellow-905/30 p-3.5 rounded-lg">
                    <div className="text-[10px] text-[#EAB308] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      SYSTEM LOGICAL RECOMMENDATION
                    </div>
                    <div className="text-white font-extrabold text-sm mt-1">
                      {selectedIncident.recommendedAction}
                    </div>
                  </div>

                  {/* AI Predictive Risk Cascade Section */}
                  <div className="bg-red-950/20 border border-red-900/40 p-3.5 rounded-lg space-y-2.5">
                    <div className="text-[10px] text-red-400 font-mono font-bold uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                        AI PREDICTIVE RISK CASCADE
                      </span>
                      <span className="text-red-500 font-black animate-pulse">[ANALYTES GENERATED]</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-none">
                      <div className="bg-gray-950 p-2 rounded border border-gray-850">
                        <span className="text-gray-500 block select-none uppercase text-[8px]">Escalation Likelihood</span>
                        <strong className="text-red-400 font-extrabold text-xs mt-0.5 block">
                          {selectedIncident.severity === 'Critical' ? '92% [STORM SWELL]' : selectedIncident.severity === 'High' ? '74% [ELEVATED]' : '42% [STABLE]'}
                        </strong>
                      </div>
                      <div className="bg-gray-950 p-2 rounded border border-gray-850">
                        <span className="text-gray-550 block select-none uppercase text-[8px]">Active Climate Index</span>
                        <strong className="text-yellow-400 font-extrabold text-xs mt-0.5 block">
                          {selectedIncident.type === 'Flood' ? 'Rain Index: 52mm/hr' : selectedIncident.type === 'Fire' ? 'Wind Index: 35km/h' : 'Soil saturation index'}
                        </strong>
                      </div>
                    </div>

                    <div className="text-[11px] font-sans leading-relaxed text-gray-300">
                      <strong className="text-white">Escalation Model Outcome:</strong> Given local meteorological sensor telemetry, {selectedIncident.type.toLowerCase()} factors in this local coordinate quadrant display matches with surrounding hydrological constraints. Spillover potential predicted within {selectedIncident.severity === 'Critical' ? '45 minutes' : '2 hours'}.
                    </div>
                  </div>

                  {/* AI Logical Reasoning Blocks */}
                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-1 mb-2">
                      DECISION TRACE REASONING
                    </h4>
                    <ul className="space-y-2 text-xs">
                      {selectedIncident.reasoning.map((item, index) => (
                        <li key={index} className="flex gap-2 text-gray-300 leading-relaxed">
                          <span className="text-blue-500 font-mono select-none">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Interactive Manual Action Block */}
                  <div className="pt-4 border-t border-gray-800 space-y-2">
                    <button
                      onClick={() => onTriggerMission(selectedIncident.id)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-xs font-mono font-bold text-white rounded transition flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      ESTABLISH ACTION DISPATCH MISSION
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onUpdateVerification(selectedIncident.id, 'Verified')}
                        disabled={selectedIncident.verification === 'Verified'}
                        className="py-1.5 border border-green-800 hover:bg-green-950/35 disabled:opacity-50 text-xs font-mono font-medium text-green-400 rounded transition"
                      >
                        VALIDATE REPORT
                      </button>
                      <button
                        onClick={() => onUpdateVerification(selectedIncident.id, 'Flagged')}
                        disabled={selectedIncident.verification === 'Flagged'}
                        className="py-1.5 border border-red-900 hover:bg-red-950/35 disabled:opacity-50 text-xs font-mono font-medium text-red-400 rounded transition"
                      >
                        FLAG INVALID / DUP
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
