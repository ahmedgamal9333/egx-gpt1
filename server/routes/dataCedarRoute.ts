import { Request, Response } from 'express';
import { getDataCedarDailyBars } from '../services/dataCedarService';

export async function dataCedarDailyBarsHandler(req: Request, res: Response) {
  try {
    const result = await getDataCedarDailyBars(req.params.ticker, typeof req.query.from === 'string' ? req.query.from : undefined);
    if (!result.bars.length) {
      return res.status(404).json({ ok: false, source: 'DataCedar', code: 'NO_DAILY_BARS', message: 'لا توجد شموع يومية متاحة لهذا السهم.' });
    }
    return res.json({
      ok: true,
      ...result,
      lastBarDate: new Date(Number(result.bars[result.bars.length - 1].ts_ms)).toISOString().slice(0, 10),
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN_DATACEDAR_ERROR';
    const status = code === 'DATACEDAR_KEY_MISSING' ? 503 : code === 'INVALID_EGX_TICKER' ? 400 : 502;
    return res.status(status).json({
      ok: false,
      source: 'DataCedar',
      code,
      message: status === 503 ? 'مفتاح DataCedar غير مضبوط على الخادم.' : 'تعذر جلب بيانات السهم من DataCedar.',
    });
  }
}
