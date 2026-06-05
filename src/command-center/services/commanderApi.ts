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

  // ─── Volunteers ─────────────────────────────────────────────────────────────
  getVolunteers: (): Promise<Volunteer[]> =>
    apiFetch<Volunteer[]>('/volunteers'),

  // ─── Analytics ──────────────────────────────────────────────────────────────
  getAnalyticsSummary: (): Promise<{
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
  }> => apiFetch('/analytics/summary'),

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
