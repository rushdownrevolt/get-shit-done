'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const {
  renderContentBlock,
  renderLesson,
  renderProjectSpec,
  renderHints,
  renderConceptMap,
  renderModule,
} = require('./markdown-renderer.cjs');

// --- renderContentBlock ---

describe('renderContentBlock', () => {
  it('renders text block as plain paragraph (focus/bridge not rendered)', () => {
    const block = {
      type: 'text',
      value: 'Hello',
      focus: 'Key point',
      bridge: 'Next...',
    };
    assert.equal(renderContentBlock(block), 'Hello\n');
  });

  it('renders code block with language annotation', () => {
    const block = { type: 'code', language: 'yaml', value: 'name: test' };
    assert.equal(renderContentBlock(block), '```yaml\nname: test\n```\n');
  });

  it('renders code block without language if missing', () => {
    const block = { type: 'code', value: 'plain code' };
    assert.equal(renderContentBlock(block), '```\nplain code\n```\n');
  });

  it('renders project-type block as empty string (handled elsewhere)', () => {
    const block = { type: 'project', task: 'Build something' };
    assert.equal(renderContentBlock(block), '');
  });
});

// --- renderLesson ---

describe('renderLesson', () => {
  it('renders heading, objective, content blocks, and separator', () => {
    const lesson = {
      lessonNumber: 1,
      title: 'The Two-Layer Architecture',
      objective: 'Understand the two layers',
      content: [
        { type: 'text', value: 'Paragraph one.' },
        { type: 'code', language: 'yaml', value: 'key: val' },
      ],
    };
    const result = renderLesson(lesson);
    assert.ok(result.startsWith('## Lesson 1: The Two-Layer Architecture\n'));
    assert.ok(result.includes('**Objective:** Understand the two layers\n'));
    assert.ok(result.includes('Paragraph one.\n'));
    assert.ok(result.includes('```yaml\nkey: val\n```\n'));
    assert.ok(result.endsWith('---\n'));
  });
});

// --- renderProjectSpec ---

describe('renderProjectSpec', () => {
  it('renders title, description, artifacts with checklist', () => {
    const spec = {
      title: 'Build /gsd:skeptic',
      description: 'Create a command spec + workflow pair',
      artifacts: [
        {
          description: 'Skeptic command spec',
          path: '~/.claude/commands/gsd/skeptic.md',
          checks: [
            { description: 'Has YAML frontmatter block' },
            { description: 'Has name field set to gsd:skeptic' },
          ],
        },
      ],
    };
    const result = renderProjectSpec(spec);
    assert.ok(result.includes('## Mini-Project: Build /gsd:skeptic\n'));
    assert.ok(result.includes('Create a command spec + workflow pair\n'));
    assert.ok(result.includes('### Artifacts\n'));
    assert.ok(result.includes('#### Skeptic command spec\n'));
    assert.ok(result.includes('**Path:** `~/.claude/commands/gsd/skeptic.md`\n'));
    assert.ok(result.includes('**Verification Checks:**\n'));
    assert.ok(result.includes('- [ ] Has YAML frontmatter block\n'));
    assert.ok(result.includes('- [ ] Has name field set to gsd:skeptic\n'));
  });

  it('renders multiple artifacts', () => {
    const spec = {
      title: 'Test Project',
      description: 'Desc',
      artifacts: [
        { description: 'A1', path: '/a', checks: [{ description: 'c1' }] },
        { description: 'A2', path: '/b', checks: [{ description: 'c2' }] },
      ],
    };
    const result = renderProjectSpec(spec);
    assert.ok(result.includes('#### A1\n'));
    assert.ok(result.includes('#### A2\n'));
  });
});

// --- renderHints ---

describe('renderHints', () => {
  it('renders hints as expandable details/summary blocks', () => {
    const hints = ['First hint text', 'Second hint text'];
    const result = renderHints(hints);
    assert.ok(result.includes('### Hints\n'));
    assert.ok(result.includes('<details>\n<summary>Hint 1</summary>\n\nFirst hint text\n\n</details>\n'));
    assert.ok(result.includes('<details>\n<summary>Hint 2</summary>\n\nSecond hint text\n\n</details>\n'));
  });

  it('renders empty string for empty hints array', () => {
    assert.equal(renderHints([]), '');
  });
});

// --- renderConceptMap ---

describe('renderConceptMap', () => {
  it('renders concept map text in a code fence', () => {
    const text = '  A -> B\n  B -> C';
    const result = renderConceptMap(text);
    assert.equal(result, '## Concept Map\n\n```\n  A -> B\n  B -> C\n```\n');
  });
});

// --- renderModule ---

describe('renderModule', () => {
  it('composes all sections in correct order', () => {
    const mod = {
      title: 'GSD Commands & Workflows',
      description: 'Learn how GSD slash commands dispatch.',
    };
    const lessons = [
      {
        lessonNumber: 2,
        title: 'Lesson Two',
        objective: 'Obj 2',
        content: [{ type: 'text', value: 'L2 content.' }],
      },
      {
        lessonNumber: 1,
        title: 'Lesson One',
        objective: 'Obj 1',
        content: [{ type: 'text', value: 'L1 content.' }],
      },
    ];
    const spec = {
      title: 'Build Something',
      description: 'Build desc',
      artifacts: [
        { description: 'Art1', path: '/art', checks: [{ description: 'check1' }] },
      ],
    };
    const hints = ['Hint A'];
    const conceptMapText = 'A -> B';

    const result = renderModule(mod, lessons, spec, hints, conceptMapText);

    // Title and description first
    assert.ok(result.startsWith('# GSD Commands & Workflows\n\nLearn how GSD slash commands dispatch.\n'));
    // Lessons sorted by lessonNumber (1 before 2)
    const l1Pos = result.indexOf('## Lesson 1: Lesson One');
    const l2Pos = result.indexOf('## Lesson 2: Lesson Two');
    assert.ok(l1Pos < l2Pos, 'Lesson 1 should appear before Lesson 2');
    // Concept map after lessons
    const cmPos = result.indexOf('## Concept Map');
    assert.ok(cmPos > l2Pos, 'Concept map after lessons');
    // Project spec after concept map
    const specPos = result.indexOf('## Mini-Project:');
    assert.ok(specPos > cmPos, 'Project spec after concept map');
    // Hints after spec
    const hintsPos = result.indexOf('### Hints');
    assert.ok(hintsPos > specPos, 'Hints after project spec');
  });

  it('excludes mini-project lesson (last lesson) from lesson rendering', () => {
    const mod = { title: 'Mod', description: 'Desc' };
    const lessons = [
      {
        lessonNumber: 1,
        title: 'Real Lesson',
        objective: 'Obj',
        content: [{ type: 'text', value: 'Content.' }],
      },
      {
        lessonNumber: 6,
        title: 'Mini-Project: Build Something',
        objective: 'Apply everything',
        content: [{ type: 'project', task: 'Build it' }],
      },
    ];
    const spec = {
      title: 'Build Something',
      description: 'Desc',
      artifacts: [],
    };

    const result = renderModule(mod, lessons, spec, [], '');

    assert.ok(result.includes('## Lesson 1: Real Lesson'));
    assert.ok(!result.includes('## Lesson 6:'), 'Mini-project lesson should be excluded');
    assert.ok(!result.includes('Mini-Project: Build Something\n\n**Objective:**'));
  });
});
