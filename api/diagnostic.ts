export default async function handler(_req: any, res: any) {
  try {
    const mod = await import('./server-bundle.mjs');
    const app = await mod.createServerlessApp();
    return res.status(200).json({ status: 'IMPORTED', appType: typeof app });
  } catch (error: any) {
    return res.status(500).json({ status: 'IMPORT_FAILED', message: error?.message || String(error), stack: error?.stack });
  }
}
