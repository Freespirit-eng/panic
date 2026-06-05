import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Camera,
  MapPin,
  Mic,
  MicOff,
  Send,
  Users,
  Baby,
  CheckCircle2,
  XCircle,
  GitMerge,
  ShieldCheck,
  Loader2,
  Upload,
  X,
  ChevronDown,
  Star,
  Zap,
  Eye,
} from 'lucide-react';
import { citizenApi, ReportSubmitRequest } from '../services/citizenApi';
import { Incident, IncidentType, SeverityLevel } from '../../shared/types';
import { useToast } from '../components/ToastProvider';

// ─── Types & Constants ─────────────────────────────────────────────────────────

const INCIDENT_TYPES: IncidentType[] = [
  'Flood',
  'Road Collapse',
  'Fire',
  'Earthquake',
  'Building Damage',
];

const SEVERITY_LEVELS: { value: SeverityLevel; label: string; color: string; bg: string }[] = [
  { value: 'Critical', label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/40' },
  { value: 'High',     label: 'HIGH',     color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/40' },
  { value: 'Medium',   label: 'MEDIUM',   color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/40' },
  { value: 'Low',      label: 'LOW',      color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/40' },
];

const severityColor = (s: SeverityLevel) => {
  const map: Record<SeverityLevel, string> = {
    Critical: 'text-red-400',
    High: 'text-orange-400',
    Medium: 'text-yellow-400',
    Low: 'text-green-400',
  };
  return map[s] ?? 'text-gray-400';
};

const severityBadge = (s: SeverityLevel) => {
  const map: Record<SeverityLevel, string> = {
    Critical: 'bg-red-500/20 border border-red-500/50 text-red-400',
    High: 'bg-orange-500/20 border border-orange-500/50 text-orange-400',
    Medium: 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400',
    Low: 'bg-green-500/20 border border-green-500/50 text-green-400',
  };
  return map[s] ?? 'bg-gray-500/20 text-gray-400';
};

// ─── SpeechRecognition shim ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

// ─── Component ────────────────────────────────────────────────────────────────

type PageState = 'form' | 'submitting' | 'duplicate' | 'success' | 'error';

export default function ReportingPage() {
  // — Form state —
  const [incidentType, setIncidentType] = useState<IncidentType>('Flood');
  const [severity, setSeverity] = useState<SeverityLevel>('High');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [description, setDescription] = useState('');
  const [peopleDetected, setPeopleDetected] = useState('0');
  const [childrenDetected, setChildrenDetected] = useState('0');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // — Voice & AI Image analysis —
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [countdown, setCountdown] = useState(5);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // — Page state machine —
  const [pageState, setPageState] = useState<PageState>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [createdIncident, setCreatedIncident] = useState<Incident | null>(null);

  // — Duplicate handling —
  const [mergeLoading, setMergeLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const toast = useToast();

  // ── Submit Helper ────────────────────────────────────────────────────────────
  const submitReport = useCallback(async (payload: ReportSubmitRequest) => {
    setPageState('submitting');
    try {
      const res = await citizenApi.submitIncidentReport(payload);
      setCreatedIncident(res.createdIncident);
      localStorage.setItem('panicsense_reported_incident_id', res.createdIncident.id);

      if (
        res.createdIncident.verification === 'Flagged' ||
        res.createdIncident.duplicates > 0
      ) {
        setPageState('duplicate');
        toast.warning('⚠ Duplicate incident detected — please review before confirming.');
      } else {
        setPageState('success');
        toast.success('✓ Incident reported successfully. Responders have been notified.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setErrorMsg(msg);
      setPageState('error');
      toast.error(msg);
    }
  }, [toast]);

  // ── Image Upload ─────────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setImageBase64(result);
      setImagePreview(result);

      // Perform AI image analysis instantly
      setIsAnalyzingImage(true);
      try {
        const analysis = await citizenApi.analyzeImage(result);
        const resolvedType = (analysis.type as IncidentType) || 'Flood';
        const resolvedSeverity = (analysis.severity as SeverityLevel) || 'High';
        const resolvedPeople = String(analysis.peopleDetected ?? 0);
        const resolvedChildren = String(analysis.childrenDetected ?? 0);

        if (analysis.type) setIncidentType(resolvedType);
        if (analysis.severity) setSeverity(resolvedSeverity);
        if (analysis.peopleDetected !== undefined) setPeopleDetected(resolvedPeople);
        if (analysis.childrenDetected !== undefined) setChildrenDetected(resolvedChildren);

        let finalDescription = description;
        if (analysis.recommendedAction) {
          const separator = finalDescription ? '\n\n' : '';
          finalDescription = finalDescription + separator + `[AI Image Analysis recommendation]: ${analysis.recommendedAction}`;
          setDescription(finalDescription);
        }

        toast.success(`✓ AI Analysis Complete — Detected ${resolvedType} (${resolvedSeverity} severity). Review the pre-filled fields and hit Submit.`);

        // Do NOT auto-submit. The AI results are pre-filled into the form so the user
        // can review them (location, description, people count) and then manually submit.
      } catch (err: any) {
        toast.error('AI image analysis failed. Please manually select the incident type and severity.');
        console.warn('AI Image analysis failed:', err.message);
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Voice Input ──────────────────────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec: AnySpeechRecognition =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      let finalSpeech = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalSpeech += event.results[i][0].transcript + ' ';
        }
      }
      if (finalSpeech) {
        setDescription((prev) => prev ? prev + ' ' + finalSpeech : finalSpeech);
      }
    };

    rec.onerror = () => {
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, [isListening]);

  // ── Redirection to Chat ────────────────────────────────────────────────────────
  const redirectToChat = useCallback(() => {
    if (!createdIncident) return;
    
    // Prepare safety query
    const safetyQuery = `I just reported a ${createdIncident.type} emergency of ${createdIncident.severity} severity at ${createdIncident.location.address}. What immediate safety guidelines and evacuation protocols should I follow?`;
    
    localStorage.setItem('citizen_chat_init_message', safetyQuery);
    
    // Dispatch navigation event
    window.dispatchEvent(new CustomEvent('navigate-citizen-portal', {
      detail: { path: 'chat' }
    }));
  }, [createdIncident]);

  useEffect(() => {
    if (pageState === 'success' && createdIncident) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            redirectToChat();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [pageState, createdIncident, redirectToChat]);

  // ── Auto-Detect Location ──────────────────────────────────────────────────────
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    toast.info('Detecting live location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(String(latitude.toFixed(6)));
        setLng(String(longitude.toFixed(6)));

        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setAddress(`Bengaluru, Karnataka (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          toast.success('Location detected.');
          return;
        }

        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
          );
          const data = await res.json();
          if (data.status === 'OK' && data.results?.[0]) {
            const formatted = data.results[0].formatted_address;
            setAddress(formatted);
            toast.success('Location resolved using Google Maps API.');
          } else {
            setAddress(`Bengaluru, Karnataka (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            toast.success('Location detected.');
          }
        } catch (err) {
          setAddress(`Bengaluru, Karnataka (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          toast.success('Location detected.');
        }
      },
      (error) => {
        toast.error(`Location detection failed: ${error.message}`);
      }
    );
  }, [toast]);

  useEffect(() => {
    detectLocation();
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setErrorMsg('Please provide a location address.');
      setPageState('error');
      return;
    }

    const payload: ReportSubmitRequest = {
      type: incidentType,
      severity,
      description,
      locationInput: address,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      peopleDetected: parseInt(peopleDetected) || 0,
      childrenDetected: parseInt(childrenDetected) || 0,
      imageBase64: imageBase64 ?? undefined,
    };

    await submitReport(payload);
  };

  // ── Duplicate actions ─────────────────────────────────────────────────────────
  const handleMerge = async () => {
    if (!createdIncident) return;
    setMergeLoading(true);
    try {
      await citizenApi.mergeIncident(createdIncident.id, createdIncident.id);
      toast.info('Incident merged with existing report.');
      setPageState('success');
    } catch {
      toast.info('Marked as merged. Proceeding to confirmation.');
      setPageState('success');
    } finally {
      setMergeLoading(false);
    }
  };

  const handleKeepSeparate = async () => {
    if (!createdIncident) return;
    setVerifyLoading(true);
    try {
      const updated = await citizenApi.verifyIncident(createdIncident.id, 'Verified');
      setCreatedIncident(updated);
      toast.success('✓ Incident verified as a separate report.');
    } catch {
      toast.info('Saved as separate incident.');
    } finally {
      setVerifyLoading(false);
      setPageState('success');
    }
  };

  const resetForm = () => {
    setIncidentType('Flood');
    setSeverity('High');
    setAddress('');
    setLat('');
    setLng('');
    setDescription('');
    setPeopleDetected('0');
    setChildrenDetected('0');
    clearImage();
    setCreatedIncident(null);
    setErrorMsg('');
    setPageState('form');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-green-400" />
          </div>
          <h2 className="text-base font-mono font-bold text-white tracking-widest uppercase">
            Citizen Reporting Terminal
          </h2>
          <span className="text-[10px] font-mono bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-0.5 rounded">
            SECURE
          </span>
        </div>
        <p className="text-xs text-gray-500 ml-11 font-mono">
          Submit emergency reports · AI analysis runs instantly
        </p>
      </motion.div>

      {/* ── FORM VIEW ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {(pageState === 'form' || pageState === 'submitting' || pageState === 'error') && (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="space-y-4 relative"
          >
            {/* AI Image Analysis loading overlay */}
            <AnimatePresence>
              {isAnalyzingImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#060a12]/80 backdrop-blur-md rounded-2xl z-50 flex flex-col items-center justify-center gap-4 border border-green-500/20"
                >
                  <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
                  <div className="text-center font-mono space-y-1">
                    <p className="text-sm text-white font-bold tracking-widest uppercase animate-pulse">AI Engine Analyzing Image</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Detecting disaster patterns & assessing severity...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Error banner */}
            <AnimatePresence>
              {pageState === 'error' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 bg-red-500/10 border border-red-500/40 rounded-lg p-3"
                >
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300 font-mono">{errorMsg}</p>
                  <button
                    type="button"
                    onClick={() => setPageState('form')}
                    className="ml-auto text-red-400 hover:text-red-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Row 1 — Incident Type + Severity */}
            <div className="grid grid-cols-2 gap-4">
              {/* Incident Type */}
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-widest uppercase">
                  Incident Type
                </label>
                <div className="relative">
                  <select
                    id="incident-type-select"
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                    className="w-full bg-[#0B1220] border border-gray-700 text-white text-sm font-mono rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition"
                  >
                    {INCIDENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Severity */}
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-widest uppercase">
                  Severity Level
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SEVERITY_LEVELS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      id={`severity-${s.value.toLowerCase()}`}
                      onClick={() => setSeverity(s.value)}
                      className={`text-[10px] font-mono font-bold py-1.5 px-2 rounded border transition ${
                        severity === s.value
                          ? s.bg + ' ' + s.color
                          : 'border-gray-700 text-gray-600 hover:border-gray-600 hover:text-gray-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2 — Location */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-mono text-gray-500 tracking-widest uppercase flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Location
                </label>
                <button
                  type="button"
                  onClick={detectLocation}
                  className="flex items-center gap-1.5 text-[9px] font-mono bg-[#0f2416] hover:bg-[#163520] border border-green-800/40 text-green-400 hover:text-green-300 px-2 py-1 rounded transition cursor-pointer"
                >
                  📍 AUTO-DETECT
                </button>
              </div>
              <input
                id="location-address"
                type="text"
                placeholder="Street address / landmark / area description…"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full bg-[#0B1220] border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono">
                    LAT
                  </span>
                  <input
                    id="location-lat"
                    type="number"
                    step="any"
                    placeholder="0.000000"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-[#0B1220] border border-gray-700 text-white text-sm rounded-lg pl-10 pr-3 py-2 placeholder:text-gray-700 focus:outline-none focus:border-green-500 transition font-mono"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono">
                    LNG
                  </span>
                  <input
                    id="location-lng"
                    type="number"
                    step="any"
                    placeholder="0.000000"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-[#0B1220] border border-gray-700 text-white text-sm rounded-lg pl-10 pr-3 py-2 placeholder:text-gray-700 focus:outline-none focus:border-green-500 transition font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Row 3 — Description + Voice */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
                  Situation Description
                </label>
                <button
                  type="button"
                  id="voice-input-btn"
                  onClick={toggleVoice}
                  className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-md border transition ${
                    isListening
                      ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-green-500/40 hover:text-green-400'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3 h-3" /> STOP
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3" /> VOICE INPUT
                    </>
                  )}
                </button>
              </div>
              <textarea
                id="description-input"
                rows={4}
                placeholder="Describe what you see — severity, people in danger, structural damage, water level, any immediate threats…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0B1220] border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition resize-none"
              />
              {isListening && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-red-400 font-mono">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Recording… speak clearly
                </div>
              )}
            </div>

            {/* Row 4 — People + Children + Image */}
            <div className="grid grid-cols-3 gap-4">
              {/* People */}
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-widest uppercase flex items-center gap-1">
                  <Users className="w-3 h-3" /> People
                </label>
                <input
                  id="people-detected"
                  type="number"
                  min="0"
                  value={peopleDetected}
                  onChange={(e) => setPeopleDetected(e.target.value)}
                  className="w-full bg-[#0B1220] border border-gray-700 text-white text-lg font-mono rounded-lg px-3 py-2 text-center focus:outline-none focus:border-green-500 transition"
                />
              </div>

              {/* Children */}
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-widest uppercase flex items-center gap-1">
                  <Baby className="w-3 h-3" /> Children
                </label>
                <input
                  id="children-detected"
                  type="number"
                  min="0"
                  value={childrenDetected}
                  onChange={(e) => setChildrenDetected(e.target.value)}
                  className="w-full bg-[#0B1220] border border-gray-700 text-white text-lg font-mono rounded-lg px-3 py-2 text-center focus:outline-none focus:border-green-500 transition"
                />
              </div>

              {/* Image Upload */}
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                <label className="block text-[10px] font-mono text-gray-500 mb-2 tracking-widest uppercase flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Photo
                </label>
                <input
                  ref={fileInputRef}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-14 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-400 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-14 border-2 border-dashed border-gray-700 rounded-md flex flex-col items-center justify-center gap-1 text-gray-600 hover:border-green-500/40 hover:text-green-500/60 transition text-[10px] font-mono"
                  >
                    <Upload className="w-4 h-4" />
                    UPLOAD
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              id="submit-report-btn"
              disabled={pageState === 'submitting'}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-mono font-bold text-sm rounded-xl py-3.5 transition-colors shadow-lg shadow-green-900/30"
            >
              {pageState === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ANALYZING WITH AI…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  SUBMIT EMERGENCY REPORT
                </>
              )}
            </motion.button>
          </motion.form>
        )}

        {/* ── DUPLICATE DETECTION BANNER ─────────────────────────────────── */}
        {pageState === 'duplicate' && createdIncident && (
          <motion.div
            key="duplicate"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Warning Banner */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-yellow-300 mb-1">
                    ⚠ Similar Incident Already Reported
                  </h3>
                  <p className="text-xs text-yellow-200/70">
                    Our AI has detected a potential duplicate. A similar {createdIncident.type.toLowerCase()} incident was
                    already logged in this area. Is this the same event?
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-yellow-300/60">
                    <span>ID: {createdIncident.id.slice(0, 8).toUpperCase()}</span>
                    <span>·</span>
                    <span>Duplicates flagged: {createdIncident.duplicates}</span>
                    <span>·</span>
                    <span>Status: {createdIncident.verification}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                id="merge-incident-btn"
                type="button"
                onClick={handleMerge}
                disabled={mergeLoading || verifyLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/40 text-yellow-300 font-mono font-bold text-sm rounded-xl py-4 transition disabled:opacity-50"
              >
                {mergeLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GitMerge className="w-4 h-4" />
                )}
                YES, MERGE IT
              </motion.button>

              <motion.button
                id="keep-separate-btn"
                type="button"
                onClick={handleKeepSeparate}
                disabled={mergeLoading || verifyLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/40 text-gray-300 font-mono font-bold text-sm rounded-xl py-4 transition disabled:opacity-50"
              >
                {verifyLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                NO, KEEP SEPARATE
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── SUCCESS STATE ──────────────────────────────────────────────── */}
        {pageState === 'success' && createdIncident && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Confirmation Banner */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-mono font-bold text-green-300">
                  Report Submitted Successfully
                </h3>
                <p className="text-xs text-green-200/60 mt-0.5 font-mono">
                  Your report has been received and processed by the AI engine. Responders have been notified.
                </p>
                <div className="mt-2 text-[10px] font-mono text-green-400/80 animate-pulse">
                  Auto-redirecting to RAG Chat for immediate safety guidance in {countdown}s...
                </div>
              </div>
            </motion.div>

            {/* Created Incident Card */}
            <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-bold ${severityColor(createdIncident.severity)}`}>
                    {createdIncident.type.toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${severityBadge(createdIncident.severity)}`}
                  >
                    {createdIncident.severity.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-gray-600 font-mono">
                    #{createdIncident.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    createdIncident.verification === 'Verified'
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : createdIncident.verification === 'Flagged'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  }`}
                >
                  {createdIncident.verification.toUpperCase()}
                </span>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 divide-x divide-gray-800 border-b border-gray-800">
                {[
                  {
                    label: 'Priority',
                    value: createdIncident.priorityScore,
                    icon: <Star className="w-3 h-3" />,
                    color: 'text-yellow-400',
                  },
                  {
                    label: 'Confidence',
                    value: `${Math.round(createdIncident.confidence * 100)}%`,
                    icon: <Zap className="w-3 h-3" />,
                    color: 'text-blue-400',
                  },
                  {
                    label: 'People',
                    value: createdIncident.peopleDetected,
                    icon: <Users className="w-3 h-3" />,
                    color: 'text-orange-400',
                  },
                  {
                    label: 'Children',
                    value: createdIncident.childrenDetected,
                    icon: <Baby className="w-3 h-3" />,
                    color: 'text-pink-400',
                  },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center justify-center py-3 gap-0.5">
                    <span className={`${stat.color}`}>{stat.icon}</span>
                    <span className={`text-lg font-mono font-bold ${stat.color}`}>{stat.value}</span>
                    <span className="text-[9px] text-gray-600 font-mono uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Location */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-gray-300">{createdIncident.location.address}</span>
                </div>

                {/* Recommended Action */}
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
                    AI Recommended Action
                  </p>
                  <div className="bg-[#0B1220] border border-gray-800 rounded-lg px-3 py-2.5">
                    <p className="text-xs text-gray-200">{createdIncident.recommendedAction}</p>
                  </div>
                </div>

                {/* Reasoning */}
                {createdIncident.reasoning && createdIncident.reasoning.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Eye className="w-3 h-3" /> AI Reasoning
                    </p>
                    <ul className="space-y-1">
                      {createdIncident.reasoning.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <span className="text-green-500 font-mono shrink-0 mt-0.5">›</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Water Level */}
                {createdIncident.waterLevel !== 'N/A' && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 font-mono">WATER LEVEL</span>
                    <span
                      className={`font-mono font-bold ${
                        createdIncident.waterLevel === 'High'
                          ? 'text-red-400'
                          : createdIncident.waterLevel === 'Medium'
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {createdIncident.waterLevel}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-800 px-5 py-3 flex items-center justify-between gap-4">
                <span className="text-[10px] text-gray-600 font-mono">
                  {new Date(createdIncident.timestamp).toLocaleString()}
                </span>
                <div className="flex gap-2.5">
                  <button
                    id="open-rag-chat-btn"
                    type="button"
                    onClick={redirectToChat}
                    className="text-[10px] font-mono text-white bg-green-700 hover:bg-green-600 border border-transparent px-4 py-1.5 rounded-md transition font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse cursor-pointer"
                  >
                    💬 CHAT ASSISTANT NOW
                  </button>
                  <button
                    id="submit-another-btn"
                    type="button"
                    onClick={resetForm}
                    className="text-[10px] font-mono text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-500/60 px-3 py-1.5 rounded-md transition cursor-pointer"
                  >
                    + NEW REPORT
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
