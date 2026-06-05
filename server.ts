import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { Incident, Mission, Alert, EOCStats, IncidentType, SeverityLevel, Geofence, Hotspot, SensorFeed, Volunteer, VolunteerAlertNotification } from './src/types.js';

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Dynamic In-Memory Store
let incidents: Incident[] = [
  {
    id: "INC-101",
    image: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=600",
    type: "Flood",
    severity: "Critical",
    confidence: 94,
    location: "MG Road Metro Underpass, Bangalore",
    lat: 12.9740,
    lng: 77.6010,
    time: "2026-06-04T15:30:00Z",
    verification: "Verified",
    duplicates: 3,
    peopleDetected: 7,
    childrenDetected: 2,
    waterLevel: "High",
    recommendedAction: "Deploy Boat Team",
    priorityScore: 92,
    reasoning: [
      "Children visible on roof of trapped vehicle",
      "Water level measured above waist level (approx 1.2m)",
      "3 independent matching reports with media attachments merged"
    ]
  },
  {
    id: "INC-102",
    image: "https://images.unsplash.com/photo-1599740831114-1779aa2e406f?auto=format&fit=crop&q=80&w=600",
    type: "Road Collapse",
    severity: "High",
    confidence: 91,
    location: "Electronic City Phase 1, Bangalore",
    lat: 12.8452,
    lng: 77.6722,
    time: "2026-06-04T14:15:00Z",
    verification: "Verified",
    duplicates: 1,
    peopleDetected: 2,
    childrenDetected: 0,
    waterLevel: "N/A",
    recommendedAction: "Deploy Civil Engineering Crew & Traffic Control",
    priorityScore: 84,
    reasoning: [
      "Major sinkhole blocking 2 lanes of emergency arterial route",
      "Structural erosion threat close to elevated highway pillar",
      "High volume vehicle traffic corridor"
    ]
  },
  {
    id: "INC-103",
    image: "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&q=80&w=600",
    type: "Fire",
    severity: "Critical",
    confidence: 96,
    location: "Indiranagar 100 Feet Road, Bangalore",
    lat: 12.9719,
    lng: 77.6412,
    time: "2026-06-04T16:05:00Z",
    verification: "Verified",
    duplicates: 5,
    peopleDetected: 12,
    childrenDetected: 1,
    waterLevel: "N/A",
    recommendedAction: "Dispatch Fire Engine and Hazmat Group",
    priorityScore: 95,
    reasoning: [
      "Commercial retail fire spreading to adjacent apartments",
      "Heavy black toxic smoke, possible hazardous material storage",
      "Highly dense commercial zone with multiple occupants trapped"
    ]
  },
  {
    id: "INC-104",
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600",
    type: "Building Damage",
    severity: "Medium",
    confidence: 88,
    location: "Whitefield IT Corridor, Bangalore",
    lat: 12.9698,
    lng: 77.7499,
    time: "2026-06-04T12:00:00Z",
    verification: "Pending",
    duplicates: 0,
    peopleDetected: 4,
    childrenDetected: 0,
    waterLevel: "N/A",
    recommendedAction: "Dispatch Structural Assessment Squad",
    priorityScore: 68,
    reasoning: [
      "Cracking and facade detachment of multi-story office building front",
      "No active collapses, but public safety hazard on sidewalk",
      "Pending inspector review"
    ]
  },
  {
    id: "INC-105",
    image: "https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&q=80&w=600",
    type: "Flood",
    severity: "High",
    confidence: 92,
    location: "Majestic Bus Station Subway, Bangalore",
    lat: 12.9774,
    lng: 77.5729,
    time: "2026-06-04T15:45:00Z",
    verification: "Verified",
    duplicates: 2,
    peopleDetected: 15,
    childrenDetected: 3,
    waterLevel: "Medium",
    recommendedAction: "Deploy Pumping and Evacuation Unit",
    priorityScore: 89,
    reasoning: [
      "Subway corridor flooded, trapping commuters inside the dry platform areas",
      "Water level depth rising consistently due to storm drain failures",
      "Mass transit hub high congestion risk"
    ]
  }
];

let missions: Mission[] = [
  {
    id: "MSN-1024",
    incidentId: "INC-101",
    location: "MG Road Metro Underpass, Bangalore",
    type: "Flood",
    severity: "Critical",
    recommendedTeam: "Water Rescue Unit (WR-2)",
    assignedTeam: "Water Rescue Unit (WR-2)",
    status: "Active",
    eta: "8 Mins",
    summary: "Flooding has trapped multiple commuters in vehicles. Immediate extraction needed.",
    aiFindings: "7 life signatures isolated via vision system, including 2 minors. Static vehicles are floating. Depth exceeding 1.2m.",
    riskAssessment: "Severe hypothermia and drowning risk if water level spikes further. Rising electrical hazards in sub-level lines.",
    affectedPopulation: 7,
    requiredResources: ["Inflatable Zodiac Boats", "Thermal Blankets", "Submersible Pumps", "Mobile Floodlights"],
    recommendedResponsePlan: [
      "Stage zodiac vessels at north dry incline",
      "Execute tethered wading rescue",
      "Coordinate medical assessment at secure dry zone"
    ],
    timeline: [
      { time: "15:30", event: "Incident captured via AI traffic-camera feed stream analysis." },
      { time: "15:32", event: "EOC platform synthesized duplicate reports, flag raised to Critical." },
      { time: "15:35", event: "Mission RC-1024 established. WR-2 designated as optimal match." },
      { time: "15:38", event: "Commander assigned WR-2. Dispatch order successfully beamed to squad." }
    ]
  },
  {
    id: "MSN-1025",
    incidentId: "INC-103",
    location: "Indiranagar 100 Feet Road, Bangalore",
    type: "Fire",
    severity: "Critical",
    recommendedTeam: "Fire & Hazmat Group (FH-5)",
    assignedTeam: "",
    status: "Awaiting Assignment",
    eta: "14 Mins",
    summary: "Large commercial warehouse fire with potential chemical vectors. Adjoining residential buildings threatened.",
    aiFindings: "Thick noxious soot, likely chemical/plastics vector. Visible structural deformation on masonry front.",
    riskAssessment: "Flashover imminent. Severe particulate inhalation hazard for nearby apartments.",
    affectedPopulation: 12,
    requiredResources: ["High-Reach Aerial Engines", "Dry Chemical Fire Retardant", "Scuba Breathing Apparatus", "Thermal Drones"],
    recommendedResponsePlan: [
      "Establish defensive fire lines to isolate residential blocks",
      "Deploy localized mist vectors to suppress air toxins",
      "Rescue breathing extraction teams to standard exits"
    ],
    timeline: [
      { time: "16:05", event: "AI verified report compiled via multiple citizen social vectors." },
      { time: "16:06", event: "EOC generated incident. Priority score computed at 95/100." },
      { time: "16:08", event: "Rescue mission designated. Fire Commander notified." }
    ]
  }
];

let broadcasts: Alert[] = [
  {
    id: "ALR-501",
    type: "Evacuation Notice",
    title: "MG Road Subway Flash Flood Evacuation",
    message: "Urgent evacuation ordered for subway basements and low-lying commercial blocks near MG Road due to high water inflow.",
    area: "MG Road & surrounding 500m area",
    timestamp: "2026-06-04T15:40:00Z",
    sentBy: "Dr. K. Sastri (EOC Chief Advisor)"
  },
  {
    id: "ALR-502",
    type: "Road Closure",
    title: "Electronic City Phase 1 Crater - Detour Required",
    message: "Arterial Lane closed due to heavy road structural collapse. Commuters advised to divert via NICE Expressway.",
    area: "Electronic City Phase 1 Northbound",
    timestamp: "2026-06-04T14:30:00Z",
    sentBy: "Tech Hub Traffic Division"
  }
];

// Predictive Analytics & Geofencing Memory Store
let geofences: Geofence[] = [
  {
    id: "GF-101",
    name: "MG Road Transit Corridor Zone",
    lat: 12.9740,
    lng: 77.6010,
    radiusKm: 1.5,
    severityLimit: "Critical",
    status: "Normal"
  },
  {
    id: "GF-102",
    name: "Electronic City Industrial Sector",
    lat: 12.8452,
    lng: 77.6722,
    radiusKm: 2.5,
    severityLimit: "All",
    status: "Normal"
  },
  {
    id: "GF-103",
    name: "Koramangala Commercial Hub Link",
    lat: 12.9348,
    lng: 77.6189,
    radiusKm: 2.0,
    severityLimit: "High",
    status: "Normal"
  }
];

let hotspots: Hotspot[] = [
  {
    id: "HS-301",
    name: "Bellandur Low-lying Drainage Basin",
    lat: 12.9304,
    lng: 77.6784,
    riskLevel: "Severe",
    riskScore: 94,
    type: "Flood",
    escalationProbability: 88,
    triggerFactors: ["Rain intensity forecasting (45mm/hr)", "Clogged stormwater outlets", "Low catchment capacity"]
  },
  {
    id: "HS-302",
    name: "Outer Ring Road IT Sector Cluster",
    lat: 12.9272,
    lng: 77.6811,
    riskLevel: "Elevated",
    riskScore: 78,
    type: "Road Collapse",
    escalationProbability: 61,
    triggerFactors: ["Continuous soil water saturation", "Sub-surface utility excavations", "Heavy freight transit pressure"]
  },
  {
    id: "HS-303",
    name: "Indiranagar Gas Sub-station Sector",
    lat: 12.9735,
    lng: 77.6401,
    riskLevel: "Elevated",
    riskScore: 82,
    type: "Fire",
    escalationProbability: 72,
    triggerFactors: ["Aging transformer sub-station heat levels", "Dense mercantile storage units", "Low ambient ventilation index"]
  },
  {
    id: "HS-304",
    name: "Jayanagar Residential Block Escarpment",
    lat: 12.9250,
    lng: 77.5938,
    riskLevel: "Cautionary",
    riskScore: 54,
    type: "Building Damage",
    escalationProbability: 38,
    triggerFactors: ["Waterproofing sealant decomposition", "Excavations adjacent to load foundation pillars"]
  }
];

let sensorFeeds: SensorFeed[] = [
  {
    id: "SEN-601",
    name: "Bellandur Outer Drain Meter",
    type: "Hydrological Sensor",
    value: "1.45m [DANGER > 1.2M]",
    status: "Critical",
    sector: "Bellandur Drainage Zone"
  },
  {
    id: "SEN-602",
    name: "MG Road Transit Stress Plinth",
    type: "Structural Load",
    value: "412 KPa [ELEVATED]",
    status: "Elevated",
    sector: "MG metro-rail terminal"
  },
  {
    id: "SEN-603",
    name: "Indiranagar Transformer Cam",
    type: "Thermal Drone Infra",
    value: "142°C [ALERT]",
    status: "Critical",
    sector: "Indiranagar Sub-station"
  },
  {
    id: "SEN-604",
    name: "Koramangala Radar Pluviometer",
    type: "Precipitation Index",
    value: "52 mm/hr [HEAVY COLD]",
    status: "Elevated",
    sector: "Koramangala Grid"
  },
  {
    id: "SEN-605",
    name: "Electronic City Seismic Recorder",
    type: "Seismic Tremor",
    value: "0.02g [STABLE STATUS]",
    status: "Normal",
    sector: "Electronic City Phase I"
  }
];

let volunteers: Volunteer[] = [
  {
    id: "VOL-701",
    name: "Command Officer Ajay Sharma",
    phone: "+91 98450 11201",
    lat: 12.9730,
    lng: 77.6015,
    status: 'Available',
    skills: ["Water Extraction", "Trauma First Aid", "Crowd Control"],
    equipment: ["Modified 4x4 Jeep SUV", "High Capacity Tow Winch", "Advanced Medic Pack"],
    notifyRadiusKm: 3.5,
    receivedAlerts: []
  },
  {
    id: "VOL-702",
    name: "Dr. Priya Sundaram",
    phone: "+91 94480 32194",
    lat: 12.9722,
    lng: 77.6390,
    status: 'Available',
    skills: ["Emergency Triage", "Critical Wound Care", "VHF Comms Guidance"],
    equipment: ["Trauma Medkit", "VHF Transceiver Station", "Portable Airway Support"],
    notifyRadiusKm: 4.5,
    receivedAlerts: []
  },
  {
    id: "VOL-703",
    name: "Karthik Gowda (Civil Wing)",
    phone: "+91 88610 88294",
    lat: 12.9690,
    lng: 77.7480,
    status: 'Available',
    skills: ["Swift Water Diving", "Power Chainsaw Handling", "Search Coordination"],
    equipment: ["2-Man Zodiac Inflatable Kayak", "Gas Powered Concrete Chainsaw", "High-Beam Floodlights"],
    notifyRadiusKm: 5.0,
    receivedAlerts: []
  },
  {
    id: "VOL-704",
    name: "Anil Fernandes (Excavation Div)",
    phone: "+91 99010 44299",
    lat: 12.9760,
    lng: 77.5705,
    status: 'Available',
    skills: ["Heavy Debris Unblocking", "Structural Splicing", "Tethered Extrication"],
    equipment: ["Hydraulic Breaker", "Solid Steel Recovery Tow Cable", "Industrial Crowbars"],
    notifyRadiusKm: 3.0,
    receivedAlerts: []
  }
];

// Distance Estimator (Haversine formula in Km)
function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth axis (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function evaluateVolunteerNotifications() {
  volunteers.forEach(v => {
    incidents.forEach(inc => {
      if (inc.verification === 'Flagged') return;
      const distance = calculateDistanceKm(v.lat, v.lng, inc.lat, inc.lng);
      if (distance <= v.notifyRadiusKm) {
        const alreadyNotified = v.receivedAlerts.some(a => a.incidentId === inc.id);
        if (!alreadyNotified) {
          v.receivedAlerts.unshift({
            id: `VALR-${Math.floor(1000 + Math.random() * 9000)}`,
            incidentId: inc.id,
            title: `Critical Incident Triggered: Close Proximity ${inc.type}!`,
            message: `${inc.type} detected at ${inc.location}. This incident is located ${distance.toFixed(2)} km from your post coordinates. Sector command recommends immediate status assessment.`,
            distanceKm: Number(distance.toFixed(2)),
            time: new Date().toISOString(),
            severity: inc.severity,
            accepted: false
          });
        }
      }
    });
  });
}


// Global Sentry Trigger alert logger
function triggerGeofenceAlert(gfName: string, entityId: string, entityType: string, type: 'Emergency Alert' | 'Rescue Update' | 'Road Closure' | 'Evacuation Notice') {
  const alertId = `ALR-GF-${Math.floor(600 + Math.random() * 399)}`;
  const title = `GEOFENCE ALARM: ${gfName}`;
  const message = `SECURE SENTINEL WARNING: Active ${entityType} [${entityId}] coordinate matched to geofence containment buffer. Emergency sirens engaged.`;
  
  // Prevent duplicate messages if already logged recently
  const isDuplicate = broadcasts.some(b => b.title === title && b.message.substring(0, 40) === message.substring(0, 40));
  if (!isDuplicate) {
    broadcasts.unshift({
      id: alertId,
      type,
      title,
      message,
      area: gfName,
      timestamp: new Date().toISOString(),
      sentBy: "Autonomous Geofence Sentry"
    });
  }
}

// Evaluate breaches dynamically
function evaluateGeofenceBreaches() {
  for (const gf of geofences) {
    let breached = false;
    let monitoring = false;

    // Check incidents
    for (const inc of incidents) {
      if (inc.verification === 'Flagged') continue;
      const d = calculateDistanceKm(inc.lat, inc.lng, gf.lat, gf.lng);
      if (d <= gf.radiusKm) {
        if (gf.severityLimit === 'All' || gf.severityLimit === inc.severity) {
          breached = true;
          triggerGeofenceAlert(gf.name, inc.id, `${inc.type} Incident (${inc.severity})`, 'Emergency Alert');
        } else {
          monitoring = true;
        }
      }
    }

    // Check dispatch missions / teams
    for (const m of missions) {
      if (m.status === 'Resolved' || !m.assignedTeam) continue;
      // Get logical location from parents or guess coords
      const parentInc = incidents.find(i => i.id === m.incidentId);
      if (parentInc) {
        const d = calculateDistanceKm(parentInc.lat, parentInc.lng, gf.lat, gf.lng);
        if (d <= gf.radiusKm) {
          triggerGeofenceAlert(gf.name, m.assignedTeam, `Deployed Responder Squad [${m.id}]`, 'Rescue Update');
          breached = true;
        }
      }
    }

    gf.status = breached ? 'Breached' : (monitoring ? 'Monitoring' : 'Normal');
  }
}


// Lazy Initialize Gemini SDK
function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// API Routes

// Get all volunteers
app.get('/api/volunteers', (req, res) => {
  try {
    evaluateVolunteerNotifications();
  } catch (err) {
    console.error("Warning evaluating volunteer alerts: ", err);
  }
  res.json(volunteers);
});

// Register a new volunteer
app.post('/api/volunteers', (req, res) => {
  const { name, phone, lat, lng, skills, equipment, notifyRadiusKm } = req.body;
  const newVol: Volunteer = {
    id: `VOL-${Math.floor(750 + Math.random() * 249)}`,
    name: name || "Citizen Responder",
    phone: phone || "+91 99000 12345",
    lat: Number(lat) || 12.9716,
    lng: Number(lng) || 77.5946,
    status: 'Available',
    skills: skills || ["First Aid Emergency Assist"],
    equipment: equipment || ["Standard Safety Gear"],
    notifyRadiusKm: Number(notifyRadiusKm) || 4.0,
    receivedAlerts: []
  };
  volunteers.unshift(newVol);
  try {
    evaluateVolunteerNotifications();
  } catch (e) {
    console.error("Warning evaluating volunteer warnings: ", e);
  }
  res.status(201).json(newVol);
});

// Volunteer accepts proximity alert
app.post('/api/volunteers/:id/alert/:alertId/accept', (req, res) => {
  const { id, alertId } = req.params;
  const vol = volunteers.find(v => v.id === id);
  if (!vol) {
    return res.status(404).json({ error: "Volunteer not found" });
  }
  const alert = vol.receivedAlerts.find(a => a.id === alertId);
  if (!alert) {
    return res.status(404).json({ error: "Proximity alert not found" });
  }

  alert.accepted = true;
  vol.status = 'On Mission';

  const activeInc = incidents.find(i => i.id === alert.incidentId);
  const locationName = activeInc ? activeInc.location : "Active Coordinate Sector";
  const announcementText = `VOLUNTEER MOBILIZED: ${vol.name} has officially accepted the localized dispatch alert to assist with ${activeInc?.type || 'incident'} operations near ${locationName}. Bringing gear: ${vol.equipment.join(', ')}.`;

  broadcasts.unshift({
    id: `ALR-${Math.floor(6000 + Math.random() * 3000)}`,
    type: "Rescue Update",
    title: `Volunteer Mobilized: Area ${alert.incidentId}`,
    message: announcementText,
    area: locationName,
    timestamp: new Date().toISOString(),
    sentBy: vol.name
  });

  res.json({ success: true, volunteer: vol });
});


// Get live EOC stats
app.get('/api/stats', (req, res) => {
  const activeIncidents = incidents.filter(i => i.verification !== 'Flagged').length;
  const criticalEmergencies = incidents.filter(i => i.severity === 'Critical').length;
  const respondersDeployed = missions.filter(m => m.status === 'Active' || m.status === 'Dispatched' || m.status === 'En Route').length * 8; // Simulate 8 responders per team
  const citizensImpacted = incidents.reduce((sum, i) => sum + i.peopleDetected, 0) + missions.reduce((sum, m) => sum + m.affectedPopulation, 0);
  const aiVerifiedReports = incidents.filter(i => i.verification === 'Verified').length;

  const stats: EOCStats = {
    activeIncidents,
    criticalEmergencies,
    respondersDeployed: respondersDeployed || 42,
    citizensImpacted: citizensImpacted || 120,
    aiVerifiedReports
  };
  res.json(stats);
});

// Get all incidents
app.get('/api/incidents', (req, res) => {
  res.json(incidents);
});

// Geofencing routes
app.get('/api/geofences', (req, res) => {
  evaluateGeofenceBreaches();
  res.json(geofences);
});

app.post('/api/geofences', (req, res) => {
  const { name, lat, lng, radiusKm, severityLimit } = req.body;
  const newGf: Geofence = {
    id: `GF-${Math.floor(200 + Math.random() * 799)}`,
    name: name || "Custom Containment Grid",
    lat: Number(lat) || 12.9716,
    lng: Number(lng) || 77.5946,
    radiusKm: Number(radiusKm) || 2.0,
    severityLimit: severityLimit || "All",
    status: "Normal"
  };
  geofences.push(newGf);
  evaluateGeofenceBreaches();
  res.status(201).json(newGf);
});

app.delete('/api/geofences/:id', (req, res) => {
  const { id } = req.params;
  geofences = geofences.filter(gf => gf.id !== id);
  evaluateGeofenceBreaches();
  res.json({ success: true });
});

// Predictive Hotspots
app.get('/api/hotspots', (req, res) => {
  res.json(hotspots);
});

// Real-time sensor statuses
app.get('/api/sensors', (req, res) => {
  res.json(sensorFeeds);
});

// Update incident verification status
app.post('/api/incidents/:id/verify', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Verified', 'Pending', 'Flagged'
  const incident = incidents.find(i => i.id === id);
  if (incident) {
    incident.verification = status;
    res.json(incident);
  } else {
    res.status(404).json({ error: "Incident not found" });
  }
});

// Get all rescue missions
app.get('/api/missions', (req, res) => {
  res.json(missions);
});

// Perform action on mission
app.post('/api/missions/:id/action', (req, res) => {
  const { id } = req.params;
  const { action, assignedTeam } = req.body; // 'Assign', 'Dispatch', 'Resolve'

  const mission = missions.find(m => m.id === id);
  if (!mission) {
    return res.status(404).json({ error: "Mission not found" });
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (action === 'Assign') {
    mission.assignedTeam = assignedTeam || mission.recommendedTeam;
    mission.status = 'En Route';
    mission.timeline.push({
      time: timeStr,
      event: `Rescue team '${mission.assignedTeam}' selected and matched to operation.`
    });
  } else if (action === 'Dispatch') {
    mission.status = 'Active';
    mission.timeline.push({
      time: timeStr,
      event: `Squad '${mission.assignedTeam || 'Default Team'}' actively dispatched with heavy tactical gear.`
    });
  } else if (action === 'Resolve') {
    mission.status = 'Resolved';
    mission.timeline.push({
      time: timeStr,
      event: `Rescue mission successfully completed. All lives accounted for and transitioned.`
    });
    // Also update incident status
    const parentIncident = incidents.find(i => i.id === mission.incidentId);
    if (parentIncident) {
      parentIncident.verification = 'Verified';
    }
  }

  res.json(mission);
});

// Create a new rescue mission from an incident
app.post('/api/missions/create', (req, res) => {
  const { incidentId } = req.body;
  const incident = incidents.find(i => i.id === incidentId);
  if (!incident) {
    return res.status(404).json({ error: "Incident not found" });
  }

  // Check if mission already exists for this incident
  const exists = missions.find(m => m.incidentId === incidentId);
  if (exists) {
    return res.json(exists);
  }

  const msnId = `MSN-${Math.floor(1000 + Math.random() * 9000)}`;
  const newMission: Mission = {
    id: msnId,
    incidentId: incident.id,
    location: incident.location,
    type: incident.type,
    severity: incident.severity,
    recommendedTeam: `${incident.type === 'Flood' ? 'Water Rescue Unit' : incident.type === 'Fire' ? 'Fire & Hazmat Group' : 'Severe Engineering Squad'} (S-${Math.floor(1 + Math.random() * 9)})`,
    assignedTeam: "",
    status: "Awaiting Assignment",
    eta: `${Math.floor(5 + Math.random() * 15)} Mins`,
    summary: `Emergency intelligence dispatch triggered. Live telemetry reports ${incident.peopleDetected} active citizens detected in immediate vector.`,
    aiFindings: `Vision feed indicates: ${incident.peopleDetected} civilians, with ${incident.childrenDetected} minors. Water-level state: ${incident.waterLevel}. Recommended vector path extracted.`,
    riskAssessment: incident.severity === 'Critical' ? "Extreme threat to human life. Highly volatile localized micro-structure threat level. Rapid reaction necessary." : "Moderate operational threat. Structural degradation or flooding is scaling up.",
    affectedPopulation: incident.peopleDetected,
    requiredResources: incident.type === 'Flood' ? ["Rescue Boat", "Wading Suits", "PFD Gear"] : incident.type === 'Fire' ? ["Extinguishers", "Mask Gear", "Pneumatic Cutters"] : ["Jackhammers", "Debris Shovels", "Sensors"],
    recommendedResponsePlan: [
      "Establish primary ingress sector",
      "Deploy visual thermal drones for precise coordinates",
      "Extract survivors via perimeter sweep"
    ],
    timeline: [
      { time: "0M ago", event: "Intelligence converted to Active Rescue Mission briefing." }
    ]
  };

  missions.push(newMission);
  res.status(201).json(newMission);
});

// Get alerts & broadcasts
app.get('/api/broadcasts', (req, res) => {
  res.json(broadcasts);
});

// Create a new broadcast alert
app.post('/api/broadcasts', (req, res) => {
  const { type, title, message, area, sentBy } = req.body;
  const newAlert: Alert = {
    id: `ALR-${Math.floor(500 + Math.random() * 499)}`,
    type,
    title,
    message,
    area,
    timestamp: new Date().toISOString(),
    sentBy: sentBy || "EOC Communications"
  };
  broadcasts.unshift(newAlert);
  res.status(201).json(newAlert);
});

// AI Citizen Verification & Reporting Endpoints
app.post('/api/citizens/report', async (req, res) => {
  const { description, locationInput, imageBase64 } = req.body;
  
  if (!description) {
    return res.status(400).json({ error: "Description is required for incident analysis" });
  }

  const ai = getGeminiClient();
  let aiReport: any = null;

  if (ai) {
    try {
      console.log("Analyzing citizen report with Gemini AI model...");
      
      const systemPrompt = `You are the core AI Engine for "Panic Sense" - an Emergency Intelligence System.
Analyze the user's disaster description and provide a highly accurate, structured JSON object outlining critical rescue metrics.
You MUST classify the incident into one of the following exact 'type' categories: 'Flood', 'Road Collapse', 'Fire', 'Earthquake', 'Building Damage'. If not specified, map to the closest logical category.
Determine the 'severity' as either: 'Critical', 'High', 'Medium', 'Low'.
Extract geographic or textual location names if found.
Return estimated people detected and children detected (set to 0 if not logical).
If 'type' is 'Flood', waterLevel must be: 'High', 'Medium', 'Low'. Otherwise force 'N/A'.
Provide an estimated confidence score (between 70 and 100), a calculated priorityScore (between 10 and 100 based on severity, people, children, water levels), a concise 'recommendedAction', and a logical 3-bullet list 'reasoning' justifying the priority.`;

      const contents: any[] = [];
      if (imageBase64) {
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64.split(',')[1] || imageBase64
          }
        });
      }
      contents.push({ text: `Citizen report text: "${description}"\nLocation provided by user: "${locationInput || 'Unknown'}"` });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "One of: Flood, Road Collapse, Fire, Earthquake, Building Damage" },
              severity: { type: Type.STRING, description: "One of: Critical, High, Medium, Low" },
              confidence: { type: Type.INTEGER, description: "AI confidence percent (70 to 99)" },
              priorityScore: { type: Type.INTEGER, description: "Mission priority index (10 to 100)" },
              peopleDetected: { type: Type.INTEGER, description: "Estimated people trapped or affected" },
              childrenDetected: { type: Type.INTEGER, description: "Estimated children affected" },
              waterLevel: { type: Type.STRING, description: "One of: High, Medium, Low, N/A" },
              recommendedAction: { type: Type.STRING, description: "Recommended squad action" },
              reasoning: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 structured bullets explaining AI analysis priority factors"
              }
            },
            required: ["type", "severity", "confidence", "priorityScore", "peopleDetected", "childrenDetected", "waterLevel", "recommendedAction", "reasoning"]
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      aiReport = parsed;
    } catch (err: any) {
      console.error("Gemini API call failed, invoking advanced rule-based EOC parser fallback:", err.message);
    }
  }

  // Rule-based Fallback AI or when API Key is missing
  if (!aiReport) {
    const descLower = description.toLowerCase();
    let type: IncidentType = "Flood";
    let severity: SeverityLevel = "Medium";
    let priorityScore = 65;
    let peopleDetected = 1;
    let childrenDetected = 0;
    let waterLevel: 'High' | 'Medium' | 'Low' | 'N/A' = "N/A";
    let recommendedAction = "Deploy Local Response Team";
    let reasoning = ["Awaiting manual validation by command staff", "Automated alert generated", "Standard local response scheduled"];

    if (descLower.includes("water") || descLower.includes("flood") || descLower.includes("drown") || descLower.includes("rain") || descLower.includes("river")) {
      type = "Flood";
      waterLevel = descLower.includes("waist") || descLower.includes("roof") || descLower.includes("chest") ? "High" : "Medium";
      severity = waterLevel === "High" ? "Critical" : "High";
      priorityScore = waterLevel === "High" ? 90 : 75;
      recommendedAction = "Deploy Water Rescue Unit with Inflatables";
      reasoning = [
        "Hydrological hazard vector identified from report keywords.",
        "Commuter path or baseline structures submerged.",
        "Recommended for rapid deployment of dinghy or heavy pumps."
      ];
    } else if (descLower.includes("fire") || descLower.includes("smoke") || descLower.includes("burn") || descLower.includes("explosion")) {
      type = "Fire";
      severity = descLower.includes("stuck") || descLower.includes("trapped") ? "Critical" : "High";
      priorityScore = severity === "Critical" ? 94 : 80;
      recommendedAction = "Deploy Fire & Hazmat Group + Ambulances";
      reasoning = [
        "Combustion dynamics indicated in reports.",
        "Severe structural heat load and smoke threat model triggered.",
        "Adjacent high-density buildings within hazard radius."
      ];
    } else if (descLower.includes("collapse") || descLower.includes("sinkhole") || descLower.includes("road") || descLower.includes("pit")) {
      type = "Road Collapse";
      severity = "High";
      priorityScore = 72;
      recommendedAction = "Deploy Structural Civil Engineering Unit";
      reasoning = [
        "Transportation lane failure reported.",
        "Erosion threat underneath surrounding asphalt identified.",
        "Geotechnical stability check indicated."
      ];
    } else if (descLower.includes("crack") || descLower.includes("damage") || descLower.includes("shaking") || descLower.includes("earthquake")) {
      type = descLower.includes("earthquake") ? "Earthquake" : "Building Damage";
      severity = descLower.includes("collapse") ? "Critical" : "Medium";
      priorityScore = severity === "Critical" ? 91 : 55;
      recommendedAction = "Deploy Heavy Structural Engineers & SAR K9 Units";
      reasoning = [
        "Seismic shake or architectural structural fatigue symptoms reported.",
        "Debris fall hazard threatening perimeter pathways.",
        "Evacuation mapping of local occupants triggered."
      ];
    }

    if (descLower.includes("kid") || descLower.includes("child") || descLower.includes("baby") || descLower.includes("son") || descLower.includes("daughter")) {
      childrenDetected = 1;
      peopleDetected += 1;
      priorityScore = Math.min(100, priorityScore + 10);
      reasoning.unshift("Minors/Children reported on site: elevated child victim threat index.");
    }

    if (descLower.includes("trap") || descLower.includes("save") || descLower.includes("help") || descLower.includes("stuck")) {
      peopleDetected += Math.floor(Math.random() * 4) + 2;
      priorityScore = Math.min(100, priorityScore + 8);
      reasoning.push("Command warning: Occupants actively stranded inside danger zone.");
    }

    aiReport = {
      type,
      severity,
      confidence: Math.floor(82 + Math.random() * 15),
      priorityScore,
      peopleDetected,
      childrenDetected,
      waterLevel,
      recommendedAction,
      reasoning: reasoning.slice(0, 3)
    };
  }

  // Create real incident from citizen report
  const latOffset = (Math.random() - 0.5) * 0.05;
  const lngOffset = (Math.random() - 0.5) * 0.05;
  
  // Coordinates in Bangalore
  const baseLat = 12.9716;
  const baseLng = 77.5946;

  const newIncident: Incident = {
    id: `INC-${Math.floor(200 + Math.random() * 800)}`,
    image: imageBase64 || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600",
    type: aiReport.type,
    severity: aiReport.severity,
    confidence: aiReport.confidence,
    location: locationInput || "General Sector, Bangalore",
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset,
    time: new Date().toISOString(),
    verification: "Pending",
    duplicates: 0,
    peopleDetected: aiReport.peopleDetected || 1,
    childrenDetected: aiReport.childrenDetected || 0,
    waterLevel: aiReport.waterLevel || "N/A",
    recommendedAction: aiReport.recommendedAction,
    priorityScore: aiReport.priorityScore,
    reasoning: aiReport.reasoning
  };

   incidents.unshift(newIncident);
  evaluateGeofenceBreaches();
  res.status(201).json({ report: aiReport, createdIncident: newIncident });
});

async function startServer() {
  // Setup Vite middleware for development or Static Assets for production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Panic Sense Core dynamic backend listening on port ${PORT}`);
  });
}

startServer();
