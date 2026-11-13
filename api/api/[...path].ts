import { createServerlessApp } from '../server';

let appPromise: Promise&lt;any&gt; | undefined;

export default async function handler(req: any, res: any) {
  try {
    appPromise ??= createServerlessApp();
    const app = await appPromise;
    return app(req, res);
  } catch (error: any) {
    console.error('Vercel API initialization failed:', error);
    return res.status(500).json({ error: 'API initialization failed' });
  }
}
