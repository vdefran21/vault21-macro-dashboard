import Card from '../shared/Card';
import { COLORS } from '../../lib/constants';
import { fmtDate } from '../../lib/formatters';

/**
 * Chronological event log with severity indicators.
 */
export default function EventLog({ events }) {
  if (!events?.length) return null;
  return (
    <Card title="Detailed Event Log" subtitle="Chronological record of private credit stress events">
      <div className="flex flex-col">
        {events.map((evt, i) => (
          <div
            key={evt.id || i}
            className="grid grid-cols-[80px_12px_1fr_60px] gap-3 items-center py-2.5"
            style={{ borderBottom: i < events.length - 1 ? `1px solid ${COLORS.cardBorder}` : 'none' }}
          >
            <div className="font-mono text-[11px] text-vault-cyan text-right">
              {fmtDate(evt.date)}
            </div>
            <div className="flex justify-center">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: evt.severity >= 5 ? COLORS.red : evt.severity >= 3 ? COLORS.amber : COLORS.blue,
                  boxShadow: evt.severity >= 5 ? `0 0 6px ${COLORS.red}` : 'none',
                }}
              />
            </div>
            <div className="font-sans text-xs text-vault-white">{evt.event}</div>
            <div
              className="font-mono text-[10px] text-right"
              style={{ color: evt.severity >= 5 ? COLORS.red : COLORS.gray }}
            >
              SEV {evt.severity}/6
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
