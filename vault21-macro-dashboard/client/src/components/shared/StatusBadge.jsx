const CONFIG = {
  fulfilled: { bg: '#064e3b', color: '#10b981', label: 'MET' },
  extraordinary: { bg: '#78350f', color: '#fbbf24', label: 'EXTRAORDINARY' },
  gated: { bg: '#7c2d12', color: '#f59e0b', label: 'GATED' },
  liquidating: { bg: '#7f1d1d', color: '#ef4444', label: 'LIQUIDATING' },
  pending: { bg: '#78350f', color: '#f59e0b', label: 'PENDING' },
  tracking: { bg: '#0f172a', color: '#06b6d4', label: 'TRACKING' },
};

/**
 * Fund redemption status badge (MET / EXTRAORDINARY / GATED / LIQUIDATING).
 *
 * Status taxonomy:
 * - fulfilled: Fund met all redemption requests within normal operating parameters
 * - extraordinary: Fund technically met requests but required emergency measures
 *   (e.g., raised tender caps, firm capital injection) — not repeatable at scale
 * - gated: Fund invoked quarterly redemption cap, partial fulfillment only
 * - liquidating: Fund permanently gated, entering wind-down
 *
 * @param {{ status: string }} props
 */
export default function StatusBadge({ status }) {
  const normalizedStatus = status || 'tracking';
  const cfg = CONFIG[normalizedStatus] || { bg: '#334155', color: '#64748b', label: normalizedStatus };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold tracking-[1px]"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}
