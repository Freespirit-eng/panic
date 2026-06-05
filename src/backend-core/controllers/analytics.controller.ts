import { Request, Response } from 'express';
import { db } from '../database/db';
import { asyncHandler } from '../middleware/error.middleware';

export const analyticsController = {
  // GET /api/analytics/summary — Powers M3 KPI dashboard cards via stats_update socket on initial load
  getSummary: asyncHandler(async (req: Request, res: Response) => {
    const activeIncidents = db.incidents.length;
    const criticalEmergencies = db.incidents.filter(i => i.severity === 'Critical').length;
    const respondersDeployed = db.missions.filter(m => m.status !== 'Resolved').length;
    const citizensImpacted = db.incidents.reduce((acc, curr) => acc + curr.peopleDetected, 0);

    const severityBreakdown = {
      Critical: db.incidents.filter(i => i.severity === 'Critical').length,
      High: db.incidents.filter(i => i.severity === 'High').length,
      Medium: db.incidents.filter(i => i.severity === 'Medium').length,
      Low: db.incidents.filter(i => i.severity === 'Low').length
    };

    const verificationBreakdown = {
      Verified: db.incidents.filter(i => i.verification === 'Verified').length,
      Pending: db.incidents.filter(i => i.verification === 'Pending').length,
      Flagged: db.incidents.filter(i => i.verification === 'Flagged').length
    };

    const missionStatusBreakdown = {
      AwaitingAssignment: db.missions.filter(m => m.status === 'Awaiting Assignment').length,
      Dispatched: db.missions.filter(m => m.status === 'Dispatched').length,
      EnRoute: db.missions.filter(m => m.status === 'En Route').length,
      Active: db.missions.filter(m => m.status === 'Active').length,
      Resolved: db.missions.filter(m => m.status === 'Resolved').length
    };

    const incidentTypeBreakdown: Record<string, number> = {};
    db.incidents.forEach(i => {
      incidentTypeBreakdown[i.type] = (incidentTypeBreakdown[i.type] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          activeIncidents,
          criticalEmergencies,
          respondersDeployed,
          citizensImpacted
        },
        breakdowns: {
          severityBreakdown,
          verificationBreakdown,
          missionStatusBreakdown,
          incidentTypeBreakdown
        }
      }
    });
  }),

  // GET /api/analytics/export — Powers M3 Analytics dashboard export button (2.J in Phase 2)
  export: asyncHandler(async (req: Request, res: Response) => {
    const rows = db.incidents.map(i => ({
      id: i.id,
      type: i.type,
      severity: i.severity,
      verification: i.verification,
      confidence: i.confidence,
      priorityScore: i.priorityScore,
      lat: i.location.lat,
      lng: i.location.lng,
      address: i.location.address,
      peopleDetected: i.peopleDetected,
      childrenDetected: i.childrenDetected,
      waterLevel: i.waterLevel,
      duplicates: i.duplicates,
      timestamp: i.timestamp
    }));

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total: rows.length,
        exportedAt: new Date().toISOString()
      }
    });
  })
};
