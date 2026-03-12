'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { parseMarkdownFile } = require('../lib/markdown-parser.cjs');

// ─── Test fixtures ──────────────────────────────────────────────────────────

const COMMAND_SPEC_CONTENT = `---
name: gsd:echo
description: Repeat text back to user.
allowed-tools:
  - Read
  - Bash
---

<objective>
Simply repeat text back to user.
</objective>

<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/echo.md
</execution_context>

<process>
Execute the echo workflow.

\`\`\`bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" echo
\`\`\`
</process>
`;

const WORKFLOW_CONTENT = `<purpose>
Validate \`.planning/\` directory integrity.
</purpose>

<process>
<step name="parse_args">
**Parse arguments:**
</step>
<step name="run">
**Run:**
\`\`\`bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs echo"
\`\`\`
</step>
</process>
`;

const MULTI_REF_CONTENT = `---
name: gsd:quick
description: Quick planning.
---

<objective>
Run the quick workflow.
</objective>

<execution_context>
@C:/Users/18182/.claude/get-shit-done/workflows/quick.md
@C:/Users/18182/.claude/get-shit-done/templates/summary.md
</execution_context>
`;

const NO_LANG_CODEBLOCK = `---
name: gsd:test
description: Test command.
---

<objective>
Test.
</objective>

<process>
\`\`\`
some code without language
\`\`\`
</process>
`;

// Helper to write a temp file and return its path
function writeTempFile(content, filename) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-parser-test-'));
  const filePath = path.join(tmpDir, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('parseMarkdownFile', () => {
  // --- fileType detection ---

  test('command spec with frontmatter -> fileType command-spec', () => {
    const fp = writeTempFile(COMMAND_SPEC_CONTENT, 'echo.md');
    const result = parseMarkdownFile(fp);
    assert.strictEqual(result.fileType, 'command-spec');
  });

  test('workflow without frontmatter -> fileType workflow', () => {
    const fp = writeTempFile(WORKFLOW_CONTENT, 'validate.md');
    const result = parseMarkdownFile(fp);
    assert.strictEqual(result.fileType, 'workflow');
  });

  // --- frontmatter extraction ---

  test('command spec has populated frontmatter object', () => {
    const fp = writeTempFile(COMMAND_SPEC_CONTENT, 'echo.md');
    const result = parseMarkdownFile(fp);
    assert.strictEqual(result.frontmatter.name, 'gsd:echo');
    assert.strictEqual(result.frontmatter.description, 'Repeat text back to user.');
    assert.deepStrictEqual(result.frontmatter['allowed-tools'], ['Read', 'Bash']);
  });

  test('workflow has empty frontmatter', () => {
    const fp = writeTempFile(WORKFLOW_CONTENT, 'validate.md');
    const result = parseMarkdownFile(fp);
    assert.deepStrictEqual(result.frontmatter, {});
  });

  // --- XML section extraction ---

  test('command spec extracts named sections', () => {
    const fp = writeTempFile(COMMAND_SPEC_CONTENT, 'echo.md');
    const result = parseMarkdownFile(fp);
    assert.ok(result.sections.objective);
    assert.ok(result.sections.objective.includes('repeat text'));
    assert.ok(result.sections.execution_context);
    assert.ok(result.sections.process);
  });

  test('workflow extracts purpose and process sections', () => {
    const fp = writeTempFile(WORKFLOW_CONTENT, 'validate.md');
    const result = parseMarkdownFile(fp);
    assert.ok(result.sections.purpose);
    assert.ok(result.sections.purpose.includes('Validate'));
    assert.ok(result.sections.process);
  });

  test('duplicate XML tags become array', () => {
    const fp = writeTempFile(WORKFLOW_CONTENT, 'validate.md');
    const result = parseMarkdownFile(fp);
    // The workflow has two <step> tags
    assert.ok(Array.isArray(result.sections.step));
    assert.strictEqual(result.sections.step.length, 2);
  });

  // --- file references ---

  test('extracts @C:/ Windows absolute path references', () => {
    const fp = writeTempFile(COMMAND_SPEC_CONTENT, 'echo.md');
    const result = parseMarkdownFile(fp);
    assert.ok(Array.isArray(result.fileReferences));
    assert.ok(result.fileReferences.some(r => r.includes('workflows/echo.md')));
  });

  test('extracts multiple file references', () => {
    const fp = writeTempFile(MULTI_REF_CONTENT, 'quick.md');
    const result = parseMarkdownFile(fp);
    assert.strictEqual(result.fileReferences.length, 2);
    assert.ok(result.fileReferences.some(r => r.includes('quick.md')));
    assert.ok(result.fileReferences.some(r => r.includes('summary.md')));
  });

  // --- code blocks ---

  test('extracts fenced code blocks with language', () => {
    const fp = writeTempFile(COMMAND_SPEC_CONTENT, 'echo.md');
    const result = parseMarkdownFile(fp);
    assert.ok(Array.isArray(result.codeBlocks));
    assert.ok(result.codeBlocks.length >= 1);
    const bashBlock = result.codeBlocks.find(b => b.language === 'bash');
    assert.ok(bashBlock);
    assert.ok(bashBlock.code.includes('gsd-tools'));
  });

  test('code block without language has null language', () => {
    const fp = writeTempFile(NO_LANG_CODEBLOCK, 'test.md');
    const result = parseMarkdownFile(fp);
    assert.ok(result.codeBlocks.length >= 1);
    const noLang = result.codeBlocks.find(b => b.language === null);
    assert.ok(noLang);
    assert.ok(noLang.code.includes('some code without language'));
  });

  // --- body ---

  test('body contains content after frontmatter', () => {
    const fp = writeTempFile(COMMAND_SPEC_CONTENT, 'echo.md');
    const result = parseMarkdownFile(fp);
    assert.ok(result.body.includes('<objective>'));
    assert.ok(!result.body.startsWith('---'));
  });

  test('workflow body is full content', () => {
    const fp = writeTempFile(WORKFLOW_CONTENT, 'validate.md');
    const result = parseMarkdownFile(fp);
    assert.ok(result.body.includes('<purpose>'));
    assert.strictEqual(result.body.trim(), WORKFLOW_CONTENT.trim());
  });

  // --- metadata ---

  test('result includes filePath and fileName', () => {
    const fp = writeTempFile(COMMAND_SPEC_CONTENT, 'echo.md');
    const result = parseMarkdownFile(fp);
    assert.strictEqual(result.filePath, fp);
    assert.strictEqual(result.fileName, 'echo.md');
  });

  // --- error handling ---

  test('missing file throws descriptive error', () => {
    assert.throws(
      () => parseMarkdownFile('/nonexistent/path/fake.md'),
      (err) => err.message.includes('fake.md')
    );
  });
});
