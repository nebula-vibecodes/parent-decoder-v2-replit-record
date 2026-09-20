# Parent Decoder

Parent Decoder is a privacy-first local reference tool that helps adults understand modern online language before reacting.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/parent-decoder/src/data.ts` — local dictionary content and decoder matching data
- `artifacts/parent-decoder/src/App.tsx` — route map and shared app entry point
- `artifacts/parent-decoder/src/components/app-shell.tsx` — responsive navigation and footer shell
- `artifacts/parent-decoder/src/pages/` — home, dictionary, term detail, decoder, privacy, and not-found screens
- `artifacts/parent-decoder/src/index.css` — product theme, typography, responsive layout, and motion

## Architecture decisions

- The local decoder remains browser-only and the product has no accounts, analytics, or tracking. The optional AI assistant uses a stateless server request only when the user submits text and does not create saved conversation history.
- Dictionary and decoder content live behind typed local data structures so a verified remote source can replace the data layer later without changing the UI.
- Risk language is framed as context and conversation guidance rather than surveillance or alarm signals.
- Route-level pages share one responsive shell and use URL query state for dictionary search handoff.

## Product

- Home page with direct lookup, quick-start paths, popular terms, What’s New, and responsible-use guidance.
- Dictionary with search, category/context filters, local-data labels, and term cards.
- Term detail pages with meaning, examples, context notes, conversation opener, related terms, and copy action.
- Message Decoder with local phrase matching, simulated analysis state, uncertainty guidance, and no-storage messaging.
- Optional AI Assistant on the decoder for explaining submitted phrases or answering broader slang questions, with explicit no-history and context-not-conclusion language.
- Privacy and responsible-use page explaining what the tool does and does not do.

## User preferences

_No additional preferences recorded._

## Gotchas

- Keep the no-surveillance, no-persistence promise visible in product copy as the local MVP evolves.
- Keep the optional assistant stateless and clearly separate from the local dictionary. Do not add accounts, saved chat history, surveillance workflows, or hidden message collection.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
