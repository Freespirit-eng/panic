import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.resolve(__dirname, '../../database_store.json');

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
    const loaded = this.loadFromFile();
    if (!loaded) {
      this.seed();
      this.saveToFile();
    }
  }

  public save() {
    this.saveToFile();
  }

  private saveToFile() {
    try {
      const data = {
        incidents: this.incidents,
        volunteers: this.volunteers,
        missions: this.missions,
        broadcasts: this.broadcasts,
        geofences: this.geofences,
        chatMessages: this.chatMessages,
        knowledgeDocuments: this.knowledgeDocuments,
        users: this.users
      };
      // Ensure directory exists
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to save database to file:', err);
    }
  }

  private loadFromFile(): boolean {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        this.incidents = data.incidents || [];
        this.volunteers = data.volunteers || [];
        this.missions = data.missions || [];
        this.broadcasts = data.broadcasts || [];
        this.geofences = data.geofences || [];
        this.chatMessages = data.chatMessages || [];
        this.knowledgeDocuments = data.knowledgeDocuments || [];
        this.users = data.users || [];
        console.log('[DB] Loaded database from file:', DB_FILE_PATH);
        return true;
      }
    } catch (err) {
      console.error('[DB] Failed to load database from file:', err);
    }
    return false;
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
        location: { lat: 12.9352, lng: 77.6763, address: 'Bellandur Lake Vicinity, Bengaluru' },
        type: 'Flood',
        severity: 'Critical',
        recommendedTeam: 'Swiftwater Unit A & Medical Support',
        assignedTeam: 'BBMP Rescue Squad 3 & Paramedic Team 9',
        status: 'Active',
        eta: '8 mins',
        summary: 'Extracting 18 trapped civilians from residential areas near Bellandur Lake overflow zone.',
        aiFindings: 'Lake overflow is fast-moving along Sarjapur Road. Highly recommend motorized rescue crafts and elevated access routes.',
        riskAssessment: 'High risk of waterborne disease, structural debris collisions, and rapid water level rise.',
        affectedPopulation: 18,
        requiredResources: ['Inflatable Rescue Boat', 'Life Vests', 'Water Purification Tablets', 'Trauma Kits'],
        recommendedResponsePlan: [
          'Deploy inflatable rescue boat to Bellandur overflow hot zone.',
          'Secure anchor lines to elevated structures near Sarjapur Road.',
          'Extract children and elderly first from low-lying apartments.',
          'Establish secondary triage point at Brookefield Mall grounds.'
        ],
        timeline: [
          { timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), event: 'Mission created via AI recommended response plan' },
          { timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), event: 'BBMP Rescue Squad 3 dispatched to Bellandur location' },
          { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), event: 'Responders arrived on scene and launched inflatable rescue boat' }
        ]
      },
      {
        id: 'MIS-002',
        incidentId: 'INC-003',
        location: { lat: 12.9165, lng: 77.6101, address: 'BTM Layout 2nd Stage, Bengaluru' },
        type: 'Road Collapse',
        severity: 'High',
        recommendedTeam: 'Civil Engineering Response Unit & Traffic Control',
        assignedTeam: 'BBMP Infrastructure Team & Traffic Police',
        status: 'Dispatched',
        eta: '12 mins',
        summary: 'Road sinkhole on 80 Feet Road, BTM Layout, blocking major arterial route. 3 vehicles partially submerged.',
        aiFindings: 'Sinkhole approximately 4m diameter. Likely caused by underground water main burst from recent flooding.',
        riskAssessment: 'Risk of further collapse. Adjacent buildings may have compromised foundations.',
        affectedPopulation: 6,
        requiredResources: ['Excavator', 'Traffic Cones', 'Tow Trucks', 'Structural Assessment Kit'],
        recommendedResponsePlan: [
          'Immediately cordon off 100m radius around sinkhole.',
          'Extract vehicles and occupants safely.',
          'Assess structural integrity of adjacent buildings.',
          'Contact BWSSB to identify and shut off burst water main.'
        ],
        timeline: [
          { timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), event: 'Sinkhole reported by citizen via app' },
          { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), event: 'BBMP Infrastructure Team dispatched from Jayanagar depot' }
        ]
      }
    ];

    // 4. Seed Broadcasts
    this.broadcasts = [
      {
        id: 'BRD-001',
        type: 'Evacuation Notice',
        title: 'Flash Flood Evacuation - Bellandur & Sarjapur Road',
        message: 'Severe lake overflow detected near Bellandur Lake. Residents of Sarjapur Road, Haralur Road, and Marathahalli Bridge vicinity must evacuate immediately to higher ground. Emergency shelter open at Brookefield Mall Ground Floor and BBMP Community Hall, Varthur.',
        area: 'Bellandur, Sarjapur Road, Marathahalli (Bengaluru East)',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        sentBy: 'EOC Commander'
      },
      {
        id: 'BRD-002',
        type: 'Road Closure',
        title: 'Road Closure - BTM Layout 80 Feet Road Sinkhole',
        message: 'Major sinkhole detected on 80 Feet Road, BTM Layout 2nd Stage. Road closed between Silk Board Junction and BTM Bus Stop. Use Outer Ring Road or 100 Feet Road as alternate routes.',
        area: 'BTM Layout, Jayanagar, Bengaluru South',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        sentBy: 'Traffic Control Unit'
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
