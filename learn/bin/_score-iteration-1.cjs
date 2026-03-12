'use strict';
const { recordIteration } = require('../lib/evaluator.cjs');

// Iteration 1 scores - initial assessment of generated lessons
const scores = {
  'welcome': {
    accuracy: 4,
    clarity: 5,
    depth: 3,
    whyExplanations: 4,
    conceptMapConnection: 3,
  },
  'entry-point': {
    accuracy: 5,
    clarity: 4,
    depth: 4,
    whyExplanations: 4,
    conceptMapConnection: 3,
  },
  'command-dispatch': {
    accuracy: 5,
    clarity: 4,
    depth: 4,
    whyExplanations: 4,
    conceptMapConnection: 3,
  },
  'tool-modules': {
    accuracy: 5,
    clarity: 4,
    depth: 4,
    whyExplanations: 3,
    conceptMapConnection: 3,
  },
  'state-and-config': {
    accuracy: 4,
    clarity: 4,
    depth: 4,
    whyExplanations: 3,
    conceptMapConnection: 3,
  },
};

recordIteration(1, scores, 'Baseline iteration. Weakest dimensions: conceptMapConnection (avg 3.0) and whyExplanations (avg 3.6). Lessons use real source code but need stronger cross-lesson references and more consistent why explanations for design decisions.');

console.log('Iteration 1 scores recorded.');
