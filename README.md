# AlignOps Agency Platform

Next.js agency workspace with Prisma and PostgreSQL for real application, interview, release, task, activity, and resume-tailor data.

## Environment setup

Use this split so local development stays stable:

- `.env`: local development database and auth settings
- `.env.local`: machine-specific overrides like Pusher keys for realtime chat
- Vercel project environment variables: production settings, especially production `DATABASE_URL`

Recommended local setup:

- `.env` uses local Postgres
- `.env.local` does not override `DATABASE_URL`
- Vercel uses Neon for production

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

```bash
Copy-Item .env.example .env
```

3. Set local Postgres in `.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/alignops?schema=public"
```

4. Add realtime chat keys in `.env.local` only if you want Pusher locally:

```env
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="us2"
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="us2"
```

5. Start PostgreSQL locally with Docker:

```bash
npm run db:start
```

6. Create the database schema:

```bash
npm run db:migrate -- --name init
```

7. Seed local test data:

```bash
npm run db:seed
```

8. Start the site:

```bash
npm run dev
```

The seeded app includes:

- users across admin, bidder, caller, and developer roles
- applications and interview schedules
- developer tasks and release records
- recent activity and resume tailor records

## Database workflow

### Local development

Use local Postgres while building features.

When you pull code for the first time:

```bash
npm install
npm run db:start
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

When you change Prisma schema locally:

```bash
npm run db:migrate -- --name describe_your_change
```

When you want to refresh local sample data:

```bash
npm run db:seed
```

When you want to inspect local data:

```bash
npm run db:studio
```

### Production workflow

Git push does not copy local database records to production. It only deploys code.

Production data stays in Neon and must be updated separately.

Use this release flow:

1. Change code and Prisma schema locally
2. Run a local migration:

```bash
npm run db:migrate -- --name describe_your_change
```

3. Test locally with `npm run dev`
4. Commit and push code to GitHub
5. Deploy to Vercel
6. Apply migrations to Neon:

```bash
npm run db:deploy
```

7. Seed production only if you intentionally want demo or starter records there:

```bash
npm run db:seed
```

Only run production seed if you are sure it is safe for your live data strategy.

### Local vs production data

- Local Postgres data stays local
- Neon production data stays in Neon
- Pushing to GitHub does not sync records between them
- Prisma migrations sync schema structure, not runtime business data
- Seeds create data only when you run them explicitly

### Safe mental model

- `db:migrate`: create and apply local schema changes during development
- `db:deploy`: apply existing migrations to production
- `db:seed`: insert starter or test data
- `db:push`: useful for quick local prototyping, but avoid using it as your main production workflow

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
2. Set `DATABASE_URL` in Vercel to your Neon production connection string.
3. Add production auth and Pusher variables in Vercel.
4. Deploy the Next.js app.
5. Apply migrations to production:

```bash
npm run db:deploy
```

6. Seed production only if needed.

## Useful commands

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:deploy
npm run db:push
npm run db:seed
npm run db:studio
npm run build
```
