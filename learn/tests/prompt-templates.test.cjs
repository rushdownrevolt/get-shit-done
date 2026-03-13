'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('prompt-templates.cjs', () => {
  let assemblePrompt;

  test('module loads', () => {
    const mod = require('../lib/prompt-templates.cjs');
    assemblePrompt = mod.assemblePrompt;
    assert.ok(typeof assemblePrompt === 'function', 'assemblePrompt should be a function');
  });

  describe('overview template', () => {
    test('assemblePrompt overview substitutes lesson number and title', () => {
      const { assemblePrompt } = require('../lib/prompt-templates.cjs');
      const result = assemblePrompt('overview', {
        lessonNumber: 3,
        lessonTitle: 'Architecture Overview',
        moduleOverview: 'GSD is a CLI tool for project management.',
      });

      assert.ok(typeof result === 'string');
      assert.ok(result.includes('3'), 'should contain lesson number');
      assert.ok(result.includes('Architecture Overview'), 'should contain lesson title');
      assert.ok(result.includes('GSD is a CLI tool'), 'should contain module overview');
    });

    test('overview template does NOT contain {{FUNCTIONS}} marker', () => {
      const templatePath = path.resolve(__dirname, '..', 'content', 'prompts', 'overview.prompt.md');
      const template = fs.readFileSync(templatePath, 'utf-8');
      assert.ok(!template.includes('{{FUNCTIONS}}'), 'overview template should not have {{FUNCTIONS}} marker');
    });

    test('overview template does NOT contain {{SOURCE_CODE}} marker', () => {
      const templatePath = path.resolve(__dirname, '..', 'content', 'prompts', 'overview.prompt.md');
      const template = fs.readFileSync(templatePath, 'utf-8');
      assert.ok(!template.includes('{{SOURCE_CODE}}'), 'overview template should not have {{SOURCE_CODE}} marker');
    });
  });

  describe('source-dive template', () => {
    test('assemblePrompt source-dive substitutes all markers', () => {
      const { assemblePrompt } = require('../lib/prompt-templates.cjs');
      const result = assemblePrompt('source-dive', {
        fileName: 'core.cjs',
        moduleDoc: 'Core utilities module',
        exports: ['output', 'error'],
        functions: [
          { name: 'output', startLine: 10, endLine: 15, code: 'function output(msg) { console.log(msg); }', jsdoc: 'Print output' },
        ],
        requires: [
          { binding: 'fs', module: 'fs', isDestructured: false },
        ],
        lessonNumber: 2,
        lessonTitle: 'Core Utilities',
        focus: 'output and error handling',
        sourceCode: 'const fs = require("fs");',
      });

      assert.ok(result.includes('core.cjs'), 'should contain file name');
      assert.ok(result.includes('Core utilities module'), 'should contain module doc');
      assert.ok(result.includes('output'), 'should contain export names');
      assert.ok(result.includes('2'), 'should contain lesson number');
      assert.ok(result.includes('Core Utilities'), 'should contain lesson title');
      assert.ok(result.includes('output and error handling'), 'should contain focus');
    });

    test('source-dive template contains {{FUNCTIONS}} marker', () => {
      const templatePath = path.resolve(__dirname, '..', 'content', 'prompts', 'source-dive.prompt.md');
      const template = fs.readFileSync(templatePath, 'utf-8');
      assert.ok(template.includes('{{FUNCTIONS}}'), 'source-dive template should have {{FUNCTIONS}} marker');
    });

    test('source-dive template contains {{SOURCE_CODE}} marker', () => {
      const templatePath = path.resolve(__dirname, '..', 'content', 'prompts', 'source-dive.prompt.md');
      const template = fs.readFileSync(templatePath, 'utf-8');
      assert.ok(template.includes('{{SOURCE_CODE}}'), 'source-dive template should have {{SOURCE_CODE}} marker');
    });
  });

  describe('JSON schema in templates', () => {
    const REQUIRED_FIELDS = ['id', 'title', 'lessonNumber', 'objective', 'content', 'conceptMap', 'successCriteria'];

    test('overview template contains all 7 required lesson JSON fields', () => {
      const templatePath = path.resolve(__dirname, '..', 'content', 'prompts', 'overview.prompt.md');
      const template = fs.readFileSync(templatePath, 'utf-8');
      for (const field of REQUIRED_FIELDS) {
        assert.ok(template.includes('"' + field + '"'), 'overview template should contain "' + field + '" field');
      }
    });

    test('source-dive template contains all 7 required lesson JSON fields', () => {
      const templatePath = path.resolve(__dirname, '..', 'content', 'prompts', 'source-dive.prompt.md');
      const template = fs.readFileSync(templatePath, 'utf-8');
      for (const field of REQUIRED_FIELDS) {
        assert.ok(template.includes('"' + field + '"'), 'source-dive template should contain "' + field + '" field');
      }
    });
  });

  describe('WHY instruction (CONT-04)', () => {
    test('overview template contains "why" instruction', () => {
      const templatePath = path.resolve(__dirname, '..', 'content', 'prompts', 'overview.prompt.md');
      const template = fs.readFileSync(templatePath, 'utf-8').toLowerCase();
      assert.ok(template.includes('why'), 'overview template should contain "why" instruction');
      assert.ok(
        template.includes('why') && (template.includes('design') || template.includes('choice') || template.includes('rationale')),
        'overview template should instruct explaining design rationale'
      );
    });

    test('source-dive template contains "why" instruction', () => {
      const templatePath = path.resolve(__dirname, '..', 'content', 'prompts', 'source-dive.prompt.md');
      const template = fs.readFileSync(templatePath, 'utf-8').toLowerCase();
      assert.ok(template.includes('why'), 'source-dive template should contain "why" instruction');
      assert.ok(
        template.includes('why') && template.includes('what'),
        'source-dive template should distinguish why vs what'
      );
    });
  });

  describe('assembleMarkdownPrompt', () => {
    test('basic {{KEY}} replacement', () => {
      const { assembleMarkdownPrompt } = require('../lib/prompt-templates.cjs');
      const result = assembleMarkdownPrompt('test-template', {
        name: 'Alice',
        place: 'Wonderland',
        role: 'explorer',
        'frontmatter.description': 'A test description',
      });
      assert.ok(result.includes('Hello Alice'), 'should replace {{name}}');
      assert.ok(result.includes('welcome to Wonderland'), 'should replace {{place}}');
      assert.ok(result.includes('Your role: explorer'), 'should replace {{role}}');
    });

    test('throws on missing key', () => {
      const { assembleMarkdownPrompt } = require('../lib/prompt-templates.cjs');
      assert.throws(
        () => assembleMarkdownPrompt('test-template', { name: 'Alice' }),
        (err) => {
          assert.ok(err.message.includes('place'), 'error should contain missing key name');
          assert.ok(err.message.includes('test-template'), 'error should contain template name');
          return true;
        },
        'should throw on missing key'
      );
    });

    test('dotted key via flat context', () => {
      const { assembleMarkdownPrompt } = require('../lib/prompt-templates.cjs');
      const result = assembleMarkdownPrompt('test-template', {
        name: 'Bob',
        place: 'Office',
        role: 'developer',
        'frontmatter.description': 'Flat dotted key',
      });
      assert.ok(result.includes('Metadata: Flat dotted key'), 'should resolve flat dotted key');
    });

    test('dotted key via nested object traversal', () => {
      const { assembleMarkdownPrompt } = require('../lib/prompt-templates.cjs');
      const result = assembleMarkdownPrompt('test-template', {
        name: 'Carol',
        place: 'Lab',
        role: 'scientist',
        frontmatter: { description: 'Nested traversal' },
      });
      assert.ok(result.includes('Metadata: Nested traversal'), 'should resolve nested dotted key');
    });

    test('replaces ALL occurrences of same key', () => {
      const { assembleMarkdownPrompt } = require('../lib/prompt-templates.cjs');
      const result = assembleMarkdownPrompt('test-template', {
        name: 'Dave',
        place: 'Park',
        role: 'runner',
        'frontmatter.description': 'test',
      });
      const count = (result.match(/Dave/g) || []).length;
      assert.ok(count >= 2, 'should replace all occurrences of {{name}}, found ' + count);
    });

    test('assemblePrompt still works unchanged (regression)', () => {
      const { assemblePrompt } = require('../lib/prompt-templates.cjs');
      const result = assemblePrompt('source-dive', {
        fileName: 'test.cjs',
        lessonNumber: 1,
        lessonTitle: 'Test Lesson',
        focus: 'testing',
      });
      assert.ok(result.includes('test.cjs'), 'assemblePrompt should still work');
      assert.ok(!result.includes('{{FILE_NAME}}'), 'should replace FILE_NAME marker');
    });
  });

  describe('defaults handling', () => {
    test('assemblePrompt uses defaults for missing context values', () => {
      const { assemblePrompt } = require('../lib/prompt-templates.cjs');
      const result = assemblePrompt('source-dive', {
        lessonNumber: 1,
        lessonTitle: 'Test',
      });

      assert.ok(typeof result === 'string');
      // Should not contain unresolved {{MARKER}} placeholders
      assert.ok(!result.includes('{{FILE_NAME}}'), 'should replace FILE_NAME with default');
      assert.ok(!result.includes('{{MODULE_DOC}}'), 'should replace MODULE_DOC with default');
      assert.ok(!result.includes('{{EXPORTS}}'), 'should replace EXPORTS with default');
      assert.ok(!result.includes('{{FUNCTIONS}}'), 'should replace FUNCTIONS with default');
      assert.ok(!result.includes('{{REQUIRES}}'), 'should replace REQUIRES with default');
    });
  });
});
