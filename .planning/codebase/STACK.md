# Technology Stack

**Analysis Date:** 2026-03-11

## Languages

**Primary:**
- JavaScript (Node.js) - All core tools and CLI commands
- CommonJS (.cjs) - Runtime library modules in `get-shit-done/bin/lib/`

**Secondary:**
- Bash - Installation scripts and test runners

## Runtime

**Environment:**
- Node.js >= 16.7.0 (specified in `package.json` engines)

**Package Manager:**
- npm (Node Package Manager)
- Lockfile: Present (`package-lock.json`)

## Frameworks

**Core:**
- Built-in Node.js modules only:
  - `fs` - File system operations
  - `path` - Path manipulation (cross-platform support)
  - `child_process` - Command execution
  - `readline` - Interactive CLI prompts
  - `crypto` - Cryptographic operations
  - `os` - OS-level utilities (tempdir, homedir)

**Testing:**
- `node:test` - Node.js built-in test runner (v18+)
- `node:assert` - Built-in assertion library

**Build/Dev:**
- `esbuild` ^0.24.0 - JavaScript/TypeScript bundler (for hook compilation)
- `c8` ^11.0.0 - Code coverage tool

## Key Dependencies

**No Runtime Dependencies:**
- This project has ZERO production dependencies
- Only dev dependencies for tooling (`esbuild`, `c8`)

**Why This Matters:**
- Minimal attack surface for security
- No dependency version conflicts
- Single Node version requirement across all environments
- Fast installation (npm install completes in seconds)

## Configuration

**Environment:**
- `BRAVE_API_KEY` - Optional Brave Search API key for web search functionality
  - Location: Environment variable or `~/.planning/brave-api-key` file
  - When set: Enables `/gsd:research` web search capability
  - When not set: Research falls back to Claude's built-in knowledge

**Project Config:**
- `.planning/config.json` - GSD configuration (created per project during `/gsd:init`)
  - Controls: Model profiles, workflow options, gates, parallelization settings

**Runtime Config:**
- User credentials stored in:
  - Claude Code: `~/.claude/` (global) or `./.claude/` (local)
  - OpenCode: `~/.config/opencode/` (follows XDG spec)
  - Gemini: `~/.gemini/`
  - Codex: `~/.codex/`

## Build

**Build Process:**
- `npm run build:hooks` - Compiles hook scripts using esbuild
  - Input: `hooks/src/**/*.js`
  - Output: `hooks/dist/**/*.js` (committed to repo)
- `npm run prepublishOnly` - Automatically runs build:hooks before npm publish
- Hooks are pre-built and committed, so npm installation is zero-build

**Test Build:**
- `npm test` - Runs all tests via `scripts/run-tests.cjs`
- `npm run test:coverage` - Runs tests with c8 coverage (70% line threshold)

## Platform Requirements

**Development:**
- Node.js 16.7.0 or higher
- Git (for version control and `.planning/` state management)
- Bash shell (for hook execution)
- Works on: macOS, Linux, Windows (via WSL or native Node)

**Production/Deployment:**
- Designed to run within Claude Code, OpenCode, Gemini, or Codex environments
- No separate server or database required
- All state stored in project `.planning/` directory (git-tracked)
- No external infrastructure dependencies (except optional Brave Search API)

## External APIs

**Brave Search API** (Optional)
- Purpose: Enable web search during `/gsd:research` phase
- Endpoint: `https://api.search.brave.com/res/v1/web/search`
- Auth: `X-Subscription-Token` header with `BRAVE_API_KEY`
- Usage: Only called if `BRAVE_API_KEY` is configured
- Fallback: Disabled search without API key (no errors, just skipped)

## Distribution

**Published As:**
- npm package: `get-shit-done-cc` (v1.22.4)
- Installation: `npx get-shit-done-cc@latest`
- Repository: https://github.com/glittercowboy/get-shit-done

---

*Stack analysis: 2026-03-11*
