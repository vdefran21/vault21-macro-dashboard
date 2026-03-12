// @ts-check

import { useState } from 'react';
import { del, put } from '../../lib/api';
import Card from '../shared/Card';
import { COLORS } from '../../lib/constants';
import { fmtDateTime } from '../../lib/formatters';

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

/**
 * @typedef {{
 *   date: string,
 *   event_time: string,
 *   event: string,
 *   severity: string,
 *   category: string,
 *   source: string,
 *   notes: string,
 * }} ReviewDraft
 */

/**
 * @param {TimelineEvent} event
 * @returns {ReviewDraft}
 */
function createDraft(event) {
  return {
    date: event.date,
    event_time: event.event_time || '',
    event: event.event,
    severity: String(event.severity),
    category: event.category || 'general',
    source: event.source || '',
    notes: event.notes || '',
  };
}

/**
 * @param {{
 *   events?: TimelineEvent[],
 *   onEventChanged?: () => Promise<void>|void,
 * }} props
 */
export default function ReviewQueue({ events = [], onEventChanged }) {
  const [editingId, setEditingId] = useState(/** @type {number|null} */ (null));
  const [draft, setDraft] = useState(/** @type {ReviewDraft|null} */ (null));
  const [pendingId, setPendingId] = useState(/** @type {number|null} */ (null));
  const [actionError, setActionError] = useState(/** @type {string|null} */ (null));

  function startEditing(event) {
    setEditingId(event.id);
    setDraft(createDraft(event));
    setActionError(null);
  }

  function stopEditing() {
    setEditingId(null);
    setDraft(null);
    setActionError(null);
  }

  /**
   * @param {TimelineEvent} event
   * @param {{ approve?: boolean }} [options]
   */
  async function saveEvent(event, options = {}) {
    const payload = editingId === event.id && draft
      ? {
          date: draft.date,
          event_time: draft.event_time || null,
          event: draft.event,
          severity: Number(draft.severity),
          category: draft.category,
          source: draft.source || null,
          notes: draft.notes || null,
          verified: options.approve ? true : event.verified,
        }
      : {
          verified: options.approve ? true : event.verified,
        };

    setPendingId(event.id);
    setActionError(null);

    try {
      await put(`/events/${event.id}`, payload);
      await onEventChanged?.();
      stopEditing();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setPendingId(null);
    }
  }

  /**
   * @param {TimelineEvent} event
   */
  async function rejectEvent(event) {
    const confirmed = window.confirm(`Reject auto-generated event from ${fmtDateTime(event.date, event.event_time)}?\n\n${event.event}`);

    if (!confirmed) {
      return;
    }

    setPendingId(event.id);
    setActionError(null);

    try {
      await del(`/events/${event.id}`);
      await onEventChanged?.();

      if (editingId === event.id) {
        stopEditing();
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card
      title={events.length ? `News Review Queue (${events.length})` : 'News Review Queue'}
      subtitle="Approve, reject, or edit auto-generated candidates before they enter the verified crisis chronology"
    >
      {!events.length && (
        <div className="rounded border border-dashed border-vault-card-border bg-vault-bg/40 px-4 py-5 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[1px] text-vault-gray">Queue Clear</div>
          <div className="mt-1 text-sm text-vault-gray">
            New SEC and news extraction candidates will appear here for triage.
          </div>
        </div>
      )}

      {actionError && editingId == null && (
        <div className="mb-3 rounded border border-vault-red bg-[rgba(239,68,68,0.08)] px-3 py-2 font-mono text-[11px] text-vault-red">
          {actionError}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <div key={event.id} className="rounded border border-vault-card-border bg-vault-bg/40 p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="font-mono text-[11px] uppercase tracking-[1px] text-vault-cyan">
                  {fmtDateTime(event.date, event.event_time)}
                </div>
                <div className="mt-2 text-sm text-vault-white">{event.event}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[1px]">
                  <span
                    className="rounded border px-2 py-0.5"
                    style={{
                      borderColor: COLORS.amberDim,
                      color: COLORS.amber,
                      background: 'rgba(245, 158, 11, 0.08)',
                    }}
                  >
                    Pending Review
                  </span>
                  <span className="rounded border border-vault-card-border px-2 py-0.5 text-vault-gray">
                    {event.category}
                  </span>
                  <span className="text-vault-gray">{event.source_name || 'Unknown source'}</span>
                  {event.source && (
                    <a
                      href={event.source}
                      target="_blank"
                      rel="noreferrer"
                      className="text-vault-cyan hover:text-vault-white"
                    >
                      Source
                    </a>
                  )}
                </div>
                {event.notes && (
                  <div className="mt-3 rounded border border-vault-card-border bg-vault-card px-3 py-2 text-[11px] text-vault-gray">
                    {event.notes}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <div
                  className="font-mono text-[10px] uppercase tracking-[1px]"
                  style={{ color: event.severity >= 5 ? COLORS.red : event.severity >= 3 ? COLORS.amber : COLORS.cyan }}
                >
                  Severity {event.severity}/6
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[1px]">
                  <button
                    type="button"
                    onClick={() => saveEvent(event, { approve: true })}
                    disabled={pendingId === event.id}
                    className="rounded border border-vault-cyan/40 bg-[rgba(6,182,212,0.08)] px-3 py-1.5 text-vault-cyan hover:border-vault-cyan disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditing(event)}
                    disabled={pendingId === event.id}
                    className="text-vault-gray hover:text-vault-amber disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectEvent(event)}
                    disabled={pendingId === event.id}
                    className="text-vault-gray hover:text-vault-red disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>

            {editingId === event.id && draft && (
              <div className="mt-4 rounded border border-vault-card-border bg-vault-card p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[140px_120px_110px_1fr]">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Date</span>
                    <input
                      type="date"
                      value={draft.date}
                      onChange={(eventValue) => {
                        const { value } = eventValue.target;
                        setDraft((current) => (current ? { ...current, date: value } : current));
                      }}
                      className="rounded border border-vault-card-border bg-vault-bg px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Time</span>
                    <input
                      type="time"
                      value={draft.event_time}
                      onChange={(eventValue) => {
                        const { value } = eventValue.target;
                        setDraft((current) => (current ? { ...current, event_time: value } : current));
                      }}
                      step="60"
                      className="rounded border border-vault-card-border bg-vault-bg px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Severity</span>
                    <select
                      value={draft.severity}
                      onChange={(eventValue) => {
                        const { value } = eventValue.target;
                        setDraft((current) => (current ? { ...current, severity: value } : current));
                      }}
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
                      value={draft.category}
                      onChange={(eventValue) => {
                        const { value } = eventValue.target;
                        setDraft((current) => (current ? { ...current, category: value } : current));
                      }}
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

                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Event Text</span>
                  <textarea
                    value={draft.event}
                    onChange={(eventValue) => {
                      const { value } = eventValue.target;
                      setDraft((current) => (current ? { ...current, event: value } : current));
                    }}
                    rows={3}
                    maxLength={200}
                    className="rounded border border-vault-card-border bg-vault-bg px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                  />
                </label>

                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Source URL</span>
                  <input
                    type="url"
                    value={draft.source}
                    onChange={(eventValue) => {
                      const { value } = eventValue.target;
                      setDraft((current) => (current ? { ...current, source: value } : current));
                    }}
                    className="rounded border border-vault-card-border bg-vault-bg px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                  />
                </label>

                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Notes</span>
                  <textarea
                    value={draft.notes}
                    onChange={(eventValue) => {
                      const { value } = eventValue.target;
                      setDraft((current) => (current ? { ...current, notes: value } : current));
                    }}
                    rows={3}
                    maxLength={2000}
                    className="rounded border border-vault-card-border bg-vault-bg px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                  />
                </label>

                {actionError && (
                  <div className="mt-3 rounded border border-vault-red bg-[rgba(239,68,68,0.08)] px-3 py-2 font-mono text-[11px] text-vault-red">
                    {actionError}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-end gap-3 font-mono text-[10px] uppercase tracking-[1px]">
                  <button
                    type="button"
                    onClick={stopEditing}
                    disabled={pendingId === event.id}
                    className="text-vault-gray hover:text-vault-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveEvent(event)}
                    disabled={pendingId === event.id}
                    className="rounded border border-vault-card-border bg-vault-bg px-4 py-2 text-vault-gray hover:text-vault-white disabled:opacity-50"
                  >
                    {pendingId === event.id ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveEvent(event, { approve: true })}
                    disabled={pendingId === event.id}
                    className="rounded border border-vault-cyan/40 bg-[rgba(6,182,212,0.08)] px-4 py-2 text-vault-cyan hover:border-vault-cyan disabled:opacity-50"
                  >
                    {pendingId === event.id ? 'Saving...' : 'Save & Approve'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
