import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Users, 
  MapPin, 
  Clock, 
  Award, 
  CheckCircle2, 
  Briefcase, 
  Calendar,
  AlertTriangle,
  X,
  Plus,
  Play,
  Shield,
  FileText,
  Activity,
  UserCheck,
  Zap,
  Flame,
  Anchor,
  Construction
} from 'lucide-react';
import { Mission, SeverityLevel } from '../types';

interface DispatchOperationsProps {
  missions: Mission[];
  onAction: (id: string, action: 'Assign' | 'Dispatch' | 'Resolve', assignedTeam?: string) => void;
  onRefresh: () => void;
}

export default function DispatchOperations({ missions, onAction, onRefresh }: DispatchOperationsProps) {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [assigneeName, setAssigneeName] = useState<Record<string, string>>({});

  // Get matching current details when server updates
  const activeDetailMission = selectedMission ? (missions.find(m => m.id === selectedMission.id) || selectedMission) : null;

  const getTimelineTime = (timeline: { time: string; event: string }[], type: 'Create' | 'Assign' | 'Dispatch' | 'Resolve') => {
    if (!timeline) return null;
    if (type === 'Create') {
      const found = timeline.find(t => t.event.toLowerCase().includes('intelligence') || t.event.toLowerCase().includes('briefing') || t.event.toLowerCase().includes('created'));
      return found ? found.time : null;
    }
    if (type === 'Assign') {
      const found = timeline.find(t => t.event.toLowerCase().includes('selected') || t.event.toLowerCase().includes('matched') || t.event.toLowerCase().includes('assignee') || t.event.toLowerCase().includes('team') || t.event.toLowerCase().includes('squad'));
      return found ? found.time : null;
    }
    if (type === 'Dispatch') {
      const found = timeline.find(t => t.event.toLowerCase().includes('dispatched') || t.event.toLowerCase().includes('squad') || t.event.toLowerCase().includes('active') || t.event.toLowerCase().includes('engaging'));
      return found ? found.time : null;
    }
    if (type === 'Resolve') {
      const found = timeline.find(t => t.event.toLowerCase().includes('completed') || t.event.toLowerCase().includes('resolved') || t.event.toLowerCase().includes('solved'));
      return found ? found.time : null;
    }
    return null;
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'Awaiting Assignment': return 0;
      case 'En Route': return 1;
      case 'Active': return 2;
      case 'Resolved': return 3;
      default: return 0;
    }
  };

  const status_steps = [
    {
      key: 'Create',
      label: 'CREATION',
      sublabel: 'Briefing Created',
      statusCheck: 'Awaiting Assignment',
      stepNum: 0,
      icon: Plus,
      color: 'text-blue-400 bg-blue-950/40 border-blue-900',
      activeColor: 'bg-blue-600 text-white border-blue-400',
    },
    {
      key: 'Assign',
      label: 'SQUAD MATCH',
      sublabel: 'Team Linked',
      statusCheck: 'En Route',
      stepNum: 1,
      icon: Users,
      color: 'text-orange-400 bg-orange-950/40 border-orange-900',
      activeColor: 'bg-orange-600 text-white border-orange-400',
    },
    {
      key: 'Dispatch',
      label: 'DISPATCH',
      sublabel: 'En Route & Engaged',
      statusCheck: 'Active',
      stepNum: 2,
      icon: Play,
      color: 'text-red-400 bg-red-950/40 border-red-900',
      activeColor: 'bg-red-500 text-white border-red-400',
    },
    {
      key: 'Resolve',
      label: 'COMPLETION',
      sublabel: 'Area Secured',
      statusCheck: 'Resolved',
      stepNum: 3,
      icon: CheckCircle2,
      color: 'text-green-400 bg-green-950/40 border-green-900',
      activeColor: 'bg-green-600 text-white border-green-400',
    },
  ];

  const getPriorityBadgeStyles = (sev: SeverityLevel) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-950 text-red-400 border border-red-900 font-bold';
      case 'High':
        return 'bg-orange-950 text-orange-400 border border-orange-850';
      case 'Medium':
        return 'bg-yellow-950 text-yellow-400 border border-yellow-850';
      default:
        return 'bg-green-950 text-green-400 border border-green-900';
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'Awaiting Assignment':
        return 'bg-gray-900 text-gray-400 border border-gray-850 animate-pulse';
      case 'En Route':
        return 'bg-blue-950 text-blue-400 border border-blue-900';
      case 'Active':
        return 'bg-red-950 text-red-500 border border-red-900 font-bold animate-pulse';
      case 'Resolved':
        return 'bg-green-950 text-green-405 border border-green-900';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };

  const getDisasterIcon = (type: string) => {
    switch (type) {
      case 'Flood': return <Anchor className="h-4 w-4 text-blue-500" />;
      case 'Fire': return <Flame className="h-4 w-4 text-red-500" />;
      case 'Road Collapse': return <Construction className="h-4 w-4 text-orange-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            TACTICAL DISPATCH OPERATIONS CENTRE
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">ACTIVE RESCUE SQUAD CODES & METRIC MAPPING</p>
        </div>
        <button 
          onClick={onRefresh}
          className="px-3.5 py-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 font-mono text-xs rounded flex items-center gap-1.5 hover:text-white transition"
        >
          SYNC RADIO SIGNALS
        </button>
      </div>

      {/* Main Table Grid Card */}
      <div className="bg-card border border-gray-800 rounded-lg overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950 border-b border-gray-850 text-[10px] font-mono text-gray-400 tracking-wider uppercase">
                <th className="py-3.5 px-4">Mission ID</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Recommended Squad</th>
                <th className="py-3.5 px-4">Assigned Active Team</th>
                <th className="py-3.5 px-4">ETA</th>
                <th className="py-3.5 px-4">Operation Status</th>
                <th className="py-3.5 px-4 text-center">COMMAND ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-855 text-xs text-gray-300 font-mono">
              {missions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    NO DISPATCH OPERATIONS ASSIGNED AT THIS EVENT CYCLE
                  </td>
                </tr>
              ) : (
                missions.map((msn) => (
                  <tr 
                    key={msn.id}
                    className="hover:bg-gray-900/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedMission(msn)}
                  >
                    {/* ID */}
                    <td className="py-4 px-4">
                      <span className="text-blue-400 font-extrabold hover:underline">{msn.id}</span>
                    </td>

                    {/* Type */}
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1.5 font-sans font-bold">
                        {getDisasterIcon(msn.type)}
                        {msn.type}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 max-w-[180px] truncate" title={msn.location}>
                      <span className="font-sans text-gray-100">{msn.location}</span>
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${getPriorityBadgeStyles(msn.severity)}`}>
                        {msn.severity}
                      </span>
                    </td>

                    {/* Recommended team */}
                    <td className="py-4 px-4 text-gray-400 max-w-[160px] truncate" title={msn.recommendedTeam}>
                      {msn.recommendedTeam}
                    </td>

                    {/* Assigned team input */}
                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      {msn.status === 'Awaiting Assignment' ? (
                        <input 
                          type="text" 
                          placeholder="Assign team name..."
                          value={assigneeName[msn.id] || ''}
                          onChange={(e) => setAssigneeName(prev => ({ ...prev, [msn.id]: e.target.value }))}
                          className="bg-gray-950 border border-gray-800 text-gray-200 text-xs px-2 py-1 rounded w-36 focus:outline-none focus:border-blue-500 placeholder-gray-600 font-sans"
                        />
                      ) : (
                        <span className="text-gray-100 font-sans font-medium flex items-center gap-1 text-[11px]">
                          <Users className="h-3 w-3 text-orange-400" />
                          {msn.assignedTeam}
                        </span>
                      )}
                    </td>

                    {/* ETA */}
                    <td className="py-4 px-4 text-gray-400">
                      {msn.status === 'Resolved' ? 'N/A' : msn.eta}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${getStatusBadgeStyles(msn.status)}`}>
                        {msn.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {msn.status === 'Awaiting Assignment' && (
                          <button
                            onClick={() => onAction(msn.id, 'Assign', assigneeName[msn.id])}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white hover:text-white font-mono text-[10px] font-bold rounded transition whitespace-nowrap"
                          >
                            MATCH SQUAD
                          </button>
                        )}
                        {msn.status === 'En Route' && (
                          <button
                            onClick={() => onAction(msn.id, 'Dispatch')}
                            className="px-2.5 py-1 bg-[#EA580C] hover:bg-orange-700 text-white font-mono text-[10px] font-bold rounded transition flex items-center gap-1 whitespace-nowrap"
                          >
                            <Play className="h-2.5 w-2.5 fill-white" /> DISPATCH
                          </button>
                        )}
                        {(msn.status === 'Active' || msn.status === 'En Route') && (
                          <button
                            onClick={() => onAction(msn.id, 'Resolve')}
                            className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white font-mono text-[10px] font-bold rounded transition whitespace-nowrap"
                          >
                            RESOLVE
                          </button>
                        )}
                        {msn.status === 'Resolved' && (
                          <span className="text-green-500 font-bold flex items-center gap-1 tracking-wider text-[10px] font-sans">
                            <CheckCircle2 className="h-3 w-3" /> SOLVED
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MISSION DETAIL DRAWER (Slide out military briefing) */}
      <AnimatePresence>
        {activeDetailMission && (
          <>
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMission(null)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Slide-out Briefing Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 22, stiffness: 120 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-card border-l border-gray-800 shadow-2xl z-50 overflow-y-auto glow-blue"
              id="mission-briefing-drawer"
            >
              {/* Header */}
              <div className="sticky top-0 bg-card/95 backdrop-blur-md p-5 border-b border-gray-800 flex items-center justify-between z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-900/30 border border-blue-800 text-blue-400 font-mono text-xs px-2.5 py-0.5 rounded font-extrabold">
                      {activeDetailMission.id}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold font-mono ${getPriorityBadgeStyles(activeDetailMission.severity)}`}>
                      {activeDetailMission.severity} SEVERITY
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-1.5 uppercase font-sans tracking-tight">
                    TACTICAL OPERATION BRIEFING
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedMission(null)}
                  className="p-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Grid content inside Drawer */}
              <div className="p-5 space-y-6">

                {/* VISUAL ROADMAP STATUS TIMELINE */}
                <div className="bg-[#0f172a]/90 border border-blue-900/40 rounded-lg p-5 relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 via-orange-500 to-green-500" />
                  
                  <div className="flex items-center justify-between border-b border-gray-800/85 pb-3 mb-5">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
                      <h4 className="text-xs font-mono font-bold text-blue-300 uppercase tracking-wider">CHRONOLOGICAL EVENT PIPELINE</h4>
                    </div>
                    <span className="text-[9px] font-mono bg-blue-950 text-blue-400 border border-blue-900 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      {activeDetailMission.status}
                    </span>
                  </div>

                  <div className="relative pt-2">
                    {/* Horizontal connecting track line */}
                    <div className="absolute top-[18px] left-[12.5%] right-[12.5%] h-0.5 bg-gray-800 -z-0" />
                    
                    {/* Animated color progress line */}
                    <div 
                      className="absolute top-[18px] left-[12.5%] h-0.5 bg-gradient-to-r from-blue-500 via-orange-500 to-green-500 transition-all duration-700 ease-out" 
                      style={{ 
                        width: `${(getStatusStepIndex(activeDetailMission.status) / 3) * 75}%`,
                        maxWidth: '75%'
                      }}
                    />

                    {/* Step Nodes */}
                    <div className="grid grid-cols-4 relative z-10">
                      {status_steps.map((st) => {
                        const currentIndex = getStatusStepIndex(activeDetailMission.status);
                        const isCompleted = st.stepNum <= currentIndex;
                        const isActive = st.stepNum === currentIndex;
                        const eventTime = getTimelineTime(activeDetailMission.timeline, st.key as any);
                        const StepIcon = st.icon;

                        return (
                          <div key={st.key} className="flex flex-col items-center">
                            {/* Circle Node */}
                            <motion.div 
                              whileHover={{ scale: 1.15 }}
                              className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                isCompleted 
                                  ? `${st.activeColor} shadow-[0_0_10px_rgba(59,130,246,0.3)]` 
                                  : 'bg-gray-950 text-gray-650 border-gray-850'
                              }`}
                            >
                              <StepIcon className="h-3.5 w-3.5" />
                            </motion.div>

                            {/* Node labels */}
                            <span className={`text-[9px] font-mono font-extrabold tracking-wider mt-2.5 transition-colors ${
                              isCompleted ? 'text-white' : 'text-gray-500'
                            }`}>
                              {st.label}
                            </span>
                            
                            <span className="text-[7.5px] font-sans text-gray-400 mt-0.5 font-semibold text-center leading-none max-w-[85px] uppercase truncate">
                              {st.sublabel}
                            </span>

                            {/* Occurrence time badge */}
                            <div className="mt-2 text-[9px] font-mono">
                              {eventTime ? (
                                <span className={`px-1.5 py-0.5 rounded border text-[8px] whitespace-nowrap leading-none ${
                                  isActive 
                                    ? 'bg-blue-950/50 border-blue-800 text-blue-400 font-bold' 
                                    : 'bg-gray-900 border-gray-850 text-gray-500 font-medium'
                                }`}>
                                  {eventTime}
                                </span>
                              ) : (
                                <span className="text-gray-750 font-medium text-[8px] italic uppercase">PENDING</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Situation Summary Section */}
                <div className="bg-[#111827] border border-gray-800 rounded p-4">
                  <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-3">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <h4 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">01 // OPERATION SUMMARY</h4>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {activeDetailMission.summary}
                  </p>
                  
                  <div className="mt-4 flex items-center gap-4 text-xs font-mono">
                    <div className="bg-gray-900 border border-gray-850 p-2 rounded flex-1">
                      <div className="text-[10px] text-gray-500 uppercase">Sector Coords</div>
                      <div className="text-white font-bold mt-0.5 mt-1">{activeDetailMission.location}</div>
                    </div>
                  </div>
                </div>

                {/* AI Findings & Multi-sensor analytics */}
                <div className="bg-[#111827] border border-blue-900/20 rounded p-4 relative overflow-hidden bg-gradient-to-r from-[#111827] to-[#121c2e]">
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-[9px] font-mono text-blue-400 font-bold uppercase tracking-widest">SENSORS PLOTTED</span>
                  </div>

                  <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-3">
                    <Zap className="h-4 w-4 text-blue-400 animate-pulse" />
                    <h4 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">02 // COGNITIVE INTEGRATION FINDINGS</h4>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {activeDetailMission.aiFindings}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-gray-950 p-2.5 border border-gray-850 rounded">
                      <span className="text-gray-550 uppercase text-[10px] block">People Isolated</span>
                      <strong className="text-white text-sm font-extrabold">{activeDetailMission.affectedPopulation} Active Signatures</strong>
                    </div>
                    <div className="bg-gray-950 p-2.5 border border-gray-850 rounded">
                      <span className="text-gray-550 uppercase text-[10px] block">Incident Hazard</span>
                      <strong className="text-[#EA580C] text-sm font-extrabold">{activeDetailMission.type}</strong>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="bg-[#111827] border border-red-950/40 rounded p-4">
                  <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-3">
                    <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
                    <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">03 // FIELD VULNERABILITY & RISKS</h4>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {activeDetailMission.riskAssessment}
                  </p>
                </div>

                {/* Required Resources Checklist */}
                <div className="bg-[#111827] border border-gray-850 rounded p-4">
                  <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-3">
                    <Briefcase className="h-4 w-4 text-yellow-500" />
                    <h4 className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider">04 // SQUAD GEAR & EQUIPMENT CONFIG</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeDetailMission.requiredResources.map((item, idx) => (
                      <span 
                        key={idx}
                        className="bg-gray-950 border border-gray-850 rounded px-2.5 py-1 text-[11px] text-gray-200 font-mono uppercase"
                      >
                        [•] {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommended Response Plan */}
                <div className="bg-[#111827] border border-gray-800 rounded p-4">
                  <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-3">
                    <Activity className="h-4 w-4 text-green-500" />
                    <h4 className="text-xs font-mono font-bold text-green-400 uppercase tracking-wider">05 // RESPONSE PLAN FLOW</h4>
                  </div>
                  <ol className="space-y-2.5 text-xs">
                    {activeDetailMission.recommendedResponsePlan.map((step, idx) => (
                      <li key={idx} className="flex gap-2.5 text-gray-300">
                        <span className="text-blue-500 font-mono font-bold">STAGE {idx+1}:</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Operation Event Log / Timeline */}
                <div className="bg-[#111827] border border-gray-850 rounded p-4 mb-8">
                  <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-4">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <h4 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">06 // EVENT TIME LOG</h4>
                  </div>
                  
                  <div className="space-y-4 relative pl-3 border-l border-gray-800">
                    {activeDetailMission.timeline.map((event, idx) => (
                      <div key={idx} className="group relative">
                        {/* Dot marker */}
                        <div className="absolute -left-[16.5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-[#111827] group-hover:bg-orange-500 transition" />
                        <span className="text-[10px] text-blue-400 font-mono font-bold">{event.time} UTC</span>
                        <p className="text-xs text-gray-300 mt-1 font-sans leading-relaxed">{event.event}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
