// @ts-check

import { useState } from 'react';
import { del, put } from '../../lib/api';
import Card from '../shared/Card';
import { COLORS } from '../../lib/constants';
import { fmtDateTime } from '../../lib/formatters';
import EventForm from './EventForm';

/** @typedef {import('../../../../shared/contracts.js').TimelineEvent} TimelineEvent */

/**
 * @typedef {{
 *   date: string,
 *   event_time: string,
 *   event: string,
 *   severity: string,
 *   verified: boolean,
 *   notes: string,
 * }} EventEditDraft
 */

/**
 * @param {TimelineEvent} event
 * @returns {EventEditDraft}
 */
function createEditDraft(event) {
  return {
    date: event.date,
    event_time: event.event_time || '',
    event: event.event,
    severity: String(event.severity),
    verified: Boolean(event.verified),
    notes: event.notes || '',
  };
}

/**
 * Chronological event log with manual management controls.
 *
 * @param {{
 *   events?: TimelineEvent[],
 *   onEventCreated?: () => Promise<void>|void,
 *   onEventChanged?: () => Promise<void>|void,
 * }} props
 */
export default function EventLog({ events = [], onEventCreated, onEventChanged }) {
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingId, setEditingId] = useState(/** @type {number|null} */ (null));
  const [editDraft, setEditDraft] = useState(/** @type {EventEditDraft|null} */ (null));
  const [pendingEventId, setPendingEventId] = useState(/** @type {number|null} */ (null));
  const [actionError, setActionError] = useState(/** @type {string|null} */ (null));

  function startEditing(event) {
    setActionError(null);
    setEditingId(event.id);
    setEditDraft(createEditDraft(event));
  }

  function stopEditing() {
    setEditingId(null);
    setEditDraft(null);
    setActionError(null);
  }

  async function handleUpdate(eventId) {
    if (!editDraft) {
      return;
    }

    setPendingEventId(eventId);
    setActionError(null);

    try {
      await put(`/events/${eventId}`, {
        date: editDraft.date,
        event_time: editDraft.event_time || null,
        event: editDraft.event,
        severity: Number(editDraft.severity),
        verified: editDraft.verified,
        notes: editDraft.notes || null,
      });

      await onEventChanged?.();
      stopEditing();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setPendingEventId(null);
    }
  }

  async function handleDelete(event) {
    const confirmed = window.confirm(`Delete timeline event from ${fmtDateTime(event.date, event.event_time)}?\n\n${event.event}`);

    if (!confirmed) {
      return;
    }

    setPendingEventId(event.id);
    setActionError(null);

    try {
      await del(`/events/${event.id}`);

      if (editingId === event.id) {
        stopEditing();
      }

      await onEventChanged?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setPendingEventId(null);
    }
  }

  return (
    <Card title="Detailed Event Log" subtitle="Chronological record of private credit stress events">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setShowEventForm(true)}
          className="rounded border border-vault-card-border bg-vault-bg px-3 py-1.5 font-mono text-[10px] uppercase tracking-[1px] text-vault-gray hover:border-vault-amber hover:text-vault-amber"
        >
          Add Event
        </button>
      </div>

      {!events.length && (
        <div className="rounded border border-dashed border-vault-card-border bg-vault-bg/40 px-4 py-5 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[1px] text-vault-gray">No Timeline Events Yet</div>
          <div className="mt-1 text-sm text-vault-gray">
            Use the manual entry flow to seed the event log before automated review items arrive.
          </div>
        </div>
      )}

      <div className="flex flex-col">
        {events.map((evt, i) => (
          <div
            key={evt.id || i}
            className="py-3"
            style={{ borderBottom: i < events.length - 1 ? `1px solid ${COLORS.cardBorder}` : 'none' }}
          >
            <div className="grid grid-cols-[132px_12px_1fr_118px] gap-3 items-start">
              <div className="font-mono text-[11px] text-vault-cyan text-right">
                {fmtDateTime(evt.date, evt.event_time)}
              </div>
              <div className="flex justify-center pt-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: evt.severity >= 5 ? COLORS.red : evt.severity >= 3 ? COLORS.amber : COLORS.blue,
                    boxShadow: evt.severity >= 5 ? `0 0 6px ${COLORS.red}` : 'none',
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="font-sans text-xs text-vault-white">{evt.event}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[1px]">
                  <span
                    className="rounded border px-2 py-0.5"
                    style={{
                      borderColor: evt.auto_generated ? COLORS.amberDim : COLORS.grayDark,
                      color: evt.auto_generated ? COLORS.amber : COLORS.gray,
                      background: evt.auto_generated ? 'rgba(245, 158, 11, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                    }}
                  >
                    {evt.auto_generated ? (evt.verified ? 'Reviewed' : 'Needs Review') : 'Manual'}
                  </span>
                  <span className="rounded border border-vault-card-border px-2 py-0.5 text-vault-gray">
                    {evt.category}
                  </span>
                  {evt.source && (
                    <a
                      href={evt.source}
                      target="_blank"
                      rel="noreferrer"
                      className="text-vault-cyan hover:text-vault-white"
                    >
                      Source
                    </a>
                  )}
                </div>
                {evt.notes && (
                  <div className="mt-2 rounded border border-vault-card-border bg-vault-bg/50 px-3 py-2 text-[11px] text-vault-gray">
                    {evt.notes}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div
                  className="font-mono text-[10px] text-right"
                  style={{ color: evt.severity >= 5 ? COLORS.red : COLORS.gray }}
                >
                  SEV {evt.severity}/6
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[1px]">
                  <button
                    type="button"
                    onClick={() => startEditing(evt)}
                    disabled={pendingEventId === evt.id}
                    className="text-vault-gray hover:text-vault-amber disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(evt)}
                    disabled={pendingEventId === evt.id}
                    className="text-vault-gray hover:text-vault-red disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {editingId === evt.id && editDraft && (
              <div className="mt-3 ml-[147px] rounded border border-vault-card-border bg-vault-bg/50 p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[140px_120px_100px_120px_1fr]">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Date</span>
                    <input
                      type="date"
                      value={editDraft.date}
                      onChange={(event) => {
                        const { value } = event.target;
                        setEditDraft((current) => (current ? { ...current, date: value } : current));
                      }}
                      className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Time</span>
                    <input
                      type="time"
                      value={editDraft.event_time}
                      onChange={(event) => {
                        const { value } = event.target;
                        setEditDraft((current) => (current ? { ...current, event_time: value } : current));
                      }}
                      step="60"
                      className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Severity</span>
                    <select
                      value={editDraft.severity}
                      onChange={(event) => {
                        const { value } = event.target;
                        setEditDraft((current) => (current ? { ...current, severity: value } : current));
                      }}
                      className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                    >
                      {[1, 2, 3, 4, 5, 6].map((level) => (
                        <option key={level} value={String(level)}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-end gap-2 pb-2">
                    <input
                      type="checkbox"
                      checked={editDraft.verified}
                      onChange={(event) => {
                        const { checked } = event.target;
                        setEditDraft((current) => (current ? { ...current, verified: checked } : current));
                      }}
                      className="h-4 w-4 rounded border-vault-card-border bg-vault-card accent-vault-amber"
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Verified</span>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Event Text</span>
                    <textarea
                      value={editDraft.event}
                      onChange={(event) => {
                        const { value } = event.target;
                        setEditDraft((current) => (current ? { ...current, event: value } : current));
                      }}
                      rows={2}
                      maxLength={200}
                      className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                    />
                  </label>
                </div>

                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[1px] text-vault-gray">Notes</span>
                  <textarea
                    value={editDraft.notes}
                    onChange={(event) => {
                      const { value } = event.target;
                      setEditDraft((current) => (current ? { ...current, notes: value } : current));
                    }}
                    rows={3}
                    maxLength={2000}
                    className="rounded border border-vault-card-border bg-vault-card px-3 py-2 text-sm text-vault-white outline-none focus:border-vault-amber"
                    placeholder="Add analyst context or approval notes."
                  />
                </label>

                {actionError && (
                  <div className="mt-3 rounded border border-vault-red bg-[rgba(239,68,68,0.08)] px-3 py-2 font-mono text-[11px] text-vault-red">
                    {actionError}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-end gap-3 font-mono text-[10px] uppercase tracking-[1px]">
                  <button
                    type="button"
                    onClick={stopEditing}
                    disabled={pendingEventId === evt.id}
                    className="text-vault-gray hover:text-vault-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate(evt.id)}
                    disabled={pendingEventId === evt.id}
                    className="rounded border border-vault-amber-dim bg-[rgba(245,158,11,0.08)] px-4 py-2 text-vault-amber hover:border-vault-amber disabled:opacity-50"
                  >
                    {pendingEventId === evt.id ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <EventForm
        open={showEventForm}
        onClose={() => setShowEventForm(false)}
        onCreated={async () => {
          await onEventCreated?.();
          setShowEventForm(false);
        }}
      />
    </Card>
  );
}
