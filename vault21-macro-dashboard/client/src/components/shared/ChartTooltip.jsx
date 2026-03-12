import { COLORS, FONT_MONO } from '../../lib/constants';

/**
 * Shared Recharts custom tooltip for all chart types.
 * Renders a dark-themed tooltip with label + payload values.
 */
export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#1e293b',
        border: `1px solid ${COLORS.grayDark}`,
        borderRadius: 4,
        padding: '8px 12px',
        fontFamily: FONT_MONO,
        fontSize: 11,
      }}
    >
      <div style={{ color: COLORS.white, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill, marginTop: 2 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
}
