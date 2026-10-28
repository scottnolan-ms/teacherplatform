# Progressive results: detail-state prototype

Updated 27 October 2026. Reference: Figma page 2144:215860 in Teacher — Task Assignments; detail-state sections 2965:79904, 2965:80119 and 2965:80344. PO exploration: https://claude.ai/artifact/YKS4PrJY5a455FfwbmruMF.

## Review routes

Open `/prototypes/progressive-results` and choose Custom or Adaptive. Both retain lifecycle selectors. Adaptive has a Detail states selector: Class overview, Progress edge cases, Evidence edge cases, No revision and Empty cohort.

## Implemented

- Hover, focus and tap tooltips; Escape dismissal; keyboard access to the mastery-activity action. Adaptive column explanations and answer-outcome breakdowns.
- Mastery attribution: no level, other work only, mostly other work and ordinary level; numeric score and concise level meaning. Other work may happen during the task.
- Diamond progress: unopened, started, answered with no diamonds, revision only, partial, bonus round, complete and expired. Completion is separate from mastery.
- Separate adaptive and revision answered counts and matching sorting. No-revision tasks hide the revision column. Zero and unstarted are distinct.
- All student scorecard buttons are active, including students with no answers. Mastery activity remains independently accessible.
- Prior-evidence panel: reliable, limited, absent and unavailable starting snapshots. Current/final mastery panels distinguish completion and expiry.
- Custom progress uses completed subproblems consistently in tables, filters, averages and scorecards; extension breakdown appears only after due date. Completed results use whole-task denominator even before due.
- Custom scorecard middle-panel selector demonstrates Observation and Across the whole task without settling their product mapping.
- Existing filter, sorting and display menus retained. Invalid percentage ranges retain their error and disable Done; Clear restores a valid range. Empty adaptive cohort and no-match states have distinct copy.

## Decisions still open

The mostly-other-work rule (at least five other questions and at least twice the adaptive count) is the PO's proposed demo rule. Legacy unknown counts fall back to ordinary mastery wording. Null mastery is excluded from averages while zero is included. The toolbar labels these as prototype choices.

Custom progress remains subproblems; adopting “questions finished” requires a product decision. Observation versus whole-task panel mapping, readiness check-in behaviour, later exports of live mastery and legacy adaptive policy are not settled here. Readiness is a separate exploration and is unchanged.

This remains a deterministic local prototype. Real service loading/failure, production evidence history and export persistence are not implemented by this update. Existing Figma blank variant slots are design coverage, not a promise that every slot is a distinct application screen.

## Attention alert

A drop of at least 20 points from a reliable task-start mastery score triggers attention. This is a point difference, not a relative percentage or a plateau. Unknown, absent or unreliable baselines do not trigger the alert. The default Lily fixture is 85 → 62 (23 points). The table chip carries an orange warning badge; its tooltip explains the drop and offers Mastery activity. The scorecard repeats the warning in an orange inline banner. The summary provides a review entry point. Task-start comparison is the current prototype assumption.

## Extra work and target mastery

The table shows the earned diamond count beyond the initial target (for example 15/12), replacing the “Bonus round” label. A purple segment denotes extra diamonds; orange retains its meaning of work during the extension within the initial target. Tooltips include exact before-due/extension counts. Bars divide available width by max(target, earned), so extra work cannot overflow the cell. Progress filters and the percentage summary cap target completion at 100%; count cells retain the full earned value.

The progress tooltip and scorecard show a separate mastery meter on a 0–100 scale, with a target marker, current/target values, and points remaining or “target met”. This distinguishes doing the required work from demonstrating the required understanding. Default examples: Liam 15/12 with mastery 64/75; Emma 14/12 with mastery 100/75 and completion recorded. Extra work can be required to reach mastery or voluntarily undertaken after meeting goals. Student column is 280px; progress is constrained to 150px.
