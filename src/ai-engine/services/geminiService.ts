import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { Incident, ChatMessage, DuplicateResult } from '../../shared/types';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Strips markdown code fences and extra whitespace from a Gemini response
 * so that JSON.parse works reliably.
 */
function extractJson(raw: string): string {
  return raw
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();
}

const DEFAULT_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.6-flash',
  'models/gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
].filter(Boolean) as string[];

async function generateText(prompt: string): Promise<string> {
  let lastErr: any;
  for (const model of DEFAULT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text ?? '';
    } catch (err: any) {
      lastErr = err;
      console.warn(`[geminiService] Model ${model} failed, attempting next available model...`);
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// Gemini Service
// ---------------------------------------------------------------------------

export const geminiService = {
  /**
   * Classifies a citizen's emergency report into a structured Incident object.
   * Supports optional base64-encoded image for Gemini Vision analysis.
   */
  generateStructuredReport: async (
    description: string,
    imageBase64?: string,
  ): Promise<Partial<Incident>> => {
    const prompt = `
You are an emergency incident classification AI for the PanicSense EOC system.

A citizen has reported the following emergency:
"${description}"

${imageBase64 ? `
An image has also been submitted with this report. Analyse it carefully for:
- Visible flood water levels (depth estimate, debris, flow speed)
- Fire spread and proximity to structures
- Structural damage indicators (cracks, lean, partial collapse)
- Number of visible people or vehicles in distress
` : ''}

Analyse the report${imageBase64 ? ' and image' : ''} and return a JSON object with EXACTLY these fields:
{
  "type": one of ["Flood", "Road Collapse", "Fire", "Earthquake", "Building Damage"],
  "severity": one of ["Critical", "High", "Medium", "Low"],
  "confidence": integer 0-100 representing classification confidence,
  "peopleDetected": estimated number of people affected (integer, default 0),
  "childrenDetected": estimated number of children affected (integer, default 0),
  "waterLevel": one of ["High", "Medium", "Low", "N/A"],
  "recommendedAction": "A single, actionable directive sentence for first responders.",
  "reasoning": ["reason 1", "reason 2", "reason 3"],
  "priorityScore": integer 1-100 (100 = most critical)
}

Return ONLY valid JSON. No markdown fences, no explanation, no preamble.
`.trim();

    if (imageBase64) {
      let mimeType = 'image/jpeg';
      let cleanBase64 = imageBase64;
      if (imageBase64.includes(';base64,')) {
        const parts = imageBase64.split(';base64,');
        const match = parts[0].match(/data:(.*?)$/);
        if (match && match[1]) {
          mimeType = match[1];
        }
        cleanBase64 = parts[1];
      }

      let response: any;
      let lastErr: any;
      for (const model of DEFAULT_MODELS) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
            ] as any,
          });
          break;
        } catch (err: any) {
          lastErr = err;
          console.warn(`[geminiService] Vision analysis with model ${model} failed, trying next...`);
        }
      }
      if (!response) throw lastErr;
      try {
        return JSON.parse(extractJson(response.text ?? ''));
      } catch {
        console.error('[geminiService] Failed to parse vision report JSON:', response.text);
        return {
          type: 'Building Damage',
          severity: 'Medium',
          confidence: 50,
          peopleDetected: 0,
          childrenDetected: 0,
          waterLevel: 'N/A',
          recommendedAction: 'Deploy assessment team to evaluate the situation.',
          reasoning: ['Image analysis inconclusive', 'Manual review required'],
          priorityScore: 50,
        };
      }
    }

    const raw = await generateText(prompt);
    try {
      return JSON.parse(extractJson(raw));
    } catch {
      console.error('[geminiService] Failed to parse structured report JSON:', raw);
      return {
        type: 'Building Damage',
        severity: 'Medium',
        confidence: 50,
        peopleDetected: 0,
        childrenDetected: 0,
        waterLevel: 'N/A',
        recommendedAction: 'Deploy assessment team to evaluate the situation.',
        reasoning: ['Classification inconclusive', 'Manual review required'],
        priorityScore: 50,
      };
    }
  },

  /**
   * Generates a calm, actionable RAG-grounded response for a citizen query.
   */
  generateRagResponse: async (
    query: string,
    context: string[],
    history: ChatMessage[],
  ): Promise<string> => {
    const contextBlock =
      context.length > 0
        ? context.map((c, i) => `[Source ${i + 1}]\n${c}`).join('\n\n')
        : 'No specific context available. Use general emergency knowledge.';

    const historyBlock =
      history.length > 0
        ? history.map((m) => `${m.sender === 'user' ? 'Citizen' : 'PanicSense AI'}: ${m.message}`).join('\n')
        : '';

    const prompt = `
You are PanicSense AI, an emergency guidance assistant for the public.
Your role is to provide clear, calm, and immediately actionable safety advice during emergencies.

KNOWLEDGE BASE CONTEXT:
${contextBlock}

${historyBlock ? `PREVIOUS CONVERSATION:\n${historyBlock}\n` : ''}

CITIZEN MESSAGE: "${query}"

Instructions:
- Respond in 2-4 sentences maximum.
- Be calm, reassuring, and precise.
- Give concrete actions the citizen can take RIGHT NOW.
- If life is in immediate danger, always advise calling 911 first.
- Do not speculate beyond what the context supports.
- Do not use bullet points — write in natural prose.
`.trim();

    const raw = await generateText(prompt);
    return raw.trim() || 'Please call 911 immediately if you are in danger. Stay calm and move to safety.';
  },

  /**
   * Provides tactical analysis and recommended actions for EOC responders.
   */
  generateResponderAnalysis: async (
    incidentData: Incident,
    question: string,
  ): Promise<{ response: string; actions: string[] }> => {
    const prompt = `
You are the PanicSense EOC AI Tactical Advisor — an expert emergency operations analyst.

INCIDENT BRIEFING:
- Incident ID: ${incidentData.id}
- Type: ${incidentData.type}
- Severity: ${incidentData.severity}
- Location: ${incidentData.location.address} (${incidentData.location.lat}, ${incidentData.location.lng})
- People Affected: ${incidentData.peopleDetected} (children: ${incidentData.childrenDetected})
- Water Level: ${incidentData.waterLevel}
- Verification Status: ${incidentData.verification}
- Current Recommended Action: ${incidentData.recommendedAction}
- AI Reasoning: ${incidentData.reasoning.join('; ')}
- Priority Score: ${incidentData.priorityScore}/100

RESPONDER QUESTION: "${question}"

Provide a tactical assessment and 2-4 concrete, actionable steps.

Return ONLY a JSON object with this exact structure:
{
  "response": "Comprehensive tactical analysis in 2-3 sentences.",
  "actions": ["Action step 1", "Action step 2", "Action step 3"]
}

No markdown, no preamble. ONLY valid JSON.
`.trim();

    const raw = await generateText(prompt);
    try {
      return JSON.parse(extractJson(raw));
    } catch {
      console.error('[geminiService] Failed to parse responder analysis JSON:', raw);
      return {
        response: `Incident ${incidentData.id} is a ${incidentData.severity} severity ${incidentData.type} event. Immediate resource deployment is advised based on current data.`,
        actions: [
          'Deploy nearest available response unit to the incident location.',
          'Establish communication with on-site personnel.',
          'Activate secondary resource allocation as needed.',
        ],
      };
    }
  },

  /**
   * Uses Gemini to make a final duplicate/merge decision given a new description
   * and a list of semantically similar candidate incidents.
   * Matches the M4 contract: { isDuplicate, confidence, matchedIncidentId? }
   */
  makeDuplicateMergeDecision: async (
    newDescription: string,
    candidates: Incident[],
  ): Promise<DuplicateResult> => {
    if (candidates.length === 0) {
      return { isDuplicate: false, confidence: 0.05 };
    }

    const candidateList = candidates
      .map(
        (inc, i) =>
          `[Candidate ${i + 1}]\nID: ${inc.id}\nType: ${inc.type}\nLocation: ${inc.location.address}\nAction: ${inc.recommendedAction}`,
      )
      .join('\n\n');

    const prompt = `
You are a duplicate incident detection AI for the PanicSense Emergency Operations Center.

A new emergency report has been submitted:
"${newDescription}"

Compare it against the following existing incidents that are geographically nearby and semantically similar:

${candidateList}

Determine whether the new report is describing the SAME emergency event as any of the existing incidents.

Consider: same location, same type of emergency, same time window, overlapping details.

Return ONLY a valid JSON object (no markdown, no preamble):
{
  "isDuplicate": true or false,
  "confidence": float between 0.0 and 1.0 (your certainty),
  "matchedIncidentId": "INC-XXX" or null (the ID of the best-matching existing incident, if duplicate)
}
`.trim();

    const raw = await generateText(prompt);
    try {
      const parsed = JSON.parse(extractJson(raw));
      return {
        isDuplicate: Boolean(parsed.isDuplicate),
        confidence: Number(parsed.confidence ?? 0.5),
        matchedIncidentId: parsed.matchedIncidentId ?? undefined,
      };
    } catch {
      console.error('[geminiService] Failed to parse duplicate decision JSON:', raw);
      return { isDuplicate: false, confidence: 0.0 };
    }
  },
};
