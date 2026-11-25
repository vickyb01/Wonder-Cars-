import type { Request, Response } from 'express';
import {
  generateAnalyticsCsv,
  getAnalyticsDashboardData,
  getGa4ConfigStatus,
  recordTelemetryEvent,
} from '../services/ga4.service.ts';
import type { AnalyticsDateRangeKey, TelemetryEventPayload } from '../models/analytics.types.ts';

export async function getAnalyticsDashboard(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = (String(req.query.dateRange || '30d').toLowerCase()) as AnalyticsDateRangeKey;
    const customStart = req.query.startDate ? String(req.query.startDate).trim() : undefined;
    const customEnd = req.query.endDate ? String(req.query.endDate).trim() : undefined;

    const data = await getAnalyticsDashboardData(dateRange, customStart, customEnd);
    res.json(data);
  } catch (err) {
    console.error('Failed to get analytics dashboard data:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics dashboard data' });
  }
}

export function getAnalyticsStatus(_req: Request, res: Response): void {
  try {
    const status = getGa4ConfigStatus();
    res.json(status);
  } catch (err) {
    console.error('Failed to get GA4 status:', err);
    res.status(500).json({ error: 'Failed to retrieve GA4 configuration status' });
  }
}

export function trackClientEvent(req: Request, res: Response): void {
  try {
    const body = req.body as TelemetryEventPayload;
    if (!body || !body.eventName) {
      res.status(400).json({ error: 'Missing eventName in telemetry payload' });
      return;
    }

    recordTelemetryEvent(body);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Failed to track telemetry event:', err);
    res.status(500).json({ error: 'Failed to record telemetry event' });
  }
}

export async function exportAnalyticsCsv(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = (String(req.query.dateRange || '30d').toLowerCase()) as AnalyticsDateRangeKey;
    const customStart = req.query.startDate ? String(req.query.startDate).trim() : undefined;
    const customEnd = req.query.endDate ? String(req.query.endDate).trim() : undefined;

    const csvContent = await generateAnalyticsCsv(dateRange, customStart, customEnd);
    const filename = `wonder-cars-analytics-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Failed to export analytics CSV:', err);
    res.status(500).json({ error: 'Failed to export analytics CSV' });
  }
}
