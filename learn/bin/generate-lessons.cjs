#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseSourceFile } = require('../lib/parser.cjs');
const { assemblePrompt, assembleMarkdownPrompt } = require('../lib/prompt-templates.cjs');
const { evaluateLesson, recordIteration } = require('../lib/evaluator.cjs');
const { parseMarkdownFile } = require('../lib/markdown-parser.cjs');

// ─── Lesson Plan ─────────────────────────────────────────────────────────────

const GSD_ROOT = path.join(os.homedir(), '.claude', 'get-shit-done');
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
    sources: ['bin/gsd-tools.cjs'],
    focus: 'entry point, require() imports, cwd/args setup',
  },
  {
    lessonNumber: 3,
    id: 'command-dispatch',
    type: 'source-dive',
    title: 'Command Dispatch',
    template: 'source-dive',
    sources: ['bin/gsd-tools.cjs'],
    focus: 'switch statement routing, sub-command dispatch',
  },
  {
    lessonNumber: 4,
    id: 'tool-modules',
    type: 'source-dive',
    title: 'Tool Modules',
    template: 'source-dive',
    sources: [
      'bin/lib/core.cjs',
      'bin/lib/config.cjs',
      'bin/lib/phase.cjs',
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
      'bin/lib/state.cjs',
      'bin/lib/config.cjs',
    ],
    focus: 'STATE.md operations, config CRUD, persistence',
  },
];

// ─── Module 1: GSD Commands & Workflows ─────────────────────────────────────

const MODULE1_LESSON_PLAN = [
  {
    lessonNumber: 1,
    id: 'overview',
    type: 'overview',
    title: 'The Two-Layer Architecture',
    template: 'overview',
    sources: [],
    focus: 'command specs dispatch to workflow files',
  },
  {
    lessonNumber: 2,
    id: 'command-anatomy',
    type: 'markdown-anatomy',
    title: 'Command Spec Anatomy',
    template: 'markdown-anatomy',
    sources: [path.join(os.homedir(), '.claude', 'commands', 'gsd', 'quick.md')],
    focus: 'YAML frontmatter, XML sections, @file references',
  },
  {
    lessonNumber: 3,
    id: 'workflow-anatomy',
    type: 'markdown-anatomy',
    title: 'Workflow File Anatomy',
    template: 'markdown-anatomy',
    sources: [path.join(os.homedir(), '.claude', 'get-shit-done', 'workflows', 'quick.md')],
    focus: 'purpose, process steps, bash code blocks',
  },
  {
    lessonNumber: 4,
    id: 'dispatch-chain',
    type: 'markdown-anatomy',
    title: 'Command to Workflow Wiring',
    template: 'markdown-anatomy',
    sources: [
      path.join(os.homedir(), '.claude', 'commands', 'gsd', 'quick.md'),
      path.join(os.homedir(), '.claude', 'get-shit-done', 'workflows', 'quick.md'),
    ],
    focus: 'execution_context @file reference, dispatch chain',
  },
  {
    lessonNumber: 5,
    id: 'bridge',
    type: 'bridge',
    title: 'Bridge to Node.js',
    template: null,
    sources: [],
    focus: 'preview of Module 2 Node.js layer',
  },
];

// ─── Format Helpers for Markdown Anatomy Context ────────────────────────────

function formatFrontmatter(fm) {
  if (!fm || Object.keys(fm).length === 0) return 'No frontmatter (workflow files have no YAML header).';
  return Object.entries(fm)
    .map(([k, v]) => `- **${k}:** ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');
}

function formatSections(sections) {
  if (!sections || Object.keys(sections).length === 0) return 'No XML sections found.';
  return Object.entries(sections)
    .map(([tag, body]) => {
      const content = Array.isArray(body) ? body.join('\n---\n') : body;
      return `### <${tag}>\n${content}`;
    })
    .join('\n\n');
}

function formatFileRefs(refs) {
  if (!refs || refs.length === 0) return 'No @file references found.';
  return refs.map(r => `- \`@${r}\``).join('\n');
}

function formatCodeBlocks(blocks) {
  if (!blocks || blocks.length === 0) return 'No fenced code blocks found.';
  return blocks.map((b, i) => {
    return `### Block ${i + 1} (${b.language || 'no language'})\n\`\`\`${b.language || ''}\n${b.code}\n\`\`\``;
  }).join('\n\n');
}

// ─── Module 1 Prompt Generation ─────────────────────────────────────────────

/**
 * Generate assembled prompt text files for Module 1 lessons.
 */
function generateModule1Prompts() {
  const generatedDir = path.join(CONTENT_DIR, 'prompts', 'generated');
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  const results = [];

  for (const lesson of MODULE1_LESSON_PLAN) {
    // Skip hand-authored lessons (overview and bridge)
    if (lesson.type === 'overview' || lesson.type === 'bridge') {
      results.push({
        lesson: lesson.lessonNumber,
        title: lesson.title,
        prompt: '(hand-authored, skipped)',
      });
      continue;
    }

    if (lesson.type === 'markdown-anatomy') {
      // Parse source files and build context
      const parsed = lesson.sources.map(src => parseMarkdownFile(src));
      const primary = parsed[0];

      const context = {
        lessonNumber: lesson.lessonNumber,
        lessonTitle: lesson.title,
        focus: lesson.focus,
        fileName: parsed.map(p => p.fileName).join(', '),
        fileType: primary.fileType,
        frontmatterFormatted: formatFrontmatter(primary.frontmatter),
        sectionsFormatted: formatSections(primary.sections),
        fileReferencesFormatted: formatFileRefs(primary.fileReferences),
        codeBlocksFormatted: formatCodeBlocks(primary.codeBlocks),
        sourceCode: parsed.map(p => {
          return '// === ' + p.fileName + ' ===\n' + fs.readFileSync(p.filePath, 'utf-8');
        }).join('\n\n'),
      };

      const prompt = assembleMarkdownPrompt(lesson.template, context);
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
  }

  return results;
}

// ─── Module 1 JSON Validation ───────────────────────────────────────────────

/**
 * Validate and copy LLM response JSON files to the gsd-commands lessons directory.
 */
function validateAndCopyModule1(responsesDir) {
  const lessonsDir = path.join(CONTENT_DIR, 'modules', 'gsd-commands', 'lessons');
  if (!fs.existsSync(lessonsDir)) {
    fs.mkdirSync(lessonsDir, { recursive: true });
  }
  const required = ['id', 'title', 'lessonNumber', 'objective', 'content', 'conceptMap', 'successCriteria'];
  const results = [];

  for (const lesson of MODULE1_LESSON_PLAN) {
    const paddedNum = String(lesson.lessonNumber).padStart(2, '0');
    const slug = lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

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
      const missing = required.filter(function (f) { return !(f in data); });
      if (missing.length > 0) {
        results.push({ lesson: lesson.lessonNumber, status: 'invalid', error: 'Missing fields: ' + missing.join(', ') });
        continue;
      }

      const destName = paddedNum + '-' + lesson.id + '.json';
      fs.writeFileSync(path.join(lessonsDir, destName), JSON.stringify(data, null, 2), 'utf-8');
      results.push({ lesson: lesson.lessonNumber, status: 'ok', file: destName });
    } catch (e) {
      results.push({ lesson: lesson.lessonNumber, status: 'error', error: e.message });
    }
  }

  return results;
}

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
        return parseSourceFile(path.join(GSD_ROOT, src));
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

    // Next lesson title for bridge context
    const nextLesson = LESSON_PLAN.find(l => l.lessonNumber === lesson.lessonNumber + 1);
    context.nextLessonTitle = nextLesson ? nextLesson.title : 'Module Completion';

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
  const moduleFlag = args.indexOf('--module');
  const moduleId = moduleFlag !== -1 ? args[moduleFlag + 1] : null;

  if (args[0] === '--from-json') {
    const responsesDir = args[1] || args[3]; // handle --from-json <dir> --module <id> or --from-json --module <id> <dir>
    if (moduleId === 'gsd-commands') {
      if (!responsesDir) {
        console.error('Usage: generate-lessons.cjs --from-json <responses-dir> --module gsd-commands');
        process.exit(1);
      }
      const results = validateAndCopyModule1(responsesDir);
      console.log(JSON.stringify(results, null, 2));
      return;
    }
    if (!responsesDir) {
      console.error('Usage: generate-lessons.cjs --from-json <responses-dir>');
      process.exit(1);
    }
    const results = validateAndCopy(responsesDir);
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (moduleId === 'gsd-commands') {
    const results = generateModule1Prompts();
    console.log('Generated ' + results.length + ' prompt files (Module 1):');
    for (const r of results) {
      console.log('  ' + r.prompt);
    }
    return;
  }

  // Default: generate prompt text files for command-lifecycle
  const results = generatePrompts();
  console.log('Generated ' + results.length + ' prompt files:');
  for (const r of results) {
    console.log('  ' + r.prompt);
  }
}

main();

module.exports = { generatePrompts, validateAndCopy, LESSON_PLAN, MODULE1_LESSON_PLAN, generateModule1Prompts, validateAndCopyModule1 };
