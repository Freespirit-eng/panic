import { Incident, Volunteer } from '../../shared/types';

export interface ReportSubmitRequest {
  description: string;
  locationInput: string;
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
  skills: string[];
  equipment: string[];
  notifyRadiusKm: number;
}

export const citizenApi = {
  submitIncidentReport: async (data: ReportSubmitRequest): Promise<ReportSubmitResponse> => {
    // Skeleton: API implementation boundary
    throw new Error('Not implemented: Service Skeleton Only');
  },

  registerAsVolunteer: async (data: RegisterVolunteerRequest): Promise<Volunteer> => {
    // Skeleton: API implementation boundary
    throw new Error('Not implemented: Service Skeleton Only');
  },

  acceptVolunteerAlert: async (volunteerId: string, alertId: string): Promise<boolean> => {
    // Skeleton: API implementation boundary
    throw new Error('Not implemented: Service Skeleton Only');
  }
};
