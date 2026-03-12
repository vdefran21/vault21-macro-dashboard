import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import Card from '../shared/Card';
import ChartTooltip from '../shared/ChartTooltip';
import { COLORS, AXIS_TICK, GRID_STYLE } from '../../lib/constants';

const YEAR_COLORS = { '2026': COLORS.red, '2027': COLORS.amber, '2028': COLORS.amberDim, '2029': COLORS.grayDark };

/**
 * Maturity wall bar chart — debt maturing by year.
 */
export default function MaturityWall({ data }) {
  if (!data?.length) return null;
  return (
    <Card title="Maturity Wall" subtitle="Private credit debt maturing by year ($B) — refinancing at higher rates">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="year" tick={{ ...AXIS_TICK, fontSize: 11 }} />
          <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${v}B`} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="amount" name="Maturing Debt $B" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={YEAR_COLORS[entry.year] || COLORS.grayDark} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
