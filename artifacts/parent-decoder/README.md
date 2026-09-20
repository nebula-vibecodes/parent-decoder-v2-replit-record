# Parent Decoder

Parent Decoder is a privacy-first, local reference tool for understanding
online language before responding to it. It is a Replit field-guide prototype,
not a monitoring tool, inbox integration, live trend tracker, or diagnostic
system.

## Current release-candidate scope

- **265 local records:** 262 term entries and 3 topic guides.
- **565 alternate spellings and aliases** across 19 categories.
- All 265 records are still **Editorial / Prototype / Moderate confidence**,
  need verification, have no independent source references, no reviewer, and
  no verification date.
- The verified public-launch gate is blocked until sensitive entries receive
  qualified subject-matter or lived-experience review with a named source and
  review date.
- The five context levels are guidance for reading a situation, not a risk
  score, diagnosis, or conclusion about a person.
- The candidate queue and editorial review page are review aids. They do not
  promote records, create sources, or send anything to an editorial queue.

No source, reviewer, verification date, popularity claim, or currentness claim
should be added without evidence. The current data deliberately says when
independent verification is absent.

## Architecture

- Vite + React + TypeScript, with Wouter for client-side routing.
- The published dictionary is assembled from focused local batches in
  `src/dictionary/batches/` and exposed through the compatibility surface in
  `src/data.ts`.
- `src/data.ts` contains the deterministic search, phrase matching, analysis,
  context aggregation, and suggestion logic.
- The UI uses the shared `AppShell`, local route metadata, browser focus
  handling, and the Replit field-guide visual language in `src/index.css`.
- Saved prompts are implemented in `src/saved-prompts.ts`. They are explicit
  browser-local saves, not a server-backed history.
- Report drafts are assembled by `src/report-email.ts` and handed to the
  visitor’s email application through a `mailto:` URL. The app has no report
  endpoint, queue, database, or delivery confirmation.
- There is no runtime API call, AI provider, external font request, inbox
  access, platform scrape, or live popularity source.

## Routes

Canonical routes:

| Route | Purpose |
| --- | --- |
| `/` | Home and dictionary handoff |
| `/dictionary` | Search and filter the full dictionary |
| `/decoder` | Match a short message against the local dictionary |
| `/term/:slug` | Term or guide detail |
| `/privacy` | Privacy and responsible-use boundaries |
| `/conversation-starters` | Context-sensitive conversation prompts |
| `/saved` | Explicitly saved browser-local prompts |
| `/editorial-review` | Prototype metadata and verification review |

Compatibility and shareable routes:

- `/discover` → home
- `/library` and `/library/:category` → dictionary views
- `/terms/:slug` → term detail
- `/approach` → privacy and responsible use

Unknown paths render the not-found page. Direct URLs, refreshes, and browser
Back/Forward are covered by the browser regression suite. Term detail pages
preserve a safe internal return route when one is available.

## Local matcher boundaries

The matcher is deterministic and local. It normalizes case, punctuation,
apostrophes, separators, aliases, and supported emoji tokens; prefers exact
terms and aliases; applies conservative typo matching; respects phrase
boundaries; and keeps the longest nested phrase when matches overlap. Dictionary
search can surface meaning, example, related-term, and close-spelling results.

It does not infer intent, read a private message history, use a language model,
query the web, rank live popularity, or force an unknown input into a term.
Unknown decoder input stays explicitly uncertain. A match is a starting point
for a conversation, not proof about the speaker or situation.

## Public reporting configuration

Reporting is enabled for the pilot. The public recipient is configured in:

```text
public/reporting-config.js
```

`reportingRecipient` is set to the owner’s dedicated public-facing feedback
inbox. This value is shipped to every visitor and is not a secret; do not use a
private personal address. The Gmail inbox has provider spam filtering enabled,
and routine feedback submissions are retained for up to 60 days before
deletion; spam is deleted promptly. Leaving it empty—or setting an invalid
address—shows a calm unavailable state and never creates a broken email link.

The form appears on term and guide detail pages. It requires an issue category
and an acknowledgment that private and identifying material was removed. The
optional explanation is limited to 500 characters. **Prepare email** asks the
visitor’s email application to open a draft. The visitor can inspect, edit,
cancel, or send it there.

If no email application opens, the page keeps a copyable plain-text report and
shows the configured public reporting address. The page says only that a draft
was prepared; it never claims delivery.

## Privacy behavior

- Decoder text is temporary in memory by default.
- A prompt is written to `localStorage` only after the user chooses **Save
  prompt**. Saved prompts can be reused, removed individually, or cleared.
- Saved prompts remain in the current browser and are not synced, uploaded,
  shared, or visible to another browser.
- Route-quality metadata uses browser session storage only to support focus and
  internal navigation context.
- Parent Decoder does not transmit, store, queue, or log reports. A prepared
  email contains only the issue category, query-free public page URL, term or
  guide identity, optional visitor-written explanation, and a privacy reminder.
- Decoder input, saved prompts, browsing history, local storage contents,
  device details, account information, timestamps, and hidden metadata are not
  added to the report.
- The configured recipient receives only what the visitor chooses to send
  through the visitor’s own email provider. Email delivery, retention, and
  provider behavior occur outside Parent Decoder.
- The app has no account, inbox, child profile, contact list, location,
  credential, or monitoring workflow.

## Editorial workflow

Dictionary changes are intentionally small and checked in:

1. Add an anonymous, non-sensitive candidate summary.
2. Triage it as `promote`, `hold`, or `reject` with a reason.
3. For a promotion, add a complete prototype card to one focused batch and
   preserve ambiguity, harmless/concerning context, conversation starters, and
   “do not assume” guidance.
4. Validate the candidate queue and published dictionary.
5. Review search, decoder matching, term detail, Editorial review, and one
   desktop/mobile view before merging.

Focused publication batches are 3–8 entries. The `foundation` and `expansion`
modules are documented historical exceptions. See
`EDITORIAL_WORKFLOW.md` for the complete checklist and privacy restrictions.

## Development and verification

From the workspace root:

```sh
pnpm install
pnpm --filter @workspace/parent-decoder run dev
```

The Replit artifact workflow supplies `PORT` and `BASE_PATH`. For a standalone
local process, provide them explicitly:

```sh
PORT=19363 BASE_PATH=/ pnpm --filter @workspace/parent-decoder run dev
```

Run the release-candidate checks:

```sh
pnpm --filter @workspace/parent-decoder run validate
pnpm --filter @workspace/parent-decoder run test
pnpm --filter @workspace/parent-decoder run test:browser
pnpm --filter @workspace/parent-decoder run typecheck
pnpm --filter @workspace/parent-decoder run build
```

`test:browser` starts its own Vite server on port 4174 and runs Chromium at
desktop and mobile-sized viewports. It checks all canonical and compatibility
routes, headings and landmarks, direct navigation, history, overflow, console
and application-request failures, representative axe scans, decoder fixtures,
dictionary filters, saved-prompt persistence, focus, reduced motion, Escape,
mobile navigation, touch-target sizes, unavailable and configured reporting
states, validation, keyboard use, copy fallback, mail draft contents, excluded
private data, and the no-delivery-claim boundary.

The managed Replit workflow `artifacts/parent-decoder: web` is the only
long-running preview process for this app. Do not start a second Vite process
on the managed preview port. Browser checks use their controlled temporary
server on port 4174 and shut it down when Playwright exits; they do not reuse
or replace the managed workflow. If the managed workflow reports that its port
is already in use, stop the stale Parent Decoder process that owns that port,
confirm the port is free, and restart `artifacts/parent-decoder: web`. Do not
kill unrelated workspace services or create a replacement workflow.

After a build, serve the generated static output with:

```sh
PORT=4174 BASE_PATH=/ pnpm --filter @workspace/parent-decoder run serve
```

## Static hosting and release behavior

The production artifact is a static Vite build in `dist/public`. A static host
must rewrite every application path to `/index.html` so client-side routes such
as `/decoder`, `/term/rizz`, and `/library/everyday-slang` load on direct
navigation and refresh. The registered Replit artifact includes this
`/*` → `/index.html` rewrite.

This release-candidate slice does not publish or deploy. The Replit development
preview is the intended verification surface.

## Known limitations and remaining work

- All records remain prototypes and require real editorial verification before
  any record can be promoted beyond prototype status.
- Sensitive entries require a qualified reviewer, reviewer scope, independent
  source, and review date before they can be marked as reviewed.
- The current edition has no named source references, reviewers, or independent
  verification dates.
- Meanings vary by age, community, platform, region, relationship, and tone;
  the local dictionary cannot establish intent or safety.
- The app is English-language and intentionally does not provide live trend
  intelligence or external source retrieval.
- Saved prompts are browser-specific and have no sync, export, or recovery
  service.
- Reporting depends on the visitor having an email application or manually
  copying the prepared report. Parent Decoder cannot detect or confirm email
  delivery and does not control the visitor’s or recipient’s email provider.
- The public reporting recipient is visible in the built site and must be a
  dedicated public-facing inbox with its own spam and retention practices.
- Validation reports three intentional boundary-overlap warnings (`ratio` /
  `thinspo`, `ship` / `situationship`, and `sext` / `sextortion`). Phrase
  boundaries and regression fixtures must continue to keep those terms
  separate.
- Editorial review, candidate triage, source collection, and operational
  release review remain manual.
