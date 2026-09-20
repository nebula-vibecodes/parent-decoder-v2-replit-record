---
name: GitHub integration pushes
description: Reliable repository synchronization through the connected GitHub integration when direct Git credentials are unavailable.
---

For repository synchronization through the connected GitHub integration, use the Git Data API: read the target branch and base tree, create blobs for the local files, create a tree with that base tree, then create and fast-forward the branch commit. Preserve remote-only files by omitting them from the overlay tree rather than replacing the tree from scratch.

**Why:** The Replit connector proxy is the usable authenticated path, while direct Git credentials are not exposed. The proxy also enforces a low request rate and large payloads can be transformed at the sandbox boundary, so large pushes need small, sequential payloads with pacing.

**How to apply:** Keep individual file payloads small or split their encoded content before the authenticated call, stay below the connector’s request rate, and verify the branch head plus preserved remote-only blob hashes after the ref update.