'use strict';
const { recordIteration } = require('../lib/evaluator.cjs');

// Iteration 2 scores - after improving conceptMapConnection and whyExplanations
const scores = {
  'welcome': {
    accuracy: 4,
    clarity: 5,
    depth: 3,
    whyExplanations: 4,
    conceptMapConnection: 4,
  },
  'entry-point': {
    accuracy: 5,
    clarity: 4,
    depth: 4,
    whyExplanations: 4,
    conceptMapConnection: 4,
  },
  'command-dispatch': {
    accuracy: 5,
    clarity: 4,
    depth: 4,
    whyExplanations: 4,
    conceptMapConnection: 4,
  },
  'tool-modules': {
    accuracy: 5,
    clarity: 4,
    depth: 4,
    whyExplanations: 4,
    conceptMapConnection: 4,
  },
  'state-and-config': {
    accuracy: 4,
    clarity: 4,
    depth: 4,
    whyExplanations: 4,
    conceptMapConnection: 5,
  },
};

recordIteration(2, scores, [
  'Iteration 2 improvements targeted conceptMapConnection (avg 3.0 -> 4.2) and whyExplanations (avg 3.6 -> 4.0).',
  'Changes made:',
  '- Lesson 1: Added file/line references to lesson roadmap, added concrete trace-through example (state advance-plan)',
  '- Lesson 2: Added bridging paragraph connecting entry point parsing to dispatch (next lesson)',
  '- Lesson 3: Added paragraph connecting switch dispatch to cmd* functions in tool modules and previewing state mutation',
  '- Lesson 4: Added summary paragraph connecting all four layers and previewing final lesson',
  '- Lesson 4: Strengthened whyExplanations for output 50KB buffer and module.exports placement',
  '- Lesson 5: Added defensive pattern rationale for || content fallback (human+machine editing conflict)',
  '- Lesson 5: Added full module recap connecting all 5 lessons with key design thread summary',
  '- Lesson 5: conceptMapConnection raised to 5 (strongest cross-references in module)',
].join('\n'));

console.log('Iteration 2 scores recorded.');
