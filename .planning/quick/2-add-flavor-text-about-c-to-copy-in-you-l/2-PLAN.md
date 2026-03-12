---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - learn/content/modules/command-lifecycle/lessons/01-welcome.json
  - learn/content/modules/command-lifecycle/lessons/02-entry-point.json
  - learn/content/modules/command-lifecycle/lessons/03-dispatch.json
  - learn/content/modules/command-lifecycle/lessons/04-tool-modules.json
  - learn/content/modules/command-lifecycle/lessons/05-state-and-config.json
  - learn/content/modules/command-lifecycle/lessons/06-mini-project.json
autonomous: true
requirements: [QUICK-2]
must_haves:
  truths:
    - "Every lesson's success criteria section mentions pressing 'c' to copy and pasting into an LLM"
    - "Existing success criteria text is preserved unchanged"
    - "All existing tests still pass"
  artifacts:
    - path: "learn/content/modules/command-lifecycle/lessons/01-welcome.json"
      provides: "Updated successCriteria with clipboard hint"
      contains: "press.*c.*copy"
    - path: "learn/content/modules/command-lifecycle/lessons/06-mini-project.json"
      provides: "Updated successCriteria with clipboard hint"
      contains: "press.*c.*copy"
  key_links: []
---

<objective>
Add a clipboard copy hint to the "You'll know you've got it when:" section of every lesson.

Purpose: After Phase 02.1 added the 'c' key to copy lessons to clipboard, learners need to discover this feature. Adding a brief mention in each lesson's success criteria section is the most natural place -- the learner reads it at the end of every lesson and it serves as a gentle nudge toward deeper exploration via their LLM of choice.

Output: All 6 lesson JSON files updated with an appended line in their `successCriteria` field.
</objective>

<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/18182/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

The `successCriteria` field in each lesson JSON is a plain string rendered by:
- `learn/lib/renderer.cjs` (line 89): displays it in the terminal under a green bold "You'll know you've got it when:" heading
- `learn/lib/clipboard-formatter.cjs` (line 99-101): renders it under a markdown "## You'll know you've got it when:" heading

Current `successCriteria` values:
- Lesson 01: "You can describe GSD's four-layer architecture (entry point, router, tool modules, output) and explain why it uses zero dependencies and a CLI interface instead of a library"
- Lesson 02: "You can explain how --cwd and --raw flags are parsed and spliced from args, why eager module loading is used, and how the error function provides fail-fast behavior"
- Lesson 03: "You can trace how a command string like 'state advance-plan' flows through the two-level dispatch, and explain why GSD uses a switch statement instead of a command registry"
- Lesson 04: "You can explain the cmd* vs internal function distinction, the output/error exit pattern, the 50KB buffer workaround, and why loadConfig always returns a valid object with defaults"
- Lesson 05: "You can explain the stateExtractField/stateReplaceField regex pattern, why writeStateMd syncs YAML frontmatter on every write, and how config-set handles dot notation with type coercion"
- Lesson 06: "Running --verify shows all checks passing: file exists, function exported, switch case added, output follows GSD pattern"
</context>

<tasks>

<task type="auto">
  <name>Task 1: Append clipboard hint to successCriteria in all 6 lesson JSON files</name>
  <files>
    learn/content/modules/command-lifecycle/lessons/01-welcome.json
    learn/content/modules/command-lifecycle/lessons/02-entry-point.json
    learn/content/modules/command-lifecycle/lessons/03-dispatch.json
    learn/content/modules/command-lifecycle/lessons/04-tool-modules.json
    learn/content/modules/command-lifecycle/lessons/05-state-and-config.json
    learn/content/modules/command-lifecycle/lessons/06-mini-project.json
  </files>
  <action>
    For each of the 6 lesson JSON files, update the `successCriteria` string by appending a newline and a clipboard hint. The pattern is:

    Original: "{existing criteria text}"
    Updated:  "{existing criteria text}\n\nWant to go deeper? Press [c] to copy this lesson to your clipboard and paste it into your favorite LLM for follow-up questions."

    Important details:
    - Preserve the existing text exactly as-is -- only append to it
    - Use a literal `\n\n` (JSON-escaped newline) to separate the original text from the new line
    - The hint text must be identical across all 6 lessons (consistent UX)
    - Keep the JSON formatting (2-space indent) consistent with the existing files
    - Do NOT modify any other fields in the JSON files
  </action>
  <verify>
    <automated>cd C:/Users/18182/documents/get-shit-done && node -e "const fs=require('fs'); const dir='learn/content/modules/command-lifecycle/lessons'; const files=fs.readdirSync(dir).filter(f=>f.endsWith('.json')); let ok=true; for(const f of files){const d=JSON.parse(fs.readFileSync(dir+'/'+f,'utf8')); if(!d.successCriteria.includes('Press [c] to copy')){console.error('MISSING hint in '+f);ok=false;}} if(ok)console.log('All 6 lessons have clipboard hint'); process.exit(ok?0:1)" && node learn/tests/lessons.test.cjs && node learn/tests/renderer.test.cjs && node learn/tests/clipboard-formatter.test.cjs</automated>
  </verify>
  <done>All 6 lesson JSON files have their successCriteria field ending with the clipboard copy hint. All existing tests pass without modification.</done>
</task>

</tasks>

<verification>
- All 6 lesson files contain "Press [c] to copy" in their successCriteria field
- Existing successCriteria text is preserved verbatim before the appended hint
- `node learn/tests/lessons.test.cjs` passes
- `node learn/tests/renderer.test.cjs` passes
- `node learn/tests/clipboard-formatter.test.cjs` passes
</verification>

<success_criteria>
Every lesson's "You'll know you've got it when:" section displays both the original success criteria AND the clipboard copy hint when viewed in the terminal or copied to clipboard.
</success_criteria>

<output>
After completion, create `.planning/quick/2-add-flavor-text-about-c-to-copy-in-you-l/2-SUMMARY.md`
</output>
