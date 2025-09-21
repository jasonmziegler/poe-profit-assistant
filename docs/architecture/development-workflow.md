# Development Workflow

## Local Development Setup

### Prerequisites

```bash
# Required software
node --version  # v18+ required
npm --version   # v9+ required
git --version   # Any recent version

# Clone repository
git clone <your-repo-url>
cd poe-profit-assistant
```

### Initial Setup

```bash
# Install dependencies
npm install

# Create local database
npm run setup

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

### Development Commands

```bash
# Start all services
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build

# Export static build
npm run export
```

## Environment Configuration

### Required Environment Variables

```bash
# .env.local

# Application settings
NEXT_PUBLIC_APP_NAME="POE Profit Assistant"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Security
ENCRYPTION_KEY="generate-random-32-char-string"

# Development
LOG_LEVEL="debug"
```
