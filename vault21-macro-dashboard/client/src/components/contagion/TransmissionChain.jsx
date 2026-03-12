import Card from '../shared/Card';
import { COLORS } from '../../lib/constants';

/**
 * Vertical contagion transmission chain — from borrowers through to broad markets.
 */
export default function TransmissionChain({ chain }) {
  if (!chain?.length) return null;
  return (
    <Card title="Contagion Transmission Chain" subtitle="How stress propagates from borrower level through to broad markets">
      <div className="flex flex-col gap-1">
        {chain.map((layer, i) => (
          <div key={i}>
            <div
              className="grid grid-cols-[140px_1fr_1fr_140px] gap-3 px-4 py-3.5 rounded items-center"
              style={{
                background: `rgba(239, 68, 68, ${0.03 + i * 0.03})`,
                border: `1px solid ${i >= 4 ? COLORS.redDim : COLORS.cardBorder}`,
              }}
            >
              <div>
                <div className="font-mono text-xs font-bold text-vault-amber">{layer.layer_name}</div>
                <div className="text-[10px] text-vault-gray font-mono mt-0.5">{layer.detail}</div>
              </div>
              <div className="text-[11px] text-vault-white font-sans">{layer.risk_description}</div>
              <div className="font-mono text-[11px] text-vault-red text-right">{layer.exposure_label}</div>
              <div className="text-center">
                <div
                  className="w-2 h-2 rounded-full mx-auto"
                  style={{
                    background: i >= 4 ? COLORS.red : COLORS.amber,
                    boxShadow: i >= 4 ? `0 0 8px ${COLORS.red}` : 'none',
                  }}
                />
              </div>
            </div>
            {i < chain.length - 1 && (
              <div className="text-center py-0.5 text-vault-gray-dark text-sm">▼</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
