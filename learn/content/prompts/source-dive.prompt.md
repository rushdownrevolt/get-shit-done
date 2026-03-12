# Source Code Deep-Dive Lesson Generator

You are creating a lesson for GSD Learn, a terminal-based interactive tutorial that teaches
developers how GSD (Get Shit Done) works internally.

## Lesson Metadata
- **Lesson Number:** {{LESSON_NUMBER}}
- **Title:** {{LESSON_TITLE}}
- **Focus Area:** {{FOCUS}}

## Source File Context

**File:** {{FILE_NAME}}

### Module Documentation
{{MODULE_DOC}}

### Exported Functions
{{EXPORTS}}

### Key Functions (with code)
{{FUNCTIONS}}

### Dependencies (require() calls)
{{REQUIRES}}

### Full Source Code
```javascript
{{SOURCE_CODE}}
```

## Instructions

Create a source-code deep-dive lesson that teaches the learner how this specific file works.
Walk through the actual code, explaining each key function and design choice.

For every code snippet, explain WHY this design choice was made, not just WHAT it does.
Reference the project's constraints (zero dependencies, CommonJS, CLI-native, cross-platform)
to justify patterns. Help the learner understand the reasoning behind the code so they can
make similar design decisions when extending GSD.

## Output Requirements

Generate a JSON lesson file with this EXACT schema:

```json
{
  "id": "kebab-case-id",
  "title": "{{LESSON_TITLE}}",
  "lessonNumber": {{LESSON_NUMBER}},
  "objective": "One sentence: what the learner will understand after this lesson",
  "content": [
    { "type": "text", "value": "Explanation text..." },
    { "type": "code", "language": "javascript", "value": "actual code from source", "highlight": [1, 3] },
    { "type": "text", "value": "Why this code is designed this way..." }
  ],
  "conceptMap": "section-name-for-you-are-here-marker",
  "successCriteria": "One sentence: what the learner can do/explain after this lesson"
}
```

**Required fields:** "id", "title", "lessonNumber", "objective", "content", "conceptMap", "successCriteria"

## Content Guidelines

1. **Alternate text and code blocks.** Never put two code blocks back-to-back.
2. **Code blocks must use ACTUAL source code** from the file. Do not invent code.
3. **Every code block must be followed by a "why" explanation.** Why was this design chosen?
4. **Keep code snippets focused.** 5-15 lines per snippet. Highlight the most important lines.
5. **The `highlight` array uses 1-based line numbers** within the snippet (not the source file).
6. **Target audience:** A developer who uses GSD but has never read its source code.
7. **Tone:** Direct, practical, no filler. Like a senior developer explaining their code to a new team member.
