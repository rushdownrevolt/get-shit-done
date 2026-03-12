'use strict';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('concept-map.cjs', () => {
  let tmpDir;
  let moduleDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-concept-map-test-'));
    moduleDir = path.join(tmpDir, 'test-module');
    fs.mkdirSync(moduleDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('renderConceptMap(moduleDir, currentSection)', () => {
    test('loads ASCII art from concept-map.txt in moduleDir', () => {
      const { renderConceptMap } = require('../lib/concept-map.cjs');
      fs.writeFileSync(path.join(moduleDir, 'concept-map.txt'), 'Box A --> Box B');
      fs.writeFileSync(path.join(moduleDir, 'module.json'), JSON.stringify({ sectionMap: {} }));
      const result = renderConceptMap(moduleDir, null);
      assert.ok(result.includes('Box A --> Box B'), 'should contain the ASCII art from file');
    });

    test('returns fallback message when concept-map.txt is missing', () => {
      const { renderConceptMap } = require('../lib/concept-map.cjs');
      fs.writeFileSync(path.join(moduleDir, 'module.json'), JSON.stringify({ sectionMap: {} }));
      const result = renderConceptMap(moduleDir, null);
      assert.ok(result.includes('No concept map available'), 'should contain fallback message');
      // Should not crash
    });

    test('applies YOU ARE HERE marker using sectionMap from module.json', () => {
      const { renderConceptMap } = require('../lib/concept-map.cjs');
      fs.writeFileSync(path.join(moduleDir, 'concept-map.txt'), '| Command Spec     |\n| Workflow          |');
      fs.writeFileSync(path.join(moduleDir, 'module.json'), JSON.stringify({
        sectionMap: {
          'entry-point': 'Command Spec',
          'workflow': 'Workflow',
        },
      }));
      const result = renderConceptMap(moduleDir, 'entry-point');
      assert.ok(result.includes('YOU ARE HERE'), 'should contain YOU ARE HERE marker');
    });

    test('renders without marker when currentSection is null', () => {
      const { renderConceptMap } = require('../lib/concept-map.cjs');
      fs.writeFileSync(path.join(moduleDir, 'concept-map.txt'), '| Command Spec     |');
      fs.writeFileSync(path.join(moduleDir, 'module.json'), JSON.stringify({ sectionMap: {} }));
      const result = renderConceptMap(moduleDir, null);
      assert.ok(!result.includes('YOU ARE HERE'), 'should not contain YOU ARE HERE marker');
    });

    test('renders without marker when module.json has no sectionMap', () => {
      const { renderConceptMap } = require('../lib/concept-map.cjs');
      fs.writeFileSync(path.join(moduleDir, 'concept-map.txt'), '| Command Spec     |');
      fs.writeFileSync(path.join(moduleDir, 'module.json'), JSON.stringify({}));
      const result = renderConceptMap(moduleDir, 'entry-point');
      // No sectionMap means no label lookup, so no marker
      assert.ok(!result.includes('YOU ARE HERE'), 'should not add marker without sectionMap');
    });

    test('output contains Architecture Overview header', () => {
      const { renderConceptMap } = require('../lib/concept-map.cjs');
      fs.writeFileSync(path.join(moduleDir, 'concept-map.txt'), 'diagram');
      fs.writeFileSync(path.join(moduleDir, 'module.json'), JSON.stringify({ sectionMap: {} }));
      const result = renderConceptMap(moduleDir, null);
      assert.ok(result.includes('Architecture Overview'), 'should contain Architecture Overview header');
    });
  });
});
