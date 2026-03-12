// @ts-check

/**
 * Shared JSDoc typedefs for the backend/frontend contract surface.
 *
 * These definitions let us incrementally adopt `// @ts-check` across the
 * project without forcing a full TypeScript migration mid-phase.
 */

/**
 * @typedef {'seed'|'running'|'success'|'partial'|'failed'|'skipped'} RefreshStatus
 */

/**
 * @typedef {'manual'|'scheduled'|'startup'} RefreshTriggerType
 */

/**
 * @typedef {'full'|'prices_only'|'news_only'} RefreshScope
 */

/**
 * @typedef {'redemption'|'gating'|'bankruptcy'|'regulatory'|'bank_action'|'market_move'|'analyst_warning'|'policy'|'general'} EventCategory
 */

/**
 * @typedef {{ value: number, unit: string, as_of?: string }} DashboardStat
 */

/**
 * @typedef {{ year: string, headline: number|null, true: number|null, label: string }} DefaultRatePoint
 */

/**
 * @typedef {{ name: string, value: number }} NamedValuePoint
 */

/**
 * @typedef {{ quarter: string, pik: number }} PIKPoint
 */

/**
 * @typedef {{ year: string, amount: number }} MaturityWallPoint
 */

/**
 * @typedef {{
 *   stats: Record<string, DashboardStat>,
 *   default_rates: DefaultRatePoint[],
 *   sector_exposure: NamedValuePoint[],
 *   pik_trend: PIKPoint[],
 *   maturity_wall: MaturityWallPoint[],
 * }} DashboardOverview
 */

/**
 * @typedef {{
 *   id: number,
 *   name: string,
 *   ticker: string|null,
 *   manager: string,
 *   aum_billions: number|null,
 *   fund_type: string|null,
 *   quarter: string|null,
 *   redemption_requested_pct: number|null,
 *   redemption_requested_amt: number|null,
 *   redemption_paid_pct: number|null,
 *   redemption_paid_amt: number|null,
 *   gate_threshold_pct: number|null,
 *   status: string|null,
 *   response_detail: string|null,
 * }} RedemptionFund
 */

/**
 * @typedef {{ fund: string, requested: number|null, paid: number|null }} RedemptionRatePoint
 */

/**
 * @typedef {{ fund: string, requested: number, returned: number|null }} DollarFlowPoint
 */

/**
 * @typedef {{
 *   funds: RedemptionFund[],
 *   rate_chart: RedemptionRatePoint[],
 *   dollar_flows: DollarFlowPoint[],
 * }} DashboardRedemptions
 */

/**
 * @typedef {{
 *   id: number,
 *   layer_order: number,
 *   layer_name: string,
 *   detail: string|null,
 *   risk_description: string|null,
 *   exposure_label: string|null,
 *   severity: number|null,
 *   last_updated: string|null,
 * }} ContagionLayer
 */

/**
 * @typedef {{
 *   id: number,
 *   bank_name: string,
 *   exposure_billions: number|null,
 *   date_reported: string|null,
 *   detail: string|null,
 *   source: string|null,
 *   created_at: string|null,
 * }} BankExposure
 */

/**
 * @typedef {{
 *   ticker: string,
 *   date: string,
 *   ytd_pct: number|null,
 *   from_high_pct: number|null,
 * }} AltManagerEquityPoint
 */

/**
 * @typedef {{
 *   chain: ContagionLayer[],
 *   bank_exposures: BankExposure[],
 *   alt_manager_equity: AltManagerEquityPoint[],
 * }} DashboardContagion
 */

/**
 * @typedef {{
 *   id: number,
 *   date: string,
 *   event_time: string|null,
 *   event: string,
 *   severity: number,
 *   category: string,
 *   source: string|null,
 *   source_name: string|null,
 *   verified: number,
 *   auto_generated: number,
 *   notes: string|null,
 *   created_at: string|null,
 *   updated_at: string|null,
 * }} TimelineEvent
 */

/**
 * @typedef {{
 *   id: number,
 *   chart_key: string,
 *   date: string,
 *   event_time: string|null,
 *   event: string,
 *   severity: number,
 * }} SeverityChartPoint
 */

/**
 * @typedef {{
 *   events: TimelineEvent[],
 *   severity_chart: SeverityChartPoint[],
 * }} DashboardTimeline
 */

/**
 * @typedef {{
 *   last_refresh: string,
 *   refresh_status: RefreshStatus,
 *   data_freshness: {
 *     prices: string,
 *     news: string,
 *     sec_filings: string,
 *   },
 * }} DashboardMeta
 */

/**
 * @typedef {{
 *   meta: DashboardMeta,
 *   overview: DashboardOverview,
 *   redemptions: DashboardRedemptions,
 *   contagion: DashboardContagion,
 *   timeline: DashboardTimeline,
 * }} DashboardPayload
 */

/**
 * @typedef {{
 *   message: string,
 *   ticker?: string,
 *   seriesId?: string,
 *   url?: string,
 *   articleTitle?: string,
 *   filingId?: string,
 * }} RefreshErrorDetail
 */

/**
 * @typedef {{
 *   source: string,
 *   status: RefreshStatus,
 *   recordsWritten: number,
 *   eventsAdded?: number,
 *   errors: RefreshErrorDetail[],
 * }} RefreshSourceResult
 */

/**
 * @typedef {{
 *   source: string,
 *   details: RefreshErrorDetail[],
 * }} RefreshIssue
 */

/**
 * @typedef {{
 *   refreshId: number,
 *   scope: RefreshScope,
 *   triggerType: RefreshTriggerType,
 *   status: 'success'|'partial'|'failed',
 *   sourcesAttempted: number,
 *   sourcesSucceeded: number,
 *   eventsAdded: number,
 *   errors: RefreshIssue[],
 *   startedAt: string,
 *   completedAt: string,
 *   durationMs: number,
 *   results: RefreshSourceResult[],
 * }} RefreshSummary
 */

/**
 * @typedef {{
 *   title: string,
 *   url: string,
 *   sourceName: string,
 *   sourceDomain: string,
 *   publishedAt: string|null,
 *   snippet: string,
 *   text: string,
 * }} NewsArticle
 */

/**
 * @typedef {{
 *   date: string,
 *   description: string,
 *   severity: number,
 *   category: EventCategory,
 *   entities: string[],
 *   dollar_amounts: Array<{ label: string, value: number, unit: string }>,
 *   percentages: Array<{ label: string, value: number }>,
 * }} ExtractedEvent
 */

/**
 * @typedef {{
 *   fund_name: string,
 *   manager: string|null,
 *   aum_billions: number|null,
 *   redemption_pct: number|null,
 *   redemption_amt_billions: number|null,
 *   status: string|null,
 *   detail: string|null,
 * }} ExtractedFundData
 */

/**
 * @typedef {{ name: string, value: number, unit: string }} ExtractedMetric
 */

/**
 * @typedef {{
 *   events: ExtractedEvent[],
 *   fund_data: ExtractedFundData[],
 *   metrics: ExtractedMetric[],
 * }} ClaudeExtractionPayload
 */

/**
 * @typedef {{
 *   data: DashboardPayload|null,
 *   loading: boolean,
 *   refreshing: boolean,
 *   lastRefresh: Date|null,
 *   error: string|null,
  *   triggerRefresh: () => Promise<void>,
 *   refetch: () => Promise<void>,
 * }} DashboardDataHookResult
 */

module.exports = {};
