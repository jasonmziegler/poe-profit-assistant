# Unified Project Structure

```
poe-profit-assistant/
├── .github/                    # GitHub configuration
│   └── workflows/
│       └── validate.yaml       # Build validation
├── app/                        # Next.js app directory
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main dashboard page
│   ├── globals.css             # Global styles with Tailwind
│   └── api/                    # API routes
│       ├── analyze/
│       │   └── route.ts        # Main analysis endpoint
│       ├── characters/
│       │   └── fetch/
│       │       └── route.ts    # Character fetching
│       ├── trade/
│       │   └── search/
│       │       └── route.ts    # Trade search
│       ├── preferences/
│       │   └── route.ts        # User preferences
│       └── session/
│           └── validate/
│               └── route.ts    # Session validation
├── components/                  # React components
│   ├── dashboard/
│   │   ├── OpportunityList.tsx
│   │   ├── OpportunityCard.tsx
│   │   ├── FilterPanel.tsx
│   │   └── RefreshButton.tsx
│   ├── ui/                     # Radix UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── tooltip.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/                        # Core logic
│   ├── api/
│   │   ├── poe-client.ts      # PoE API client
│   │   └── rate-limiter.ts    # Rate limiting logic
│   ├── analysis/
│   │   ├── demand.ts           # Demand calculation
│   │   ├── profit.ts           # Profit detection
│   │   └── confidence.ts      # Confidence scoring
│   ├── db/
│   │   ├── sqlite.ts           # SQLite connection
│   │   ├── queries.ts          # SQL queries
│   │   └── migrations.ts      # Schema migrations
│   ├── cache/
│   │   └── file-cache.ts       # JSON file caching
│   ├── stores/
│   │   └── tradingStore.ts     # Zustand store
│   ├── types/
│   │   ├── index.ts            # Main type exports
│   │   ├── models.ts           # Data models
│   │   └── api.ts              # API types
│   └── utils/
│       ├── crypto.ts           # Encryption utilities
│       └── logger.ts           # Winston logging
├── data/                       # Local data storage
│   ├── local.db                # SQLite database
│   └── cache/                  # JSON cache files
│       └── .gitignore          # Ignore cache files
├── public/                     # Static assets
│   └── favicon.ico
├── scripts/                    # Utility scripts
│   ├── setup.js                # Initial setup
│   └── refresh-data.js         # Manual data refresh
├── tests/                      # Test files
│   ├── unit/
│   └── integration/
├── .env.example                # Environment template
├── .gitignore
├── next.config.js              # Next.js configuration
├── package.json
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Setup instructions
```
