import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers, ZoomIn, ZoomOut, MapPin, X,
  Plus, Users, Shield, AlertTriangle, Crosshair, Sliders
} from 'lucide-react';
import { commanderApi } from '../services/commanderApi';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../hooks/useToast';
import { Incident, Volunteer, Geofence, SeverityLevel } from '../../shared/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Bounds {
  minLat: number; maxLat: number;
  minLng: number; maxLng: number;
}

interface PopupData {
  type: 'incident' | 'volunteer' | 'geofence';
  x: number;
  y: number;
  data: Incident | Volunteer | Geofence;
}

// ── Coordinate Projection ─────────────────────────────────────────────────────

function projectCoord(
  lat: number, lng: number,
  bounds: Bounds,
  w: number, h: number,
  padding = 40,
) {
  const rangeW = w - padding * 2;
  const rangeH = h - padding * 2;
  const x = padding + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * rangeW;
  const y = padding + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat || 1)) * rangeH;
  return { x, y };
}

function computeBounds(
  incidents: Incident[], volunteers: Volunteer[], geofences: Geofence[],
): Bounds {
  const lats: number[] = [];
  const lngs: number[] = [];

  [...incidents, ...volunteers, ...geofences].forEach(item => {
    const loc = (item as Incident | Volunteer | Geofence).location;
    if (loc) { lats.push(loc.lat); lngs.push(loc.lng); }
  });

  if (lats.length === 0) {
    return { minLat: 37.6, maxLat: 37.8, minLng: -122.5, maxLng: -122.3 };
  }

  const pad = 0.01;
  return {
    minLat: Math.min(...lats) - pad,
    maxLat: Math.max(...lats) + pad,
    minLng: Math.min(...lngs) - pad,
    maxLng: Math.max(...lngs) + pad,
  };
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function severityColor(s: SeverityLevel) {
  return s === 'Critical' ? '#ef4444' : s === 'High' ? '#f97316' : s === 'Medium' ? '#eab308' : '#22c55e';
}

function volunteerColor(s: string) {
  return s === 'Available' ? '#22c55e' : s === 'On Mission' ? '#f97316' : '#6b7280';
}

function geofenceStyle(s: string) {
  return s === 'Breached'
    ? { stroke: '#ef4444', fill: 'rgba(239,68,68,0.12)' }
    : s === 'Monitoring'
    ? { stroke: '#eab308', fill: 'rgba(234,179,8,0.08)' }
    : { stroke: '#22c55e', fill: 'rgba(34,197,94,0.06)' };
}

// ── Popup Card ────────────────────────────────────────────────────────────────

function MapPopup({ popup, onClose }: { popup: PopupData; onClose: () => void }) {
  const CARD_W = 240;
  const clampedX = Math.min(popup.x, 900 - CARD_W);
  const clampedY = Math.max(popup.y - 10, 10);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ position: 'absolute', left: clampedX, top: clampedY, width: CARD_W, zIndex: 20 }}
      className="bg-[#0d1525] border border-gray-700 rounded-xl shadow-2xl p-3 pointer-events-auto"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-600 hover:text-gray-300"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {popup.type === 'incident' && (() => {
        const inc = popup.data as Incident;
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: severityColor(inc.severity) + '22', color: severityColor(inc.severity), border: `1px solid ${severityColor(inc.severity)}44` }}>
                {inc.severity}
              </span>
              <span className="text-xs font-bold text-white">{inc.type}</span>
            </div>
            <p className="text-xs text-gray-400">{inc.location.address}</p>
            <div className="flex gap-3 text-[10px] text-gray-500 font-mono items-center">
              <span className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-600" /> {inc.peopleDetected}</span>
              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-600" /> {inc.priorityScore}/100</span>
            </div>
            <p className="text-[10px] text-gray-500 truncate">{inc.recommendedAction}</p>
          </div>
        );
      })()}

      {popup.type === 'volunteer' && (() => {
        const v = popup.data as Volunteer;
        return (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-white">{v.name}</p>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded inline-block"
              style={{ backgroundColor: volunteerColor(v.status) + '22', color: volunteerColor(v.status) }}>
              {v.status}
            </span>
            <div className="flex flex-wrap gap-1">
              {v.skills.slice(0, 3).map(s => (
                <span key={s} className="text-[10px] bg-gray-800 border border-gray-700 text-gray-400 px-1.5 py-0.5 rounded font-mono">{s}</span>
              ))}
            </div>
          </div>
        );
      })()}

      {popup.type === 'geofence' && (() => {
        const g = popup.data as Geofence;
        const style = geofenceStyle(g.status);
        return (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-white">{g.name}</p>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded inline-block border"
              style={{ color: style.stroke, borderColor: style.stroke + '44', backgroundColor: style.fill }}>
              {g.status}
            </span>
            <div className="text-[10px] text-gray-500 font-mono space-y-0.5">
              <div>Radius: {g.radiusKm} km</div>
              <div>Severity Filter: {g.severityLimit}</div>
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
}

// ── Main GIS Map Page ─────────────────────────────────────────────────────────

export default function GisMapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [layers, setLayers] = useState({ incidents: true, volunteers: true, geofences: true });
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [pendingCenter, setPendingCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [newZone, setNewZone] = useState({ name: '', radiusKm: 1, severityLimit: 'All' as Geofence['severityLimit'] });
  const svgRef = useRef<SVGSVGElement>(null);
  const { addToast } = useToast();

  const SVG_W = 900;
  const SVG_H = 520;

  const bounds = computeBounds(incidents, volunteers, geofences);

  // Load data
  useEffect(() => {
    Promise.all([
      commanderApi.getIncidents().catch(() => []),
      commanderApi.getVolunteers().catch(() => []),
      commanderApi.getGeofences().catch(() => []),
    ]).then(([inc, vol, geo]) => {
      setIncidents(inc);
      setVolunteers(vol);
      setGeofences(geo);
      setLoading(false);
    });
  }, []);

  // Socket updates
  const handleIncidentCreated = useCallback((data: unknown) => {
    setIncidents(prev => [data as Incident, ...prev]);
    addToast('critical', 'New Incident on Map', (data as Incident).location.address);
  }, [addToast]);

  const handleVolunteerRegistered = useCallback((data: unknown) => {
    setVolunteers(prev => {
      const v = data as Volunteer;
      const exists = prev.find(x => x.id === v.id);
      return exists ? prev.map(x => x.id === v.id ? v : x) : [v, ...prev];
    });
  }, []);

  const handleGeofenceBreached = useCallback((data: unknown) => {
    const { geofenceId } = data as { geofenceId: string };
    setGeofences(prev => prev.map(g => g.id === geofenceId ? { ...g, status: 'Breached' } : g));
    addToast('geofence', 'Geofence Breached Alert', `Zone ${geofenceId.slice(0, 8)} breached`);
  }, [addToast]);

  useSocket(
    ['incidents_feed', 'resource_positions', 'geofence_alerts'],
    {
      incident_created: handleIncidentCreated,
      volunteer_registered: handleVolunteerRegistered,
      geofence_breached: handleGeofenceBreached,
    }
  );

  // Compute geofence radius in SVG units
  function radiusToSvg(radiusKm: number): number {
    const lngPerKm = 1 / 111.32;
    const lngRange = bounds.maxLng - bounds.minLng || 0.01;
    const svgRange = SVG_W - 80;
    return (radiusKm * lngPerKm / lngRange) * svgRange;
  }

  function svgCoordsToLatLng(svgX: number, svgY: number) {
    const padding = 40;
    const rangeW = SVG_W - padding * 2;
    const rangeH = SVG_H - padding * 2;
    const lng = bounds.minLng + ((svgX - padding) / rangeW) * (bounds.maxLng - bounds.minLng);
    const lat = bounds.maxLat - ((svgY - padding) / rangeH) * (bounds.maxLat - bounds.minLat);
    return { lat, lng };
  }

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!drawMode) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const svgY = ((e.clientY - rect.top) / rect.height) * SVG_H;
    const { lat, lng } = svgCoordsToLatLng(svgX, svgY);
    setPendingCenter({ lat, lng });
  }

  async function handleCreateGeofence() {
    if (!pendingCenter || !newZone.name) return;
    try {
      const geo = await commanderApi.createGeofence({
        name: newZone.name,
        location: { ...pendingCenter, address: `${pendingCenter.lat.toFixed(4)}, ${pendingCenter.lng.toFixed(4)}` },
        radiusKm: newZone.radiusKm,
        severityLimit: newZone.severityLimit,
      });
      setGeofences(prev => [...prev, geo]);
      addToast('mission', 'Geofence Created', geo.name);
      setDrawMode(false);
      setPendingCenter(null);
      setNewZone({ name: '', radiusKm: 1, severityLimit: 'All' });
    } catch {
      addToast('info', 'Error', 'Could not create geofence');
    }
  }

  const toggleLayer = (k: keyof typeof layers) =>
    setLayers(prev => ({ ...prev, [k]: !prev[k] }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white font-mono tracking-wide">GIS TACTICAL MAP</h1>
          <p className="text-xs text-gray-500 font-mono">
            {incidents.length} incidents · {volunteers.length} volunteers · {geofences.length} zones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setDrawMode(d => !d); setPendingCenter(null); }}
            className={`flex items-center gap-2 text-xs font-mono font-bold px-3 py-2 rounded-lg border transition-colors
              ${drawMode ? 'bg-yellow-950 border-yellow-700 text-yellow-400' : 'border-gray-700 text-gray-400 hover:border-yellow-700 hover:text-yellow-400'}`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            {drawMode ? 'DRAWING ZONE' : 'DRAW ZONE'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Canvas */}
        <div className="lg:col-span-3 bg-[#0a0f1e] border border-gray-800 rounded-xl overflow-hidden relative">
          {/* Controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
            <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
              className="p-2 bg-gray-900/80 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-300">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
              className="p-2 bg-gray-900/80 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-300">
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Layer Toggles */}
          <div className="absolute top-3 left-3 z-10 flex gap-1.5">
            {(['incidents', 'volunteers', 'geofences'] as const).map(k => (
              <button
                key={k}
                onClick={() => toggleLayer(k)}
                className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded border transition-colors
                  ${layers[k] ? 'bg-blue-950 border-blue-700 text-blue-300' : 'bg-gray-900/80 border-gray-700 text-gray-500'}`}
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Draw mode hint */}
          {drawMode && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-yellow-950/90 border border-yellow-700 rounded-lg px-4 py-2">
              <p className="text-xs font-mono text-yellow-400">
                {pendingCenter ? `Center set: ${pendingCenter.lat.toFixed(4)}, ${pendingCenter.lng.toFixed(4)} — configure zone ↓` : 'Click on map to set geofence center'}
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-[520px] text-gray-600 font-mono animate-pulse">
              Loading map data...
            </div>
          ) : (
            <div className="relative overflow-hidden" style={{ height: 520 }}>
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', cursor: drawMode ? 'crosshair' : 'default', transition: 'transform 0.2s' }}
                onClick={handleSvgClick}
              >
                {/* Background grid */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a2438" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width={SVG_W} height={SVG_H} fill="url(#grid)" />

                {/* Geofence rings */}
                {layers.geofences && geofences.map(g => {
                  const { x, y } = projectCoord(g.location.lat, g.location.lng, bounds, SVG_W, SVG_H);
                  const r = radiusToSvg(g.radiusKm);
                  const style = geofenceStyle(g.status);
                  return (
                    <g key={g.id} className="cursor-pointer"
                      onClick={e => { e.stopPropagation(); setPopup({ type: 'geofence', x, y: y - r - 20, data: g }); }}>
                      <circle
                        cx={x} cy={y} r={r}
                        fill={style.fill} stroke={style.stroke} strokeWidth={1.5}
                        strokeDasharray={g.status === 'Monitoring' ? '6 3' : ''}
                        opacity={0.85}
                        className={g.status === 'Breached' ? 'animate-pulse' : ''}
                      />
                      <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                        fill={style.stroke} fontSize="9" fontFamily="monospace" fontWeight="bold" opacity={0.8}>
                        {g.name}
                      </text>
                    </g>
                  );
                })}

                {/* Pending geofence preview */}
                {pendingCenter && (() => {
                  const { x, y } = projectCoord(pendingCenter.lat, pendingCenter.lng, bounds, SVG_W, SVG_H);
                  const r = radiusToSvg(newZone.radiusKm);
                  return (
                    <circle cx={x} cy={y} r={r}
                      fill="rgba(250,204,21,0.1)" stroke="#facc15" strokeWidth={1.5}
                      strokeDasharray="6 3" className="animate-pulse" />
                  );
                })()}

                {/* Volunteer pins (triangles) */}
                {layers.volunteers && volunteers.map(v => {
                  const { x, y } = projectCoord(v.location.lat, v.location.lng, bounds, SVG_W, SVG_H);
                  const c = volunteerColor(v.status);
                  return (
                    <g key={v.id} className="cursor-pointer"
                      onClick={e => { e.stopPropagation(); setPopup({ type: 'volunteer', x, y: y - 20, data: v }); }}>
                      <polygon
                        points={`${x},${y - 8} ${x - 6},${y + 4} ${x + 6},${y + 4}`}
                        fill={c} opacity={0.8} stroke="#0a0f1e" strokeWidth={1}
                      />
                      <circle cx={x} cy={y} r={10} fill="transparent" />
                    </g>
                  );
                })}

                {/* Incident markers (pulsing circles) */}
                {layers.incidents && incidents.map(inc => {
                  const { x, y } = projectCoord(inc.location.lat, inc.location.lng, bounds, SVG_W, SVG_H);
                  const c = severityColor(inc.severity);
                  return (
                    <g key={inc.id} className="cursor-pointer"
                      onClick={e => { e.stopPropagation(); setPopup({ type: 'incident', x, y: y - 20, data: inc }); }}>
                      {inc.severity === 'Critical' && (
                        <circle cx={x} cy={y} r={14} fill={c} opacity={0.15} className="animate-ping" />
                      )}
                      <circle cx={x} cy={y} r={8} fill={c} opacity={0.85} stroke="#0a0f1e" strokeWidth={1.5} />
                      <circle cx={x} cy={y} r={3} fill="white" opacity={0.6} />
                    </g>
                  );
                })}
              </svg>

              {/* Popups overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
                <AnimatePresence>
                  {popup && (
                    <MapPopup popup={popup} onClose={() => setPopup(null)} />
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-3">
          {/* Legend */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-mono font-bold text-white mb-3 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              MAP LEGEND
            </h3>
            <div className="space-y-2 text-xs">
              <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">Incidents</p>
              {['Critical', 'High', 'Medium', 'Low'].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-gray-900"
                    style={{ backgroundColor: severityColor(s as SeverityLevel) }} />
                  <span className="text-gray-400">{s}</span>
                </div>
              ))}
              <div className="border-t border-gray-800 my-2" />
              <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">Volunteers</p>
              {['Available', 'On Mission', 'Offline'].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-transparent"
                    style={{ borderBottomColor: volunteerColor(s) }} />
                  <span className="text-gray-400">{s}</span>
                </div>
              ))}
              <div className="border-t border-gray-800 my-2" />
              <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">Geofences</p>
              {['Normal', 'Monitoring', 'Breached'].map(s => {
                const style = geofenceStyle(s);
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border"
                      style={{ borderColor: style.stroke, backgroundColor: style.fill }} />
                    <span className="text-gray-400">{s}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Geofence Create */}
          {drawMode && pendingCenter && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111827] border border-yellow-900/50 rounded-xl p-4 space-y-3"
            >
              <h3 className="text-xs font-mono font-bold text-yellow-400 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" />
                NEW GEOFENCE
              </h3>
              <div>
                <label className="text-[10px] text-gray-500 font-mono block mb-1">Zone Name</label>
                <input
                  value={newZone.name}
                  onChange={e => setNewZone(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Zone Alpha"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-mono block mb-1">
                  Radius: {newZone.radiusKm} km
                </label>
                <input
                  type="range" min={0.1} max={10} step={0.1}
                  value={newZone.radiusKm}
                  onChange={e => setNewZone(p => ({ ...p, radiusKm: parseFloat(e.target.value) }))}
                  className="w-full accent-yellow-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-mono block mb-1">Severity Filter</label>
                <select
                  value={newZone.severityLimit}
                  onChange={e => setNewZone(p => ({ ...p, severityLimit: e.target.value as Geofence['severityLimit'] }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  {['All', 'Critical', 'High', 'Medium', 'Low'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateGeofence}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-mono font-bold py-1.5 rounded transition-colors"
                >
                  CONFIRM
                </button>
                <button
                  onClick={() => { setDrawMode(false); setPendingCenter(null); }}
                  className="px-3 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Quick Stats */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-mono font-bold text-white mb-2">ZONE SUMMARY</h3>
            {geofences.map(g => {
              const style = geofenceStyle(g.status);
              return (
                <div key={g.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 truncate mr-2">{g.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0"
                    style={{ color: style.stroke, borderColor: style.stroke + '44' }}>
                    {g.status}
                  </span>
                </div>
              );
            })}
            {geofences.length === 0 && (
              <p className="text-gray-600 text-xs font-mono">No geofences defined</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
