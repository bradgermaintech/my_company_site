# PipelineOS Agency Platform

Next.js agency workspace with Prisma and PostgreSQL for real application, interview, release, task, activity, and resume-tailor data.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

```bash
Copy-Item .env.example .env
```

3. Start PostgreSQL locally with Docker:

```bash
npm run db:start
```

4. Create the database schema:

```bash
npm run db:migrate -- --name init
```

5. Seed local test data:

```bash
npm run db:seed
```

6. Start the site:

```bash
npm run dev
```

The seeded app includes:

- users across admin, bidder, caller, and developer roles
- applications and interview schedules
- developer tasks and release records
- recent activity and resume tailor records

## Database workflow

- Prisma schema: `prisma/schema.prisma`
- Prisma seed: `prisma/seed.ts`
- Prisma client: `lib/prisma.ts`
- Server queries: `lib/server-data.ts`
- API write flows:
  - `POST /api/interviews`
  - `PATCH /api/developer-tasks/[id]`
  - `POST /api/resume-tailors`

## Deployment

Recommended production stack:

- Site: Vercel
- Database: Neon Postgres or Supabase Postgres

Production steps:

1. Create a hosted Postgres database.
2. Set `DATABASE_URL` in the hosting provider.
3. Run migrations in CI or once from your machine:

```bash
npm run db:migrate -- --name production
```

4. Deploy the Next.js app.

## Useful commands

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:push
npm run db:seed
npm run db:studio
npm run build
```
