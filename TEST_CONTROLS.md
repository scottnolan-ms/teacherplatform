# Test controls prototype

Open `/test-controls`, or choose Test controls from the sidebar. Local preview: http://127.0.0.1:5180/test-controls.

## Design decisions to compare

- Task sittings are assignment groups with their own schedules, not reusable classroom groups. Global controls expose Groups and Students tabs; the report gives direct group and labelled student actions.
- Pause is one operation. Timed attempts freeze; untimed attempts retain their deadline. Pending attempts can be paused. Completed attempts are excluded and explicitly counted as unchanged.
- Actions expand to eligible attempts. A group resume intentionally includes individual pauses in that group. The review step makes this explicit; pauses are not nested locks.
- Resume preserves answers and remaining time. Default scheduled deadlines move by each student's pause duration. Self-paced timers retain time without moving the access deadline; untimed and unstarted deadlines stay fixed.
- After any selected paused deadline has expired, automatic resume is blocked. Teachers choose a new deadline or explicitly complete all selected paused attempts. This deliberately conservative policy needs product validation for already-started self-paced tests.
- Proposed release policy: any paused attempt holds automatic results release. The demo toggle represents results released previously; reopening requires acknowledgement because seen answers cannot be recalled.
- Restart resets the timer with a choice to keep answers or reset progress with a new variant. Completed attempts use reassignment instead. Reassignment creates new attempt rows and a new sitting while preserving original records.
- Reschedule changes the access window and preserves work/time. The report supports differing dates even within a sitting.

## Try it

1. Choose Before due date and pause Group 1: Noah and Sophia pause; Emma and Liam remain completed.
2. Resume that sitting: inspect the automatic timing policy and preserved individual timers.
3. Select students across sittings: bulk controls show eligible counts for each action.
4. Choose Mixed states and resume Sophia: her due date extends by five minutes while the 40-minute allowance stays unchanged.
5. Toggle Results already released, then resume or restart: review the acknowledgement.
6. Select students and reassign with fresh numbers: a new sitting appears while original rows remain.
7. Use Reset demo to restore the initial scenario.

## Prototype boundaries

Local browser state only; no real students, APIs, questions, server clock or live multi-user synchronization. Fresh numbers are represented by an incremented attempt variant and zero progress. The student lockout screen is omitted. Timers count down while this view is mounted; automatic schedule opening, deadline expiry and result release are represented rather than connected to a scheduler. Results visibility is a scenario switch, not a real release operation. Activity history is session-only. Browser storage preserves attempt state and the demo clock.

## Verification

`npm run build`

`node src/test-controls/model.test.mjs`

`node src/test-controls/test-demo.test.mjs`

State checks cover mixed batch eligibility, completed protection, per-mode deadline behavior, timer retention, pending resume, reassignment preservation, restart variants, rescheduling, early start and overdue completion.


## Layout exploration update

The test demo has three groups of four using the same 12 students. The intended duration is 40 minutes: Group 1 has 40 minutes with calculators off, Group 2 has 45 minutes (+5) with calculators on, and Group 3 is untimed with calculators on. Penalties are off for all three. Duration, timer-start behaviour, calculator settings and initial schedules are consistent within each group. Individual control actions can change a student's due date without changing the group's allotted duration. New reassignments create Group 4 onward.

- Pending: all 12 students are scheduled, with zero progress and no marks/results.
- Before due date: Group 1 started 30 minutes ago; Emma and Liam have completed, Sophia has 10 minutes remaining at 80% progress. Noah is absent, paused before starting, with his full 40-minute allowance preserved. Group 2 starts the following day. Group 3 has been working for 20 minutes, with Mia finished and three students still working.
- After due date: the original group due dates have passed and results are available, including partial submissions. Noah remains paused with a make-up sitting scheduled for the following day and no result yet.
- Closed: every group has expired. Noah completed a make-up test one day after the rest of Group 1; his individual start, due and completion times reflect that later sitting, with the same 40-minute allowance.
- Mixed states: Group 1 includes Sophia paused with 15 minutes preserved, Group 2 is past due, and Group 3 has expired.

Marks and question outcomes are withheld until completion or the student's due date. At the due-date boundary, marking uses actual progress, retaining that snapshot during subsequent extension work. The Students table follows the Figma test column order and includes start, due, expiry, timer-start, calculator and penalties columns.

- Direction 01 preserves the original status-led composition, with neutral group names and a Show all filter.
- Direction 02 uses Show all / group tabs, a compact live overview only in Show all, and scoped summary insights. Test controls sit beside remaining time.
- Direction 03 adds Overview / Students / Questions / Marks. Overview combines group status and summary insights; Students keeps the roster in focus. Status counters and group cards lead into the filtered Students view.
- Live overview is also available in the global Test controls modal in every direction.
- Student identity and far-right quick actions are sticky during horizontal scrolling. Questions and Marks are navigation placeholders. Dropdowns show scope-aware counts.
- Progress and participation derive from demo attempts. Time and result averages are illustrative demo values, not measured performance.

Suggested discussion: Direction 02 suits a familiar report workflow. Direction 03 separates monitoring a running test from interpreting results, while keeping both one tab away. Keep global Test controls available in either context.


## Direction 04

Show all has a collapsible Task dashboard: Summary, then Live overview with nested, independently collapsible group status rows. Hide dashboard removes the panel and provides a Show dashboard restore action. Filters and global Test controls remain available. Group tabs show only the scoped summary and controls.

Global Start pending, Pause all eligible and Resume paused actions display eligibility counts and use the existing review flow. Pause includes unstarted attempts to prevent starting; completed attempts are skipped. Stop is deliberately omitted because ending a test is distinct from pausing. Status counters filter the report without changing attempt state.

At 1280 × 720 the roster expands as dashboard content collapses (approximately 170px expanded, 243px with group rows collapsed, 392px with dashboard collapsed). Collapse/hide preferences last for the mounted session. Existing directions remain available.


### Report exploration: filters, Questions, Marks and detail sheets
Student filters now combine status, progress conditions, result tiers and search. Empty result selections mean all; conditions apply immediately. Scores are deterministic demo responses derived from the existing attempt progress and version, not persisted student records. Result percentages use marked work only, exclude not-started attempts, and are labelled “so far”. Summary, filters, marks and sheets use the same calculation.

Questions supports difficulty and average-result tier filters. Marks shows a horizontally scrolling question grid with pinned student and result columns. Open a student scorecard from the student row or Marks; open collective responses from Questions. Both sheets share navigation, response filters, expandable answers and worked solutions. Escape closes the sheet and restores focus. Existing Students column order and task-control data are preserved.

Validation: `node src/test-controls/report-data.test.mjs`, `node src/test-controls/model.test.mjs`

`node src/test-controls/test-demo.test.mjs`, and `npm run build`.

## Direction 05 — persistent report and control concepts

Test reports now open in Direction 05 with **Scheduled (not started)** selected. Direction 04 remains available in the Layout menu. The summary is always visible; the report has no dashboard collapse or Live overview accordion. Test controls and task-level help open from the heading. Only eligible task actions appear beside the report tabs (excluding Reassign). Display sits beside student search, or in a view toolbar for Questions and Marks. Group rule variants are omitted from the summary; individual schedules and settings remain available in controls.

The prototype **Controls** menu compares **01 · Modal**, **02 · Bottom sheet**, and **03 · Side panel**. All use the same attempts and action confirmations. The sheet and side panel use the shared 260 ms slide timing for opening and closing. The side panel omits summary tiles and repeated student dates, keeping the report visible beside it. Groups expose schedules and settings on demand. Students support search, group/status filters, select matching students, and individual actions. Selection is shared with the report; the report's bulk control button opens Students with that selection. The action bar explicitly identifies whether it targets everyone or selected students, including selections hidden by filters.

Validation: production TypeScript/Vite build; test-demo, model, report-data, and table-sort suites; browser checks of all three surfaces, student filtering, pause confirmation and applied state, help modal, and Direction 04 availability.

### Start, pause and resume confirmations

Direction 05's **Confirmations** menu compares a compact modal, an expanded-review modal, and a right slide-out with an always-visible review list. Other actions and Directions 01–04 retain their existing confirmation flows. The compact modal shows one student's details directly; multiple students use an accordion. All variants keep the scope, affected and unchanged counts visible, with persistent action/cancel buttons. The review shows status, remaining time, group, timer policy and due dates, using the same action model to preview date changes.

Resume retains the established automatic/custom/complete choices and date validation. It does not add a future-start date: scheduling future access remains a Reschedule action. Start copy now accurately describes the existing timed-test due-date adjustment. No lifecycle rules were changed by this UI refinement.

## Contextual messaging and validation (12 October 2026)

Direction 05 uses the supplied DS2 message colours and icons. Information explains a required choice; warnings explain consequences; red field errors identify blocking input. Do not use a generic warning for every action.

- Resume with mixed timing or passed due dates requires an explicit due-date choice. Confirmation explains why it is unavailable.
- Reschedule/reassign require a valid start at or after the demo clock and a future due date after that start. Custom resume/restart due dates must be valid and future. Time allowance is validated only where editable (1–240 minutes); reassignment requires a group name.
- Zero eligible attempts show a defensive warning and prevent confirmation. Normal action entry points continue to hide unavailable actions.
- Reopening released results requires acknowledgement that students may have seen answers. Closing overdue attempts does not require that acknowledgement: it removes access, preserves saved answers and does not release results. The label now says **Close attempts**, matching the Closed status.
- Restart with fresh numbers warns that progress and timer are reset.
- Release settings distinguish teacher marking visibility from student access. Missing/past custom times show field errors; releasing while attempts remain open requires acknowledgement.
- Inputs expose `aria-invalid` and associated error text. Errors use alert semantics; informational/warning/success messages use status semantics. Text and icons carry meaning alongside colour.
- Cancel, close and Escape discard edits. Browser verification confirmed Cancel/Escape preserve the student table and restore focus to the Reschedule trigger. No success activity is created on cancellation.
- Empty student results offer **Clear filters and search**.

The prototype-only **Validation** menu reproduces invalid date ordering, missing due-date choice, zero eligible students and released-results acknowledgement. These examples replace the demo rows; use Reset demo or the Scenario selector to return to a lifecycle scenario.

### Documentation vocabulary

Read a journey as **Starting state → Teacher action → Decision/Validation → Outcome**. “Before” means before that journey’s action; “After” means after successful confirmation. A **Decision** is a teacher’s choice, while an **Open question** is unresolved product policy. An **Alternative** is another branch of the same journey. A **Check** is behaviour to verify interactively, not something a static screenshot proves. **Current** denotes implemented prototype behaviour; **Proposed** denotes exploration.

Figma section 06.2 now separates invalid dates, missing due-date choice, zero eligibility and cancellation checks. Updated screenshots also cover released-results warnings and release-setting validation. Existing editable explorations remain intact. The journey glossary sits beside the overview; older captures are historical references. Production request failure, concurrency and permissions remain to be specified; the prototype does not simulate a backend.
