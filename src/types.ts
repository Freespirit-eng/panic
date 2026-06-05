export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type IncidentType = 'Flood' | 'Road Collapse' | 'Fire' | 'Earthquake' | 'Building Damage';

export type VerificationStatus = 'Verified' | 'Pending' | 'Flagged';

export interface Incident {
  id: string;
  image: string;
  type: IncidentType;
  severity: SeverityLevel;
  confidence: number; // e.g., 94
  location: string;
  lat: number;
  lng: number;
  time: string;
  verification: VerificationStatus;
  duplicates: number;
  peopleDetected: number;
  childrenDetected: number;
  waterLevel: 'High' | 'Medium' | 'Low' | 'N/A';
  recommendedAction: string;
  priorityScore: number;
  reasoning: string[];
}

export interface Mission {
  id: string;
  incidentId: string;
  location: string;
  type: IncidentType;
  severity: SeverityLevel;
  recommendedTeam: string;
  assignedTeam: string;
  status: 'Awaiting Assignment' | 'Dispatched' | 'En Route' | 'Active' | 'Resolved';
  eta: string;
  summary: string;
  aiFindings: string;
  riskAssessment: string;
  affectedPopulation: number;
  requiredResources: string[];
  recommendedResponsePlan: string[];
  timeline: { time: string; event: string }[];
}

export interface Alert {
  id: string;
  type: 'Emergency Alert' | 'Evacuation Notice' | 'Road Closure' | 'Rescue Update';
  title: string;
  message: string;
  area: string;
  timestamp: string;
  sentBy: string;
}

export interface EOCStats {
  activeIncidents: number;
  criticalEmergencies: number;
  respondersDeployed: number;
  citizensImpacted: number;
  aiVerifiedReports: number;
}

export interface Geofence {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  severityLimit: SeverityLevel | 'All';
  status: 'Normal' | 'Monitoring' | 'Breached';
}

export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  riskLevel: 'Severe' | 'Elevated' | 'Cautionary';
  riskScore: number; // e.g. 88
  type: IncidentType | 'Multi-Hazard';
  escalationProbability: number; // e.g. 74
  triggerFactors: string[];
}

export interface SensorFeed {
  id: string;
  name: string;
  type: 'Precipitation Index' | 'Hydrological Sensor' | 'Seismic Tremor' | 'Thermal Drone Infra' | 'Structural Load';
  value: string;
  status: 'Normal' | 'Elevated' | 'Critical';
  sector: string;
}

export interface VolunteerAlertNotification {
  id: string;
  incidentId: string;
  title: string;
  message: string;
  distanceKm: number;
  time: string;
  severity: SeverityLevel;
  accepted?: boolean;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  status: 'Available' | 'On Mission' | 'Offline';
  skills: string[];
  equipment: string[];
  notifyRadiusKm: number;
  receivedAlerts: VolunteerAlertNotification[];
}


