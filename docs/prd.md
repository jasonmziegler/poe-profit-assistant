# Path of Exile 2 Trading Assistant App Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Establish market-leading profit discovery platform that transforms reactive price-checking into proactive opportunity identification through intelligent build-demand analysis
- Achieve 5,000 registered users within 6 months with 60%+ weekly active user retention and $10,000 monthly recurring revenue within 12 months
- Deliver 300%+ improvement in user currency-per-hour through systematic opportunity detection and reduced research time from 2-3 hours daily to 30-45 minutes
- Create competitive intelligence advantage by providing 95%+ accurate profit predictions with <200ms response times during peak trading hours
- Build defensible technical moat through proprietary character data pipeline and cross-build demand analysis capabilities that competitors cannot easily replicate
- Enable educational progression where 70% of aspiring traders advance to primary user behaviors within 90 days through gamified learning system

### Background Context

The Path of Exile 2 Trading Assistant App addresses a critical gap in the PoE2 trading ecosystem where profit-seeking players waste countless hours on manual market research due to fragmented information across multiple platforms. While existing tools show build popularity (poe.ninja) or current prices (official trade site), no solution systematically connects build demand intelligence with trading opportunities to enable proactive profit generation.

The core innovation transforms scattered market data into systematic profit opportunities through a dual-platform ecosystem: a web-based Trading Intelligence Dashboard for deep analysis and a future mobile AR companion for instant decision-making. This approach leverages build meta evolution tracking, graduation path prediction, and market manipulation detection to provide users with predictive timing advantages rather than reactive price information, creating the first comprehensive "profit optimization ecosystem" for PoE2 trading.

### Change Log

| Date       | Version | Description                                               | Author               |
| ---------- | ------- | --------------------------------------------------------- | -------------------- |
| 2025-09-20 | 1.0     | Initial PRD creation based on comprehensive Project Brief | Product Manager John |

## Requirements

### Functional

**FR1:** The system integrates with official PoE Character Ladder API to query top players by experience and delve depth, fetching detailed character data including equipment, skills, and passive allocations for proprietary build analysis.

**FR2:** The platform implements proprietary build popularity algorithms that aggregate item usage across character samples to determine demand rankings independent of third-party services.

**FR3:** The system cross-references build demand data against PoE2 trade API pricing to detect opportunities where popular items are undervalued relative to actual player usage patterns.

**FR4:** The application provides item demand scoring through proprietary algorithms that weight item importance by build effectiveness and player count from direct character analysis.

**FR5:** The platform scans PoE2 trade API to find items identified in popular builds that are priced below calculated demand-based market value, displaying potential profit margins.

**FR6:** The system provides a profit calculator that displays buy price vs estimated sell price based on proprietary demand analysis, showing potential currency gains per transaction.

**FR7:** The application handles comprehensive item data parsing (name, base type, modifiers, equipment slots) for accurate character equipment analysis and market comparison.

**FR8:** The web dashboard displays profit opportunities ranked by profit potential and confidence score derived from direct character data analysis.

**FR9:** The platform allows users to set minimum profit thresholds, preferred item categories, and budget constraints for personalized opportunity filtering.

**FR10:** The system stores build evolution data over time from direct character monitoring for trend analysis and graduation path detection.

### Non-Functional

**NFR1:** The system maintains <200ms average API response times for opportunity queries during peak trading hours despite complex character data processing.

**NFR2:** The platform achieves 99.5% uptime during peak trading hours with robust error handling for multiple API dependencies (Character Ladder + Trade).

**NFR3:** The application supports Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+ with <2s page load times despite intensive data analysis.

**NFR4:** The system processes 1000+ character profiles per analysis cycle efficiently using optimized algorithms and caching strategies.

**NFR5:** The platform maintains 95%+ accuracy rate in profit predictions through proprietary demand analysis superior to third-party aggregated data.

**NFR6:** The application implements exponential backoff and request throttling across both Character Ladder and Trade APIs to maintain respectful usage patterns.

**NFR7:** The system ensures secure handling of user-provided session credentials while managing multiple API integrations securely.

**NFR8:** The platform operates within bootstrap budget constraints of ~$100-200/month while supporting intensive character data processing requirements.

**NFR9:** The application provides Progressive Web App (PWA) capabilities optimized for data-intensive profit analysis workflows.

**NFR10:** The system maintains computational efficiency for real-time character analysis without excessive processing costs, enabling sustainable scaling.

## User Interface Design Goals

### Overall UX Vision

The Trading Intelligence Dashboard embodies a "profit-first" design philosophy where every interface element prioritizes actionable financial insights over data density. The experience should feel like a professional trading terminal optimized for rapid decision-making, with clean visual hierarchy that instantly communicates opportunity value, confidence levels, and market timing. Users should experience the interface as their "competitive intelligence advantage" - sophisticated enough for expert traders yet accessible enough for aspiring economic players to learn systematic profit generation.

### Key Interaction Paradigms

**Opportunity-Centric Navigation:** The primary interaction model revolves around profit opportunities as the core UI entity, with drill-down patterns that reveal increasing detail (opportunity → item analysis → market context → historical trends). Users navigate through a funnel from high-level opportunity scanning to detailed execution planning.

**Real-Time Intelligence Flow:** Interface updates reflect live market conditions through subtle animations and color changes that indicate opportunity freshness, price movements, and confidence score fluctuations without overwhelming the user with constant motion.

**Progressive Disclosure Learning:** Educational elements appear contextually as users interact with opportunities, building trading expertise through guided discovery rather than front-loading complex market concepts.

### Core Screens and Views

**Main Dashboard:** Profit opportunity feed with sortable/filterable opportunities ranked by potential return, confidence score, and market timing indicators

**Opportunity Detail View:** Deep-dive analysis showing item demand reasoning, price history, similar opportunities, and execution recommendations

**User Preferences Center:** Personalization hub for profit thresholds, item categories, budget constraints, and notification settings

**Build Analysis Explorer:** Visual representation of character data insights showing which builds drive item demand and upgrade patterns

**Market Intelligence Overview:** Historical trends, seasonal patterns, and market health indicators for strategic positioning

### Accessibility: WCAG AA

Full keyboard navigation support, high contrast mode for trading terminal environments, screen reader optimization for opportunity announcements, and mobile-responsive design ensuring profit discovery accessibility across all devices and user capabilities.

### Branding

Clean, professional aesthetic inspired by financial trading platforms with Path of Exile's dark fantasy color palette. Interface employs subtle PoE2-inspired visual elements (currency icons, item quality colors) while maintaining the serious, data-driven feel of professional market analysis tools. Typography emphasizes readability of numerical data and profit calculations with clear visual hierarchy for rapid scanning.

### Target Device and Platforms: Web Responsive

Primary platform is web responsive optimized for desktop trading workflows, with mobile-responsive design ensuring opportunity monitoring and quick decision-making across all devices. Interface scales from large monitor trading setups to mobile phones for on-the-go market checking.

## Technical Assumptions (MVP-Focused)

### Repository Structure: Monorepo

Single repository containing both frontend and backend components for simplified development workflow. Focus on rapid development and deployment rather than complex architecture, leveraging AI assistance for faster implementation.

### Service Architecture

**Simple Monolith:** Deploy as single application using Next.js with API routes for backend functionality. Avoid complex microservice architecture until user validation proves the concept and scaling becomes necessary. Focus on speed to market over architectural sophistication.

### Testing Requirements

**Essential Testing Only:** Basic unit tests for core profit detection algorithm and integration tests for API connections. Prioritize manual testing and user validation over comprehensive test coverage during MVP phase. Add automated testing as the product proves market fit.

### Additional Technical Assumptions and Requests

**Simplified Technology Stack:**

- **Next.js 13+ with TypeScript:** Single framework for both frontend and backend, excellent AI coding support, simplified deployment
- **TailwindCSS:** Rapid UI development with minimal custom styling
- **Simple Charts (Chart.js):** Basic visualization for profit opportunities and market data

**Backend Approach:**

- **Next.js API Routes:** Serverless functions for backend logic, eliminating separate backend deployment
- **TypeScript throughout:** Type safety for item data parsing and profit calculations
- **No Background Jobs Initially:** Synchronous processing acceptable for MVP user volumes

**Database and Storage:**

- **Vercel PostgreSQL or Simple JSON Files:** Start with simplest viable data storage, upgrade as needed
- **No Redis/Caching Initially:** File-based caching or memory caching acceptable for MVP validation
- **Local Development Database:** SQLite or JSON files for development simplicity

**Infrastructure and Deployment:**

- **Vercel Only:** Single platform for hosting, databases, and deployment
- **GitHub Integration:** Simple push-to-deploy workflow
- **No Complex CI/CD:** Basic deployment automation through Vercel integration

**API Integration Strategy:**

- **Direct API Calls:** Simple fetch-based API integration without complex abstraction layers
- **Basic Rate Limiting:** Simple request throttling using built-in mechanisms
- **Manual Session Management:** User-provided session tokens with basic validation

**Development and Monitoring:**

- **Console Logging:** Simple logging for development and basic production monitoring
- **Vercel Analytics:** Built-in performance monitoring and error tracking
- **No Complex ORM:** Direct SQL queries or simple database abstraction

**Security and Compliance:**

- **HTTPS by Default:** Vercel provides SSL/TLS automatically
- **Environment Variables:** Vercel's built-in environment management
- **Basic Session Security:** Simple session token storage and validation

**Performance Optimization:**

- **Start Simple:** Optimize only when performance becomes an issue
- **Vercel CDN:** Automatic static asset optimization and global distribution
- **Minimal Caching:** Simple response caching for API calls

**Scalability Considerations:**

- **Defer Until Needed:** Focus on proving concept before optimizing for scale
- **Vercel Scaling:** Leverage platform's automatic scaling capabilities
- **Database Scaling:** Address when user base justifies the complexity

## Epic List (MVP-Focused)

**Epic 1: Foundation & Basic Profit Detection**
_Establish project infrastructure, PoE2 API integrations, and core character analysis that delivers working profit opportunity detection for MVP validation._

**Epic 2: Essential Intelligence & User Interface**
_Implement basic demand scoring algorithms and simple web dashboard that enables users to discover and act on profit opportunities._

## Epic 1: Foundation & Basic Profit Detection

**Epic Goal:** Create working MVP that validates core concept - can we accurately identify profitable items by analyzing character ladder data and comparing to market prices? This epic focuses on proving the fundamental algorithm works before building sophisticated features.

### Story 1.1: Minimal Project Setup

As a **developer**,
I want **a simple, working development environment with essential tools only**,
so that **I can focus on building and validating the core profit detection algorithm**.

#### Acceptance Criteria

1. Basic Next.js project initialized with TypeScript for rapid development and strong AI assistance
2. Single deployment target (Vercel) configured for both frontend and serverless backend
3. Environment variable management for API credentials and basic configuration
4. Essential code quality tools (Prettier, ESLint) configured with minimal setup
5. Simple package.json scripts for development and deployment workflows
6. Basic README with setup instructions and development commands
7. Git repository initialized with .gitignore and basic project structure

### Story 1.2: PoE Character Ladder Data Access

As a **system**,
I want **to retrieve basic character equipment data from top players**,
so that **I can identify which items are actually being used in successful builds**.

#### Acceptance Criteria

1. Simple API client connects to PoE Character Ladder endpoint with basic error handling
2. Character data parsing extracts equipment items from top 100 players per league
3. Item normalization handles basic item identification (name, base type, key stats)
4. Basic rate limiting prevents API abuse through simple request throttling
5. Character data stored in simple JSON format for analysis processing
6. Logging captures successful data retrieval and basic error conditions
7. Manual trigger mechanism allows testing character analysis on demand

### Story 1.3: Basic Market Price Collection

As a **system**,
I want **to get current market prices for items found in character analysis**,
so that **I can compare demand indicators against actual market availability**.

#### Acceptance Criteria

1. Trade API integration retrieves current listings for specific items with basic authentication
2. Price data parsing extracts current market prices and item availability from trade listings
3. Simple caching prevents redundant API calls for same items within reasonable timeframe
4. Basic session management handles user-provided POESESSID for trade API access
5. Market data stored alongside character analysis results for comparison processing
6. Error handling manages API failures and session expiration with user feedback
7. Manual price checking capability for testing specific items during development

### Story 1.4: Core Profit Detection Algorithm

As a **system**,
I want **a simple algorithm that identifies items popular in builds but cheap in market**,
so that **I can validate the core concept before adding complexity**.

#### Acceptance Criteria

1. Basic popularity scoring based on item frequency across analyzed characters
2. Simple profit calculation comparing item demand score against current market prices
3. Opportunity identification highlights items with high usage but low market pricing
4. Basic confidence scoring indicates reliability of each opportunity based on data quality
5. Results ranking orders opportunities by potential profit margin and popularity score
6. Algorithm produces minimum 10 opportunities daily to validate concept effectiveness
7. Manual algorithm execution allows testing and refinement during development

### Story 1.5: Simple Opportunity Display

As a **user**,
I want **a basic web page showing profitable opportunities with essential information**,
so that **I can validate whether the profit predictions are useful and accurate**.

#### Acceptance Criteria

1. Simple HTML page displays opportunity list with item name, current price, and predicted profit
2. Basic opportunity details show why item is considered profitable (usage stats + market data)
3. Minimal filtering allows users to set basic profit thresholds for displayed opportunities
4. Simple refresh mechanism updates opportunity list with current data
5. Basic responsive design works on desktop and mobile devices for accessibility
6. Loading states indicate when data is being processed or updated
7. Error messages provide clear feedback when systems are unavailable or data is stale

### Story 1.6: MVP User Validation

As a **user**,
I want **to test profit predictions against real market outcomes**,
so that **I can validate whether the system actually helps me make profitable trades**.

#### Acceptance Criteria

1. Simple user session management allows basic preference storage and result tracking
2. Opportunity tracking lets users mark which opportunities they acted upon
3. Basic outcome tracking allows users to report actual profits/losses from followed recommendations
4. Simple analytics show prediction accuracy and user success rates for validation
5. Feedback mechanism allows users to report false positives and system improvements
6. Export capability provides users with basic data about their trading activity
7. Validation metrics demonstrate whether users can achieve 80%+ prediction accuracy in testing

## Epic 2: Essential Intelligence & User Interface

**Epic Goal:** Enhance the basic profit detection with improved algorithms and polished user interface that makes the tool genuinely useful for traders. This epic focuses on improving accuracy and usability after MVP validation proves the concept works.

### Story 2.1: Improved Demand Analysis Algorithm

As a **system**,
I want **enhanced scoring algorithms that consider character performance and build success patterns**,
so that **I can provide more accurate predictions than simple item frequency counting**.

#### Acceptance Criteria

1. Character performance weighting prioritizes items used by higher-level and more successful players
2. Build success correlation identifies items associated with effective character builds vs struggling ones
3. Item slot importance analysis weights critical equipment slots more heavily than optional items
4. Cross-build analysis identifies items popular across multiple different character archetypes
5. Algorithm accuracy improvements demonstrate measurably better predictions than Epic 1 basic version
6. Confidence scoring provides reliability metrics for each recommendation based on data quality
7. Performance validation shows improved user success rates compared to basic MVP algorithm

### Story 2.2: Enhanced User Interface

As a **user**,
I want **a clean, professional interface that makes opportunities easy to understand and act upon**,
so that **I can efficiently identify and execute profitable trades without confusion**.

#### Acceptance Criteria

1. Professional dashboard interface displays opportunities with clear visual hierarchy and intuitive navigation
2. Opportunity detail views explain reasoning behind recommendations with supporting data and charts
3. User preference system allows customization of filters, thresholds, and display options
4. Responsive design ensures optimal experience across desktop and mobile devices
5. Real-time updates show current opportunity status and market data freshness
6. Basic user account system enables preference storage and basic usage tracking
7. Interface polish includes loading states, error handling, and clear user feedback throughout

### Story 2.3: Market Analysis Enhancement

As a **system**,
I want **better market analysis that considers price trends and availability patterns**,
so that **I can identify higher-quality opportunities with better success probability**.

#### Acceptance Criteria

1. Price trend analysis identifies whether item prices are rising, falling, or stable over recent period
2. Market availability analysis considers supply levels and typical item turnover rates
3. Competition assessment evaluates how quickly similar opportunities are typically exploited
4. Risk scoring incorporates market volatility and execution difficulty into opportunity ranking
5. Historical validation tracks opportunity outcome success rates to improve future predictions
6. Market timing suggestions indicate optimal buying and selling windows based on data patterns
7. Enhanced filtering allows users to specify risk tolerance and market timing preferences

### Story 2.4: User Validation and Feedback System

As a **user**,
I want **to track my trading results and provide feedback on platform accuracy**,
so that **I can validate the platform's value and help improve its recommendations**.

#### Acceptance Criteria

1. Simple trade tracking allows users to mark which opportunities they acted upon
2. Outcome reporting enables users to input actual profits/losses from followed recommendations
3. Accuracy analytics show platform prediction success rates and user-specific performance
4. Feedback system allows users to rate recommendation quality and report issues
5. User dashboard shows personal trading performance and platform recommendation effectiveness
6. Success metrics demonstrate clear value for users following platform recommendations
7. Continuous improvement process incorporates user feedback into algorithm refinements

## Post-MVP Roadmap (Future Epics)

_The following advanced features will be considered after MVP validation and initial user adoption:_

**Epic 3: Advanced Market Intelligence**

- Historical trend analysis and pattern recognition
- Build meta evolution tracking and graduation path prediction
- Market manipulation detection and protection systems
- Predictive analytics and seasonal opportunity patterns

**Epic 4: Professional Features & Optimization**

- Portfolio management and performance analytics
- Educational progression and learning systems
- Mobile application with AR scanning capabilities
- Advanced analytics, API access, and premium features

**Epic 5: Platform Scaling & Community**

- Performance optimization and infrastructure scaling
- User community features and social trading elements
- Advanced personalization and machine learning optimization
- Cross-platform integrations and third-party tool connectivity

## Checklist Results Report

### Epic Scope Revision Summary

**Original Challenge:** Initial epic structure represented 6-12 month product roadmap exceeding single-developer MVP constraints.

**Resolution:** Restructured to focus on core concept validation:

- **Epic 1:** Foundation & Basic Profit Detection (MVP core validation)
- **Epic 2:** Essential Intelligence & User Interface (post-validation improvements)
- **Post-MVP Roadmap:** Advanced features deferred until market validation proves concept

**Key Changes:**

- Simplified technical stack (Next.js + Vercel only)
- Removed complex features (ML, market manipulation detection, mobile AR)
- Focus on proving core algorithm accuracy before building sophisticated features
- 8-12 week timeline now realistic for two focused epics

### Final Decision: READY FOR ARCHITECT

The PRD is now appropriately scoped, comprehensive, and ready for architectural design with realistic MVP focus.

## Next Steps

### UX Expert Prompt

"Based on the attached PRD for Path of Exile 2 Trading Assistant App, please create the user interface design that prioritizes profit opportunity discovery and user validation. Focus on Epic 1's simple opportunity display requirements and Epic 2's enhanced dashboard interface. The MVP must validate that users can successfully identify and execute profitable trades using our character analysis approach. Design for rapid development using Next.js + TailwindCSS with emphasis on clear data presentation over visual sophistication."

### Architect Prompt

"Review the attached PRD for Path of Exile 2 Trading Assistant App and create the technical architecture for MVP development. Focus on Epic 1's foundation and basic profit detection using simplified Next.js + Vercel stack. Priority is rapid development and concept validation - prove the core algorithm (character ladder analysis → profit opportunity detection) works accurately before adding complexity. Address PoE API integration challenges, character data processing architecture, and basic user session management. Target 8-12 week development timeline for single developer with AI assistance."
