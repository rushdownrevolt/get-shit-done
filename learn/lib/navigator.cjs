'use strict';

const readline = require('readline');
const { groupContentItems } = require('./renderer.cjs');
const { getNextHint } = require('./hints.cjs');
const { style } = require('./terminal.cjs');

/**
 * Register process exit handlers to restore stdin raw mode.
 */
function setupCleanExit() {
  const restore = () => {
    if (process.stdin.isTTY) {
      try { process.stdin.setRawMode(false); } catch {}
    }
  };
  process.on('exit', restore);
  process.on('SIGINT', () => { restore(); process.exit(0); });
  process.on('SIGTERM', () => { restore(); process.exit(0); });
}

/**
 * Wait for a single keypress and resolve with action name.
 *
 * Key mappings:
 *   w       -> 'next'    (advance to next part)
 *   q       -> 'prev'    (go back one part)
 *   e       -> 'skip'    (skip to next lesson)
 *   c       -> 'copy'    (copy full lesson to clipboard)
 *   m       -> 'modules' (return to module picker)
 *   h       -> 'hint'    (show next progressive hint on project steps)
 *   escape  -> 'quit'    (quit and save progress)
 *   Ctrl+C  -> 'quit'    (quit and save progress)
 *
 * Arrow keys and old n/p bindings are removed.
 *
 * @returns {Promise<'next'|'prev'|'skip'|'copy'|'modules'|'hint'|'quit'>}
 */
function waitForKey() {
  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    const handler = (str, key) => {
      if (!key) return;
      if (key.name === 'w') {
        cleanup(); resolve('next');
      } else if (key.name === 'q') {
        cleanup(); resolve('prev');
      } else if (key.name === 'e') {
        cleanup(); resolve('skip');
      } else if (key.name === 'c' && !key.ctrl) {
        cleanup(); resolve('copy');
      } else if (key.name === 'm') {
        cleanup(); resolve('modules');
      } else if (key.name === 'h') {
        cleanup(); resolve('hint');
      } else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        cleanup(); resolve('quit');
      }
    };

    function cleanup() {
      process.stdin.removeListener('keypress', handler);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
    }

    process.stdin.on('keypress', handler);
    process.stdin.resume();
  });
}

/**
 * Main navigation loop with two-level part navigation.
 *
 * Outer loop: iterates over lessons.
 * Inner loop: iterates over parts within each lesson.
 *
 * @param {Array} lessons - Array of lesson objects.
 * @param {number} startIndex - Lesson index to start at.
 * @param {function} renderFn - Called with (lesson, partIndex, totalParts, currentLessonIndex, totalLessons).
 * @param {function} progressFn - Called with (currentLessonIndex) to save progress.
 * @param {object} [opts] - Optional settings.
 * @param {object} [opts.moduleMeta] - { title, lessonCount } for completion banner.
 * @param {function} [opts.completionBannerFn] - renderCompletionBanner function.
 */
async function runNavigationLoop(lessons, startIndex, renderFn, progressFn, opts) {
  setupCleanExit();
  const totalLessons = lessons.length;
  let currentLesson = startIndex;
  let startPart = 0;

  outer:
  while (currentLesson < totalLessons) {
    const lesson = lessons[currentLesson];
    const groups = groupContentItems(lesson.content);
    const totalParts = groups.length + (lesson.conceptMap ? 1 : 0);
    let currentPart = startPart;
    startPart = 0;

    while (true) {
      renderFn(lesson, currentPart, totalParts, currentLesson, totalLessons);
      const action = await waitForKey();

      if (action === 'next') {
        if (currentPart < totalParts - 1) {
          // Advance to next part within lesson
          currentPart++;
        } else if (currentLesson < totalLessons - 1) {
          // Advance to next lesson (part 0)
          currentLesson++;
          progressFn(currentLesson);
          continue outer;
        } else {
          // Last part of last lesson -- show completion banner
          if (opts && opts.completionBannerFn && opts.moduleMeta) {
            const totalPartsAll = lessons.reduce((sum, l) => sum + groupContentItems(l.content).length + (l.conceptMap ? 1 : 0), 0);
            const miniProjectCount = lessons.filter(l => l.content.some(s => s.type === 'project')).length;
            const banner = opts.completionBannerFn({
              title: opts.moduleMeta.title,
              lessonCount: opts.moduleMeta.lessonCount,
              totalParts: totalPartsAll,
              miniProjectCount: miniProjectCount,
            });
            process.stdout.write(banner);
            await waitForKey(); // Any key quits after banner
          }
          progressFn(currentLesson);
          return { reason: 'completed' };
        }
      } else if (action === 'prev') {
        const prevPos = computePrevPosition(currentLesson, currentPart, lessons, groupContentItems);
        if (prevPos === null) {
          // At absolute start, do nothing
        } else if (prevPos.lesson !== currentLesson) {
          // Navigate to previous lesson
          currentLesson = prevPos.lesson;
          startPart = prevPos.part;
          continue outer;
        } else {
          currentPart = prevPos.part;
        }
      } else if (action === 'skip') {
        if (currentLesson < totalLessons - 1) {
          currentLesson++;
          progressFn(currentLesson);
          continue outer;
        }
        // If last lesson, do nothing
      } else if (action === 'copy') {
        const { formatLessonForClipboard } = require('./clipboard-formatter.cjs');
        const { copyToClipboard } = require('./clipboard.cjs');
        const markdown = formatLessonForClipboard(lesson, currentLesson, totalLessons);
        const result = copyToClipboard(markdown);
        process.stdout.write('\x1b[2J\x1b[H'); // clear screen
        if (result.success) {
          process.stdout.write('\n  \x1b[32m\x1b[1m  Copied to clipboard\x1b[0m\n');
        } else {
          process.stdout.write('\n  \x1b[33m  Saved to: ' + result.fallbackPath + '\x1b[0m\n');
        }
        await new Promise(r => setTimeout(r, 1500));
        continue;
      } else if (action === 'quit') {
        progressFn(currentLesson);
        return { reason: 'quit' };
      } else if (action === 'modules') {
        progressFn(currentLesson);
        return { reason: 'modules' };
      } else if (action === 'hint') {
        const isMiniProject = lesson.content.some(s => s.type === 'project');
        if (isMiniProject && opts && opts.hints) {
          const hintsUsed = opts.hintsUsed || 0;
          const result = getNextHint(opts.hints, hintsUsed);
          if (result.hint !== null) {
            opts.hintsUsed = result.hintsUsed;
            process.stdout.write('\n  ' + style('Hint ' + result.hintsUsed + ' of ' + opts.hints.length + ':', 'yellow', 'bold') + '\n');
            process.stdout.write('  ' + result.hint + '\n');
            if (result.remaining > 0) {
              process.stdout.write('  ' + style(result.remaining + ' hint(s) remaining', 'dim') + '\n');
            }
            if (opts.recordHintFn) opts.recordHintFn(result.hintsUsed - 1);
          } else {
            process.stdout.write('\n  ' + style('No more hints available.', 'dim') + '\n');
          }
        }
        // Silently ignore H on non-project steps (no footer [h] shown, so no expectation)
        continue;
      }
    }
  }
  // Safety: while condition became false (currentLesson >= totalLessons)
  return { reason: 'completed' };
}

/**
 * Compute the previous position when navigating backward.
 *
 * @param {number} currentLesson - Current lesson index.
 * @param {number} currentPart - Current part index within the lesson.
 * @param {Array} lessons - Array of lesson objects.
 * @param {function} groupFn - groupContentItems function.
 * @returns {{ lesson: number, part: number } | null} New position, or null if at absolute start.
 */
function computePrevPosition(currentLesson, currentPart, lessons, groupFn) {
  if (currentPart > 0) {
    return { lesson: currentLesson, part: currentPart - 1 };
  } else if (currentLesson > 0) {
    const prevLesson = lessons[currentLesson - 1];
    const prevGroups = groupFn(prevLesson.content);
    const prevTotalParts = prevGroups.length + (prevLesson.conceptMap ? 1 : 0);
    return { lesson: currentLesson - 1, part: prevTotalParts - 1 };
  }
  return null;
}

/**
 * Wait for a picker key selection (number key or quit).
 *
 * @param {number} moduleCount - Number of modules available.
 * @returns {Promise<{ action: 'select', index: number } | { action: 'quit' }>}
 */
function waitForPickerKey(moduleCount) {
  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    const handler = (str, key) => {
      if (!key) return;

      // Check for number key
      const num = parseInt(key.name, 10) || parseInt(str, 10);
      if (num >= 1 && num <= moduleCount) {
        cleanup(); resolve({ action: 'select', index: num - 1 });
        return;
      }

      if (key.name === 'q' || key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        cleanup(); resolve({ action: 'quit' });
      }
    };

    function cleanup() {
      process.stdin.removeListener('keypress', handler);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
    }

    process.stdin.on('keypress', handler);
    process.stdin.resume();
  });
}

module.exports = { runNavigationLoop, setupCleanExit, waitForKey, computePrevPosition, waitForPickerKey };
