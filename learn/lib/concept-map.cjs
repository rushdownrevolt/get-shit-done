'use strict';

const fs = require('fs');
const path = require('path');
const { style } = require('./terminal.cjs');

/**
 * Render the concept map for a module with an optional YOU ARE HERE marker.
 *
 * Loads ASCII art from concept-map.txt in the module directory and
 * sectionMap from module.json in the same directory.
 *
 * @param {string} moduleDir - Absolute path to the module directory.
 * @param {string|null} currentSection - Section to highlight, or null for no marker.
 * @returns {string} Rendered concept map string.
 */
function renderConceptMap(moduleDir, currentSection) {
  const marker = ' <-- YOU ARE HERE';

  // Load ASCII art from concept-map.txt
  const mapPath = path.join(moduleDir, 'concept-map.txt');
  let map;
  try {
    map = fs.readFileSync(mapPath, 'utf-8');
  } catch {
    return style('Architecture Overview:', 'bold', 'cyan') + '\n\n  No concept map available\n\n';
  }

  // Load sectionMap from module.json
  let sectionMap = null;
  try {
    const moduleJson = JSON.parse(fs.readFileSync(path.join(moduleDir, 'module.json'), 'utf-8'));
    sectionMap = moduleJson.sectionMap || null;
  } catch {
    // No module.json or no sectionMap — skip marker
  }

  if (currentSection && sectionMap) {
    const label = sectionMap[currentSection] || currentSection;
    if (label && sectionMap[currentSection]) {
      // Find the label in the map and append marker
      map = map.replace(
        new RegExp('(\\|\\s*' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*)'),
        '$1' + marker
      );
    }
  }

  return style('Architecture Overview:', 'bold', 'cyan') + '\n' + map + '\n';
}

module.exports = { renderConceptMap };
