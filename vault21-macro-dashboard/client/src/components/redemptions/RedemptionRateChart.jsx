import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import Card from '../shared/Card';
import ChartTooltip from '../shared/ChartTooltip';
import { COLORS, AXIS_TICK, GRID_STYLE, FONT_MONO } from '../../lib/constants';

/**
 * Returns bar fill color based on how far the requested rate exceeds the 5% gate.
 * - ≤5%: cyan (within gate)
 * - 5–10%: amber (moderately over gate)
 * - >10%: red (severely over gate)
 */
function getRequestedColor(requested) {
  if (requested > 10) return COLORS.red;
  if (requested > 5) return COLORS.amber;
  return COLORS.cyan;
}

/**
 * Custom legend showing Actually Paid as a single swatch and
 * Requested % as a 3-stop color scale relative to the 5% gate threshold.
 */
function RedemptionLegend() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, fontFamily: FONT_MONO, fontSize: 10, color: COLORS.gray, marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: COLORS.green, opacity: 0.6 }} />
        Actually Paid %
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        Requested %
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: COLORS.cyan }} />
          <span style={{ color: COLORS.gray, fontSize: 9 }}>≤5%</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: COLORS.amber }} />
          <span style={{ color: COLORS.gray, fontSize: 9 }}>5-10%</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: COLORS.red }} />
          <span style={{ color: COLORS.gray, fontSize: 9 }}>&gt;10%</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Redemption rates vs 5% gate threshold bar chart.
 * Requested % bars use heat-map coloring based on gate breach severity.
 */
export default function RedemptionRateChart({ data }) {
  if (!data?.length) return null;
  return (
    <Card title="Redemption Rates vs 5% Gate Threshold" subtitle="% of shares requested for redemption — dashed line = standard quarterly cap">
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} barCategoryGap="25%">
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="fund" tick={{ ...AXIS_TICK, fontSize: 11 }} />
          <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} domain={[0, 28]} />
          <Tooltip content={<ChartTooltip />} />
          <ReferenceLine
            y={5} stroke={COLORS.amber} strokeDasharray="6 3" strokeWidth={2}
            label={{ value: '5% GATE', fill: COLORS.amber, fontSize: 10, fontFamily: FONT_MONO, position: 'right' }}
          />
          <Bar dataKey="paid" name="Actually Paid %" fill={COLORS.green} radius={[4, 4, 0, 0]} fillOpacity={0.6} />
          <Bar dataKey="requested" name="Requested %" fill={COLORS.amber} radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getRequestedColor(entry.requested)} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
      <RedemptionLegend />
      <div className="font-mono text-[10px] text-vault-gray mt-2 text-center">
        OBDC II: 200%+ surge shown capped at 25% for scale — fund permanently gated / liquidating
      </div>
    </Card>
  );
}
