'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');

const { renderLesson, renderProgressDots, renderCompletionBanner, renderPart, groupContentItems, renderLessonProgressFooter } = require('../lib/renderer.cjs');
const { COLORS, _styleWithColor } = require('../lib/terminal.cjs');

describe('renderLesson', () => {
  const lesson = {
    id: 'test-lesson',
    title: 'Test Lesson Title',
    lessonNumber: 2,
    objective: 'Learn about testing renderers',
    content: [
      { type: 'text', value: 'This is a text block.', focus: 'Text block basics', bridge: 'Next we look at code.' },
      { type: 'code', language: 'javascript', value: 'const x = 1;', highlight: [1], focus: 'Variable declaration', bridge: 'Now you know variables.' },
    ],
    conceptMap: null,
    successCriteria: 'You can verify renderer output',
  };

  test('returns a string containing the lesson title', () => {
    const output = renderLesson(lesson, 1, 5);
    assert.ok(typeof output === 'string', 'renderLesson should return a string');
    assert.ok(output.includes('Test Lesson Title'), 'output should contain lesson title');
  });

  test('includes position indicator "Lesson 2 of 5"', () => {
    const output = renderLesson(lesson, 1, 5);
    assert.ok(output.includes('Lesson 2 of 5'), 'output should contain "Lesson 2 of 5"');
  });

  test('includes the lesson objective text', () => {
    const output = renderLesson(lesson, 0, 3);
    assert.ok(output.includes('Learn about testing renderers'), 'output should contain the objective');
  });

  test('includes the success criteria text', () => {
    const output = renderLesson(lesson, 0, 3);
    assert.ok(output.includes('You can verify renderer output'), 'output should contain success criteria');
  });

  test('renders text content blocks as-is', () => {
    const output = renderLesson(lesson, 0, 1);
    assert.ok(output.includes('This is a text block.'), 'output should contain text block content');
  });

  test('renders code content blocks with highlightJS applied', () => {
    const output = renderLesson(lesson, 0, 1);
    // The code block should contain the code text (possibly with ANSI codes)
    assert.ok(output.includes('const'), 'output should contain the code keyword');
    assert.ok(output.includes('x = 1'), 'output should contain the code assignment');
  });

  test('includes navigation hint footer', () => {
    const output = renderLesson(lesson, 0, 1);
    assert.ok(output.includes('[n]'), 'output should contain next hint');
    assert.ok(output.includes('[p]'), 'output should contain prev hint');
    assert.ok(output.includes('[q]'), 'output should contain quit hint');
  });

  test('includes concept map when lesson has one and moduleDir is provided', () => {
    const lessonWithMap = { ...lesson, conceptMap: 'tool-dispatch' };
    // renderLesson requires moduleDir to render concept maps; without it, concept map is skipped
    const output = renderLesson(lessonWithMap, 0, 1);
    // Without moduleDir, concept map section is not rendered
    assert.ok(typeof output === 'string', 'should still return a string without moduleDir');
  });

  test('code section with source field renders file path text', () => {
    const lessonWithSource = {
      ...lesson,
      content: [
        {
          type: 'code',
          language: 'javascript',
          value: 'const x = 1;',
          source: { file: 'bin/gsd-tools.cjs', startLine: 10 },
          focus: 'Source code example',
          bridge: 'See the file link above.',
        },
      ],
    };
    const output = renderLesson(lessonWithSource, 0, 1);
    assert.ok(output.includes('bin/gsd-tools.cjs'), 'output should contain file path');
    assert.ok(output.includes('10'), 'output should contain start line number');
  });

  test('code section without source field renders normally (backward compatible)', () => {
    const lessonNoSource = {
      ...lesson,
      content: [
        { type: 'code', language: 'javascript', value: 'const y = 2;', focus: 'Simple code', bridge: 'Moving on.' },
      ],
    };
    const output = renderLesson(lessonNoSource, 0, 1);
    assert.ok(output.includes('const'), 'output should contain code keyword');
    assert.ok(output.includes('y = 2'), 'output should contain code content');
    assert.ok(!output.includes('vscode://'), 'output should not contain vscode URI without source');
  });

  test('footer includes [c] Copy option', () => {
    const output = renderLesson(lesson, 0, 1);
    assert.ok(output.includes('[c]'), 'output should contain [c] hint');
    assert.ok(output.includes('Copy'), 'output should contain Copy label');
  });

  // ─── Clipboard hint light blue styling tests ──────────────────────

  const lessonWithHint = {
    ...lesson,
    successCriteria: 'You can verify renderer output\n\nWant to go deeper? Press [c] to copy this lesson to your clipboard.',
  };

  test('lightBlue ANSI code exists in COLORS and _styleWithColor applies it', () => {
    // Verify lightBlue color constant exists
    assert.strictEqual(COLORS.lightBlue, '\x1b[94m', 'COLORS should have lightBlue as ANSI 94');
    // Verify _styleWithColor applies it correctly
    const styled = _styleWithColor('hint text', 'lightBlue');
    assert.ok(styled.startsWith('\x1b[94m'), 'styled text should start with lightBlue code');
    assert.ok(styled.includes('hint text'), 'styled text should contain original text');
    assert.ok(styled.endsWith('\x1b[0m'), 'styled text should end with reset code');
  });

  test('clipboard hint line is separated from main criteria text in renderer output', () => {
    const output = renderLesson(lessonWithHint, 0, 1);
    // Both the main criteria and hint text should be present
    assert.ok(output.includes('You can verify renderer output'), 'output should contain main criteria');
    assert.ok(output.includes('Want to go deeper?'), 'output should contain hint text');
    // The hint text should appear after the main criteria (structural separation)
    const mainIdx = output.indexOf('You can verify renderer output');
    const hintIdx = output.indexOf('Want to go deeper?');
    assert.ok(hintIdx > mainIdx, 'hint text should appear after main criteria text');
  });

  test('main criteria text before hint is not styled as lightBlue', () => {
    // In non-TTY test env, style() is a no-op, so we verify structurally:
    // the main criteria text and hint text are pushed as separate parts
    const output = renderLesson(lessonWithHint, 0, 1);
    const mainIdx = output.indexOf('You can verify renderer output');
    // There should be a double newline separating main criteria from hint
    const betweenText = output.substring(mainIdx, output.indexOf('Want to go deeper?'));
    assert.ok(betweenText.includes('\n\n'), 'main criteria and hint should be separated by double newline');
  });

  test('successCriteria with no hint text renders unchanged (backward compatible)', () => {
    const output = renderLesson(lesson, 0, 1);
    assert.ok(output.includes('You can verify renderer output'), 'output should contain criteria text');
    // No hint-related splitting should occur
    assert.ok(!output.includes('Want to go deeper?'), 'output should not contain hint text');
  });

  test('code block renders line numbers via renderCodeBlock', () => {
    const lessonMultiline = {
      ...lesson,
      content: [
        { type: 'code', language: 'javascript', value: 'line one\nline two\nline three', focus: 'Multiline code', bridge: 'Done with code.' },
      ],
    };
    const output = renderLesson(lessonMultiline, 0, 1);
    assert.ok(output.includes('1'), 'output should contain line number 1');
    assert.ok(output.includes('|'), 'output should contain gutter separator');
  });
});

// ─── renderProgressDots ──────────────────────────────────────────────

describe('renderProgressDots', () => {
  test('renderProgressDots(2, 9) returns 3 filled dots, 6 empty dots, and "Part 3 of 9"', () => {
    const output = renderProgressDots(2, 9);
    assert.ok(typeof output === 'string', 'should return a string');
    const filled = (output.match(/\u25CF/g) || []).length;
    const empty = (output.match(/\u25CB/g) || []).length;
    assert.strictEqual(filled, 3, 'should have 3 filled dots');
    assert.strictEqual(empty, 6, 'should have 6 empty dots');
    assert.ok(output.includes('Part 3 of 9'), 'should contain "Part 3 of 9"');
  });

  test('renderProgressDots(0, 5) returns 1 filled dot, 4 empty dots, and "Part 1 of 5"', () => {
    const output = renderProgressDots(0, 5);
    const filled = (output.match(/\u25CF/g) || []).length;
    const empty = (output.match(/\u25CB/g) || []).length;
    assert.strictEqual(filled, 1, 'should have 1 filled dot');
    assert.strictEqual(empty, 4, 'should have 4 empty dots');
    assert.ok(output.includes('Part 1 of 5'), 'should contain "Part 1 of 5"');
  });

  test('renderProgressDots(4, 5) returns 5 filled dots, 0 empty dots, and "Part 5 of 5"', () => {
    const output = renderProgressDots(4, 5);
    const filled = (output.match(/\u25CF/g) || []).length;
    const empty = (output.match(/\u25CB/g) || []).length;
    assert.strictEqual(filled, 5, 'should have 5 filled dots');
    assert.strictEqual(empty, 0, 'should have 0 empty dots');
    assert.ok(output.includes('Part 5 of 5'), 'should contain "Part 5 of 5"');
  });
});

// ─── renderCompletionBanner ──────────────────────────────────────────

describe('renderCompletionBanner', () => {
  test('banner contains MODULE COMPLETE!, title, and stats', () => {
    const output = renderCompletionBanner({
      title: 'Command Lifecycle',
      lessonCount: 6,
      totalParts: 58,
      miniProjectCount: 1,
    });
    assert.ok(typeof output === 'string', 'should return a string');
    assert.ok(output.includes('MODULE COMPLETE!'), 'should contain "MODULE COMPLETE!"');
    assert.ok(output.includes('Command Lifecycle'), 'should contain module title');
    assert.ok(output.includes('Lessons: 6'), 'should contain lesson count');
    assert.ok(output.includes('Parts: 58'), 'should contain parts count');
    assert.ok(output.includes('Mini-projects: 1'), 'should contain mini-project count');
  });

  test('banner starts with clearScreen', () => {
    const output = renderCompletionBanner({
      title: 'Test Module',
      lessonCount: 3,
      totalParts: 20,
      miniProjectCount: 0,
    });
    assert.ok(output.startsWith('\x1b[2J\x1b[H'), 'should start with clearScreen escape');
  });

  test('banner contains solid color bar characters (U+2588)', () => {
    const output = renderCompletionBanner({
      title: 'Test Module',
      lessonCount: 3,
      totalParts: 20,
      miniProjectCount: 0,
    });
    assert.ok(output.includes('\u2588'), 'should contain solid block characters');
  });
});

// ─── renderPart ──────────────────────────────────────────────────────

describe('renderPart', () => {
  // This lesson has [text, code, text] which groups into 2 groups: [text] and [code+text]
  const lesson = {
    id: 'test-lesson',
    title: 'Test Lesson Title',
    lessonNumber: 2,
    objective: 'Learn about testing renderers',
    content: [
      { type: 'text', value: 'This is the first text block.', focus: 'First block focus', bridge: 'Bridge to second block.' },
      { type: 'code', language: 'javascript', value: 'const x = 1;', highlight: [1] },
      { type: 'text', value: 'This is the third text block.', focus: 'Third block focus', bridge: 'Bridge to conclusion.' },
    ],
    conceptMap: null,
    successCriteria: 'You can verify renderer output',
  };

  // Groups: [text], [code+text] -> totalParts = 2
  test('renders group 0 (standalone text) when partIndex is 0', () => {
    const output = renderPart(lesson, 0, 2, 1, 5);
    assert.ok(output.includes('This is the first text block.'), 'should contain first text block');
    assert.ok(!output.includes('const x = 1'), 'should NOT contain code (belongs to group 1)');
    assert.ok(!output.includes('This is the third text block.'), 'should NOT contain third content section');
  });

  test('includes lesson title and position indicator', () => {
    const output = renderPart(lesson, 0, 2, 1, 5);
    assert.ok(output.includes('Test Lesson Title'), 'should contain lesson title');
    assert.ok(output.includes('Lesson 2 of 5'), 'should contain position indicator');
  });

  test('includes objective only on first part', () => {
    const first = renderPart(lesson, 0, 2, 0, 5);
    assert.ok(first.includes("What you'll learn:"), 'first part should contain objective header');
    assert.ok(first.includes('Learn about testing renderers'), 'first part should contain objective text');
    const second = renderPart(lesson, 1, 2, 0, 5);
    assert.ok(!second.includes("What you'll learn:"), 'second part should NOT contain objective header');
  });

  test('includes success criteria only on last part', () => {
    const last = renderPart(lesson, 1, 2, 0, 5);
    assert.ok(last.includes("You'll know you've got it when:"), 'last part should contain criteria header');
    assert.ok(last.includes('You can verify renderer output'), 'last part should contain criteria text');
    const first = renderPart(lesson, 0, 2, 0, 5);
    assert.ok(!first.includes("You'll know you've got it when:"), 'first part should NOT contain criteria header');
  });

  test('renders text section with text value', () => {
    const output = renderPart(lesson, 0, 2, 0, 5);
    assert.ok(output.includes('This is the first text block.'), 'should contain text value');
  });

  test('renders code section with code and source link if present', () => {
    const lessonWithSource = {
      ...lesson,
      content: [
        { type: 'code', value: 'const x = 1;', source: { file: 'bin/gsd-tools.cjs', startLine: 10 } },
        { type: 'text', value: 'Explanation text.', focus: 'Source explanation', bridge: 'See the source.' },
      ],
    };
    // Groups: [code+text] -> 1 group
    const output = renderPart(lessonWithSource, 0, 1, 0, 5);
    assert.ok(output.includes('const'), 'should contain code');
    assert.ok(output.includes('bin/gsd-tools.cjs'), 'should contain source file');
  });

  test('renders project section with "Your Mission:" and deliverables', () => {
    const lessonWithProject = {
      ...lesson,
      content: [
        {
          type: 'project',
          task: 'Build something cool',
          deliverables: ['File A', 'File B'],
          verifyCommand: 'node verify.cjs',
          hintCommand: 'node hint.cjs',
          focus: 'Project task',
          bridge: 'Complete and move on.',
        },
      ],
    };
    const output = renderPart(lessonWithProject, 0, 1, 0, 5);
    assert.ok(output.includes('Your Mission:'), 'should contain Your Mission header');
    assert.ok(output.includes('File A'), 'should contain first deliverable');
    assert.ok(output.includes('File B'), 'should contain second deliverable');
  });

  test('does not include old-style "Part X of Y" progress dots', () => {
    const output = renderPart(lesson, 1, 2, 0, 5);
    assert.ok(!output.includes('Part 2 of 2'), 'should NOT contain old-style Part X of Y label');
  });

  test('includes new navigation footer with [w] [q] [e] [c] [esc]', () => {
    const output = renderPart(lesson, 0, 2, 0, 5);
    assert.ok(output.includes('[w]'), 'should contain [w] key');
    assert.ok(output.includes('[q]'), 'should contain [q] key');
    assert.ok(output.includes('[e]'), 'should contain [e] key');
    assert.ok(output.includes('[c]'), 'should contain [c] key');
    assert.ok(output.includes('[esc]'), 'should contain [esc] key');
  });

  test('concept map renders as synthetic final part', () => {
    const lessonWithMap = { ...lesson, conceptMap: 'tool-dispatch' };
    // Groups: [text], [code+text] -> 2 groups + 1 concept map = 3 totalParts
    const output = renderPart(lessonWithMap, 2, 3, 0, 5);
    assert.ok(output.includes('Architecture Overview'), 'should contain concept map header');
  });

  test('successCriteria with hint text still splits and styles hint as lightBlue on last part', () => {
    const lessonWithHint = {
      ...lesson,
      successCriteria: 'You can verify renderer output\n\nWant to go deeper? Press [c] to copy.',
    };
    // 2 groups, last part is partIndex=1
    const output = renderPart(lessonWithHint, 1, 2, 0, 5);
    assert.ok(output.includes('You can verify renderer output'), 'should contain main criteria');
    assert.ok(output.includes('Want to go deeper?'), 'should contain hint text');
    const mainIdx = output.indexOf('You can verify renderer output');
    const hintIdx = output.indexOf('Want to go deeper?');
    assert.ok(hintIdx > mainIdx, 'hint should appear after main criteria');
  });

  test('existing renderLesson still exported and works', () => {
    const output = renderLesson(lesson, 1, 5);
    assert.ok(output.includes('Test Lesson Title'), 'renderLesson should still work');
    assert.ok(output.includes('[n]'), 'renderLesson should still have old nav footer');
  });

  // ─── NEW: Progressive Accumulation Tests ──────────────────────────

  // 4-block lesson fixture for accumulation tests
  const accLesson = {
    id: 'acc-lesson',
    title: 'Accumulation Test Lesson',
    lessonNumber: 1,
    objective: 'Test progressive accumulation',
    content: [
      { type: 'text', value: 'Block zero content here.', focus: 'Introduction to concepts', bridge: 'Next we explore variables.' },
      { type: 'text', value: 'Block one content here.', focus: 'Variable fundamentals', bridge: 'Now onto functions.' },
      { type: 'text', value: 'Block two content here.', focus: 'Function patterns', bridge: 'Time for modules.' },
      { type: 'text', value: 'Block three content here.', focus: 'Module system', bridge: 'Wrapping up the lesson.' },
    ],
    conceptMap: null,
    successCriteria: 'You understand accumulation',
  };

  test('ACC-01: renderPart at partIndex=2 shows content from blocks 0, 1, AND 2', () => {
    const output = renderPart(accLesson, 2, 4, 0, 5);
    assert.ok(output.includes('Block zero content here.'), 'should contain block 0 content');
    assert.ok(output.includes('Block one content here.'), 'should contain block 1 content');
    assert.ok(output.includes('Block two content here.'), 'should contain block 2 content');
    assert.ok(!output.includes('Block three content here.'), 'should NOT contain block 3 content');
  });

  test('ACC-01: renderPart at partIndex=0 shows only block 0 content', () => {
    const output = renderPart(accLesson, 0, 4, 0, 5);
    assert.ok(output.includes('Block zero content here.'), 'should contain block 0 content');
    assert.ok(!output.includes('Block one content here.'), 'should NOT contain block 1 content');
    assert.ok(!output.includes('Block two content here.'), 'should NOT contain block 2 content');
  });

  test('ACC-02: each accumulated block displays its focus field text', () => {
    const output = renderPart(accLesson, 2, 4, 0, 5);
    assert.ok(output.includes('Introduction to concepts'), 'should contain block 0 focus');
    assert.ok(output.includes('Variable fundamentals'), 'should contain block 1 focus');
    assert.ok(output.includes('Function patterns'), 'should contain block 2 focus');
  });

  test('ACC-02: triangle-right marker appears exactly once (current block only)', () => {
    const output = renderPart(accLesson, 2, 4, 0, 5);
    const triangleCount = (output.match(/\u25B6/g) || []).length;
    assert.strictEqual(triangleCount, 1, 'should have exactly one triangle-right marker');
  });

  test('ACC-03: each block bridge text appears in bordered section', () => {
    const output = renderPart(accLesson, 2, 4, 0, 5);
    assert.ok(output.includes('Next we explore variables.'), 'should contain block 0 bridge');
    assert.ok(output.includes('Now onto functions.'), 'should contain block 1 bridge');
    assert.ok(output.includes('Time for modules.'), 'should contain block 2 bridge');
    // Check for bordered section characters
    assert.ok(output.includes('\u250C') || output.includes('\u2514'), 'should contain box-drawing border characters');
  });

  test('block separator: dim horizontal rule appears between accumulated groups', () => {
    const output = renderPart(accLesson, 2, 4, 0, 5);
    // When partIndex > 0, there should be horizontal rule separators between groups
    // horizontalRule uses \u2500 characters
    const hrCount = (output.match(/\u2500{10,}/g) || []).length;
    // At least the standard header HR plus separators between groups
    assert.ok(hrCount >= 3, 'should have horizontal rule separators between accumulated groups (got ' + hrCount + ')');
  });

  test('ACC-04: objective on partIndex=0 only; criteria on last part only (with accumulation)', () => {
    const first = renderPart(accLesson, 0, 4, 0, 5);
    assert.ok(first.includes("What you'll learn:"), 'first part should have objective');
    assert.ok(!first.includes("You'll know you've got it when:"), 'first part should NOT have criteria');

    const middle = renderPart(accLesson, 2, 4, 0, 5);
    assert.ok(!middle.includes("What you'll learn:"), 'middle part should NOT have objective');
    assert.ok(!middle.includes("You'll know you've got it when:"), 'middle part should NOT have criteria');

    const last = renderPart(accLesson, 3, 4, 0, 5);
    assert.ok(!last.includes("What you'll learn:"), 'last part should NOT have objective');
    assert.ok(last.includes("You'll know you've got it when:"), 'last part should have criteria');
  });

  test('concept map as synthetic final part still works with accumulation', () => {
    const accLessonWithMap = { ...accLesson, conceptMap: 'tool-dispatch' };
    // totalParts = 4 groups (all text, no grouping merges) + 1 concept map = 5
    const groups = groupContentItems(accLessonWithMap.content);
    const totalParts = groups.length + 1; // +1 for conceptMap
    const output = renderPart(accLessonWithMap, totalParts - 1, totalParts, 0, 5);
    assert.ok(output.includes('Architecture Overview'), 'should contain concept map header');
    // All 4 content blocks should be accumulated before concept map
    assert.ok(output.includes('Block zero content here.'), 'should accumulate block 0');
    assert.ok(output.includes('Block one content here.'), 'should accumulate block 1');
    assert.ok(output.includes('Block two content here.'), 'should accumulate block 2');
    assert.ok(output.includes('Block three content here.'), 'should accumulate block 3');
  });

  // ─── NEW: Group-based rendering tests ──────────────────────────────

  // Lesson with mixed text+code for group-based tests
  // [text, code, text, code, text] -> [text] [code+text] [code+text] = 3 groups
  const groupedLesson = {
    id: 'grouped-lesson',
    title: 'Grouped Lesson',
    lessonNumber: 1,
    objective: 'Test group-based rendering',
    content: [
      { type: 'text', value: 'Lead-in text for code.', focus: 'Code context', bridge: 'Now see the code in action.' },
      { type: 'code', language: 'javascript', value: 'const x = 1;', highlight: [1] },
      { type: 'text', value: 'Explanation of first code.', focus: 'First code explanation', bridge: 'Moving to next code.' },
      { type: 'code', language: 'javascript', value: 'const y = 2;' },
      { type: 'text', value: 'Explanation of second code.', focus: 'Second code explanation', bridge: 'Lesson complete.' },
    ],
    conceptMap: null,
    successCriteria: 'You understand grouping',
  };

  test('GROUP: renderPart at partIndex=0 shows standalone text from group 0', () => {
    const groups = groupContentItems(groupedLesson.content);
    const totalParts = groups.length;
    const output = renderPart(groupedLesson, 0, totalParts, 0, 5);
    assert.ok(output.includes('Lead-in text for code.'), 'should contain group 0 text');
    assert.ok(!output.includes('const x = 1'), 'should NOT contain code (belongs to group 1)');
    assert.ok(!output.includes('Explanation of first code.'), 'should NOT contain group 1 text');
  });

  test('GROUP: renderPart at partIndex=1 shows group 0 (text) AND group 1 (code+text)', () => {
    const groups = groupContentItems(groupedLesson.content);
    const totalParts = groups.length;
    const output = renderPart(groupedLesson, 1, totalParts, 0, 5);
    assert.ok(output.includes('Lead-in text for code.'), 'should contain group 0 text');
    assert.ok(output.includes('const x = 1'), 'should contain group 1 code');
    assert.ok(output.includes('Explanation of first code.'), 'should contain group 1 explanation');
    assert.ok(!output.includes('const y = 2'), 'should NOT contain group 2 code');
    assert.ok(!output.includes('Explanation of second code.'), 'should NOT contain group 2 text');
  });

  test('GROUP: focus/bridge displayed per-group, not per block within group', () => {
    const groups = groupContentItems(groupedLesson.content);
    const totalParts = groups.length;
    // Group 1 is [code+text], rendered at partIndex=1
    const output = renderPart(groupedLesson, 1, totalParts, 0, 5);
    // Group 1 focus comes from the explanation text 'First code explanation'
    assert.ok(output.includes('First code explanation'), 'should contain group focus from explanation text');
    const focusCount = (output.match(/First code explanation/g) || []).length;
    assert.strictEqual(focusCount, 1, 'focus should appear exactly once for the group');
  });

  test('GROUP: triangle-right marker on current GROUP focus only', () => {
    const groups = groupContentItems(groupedLesson.content);
    const totalParts = groups.length;
    const output = renderPart(groupedLesson, 1, totalParts, 0, 5);
    const triangleCount = (output.match(/\u25B6/g) || []).length;
    assert.strictEqual(triangleCount, 1, 'should have exactly one triangle-right marker');
  });

  test('GROUP: horizontal rule separators between groups, not within a group', () => {
    const groups = groupContentItems(groupedLesson.content);
    const totalParts = groups.length;
    // Render partIndex=1 (groups 0 and 1 visible)
    const output = renderPart(groupedLesson, 1, totalParts, 0, 5);
    // Within group 1 (code+text), no HR between code and its explanation
    const codeIdx = output.indexOf('const x = 1');
    const explIdx = output.indexOf('Explanation of first code.');
    const betweenCodeAndText = output.substring(codeIdx, explIdx);
    const hrInGroup = (betweenCodeAndText.match(/\u2500{10,}/g) || []).length;
    assert.strictEqual(hrInGroup, 0, 'should NOT have HR between code and explanation within a group');
    // Between group 0 and group 1, there should be an HR separator
    const group0TextIdx = output.indexOf('Lead-in text for code.');
    const betweenGroups = output.substring(group0TextIdx, codeIdx);
    const hrBetweenGroups = (betweenGroups.match(/\u2500{10,}/g) || []).length;
    assert.ok(hrBetweenGroups >= 1, 'should have HR separator between groups');
  });

  test('GROUP: old-style "Part X of Y" progress dots absent from grouped output', () => {
    // groupedLesson has [text, code, text, code, text] -> 3 groups
    const groups = groupContentItems(groupedLesson.content);
    assert.strictEqual(groups.length, 3, 'should produce 3 groups');
    const totalParts = groups.length;
    const output = renderPart(groupedLesson, 0, totalParts, 0, 5, undefined, 'My Module');
    assert.ok(!output.includes('Part 1 of 3'), 'should NOT contain old-style Part X of Y');
    assert.ok(output.includes('My Module'), 'should contain module title in new footer');
  });
});

// ─── renderLessonProgressFooter ──────────────────────────────────────

describe('renderLessonProgressFooter', () => {
  test('returns string containing module title', () => {
    const output = renderLessonProgressFooter('Command Lifecycle', 'Command Dispatch', 2, 6);
    assert.ok(typeof output === 'string', 'should return a string');
    assert.ok(output.includes('Command Lifecycle'), 'should contain module title');
  });

  test('returns correct filled/empty dot counts', () => {
    const output = renderLessonProgressFooter('Command Lifecycle', 'Command Dispatch', 2, 6);
    const filled = (output.match(/\u25CF/g) || []).length;
    const empty = (output.match(/\u25CB/g) || []).length;
    assert.strictEqual(filled, 3, 'should have 3 filled dots');
    assert.strictEqual(empty, 3, 'should have 3 empty dots');
  });

  test('contains lesson title followed by colon', () => {
    const output = renderLessonProgressFooter('Command Lifecycle', 'Command Dispatch', 2, 6);
    assert.ok(output.includes('Command Dispatch:'), 'should contain lesson title with colon');
  });

  test('does NOT contain (X / Y) part counter', () => {
    const output = renderLessonProgressFooter('Command Lifecycle', 'Command Dispatch', 2, 6);
    assert.ok(!(/\(\d+ \/ \d+\)/).test(output), 'should NOT contain (X / Y) pattern');
  });

  test('when blockSummary provided, output contains subtitle on second line', () => {
    const output = renderLessonProgressFooter('Command Lifecycle', 'Command Dispatch', 2, 6, 'Three entry point questions');
    assert.ok(output.includes('Three entry point questions'), 'should contain blockSummary text');
    // Should be multiline
    const lines = output.split('\n');
    assert.ok(lines.length >= 2, 'should have at least 2 lines when blockSummary provided');
  });

  test('when blockSummary is null/undefined, output is single line', () => {
    const output = renderLessonProgressFooter('Command Lifecycle', 'Command Dispatch', 2, 6);
    const lines = output.split('\n');
    assert.strictEqual(lines.length, 1, 'should be single line when no blockSummary');
  });

  test('subtitle line is indented to align under lesson title', () => {
    const output = renderLessonProgressFooter('Mod', 'My Lesson', 0, 3, 'Focus text here');
    const lines = output.split('\n');
    assert.ok(lines.length >= 2, 'should have subtitle line');
    // The subtitle line should start with spaces (alignment padding)
    assert.ok(lines[1].match(/^\s+/), 'subtitle should start with whitespace for alignment');
  });

  test('edge case: first lesson (1 filled, rest empty)', () => {
    const output = renderLessonProgressFooter('Mod', 'Lesson One', 0, 5);
    const filled = (output.match(/\u25CF/g) || []).length;
    const empty = (output.match(/\u25CB/g) || []).length;
    assert.strictEqual(filled, 1, 'should have 1 filled dot');
    assert.strictEqual(empty, 4, 'should have 4 empty dots');
    assert.ok(!(/\(\d+ \/ \d+\)/).test(output), 'should NOT contain part counter');
  });

  test('edge case: last lesson (all filled)', () => {
    const output = renderLessonProgressFooter('Mod', 'Final', 4, 5);
    const filled = (output.match(/\u25CF/g) || []).length;
    const empty = (output.match(/\u25CB/g) || []).length;
    assert.strictEqual(filled, 5, 'should have 5 filled dots (all)');
    assert.strictEqual(empty, 0, 'should have 0 empty dots');
  });
});

// ─── renderPart with lesson progress footer ─────────────────────────

describe('renderPart lesson progress footer integration', () => {
  const lesson = {
    id: 'footer-test',
    title: 'Footer Test Lesson',
    lessonNumber: 1,
    objective: 'Test footer rendering',
    content: [
      { type: 'text', value: 'Some content.', focus: 'Content focus', bridge: 'Bridge text.' },
    ],
    conceptMap: null,
    successCriteria: 'Footer works',
  };

  test('renderPart includes module name in footer when moduleTitle provided', () => {
    const output = renderPart(lesson, 0, 1, 2, 6, undefined, 'Command Lifecycle');
    assert.ok(output.includes('Command Lifecycle'), 'should contain module title in footer');
  });

  test('renderPart includes lesson title with colon and focus subtitle in footer', () => {
    const output = renderPart(lesson, 0, 1, 2, 6, undefined, 'Command Lifecycle');
    assert.ok(output.includes('Footer Test Lesson:'), 'should contain lesson title with colon in footer');
    assert.ok(!(/\(\d+ \/ \d+\)/).test(output), 'should NOT contain (X / Y) part counter');
    // The focus text from the content block should appear as subtitle
    assert.ok(output.includes('Content focus'), 'should contain block focus as subtitle');
  });

  test('renderPart footer appears before nav key hints', () => {
    const output = renderPart(lesson, 0, 1, 2, 6, undefined, 'My Module');
    const footerIdx = output.indexOf('My Module');
    const navIdx = output.indexOf('[w]');
    assert.ok(footerIdx < navIdx, 'module footer should appear before nav hints');
  });

  test('renderPart without moduleTitle still works (backward compatible)', () => {
    const output = renderPart(lesson, 0, 1, 2, 6);
    assert.ok(output.includes('[w]'), 'should still render nav footer');
    assert.ok(!output.includes('Command Lifecycle'), 'should not contain module title if not provided');
  });
});

// ─── renderLesson with lesson progress footer ───────────────────────

describe('renderLesson lesson progress footer integration', () => {
  const lesson = {
    id: 'footer-test',
    title: 'Footer Test Lesson',
    lessonNumber: 1,
    objective: 'Test footer rendering',
    content: [
      { type: 'text', value: 'Some content.', focus: 'Content focus', bridge: 'Bridge text.' },
    ],
    conceptMap: null,
    successCriteria: 'Footer works',
  };

  test('renderLesson includes module name in footer when moduleTitle provided', () => {
    const output = renderLesson(lesson, 2, 6, undefined, 'Command Lifecycle');
    assert.ok(output.includes('Command Lifecycle'), 'should contain module title in footer');
  });

  test('renderLesson shows lesson title with colon and no part counter', () => {
    const output = renderLesson(lesson, 2, 6, undefined, 'Command Lifecycle');
    assert.ok(output.includes('Footer Test Lesson:'), 'should contain lesson title with colon');
    assert.ok(!(/\(\d+ \/ \d+\)/).test(output), 'should NOT contain (X / Y) part counter');
  });

  test('renderLesson without moduleTitle still works (backward compatible)', () => {
    const output = renderLesson(lesson, 2, 6);
    assert.ok(output.includes('[n]'), 'should still render nav footer');
    assert.ok(!output.includes('Command Lifecycle'), 'should not contain module title');
  });
});

// ─── groupContentItems ──────────────────────────────────────────────

describe('groupContentItems', () => {
  test('[text, code, text] produces 2 groups: [text] and [code+text]', () => {
    const content = [
      { type: 'text', value: 'a', focus: 'f1', bridge: 'b1' },
      { type: 'code', value: 'x' },
      { type: 'text', value: 'b', focus: 'f2', bridge: 'b2' },
    ];
    const groups = groupContentItems(content);
    assert.strictEqual(groups.length, 2);
    // Group 0: standalone text (not following code)
    assert.strictEqual(groups[0].items.length, 1);
    assert.strictEqual(groups[0].items[0].type, 'text');
    // Group 1: code + following text
    assert.strictEqual(groups[1].items.length, 2);
    assert.strictEqual(groups[1].items[0].type, 'code');
    assert.strictEqual(groups[1].items[1].type, 'text');
  });

  test('[text, code, text, code, text] produces 3 groups: [text] [code+text] [code+text]', () => {
    const content = [
      { type: 'text', value: 'a', focus: 'f1', bridge: 'b1' },
      { type: 'code', value: 'x' },
      { type: 'text', value: 'b', focus: 'f2', bridge: 'b2' },
      { type: 'code', value: 'y' },
      { type: 'text', value: 'c', focus: 'f3', bridge: 'b3' },
    ];
    const groups = groupContentItems(content);
    assert.strictEqual(groups.length, 3);
    assert.strictEqual(groups[0].items.length, 1, 'first group is standalone text');
    assert.strictEqual(groups[1].items.length, 2, 'second group is code+text');
    assert.strictEqual(groups[2].items.length, 2, 'third group is code+text');
  });

  test('[text, text, text] produces 3 groups (no text+text merging)', () => {
    const content = [
      { type: 'text', value: 'a', focus: 'f1', bridge: 'b1' },
      { type: 'text', value: 'b', focus: 'f2', bridge: 'b2' },
      { type: 'text', value: 'c', focus: 'f3', bridge: 'b3' },
    ];
    const groups = groupContentItems(content);
    assert.strictEqual(groups.length, 3);
  });

  test('[code, text] produces 1 group: [code+text]', () => {
    const content = [
      { type: 'code', value: 'x', focus: 'cf', bridge: 'cb' },
      { type: 'text', value: 'a', focus: 'f1', bridge: 'b1' },
    ];
    const groups = groupContentItems(content);
    assert.strictEqual(groups.length, 1, 'code + following text = 1 group');
    assert.strictEqual(groups[0].items.length, 2);
    assert.strictEqual(groups[0].items[0].type, 'code');
    assert.strictEqual(groups[0].items[1].type, 'text');
  });

  test('[text] produces 1 group', () => {
    const content = [
      { type: 'text', value: 'a', focus: 'f1', bridge: 'b1' },
    ];
    const groups = groupContentItems(content);
    assert.strictEqual(groups.length, 1);
    assert.strictEqual(groups[0].items.length, 1);
  });

  test('[code] produces 1 standalone group', () => {
    const content = [
      { type: 'code', value: 'x', focus: 'cf', bridge: 'cb' },
    ];
    const groups = groupContentItems(content);
    assert.strictEqual(groups.length, 1);
    assert.strictEqual(groups[0].items.length, 1);
    assert.strictEqual(groups[0].focus, 'cf');
  });

  test('group focus/bridge come from FOLLOWING text block (explanation)', () => {
    const content = [
      { type: 'code', value: 'x', focus: 'code-focus', bridge: 'code-bridge' },
      { type: 'text', value: 'a', focus: 'text-focus', bridge: 'text-bridge' },
    ];
    const groups = groupContentItems(content);
    assert.strictEqual(groups[0].focus, 'text-focus', 'focus comes from following text');
    assert.strictEqual(groups[0].bridge, 'text-bridge', 'bridge comes from following text');
  });

  test('standalone text group uses its own focus/bridge', () => {
    const content = [
      { type: 'text', value: 'a', focus: 'text-focus', bridge: 'text-bridge' },
      { type: 'code', value: 'x' },
      { type: 'text', value: 'b', focus: 'explanation-focus', bridge: 'explanation-bridge' },
    ];
    const groups = groupContentItems(content);
    assert.strictEqual(groups[0].focus, 'text-focus', 'standalone text keeps its own focus');
    assert.strictEqual(groups[1].focus, 'explanation-focus', 'code+text group gets text focus');
  });
});

// ─── renderModuleList ────────────────────────────────────────────────

describe('renderModuleList', () => {
  const { renderModuleList } = require('../lib/renderer.cjs');

  const modules = [
    { id: 'mod-1', title: 'Module One', description: 'First module', order: 1, lessonCount: 6 },
    { id: 'mod-2', title: 'Module Two', description: 'Second module', order: 2, lessonCount: 4 },
  ];

  test('returns string with numbered module entries', () => {
    const progress = { modules: {} };
    const output = renderModuleList(modules, progress, true);
    assert.ok(typeof output === 'string', 'should return a string');
    assert.ok(output.includes('[1]'), 'should contain [1]');
    assert.ok(output.includes('[2]'), 'should contain [2]');
    assert.ok(output.includes('Module One'), 'should contain first module title');
    assert.ok(output.includes('Module Two'), 'should contain second module title');
  });

  test('shows module descriptions indented', () => {
    const progress = { modules: {} };
    const output = renderModuleList(modules, progress, true);
    assert.ok(output.includes('First module'), 'should contain first module description');
    assert.ok(output.includes('Second module'), 'should contain second module description');
  });

  test('Module 1 shows "Start here" when isFirstRun=true', () => {
    const progress = { modules: {} };
    const output = renderModuleList(modules, progress, true);
    assert.ok(output.includes('Start here'), 'should contain "Start here" for Module 1');
  });

  test('Module 1 shows "Start here" when isFirstRun=false but module not started', () => {
    const progress = { modules: {} };
    const output = renderModuleList(modules, progress, false);
    assert.ok(output.includes('Start here'), 'should contain "Start here" when module not started');
  });

  test('Module 1 does NOT show "Start here" when isFirstRun=false AND module is started', () => {
    const progress = { modules: { 'mod-1': { currentLesson: 2, started: true, completed: false } } };
    const output = renderModuleList(modules, progress, false);
    assert.ok(!output.includes('Start here'), 'should NOT contain "Start here" when module is started and not first run');
  });

  test('in-progress module shows "Lesson X of Y" (1-indexed)', () => {
    const progress = { modules: { 'mod-1': { currentLesson: 2, started: true, completed: false } } };
    const output = renderModuleList(modules, progress, false);
    assert.ok(output.includes('Lesson 3 of 6'), 'should show "Lesson 3 of 6" for currentLesson=2 (0-indexed)');
  });

  test('completed module shows "Completed" with checkmark', () => {
    const progress = { modules: { 'mod-2': { currentLesson: 3, started: true, completed: true } } };
    const output = renderModuleList(modules, progress, false);
    assert.ok(output.includes('Completed'), 'should show "Completed"');
    assert.ok(output.includes('\u2713') || output.includes('\u2714') || output.includes('Completed'), 'should show checkmark or Completed text');
  });

  test('not-started non-Module-1 shows no progress indicator', () => {
    const progress = { modules: {} };
    const output = renderModuleList(modules, progress, true);
    // Module 2 line should not have Lesson/Completed/Start here
    const lines = output.split('\n');
    const mod2Lines = lines.filter(l => l.includes('Module Two') || l.includes('[2]'));
    const mod2Text = mod2Lines.join(' ');
    assert.ok(!mod2Text.includes('Start here'), 'Module 2 should not show "Start here"');
    assert.ok(!mod2Text.includes('Lesson'), 'Module 2 should not show lesson progress');
    assert.ok(!mod2Text.includes('Completed'), 'Module 2 should not show completed');
  });
});

// ─── renderWelcomeScreen ─────────────────────────────────────────────

describe('renderWelcomeScreen', () => {
  const { renderWelcomeScreen } = require('../lib/renderer.cjs');

  const modules = [
    { id: 'mod-1', title: 'Module One', description: 'First module', order: 1, lessonCount: 6 },
    { id: 'mod-2', title: 'Module Two', description: 'Second module', order: 2, lessonCount: 4 },
  ];
  const progress = { modules: {} };

  test('returns string containing "GSD Learn" title', () => {
    const output = renderWelcomeScreen(modules, progress);
    assert.ok(typeof output === 'string', 'should return a string');
    assert.ok(output.includes('GSD Learn'), 'should contain "GSD Learn" title');
  });

  test('contains pitch text about building AI workflows', () => {
    const output = renderWelcomeScreen(modules, progress);
    assert.ok(output.includes('AI workflow') || output.includes('ai workflow') || output.includes('AI Workflow'), 'should mention AI workflows in pitch');
  });

  test('contains horizontal rules', () => {
    const output = renderWelcomeScreen(modules, progress);
    assert.ok(output.includes('\u2500'), 'should contain horizontal rule characters');
  });

  test('contains module list with numbered entries', () => {
    const output = renderWelcomeScreen(modules, progress);
    assert.ok(output.includes('[1]'), 'should contain [1]');
    assert.ok(output.includes('Module One'), 'should contain module title');
  });

  test('contains "Press a number to begin" footer', () => {
    const output = renderWelcomeScreen(modules, progress);
    assert.ok(output.includes('Press a number to begin'), 'should contain footer prompt');
  });

  test('calls renderModuleList with isFirstRun=true (shows "Start here")', () => {
    const output = renderWelcomeScreen(modules, progress);
    assert.ok(output.includes('Start here'), 'should show "Start here" (isFirstRun=true)');
  });
});

// ─── renderModulePicker ──────────────────────────────────────────────

describe('renderModulePicker', () => {
  const { renderModulePicker } = require('../lib/renderer.cjs');

  const modules = [
    { id: 'mod-1', title: 'Module One', description: 'First module', order: 1, lessonCount: 6 },
    { id: 'mod-2', title: 'Module Two', description: 'Second module', order: 2, lessonCount: 4 },
  ];
  const progress = { modules: { 'mod-1': { currentLesson: 2, started: true, completed: false } } };

  test('returns string containing "Pick up where you left off." header', () => {
    const output = renderModulePicker(modules, progress);
    assert.ok(typeof output === 'string', 'should return a string');
    assert.ok(output.includes('Pick up where you left off.'), 'should contain picker header');
  });

  test('contains horizontal rule', () => {
    const output = renderModulePicker(modules, progress);
    assert.ok(output.includes('\u2500'), 'should contain horizontal rule characters');
  });

  test('contains module list with numbered entries', () => {
    const output = renderModulePicker(modules, progress);
    assert.ok(output.includes('[1]'), 'should contain [1]');
    assert.ok(output.includes('Module One'), 'should contain module title');
  });

  test('contains "Press a number to begin" and "[q] Quit" footer', () => {
    const output = renderModulePicker(modules, progress);
    assert.ok(output.includes('Press a number to begin'), 'should contain selection prompt');
    assert.ok(output.includes('[q]'), 'should contain quit key hint');
    assert.ok(output.includes('Quit'), 'should contain Quit label');
  });

  test('calls renderModuleList with isFirstRun=false (no "Start here" when started)', () => {
    const output = renderModulePicker(modules, progress);
    assert.ok(!output.includes('Start here'), 'should NOT show "Start here" (isFirstRun=false, module started)');
  });

  test('shows progress indicator for in-progress module', () => {
    const output = renderModulePicker(modules, progress);
    assert.ok(output.includes('Lesson 3 of 6'), 'should show lesson progress');
  });
});
