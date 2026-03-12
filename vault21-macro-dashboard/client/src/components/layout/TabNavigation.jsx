const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'redemptions', label: 'Redemptions' },
  { id: 'contagion', label: 'Contagion' },
  { id: 'timeline', label: 'Timeline' },
];

/**
 * Tab bar for switching between dashboard views.
 */
export default function TabNavigation({ activeTab, onTabChange }) {
  return (
    <div className="flex gap-0.5 mb-5 border-b border-vault-card-border">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={`font-mono text-[11px] tracking-[1px] uppercase px-4 py-2 border-b-2 transition-all cursor-pointer
            ${activeTab === t.id
              ? 'bg-vault-card-border text-vault-white border-vault-amber'
              : 'bg-transparent text-vault-gray border-transparent hover:text-vault-white'
            }`}
          style={{ border: 'none', borderBottom: activeTab === t.id ? '2px solid #f59e0b' : '2px solid transparent' }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
