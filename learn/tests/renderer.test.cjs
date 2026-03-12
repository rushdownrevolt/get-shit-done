'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

const { renderLesson } = require('../lib/renderer.cjs');

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
