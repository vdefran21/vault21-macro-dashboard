/**
 * Full-screen loading state shown while initial dashboard data loads.
 */
export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-vault-bg flex items-center justify-center">
      <div className="text-center">
        <div className="font-mono text-vault-amber text-sm tracking-[2px] uppercase mb-2">
          LOADING
        </div>
        <div className="font-mono text-vault-gray-dark text-xs">
          Fetching dashboard data...
        </div>
      </div>
    </div>
  );
}
