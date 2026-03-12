import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import Card from '../shared/Card';
import { COLORS, AXIS_TICK, GRID_STYLE, FONT_MONO } from '../../lib/constants';
import { fmtDate, fmtShortDate } from '../../lib/formatters';

/**
 * Custom tooltip for timeline severity chart.
 */
function TimelineTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div
      style={{
        background: '#1e293b', border: `1px solid ${COLORS.grayDark}`,
        borderRadius: 4, padding: '8px 12px', fontFamily: FONT_MONO, fontSize: 11, maxWidth: 240,
      }}
    >
      <div style={{ color: COLORS.amber, marginBottom: 4 }}>{fmtDate(d?.date)}</div>
      <div style={{ color: COLORS.white }}>{d?.event}</div>
      <div style={{ color: COLORS.red, marginTop: 4 }}>Severity: {d?.severity}/6</div>
    </div>
  );
}

/**
 * Severity over time composed chart (bars + trend line).
 */
export default function SeverityChart({ data }) {
  if (!data?.length) return null;
  return (
    <Card title="Crisis Escalation Timeline" subtitle="Event severity (1-6 scale) — acceleration pattern visible from Feb 2026 onward">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="date" tick={{ ...AXIS_TICK, fontSize: 9 }}
            tickFormatter={fmtShortDate}
            interval={0} angle={-35} textAnchor="end" height={60}
          />
          <YAxis
            tick={AXIS_TICK} domain={[0, 7]}
            label={{ value: 'Severity', angle: -90, position: 'insideLeft', fill: COLORS.gray, fontSize: 10 }}
          />
          <Tooltip content={<TimelineTooltip />} />
          <Bar dataKey="severity" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.severity >= 5 ? COLORS.red : entry.severity >= 3 ? COLORS.amber : COLORS.blue}
              />
            ))}
          </Bar>
          <Line type="monotone" dataKey="severity" stroke={COLORS.amber} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
