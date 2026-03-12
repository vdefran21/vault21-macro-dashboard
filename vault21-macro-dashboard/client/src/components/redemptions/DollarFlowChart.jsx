import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../shared/Card';
import ChartTooltip from '../shared/ChartTooltip';
import { COLORS, AXIS_TICK, GRID_STYLE, FONT_MONO } from '../../lib/constants';

/**
 * Dollar flows chart — requested vs returned ($B).
 */
export default function DollarFlowChart({ data }) {
  if (!data?.length) return null;
  return (
    <Card title="Dollar Flows: Requested vs Returned" subtitle="$B — gap between what investors want out and what they actually receive">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="fund" tick={{ ...AXIS_TICK, fontSize: 10 }} />
          <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${v}B`} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="requested" name="Requested $B" fill={COLORS.red} radius={[4, 4, 0, 0]} />
          <Bar dataKey="returned" name="Returned $B" fill={COLORS.green} radius={[4, 4, 0, 0]} />
          <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.gray }} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
