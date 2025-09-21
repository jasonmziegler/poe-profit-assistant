# Data Models

Define the core data models/entities that will be shared between frontend and backend. These models represent the fundamental business objects in the POE trading ecosystem.

## Character

**Purpose:** Represents a Path of Exile character from the ladder API, containing equipment and build information used for demand analysis.

**Key Attributes:**

- name: string - Character name from ladder
- level: number - Character level (1-100)
- class: string - Character class (e.g., "Witch", "Marauder")
- league: string - Current league the character plays in
- items: Item[] - Array of equipped items
- skills: Skill[] - Active skill gems being used
- fetchedAt: Date - When this data was retrieved

### TypeScript Interface

```typescript
interface Character {
  id: string
  name: string
  level: number
  class: string
  league: string
  items: Item[]
  skills: Skill[]
  experience: number
  depth?: number // Delve depth if applicable
  fetchedAt: Date
  accountName?: string
}
```

### Relationships

- Has many Items (equipped)
- Has many Skills (active gems)
- Analyzed to create DemandMetrics

## Item

**Purpose:** Represents an item in Path of Exile, either equipped on a character or listed for trade.

**Key Attributes:**

- name: string - Unique or base item name
- baseType: string - Base item type (e.g., "Astral Plate")
- itemLevel: number - Item level for crafting
- rarity: string - Normal/Magic/Rare/Unique
- sockets: SocketInfo - Socket configuration
- mods: string[] - Item modifiers/affixes
- corrupted: boolean - Corruption status

### TypeScript Interface

```typescript
interface Item {
  id: string
  name: string
  baseType: string
  itemLevel: number
  rarity: 'Normal' | 'Magic' | 'Rare' | 'Unique'
  category: string // Weapon, Armour, Jewelry, etc.
  sockets?: {
    total: number
    links: number
    colors: string // e.g., "RRRGGB"
  }
  mods: string[]
  implicitMods?: string[]
  explicitMods?: string[]
  corrupted: boolean
  influences?: string[] // Elder, Shaper, etc.
  stackSize?: number
  identified: boolean
}
```

### Relationships

- Belongs to Character (when equipped)
- Has one TradeListing (when for sale)
- Analyzed for ProfitOpportunity

## TradeListing

**Purpose:** Represents an item listed for sale on the Path of Exile trade market.

**Key Attributes:**

- item: Item - The item being sold
- price: Price - Asking price in various currencies
- seller: string - Account name of seller
- listed: Date - When item was listed
- whisper: string - In-game whisper template
- indexed: Date - When our system found it

### TypeScript Interface

```typescript
interface TradeListing {
  id: string
  item: Item
  price: {
    amount: number
    currency: 'chaos' | 'divine' | 'exalted' | 'mirror'
  }
  seller: string
  character?: string
  listed: Date
  whisper: string
  stashTab?: {
    name: string
    x: number
    y: number
  }
  indexed: Date
  league: string
}
```

### Relationships

- Has one Item
- Compared against DemandMetrics to find opportunities

## ProfitOpportunity

**Purpose:** Represents a detected profit opportunity based on demand analysis and market pricing.

**Key Attributes:**

- item: Item - The item with profit potential
- buyPrice: number - Current market price
- estimatedSellPrice: number - Predicted sell price based on demand
- profitMargin: number - Expected profit in chaos orbs
- confidence: number - Algorithm confidence score (0-1)
- demandScore: number - Item demand based on build usage
- reasoning: string - Explanation of why this is profitable

### TypeScript Interface

```typescript
interface ProfitOpportunity {
  id: string
  item: Item
  buyPrice: number
  estimatedSellPrice: number
  profitMargin: number
  profitPercentage: number
  confidence: number // 0-1 scale
  demandScore: number // Normalized demand metric
  popularityRank?: number // Ranking among all items
  usageCount: number // Number of characters using
  reasoning: string
  listings: TradeListing[] // Available listings
  createdAt: Date
  expiresAt: Date // When opportunity likely expires
}
```

### Relationships

- References one Item
- Created from multiple TradeListings
- Derived from DemandMetrics analysis

## DemandMetrics

**Purpose:** Aggregated demand data for items based on character analysis.

**Key Attributes:**

- itemName: string - Item being analyzed
- usageCount: number - Characters using this item
- usagePercentage: number - Percentage of analyzed characters
- averageLevel: number - Average level of users
- trendDirection: string - Rising/Falling/Stable
- lastUpdated: Date - When metrics were calculated

### TypeScript Interface

```typescript
interface DemandMetrics {
  id: string
  itemName: string
  itemCategory: string
  usageCount: number
  usagePercentage: number
  averageLevel: number
  levelDistribution: {
    [range: string]: number // e.g., "1-20": 5, "21-40": 15
  }
  classDistribution: {
    [className: string]: number
  }
  trendDirection: 'rising' | 'falling' | 'stable'
  trendPercentage?: number // Change over time
  popularBuilds: string[] // Build names using this
  lastUpdated: Date
  sampleSize: number // Number of characters analyzed
}
```

### Relationships

- Derived from analyzing multiple Characters
- Used to calculate ProfitOpportunities
- Historical tracking for trend analysis

## UserPreferences

**Purpose:** Stores user settings and preferences for opportunity filtering and notifications.

**Key Attributes:**

- sessionId: string - POESESSID for API access
- minProfit: number - Minimum profit threshold
- minConfidence: number - Minimum confidence score
- categories: string[] - Item categories to track
- budget: number - Maximum buy price
- refreshInterval: number - How often to check

### TypeScript Interface

```typescript
interface UserPreferences {
  id: string
  sessionId?: string // Encrypted POESESSID
  filters: {
    minProfit: number
    minConfidence: number
    maxBuyPrice?: number
    categories: string[]
    excludeCorrupted?: boolean
    leagues: string[]
  }
  display: {
    itemsPerPage: number
    sortBy: 'profit' | 'confidence' | 'demand'
    sortOrder: 'asc' | 'desc'
  }
  notifications: {
    enabled: boolean
    thresholds: {
      profit?: number
      confidence?: number
    }
  }
  refreshInterval: number // Minutes
  lastRefresh?: Date
  createdAt: Date
  updatedAt: Date
}
```

### Relationships

- Configures ProfitOpportunity filtering
- Stores encrypted session credentials
