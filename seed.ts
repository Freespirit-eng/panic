import { Incident, Volunteer, Geofence, User } from './src/shared/types';

export const seededOperators: User[] = [
  {
    id: 'USR-001',
    username: 'operator_ravi',
    email: 'ravi@panicsense.gov',
    role: 'operator'
  },
  {
    id: 'USR-002',
    username: 'operator_priya',
    email: 'priya@panicsense.gov',
    role: 'operator'
  }
];

export const seededVolunteers: Volunteer[] = [
  {
    id: 'VOL-001',
    name: 'Arjun Sharma',
    phone: '+91-98451-00111',
    location: { lat: 12.9716, lng: 77.5946, address: 'MG Road, Bengaluru' },
    status: 'Available',
    skills: ['First Aid', 'Search and Rescue', 'Radio Communications'],
    equipment: ['4x4 Vehicle', 'First Aid Kit'],
    notifyRadiusKm: 5,
    receivedAlerts: []
  },
  {
    id: 'VOL-002',
    name: 'Priya Nair',
    phone: '+91-98452-00222',
    location: { lat: 12.9856, lng: 77.6064, address: 'Indiranagar, Bengaluru' },
    status: 'Available',
    skills: ['Paramedic', 'Triage Assessment', 'Crisis Counseling'],
    equipment: ['Trauma Kit', 'Emergency Medical Station'],
    notifyRadiusKm: 8,
    receivedAlerts: []
  },
  {
    id: 'VOL-003',
    name: 'Suresh Babu',
    phone: '+91-98453-00333',
    location: { lat: 12.9279, lng: 77.6271, address: 'Koramangala, Bengaluru' },
    status: 'On Mission',
    skills: ['Debris Removal', 'Heavy Machinery', 'Structural Assessment'],
    equipment: ['Chainsaw', 'Hydraulic Spreader'],
    notifyRadiusKm: 4,
    receivedAlerts: []
  },
  {
    id: 'VOL-004',
    name: 'Divya Menon',
    phone: '+91-98454-00444',
    location: { lat: 12.9352, lng: 77.6245, address: 'HSR Layout, Bengaluru' },
    status: 'Available',
    skills: ['Hazardous Materials', 'Structural Assessment', 'Fire Safety'],
    equipment: ['Thermal Camera', 'HazMat Suit'],
    notifyRadiusKm: 6,
    receivedAlerts: []
  },
  {
    id: 'VOL-005',
    name: 'Rajan Pillai',
    phone: '+91-98455-00555',
    location: { lat: 13.0358, lng: 77.5970, address: 'Hebbal, Bengaluru' },
    status: 'Available',
    skills: ['Tactical Navigation', 'Disaster Preparedness', 'Field Coordination'],
    equipment: ['Survival Kit', 'Flashlight Array', 'Walkie-Talkie Set'],
    notifyRadiusKm: 7,
    receivedAlerts: []
  },
  {
    id: 'VOL-006',
    name: 'Kavitha Reddy',
    phone: '+91-98456-00666',
    location: { lat: 12.9165, lng: 77.6101, address: 'BTM Layout, Bengaluru' },
    status: 'Available',
    skills: ['Climbing', 'High-Angle Rescue', 'Rope Operations'],
    equipment: ['Ropes & Harnesses', 'Carabiners'],
    notifyRadiusKm: 10,
    receivedAlerts: []
  },
  {
    id: 'VOL-007',
    name: 'Vikram Anand',
    phone: '+91-98457-00777',
    location: { lat: 13.0012, lng: 77.5800, address: 'Malleshwaram, Bengaluru' },
    status: 'Offline',
    skills: ['Crisis Management', 'Drone Operations', 'Aerial Surveillance'],
    equipment: ['Heavy Drone Response Rig', 'Satellite Uplink'],
    notifyRadiusKm: 15,
    receivedAlerts: []
  },
  {
    id: 'VOL-008',
    name: 'Sneha Iyer',
    phone: '+91-98458-00888',
    location: { lat: 12.9550, lng: 77.5533, address: 'Jayanagar, Bengaluru' },
    status: 'Available',
    skills: ['Community Coordination', 'Triage Assessment', 'First Aid'],
    equipment: ['Mobile Generators', 'Public Address System'],
    notifyRadiusKm: 5,
    receivedAlerts: []
  },
  {
    id: 'VOL-009',
    name: 'Karthik Subramanian',
    phone: '+91-98459-00999',
    location: { lat: 12.9762, lng: 77.7012, address: 'Whitefield, Bengaluru' },
    status: 'Available',
    skills: ['IT & Communications', 'Disaster Logistics'],
    equipment: ['Emergency Comms Server', 'Satellite Phone'],
    notifyRadiusKm: 8,
    receivedAlerts: []
  },
  {
    id: 'VOL-010',
    name: 'Ananya Krishnan',
    phone: '+91-98451-01010',
    location: { lat: 13.0100, lng: 77.6500, address: 'Yelahanka, Bengaluru' },
    status: 'Available',
    skills: ['Swiftwater Rescue', 'Marine Operations', 'Flood Response'],
    equipment: ['Inflatable Rescue Boat', 'Diving Gear', 'Life Vests'],
    notifyRadiusKm: 12,
    receivedAlerts: []
  }
];

export const seededGeofences: Geofence[] = [
  {
    id: 'GEO-001',
    name: 'Bellandur Lake Flood Watch',
    location: { lat: 12.9352, lng: 77.6763, address: 'Bellandur Lake, Bengaluru' },
    radiusKm: 2.0,
    severityLimit: 'High',
    status: 'Breached'
  },
  {
    id: 'GEO-002',
    name: 'Electronic City Landslide Buffer',
    location: { lat: 12.8458, lng: 77.6638, address: 'Electronic City Phase 1, Bengaluru' },
    radiusKm: 1.5,
    severityLimit: 'Critical',
    status: 'Monitoring'
  },
  {
    id: 'GEO-003',
    name: 'MG Road Structural Watch',
    location: { lat: 12.9716, lng: 77.6121, address: 'MG Road Metro Corridor, Bengaluru' },
    radiusKm: 0.8,
    severityLimit: 'All',
    status: 'Normal'
  },
  {
    id: 'GEO-004',
    name: 'Hebbal Flyover Seismic Buffer',
    location: { lat: 13.0358, lng: 77.5970, address: 'Hebbal Flyover, Bengaluru' },
    radiusKm: 3.0,
    severityLimit: 'Critical',
    status: 'Normal'
  },
  {
    id: 'GEO-005',
    name: 'Varthur Lake Overflow Zone',
    location: { lat: 12.9447, lng: 77.7511, address: 'Varthur Lake, Bengaluru' },
    radiusKm: 2.5,
    severityLimit: 'Medium',
    status: 'Monitoring'
  }
];

// Generates 30 realistic mock incidents around Bengaluru
export function generateSeededIncidents(): Incident[] {
  const incidentTypes: ('Flood' | 'Road Collapse' | 'Fire' | 'Earthquake' | 'Building Damage')[] = [
    'Flood', 'Road Collapse', 'Fire', 'Earthquake', 'Building Damage'
  ];
  const severities: ('Critical' | 'High' | 'Medium' | 'Low')[] = [
    'Critical', 'High', 'Medium', 'Low'
  ];
  const locations = [
    { lat: 12.9716, lng: 77.5946, address: 'MG Road' },
    { lat: 12.9856, lng: 77.6064, address: 'Indiranagar' },
    { lat: 12.9279, lng: 77.6271, address: 'Koramangala' },
    { lat: 12.9352, lng: 77.6763, address: 'Bellandur' },
    { lat: 13.0358, lng: 77.5970, address: 'Hebbal' },
    { lat: 12.9550, lng: 77.5533, address: 'Jayanagar' },
    { lat: 13.0012, lng: 77.5800, address: 'Malleshwaram' },
    { lat: 12.9762, lng: 77.7012, address: 'Whitefield' },
    { lat: 12.8458, lng: 77.6638, address: 'Electronic City' },
    { lat: 12.9165, lng: 77.6101, address: 'BTM Layout' }
  ];

  const list: Incident[] = [];

  for (let i = 1; i <= 30; i++) {
    const locIndex = (i - 1) % locations.length;
    const type = incidentTypes[i % incidentTypes.length];
    const severity = severities[i % severities.length];
    const baseLoc = locations[locIndex];

    // Slight offset to distribute pins
    const lat = baseLoc.lat + (Math.random() - 0.5) * 0.015;
    const lng = baseLoc.lng + (Math.random() - 0.5) * 0.015;

    list.push({
      id: `INC-${String(i).padStart(3, '0')}`,
      type,
      severity,
      confidence: Math.floor(Math.random() * 25) + 75,
      location: {
        lat,
        lng,
        address: `${baseLoc.address} - Sector ${String.fromCharCode(65 + (i % 6))}, Bengaluru`
      },
      timestamp: new Date(Date.now() - 1000 * 60 * (i * 20)).toISOString(),
      verification: i % 4 === 0 ? 'Verified' : (i % 5 === 0 ? 'Flagged' : 'Pending'),
      duplicates: i % 8 === 0 ? Math.floor(Math.random() * 3) + 1 : 0,
      peopleDetected: Math.floor(Math.random() * 12),
      childrenDetected: Math.floor(Math.random() * 4),
      waterLevel: type === 'Flood' ? (i % 3 === 0 ? 'High' : 'Medium') : 'N/A',
      recommendedAction: `Standard response protocol for type [${type}]. Secure structural integrity and deploy zone monitors.`,
      priorityScore: Math.floor(Math.random() * 40) + (severity === 'Critical' ? 60 : (severity === 'High' ? 40 : 20)),
      reasoning: [
        `High density zone alert triggered for [${type}] in Bengaluru urban area`,
        `Estimated casualties/affected counts detected by image analysis: ${Math.floor(Math.random() * 10)}`
      ]
    });
  }

  return list;
}

// ES module equivalent of require.main === module
import { fileURLToPath } from 'url';
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  console.log('--- PANICSENSE SEED GENERATOR (Bengaluru) ---');
  console.log(`Operators created: ${seededOperators.length}`);
  console.log(`Volunteers created: ${seededVolunteers.length}`);
  console.log(`Geofences created: ${seededGeofences.length}`);
  const incidents = generateSeededIncidents();
  console.log(`Incidents created: ${incidents.length}`);
  console.log('Seeding data structures prepared successfully.');
}