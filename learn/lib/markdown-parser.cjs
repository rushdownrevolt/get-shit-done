'use strict';

/**
 * GSD Markdown Parser — Purpose-built parser for command spec and workflow files.
 *
 * Extracts: frontmatter, XML sections, file references, code blocks.
 * Scoped to command specs (with frontmatter) and workflows (without frontmatter).
 */

const fs = require('fs');
const path = require('path');
const { extractFrontmatter } = require('./frontmatter.cjs');

/**
 * Extract named XML sections from content into a map.
 * Duplicate tags are converted to arrays.
 *
 * Uses non-greedy regex to avoid pitfall of greedy dotall matching.
 */
function extractXmlSections(content) {
  const sections = {};
  const regex = /<(\w+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g;

  function addSection(tag, body) {
    if (tag in sections) {
      if (Array.isArray(sections[tag])) {
        sections[tag].push(body);
      } else {
        sections[tag] = [sections[tag], body];
      }
    } else {
      sections[tag] = body;
    }
  }

  let match;
  while ((match = regex.exec(content)) !== null) {
    const tag = match[1];
    const body = match[2].trim();
    addSection(tag, body);

    // Also extract nested tags from within this section's content
    const innerRegex = /<(\w+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g;
    let innerMatch;
    while ((innerMatch = innerRegex.exec(match[2])) !== null) {
      addSection(innerMatch[1], innerMatch[2].trim());
    }
  }

  return sections;
}

/**
 * Extract @file: and @path references from content.
 * Matches @path patterns that look like file references (contain / or \ or .).
 */
function extractFileReferences(content) {
  const refs = [];
  const regex = /@([^\s<>]+)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const ref = match[1];
    // Filter to file-like refs: must contain path separator or file extension
    if (ref.includes('/') || ref.includes('\\') || ref.includes('.')) {
      refs.push(ref);
    }
  }

  return refs;
}

/**
 * Extract fenced code blocks with optional language annotation.
 */
function extractCodeBlocks(content) {
  const blocks = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || null,
      code: match[2].trimEnd(),
    });
  }

  return blocks;
}

/**
 * Parse a GSD markdown file (command spec or workflow).
 *
 * @param {string} filePath - Absolute path to the markdown file
 * @returns {Object} Parsed result with fileType, frontmatter, sections, etc.
 * @throws {Error} If file does not exist
 */
function parseMarkdownFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Cannot read file: ${filePath} (${err.code || err.message})`);
  }

  // Detect file type based on frontmatter presence
  const hasFrontmatter = content.startsWith('---\n');
  const fileType = hasFrontmatter ? 'command-spec' : 'workflow';

  // Extract frontmatter
  const frontmatter = hasFrontmatter ? extractFrontmatter(content) : {};

  // Extract body (content after frontmatter, or full content)
  let body;
  if (hasFrontmatter) {
    const fmEnd = content.match(/^---\n[\s\S]+?\n---\n?/);
    body = fmEnd ? content.slice(fmEnd[0].length) : content;
  } else {
    body = content;
  }

  // Extract structured data from body
  const sections = extractXmlSections(body);
  const fileReferences = extractFileReferences(body);
  const codeBlocks = extractCodeBlocks(body);

  return {
    filePath,
    fileName: path.basename(filePath),
    fileType,
    frontmatter,
    sections,
    fileReferences,
    codeBlocks,
    body,
  };
}

module.exports = { parseMarkdownFile };
