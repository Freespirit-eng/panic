import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Radio, 
  PhoneCall, 
  CheckSquare, 
  HelpCircle, 
  ShieldAlert, 
  MessageSquare, 
  ExternalLink, 
  AlertTriangle,
  Flame,
  Construction,
  Anchor,
  Clock,
  User,
  HeartHandshake,
  ShieldCheck,
  MapPin,
  Check,
  Bell,
  Heart,
  Users,
  Compass,
  Briefcase,
  Zap,
  Phone
} from 'lucide-react';
import CitizenReporting from './CitizenReporting';
import { Alert, Volunteer, VolunteerAlertNotification } from '../types';

interface CitizenPortalProps {
  onSubmitReport: (data: { description: string; locationInput: string; imageBase64: string }) => Promise<any>;
  broadcasts: Alert[];
  onBackToCommand?: () => void;
  volunteers?: Volunteer[];
  onRegisterVolunteer?: (data: { name: string; phone: string; lat: number; lng: number; skills: string[]; equipment: string[]; notifyRadiusKm: number }) => void;
  onAcceptAlert?: (volId: string, alertId: string) => void;
}

export default function CitizenPortal({ 
  onSubmitReport, 
  broadcasts, 
  onBackToCommand,
  volunteers = [],
  onRegisterVolunteer,
  onAcceptAlert
}: CitizenPortalProps) {
  const [activeTab, setActiveTab] = useState<'civilian' | 'volunteer'>('civilian');
  const [activeHelpline, setActiveHelpline] = useState<string | null>(null);
  
  // Selected Profile for simulated active volunteer experience
  const [selectedVolId, setSelectedVolId] = useState<string>(volunteers[0]?.id || 'VOL-701');
  
  // Custom volunteer registration form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regLat, setRegLat] = useState('12.9716');
  const [regLng, setRegLng] = useState('77.5946');
  const [regRadius, setRegRadius] = useState('4.0');
  const [regSkills, setRegSkills] = useState('Medical First Aid, Comms Support');
  const [regEquipment, setRegEquipment] = useState('First Aid Medkit, VHF Radio, Flashlight');
  const [regSuccess, setRegSuccess] = useState(false);

  // Interactive Checklist State
  const [checklist, setChecklist] = useState([
    { id: 'item-1', label: 'Pack severe emergency food, dry rations and fresh water.', checked: false },
    { id: 'item-2', label: 'Locate local structural high grounds & shelter coordinate points.', checked: false },
    { id: 'item-3', label: 'Fully charge primary and secondary communication devices.', checked: false },
    { id: 'item-4', label: 'Power off main electrical circuit breakers in danger grids.', checked: false },
    { id: 'item-5', label: 'Follow instruction feeds on live EOC secure air broadcasts.', checked: false }
  ]);

  const handleToggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone) return;
    
    if (onRegisterVolunteer) {
      const skillsArr = regSkills.split(',').map(s => s.trim()).filter(Boolean);
      const equipArr = regEquipment.split(',').map(e => e.trim()).filter(Boolean);
      
      onRegisterVolunteer({
        name: regName,
        phone: regPhone,
        lat: Number(regLat) || 12.9716,
        lng: Number(regLng) || 77.5946,
        skills: skillsArr.length > 0 ? skillsArr : ["EOC Standby Duties"],
        equipment: equipArr.length > 0 ? equipArr : ["Tactical Flashlight"],
        notifyRadiusKm: Number(regRadius) || 4.0
      });

      setRegSuccess(true);
      setTimeout(() => {
        setRegSuccess(false);
        // Reset and switch to active select context
        setRegName('');
        setRegPhone('');
      }, 3000);
    }
  };

  const helplines = [
    { 
      id: 'hp-1', 
      name: 'EOC ZONAL COMPTROLLER UNIT', 
      number: '+91-80-OC-SENTRY', 
      description: 'Zonal headquarters for regional disaster management, flood coordinates and responder squad assignments.',
      advice: 'Ensure you have ready access to landmark indicators nearby. Our dispatch system handles route selection.' 
    },
    { 
      id: 'hp-2', 
      name: 'AMBULANCE & TRAUMA RESPONSE', 
      number: '108 (TOLL FREE)', 
      description: 'Primary dispatch for medical operations, search-and-rescue air lifts and dynamic hazard trauma care.',
      advice: 'If possible, keep the victim elevated, in ventilated airflow, and maintain communications active.'
    },
    { 
      id: 'hp-3', 
      name: 'BANGALORE METRO FIRE STATION', 
      number: '101 (TOLL FREE)', 
      description: 'Localized fire rescue squads specializing in building sub-stations, transformer grid failures, and smoke clearing.',
      advice: 'Crawl low under billowy black smoke and do not attempt to retrieve personal belongings.'
    },
    { 
      id: 'hp-4', 
      name: 'FLOOD & HYDROLOGICAL TASKFORCE', 
      number: '+91-80-HYDRO-99', 
      description: 'Rapid response boats and heavy structural high-clearance rescue transports guarding Bangalore outer ring road drainage grid core.',
      advice: 'Power off electric breakers to prevent shock danger. Stay elevated on dry roof decks.'
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'emergency alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'rescue update': return <Activity className="h-4 w-4 text-teal-400" />;
      case 'road closure': return <Construction className="h-4 w-4 text-orange-400" />;
      default: return <Radio className="h-4 w-4 text-blue-400" />;
    }
  };

  // Find active simulation volunteer
  const activeVolunteer = volunteers.find(v => v.id === selectedVolId) || volunteers[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 select-none" id="citizen-portal-container">
      
      {/* 1. Portal Introduction Banner and Switch Indicator */}
      <div className="bg-gradient-to-r from-[#0d161a] to-[#081014] border border-blue-900/40 p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
            <h2 className="text-sm font-mono font-black text-blue-400 uppercase tracking-widest leading-none">
              PUBLIC CITIZEN & EMERGENCY VOLUNTEER CORE
            </h2>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white font-sans tracking-tight leading-tight">
            Panic Sense Portal Dashboard
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed max-w-2xl font-sans">
            Submit direct emergency reports to responders OR register as a local volunteer to secure disaster standby notifications, coordinate regional gear, and accept emergency missions around you in real-time.
          </p>
        </div>

        {/* Action Toggle Tabs and Back to Dispatch link */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 select-none">
          <div className="bg-gray-950 border border-gray-850 p-0.5 rounded flex text-xs shrink-0 font-mono">
            <button
              onClick={() => setActiveTab('civilian')}
              className={`px-3 py-1.5 rounded transition font-bold uppercase tracking-wider ${
                activeTab === 'civilian' 
                  ? 'bg-blue-900/60 text-white font-extrabold' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Emergency Reporting
            </button>
            <button
              onClick={() => setActiveTab('volunteer')}
              className={`px-3 py-1.5 rounded transition font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                activeTab === 'volunteer' 
                  ? 'bg-green-905/45 text-green-400 font-extrabold border border-green-800' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              Volunteer Standby
            </button>
          </div>

          {onBackToCommand && (
            <button
              id="back-to-command-btn"
              onClick={onBackToCommand}
              className="px-3.5 py-1.5 bg-gray-900 border border-gray-800 hover:bg-gray-850 hover:text-white text-xs font-mono font-bold text-gray-400 rounded transition whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              Command Desk
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: CIVILIAN EMERGENCY MODE */}
        {activeTab === 'civilian' ? (
          <motion.div 
            key="civilian-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            {/* LEFT COLUMN: THE CITIZEN REPORTING SECURED FORM AND DIAGNOSTICS (7 Columns) */}
            <section className="lg:col-span-7 bg-card border border-gray-805 rounded-lg p-5 flex flex-col justify-between" id="portal-report-column">
              <div className="space-y-4">
                <div className="border-b border-gray-805 pb-2">
                  <h3 className="text-xs font-mono font-extrabold text-blue-400 tracking-wider uppercase flex items-center gap-2">
                    <ShieldAlert className="h-4.5 w-4.5 text-blue-400" />
                    REPORT ACTIVE DISASTER AREA SECURELY
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">DIRECT AI ANALYSIS STREAM DEPOSITED INTO COMMAND DECISION LEDGERS</p>
                </div>

                <CitizenReporting onSubmitReport={onSubmitReport} />
              </div>
            </section>

            {/* RIGHT COLUMN: REVIEWS, BULLETINS, HELPLINES, DRILLS (5 Columns) */}
            <section className="lg:col-span-5 flex flex-col justify-between space-y-6" id="portal-utility-column">
              <div className="space-y-6 h-full flex flex-col justify-between">
                
                {/* Widget A: Live Community Broadcast Announcement Board */}
                <div className="bg-card border border-gray-805 rounded-lg p-4 space-y-3.5">
                  <div className="border-b border-gray-800 pb-2 flex items-center justify-between">
                    <h4 className="text-xs font-mono font-black text-blue-500 tracking-wider uppercase flex items-center gap-1.5">
                      <Radio className="h-4 w-4 text-blue-500 animate-pulse" />
                      LIVE COMMUNITY NOTICES
                    </h4>
                    <span className="text-[9px] font-mono text-gray-500 uppercase">OFFICIAL BROADCASTS</span>
                  </div>

                  <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                    {broadcasts && broadcasts.length > 0 ? (
                      broadcasts.slice(0, 4).map((b) => (
                        <div 
                          key={b.id} 
                          className="p-2.5 rounded bg-gray-950 border border-gray-850 text-left font-sans flex items-start gap-3"
                          id={`civilian-alert-${b.id}`}
                        >
                          <div className="p-1 bg-[#15202b] border border-gray-800 rounded mt-0.5">
                            {getAlertIcon(b.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between leading-none">
                              <strong className="text-xs text-white uppercase font-bold tracking-tight">{b.title}</strong>
                              <span className="text-[8.5px] font-mono text-gray-500">
                                {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-gray-400 leading-snug">{b.message}</p>
                            <div className="text-[9px] font-mono text-gray-500 flex justify-between pr-0.5">
                              <span>LOCATION: <strong className="text-gray-400 font-bold">{b.area}</strong></span>
                              <span>CODE: {b.id.split('-')[0]}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 border border-dashed border-gray-850 rounded text-xs text-gray-500 font-mono">
                        All regional sectors stable. No public warnings active.
                      </div>
                    )}
                  </div>
                </div>

                {/* Widget B: Emergency helplines list */}
                <div className="bg-card border border-gray-805 rounded-lg p-4 space-y-3.5">
                  <div className="border-b border-gray-800 pb-2">
                    <h4 className="text-xs font-mono font-black text-yellow-500 tracking-wider uppercase flex items-center gap-1.5">
                      <PhoneCall className="h-4 w-4 text-yellow-500" />
                      EMERGENCY RESPONSE DIRECTORY
                    </h4>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">TAP TO VIEW ACTION ADVICE DURING ACTIVE EVENTS</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {helplines.map((hp) => (
                      <button
                        key={hp.id}
                        id={`helpline-btn-${hp.id}`}
                        onClick={() => setActiveHelpline(activeHelpline === hp.id ? null : hp.id)}
                        className={`p-2 rounded text-left font-mono transition duration-150 border flex flex-col justify-between ${
                          activeHelpline === hp.id 
                            ? 'bg-yellow-950/25 border-yellow-600/70 text-white' 
                            : 'bg-gray-950 border-gray-850 hover:border-gray-800 text-gray-400'
                        }`}
                        style={{ minHeight: '52px' }}
                      >
                        <span className="text-[9.5px] font-extrabold truncate block leading-tight">{hp.name}</span>
                        <span className="text-[10px] text-yellow-405 font-black mt-1">{hp.number}</span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {activeHelpline && (
                      (() => {
                        const hp = helplines.find(h => h.id === activeHelpline);
                        if (!hp) return null;
                        return (
                          <motion.div
                            key={hp.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gray-950 border border-yellow-500/30 p-2.5 rounded-md text-left text-[11px] leading-relaxed space-y-1.5"
                          >
                            <div className="flex items-center gap-1.5 text-xs font-mono text-yellow-500 font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
                              Emergency Advisory
                            </div>
                            <p className="text-gray-300 font-sans">
                              <strong>{hp.name}</strong> • {hp.description}
                            </p>
                            <div className="bg-[#1c1d15] p-2 rounded text-[10px] text-yellow-400 font-mono">
                              <strong>Responder Instruction:</strong> {hp.advice}
                            </div>
                          </motion.div>
                        );
                      })()
                    )}
                  </AnimatePresence>
                </div>

                {/* Widget C: Self-checklists */}
                <div className="bg-card border border-gray-805 rounded-lg p-4 space-y-3">
                  <div className="border-b border-gray-100/10 pb-2">
                    <h4 className="text-xs font-mono font-black text-blue-400 tracking-wider uppercase flex items-center gap-1.5">
                      <CheckSquare className="h-4 w-4 text-blue-400" />
                      INDIVIDUAL SURVIVAL VERIFICATION
                    </h4>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">CHECK COMPLETED TASKS BEFORE HAZARD ONSET</p>
                  </div>

                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <label 
                        key={item.id} 
                        className="flex items-start gap-2.5 p-2 rounded bg-gray-950 border border-transparent hover:border-gray-850 cursor-pointer text-left transition duration-150"
                      >
                        <input 
                          type="checkbox" 
                          id={`chk-${item.id}`}
                          checked={item.checked} 
                          onChange={() => handleToggleChecklist(item.id)}
                          className="mt-0.5 accent-blue-600 rounded text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                        />
                        <span className={`text-[10.5px] font-sans leading-tight ${item.checked ? 'text-gray-550 line-through font-light' : 'text-gray-300'}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </section>
          </motion.div>
        ) : (
          /* TAB 2: EMERGENCY VOLUNTEER STANDBY PORTAL */
          <motion.div 
            key="volunteer-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            {/* LEFT COLUMN: ACTIVE STANDBY SENTRY WORKSTATION (7 Columns) */}
            <section className="lg:col-span-7 bg-card border border-gray-805 rounded-lg p-5 flex flex-col justify-between" id="volunteer-alerts-column">
              <div className="space-y-5 text-left">
                
                {/* Active Sub-header and selection */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-805 pb-3">
                  <div>
                    <h3 className="text-xs font-mono font-black text-green-400 tracking-wider uppercase flex items-center gap-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-green-400" />
                      VOLUNTEER NOTIFICATION BOARD
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">DISASTER PROXIMITY NOTIFICATIONS STREAMING LIVE</p>
                  </div>

                  {/* Active Profile Sim Select Dropdown */}
                  <div className="flex items-center gap-2 font-mono text-xs w-full sm:w-auto">
                    <span className="text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap">PROFILE SIMULATION:</span>
                    <select
                      value={selectedVolId}
                      onChange={(e) => setSelectedVolId(e.target.value)}
                      className="bg-gray-950 border border-gray-850 rounded px-2 py-1 text-xs text-white font-mono leading-none focus:outline-none focus:border-green-600 w-full sm:w-auto select-none"
                    >
                      {volunteers.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Render Selected Volunteer Sentry Board */}
                {activeVolunteer ? (
                  <div className="space-y-4">
                    {/* Volunteer Metadata Banner */}
                    <div className="bg-gray-950 border border-gray-850 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                      <div className="absolute right-0 top-0 h-24 w-24 bg-green-950/10 rounded-full border border-green-800/20 -mr-6 -mt-6 pointer-events-none" />
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-green-950/80 border border-green-800 text-green-400 flex items-center justify-center font-bold font-mono text-xs">
                            {activeVolunteer.name[0]}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white leading-tight font-sans tracking-tight">{activeVolunteer.name}</h4>
                            <p className="text-[9px] font-mono text-green-400 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              Grid Status: Active Standby ({activeVolunteer.status})
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {activeVolunteer.skills.map((skill, index) => (
                            <span key={index} className="px-1.5 py-0.5 rounded bg-[#101b17] border border-green-900/40 text-[8.5px] font-mono text-green-400">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left sm:text-right font-mono text-[10px] bg-gray-900 px-3 py-2 rounded border border-gray-850/60 w-full sm:w-auto shrink-0">
                        <div className="flex justify-between sm:justify-end gap-3 text-gray-400">
                          <span>DEVICE RADIUS:</span>
                          <strong className="text-white font-black">{activeVolunteer.notifyRadiusKm} KM Range</strong>
                        </div>
                        <div className="flex justify-between sm:justify-end gap-3 text-gray-400">
                          <span>COORDINATE STATION:</span>
                          <strong className="text-white font-extrabold">{activeVolunteer.lat.toFixed(4)}°N, {activeVolunteer.lng.toFixed(4)}°E</strong>
                        </div>
                        <p className="text-[9px] text-gray-500 flex items-center gap-1 mt-1 justify-start sm:justify-end">
                          <Phone className="h-3 w-3" />
                          {activeVolunteer.phone}
                        </p>
                      </div>
                    </div>

                    {/* Active Standby Profile details section - Equipment Gear */}
                    <div className="p-3 bg-gray-950 border border-gray-850 rounded-lg">
                      <div className="text-[9px] font-mono text-gray-500 font-bold uppercase tracking-wider mb-1.5 block">EQUIPMENT & VEHICLES ON STANDBY:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeVolunteer.equipment.map((eq, i) => (
                          <div key={i} className="px-2 py-1 bg-gray-900 border border-gray-800 rounded font-mono text-[9px] text-white flex items-center gap-1">
                            <span className="w-1 h-1 bg-blue-500 rounded-full" />
                            {eq}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* LIVE DISASTER PROXIMITY NOTIFICATIONS PANEL */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-gray-850 pb-1 flex-wrap gap-2">
                        <h4 className="text-xs font-mono font-black text-white flex items-center gap-1.5 uppercase">
                          <Bell className="h-4 w-4 text-green-400 animate-bounce" />
                          PROXIMITY ALERTS INBOX ({activeVolunteer.receivedAlerts.length})
                        </h4>
                        <span className="text-[8.5px] font-mono text-gray-500">RADIUS COMPUTE: ACTIVE</span>
                      </div>

                      {activeVolunteer.receivedAlerts.length > 0 ? (
                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                          {activeVolunteer.receivedAlerts.map((notif) => {
                            const isAccepted = notif.accepted;
                            return (
                              <div 
                                key={notif.id}
                                className={`p-4.5 rounded-lg border text-left font-sans transition duration-200 ${
                                  isAccepted 
                                    ? 'bg-[#101b17] border-green-700/80' 
                                    : 'bg-[#1a0f12] border-red-500/35 glow-blue'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`h-2 w-2 rounded-full ${isAccepted ? 'bg-green-500' : 'bg-red-500 animate-ping'}`} />
                                      <strong className="text-xs font-sans font-black text-white tracking-tight uppercase leading-none">{notif.title}</strong>
                                    </div>
                                    <p className="text-[9.5px] font-mono text-gray-500 leading-none">
                                      GPS DISTANCE: <span className="text-red-400 font-bold">{notif.distanceKm} KM</span> • SEVERITY: <span className="text-gray-300 font-bold">{notif.severity}</span>
                                    </p>
                                  </div>

                                  <div className="text-[8.5px] font-mono text-gray-500">
                                    ALERT TIME: {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>

                                <p className="text-xs text-gray-300 leading-relaxed font-sans mt-2.5 bg-gray-950/80 p-2.5 rounded border border-gray-850/50">
                                  {notif.message}
                                </p>

                                <div className="mt-3.5 flex items-center justify-between border-t border-gray-900 pt-2.5">
                                  <span className="text-[9px] font-mono text-gray-500">MISSION LINK: <strong className="text-gray-400 uppercase">{notif.incidentId}</strong></span>
                                  
                                  {isAccepted ? (
                                    <div className="px-3.5 py-1.5 bg-[#162721] border border-green-800 rounded text-green-400 font-mono text-[10px] font-black uppercase flex items-center gap-1 tracking-wider leading-none">
                                      <Check className="h-3.5 w-3.5" />
                                      DISPATCH ENGAGED - EN ROUTE
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => onAcceptAlert && onAcceptAlert(activeVolunteer.id, notif.id)}
                                      className="py-1.5 px-3.5 bg-green-650 hover:bg-green-700 text-white font-mono text-[10px] font-black uppercase rounded tracking-wider transition hover:scale-102 flex items-center gap-1.5 cursor-pointer shadow-md leading-none"
                                    >
                                      <Zap className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300 animate-pulse" />
                                      ACCEPT OPERATIONS CALL
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-10 border border-dashed border-gray-850 rounded text-center text-xs text-gray-500 font-mono space-y-1.5 bg-gray-950/30">
                          <ShieldCheck className="h-6 w-6 text-gray-600 mx-auto animate-pulse" />
                          <p className="max-w-xs mx-auto">
                            No active disasters within your <strong className="text-green-500 font-bold">{activeVolunteer.notifyRadiusKm} Km</strong> radius. Standing by and monitoring dispatch signals.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="py-10 text-center font-mono text-gray-500 border border-dashed border-gray-850 rounded">
                    Initializing stand-by databases...
                  </div>
                )}

              </div>
            </section>

            {/* RIGHT COLUMN: REGISTER NEW VOLUNTEERS PORTLET & ACTION MANUAL (5 Columns) */}
            <section className="lg:col-span-5 flex flex-col justify-between space-y-6" id="volunteer-registration-column">
              <div className="space-y-6 h-full flex flex-col justify-between">
                
                {/* Registration Form Card */}
                <div className="bg-card border border-gray-850 rounded-lg p-5 text-left space-y-4">
                  <div className="border-b border-gray-800 pb-2">
                    <h4 className="text-xs font-mono font-black text-green-400 tracking-wider uppercase flex items-center gap-1.5">
                      <HeartHandshake className="h-4 w-4 text-green-400" />
                      REGISTER AS NEIGHBORHOOD RESCUER
                    </h4>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">APPEND YOUR STATS TO REGIONAL VOLUNTEER RADAR</p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-[9px] text-gray-550 font-bold uppercase block mb-1">YOUR RESCUER NAME / CALlSIGN</label>
                      <input 
                        type="text" 
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-gray-950 border border-gray-850 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-green-600 select-text"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[9px] text-gray-550 font-bold uppercase block mb-1 font-mono">STANDBY CONTACT PHONE</label>
                        <input 
                          type="tel" 
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+91 91000 12000"
                          className="w-full bg-gray-950 border border-gray-850 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-green-600 select-text"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-550 font-bold uppercase block mb-1">RADAR RADIUS (KM)</label>
                        <select
                          value={regRadius}
                          onChange={(e) => setRegRadius(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-green-600 select-none"
                        >
                          <option value="2.0">2.0 Km radius</option>
                          <option value="3.5">3.5 Km radius</option>
                          <option value="5.0">5.0 Km radius</option>
                          <option value="8.0">8.0 Km radius</option>
                        </select>
                      </div>
                    </div>

                    {/* Coordinates input with quick instructions */}
                    <div className="grid grid-cols-2 gap-2.5 p-2 bg-gray-950 border border-gray-900 rounded">
                      <div>
                        <label className="text-[8px] text-gray-400 font-bold uppercase block mb-1 font-mono">LATITUDE STN</label>
                        <input 
                          type="text" 
                          value={regLat}
                          onChange={(e) => setRegLat(e.target.value)}
                          placeholder="12.9716"
                          className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-green-600 select-text"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-gray-400 font-bold uppercase block mb-1">LOGITUDE STN</label>
                        <input 
                          type="text" 
                          value={regLng}
                          onChange={(e) => setRegLng(e.target.value)}
                          placeholder="77.5946"
                          className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-green-600 select-text"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-gray-550 font-bold uppercase block mb-1">SPECIALIZED SKILLS (COMMA SEPARATED)</label>
                      <input 
                        type="text" 
                        value={regSkills}
                        onChange={(e) => setRegSkills(e.target.value)}
                        placeholder="e.g. Water Rescue, Triage, CPR"
                        className="w-full bg-gray-950 border border-gray-850 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-green-600 select-text"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-gray-550 font-bold uppercase block mb-1">STANDBY EQUIPMENT (COMMA SEPARATED)</label>
                      <input 
                        type="text" 
                        value={regEquipment}
                        onChange={(e) => setRegEquipment(e.target.value)}
                        placeholder="e.g. 4x4 Truck, Chainsaw, Inflatable Boat"
                        className="w-full bg-gray-950 border border-gray-850 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-green-600 select-text"
                      />
                    </div>

                    {regSuccess && (
                      <div className="bg-green-950 border border-green-800 text-green-400 p-2 text-center text-[10px] rounded animate-pulse">
                        SENTRY RADAR UPDATED: CHECK INBOX IN A SEC
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-green-650 hover:bg-green-700 font-mono text-xs font-black text-white hover:text-white rounded uppercase transition tracking-widest cursor-pointer mt-2 leading-none"
                    >
                      PUBLISH RESCUER METRICS
                    </button>
                  </form>
                </div>

                {/* Sentry Preparedness Guide widget */}
                <div className="bg-card border border-gray-805 rounded-lg p-4 space-y-3.5 text-left">
                  <div className="border-b border-gray-800 pb-2">
                    <h4 className="text-xs font-mono font-black text-blue-400 tracking-wider uppercase flex items-center gap-1.5">
                      <Compass className="h-4 w-4 text-blue-400" />
                      VOLUNTEER INCIDENT STANDARDS
                    </h4>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">STANDARDS OF OPERATION DURING CO-OPERATIONAL INCIDENTS</p>
                  </div>

                  <div className="space-y-2 font-sans text-xs text-gray-300 leading-relaxed">
                    <div className="p-2.5 bg-gray-950 border border-gray-850 rounded flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">01</span>
                      <div>
                        <strong className="text-white text-[11.5px] block font-sans">Wait for Local Verification</strong>
                        Ensure incidents have a "Verified" badge before engaging in heavy transit operations.
                      </div>
                    </div>

                    <div className="p-2.5 bg-gray-950 border border-gray-850 rounded flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">02</span>
                      <div>
                        <strong className="text-white text-[11.5px] block font-sans">Utilize Specialized Equipment</strong>
                        Never approach active swift currents or building collapses without rated helmets, lifejackets, or proper rope stabilizers.
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Dynamic Footer of instructions */}
      <footer className="border-t border-gray-85a bg-card/40 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-gray-500 shadow-inner">
        <div className="flex items-center gap-2">
          <HeartHandshake className="h-4 w-4 text-green-500 shrink-0" />
          <span>PORTAL MONITORING: ACTIVE • GLOBAL PROTECTION INSTRUCTIONS ACTIVE</span>
        </div>
        <span>CONNECTING CITIZENS WITH LIVE METRO DISPATCH INTEGRATION</span>
      </footer>

    </div>
  );
}
