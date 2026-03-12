'use strict';

const { execSync, exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Get the platform-specific clipboard command.
 *
 * @returns {string} Clipboard command for current OS.
 */
function getClipboardCommand() {
  switch (process.platform) {
    case 'win32': return 'clip';
    case 'darwin': return 'pbcopy';
    default: return 'xclip -selection clipboard';
  }
}

/**
 * Copy text to the system clipboard.
 * Falls back to writing a temp file if clipboard command fails.
 *
 * @param {string} text - Text to copy.
 * @returns {{ success: boolean, fallbackPath?: string }}
 */
function copyToClipboard(text) {
  try {
    const cmd = getClipboardCommand();
    execSync(cmd, { input: text, stdio: ['pipe', 'pipe', 'pipe'], timeout: 3000 });
    return { success: true };
  } catch {
    return fallbackToFile(text);
  }
}

/**
 * Write text to a temp .md file as clipboard fallback.
 * Optionally opens the file with the OS default viewer.
 *
 * @param {string} text - Text to write.
 * @param {{ skipOpen?: boolean }} [options] - Options.
 * @returns {{ success: false, fallbackPath: string }}
 */
function fallbackToFile(text, options = {}) {
  const filePath = path.join(os.tmpdir(), 'gsd-lesson-' + Date.now() + '.md');
  fs.writeFileSync(filePath, text, 'utf-8');

  if (!options.skipOpen) {
    let openCmd;
    switch (process.platform) {
      case 'win32': openCmd = 'start ""'; break;
      case 'darwin': openCmd = 'open'; break;
      default: openCmd = 'xdg-open'; break;
    }
    // Fire and forget - don't block on opening
    exec(openCmd + ' "' + filePath + '"');
  }

  return { success: false, fallbackPath: filePath };
}

module.exports = { getClipboardCommand, copyToClipboard, fallbackToFile };
