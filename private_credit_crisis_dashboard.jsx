import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend, ReferenceLine, ComposedChart,
  Scatter
} from "recharts";

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

const fontMono = "'Courier New', monospace";
const fontSans = "system-ui, -apple-system, sans-serif";

// --- DATA ---

const timelineEvents = [
  { date: "Nov 2024", event: "Tricolor funding strains", severity: 1 },
  { date: "Jan 2025", event: "First Brands collateral fraud", severity: 2 },
  { date: "Apr 2025", event: "Liberation Day crash", severity: 3 },
  { date: "Late 2025", event: "BDC bankruptcies accelerate", severity: 3 },
  { date: "Feb 2026", event: "Blue Owl gates OBDC II", severity: 4 },
  { date: "Feb 18", event: "Rubric 'Enron' letter", severity: 3 },
  { date: "Feb 27", event: "UK lender MFS collapses", severity: 4 },
  { date: "Mar 3", event: "Blackstone BCRED 7.9% redemptions", severity: 5 },
  { date: "Mar 6", event: "BlackRock HLEND gated at 5%", severity: 5 },
  { date: "Mar 6", event: "Alt managers selloff / VIX +32%", severity: 5 },
  { date: "Mar 10", event: "Cliffwater $33B fund >7% redemptions", severity: 5 },
  { date: "Mar 11", event: "JPMorgan marks down software loans", severity: 6 },
  { date: "Mar 12", event: "Partners Group: defaults may double", severity: 5 },
];

const redemptionData = [
  {
    fund: "Blackstone BCRED",
    aum: 82,
    redemptionPct: 7.9,
    redemptionAmt: 3.8,
    response: "Met 100%",
    status: "fulfilled",
  },
  {
    fund: "BlackRock HLEND",
    aum: 26,
    redemptionPct: 9.3,
    redemptionAmt: 1.2,
    paidOut: 0.62,
    response: "Gated at 5%",
    status: "gated",
  },
  {
    fund: "Cliffwater CLF",
    aum: 33,
    redemptionPct: 7.0,
    redemptionAmt: 2.31,
    response: "Expected >7%",
    status: "gated",
  },
  {
    fund: "Blue Owl OBDC II",
    aum: 1.6,
    redemptionPct: 200,
    redemptionAmt: null,
    response: "Permanently gated",
    status: "liquidating",
  },
];

const defaultRateData = [
  { year: "2016-2025\nAvg", headline: 1.8, true: 2.6, label: "Historical" },
  { year: "Current\n(Rubric/UBS)", headline: 2.0, true: 5.0, label: "Now" },
  { year: "UBS\nWorst Case", headline: null, true: 15.0, label: "Worst Case" },
  { year: "Partners Group\nForecast", headline: null, true: 5.2, label: "Forecast" },
];

const contagionFlow = [
  { layer: "Borrowers", detail: "Software/SaaS companies", risk: "AI disruption erodes business models", exposure: "$680B+ in sponsor-backed loans" },
  { layer: "Private Credit Funds", detail: "BDCs & semi-liquid vehicles", risk: "PIK at post-pandemic highs, defaults rising", exposure: "$1.8T industry AUM" },
  { layer: "Retail Investors", detail: "Redemption wave", risk: "Liquidity mismatch → gating", exposure: "$10B+ in redemption requests Q1" },
  { layer: "Bank Leverage", detail: "Back-leverage providers", risk: "JPM marking down collateral", exposure: "$300B bank lending to PC funds" },
  { layer: "Alt Manager Equities", detail: "BX, OWL, ARES, KKR, BLK", risk: "Share price contagion", exposure: "OWL -60%, BX -40% from highs" },
  { layer: "Broad Markets", detail: "VIX, S&P, financials", risk: "Sentiment + forced selling", exposure: "VIX +32% single session" },
];

const softwareExposureData = [
  { name: "Software/SaaS", value: 40, fill: COLORS.red },
  { name: "Healthcare", value: 15, fill: COLORS.blue },
  { name: "Business Services", value: 12, fill: COLORS.cyan },
  { name: "Financial Services", value: 10, fill: COLORS.purple },
  { name: "Industrial", value: 8, fill: COLORS.amber },
  { name: "Other", value: 15, fill: COLORS.grayDark },
];

const maturityWall = [
  { year: "2026", amount: 162, color: COLORS.red },
  { year: "2027", amount: 134, color: COLORS.amber },
  { year: "2028", amount: 98, color: COLORS.amberDim },
  { year: "2029", amount: 67, color: COLORS.grayDark },
];

const pikTrend = [
  { quarter: "Q1 2024", pik: 5.2 },
  { quarter: "Q2 2024", pik: 5.8 },
  { quarter: "Q3 2024", pik: 6.3 },
  { quarter: "Q4 2024", pik: 6.9 },
  { quarter: "Q1 2025", pik: 7.2 },
  { quarter: "Q2 2025", pik: 7.5 },
  { quarter: "Q3 2025", pik: 7.8 },
  { quarter: "Q4 2025", pik: 8.0 },
  { quarter: "Q1 2026", pik: 8.4 },
];

// --- COMPONENTS ---

const Card = ({ title, subtitle, children, span = 1 }) => (
  <div style={{
    gridColumn: span > 1 ? `span ${span}` : undefined,
    background: COLORS.card,
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: 6,
    padding: "20px 24px",
    position: "relative",
    overflow: "hidden",
  }}>
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontFamily: fontMono,
        fontSize: 11,
        color: COLORS.amber,
        letterSpacing: 2,
        textTransform: "uppercase",
        marginBottom: 4,
      }}>{title}</div>
      {subtitle && <div style={{
        fontFamily: fontSans,
        fontSize: 13,
        color: COLORS.gray,
      }}>{subtitle}</div>}
    </div>
    {children}
  </div>
);

const StatBox = ({ label, value, sub, color = COLORS.white }) => (
  <div style={{
    textAlign: "center",
    padding: "12px 8px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: 4,
    border: `1px solid ${COLORS.cardBorder}`,
    minWidth: 100,
  }}>
    <div style={{ fontFamily: fontMono, fontSize: 22, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontFamily: fontSans, fontSize: 11, color: COLORS.gray, marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontFamily: fontMono, fontSize: 10, color: COLORS.grayDark, marginTop: 2 }}>{sub}</div>}
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = {
    fulfilled: { bg: "#064e3b", color: COLORS.green, label: "MET" },
    gated: { bg: "#7c2d12", color: COLORS.amber, label: "GATED" },
    liquidating: { bg: "#7f1d1d", color: COLORS.red, label: "LIQUIDATING" },
  }[status] || { bg: COLORS.grayDark, color: COLORS.gray, label: status };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 3,
      fontSize: 10,
      fontFamily: fontMono,
      fontWeight: 700,
      background: cfg.bg,
      color: cfg.color,
      letterSpacing: 1,
    }}>{cfg.label}</span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1e293b",
      border: `1px solid ${COLORS.grayDark}`,
      borderRadius: 4,
      padding: "8px 12px",
      fontFamily: fontMono,
      fontSize: 11,
    }}>
      <div style={{ color: COLORS.white, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill, marginTop: 2 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          {p.name?.includes('%') || p.dataKey?.includes('Pct') || p.dataKey?.includes('pik') ? '%' : p.dataKey?.includes('amount') || p.dataKey?.includes('Amount') ? 'B' : ''}
        </div>
      ))}
    </div>
  );
};

// --- MAIN DASHBOARD ---

export default function PrivateCreditDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "redemptions", label: "Redemptions" },
    { id: "contagion", label: "Contagion" },
    { id: "timeline", label: "Timeline" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      color: COLORS.white,
      fontFamily: fontSans,
      padding: "24px 20px",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <h1 style={{
            fontFamily: fontMono,
            fontSize: 20,
            fontWeight: 700,
            color: COLORS.red,
            margin: 0,
            letterSpacing: 1,
          }}>
            PRIVATE CREDIT CRISIS
          </h1>
          <span style={{
            fontFamily: fontMono,
            fontSize: 11,
            color: COLORS.grayDark,
            letterSpacing: 1,
          }}>
            VAULT21 MACRO INTELLIGENCE — {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
          </span>
        </div>
        <div style={{
          fontFamily: fontMono,
          fontSize: 11,
          color: COLORS.amber,
          marginTop: 6,
          letterSpacing: 0.5,
        }}>
          $1.8T INDUSTRY UNDER STRESS — GATING CASCADE ACTIVE — BANK LEVERAGE CONTRACTING
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: 2,
        marginBottom: 20,
        borderBottom: `1px solid ${COLORS.cardBorder}`,
        paddingBottom: 0,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              fontFamily: fontMono,
              fontSize: 11,
              letterSpacing: 1,
              padding: "8px 16px",
              background: activeTab === t.id ? COLORS.cardBorder : "transparent",
              color: activeTab === t.id ? COLORS.white : COLORS.gray,
              border: "none",
              borderBottom: activeTab === t.id ? `2px solid ${COLORS.amber}` : "2px solid transparent",
              cursor: "pointer",
              textTransform: "uppercase",
              transition: "all 0.15s",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Top Stats */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatBox label="Industry AUM" value="$1.8T" color={COLORS.white} />
            <StatBox label="Bank Lending to PC" value="$300B" color={COLORS.amber} />
            <StatBox label="Q1 Redemptions" value="$10B+" color={COLORS.red} />
            <StatBox label="Maturity Wall 2026" value="$162B" color={COLORS.red} />
            <StatBox label="Software Loan Share" value="~40%" color={COLORS.amber} />
            <StatBox label="True Default Rate" value="~5%" sub="vs 1.8% headline" color={COLORS.red} />
          </div>

          {/* Default Rates */}
          <Card title="Default Rate Comparison" subtitle="Headline vs 'True' default rates (incl. selective defaults & LMEs)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={defaultRateData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grayDark} />
                <XAxis dataKey="year" tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} interval={0} />
                <YAxis tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} tickFormatter={v => `${v}%`} domain={[0, 16]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="headline" name="Headline Rate %" fill={COLORS.blue} radius={[3,3,0,0]} />
                <Bar dataKey="true" name="True Rate %" radius={[3,3,0,0]}>
                  {defaultRateData.map((entry, i) => (
                    <Cell key={i} fill={entry.true >= 10 ? COLORS.red : entry.true >= 5 ? COLORS.amber : COLORS.cyan} />
                  ))}
                </Bar>
                <Legend wrapperStyle={{ fontFamily: fontMono, fontSize: 10, color: COLORS.gray }} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Software Exposure + PIK */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Borrower Sector Concentration" subtitle="% of sponsor-backed private credit loans by sector">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={softwareExposureData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grayDark} horizontal={false} />
                  <XAxis type="number" tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} tickFormatter={v => `${v}%`} domain={[0, 45]} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Share %" radius={[0,3,3,0]}>
                    {softwareExposureData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="PIK Income Trend" subtitle="% of BDC investment income received as Payment-in-Kind">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={pikTrend}>
                  <defs>
                    <linearGradient id="pikGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.red} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grayDark} />
                  <XAxis dataKey="quarter" tick={{ fill: COLORS.gray, fontSize: 9, fontFamily: fontMono }} interval={1} />
                  <YAxis tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} tickFormatter={v => `${v}%`} domain={[4, 9]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="pik" name="PIK %" stroke={COLORS.red} fill="url(#pikGrad)" strokeWidth={2} dot={{ fill: COLORS.red, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Maturity Wall */}
          <Card title="Maturity Wall" subtitle="Private credit debt maturing by year ($B) — refinancing at higher rates">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={maturityWall} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grayDark} />
                <XAxis dataKey="year" tick={{ fill: COLORS.gray, fontSize: 11, fontFamily: fontMono }} />
                <YAxis tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} tickFormatter={v => `$${v}B`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Maturing Debt $B" radius={[4,4,0,0]}>
                  {maturityWall.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* === REDEMPTIONS TAB === */}
      {activeTab === "redemptions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Fund Redemption Cards */}
          <Card title="Fund Redemption Scorecard" subtitle="Q1 2026 — Major private credit fund withdrawal activity">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {redemptionData.map((fund, i) => (
                <div key={i} style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 4,
                  border: `1px solid ${COLORS.cardBorder}`,
                  gap: 12,
                }}>
                  <div>
                    <div style={{ fontFamily: fontMono, fontSize: 13, fontWeight: 700, color: COLORS.white }}>{fund.fund}</div>
                    <div style={{ fontFamily: fontMono, fontSize: 10, color: COLORS.gray, marginTop: 2 }}>{fund.response}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: fontMono, fontSize: 16, fontWeight: 700, color: COLORS.cyan }}>${fund.aum}B</div>
                    <div style={{ fontSize: 9, color: COLORS.gray, fontFamily: fontMono }}>AUM</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontFamily: fontMono, fontSize: 16, fontWeight: 700,
                      color: fund.redemptionPct > 50 ? COLORS.red : fund.redemptionPct > 7 ? COLORS.amber : COLORS.amber,
                    }}>
                      {fund.redemptionPct > 100 ? "200%+" : `${fund.redemptionPct}%`}
                    </div>
                    <div style={{ fontSize: 9, color: COLORS.gray, fontFamily: fontMono }}>REDEMPTION REQ</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: fontMono, fontSize: 16, fontWeight: 700, color: COLORS.white }}>
                      {fund.redemptionAmt ? `$${fund.redemptionAmt}B` : "N/A"}
                    </div>
                    <div style={{ fontSize: 9, color: COLORS.gray, fontFamily: fontMono }}>$ REQUESTED</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <StatusBadge status={fund.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Redemption Rate Bar Chart */}
          <Card title="Redemption Rates vs 5% Gate Threshold" subtitle="% of shares requested for redemption — dashed line = standard quarterly cap">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={[
                { fund: "BCRED", requested: 7.9, paid: 7.9 },
                { fund: "HLEND", requested: 9.3, paid: 5.0 },
                { fund: "Cliffwater", requested: 7.0, paid: 5.0 },
                { fund: "OBDC II", requested: 25, paid: 0 },
              ]} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grayDark} />
                <XAxis dataKey="fund" tick={{ fill: COLORS.gray, fontSize: 11, fontFamily: fontMono }} />
                <YAxis tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} tickFormatter={v => `${v}%`} domain={[0, 28]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={5} stroke={COLORS.amber} strokeDasharray="6 3" strokeWidth={2} label={{ value: "5% GATE", fill: COLORS.amber, fontSize: 10, fontFamily: fontMono, position: "right" }} />
                <Bar dataKey="requested" name="Requested %" radius={[4,4,0,0]}>
                  {[COLORS.amber, COLORS.red, COLORS.amber, COLORS.red].map((c, i) => (
                    <Cell key={i} fill={c} />
                  ))}
                </Bar>
                <Bar dataKey="paid" name="Actually Paid %" fill={COLORS.green} radius={[4,4,0,0]} fillOpacity={0.6} />
                <Legend wrapperStyle={{ fontFamily: fontMono, fontSize: 10, color: COLORS.gray }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ fontFamily: fontMono, fontSize: 10, color: COLORS.gray, marginTop: 8, textAlign: "center" }}>
              OBDC II: 200%+ surge shown capped at 25% for scale — fund permanently gated / liquidating
            </div>
          </Card>

          {/* Dollar Flow */}
          <Card title="Dollar Flows: Requested vs Returned" subtitle="$B — gap between what investors want out and what they actually receive">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { fund: "BCRED ($82B)", requested: 3.8, returned: 3.8 },
                { fund: "HLEND ($26B)", requested: 1.2, returned: 0.62 },
                { fund: "Cliffwater ($33B)", requested: 2.31, returned: 1.65 },
              ]} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grayDark} />
                <XAxis dataKey="fund" tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} />
                <YAxis tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} tickFormatter={v => `$${v}B`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="requested" name="Requested $B" fill={COLORS.red} radius={[4,4,0,0]} />
                <Bar dataKey="returned" name="Returned $B" fill={COLORS.green} radius={[4,4,0,0]} />
                <Legend wrapperStyle={{ fontFamily: fontMono, fontSize: 10, color: COLORS.gray }} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* === CONTAGION TAB === */}
      {activeTab === "contagion" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Contagion Transmission Chain" subtitle="How stress propagates from borrower level through to broad markets">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {contagionFlow.map((layer, i) => (
                <div key={i}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr 1fr 140px",
                    gap: 12,
                    padding: "14px 16px",
                    background: `rgba(239, 68, 68, ${0.03 + i * 0.03})`,
                    border: `1px solid ${i >= 4 ? COLORS.redDim : COLORS.cardBorder}`,
                    borderRadius: 4,
                    alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontFamily: fontMono, fontSize: 12, fontWeight: 700, color: COLORS.amber }}>{layer.layer}</div>
                      <div style={{ fontSize: 10, color: COLORS.gray, fontFamily: fontMono, marginTop: 2 }}>{layer.detail}</div>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.white, fontFamily: fontSans }}>{layer.risk}</div>
                    <div style={{ fontFamily: fontMono, fontSize: 11, color: COLORS.red, textAlign: "right" }}>{layer.exposure}</div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{
                        width: 8, height: 8,
                        borderRadius: "50%",
                        background: i >= 4 ? COLORS.red : i >= 2 ? COLORS.amber : COLORS.amber,
                        margin: "0 auto",
                        boxShadow: i >= 4 ? `0 0 8px ${COLORS.red}` : "none",
                      }} />
                    </div>
                  </div>
                  {i < contagionFlow.length - 1 && (
                    <div style={{ textAlign: "center", padding: "2px 0", color: COLORS.grayDark, fontSize: 14 }}>▼</div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Bank Exposure */}
          <Card title="Bank Exposure to Private Credit" subtitle="Known lending to private credit funds — JPMorgan now marking down collateral">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { bank: "Total Industry", exposure: 300 },
                { bank: "JPMorgan", exposure: 22.2 },
                { bank: "Deutsche Bank", exposure: 30 },
                { bank: "Barclays", exposure: 18 },
                { bank: "Goldman Sachs", exposure: 15 },
              ]} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grayDark} />
                <XAxis dataKey="bank" tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} />
                <YAxis tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} tickFormatter={v => `$${v}B`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="exposure" name="Exposure $B" radius={[4,4,0,0]}>
                  {[COLORS.red, COLORS.amber, COLORS.amber, COLORS.blue, COLORS.blue].map((c, i) => (
                    <Cell key={i} fill={c} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{
              fontFamily: fontMono, fontSize: 10, color: COLORS.red,
              textAlign: "center", marginTop: 8, padding: "6px 12px",
              background: "rgba(239,68,68,0.08)", borderRadius: 3,
              border: `1px solid ${COLORS.redDim}`,
            }}>
              ⚠ JPM ACTIVELY MARKING DOWN SOFTWARE LOAN COLLATERAL — FIRST MAJOR BANK TO DO SO — OTHERS EXPECTED TO FOLLOW
            </div>
          </Card>

          {/* Alt Manager Equity Damage */}
          <Card title="Alternative Manager Equity Damage" subtitle="YTD 2026 stock performance — private credit contagion hitting equity valuations">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: "Blue Owl (OWL)", ytd: -27, fromHigh: -60 },
                { name: "Blackstone (BX)", ytd: -18, fromHigh: -40 },
                { name: "KKR", ytd: -15, fromHigh: -35 },
                { name: "Ares (ARES)", ytd: -12, fromHigh: -28 },
                { name: "BlackRock (BLK)", ytd: -10, fromHigh: -22 },
              ]} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grayDark} />
                <XAxis dataKey="name" tick={{ fill: COLORS.gray, fontSize: 9, fontFamily: fontMono }} />
                <YAxis tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} tickFormatter={v => `${v}%`} domain={[-70, 0]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ytd" name="YTD 2026 %" fill={COLORS.amber} radius={[4,4,0,0]} />
                <Bar dataKey="fromHigh" name="From High %" fill={COLORS.red} radius={[4,4,0,0]} />
                <Legend wrapperStyle={{ fontFamily: fontMono, fontSize: 10, color: COLORS.gray }} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* === TIMELINE TAB === */}
      {activeTab === "timeline" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Crisis Escalation Timeline" subtitle="Event severity (1-6 scale) — acceleration pattern visible from Feb 2026 onward">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={timelineEvents}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grayDark} />
                <XAxis dataKey="date" tick={{ fill: COLORS.gray, fontSize: 9, fontFamily: fontMono }} interval={0} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fill: COLORS.gray, fontSize: 10, fontFamily: fontMono }} domain={[0, 7]} label={{ value: "Severity", angle: -90, position: "insideLeft", fill: COLORS.gray, fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div style={{
                        background: "#1e293b",
                        border: `1px solid ${COLORS.grayDark}`,
                        borderRadius: 4,
                        padding: "8px 12px",
                        fontFamily: fontMono,
                        fontSize: 11,
                        maxWidth: 240,
                      }}>
                        <div style={{ color: COLORS.amber, marginBottom: 4 }}>{d?.date}</div>
                        <div style={{ color: COLORS.white }}>{d?.event}</div>
                        <div style={{ color: COLORS.red, marginTop: 4 }}>Severity: {d?.severity}/6</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="severity" radius={[3,3,0,0]}>
                  {timelineEvents.map((entry, i) => (
                    <Cell key={i} fill={
                      entry.severity >= 5 ? COLORS.red :
                      entry.severity >= 3 ? COLORS.amber :
                      COLORS.blue
                    } />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="severity" stroke={COLORS.amber} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          {/* Detailed Timeline */}
          <Card title="Detailed Event Log" subtitle="Chronological record of private credit stress events">
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {timelineEvents.map((evt, i) => (
                <div key={i} style={{
                  display: "grid",
                  gridTemplateColumns: "80px 12px 1fr 60px",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: i < timelineEvents.length - 1 ? `1px solid ${COLORS.cardBorder}` : "none",
                }}>
                  <div style={{
                    fontFamily: fontMono,
                    fontSize: 11,
                    color: COLORS.cyan,
                    textAlign: "right",
                  }}>{evt.date}</div>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: evt.severity >= 5 ? COLORS.red : evt.severity >= 3 ? COLORS.amber : COLORS.blue,
                    boxShadow: evt.severity >= 5 ? `0 0 6px ${COLORS.red}` : "none",
                    margin: "0 auto",
                  }} />
                  <div style={{ fontFamily: fontSans, fontSize: 12, color: COLORS.white }}>{evt.event}</div>
                  <div style={{
                    fontFamily: fontMono,
                    fontSize: 10,
                    color: evt.severity >= 5 ? COLORS.red : COLORS.gray,
                    textAlign: "right",
                  }}>SEV {evt.severity}/6</div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{
            fontFamily: fontMono,
            fontSize: 10,
            color: COLORS.grayDark,
            textAlign: "center",
            padding: "8px",
            borderTop: `1px solid ${COLORS.cardBorder}`,
          }}>
            DATA COMPILED FROM BLOOMBERG, REUTERS, CNBC, FT, PITCHBOOK — MARCH 12, 2026
            <br />
            VAULT21 MACRO REGIME ANALYSIS — FIVE-ANALYST TRIANGULATION FRAMEWORK
          </div>
        </div>
      )}
    </div>
  );
}
