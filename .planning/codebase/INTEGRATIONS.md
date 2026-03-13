# External Integrations

**Analysis Date:** 2026-03-11

## APIs & External Services

**Web Search (Optional):**
- Brave Search API
  - Purpose: Enable research phase web search for project context gathering
  - SDK/Client: Native `fetch()` API (Node.js built-in)
  - Auth: `BRAVE_API_KEY` environment variable required
  - Implementation: `get-shit-done/bin/lib/commands.cjs` - `cmdWebsearch()` function
  - Endpoint: `https://api.search.brave.com/res/v1/web/search`
  - When disabled: `/gsd:research` gracefully skips web search, uses Claude's knowledge only
  - Configuration: Set via env var or `~/.planning/brave-api-key` file

**AI Model APIs (Runtime-specific):**
- Claude Code / Claude API
  - Purpose: Primary execution runtime for all agents
  - Integration: Through Claude Code's built-in tools

- OpenCode / Gemini API
  - Purpose: Alternative execution runtimes with open-source/free models
  - Integration: Through respective CLI runtimes

- Codex / Perplexity API
  - Purpose: Alternative execution runtime (skills-first architecture)
  - Integration: Through Codex configuration

## Data Storage

**Databases:**
- None used - This is a state-driven CLI tool, not a traditional application

**File Storage:**
- Local filesystem only
  - Project state: `.planning/` directory (git-tracked)
  - User config: `~/.claude/`, `~/.config/opencode/`, `~/.gemini/`, `~/.codex/`
  - Temp files: System `%TEMP%`/`$TMPDIR` for large JSON outputs

**Caching:**
- None - Stateless tool designed for single-invocation agent orchestration

## Authentication & Identity

**Auth Provider:**
- Custom / Runtime-native
  - Implementation: Each runtime (Claude Code, OpenCode, Gemini, Codex) handles its own authentication
  - GSD does not manage user credentials directly
  - Credentials stored in runtime-specific config directories

**Environment Configuration:**
- No user authentication required for GSD itself
- Optional Brave Search API key for web search functionality
- Runtime assumes user is already authenticated with their AI provider

## Monitoring & Observability

**Error Tracking:**
- None - Errors logged to stderr and exit codes

**Logs:**
- Approach: Direct console output (stdout/stderr)
- Log format: JSON when using `output()` function, plain text for errors
- Verbosity: Controlled by agent caller (Claude Code, etc.)
- Persisted logs: Not by GSD itself (agents handle logging)

## CI/CD & Deployment

**Hosting:**
- npm package registry (npmjs.org)
- GitHub repository (source): https://github.com/glittercowboy/get-shit-done
- Distributed: Pre-built hooks committed to repo (no build step on install)

**CI Pipeline:**
- GitHub Actions
  - Test workflow: Runs `npm test` on all commits
  - Coverage requirement: 70% line coverage (enforced by c8)
  - Status badge included in README.md

**Installation Flow:**
- User runs: `npx get-shit-done-cc@latest`
- Script fetches latest from npm
- Runs `bin/install.js` (interactive setup)
- Prompts for runtime (Claude Code, OpenCode, Gemini, Codex)
- Prompts for location (global ~/.claude/ or local ./.claude/)
- Copies pre-built hooks to target directory

## Environment Configuration

**Required env vars:**
- None - GSD operates without mandatory environment variables

**Optional env vars:**
- `BRAVE_API_KEY` - Brave Search API key for web search
- `CLAUDE_CONFIG_DIR` - Override default Claude Code config location (Claude only)
- `OPENCODE_CONFIG_DIR` - Override OpenCode config (XDG spec)
- `OPENCODE_CONFIG` - Alternative OpenCode config file path
- `XDG_CONFIG_HOME` - XDG Base Directory specification (OpenCode)
- `GEMINI_CONFIG_DIR` - Override default Gemini CLI config location
- `CODEX_HOME` - Override default Codex config location

**Secrets location:**
- `.env` files: Not used by GSD
- API keys stored in: `~/.planning/brave-api-key` (fallback if env var not set)
- Runtime credentials: In runtime's native config directory

## Webhooks & Callbacks

**Incoming:**
- None - GSD is a CLI orchestration tool, not a server

**Outgoing:**
- None - GSD does not make outbound requests except to Brave Search API
- All execution happens within the AI provider's environment

## GitHub Integration

**Repository Interaction:**
- Git operations only (execSync calls to `git` CLI)
- Reads: `.gitignore`, `.git/` for state management
- Writes: Commits to `.planning/` directory when `commit_docs: true`
- No GitHub API calls - Uses local git commands

**Integration Points:**
- `get-shit-done/bin/lib/core.cjs` - `execGit()` function
  - Purpose: Execute git commands for version control
  - Operations: add, commit, rev-parse (checking commits)
  - Used by: Phase summarization, documentation commits

## No Third-Party Integrations

This project is deliberately minimal:
- No ORM (no database)
- No HTTP client library (uses native fetch)
- No logging framework (native console)
- No testing framework beyond Node's built-in test runner
- No authentication libraries (relies on runtime auth)
- No external service SDKs (except optional Brave Search)

All functionality built with Node.js standard library and careful CLI design.

---

*Integration audit: 2026-03-11*
