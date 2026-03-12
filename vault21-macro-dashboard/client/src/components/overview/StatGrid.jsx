import { COLORS, FONT_MONO } from '../../lib/constants';

const STAT_CONFIG = [
  { key: 'industry_aum', label: 'Industry AUM', color: COLORS.white, fmt: (v, u) => `$${v / 1000}${u}` },
  { key: 'bank_lending', label: 'Bank Lending to PC', color: COLORS.amber, fmt: (v, u) => `$${v}${u}` },
  { key: 'q1_redemptions', label: 'Q1 Redemptions', color: COLORS.red, fmt: (v, u) => `$${v}${u}` },
  { key: 'maturity_wall_2026', label: 'Maturity Wall 2026', color: COLORS.red, fmt: (v, u) => `$${v}${u}` },
  { key: 'software_share', label: 'Software Loan Share', color: COLORS.amber, fmt: (v, u) => `~${v}${u}` },
  { key: 'true_default_rate', label: 'True Default Rate', color: COLORS.red, fmt: (v, u) => `~${v}${u}`, sub: 'vs 1.8% headline' },
];

/**
 * Top-line stats row showing key metrics from overview.stats.
 */
export default function StatGrid({ stats }) {
  if (!stats) return null;
  return (
    <div className="flex gap-3 flex-wrap">
      {STAT_CONFIG.map((cfg) => {
        const s = stats[cfg.key];
        if (!s) return null;
        return (
          <div
            key={cfg.key}
            className="text-center py-3 px-4 bg-white/[0.02] rounded border border-vault-card-border min-w-[100px]"
          >
            <div className="font-mono text-[22px] font-bold leading-tight" style={{ color: cfg.color }}>
              {cfg.fmt(s.value, s.unit)}
            </div>
            <div className="font-sans text-[11px] text-vault-gray mt-1">{cfg.label}</div>
            {cfg.sub && (
              <div className="font-mono text-[10px] text-vault-gray-dark mt-0.5">{cfg.sub}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
