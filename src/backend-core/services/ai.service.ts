import { DuplicateResult, ChatMessage } from '../../shared/types';

export class AIService {
  private static instance: AIService;
  private readonly aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8001';

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Helper to perform HTTP POST requests to the AI Engine.
   */
  private async postToAIEngine<T>(endpoint: string, body: any): Promise<T> {
    const url = `${this.aiEngineUrl}${endpoint}`;
    try {
      console.log(`[EOC AI Gateway] Forwarding request to AI Engine: POST ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`AI Engine returned status: ${response.status}`);
      }

      return await response.json() as T;
    } catch (err: any) {
      console.warn(`[EOC AI Gateway] AI Engine connection failed for POST ${url}. Error: ${err.message}`);
      throw err; // Propagate error to let the caller apply specific fallbacks
    }
  }

  /**
   * Checks if an incident report description is a duplicate.
   */
  public async checkDuplicate(description: string, lat: number, lng: number): Promise<DuplicateResult> {
    try {
      return await this.postToAIEngine<DuplicateResult>('/duplicate-check', {
        description,
        latitude: lat,
        longitude: lng
      });
    } catch (err) {
      console.log('[EOC AI Gateway] Falling back to mock duplicate result.');
      // Mock fallback: if the description contains common keywords of existing mock items, simulate a match.
      const lowerDesc = description.toLowerCase();
      if (lowerDesc.includes('flood') || lowerDesc.includes('water') || lowerDesc.includes('river')) {
        return {
          isDuplicate: true,
          confidence: 0.94,
          matchedIncidentId: 'INC-001'
        };
      }
      return {
        isDuplicate: false,
        confidence: 0.12
      };
    }
  }

  /**
   * Analyzes an emergency image via AI Engine.
   */
  public async analyzeImage(imageBase64: string): Promise<any> {
    try {
      return await this.postToAIEngine<any>('/analyze-image', { imageBase64 });
    } catch (err) {
      console.log('[EOC AI Gateway] Falling back to mock image analysis.');
      const isFire = Math.random() > 0.5;
      if (isFire) {
        return {
          type: 'Fire',
          severity: 'Critical',
          confidence: 95,
          peopleDetected: 2,
          childrenDetected: 0,
          waterLevel: 'N/A',
          recommendedAction: 'Evacuate the building immediately, close doors to slow fire, and move upwind.',
          reasoning: ['Visible active flames', 'Heavy dark smoke plume rising'],
          priorityScore: 88
        };
      } else {
        return {
          type: 'Flood',
          severity: 'High',
          confidence: 89,
          peopleDetected: 4,
          childrenDetected: 1,
          waterLevel: 'High',
          recommendedAction: 'Move to higher ground or upper floors immediately. Do not attempt to cross moving water.',
          reasoning: ['Street flooded with muddy water', 'Submerged vehicle tires visible'],
          priorityScore: 78
        };
      }
    }
  }

  /**
   * Routes a chat message from a citizen and returns response.
   */
  public async getCitizenChatResponse(message: string): Promise<{ response: string; sources: string[] }> {
    try {
      return await this.postToAIEngine<{ response: string; sources: string[] }>('/citizen-chat', {
        message
      });
    } catch (err) {
      console.log('[EOC AI Gateway] Falling back to mock citizen chat reply.');
      const lowerMsg = message.toLowerCase();
      let response = "I am PanicSense AI standby assistant. I can help guide you through reporting emergencies or finding support.";
      let sources: string[] = [];

      if (lowerMsg.includes('flood') || lowerMsg.includes('water')) {
        response = "For flood situations: avoid walking/driving through standing water. Head to higher ground immediately. The main shelter in the Mission district is located at Bill Graham Civic Auditorium.";
        sources = ['KB-001 (Swiftwater Evacuation Guidelines)'];
      } else if (lowerMsg.includes('fire')) {
        response = "For brush fires: create defensible space and close gas valves. Evacuate immediately if order is issued.";
        sources = ['KB-002 (Brush Fire Safety Distances)'];
      }

      return { response, sources };
    }
  }

  /**
   * Routes a chat message from a responder/commander and returns action plans.
   */
  public async getResponderChatResponse(incidentId: string, message: string): Promise<{ response: string; actions: string[] }> {
    try {
      return await this.postToAIEngine<{ response: string; actions: string[] }>('/responder-chat', {
        incidentId,
        message
      });
    } catch (err) {
      console.log('[EOC AI Gateway] Falling back to mock responder chat reply.');
      return {
        response: `Based on incident ${incidentId}, AI recommends deploying local volunteer units. Proximity search confirms Sarah Connor is within 1.2km of the area with necessary first aid gear.`,
        actions: [
          `Send dispatch alert notification to Volunteer Sarah Connor (VOL-001)`,
          `Establish secondary communication lines on channel 16-B`
        ]
      };
    }
  }
}

export const aiService = AIService.getInstance();
