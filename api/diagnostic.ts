import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const mod = await import('../server.ts');
    const app = await mod.createServerLessApp();
    return res.status(200).json({ status: 'IMPORTED', appType: typeof app });
  } catch (error: any) {
    return res.status(500).json({ status: 'IMPORT_FAILED', message: error?.message || String(error), stack: error?.stack });
  }
}
