'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Parse a GSD CommonJS source file into structured data.
 *
 * @param {string} filePath - Absolute path to the .cjs file.
 * @returns {object} Parsed source structure.
 */
function parseSourceFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const lines = source.split('\n');

  return {
    filePath: filePath,
    fileName: path.basename(filePath),
    lineCount: lines.length,
    moduleDoc: extractModuleDoc(source),
    requires: extractRequires(lines),
    exports: extractExports(source),
    functions: extractFunctions(lines),
    sections: extractSections(lines),
    constants: extractConstants(lines),
  };
}

/**
 * Extract top-level JSDoc comment (module documentation).
 */
function extractModuleDoc(source) {
  const match = source.match(/^\/\*\*\s*\n([\s\S]*?)\*\//);
  if (!match) return null;
  return match[1].replace(/^\s*\*\s?/gm, '').trim();
}

/**
 * Extract require() calls with their variable bindings.
 */
function extractRequires(lines) {
  const requires = [];
  for (const line of lines) {
    const match = line.match(/(?:const|let|var)\s+(\{[^}]+\}|\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/);
    if (match) {
      requires.push({
        binding: match[1].trim(),
        module: match[2],
        isDestructured: match[1].startsWith('{'),
      });
    }
  }
  return requires;
}

/**
 * Extract module.exports object keys.
 */
function extractExports(source) {
  const match = source.match(/module\.exports\s*=\s*\{([^}]+)\}/s);
  if (!match) return [];
  return match[1]
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Extract function declarations with name, line range, code, and JSDoc.
 */
function extractFunctions(lines) {
  const functions = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^function\s+(\w+)\s*\(/);
    if (!match) continue;

    const name = match[1];
    const startLine = i + 1; // 1-based

    // Count braces to find end of function
    let braceCount = 0;
    let endLine = startLine;
    let started = false;

    for (let j = i; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === '{') { braceCount++; started = true; }
        if (ch === '}') braceCount--;
      }
      if (started && braceCount === 0) {
        endLine = j + 1; // 1-based
        break;
      }
    }

    const code = lines.slice(i, endLine).join('\n');

    // Look backward for JSDoc
    let jsdoc = null;
    if (i > 0) {
      let docEnd = i - 1;
      // Skip blank lines
      while (docEnd >= 0 && lines[docEnd].trim() === '') docEnd--;

      if (docEnd >= 0 && lines[docEnd].trim().endsWith('*/')) {
        let docStart = docEnd;
        while (docStart > 0 && !lines[docStart].trim().startsWith('/**')) {
          docStart--;
        }
        if (lines[docStart].trim().startsWith('/**')) {
          jsdoc = lines.slice(docStart, docEnd + 1).join('\n')
            .replace(/^\s*\/\*\*\s*\n?/, '')
            .replace(/\s*\*\/\s*$/, '')
            .replace(/^\s*\*\s?/gm, '')
            .trim();
        }
      }
    }

    functions.push({ name, startLine, endLine, code, jsdoc });
  }

  return functions;
}

/**
 * Extract section separator comments (// --- Name --- or // ─── Name ───).
 */
function extractSections(lines) {
  const sections = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\/\/\s*(?:─+|---+)\s+(.+?)\s+(?:─+|-+)\s*$/);
    if (match) {
      sections.push({
        name: match[1].trim(),
        line: i + 1, // 1-based
      });
    }
  }
  return sections;
}

/**
 * Extract UPPER_SNAKE_CASE constant declarations.
 */
function extractConstants(lines) {
  const constants = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^const\s+([A-Z][A-Z0-9_]+)\s*=/);
    if (match) {
      constants.push({
        name: match[1],
        line: i + 1, // 1-based
      });
    }
  }
  return constants;
}

module.exports = { parseSourceFile };
