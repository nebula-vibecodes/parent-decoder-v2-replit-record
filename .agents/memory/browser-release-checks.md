---
name: Browser release checks
description: Environment constraints and stable verification practices for the Parent Decoder browser suite.
---

The Parent Decoder browser suite needs Chromium runtime libraries available in
the Nix environment. Its mobile project should use Chromium with a mobile
viewport and touch settings rather than inheriting a WebKit device profile
unless WebKit is deliberately installed. The Vite config also requires PORT
and BASE_PATH for standalone build and preview commands.

**Why:** Playwright otherwise fails before running application assertions, and
standalone Vite builds fail during config loading instead of reporting code
errors.

**How to apply:** Keep the required Nix packages in the project environment,
use the configured Chromium desktop/mobile projects, and run build/serve
commands with explicit PORT and BASE_PATH outside the managed Replit workflow.
Keep the artifact-owned Parent Decoder workflow as the only long-running preview
server; browser checks may use a separate controlled port only when Playwright
owns and shuts down that temporary server.