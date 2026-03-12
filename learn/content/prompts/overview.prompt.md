# Conceptual Overview Lesson Generator

You are creating a lesson for GSD Learn, a terminal-based interactive tutorial that teaches
developers how GSD (Get Shit Done) works internally.

## Lesson Metadata
- **Lesson Number:** {{LESSON_NUMBER}}
- **Title:** {{LESSON_TITLE}}

## Module Context

{{MODULE_OVERVIEW}}

## Instructions

Create a conceptual overview lesson that helps the learner understand the big-picture architecture
before diving into source code. This lesson should build a mental model of how the pieces fit
together, so that subsequent source-code deep-dive lessons have context.

For every design choice mentioned, explain WHY it was made. Reference GSD's constraints:
zero dependencies, CommonJS, CLI-native, cross-platform. Do not just describe what exists --
explain the rationale behind the architecture.

## Output Requirements

Generate a JSON lesson file with this EXACT schema:

```json
{
  "id": "kebab-case-id",
  "title": "{{LESSON_TITLE}}",
  "lessonNumber": {{LESSON_NUMBER}},
  "objective": "One sentence: what the learner will understand after this lesson",
  "content": [
    { "type": "text", "value": "Explanation text...", "focus": "Short phrase describing what this block teaches", "bridge": "One sentence connecting this block to the next block" },
    { "type": "code", "language": "javascript", "value": "short illustrative snippet", "highlight": [1, 3], "focus": "What this code demonstrates", "bridge": "How this connects to what comes next" },
    { "type": "text", "value": "Why this pattern was chosen...", "focus": "Design rationale summary", "bridge": "Transition to next topic" }
  ],
  "conceptMap": "section-name-for-you-are-here-marker",
  "successCriteria": "One sentence: what the learner can do/explain after this lesson"
}
```

**Required fields:** "id", "title", "lessonNumber", "objective", "content", "conceptMap", "successCriteria". Every content item must include `focus` and `bridge`.

## Content Guidelines

1. **Alternate text and code blocks.** Never put two code blocks back-to-back.
2. **Keep code snippets short** (5-15 lines). Use them to illustrate patterns, not dump entire files.
3. **Explain the architecture in layers.** Start with the highest level and drill down one step.
4. **Connect pieces together.** Show how modules relate, how data flows, how commands are dispatched.
5. **Target audience:** A developer who uses GSD but has never read its source code.
6. **Tone:** Direct, practical, no filler. Like a senior developer sketching architecture on a whiteboard.
7. **Every content item must include `focus` and `bridge` fields.** `focus` is a short phrase (3-8 words) describing what this specific block teaches. `bridge` is one sentence connecting this block to the next. The last content item's bridge should reference the next lesson title: {{NEXT_LESSON_TITLE}}.
