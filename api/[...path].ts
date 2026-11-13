import { createServerlessApp } from '../server.ts';

let appPromise: ReturnType&lt;typeof createServerlessApp&gt; | undefined;

export default async function handler(req: any, res: any) {
  try {
    appPromise ||= createServerlessApp();
    const app = await appPromise;
    return app(req, res);
  } catch (error: any) {
    console.error('Vercel API initialization failed:', error);
    return res.status(500).json({
      error: 'API initialization failed',
      message: error?.message || String(error)
    });
  }
}
