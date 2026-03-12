import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import Card from '../shared/Card';
import ChartTooltip from '../shared/ChartTooltip';
import { COLORS, AXIS_TICK, GRID_STYLE } from '../../lib/constants';

/**
 * Bank exposure to private credit bar chart + warning banner.
 */
export default function BankExposure({ data }) {
  if (!data?.length) return null;

  // Add "Total Industry" as first bar
  const chartData = [
    { bank: 'Total Industry', exposure: 300 },
    ...data.map((b) => ({ bank: b.bank_name, exposure: b.exposure_billions })),
  ];
  const barColors = [COLORS.red, COLORS.amber, COLORS.amber, COLORS.blue, COLORS.blue];

  return (
    <Card title="Bank Exposure to Private Credit" subtitle="Known lending to private credit funds — JPMorgan now marking down collateral">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barCategoryGap="25%">
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="bank" tick={{ ...AXIS_TICK, fontSize: 10 }} />
          <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${v}B`} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="exposure" name="Exposure $B" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={barColors[i] || COLORS.blue} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div
        className="font-mono text-[10px] text-vault-red text-center mt-2 py-1.5 px-3 rounded"
        style={{ background: 'rgba(239,68,68,0.08)', border: `1px solid ${COLORS.redDim}` }}
      >
        JPM ACTIVELY MARKING DOWN SOFTWARE LOAN COLLATERAL — FIRST MAJOR BANK TO DO SO — OTHERS EXPECTED TO FOLLOW
      </div>
    </Card>
  );
}
