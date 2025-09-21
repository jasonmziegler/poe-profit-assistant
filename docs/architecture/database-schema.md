# Database Schema

Transform the conceptual data models into concrete SQLite schemas optimized for local storage:

## SQLite Schema Definition

```sql
-- Characters table
CREATE TABLE characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    account_name TEXT,
    level INTEGER NOT NULL,
    class TEXT NOT NULL,
    league TEXT NOT NULL,
    experience INTEGER,
    depth INTEGER,
    items_json TEXT, -- JSON array of equipped items
    skills_json TEXT, -- JSON array of skills
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, league)
);

CREATE INDEX idx_characters_league ON characters(league);
CREATE INDEX idx_characters_fetched ON characters(fetched_at);

-- Items table (for normalized item data)
CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    base_type TEXT,
    item_level INTEGER,
    rarity TEXT,
    category TEXT,
    corrupted BOOLEAN DEFAULT 0,
    sockets_json TEXT, -- JSON for socket data
    mods_json TEXT, -- JSON array of mods
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_items_category ON items(category);

-- Trade listings table
CREATE TABLE trade_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    item_json TEXT NOT NULL, -- Full item data as JSON
    price_amount INTEGER NOT NULL,
    price_currency TEXT NOT NULL,
    seller TEXT NOT NULL,
    character_name TEXT,
    whisper TEXT,
    league TEXT NOT NULL,
    listed_at DATETIME,
    indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listings_item ON trade_listings(item_name);
CREATE INDEX idx_listings_price ON trade_listings(price_amount);
CREATE INDEX idx_listings_indexed ON trade_listings(indexed_at);

-- Profit opportunities table
CREATE TABLE opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    buy_price INTEGER NOT NULL,
    estimated_sell_price INTEGER NOT NULL,
    profit_margin INTEGER NOT NULL,
    profit_percentage REAL,
    confidence REAL NOT NULL,
    demand_score REAL NOT NULL,
    usage_count INTEGER,
    reasoning TEXT,
    listings_json TEXT, -- JSON array of related listings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

CREATE INDEX idx_opportunities_profit ON opportunities(profit_margin DESC);
CREATE INDEX idx_opportunities_confidence ON opportunities(confidence DESC);
CREATE INDEX idx_opportunities_created ON opportunities(created_at DESC);

-- Demand metrics table
CREATE TABLE demand_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    item_category TEXT,
    usage_count INTEGER NOT NULL,
    usage_percentage REAL,
    average_level REAL,
    level_distribution_json TEXT, -- JSON object
    class_distribution_json TEXT, -- JSON object
    trend_direction TEXT,
    trend_percentage REAL,
    popular_builds_json TEXT, -- JSON array
    sample_size INTEGER,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_name, last_updated)
);

CREATE INDEX idx_demand_item ON demand_metrics(item_name);
CREATE INDEX idx_demand_usage ON demand_metrics(usage_count DESC);

-- User preferences (single row table)
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY DEFAULT 1,
    session_id TEXT, -- Encrypted POESESSID
    filters_json TEXT, -- JSON object with filter settings
    display_json TEXT, -- JSON object with display preferences
    notifications_json TEXT, -- JSON object with notification settings
    refresh_interval INTEGER DEFAULT 30,
    last_refresh DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (id = 1) -- Ensures only one row
);
```
