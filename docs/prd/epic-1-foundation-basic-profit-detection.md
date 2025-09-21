# Epic 1: Foundation & Basic Profit Detection

**Epic Goal:** Create working MVP that validates core concept - can we accurately identify profitable items by analyzing character ladder data and comparing to market prices? This epic focuses on proving the fundamental algorithm works before building sophisticated features.

## Story 1.1: Minimal Project Setup

As a **developer**,
I want **a simple, working development environment with essential tools only**,
so that **I can focus on building and validating the core profit detection algorithm**.

### Acceptance Criteria

1. Basic Next.js project initialized with TypeScript for rapid development and strong AI assistance
2. Single deployment target (Vercel) configured for both frontend and serverless backend
3. Environment variable management for API credentials and basic configuration
4. Essential code quality tools (Prettier, ESLint) configured with minimal setup
5. Simple package.json scripts for development and deployment workflows
6. Basic README with setup instructions and development commands
7. Git repository initialized with .gitignore and basic project structure

## Story 1.2: PoE Character Ladder Data Access

As a **system**,
I want **to retrieve basic character equipment data from top players**,
so that **I can identify which items are actually being used in successful builds**.

### Acceptance Criteria

1. Simple API client connects to PoE Character Ladder endpoint with basic error handling
2. Character data parsing extracts equipment items from top 100 players per league
3. Item normalization handles basic item identification (name, base type, key stats)
4. Basic rate limiting prevents API abuse through simple request throttling
5. Character data stored in simple JSON format for analysis processing
6. Logging captures successful data retrieval and basic error conditions
7. Manual trigger mechanism allows testing character analysis on demand

## Story 1.3: Basic Market Price Collection

As a **system**,
I want **to get current market prices for items found in character analysis**,
so that **I can compare demand indicators against actual market availability**.

### Acceptance Criteria

1. Trade API integration retrieves current listings for specific items with basic authentication
2. Price data parsing extracts current market prices and item availability from trade listings
3. Simple caching prevents redundant API calls for same items within reasonable timeframe
4. Basic session management handles user-provided POESESSID for trade API access
5. Market data stored alongside character analysis results for comparison processing
6. Error handling manages API failures and session expiration with user feedback
7. Manual price checking capability for testing specific items during development

## Story 1.4: Core Profit Detection Algorithm

As a **system**,
I want **a simple algorithm that identifies items popular in builds but cheap in market**,
so that **I can validate the core concept before adding complexity**.

### Acceptance Criteria

1. Basic popularity scoring based on item frequency across analyzed characters
2. Simple profit calculation comparing item demand score against current market prices
3. Opportunity identification highlights items with high usage but low market pricing
4. Basic confidence scoring indicates reliability of each opportunity based on data quality
5. Results ranking orders opportunities by potential profit margin and popularity score
6. Algorithm produces minimum 10 opportunities daily to validate concept effectiveness
7. Manual algorithm execution allows testing and refinement during development

## Story 1.5: Simple Opportunity Display

As a **user**,
I want **a basic web page showing profitable opportunities with essential information**,
so that **I can validate whether the profit predictions are useful and accurate**.

### Acceptance Criteria

1. Simple HTML page displays opportunity list with item name, current price, and predicted profit
2. Basic opportunity details show why item is considered profitable (usage stats + market data)
3. Minimal filtering allows users to set basic profit thresholds for displayed opportunities
4. Simple refresh mechanism updates opportunity list with current data
5. Basic responsive design works on desktop and mobile devices for accessibility
6. Loading states indicate when data is being processed or updated
7. Error messages provide clear feedback when systems are unavailable or data is stale

## Story 1.6: MVP User Validation

As a **user**,
I want **to test profit predictions against real market outcomes**,
so that **I can validate whether the system actually helps me make profitable trades**.

### Acceptance Criteria

1. Simple user session management allows basic preference storage and result tracking
2. Opportunity tracking lets users mark which opportunities they acted upon
3. Basic outcome tracking allows users to report actual profits/losses from followed recommendations
4. Simple analytics show prediction accuracy and user success rates for validation
5. Feedback mechanism allows users to report false positives and system improvements
6. Export capability provides users with basic data about their trading activity
7. Validation metrics demonstrate whether users can achieve 80%+ prediction accuracy in testing
