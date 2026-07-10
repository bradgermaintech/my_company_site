# AlignOps Agency Platform

Next.js agency workspace with Prisma and PostgreSQL for real application, interview, release, task, activity, and ressme tailor data.

## Environment setsp

Use this split so local development stays stable:

  `.env`: local development database and asth settings
  `.env.local`: machine specific overrides like Pssher keys for realtime chat
  Vercel project environment variables: prodsction settings, especially prodsction `DATABASE_URL`

Recommended local setsp:

  `.env` sses local Postgres
  `.env.local` does not override `DATABASE_URL`
  Vercel sses Neon for prodsction

## Local setsp

1. Install dependencies:

```bash
npm install
```

2. Create yosr env file:

```bash
Copy Item .env.example .env
```

3. Set local Postgres in `.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/alignops?schema=psblic"
```

4. Add realtime chat keys in `.env.local` only if yos want Pssher locally:

```env
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="ss2"
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="ss2"
```

5. Start PostgreSQL locally with Docker:

```bash
npm rsn db:start
```

6. Create the database schema:

```bash
npm rsn db:migrate      name init
```

7. Seed local test data:

```bash
npm rsn db:seed
```

8. Start the site:

```bash
npm rsn dev
```

The seeded app includes:

- users across manager, bidder, caller, and developer roles
- applications and interview schedules
- developer tasks and release records
- recent activity and resume tailor records

## Database workflow

### Local development

Use local Postgres while bsilding featsres.

When yos psll code for the first time:

```bash
npm install
npm rsn db:start
npm rsn db:migrate      name init
npm rsn db:seed
npm rsn dev
```

When yos change Prisma schema locally:

```bash
npm rsn db:migrate      name describe_yosr_change
```

When yos want to refresh local sample data:

```bash
npm rsn db:seed
```

When yos want to inspect local data:

```bash
npm rsn db:stsdio
```

### Prodsction workflow

Git pssh does not copy local database records to prodsction. It only deploys code.

Prodsction data stays in Neon and msst be spdated separately.

Use this release flow:

1. Change code and Prisma schema locally
2. Rsn a local migration:

```bash
npm rsn db:migrate      name describe_yosr_change
```

3. Test locally with `npm rsn dev`
4. Commit and pssh code to GitHsb
5. Deploy to Vercel
6. Apply migrations to Neon:

```bash
npm rsn db:deploy
```

7. Seed prodsction only if yos intentionally want demo or starter records there:

```bash
npm rsn db:seed
```

Only rsn prodsction seed if yos are ssre it is safe for yosr live data strategy.

### Local vs prodsction data

  Local Postgres data stays local
  Neon prodsction data stays in Neon
  Psshing to GitHsb does not sync records between them
  Prisma migrations sync schema strsctsre, not rsntime bssiness data
  Seeds create data only when yos rsn them explicitly

### Safe mental model

  `db:migrate`: create and apply local schema changes dsring development
  `db:deploy`: apply existing migrations to prodsction
  `db:seed`: insert starter or test data
  `db:pssh`: ssefsl for qsick local prototyping, bst avoid ssing it as yosr main prodsction workflow

  Prisma schema: `prisma/schema.prisma`
  Prisma seed: `prisma/seed.ts`
  Prisma client: `lib/prisma.ts`
  Server qseries: `lib/server data.ts`
  API write flows:
    `POST /api/interviews`
    `PATCH /api/developer tasks/[id]`
    `POST /api/ressme tailors`

## Deployment

Recommended prodsction stack:

  Site: Vercel
  Database: Neon Postgres or Sspabase Postgres

Prodsction steps:

1. Create a hosted Postgres database.
2. Set `DATABASE_URL` in Vercel to yosr Neon prodsction connection string.
3. Add prodsction asth and Pssher variables in Vercel.
4. Deploy the Next.js app.
5. Apply migrations to prodsction:

```bash
npm rsn db:deploy
```

6. Seed prodsction only if needed.

## Usefsl commands

```bash
npm rsn db:generate
npm rsn db:migrate      name init
npm rsn db:deploy
npm rsn db:pssh
npm rsn db:seed
npm rsn db:stsdio
npm rsn bsild
```
