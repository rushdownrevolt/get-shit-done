'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('concept-map.cjs', () => {
  describe('renderConceptMap()', () => {
    test('returns string containing YOU ARE HERE near the matching section', () => {
      const { renderConceptMap } = require('../lib/concept-map.cjs');
      const result = renderConceptMap('entry-point');
      assert.ok(result.includes('YOU ARE HERE'), 'should contain YOU ARE HERE marker');
    });

    test('returns concept map without marker when section is null', () => {
      const { renderConceptMap } = require('../lib/concept-map.cjs');
      const result = renderConceptMap(null);
      assert.ok(!result.includes('YOU ARE HERE'), 'should not contain YOU ARE HERE marker');
    });

    test('output contains section labels', () => {
      const { renderConceptMap } = require('../lib/concept-map.cjs');
      const result = renderConceptMap(null);
      assert.ok(result.includes('Command Spec'), 'should contain Command Spec');
      assert.ok(result.includes('Workflow'), 'should contain Workflow');
      assert.ok(result.includes('Tool Dispatch'), 'should contain Tool Dispatch');
    });
  });

  describe('CONCEPT_MAP', () => {
    test('exports the ASCII architecture diagram string', () => {
      const { CONCEPT_MAP } = require('../lib/concept-map.cjs');
      assert.strictEqual(typeof CONCEPT_MAP, 'string');
      assert.ok(CONCEPT_MAP.length > 50, 'concept map should be a substantial string');
      assert.ok(CONCEPT_MAP.includes('Command Spec'), 'should contain Command Spec');
    });
  });
});
