# Brainstorming Session Results

**Session Date:** 2025-09-18
**Facilitator:** Business Analyst Mary
**Participant:** Jason

## Executive Summary

**Topic:** Path of Exile 2 Trading Assistant App

**Session Goals:** Comprehensive exploration of core functionality, user experience, additional features, and business model for a PoE2 trading assistant web app

**Techniques Used:** Role Playing, First Principles Thinking, SCAMPER (Substitute), What If Scenarios

**Total Ideas Generated:** 20+ distinct features and concepts

### Key Themes Identified:

- Multi-tier user experience (casual → trader → theory crafter)
- Visual innovation beyond standard trade site listings
- Community-driven features and content
- Analytics and intelligence layers
- Security and trust considerations

## Technique Sessions

### Role Playing - 45 minutes

**Description:** Explored user needs from different Path of Exile player perspectives

#### Ideas Generated:

**From Casual Weekend Player:**

1. Basic price checker - paste item text, show similar items
2. Good deal indicator - app recognizes valuable mods and alerts on deals
3. Build-specific recommendations - tell it your build, get optimized item suggestions
4. Value-ranked search results - rank similar items by best value proposition
5. Crafting potential analysis - show how additional mods/sockets would affect price

**From Experienced Trader/Flipper:** 6. Deal detection system - automatically identify underpriced items with high resale value 7. Mod value breakdown - show monetary value of each individual modifier 8. Hot market analytics - display which item bases/types are trading most actively 9. Price range analysis - crawl across different value tiers to show market depth 10. Market velocity indicators - identify fast-moving vs slow-moving items

**From Build Creator/Theory Crafter:** 11. Underused item discovery - identify least-traded items for potential theory crafting opportunities 12. Popular build integration - connect with poe.ninja or PoE ladder APIs for build popularity data 13. Character statistics analysis - tap into player data to understand gear usage patterns 14. Unique item specialized search - different search/comparison logic for unique items vs rare/magic items 15. Build trend analytics - track which builds are rising/falling in popularity

#### Insights Discovered:

- Each user type has distinctly different needs and workflows
- Casual users need education and guidance, traders need efficiency and opportunity detection
- Theory crafters need analytical depth and market intelligence
- The app could serve as a bridge between these user types

### First Principles Thinking - 15 minutes

**Description:** Breaking down the absolute core requirements for MVP

#### Ideas Generated:

16. **MVP Core Function**: Text input → Parse item → Query trade API → Return listings + average value
17. **Essential Data Extraction**: Class, Rarity, Name, Base Type, Quality, Requirements, Sockets, Item Level, Runes, Implicits, Explicits
18. **Two-API Integration**: POST search criteria → GET batch item details using listing IDs

#### Insights Discovered:

- The core functionality is technically achievable with PoE's existing API
- Item text parsing is complex but well-structured
- MVP can be built in a weekend with proper scope

### SCAMPER Method (Substitute) - 15 minutes

**Description:** Exploring alternative ways to present and organize trade data

#### Ideas Generated:

19. **Time-based visual aging** - fresh listings vibrant, stale ones faded
20. **Deal highlighting** - glow/shimmer effects for undervalued items
21. **Market velocity charts** - visual sales speed data for item types
22. **Currency normalization** - convert all prices to unified currency display

#### Insights Discovered:

- Visual presentation can add significant value beyond raw data
- Time-based information is crucial for trading decisions
- Currency complexity is a major UX challenge in PoE trading

### What If Scenarios - 15 minutes

**Description:** Exploring business model and scaling considerations

#### Ideas Generated:

23. **Community-driven freeware model** - donation-based like other PoE tools
24. **Content monetization** - YouTube/Twitch channels about the app + Patreon
25. **Community features** - shared trade searches and crafting recipe repositories
26. **User-generated profit guides** - how to buy, craft, and resell items
27. **Security architecture** - protecting PoE session IDs at scale

#### Insights Discovered:

- PoE community expects free tools with optional donations
- Community content and education could be revenue streams
- User-generated content could create network effects
- Security is a critical trust factor for adoption

## Idea Categorization

### Immediate Opportunities

_Ideas ready to implement now_

1. **Basic Price Checker**
   - Description: MVP core - paste item text, get similar listings and average price
   - Why immediate: Uses existing PoE API, clear user need, technically straightforward
   - Resources needed: Svelte frontend, item text parser, API integration

2. **Visual Deal Highlighting**
   - Description: Color-code or highlight items that appear undervalued
   - Why immediate: Simple visual enhancement with high user impact
   - Resources needed: Basic price comparison logic, CSS styling

3. **Currency Normalization**
   - Description: Convert all prices to user's preferred currency
   - Why immediate: Addresses major UX pain point, straightforward conversion logic
   - Resources needed: PoE currency exchange rates, conversion functions

### Future Innovations

_Ideas requiring development/research_

1. **Market Analytics Dashboard**
   - Description: Charts showing price trends, velocity, and market depth analysis
   - Development needed: Historical data collection, charting library integration, statistical analysis
   - Timeline estimate: 4-6 weeks

2. **Build Integration System**
   - Description: Connect with poe.ninja and ladder APIs for build-specific recommendations
   - Development needed: API integrations, build parsing logic, recommendation algorithms
   - Timeline estimate: 6-8 weeks

3. **Community Recipe Repository**
   - Description: User-generated crafting guides and profit strategies
   - Development needed: User accounts, content management system, moderation tools
   - Timeline estimate: 8-12 weeks

### Moonshots

_Ambitious, transformative concepts_

1. **AI-Powered Market Prediction**
   - Description: Machine learning to predict price movements and identify emerging trends
   - Transformative potential: Could revolutionize PoE trading strategy
   - Challenges to overcome: Massive data requirements, ML expertise, computational costs

2. **Integrated Trading Platform**
   - Description: Not just search, but actual in-app trading with automated negotiations
   - Transformative potential: Could become the primary PoE trading interface
   - Challenges to overcome: GGG partnership requirements, security infrastructure, user trust

### Insights & Learnings

- **Multi-tiered user needs**: The same core functionality serves completely different use cases
- **Community-first approach**: PoE players expect free tools and community-driven development
- **Visual innovation opportunity**: Current trade tools are very data-heavy, visual enhancements could differentiate
- **Security as competitive advantage**: Proper handling of session IDs could build significant user trust
- **Network effects potential**: Community features could create viral growth once critical mass is reached

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: Basic Price Checker (MVP)

- **Rationale**: Core functionality that serves all user types, technically achievable, clear market need
- **Next steps**: Build item text parser, integrate PoE trade API, create simple Svelte interface
- **Resources needed**: ~20 hours development time, PoE API documentation
- **Timeline**: 1-2 weeks

#### #2 Priority: Visual Deal Highlighting

- **Rationale**: High impact UX improvement that differentiates from existing tools
- **Next steps**: Define "good deal" criteria, implement price comparison logic, add visual indicators
- **Resources needed**: ~10 hours development time, market research on pricing patterns
- **Timeline**: 1 week after MVP

#### #3 Priority: Currency Normalization

- **Rationale**: Addresses major pain point in PoE trading, relatively simple to implement
- **Next steps**: Research PoE currency exchange mechanics, build conversion system, add user preferences
- **Resources needed**: ~15 hours development time, currency rate data source
- **Timeline**: 2-3 weeks after MVP

## Reflection & Follow-up

### What Worked Well

- Role playing revealed distinctly different user needs effectively
- First principles thinking provided clear technical foundation
- Visual substitution ideas sparked creative differentiation opportunities
- Business model discussion grounded expectations realistically

### Areas for Further Exploration

- **Technical architecture**: How to handle API rate limits and caching strategies
- **User onboarding**: How to introduce complex features to different user types
- **Community building**: Strategies for growing from solo project to community-driven tool
- **Monetization ethics**: Balancing sustainability with community expectations

### Recommended Follow-up Techniques

- **Assumption Reversal**: Challenge assumptions about what PoE traders actually want
- **Forced Relationships**: Connect PoE trading with unrelated domains for innovation
- **Time Shifting**: How would this app work in 2030 with different PoE ecosystem?

### Questions That Emerged

- How can we validate user demand before building advanced features?
- What would convince experienced traders to switch from existing tools?
- How do we balance feature complexity with the "weekend project" constraint?
- What partnerships could accelerate development or adoption?

### Next Session Planning

- **Suggested topics:** Technical architecture deep-dive, user research strategy, competitive analysis
- **Recommended timeframe:** 2-3 weeks after MVP development begins
- **Preparation needed:** Research existing PoE tools, prototype basic functionality, gather user feedback

---

_Session facilitated using the BMAD-METHOD™ brainstorming framework_
