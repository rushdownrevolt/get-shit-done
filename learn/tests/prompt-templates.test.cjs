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
