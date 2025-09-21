# Story 1.1: Minimal Project Setup

## Status

Approved

## Story

**As a** developer,
**I want** a simple, working development environment with essential tools only,
**so that** I can focus on building and validating the core profit detection algorithm.

## Acceptance Criteria

1. Basic Next.js project initialized with TypeScript for rapid development and strong AI assistance
2. Single deployment target (Vercel) configured for both frontend and serverless backend
3. Environment variable management for API credentials and basic configuration
4. Essential code quality tools (Prettier, ESLint) configured with minimal setup
5. Simple package.json scripts for development and deployment workflows
6. Basic README with setup instructions and development commands
7. Git repository initialized with .gitignore and basic project structure

## Tasks / Subtasks

- [ ] Initialize Next.js project with TypeScript (AC: 1)
  - [ ] Run `npx create-next-app@latest poe-profit-assistant --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
  - [ ] Configure next.config.js with basic settings
  - [ ] Set up TypeScript configuration with strict mode
- [ ] Configure Vercel deployment (AC: 2)
  - [ ] Create vercel.json configuration file
  - [ ] Set up deployment settings for both frontend and API routes
- [ ] Set up environment management (AC: 3)
  - [ ] Create .env.example template file
  - [ ] Configure Next.js environment variable loading
  - [ ] Add encryption key generation for security
- [ ] Configure code quality tools (AC: 4)
  - [ ] Set up Prettier configuration
  - [ ] Configure ESLint rules with TypeScript support
  - [ ] Add lint-staged for pre-commit hooks
- [ ] Create package.json scripts (AC: 5)
  - [ ] Add development, build, test, and lint scripts
  - [ ] Include type-checking script
  - [ ] Set up export script for static builds
- [ ] Create project documentation (AC: 6)
  - [ ] Write README with setup instructions
  - [ ] Document development commands
  - [ ] Include environment setup guide
- [ ] Initialize git repository with proper structure (AC: 7)
  - [ ] Create comprehensive .gitignore file
  - [ ] Set up initial project directory structure
  - [ ] Make initial commit with basic setup

## Dev Notes

The following technical information was extracted from architecture documents to guide implementation:

### Previous Story Insights

No previous stories exist - this is the foundation story.

### Tech Stack Requirements [Source: architecture/tech-stack.md]

- **Frontend Framework**: Next.js 14+ with TypeScript 5.3+
- **UI Components**: Radix UI for headless components
- **State Management**: Zustand 4.4+ for client state
- **CSS Framework**: TailwindCSS 3.4+ for utility-first styling
- **Database**: SQLite 3.x for local data storage
- **Testing**: Vitest 1.0+ for both unit and API route testing
- **E2E Testing**: Playwright 1.40+ for end-to-end testing
- **Logging**: Winston 3.11+ for structured logging
- **Build Tool**: Vite via Next.js built-in tooling

### Project Structure [Source: architecture/unified-project-structure.md]

Required directory structure:

```
poe-profit-assistant/
├── app/                     # Next.js app directory
├── components/              # React components
├── lib/                     # Core logic
├── data/                    # Local data storage
├── public/                  # Static assets
├── scripts/                 # Utility scripts
├── tests/                   # Test files
├── .env.example             # Environment template
├── next.config.js           # Next.js configuration
├── package.json
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # Setup instructions
```

### Coding Standards [Source: architecture/coding-standards.md]

- **Type Safety**: All functions must have explicit TypeScript types - no `any` types allowed
- **Error Handling**: All API routes must use try-catch and return proper error responses
- **Data Validation**: Use Zod schemas for all external data
- **Session Security**: POESESSID must be encrypted before storage
- **Naming Conventions**: Components use PascalCase, API routes use kebab-case, functions use camelCase

### Development Workflow Requirements [Source: architecture/development-workflow.md]

Required package.json scripts:

- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run type-check` - Type checking
- `npm run lint` - Lint code
- `npm run build` - Build for production
- `npm run export` - Export static build

Required environment variables:

```bash
NEXT_PUBLIC_APP_NAME="POE Profit Assistant"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
ENCRYPTION_KEY="generate-random-32-char-string"
LOG_LEVEL="debug"
```

### File Locations

All new files should follow the unified project structure defined in architecture documentation. Key initial files to create:

- `/next.config.js` - Next.js configuration
- `/tailwind.config.js` - Tailwind CSS configuration
- `/tsconfig.json` - TypeScript configuration
- `/.env.example` - Environment template
- `/README.md` - Setup instructions
- `/.gitignore` - Git ignore rules

### Testing Requirements [Source: architecture/testing-strategy.md]

- **Framework**: Use Vitest for all testing (unit and integration)
- **Test Organization**: Follow the defined test structure with unit/, integration/, and e2e/ folders
- **Test Examples**: Reference provided test patterns for profit calculation and API route testing

### Technical Constraints

- **Zero-cost local development**: Must work entirely locally without external services
- **Professional quality**: All tooling must support production deployment
- **Type safety**: Strict TypeScript configuration required for AI assistance
- **Security**: Environment variables must be properly managed and encrypted where needed

## Testing

Test files should be organized according to the testing strategy:

- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`
- E2E tests in `tests/e2e/`
- Use Vitest framework for unit and integration tests
- Use Playwright for end-to-end tests

## Change Log

| Date       | Version | Description            | Author       |
| ---------- | ------- | ---------------------- | ------------ |
| 2025-09-20 | 1.0     | Initial story creation | Scrum Master |

## Dev Agent Record

_This section will be populated by the development agent during implementation._

### Agent Model Used

Claude Sonnet 4 (claude-sonnet-4-20250514)

### Debug Log References

### Completion Notes List

### File List

## QA Results

_This section will be populated by the QA Agent after story completion._
