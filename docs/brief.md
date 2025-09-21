# Project Brief: Path of Exile 2 Trading Assistant App

**Date:** 2025-09-19
**Prepared by:** Business Analyst Mary
**Status:** Complete - Ready for PRD Development

---

## Executive Summary

**Path of Exile 2 Trading Assistant App** is an intelligent profit discovery platform that analyzes top-performing builds from poe.ninja to identify high-demand items, then scans the trading market across multiple price ranges and item levels to surface the best value opportunities for profitable reselling.

**Core Intelligence Engine:**

- **Build Meta Evolution Tracker** - Track how builds evolve over patches and seasons, identifying "graduating items" when players upgrade from budget to premium versions
- **Budget Build Graduation Paths** - Map exact upgrade sequences from league start to endgame, predicting when players will be ready to buy higher-tier items
- **Build Similarity Clustering** - Group builds by actual gear overlap rather than class names, identifying reliable cross-archetype demand patterns
- **Seasonal Opportunity Patterns** - Learn historical patterns of which items become valuable when (league start vs endgame timing)

**Advanced Market Intelligence:**

- **Market Manipulation Detection** - Flag suspicious pricing patterns and protect users from artificial scarcity and FOMO-driven purchases
- **Crafting Profit Calculator Integration** - Identify buy → craft → sell profit chains, creating vertical integration opportunities

**User Engagement & Gamification:**

- **Profit Leaderboards & Achievement System** - Track success rates, celebrate milestones, create expertise hierarchy through social proof
- **Augmented Reality Trade Scanning** - Mobile app that scans game screenshots and overlays instant profit analysis data

**User Experience Flow:**

1. **Web Platform:** "Top builds are graduating from 15 Divine to 45+ Divine swords - here are 8 undervalued candidates across price ranges"
2. **Mobile AR:** Point phone at item screenshot → instantly see profit potential and market timing
3. **Crafting Integration:** "Buy this base (5D) + craft materials (3D) = sell for 15+ Divine profit"
4. **Achievement Unlock:** "Congratulations! You've mastered Amulet flipping - 50 Divine profit this week!"

**Key Innovation:** The first **predictive trading intelligence** platform for Path of Exile - combining build analytics, market intelligence, crafting economics, and gamified learning into a comprehensive profit optimization ecosystem.

---

## Problem Statement

**Current State:** PoE2 trading is fundamentally broken for profit-seeking players. While build guides show you what items to use, and trading sites show you what items cost, there's a massive gap in **actionable profit intelligence**. Players waste countless hours manually:

- **Researching build popularity** - Checking multiple sites to understand which builds are actually being played vs just theorycrafted
- **Cross-referencing demand signals** - No systematic way to connect "this item is used in popular builds" with "this item is undervalued in the market"
- **Analyzing upgrade paths** - Can't easily identify when budget players will graduate to expensive versions of items
- **Timing market cycles** - Miss seasonal opportunities because there's no historical pattern analysis
- **Avoiding market traps** - Fall victim to artificial price inflation and manipulation without detection systems
- **Crafting profit calculations** - Manually calculating material costs vs potential sale prices for crafted items
- **Mobile accessibility** - Can't quickly evaluate opportunities when away from their main trading setup

**Pain Points & Impact:**

**Time Inefficiency Crisis:** Expert traders spend 3-4 hours daily on manual market research that could be automated, reducing their trading time-to-profit ratio and limiting scalability.

**Information Asymmetry:** Streamers and content creators have insider knowledge about upcoming build trends, while regular players react to price changes after they've already happened - creating systematic disadvantage.

**Opportunity Cost Losses:** Players make suboptimal purchasing decisions because they lack systematic analysis of graduation paths, seasonal patterns, and cross-build demand overlap.

**Market Manipulation Vulnerability:** Without detection systems, players regularly fall victim to artificial scarcity tactics and coordinated price manipulation, losing significant currency.

**Capital Allocation Problems:** No systematic way to determine optimal portfolio across different item types, price ranges, and market timing - leading to over-concentration in low-profit opportunities.

**Why Existing Solutions Fall Short:**

- **poe.ninja:** Shows build popularity but no trading integration or profit analysis
- **Official trade site:** Shows current prices but no demand analysis or profit opportunities
- **Third-party price checkers:** Reactive tools that tell you current value, not future profit potential
- **Build guides:** Tell you what to use but not when to buy it or how much profit potential exists

**Urgency Factor:** PoE2's launch creates a unique window where early movers with superior market intelligence can establish significant economic advantages before the trading ecosystem matures and opportunities become more efficient.

---

## Proposed Solution

**Core Concept:** A **dual-platform intelligent trading ecosystem** that transforms scattered market data into systematic profit opportunities through build-demand intelligence and predictive analytics.

**Data Acquisition Strategy:**

- **MVP Phase:** Leverage existing poe.ninja/builds API to rapidly validate concept and build user base
- **Launch Phase:** Develop proprietary character data scraping to eliminate platform dependency and gain competitive advantage
- **Advantage:** Own our data pipeline = custom analysis capabilities that poe.ninja doesn't provide (graduation path tracking, item combination analysis, temporal build evolution)

**Web Platform - "Trading Intelligence Dashboard":**

- **Real-time Build Analysis Engine:** Initially leverages poe.ninja API, transitioning to proprietary character ladder scraping for deeper analysis
- **Enhanced Character Intelligence:** Direct access to character data enables analysis poe.ninja doesn't provide:
  - **Item Progression Tracking:** See actual upgrade sequences players follow over time
  - **Build Variant Detection:** Identify successful variations that aren't captured in standard build guides
  - **Micro-Meta Analysis:** Detect emerging trends before they appear on popular build sites
- **Multi-Tier Opportunity Scanner:** For each high-demand item type, analyzes the complete price curve from budget to premium versions, highlighting undervalued entries at every tier
- **Graduation Path Predictor:** Tracks actual player upgrade patterns from direct character monitoring
- **Market Manipulation Detection:** Flags suspicious price movements that don't correlate with actual build popularity changes
- **Seasonal Pattern Intelligence:** Historical analysis showing which items become valuable when

**Technical Architecture Benefits:**

- **MVP Speed:** Using poe.ninja API allows rapid prototype development and market validation
- **Competitive Moat:** Proprietary scraping creates unique data advantages competitors can't easily replicate
- **Data Quality:** Direct character access provides more granular insights than aggregated build popularity
- **Platform Independence:** Eliminates risk of poe.ninja API changes breaking core functionality

**Migration Strategy:**

1. **Week 1-4:** Build MVP using poe.ninja API integration
2. **Week 5-8:** Develop parallel character scraping infrastructure
3. **Week 9-12:** A/B test data quality and accuracy between sources
4. **Launch:** Deploy with proprietary data pipeline, keep poe.ninja as backup/validation

**Mobile AR Companion - "Instant Profit Scanner":**

- **Screenshot Analysis:** Point camera at item screenshots, instantly overlay profit potential, market timing, and recommended actions
- **Push Notifications:** Real-time alerts when high-profit opportunities matching user preferences become available
- **Quick Decision Interface:** Swipe-based interface for rapid opportunity evaluation while actively playing

**Integrated Crafting Economics:**

- **Profit Chain Calculator:** Identify buy → craft → sell sequences, calculating material costs vs potential sale prices
- **Base Item Optimizer:** Recommend which bases to purchase for specific crafting projects based on success probability and profit margins
- **Seasonal Crafting Opportunities:** Track when certain crafted items become most profitable (league mechanics, meta shifts)

**Gamification & Learning System:**

- **Achievement Progression:** Unlock expertise badges across different item categories and trading strategies
- **Profit Leaderboards:** Monthly competitions with different categories (total profit, best single trade, most consistent performer)
- **Educational Integration:** Each opportunity includes "why this is profitable" explanations, teaching market principles

**Key Differentiators:**

**1. Demand-Driven Intelligence:** Unlike reactive price checkers, our system proactively identifies opportunities by following actual player behavior patterns from build popularity data.

**2. Predictive Timing:** Rather than showing current prices, we predict future demand based on build evolution patterns and seasonal cycles, enabling strategic positioning.

**3. Cross-Platform Accessibility:** Web platform for deep analysis + mobile AR for instant decisions = comprehensive coverage of all trading scenarios.

**4. Educational Profit Generation:** Users don't just make money, they learn WHY they're making money, creating compound expertise over time.

**Why This Solution Will Succeed Where Others Haven't:**

- **Network Effect Advantage:** More users = better data quality = more accurate predictions = more successful users
- **Behavioral Psychology Integration:** Gamification and achievement systems create habit formation and user retention
- **Multiple Revenue Touchpoints:** Web premium features + mobile app + educational content creates sustainable business model
- **Technical Moat:** Build analysis algorithms and historical pattern recognition create defensible competitive advantage

---

## Target Users

### Primary User Segment: **Profit-Focused Traders**

**Demographics:**

- **Gaming Experience:** 2-5+ years in Path of Exile ecosystem, familiar with trading mechanics and market concepts
- **Time Investment:** 15-30 hours/week gaming, with 20-30% of that time spent on trading-related activities
- **Economic Mindset:** Treat PoE trading as serious economic activity, track profits, optimize currency generation strategies
- **Technical Comfort:** Comfortable with multiple tools/websites, willing to learn new platforms for competitive advantage

**Current Behaviors & Workflows:**

- **Manual Research Sessions:** Spend 1-3 hours daily checking poe.ninja, official trade site, build guides, and community forums
- **Multi-Tab Trading:** Maintain 5-10 browser tabs open simultaneously for price comparison and opportunity detection
- **Build Following:** Monitor popular streamers and content creators to predict upcoming demand trends
- **Currency Optimization:** Actively flip currency and items for profit, treating it as primary income source in-game

**Specific Pain Points:**

- **Information Fragmentation:** Must manually cross-reference build popularity with market prices across multiple platforms
- **Timing Inefficiency:** Often discover profitable opportunities after they've already been exploited by faster traders
- **Opportunity Overwhelm:** Can't systematically evaluate hundreds of potential trades without massive time investment
- **Market Manipulation Vulnerability:** Frequently fall victim to artificial price inflation without detection systems

**Goals They're Trying to Achieve:**

- **Maximize Currency Per Hour:** Want to optimize trading efficiency to generate more in-game wealth in less time
- **Competitive Intelligence:** Seek systematic advantages over other traders through better information and timing
- **Risk Mitigation:** Avoid bad purchases and market manipulation while identifying genuinely profitable opportunities
- **Scalable Systems:** Replace manual research with automated intelligence that can handle larger trading volumes

### Secondary User Segment: **Aspiring Economic Players**

**Demographics:**

- **Gaming Experience:** 6 months - 2 years in Path of Exile, understand basic game mechanics but new to serious trading
- **Time Investment:** 10-20 hours/week gaming, currently spend minimal time on trading but interested in learning
- **Economic Mindset:** Want to generate more in-game currency but intimidated by complexity of trading systems
- **Technical Comfort:** Basic comfort with gaming tools, prefer guided experiences over complex manual processes

**Current Behaviors & Workflows:**

- **Reactive Trading:** Primarily sell items they find, rarely buy items proactively for profit
- **Price Checking:** Use basic price checkers to determine if found items are valuable
- **Build Following:** Follow build guides strictly, don't optimize for economic efficiency
- **Vendor Reliance:** Often vendor items that could be profitable because they don't understand market value

**Specific Pain Points:**

- **Knowledge Barrier:** Don't understand what makes items valuable or how to identify profitable opportunities
- **Time Constraint Fear:** Believe profitable trading requires too much time investment to be worthwhile
- **Risk Aversion:** Afraid of losing currency on bad purchases due to inexperience
- **Tool Complexity:** Existing trading tools assume too much knowledge and provide overwhelming information

**Goals They're Trying to Achieve:**

- **Learn While Earning:** Want educational guidance that teaches trading principles while generating profit
- **Low-Risk Introduction:** Seek safe ways to experiment with trading without significant currency loss
- **Efficiency Gains:** Generate more currency from same time investment through smarter item decisions
- **Confidence Building:** Develop expertise and intuition for market dynamics over time

---

## Goals & Success Metrics

### Business Objectives

- **User Acquisition:** Achieve 5,000 registered users within 6 months of PoE2 launch, with 20% monthly growth rate thereafter
- **User Engagement:** Maintain 60%+ weekly active user rate among registered users, with average session duration of 15+ minutes
- **Revenue Generation:** Reach $10,000 monthly recurring revenue within 12 months through freemium model (premium features + mobile app)
- **Market Position:** Establish as top 3 most-referenced trading tool in PoE2 community forums and content creator mentions
- **Data Quality Leadership:** Achieve 95%+ accuracy rate in profit predictions compared to actual market outcomes
- **Platform Independence:** Successfully migrate 80%+ of analysis to proprietary data pipeline within 8 months, reducing poe.ninja dependency

### User Success Metrics

- **Profit Generation:** Users report average 300%+ improvement in currency-per-hour through systematic opportunity identification
- **Time Efficiency:** Reduce user research time from 2-3 hours daily to 30-45 minutes for equivalent trading results
- **Learning Progression:** 70% of secondary users (aspiring traders) advance to primary user behaviors within 90 days of active use
- **Decision Confidence:** Users successfully avoid 85%+ of flagged market manipulation scenarios, preventing currency losses
- **Mobile Adoption:** 40%+ of active users regularly use AR scanning feature for real-time opportunity evaluation
- **Community Knowledge:** Users demonstrate improved trading intuition through achievement progression and leaderboard performance

### Key Performance Indicators (KPIs)

- **Daily Active Users (DAU):** Target 1,500+ DAU within 6 months, with 3:1 weekend:weekday ratio reflecting PoE gaming patterns
- **Opportunity Conversion Rate:** 25%+ of flagged profit opportunities are acted upon by users within 4 hours of identification
- **Prediction Accuracy Score:** Maintain 90%+ accuracy in profit margin predictions, measured against actual user transaction outcomes
- **User Retention Cohorts:** 60% 30-day retention, 40% 90-day retention, 25% 1-year retention among registered users
- **Revenue Per User (RPU):** Average $2.50 monthly revenue per active user through premium subscriptions and mobile app purchases
- **API Performance Metrics:** <200ms average response time for opportunity queries, 99.5% uptime during peak trading hours
- **Content Creation Impact:** Generate 50+ YouTube/Twitch mentions monthly by creators with 10,000+ subscribers
- **Market Manipulation Detection Rate:** Identify and flag 95%+ of confirmed market manipulation events within 30 minutes of occurrence

---

## MVP Scope

### Core Features (Must Have)

- **Build Popularity Analysis Engine:** Integrate with poe.ninja/builds API to fetch and analyze top build data, identifying most-used items by popularity percentage and player count
- **Basic Opportunity Detection:** For items identified in popular builds, scan PoE2 trade API to find listings priced below market average, highlighting potential profit margins
- **Simple Profit Calculator:** Display buy price vs estimated sell price with basic profit margin calculations, showing potential currency gains per transaction
- **Essential Item Parsing:** Handle core item data extraction (name, base type, key modifiers) for accurate market comparison and opportunity matching
- **Web Dashboard Interface:** Clean, responsive web interface displaying opportunities in ranked order by profit potential and confidence score
- **User Preference Settings:** Allow users to set minimum profit thresholds, preferred item categories, and budget constraints for personalized opportunity filtering

### Out of Scope for MVP

- Mobile AR scanning functionality (Phase 2 feature)
- Advanced market manipulation detection algorithms
- Crafting profit calculator integration
- Achievement system and gamification features
- Historical trend analysis and seasonal patterns
- Build similarity clustering analysis
- User accounts and social features
- Real-time push notifications
- Advanced item parsing (complex modifier combinations)
- Multi-league price comparison

### MVP Success Criteria

**Technical Success:** Successfully identify and display 20+ profitable opportunities daily with 80%+ accuracy in profit predictions during initial testing period.

**User Success:** 100+ registered beta users actively using the platform within 4 weeks of launch, with average session duration of 10+ minutes.

**Market Validation:** Users report successful execution of 60%+ of flagged opportunities, demonstrating real market value and profit generation.

**Business Validation:** Achieve product-market fit indicators through user retention (40%+ weekly active users) and organic word-of-mouth growth (20%+ referral-driven signups).

---

## Post-MVP Vision

### Phase 2 Features

**Mobile AR Profit Scanner (3-4 months post-MVP)**

- Point-and-scan functionality for instant item profit analysis from screenshots
- Real-time opportunity alerts with push notifications for high-value discoveries
- Offline mode for basic profit calculations without internet connectivity
- Integration with web platform for seamless cross-device experience

**Advanced Market Intelligence (4-6 months post-MVP)**

- Build Meta Evolution Tracker monitoring how builds change over patches and seasons
- Budget Build Graduation Path analysis predicting when players upgrade item tiers
- Market Manipulation Detection system protecting users from artificial price inflation
- Seasonal Opportunity Patterns based on historical league timing and player behavior

**Crafting Profit Integration (5-7 months post-MVP)**

- Buy → craft → sell profit chain calculator with material cost analysis
- Base item optimization recommendations for specific crafting projects
- Success probability modeling for crafting outcomes and expected value calculations
- Integration with crafting simulator tools for comprehensive profit planning

### Long-term Vision

**Proprietary Data Pipeline (6-12 months)**

- Complete migration from poe.ninja dependency to self-hosted character analysis
- Real-time ladder scraping for immediate build trend detection
- Historical player progression tracking across multiple leagues
- Custom analytics impossible through third-party data sources

**Intelligent Trading Ecosystem (12-18 months)**

- Build Similarity Clustering identifying cross-archetype gear demand patterns
- Predictive demand modeling based on patch notes and meta shifts
- Community-driven profit sharing through verified trade outcome reporting
- AI-powered market forecasting with confidence intervals and risk assessment

**Platform Expansion & Monetization (18+ months)**

- Profit Leaderboards and Achievement System with competitive trading leagues
- Premium subscription tiers with advanced analytics and priority data access
- Content creator partnership program with exclusive build trend insights
- API access for third-party tool integration and white-label solutions

### Expansion Opportunities

**Cross-Game Trading Intelligence**

- Expand successful model to other complex trading games (Warframe, EVE Online, etc.)
- Leverage core build-demand analysis algorithms across gaming ecosystems
- Create network effects through shared user expertise and trading principles

**Educational Content Platform**

- YouTube channel and written guides teaching advanced trading strategies
- Community-driven profit case studies and market analysis breakdowns
- Paid courses and consulting services for serious profit-focused players

**Enterprise & Creator Tools**

- Content creator dashboard showing build popularity trends for video planning
- Streamer integration tools for real-time profit opportunity showcasing
- Community website integration through embeddable profit widgets

**Financial Technology Innovation**

- Blockchain-verified trading reputation system for high-value transactions
- Automated trading bot integration with profit opportunity pipelines
- Cross-platform virtual currency exchange and arbitrage detection

---

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Web application (primary), Progressive Web App (PWA) capabilities
- **Browser/OS Support:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Performance Requirements:** <200ms API response times, <2s page load, efficient bulk character processing
- **Data Processing:** Handle 1000+ character profiles per analysis cycle with proper rate limiting

### Technology Preferences

- **Frontend:** SvelteKit for performance, TypeScript for data type safety
- **Backend:** Node.js with Fastify for high-performance API handling and data processing
- **Database:** PostgreSQL for character data and analysis results, Redis for caching processed build statistics
- **Hosting/Infrastructure:** Vercel for frontend, DigitalOcean for backend services and database

### Architecture Considerations

**Data Collection Pipeline:**

- **PoE Ladder API Integration:** Query official character ladders (experience, delve depth) for top players
- **Character Profile Fetching:** Retrieve detailed character data including equipment, skills, passive allocations
- **Rate Limiting & Respectful Usage:** Implement exponential backoff and request throttling to maintain API access
- **Data Validation & Cleaning:** Normalize item names, handle missing data, validate equipment configurations

**Analysis Engine:**

- **Build Popularity Calculator:** Aggregate item usage across character samples to determine demand rankings
- **Item Demand Scoring:** Proprietary algorithms for weighting item importance by build effectiveness and player count
- **Market Cross-Reference:** Compare build demand data against trade API pricing for opportunity detection
- **Historical Tracking:** Store build evolution data over time for trend analysis and graduation path detection

**Integration Requirements:**

- **Official PoE Character API:** Primary data source for all character information
- **Official PoE Trade API:** Market pricing and availability data
- **Future Expansions:** OAuth integration for user character analysis, Path of Building import functionality

**Security/Compliance:**

- **API Key Management:** Secure storage and rotation of PoE API credentials
- **Rate Limiting Compliance:** Respectful usage patterns to maintain API access
- **User Data Protection:** Secure handling of any user-connected character data
- **Monitoring & Alerting:** Track API usage, data quality, and system health

---

## Constraints & Assumptions

### Constraints

- **Budget:** Bootstrap/self-funded development with minimal initial capital for hosting and tools (~$100-200/month operating costs)
- **Timeline:** MVP target of 8-12 weeks development time leveraging AI-assisted coding, with PoE2 early access providing immediate market opportunity
- **Resources:** Single developer (you) with AI coding assistance, no dedicated designers or additional technical staff
- **Technical:** Limited to technologies well-supported by AI coding tools (JavaScript/TypeScript ecosystem preferred for better AI assistance)
- **API Dependencies:** Subject to official PoE API rate limits and terms of service, must maintain respectful usage patterns

### Key Assumptions

- **PoE2 Market Maturity:** PoE2 early access already has active trading with sufficient market inefficiencies for profit opportunities
- **API Infrastructure Proven:** PoE2 trade API is confirmed accessible and functional for integration
- **Market Timing Advantage:** Early access period creates optimal window for establishing tool before ecosystem matures
- **AI Coding Effectiveness:** Current AI coding tools can successfully assist with complex data pipeline development
- **User Adoption Patterns:** PoE players will adopt new tools if they provide clear competitive advantages, similar to established PoE1 tool ecosystem
- **Data Processing Feasibility:** Character data analysis can be performed efficiently enough to provide real-time insights without excessive computational costs
- **Revenue Model Viability:** Users will eventually pay for premium features after experiencing free MVP value proposition
- **Early Access Advantage:** Being first-to-market with intelligent profit tools during early access creates significant competitive positioning

---

## Risks & Open Questions

### Key Risks

- **AI Coding Limitations:** Complex data processing and algorithmic development may exceed current AI assistance capabilities, requiring manual coding expertise that slows development
- **User Session Management:** Users may struggle with finding/providing their POESESSID, creating onboarding friction and support burden
- **Rate Limiting Complexity:** Implementing proper per-user rate limiting and backoff mechanisms to respect PoE2 API limits across multiple concurrent users
- **Session Security:** Secure handling and storage of user-provided session IDs to maintain user trust and account safety
- **Market Efficiency Evolution:** PoE2 trading market may become efficient quickly, reducing profit opportunities before tool gains traction
- **Competition from Established Tools:** Existing PoE1 tool creators may rapidly develop PoE2 versions with established user bases
- **Technical Complexity Underestimation:** Build analysis algorithms and opportunity detection may be more complex than anticipated
- **User Acquisition Challenge:** Building awareness and trust without marketing budget or established reputation

### Open Questions

- **What's the optimal user experience for POESESSID collection and management?**
- **How should rate limiting be distributed across users to prevent API abuse while maintaining responsiveness?**
- **What happens when user sessions expire and how should the tool handle authentication failures?**
- **How complex is character data parsing for PoE2 compared to expectations?**
- **How quickly can AI coding tools handle complex algorithmic development for profit opportunity detection?**
- **What level of prediction accuracy is required for users to trust profit recommendations?**
- **How should the tool handle false positive opportunities that result in user losses?**
- **What are realistic user acquisition strategies for the PoE2 community?**

### Areas Needing Further Research

- **Session ID UX Patterns:** Research how other PoE tools handle user authentication and session management
- **Rate Limiting Architecture:** Design distributed rate limiting system that scales across multiple users while respecting API constraints
- **PoE2 Community Engagement:** Direct research through Discord, Reddit, and forums to understand current tool preferences and pain points
- **API Technical Validation:** Hands-on testing of PoE2 trade API with session authentication to understand capabilities and limitations
- **Security Best Practices:** Research secure storage and transmission of gaming session credentials
- **Competitive Analysis:** Analysis of existing PoE1 trading tools and their PoE2 expansion plans
- **AI Coding Validation:** Build proof-of-concept to test AI assistance effectiveness for algorithmic development

---

## Next Steps

### Immediate Actions

1. **Technical Proof of Concept (Week 1):** Build minimal PoE2 trade API integration with user session authentication to validate technical feasibility and rate limiting approach
2. **Community Research (Week 1-2):** Engage PoE2 Discord/Reddit communities to validate trading pain points and gauge interest in intelligent profit tools
3. **Competitive Analysis (Week 2):** Research existing PoE1 trading tools, their PoE2 plans, and identify differentiation opportunities
4. **AI Coding Validation (Week 2-3):** Test AI assistance effectiveness by building core components (item parsing, basic build analysis) to validate development approach
5. **MVP Technical Architecture (Week 3-4):** Design complete system architecture with user session management, rate limiting, and scalable data processing
6. **Development Sprint Planning (Week 4):** Break down MVP features into specific development tasks optimized for AI-assisted coding approach

### Research Summary

Based on the comprehensive brainstorming session results, this project leverages a **demand-driven profit discovery model** that analyzes top builds to identify high-value trading opportunities. Key insights from the brainstorming include:

**Multi-Tier User Strategy:** Serving both experienced profit-focused traders and aspiring economic players through educational progression
**Visual Innovation Opportunity:** Current tools are data-heavy; visual enhancements (deal highlighting, market timing) provide significant differentiation potential
**Community-First Monetization:** PoE ecosystem expects free tools with optional premium features, aligning with planned freemium model
**Technical Competitive Advantage:** Direct API integration and proprietary analysis create defensible moat against existing tools

### PM Handoff

This Project Brief provides the full context for the **Path of Exile 2 Trading Assistant App**. The core innovation is transforming reactive price checking into proactive profit opportunity discovery through build demand intelligence.

**Key Handoff Points:**

- **MVP Focus:** Build popularity analysis + opportunity detection + basic profit calculations
- **Technical Approach:** Direct PoE2 API integration with user-provided session authentication
- **User Experience Priority:** Clear profit signals with educational context for market learning
- **Development Strategy:** AI-assisted coding with 8-12 week MVP timeline targeting PoE2 early access window

**Critical Success Factors:**

1. **Prediction Accuracy:** 80%+ accuracy in profit opportunity identification for user trust
2. **Performance:** <200ms response times for competitive trading advantage
3. **User Onboarding:** Smooth POESESSID integration without overwhelming new users
4. **Community Adoption:** Early presence in PoE2 communities before competitor tools establish market share

Please start in 'PRD Generation Mode', review this brief thoroughly, and work with the user to create detailed Product Requirements Document section by section, asking for clarification or suggesting improvements based on this comprehensive foundation.

---

_Generated with [Claude Code](https://claude.ai/code)_

_Co-Authored-By: Claude <noreply@anthropic.com>_
