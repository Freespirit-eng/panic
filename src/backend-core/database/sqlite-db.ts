/**
 * SQLiteDB — Drop-in replacement for InMemoryDB.
 * Stores all collections in a single SQLite file using better-sqlite3.
 * JSON blob per row maintains full backward-compatibility with all service files.
 */
import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import {
  Incident, Volunteer, Mission, Broadcast,
  Geofence, ChatMessage, KnowledgeDocument, User
} from '../../shared/types';
import { generateSeededIncidents, seededVolunteers, seededGeofences } from '../../../seed';

const DB_PATH    = path.resolve(process.cwd(), 'panicsense.db');

// ─── Seeded data (mirrors what InMemoryDB had inline) ─────────────────────────
const SEEDED_MISSIONS: Mission[] = [
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
    aiFindings: 'Lake overflow is fast-moving along Sarjapur Road. Highly recommend motorized rescue crafts.',
    riskAssessment: 'High risk of waterborne disease, structural debris collisions, and rapid water level rise.',
    affectedPopulation: 18,
    requiredResources: ['Inflatable Rescue Boat', 'Life Vests', 'Water Purification Tablets', 'Trauma Kits'],
    recommendedResponsePlan: [
      'Deploy inflatable rescue boat to Bellandur overflow hot zone.',
      'Secure anchor lines to elevated structures near Sarjapur Road.',
      'Extract children and elderly first from low-lying apartments.',
      'Establish secondary triage point at Brookefield Mall grounds.',
    ],
    timeline: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), event: 'Mission created via AI recommended response plan' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), event: 'BBMP Rescue Squad 3 dispatched to Bellandur location' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),  event: 'Responders arrived on scene and launched inflatable rescue boat' },
    ],
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
      'Contact BWSSB to identify and shut off burst water main.',
    ],
    timeline: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), event: 'Sinkhole reported by citizen via app' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), event: 'BBMP Infrastructure Team dispatched from Jayanagar depot' },
    ],
  },
];

const SEEDED_BROADCASTS: Broadcast[] = [
  {
    id: 'BRD-001',
    type: 'Evacuation Notice',
    title: 'Flash Flood Evacuation - Bellandur & Sarjapur Road',
    message: 'Severe lake overflow detected near Bellandur Lake. Residents must evacuate immediately to higher ground.',
    area: 'Bellandur, Sarjapur Road, Marathahalli (Bengaluru East)',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    sentBy: 'EOC Commander',
  },
  {
    id: 'BRD-002',
    type: 'Road Closure',
    title: 'Road Closure - BTM Layout 80 Feet Road Sinkhole',
    message: 'Major sinkhole on 80 Feet Road, BTM Layout 2nd Stage. Use Outer Ring Road as alternate route.',
    area: 'BTM Layout, Jayanagar, Bengaluru South',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    sentBy: 'Traffic Control Unit',
  },
];

const SEEDED_USERS: User[] = [
  { id: 'USR-001', username: 'operator_adam', email: 'adam@panicsense.gov',   role: 'operator',   passwordHash: 'SEED_REPLACE_ON_FIRST_RUN' },
  { id: 'USR-002', username: 'commander_eve',  email: 'eve@panicsense.gov',    role: 'commander',  passwordHash: 'SEED_REPLACE_ON_FIRST_RUN' },
  { id: 'USR-003', username: 'admin_root',     email: 'admin@panicsense.gov',  role: 'admin',      passwordHash: 'SEED_REPLACE_ON_FIRST_RUN' },
];

// ─── SQLiteDB class ───────────────────────────────────────────────────────────

export class SQLiteDB {
  private static instance: SQLiteDB;
  private sqlite: BetterSqlite3.Database;

  // In-memory mirrors — kept for full backward-compat with all service files
  public incidents:          Incident[]         = [];
  public volunteers:         Volunteer[]        = [];
  public missions:           Mission[]          = [];
  public broadcasts:         Broadcast[]        = [];
  public geofences:          Geofence[]         = [];
  public chatMessages:       ChatMessage[]      = [];
  public knowledgeDocuments: KnowledgeDocument[]= [];
  public users:              User[]             = [];

  private constructor() {
    this.sqlite = new BetterSqlite3(DB_PATH);
    this.sqlite.pragma('journal_mode = WAL');
    this.sqlite.pragma('foreign_keys = ON');
    this.createTables();
    this.loadAll();

    // Seed if first run
    if (this.incidents.length === 0) {
      console.log('[SQLiteDB] Empty database — seeding initial data...');
      this.seed();
      this.persistAll();
      console.log('[SQLiteDB] Seed complete.');
    } else {
      console.log(`[SQLiteDB] Loaded ${this.incidents.length} incidents, ${this.volunteers.length} volunteers from ${DB_PATH}`);
    }
  }

  // ─── Public API (mirrors InMemoryDB) ───────────────────────────────────────

  public save(): void {
    this.persistAll();
  }

  public close(): void {
    this.persistAll();
    this.sqlite.close();
  }

  public static getInstance(): SQLiteDB {
    if (!SQLiteDB.instance) {
      SQLiteDB.instance = new SQLiteDB();
    }
    return SQLiteDB.instance;
  }

  // ─── Schema ────────────────────────────────────────────────────────────────

  private createTables(): void {
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY, 
        severity TEXT, 
        timestamp TEXT, 
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS volunteers  (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS missions    (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS broadcasts  (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS geofences   (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS users       (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    `);

    // Schema migration helper
    try {
      this.sqlite.exec(`ALTER TABLE incidents ADD COLUMN severity TEXT;`);
    } catch (e) {}
    try {
      this.sqlite.exec(`ALTER TABLE incidents ADD COLUMN timestamp TEXT;`);
    } catch (e) {}
  }

  // ─── Load ──────────────────────────────────────────────────────────────────

  private loadAll(): void {
    this.incidents   = this.loadTable<Incident>('incidents');
    this.volunteers  = this.loadTable<Volunteer>('volunteers');
    this.missions    = this.loadTable<Mission>('missions');
    this.broadcasts  = this.loadTable<Broadcast>('broadcasts');
    this.geofences   = this.loadTable<Geofence>('geofences');
    this.users       = this.loadTable<User>('users');
  }

  private loadTable<T>(table: string): T[] {
    const rows = this.sqlite.prepare(`SELECT data FROM ${table} ORDER BY rowid`).all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data) as T);
  }

  // ─── Persist ───────────────────────────────────────────────────────────────

  private persistAll(): void {
    this.persistTable('incidents',  this.incidents);
    this.persistTable('volunteers', this.volunteers);
    this.persistTable('missions',   this.missions);
    this.persistTable('broadcasts', this.broadcasts);
    this.persistTable('geofences',  this.geofences);
    this.persistTable('users',      this.users);
  }

  private persistTable(table: string, items: Array<{ id: string }>): void {
    if (items.length === 0) {
      this.sqlite.prepare(`DELETE FROM ${table}`).run();
      return;
    }

    if (table === 'incidents') {
      const upsert = this.sqlite.prepare(`
        INSERT OR REPLACE INTO incidents (id, severity, timestamp, data) 
        VALUES (?, ?, ?, ?)
      `);
      const currentIds = items.map(i => i.id);

      const persist = this.sqlite.transaction(() => {
        const placeholders = currentIds.map(() => '?').join(',');
        this.sqlite.prepare(`DELETE FROM incidents WHERE id NOT IN (${placeholders})`).run(...currentIds);
        for (const item of items as Incident[]) {
          upsert.run(item.id, item.severity, item.timestamp, JSON.stringify(item));
        }
      });
      persist();
      return;
    }

    const upsert = this.sqlite.prepare(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`);
    const currentIds = items.map(i => i.id);

    const persist = this.sqlite.transaction(() => {
      // Remove deleted rows
      const placeholders = currentIds.map(() => '?').join(',');
      this.sqlite.prepare(`DELETE FROM ${table} WHERE id NOT IN (${placeholders})`).run(...currentIds);
      // Upsert all current items
      for (const item of items) {
        upsert.run(item.id, JSON.stringify(item));
      }
    });

    persist();
  }

  public queryIncidents(filters: { severity?: string; since?: string }): Incident[] {
    let sql = `SELECT data FROM incidents`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.severity) {
      conditions.push(`severity = ?`);
      params.push(filters.severity);
    }
    if (filters.since) {
      conditions.push(`timestamp >= ?`);
      params.push(filters.since);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }
    sql += ` ORDER BY timestamp DESC`;

    const rows = this.sqlite.prepare(sql).all(...params) as { data: string }[];
    return rows.map(r => JSON.parse(r.data) as Incident);
  }

  public runRawQuery(sql: string, params: any[] = []): any[] {
    return this.sqlite.prepare(sql).all(...params);
  }

  // ─── Seed ──────────────────────────────────────────────────────────────────

  private seed(): void {
    this.incidents   = generateSeededIncidents();
    this.volunteers  = seededVolunteers;
    this.missions    = SEEDED_MISSIONS;
    this.broadcasts  = SEEDED_BROADCASTS;
    this.geofences   = seededGeofences;
    this.users       = SEEDED_USERS;
  }
}

export const db = SQLiteDB.getInstance();
