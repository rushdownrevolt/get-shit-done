'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const { formatLessonForClipboard } = require('../lib/clipboard-formatter.cjs');

const moduleDir = path.join(__dirname, '..', 'content', 'modules', 'gsd-commands');

const testLesson = {
  id: 'test-clipboard',
  title: 'Understanding Tool Dispatch',
  lessonNumber: 3,
  objective: 'Learn how GSD dispatches commands to the right tool handler',
  content: [
    { type: 'text', value: 'GSD uses a dispatch pattern to route commands.' },
    {
      type: 'code',
      language: 'javascript',
      value: 'function dispatch(cmd) {\n  return handlers[cmd]();\n}',
      source: { file: 'bin/gsd-tools.cjs', startLine: 145 },
    },
    {
      type: 'code',
      language: 'javascript',
      value: 'const x = 1;',
    },
    {
      type: 'project',
      task: 'Create your own dispatcher',
      deliverables: ['Write a dispatch function', 'Handle unknown commands', 'Add error logging'],
      verifyCommand: 'node verify.js',
      hintCommand: 'gsd hint',
    },
  ],
  conceptMap: 'tool-dispatch',
  successCriteria: 'You can trace a command from entry to handler execution',
};

describe('formatLessonForClipboard', () => {
  test('output starts with blockquote preamble', () => {
    const output = formatLessonForClipboard(testLesson, 2, 10, moduleDir);
    assert.ok(output.startsWith('> '), 'should start with blockquote');
    assert.ok(output.includes('GSD Learn'), 'preamble should mention GSD Learn');
  });

  test('includes lesson title as H1 heading', () => {
    const output = formatLessonForClipboard(testLesson, 2, 10, moduleDir);
    assert.ok(output.includes('# Understanding Tool Dispatch'), 'should contain H1 title');
  });

  test('includes objective section', () => {
    const output = formatLessonForClipboard(testLesson, 2, 10, moduleDir);
    assert.ok(output.includes('## Objective'), 'should contain ## Objective heading');
    assert.ok(output.includes('Learn how GSD dispatches commands'), 'should contain objective text');
  });

  test('text sections appear as plain paragraphs', () => {
    const output = formatLessonForClipboard(testLesson, 2, 10, moduleDir);
    assert.ok(output.includes('GSD uses a dispatch pattern'), 'should contain text content');
  });

  test('code sections are wrapped in javascript fences', () => {
    const output = formatLessonForClipboard(testLesson, 2, 10, moduleDir);
    assert.ok(output.includes('```javascript'), 'should contain javascript code fence');
    assert.ok(output.includes('function dispatch(cmd)'), 'should contain code content');
    assert.ok(output.includes('```'), 'should close code fence');
  });

  test('code sections with source include file:line comment', () => {
    const output = formatLessonForClipboard(testLesson, 2, 10, moduleDir);
    assert.ok(output.includes('// bin/gsd-tools.cjs:145'), 'should contain source file:line comment');
  });

  test('code sections without source have no file comment', () => {
    const output = formatLessonForClipboard(testLesson, 2, 10, moduleDir);
    // The second code block (const x = 1;) has no source
    const lines = output.split('\n');
    const xLine = lines.findIndex(l => l.includes('const x = 1;'));
    assert.ok(xLine > 0, 'should find the sourceless code block');
    // Line before should be the fence opener, not a source comment
    const prevLine = lines[xLine - 1];
    assert.ok(prevLine.includes('```javascript'), 'line before sourceless code should be fence');
  });

  test('project sections include "## Your Mission" heading', () => {
    const output = formatLessonForClipboard(testLesson, 2, 10, moduleDir);
    assert.ok(output.includes('## Your Mission'), 'should contain ## Your Mission heading');
  });

  test('project sections include numbered deliverables', () => {
    const output = formatLessonForClipboard(testLesson, 2, 10, moduleDir);
    assert.ok(output.includes('1. Write a dispatch function'), 'should have first deliverable');
    assert.ok(output.includes('2. Handle unknown commands'), 'should have second deliverable');
    assert.ok(output.includes('3. Add error logging'), 'should have third deliverable');
  });

  test('concept map included as "## Architecture Overview" with code fence', () => {
    const output = formatLessonForClipboard(testLesson, 2, 10, moduleDir);
    assert.ok(output.includes('## Architecture Overview'), 'should contain architecture heading');
    // The concept map file should be loaded and included
    assert.ok(output.includes('```'), 'should contain code fence for map');
  });

  test('ends with success criteria section', () => {
    const output = formatLessonForClipboard(testLesson, 2, 10, moduleDir);
    assert.ok(output.includes("## You'll know you've got it when:"), 'should contain success criteria heading');
    assert.ok(output.includes('trace a command from entry'), 'should contain criteria text');
  });

  test('no ANSI codes anywhere in output', () => {
    const output = formatLessonForClipboard(testLesson, 2, 10, moduleDir);
    // eslint-disable-next-line no-control-regex
    assert.ok(!/\x1b\[/.test(output), 'output should not contain any ANSI escape codes');
  });

  test('handles lesson without concept map', () => {
    const lessonNoMap = { ...testLesson, conceptMap: null };
    const output = formatLessonForClipboard(lessonNoMap, 0, 5, moduleDir);
    assert.ok(!output.includes('## Architecture Overview'), 'should not contain architecture heading');
  });

  test('handles lesson without project sections', () => {
    const lessonNoProject = {
      ...testLesson,
      content: [{ type: 'text', value: 'Just text.' }],
    };
    const output = formatLessonForClipboard(lessonNoProject, 0, 5, moduleDir);
    assert.ok(!output.includes('## Your Mission'), 'should not contain mission heading');
    assert.ok(output.includes('Just text.'), 'should contain text content');
  });

  test('handles missing moduleDir gracefully', () => {
    const output = formatLessonForClipboard(testLesson, 0, 5, undefined);
    assert.ok(!output.includes('## Architecture Overview'), 'should not contain architecture heading when moduleDir is undefined');
    // Should not throw
    assert.ok(output.includes('# Understanding Tool Dispatch'), 'should still contain lesson title');
  });
});
