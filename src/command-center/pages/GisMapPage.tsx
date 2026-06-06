/**
 * GisMapPage — Leaflet + OpenStreetMap (CartoDB Dark Matter)
 * Weather overlay via OpenWeatherMap tile API
 * Replaces the previous Google Maps implementation.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers, MapPin, X, Plus, Users, AlertTriangle,
  Loader2, Shield, Cloud, Thermometer, Wind, Droplets,
  RefreshCw, Crosshair
} from 'lucide-react';
import { commanderApi } from '../services/commanderApi';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../hooks/useToast';
import { Incident, Volunteer, Geofence, SeverityLevel } from '../../shared/types';

// Leaflet CSS
import 'leaflet/dist/leaflet.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const OWM_KEY      = import.meta.env.VITE_OWM_API_KEY as string;
const BENGALURU    = { lat: 12.9716, lng: 77.5946 } as const;
const CARTO_DARK   = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const CARTO_ATTR   = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>';

const OWM_LAYERS = [
  { id: 'precipitation_new', label: '🌧 Rain',        color: '#3b82f6' },
  { id: 'clouds_new',        label: '☁ Clouds',       color: '#94a3b8' },
  { id: 'temp_new',          label: '🌡 Temperature',  color: '#f97316' },
  { id: 'wind_new',          label: '💨 Wind',         color: '#22c55e' },
] as const;

// ── Colour helpers ────────────────────────────────────────────────────────────

function severityColor(s: SeverityLevel) {
  return s === 'Critical' ? '#ef4444'
    : s === 'High'   ? '#f97316'
    : s === 'Medium' ? '#eab308'
    : '#22c55e';
}

function volunteerColor(s: string) {
  return s === 'Available'  ? '#22c55e'
    : s === 'On Mission' ? '#f97316'
    : '#6b7280';
}

function geofenceStroke(s: string) {
  return s === 'Breached'   ? '#ef4444'
    : s === 'Monitoring' ? '#eab308'
    : '#22c55e';
}

// ── Haversine Distance helper for Tip/Legend ──────────────────────────────────
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Recenter helper (inner component to access map context) ───────────────────

function RecenterButton({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView(center, 12)}
      className="absolute bottom-20 right-4 z-[1000] bg-[#1a2540] border border-gray-700 text-gray-300
                 hover:text-white p-2 rounded-lg shadow-lg transition-colors cursor-pointer"
      title="Reset to Bengaluru"
    >
      <Crosshair className="w-4 h-4" />
    </button>
  );
}

// ── Weather panel ─────────────────────────────────────────────────────────────

interface WeatherData {
  temp: number;
  feels: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

function WeatherPanel({ data, loading }: { data: WeatherData | null; loading: boolean }) {
  return (
    <div className="bg-[#111827]/90 border border-gray-700/60 rounded-xl p-3 backdrop-blur">
      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-bold">
        <Cloud className="w-3 h-3 text-blue-400" />
        Bengaluru Weather
      </p>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading...
        </div>
      ) : data ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white">{data.temp}°C</span>
            <div className="text-xs text-gray-400">
              <p>{data.condition}</p>
              <p>Feels {data.feels}°C</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-400 font-mono">
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-400" />{data.humidity}% humidity
            </span>
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-green-400" />{data.windSpeed} km/h
            </span>
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-gray-600 font-mono">Weather unavailable</p>
      )}
    </div>
  );
}

// ── Geofence form ─────────────────────────────────────────────────────────────

function GeofenceForm({ onSuccess, onCancel }: { onSuccess: (g: Geofence) => void; onCancel: () => void }) {
  const { addToast } = useToast();
  const [name, setName]       = useState('');
  const [lat, setLat]         = useState('12.9716');
  const [lng, setLng]         = useState('77.5946');
  const [radius, setRadius]   = useState('2');
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const geofence = await commanderApi.createGeofence({
        name,
        status: 'Monitoring',
        location: { lat: parseFloat(lat), lng: parseFloat(lng), address: name },
        radiusKm: parseFloat(radius),
      } as any);
      addToast('mission', 'Geofence Created', `Zone "${name}" is now active`);
      onSuccess(geofence);
    } catch {
      addToast('info', 'Error', 'Could not create geofence');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-[#111827] border border-gray-700 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-blue-400 font-bold uppercase">New Geofence Zone</p>
        <button type="button" onClick={onCancel} className="text-gray-600 hover:text-white cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      {[
        { label: 'Zone Name', value: name, setter: setName, placeholder: 'e.g. Bellandur Lake Area' },
        { label: 'Latitude',  value: lat,  setter: setLat,  placeholder: '12.9716' },
        { label: 'Longitude', value: lng,  setter: setLng,  placeholder: '77.5946' },
        { label: 'Radius (km)', value: radius, setter: setRadius, placeholder: '2' },
      ].map(f => (
        <div key={f.label}>
          <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">{f.label}</label>
          <input
            value={f.value}
            onChange={e => f.setter(e.target.value)}
            placeholder={f.placeholder}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white
                       placeholder-gray-600 focus:outline-none focus:border-blue-600"
            required
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500
                   disabled:opacity-50 text-white text-xs font-mono font-bold py-2 rounded-lg transition-colors cursor-pointer"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        {saving ? 'Creating...' : 'Create Zone'}
      </button>
    </motion.form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GisMapPage() {
  const [incidents,  setIncidents]  = useState<Incident[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [geofences,  setGeofences]  = useState<Geofence[]>([]);
  const [weather,    setWeather]    = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [selectedOWMLayer, setSelectedOWMLayer] = useState<string | null>(null);
  const [showGeofenceForm, setShowGeofenceForm] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const handleToggleLayer = (layerId: string) => {
    setSelectedOWMLayer(p => {
      const next = p === layerId ? null : layerId;
      if (next) {
        const lbl = OWM_LAYERS.find(l => l.id === next)?.label ?? 'Weather';
        addToast('info', 'Weather Overlay Active', `Overlaying live ${lbl} map tiles.`);
      }
      return next;
    });
  };

  // ── Data load ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [inc, vol, geo] = await Promise.all([
        commanderApi.getIncidents(),
        commanderApi.getVolunteers(),
        commanderApi.getGeofences(),
      ]);
      setIncidents(inc);
      setVolunteers(vol);
      setGeofences(geo);
    } catch {
      addToast('info', 'Error', 'Could not load map data');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Weather load ─────────────────────────────────────────────────────────────
  const loadWeather = useCallback(async () => {
    if (!OWM_KEY) return;
    setWeatherLoading(true);
    try {
      const r = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${BENGALURU.lat}&lon=${BENGALURU.lng}&appid=${OWM_KEY}&units=metric`
      );
      if (!r.ok) throw new Error(`OWM ${r.status}`);
      const d = await r.json();
      setWeather({
        temp:      Math.round(d.main.temp),
        feels:     Math.round(d.main.feels_like),
        condition: d.weather[0]?.description ?? 'Unknown',
        humidity:  d.main.humidity,
        windSpeed: Math.round(d.wind?.speed * 3.6), // m/s → km/h
        icon:      d.weather[0]?.icon ?? '01d',
      });
    } catch (err: any) {
      console.warn('[GisMap] Weather fetch failed:', err.message);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => { loadWeather(); }, [loadWeather]);

  // ── Real-time socket ─────────────────────────────────────────────────────────
  useSocket(['incidents_feed', 'resource_positions'], {
    incident_created: (d: unknown) => setIncidents(p => [d as Incident, ...p]),
    incident_updated: (d: unknown) => {
      const inc = d as Incident;
      setIncidents(p => p.map(i => i.id === inc.id ? inc : i));
    },
    volunteer_registered: (d: unknown) => {
      const vol = d as Volunteer;
      setVolunteers(p => {
        const exists = p.find(v => v.id === vol.id);
        return exists ? p.map(v => v.id === vol.id ? vol : v) : [...p, vol];
      });
    },
  });

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center text-gray-500 font-mono">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading map data...
      </div>
    );
  }

  const owmTileUrl = (layer: string) =>
    `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${OWM_KEY}`;

  return (
    <div className="flex gap-4 h-[calc(100vh-80px)]">

      {/* ── Left sidebar ─────────────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Incidents',   value: incidents.length,                          color: 'text-red-400' },
            { label: 'Volunteers',  value: volunteers.filter(v => v.status !== 'Offline').length, color: 'text-green-400' },
            { label: 'Zones',       value: geofences.length,                          color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#111827] border border-gray-800 rounded-xl p-3 text-center">
              <p className={`text-xl font-black font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 font-mono">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Weather */}
        <WeatherPanel data={weather} loading={weatherLoading} />

        {/* Weather layer toggles */}
        {OWM_KEY && (
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">Weather Overlay</p>
              {selectedOWMLayer && (
                <button onClick={() => setSelectedOWMLayer(null)} className="text-[10px] text-gray-500 hover:text-gray-300 font-mono transition cursor-pointer">
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {OWM_LAYERS.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => handleToggleLayer(layer.id)}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer
                    ${selectedOWMLayer === layer.id
                      ? 'border-blue-600 bg-blue-950 text-blue-300'
                      : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'}`}
                >
                  {layer.label}
                </button>
              ))}
            </div>

            {selectedOWMLayer && (
              <div className="pt-2 border-t border-gray-800/80 space-y-2.5 animate-fadeIn">
                {/* Visual Legend Gradients */}
                {selectedOWMLayer === 'precipitation_new' && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded bg-gradient-to-r from-blue-400/20 via-blue-500 to-indigo-900" />
                    <div className="flex justify-between text-[8px] font-mono text-gray-500">
                      <span>Light Rain</span>
                      <span>Heavy Rain</span>
                    </div>
                  </div>
                )}
                {selectedOWMLayer === 'clouds_new' && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded bg-gradient-to-r from-gray-700/20 via-gray-400 to-white" />
                    <div className="flex justify-between text-[8px] font-mono text-gray-500">
                      <span>Clear Skies</span>
                      <span>Overcast</span>
                    </div>
                  </div>
                )}
                {selectedOWMLayer === 'temp_new' && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded bg-gradient-to-r from-blue-600 via-green-400 via-yellow-400 to-red-600" />
                    <div className="flex justify-between text-[8px] font-mono text-gray-500">
                      <span>Cold (-15°C)</span>
                      <span>Mild (15°C)</span>
                      <span>Hot (40°C)</span>
                    </div>
                  </div>
                )}
                {selectedOWMLayer === 'wind_new' && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded bg-gradient-to-r from-teal-950 via-teal-400 via-yellow-500 to-pink-900" />
                    <div className="flex justify-between text-[8px] font-mono text-gray-500">
                      <span>Calm (0 m/s)</span>
                      <span>Breeze (10 m/s)</span>
                      <span>Gale (25+ m/s)</span>
                    </div>
                  </div>
                )}

                {/* Helpful Instruction Tip */}
                <div className="text-[9px] font-mono text-blue-400/70 leading-normal bg-blue-950/20 border border-blue-900/35 rounded-lg p-2">
                  ℹ️ <strong>Usage Tip:</strong> Weather layers are mapped globally. Zoom out on the map to see large regional weather systems and movements!
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-3">
          <button
            onClick={() => setShowLegend(p => !p)}
            className="w-full flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest cursor-pointer"
          >
            <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" />Legend</span>
            <span>{showLegend ? '▲' : '▼'}</span>
          </button>
          {showLegend && (
            <div className="mt-2 space-y-1.5">
              {[
                { color: '#ef4444', label: 'Critical Incident' },
                { color: '#f97316', label: 'High Incident' },
                { color: '#eab308', label: 'Medium Incident' },
                { color: '#22c55e', label: 'Low Incident / Available Vol.' },
                { color: '#6b7280', label: 'Offline Volunteer' },
                { color: '#3b82f6', label: 'Geofence Zone' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Geofence form */}
        {showGeofenceForm ? (
          <GeofenceForm
            onSuccess={(g) => { setGeofences(p => [...p, g]); setShowGeofenceForm(false); }}
            onCancel={() => setShowGeofenceForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowGeofenceForm(true)}
            className="flex items-center justify-center gap-2 bg-[#111827] border border-gray-700
                       hover:border-blue-700 text-gray-400 hover:text-blue-300 text-xs font-mono
                       font-bold py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Geofence Zone
          </button>
        )}

        {/* Refresh */}
        <button
          onClick={() => { loadData(); loadWeather(); }}
          className="flex items-center justify-center gap-2 bg-[#111827] border border-gray-700
                     hover:border-gray-500 text-gray-500 hover:text-gray-300 text-xs font-mono
                     py-2 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />Refresh
        </button>
      </div>

      {/* ── Map ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-gray-800 relative">
        <MapContainer
          center={[BENGALURU.lat, BENGALURU.lng]}
          zoom={12}
          style={{ height: '100%', width: '100%', background: '#0a0f1e' }}
          zoomControl={false}
        >
          {/* Dark base layer */}
          <TileLayer url={CARTO_DARK} attribution={CARTO_ATTR} maxZoom={19} />

          {/* OpenWeatherMap overlay */}
          {selectedOWMLayer && OWM_KEY && (
            <TileLayer
              url={owmTileUrl(selectedOWMLayer)}
              attribution="&copy; OpenWeatherMap"
              opacity={0.5}
              maxZoom={19}
            />
          )}

          {/* Geofence circles */}
          {geofences.map(g => (
            <Circle
              key={g.id}
              center={[g.location?.lat ?? BENGALURU.lat, g.location?.lng ?? BENGALURU.lng]}
              radius={(g.radiusKm ?? 2) * 1000}
              pathOptions={{
                color: geofenceStroke(g.status),
                fillColor: geofenceStroke(g.status),
                fillOpacity: 0.06,
                weight: 1.5,
                dashArray: '6 4',
              }}
            >
              <Popup>
                <div className="text-xs space-y-1 p-1">
                  <p className="font-bold text-sm">{g.name}</p>
                  <p>Status: <span style={{ color: geofenceStroke(g.status) }}>{g.status}</span></p>
                  <p>Radius: {g.radiusKm} km</p>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Incident markers */}
          {incidents.map(inc => (
            <CircleMarker
              key={inc.id}
              center={[inc.location.lat, inc.location.lng]}
              radius={inc.severity === 'Critical' ? 12 : inc.severity === 'High' ? 9 : 7}
              pathOptions={{
                color: severityColor(inc.severity),
                fillColor: severityColor(inc.severity),
                fillOpacity: 0.75,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs space-y-1 p-1 min-w-[180px]">
                  <p className="font-bold font-mono text-sm">{inc.type}</p>
                  <p className="text-gray-400 font-mono text-[10px]">{inc.id}</p>
                  <p>Severity: <span style={{ color: severityColor(inc.severity) }}>{inc.severity}</span></p>
                  <p>People: {inc.peopleDetected}</p>
                  <p className="text-gray-500 text-[10px]">{inc.location.address}</p>
                  <p className="border-t border-gray-200 pt-1 text-[10px] leading-relaxed">{inc.recommendedAction}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Volunteer markers */}
          {volunteers.map(vol => (
            <CircleMarker
              key={vol.id}
              center={[vol.location.lat, vol.location.lng]}
              radius={6}
              pathOptions={{
                color: volunteerColor(vol.status),
                fillColor: volunteerColor(vol.status),
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs space-y-1 p-1">
                  <p className="font-bold">{vol.name}</p>
                  <p>Status: <span style={{ color: volunteerColor(vol.status) }}>{vol.status}</span></p>
                  <p>Skills: {vol.skills?.join(', ') || '—'}</p>
                  <p className="text-gray-500 text-[10px]">{vol.location.address}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Recenter button (inside map context) */}
          <RecenterButton center={[BENGALURU.lat, BENGALURU.lng]} />
        </MapContainer>

        {/* Map overlay — live count badge */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5 pointer-events-none">
          {[
            { icon: <AlertTriangle className="w-3 h-3 text-red-400" />,  label: `${incidents.length} Incidents` },
            { icon: <Users className="w-3 h-3 text-green-400" />,        label: `${volunteers.filter(v => v.status === 'Available').length} Available` },
            { icon: <Shield className="w-3 h-3 text-blue-400" />,        label: `${geofences.length} Zones` },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-1.5 bg-[#0d1525]/90 border border-gray-700/60
                                          text-[10px] font-mono text-gray-300 px-2 py-1 rounded-lg backdrop-blur">
              {b.icon}{b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
