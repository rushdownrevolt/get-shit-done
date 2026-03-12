'use strict';

/**
 * Get the next hint for a project, tracking how many have been shown.
 *
 * @param {Array<string>} hints - Ordered hint array (vague to specific).
 * @param {number} hintsUsed - How many hints already shown.
 * @returns {{ hint: string|null, hintsUsed: number, remaining: number }}
 */
function getNextHint(hints, hintsUsed) {
  if (hintsUsed >= hints.length) {
    return { hint: null, hintsUsed, remaining: 0 };
  }
  return {
    hint: hints[hintsUsed],
    hintsUsed: hintsUsed + 1,
    remaining: hints.length - hintsUsed - 1,
  };
}

module.exports = { getNextHint };
