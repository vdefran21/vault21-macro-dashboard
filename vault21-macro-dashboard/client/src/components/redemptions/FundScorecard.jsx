import Card from '../shared/Card';
import StatusBadge from '../shared/StatusBadge';
import { COLORS } from '../../lib/constants';

/**
 * Fund-by-fund redemption scorecard with status badges.
 */
export default function FundScorecard({ funds }) {
  if (!funds?.length) return null;
  return (
    <Card title="Fund Redemption Scorecard" subtitle="Latest redemption snapshot across tracked private credit vehicles">
      <div className="flex flex-col gap-3">
        {funds.map((fund, i) => (
          <div
            key={i}
            className="grid grid-cols-5 items-center px-4 py-3 bg-white/[0.02] rounded border border-vault-card-border gap-3"
          >
            <div>
              <div className="font-mono text-[13px] font-bold text-vault-white">{fund.name}</div>
              <div className="font-mono text-[10px] text-vault-gray mt-0.5">{fund.response_detail || 'Awaiting first redemption entry'}</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-base font-bold text-vault-cyan">
                {fund.aum_billions != null ? `$${fund.aum_billions}B` : '—'}
              </div>
              <div className="text-[9px] text-vault-gray font-mono">AUM</div>
            </div>
            <div className="text-center">
              <div
                className="font-mono text-base font-bold"
                style={{
                  color:
                    fund.redemption_requested_pct == null
                      ? COLORS.gray
                      : fund.redemption_requested_pct > 50
                        ? COLORS.red
                        : COLORS.amber,
                }}
              >
                {fund.redemption_requested_pct == null
                  ? '—'
                  : fund.redemption_requested_pct > 100
                    ? '200%+'
                    : `${fund.redemption_requested_pct}%`}
              </div>
              <div className="text-[9px] text-vault-gray font-mono">REDEMPTION REQ</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-base font-bold text-vault-white">
                {fund.redemption_requested_amt != null ? `$${fund.redemption_requested_amt}B` : '—'}
              </div>
              <div className="text-[9px] text-vault-gray font-mono">$ REQUESTED</div>
            </div>
            <div className="text-center">
              <StatusBadge status={fund.status} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
