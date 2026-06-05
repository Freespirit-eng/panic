import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers, MapPin, X, Plus, Users, AlertTriangle,
  Crosshair, Navigation, Loader2, Shield
} from 'lucide-react';
import { commanderApi } from '../services/commanderApi';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../hooks/useToast';
import { Incident, Volunteer, Geofence, SeverityLevel } from '../../shared/types';

// ── Google Maps types (minimal declarations so TS is happy) ──────────────────

declare global {
  interface Window {
    google: typeof google;
    initPanicSenseMap: () => void;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

function severityColor(s: SeverityLevel): string {
  return s === 'Critical' ? '#ef4444'
    : s === 'High' ? '#f97316'
    : s === 'Medium' ? '#eab308'
    : '#22c55e';
}

function volunteerColor(s: string): string {
  return s === 'Available' ? '#22c55e'
    : s === 'On Mission' ? '#f97316'
    : '#6b7280';
}

function geofenceStroke(s: string): string {
  return s === 'Breached' ? '#ef4444'
    : s === 'Monitoring' ? '#eab308'
    : '#22c55e';
}

// ── Dark night map style for Google Maps ─────────────────────────────────────

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0a0f1e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0f1e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1a2640' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#2d3748' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0d1525' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#3a4a6b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0a1a12' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#1a3a2a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2440' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f1830' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#3a5080' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3060' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#122040' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#4a70a0' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0d1525' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#2d4060' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#060e1a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1a304a' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#060e1a' }] },
];

// ── Popup Card ────────────────────────────────────────────────────────────────

interface PopupInfo {
  type: 'incident' | 'volunteer' | 'geofence' | 'user';
  data: Incident | Volunteer | Geofence | { lat: number; lng: number; accuracy: number };
}

function InfoPanel({ popup, onClose }: { popup: PopupInfo; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        key="popup"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="absolute top-4 right-4 w-64 bg-[#0d1525]/95 backdrop-blur border border-gray-700 rounded-xl shadow-2xl p-4 z-20"
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-300 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>

        {popup.type === 'incident' && (() => {
          const inc = popup.data as Incident;
          const color = severityColor(inc.severity);
          return (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                <span className="text-xs font-mono font-bold" style={{ color }}>{inc.severity.toUpperCase()}</span>
              </div>
              <p className="text-sm font-bold text-white">{inc.type}</p>
              <p className="text-xs text-gray-400 font-mono">{inc.location.address}</p>
              <div className="border-t border-gray-800 pt-2 grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div>
                  <span className="text-gray-600">PEOPLE</span>
                  <p className="text-white font-bold">{inc.peopleDetected}</p>
                </div>
                <div>
                  <span className="text-gray-600">PRIORITY</span>
                  <p className="font-bold" style={{ color }}>{inc.priorityScore}/100</p>
                </div>
              </div>
              {inc.recommendedAction && (
                <p className="text-[10px] text-gray-500 font-mono border-t border-gray-800 pt-2">{inc.recommendedAction}</p>
              )}
            </div>
          );
        })()}

        {popup.type === 'volunteer' && (() => {
          const v = popup.data as Volunteer;
          const color = volunteerColor(v.status);
          return (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                <span className="text-xs font-mono font-bold" style={{ color }}>{v.status.toUpperCase()}</span>
              </div>
              <p className="text-sm font-bold text-white">{v.name}</p>
              <div className="flex flex-wrap gap-1">
                {v.skills.slice(0, 4).map(s => (
                  <span key={s} className="text-[10px] bg-gray-800 border border-gray-700 text-gray-400 px-1.5 py-0.5 rounded font-mono">{s}</span>
                ))}
              </div>
            </div>
          );
        })()}

        {popup.type === 'geofence' && (() => {
          const g = popup.data as Geofence;
          const color = geofenceStroke(g.status);
          return (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full border" style={{ borderColor: color }} />
                <span className="text-xs font-mono font-bold" style={{ color }}>{g.status.toUpperCase()}</span>
              </div>
              <p className="text-sm font-bold text-white">{g.name}</p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-gray-800 pt-2">
                <div>
                  <span className="text-gray-600">RADIUS</span>
                  <p className="text-white font-bold">{g.radiusKm} km</p>
                </div>
                <div>
                  <span className="text-gray-600">FILTER</span>
                  <p className="text-white font-bold">{g.severityLimit}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {popup.type === 'user' && (() => {
          const u = popup.data as { lat: number; lng: number; accuracy: number };
          return (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-mono font-bold text-blue-400">YOUR LOCATION</span>
              </div>
              <div className="grid grid-cols-1 gap-1 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-600">LAT</span>
                  <span className="text-white font-bold">{u.lat.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">LNG</span>
                  <span className="text-white font-bold">{u.lng.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ACCURACY</span>
                  <span className="text-green-400 font-bold">±{Math.round(u.accuracy)}m</span>
                </div>
              </div>
            </div>
          );
        })()}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GisMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const userCircleRef = useRef<google.maps.Circle | null>(null);
  const drawCircleRef = useRef<google.maps.Circle | null>(null);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState({ incidents: true, volunteers: true, geofences: true });
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [pendingCenter, setPendingCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [newZone, setNewZone] = useState({ name: '', radiusKm: 1, severityLimit: 'All' as Geofence['severityLimit'] });
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');

  const { addToast } = useToast();

  // ── Load Google Maps script ──────────────────────────────────────────────────
  useEffect(() => {
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) return;

    window.initPanicSenseMap = () => setMapLoaded(true);

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initPanicSenseMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // ── Get user live location ────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationError(null);
      },
      err => setLocationError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // ── Initialize map once script is loaded ─────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const defaultCenter = userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : { lat: 37.7749, lng: -122.4194 }; // SF fallback

    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 14,
      mapTypeId: mapType,
      styles: DARK_MAP_STYLES,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER,
      },
    });

    mapInstanceRef.current = map;

    // Click handler for draw mode
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setPendingCenter({ lat, lng });

      // Show preview circle
      if (drawCircleRef.current) drawCircleRef.current.setMap(null);
      drawCircleRef.current = new window.google.maps.Circle({
        map,
        center: { lat, lng },
        radius: 1000,
        strokeColor: '#facc15',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: '#facc15',
        fillOpacity: 0.08,
      });
    });
  }, [mapLoaded]);

  // ── Update map type ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setMapTypeId(mapType);
    if (mapType === 'roadmap') {
      mapInstanceRef.current.setOptions({ styles: DARK_MAP_STYLES });
    } else {
      mapInstanceRef.current.setOptions({ styles: [] });
    }
  }, [mapType]);

  // ── Update draw circle radius ─────────────────────────────────────────────────
  useEffect(() => {
    if (drawCircleRef.current) {
      drawCircleRef.current.setRadius(newZone.radiusKm * 1000);
    }
  }, [newZone.radiusKm]);

  // ── User location marker ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !userLocation) return;
    const map = mapInstanceRef.current;

    // Remove old marker / circle
    userMarkerRef.current?.setMap(null);
    userCircleRef.current?.setMap(null);

    // Accuracy ring
    userCircleRef.current = new window.google.maps.Circle({
      map,
      center: { lat: userLocation.lat, lng: userLocation.lng },
      radius: userLocation.accuracy,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.4,
      strokeWeight: 1,
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
    });

    // Blue pulsing dot
    userMarkerRef.current = new window.google.maps.Marker({
      map,
      position: { lat: userLocation.lat, lng: userLocation.lng },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: 'Your Location',
      zIndex: 999,
    });

    userMarkerRef.current.addListener('click', () => {
      setPopup({ type: 'user', data: userLocation });
    });
  }, [mapLoaded, userLocation]);

  // ── Load backend data ─────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      commanderApi.getIncidents().catch(() => [] as Incident[]),
      commanderApi.getVolunteers().catch(() => [] as Volunteer[]),
      commanderApi.getGeofences().catch(() => [] as Geofence[]),
    ]).then(([inc, vol, geo]) => {
      setIncidents(inc);
      setVolunteers(vol);
      setGeofences(geo);
      setLoading(false);
    });
  }, []);

  // ── Place markers whenever data or map changes ────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old markers/circles
    markersRef.current.forEach(m => m.setMap(null));
    circlesRef.current.forEach(c => c.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    // Geofence circles
    if (layers.geofences) {
      geofences.forEach(g => {
        const color = geofenceStroke(g.status);
        const circle = new window.google.maps.Circle({
          map,
          center: { lat: g.location.lat, lng: g.location.lng },
          radius: g.radiusKm * 1000,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 1.5,
          fillColor: color,
          fillOpacity: 0.07,
          strokePattern: g.status === 'Monitoring' ? [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 }, offset: '0', repeat: '20px' }] as unknown as google.maps.IconSequence[] : [],
        });
        circle.addListener('click', () => setPopup({ type: 'geofence', data: g }));
        circlesRef.current.push(circle);

        // Zone label marker
        const labelMarker = new window.google.maps.Marker({
          map,
          position: { lat: g.location.lat, lng: g.location.lng },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 0,
          },
          label: {
            text: g.name,
            color: color,
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
          },
          zIndex: 1,
        });
        labelMarker.addListener('click', () => setPopup({ type: 'geofence', data: g }));
        markersRef.current.push(labelMarker);
      });
    }

    // Volunteer markers
    if (layers.volunteers) {
      volunteers.forEach(v => {
        const color = volunteerColor(v.status);
        const marker = new window.google.maps.Marker({
          map,
          position: { lat: v.location.lat, lng: v.location.lng },
          icon: {
            path: 'M 0,-10 -7,5 7,5 Z', // triangle
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: '#0a0f1e',
            strokeWeight: 1.5,
            scale: 1.2,
          },
          title: v.name,
          zIndex: 5,
        });
        marker.addListener('click', () => setPopup({ type: 'volunteer', data: v }));
        markersRef.current.push(marker);
      });
    }

    // Incident markers
    if (layers.incidents) {
      incidents.forEach(inc => {
        const color = severityColor(inc.severity);
        const marker = new window.google.maps.Marker({
          map,
          position: { lat: inc.location.lat, lng: inc.location.lng },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: '#0a0f1e',
            strokeWeight: 2,
          },
          title: inc.type,
          zIndex: 10,
          animation: inc.severity === 'Critical' ? window.google.maps.Animation.BOUNCE : undefined,
        });
        marker.addListener('click', () => setPopup({ type: 'incident', data: inc }));
        markersRef.current.push(marker);
      });
    }
  }, [mapLoaded, incidents, volunteers, geofences, layers]);

  // ── Socket real-time updates ──────────────────────────────────────────────────
  const handleIncidentCreated = useCallback((data: unknown) => {
    setIncidents(prev => [data as Incident, ...prev]);
    addToast('critical', 'New Incident on Map', (data as Incident).location.address);
  }, [addToast]);

  const handleVolunteerRegistered = useCallback((data: unknown) => {
    setVolunteers(prev => {
      const v = data as Volunteer;
      return prev.find(x => x.id === v.id) ? prev.map(x => x.id === v.id ? v : x) : [v, ...prev];
    });
  }, []);

  const handleGeofenceBreached = useCallback((data: unknown) => {
    const { geofenceId } = data as { geofenceId: string };
    setGeofences(prev => prev.map(g => g.id === geofenceId ? { ...g, status: 'Breached' } : g));
    addToast('geofence', 'Geofence Breached', `Zone ${geofenceId.slice(0, 8)} breached`);
  }, [addToast]);

  useSocket(['incidents_feed', 'resource_positions', 'geofence_alerts'], {
    incident_created: handleIncidentCreated,
    volunteer_registered: handleVolunteerRegistered,
    geofence_breached: handleGeofenceBreached,
  });

  // ── Center on user location ───────────────────────────────────────────────────
  function centerOnUser() {
    if (!userLocation || !mapInstanceRef.current) return;
    mapInstanceRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    mapInstanceRef.current.setZoom(15);
  }

  // ── Create geofence ───────────────────────────────────────────────────────────
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
      drawCircleRef.current?.setMap(null);
      setNewZone({ name: '', radiusKm: 1, severityLimit: 'All' });
    } catch {
      addToast('info', 'Error', 'Could not create geofence');
    }
  }

  // ── Toggle draw mode ──────────────────────────────────────────────────────────
  function toggleDraw() {
    setDrawMode(d => {
      if (d) {
        setPendingCenter(null);
        drawCircleRef.current?.setMap(null);
      }
      return !d;
    });
  }

  const toggleLayer = (k: keyof typeof layers) =>
    setLayers(prev => ({ ...prev, [k]: !prev[k] }));

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white font-mono tracking-wide">INTELLIGENCE MAP</h1>
          <p className="text-xs text-gray-500 font-mono">
            {incidents.length} incidents · {volunteers.length} volunteers · {geofences.length} zones
            {userLocation && (
              <span className="text-blue-400 ml-2">
                · 📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Map type selector */}
          {(['roadmap', 'satellite', 'hybrid'] as const).map(t => (
            <button key={t}
              onClick={() => setMapType(t)}
              className={`text-[10px] font-mono font-bold px-2.5 py-1.5 rounded border transition-colors
                ${mapType === t ? 'bg-blue-950 border-blue-700 text-blue-300' : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}
            >
              {t.toUpperCase()}
            </button>
          ))}
          {/* Center on me */}
          <button
            onClick={centerOnUser}
            disabled={!userLocation}
            title="Center on my location"
            className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border transition-colors
              ${userLocation ? 'border-blue-700 text-blue-400 hover:bg-blue-950/40' : 'border-gray-700 text-gray-600 cursor-not-allowed'}`}
          >
            <Navigation className="w-3.5 h-3.5" />
            LOCATE ME
          </button>
          {/* Draw zone */}
          <button
            onClick={toggleDraw}
            className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border transition-colors
              ${drawMode ? 'bg-yellow-950 border-yellow-700 text-yellow-400' : 'border-gray-700 text-gray-400 hover:border-yellow-700 hover:text-yellow-400'}`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            {drawMode ? 'DRAWING' : 'DRAW ZONE'}
          </button>
        </div>
      </div>

      {/* Location error banner */}
      {locationError && (
        <div className="bg-red-950/40 border border-red-800 rounded-lg px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-400 font-mono">Location access denied: {locationError}</p>
        </div>
      )}

      {/* Draw mode banner */}
      {drawMode && (
        <div className="bg-yellow-950/40 border border-yellow-800 rounded-lg px-4 py-2">
          <p className="text-xs font-mono text-yellow-400">
            {pendingCenter
              ? `📍 Center pinned at ${pendingCenter.lat.toFixed(4)}, ${pendingCenter.lng.toFixed(4)} — Configure zone below and confirm`
              : 'Click anywhere on the map to set the geofence center point'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map container */}
        <div className="lg:col-span-3 relative rounded-xl overflow-hidden border border-gray-800" style={{ height: 560 }}>
          {/* Layer toggles overlay */}
          <div className="absolute top-3 left-3 z-10 flex gap-1.5">
            {(['incidents', 'volunteers', 'geofences'] as const).map(k => (
              <button
                key={k}
                onClick={() => toggleLayer(k)}
                className={`text-[10px] font-mono font-bold px-2.5 py-1.5 rounded border backdrop-blur-sm transition-colors
                  ${layers[k] ? 'bg-blue-950/80 border-blue-700 text-blue-300' : 'bg-gray-900/80 border-gray-700 text-gray-500'}`}
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Loading overlay */}
          {(!mapLoaded || loading) && (
            <div className="absolute inset-0 bg-[#0a0f1e] flex flex-col items-center justify-center z-20 gap-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-xs font-mono text-gray-500 animate-pulse">
                {!mapLoaded ? 'LOADING GOOGLE MAPS...' : 'FETCHING FIELD DATA...'}
              </p>
            </div>
          )}

          {/* Google Maps div */}
          <div ref={mapRef} className="w-full h-full" />

          {/* Info popup overlay */}
          {popup && (
            <InfoPanel popup={popup} onClose={() => setPopup(null)} />
          )}

          {/* Live location badge */}
          {userLocation && (
            <div className="absolute bottom-3 left-3 z-10 bg-[#0d1525]/90 backdrop-blur border border-blue-900/50 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_6px_#3b82f6]" />
              <span className="text-[10px] font-mono text-blue-400 font-bold">LIVE LOCATION ACTIVE</span>
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
              {(['Critical', 'High', 'Medium', 'Low'] as SeverityLevel[]).map(s => (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColor(s), boxShadow: `0 0 4px ${severityColor(s)}80` }} />
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
              <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">You</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" style={{ boxShadow: '0 0 4px #3b82f680' }} />
                <span className="text-gray-400">Your Position</span>
              </div>
              <div className="border-t border-gray-800 my-2" />
              <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">Geofences</p>
              {['Normal', 'Monitoring', 'Breached'].map(s => {
                const color = geofenceStroke(s);
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border" style={{ borderColor: color }} />
                    <span className="text-gray-400">{s}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Geofence create form */}
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
                  onClick={() => { setDrawMode(false); setPendingCenter(null); drawCircleRef.current?.setMap(null); }}
                  className="px-3 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Zone summary */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-mono font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              ZONE SUMMARY
            </h3>
            {geofences.length === 0 && (
              <p className="text-gray-600 text-xs font-mono">No geofences defined</p>
            )}
            {geofences.map(g => {
              const color = geofenceStroke(g.status);
              return (
                <div key={g.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 truncate mr-2">{g.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0"
                    style={{ color, borderColor: color + '44' }}>
                    {g.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active incidents quick list */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-mono font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              ACTIVE INCIDENTS
            </h3>
            {incidents.length === 0 && (
              <p className="text-gray-600 text-xs font-mono">No incidents</p>
            )}
            {incidents.slice(0, 5).map(inc => {
              const color = severityColor(inc.severity);
              return (
                <div key={inc.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/40 rounded px-1 py-0.5 transition-colors"
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.panTo({ lat: inc.location.lat, lng: inc.location.lng });
                      mapInstanceRef.current.setZoom(15);
                    }
                    setPopup({ type: 'incident', data: inc });
                  }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-400 truncate">{inc.type}</span>
                  <span className="ml-auto text-[10px] font-mono shrink-0" style={{ color }}>{inc.severity}</span>
                </div>
              );
            })}
            {incidents.length > 5 && (
              <p className="text-[10px] text-gray-600 font-mono text-center">+{incidents.length - 5} more</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
