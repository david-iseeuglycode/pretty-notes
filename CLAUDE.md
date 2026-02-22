<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General guidelines

- Help the user understand how the flows between different components work.
- Point out integral connection points between code files.
- Guide the user to perform coding tasks by showing abstract examples, rather than providing the actual code needed, unless the user asks for it by saying the magic word "plz".

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, when asked for help with such tasks, use them to help the user, but prefer instructing the user on how do it themself.
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.

<!-- nx configuration end-->

# PrettyNotes

A note-taking application built as an Nx monorepo with Angular frontend, NestJS backend, and Prisma ORM connected to SQL Server.

## Architecture

```
pretty-notes/                    (Nx workspace root)
  apps/
    api/                         (NestJS backend — port 3000, prefix /api)
    web/                         (Angular frontend — port 4200, SCSS + Tailwind)
  libs/
    prisma/                      (Prisma schema, generated client, NestJS module)
    shared/                      (Shared DTOs and interfaces)
```

## Key Commands

```bash
# Dev (both apps in parallel with watch)
npm start

# Serve individually
npx nx serve api                 # NestJS backend on http://localhost:3000/api
npx nx serve web                 # Angular frontend on http://localhost:4200 (proxies /api to :3000)

# Clean
npx nx reset

# Build (production — generates Prisma client first, then builds both apps)
npm run build

# Prisma
npm run generate                 # Generate Prisma client
npm run migrate:dev              # Run dev migrations (uses shadow DB)
npm run migrate:prod             # Run production migrations (migrate deploy)
npx nx run prisma:prisma-studio  # Open Prisma Studio

# Lint & Test
npx nx lint web
npx nx test web

# Production (PM2)
npm run deploy                   # Start/restart via PM2 (ecosystem.config.cjs)
```

## Environment

- `.env` at workspace root (gitignored) — contains `DATABASE_URL` and `SHADOW_DATABASE_URL` for SQL Server
- `.env.example` — committed template with placeholder values
- Angular app uses `NX_IGNORE_UNSUPPORTED_TS_SETUP=true` due to Nx TS project references incompatibility

## Prisma 7 Setup

- **Generator**: `prisma-client` (not `prisma-client-js`)
- **Config**: `libs/prisma/prisma.config.ts` — used by the CLI for migrations/studio, loads `dotenv`
- **Runtime**: `PrismaService` uses `@prisma/adapter-mssql` driver adapter, parses `DATABASE_URL` into mssql config
- **Schema**: `libs/prisma/prisma/schema.prisma` — datasource block has no `url` (Prisma 7 requirement)
- **Generated client**: `libs/prisma/src/generated/prisma/client` (gitignored, run `npm run generate` after clone)

## Library Imports

```typescript
// Prisma (NestJS)
import { PrismaModule, PrismaService } from '@pretty-notes/prisma';

// Generated Prisma types
import { User, Note, Folder, UserNoteConfiguration } from '@pretty-notes/prisma';

// Shared DTOs (Angular & NestJS)
import { NoteDto, CreateNoteDto, UpdateNoteDto, ApiResponse } from '@pretty-notes/shared';
```

## Deployment

- **VPS post-receive hook** runs: `npm install` → `npm run migrate:prod` → `npm run build` → `npm run deploy`
- **PM2** manages the production process via `ecosystem.config.cjs` (autorestart, memory limit 1G, logs in `./logs/`)
- IIS forwards requests to the NestJS backend on port 3000

## Tech Stack

- **Nx** 22.5 (monorepo tooling)
- **Angular** (frontend, SCSS + Tailwind CSS, prefix: `pn`)
- **NestJS** (backend API)
- **Prisma** 7.x (ORM, `@prisma/adapter-mssql` driver adapter)
- **PM2** (production process manager)
- **SQL Server** (database: `pretty-notes`, shadow DB: `PrettyNotes_Shadow`)
