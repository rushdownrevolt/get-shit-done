'use strict';

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const useColor = !!(process.stdout.isTTY && !process.env.NO_COLOR);

function style(text, ...styles) {
  if (!useColor) return text;
  const prefix = styles.map(s => COLORS[s] || '').join('');
  return prefix + text + COLORS.reset;
}

/**
 * Style with color forced on (for testing).
 */
function _styleWithColor(text, ...styles) {
  const prefix = styles.map(s => COLORS[s] || '').join('');
  return prefix + text + COLORS.reset;
}

/**
 * Style with color forced off (for testing).
 */
function _styleNoColor(text) {
  return text;
}

function clearScreen() {
  return '\x1b[2J\x1b[H';
}

function horizontalRule(width) {
  const w = width || process.stdout.columns || 80;
  return style('\u2500'.repeat(w), 'dim');
}

/**
 * Horizontal rule with color forced on (for testing).
 */
function _horizontalRuleWithColor(width) {
  const w = width || 80;
  return COLORS.dim + '\u2500'.repeat(w) + COLORS.reset;
}

// ─── Simple JS Syntax Highlighting ──────────────────────────────────────

const JS_KEYWORDS = /\b(const|let|var|function|return|if|else|switch|case|require|module|exports|class|new|this|for|while|break|continue|throw|try|catch|finally|typeof|instanceof)\b/g;
const JS_STRINGS = /(["'`])(?:(?!\1).)*?\1/g;
const JS_COMMENTS = /\/\/.*/g;

function highlightJS(code) {
  if (!useColor) return code;
  return code
    .replace(JS_COMMENTS, match => COLORS.dim + match + COLORS.reset)
    .replace(JS_STRINGS, match => COLORS.green + match + COLORS.reset)
    .replace(JS_KEYWORDS, match => COLORS.cyan + match + COLORS.reset);
}

/**
 * HighlightJS with color forced on (for testing).
 */
function _highlightJSWithColor(code) {
  return code
    .replace(JS_COMMENTS, match => COLORS.dim + match + COLORS.reset)
    .replace(JS_STRINGS, match => COLORS.green + match + COLORS.reset)
    .replace(JS_KEYWORDS, match => COLORS.cyan + match + COLORS.reset);
}

/**
 * HighlightJS with color forced off (for testing).
 */
function _highlightJSNoColor(code) {
  return code;
}

module.exports = {
  COLORS,
  style,
  clearScreen,
  horizontalRule,
  useColor,
  highlightJS,
  _styleWithColor,
  _styleNoColor,
  _horizontalRuleWithColor,
  _highlightJSWithColor,
  _highlightJSNoColor,
};
