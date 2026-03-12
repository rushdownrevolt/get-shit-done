# Quick Task 1: Clickable file names and code snippets with line references - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Task Boundary

Add clickable file names and line-referenced code snippets to the GSD Learn terminal UI. When lessons reference source files, users should be able to click to open them and see which lines matter.

</domain>

<decisions>
## Implementation Decisions

### Click Target
- Use OSC 8 terminal hyperlinks with `vscode://` URI scheme
- Clicking a file name opens the file at the referenced line in VS Code

### Snippet Display
- Code snippets render inline in lesson content (current behavior)
- Add clickable file header above each snippet showing file path + line range

### Line References
- Show line numbers in the gutter of code snippets
- Highlight key lines with a distinct background/color using ANSI escape codes

### Claude's Discretion
- Specific ANSI color choice for highlighted lines
- Fallback behavior if terminal doesn't support OSC 8 (degrade gracefully to plain text)

</decisions>

<specifics>
## Specific Ideas

- OSC 8 format: `\e]8;;vscode://file/{absolute_path}:{line}\e\\{display_text}\e]8;;\e\\`
- Existing `highlightJS()` in terminal.cjs can be extended for line number gutter
- Lesson JSON already has `"highlight"` arrays marking key lines
- renderer.cjs handles code block output and needs the clickable header addition

</specifics>
