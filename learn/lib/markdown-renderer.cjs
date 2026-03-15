'use strict';

/**
 * Markdown rendering engine for lesson JSON export.
 *
 * Pure-function module: takes parsed JSON objects, returns markdown strings.
 * Zero dependencies beyond Node.js builtins.
 */

/**
 * Render a single content block to markdown.
 * @param {{ type: string, value?: string, language?: string }} block
 * @returns {string}
 */
function renderContentBlock(block) {
  switch (block.type) {
    case 'text':
      return `${block.value}\n`;

    case 'code': {
      const lang = block.language || '';
      return `\`\`\`${lang}\n${block.value}\n\`\`\`\n`;
    }

    default:
      // project, interactive, etc. -- not rendered inline
      return '';
  }
}

/**
 * Render a lesson to markdown.
 * @param {{ lessonNumber: number, title: string, objective: string, content: object[] }} lesson
 * @returns {string}
 */
function renderLesson(lesson) {
  let md = `## Lesson ${lesson.lessonNumber}: ${lesson.title}\n\n`;
  md += `**Objective:** ${lesson.objective}\n\n`;

  for (const block of lesson.content) {
    md += renderContentBlock(block);
    md += '\n';
  }

  md += '---\n';
  return md;
}

/**
 * Render a project spec to markdown with artifact checklists.
 * @param {{ title: string, description: string, artifacts: object[] }} spec
 * @returns {string}
 */
function renderProjectSpec(spec) {
  let md = `## Mini-Project: ${spec.title}\n\n`;
  md += `${spec.description}\n\n`;

  if (spec.artifacts && spec.artifacts.length > 0) {
    md += '### Artifacts\n\n';

    for (const artifact of spec.artifacts) {
      md += `#### ${artifact.description}\n\n`;
      md += `**Path:** \`${artifact.path}\`\n\n`;

      if (artifact.checks && artifact.checks.length > 0) {
        md += '**Verification Checks:**\n\n';
        for (const check of artifact.checks) {
          md += `- [ ] ${check.description}\n`;
        }
        md += '\n';
      }
    }
  }

  return md;
}

/**
 * Render hints as expandable details/summary sections.
 * @param {string[]} hints
 * @returns {string}
 */
function renderHints(hints) {
  if (!hints || hints.length === 0) return '';

  let md = '### Hints\n\n';

  for (let i = 0; i < hints.length; i++) {
    md += `<details>\n<summary>Hint ${i + 1}</summary>\n\n${hints[i]}\n\n</details>\n\n`;
  }

  return md;
}

/**
 * Render a concept map as ASCII in a code fence.
 * @param {string} text - Raw ASCII concept map text
 * @returns {string}
 */
function renderConceptMap(text) {
  if (!text) return '';
  return `## Concept Map\n\n\`\`\`\n${text}\n\`\`\`\n`;
}

/**
 * Render a complete module document.
 *
 * Order: title, description, lessons (sorted, mini-project excluded),
 * concept map, project spec, hints.
 *
 * @param {{ title: string, description: string }} mod
 * @param {object[]} lessons - All lesson JSON objects
 * @param {{ title: string, description: string, artifacts: object[] }} spec
 * @param {string[]} hints
 * @param {string} conceptMapText
 * @returns {string}
 */
function renderModule(mod, lessons, spec, hints, conceptMapText) {
  let md = `# ${mod.title}\n\n${mod.description}\n\n`;

  // Sort lessons by lessonNumber
  const sorted = [...lessons].sort((a, b) => a.lessonNumber - b.lessonNumber);

  // Identify mini-project lesson: last lesson with "Mini-Project" title or project-type content
  const isMiniProject = (lesson) =>
    lesson.title.startsWith('Mini-Project:') ||
    (lesson.content && lesson.content.some((b) => b.type === 'project'));

  // Render all lessons except the mini-project lesson
  for (const lesson of sorted) {
    if (isMiniProject(lesson)) continue;
    md += renderLesson(lesson);
    md += '\n';
  }

  // Concept map
  if (conceptMapText) {
    md += renderConceptMap(conceptMapText);
    md += '\n';
  }

  // Project spec
  if (spec) {
    md += renderProjectSpec(spec);
  }

  // Hints
  if (hints && hints.length > 0) {
    md += renderHints(hints);
  }

  return md;
}

module.exports = {
  renderContentBlock,
  renderLesson,
  renderProjectSpec,
  renderHints,
  renderConceptMap,
  renderModule,
};
