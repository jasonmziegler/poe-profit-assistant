# Coding Standards

## Critical Fullstack Rules

- **Type Safety:** All functions must have explicit TypeScript types - no `any` types allowed
- **Error Handling:** All API routes must use try-catch and return proper error responses
- **Data Validation:** Use Zod schemas for all external data (API responses, user input)
- **State Management:** Only use Zustand store for client state, never global variables
- **Database Access:** All queries through the queries.ts file, never inline SQL
- **Logging:** Use Winston logger, never console.log in production code
- **Session Security:** POESESSID must be encrypted before storage, never in plain text

## Naming Conventions

| Element         | Frontend             | Backend     | Example                 |
| --------------- | -------------------- | ----------- | ----------------------- |
| Components      | PascalCase           | -           | `OpportunityCard.tsx`   |
| Hooks           | camelCase with 'use' | -           | `useTrading.ts`         |
| API Routes      | -                    | kebab-case  | `/api/characters/fetch` |
| Database Tables | -                    | snake_case  | `trade_listings`        |
| Functions       | camelCase            | camelCase   | `calculateProfit()`     |
| Constants       | UPPER_SNAKE          | UPPER_SNAKE | `MAX_RETRIES`           |
