import {
  Incident,
  Mission,
  MissionStatus,
  VerificationStatus,
  Geofence,
  Broadcast,
  Volunteer,
} from '../../shared/types';

const BASE_URL = 'http://localhost:3000/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  const json = await res.json();
  return json.data as T;
}

export const commanderApi = {
  // ─── Incidents ──────────────────────────────────────────────────────────────
  getIncidents: (): Promise<Incident[]> =>
    apiFetch<Incident[]>('/incidents'),

  getIncidentStats: (): Promise<{
    activeIncidents: number;
    criticalEmergencies: number;
    respondersDeployed: number;
    citizensImpacted: number;
    aiVerifiedReports: number;
  }> => apiFetch('/incidents/stats'),

  getIncidentById: (id: string): Promise<Incident> =>
    apiFetch<Incident>(`/incidents/${id}`),

  updateIncident: (id: string, data: Partial<Incident>): Promise<Incident> =>
    apiFetch<Incident>(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  verifyIncident: (id: string, verification: VerificationStatus): Promise<Incident> =>
    apiFetch<Incident>(`/incidents/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ verification }),
    }),

  deleteIncident: (id: string): Promise<void> =>
    apiFetch<void>(`/incidents/${id}`, { method: 'DELETE' }),

  mergeIncident: (id: string, targetIncidentId: string): Promise<void> =>
    apiFetch<void>(`/incidents/${id}/merge`, {
      method: 'POST',
      body: JSON.stringify({ targetIncidentId }),
    }),

  // ─── Missions ───────────────────────────────────────────────────────────────
  getMissions: (): Promise<Mission[]> =>
    apiFetch<Mission[]>('/missions'),

  getMissionById: (id: string): Promise<Mission> =>
    apiFetch<Mission>(`/missions/${id}`),

  createMission: (data: Partial<Mission>): Promise<Mission> =>
    apiFetch<Mission>('/missions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMissionStatus: (id: string, status: MissionStatus): Promise<Mission> =>
    apiFetch<Mission>(`/missions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // ─── Broadcasts ─────────────────────────────────────────────────────────────
  getBroadcasts: (): Promise<Broadcast[]> =>
    apiFetch<Broadcast[]>('/broadcasts'),

  getBroadcastQueue: (): Promise<unknown[]> =>
    apiFetch<unknown[]>('/broadcasts/queue'),

  sendBroadcast: (data: {
    type: string;
    title: string;
    message: string;
    area: string;
    delayMs?: number;
  }): Promise<Broadcast> =>
    apiFetch<Broadcast>('/broadcasts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ─── Geofences ──────────────────────────────────────────────────────────────
  getGeofences: (): Promise<Geofence[]> =>
    apiFetch<Geofence[]>('/geofences'),

  createGeofence: (data: Partial<Geofence>): Promise<Geofence> =>
    apiFetch<Geofence>('/geofences', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getVolunteers: (): Promise<Volunteer[]> =>
    apiFetch<Volunteer[]>('/volunteers'),

  assignIncidentToVolunteer: (volunteerId: string, incidentId: string): Promise<Volunteer> =>
    apiFetch<Volunteer>(`/volunteers/${volunteerId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ incidentId }),
    }),

  // ─── Analytics ──────────────────────────────────────────────────────────────
  getAnalyticsSummary: async (): Promise<{
    totalIncidents: number;
    activeIncidents: number;
    criticalEmergencies: number;
    respondersDeployed: number;
    citizensImpacted: number;
    aiVerifiedReports: number;
    bySeverity: Record<string, number>;
    byVerification: Record<string, number>;
    byMissionStatus: Record<string, number>;
    byType: Record<string, number>;
  }> => {
    const raw = await apiFetch<any>('/analytics/summary');
    const kpi = raw.kpi || {};
    const breakdowns = raw.breakdowns || {};
    const severity = breakdowns.severityBreakdown || {};
    const verification = breakdowns.verificationBreakdown || {};
    const mission = breakdowns.missionStatusBreakdown || {};
    const type = breakdowns.incidentTypeBreakdown || {};

    const totalIncidents = Object.values(severity).reduce((a: any, b: any) => a + b, 0) as number;

    return {
      totalIncidents,
      activeIncidents: kpi.activeIncidents ?? 0,
      criticalEmergencies: kpi.criticalEmergencies ?? 0,
      respondersDeployed: kpi.respondersDeployed ?? 0,
      citizensImpacted: kpi.citizensImpacted ?? 0,
      aiVerifiedReports: verification.Verified ?? 0,
      bySeverity: {
        Critical: severity.Critical ?? 0,
        High: severity.High ?? 0,
        Medium: severity.Medium ?? 0,
        Low: severity.Low ?? 0,
      },
      byVerification: {
        Verified: verification.Verified ?? 0,
        Pending: verification.Pending ?? 0,
        Flagged: verification.Flagged ?? 0,
      },
      byMissionStatus: {
        'Awaiting Assignment': mission.AwaitingAssignment ?? 0,
        'Dispatched': mission.Dispatched ?? 0,
        'En Route': mission.EnRoute ?? 0,
        'Active': mission.Active ?? 0,
        'Resolved': mission.Resolved ?? 0,
      },
      byType: type,
    };
  },

  exportAnalytics: async (): Promise<void> => {
    const data = await apiFetch<Record<string, unknown>[]>('/analytics/export');
    if (!data || data.length === 0) return;
    const csvRows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csv = [Object.keys(data[0]).join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panicsense_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // ─── Responder Chat ─────────────────────────────────────────────────────────
  sendResponderChat: (
    incidentId: string,
    message: string,
  ): Promise<{ response: string; actions: string[] }> =>
    apiFetch('/chat/responder', {
      method: 'POST',
      body: JSON.stringify({ incidentId, message }),
    }),
};
