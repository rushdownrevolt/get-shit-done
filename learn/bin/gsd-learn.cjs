#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { validateEnvironment, formatError } = require('../lib/errors.cjs');
const { loadProgress, saveProgress, isFirstRun } = require('../lib/progress.cjs');
const { loadModule, listModules } = require('../lib/lessons.cjs');
const { renderLesson, renderPart, renderCompletionBanner, renderWelcomeScreen, renderModulePicker } = require('../lib/renderer.cjs');
const { runNavigationLoop, waitForKey, waitForPickerKey } = require('../lib/navigator.cjs');
const { runVerification } = require('../lib/verifier.cjs');
const { getNextHint } = require('../lib/hints.cjs');
const { recordEvent, loadFeedback } = require('../lib/feedback.cjs');
const { style } = require('../lib/terminal.cjs');

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
    const mod = progress.currentModule || flags.module || 'gsd-commands';
    const lesson = progress.currentLesson || 0;
    process.stdout.write('Module: ' + mod + '\n');
    process.stdout.write('Current lesson: ' + (lesson + 1) + '\n');
    process.exit(0);
  }

  // --verify: run structural verification
  if (flags.verify) {
    const verifyModuleId = flags.module || 'gsd-commands';
    const specPath = path.join(__dirname, '..', 'content', 'modules', verifyModuleId, 'project', 'spec.json');
    const result = runVerification(cwd, specPath);
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    const projectId = spec.id || verifyModuleId + '-project';

    recordEvent(cwd, projectId, 'verify_attempt', { passed: result.passed, artifactCount: result.artifacts.length });
    if (result.passed) {
      recordEvent(cwd, projectId, 'project_completed', {});
    }

    // Format output
    const lines = [];
    lines.push(style('Verification Results', 'bold', 'cyan'));
    lines.push('');
    for (const artifact of result.artifacts) {
      const icon = artifact.passed ? style('[PASS]', 'green') : style('[FAIL]', 'red');
      lines.push(icon + ' ' + style(artifact.description, 'bold'));
      for (const check of artifact.results) {
        const checkIcon = check.passed ? style('  [PASS]', 'green') : style('  [FAIL]', 'red');
        lines.push(checkIcon + ' ' + check.check);
      }
      lines.push('');
    }

    if (result.passed) {
      lines.push(style('All checks passed! Well done.', 'green', 'bold'));
    } else {
      lines.push(style('Some checks failed.', 'red', 'bold'));
      lines.push('Use --hint for guidance.');
    }
    lines.push('');

    process.stdout.write(lines.join('\n'));
    process.exit(result.passed ? 0 : 1);
  }

  // --hint: show next progressive hint
  if (flags.hint) {
    const hintModuleId = flags.module || 'gsd-commands';
    const hintsPath = path.join(__dirname, '..', 'content', 'modules', hintModuleId, 'project', 'hints.json');
    const hints = JSON.parse(fs.readFileSync(hintsPath, 'utf-8'));
    const specPath = path.join(__dirname, '..', 'content', 'modules', hintModuleId, 'project', 'spec.json');
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    const projectId = spec.id || hintModuleId + '-project';

    // Count previous hint_requested events
    const feedback = loadFeedback(cwd);
    const project = feedback.projects[projectId];
    let hintsUsed = 0;
    if (project) {
      hintsUsed = project.events.filter(e => e.type === 'hint_requested').length;
    }

    const result = getNextHint(hints, hintsUsed);

    if (result.hint === null) {
      process.stdout.write('No more hints available. You\'ve seen all ' + hints.length + ' hints.\n');
    } else {
      process.stdout.write(style('Hint ' + result.hintsUsed + ' of ' + hints.length + ':', 'yellow', 'bold') + '\n');
      process.stdout.write(result.hint + '\n');
      if (result.remaining > 0) {
        process.stdout.write(style(result.remaining + ' hint(s) remaining.', 'dim') + '\n');
      }
    }

    recordEvent(cwd, projectId, 'hint_requested', { hintIndex: result.hintsUsed - 1 });
    process.exit(0);
  }

  // Default: start/resume learning
  const progress = loadProgress(cwd);
  const contentDir = path.join(__dirname, '..', 'content');

  // Detect first-run (Phase 10 will use this for welcome screen)
  const firstRun = isFirstRun(progress);

  // Determine starting module from saved progress or CLI flag
  let activeModuleId = flags.module || progress.currentModule || 'gsd-commands';

  let action = firstRun ? 'welcome' : 'navigate';

  while (true) {
    if (action === 'welcome') {
      const modules = listModules(contentDir);
      // Enrich modules with lessonCount
      for (const mod of modules) {
        const loaded = loadModule(mod.id, contentDir);
        mod.lessonCount = loaded.lessons.length;
      }
      process.stdout.write(renderWelcomeScreen(modules, progress));
      const selected = await waitForPickerKey(modules.length);
      if (selected.action === 'quit') break;
      activeModuleId = modules[selected.index].id;
      action = 'navigate';
      continue;
    } else if (action === 'picker') {
      const modules = listModules(contentDir);
      // Enrich modules with lessonCount
      for (const mod of modules) {
        const loaded = loadModule(mod.id, contentDir);
        mod.lessonCount = loaded.lessons.length;
      }
      process.stdout.write(renderModulePicker(modules, progress));
      const selected = await waitForPickerKey(modules.length);
      if (selected.action === 'quit') break;
      activeModuleId = modules[selected.index].id;
      // If selected module is completed, reset for review mode
      if (progress.modules[activeModuleId] && progress.modules[activeModuleId].completed) {
        progress.modules[activeModuleId].currentLesson = 0;
        saveProgress(cwd, progress);
      }
      action = 'navigate';
      continue;
    } else if (action === 'navigate') {
      const mod = loadModule(activeModuleId, contentDir);
      const moduleProgress = progress.modules[activeModuleId] || { currentLesson: 0, started: false, completed: false };
      const startIndex = Math.min(moduleProgress.currentLesson || 0, mod.lessons.length - 1);

      // Show module intro for unstarted modules (per user decision)
      if (!moduleProgress.started) {
        process.stdout.write('\n');
        process.stdout.write(`  ${mod.title}\n`);
        process.stdout.write(`  ${mod.description}\n\n`);
        process.stdout.write('  Press any key to begin\n');
        await waitForKey();
      }

      // Mark module as started, update top-level tracking
      progress.currentModule = activeModuleId;
      progress.currentLesson = moduleProgress.currentLesson || 0;
      if (!progress.modules[activeModuleId]) {
        progress.modules[activeModuleId] = { currentLesson: 0, started: true, completed: false };
      }
      progress.modules[activeModuleId].started = true;
      saveProgress(cwd, progress);

      const moduleDir = path.join(contentDir, 'modules', activeModuleId);

      const renderFn = (lesson, partIndex, totalParts, currentLessonIdx, totalLessons) => {
        process.stdout.write(renderPart(lesson, partIndex, totalParts, currentLessonIdx, totalLessons, moduleDir, mod.title));
      };

      const progressFn = (idx) => {
        // Update BOTH top-level and per-module position (per user decision)
        progress.currentLesson = idx;
        progress.modules[activeModuleId].currentLesson = idx;
        saveProgress(cwd, progress);

        // Track project_started when learner views a lesson with project content
        const lesson = mod.lessons[idx];
        if (lesson && lesson.content) {
          const hasProject = lesson.content.some(s => s.type === 'project');
          if (hasProject) {
            const specPath = path.join(__dirname, '..', 'content', 'modules', activeModuleId, 'project', 'spec.json');
            try {
              const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
              const projectId = spec.id || activeModuleId + '-project';
              const feedback = loadFeedback(cwd);
              const proj = feedback.projects[projectId];
              const alreadyStarted = proj && proj.events.some(e => e.type === 'project_started');
              if (!alreadyStarted) {
                recordEvent(cwd, projectId, 'project_started', {});
              }
            } catch {
              // spec.json not found -- skip tracking
            }
          }
        }
      };

      // Load hints for H key inline display
      let moduleHints = [];
      const hintsPath = path.join(__dirname, '..', 'content', 'modules', activeModuleId, 'project', 'hints.json');
      try {
        moduleHints = JSON.parse(fs.readFileSync(hintsPath, 'utf-8'));
      } catch {
        // No hints file for this module -- H key will be silently ignored
      }

      // Count existing hint_requested events for cross-session persistence
      let initialHintsUsed = 0;
      const hintSpecPath = path.join(__dirname, '..', 'content', 'modules', activeModuleId, 'project', 'spec.json');
      let projectId = activeModuleId + '-project';
      try {
        const spec = JSON.parse(fs.readFileSync(hintSpecPath, 'utf-8'));
        projectId = spec.id || projectId;
      } catch {}
      const hintFeedback = loadFeedback(cwd);
      const hintProj = hintFeedback.projects[projectId];
      if (hintProj) {
        initialHintsUsed = hintProj.events.filter(e => e.type === 'hint_requested').length;
      }

      const recordHintFn = (hintIndex) => {
        recordEvent(cwd, projectId, 'hint_requested', { hintIndex });
      };

      const result = await runNavigationLoop(mod.lessons, startIndex, renderFn, progressFn, {
        moduleMeta: { title: mod.title, lessonCount: mod.lessons.length },
        completionBannerFn: renderCompletionBanner,
        hints: moduleHints,
        hintsUsed: initialHintsUsed,
        recordHintFn: recordHintFn,
        moduleDir: moduleDir,
      });

      if (result.reason === 'quit') {
        break;
      } else if (result.reason === 'modules') {
        action = 'picker'; // Phase 10 will handle this
        continue;
      } else if (result.reason === 'completed') {
        progress.modules[activeModuleId].completed = true;
        saveProgress(cwd, progress);
        action = 'picker';
        continue;
      }
    }
  }

  process.stdout.write('\nGoodbye! Your progress has been saved.\n');
}

main().catch((err) => {
  process.stderr.write(formatError(err.message || String(err)));
  process.exit(1);
});
