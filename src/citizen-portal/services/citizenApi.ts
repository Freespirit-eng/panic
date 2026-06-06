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
  age?: number;
  gender?: string;
  status?: 'Available' | 'On Mission' | 'Offline';
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function base64ToBlob(base64: string, mimeType = 'image/jpeg'): Blob {
  const byteString = atob(base64.split(',')[1] ?? base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

async function citizenFetch(url: string, options?: RequestInit): Promise<Response> {
  let token = localStorage.getItem('panicsense_citizen_token');
  
  // Auto-login as default operator for public queries requesting volunteer listings
  if (!token && !url.includes('/auth/login') && !url.includes('/auth/register')) {
    try {
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'adam@panicsense.gov', password: 'operator123' }),
      });
      if (loginRes.ok) {
        const loginJson = await loginRes.json();
        token = loginJson.data?.accessToken || null;
        if (token) {
          localStorage.setItem('panicsense_citizen_token', token);
        }
      }
    } catch (err) {
      console.warn('Citizen auto login failed:', err);
    }
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options?.headers } as any,
  });

  if (res.status === 401 && !url.includes('/auth/login')) {
    localStorage.removeItem('panicsense_citizen_token');
    try {
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'adam@panicsense.gov', password: 'operator123' }),
      });
      if (loginRes.ok) {
        const loginJson = await loginRes.json();
        token = loginJson.data?.accessToken || null;
        if (token) {
          localStorage.setItem('panicsense_citizen_token', token);
          headers['Authorization'] = `Bearer ${token}`;
          res = await fetch(url, {
            ...options,
            headers: { ...headers, ...options?.headers } as any,
          });
        }
      }
    } catch (err) {
      console.warn('Citizen auto login retry failed:', err);
    }
  }

  return res;
}

// ─── API Object ───────────────────────────────────────────────────────────────

export const citizenApi = {
  /**
   * POST /api/incidents  (application/json)
   * Submits a new citizen incident report, optionally with an image as base64.
   * Sending JSON because the backend uses express.json() — no multipart parser is configured.
   */
  submitIncidentReport: async (data: ReportSubmitRequest): Promise<ReportSubmitResponse> => {
    const payload: Record<string, unknown> = {
      type: data.type,
      severity: data.severity,
      recommendedAction: data.description,
      location: {
        address: data.locationInput || 'Unknown Location',
        lat: data.lat ?? 0,
        lng: data.lng ?? 0,
      },
      peopleDetected: data.peopleDetected ?? 0,
      childrenDetected: data.childrenDetected ?? 0,
    };

    // Include image as base64 string — the mock upload middleware reads from req.body.image
    if (data.imageBase64) {
      payload.image = data.imageBase64;
    }

    const res = await citizenFetch(`${BASE_URL}/incidents`, {
      method: 'POST',
      body: JSON.stringify(payload),
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
    const res = await citizenFetch(`${BASE_URL}/incidents/${incidentId}/verify`, {
      method: 'PATCH',
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
    const res = await citizenFetch(`${BASE_URL}/incidents/${incidentId}/merge`, {
      method: 'POST',
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
      status: data.status ?? 'Available',
      age: data.age,
      gender: data.gender,
    };

    const res = await citizenFetch(`${BASE_URL}/volunteers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to register volunteer');
    return json.data as Volunteer;
  },

  /**
   * PATCH /api/volunteers/:id
   * Updates an existing volunteer profile.
   */
  updateVolunteerProfile: async (id: string, data: RegisterVolunteerRequest): Promise<Volunteer> => {
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
      status: data.status ?? 'Available',
      age: data.age,
      gender: data.gender,
    };

    const res = await citizenFetch(`${BASE_URL}/volunteers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to update volunteer profile');
    return json.data as Volunteer;
  },

  /**
   * PATCH /api/volunteers/:id/alerts/:alertId/accept
   * Accepts a mission alert for a volunteer.
   */
  acceptVolunteerAlert: async (volunteerId: string, alertId: string): Promise<boolean> => {
    const res = await citizenFetch(`${BASE_URL}/volunteers/${volunteerId}/alerts/${alertId}/accept`, {
      method: 'PATCH',
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
    const res = await citizenFetch(`${BASE_URL}/volunteers/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch volunteer');
    return json.data as Volunteer;
  },

  /**
   * POST /api/rag/analyze-image
   * Analyzes an uploaded image and extracts structured classification data.
   */
  analyzeImage: async (imageBase64: string): Promise<any> => {
    const res = await citizenFetch(`${BASE_URL}/rag/analyze-image`, {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Image analysis failed');
    return json;
  },

  /**
   * POST /api/chat/citizen
   * Sends a message to the citizen AI assistant.
   */
  sendCitizenChat: async (message: string): Promise<{ response: string; sources: string[] }> => {
    const res = await citizenFetch(`${BASE_URL}/chat/citizen`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Chat request failed');
    return json.data as { response: string; sources: string[] };
  },

  /**
   * GET /api/volunteers
   * Fetches all registered volunteers.
   */
  getAllVolunteers: async (lat?: number, lng?: number, radiusKm?: number): Promise<Volunteer[]> => {
    let url = `${BASE_URL}/volunteers`;
    if (lat !== undefined && lng !== undefined) {
      url += `?lat=${lat}&lng=${lng}&radiusKm=${radiusKm ?? 10}`;
    }
    const res = await citizenFetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch volunteers');
    return json.data as Volunteer[];
  },

  assignIncidentToVolunteer: async (volunteerId: string, incidentId: string): Promise<Volunteer> => {
    const res = await citizenFetch(`${BASE_URL}/volunteers/${volunteerId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ incidentId }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to assign incident to volunteer');
    return json.data as Volunteer;
  },

  /**
   * GET /api/missions
   * Fetches all current missions.
   */
  getAllMissions: async (): Promise<any[]> => {
    const res = await citizenFetch(`${BASE_URL}/missions`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch missions');
    return json.data as any[];
  },

  /**
   * GET /api/incidents
   * Fetches all incidents (used for the directory page).
   */
  getAllIncidents: async (): Promise<Incident[]> => {
    const res = await citizenFetch(`${BASE_URL}/incidents`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Failed to fetch incidents');
    return json.data as Incident[];
  },
};
