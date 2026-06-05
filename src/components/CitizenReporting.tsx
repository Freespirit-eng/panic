import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  MapPin, 
  Camera, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle, 
  Activity, 
  Compass, 
  Anchor, 
  Flame, 
  Construction, 
  AlertTriangle,
  BookOpen
} from 'lucide-react';

interface CitizenReportingProps {
  onSubmitReport: (data: { description: string; locationInput: string; imageBase64: string }) => Promise<any>;
}

// Visual preset photos of disaster categories for rapid testing
const PHOTO_PRESETS = [
  {
    name: "Urban Flood Scene",
    url: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=300",
    description: "Flooded street near storefronts, water levels up to car mirrors. People waving from second-story window."
  },
  {
    name: "Active Commercial Fire",
    url: "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&q=80&w=300",
    description: "Thick billowy black smoke escaping the front entrance of store on crowded commercial transit lane. Flames visible on roof."
  },
  {
    name: "Severe Asphalt Sinkhole",
    url: "https://images.unsplash.com/photo-1599740831114-1779aa2e406f?auto=format&fit=crop&q=80&w=300",
    description: "Deep surface collapse crater on double lane junction blocking fire access. Concrete foundations cracked beneath."
  }
];

export default function CitizenReporting({ onSubmitReport }: CitizenReportingProps) {
  const [description, setDescription] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedPhotoPreset, setSelectedPhotoPreset] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportedResult, setReportedResult] = useState<any | null>(null);

  // Convert preset URL directly to base64 or pass it along
  const handleSelectPreset = (preset: typeof PHOTO_PRESETS[0]) => {
    setSelectedPhotoPreset(preset.url);
    if (!description) {
      setDescription(`Report: ${preset.description}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedPhotoPreset(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    setIsSubmitting(true);
    try {
      const res = await onSubmitReport({
        description,
        locationInput: locationInput || "MG Road Sector, Bangalore",
        imageBase64: selectedPhotoPreset
      });
      setReportedResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
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

  // Calm Instructions based on disaster types to make citizens feel safe
  const getEmergencyInstructions = (type: string) => {
    switch (type) {
      case 'Flood':
        return [
          "Move directly to high elevated ground or roof decks immediately.",
          "Do not attempt to walk, wade, or drive through flowing water.",
          "Power off main household electricity breakers to avoid underwater shocks.",
          "Keep cell-phone telemetry active. EOC response bots will establish contact."
        ];
      case 'Fire':
        return [
          "Locate closest fire exits and vent towards external open air parks.",
          "Crawl low under smoke cover carrying a wet cloth over nasal filters.",
          "Avoid elevators under all conditions. Stick exclusively to concrete exit shafts.",
          "Do not return to retrieve possessions. Focus purely on immediate evacuation."
        ];
      case 'Road Collapse':
        return [
          "Establish high-visibility physical blockades 100 meters away.",
          "Redirect vehicles away from immediate surrounding fractures.",
          "Examine adjoining buildings for ground foundation sliding noises.",
          "Assemble at designated cluster zones until local engineers complete inspections."
        ];
      default:
        return [
          "Maintain absolute calm. Do not engage in mass rapid crowd movements.",
          "Ensure secondary air ventilation is structured and avoid physical structural cracks.",
          "Stay tuned for live EOC audio updates. Dispatched responders are en route."
        ];
    }
  };

  return (
    <div className="max-w-xl mx-auto py-4 space-y-6">
      
      {/* Platform Title */}
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          RESCUE CONNECT PORTAL
        </h2>
        <p className="text-xs text-gray-400 mt-1 font-mono uppercase tracking-wider">OFFICIAL CITIZEN REPORTING GATEWAY</p>
      </div>

      <AnimatePresence mode="wait">
        {!reportedResult ? (
          /* Report Submission Form */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-card border border-gray-805 rounded-lg p-5 relative overflow-hidden glow-red"
          >
            <form onSubmit={handleSubmit} className="space-y-4 font-sans">
              
              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest block">
                  01 // SPECIFY CURRENT DANGER
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us what you see. E.g. 'Flash flood. The metro subway underpass near MG Road is filling up rapidly. Water is height of car roofs. 4 people stuck on vehicles inside. Urgent!'"
                  className="w-full bg-[#0B1220] border border-gray-805 rounded p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              {/* Location Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest block flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" />
                  02 // GEOGRAPHIC SECTOR / ADDRESS
                </label>
                <input
                  type="text"
                  required
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="E.g., Bangalore Metro station underpass, MG Road"
                  className="w-full bg-[#0B1220] border border-gray-805 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Image Attachments */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest block flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-blue-500" />
                  03 // PHOTO VERIFICATION (REQUIRED FOR AI SCANS)
                </label>
                
                {/* Upload or Preview */}
                {selectedPhotoPreset ? (
                  <div className="relative w-full h-44 rounded border border-blue-900 overflow-hidden bg-gray-950">
                    <img 
                      src={selectedPhotoPreset} 
                      alt="Upload Attachment" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedPhotoPreset('')}
                      className="absolute top-2 right-2 bg-red-650 hover:bg-red-700 text-white font-mono text-[10px] uppercase font-bold px-2 py-1 rounded"
                    >
                      discard photo
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-800 hover:border-gray-700 bg-gray-950 p-4 rounded text-center cursor-pointer relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 w-full cursor-pointer"
                    />
                    <Camera className="h-7 w-7 text-gray-650 mx-auto" />
                    <span className="block text-xs font-medium text-gray-400 mt-2">CLICK TO UPLOAD MOBILE CAMERA CAPTURE</span>
                  </div>
                )}

                {/* Preset Photos for ease of testing */}
                <div className="border-t border-gray-850 pt-3">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block mb-2">
                    OR TAP TO SIMULATE REAL INTERACTIVE DISASTER FILES:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {PHOTO_PRESETS.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="bg-gray-950 hover:bg-gray-900 border border-gray-800 p-1.5 rounded transition text-left flex flex-col items-center"
                      >
                        <img 
                          src={preset.url} 
                          alt={preset.name} 
                          className="w-full h-11 object-cover rounded border border-gray-900" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[9px] font-sans font-bold text-gray-400 mt-1 line-clamp-1 w-full text-center">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit triggers */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !description}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-xs font-mono font-bold tracking-wider text-white rounded transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      GENERATING SECURE COGNITIVE SHIELD ANALYSIS...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      BEAM EMERGENCY INTEL TO METRO DISPATCH
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        ) : (
          /* Submission Result: EOC AI Verification report */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Trustworthy Calm Acknowledgment Card */}
            <div className="bg-[#102016]/80 border border-green-800 rounded p-5 relative overflow-hidden">
              <CheckCircle className="h-8 w-8 text-green-400 mb-3" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-tight font-sans">
                DISPATCH SIGNAL RECEIVED AND LOCKED
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed font-sans mt-1.5">
                Thank you for your report. The Panic Sense EOC Platform has verified your telemetry. An emergency rescue mission has been logged for regional dispatch.
              </p>
              
              <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-gray-400">
                <span>INCIDENT CODE:</span>
                <strong className="text-green-400">{reportedResult.createdIncident.id}</strong>
                <span>•</span>
                <span>STATE: TRIGGERED FOR ACTIVE SQUAD</span>
              </div>
            </div>

            {/* AI Diagnostics Report Display Drawer */}
            <div className="bg-card border border-blue-500/40 rounded-lg p-5 relative overflow-hidden bg-gradient-to-b from-[#111827] to-[#0A111F] glow-blue">
              
              <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-4">
                <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                <h4 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
                  AI SYNTHESIZED VERIFICATION METRICS
                </h4>
              </div>

              {/* Grid metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-4">
                <div className="bg-gray-950 p-2.5 rounded border border-gray-850">
                  <span className="text-gray-500 uppercase text-[9px]">Classified Threat</span>
                  <div className="text-white font-bold mt-1 uppercase flex items-center gap-1">
                    {getDisasterIcon(reportedResult.report.type)}
                    {reportedResult.report.type}
                  </div>
                </div>

                <div className="bg-gray-950 p-2.5 rounded border border-gray-850">
                  <span className="text-gray-550 uppercase text-[9px]">Analysis Confidence</span>
                  <div className="text-blue-400 font-extrabold mt-1">{reportedResult.report.confidence}%</div>
                </div>

                <div className="bg-gray-950 p-2.5 rounded border border-gray-850">
                  <span className="text-gray-550 uppercase text-[9px]">Calculated Severity</span>
                  <div className="text-red-400 font-bold mt-1 uppercase">{reportedResult.report.severity}</div>
                </div>

                <div className="bg-gray-950 p-2.5 rounded border border-gray-850">
                  <span className="text-gray-550 uppercase text-[9px]">Priority Response Match</span>
                  <div className="text-yellow-400 font-extrabold mt-1">{reportedResult.report.priorityScore} / 100</div>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="bg-[#1e1a10] border border-yellow-905/30 p-3 rounded mb-4">
                <span className="text-[9px] font-mono text-[#EAB308] font-bold block uppercase tracking-wide">
                  ESTIMATED INTERVENTION SQUAD
                </span>
                <strong className="text-white text-xs block mt-0.5">{reportedResult.report.recommendedAction}</strong>
              </div>

              {/* Reasoning Trace */}
              <div className="space-y-1.5 mb-5">
                <span className="text-[9px] font-mono text-gray-550 block uppercase tracking-widest border-b border-gray-850 pb-1 mb-2">
                  AI DECISION TRACE SYSTEM
                </span>
                <ul className="space-y-1.5 text-xs text-gray-300 leading-relaxed font-sans">
                  {reportedResult.report.reasoning.map((item: string, idx: number) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-blue-500 font-mono inline-block select-none">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Calm, trustable instructions */}
              <div className="bg-[#1e293b] border-l-4 border-blue-500 p-4 rounded-r mt-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-1.5 font-sans mb-2.5">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  IMMEDIATE FIELD REFUGE INSTRUCTIONS
                </h4>
                <ul className="space-y-2 text-xs text-gray-300 leading-relaxed font-sans select-text">
                  {getEmergencyInstructions(reportedResult.report.type).map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-blue-400 font-bold text-xs">{idx+1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Form Reset Action button */}
              <div className="mt-5 pt-3 border-t border-gray-850 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDescription('');
                    setLocationInput('');
                    setSelectedPhotoPreset('');
                    setReportedResult(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-mono text-white rounded font-bold transition"
                >
                  LOG SECONDARY REPORTS
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
