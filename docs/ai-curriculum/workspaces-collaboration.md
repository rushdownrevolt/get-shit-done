# Workspaces & Collaboration

Learn how GSD enables parallel development with workstream namespacing, multi-project workspaces, and cross-AI peer review — collaboration patterns that scale beyond single-milestone execution.

## Lesson 1: Workspaces & Collaboration Overview

**Objective:** Understand why GSD provides workspaces and collaboration features beyond sequential milestones. Learn the three isolation modes, the worktree lifecycle, and preview the module's four key topics: workstream namespacing, multi-project workspaces, cross-AI peer review, and workspace isolation.

Sequential milestones work well for a single developer working on one project at a time. But real projects often demand parallel workstreams -- you need to prototype a feature while the main milestone is still executing, or you want to explore an alternative architecture without polluting the main branch. GSD solves this with workspaces: isolated environments where you can run independent planning and execution cycles. Each workspace gets its own branch, its own .gsd/ directory, and its own commit history. When the work is done, you merge it back. This module teaches the infrastructure that makes parallel work possible in GSD.

```text
### Isolation Model

Auto-mode supports three isolation modes (configured in
`.gsd/preferences.md` under `taskIsolation.mode`):

- **worktree** (default): Work happens in `.gsd/worktrees/<MID>/`,
  a full git worktree on the `milestone/<MID>` branch.
- **branch**: Work happens in the project root on a
  `milestone/<MID>` branch. No worktree directory.
- **none**: Work happens directly on the current branch.
  No worktree, no milestone branch.
```

Those three modes -- worktree, branch, and none -- give you a spectrum of isolation. Worktree mode is the default because it provides the strongest isolation: a full working copy of the project in its own directory, on its own branch. Branch mode is lighter -- it reuses the same directory but switches to a dedicated branch. None mode is the simplest -- everything happens in place, no branches created. The mode you choose depends on your project's needs: worktree for long-running parallel work, branch for quick feature branches, none for small single-stream projects.

```typescript
export interface WorktreeInfo {
  name: string;
  path: string;
  branch: string;
  exists: boolean;
}
```

Every worktree has a name (like 'auth-refactor'), a path under .gsd/worktrees/, a branch (worktree/<name>), and a boolean indicating whether it still exists on disk. This simple interface drives the entire worktree lifecycle: create a worktree, switch into it, do your work, merge it back, then remove it. The workspace-index module builds on this by indexing all milestones, slices, and tasks across the entire project -- providing a unified view of all work regardless of which worktree it lives in.

```typescript
export interface GSDWorkspaceIndex {
  milestones: WorkspaceMilestoneTarget[];
  active: {
    milestoneId?: string;
    sliceId?: string;
    taskId?: string;
    phase: string;
  };
  scopes: WorkspaceScopeTarget[];
  validationIssues: ValidationIssue[];
}
```

The GSDWorkspaceIndex is the data structure that answers 'where is everything?' It lists all milestones (each with their slices and tasks), tracks which milestone/slice/task is currently active, provides a flat list of scopes for navigation (project, milestone, slice, task), and surfaces any validation issues found during indexing. Commands like /gsd status and /gsd doctor use this index to show you the state of your entire project at a glance. This is the foundation that makes multi-project workspaces and collaboration features possible.

You now know the motivation for workspaces: parallel workstreams that need isolation beyond sequential milestones. You have seen the three isolation modes (worktree, branch, none), the WorktreeInfo interface that tracks individual worktrees, and the GSDWorkspaceIndex that provides a unified project view. In the next four lessons, you will dive deep into each capability: workstream namespacing with /worktree (how to create, switch, merge, and remove worktrees), multi-project workspace indexing (how GSD tracks milestones and slices across a project), cross-AI peer review (how /review dispatches structured code analysis), and workspace isolation patterns.

---

## Lesson 2: Workstream Namespacing

**Objective:** Learn how the /worktree command creates, lists, merges, and removes git worktrees under .gsd/worktrees/. Understand the worktree lifecycle (create -> work -> merge -> remove) and how each worktree gets its own named branch and working copy.

Workstream namespacing is the practice of giving each parallel workstream its own named space -- a directory, a branch, and a set of GSD artifacts. The /worktree command (aliased as /wt) manages this namespace. When you run /worktree auth-refactor, GSD creates a new git worktree at .gsd/worktrees/auth-refactor/ on branch worktree/auth-refactor. You switch into that directory, do your work (plan, execute, verify), and when you are done, /worktree merge brings it back to the main branch. The name 'auth-refactor' acts as the namespace -- it scopes the branch, the directory, and the merge.

```typescript
/**
 * GSD Worktree Command -- /worktree
 *
 * Create, list, merge, and remove git worktrees
 * under .gsd/worktrees/.
 *
 * Usage:
 *   /worktree <name>        -- create a new worktree
 *   /worktree list          -- list existing worktrees
 *   /worktree merge [name]  -- start LLM-guided merge
 *   /worktree remove <name> -- remove a worktree
 */
```

The command is deliberately simple: four operations that map to the worktree lifecycle. Create sets up the isolated environment. List shows all active worktrees. Merge reconciles changes back to the main branch. Remove cleans up the worktree and its branch. Under the hood, the WorktreeManager handles the git operations. Its JSDoc explains the complete flow: create a worktree with git worktree add, work in it freely, merge using LLM-guided reconciliation of .gsd/ artifacts, then remove the worktree and clean up the branch.

```typescript
/**
 * GSD Worktree Manager
 *
 * Creates and manages git worktrees under
 * .gsd/worktrees/<name>/.
 * Each worktree gets its own branch (worktree/<name>)
 * and a full working copy of the project.
 *
 * The merge helper compares .gsd/ artifacts between
 * a worktree and the main branch, then dispatches
 * an LLM-guided merge flow.
 *
 * Flow:
 *   1. create()  -- git worktree add
 *   2. user works in the worktree
 *   3. merge()   -- LLM-guided reconciliation
 *   4. remove()  -- git worktree remove + cleanup
 */
```

That flow -- create, work, merge, remove -- is the core pattern. But what happens during merge is where the real intelligence lives. GSD first attempts a deterministic squash merge (git merge --squash). If that succeeds with no conflicts, the merge is done instantly. If conflicts are detected, GSD aborts the failed merge, then falls back to an LLM-guided merge flow. The LLM receives the full diff (both .gsd/ artifacts and code changes), the commit log, and file-level statistics, then reconciles the conflicts intelligently. This two-tier approach means clean merges are fast, and only conflict resolution uses AI.

```typescript
export interface WorktreeDiffSummary {
  /** Files only in the worktree .gsd/ (new artifacts) */
  added: string[];
  /** Files in both but with different content */
  modified: string[];
  /** Files only in main .gsd/ (deleted in worktree) */
  removed: string[];
}
```

The WorktreeDiffSummary categorizes every changed file as added, modified, or removed. This powers the merge preview that shows you exactly what will change before you confirm. The merge command displays file counts, line statistics (+additions, -deletions), and splits changes into code versus GSD artifacts. You see the full picture before committing to the merge. Internal paths like .gsd/worktrees/, .gsd/runtime/, and .gsd/STATE.md are automatically skipped -- they are runtime artifacts that should not be merged.

You now know how workstream namespacing works in GSD. The /worktree command provides four operations (create, list, merge, remove) that manage the worktree lifecycle. Each worktree gets its own directory under .gsd/worktrees/<name>/ and its own branch (worktree/<name>). Merges use a two-tier strategy: deterministic squash for clean merges, LLM-guided reconciliation for conflicts. The WorktreeDiffSummary drives merge previews by categorizing changes as added, modified, or removed. Next, you will learn how the workspace index tracks milestones, slices, and tasks across the entire project.

---

## Lesson 3: Multi-Project Workspaces

**Objective:** Learn how workspace-index.ts indexes milestones, slices, and tasks across a project to provide a unified view of all work. Understand the hierarchy (Milestone -> Slice -> Task), scope targeting, and how this index enables commands like /gsd status and /gsd doctor.

A GSD project can have multiple milestones running simultaneously -- especially when worktrees enable parallel development. But how does GSD know what work exists across the entire project? The workspace-index.ts module answers this by scanning all milestone directories, parsing their roadmaps and plans, and building a structured index of every milestone, slice, and task. This index is the data layer behind /gsd status (which shows project state at a glance) and /gsd doctor (which validates plan and completion boundaries). Without it, GSD would only know about the currently active work -- not the full picture.

```typescript
export interface WorkspaceMilestoneTarget {
  id: string;
  title: string;
  roadmapPath?: string;
  slices: WorkspaceSliceTarget[];
}

export interface WorkspaceSliceTarget {
  id: string;
  title: string;
  done: boolean;
  planPath?: string;
  summaryPath?: string;
  uatPath?: string;
  tasksDir?: string;
  branch?: string;
  tasks: WorkspaceTaskTarget[];
}
```

Each milestone in the index contains its ID, title, roadmap path, and a list of slices. Each slice tracks its completion status (done), paths to its plan, summary, and UAT files, the tasks directory, the git branch it runs on, and a list of its tasks. This hierarchy -- milestone contains slices, slices contain tasks -- mirrors the physical directory structure under .gsd/milestones/. The index reads this structure and makes it queryable. When /gsd status shows you 'Milestone M01: 3/5 slices complete,' it is reading from this index.

```typescript
export interface WorkspaceScopeTarget {
  scope: string;
  label: string;
  kind: "project" | "milestone" | "slice" | "task";
}
```

WorkspaceScopeTarget flattens the milestone/slice/task hierarchy into a navigable list of scopes. Each scope has a string identifier (like 'M01/S01/T01'), a human-readable label, and a kind that tells you what level of the hierarchy it targets. This powers scope-based commands: /gsd doctor M01/S01 validates a specific slice, /gsd doctor M01 validates an entire milestone, and /gsd doctor with no argument validates the whole project. The flat scope list also drives tab-completion in the CLI -- when you type /gsd doctor and hit tab, you see all available scopes.

```text
.gsd/
  milestones/
    M01-abc123/
      ROADMAP.md
      S01-setup/
        PLAN.md
        SUMMARY.md
        UAT.md
        tasks/
          T01-PLAN.md
          T01-SUMMARY.md
      S02-core/
        PLAN.md
```

That directory tree is what indexWorkspace() scans. It finds all milestone directories (M01-abc123/), reads their ROADMAP.md files to extract titles and slice lists, then dives into each slice directory to find plans, summaries, UAT files, and tasks. The function also derives the current state -- which milestone, slice, and task are active -- and builds the flat scope list. Optionally, it runs validation checks (validatePlanBoundary and validateCompleteBoundary) to detect issues like plans without summaries or slices marked done without proper artifacts. This is what /gsd doctor uses to find problems.

You now know how multi-project workspace indexing works. The workspace-index.ts module scans all milestone directories, parses roadmaps and plans, and builds a GSDWorkspaceIndex containing every milestone, slice, and task. WorkspaceMilestoneTarget and WorkspaceSliceTarget represent the hierarchy, while WorkspaceScopeTarget flattens it for navigation and commands. The indexWorkspace() function reads the .gsd/milestones/ directory tree, derives active state, and optionally runs validation. This index powers /gsd status, /gsd doctor, and scope-based tab completion. Next, you will learn how /review dispatches structured code analysis across AI models.

---

## Lesson 4: Cross-AI Peer Review

**Objective:** Learn how the /review skill determines review scope, gathers context, analyzes changes against five categories (Security, Performance, Bugs, Code Quality, Test Coverage), formats findings with severity levels, and offers a decision gate after review. Understand why this is cross-AI: GSD can dispatch review to multiple AI runtimes.

Code review is one of the most valuable quality gates in software development, but it traditionally requires another human. GSD's /review skill automates structured code review by analyzing diffs against five categories: Security, Performance, Bug Risks, Code Quality, and Test Coverage. The skill is 'cross-AI' because GSD can dispatch it to different AI runtimes -- the same review prompt works across models. The core principle is clear: find real issues, not style nits. The reviewer focuses on problems that cause bugs, security vulnerabilities, performance degradation, or maintainability pain.

```text
<determine_review_scope>

Parse the user's input to determine what to review:

1. **No arguments** - Review staged changes first.
   If nothing staged, review unstaged changes.
   If both empty, review the most recent commit.

2. **Commit hash argument** (e.g., `/review abc1234`)
   Review that specific commit.

3. **File path argument** (e.g., `/review src/foo.ts`)
   Review unstaged changes in that file.

4. **"pr" argument** (e.g., `/review pr`)
   Review all changes since branching from main.

</determine_review_scope>
```

The scope resolution is pragmatic: with no arguments, it reviews what you are about to commit (staged first, then unstaged, then last commit). With a commit hash, it reviews that specific commit. With 'pr', it reviews everything since you branched from main -- the full pull request diff. After determining scope, the reviewer does not just read the diff in isolation. It reads each modified file in full to understand surrounding code, identifies the tech stack, checks for related test files, and examines configuration changes. This context-gathering step is critical -- a diff without context leads to false positives.

```text
<review_categories>

**A. Security Issues** (CRITICAL or HIGH)
- Injection vulnerabilities, XSS, auth flaws
- Secrets hardcoded or logged
- Path traversal, unsafe eval

**B. Performance Concerns** (HIGH or MEDIUM)
- N+1 queries, blocking operations
- Missing pagination, redundant computation

**C. Bug Risks** (HIGH or MEDIUM)
- Off-by-one errors, null dereferences
- Race conditions, incorrect error handling

**D. Code Quality** (MEDIUM or LOW)
- Unclear naming, code duplication
- Excessive complexity, dead code

**E. Test Coverage Gaps** (MEDIUM or LOW)
- New logic without tests
- Changed behavior without updated tests

</review_categories>
```

Each category has a default severity range -- Security issues are CRITICAL or HIGH because they can cause data breaches, while Test Coverage Gaps are MEDIUM or LOW because they represent risk, not immediate harm. The reviewer only reports findings that are actually present; categories with no issues are skipped entirely. This prevents the noise problem that plagues many automated review tools -- you only see what matters. Every finding includes the file path, line numbers, a clear description, why it matters, and a suggested fix.

```text
## Code Review: [brief description]

**Scope**: [staged | unstaged | commit | PR changes]
**Files reviewed**: [count] files, [+adds] [-dels]

---

### Findings

[Findings grouped by severity, highest first]

### Summary

| Severity | Count |
|----------|-------|
| CRITICAL | X     |
| HIGH     | X     |
| MEDIUM   | X     |
| LOW      | X     |

### Recommended Actions

1. [Most important action]
2. [Next most important]
```

After presenting findings, the review always ends with a decision gate: fix issues, save the review to a file, review again with different scope, discuss a specific finding, or take another action. This gate is mandatory -- the reviewer never auto-implements fixes. This separation of roles (reviewer versus author) is deliberate: it prevents the AI from silently changing code during a review pass. The user always decides what to act on. This is what makes /review a collaboration tool rather than an automation tool.

You now know how cross-AI peer review works in GSD. The /review skill determines scope (staged, unstaged, commit, or PR), gathers context by reading full files, analyzes changes against five categories (Security, Performance, Bugs, Code Quality, Test Coverage), formats findings with severity levels and recommended actions, and offers a mandatory decision gate. It is cross-AI because the same skill definition works across different AI runtimes. The core principle -- find real issues, not style nits -- keeps reviews focused on problems that matter. Next, you will learn about workspace isolation patterns.

---

## Lesson 5: Workspace Isolation

**Objective:** Understand how workspaces isolate workstreams to avoid conflicts -- file ownership, .gsd/ separation, and branch scoping. Learn the three layers of isolation that prevent parallel workstreams from interfering with each other.

When you run parallel workstreams, three things can go wrong: file conflicts (two workstreams editing the same file), branch pollution (commits from different workstreams interleaving on the same branch), and state corruption (two workstreams writing to the same .gsd/ directory). GSD prevents all three through isolation -- each worktree gets its own directory, its own branch, and its own .gsd/ state. This lesson examines how each layer works, starting with directory isolation.

```typescript
export function worktreesDir(basePath: string): string {
  return join(basePath, ".gsd", "worktrees");
}

export function worktreePath(
  basePath: string,
  name: string,
): string {
  return join(worktreesDir(basePath), name);
}
```

Directory isolation is the foundation. Every worktree lives under .gsd/worktrees/<name>/ -- a full working copy of the project at its own path. worktreesDir() returns the container directory, and worktreePath() returns the specific worktree's location. Because each worktree has its own directory, two workstreams can edit the same logical file without conflicting -- they are editing different physical files in different directories. No file locking, no merge-on-save, just separate copies.

```typescript
export function worktreeBranchName(
  name: string,
): string {
  return `worktree/${name}`;
}

// Inside createWorktree():
const branchAlreadyExists =
  nativeBranchExists(basePath, branch);

if (branchAlreadyExists) {
  const worktreeEntries =
    nativeWorktreeList(basePath);
  const branchInUse = worktreeEntries.some(
    entry => entry.branch === branch,
  );

  if (branchInUse) {
    throw new GSDError(
      GSD_LOCK_HELD,
      `Branch "${branch}" is already in use ` +
      `by another worktree.`,
    );
  }
}
```

Branch isolation ensures each worktree gets a dedicated branch named worktree/<name>. The worktreeBranchName() function generates this name from the worktree name. During creation, GSD validates that no other worktree is already using that branch -- if branchInUse is true, it throws an error. This prevents two worktrees from sharing a branch, which would cause their commits to interleave and their git histories to collide. Each workstream has a clean, linear commit history on its own branch.

```typescript
/**
 * Sync .gsd/ state from the main repo into the
 * worktree.
 *
 * Only adds missing content -- never overwrites
 * existing files in the worktree (the worktree's
 * execution state is authoritative for in-progress
 * work).
 */
export function syncGsdStateToWorktree(
  mainBasePath: string,
  worktreePath_: string,
): { synced: string[] } {
  const mainGsd = gsdRoot(mainBasePath);
  const wtGsd = gsdRoot(worktreePath_);
  const synced: string[] = [];
  // ...
}
```

The third layer is .gsd/ state isolation. Each worktree has its own .gsd/ directory containing milestones, roadmaps, decisions, and other planning artifacts. State syncs one-way from main to worktree using syncGsdStateToWorktree(), which only adds missing content -- it never overwrites existing files. The comment says it clearly: the worktree's execution state is authoritative for in-progress work. This means if you modify a ROADMAP.md in your worktree, the main repo's version will not clobber it during sync. Two workstreams can evolve their planning state independently without corrupting each other.

Workspace isolation works through three reinforcing layers. Directory isolation gives each worktree its own working copy under .gsd/worktrees/<name>/, so file edits never collide. Branch isolation assigns each worktree a dedicated worktree/<name> branch with validation that prevents branch sharing. State isolation gives each worktree its own .gsd/ directory with one-way additive sync from main -- the worktree's state is authoritative for in-progress work. Together, these layers mean you can run multiple parallel workstreams with confidence that they will not interfere with each other. In the next lesson, you will learn the lifecycle that creates, manages, and merges these isolated workspaces.

---

## Lesson 6: Workspace Lifecycle

**Objective:** Understand the full workspace lifecycle: create, switch, complete (merge), and resume. Learn how GSD auto-commits before transitions, how switch/return tracks the original directory, and how WorktreeResolver automates the lifecycle for auto-mode.

A workspace has four lifecycle phases: create (set up the isolated environment), switch (move between worktrees), complete (merge back to main), and resume (re-enter an existing worktree). Each phase builds on the isolation you learned in the previous lesson -- create sets up the three isolation layers, switch preserves them while moving between worktrees, complete reconciles them back to main, and resume re-enters an existing worktree without losing state. Let's trace through each phase.

```typescript
async function handleCreate(
  basePath: string,
  name: string,
  ctx: ExtensionCommandContext,
): Promise<void> {
  // Auto-commit dirty files before leaving
  // current workspace
  const commitMsg = autoCommitCurrentBranch(
    basePath, "worktree-switch", name,
  );

  // Create from the main tree
  const mainBase = originalCwd ?? basePath;
  const info = createWorktree(mainBase, name);

  // Run post-create hook -- e.g. copy .env,
  // symlink assets
  const hookError = runWorktreePostCreateHook(
    mainBase, info.path,
  );

  // Track original cwd before switching
  if (!originalCwd) originalCwd = basePath;
  process.chdir(info.path);
}
```

The create flow does four things in sequence. First, it auto-commits any dirty files on the current branch -- this prevents uncommitted work from being lost when you switch away. Second, it calls createWorktree() which sets up the directory, branch, and runs git worktree add. Third, it runs a post-create hook for environment setup -- copying .env files, symlinking shared assets, or anything else your project needs in a fresh worktree. Fourth, it tracks the original working directory (originalCwd) and chdir's into the new worktree. That originalCwd is the key to the return command.

```text
Usage:
  /worktree <name>          create and switch into a new worktree
  /worktree switch <name>   switch into an existing worktree
  /worktree return          switch back to the main project tree
  /worktree list            list all worktrees
  /worktree merge [name] [target]   merge worktree into target branch
  /worktree remove <name|all>       remove a worktree and its branch
```

The /worktree command (aliased as /wt) covers the entire lifecycle. The create-or-switch behavior is smart: if you run /worktree auth-refactor and that worktree exists, it switches to it; if it does not exist, it creates it. The return command takes you back to the main project tree by restoring the originalCwd that was saved during create. GSD tracks this so return always works, even after multiple switches between worktrees. The list command shows all active worktrees with their branches and paths, highlighting which one you are currently in.

```typescript
export interface WorktreeResolverDeps {
  isInAutoWorktree: (
    basePath: string,
  ) => boolean;
  getIsolationMode: () =>
    "worktree" | "branch" | "none";
  mergeMilestoneToMain: (
    basePath: string,
    milestoneId: string,
    roadmapContent: string,
  ) => { pushed: boolean };
  syncWorktreeStateBack: (
    mainBasePath: string,
    worktreePath: string,
    milestoneId: string,
  ) => { synced: string[] };
  teardownAutoWorktree: (
    basePath: string,
    milestoneId: string,
    opts?: { preserveBranch?: boolean },
  ) => void;
  createAutoWorktree: (
    basePath: string,
    milestoneId: string,
  ) => string;
  enterAutoWorktree: (
    basePath: string,
    milestoneId: string,
  ) => string;
}
```

In auto-mode, the WorktreeResolver orchestrates the lifecycle automatically at milestone boundaries. Its dependency interface reveals the full set of operations: createAutoWorktree and enterAutoWorktree handle creation and resumption, mergeMilestoneToMain brings completed work back via squash merge, syncWorktreeStateBack copies worktree state to the project root before teardown, and teardownAutoWorktree removes the worktree directory and optionally the branch. The getIsolationMode function returns 'worktree', 'branch', or 'none' -- the resolver adapts its behavior to whichever mode is configured.

The workspace lifecycle is create, switch/return, merge, and remove. Create auto-commits dirty files, sets up the isolated environment, runs post-create hooks, and tracks the original directory. Switch and return let you move between worktrees while preserving state -- the smart create-or-switch behavior means /worktree <name> always does the right thing. Merge brings work back to main via squash merge, syncing state back to the project root first. In auto-mode, WorktreeResolver manages this entire lifecycle automatically, adapting to the configured isolation mode. In the next lesson, you will learn collaboration patterns -- how review feedback loops and multi-runtime coordination work across workspaces.

---

## Lesson 7: Collaboration Patterns

**Objective:** Understand collaboration patterns in GSD: review feedback loops (read-only structured analysis), multi-runtime coordination (file-system protocol via .gsd/ state), and when to choose workstreams vs sequential milestones.

Collaboration in GSD goes beyond parallel workstreams. It is about structured feedback loops and coordinated work across different AI runtimes. Three patterns make this work: review feedback (read-only analysis that feeds back into development), multi-runtime coordination (different AI tools sharing state through the file system), and the workstreams vs milestones decision (knowing when parallel isolation adds value vs when sequential is simpler). Let's start with the review pattern.

```text
<core_principle>
**FIND REAL ISSUES, NOT STYLE NITS.** Focus on
problems that cause bugs, security vulnerabilities,
performance degradation, or maintainability pain.
Avoid nitpicking formatting or subjective style
preferences unless they harm readability.
</core_principle>

<analysis_only_rule>
**THIS SKILL IS READ-ONLY. DO NOT MODIFY CODE.**

The purpose is to review and report findings.
Making changes during review conflates the
reviewer and author roles. Present findings and
let the user decide what to act on.
</analysis_only_rule>
```

The /review skill is read-only by design -- the reviewer never modifies code. This separation of roles is critical for collaboration: one AI runtime writes code, another reviews it, and neither steps on the other's work. The review analyzes diffs across five categories (security, performance, bugs, code quality, test coverage gaps) and produces structured output with severity ratings, file paths, line numbers, and concrete suggestions. This structured feedback feeds back into the development loop -- the author can address findings in priority order, starting with CRITICAL and HIGH severity issues.

```typescript
export interface WorktreeResolverDeps {
  getIsolationMode: () =>
    "worktree" | "branch" | "none";
  mergeMilestoneToMain: (
    basePath: string,
    milestoneId: string,
    roadmapContent: string,
  ) => { pushed: boolean };
  syncWorktreeStateBack: (
    mainBasePath: string,
    worktreePath: string,
    milestoneId: string,
  ) => { synced: string[] };
}
```

Multi-runtime coordination means different AI runtimes -- Claude Code, Cursor CLI, Gemini CLI, or any tool that understands GSD -- can work on the same project. They coordinate through the file system, not through APIs. The .gsd/ directory is the shared protocol: STATE.md tracks position, ROADMAP.md tracks progress, milestone directories contain plans and summaries. WorktreeResolver ensures consistency by syncing worktree state back to the project root (syncWorktreeStateBack) after each milestone. This means you can start work in one runtime and continue in another -- the .gsd/ state tells the new runtime exactly where things stand.

```text
### When to Use Workstreams vs Sequential Milestones

| Factor             | Sequential Milestones     | Parallel Workstreams       |
|--------------------|---------------------------|----------------------------|
| Work independence  | Tasks depend on each other | Tasks are independent      |
| Risk tolerance     | Low -- linear progress    | Higher -- merge complexity |
| Project size       | Small-medium              | Medium-large               |
| Exploration needed | No -- path is clear       | Yes -- prototyping/spikes  |
| Team/runtime count | Single runtime            | Multiple runtimes          |
| Merge overhead     | None                      | Squash merge per worktree  |

Rule of thumb: if you would create a feature branch
in plain git, use a workstream. If you would just
keep committing to main, use sequential milestones.
```

Sequential milestones are the default and work well for most projects. They are simpler -- no merge overhead, no branch management, linear progress. Workstreams add value in specific situations: when tasks are genuinely independent (e.g., frontend and backend can be built in parallel), when you need to explore alternatives without disrupting main (prototyping spikes), or when multiple runtimes need isolated workspaces. The merge overhead is real -- each worktree requires a squash merge, and conflicts may need LLM-guided resolution. Use workstreams when the isolation benefit clearly outweighs the merge cost.

GSD supports three collaboration patterns. Review feedback provides read-only structured analysis across security, performance, bugs, and quality -- the reviewer never modifies code, maintaining clean role separation. Multi-runtime coordination lets different AI tools work on the same project through .gsd/ state files as a shared file-system protocol, with syncWorktreeStateBack ensuring consistency across transitions. The workstreams vs milestones decision comes down to a rule of thumb: if tasks are independent and you would create a feature branch in plain git, use a workstream; if you would keep committing to main, use sequential milestones. In the next lesson, you will apply everything you have learned in a hands-on mini-project.

---

## Mini-Project: Add Cross-AI Review Orchestration to Skeptic

Extend your skeptic workflow with a cross-AI review orchestrator that dispatches reviews to multiple AI runtimes, aggregates findings with attribution, and formats a unified review report

### Artifacts

#### Skeptic workflow with cross-AI review orchestration

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Defines or lists multiple AI runtimes to dispatch reviews to
- [ ] Dispatches review requests to multiple AI runtimes
- [ ] Collects responses from dispatched runtimes
- [ ] Aggregates or merges findings from multiple review sources
- [ ] Tracks which runtime produced each finding
- [ ] Produces formatted combined review output

### Hints

<details>
<summary>Hint 1</summary>

Your skeptic currently dispatches to one AI. The cross-AI pattern from /gsd:review dispatches the same review prompt to multiple runtimes and combines their perspectives. Think about what your workflow needs to track which runtimes are available and route reviews to each.

</details>

<details>
<summary>Hint 2</summary>

A cross-AI review orchestrator has four parts: (1) a registry of AI runtimes to use, (2) dispatch logic that sends the review to each runtime, (3) collection of responses from all runtimes, (4) aggregation that merges findings with attribution. All four need to appear in your workflow.

</details>

<details>
<summary>Hint 3</summary>

Add a step (or extend existing steps) that lists available runtimes (claude, cursor, gemini), dispatches the current review context to each, collects their responses, and merges findings. Each finding should note which runtime produced it. The aggregation step should deduplicate overlapping findings from different runtimes.

</details>

<details>
<summary>Hint 4</summary>

Create a cross_ai_review step that: (a) defines a runtime registry listing available AI runtimes, (b) for each runtime, formats and dispatches a review prompt with scoped context, (c) collects each runtime's response and findings, (d) aggregates findings across runtimes with deduplication and attribution, (e) formats a unified output report with per-runtime sections.

</details>

<details>
<summary>Hint 5</summary>

In your skeptic workflow, add a cross-AI review mechanism: (a) define a runtime registry (e.g., runtimes: claude, cursor, gemini -- each with invocation method), (b) for each runtime in the registry, dispatch the review prompt with scoped context from your dispatch loop, (c) collect each runtime's response into a results array, (d) aggregate by merging findings, deduplicating overlaps, and attributing each finding to its source runtime, (e) format a unified review report with a section per runtime and a combined findings summary, (f) output the formatted report. The structural checks verify these patterns exist -- the specific runtimes, invocation methods, dedup strategy, and report format are your creative decisions.

</details>

