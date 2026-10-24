# Parent Decoder — Rebuild SRD / Product Brief

## Document purpose

This document is the authoritative product and engineering brief for rebuilding Parent Decoder outside Lovable. It captures the behavior, safety model, route contract, data model, migration history, known limitations, and acceptance criteria of the latest Lovable reference implementation.

This is a reference snapshot, not permission to publish, deploy, add providers, or invent missing behavior. When source behavior and this document conflict, inspect the referenced source snapshot and record the discrepancy before changing it.

## Reference snapshot

- Product: Parent Decoder
- Lovable project: `5857fa59-dd62-46b0-b5fa-f339868f734b`
- Reference commit: `68b04fd25937ff9e441dd875ea19000e9d0691ed`
- Active preview: https://id-preview--5857fa59-dd62-46b0-b5fa-f339868f734b.lovable.app
- Original rollback anchor: `be78db3cf47fd866b005538c83cbd9975d41bb1b`
- Behavioral source: Replit “Parent Decoder (AI assistant)”, baseline `1f3006c8b194af7f086f6460e10e2fb931d4ec2f`
- Related Replit record: `nebula-vibecodes/parent-decoder-v2-replit-record`

The Lovable preview is the implementation reference. The Replit app is a behavioral reference only; do not copy proprietary implementation blindly.

## Product mission

Parent Decoder helps parents and caregivers understand youth slang, abbreviations, emojis, online language, and safety-relevant phrases without turning a word into a diagnosis or treating a child as a surveillance subject.

The product should reduce misunderstanding and make calm conversation easier. It translates language into context, possible meanings, uncertainty, and supportive conversation openers. It must never imply that a term alone proves danger, misconduct, mental illness, or a child’s intent.

## Core principles

1. Context before conclusions. Every interpretation is provisional and dependent on who used the term, where, and how.
2. Local-first privacy. Ordinary decoding and dictionary lookup work without sending user text to a provider.
3. Explicit opt-in for anything external. No assistant or search request runs automatically.
4. No surveillance. Do not collect device history, browsing history, private messages, accounts, IP addresses, child-identifying details, or hidden telemetry.
5. Calm safety language. Safety-relevant entries invite a supportive check-in and avoid alarmism.
6. Accessibility is part of correctness. Labels, focus behavior, keyboard support, live status announcements, contrast, responsive layout, and reduced-motion compatibility are required.
7. Editorial honesty. Prototype flags, mechanical checks, and source gaps must not be presented as independent verification or approval.
8. Reversible work. Preserve Git history and the rollback anchor. Never force-push, rewrite history, or silently replace the reference snapshot.

## Target users

- Primary: parents and caregivers encountering unfamiliar language used by children or teenagers.
- Secondary: educators, youth workers, and trusted adults who need a nonjudgmental contextual reference.
- Editorial users: authorized reviewers who evaluate proposed terms before they become dictionary content.

The product is not a child-monitoring system, moderation service, clinical tool, law-enforcement tool, or social network.

## Required experience

### Local dictionary

The dictionary contains richly structured entries. The current reference has approximately 233 entries across nine categories, with aliases and contextual guidance.

Each term should support:

- canonical term
- aliases and alternate spellings
- plain-language meaning
- concise summary
- multiple plausible interpretations
- example usage
- context clues
- a supportive conversation opener
- category
- concern tier
- review marker/date where available

The system must preserve uncertainty. Search results must not imply that the first matching interpretation is definitive.

### Decoder

The local decoder accepts a message or sentence and identifies known terms, including multi-word phrases, aliases, emojis, and conservative typo matches. It should show the original text with matched terms highlighted and a plain-language rendering.

Required behavior:

- Auto, Term, and Message modes.
- Local-only decoding by default.
- Accessible multiline input with a bounded character limit.
- Enter submits where appropriate; Shift+Enter inserts a newline.
- Optional `?q=` prefill must not silently transmit or analyze text externally.
- Unmatched words remain visible and should not be treated as errors.
- A local result remains available if an optional assistant request fails.

### Optional AI assistant

The assistant is separate from local decoding and remains disabled unless the user explicitly invokes it and the required provider decision is approved.

Replit behavior to preserve as a future gated phase:

- Explain mode may receive submitted text plus limited local decoder context as a clue, never as a conclusion.
- Broader question mode addresses general slang, tone, conversation starters, and context without automatically attaching local context.
- Input is bounded; one request runs at a time.
- Loading, response, error, retry, and clear states are explicit.
- Suggested prompts never auto-submit.
- Unsupported claims, alarmist language, surveillance advice, and diagnostic framing are prohibited.

Do not add Perplexity, another provider, an API key, an account connection, or network AI calls during the basic rebuild. That is a final, separately approved phase.

### Saved messages

Saved messages are opt-in and browser-local. They must be removable individually and clearable all at once. The app must remain useful with storage disabled, unavailable, corrupted, or cleared.

Do not introduce automatic history, cloud synchronization, accounts, analytics, or hidden persistence.

### Suggestions

The suggestion flow accepts a proposed term, meaning/context, source/platform information, and privacy acknowledgement. It must not collect email, IP address, account information, or child-identifying details.

If backend persistence is implemented, the confirmation must accurately say the suggestion was submitted for editorial review. If persistence is not configured, the UI must say it is a local draft or copy-only flow and must not claim delivery.

### Editorial review

Editorial review is an authenticated/authorized workflow, not a client-side passkey demo. Reviewers may inspect pending submissions, change status, and add notes. Anonymous users must never read or modify submissions.

Suggested status values:

- `pending`
- `approved`
- `rejected`
- `needs-review`

Publishing a proposed term is a separate editorial decision. A review queue is not evidence that a term is accurate.

### Feedback

Feedback remains copy-only unless a real destination is explicitly configured. Do not invent an email address or claim that a report was sent, received, stored, or reviewed.

The privacy boundary should remain explicit: the draft excludes private messages, saved prompts, browsing history, localStorage contents, device data, accounts, timestamps, and hidden metadata. A privacy acknowledgement and 500-character explanation cap are expected where implemented.

## Route contract

Preserve these routes and their meaning:

- `/` — calm landing page and primary lookup/decoder entry.
- `/browse` — dictionary search and filters.
- `/decoder` — local message/sentence decoder.
- `/term/:slug` — term detail page.
- `/saved` — opt-in browser-local saved messages.
- `/suggest` — term suggestion flow.
- `/editorial` — authorized editorial queue.
- `/editorial-review` — transparent, read-only mechanical review status.
- `/feedback` — copy-only feedback draft.
- `/conversation-starters` — supportive conversation prompts.
- `/privacy` — privacy and data-use explanation.
- `/about` and `/approach` — product context and methodology.
- `/library` and `/library/:category` — compatibility redirects to browse.
- `/terms/:slug` — compatibility redirect to term detail.
- `/discover` — preserve compatibility behavior if present in the source.

Route transitions should update document metadata, announce meaningful changes, move focus to the main landmark, and retain only limited prior-route context where needed. Unknown routes should show a useful not-found state.

## Data model

### Term

```ts
type Term = {
  term: string;
  aliases: string[];
  plainMeaning: string;
  summary: string;
  interpretations: string[];
  example: string;
  contextClues: string;
  opener: string;
  category: string;
  concern: string;
  reviewed: string;
};
```

Do not remove existing term data while changing architecture. Preserve canonical spellings, aliases, categories, safety language, and review markers.

### Submission

For a real backend implementation, use a server-backed table with UUID identity, term/meaning/context/platform fields, status, source, creation time, and reviewer note. Apply least-privilege grants and row-level security. Anonymous users may create a suggestion only; only authorized reviewers or a protected service role may read or update queue records.

Never store private user messages, child-identifying details, IP addresses, or unnecessary account metadata.

## Search and decoding behavior

Search should support:

- canonical terms and aliases
- phrase matching
- emoji and symbol normalization
- conservative typo tolerance
- meaning/category/context matching where appropriate
- letter, category, concern, and sort filters
- URL-persisted filters with safe parsing
- bookmarkable and shareable filtered links
- browser Back/Forward behavior
- category-preserving legacy redirects

Do not overmatch short common words. Prefer a transparent “no confident match” state over a misleading result.

## Accessibility requirements

- Every input has an accessible label.
- Keyboard users can complete every core flow.
- Focus moves to the main content after route changes.
- Dynamic results and errors use appropriate live regions.
- Buttons expose disabled/loading state truthfully.
- Mobile navigation has an explicit open/closed state and keyboard escape behavior.
- No horizontal overflow at supported mobile widths.
- Color is not the only meaning-bearing signal.
- Content remains understandable with reduced motion and zoom.
- Character limits and counters are available to screen readers.
- Sensitive safety content is written in calm, non-stigmatizing language.

## Privacy and security requirements

- Local decoding must not call a network service.
- Saved data is opt-in browser-local storage only.
- No automatic history, analytics, tracking pixels, fingerprinting, accounts, or advertising identifiers.
- Do not place submitted text into URLs unless the user explicitly chooses that behavior; warn that URL text can appear in browser history.
- Do not expose reviewer controls to anonymous users.
- Do not rely on a client-side passkey as authorization.
- Keep secrets server-side.
- Do not claim compliance certifications or independent review without evidence.

## Suggested implementation architecture

Use a conventional TypeScript/React application with a stable router and a small shared domain layer:

- `src/lib/terms.ts` or an equivalent typed data module for local terms and decoding.
- Shared route shell for metadata, navigation, focus, and footer.
- Pure search/decoding functions with unit tests.
- Browser-local storage adapter with schema validation, size cap, safe parsing, deletion, and clear-all.
- Server-side persistence adapter for submissions only when database/auth/RLS are configured.
- Separate editorial authorization from public suggestion creation.
- Feature flag for any external AI capability, defaulting to disabled.

Avoid adding dependencies unless there is a demonstrated need. Reuse existing UI primitives where possible.

## Validation plan

Every meaningful change should run:

1. Typecheck/build.
2. Lint on changed files and the project lint command.
3. Existing unit tests, including search/decoder tests.
4. Active preview checks, not the published/live site.
5. Desktop and mobile route checks.
6. Keyboard/focus and accessible-label checks.
7. Privacy checks confirming no unintended network calls or persistence.
8. Route regression checks and data-count/term-integrity checks.

For backend work additionally verify:

- a public suggestion insert succeeds;
- an anonymous client cannot select or update another submission;
- an authorized reviewer can read pending rows;
- status and reviewer-note updates persist after reload;
- failure states do not falsely claim submission success.

## Release gates

Do not publish or deploy automatically. Before launch, a human must review:

- sensitive-language entries;
- safety resource regional accuracy;
- editorial evidence and source quality;
- privacy wording and data retention;
- reviewer authorization and RLS;
- mobile and accessibility behavior;
- provider cost, privacy, citations, prompt-injection handling, and kill switch if AI is enabled.

## Known limitations of the reference

- The reference began as a Lovable/TanStack Start project and includes Lovable-specific metadata.
- The original audit identified mocked or local-only workflows before later persistence work; inspect the current reference commit rather than assuming every older audit statement still applies.
- Replit and Lovable are not proven byte-for-byte or data-for-data identical.
- Mechanical editorial review is not semantic verification.
- The published app and active preview are distinct; preview-only validation is required during rebuild.

## Rebuild sequence

1. Preserve this brief and the exact reference commit.
2. Recreate the shell, routes, term data, and local decoder.
3. Recreate search, filters, aliases, URL state, and compatibility redirects.
4. Recreate saved-message storage and privacy controls.
5. Recreate suggestion and feedback behavior with truthful wording.
6. Add authenticated editorial persistence only after the database and authorization model are reviewed.
7. Add optional AI only as a separately approved final phase.
8. Run the validation plan and record discrepancies.
9. Keep the old Lovable preview available as a comparison until the replacement passes the release gates.

## Definition of done

The rebuild is ready for human release review when:

- all required routes work;
- local decoding works without network access;
- term data and aliases are preserved;
- saved messages are opt-in, local, removable, and clearable;
- suggestion/feedback wording is truthful;
- editorial access is actually authorized;
- build, lint, tests, accessibility, mobile, privacy, and regression checks pass;
- no provider, account, analytics, or deployment is added without explicit approval;
- a comparison report documents remaining differences from the Lovable reference.

