'use strict';

const { style } = require('./terminal.cjs');

const CONCEPT_MAP = `
  User types /gsd:quick
        |
        v
  +------------------+     +------------------+
  | Command Spec     |---->| Workflow          |
  | commands/gsd/    |     | workflows/*.md    |
  +------------------+     +--------+---------+
                                    |
                                    v
                           +------------------+
                           | Tool Dispatch    |
                           | gsd-tools.cjs    |
                           +--------+---------+
                                    |
                       +------------+------------+
                       |            |            |
                       v            v            v
                 +---------+  +---------+  +---------+
                 | State   |  | Config  |  | Phase   |
                 | state   |  | config  |  | phase   |
                 | .cjs    |  | .cjs    |  | .cjs    |
                 +---------+  +---------+  +---------+
`;

/**
 * Render the concept map with an optional YOU ARE HERE marker.
 *
 * @param {string|null} currentSection - Section to highlight, or null for no marker.
 * @returns {string} Rendered concept map string.
 */
function renderConceptMap(currentSection) {
  const marker = ' <-- YOU ARE HERE';
  let map = CONCEPT_MAP;

  if (currentSection) {
    // Map section names to labels in the diagram
    const sectionMap = {
      'entry-point': 'Command Spec',
      'command-spec': 'Command Spec',
      'workflow': 'Workflow',
      'tool-dispatch': 'Tool Dispatch',
      'state': 'State',
      'config': 'Config',
      'phase': 'Phase',
    };

    const label = sectionMap[currentSection] || currentSection;
    // Find the label in the map and append marker
    map = map.replace(
      new RegExp('(\\|\\s*' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*)'),
      '$1' + marker
    );
  }

  return style('Architecture Overview:', 'bold', 'cyan') + '\n' + map + '\n';
}

module.exports = { renderConceptMap, CONCEPT_MAP };
