#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseSourceFile } = require('../lib/parser.cjs');
const { assemblePrompt } = require('../lib/prompt-templates.cjs');
const { evaluateLesson, recordIteration } = require('../lib/evaluator.cjs');

// ─── Lesson Plan ─────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_DIR = path.join(__dirname, '..', 'content');

const LESSON_PLAN = [
  {
    lessonNumber: 1,
    id: 'welcome',
    type: 'overview',
    title: 'Welcome to GSD',
    template: 'overview',
    sources: [],
    focus: '',
  },
  {
    lessonNumber: 2,
    id: 'entry-point',
    type: 'source-dive',
    title: 'Where Commands Start',
    template: 'source-dive',
    sources: ['get-shit-done/bin/gsd-tools.cjs'],
    focus: 'entry point, require() imports, cwd/args setup',
  },
  {
    lessonNumber: 3,
    id: 'command-dispatch',
    type: 'source-dive',
    title: 'Command Dispatch',
    template: 'source-dive',
    sources: ['get-shit-done/bin/gsd-tools.cjs'],
    focus: 'switch statement routing, sub-command dispatch',
  },
  {
    lessonNumber: 4,
    id: 'tool-modules',
    type: 'source-dive',
    title: 'Tool Modules',
    template: 'source-dive',
    sources: [
      'get-shit-done/bin/lib/core.cjs',
      'get-shit-done/bin/lib/config.cjs',
      'get-shit-done/bin/lib/phase.cjs',
    ],
    focus: 'module boundaries, export patterns',
  },
  {
    lessonNumber: 5,
    id: 'state-and-config',
    type: 'source-dive',
    title: 'State and Configuration',
    template: 'source-dive',
    sources: [
      'get-shit-done/bin/lib/state.cjs',
      'get-shit-done/bin/lib/config.cjs',
    ],
    focus: 'STATE.md operations, config CRUD, persistence',
  },
];

// ─── Prompt Generation ───────────────────────────────────────────────────────

/**
 * Generate assembled prompt text files for all lessons.
 */
function generatePrompts() {
  const generatedDir = path.join(CONTENT_DIR, 'prompts', 'generated');
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  const results = [];

  for (const lesson of LESSON_PLAN) {
    let context = {
      lessonNumber: lesson.lessonNumber,
      lessonTitle: lesson.title,
      focus: lesson.focus,
    };

    if (lesson.type === 'overview') {
      context.moduleOverview = 'The Command Lifecycle module follows a single GSD command from user input to execution. ' +
        'It covers: entry point setup, command dispatch via switch statement, tool module boundaries, and state/config persistence. ' +
        'GSD is a zero-dependency CommonJS CLI toolkit that centralizes ~50 inline bash patterns into a single tool.';
    } else {
      // Source-dive: parse all sources and merge context
      const parsed = lesson.sources.map(function (src) {
        return parseSourceFile(path.join(PROJECT_ROOT, src));
      });

      const primary = parsed[0];
      context.fileName = parsed.map(function (p) { return p.fileName; }).join(', ');
      context.moduleDoc = parsed.map(function (p) { return p.moduleDoc || ''; }).filter(Boolean).join('\n\n');
      context.exports = [].concat.apply([], parsed.map(function (p) { return p.exports || []; }));
      context.functions = [].concat.apply([], parsed.map(function (p) { return p.functions || []; }));
      context.requires = [].concat.apply([], parsed.map(function (p) { return p.requires || []; }));
      context.sourceCode = parsed.map(function (p) {
        return '// === ' + p.fileName + ' ===\n' + fs.readFileSync(p.filePath, 'utf-8');
      }).join('\n\n');
    }

    const prompt = assemblePrompt(lesson.template, context);
    const paddedNum = String(lesson.lessonNumber).padStart(2, '0');
    const slug = lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = paddedNum + '-' + slug + '.txt';
    const outputPath = path.join(generatedDir, filename);
    fs.writeFileSync(outputPath, prompt, 'utf-8');

    results.push({
      lesson: lesson.lessonNumber,
      title: lesson.title,
      prompt: filename,
    });
  }

  return results;
}

// ─── JSON Validation (--from-json mode) ──────────────────────────────────────

/**
 * Validate and copy LLM response JSON files to the lessons directory.
 */
function validateAndCopy(responsesDir) {
  const lessonsDir = path.join(CONTENT_DIR, 'modules', 'command-lifecycle', 'lessons');
  const required = ['id', 'title', 'lessonNumber', 'objective', 'content', 'conceptMap', 'successCriteria'];
  const results = [];

  for (const lesson of LESSON_PLAN) {
    const paddedNum = String(lesson.lessonNumber).padStart(2, '0');
    const slug = lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Try multiple filename patterns
    const candidates = [
      paddedNum + '-' + slug + '.json',
      paddedNum + '-' + lesson.id + '.json',
    ];

    let found = null;
    for (const candidate of candidates) {
      const candidatePath = path.join(responsesDir, candidate);
      if (fs.existsSync(candidatePath)) {
        found = candidatePath;
        break;
      }
    }

    if (!found) {
      results.push({ lesson: lesson.lessonNumber, status: 'missing', error: 'No response file found' });
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(found, 'utf-8'));

      // Validate required fields
      const missing = required.filter(function (f) { return !(f in data); });
      if (missing.length > 0) {
        results.push({ lesson: lesson.lessonNumber, status: 'invalid', error: 'Missing fields: ' + missing.join(', ') });
        continue;
      }

      // Copy to lessons directory
      const destName = paddedNum + '-' + lesson.id + '.json';
      fs.writeFileSync(path.join(lessonsDir, destName), JSON.stringify(data, null, 2), 'utf-8');
      results.push({ lesson: lesson.lessonNumber, status: 'ok', file: destName });
    } catch (e) {
      results.push({ lesson: lesson.lessonNumber, status: 'error', error: e.message });
    }
  }

  return results;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--from-json') {
    const responsesDir = args[1];
    if (!responsesDir) {
      console.error('Usage: generate-lessons.cjs --from-json <responses-dir>');
      process.exit(1);
    }
    const results = validateAndCopy(responsesDir);
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Default: generate prompt text files
  const results = generatePrompts();
  console.log('Generated ' + results.length + ' prompt files:');
  for (const r of results) {
    console.log('  ' + r.prompt);
  }
}

main();

module.exports = { generatePrompts, validateAndCopy, LESSON_PLAN };
