// @ts-check

import { useEffect, useState } from 'react';
import { post } from '../../lib/api';
import Card from '../shared/Card';

/** @typedef {import('../../../../shared/contracts.js').RedemptionFund} RedemptionFund */

const FUND_TYPES = [
  { value: 'semi_liquid', label: 'Semi-Liquid' },
  { value: 'interval_fund', label: 'Interval Fund' },
  { value: 'BDC', label: 'BDC' },
  { value: 'closed_end', label: 'Closed-End' },
  { value: 'other', label: 'Other' },
];

const REDEMPTION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'extraordinary', label: 'Extraordinary' },
  { value: 'gated', label: 'Gated' },
  { value: 'liquidating', label: 'Liquidating' },
];

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentQuarterLabel() {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${quarter} ${now.getFullYear()}`;
}

function createFundForm() {
  return {
    name: '',
    ticker: '',
    manager: '',
    aum_billions: '',
    fund_type: 'semi_liquid',
  };
}

/**
 * @param {string} fundId
 */
function createRedemptionForm(fundId) {
  return {
    fund_id: fundId,
    quarter: getCurrentQuarterLabel(),
    date: getTodayIsoDate(),
    redemption_requested_pct: '',
    redemption_requested_amt: '',
    redemption_paid_pct: '',
    redemption_paid_amt: '',
    gate_threshold_pct: '5',
    status: 'pending',
    response_detail: '',
    source: '',
  };
}

/**
 * @param {{
 *   funds?: RedemptionFund[],
 *   onChanged?: () => Promise<void>|void,
 * }} props
 */
export default function FundManagementPanel({ funds = [], onChanged }) {
  const [fundForm, setFundForm] = useState(createFundForm);
  const [redemptionForm, setRedemptionForm] = useState(() => createRedemptionForm(funds[0] ? String(funds[0].id) : ''));
  const [fundSubmitting, setFundSubmitting] = useState(false);
  const [redemptionSubmitting, setRedemptionSubmitting] = useState(false);
  const [fundError, setFundError] = useState(/** @type {string|null} */ (null));
  const [redemptionError, setRedemptionError] = useState(/** @type {string|null} */ (null));
  const [fundSuccess, setFundSuccess] = useState(/** @type {string|null} */ (null));
  const [redemptionSuccess, setRedemptionSuccess] = useState(/** @type {string|null} */ (null));

  useEffect(() => {
    if (!funds.length) {
      setRedemptionForm((current) => ({ ...current, fund_id: '' }));
      return;
    }

    setRedemptionForm((current) => {
      const hasSelectedFund = funds.some((fund) => String(fund.id) === current.fund_id);
      return hasSelectedFund ? current : { ...current, fund_id: String(funds[0].id) };
    });
  }, [funds]);

  function handleFundChange(event) {
    const { name, value } = event.target;
    setFundForm((current) => ({ ...current, [name]: value }));
  }

  function handleRedemptionChange(event) {
    const { name, value } = event.target;
    setRedemptionForm((current) => ({ ...current, [name]: value }));
  }

  async function handleFundSubmit(event) {
    event.preventDefault();
    setFundSubmitting(true);
    setFundError(null);
    setFundSuccess(null);

    try {
      const created = await post('/funds', {
        name: fundForm.name,
        ticker: fundForm.ticker || null,
        manager: fundForm.manager,
        aum_billions: fundForm.aum_billions || null,
        fund_type: fundForm.fund_type || null,
      });

      setFundForm(createFundForm());
      setRedemptionForm((current) => ({ ...current, fund_id: created?.id ? String(created.id) : current.fund_id }));
      await onChanged?.();
      setFundSuccess(created?.name ? `Added ${created.name}` : 'Fund added');
    } catch (error) {
      setFundError(error instanceof Error ? error.message : String(error));
    } finally {
      setFundSubmitting(false);
    }
  }

  async function handleRedemptionSubmit(event) {
    event.preventDefault();
    setRedemptionSubmitting(true);
    setRedemptionError(null);
    setRedemptionSuccess(null);

    try {
      const selectedFundId = redemptionForm.fund_id;

      if (!selectedFundId) {
        throw new Error('Select a fund before adding a redemption update');
      }

      const response = await post(`/funds/${selectedFundId}/redemptions`, {
        quarter: redemptionForm.quarter,
        date: redemptionForm.date,
        redemption_requested_pct: redemptionForm.redemption_requested_pct || null,
        redemption_requested_amt: redemptionForm.redemption_requested_amt || null,
        redemption_paid_pct: redemptionForm.redemption_paid_pct || null,
        redemption_paid_amt: redemptionForm.redemption_paid_amt || null,
        gate_threshold_pct: redemptionForm.gate_threshold_pct || null,
        status: redemptionForm.status,
        response_detail: redemptionForm.response_detail || null,
        source: redemptionForm.source || null,
      });

      setRedemptionForm(createRedemptionForm(selectedFundId));
      await onChanged?.();
      setRedemptionSuccess(response?.fund?.name ? `Logged update for ${response.fund.name}` : 'Redemption update added');
    } catch (error) {
      setRedemptionError(error instanceof Error ? error.message : String(error));
    } finally {
      setRedemptionSubmitting(false);
    }
  }

  return (
    <Card
      title="Fund Management"
      subtitle="Add tracked private credit vehicles and append redemption updates without leaving the dashboard"
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)]">
        <div className="rounded border border-vault-card-border bg-vault-bg/40 p-4">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[1px] text-vault-cyan">Add Tracked Fund</div>
          <form onSubmit={handleFundSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Fund Name</span>
                <input
                  type="text"
                  name="name"
                  value={fundForm.name}
                  onChange={handleFundChange}
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Manager</span>
                <input
                  type="text"
                  name="manager"
                  value={fundForm.manager}
                  onChange={handleFundChange}
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Ticker</span>
                <input
                  type="text"
                  name="ticker"
                  value={fundForm.ticker}
                  onChange={handleFundChange}
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                  placeholder="Optional"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">AUM ($B)</span>
                <input
                  type="number"
                  name="aum_billions"
                  value={fundForm.aum_billions}
                  onChange={handleFundChange}
                  min="0"
                  step="0.1"
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                  placeholder="Optional"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Fund Type</span>
              <select
                name="fund_type"
                value={fundForm.fund_type}
                onChange={handleFundChange}
                className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
              >
                {FUND_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            {fundError && (
              <div className="rounded border border-vault-red bg-[rgba(239,68,68,0.08)] px-3 py-2 font-mono text-[11px] text-vault-red">
                {fundError}
              </div>
            )}

            {fundSuccess && (
              <div className="rounded border border-vault-cyan bg-[rgba(6,182,212,0.08)] px-3 py-2 font-mono text-[11px] text-vault-cyan">
                {fundSuccess}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={fundSubmitting}
                className="rounded border border-vault-amber-dim bg-[rgba(245,158,11,0.08)] px-4 py-2 font-mono text-[10px] uppercase tracking-[1px] text-vault-amber hover:border-vault-amber disabled:opacity-50"
              >
                {fundSubmitting ? 'Saving...' : 'Add Fund'}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded border border-vault-card-border bg-vault-bg/40 p-4">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[1px] text-vault-amber">Add Redemption Update</div>
          <form onSubmit={handleRedemptionSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Fund</span>
                <select
                  name="fund_id"
                  value={redemptionForm.fund_id}
                  onChange={handleRedemptionChange}
                  disabled={!funds.length}
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber disabled:opacity-60"
                >
                  {!funds.length && <option value="">Add a fund first</option>}
                  {funds.map((fund) => (
                    <option key={fund.id} value={String(fund.id)}>
                      {fund.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Status</span>
                <select
                  name="status"
                  value={redemptionForm.status}
                  onChange={handleRedemptionChange}
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                >
                  {REDEMPTION_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Quarter</span>
                <input
                  type="text"
                  name="quarter"
                  value={redemptionForm.quarter}
                  onChange={handleRedemptionChange}
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Date</span>
                <input
                  type="date"
                  name="date"
                  value={redemptionForm.date}
                  onChange={handleRedemptionChange}
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Requested %</span>
                <input
                  type="number"
                  name="redemption_requested_pct"
                  value={redemptionForm.redemption_requested_pct}
                  onChange={handleRedemptionChange}
                  min="0"
                  step="0.1"
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Requested $B</span>
                <input
                  type="number"
                  name="redemption_requested_amt"
                  value={redemptionForm.redemption_requested_amt}
                  onChange={handleRedemptionChange}
                  min="0"
                  step="0.01"
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Paid %</span>
                <input
                  type="number"
                  name="redemption_paid_pct"
                  value={redemptionForm.redemption_paid_pct}
                  onChange={handleRedemptionChange}
                  min="0"
                  step="0.1"
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Paid $B</span>
                <input
                  type="number"
                  name="redemption_paid_amt"
                  value={redemptionForm.redemption_paid_amt}
                  onChange={handleRedemptionChange}
                  min="0"
                  step="0.01"
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Gate Threshold %</span>
                <input
                  type="number"
                  name="gate_threshold_pct"
                  value={redemptionForm.gate_threshold_pct}
                  onChange={handleRedemptionChange}
                  min="0"
                  step="0.1"
                  className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Source URL</span>
              <input
                type="url"
                name="source"
                value={redemptionForm.source}
                onChange={handleRedemptionChange}
                placeholder="https://..."
                className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Response Detail</span>
              <textarea
                name="response_detail"
                value={redemptionForm.response_detail}
                onChange={handleRedemptionChange}
                rows={3}
                placeholder="How the fund handled withdrawals, gating, backstops, or timing."
                className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
              />
            </label>

            {redemptionError && (
              <div className="rounded border border-vault-red bg-[rgba(239,68,68,0.08)] px-3 py-2 font-mono text-[11px] text-vault-red">
                {redemptionError}
              </div>
            )}

            {redemptionSuccess && (
              <div className="rounded border border-vault-cyan bg-[rgba(6,182,212,0.08)] px-3 py-2 font-mono text-[11px] text-vault-cyan">
                {redemptionSuccess}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={redemptionSubmitting || !funds.length}
                className="rounded border border-vault-amber-dim bg-[rgba(245,158,11,0.08)] px-4 py-2 font-mono text-[10px] uppercase tracking-[1px] text-vault-amber hover:border-vault-amber disabled:opacity-50"
              >
                {redemptionSubmitting ? 'Saving...' : 'Add Redemption Update'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-4 rounded border border-vault-card-border bg-vault-bg/30 p-4">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Tracked Vehicles</div>
        {!funds.length && (
          <div className="rounded border border-dashed border-vault-card-border bg-vault-card/50 px-3 py-4 text-center text-sm text-vault-gray">
            No tracked funds yet. Add the first vehicle above to start the watchlist.
          </div>
        )}
        {!!funds.length && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {funds.map((fund) => (
              <div key={fund.id} className="rounded border border-vault-card-border bg-vault-card px-3 py-2">
                <div className="font-mono text-[12px] text-vault-white">{fund.name}</div>
                <div className="mt-1 text-[11px] text-vault-gray">
                  {fund.manager} · {fund.fund_type || 'Unclassified'} · {fund.aum_billions != null ? `$${fund.aum_billions}B` : 'AUM n/a'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
