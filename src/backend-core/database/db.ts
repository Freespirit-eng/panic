import { 
  Incident, 
  Volunteer, 
  Mission, 
  Broadcast, 
  Geofence, 
  ChatMessage, 
  KnowledgeDocument,
  User
} from '../../shared/types';
import { generateSeededIncidents, seededVolunteers, seededGeofences } from '../../../seed';

export class InMemoryDB {
  private static instance: InMemoryDB;

  public incidents: Incident[] = [];
  public volunteers: Volunteer[] = [];
  public missions: Mission[] = [];
  public broadcasts: Broadcast[] = [];
  public geofences: Geofence[] = [];
  public chatMessages: ChatMessage[] = [];
  public knowledgeDocuments: KnowledgeDocument[] = [];
  public users: User[] = [];

  private constructor() {
    this.seed();
  }

  public static getInstance(): InMemoryDB {
    if (!InMemoryDB.instance) {
      InMemoryDB.instance = new InMemoryDB();
    }
    return InMemoryDB.instance;
  }

  private seed() {
    // 1. Seed Incidents
    this.incidents = generateSeededIncidents();

    // 2. Seed Volunteers
    this.volunteers = seededVolunteers;

    // 3. Seed Missions
    this.missions = [
      {
        id: 'MIS-001',
        incidentId: 'INC-001',
        location: { lat: 37.7749, lng: -122.4194, address: 'Mission District, San Francisco' },
        type: 'Flood',
        severity: 'Critical',
        recommendedTeam: 'Swiftwater Unit A & Medical Support',
        assignedTeam: 'Rescue Squad 3 & Paramedic Team 9',
        status: 'Active',
        eta: '8 mins',
        summary: 'Extracting 14 trapped civilians from residential roofs along 14th Street.',
        aiFindings: 'Flooding is deep and fast-moving. Highly recommend motorized rescue crafts.',
        riskAssessment: 'High risk of hypothermia and structural debris collisions.',
        affectedPopulation: 14,
        requiredResources: ['Zodiac Boat', 'Life Vests', 'Thermal Blankets', 'Trauma Kits'],
        recommendedResponsePlan: [
          'Deploy Zodiac rescue boat to hot zone.',
          'Secure anchor lines to structural pillars.',
          'Extract children and elderly first.',
          'Establish secondary triage point at 14th and Mission.'
        ],
        timeline: [
          { timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), event: 'Mission created via AI recommended response plan' },
          { timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), event: 'Rescue Squad 3 dispatched to location' },
          { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), event: 'Responders arrived on scene and launched inflatable craft' }
        ]
      }
    ];

    // 4. Seed Broadcasts
    this.broadcasts = [
      {
        id: 'BRD-001',
        type: 'Evacuation Notice',
        title: 'Flash Flood Evacuation - Mission District',
        message: 'Severe rising water in Mission District. Evacuate immediately to higher ground. Shelter point open at Bill Graham Civic Auditorium.',
        area: 'Mission District (between 14th St and 18th St)',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        sentBy: 'EOC Commander'
      }
    ];

    // 5. Seed Geofences
    this.geofences = seededGeofences;

    // 6. Seed Knowledge Articles
    this.knowledgeDocuments = [
      {
        id: 'KB-001',
        title: 'Swiftwater Evacuation Guidelines',
        category: 'Flood',
        content: 'During sudden floods, avoid walking or driving through water. Even 6 inches of moving water can knock you down, and 2 feet of water can sweep a vehicle away. If trapped in a building, move to the roof and signal for help.',
        tags: ['evacuation', 'flood', 'water-safety']
      },
      {
        id: 'KB-002',
        title: 'Brush Fire Safety Distances',
        category: 'Fire',
        content: 'Ensure a defensible space of at least 30 feet around structures. If evacuating, close all windows, shut off gas main valves, and wear heavy, non-synthetic clothing to protect from embers.',
        tags: ['wildfire', 'structure-defense', 'evacuation']
      }
    ];

    // 7. Seed Users (operators & admins)
    this.users = [
      {
        id: 'USR-001',
        username: 'operator_adam',
        email: 'adam@panicsense.gov',
        role: 'operator',
        passwordHash: '$2b$10$seededoperatorhashadam12345'
      },
      {
        id: 'USR-002',
        username: 'operator_eve',
        email: 'eve@panicsense.gov',
        role: 'operator',
        passwordHash: '$2b$10$seededoperatorhasheve12345'
      },
      {
        id: 'USR-003',
        username: 'admin_root',
        email: 'admin@panicsense.gov',
        role: 'admin',
        passwordHash: '$2b$10$seededadminhashroot12345'
      }
    ];
  }
}

export const db = InMemoryDB.getInstance();
