---
name: Lexical search boundaries
description: Durable rule for keeping lexical classes distinct across lookup, decoding, and review surfaces.
---

Primary dictionary lookup must not surface canonical terms or aliases that are classified as supporting, parent-guide, or held-for-verification records. The decoder may include supporting terminology when it is visibly labeled, but guides and held records must not become decoded matches.

**Why:** A broad text search can otherwise return a slang card because a supporting phrase appears inside another record’s explanation, and guide phrases can be mistaken for canonical slang when they contain a real term.

**How to apply:** When adding a lexical class or search scope, test exact canonical/alias queries, longer-message decoding, guide discoverability, held-record exclusion, and visible class labels together.