-- vault21 macro dashboard schema

-- Core timeline events
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    event TEXT NOT NULL,
    severity INTEGER NOT NULL CHECK(severity BETWEEN 1 AND 6),
    category TEXT NOT NULL DEFAULT 'general',
    source TEXT,
    source_name TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    auto_generated INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Fund redemption tracking
CREATE TABLE IF NOT EXISTS funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ticker TEXT,
    manager TEXT NOT NULL,
    aum_billions REAL,
    fund_type TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS redemption_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fund_id INTEGER NOT NULL REFERENCES funds(id),
    quarter TEXT NOT NULL,
    date TEXT NOT NULL,
    redemption_requested_pct REAL,
    redemption_requested_amt REAL,
    redemption_paid_pct REAL,
    redemption_paid_amt REAL,
    gate_threshold_pct REAL DEFAULT 5.0,
    status TEXT NOT NULL,
    response_detail TEXT,
    source TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Market metrics snapshots
CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    unit TEXT,
    source TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Equity price tracking for alt managers
CREATE TABLE IF NOT EXISTS equity_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    date TEXT NOT NULL,
    close_price REAL,
    change_pct REAL,
    ytd_pct REAL,
    from_high_pct REAL,
    source TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(ticker, date)
);

-- Bank exposure data
CREATE TABLE IF NOT EXISTS bank_exposures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name TEXT NOT NULL,
    exposure_billions REAL,
    date_reported TEXT,
    detail TEXT,
    source TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Contagion chain status
CREATE TABLE IF NOT EXISTS contagion_layers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    layer_order INTEGER NOT NULL,
    layer_name TEXT NOT NULL,
    detail TEXT,
    risk_description TEXT,
    exposure_label TEXT,
    severity INTEGER CHECK(severity BETWEEN 1 AND 6),
    last_updated TEXT DEFAULT (datetime('now'))
);

-- Data refresh log
CREATE TABLE IF NOT EXISTS refresh_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger_type TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL DEFAULT 'running',
    sources_attempted INTEGER DEFAULT 0,
    sources_succeeded INTEGER DEFAULT 0,
    events_added INTEGER DEFAULT 0,
    errors TEXT,
    duration_ms INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date DESC);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_metrics_name_date ON metrics(metric_name, date DESC);
CREATE INDEX IF NOT EXISTS idx_equity_ticker_date ON equity_prices(ticker, date DESC);
CREATE INDEX IF NOT EXISTS idx_redemption_fund ON redemption_events(fund_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_refresh_log_date ON refresh_log(started_at DESC);
