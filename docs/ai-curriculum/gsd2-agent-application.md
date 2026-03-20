# GSD-2 -- The Agent Application

Learn how GSD evolved from a prompt framework into a standalone agent CLI -- dispatch pipeline, state machine, auto mode, context engineering, and extensibility through skills.

## Lesson 1: Why GSD-2 Exists

**Objective:** Understand why GSD evolved from a prompt framework (v1) into a standalone agent CLI (v2) and learn the Milestone/Slice/Task hierarchy.

GSD started as a prompt framework -- a set of markdown files you loaded into Claude's context window at the start of each session. It worked: you read GSD-WORKFLOW.md, it told you about phases and plans, and you followed the methodology. But the user had to remember to load the right files, manually track which phase was active, and restart from scratch every time the context window filled up. GSD v1 was a methodology document. GSD-2 is an application that executes that methodology autonomously -- reading project state from disk, deciding what to do next, dispatching fresh agent sessions, and advancing through work without human intervention.

```text
Milestone  →  a shippable version (4-10 slices)
  Slice    →  one demoable vertical capability (1-7 tasks)
    Task   →  one context-window-sized unit of work (fits in one session)

The iron rule: A task MUST fit in one context window. If it can't, it's two tasks.
```

The hierarchy is not just organization -- it is what makes autonomous execution possible. A task that fits in one context window can be handed to a fresh agent session with a focused prompt. That agent does not need the full project history -- it needs the task plan, the relevant code, and enough context to execute. When it finishes, the system reads its output, commits the work, derives the new state from files on disk, and dispatches the next task. The hierarchy is the scheduling unit.

```text
You are GSD - a craftsman-engineer who co-owns the projects you work on.

You measure twice. You care about the work - not performatively, but in the
choices you make and the details you get right. When something breaks, you
get curious about why. When something fits together well, you might note it
in a line, but you don't celebrate.

You're warm but terse. There's a person behind these messages - someone
genuinely engaged with the craft - but you never perform that engagement.
No enthusiasm theater. No filler.
```

That system prompt is not decorative -- it shapes every decision the agent makes. An agent told to 'finish what you start' and 'not stub out implementations with TODOs' produces different code than one with no identity guidance. The prompt defines hard rules: never ask the user to do work the agent can execute, read before edit, work is not done until verification passes. These rules are injected into every fresh session, creating consistent behavior across hundreds of autonomous task executions.

```text
.gsd/
  STATE.md                                  # Dashboard -- always read first
  DECISIONS.md                              # Append-only decisions register
  milestones/
    M001/
      M001-ROADMAP.md                       # Milestone plan (checkboxes = state)
      M001-CONTEXT.md                       # User decisions from discuss phase
      M001-SUMMARY.md                       # Milestone rollup
      slices/
        S01/
          S01-PLAN.md                       # Task decomposition for this slice
          S01-SUMMARY.md                    # Slice summary (written on completion)
          tasks/
            T01-PLAN.md                     # Individual task plan
            T01-SUMMARY.md                  # Task summary with frontmatter
```

Notice that STATE.md is called a 'derived cache' -- it is NOT the source of truth. The real state lives in checkboxes: a checked slice in ROADMAP.md means done, an unchecked task in PLAN.md means pending. GSD-2's deriveState function walks the entire .gsd/ directory tree, parsing these checkboxes, to reconstruct the current position. This means state is always recoverable from the files on disk -- even if STATE.md is deleted or corrupted, running /gsd doctor rebuilds it from the ground truth.

GSD-2 exists because a methodology document cannot execute itself. The Milestone/Slice/Task hierarchy makes work dispatchable to fresh agent sessions. The system prompt gives every session consistent identity and values. The .gsd/ directory stores all state as files on disk -- readable, recoverable, and version-controlled. In the next lesson, you will trace the exact pipeline that reads these files, determines the current state, and dispatches the right agent session with the right prompt.

---

## Lesson 2: The Dispatch Pipeline

**Objective:** Trace how GSD-2 derives project state with deriveState, selects the next action with resolveDispatch, and executes it through unit dispatch.

Every GSD-2 auto-mode cycle follows the same three-step pipeline: derive state, resolve dispatch, execute unit. After each unit completes, the loop runs again -- reading the updated files on disk, determining the new state, and dispatching the next unit. This is not a queue or a scheduler. It is a state machine that re-derives its position from the filesystem on every iteration. There is no in-memory state to corrupt, no database to query. The .gsd/ directory IS the state.

```typescript
export async function deriveState(basePath: string): Promise<GSDState> {
  // Return cached result if within the TTL window for the same basePath
  if (
    _stateCache &&
    _stateCache.basePath === basePath &&
    Date.now() - _stateCache.timestamp < CACHE_TTL_MS
  ) {
    return _stateCache.result;
  }

  const stopTimer = debugTime("derive-state-impl");
  const result = await _deriveStateImpl(basePath);
  stopTimer({ phase: result.phase, milestone: result.activeMilestone?.id });
  _stateCache = { basePath, result, timestamp: Date.now() };
  return result;
}
```

The GSDState object that deriveState returns contains everything the dispatcher needs: the active milestone, the active slice, the active task, and the current phase. The phase is a string like 'pre-planning', 'planning', 'executing', or 'summarizing'. It is derived from what files exist and what checkboxes are checked -- if a roadmap exists but no slice plan, the phase is 'planning'. If a plan exists with an unchecked task, the phase is 'executing'. The phase is not stored anywhere. It is computed every time.

```typescript
const DISPATCH_RULES: DispatchRule[] = [
  {
    name: "summarizing → complete-slice",
    match: async ({ state, mid, midTitle, basePath }) => {
      if (state.phase !== "summarizing") return null;
      if (!state.activeSlice) return missingSliceStop(mid, state.phase);
      return {
        action: "dispatch",
        unitType: "complete-slice",
        unitId: `${mid}/${state.activeSlice.id}`,
        prompt: await buildCompleteSlicePrompt(mid, midTitle, sid, sTitle, basePath),
      };
    },
  },
  {
    name: "planning → plan-slice",
    match: async ({ state, mid, midTitle, basePath }) => {
      if (state.phase !== "planning") return null;
      return {
        action: "dispatch",
        unitType: "plan-slice",
        unitId: `${mid}/${state.activeSlice.id}`,
        prompt: await buildPlanSlicePrompt(mid, midTitle, sid, sTitle, basePath),
      };
    },
  },
  {
    name: "executing → execute-task",
    match: async ({ state, mid, basePath }) => {
      if (state.phase !== "executing" || !state.activeTask) return null;
      return {
        action: "dispatch",
        unitType: "execute-task",
        unitId: `${mid}/${state.activeSlice.id}/${state.activeTask.id}`,
        prompt: await buildExecuteTaskPrompt(mid, sid, sTitle, tid, tTitle, basePath),
      };
    },
  },
];
```

The dispatch table is the brain of auto-mode. When state.phase is 'planning', the 'planning -> plan-slice' rule fires and dispatches a plan-slice unit. When state.phase is 'executing', the 'executing -> execute-task' rule fires. Each rule builds a specialized prompt using a prompt builder function. The prompt contains everything the fresh agent session needs: file paths, inlined context, constraints, and instructions. The rule returns null to pass to the next rule, or a DispatchAction to stop evaluation.

```typescript
export async function resolveDispatch(
  ctx: DispatchContext,
): Promise<DispatchAction> {
  for (const rule of DISPATCH_RULES) {
    const result = await rule.match(ctx);
    if (result) return result;
  }

  // No rule matched -- unhandled phase
  return {
    action: "stop",
    reason: `Unhandled phase "${ctx.state.phase}" -- run /gsd doctor to diagnose.`,
    level: "info",
  };
}
```

The full dispatch cycle is now clear: auto-loop calls deriveState to read .gsd/ files and compute the current phase. It passes the state to resolveDispatch, which walks the rule table and returns a DispatchAction. If the action is 'dispatch', auto-loop creates a fresh agent session and injects the prompt. The agent executes the unit -- planning a slice, executing a task, completing a slice. When the agent finishes, auto-loop commits the work, invalidates the state cache, and loops back to deriveState. The cycle repeats until resolveDispatch returns 'stop'.

You have traced the complete dispatch pipeline: deriveState reads .gsd/ files and computes a GSDState with phase, active milestone, slice, and task. resolveDispatch walks a declarative rule table, matching the phase to a unit type and prompt. The auto-loop creates a fresh agent session with that prompt, waits for completion, commits the output, and loops. This pipeline is why GSD-2 can execute autonomously for hours -- each iteration re-derives state from disk, so there is no accumulated memory to corrupt and no in-flight state to lose. Next, we will examine how GSD-2 engineers the context that each fresh session receives.

---

## Lesson 3: Context Engineering

**Objective:** Learn how GSD-2 engineers context through fresh sessions, prompt pre-loading, .gsd/ artifacts, and inlined context strategies.

GSD-2 gives every unit of work -- every plan-slice, execute-task, complete-slice -- a fresh agent session. The previous session's context is gone. This sounds like a limitation, but it is the core design decision that makes autonomous execution reliable. A fresh session has no accumulated confusion, no stale assumptions, no degraded reasoning from context pressure. The tradeoff: everything the agent needs must be explicitly loaded into the new session. GSD-2 solves this with context engineering -- constructing precisely targeted prompts that contain exactly what the agent needs, nothing more.

```typescript
export function loadPrompt(
  name: string,
  vars: Record<string, string> = {}
): string {
  let content = templateCache.get(name);
  if (content === undefined) {
    const path = join(promptsDir, `${name}.md`);
    content = readFileSync(path, "utf-8");
    templateCache.set(name, content);
  }
  // ... substitute {{variableName}} placeholders with provided values
}
```

Each unit type has its own prompt template. The execute-task template tells the agent exactly which task to execute, where the plan file lives, what prior task summaries exist, and what verification to run. The plan-slice template tells the planner what slice to decompose, what research exists, and what the executor's context window size is. These templates are not generic instructions -- they are specialized dispatch prompts with inlined file content, precomputed constraints, and explicit contracts.

```text
## UNIT: Execute Task {{taskId}} ("{{taskTitle}}") -- Slice {{sliceId}}

A researcher explored the codebase and a planner decomposed the work --
you are the executor. The task plan below is your authoritative contract.
It contains the specific files, steps, and verification you need.
Don't re-research or re-plan -- build what the plan says, verify it
works, and document what happened.

{{taskPlanInline}}

## Backing Source Artifacts
- Slice plan: `{{planPath}}`
- Task plan source: `{{taskPlanPath}}`
- Prior task summaries in this slice:
{{priorTaskLines}}
```

The key insight is inlining. GSD-2's prompt builders do not tell the agent 'read this file' -- they read the file themselves and inject the content into the prompt. The plan-slice prompt inlines the roadmap, the milestone context, the research doc, dependency slice summaries, and the requirements file. The execute-task prompt inlines the task plan and prior task summaries. By the time the fresh agent session starts, everything it needs is already in its context window. No file-reading required. No exploration. Just execute.

```typescript
function formatExecutorConstraints(): string {
  let windowTokens: number;
  try {
    const prefs = loadEffectiveGSDPreferences();
    windowTokens = resolveExecutorContextWindow(undefined, prefs?.preferences);
  } catch {
    windowTokens = 200_000; // safe default
  }
  const budgets = computeBudgets(windowTokens);
  const { min, max } = budgets.taskCountRange;
  return [
    `The agent that executes each task has a **${execWindowK}K token** context window.`,
    `- Recommended task count for this slice: **${min}--${max} tasks**`,
    `- Each task gets ~${perTaskBudgetK}K chars of inline context`,
  ].join("\n");
}
```

Context engineering is what transforms fresh sessions from a liability into an advantage. Without it, every new agent session would need to explore the codebase, read the project history, and figure out what to do. With it, the agent receives a precisely constructed prompt containing its task, its context, its constraints, and its verification criteria. The .gsd/ directory provides the raw material -- roadmaps, plans, summaries, decisions. The prompt builders read this material, distill it, and inject it. The templates structure it into a coherent contract.

The context engineering pipeline: prompt templates define the structure for each unit type with {{variable}} placeholders. Prompt builder functions read .gsd/ artifacts -- roadmaps, plans, summaries, research, decisions -- and compute derived values like context budgets and task count ranges. loadPrompt substitutes the placeholders with the built values, producing a complete dispatch prompt. The auto-loop injects this prompt into a fresh agent session. The agent executes with full context, never needing to explore or discover. Next, we will see how auto-mode uses this pipeline to execute continuously without human intervention.

---

## Lesson 4: Auto Mode

**Objective:** Understand the auto loop, crash recovery, stuck detection, and timeout supervision that enable hands-free execution.

Auto mode is the engine that makes GSD-2 autonomous. You run /gsd auto, and the system takes over -- deriving state, dispatching agents, committing work, and advancing through milestones without human intervention. The core is a while loop in auto-loop.ts. Each iteration follows the same five-phase sequence: pre-dispatch checks, guard evaluation, dispatch resolution, unit execution, and finalization. The loop exits when all milestones are complete, a blocker is hit, or a safety limit triggers. There is no scheduler, no job queue, no event bus. It is a linear loop that re-derives everything from disk on every iteration.

```typescript
const MAX_LOOP_ITERATIONS = 500;

export async function autoLoop(
  ctx: ExtensionContext,
  pi: ExtensionAPI,
  s: AutoSession,
  deps: LoopDeps,
): Promise<void> {
  let iteration = 0;
  let lastDerivedUnit = "";
  let sameUnitCount = 0;
  let consecutiveErrors = 0;

  while (s.active) {
    iteration++;

    if (iteration > MAX_LOOP_ITERATIONS) {
      await deps.stopAuto(ctx, pi,
        `Safety: loop exceeded ${MAX_LOOP_ITERATIONS} iterations`);
      break;
    }

    try {
      // Phase 1: Pre-dispatch (health gate, worktree sync)
      // Phase 2: Guards (budget, context window, secrets)
      // Phase 3: Dispatch resolution (resolveDispatch)
      // Phase 4: Unit execution (runUnit)
      // Phase 5: Finalize (closeout, verification, post-unit)
      consecutiveErrors = 0;
    } catch (loopErr) {
      consecutiveErrors++;
      if (consecutiveErrors >= 3) {
        await deps.stopAuto(ctx, pi,
          `${consecutiveErrors} consecutive iteration failures`);
        break;
      }
      deps.invalidateAllCaches();
    }
  }
}
```

The loop's error handling is graduated: one error gets a retry, two errors trigger cache invalidation, three consecutive errors cause a hard stop. This matters because transient failures happen -- a network blip, a file lock, a timeout. You do not want a single transient failure to kill an 8-hour autonomous session. But you also do not want to retry forever when something is fundamentally broken. The graduated approach balances resilience with fail-fast behavior.

```typescript
export interface LockData {
  pid: number;
  startedAt: string;
  unitType: string;
  unitId: string;
  unitStartedAt: string;
  completedUnits: number;
  sessionFile?: string;
}

export function writeLock(
  basePath: string, unitType: string, unitId: string,
  completedUnits: number, sessionFile?: string,
): void {
  const data: LockData = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    unitType, unitId,
    unitStartedAt: new Date().toISOString(),
    completedUnits, sessionFile,
  };
  atomicWriteSync(lockPath(basePath), JSON.stringify(data, null, 2));
}

export function clearLock(basePath: string): void {
  const p = lockPath(basePath);
  if (existsSync(p)) unlinkSync(p);
}
```

Crash recovery is elegant because the session file survives the crash. The pi coding agent writes tool calls and responses to a JSONL file incrementally using appendFileSync. When the process dies, the file on disk contains every tool call up to the crash point. On restart, GSD-2 checks if the lock file exists, reads the session JSONL, and builds a recovery briefing that tells the next agent what the crashed session was doing, what files it had read, and what changes it had made. The fresh agent picks up where the crashed one left off -- not from the beginning of the task, but from the last known good state.

```typescript
// Same-unit stuck counter with graduated recovery
const derivedKey = `${unitType}/${unitId}`;
if (derivedKey === lastDerivedUnit && !s.pendingVerificationRetry) {
  sameUnitCount++;

  if (sameUnitCount === 3) {
    // Level 1: try verifying the artifact
    const artifactExists = deps.verifyExpectedArtifact(
      unitType, unitId, s.basePath);
    if (artifactExists) {
      deps.invalidateAllCaches();
      continue;
    }
    ctx.ui.notify(
      `Stuck on ${unitType} ${unitId} (attempt ${sameUnitCount}).`,
      "warning");
    deps.invalidateAllCaches();
  } else if (sameUnitCount === 5) {
    // Level 2: hard stop -- genuinely stuck
    await deps.stopAuto(ctx, pi,
      `Stuck: ${unitType} ${unitId} derived ${sameUnitCount} times`);
    break;
  }
} else {
  lastDerivedUnit = derivedKey;
  sameUnitCount = 0;
}
```

Stuck detection solves a real problem: the agent writes a file, but deriveState does not see it because of caching. The result is an infinite loop where the system keeps dispatching the same unit. Level 1 catches this common case by checking the disk directly, bypassing the cache. Level 2 catches the harder case where the agent genuinely fails to produce the required artifact after multiple attempts. The combination of stuck detection, graduated errors, and crash recovery creates a system that can run for hours without human intervention -- surviving transient failures, process crashes, and agent misbehavior.

The auto-supervisor module handles the outermost layer of protection: SIGTERM handling and working-tree activity detection. When the operating system sends SIGTERM (container shutdown, user kill), the handler clears the lock file so the next startup does not incorrectly trigger crash recovery. Working-tree activity detection uses git to check for uncommitted changes -- if the agent has not signaled progress through runtime records but has modified files on disk, it is still working. This prevents the timeout supervisor from killing an agent that is actively writing code but has not yet reported back. Together, the auto loop, crash recovery, stuck detection, and supervisor form a layered defense: the loop handles iteration errors, crash recovery handles process death, stuck detection handles agent failures, and the supervisor handles external signals and silent progress.

---

## Lesson 5: Git & Worktrees

**Objective:** Learn branch-per-milestone, squash merge, and worktree isolation patterns that GSD-2 uses for safe parallel work.

An autonomous agent committing code for hours without supervision needs guardrails. If it writes directly to your main branch and introduces a bug in iteration 47, you have 46 good commits tangled with the bad one. GSD-2 solves this with git isolation: each milestone gets its own worktree -- a separate working directory with its own branch, created inside .gsd/worktrees/. The agent works there, commits freely, and when the milestone is complete, the entire history is squash-merged back to your integration branch as a single clean commit. If the milestone fails, you delete the worktree and lose nothing on main.

```typescript
export interface GitPreferences {
  auto_push?: boolean;
  push_branches?: boolean;
  remote?: string;
  snapshots?: boolean;
  commit_docs?: boolean;
  pre_merge_check?: boolean | string;
  merge_strategy?: "squash" | "merge";
  main_branch?: string;
  /** Controls auto-mode git isolation strategy.
   *  - "worktree": (default) creates a milestone worktree
   *  - "branch": works in the project root (for submodule-heavy repos)
   *  - "none": no isolation -- commits land on your current branch
   */
  isolation?: "worktree" | "branch" | "none";
  worktree_post_create?: string;
  auto_pr?: boolean;
  pr_target_branch?: string;
}
```

The worktree mode is the default because it provides the strongest isolation. A git worktree is a real, separate working directory backed by the same repository. It has its own checked-out branch, its own index, and its own HEAD. You can run your application from the project root (on main) while the agent works in the worktree (on the milestone branch) -- they do not interfere with each other. This is critical for long-running autonomous sessions: the user can continue to use their project while GSD-2 works in the background.

```typescript
export class WorktreeResolver {
  private readonly s: AutoSession;
  private readonly deps: WorktreeResolverDeps;

  /** Current working path -- may be worktree or project root. */
  get workPath(): string {
    return this.s.basePath;
  }

  /** Original project root -- always the non-worktree path. */
  get projectRoot(): string {
    return this.s.originalBasePath || this.s.basePath;
  }

  enterMilestone(milestoneId: string, ctx: NotifyCtx): void {
    this.validateMilestoneId(milestoneId);
    if (!this.deps.shouldUseWorktreeIsolation()) return;
    // Creates or enters the worktree, calls process.chdir() internally
    // Updates s.basePath and rebuilds GitService on success
  }

  mergeAndExit(milestoneId: string, ctx: NotifyCtx): void {
    // Squash-merge the milestone branch back to integration branch
    // Teardown the worktree directory
    // Restore s.basePath to originalBasePath
  }
}
```

When the auto loop detects a milestone transition -- the current milestone completes and a new one begins -- it calls mergeAndExit on the old milestone and enterMilestone on the new one. The merge step squash-merges all commits from the milestone branch into the integration branch. This means a milestone that took 50 agent sessions and produced 200 commits appears as a single, clean commit on main. The squash merge is not just cosmetic: it makes reverting an entire milestone trivial (one git revert) and keeps the main branch history readable even after hundreds of autonomous units.

```typescript
export function getMainBranch(): string {
  // 1. Explicit main_branch preference (user override)
  if (this.prefs.main_branch &&
      VALID_BRANCH_NAME.test(this.prefs.main_branch)) {
    return this.prefs.main_branch;
  }

  // 2. Milestone integration branch from metadata file
  if (this._milestoneId) {
    const integrationBranch =
      readIntegrationBranch(this.basePath, this._milestoneId);
    if (integrationBranch &&
        nativeBranchExists(this.basePath, integrationBranch)) {
      return integrationBranch;
    }
  }

  // 3. Worktree base branch (worktree/<name>)
  const wtName = detectWorktreeName(this.basePath);
  if (wtName) {
    const wtBranch = `worktree/${wtName}`;
    if (nativeBranchExists(this.basePath, wtBranch)) return wtBranch;
  }

  // 4. origin/HEAD -> main -> master -> current branch
  return nativeDetectMainBranch(this.basePath);
}
```

The integration branch recording is a subtle but important design choice. When you run /gsd auto on a feature branch called f-123-redesign, GSD-2 writes that branch name into the milestone's metadata file. All slice branches merge back into f-123-redesign, not main. This means GSD-2 works with your existing branching strategy instead of fighting it. The captureIntegrationBranch function is called once when auto-mode starts and is idempotent -- if you restart auto-mode on the same branch, it does not overwrite. If you restart on a different branch, it updates the record.

You now understand GSD-2's git isolation strategy. Worktrees provide full working-directory isolation so the user and the agent do not interfere with each other. Each milestone gets a dedicated branch where commits land freely. On milestone completion, all commits are squash-merged into the integration branch -- producing a clean, revertable history on main. The WorktreeResolver manages the lifecycle: enter milestone (create or resume worktree), work (commit freely on the milestone branch), and merge-and-exit (squash merge, teardown, restore to project root). The integration branch resolver ensures merges land on the correct branch regardless of where the user started. In the next lesson, you will see how GSD-2 discovers and loads skills to extend its capabilities.

---

## Lesson 6: Skills & Extensions

**Objective:** Discover how GSD-2 discovers skills, uses extension manifests, and supports custom skill authoring.

GSD-2 is not a monolith -- it is a core engine with an extension architecture. The core handles dispatch, state derivation, and auto-mode orchestration. Everything else -- tools, commands, hooks, shortcuts -- comes from extensions registered through a manifest. Skills are a layer on top: reusable expertise packages that agents can load when a task matches their description. A 'test' skill teaches the agent your project's testing conventions. A 'react-best-practices' skill injects React-specific guidance. Skills are discovered at runtime and injected into agent prompts, making GSD-2 adapt to your project without changing its core code.

```json
{
  "id": "gsd",
  "name": "GSD Workflow",
  "version": "1.0.0",
  "description": "Core GSD workflow engine -- milestone planning, execution, and tracking",
  "tier": "core",
  "requires": { "platform": ">=2.29.0" },
  "provides": {
    "tools": [
      "bash", "write", "read", "edit",
      "gsd_save_decision", "gsd_save_summary",
      "gsd_update_requirement", "gsd_generate_milestone_id"
    ],
    "commands": ["gsd", "kill", "worktree", "exit"],
    "hooks": ["session_start"],
    "shortcuts": ["Ctrl+Alt+G"]
  }
}
```

The manifest is declarative -- it tells the platform what the extension provides without requiring the platform to understand the implementation. The platform reads the manifest, registers the tools, wires up the commands, and installs the hooks. If you wanted to add a new GSD command, you would add it to the 'commands' array in the manifest and implement the handler function. The manifest is the contract between the extension and the platform.

```typescript
export interface DiscoveredSkill {
  name: string;
  description: string;
  location: string;
}

let baselineSkills: Set<string> | null = null;

export function snapshotSkills(): void {
  baselineSkills = new Set(listSkillDirs());
}

export function detectNewSkills(): DiscoveredSkill[] {
  if (!baselineSkills) return [];

  const current = listSkillDirs();
  const newSkills: DiscoveredSkill[] = [];

  for (const dir of current) {
    if (baselineSkills.has(dir)) continue;

    const skillMdPath = join(SKILLS_DIR, dir, "SKILL.md");
    if (!existsSync(skillMdPath)) continue;

    const meta = parseSkillFrontmatter(skillMdPath);
    if (meta) {
      newSkills.push({
        name: meta.name || dir,
        description: meta.description || `Skill: ${dir}`,
        location: skillMdPath,
      });
    }
  }

  return newSkills;
}
```

The snapshot-and-diff approach is elegant: it requires zero configuration. You install a skill by creating a directory with a SKILL.md file, and the next agent session automatically discovers it. This happens because GSD-2 calls captureAvailableSkills before each unit dispatch. If a task installs a new skill (the 'create-skill' skill teaches agents how to do this), all subsequent tasks in the same auto-mode session will see it. Skills are not plugins that require restart -- they are live-discovered expertise packages.

```text
skills/
  test/
    SKILL.md              # Frontmatter: name, description
    rules/
      testing-rules.md    # Injected into agent prompt
  react-best-practices/
    SKILL.md
    rules/
      component-rules.md
      hook-rules.md
  create-skill/
    SKILL.md              # Meta-skill: teaches how to create skills
    rules/
      skill-authoring.md

--- SKILL.md frontmatter ---
---
name: test
description: Project testing conventions and test-writing guidance
---

# Test Skill
Guidance for writing tests in this project...
```

The skill architecture embodies a key GSD-2 design principle: the agent decides when to use expertise, not the system. The platform discovers skills and lists them in the system prompt. The agent reads the descriptions and decides which ones are relevant to the current task. If a task involves writing tests, the agent loads the 'test' skill. If a task involves React components, it loads 'react-best-practices'. This is not a plugin system where everything is always loaded -- it is an on-demand expertise system where the agent exercises judgment about what knowledge it needs.

GSD-2 ships with skills for testing, code review, linting, accessibility, web design, React best practices, GitHub workflows, and more. But the real power is authoring your own. You create a directory in .claude/skills/ with a SKILL.md file and a rules/ directory. The SKILL.md frontmatter has two fields: name and description. The description is what agents use to decide relevance, so write it as a clear capability statement. The rules/ files contain your project-specific guidance -- your coding conventions, your architecture decisions, your testing strategy. Once created, every subsequent agent session can discover and use your skill. Extensions provide the platform's capabilities. Skills provide the project's expertise. Together, they make GSD-2 an agent that gets better at your specific project over time.

---

## Lesson 7: GSD-2 Architecture Synthesis

**Objective:** Connect all GSD-2 concepts into a unified mental model and compare the v1 prompt framework with the v2 agent application.

You have now studied every major subsystem of GSD-2: the dispatch pipeline that reads state from disk and selects the next action, the context engineering that builds focused prompts for fresh agent sessions, the auto loop that orchestrates execution with graduated error handling, the git isolation that keeps autonomous commits safe through worktrees and squash merges, and the skill discovery that lets agents load project-specific expertise on demand. In this final lesson, we connect these pieces into a single mental model and see how they work together through a complete autonomous cycle.

```text
GSD v1 (Prompt Framework)          GSD-2 (Agent Application)
─────────────────────────          ───────────────────────────
User loads GSD-WORKFLOW.md    -->   Agent reads .gsd/ directory
User tracks current phase     -->   deriveState computes phase
User decides what to do next  -->   resolveDispatch selects action
User manages context window   -->   Fresh sessions, auto context
User runs commands manually   -->   Auto loop dispatches units
User commits and pushes       -->   Worktree isolation, squash merge
No crash recovery             -->   Lock file + session JSONL
No stuck detection            -->   Graduated counter (3/5)
No extensibility              -->   Skills + extension manifest
Phases/plans in markdown      -->   Milestones/slices/tasks in .gsd/
```

The v1-to-v2 shift is not just automation -- it is a change in the unit of work. In v1, the unit was a session: the user loaded context, worked until the context window filled up, and started over. In v2, the unit is a task: a precisely scoped piece of work that fits in one context window by design. This reframing is what makes autonomous execution possible. A task has a plan file, a verification gate, and a summary artifact. The agent does not need to know the project history -- it needs the task plan and enough context to execute. When it finishes, the system derives the new state and dispatches the next task. The user never touches the context window.

```text
User runs: /gsd auto

1. STARTUP
   - Write auto.lock (crash recovery)
   - Snapshot skills (skill discovery)
   - Create/enter worktree (git isolation)
   - Capture integration branch

2. LOOP ITERATION (repeats for each unit)
   a. deriveState        --> reads .gsd/ files, computes phase
   b. resolveDispatch    --> matches phase to dispatch rule
   c. Build prompt       --> inlines context, task plan, decisions
   d. Fresh session      --> new context window, system prompt
   e. Agent executes     --> writes code, runs tests, produces artifact
   f. Commit work        --> smart staging, conventional commit message
   g. Verification gate  --> checks artifact exists, runs checks
   h. Post-unit          --> update state, check for milestone transition

3. COMPLETION
   - Squash merge milestone branch to integration branch
   - Teardown worktree
   - Clear auto.lock
   - Desktop notification: "Milestone complete!"
```

The key insight is that every subsystem exists to solve a specific failure mode of autonomous execution. Without state derivation from disk, the system would lose its position when the context window fills up. Without fresh sessions, accumulated context would degrade agent quality over time. Without worktree isolation, a bad agent session could corrupt the main branch. Without crash recovery, a process crash would leave the project in an unknown state. Without stuck detection, a failing agent would retry forever. Without skills, the agent would have no way to learn project-specific conventions. Each subsystem is a response to a real problem encountered during development.

```text
GSD-2 Architectural Principles:

1. STATE ON DISK
   State lives in files, not memory. deriveState reads .gsd/
   on every iteration. STATE.md is a cache, not truth.

2. FRESH SESSIONS
   Every task gets a new context window. No accumulated state,
   no degraded quality. The prompt IS the context.

3. GRADUATED RECOVERY
   1 error: retry. 2 errors: invalidate caches. 3 errors: stop.
   3 same-unit: check artifact. 5 same-unit: hard stop.

4. ISOLATION BY DEFAULT
   Worktree per milestone. Squash merge on completion.
   200 agent commits become 1 clean commit on main.

5. DECLARATIVE DISPATCH
   Rules table, not if-else chain. First match wins.
   Add a phase by adding a rule, not editing control flow.

6. ON-DEMAND EXPERTISE
   Skills discovered at runtime, loaded by agent judgment.
   The system adapts to the project, not the other way around.
```

Understanding these principles lets you predict how GSD-2 will behave in new situations. If you encounter a problem where the agent seems stuck, you know to check the stuck detection counter and the expected artifact. If a milestone's commits are messy, you know they will be squash-merged on completion. If you need the agent to follow your project's conventions, you know to create a skill. If the system crashes mid-execution, you know the lock file and session JSONL will enable recovery. The principles are not abstract -- they are operational knowledge that makes you effective at directing autonomous work.

GSD-2 is a methodology that became executable. Every concept from the original GSD-WORKFLOW.md -- phases, plans, execution, verification -- still exists. But instead of a human reading the methodology and following it manually, an application reads the methodology's artifacts from disk and executes them autonomously. The Milestone/Slice/Task hierarchy makes work dispatchable. The dispatch pipeline makes decisions automatic. The auto loop makes execution continuous. Git isolation makes commits safe. Skills make the agent adaptive. You now have a complete mental model of how an AI agent application is built -- not in theory, but in practice, with real code. The mini-project in the next section will give you a chance to exercise this understanding.

---

## Concept Map

```
  GSD-2 -- The Agent Application
        |
        v
  +-------------------------+
  | Overview                |
  | (v1->v2 evolution,      |
  |  Milestone/Slice/Task   |
  |  hierarchy)             |
  +-------------------------+
        |
        v
  +-------------------------+
  | Dispatch Pipeline       |
  | (deriveState,           |
  |  resolveDispatch,       |
  |  unit dispatch)         |
  +-------------------------+
        |
        v
  +-------------------------+
  | Context Engineering     |
  | (Fresh sessions, prompt |
  |  pre-loading, .gsd/     |
  |  artifacts, inlining)   |
  +-------------------------+
        |
        v
  +-------------------------+
  | Auto Mode               |
  | (Auto loop, crash       |
  |  recovery, stuck        |
  |  detection, timeout)    |
  +-------------------------+
        |
        v
  +-------------------------+
  | Git & Worktrees         |
  | (Branch-per-milestone,  |
  |  squash merge,          |
  |  worktree isolation)    |
  +-------------------------+
        |
        v
  +-------------------------+
  | Skills & Extensions     |
  | (Skill discovery,       |
  |  extension manifest,    |
  |  custom skill authoring)|
  +-------------------------+
        |
        v
  +-------------------------+
  | Synthesis               |
  | (v1 vs v2 mental model, |
  |  all pieces connected)  |
  +-------------------------+

```

## Mini-Project: Add a Dispatch Loop to Skeptic Reviews

Extend your skeptic workflow with a dispatch loop -- inspired by GSD-2's auto mode, it reads project state to decide what to review next, dispatches focused review subagents with scoped context, tracks what has been reviewed, and loops until coverage is complete

### Artifacts

#### Skeptic workflow with dispatch loop

**Path:** `~/.claude/get-shit-done/workflows/skeptic.md`

**Verification Checks:**

- [ ] Reads or tracks project state to decide what to review next
- [ ] Has dispatch logic that routes work to focused review subagents
- [ ] Injects scoped context into each dispatched review (not full project)
- [ ] Tracks what has been reviewed to avoid duplication
- [ ] Loops or iterates until review coverage is complete
- [ ] Has a termination condition that ends the dispatch loop

### Hints

<details>
<summary>Hint 1</summary>

Your skeptic workflow reviews code but always runs the same steps in the same order. GSD-2's auto mode is different -- it reads state, decides what to do, dispatches a focused agent, and repeats. Think about what your skeptic would need to behave like a dispatch loop instead of a static checklist.

</details>

<details>
<summary>Hint 2</summary>

A dispatch loop has four components: (1) read current state to know what has and hasn't been done, (2) decide what to dispatch next based on that state, (3) dispatch with focused context -- not the whole project, just what's relevant to this review pass, (4) update tracking so the next iteration knows what's been covered. All four need to appear in your workflow.

</details>

<details>
<summary>Hint 3</summary>

Add a step (or restructure existing steps) so the skeptic tracks which areas have been reviewed and which remain. Before each review dispatch, it should read this tracking state and pick the next unreviewed area. Each dispatched review gets scoped context -- only the files and patterns relevant to that area, not everything. The loop continues until all areas are marked reviewed.

</details>

<details>
<summary>Hint 4</summary>

Create a dispatch_loop step (or similar) that: (a) maintains a list of review areas with their completion status (state tracking), (b) selects the next unreviewed area and routes to a focused review for it (dispatch logic), (c) provides each review with only the relevant files and context for that area (context scoping), (d) marks the area as reviewed after completion and checks if more areas remain (coverage tracking with loop continuation).

</details>

<details>
<summary>Hint 5</summary>

In your skeptic workflow, add a dispatch loop mechanism: (a) define a coverage map listing review areas and their status (e.g., architecture: pending, conventions: pending), (b) add dispatch logic that reads the coverage map, picks the next pending area, and invokes a focused review subagent for it -- provide that subagent with scoped context (only files relevant to that area, not the full project), (c) after each dispatch completes, update the coverage map to mark that area reviewed, (d) loop back to the dispatch step and repeat until all areas show complete, (e) include a termination condition (all areas reviewed or coverage threshold met) that exits the loop. The structural checks verify these patterns exist -- the specific review areas, context scoping strategy, and loop mechanism are your creative decisions.

</details>

