# Phase 2: Frontend Migration

**Status:** NOT STARTED
**Prereqs:** Phase 1 (backend serving `/api/dashboard`)
**Architecture ref:** [../ARCHITECTURE.md](../ARCHITECTURE.md)
**Prototype:** [../../private_credit_crisis_dashboard.jsx](../../../private_credit_crisis_dashboard.jsx)

---

## Goal

Port the prototype JSX into a proper Vite + React app consuming the API. All hardcoded data replaced with live API calls.

---

## Tasks

1. Scaffold Vite React project in `client/`
2. Install Tailwind CSS, Recharts
3. Decompose prototype into component tree per directory structure:
   - `components/layout/` — Header.jsx, TabNavigation.jsx, StatusBar.jsx
   - `components/overview/` — StatGrid.jsx, DefaultRateChart.jsx, SectorExposure.jsx, PIKTrend.jsx, MaturityWall.jsx
   - `components/redemptions/` — FundScorecard.jsx, RedemptionRateChart.jsx, DollarFlowChart.jsx, StatusBadge.jsx
   - `components/contagion/` — TransmissionChain.jsx, BankExposure.jsx, AltManagerEquity.jsx
   - `components/timeline/` — SeverityChart.jsx, EventLog.jsx, EventForm.jsx
   - `components/shared/` — Card.jsx, ChartTooltip.jsx, LoadingSpinner.jsx
4. Replace hardcoded data with `useDashboardData` hook
5. Add loading states, error handling
6. Add manual refresh button in header with visual feedback
7. Add `StatusBar` showing last refresh time + data freshness
8. Add Vite proxy config pointing `/api` to Express backend (port 3001)
9. Port the dark theme color system from prototype to Tailwind config
10. Test: full dashboard renders from API data

---

## Dependencies

```bash
cd client
npm install react react-dom recharts
npm install -D vite @vitejs/plugin-react tailwindcss autoprefixer postcss
```

---

## Color System (from prototype)

```javascript
const COLORS = {
  bg: "#0a0e17",
  card: "#111827",
  cardBorder: "#1e293b",
  red: "#ef4444",
  redDim: "#991b1b",
  amber: "#f59e0b",
  amberDim: "#92400e",
  green: "#10b981",
  cyan: "#06b6d4",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  white: "#f1f5f9",
  gray: "#64748b",
  grayDark: "#334155",
  gold: "#fbbf24",
};
```

Fonts: `'Courier New', monospace` for data, `system-ui, -apple-system, sans-serif` for labels.

---

## Data Hook

```javascript
// hooks/useDashboardData.js
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min client-side poll

export function useDashboardData() {
  // Returns: { data, loading, refreshing, lastRefresh, error, triggerRefresh }
  // fetchData: GET /api/dashboard
  // triggerRefresh: POST /api/refresh → poll /api/refresh/status → re-fetch
  // Auto-poll on interval
}
```

---

## Vite Proxy Config

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

---

## Verification

```bash
# Terminal 1
npm run dev              # Express on :3001

# Terminal 2
cd client && npm run dev # Vite on :5173 (proxies /api → :3001)
```

Open `http://localhost:5173` — dashboard should render all 4 tabs (Overview, Redemptions, Contagion, Timeline) with live data from the API. All charts should match the prototype visually.
