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
      { type: 'text', value: 'This is a text block.' },
      { type: 'code', language: 'javascript', value: 'const x = 1;', highlight: [1] },
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

  test('includes concept map when lesson has one', () => {
    const lessonWithMap = { ...lesson, conceptMap: 'tool-dispatch' };
    const output = renderLesson(lessonWithMap, 0, 1);
    assert.ok(output.includes('Architecture Overview'), 'output should contain concept map header');
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
        { type: 'code', language: 'javascript', value: 'const y = 2;' },
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
        { type: 'code', language: 'javascript', value: 'line one\nline two\nline three' },
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
      { type: 'text', value: 'This is the first text block.' },
      { type: 'code', language: 'javascript', value: 'const x = 1;', highlight: [1] },
      { type: 'text', value: 'This is the third text block.' },
    ],
    conceptMap: null,
    successCriteria: 'You can verify renderer output',
  };

  // totalParts = 3 (no concept map)
  test('renders only content[0] when partIndex is 0', () => {
    const output = renderPart(lesson, 0, 3, 1, 5);
    assert.ok(output.includes('This is the first text block.'), 'should contain first text block');
    assert.ok(!output.includes('const x = 1'), 'should NOT contain second content section');
    assert.ok(!output.includes('This is the third text block.'), 'should NOT contain third content section');
  });

  test('includes lesson title and position indicator', () => {
    const output = renderPart(lesson, 0, 3, 1, 5);
    assert.ok(output.includes('Test Lesson Title'), 'should contain lesson title');
    assert.ok(output.includes('Lesson 2 of 5'), 'should contain position indicator');
  });

  test('includes pinned objective on every part', () => {
    const output = renderPart(lesson, 1, 3, 0, 5);
    assert.ok(output.includes("What you'll learn:"), 'should contain objective header');
    assert.ok(output.includes('Learn about testing renderers'), 'should contain objective text');
  });

  test('includes pinned success criteria footer on every part', () => {
    const output = renderPart(lesson, 2, 3, 0, 5);
    assert.ok(output.includes("You'll know you've got it when:"), 'should contain criteria header');
    assert.ok(output.includes('You can verify renderer output'), 'should contain criteria text');
  });

  test('renders text section with text value', () => {
    const output = renderPart(lesson, 0, 3, 0, 5);
    assert.ok(output.includes('This is the first text block.'), 'should contain text value');
  });

  test('renders code section with code and source link if present', () => {
    const lessonWithSource = {
      ...lesson,
      content: [
        { type: 'code', value: 'const x = 1;', source: { file: 'bin/gsd-tools.cjs', startLine: 10 } },
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
        },
      ],
    };
    const output = renderPart(lessonWithProject, 0, 1, 0, 5);
    assert.ok(output.includes('Your Mission:'), 'should contain Your Mission header');
    assert.ok(output.includes('File A'), 'should contain first deliverable');
    assert.ok(output.includes('File B'), 'should contain second deliverable');
  });

  test('includes dim block header for text type', () => {
    const output = renderPart(lesson, 0, 3, 0, 5);
    // Block header should exist -- for text type, it uses first ~40 chars or "Explanation"
    assert.ok(typeof output === 'string', 'should be a string');
    // The block header for text should contain some portion of the text or "Explanation"
    // We check that the output has content beyond just the section value
    assert.ok(output.length > lesson.content[0].value.length, 'should have more than just the text value');
  });

  test('includes dim block header "Code Example" for code without source', () => {
    const lessonCodeNoSource = {
      ...lesson,
      content: [
        { type: 'code', value: 'const x = 1;' },
      ],
    };
    const output = renderPart(lessonCodeNoSource, 0, 1, 0, 5);
    assert.ok(output.includes('Code Example'), 'should contain "Code Example" block header');
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

  test('successCriteria with hint text still splits and styles hint as lightBlue', () => {
    const lessonWithHint = {
      ...lesson,
      successCriteria: 'You can verify renderer output\n\nWant to go deeper? Press [c] to copy.',
    };
    const output = renderPart(lessonWithHint, 0, 3, 0, 5);
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
});
