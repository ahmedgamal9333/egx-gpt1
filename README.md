# EGX AI Analyst — Safety Patch

This patch removes several misleading demo behaviors found during source review.

## Important safety behavior
- Historical OHLCV fallback no longer generates synthetic candles. If Yahoo Finance does not return enough bars, the API returns an unavailable-data response.
- Stock analysis and AI reports are blocked until real historical candles and verified financial statements are available.
- The source comparison no longer repeats one cached price under five provider names. It reports only the single observed TradingView scanner source, and labels it unverified by independent sources.
- Hard-coded financial statements, fair-value confidence claims, mock news/events, pre-filled demo portfolio holdings, and fabricated backtest results have been removed/disabled.
- Screener is temporarily disabled because the previous candidate list relied on precomputed values rather than a complete verified live pipeline.

## Run locally
1. Install Node.js (current LTS).
2. Run `npm install`.
3. Configure `GEMINI_API_KEY` only in local environment/secrets. Never commit `.env.local`.
4. Run `npm run dev`.
5. Run `npm run build` and `npm run lint` before deployment.

## Still required before investment use
- A licensed/authorized EGX price and historical-data source. TradingView scanner and Yahoo Finance endpoints are not official guaranteed APIs; verify their terms, coverage and delay.
- A documented source for official financial statements and EGX disclosures, including publication timestamps and direct document links.
- A persistent database for user-specific portfolio, watchlists and recommendation history. In-memory state is not durable across Cloud Run instances/restarts.
- A real event-driven backtesting engine with survivorship/look-ahead-bias controls, corporate actions, liquidity constraints, commissions and slippage.

This patch intentionally prefers unavailable data over fabricated data. It does not make the application ready for live investment decisions.
- Source audit now marks EGX, Mubasher, Investing.com, Yahoo Finance, DirectFN, CBE and FRA as standby until an actual connector and successful fetch are implemented; synthetic provider health and discrepancy logs are removed.
- CBE macro values without a live source are returned as unavailable (zero/empty) rather than invented figures.
