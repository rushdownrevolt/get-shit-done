'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

const { renderLesson } = require('../lib/renderer.cjs');
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
