# Dictionary expansion workflow

Parent Decoder grows through small, checked-in editorial batches. The process is intentionally local and manual where judgment matters. It does not collect private messages, scrape platforms, infer popularity, or promote a term automatically.

## Low-cost cadence

- Work in batches of **3–8 candidates**.
- Prefer gaps in existing categories, ambiguous shorthand, or phrases parents are likely to misread.
- Keep a candidate on hold when there is not enough context. A smaller reliable batch is better than a forced entry.
- Run one batch through intake, triage, drafting, validation, and visual review before starting the next.

The review-size limit for a focused publication batch is **8 entries**. The
dictionary validator reports every batch count and fails when a batch exceeds
that limit without an explicit `reviewSizeException` and a matching explanation
here. The `foundation` and `expansion` modules are documented exceptions because
they preserve historical entries from the initial split; new batches must stay
within the limit rather than extending either exception.

## 1. Intake

Add a record to `src/dictionary-candidates.ts`. Use a short anonymous summary of the observed context.

Allowed:

- Proposed term and aliases
- Plain-language meaning
- A general context summary
- Categories and proposed context level
- Risk rationale and ambiguity notes
- Whether more verification is needed

Never include:

- Message transcripts or screenshots
- Names, usernames, handles, email addresses, phone numbers, or links
- Child profiles, locations, contacts, or account information
- Claims that a term is trending, popular, universal, verified, or definitive

## 2. Triage

Every candidate receives one outcome:

- **reject** — duplicate, not a distinct term, contains unsafe intake material, or cannot be framed without unsupported claims
- **hold** — potentially useful, but needs more context or clearer ambiguity boundaries
- **promote** — enough context exists for a neutral prototype entry

The triage reason must explain the decision. Rejected and held candidates stay out of the published dictionary.

## 3. Draft and promote

For a promoted candidate:

1. Add the complete card to the focused batch module under `src/dictionary/batches/`,
   using `createPrototypeEntry` from the dictionary data layer. Keep cards in
   publication order and do not sort them by category or risk.
2. Set `promotedSlug` on the candidate record to the exact published slug.
3. Preserve multiple meanings when a short form or phrase is ambiguous.
4. Include harmless and concerning contexts, calm conversation starters, and explicit “do not assume” guidance.

The dictionary aggregation lives in `src/dictionary/index.ts`. The public
exports from `src/data.ts` remain the compatibility surface for the app and
validation scripts. Shared dictionary types are available from
`src/dictionary/types.ts`; batch modules should import those types rather than
duplicating the `Term` model. Adding a promoted batch should touch only
`src/dictionary-candidates.ts` and one focused module in
`src/dictionary/batches/`. Never change search, match, decoder, or validation
logic as part of editorial batching.

The helper applies the required prototype metadata: Editorial source type, Moderate confidence, no source references, no independent verification date, and verification-in-progress wording.

Promotion is a source-code change reviewed with the batch. Nothing in the running app promotes candidates.

## 4. Independent review before verified guidance

Prototype content must not be presented as independently verified guidance. Before
changing an entry to `Reviewed`, obtain an independent review from a qualified
subject-matter reviewer or an appropriately scoped lived-experience reviewer.
The reviewer should match the entry’s risk and category—for example, a
substance-use specialist for substance language, a mental-health professional
for mental-health language, or a community-informed reviewer for identity and
regional language.

Record all of the following on the entry only after they are independently
confirmed:

- reviewer name or approved professional attribution
- reviewer qualification or review scope
- review date in `YYYY-MM-DD` format
- at least one named source reference used in the review
- `reviewStatus: 'Reviewed'` and `editorialStatus: 'Reviewed'`

Do not fill these fields with placeholders, internal authors, guessed citations,
or a date representing the drafting date. If a reviewer cannot confirm the
wording, revise it, hold it, or leave it clearly marked as prototype content.
Entries with `reviewStatus: 'Unreviewed'` or `Held` remain outside verified
guidance.

The current edition has not received this independent review. The standard
dictionary validation remains green because it checks prototype safety; the
verified release gate is intentionally blocked until the evidence above exists:

```sh
pnpm --filter @workspace/parent-decoder run validate:public-launch
```

That command must fail while sensitive entries are pending. A prototype-only
release is acceptable only when the product and every entry continue to say
that the material is prototype guidance.

## 5. Validate

Run:

```sh
pnpm --filter @workspace/parent-decoder run validate
pnpm --filter @workspace/parent-decoder run typecheck
pnpm --filter @workspace/parent-decoder run build
```

The validation report checks the candidate queue and published dictionary together. Resolve errors before merging. Review warnings to confirm that token overlaps are intentional and boundary-safe.

## 6. Visual review

For each promoted term:

- Search its term and aliases in the dictionary.
- Check the decoder with a short invented example that contains no personal data.
- Open its term detail page and review every meaning, context level, conversation starter, and “do not assume” note.
- Confirm it appears as a moderate-confidence prototype in Editorial review.
- Check one desktop and one mobile viewport for the batch.

## Batch reviewer checklist

- [ ] Candidate summaries contain no private or identifying information.
- [ ] Reject, hold, and promote decisions have clear reasons.
- [ ] Promoted terms fill a real coverage or ambiguity gap.
- [ ] Aliases do not silently collide with another entry.
- [ ] Context levels describe how carefully to read the situation, not a diagnosis.
- [ ] Currentness language does not imply live tracking or popularity data.
- [ ] All promoted entries retain prototype metadata and need-verification status.
- [ ] Sensitive entries have qualified subject-matter or lived-experience review before any verified release.
- [ ] Reviewed entries include a real reviewer qualification, named source, and review date; no evidence is fabricated.
- [ ] Validation, typecheck, build, search, decoder, term detail, and editorial review pass.
