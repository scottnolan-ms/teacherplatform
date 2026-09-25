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

1. Pause Class sitting: four eligible students pause, one already paused and one completed remain unchanged.
2. Resume that sitting: inspect the automatic timing policy and preserved individual timers.
3. Select students across sittings: bulk controls show eligible counts for each action.
4. Resume Ethan Nguyen: his deadline has passed, so a deliberate date or completion choice is required.
5. Toggle Results already released, then resume or restart: review the acknowledgement.
6. Select students and reassign with fresh numbers: a new sitting appears while original rows remain.
7. Use Reset demo to restore the initial scenario.

## Prototype boundaries

Local browser state only; no real students, APIs, questions, server clock or live multi-user synchronization. Fresh numbers are represented by an incremented attempt variant and zero progress. The student lockout screen is omitted. Timers count down while this view is mounted; automatic schedule opening, deadline expiry and result release are represented rather than connected to a scheduler. Results visibility is a scenario switch, not a real release operation. Activity history is session-only. Browser storage preserves attempt state and the demo clock.

## Verification

`npm run build`

`node src/test-controls/model.test.mjs`

State checks cover mixed batch eligibility, completed protection, per-mode deadline behavior, timer retention, pending resume, reassignment preservation, restart variants, rescheduling, early start and overdue completion.


## Layout exploration update

The demo now has Group 1 and Group 2, six students each. The former Independent sitting existed to exercise untimed tests and overdue/mixed date cases; those students are now in Group 2. No third initial group remains. New reassignments create Group 3 onward.

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

Validation: `node src/test-controls/report-data.test.mjs`, `node src/test-controls/model.test.mjs`, and `npm run build`.
