import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'ONLINE', system: 'EGX AI Analyst API probe', timestamp: new Date().toISOString(), runtime: 'nodejs' });
}
