# Class textbook progress: handoff for Claude

Prepared 26 October 2026 from the current teacher-platform prototype source and a local browser inspection. These documents are self-contained; Claude does not need this conversation.

## How to use this package

1. Give Claude `exploration-brief.md` first. It contains the problem, design freedom, evaluation scenarios and a ready-to-use instruction.
2. Attach `current-experience-and-data.md` as the factual reference for what exists. To reduce anchoring, ask Claude to frame the problem before reading the current solution in detail.
3. If Claude has repository access, use the source map in the reference. Otherwise, both Markdown files can be uploaded or pasted directly.

The prototype is a hypothesis to investigate. Neither these documents nor the current UI establish validated teacher needs, production mastery algorithms, or available backend capabilities. Product intent below is inferred from the implementation and its explanatory copy unless explicitly described as observed behaviour.

## Local walkthrough

- Class overview: http://127.0.0.1:5173/classes/dash-7a?tab=textbook
- Current topic: http://127.0.0.1:5173/classes/dash-7a?tab=textbook&topic=focus
- Another class: http://127.0.0.1:5173/classes/dash-7b?tab=textbook
- Class with students but no seeded history: http://127.0.0.1:5173/classes/dash-8b?tab=textbook
- Empty class: http://127.0.0.1:5173/classes/dash-8a?tab=textbook

These links work only on the machine running the prototype. They are not public sharing links. With a local checkout, run `npm install` if dependencies are missing, then `npm run dev -- --host 127.0.0.1 --port 5173` from the repository root.

Start in 7A Math, open Topic focus, inspect the subtopic distributions, switch to Students, open a student, then inspect Skills, Prerequisites and Follow-up. Try the Wide spread, Limited evidence and No evidence yet scenarios. Design options exposes four distribution layouts. Plan edits and drafts persist in browser local storage; displayed dates and focus can differ between browsers. Historical evidence uses a fixed illustrative latest date of 23 October 2026.

## Files

- `exploration-brief.md`: shareable design challenge and Claude starter prompt.
- `current-experience-and-data.md`: current flows, definitions, calculations, data dependencies, limitations and source map.

Only documentation was added. No learning calculations or product behaviours were changed for this handoff.
