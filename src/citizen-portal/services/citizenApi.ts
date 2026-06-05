import { Incident, Volunteer } from '../../shared/types';

const BASE_URL = 'http://localhost:3000/api';

// ─── Request / Response Shapes ────────────────────────────────────────────────

export interface ReportSubmitRequest {
  type: string;
  severity: string;
  description: string;
  locationInput: string;
  lat?: number;
  lng?: number;
  peopleDetected?: number;
  childrenDetected?: number;
  imageBase64?: string;
}

export interface ReportSubmitResponse {
  report: Partial<Incident>;
  createdIncident: Incident;
}

export interface RegisterVolunteerRequest {
  name: string;
  phone: string;
  lat: number;
  lng: number;
  address?: string;
  skills: string[];
  equipment: string[];
  notifyRadiusKm: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function base64ToBlob(base64: string, mimeType = 'image/jpeg'): Blob {
  const byteString = atob(base64.split(',')[1] ?? base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

// ─── API Object ───────────────────────────────────────────────────────────────

export const citizenApi = {
  /**
   * POST /api/incidents  (multipart/form-data)
   * Submits a new citizen incident report, optionally with an image.
   */
  submitIncidentReport: async (data: ReportSubmitRequest): Promise<ReportSubmitResponse> => {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('severity', data.severity);
    formData.append('recommendedAction', data.description);
    formData.append('location[address]', data.locationInput);
    formData.append('location[lat]', String(data.lat ?? 0));
    formData.append('location[lng]', String(data.lng ?? 0));
    formData.append('peopleDetected', String(data.peopleDetected ?? 0));
    formData.append('childrenDetected', String(data.childrenDetected ?? 0));

    if (data.imageBase64) {
      const blob = base64ToBlob(data.imageBase64);
      formData.append('image', blob, 'report.jpg');
    }

    const res = await fetch(`${BASE_URL}/incidents`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to submit report');
    return { report: {}, createdIncident: json.data as Incident };
  },

  /**
   * PATCH /api/incidents/:id/verify
   * Sets the verification status on an incident.
   */
  verifyIncident: async (
    incidentId: string,
    verification: 'Verified' | 'Pending' | 'Flagged'
  ): Promise<Incident> => {
    const res = await fetch(`${BASE_URL}/incidents/${incidentId}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to verify incident');
    return json.data as Incident;
  },

  /**
   * POST /api/incidents/:id/merge
   * Merges incident into a target incident.
   */
  mergeIncident: async (incidentId: string, targetIncidentId: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/incidents/${incidentId}/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetIncidentId }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to merge incident');
  },

  /**
   * POST /api/volunteers
   * Registers a new volunteer in the system.
   */
  registerAsVolunteer: async (data: RegisterVolunteerRequest): Promise<Volunteer> => {
    const payload = {
      name: data.name,
      phone: data.phone,
      location: {
        lat: data.lat,
        lng: data.lng,
        address: data.address ?? `${data.lat}, ${data.lng}`,
      },
      skills: data.skills,
      equipment: data.equipment,
      notifyRadiusKm: data.notifyRadiusKm,
      status: 'Available',
    };

    const res = await fetch(`${BASE_URL}/volunteers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to register volunteer');
    return json.data as Volunteer;
  },

  /**
   * PATCH /api/volunteers/:id/alerts/:alertId/accept
   * Accepts a mission alert for a volunteer.
   */
  acceptVolunteerAlert: async (volunteerId: string, alertId: string): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/volunteers/${volunteerId}/alerts/${alertId}/accept`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to accept alert');
    return true;
  },

  /**
   * GET /api/volunteers/:id
   * Fetches a volunteer by ID, including their receivedAlerts.
   */
  getVolunteerById: async (id: string): Promise<Volunteer> => {
    const res = await fetch(`${BASE_URL}/volunteers/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch volunteer');
    return json.data as Volunteer;
  },

  /**
   * POST /api/chat/citizen
   * Sends a message to the citizen AI assistant.
   */
  sendCitizenChat: async (message: string): Promise<{ response: string; sources: string[] }> => {
    const res = await fetch(`${BASE_URL}/chat/citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Chat request failed');
    return json.data as { response: string; sources: string[] };
  },

  /**
   * GET /api/incidents
   * Fetches all incidents (used for the directory page).
   */
  getAllIncidents: async (): Promise<Incident[]> => {
    const res = await fetch(`${BASE_URL}/incidents`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch incidents');
    return json.data as Incident[];
  },
};
