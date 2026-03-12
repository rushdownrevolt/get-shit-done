#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { validateEnvironment, formatError } = require('../lib/errors.cjs');
const { loadProgress, saveProgress } = require('../lib/progress.cjs');
const { loadModule } = require('../lib/lessons.cjs');
const { renderLesson } = require('../lib/renderer.cjs');
const { runNavigationLoop } = require('../lib/navigator.cjs');

const cwd = process.cwd();

// ─── CLI Argument Parsing ─────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = {};
for (const arg of args) {
  if (arg.startsWith('--')) {
    const eq = arg.indexOf('=');
    if (eq !== -1) {
      flags[arg.slice(2, eq)] = arg.slice(eq + 1);
    } else {
      flags[arg.slice(2)] = true;
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  // Validate environment
  const env = validateEnvironment(cwd);
  if (!env.valid) {
    process.stderr.write(formatError(env.message));
    process.exit(1);
  }

  const moduleId = flags.module || 'command-lifecycle';
  const contentDir = path.join(__dirname, '..', 'content');

  // --reset: clear progress
  if (flags.reset) {
    const progressPath = path.join(cwd, '.planning', 'learn', 'progress.json');
    try { fs.unlinkSync(progressPath); } catch {}
    process.stdout.write('Progress reset. Run gsd-learn again to start from the beginning.\n');
    process.exit(0);
  }

  // --status: show progress summary
  if (flags.status) {
    const progress = loadProgress(cwd);
    const mod = progress.currentModule || moduleId;
    const lesson = progress.currentLesson || 0;
    process.stdout.write('Module: ' + mod + '\n');
    process.stdout.write('Current lesson: ' + (lesson + 1) + '\n');
    process.exit(0);
  }

  // Default: start/resume learning
  const progress = loadProgress(cwd);
  const mod = loadModule(moduleId, contentDir);
  const startIndex = Math.min(progress.currentLesson || 0, mod.lessons.length - 1);

  // Update progress with current module
  progress.currentModule = moduleId;

  const renderFn = (lesson, idx, total) => {
    process.stdout.write(renderLesson(lesson, idx, total));
  };

  const progressFn = (idx) => {
    progress.currentLesson = idx;
    saveProgress(cwd, progress);
  };

  await runNavigationLoop(mod.lessons, startIndex, renderFn, progressFn);
  process.stdout.write('\nGoodbye! Your progress has been saved.\n');
}

main().catch((err) => {
  process.stderr.write(formatError(err.message || String(err)));
  process.exit(1);
});
