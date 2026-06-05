import { z } from 'zod';

// Shared Sub-Schemas
export const locationSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  address: z.string().min(1, 'Address is required')
});

// 1. Create Incident Validator Schema
export const createIncidentSchema = z.object({
  type: z.enum(['Flood', 'Road Collapse', 'Fire', 'Earthquake', 'Building Damage']),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  location: locationSchema,
  image: z.string().optional(),
  peopleDetected: z.coerce.number().int().nonnegative().default(0),
  childrenDetected: z.coerce.number().int().nonnegative().default(0),
  waterLevel: z.enum(['High', 'Medium', 'Low', 'N/A']).default('N/A'),
  recommendedAction: z.string().optional(),
  reasoning: z.array(z.string()).optional()
});

// 2. Create Volunteer Validator Schema
export const createVolunteerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(5, 'Phone number is required'),
  location: locationSchema,
  skills: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  notifyRadiusKm: z.number().positive().default(5),
  age: z.number().int().positive().optional(),
  gender: z.string().optional(),
  status: z.enum(['Available', 'On Mission', 'Offline']).optional()
});

// 3. Create Mission Validator Schema
export const createMissionSchema = z.object({
  incidentId: z.string().min(1, 'Incident ID is required'),
  location: locationSchema,
  type: z.enum(['Flood', 'Road Collapse', 'Fire', 'Earthquake', 'Building Damage']),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  recommendedTeam: z.string().min(1, 'Recommended team description is required'),
  assignedTeam: z.string().min(1, 'Assigned team is required'),
  status: z.enum(['Awaiting Assignment', 'Dispatched', 'En Route', 'Active', 'Resolved']).default('Awaiting Assignment'),
  eta: z.string().min(1, 'ETA is required'),
  summary: z.string().min(1, 'Summary is required'),
  aiFindings: z.string().default(''),
  riskAssessment: z.string().default(''),
  affectedPopulation: z.number().int().nonnegative().default(0),
  requiredResources: z.array(z.string()).default([]),
  recommendedResponsePlan: z.array(z.string()).default([])
});

// 4. Citizen Chat Request Validator Schema
export const citizenChatSchema = z.object({
  message: z.string().min(1, 'Chat message cannot be empty')
});

// 5. Responder Chat Request Validator Schema
export const responderChatSchema = z.object({
  incidentId: z.string().min(1, 'Incident ID is required'),
  message: z.string().min(1, 'Chat message cannot be empty')
});

// 6. Duplicate Check Request Validator Schema
export const duplicateCheckSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});
