export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type IncidentType = 'Flood' | 'Road Collapse' | 'Fire' | 'Earthquake' | 'Building Damage';

export type VerificationStatus = 'Verified' | 'Pending' | 'Flagged';

export type MissionStatus = 'Awaiting Assignment' | 'Dispatched' | 'En Route' | 'Active' | 'Resolved';

export type GeofenceStatus = 'Normal' | 'Monitoring' | 'Breached';

export type HotspotRiskLevel = 'Severe' | 'Elevated' | 'Cautionary';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Incident {
  id: string;
  image?: string;
  type: IncidentType;
  severity: SeverityLevel;
  confidence: number;
  location: Location;
  timestamp: string;
  verification: VerificationStatus;
  duplicates: number;
  peopleDetected: number;
  childrenDetected: number;
  waterLevel: 'High' | 'Medium' | 'Low' | 'N/A';
  recommendedAction: string;
  priorityScore: number;
  reasoning: string[];
}

export interface VolunteerAlertNotification {
  id: string;
  incidentId: string;
  title: string;
  message: string;
  distanceKm: number;
  timestamp: string;
  severity: SeverityLevel;
  accepted: boolean;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  location: Location;
  status: 'Available' | 'On Mission' | 'Offline';
  skills: string[];
  equipment: string[];
  notifyRadiusKm: number;
  receivedAlerts: VolunteerAlertNotification[];
  age?: number;
  gender?: string;
}

export interface MissionTimelineEvent {
  timestamp: string;
  event: string;
}

export interface Mission {
  id: string;
  incidentId: string;
  location: Location;
  type: IncidentType;
  severity: SeverityLevel;
  recommendedTeam: string;
  assignedTeam: string;
  status: MissionStatus;
  eta: string;
  summary: string;
  aiFindings: string;
  riskAssessment: string;
  affectedPopulation: number;
  requiredResources: string[];
  recommendedResponsePlan: string[];
  timeline: MissionTimelineEvent[];
}

export interface Broadcast {
  id: string;
  type: 'Emergency Alert' | 'Evacuation Notice' | 'Road Closure' | 'Rescue Update';
  title: string;
  message: string;
  area: string;
  timestamp: string;
  sentBy: string;
}

export interface Geofence {
  id: string;
  name: string;
  location: Location;
  radiusKm: number;
  severityLimit: SeverityLevel | 'All';
  status: GeofenceStatus;
}

export interface Hotspot {
  id: string;
  name: string;
  location: Location;
  riskLevel: HotspotRiskLevel;
  riskScore: number;
  type: IncidentType | 'Multi-Hazard';
  escalationProbability: number;
  triggerFactors: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  message: string;
  timestamp: string;
  contextSources?: string[];
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: IncidentType | 'General Safety';
  content: string;
  tags: string[];
}

export interface IncidentEmbedding {
  incidentId: string;
  vector: number[];
  modelSignature: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DuplicateResult {
  isDuplicate: boolean;
  confidence: number;
  matchedIncidentId?: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: IncidentType | 'General Safety';
  content: string;
  tags: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'citizen' | 'volunteer' | 'operator' | 'admin';
  passwordHash?: string;
}


