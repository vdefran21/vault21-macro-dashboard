/**
 * Color system matching the vault21 dark theme.
 * Used by Recharts charts and inline styles where Tailwind classes aren't applicable.
 */
export const COLORS = {
  bg: '#0a0e17',
  card: '#111827',
  cardBorder: '#1e293b',
  red: '#ef4444',
  redDim: '#991b1b',
  amber: '#f59e0b',
  amberDim: '#92400e',
  green: '#10b981',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  white: '#f1f5f9',
  gray: '#64748b',
  grayDark: '#334155',
  gold: '#fbbf24',
};

/** Monospace font stack for data display */
export const FONT_MONO = "'Courier New', monospace";

/** Sans-serif font stack for labels */
export const FONT_SANS = 'system-ui, -apple-system, sans-serif';

/** Client-side auto-refresh interval (5 minutes) */
export const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

/** Recharts axis tick style */
export const AXIS_TICK = { fill: COLORS.gray, fontSize: 10, fontFamily: FONT_MONO };

/** Recharts grid style */
export const GRID_STYLE = { strokeDasharray: '3 3', stroke: COLORS.grayDark };
