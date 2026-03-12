'use strict';

const readline = require('readline');
const { groupContentItems } = require('./renderer.cjs');

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
 *   w       -> 'next'   (advance to next part)
 *   q       -> 'prev'   (go back one part)
 *   e       -> 'skip'   (skip to next lesson)
 *   c       -> 'copy'   (copy full lesson to clipboard)
 *   escape  -> 'quit'   (quit and save progress)
 *   Ctrl+C  -> 'quit'   (quit and save progress)
 *
 * Arrow keys and old n/p bindings are removed.
 *
 * @returns {Promise<'next'|'prev'|'skip'|'copy'|'quit'>}
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

  outer:
  while (currentLesson < totalLessons) {
    const lesson = lessons[currentLesson];
    const groups = groupContentItems(lesson.content);
    const totalParts = groups.length + (lesson.conceptMap ? 1 : 0);
    let currentPart = 0;

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
          return;
        }
      } else if (action === 'prev') {
        if (currentPart > 0) {
          currentPart--;
        }
        // If currentPart === 0, do nothing (stay on first part)
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
        return;
      }
    }
  }
}

module.exports = { runNavigationLoop, setupCleanExit, waitForKey };
