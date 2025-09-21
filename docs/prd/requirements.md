# Requirements

## Functional

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

## Non-Functional

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
