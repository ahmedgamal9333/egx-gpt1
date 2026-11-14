import { createServerlessApp } from './api/server-bundle.mjs';

let appPromise;

export async function handleApiRequest(req, res) {
  try {
    appPromise ||= createServerlessApp();
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error('Vercel API initialization failed:', error);
    return res.status(500).json({
      error: 'API initialization failed',
      message: error?.message || String(error)
    });
  }
}
