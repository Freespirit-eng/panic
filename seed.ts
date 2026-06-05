import { Incident, Volunteer, Geofence, User } from './src/shared/types';

export const seededOperators: User[] = [
  {
    id: 'USR-001',
    username: 'operator_adam',
    email: 'adam@panicsense.gov',
    role: 'operator'
  },
  {
    id: 'USR-002',
    username: 'operator_eve',
    email: 'eve@panicsense.gov',
    role: 'operator'
  }
];

export const seededVolunteers: Volunteer[] = [
  {
    id: 'VOL-001',
    name: 'Sarah Connor',
    phone: '555-0199',
    location: { lat: 37.7758, lng: -122.4132, address: 'SOMA, San Francisco' },
    status: 'Available',
    skills: ['First Aid', 'Search and Rescue', 'Radio Communications'],
    equipment: ['4x4 Vehicle', 'First Aid Kit'],
    notifyRadiusKm: 5,
    receivedAlerts: []
  },
  {
    id: 'VOL-002',
    name: 'John Doe',
    phone: '555-0245',
    location: { lat: 37.7891, lng: -122.4014, address: 'Downtown, San Francisco' },
    status: 'Available',
    skills: ['Swiftwater Rescue', 'Paramedic'],
    equipment: ['Inflatable Kayak', 'Trauma Kit'],
    notifyRadiusKm: 10,
    receivedAlerts: []
  },
  {
    id: 'VOL-003',
    name: 'Marcus Wright',
    phone: '555-0312',
    location: { lat: 37.7601, lng: -122.4389, address: 'Castro, San Francisco' },
    status: 'Offline',
    skills: ['Debris Removal', 'Heavy Machinery'],
    equipment: ['Chainsaw'],
    notifyRadiusKm: 3,
    receivedAlerts: []
  },
  {
    id: 'VOL-004',
    name: 'Ellen Ripley',
    phone: '555-0422',
    location: { lat: 37.7544, lng: -122.4478, address: 'Twin Peaks, San Francisco' },
    status: 'Available',
    skills: ['Hazardous Materials', 'Structural Assessment'],
    equipment: ['Exosuit Loader', 'Thermal Camera'],
    notifyRadiusKm: 8,
    receivedAlerts: []
  },
  {
    id: 'VOL-005',
    name: 'Kyle Reese',
    phone: '555-0567',
    location: { lat: 37.7431, lng: -122.4211, address: 'Bernal Heights, San Francisco' },
    status: 'Available',
    skills: ['Tactical Navigation', 'Disaster Prep'],
    equipment: ['Survival Kit', 'Flashlight Array'],
    notifyRadiusKm: 6,
    receivedAlerts: []
  },
  {
    id: 'VOL-006',
    name: 'Peter Parker',
    phone: '555-0688',
    location: { lat: 37.7915, lng: -122.4156, address: 'Nob Hill, San Francisco' },
    status: 'Available',
    skills: ['Climbing', 'High-Angle Rescue'],
    equipment: ['Ropes & Harnesses'],
    notifyRadiusKm: 12,
    receivedAlerts: []
  },
  {
    id: 'VOL-007',
    name: 'Bruce Wayne',
    phone: '555-0777',
    location: { lat: 37.8012, lng: -122.4378, address: 'Marina District, San Francisco' },
    status: 'Offline',
    skills: ['Crisis Management', 'Advanced Flight Logistics'],
    equipment: ['Heavy Drone Response Rig', 'Satellite Uplink'],
    notifyRadiusKm: 15,
    receivedAlerts: []
  },
  {
    id: 'VOL-008',
    name: 'Clark Kent',
    phone: '555-0811',
    location: { lat: 37.7699, lng: -122.4468, address: 'Haight-Ashbury, San Francisco' },
    status: 'Available',
    skills: ['Heavy Lifting', 'Triage Assessment'],
    equipment: ['Mobile Generators'],
    notifyRadiusKm: 10,
    receivedAlerts: []
  },
  {
    id: 'VOL-009',
    name: 'Diana Prince',
    phone: '555-0922',
    location: { lat: 37.7785, lng: -122.3892, address: 'Mission Bay, San Francisco' },
    status: 'Available',
    skills: ['First Aid Coordination', 'Crisis Counseling'],
    equipment: ['Emergency Medical Station'],
    notifyRadiusKm: 5,
    receivedAlerts: []
  },
  {
    id: 'VOL-010',
    name: 'Arthur Curry',
    phone: '555-1033',
    location: { lat: 37.8077, lng: -122.4752, address: 'Presidio, San Francisco' },
    status: 'Available',
    skills: ['Marine Surveying', 'Swiftwater Logistics'],
    equipment: ['Motorboat Trailer', 'Diving Gear'],
    notifyRadiusKm: 15,
    receivedAlerts: []
  }
];

export const seededGeofences: Geofence[] = [
  {
    id: 'GEO-001',
    name: 'Mission Flood Watch Zone',
    location: { lat: 37.7749, lng: -122.4194, address: 'Mission District Center' },
    radiusKm: 1.5,
    severityLimit: 'High',
    status: 'Breached'
  },
  {
    id: 'GEO-002',
    name: 'Golden Gate Wildfire Buffer',
    location: { lat: 37.7849, lng: -122.4294, address: 'GG Park East' },
    radiusKm: 2.0,
    severityLimit: 'Critical',
    status: 'Monitoring'
  },
  {
    id: 'GEO-003',
    name: 'Downtown Structural Watch',
    location: { lat: 37.7891, lng: -122.4014, address: 'SF Downtown Center' },
    radiusKm: 1.0,
    severityLimit: 'All',
    status: 'Normal'
  },
  {
    id: 'GEO-004',
    name: 'Twin Peaks Seismic Buffer',
    location: { lat: 37.7544, lng: -122.4478, address: 'Twin Peaks Summit' },
    radiusKm: 3.5,
    severityLimit: 'Critical',
    status: 'Normal'
  },
  {
    id: 'GEO-005',
    name: 'Marina Liquefaction Zone',
    location: { lat: 37.8012, lng: -122.4378, address: 'Marina Shoreline' },
    radiusKm: 2.5,
    severityLimit: 'Medium',
    status: 'Monitoring'
  }
];

// Generates 30 realistic mock incidents around San Francisco
export function generateSeededIncidents(): Incident[] {
  const incidentTypes: ('Flood' | 'Road Collapse' | 'Fire' | 'Earthquake' | 'Building Damage')[] = [
    'Flood', 'Road Collapse', 'Fire', 'Earthquake', 'Building Damage'
  ];
  const severities: ('Critical' | 'High' | 'Medium' | 'Low')[] = [
    'Critical', 'High', 'Medium', 'Low'
  ];
  const locations = [
    { lat: 37.7749, lng: -122.4194, address: 'Mission District' },
    { lat: 37.7849, lng: -122.4294, address: 'Golden Gate Park' },
    { lat: 37.7649, lng: -122.4094, address: 'Highway 101 Onramp' },
    { lat: 37.7891, lng: -122.4014, address: 'Financial District' },
    { lat: 37.8012, lng: -122.4378, address: 'Marina Boulevard' },
    { lat: 37.7544, lng: -122.4478, address: 'Twin Peaks Reservoir' },
    { lat: 37.7699, lng: -122.4468, address: 'Haight-Ashbury' },
    { lat: 37.7785, lng: -122.3892, address: 'Mission Bay Pier' },
    { lat: 37.8077, lng: -122.4752, address: 'Golden Gate Bridge Entrance' },
    { lat: 37.7301, lng: -122.4002, address: 'Bayview Industrial Park' }
  ];

  const list: Incident[] = [];

  for (let i = 1; i <= 30; i++) {
    const locIndex = (i - 1) % locations.length;
    const type = incidentTypes[i % incidentTypes.length];
    const severity = severities[i % severities.length];
    const baseLoc = locations[locIndex];
    
    // Slight offset to distribute pins
    const lat = baseLoc.lat + (Math.random() - 0.5) * 0.01;
    const lng = baseLoc.lng + (Math.random() - 0.5) * 0.01;

    list.push({
      id: `INC-${String(i).padStart(3, '0')}`,
      type,
      severity,
      confidence: Math.floor(Math.random() * 25) + 75, // 75% to 99%
      location: {
        lat,
        lng,
        address: `${baseLoc.address} - Sector ${String.fromCharCode(65 + (i % 6))}`
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
        `High density zone alert triggered for [${type}]`,
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
  console.log('--- PANICSENSE SEED GENERATOR ---');
  console.log(`Operators created: ${seededOperators.length}`);
  console.log(`Volunteers created: ${seededVolunteers.length}`);
  console.log(`Geofences created: ${seededGeofences.length}`);
  const incidents = generateSeededIncidents();
  console.log(`Incidents created: ${incidents.length}`);
  console.log('Seeding data structures prepared successfully.');
}
