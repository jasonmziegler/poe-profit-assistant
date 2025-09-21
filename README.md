# POE Profit Assistant

A Path of Exile trading profit analysis tool built with Next.js and TypeScript.

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

- **Node.js** (version 18.0 or higher)
- **npm** (comes with Node.js)
- **Git** (for version control)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd poe-profit-assistant
```

### 2. Environment Setup

Copy the example environment file and configure your local environment:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your specific configuration:

```env
# Application Configuration
NEXT_PUBLIC_APP_NAME="POE Profit Assistant"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Security Configuration
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Logging Configuration
LOG_LEVEL=debug

# Database Configuration
DATABASE_PATH=./data/database.sqlite

# POE API Configuration (Optional)
POE_SESSION_ID=your_poe_session_id_here
```

**Important**: The `ENCRYPTION_KEY` must be exactly 32 characters long for security purposes.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Development Commands

### Core Development

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run type-check` - Run TypeScript type checking

### Code Quality

- `npm run lint` - Run ESLint and automatically fix issues
- `npm run lint:check` - Run ESLint without fixing (for CI/CD)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without fixing

### Setup and Deployment

- `npm run setup` - Install dependencies and build the project
- `npm run export` - Build and export static files
- `npm run pre-commit` - Run pre-commit hooks manually

## Project Structure

```
poe-profit-assistant/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (serverless functions)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page component
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components
├── lib/                  # Core application logic
│   ├── api/              # API utilities and clients
│   ├── analysis/         # Profit analysis logic
│   ├── db/               # Database utilities
│   ├── cache/            # Caching utilities
│   ├── stores/           # State management (Zustand)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # General utilities
├── data/                 # Local data storage
├── tests/                # Test files
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── docs/                 # Project documentation
└── .bmad-core/          # BMAD framework files
```

## Technology Stack

- **Frontend**: Next.js 14+ with TypeScript 5.3+
- **UI**: TailwindCSS 3.4+ for styling
- **State Management**: Zustand
- **Database**: SQLite (file-based)
- **Testing**: Vitest
- **Code Quality**: ESLint, Prettier, Husky, lint-staged

## Code Quality Standards

This project enforces strict code quality standards:

- **Type Safety**: All functions must have explicit TypeScript types
- **No `any` types**: Use proper TypeScript types
- **ESLint**: Enforces code quality and consistency
- **Prettier**: Automatic code formatting
- **Pre-commit hooks**: Automatic linting and formatting on commit

## Environment Variables

### Required Variables

- `NEXT_PUBLIC_APP_NAME`: Application name displayed in the UI
- `NEXT_PUBLIC_API_URL`: API base URL for frontend calls
- `ENCRYPTION_KEY`: 32-character encryption key for session security

### Optional Variables

- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `DATABASE_PATH`: Path to SQLite database file
- `POE_SESSION_ID`: Path of Exile session ID for API access

## Deployment

### Vercel (Recommended)

This project is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

The `vercel.json` configuration handles all deployment settings automatically.

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_API_URL` (set to your production domain)
- `ENCRYPTION_KEY`
- `LOG_LEVEL=info`

## Contributing

1. Follow the established code quality standards
2. Run `npm run type-check` and `npm run lint` before committing
3. Use conventional commit messages
4. All code must pass TypeScript compilation and linting

## Support

For issues and questions, please refer to the project documentation in the `docs/` directory or create an issue in the repository.
