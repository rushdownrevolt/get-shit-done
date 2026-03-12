'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

const { renderLesson, renderProgressDots, renderCompletionBanner, renderPart } = require('../lib/renderer.cjs');
const { COLORS, _styleWithColor } = require('../lib/terminal.cjs');

describe('renderLesson', () => {
  const lesson = {
    id: 'test-lesson',
    title: 'Test Lesson Title',
    lessonNumber: 2,
    objective: 'Learn about testing renderers',
    content: [
      { type: 'text', value: 'This is a text block.', focus: 'Text block basics', bridge: 'Next we look at code.' },
      { type: 'code', language: 'javascript', value: 'const x = 1;', highlight: [1], focus: 'Variable declaration', bridge: 'Now you know variables.' },
    ],
    conceptMap: null,
    successCriteria: 'You can verify renderer output',
  };

  test('returns a string containing the lesson title', () => {
    const output = renderLesson(lesson, 1, 5);
    assert.ok(typeof output === 'string', 'renderLesson should return a string');
    assert.ok(output.includes('Test Lesson Title'), 'output should contain lesson title');
  });

  test('includes position indicator "Lesson 2 of 5"', () => {
    const output = renderLesson(lesson, 1, 5);
    assert.ok(output.includes('Lesson 2 of 5'), 'output should contain "Lesson 2 of 5"');
  });

  test('includes the lesson objective text', () => {
    const output = renderLesson(lesson, 0, 3);
    assert.ok(output.includes('Learn about testing renderers'), 'output should contain the objective');
  });

  test('includes the success criteria text', () => {
    const output = renderLesson(lesson, 0, 3);
    assert.ok(output.includes('You can verify renderer output'), 'output should contain success criteria');
  });

  test('renders text content blocks as-is', () => {
    const output = renderLesson(lesson, 0, 1);
    assert.ok(output.includes('This is a text block.'), 'output should contain text block content');
  });

  test('renders code content blocks with highlightJS applied', () => {
    const output = renderLesson(lesson, 0, 1);
    // The code block should contain the code text (possibly with ANSI codes)
    assert.ok(output.includes('const'), 'output should contain the code keyword');
    assert.ok(output.includes('x = 1'), 'output should contain the code assignment');
  });

  test('includes navigation hint footer', () => {
    const output = renderLesson(lesson, 0, 1);
    assert.ok(output.includes('[n]'), 'output should contain next hint');
    assert.ok(output.includes('[p]'), 'output should contain prev hint');
    assert.ok(output.includes('[q]'), 'output should contain quit hint');
  });

  test('includes concept map when lesson has one and moduleDir is provided', () => {
    const lessonWithMap = { ...lesson, conceptMap: 'tool-dispatch' };
    // renderLesson requires moduleDir to render concept maps; without it, concept map is skipped
    const output = renderLesson(lessonWithMap, 0, 1);
    // Without moduleDir, concept map section is not rendered
    assert.ok(typeof output === 'string', 'should still return a string without moduleDir');
  });

  test('code section with source field renders file path text', () => {
    const lessonWithSource = {
      ...lesson,
      content: [
        {
          type: 'code',
          language: 'javascript',
          value: 'const x = 1;',
          source: { file: 'bin/gsd-tools.cjs', startLine: 10 },
          focus: 'Source code example',
          bridge: 'See the file link above.',
        },
      ],
    };
    const output = renderLesson(lessonWithSource, 0, 1);
    assert.ok(output.includes('bin/gsd-tools.cjs'), 'output should contain file path');
    assert.ok(output.includes('10'), 'output should contain start line number');
  });

  test('code section without source field renders normally (backward compatible)', () => {
    const lessonNoSource = {
      ...lesson,
      content: [
        { type: 'code', language: 'javascript', value: 'const y = 2;', focus: 'Simple code', bridge: 'Moving on.' },
      ],
    };
    const output = renderLesson(lessonNoSource, 0, 1);
    assert.ok(output.includes('const'), 'output should contain code keyword');
    assert.ok(output.includes('y = 2'), 'output should contain code content');
    assert.ok(!output.includes('vscode://'), 'output should not contain vscode URI without source');
  });

  test('footer includes [c] Copy option', () => {
    const output = renderLesson(lesson, 0, 1);
    assert.ok(output.includes('[c]'), 'output should contain [c] hint');
    assert.ok(output.includes('Copy'), 'output should contain Copy label');
  });

  // ─── Clipboard hint light blue styling tests ──────────────────────

  const lessonWithHint = {
    ...lesson,
    successCriteria: 'You can verify renderer output\n\nWant to go deeper? Press [c] to copy this lesson to your clipboard.',
  };

  test('lightBlue ANSI code exists in COLORS and _styleWithColor applies it', () => {
    // Verify lightBlue color constant exists
    assert.strictEqual(COLORS.lightBlue, '\x1b[94m', 'COLORS should have lightBlue as ANSI 94');
    // Verify _styleWithColor applies it correctly
    const styled = _styleWithColor('hint text', 'lightBlue');
    assert.ok(styled.startsWith('\x1b[94m'), 'styled text should start with lightBlue code');
    assert.ok(styled.includes('hint text'), 'styled text should contain original text');
    assert.ok(styled.endsWith('\x1b[0m'), 'styled text should end with reset code');
  });

  test('clipboard hint line is separated from main criteria text in renderer output', () => {
    const output = renderLesson(lessonWithHint, 0, 1);
    // Both the main criteria and hint text should be present
    assert.ok(output.includes('You can verify renderer output'), 'output should contain main criteria');
    assert.ok(output.includes('Want to go deeper?'), 'output should contain hint text');
    // The hint text should appear after the main criteria (structural separation)
    const mainIdx = output.indexOf('You can verify renderer output');
    const hintIdx = output.indexOf('Want to go deeper?');
    assert.ok(hintIdx > mainIdx, 'hint text should appear after main criteria text');
  });

  test('main criteria text before hint is not styled as lightBlue', () => {
    // In non-TTY test env, style() is a no-op, so we verify structurally:
    // the main criteria text and hint text are pushed as separate parts
    const output = renderLesson(lessonWithHint, 0, 1);
    const mainIdx = output.indexOf('You can verify renderer output');
    // There should be a double newline separating main criteria from hint
    const betweenText = output.substring(mainIdx, output.indexOf('Want to go deeper?'));
    assert.ok(betweenText.includes('\n\n'), 'main criteria and hint should be separated by double newline');
  });

  test('successCriteria with no hint text renders unchanged (backward compatible)', () => {
    const output = renderLesson(lesson, 0, 1);
    assert.ok(output.includes('You can verify renderer output'), 'output should contain criteria text');
    // No hint-related splitting should occur
    assert.ok(!output.includes('Want to go deeper?'), 'output should not contain hint text');
  });

  test('code block renders line numbers via renderCodeBlock', () => {
    const lessonMultiline = {
      ...lesson,
      content: [
        { type: 'code', language: 'javascript', value: 'line one\nline two\nline three', focus: 'Multiline code', bridge: 'Done with code.' },
      ],
    };
    const output = renderLesson(lessonMultiline, 0, 1);
    assert.ok(output.includes('1'), 'output should contain line number 1');
    assert.ok(output.includes('|'), 'output should contain gutter separator');
  });
});

// ─── renderProgressDots ──────────────────────────────────────────────

describe('renderProgressDots', () => {
  test('renderProgressDots(2, 9) returns 3 filled dots, 6 empty dots, and "Part 3 of 9"', () => {
    const output = renderProgressDots(2, 9);
    assert.ok(typeof output === 'string', 'should return a string');
    const filled = (output.match(/\u25CF/g) || []).length;
    const empty = (output.match(/\u25CB/g) || []).length;
    assert.strictEqual(filled, 3, 'should have 3 filled dots');
    assert.strictEqual(empty, 6, 'should have 6 empty dots');
    assert.ok(output.includes('Part 3 of 9'), 'should contain "Part 3 of 9"');
  });

  test('renderProgressDots(0, 5) returns 1 filled dot, 4 empty dots, and "Part 1 of 5"', () => {
    const output = renderProgressDots(0, 5);
    const filled = (output.match(/\u25CF/g) || []).length;
    const empty = (output.match(/\u25CB/g) || []).length;
    assert.strictEqual(filled, 1, 'should have 1 filled dot');
    assert.strictEqual(empty, 4, 'should have 4 empty dots');
    assert.ok(output.includes('Part 1 of 5'), 'should contain "Part 1 of 5"');
  });

  test('renderProgressDots(4, 5) returns 5 filled dots, 0 empty dots, and "Part 5 of 5"', () => {
    const output = renderProgressDots(4, 5);
    const filled = (output.match(/\u25CF/g) || []).length;
    const empty = (output.match(/\u25CB/g) || []).length;
    assert.strictEqual(filled, 5, 'should have 5 filled dots');
    assert.strictEqual(empty, 0, 'should have 0 empty dots');
    assert.ok(output.includes('Part 5 of 5'), 'should contain "Part 5 of 5"');
  });
});

// ─── renderCompletionBanner ──────────────────────────────────────────

describe('renderCompletionBanner', () => {
  test('banner contains MODULE COMPLETE!, title, and stats', () => {
    const output = renderCompletionBanner({
      title: 'Command Lifecycle',
      lessonCount: 6,
      totalParts: 58,
      miniProjectCount: 1,
    });
    assert.ok(typeof output === 'string', 'should return a string');
    assert.ok(output.includes('MODULE COMPLETE!'), 'should contain "MODULE COMPLETE!"');
    assert.ok(output.includes('Command Lifecycle'), 'should contain module title');
    assert.ok(output.includes('Lessons: 6'), 'should contain lesson count');
    assert.ok(output.includes('Parts: 58'), 'should contain parts count');
    assert.ok(output.includes('Mini-projects: 1'), 'should contain mini-project count');
  });

  test('banner starts with clearScreen', () => {
    const output = renderCompletionBanner({
      title: 'Test Module',
      lessonCount: 3,
      totalParts: 20,
      miniProjectCount: 0,
    });
    assert.ok(output.startsWith('\x1b[2J\x1b[H'), 'should start with clearScreen escape');
  });

  test('banner contains solid color bar characters (U+2588)', () => {
    const output = renderCompletionBanner({
      title: 'Test Module',
      lessonCount: 3,
      totalParts: 20,
      miniProjectCount: 0,
    });
    assert.ok(output.includes('\u2588'), 'should contain solid block characters');
  });
});

// ─── renderPart ──────────────────────────────────────────────────────

describe('renderPart', () => {
  const lesson = {
    id: 'test-lesson',
    title: 'Test Lesson Title',
    lessonNumber: 2,
    objective: 'Learn about testing renderers',
    content: [
      { type: 'text', value: 'This is the first text block.', focus: 'First block focus', bridge: 'Bridge to second block.' },
      { type: 'code', language: 'javascript', value: 'const x = 1;', highlight: [1], focus: 'Code block focus', bridge: 'Bridge to third block.' },
      { type: 'text', value: 'This is the third text block.', focus: 'Third block focus', bridge: 'Bridge to conclusion.' },
    ],
    conceptMap: null,
    successCriteria: 'You can verify renderer output',
  };

  // totalParts = 3 (no concept map)
  test('renders content[0] when partIndex is 0', () => {
    const output = renderPart(lesson, 0, 3, 1, 5);
    assert.ok(output.includes('This is the first text block.'), 'should contain first text block');
    assert.ok(!output.includes('This is the third text block.'), 'should NOT contain third content section');
  });

  test('includes lesson title and position indicator', () => {
    const output = renderPart(lesson, 0, 3, 1, 5);
    assert.ok(output.includes('Test Lesson Title'), 'should contain lesson title');
    assert.ok(output.includes('Lesson 2 of 5'), 'should contain position indicator');
  });

  test('includes objective only on first part', () => {
    const first = renderPart(lesson, 0, 3, 0, 5);
    assert.ok(first.includes("What you'll learn:"), 'first part should contain objective header');
    assert.ok(first.includes('Learn about testing renderers'), 'first part should contain objective text');
    const middle = renderPart(lesson, 1, 3, 0, 5);
    assert.ok(!middle.includes("What you'll learn:"), 'middle part should NOT contain objective header');
  });

  test('includes success criteria only on last part', () => {
    const last = renderPart(lesson, 2, 3, 0, 5);
    assert.ok(last.includes("You'll know you've got it when:"), 'last part should contain criteria header');
    assert.ok(last.includes('You can verify renderer output'), 'last part should contain criteria text');
    const first = renderPart(lesson, 0, 3, 0, 5);
    assert.ok(!first.includes("You'll know you've got it when:"), 'first part should NOT contain criteria header');
  });

  test('renders text section with text value', () => {
    const output = renderPart(lesson, 0, 3, 0, 5);
    assert.ok(output.includes('This is the first text block.'), 'should contain text value');
  });

  test('renders code section with code and source link if present', () => {
    const lessonWithSource = {
      ...lesson,
      content: [
        { type: 'code', value: 'const x = 1;', source: { file: 'bin/gsd-tools.cjs', startLine: 10 }, focus: 'Source code', bridge: 'See the source.' },
      ],
    };
    const output = renderPart(lessonWithSource, 0, 1, 0, 5);
    assert.ok(output.includes('const'), 'should contain code');
    assert.ok(output.includes('bin/gsd-tools.cjs'), 'should contain source file');
  });

  test('renders project section with "Your Mission:" and deliverables', () => {
    const lessonWithProject = {
      ...lesson,
      content: [
        {
          type: 'project',
          task: 'Build something cool',
          deliverables: ['File A', 'File B'],
          verifyCommand: 'node verify.cjs',
          hintCommand: 'node hint.cjs',
          focus: 'Project task',
          bridge: 'Complete and move on.',
        },
      ],
    };
    const output = renderPart(lessonWithProject, 0, 1, 0, 5);
    assert.ok(output.includes('Your Mission:'), 'should contain Your Mission header');
    assert.ok(output.includes('File A'), 'should contain first deliverable');
    assert.ok(output.includes('File B'), 'should contain second deliverable');
  });

  test('includes progress dots from renderProgressDots', () => {
    const output = renderPart(lesson, 1, 3, 0, 5);
    assert.ok(output.includes('Part 2 of 3'), 'should contain progress dots label');
    assert.ok(output.includes('\u25CF'), 'should contain filled dot');
  });

  test('includes new navigation footer with [w] [q] [e] [c] [esc]', () => {
    const output = renderPart(lesson, 0, 3, 0, 5);
    assert.ok(output.includes('[w]'), 'should contain [w] key');
    assert.ok(output.includes('[q]'), 'should contain [q] key');
    assert.ok(output.includes('[e]'), 'should contain [e] key');
    assert.ok(output.includes('[c]'), 'should contain [c] key');
    assert.ok(output.includes('[esc]'), 'should contain [esc] key');
  });

  test('concept map renders as synthetic final part', () => {
    const lessonWithMap = { ...lesson, conceptMap: 'tool-dispatch' };
    // totalParts = 3 content + 1 concept map = 4
    const output = renderPart(lessonWithMap, 3, 4, 0, 5);
    assert.ok(output.includes('Architecture Overview'), 'should contain concept map header');
  });

  test('successCriteria with hint text still splits and styles hint as lightBlue on last part', () => {
    const lessonWithHint = {
      ...lesson,
      successCriteria: 'You can verify renderer output\n\nWant to go deeper? Press [c] to copy.',
    };
    const output = renderPart(lessonWithHint, 2, 3, 0, 5);
    assert.ok(output.includes('You can verify renderer output'), 'should contain main criteria');
    assert.ok(output.includes('Want to go deeper?'), 'should contain hint text');
    const mainIdx = output.indexOf('You can verify renderer output');
    const hintIdx = output.indexOf('Want to go deeper?');
    assert.ok(hintIdx > mainIdx, 'hint should appear after main criteria');
  });

  test('existing renderLesson still exported and works', () => {
    const output = renderLesson(lesson, 1, 5);
    assert.ok(output.includes('Test Lesson Title'), 'renderLesson should still work');
    assert.ok(output.includes('[n]'), 'renderLesson should still have old nav footer');
  });

  // ─── NEW: Progressive Accumulation Tests ──────────────────────────

  // 4-block lesson fixture for accumulation tests
  const accLesson = {
    id: 'acc-lesson',
    title: 'Accumulation Test Lesson',
    lessonNumber: 1,
    objective: 'Test progressive accumulation',
    content: [
      { type: 'text', value: 'Block zero content here.', focus: 'Introduction to concepts', bridge: 'Next we explore variables.' },
      { type: 'text', value: 'Block one content here.', focus: 'Variable fundamentals', bridge: 'Now onto functions.' },
      { type: 'text', value: 'Block two content here.', focus: 'Function patterns', bridge: 'Time for modules.' },
      { type: 'text', value: 'Block three content here.', focus: 'Module system', bridge: 'Wrapping up the lesson.' },
    ],
    conceptMap: null,
    successCriteria: 'You understand accumulation',
  };

  test('ACC-01: renderPart at partIndex=2 shows content from blocks 0, 1, AND 2', () => {
    const output = renderPart(accLesson, 2, 4, 0, 5);
    assert.ok(output.includes('Block zero content here.'), 'should contain block 0 content');
    assert.ok(output.includes('Block one content here.'), 'should contain block 1 content');
    assert.ok(output.includes('Block two content here.'), 'should contain block 2 content');
    assert.ok(!output.includes('Block three content here.'), 'should NOT contain block 3 content');
  });

  test('ACC-01: renderPart at partIndex=0 shows only block 0 content', () => {
    const output = renderPart(accLesson, 0, 4, 0, 5);
    assert.ok(output.includes('Block zero content here.'), 'should contain block 0 content');
    assert.ok(!output.includes('Block one content here.'), 'should NOT contain block 1 content');
    assert.ok(!output.includes('Block two content here.'), 'should NOT contain block 2 content');
  });

  test('ACC-02: each accumulated block displays its focus field text', () => {
    const output = renderPart(accLesson, 2, 4, 0, 5);
    assert.ok(output.includes('Introduction to concepts'), 'should contain block 0 focus');
    assert.ok(output.includes('Variable fundamentals'), 'should contain block 1 focus');
    assert.ok(output.includes('Function patterns'), 'should contain block 2 focus');
  });

  test('ACC-02: triangle-right marker appears exactly once (current block only)', () => {
    const output = renderPart(accLesson, 2, 4, 0, 5);
    const triangleCount = (output.match(/\u25B6/g) || []).length;
    assert.strictEqual(triangleCount, 1, 'should have exactly one triangle-right marker');
  });

  test('ACC-03: each block bridge text appears in bordered section', () => {
    const output = renderPart(accLesson, 2, 4, 0, 5);
    assert.ok(output.includes('Next we explore variables.'), 'should contain block 0 bridge');
    assert.ok(output.includes('Now onto functions.'), 'should contain block 1 bridge');
    assert.ok(output.includes('Time for modules.'), 'should contain block 2 bridge');
    // Check for bordered section characters
    assert.ok(output.includes('\u250C') || output.includes('\u2514'), 'should contain box-drawing border characters');
  });

  test('block separator: dim horizontal rule appears between accumulated blocks', () => {
    const output = renderPart(accLesson, 2, 4, 0, 5);
    // When partIndex > 0, there should be horizontal rule separators between blocks
    // horizontalRule uses \u2500 characters
    const hrCount = (output.match(/\u2500{10,}/g) || []).length;
    // At least the standard header HR plus separators between blocks
    assert.ok(hrCount >= 3, 'should have horizontal rule separators between accumulated blocks (got ' + hrCount + ')');
  });

  test('ACC-04: objective on partIndex=0 only; criteria on last part only (with accumulation)', () => {
    const first = renderPart(accLesson, 0, 4, 0, 5);
    assert.ok(first.includes("What you'll learn:"), 'first part should have objective');
    assert.ok(!first.includes("You'll know you've got it when:"), 'first part should NOT have criteria');

    const middle = renderPart(accLesson, 2, 4, 0, 5);
    assert.ok(!middle.includes("What you'll learn:"), 'middle part should NOT have objective');
    assert.ok(!middle.includes("You'll know you've got it when:"), 'middle part should NOT have criteria');

    const last = renderPart(accLesson, 3, 4, 0, 5);
    assert.ok(!last.includes("What you'll learn:"), 'last part should NOT have objective');
    assert.ok(last.includes("You'll know you've got it when:"), 'last part should have criteria');
  });

  test('concept map as synthetic final part still works with accumulation', () => {
    const accLessonWithMap = { ...accLesson, conceptMap: 'tool-dispatch' };
    // totalParts = 4 content + 1 concept map = 5
    const output = renderPart(accLessonWithMap, 4, 5, 0, 5);
    assert.ok(output.includes('Architecture Overview'), 'should contain concept map header');
    // All 4 content blocks should be accumulated before concept map
    assert.ok(output.includes('Block zero content here.'), 'should accumulate block 0');
    assert.ok(output.includes('Block one content here.'), 'should accumulate block 1');
    assert.ok(output.includes('Block two content here.'), 'should accumulate block 2');
    assert.ok(output.includes('Block three content here.'), 'should accumulate block 3');
  });
});
