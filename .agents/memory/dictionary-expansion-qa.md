---
name: Dictionary expansion QA
description: Durable checks and editorial boundaries for governed static dictionary growth.
---

Published dictionary expansion must preserve existing records, keep new batches independently reviewable, and validate both unique normalized keys and raw record cardinality. Grouping values by unique owners can hide a duplicated row with the same slug.

**Why:** A duplicate reused an existing term identity during expansion and was only exposed when the integration test compared record count with unique IDs.

**How to apply:** When adding a batch, verify the batch size, exact-token collisions, duplicate IDs/slugs/names, prototype metadata, context completeness, and the unchanged decoder/search fixtures before moving to the next phase.

Cross-context audit assertions should check semantic safeguards rather than require one exact editorial sentence; equivalent wording still needs to communicate uncertainty, non-diagnosis, and media-context limits.

**Why:** The Phase 4 audit initially rejected an existing risk explanation that conveyed the required uncertainty with different wording.

**How to apply:** Prefer focused regular expressions or structured fields for editorial guardrails, while keeping paired fixtures strict about matches, risk levels, false positives, and proportionality.