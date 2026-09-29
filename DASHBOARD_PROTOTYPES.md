# Dashboard prototypes

Work from `/Users/snolan/Documents/GitHub/teacherplatform`. The preview on port 5174 runs from this repository. The older Prototypes folder is not the working copy.

## Views

- `/dashboard` (and `/`): My classes, the new default based on Figma node 559:214061.
- `/prototypes/dashboards/today`: preserved Today / Overview exploration.
- `/prototypes/dashboards`: chooser, also available from Prototypes and the dashboard selector.

## Scenarios and interactions

7A demonstrates recognition after dismissing featured tasks; 7B recent results and behind pacing; 7C a priority due-soon task and ahead pacing; 8A no students; 8B students but no task history; 10A no focus; 10B active work; 10C no active work. The school directory also includes another teacher's 9A class.

Task summary tiles open filtered task lists. Dismissing a task only removes it from the featured queue: counts and reports remain intact. Due-soon tasks take priority over recent results and optional focus recommendations.

Class actions open contextual sheets for tasks, demonstration reports, textbook exploration, topic focus, recommendations, student rosters and task creation. Class directory and health support search and filters. Topic focus, added classes/students, created demo tasks and recognition selections persist in this browser. Reset demo classes restores the seeded scenarios.

## Prototype boundaries and recommended next steps

- This is a frontend demo, separate from the existing task-report prototype dataset. Creating tasks and recording stickers does not contact students or a backend.
- CATFA demonstrates purpose/type selection, naming and due dates. Next: connect the selected type to the existing question-authoring flow, retaining class/topic context.
- Textbook topics and subtopics demonstrate navigation; they are illustrative, not a complete year-specific curriculum. Lesson links open an explicitly labelled guide preview. Next: bind these to real curriculum topics and lessons.
- Reports demonstrate participation and results; detailed question-level reports remain in Progressive results and Test controls. Next: share a common class/task dataset so all routes show the same entities.
- Pacing and progress are seeded examples. Next: agree how pacing is calculated from a focus end date, and show “Not enough data” until it can be calculated.
- Directory/health are implemented; usage analytics and the full student experience remain outside this pass. Other teachers' tasks can be reviewed through the directory.
- Today is preserved as an exploration, including its original illustrative controls.
- Vercel will change only after these repository changes are committed/pushed and deployed through the normal workflow.

## Verification

`npm run build` and `node src/dashboard/model.test.mjs` pass. Browser checks covered filtered tasks, creating a readiness check-in, persistence after reload, saving topic focus and switching to Today. The build retains the existing large-bundle warning.
