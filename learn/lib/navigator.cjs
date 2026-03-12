'use strict';

const readline = require('readline');

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
 * @returns {Promise<'next'|'prev'|'quit'>}
 */
function waitForKey() {
  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    const handler = (str, key) => {
      if (!key) return;
      if (key.name === 'n' || key.name === 'right') {
        cleanup(); resolve('next');
      } else if (key.name === 'p' || key.name === 'left') {
        cleanup(); resolve('prev');
      } else if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
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
 * Main navigation loop.
 *
 * @param {Array} lessons - Array of lesson objects.
 * @param {number} startIndex - Index to start at.
 * @param {function} renderFn - Called with (lesson, currentIndex, totalLessons).
 * @param {function} progressFn - Called with (currentIndex) to save progress.
 */
async function runNavigationLoop(lessons, startIndex, renderFn, progressFn) {
  setupCleanExit();
  let current = startIndex;

  while (true) {
    renderFn(lessons[current], current, lessons.length);
    const action = await waitForKey();

    if (action === 'next' && current < lessons.length - 1) {
      current++;
      progressFn(current);
    } else if (action === 'prev' && current > 0) {
      current--;
    } else if (action === 'quit') {
      progressFn(current);
      break;
    }
  }
}

module.exports = { runNavigationLoop, setupCleanExit, waitForKey };
