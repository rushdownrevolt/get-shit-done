# Markdown File Anatomy Lesson Generator

You are creating a lesson for GSD Learn, a terminal-based interactive tutorial that teaches
developers how GSD (Get Shit Done) works internally.

## Lesson Metadata
- **Lesson Number:** {{lessonNumber}}
- **Title:** {{lessonTitle}}
- **Focus Area:** {{focus}}

## Source File Context

**File:** {{fileName}}
**File Type:** {{fileType}}

### YAML Frontmatter
{{frontmatterFormatted}}

### XML Sections
{{sectionsFormatted}}

### @file References
{{fileReferencesFormatted}}

### Code Blocks
{{codeBlocksFormatted}}

### Full Source Content
```markdown
{{sourceCode}}
```

## Instructions

Create a markdown anatomy lesson that teaches the learner how this specific `.md` file works
within GSD. This file is a **{{fileType}}** — explain its structural patterns and how each
section contributes to GSD's behavior.

For command specs: focus on how YAML frontmatter fields drive CLI behavior, how XML sections
like `<objective>`, `<context>`, and `<tasks>` structure the workflow, and how `@file`
references wire this file into the larger system.

For workflows: focus on how `<step>` tags define execution order, how `<process>` sections
orchestrate multi-step operations, and how the file guides an AI agent through a complex task.

For every structural element, explain WHY it exists and what would break if it were removed
or changed. Help the learner understand the design rationale so they can read and modify
GSD configuration files confidently.

## Output Requirements

Generate a JSON lesson file with this EXACT schema:

```json
{
  "id": "kebab-case-id",
  "title": "{{lessonTitle}}",
  "lessonNumber": {{lessonNumber}},
  "objective": "One sentence: what the learner will understand after this lesson",
  "content": [
    { "type": "text", "value": "Explanation text...", "focus": "Short phrase describing what this block teaches", "bridge": "One sentence connecting this block to the next block" },
    { "type": "code", "language": "markdown", "value": "actual content from source", "source": "{{fileName}}", "highlight": [1, 3], "focus": "What this code demonstrates", "bridge": "How this connects to what comes next" },
    { "type": "text", "value": "Why this structure is designed this way...", "focus": "Design rationale summary", "bridge": "Transition to next topic" }
  ],
  "conceptMap": "section-name-for-you-are-here-marker",
  "successCriteria": "One sentence: what the learner can do/explain after this lesson"
}
```

**Required fields:** "id", "title", "lessonNumber", "objective", "content", "conceptMap", "successCriteria". Every content item must include `focus` and `bridge`.

## Content Guidelines

1. **Alternate text and code blocks.** Never put two code blocks back-to-back.
2. **Code blocks must use ACTUAL content** from the source file. Do not invent markup.
3. **Every code block must be followed by a "why" explanation.** Why does this section exist?
4. **Keep code snippets focused.** 5-15 lines per snippet. Highlight the most important lines.
5. **The `highlight` array uses 1-based line numbers** within the snippet.
6. **Target audience:** A developer who uses GSD but has never read its source files.
7. **Tone:** Direct, practical, no filler. Like a senior developer explaining their config to a new team member.
8. **Every content item must include `focus` and `bridge` fields.** `focus` is a short phrase (3-8 words). `bridge` is one sentence connecting to the next block.
9. **For command specs:** Walk through frontmatter fields first, then XML sections, then @file references.
10. **For workflows:** Start with the process overview, then walk through steps in order.
