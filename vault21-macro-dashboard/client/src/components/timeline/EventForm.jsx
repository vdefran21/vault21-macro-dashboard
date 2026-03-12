// @ts-check

import { useState } from 'react';
import { post } from '../../lib/api';
import { COLORS } from '../../lib/constants';

/** @typedef {import('../../../../shared/contracts.js').TimelineEvent} TimelineEvent */

const EVENT_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'redemption', label: 'Redemption' },
  { value: 'gating', label: 'Gating' },
  { value: 'bankruptcy', label: 'Bankruptcy' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'bank_action', label: 'Bank Action' },
  { value: 'market_move', label: 'Market Move' },
  { value: 'analyst_warning', label: 'Analyst Warning' },
  { value: 'policy', label: 'Policy' },
];

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentTimeValue() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function createInitialForm() {
  return {
    date: getTodayIsoDate(),
    event_time: getCurrentTimeValue(),
    event: '',
    severity: '3',
    category: 'general',
    source: '',
    notes: '',
  };
}

/**
 * Modal form for creating a manual timeline event.
 *
 * @param {{
 *   open: boolean,
 *   onClose?: () => void,
 *   onCreated?: (event: TimelineEvent) => void|Promise<void>,
 * }} props
 */
export default function EventForm({ open, onClose, onCreated }) {
  const [form, setForm] = useState(createInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(/** @type {string|null} */ (null));

  if (!open) return null;

  function handleChange(evt) {
    const { name, value } = evt.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleClose() {
    setError(null);
    setSubmitting(false);
    setForm(createInitialForm());
    onClose?.();
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const created = await post('/events', {
        date: form.date,
        event_time: form.event_time,
        event: form.event,
        severity: Number(form.severity),
        category: form.category,
        source: form.source || null,
        notes: form.notes || null,
      });

      setForm(createInitialForm());
      await onCreated?.(created);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      onClick={(evt) => {
        if (evt.target === evt.currentTarget && !submitting) {
          handleClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl rounded-md border border-vault-card-border bg-vault-card p-5 shadow-2xl"
        style={{ boxShadow: `0 18px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px ${COLORS.cardBorder}` }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[2px] uppercase text-vault-amber">Add Timeline Event</div>
            <div className="mt-1 text-sm text-vault-gray">
              Manual entries are marked verified by default and appear in the detailed event log immediately after save.
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="font-mono text-[10px] tracking-[1px] uppercase text-vault-gray hover:text-vault-white disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_120px_120px_1fr]">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Date</span>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="rounded border border-vault-card-border bg-vault-bg px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Time</span>
              <input
                type="time"
                name="event_time"
                value={form.event_time}
                onChange={handleChange}
                step="60"
                className="rounded border border-vault-card-border bg-vault-bg px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Severity</span>
              <select
                name="severity"
                value={form.severity}
                onChange={handleChange}
                className="rounded border border-vault-card-border bg-vault-bg px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
              >
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <option key={level} value={String(level)}>
                    {level}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Category</span>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="rounded border border-vault-card-border bg-vault-bg px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
              >
                {EVENT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Event</span>
            <textarea
              name="event"
              value={form.event}
              onChange={handleChange}
              rows={3}
              maxLength={200}
              placeholder="Describe the event, stress signal, or intervention."
              className="rounded border border-vault-card-border bg-vault-bg px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Source URL</span>
            <input
              type="url"
              name="source"
              value={form.source}
              onChange={handleChange}
              placeholder="https://..."
              className="rounded border border-vault-card-border bg-vault-bg px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Notes</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              maxLength={2000}
              placeholder="Optional context, caveats, or analyst notes."
              className="rounded border border-vault-card-border bg-vault-bg px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
            />
          </label>

          {error && (
            <div className="rounded border border-vault-red bg-[rgba(239,68,68,0.08)] px-3 py-2 font-mono text-[11px] text-vault-red">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray hover:text-vault-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded border border-vault-amber-dim bg-[rgba(245,158,11,0.08)] px-4 py-2 font-mono text-[10px] uppercase tracking-[1px] text-vault-amber hover:border-vault-amber disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
