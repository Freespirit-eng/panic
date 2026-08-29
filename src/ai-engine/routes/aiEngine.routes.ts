import { Router, Request, Response } from 'express';
import { geminiService } from '../services/geminiService';
import { ragService } from '../services/ragService';

const router = Router();

// ---------------------------------------------------------------------------
// POST /duplicate-check
// Called by M4's AIService.checkDuplicate()
// Body: { description: string, latitude: number, longitude: number }
// ---------------------------------------------------------------------------
router.post('/duplicate-check', async (req: Request, res: Response) => {
  try {
    const { description, latitude, longitude } = req.body;

    if (!description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        isDuplicate: false,
        confidence: 0,
        error: 'Missing required fields: description, latitude, longitude',
      });
    }

    // Step 1 — find semantically similar + geographically close incidents via RAG
    const similar = await ragService.searchSimilarIncidents(
      description,
      Number(latitude),
      Number(longitude),
    );

    if (similar.length === 0) {
      return res.json({ isDuplicate: false, confidence: 0.05 });
    }

    // Step 2 — Gemini makes the final merge / unique decision
    const decision = await geminiService.makeDuplicateMergeDecision(
      description,
      similar.map((s) => s.incident),
    );

    return res.json(decision);
  } catch (err: any) {
    console.error('[AI Engine] /duplicate-check error:', err.message);
    return res.status(503).json({
      isDuplicate: false,
      confidence: 0,
      error: 'AI Engine temporarily unavailable',
    });
  }
});

// ---------------------------------------------------------------------------
// POST /analyze-image
// Called by M4's AIService.analyzeImage()
// Body: { imageBase64: string }
// ---------------------------------------------------------------------------
router.post('/analyze-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        error: 'Missing required field: imageBase64',
      });
    }

    const decision = await geminiService.generateStructuredReport(
      'Identify the emergency type, severity level, estimated people affected, and write a recommended action.',
      imageBase64
    );

    return res.json(decision);
  } catch (err: any) {
    console.error('[AI Engine] /analyze-image error:', err.message);
    return res.status(503).json({
      error: 'AI Engine temporarily unavailable',
    });
  }
});

// ---------------------------------------------------------------------------
// POST /citizen-chat
// Called by M4's AIService.getCitizenChatResponse()
// Body: { message: string }
// ---------------------------------------------------------------------------
router.post('/citizen-chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        response: 'Please describe your emergency and I will help you.',
        sources: [],
        error: 'Missing required field: message',
      });
    }

    // Step 1 — retrieve relevant knowledge articles via RAG
    const docs = await ragService.searchKnowledgeBase(message.trim());
    const context = docs.map((d) => d.content);
    const sources = docs.map((d) => `${d.id} (${d.title})`);

    // Step 2 — generate Gemini response grounded in the retrieved context
    const response = await geminiService.generateRagResponse(message.trim(), context, []);

    return res.json({ response, sources });
  } catch (err: any) {
    console.error('[AI Engine] /citizen-chat error:', err.message);
    return res.status(503).json({
      response:
        'I am temporarily unable to process your request. If this is an emergency, please call 911 immediately.',
      sources: [],
      error: 'AI Engine temporarily unavailable',
    });
  }
});

// ---------------------------------------------------------------------------
// POST /responder-chat
// Called by M4's AIService.getResponderChatResponse()
// Body: { incidentId: string, message: string }
// ---------------------------------------------------------------------------
router.post('/responder-chat', async (req: Request, res: Response) => {
  try {
    const { incidentId, message } = req.body;

    if (!incidentId || !message) {
      return res.status(400).json({
        response: 'Incident ID and message are required.',
        actions: [],
        error: 'Missing required fields: incidentId, message',
      });
    }

    // Step 1 — fetch incident data from the backend API
    let incident: any;
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const incidentRes = await fetch(`${backendUrl}/api/incidents/${incidentId}`);
      if (!incidentRes.ok) {
        throw new Error(`Backend returned ${incidentRes.status}`);
      }
      const incidentJson = await incidentRes.json();
      incident = incidentJson.data ?? incidentJson;
    } catch (fetchErr: any) {
      console.warn(`[AI Engine] Could not fetch incident ${incidentId}:`, fetchErr.message);
      // Provide a degraded but useful response without incident data
      return res.json({
        response: `Incident ${incidentId} data could not be retrieved. Recommend deploying a reconnaissance unit to assess the situation directly.`,
        actions: [
          'Deploy nearest available unit to incident coordinates.',
          'Establish radio communication with on-site personnel.',
          'Request updated status report from field team.',
        ],
      });
    }

    // Step 2 — generate tactical analysis
    const result = await geminiService.generateResponderAnalysis(incident, message);

    return res.json(result);
  } catch (err: any) {
    console.error('[AI Engine] /responder-chat error:', err.message);
    return res.status(503).json({
      response:
        'Tactical AI is temporarily unavailable. Proceed with standard operating procedures.',
      actions: [
        'Follow standard incident response protocols.',
        'Contact EOC supervisor for manual coordination.',
      ],
      error: 'AI Engine temporarily unavailable',
    });
  }
});

export default router;
