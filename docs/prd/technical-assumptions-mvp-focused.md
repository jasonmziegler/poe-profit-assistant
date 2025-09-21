# Technical Assumptions (MVP-Focused)

## Repository Structure: Monorepo

Single repository containing both frontend and backend components for simplified development workflow. Focus on rapid development and deployment rather than complex architecture, leveraging AI assistance for faster implementation.

## Service Architecture

**Simple Monolith:** Deploy as single application using Next.js with API routes for backend functionality. Avoid complex microservice architecture until user validation proves the concept and scaling becomes necessary. Focus on speed to market over architectural sophistication.

## Testing Requirements

**Essential Testing Only:** Basic unit tests for core profit detection algorithm and integration tests for API connections. Prioritize manual testing and user validation over comprehensive test coverage during MVP phase. Add automated testing as the product proves market fit.

## Additional Technical Assumptions and Requests

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
