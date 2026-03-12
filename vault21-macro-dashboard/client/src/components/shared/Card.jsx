/**
 * Dashboard card container with title and optional subtitle.
 * Used as the wrapper for every chart/data section.
 */
export default function Card({ title, subtitle, children, span = 1 }) {
  return (
    <div
      className="bg-vault-card border border-vault-card-border rounded-md p-5 relative overflow-hidden"
      style={span > 1 ? { gridColumn: `span ${span}` } : undefined}
    >
      <div className="mb-4">
        <div className="font-mono text-[11px] text-vault-amber tracking-[2px] uppercase mb-1">
          {title}
        </div>
        {subtitle && (
          <div className="font-sans text-[13px] text-vault-gray">{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  );
}
