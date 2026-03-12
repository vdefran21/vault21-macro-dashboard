import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../shared/Card';
import ChartTooltip from '../shared/ChartTooltip';
import { COLORS, AXIS_TICK, GRID_STYLE } from '../../lib/constants';

/**
 * PIK (Payment-in-Kind) income trend area chart.
 */
export default function PIKTrend({ data }) {
  if (!data?.length) return null;
  return (
    <Card title="PIK Income Trend" subtitle="% of BDC investment income received as Payment-in-Kind">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="pikGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.red} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="quarter" tick={{ ...AXIS_TICK, fontSize: 9 }} interval={1} />
          <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} domain={[4, 9]} />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone" dataKey="pik" name="PIK %"
            stroke={COLORS.red} fill="url(#pikGrad)" strokeWidth={2}
            dot={{ fill: COLORS.red, r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
