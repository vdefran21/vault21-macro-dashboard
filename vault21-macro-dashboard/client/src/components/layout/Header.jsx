/**
 * Dashboard header with title, tagline, and manual refresh button.
 */
export default function Header({ refreshing, onRefresh }) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="font-mono text-xl font-bold text-vault-red tracking-[1px] m-0">
          PRIVATE CREDIT CRISIS
        </h1>
        <span className="font-mono text-[11px] text-vault-gray-dark tracking-[1px]">
          VAULT21 MACRO INTELLIGENCE — {new Date().toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          }).toUpperCase()}
        </span>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="ml-auto font-mono text-[10px] tracking-[1px] uppercase px-3 py-1.5 rounded
            border border-vault-card-border bg-vault-card text-vault-gray
            hover:text-vault-amber hover:border-vault-amber-dim transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {refreshing ? 'REFRESHING...' : 'REFRESH'}
        </button>
      </div>
      <div className="font-mono text-[11px] text-vault-amber mt-1.5 tracking-[0.5px]">
        $1.8T INDUSTRY UNDER STRESS — GATING CASCADE ACTIVE — BANK LEVERAGE CONTRACTING
      </div>
    </div>
  );
}
