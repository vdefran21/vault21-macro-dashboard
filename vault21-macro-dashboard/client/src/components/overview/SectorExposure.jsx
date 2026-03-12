import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import Card from '../shared/Card';
import ChartTooltip from '../shared/ChartTooltip';
import { COLORS, AXIS_TICK, GRID_STYLE } from '../../lib/constants';

const SECTOR_COLORS = {
  'Software/SaaS': COLORS.red,
  Healthcare: COLORS.blue,
  'Business Services': COLORS.cyan,
  'Financial Services': COLORS.purple,
  Industrial: COLORS.amber,
  Other: COLORS.grayDark,
};

/**
 * Horizontal bar chart showing borrower sector concentration.
 */
export default function SectorExposure({ data }) {
  if (!data?.length) return null;
  return (
    <Card title="Borrower Sector Concentration" subtitle="% of sponsor-backed private credit loans by sector">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" barCategoryGap="20%">
          <CartesianGrid {...GRID_STYLE} horizontal={false} />
          <XAxis type="number" tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} domain={[0, 45]} />
          <YAxis type="category" dataKey="name" width={100} tick={AXIS_TICK} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" name="Share %" radius={[0, 3, 3, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={SECTOR_COLORS[entry.name] || COLORS.grayDark} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
