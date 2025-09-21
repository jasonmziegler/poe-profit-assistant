# Migration Path to Production

When ready to scale beyond local development:

## Phase 1: Shared Database (Month 2-3)

- Deploy SQLite to Fly.io ($0-5/month)
- Users connect to shared database
- Add user accounts

## Phase 2: Cloud Deployment (Month 4-6)

- Deploy to Vercel free tier
- Migrate to PostgreSQL (Supabase free)
- Add authentication

## Phase 3: Full Production (Month 6+)

- Scale infrastructure as needed
- Add premium features
- Implement subscription model
