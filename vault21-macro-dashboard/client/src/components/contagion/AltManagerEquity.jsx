import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../shared/Card';
import ChartTooltip from '../shared/ChartTooltip';
import { COLORS, AXIS_TICK, GRID_STYLE, FONT_MONO } from '../../lib/constants';

const TICKER_NAMES = {
  OWL: 'Blue Owl (OWL)', BX: 'Blackstone (BX)', KKR: 'KKR',
  ARES: 'Ares (ARES)', BLK: 'BlackRock (BLK)', APO: 'Apollo (APO)',
};

/**
 * Alt manager equity damage chart — YTD and from-high drawdowns.
 */
export default function AltManagerEquity({ data }) {
  if (!data?.length) return null;
  const chartData = data.map((d) => ({
    name: TICKER_NAMES[d.ticker] || d.ticker,
    ytd: d.ytd_pct,
    fromHigh: d.from_high_pct,
  }));

  return (
    <Card title="Alternative Manager Equity Damage" subtitle="YTD 2026 stock performance — private credit contagion hitting equity valuations">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barCategoryGap="20%">
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 9 }} />
          <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} domain={[-70, 0]} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="ytd" name="YTD 2026 %" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
          <Bar dataKey="fromHigh" name="From High %" fill={COLORS.red} radius={[4, 4, 0, 0]} />
          <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.gray }} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
