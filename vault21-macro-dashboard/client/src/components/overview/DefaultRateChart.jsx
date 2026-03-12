import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import Card from '../shared/Card';
import ChartTooltip from '../shared/ChartTooltip';
import { COLORS, AXIS_TICK, GRID_STYLE, FONT_MONO } from '../../lib/constants';

/**
 * Custom legend showing Headline Rate as a single swatch and
 * True Rate as a 3-stop color scale (cyan → amber → red) with threshold labels.
 */
function DefaultRateLegend() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, fontFamily: FONT_MONO, fontSize: 10, color: COLORS.gray, marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: COLORS.blue }} />
        Headline Rate %
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        True Rate %
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: COLORS.cyan }} />
          <span style={{ color: COLORS.gray, fontSize: 9 }}>&lt;5%</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: COLORS.amber }} />
          <span style={{ color: COLORS.gray, fontSize: 9 }}>5-10%</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: COLORS.red }} />
          <span style={{ color: COLORS.gray, fontSize: 9 }}>&ge;10%</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Default rate comparison chart — headline vs "true" rates.
 * True Rate bars use heat-map coloring: cyan (<5%), amber (5-10%), red (≥10%).
 */
export default function DefaultRateChart({ data }) {
  if (!data?.length) return null;
  return (
    <Card title="Default Rate Comparison" subtitle="Headline vs 'True' default rates (incl. selective defaults & LMEs)">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="25%">
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="year" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={0} />
          <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} domain={[0, 16]} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="headline" name="Headline Rate %" fill={COLORS.blue} radius={[3, 3, 0, 0]} />
          <Bar dataKey="true" name="True Rate %" fill={COLORS.amber} radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.true >= 10 ? COLORS.red : entry.true >= 5 ? COLORS.amber : COLORS.cyan} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <DefaultRateLegend />
    </Card>
  );
}
