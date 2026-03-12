import { timeAgo } from '../../lib/formatters';

/**
 * Bottom status bar showing data freshness and refresh status.
 */
export default function StatusBar({ lastRefresh, meta }) {
  return (
    <div className="mt-6 pt-3 border-t border-vault-card-border flex justify-between items-center font-mono text-[10px] text-vault-gray-dark">
      <div>
        DATA: {meta?.refresh_status?.toUpperCase() || 'SEED'} — LAST REFRESH: {timeAgo(lastRefresh)}
      </div>
      <div>VAULT21 MACRO REGIME ANALYSIS</div>
    </div>
  );
}
