import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  MapPin, 
  Compass, 
  Sparkles, 
  Plus, 
  Minus, 
  Eye, 
  ShieldAlert, 
  Clock,
  Activity,
  Flame,
  Anchor,
  AlertTriangle,
  Construction,
  Locate,
  Trash2,
  CheckCircle2,
  Settings,
  Radar,
  Radio,
  TrendingUp,
  Cpu,
  Tv,
  HeartHandshake
} from 'lucide-react';
import { Incident, Geofence, Hotspot, SensorFeed, Volunteer } from '../types';

interface IntelligenceMapProps {
  incidents: Incident[];
  onTriggerMission: (incidentId: string) => void;
  missions: any[];
  geofences?: Geofence[];
  hotspots?: Hotspot[];
  sensors?: SensorFeed[];
  onAddGeofence?: (name: string, lat: number, lng: number, radiusKm: number, severityLimit: string) => void;
  onDeleteGeofence?: (id: string) => void;
  volunteers?: Volunteer[];
}

const GEOGRAPHIC_FEATURES = [
  // Lakes / Hydro bodies
  { name: "Bellandur Reservoir Basin", lat: 12.9304, lng: 77.6784, type: "lake", bg: "rgba(14, 116, 144, 0.4)", border: "rgba(6, 182, 212, 0.45)", w: "12%", h: "9%", rounded: "rounded-[40%]" },
  { name: "Ulsoor Lake Hub", lat: 12.9812, lng: 77.6225, type: "lake", bg: "rgba(14, 116, 144, 0.4)", border: "rgba(6, 182, 212, 0.45)", w: "6%", h: "5.5%", rounded: "rounded-[35%]" },
  { name: "Varthur Wetlands", lat: 12.9430, lng: 77.7470, type: "lake", bg: "rgba(14, 116, 144, 0.3)", border: "rgba(6, 182, 212, 0.4)", w: "10%", h: "7.5%", rounded: "rounded-[30%]" },
  { name: "Sankey Tank Catchment", lat: 13.0068, lng: 77.5720, type: "lake", bg: "rgba(14, 116, 144, 0.35)", border: "rgba(6, 182, 212, 0.4)", w: "5%", h: "5%", rounded: "rounded-[45%]" },
  
  // Parks / High-elevation Green reserves
  { name: "Cubbon Forest Reserve", lat: 12.9785, lng: 77.5950, type: "park", bg: "rgba(20, 83, 45, 0.35)", border: "rgba(34, 197, 94, 0.35)", w: "7.5%", h: "10%", rounded: "rounded-lg" },
  { name: "Lalbagh Botanical Gardens", lat: 12.9461, lng: 77.5855, type: "park", bg: "rgba(20, 83, 45, 0.35)", border: "rgba(34, 197, 94, 0.35)", w: "8%", h: "8.5%", rounded: "rounded-full" },
  
  // Grid identifiers
  { name: "EOC Central Sector A1", lat: 12.9716, lng: 77.5946, type: "node" },
  { name: "Whitefield High-Tech Corridor", lat: 12.9698, lng: 77.7499, type: "node" },
  { name: "Hebbal Flyover Grid Matrix", lat: 13.0350, lng: 77.5975, type: "node" },
  { name: "Electronic City Ind. Zone", lat: 12.8452, lng: 77.6722, type: "node" }
];

export default function IntelligenceMap({ 
  incidents, 
  onTriggerMission, 
  missions,
  geofences = [],
  hotspots = [],
  sensors = [],
  onAddGeofence,
  onDeleteGeofence,
  volunteers = []
}: IntelligenceMapProps) {
  const [activeLayer, setActiveLayer] = useState<'vector' | 'satellite' | 'heatmap'>('vector');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedInc, setSelectedInc] = useState<Incident | null>(incidents[0] || null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [showVolunteers, setShowVolunteers] = useState<boolean>(true);
  const [showVolunteerDensity, setShowVolunteerDensity] = useState<boolean>(true);
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });

  // Add Geofence modal state
  const [gfName, setGfName] = useState('Sector Containment Bravo');
  const [gfRadius, setGfRadius] = useState(2.0);
  const [gfSeverity, setGfSeverity] = useState('All');
  const [isPlattingMode, setIsPlattingMode] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Find clusters of active incidents
  const getIncidentClusters = () => {
    const clusters: { lat: number; lng: number; incidents: Incident[]; count: number; radiusDeg: number }[] = [];
    const threshold = 0.027; // approx 3 km

    incidents.forEach(inc => {
      let added = false;
      for (const cluster of clusters) {
        const dx = inc.lng - cluster.lng;
        const dy = inc.lat - cluster.lat;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= threshold) {
          cluster.incidents.push(inc);
          cluster.lat = (cluster.lat * (cluster.incidents.length - 1) + inc.lat) / cluster.incidents.length;
          cluster.lng = (cluster.lng * (cluster.incidents.length - 1) + inc.lng) / cluster.incidents.length;
          cluster.count = cluster.incidents.length;
          added = true;
          break;
        }
      }
      if (!added) {
        clusters.push({
          lat: inc.lat,
          lng: inc.lng,
          incidents: [inc],
          count: 1,
          radiusDeg: threshold
        });
      }
    });

    return clusters;
  };

  const clusters = getIncidentClusters();
  const clustersWithVolunteerDensity = clusters.map((cluster, idx) => {
    const nearbyVolunteers = volunteers.filter(vol => {
      const dx = vol.lng - cluster.lng;
      const dy = vol.lat - cluster.lat;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= 0.035; // approx 3.8 km
    });
    
    const densityVal = nearbyVolunteers.length;
    let densityLevel: 'High' | 'Medium' | 'Low' = 'Low';
    if (densityVal >= 5) densityLevel = 'High';
    else if (densityVal >= 2) densityLevel = 'Medium';

    return {
      id: `cluster-${idx}`,
      ...cluster,
      volunteers: nearbyVolunteers,
      densityValue: densityVal,
      densityLevel,
    };
  });

  // Map coordinate limits focused around Bangalore Grid Core
  const bangaloreLatMin = 12.8000;
  const bangaloreLatMax = 13.0500;
  const bangaloreLngMin = 77.5000;
  const bangaloreLngMax = 77.8000;

  // Transform real coordinates to map box percentages
  const getCoordsPercentage = (lat: number, lng: number) => {
    const latRange = bangaloreLatMax - bangaloreLatMin;
    const lngRange = bangaloreLngMax - bangaloreLngMin;
    const y = 100 - ((lat - bangaloreLatMin) / latRange) * 100;
    const x = ((lng - bangaloreLngMin) / lngRange) * 100;
    return { x, y };
  };

  const currentCenter = getCoordsPercentage(12.9716, 77.5946);

  const getSvgCoordinates = (lat: number, lng: number) => {
    const pct = getCoordsPercentage(lat, lng);
    return `${pct.x}% ${pct.y}%`;
  };

  // Capture current cursor trace
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = x / rect.width;
    const yPct = y / rect.height;

    const computedLng = bangaloreLngMin + xPct * (bangaloreLngMax - bangaloreLngMin);
    const computedLat = bangaloreLatMax - yPct * (bangaloreLatMax - bangaloreLatMin);

    setCursorCoords({ lat: Number(computedLat.toFixed(4)), lng: Number(computedLng.toFixed(4)) });
  };

  // Capture click on map for plotting geofence anchors
  const handleMapClick = () => {
    if (isPlattingMode && onAddGeofence) {
      onAddGeofence(gfName, cursorCoords.lat, cursorCoords.lng, gfRadius, gfSeverity);
      setIsPlattingMode(false);
      triggerNotification("New dynamic geofence containment plotted successfully!");
    }
  };

  const triggerNotification = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 4000);
  };

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return '#DC2626'; // Red
      case 'High': return '#EA580C'; // Orange
      case 'Medium': return '#EAB308'; // Yellow
      default: return '#16A34A'; // Green
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'Flood': return <Anchor className="h-3.5 w-3.5" />;
      case 'Fire': return <Flame className="h-3.5 w-3.5" />;
      case 'Road Collapse': return <Construction className="h-3.5 w-3.5" />;
      default: return <AlertTriangle className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 h-auto xl:h-[calc(100vh-140px)] overflow-hidden text-left font-sans">
      
      {/* 1. LEFT SIDEBAR: MONITORING CENTER (3 columns) */}
      <div className="xl:col-span-3 flex flex-col justify-between bg-card border border-gray-805 rounded-lg p-4 h-[580px] xl:h-full overflow-y-auto glow-blue">
        <div className="space-y-4">
          <div className="border-b border-gray-800 pb-2">
            <h3 className="text-xs font-black text-blue-400 font-mono flex items-center gap-1.5 uppercase tracking-wider">
              <Radar className="h-4 w-4 text-blue-400 animate-pulse" />
              SENTRY CO-ORDINATION SYSTEM
            </h3>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">TERRITORIAL STATIONS & NEIGHBORHOOD FENCES</p>
          </div>

          {/* Define a fence configuration panel */}
          <div className="bg-gray-950 p-3 rounded-lg border border-gray-850 space-y-3">
            <div className="text-[10px] text-blue-400 font-mono font-bold tracking-widest uppercase flex items-center justify-between">
              <span>PLOT NEW CONTAINMENT BOUND</span>
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[9px] font-mono text-gray-500 font-bold block mb-1">GEOFENCE LABEL / NAME</label>
                <input 
                  type="text" 
                  value={gfName} 
                  onChange={(e) => setGfName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-gray-500 block mb-1">RADIUS LIMIT (KM)</label>
                  <select 
                    value={gfRadius}
                    onChange={(e) => setGfRadius(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="1.0">1.0 Km</option>
                    <option value="1.5">1.5 Km</option>
                    <option value="2.0">2.0 Km</option>
                    <option value="3.0">3.0 Km</option>
                    <option value="4.0">4.0 Km</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-gray-500 block mb-1">CRITERIA LIMIT</label>
                  <select 
                    value={gfSeverity} 
                    onChange={(e) => setGfSeverity(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="All">All Incidents</option>
                    <option value="Critical">Critical Only</option>
                    <option value="High">High or Above</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setIsPlattingMode(!isPlattingMode)}
                className={`w-full py-2 text-xs font-mono font-bold rounded transition flex items-center justify-center gap-1.5 ${
                  isPlattingMode 
                    ? 'bg-red-650 hover:bg-red-750 text-white animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Locate className="h-4 w-4 shrink-0" />
                {isPlattingMode ? "CLICK ON MAP TO PLOT BOUND" : "PLOT GRID VIA MAP ANCHOR"}
              </button>
            </div>
          </div>

          {/* Active Volunteer Radar monitoring lists */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1 flex items-center justify-between">
              <span>VOLUNTEER STATIONS</span>
              <div className="flex items-center gap-3.5 select-none">
                <label className="flex items-center gap-1 cursor-pointer" title="Toggle pins layer">
                  <span className="text-[9px] text-gray-500 font-mono font-bold">PIN</span>
                  <input 
                    type="checkbox"
                    checked={showVolunteers}
                    onChange={(e) => setShowVolunteers(e.target.checked)}
                    className="accent-green-550 h-3 w-3 rounded focus:ring-0 cursor-pointer"
                  />
                </label>
                <label className="flex items-center gap-1 cursor-pointer" title="Toggle volunteer density heatmap/coverage around active incident clusters">
                  <span className="text-[9px] text-teal-400 font-mono font-black animate-pulse">DENSITY</span>
                  <input 
                    type="checkbox"
                    checked={showVolunteerDensity}
                    onChange={(e) => setShowVolunteerDensity(e.target.checked)}
                    className="accent-teal-555 h-3 w-3 rounded focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2 max-h-[160px] xl:max-h-[220px] overflow-y-auto">
              {volunteers.map((vol) => {
                const isSelected = selectedVolunteer?.id === vol.id;
                return (
                  <div
                    key={vol.id}
                    onClick={() => {
                      setSelectedVolunteer(vol);
                      setSelectedInc(null);
                      setSelectedHotspot(null);
                      setSelectedGeofence(null);
                    }}
                    className={`p-2 rounded bg-gray-950 border transition cursor-pointer text-left font-sans ${
                      isSelected ? 'border-green-500 shadow shadow-green-950/80' : 'border-gray-850 hover:border-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <HeartHandshake className="h-3.5 w-3.5 text-green-500" />
                        {vol.name}
                      </span>
                      <span className={`px-1 py-0.2 rounded text-[7.5px] font-mono font-bold leading-none ${
                        vol.status === 'On Mission' ? 'bg-green-950 text-green-400 border border-green-900 animate-pulse' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {vol.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between font-mono text-[9px] text-gray-500">
                      <span>RAD RANGE: {vol.notifyRadiusKm}KM</span>
                      <span>ALERTS REC: {vol.receivedAlerts.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Geofence Containment Zones Listings */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1 flex items-center justify-between">
              <span>ACTIVE GEOFENCE DOMAINS</span>
              <span className="text-[9px] text-gray-500 font-mono">{geofences.length} Fences</span>
            </div>

            <div className="space-y-1.5 max-h-[140px] xl:max-h-[180px] overflow-y-auto">
              {geofences.map((gf) => {
                const isSelected = selectedGeofence?.id === gf.id;
                return (
                  <div 
                    key={gf.id}
                    onClick={() => {
                      setSelectedGeofence(gf);
                      setSelectedHotspot(null);
                      setSelectedVolunteer(null);
                      setSelectedInc(null);
                    }}
                    className={`p-2 rounded bg-gray-950 border transition duration-150 cursor-pointer text-left ${
                      isSelected ? 'border-blue-500 glow-blue' : 'border-gray-850 hover:border-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Radar className={`h-3 w-3 shrink-0 ${
                          gf.status === 'Breached' ? 'text-red-500 animate-ping' : gf.status === 'Monitoring' ? 'text-yellow-400' : 'text-blue-400'
                        }`} />
                        <span className="text-xs font-bold text-white leading-tight font-sans tracking-tight">{gf.name}</span>
                      </div>
                      
                      {onDeleteGeofence && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteGeofence(gf.id);
                            if (selectedGeofence?.id === gf.id) setSelectedGeofence(null);
                          }}
                          className="text-gray-500 hover:text-red-400 p-0.5"
                          title="Purge Geofence Zone"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <div className="mt-1 flex items-center justify-between font-mono text-[9px] text-gray-450 pt-1 border-t border-gray-900/40">
                      <span>RADIAL: <strong className="text-gray-300">{gf.radiusKm} KM</strong></span>
                      <span className={`px-1 rounded text-[8px] font-black uppercase ${
                        gf.status === 'Breached' ? 'bg-red-950 text-red-500 border border-red-900' : 'bg-yellow-950 text-yellow-450 border border-yellow-900'
                      }`}>
                        {gf.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Warning Notification Banner inside Left sidebar */}
        <div className="border-t border-gray-850 pt-2.5 mt-2 transition text-left">
          <AnimatePresence mode="wait">
            {showNotification ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-blue-950 border border-blue-900 text-blue-400 text-[10px] font-mono p-2 rounded text-center leading-normal"
              >
                {showNotification}
              </motion.div>
            ) : (
              <div className="text-[9px] text-gray-500 font-mono text-center leading-normal uppercase">
                CO-OPERATIONAL DIGITAL GEOSPATIAL MATRIX: ACTIVE
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. CENTER: THE INTERACTIVE TACTICAL GIS DIGITAL CANVAS (6 columns) */}
      <div className="xl:col-span-6 flex flex-col justify-between space-y-4 h-full">
        {/* Map Header details */}
        <div className="flex items-center justify-between bg-card border border-gray-805 px-3 py-2 rounded-lg text-left">
          <div className="flex items-center gap-2">
            <Compass className="h-4.5 w-4.5 text-blue-500 animate-spin-slow" />
            <div className="text-[10px] font-mono text-gray-400 font-bold">
              GPS COMPOSITE: <span className="text-white">TACTICAL BANGALORE GIS CORE GRID</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black font-mono text-gray-500">ZOOM PRESETS:</span>
            <div className="flex bg-gray-950 border border-gray-850 p-0.5 rounded">
              <button 
                onClick={() => setActiveLayer('vector')}
                className={`px-2 py-0.5 text-[9px] font-mono rounded ${activeLayer === 'vector' ? 'bg-blue-900/60 text-white font-bold' : 'text-gray-400'}`}
              >
                GRID
              </button>
              <button 
                onClick={() => setActiveLayer('satellite')}
                className={`px-2 py-0.5 text-[9px] font-mono rounded ${activeLayer === 'satellite' ? 'bg-blue-900/60 text-white font-bold' : 'text-gray-400'}`}
              >
                SAT
              </button>
              <button 
                onClick={() => setActiveLayer('heatmap')}
                className={`px-2 py-0.5 text-[9px] font-mono rounded ${activeLayer === 'heatmap' ? 'bg-blue-900/60 text-white font-bold' : 'text-gray-400'}`}
              >
                HEAT
              </button>
            </div>
          </div>
        </div>

        {/* Map Canvas wrapper with custom cursor plot trigger handling */}
        <div className="flex-1 min-h-[420px] bg-gray-950 border border-gray-850 rounded-lg overflow-hidden relative select-none shadow-inner shadow-black">
          
          <div 
            ref={mapContainerRef} 
            onMouseMove={handleMouseMove} 
            onClick={handleMapClick}
            className={`w-full h-full relative ${isPlattingMode ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ 
              backgroundImage: activeLayer === 'satellite' 
                ? 'radial-gradient(circle, rgba(11,18,32,0.92) 0%, rgba(5,8,15,0.98) 100%), url(https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200)'
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: `scale(${zoomLevel / 100})`,
              transition: 'transform 0.15s ease'
            }}
          >
            {/* 2.1 Base tactical coordinate grid lines */}
            {(activeLayer === 'vector' || activeLayer === 'satellite') && (
              <div className="absolute inset-0">
                {activeLayer === 'vector' && (
                  <div className="absolute inset-0 bg-[#070b13] opacity-[0.98]">
                    {/* Lat/Lng lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#111724_1.5px,transparent_1.5px),linear-gradient(to_bottom,#111724_1.5px,transparent_1.5px)] bg-[size:40px_40px]" />
                  </div>
                )}

                {/* Draw detailed vector lines for real roads */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none fill-none">
                  {/* Outer Ring Road Express (ORR) */}
                  <polyline 
                    points={`${getSvgCoordinates(13.0350, 77.5975)} ${getSvgCoordinates(12.9719, 77.6412)} ${getSvgCoordinates(12.9304, 77.6784)} ${getSvgCoordinates(12.8452, 77.6722)}`}
                    className="stroke-cyan-500/15 stroke-[1.8] stroke-dasharray-4"
                  />
                  {/* National Highway 44 (Hosur Link) */}
                  <polyline 
                    points={`${getSvgCoordinates(12.9740, 77.6010)} ${getSvgCoordinates(12.9250, 77.5938)} ${getSvgCoordinates(12.8452, 77.6722)}`}
                    className="stroke-blue-500/15 stroke-[1.5]"
                  />
                  {/* MG Road - Whitefield Transit Link */}
                  <polyline 
                    points={`${getSvgCoordinates(12.9774, 77.5729)} ${getSvgCoordinates(12.9740, 77.6010)}  ${getSvgCoordinates(12.9719, 77.6412)} ${getSvgCoordinates(12.9698, 77.7499)}`}
                    className="stroke-amber-500/15 stroke-[1.5]"
                  />
                </svg>

                {/* Rotating radar sweeping line */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden origin-center animate-spin"
                  style={{
                    backgroundImage: 'conic-gradient(from 0deg, rgba(59, 130, 246, 0.3) 0deg, rgba(59, 130, 246, 0.04) 50deg, transparent 180deg)',
                    animationDuration: '14s'
                  }}
                />
              </div>
            )}

            {/* 2.2 Heatmap Rendering Core */}
            {activeLayer === 'heatmap' && (
              <div className="absolute inset-0 bg-[#05080e]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1320_1.5px,transparent_1.5px),linear-gradient(to_bottom,#0e1320_1.5px,transparent_1.5px)] bg-[size:45px_45px]" />
                
                {/* Pulsating Heat points around severe/critical issues */}
                {incidents.map((inc) => {
                  const pos = getCoordsPercentage(inc.lat, inc.lng);
                  return (
                    <div 
                      key={`heat-${inc.id}`}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full filter blur-xl ${
                        inc.severity === 'Critical' ? 'bg-red-800/30 w-36 h-36 animate-pulse' : 'bg-orange-950/20 w-24 h-24'
                      }`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    />
                  );
                })}
              </div>
            )}

            {/* 2.3 REALISTIC GEOGRAPHIC FEATURES (Ony shown in Vector and Satellite modes) */}
            {activeLayer !== 'heatmap' && GEOGRAPHIC_FEATURES.map((feat, idx) => {
              if (feat.type === 'lake' || feat.type === 'park') {
                const pos = getCoordsPercentage(feat.lat, feat.lng);
                return (
                  <div
                    key={`feat-${idx}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center border select-none pointer-events-none shadow-sm shadow-black/8 w-24 h-16 origin-center text-center"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      width: feat.w,
                      height: feat.h,
                      backgroundColor: feat.bg,
                      borderColor: feat.border,
                      borderRadius: feat.type === 'park' ? (feat.name.includes('Lalbagh') ? '9999px' : '8px') : '42%'
                    }}
                  >
                    <span className="text-[6.5px] font-mono text-gray-500 uppercase tracking-widest font-bold leading-none px-1 block break-words">
                      {feat.name}
                    </span>
                  </div>
                );
              } else {
                // Key Urban Hub Names annotated
                const pos = getCoordsPercentage(feat.lat, feat.lng);
                return (
                  <div 
                    key={`feat-${idx}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-gray-950/65 border border-gray-850 rounded font-mono text-[6.5px] text-gray-500 uppercase tracking-widest select-none pointer-events-none"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    🛰️ {feat.name}
                  </div>
                );
              }
            })}

            {/* 2.4 Potential Hotspot Overlay Layout (AI predictions) */}
            {hotspots.map((hs) => {
              const pos = getCoordsPercentage(hs.lat, hs.lng);
              const isSelected = selectedHotspot?.id === hs.id;
              
              return (
                <div key={`hs-zone-${hs.id}`}>
                  <div 
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed animate-pulse pointer-events-none transition duration-300 ${
                      hs.riskLevel === 'Severe' 
                        ? 'bg-red-950/20 border-red-500/40 w-28 h-28' 
                        : hs.riskLevel === 'Elevated' 
                        ? 'bg-orange-950/15 border-orange-500/35 w-24 h-24' 
                        : 'bg-yellow-950/10 border-yellow-500/25 w-16 h-16'
                    }`}
                    style={{ 
                      left: `${pos.x}%`, 
                      top: `${pos.y}%`,
                      boxShadow: isSelected ? '0 0 25px rgba(220, 38, 38, 0.4)' : 'none',
                      borderColor: isSelected ? '#ef4444' : undefined,
                      animationDuration: '5s'
                    }}
                  />

                  {/* Hotspot anchor overlay tag */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHotspot(hs);
                      setSelectedGeofence(null);
                      setSelectedVolunteer(null);
                      setSelectedInc(null);
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group flex items-center gap-1"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div className="p-1 bg-red-955/90 border border-red-500/60 rounded shadow-md text-[8.5px] font-mono text-red-400 font-bold tracking-tight hover:scale-105 transition-all whitespace-nowrap">
                      ⚠️ AI RISK {hs.riskScore}%
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 2.5 Geofence Containment zones Overlay circles */}
            {geofences.map((gf) => {
              const pos = getCoordsPercentage(gf.lat, gf.lng);
              const isSelected = selectedGeofence?.id === gf.id;
              const radialFactor = gf.radiusKm * 32;

              return (
                <div key={`gf-circle-${gf.id}`}>
                  <div 
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition duration-300 pointer-events-none ${
                      gf.status === 'Breached' 
                        ? 'border-red-500 bg-red-950/10 border-dashed animate-pulse' 
                        : gf.status === 'Monitoring' 
                        ? 'border-yellow-500 bg-yellow-950/5 border-dashed' 
                        : 'border-blue-500 bg-blue-900/5 stroke-dasharray-4'
                    }`}
                    style={{ 
                      left: `${pos.x}%`, 
                      top: `${pos.y}%`, 
                      width: `${radialFactor * 2}px`, 
                      height: `${radialFactor * 2}px`,
                      boxShadow: isSelected ? 'inset 0 0 15px rgba(37,99,235,0.4), 0 0 10px rgba(37,99,235,0.2)' : 'none',
                      borderWidth: isSelected ? '2px' : '1px'
                    }}
                  />
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGeofence(gf);
                      setSelectedHotspot(null);
                      setSelectedVolunteer(null);
                      setSelectedInc(null);
                    }}
                    className="absolute z-10 cursor-pointer p-0.5 rounded-full border bg-gray-950"
                    style={{ 
                      left: `${pos.x}%`, 
                      top: `${pos.y - gf.radiusKm * 4}%`,
                      borderColor: gf.status === 'Breached' ? '#ef4444' : '#3b82f6'
                    }}
                  >
                    <Radar className="h-3 w-3 text-blue-400" />
                  </div>
                </div>
              );
            })}

            {/* 2.6 Active Standby Volunteer Markers */}
            {showVolunteers && volunteers.map((vol) => {
              const pos = getCoordsPercentage(vol.lat, vol.lng);
              const isSelected = selectedVolunteer?.id === vol.id;
              
              return (
                <div
                  key={`map-vol-${vol.id}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVolunteer(vol);
                    setSelectedInc(null);
                    setSelectedHotspot(null);
                    setSelectedGeofence(null);
                  }}
                >
                  <span className="absolute -inset-2.5 rounded-full border border-green-500/30 animate-pulse" style={{ animationDuration: '4s' }} />

                  <div 
                    className={`flex items-center justify-center rounded-full border transition duration-200 shadow-md ${
                      isSelected 
                        ? 'w-8 h-8 scale-110 bg-green-600 border-white text-white' 
                        : 'w-7 h-7 bg-[#04100c] border-green-550 text-green-400 hover:scale-[1.08]'
                    }`}
                  >
                    <HeartHandshake className="h-3.5 w-3.5" />
                  </div>

                  <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition duration-150 bg-gray-950 text-green-450 border border-green-900 rounded px-1.5 py-0.5 whitespace-nowrap text-[8.5px] font-mono z-50 pointer-events-none p-1 leading-none">
                    {vol.id}: {vol.name} ({vol.status})
                  </div>
                </div>
              );
            })}

            {/* 2.6.5 Volunteer Density Coverage Layer */}
            {showVolunteerDensity && clustersWithVolunteerDensity.map((cluster) => {
              const pos = getCoordsPercentage(cluster.lat, cluster.lng);
              const isSelected = selectedCluster?.id === cluster.id;
              
              // Map density to sizing & color
              const size = 32 + (cluster.densityValue * 14); // radius scales with number of volunteers
              const colorClass = cluster.densityLevel === 'High' 
                ? 'border-green-500/60 bg-green-500/10' 
                : cluster.densityLevel === 'Medium'
                ? 'border-teal-500/50 bg-teal-500/8'
                : 'border-yellow-500/30 bg-yellow-500/4';
              
              const textTheme = cluster.densityLevel === 'High'
                ? 'text-green-400'
                : cluster.densityLevel === 'Medium'
                ? 'text-teal-400'
                : 'text-yellow-500';

              return (
                <div key={`vd-cluster-${cluster.id}`}>
                  {/* Dynamic pulse ripple representing the coverage area */}
                  <div 
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-300 pointer-events-none ${colorClass}`}
                    style={{ 
                      left: `${pos.x}%`, 
                      top: `${pos.y}%`, 
                      width: `${size * 2}px`, 
                      height: `${size * 2}px`,
                      boxShadow: isSelected 
                        ? 'inset 0 0 20px rgba(20,184,166,0.35), 0 0 15px rgba(20,184,166,0.2)' 
                        : 'none',
                      borderWidth: isSelected ? '2px' : '1.5px',
                      borderStyle: 'dashed'
                    }}
                  />
                  
                  {/* Tag / indicator in area */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCluster(cluster);
                      setSelectedInc(null);
                      setSelectedHotspot(null);
                      setSelectedGeofence(null);
                      setSelectedVolunteer(null);
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group flex items-center gap-1 animate-pulse"
                    style={{ left: `${pos.x}%`, top: `${pos.y - 1.5}%` }}
                  >
                    <div className="px-1.5 py-0.5 bg-gray-950/90 border border-teal-500/50 rounded shadow-md text-[8px] font-mono font-bold hover:scale-105 transition-all whitespace-nowrap flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                      <span className={textTheme}>DENSITY: {cluster.densityValue} VOLS</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 2.7 Active Plotted Incident Markers */}
            {incidents.map((inc) => {
              const pos = getCoordsPercentage(inc.lat, inc.lng);
              const isSelected = selectedInc?.id === inc.id;
              const color = getMarkerColor(inc.severity);

              return (
                <div
                  key={`mark-${inc.id}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-30"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInc(inc);
                    setSelectedHotspot(null);
                    setSelectedGeofence(null);
                    setSelectedVolunteer(null);
                  }}
                >
                  {inc.severity === 'Critical' && (
                    <span 
                      className="absolute -inset-3 rounded-full animate-ping pointer-events-none"
                      style={{ border: `1.5px solid ${color}`, animationDuration: '3s' }}
                    />
                  )}

                  <div 
                    className={`relative flex items-center justify-center rounded-full border transition duration-200 shadow-md ${
                      isSelected ? 'w-8.5 h-8.5 z-40 scale-[1.10]' : 'w-7.5 h-7.5 hover:scale-[1.05]'
                    }`}
                    style={{ 
                      backgroundColor: isSelected ? color : '#111827', 
                      borderColor: isSelected ? '#ffffff' : color
                    }}
                  >
                    <span style={{ color: isSelected ? '#ffffff' : color }}>
                      {getIncidentIcon(inc.type)}
                    </span>
                  </div>

                  <div className="absolute top-8 left-1/2 -translate-x-1/2 scale-[0.80] opacity-0 group-hover:opacity-100 transition duration-150 bg-gray-950/90 text-white border border-gray-805 rounded px-1.5 py-0.5 whitespace-nowrap text-[9px] font-mono z-50 pointer-events-none">
                    {inc.id}: {inc.type}
                  </div>
                </div>
              );
            })}

            {/* Static Bearing Compass Rose overlay decoration */}
            <div className="absolute top-4 right-4 pointer-events-none text-[10px] font-mono text-gray-400 bg-gray-900/70 backdrop-blur-sm border border-gray-850 p-2.5 rounded flex items-center gap-2 select-none">
              <Compass className="h-4.5 w-4.5 text-blue-500 animate-spin-slow shrink-0" />
              <div>
                <div>BEARING: GRID NORTH</div>
                <div className="text-[9px] mt-0.5 text-gray-500 uppercase tracking-widest leading-none font-bold">Bangalore EOC Sentry</div>
              </div>
            </div>

            {/* Map coordinate tracker panel */}
            <div className="absolute bottom-4 left-4 pointer-events-none font-mono text-[9px] text-gray-400 bg-gray-950/80 border border-gray-850 px-2.5 py-1 rounded select-none">
              GRID: <span className="text-blue-400 font-bold">{cursorCoords.lat}°N, {cursorCoords.lng}°E</span> 
              {isPlattingMode && <span className="text-red-500 font-black ml-1 uppercase animate-pulse">[PLATTING READY]</span>}
            </div>

            {/* Custom interactive scale selectors */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-gray-950/80 border border-gray-850 p-1 rounded select-none">
              <button 
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))} 
                className="p-1 text-gray-400 hover:text-white transition"
                title="Zoom Out"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-[10px] font-mono text-gray-400 w-10 text-center font-bold">{zoomLevel}%</span>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(220, prev + 10))} 
                className="p-1 text-gray-400 hover:text-white transition"
                title="Zoom In"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

          </div>
        </div>

        {/* Dynamic Detail Info Card Overlay (Incident, or Volunteer) */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {/* selected Incident */}
            {selectedInc && (
              <motion.div
                key={`sel-inc-${selectedInc.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-card border border-blue-500/40 p-3.5 rounded-lg flex flex-col md:flex-row items-center gap-4 glow-blue relative overflow-hidden"
                id="map-floating-details"
              >
                <div className="w-full md:w-28 h-20 rounded bg-gray-900 overflow-hidden shrink-0 border border-gray-805 relative">
                  <img 
                    src={selectedInc.image} 
                    alt={selectedInc.type} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-1 right-1 px-1 bg-gray-950/80 text-[8px] font-mono text-gray-400 border border-gray-805 rounded uppercase">
                    CONF: {selectedInc.confidence}%
                  </span>
                </div>

                <div className="flex-1 space-y-1 text-left w-full">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-mono text-blue-400 font-extrabold uppercase bg-blue-950/80 border border-blue-900/60 px-1.5 py-0.5 rounded flex items-center gap-1.5">
                      {getIncidentIcon(selectedInc.type)}
                      {selectedInc.id}: {selectedInc.type.toUpperCase()}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded leading-none ${
                      selectedInc.verification === 'Verified' ? 'bg-green-950 text-green-400 border border-green-905' : 'bg-yellow-950 text-yellow-400 border border-yellow-905'
                    }`}>
                      {selectedInc.verification}
                    </span>
                  </div>

                  <h3 className="text-white text-xs font-bold font-sans tracking-tight leading-relaxed">{selectedInc.location}</h3>
                  <p className="text-[10px] text-gray-400 font-mono leading-tight">
                    IMPACTS: <span className="text-white font-bold">{selectedInc.peopleDetected} citizens</span> | ACTION RECOMMENDATION: <span className="text-yellow-400">{selectedInc.recommendedAction}</span>
                  </p>
                </div>

                <div className="flex flex-row md:flex-col gap-1.5 w-full md:w-auto shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 md:border-l border-gray-805 pl-0 md:pl-4">
                  <button
                    onClick={() => onTriggerMission(selectedInc.id)}
                    className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-[10px] font-mono font-black text-white rounded transition leading-none select-none"
                  >
                    ESTABLISH DISPATCH
                  </button>
                  <button
                    onClick={() => setSelectedInc(null)}
                    className="w-full py-1.5 px-3 bg-gray-950 border border-gray-800 hover:text-white hover:bg-gray-900 text-[10px] font-mono text-gray-400 rounded transition leading-none select-none"
                  >
                    DE-SECTOR
                  </button>
                </div>
              </motion.div>
            )}

            {/* Selected Volunteer */}
            {selectedVolunteer && (
              <motion.div
                key={`sel-vol-${selectedVolunteer.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-card border border-green-500/40 p-3.5 rounded-lg flex flex-col md:flex-row items-center gap-4 shadow shadow-green-950/50 relative overflow-hidden"
                id="map-floating-volunteer-details"
              >
                <div className="w-12 h-12 rounded-full bg-[#061811] border border-green-800 flex items-center justify-center text-green-400 text-lg font-mono font-bold shrink-0">
                  {selectedVolunteer.name[0]}
                </div>

                <div className="flex-1 space-y-1 text-left w-full">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] font-mono text-green-400 font-extrabold uppercase bg-green-950/80 border border-green-900/60 px-1.5 py-0.5 rounded flex items-center gap-1.5">
                      <HeartHandshake className="h-3.5 w-3.5" />
                      ACTIVE VOLUNTEER STATION: {selectedVolunteer.id}
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-[#101b17] text-green-400 border border-green-905 px-1.5 py-0.5 rounded uppercase leading-none">
                      STATUS: {selectedVolunteer.status}
                    </span>
                  </div>

                  <h3 className="text-white text-xs font-bold font-sans tracking-tight leading-relaxed">
                    {selectedVolunteer.name} | CONTACT: {selectedVolunteer.phone}
                  </h3>
                  <p className="text-[10.5px] text-gray-400 font-sans leading-tight">
                    SKILLS: <span className="text-gray-200 font-bold">{selectedVolunteer.skills.join(', ')}</span> | EQUIPMENT: <span className="text-blue-400 font-bold">{selectedVolunteer.equipment.join(', ')}</span>
                  </p>
                </div>

                <div className="flex flex-row md:flex-col gap-1.5 w-full md:w-auto shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 md:border-l border-gray-850 pl-0 md:pl-4">
                  <a
                    href={`tel:${selectedVolunteer.phone}`}
                    className="w-full py-1.5 px-3 bg-green-650 hover:bg-green-700 text-[10px] font-mono font-black text-white rounded transition leading-none text-center block"
                  >
                    CALL COMPANION
                  </a>
                  <button
                    onClick={() => setSelectedVolunteer(null)}
                    className="w-full py-1.5 px-3 bg-gray-950 border border-gray-800 hover:text-white text-[10px] font-mono text-gray-400 rounded transition leading-none"
                  >
                    DE-SECTOR
                  </button>
                </div>
              </motion.div>
            )}

            {/* Selected Volunteer Density Cluster Area */}
            {selectedCluster && (
              <motion.div
                key={`sel-cluster-${selectedCluster.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-card border border-teal-500/40 p-3.5 rounded-lg flex flex-col md:flex-row items-center gap-4 shadow shadow-teal-950/50 relative overflow-hidden"
                id="map-floating-cluster-details"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-green-500" />
                <div className="w-12 h-12 rounded bg-[#041011] border border-teal-850 flex flex-col items-center justify-center text-teal-400 shrink-0">
                  <span className="text-[8px] font-mono leading-none tracking-tight">DENSITY</span>
                  <span className="text-sm font-mono font-bold">{selectedCluster.densityValue}</span>
                </div>

                <div className="flex-1 space-y-1 text-left w-full">
                  <div className="flex items-center justify-between gap-1.5 font-sans">
                    <span className="text-[9px] font-mono text-teal-400 font-extrabold uppercase bg-teal-950/80 border border-teal-900/60 px-1.5 py-0.5 rounded flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 animate-pulse text-teal-400" />
                      VOLUNTEER RESPONDER COHORT
                    </span>
                    <span className={`text-[8.5px] font-mono font-bold border px-1.5 py-0.5 rounded uppercase leading-none ${
                      selectedCluster.densityLevel === 'High' 
                        ? 'bg-green-950 text-green-400 border-green-905' 
                        : selectedCluster.densityLevel === 'Medium'
                        ? 'bg-teal-950 text-teal-400 border-teal-905' 
                        : 'bg-yellow-950 text-yellow-450 border-yellow-905'
                    }`}>
                      CAPACITY: {selectedCluster.densityLevel}
                    </span>
                  </div>

                  <h3 className="text-white text-xs font-bold font-sans tracking-tight leading-relaxed">
                    Active Area encompasses {selectedCluster.incidents.length} related incidents around ({selectedCluster.lat.toFixed(4)}°N, {selectedCluster.lng.toFixed(4)}°E)
                  </h3>
                  
                  <div className="text-[10px] text-gray-400 font-sans leading-tight">
                    <span className="text-gray-300 font-bold">Surrounding Incidents:</span>{' '}
                    <span className="text-blue-400 font-bold">
                      {selectedCluster.incidents.map((i: any) => `${i.id} (${i.type})`).join(', ')}
                    </span>
                    <span className="mx-2 text-gray-600">|</span>
                    <span className="text-gray-300 font-bold">Mobilized nearby:</span>{' '}
                    <span className="text-green-400 font-bold">
                      {selectedCluster.volunteers.map((v: any) => v.name).join(', ') || 'No registered responders in direct radius'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-1.5 w-full md:w-auto shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 md:border-l border-gray-850 pl-0 md:pl-4">
                  <button
                    onClick={() => {
                      triggerNotification(`Beacon sent to ${selectedCluster.densityValue} cluster volunteers in ${selectedCluster.incidents.length} incident areas!`);
                    }}
                    className="w-full py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-[10px] font-mono font-black text-white rounded transition leading-none text-center block"
                  >
                    DISPATCH COHORT
                  </button>
                  <button
                    onClick={() => setSelectedCluster(null)}
                    className="w-full py-1.5 px-3 bg-gray-950 border border-gray-800 hover:text-white text-[10px] font-mono text-gray-400 rounded transition leading-none"
                  >
                    DE-SECTOR
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR: AI PREDICTIVE HOTSPOTS & SENSORS (3 columns) */}
      <div className="xl:col-span-3 flex flex-col justify-between spacing-y-4 bg-card border border-gray-805 rounded-lg p-4 h-auto xl:h-full overflow-y-auto glow-blue text-left">
        <div className="space-y-4">
          
          {/* AI Hotspots header */}
          <div className="border-b border-gray-800 pb-2">
            <h3 className="text-xs font-black text-red-500 font-mono flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="h-4 w-4 animate-pulse" />
              AI PREDICTIVE ANALYTICS
            </h3>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">LOW-LYING & DEBRIS CASCADES OVERLAYS</p>
          </div>

          {/* Core Hotspot selection detail details */}
          <AnimatePresence mode="wait">
            {selectedHotspot ? (
              <motion.div 
                key={selectedHotspot.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-gray-950 border border-red-500/35 rounded-lg space-y-2.5 relative"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">PULSATING RISK SPOT</span>
                  <button 
                    onClick={() => setSelectedHotspot(null)}
                    className="text-[9px] text-gray-500 hover:text-white"
                  >
                    CLEAR
                  </button>
                </div>

                <div>
                  <h4 className="text-xs text-white font-bold flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    {selectedHotspot.name}
                  </h4>
                  <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase">THR THREAT: <span className="text-red-400 font-bold">{selectedHotspot.type}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[9px] bg-gray-900/60 p-2 rounded border border-gray-850">
                  <div>
                    <span className="text-gray-500">RISK INDEX:</span>
                    <strong className="text-red-400 font-extrabold block text-xs mt-0.5">{selectedHotspot.riskScore}%</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">ESCALATION:</span>
                    <strong className="text-yellow-400 font-extrabold block text-xs mt-0.5">{selectedHotspot.escalationProbability}%</strong>
                  </div>
                </div>

                <div>
                  <span className="text-[8px] font-mono font-bold text-gray-500 uppercase tracking-widest block mb-1">METEOROLOGICAL TRIGGERS</span>
                  <ul className="space-y-1 text-[9px] font-mono">
                    {selectedHotspot.triggerFactors.map((f, i) => (
                      <li key={i} className="text-gray-350 flex items-start gap-1 leading-snug">
                        <span className="text-red-500">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="p-3 bg-[#111927]/60 border border-gray-850 rounded-lg text-center font-mono py-6">
                <TrendingUp className="h-5 w-5 text-gray-600 mx-auto animate-pulse" />
                <p className="text-[9.5px] text-gray-400 leading-normal mt-2.5">
                  Select any active <strong className="text-red-400 font-extrabold uppercase">Predictive Hotspot ⚠️</strong> on map for real-time risk assessments.
                </p>
              </div>
            )}
          </AnimatePresence>

          {/* Real-time Hardware Metrologies sensors */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1 flex items-center justify-between">
              <span>REAL-TIME SENSOR NETWORK</span>
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>

            <div className="space-y-2 max-h-[140px] xl:max-h-[220px] overflow-y-auto">
              {sensors.map((sen) => (
                <div key={sen.id} className="p-2.5 rounded bg-gray-950 border border-gray-850 font-mono text-[9.5px]">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-white font-extrabold text-[10px] flex items-center gap-1.5">
                      <Cpu className={`h-3.5 w-3.5 shrink-0 ${sen.status === 'Critical' ? 'text-red-400 animate-pulse' : 'text-blue-400'}`} />
                      {sen.name}
                    </span>
                    <span className={`px-1 rounded text-[7.5px] font-bold ${
                      sen.status === 'Critical' ? 'bg-red-955 text-red-500 border border-red-900 animate-pulse' : sen.status === 'Elevated' ? 'bg-yellow-950 text-yellow-500 border border-yellow-904' : 'bg-green-950 text-green-400 border border-green-904'
                    }`}>
                      {sen.status}
                    </span>
                  </div>

                  <div className="mt-1 flex justify-between text-[8.5px] text-gray-500">
                    <span>SECTOR: <strong className="text-gray-400">{sen.sector}</strong></span>
                    <span>TYPE: <span className="text-gray-500">{sen.type.substring(0,10)}</span></span>
                  </div>

                  <div className="mt-1.5 bg-[#0b1220] px-2 py-0.5 border border-gray-900 rounded text-center text-blue-400 font-black">
                    VAL: {sen.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Tactical Sentry Footer summary details */}
        <div className="border-t border-gray-850 pt-2 text-center font-mono text-[9px] text-gray-500 uppercase">
          ALGORITHMIC SATELLITE SCAN OVERLAYS : ALIGNED
        </div>
      </div>

    </div>
  );
}
