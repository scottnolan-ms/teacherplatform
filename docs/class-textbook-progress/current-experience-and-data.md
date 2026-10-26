# Class textbook progress: current experience and data reference

Status: local prototype inspected 26 October 2026. This is a descriptive reference, not a production specification or an endorsement of its algorithms. Product purpose is inferred from the code and on-screen explanations. Suggested production requirements are explicitly labelled below.

## Purpose and place in the product

The tab connects the class teaching plan to an illustrative view of student understanding across a textbook. It supports a loop of reviewing evidence, investigating students or skills, preparing a response and checking subsequent progress. Its scope is cumulative class/topic learning rather than the result of one task.

The class workspace has Activity, Planner, Insights, Textbook progress, Skills and Tasks sections. Dashboard topic-focus links can enter the tab directly. The global Textbook navigation currently leads to a separate stub; it is not this class experience. A legacy class shell adapts into the same new textbook component.

## Concepts that must not be conflated

| Concept | Meaning in this experience | Does not establish |
|---|---|---|
| Teaching plan | Topic order, focus, state, dates and number of introduced subtopics | Student understanding |
| Teaching coverage | Subtopics the teacher records as introduced | Completion, proficiency or retention |
| Prerequisite readiness | Demonstration categorisation of prerequisite skill levels | The percentage earned on a check-in, or mastery of the new topic |
| Mastery | An illustrative ordinal estimate for a skill or subtopic, levels 1–5 | A raw percentage correct or stable student ability |
| No evidence | No usable estimate represented in the prototype | A score of zero or inability |
| Evidence coverage | How much of the stated population has an estimate | Confidence, recency or completeness across every skill |
| Growth | Comparison of matched student–subtopic observations at two dates | A causal effect of teaching or assigned work |
| Task progress/result | Completion and performance on a particular task, elsewhere in the portal | Equivalent measures of cumulative learning |

## Current navigation and interactions

### Overview and teaching plan

The overview lists topics in the class teaching order. Each row shows a teaching state, coverage/date information, evidence coverage and a next-step link. For a class with introduced subtopics, the learning summary counts students proficient in **all** introduced subtopics. Otherwise it describes evidence across the topic. This is different from counting all proficient student–subtopic observations in the topic summary.

Teachers can choose a focus, reorder topics, set Planned/Teaching/Taught, record the number of introduced subtopics and enter start/target finish dates. Target finish cannot precede start. Coverage is represented as the first N subtopics in their fixed order, not an arbitrary set of taught subtopics. The editor does not provide arbitrary topic creation or a prerequisite-map editor.

Plans persist per class in local storage. Selecting a focus marks that topic Teaching; other topic states are not automatically reconciled. Plan edits do not change mastery values. Focus information is also written into dashboard class data where a matching class exists; do not assume all dashboard headline metrics are recalculated from this tab.

### Topic detail

The topic header shows focus/state, introduced count, target date and plan controls. The summary presents readiness, teaching coverage, topic mastery, evidence coverage, growth and proficient/mastered observations. Its Learning scope control switches summary learning calculations between Introduced subtopics and All subtopics; it does not filter the entire page or change prerequisite readiness.

Readiness counts open filtered student views. Topic evidence is organised into five tabs:

| Tab | Current behaviour |
|---|---|
| Subtopics | Teaching coverage, illustrative average and full class mastery distribution; expand a subtopic to see its skills; open a student matrix or contextual actions |
| Students | Student × subtopic matrix, latest prerequisite readiness, name search, readiness/support/subtopic filters, latest/as-of/compare-date controls; open an individual student sheet |
| Skills | Current-grade and prerequisite skills, DEMO codes, averages and distributions; scope, evidence-category and text filters |
| Prerequisites | Separate distributions for foundations needed to begin the topic; review students |
| Follow-up | Saved local drafts plus optional demonstration assignments and simulated outcomes |

Skill evidence filters match a skill when **at least one** student meets the category. Selecting a subtopic in the student view narrows columns, rather than selecting only low-mastery students. “Needs practice” filters use levels 1–2. Readiness in historical student views remains explicitly **latest evidence**, while mastery cells can show historical values.

### Individual investigation

A student sheet shows topic readiness, a suggested next step, expandable subtopic skills and prerequisite levels. Teachers can move between students in the currently visible roster or inspect the student's textbook overview. Individual recommendations prioritise the first subtopic at level 1–2, then prerequisite gaps, then missing prerequisite evidence. This first low subtopic need not have been introduced. The sheet does not expose original answers, task provenance or timestamps supporting the estimates.

### Recommendations and actions

Class topic recommendations can include a saved draft, practice for students at levels 1–2 in the **last introduced subtopic**, prerequisite support, and a check-in for students with all prerequisites unknown. They are rule-driven and do not optimise across all topics or intervention choices.

Context menus offer Assign practice, Support students needing practice, Prepare a lesson and Prepare board questions. Assignment actions open an editable student/skill selection and save a draft. Lesson and board previews use template content, not live student responses. Preview question edits are not a durable authored lesson workflow.

Saving a draft replaces any previous draft for that topic in the class. There is no connected delivery to students. Follow-up demonstrations can simulate completion and improved counts; these numbers do not update the mastery model. The implementation therefore illustrates a feedback loop but does not actually measure intervention outcomes.

## Data used by the current prototype

| Input or derived data | Actual source and role |
|---|---|
| Class and roster | Local dashboard/class records; learner IDs and names drive the class and student views |
| Textbook and topic structure | Class textbook topics when provided, otherwise a default list; hard-coded example subtopics and prerequisites, with generic fallbacks |
| Initial teaching sequence | Seeded from focus position: earlier topics become Taught, focus Teaching, later topics Planned; this is a demo shortcut, not recorded teaching history |
| Persisted plan | `textbook-plan-v1-{classId}`: focus, topic order, teaching state, dates and introduced count |
| Subtopic mastery | Deterministic hash of class/student/topic/subtopic identifiers, with hard-coded topic-stage patterns and a history flag; not calculated from task answers |
| Skill mastery | Derived synthetic variation around subtopic mastery; subtopic mastery is not an aggregation of independently measured skill evidence |
| Prerequisite levels | Separate deterministic hashes and missingness pattern; illustrative mappings, not a validated prerequisite graph |
| Evidence scenarios | Current, Wide spread, Limited evidence and No evidence yet transform values for design exploration; not live class segments |
| History | Synthetic snapshots from current values and a fixed demo date, 23 October 2026; not an event log |
| Drafts | `textbook-drafts-{classId}` stores topic, kind, student IDs and content selections |
| Follow-up demonstrations | `textbook-followups-{classId}-{topic}` stores illustrative assignment and simulated outcome counts |

The older `src/data/curriculumData.ts` includes another curriculum/insight generator. The shared current textbook experience uses `src/textbook/model.ts`; the legacy adapter passes roster/class context rather than treating the old insight calculation as the new tab's mastery source.

## Current calculation contracts

These rules document the demo only. They must not be copied into production as validated educational logic.

**Mastery categories:** 0 = No evidence; 1 = Exploring; 2 = Emerging; 3 = Familiar; 4 = Proficient; 5 = Mastered. Level 0 is excluded from averages but retained in distributions. Proficient/mastered means level ≥4. Support recommendations generally use positive levels below 3, so Familiar is not included in those support rules.

**Readiness:** no prerequisites or all zero → Unchecked; all levels ≥4 → Ready; any known level 1 or 2 → Not ready; otherwise → Partially ready. Thus `[4,0]`, `[3,3]` and `[4,3]` share a label despite different evidence needs. “Unchecked” can be misleading if a student completed a check-in that did not yield sufficient mapped evidence.

**Distributions:** include every student in the current roster, including zero. Counts/percentages use that roster as denominator. Four display variants exist; default is a stacked bar with mastery symbols. Dots fall back to a scalable bar above 60 students.

**Average mastery:** arithmetic mean of nonzero levels. At subtopic/skill level this is across students with evidence; the symbol uses the lower whole-number tier. It is an ordinal mean, not percent mastery. At topic level it equally weights available student–subtopic observations in the chosen scope, so students with more observed subtopics contribute more observations.

**Evidence coverage:** number of students with any nonzero value in the chosen topic scope divided by roster size. A student with one observed subtopic counts as covered even if all others are unknown. The topic average separately shows observed/possible observation counts.

**Proficient/mastered topic summary:** number of observations ≥4 divided by all possible student–subtopic observations in scope, including missing evidence. The denominator is observations, not students. Example: 28 students × 3 introduced subtopics = 84 possible observations; 35/84 proficient observations does not mean 35 students or 35% of students.

**Pacing:** expected introduced count is the ceiling of elapsed fraction of the start-to-end interval, clamped to 0–1, multiplied by the number of subtopics. It uses the fixed demo date and equal subtopic weighting, without school calendars, lesson allocations or topic difficulty. No usable interval means no pacing comparison.

**Growth:** snapshot values are generated from current levels and elapsed time, with missing observations at earlier dates. Topic growth counts improved pairs among observations with evidence at both dates; baseline is topic start when valid or 9 October 2026. The generator is monotonic, so it cannot model genuine decline. The cell renderer labels non-improvement “No measured growth”; a production model would need to distinguish stable estimates, decline and uncertainty. Different page sections do not all adopt the date controls.

## Candidate production data inventory — not confirmed as available

| Data family | Candidate fields | Why it matters |
|---|---|---|
| Cohort identity | Stable student/class IDs, enrolment dates, membership history, teacher access | Correct populations, continuity and legitimate access |
| Curriculum/content | Textbook/version, stable topic/subtopic/skill IDs, year/outcome mappings, prerequisite relations and versions | Traceable evidence and comparable meanings across views |
| Teaching plan | Planned and actual dates, arbitrary introduced-skill sets, concurrent topics, author, change history | Reflect actual classroom sequence and teacher decisions |
| Learning observations | Student, skill mapping, response/result, time, source task/check-in/practice, attempts, hints/scaffolding, completion context | Distinguish performance conditions and explain an inference |
| Inference metadata | Estimate, model/version, evidence count, recency, confidence or sufficiency, contradictory observations, direct vs inferred evidence | Communicate uncertainty and avoid false precision |
| Historical state | Time-stamped observations or versioned estimates, roster at each date, content/model changes | Meaningful comparisons and explainable changes |
| Teacher evidence | Observation/assessment notes, source, date, judgement and override rationale where supported | Incorporate learning not captured digitally |
| Actions and outcomes | Recommendation rationale, reviewed students/skills, assigned content, delivery status, participation and later comparable evidence | Close the decision loop without equating completion with learning |

Confirm which sources actually exist, how related-skill evidence is used, how contradictory evidence is reconciled, and whether old evidence decays. Raw answers and learning histories should have appropriate access and sharing boundaries; use synthetic examples for design exploration.

## Gaps and assumptions to investigate

- The textbook hierarchy may be the wrong starting point for a teacher deciding tomorrow's lesson. The tab combines planning, reporting, diagnosis, content preparation and follow-up.
- One focus and a first-N introduced count cannot faithfully express every teaching sequence. Taught is a teacher-entered state, not a derived learning outcome.
- No recency, confidence, provenance, original response or misconception trail supports the visible estimates. Adding those is a data and product decision, not a cosmetic change.
- Averages can hide a split class and are sensitive to missingness. Topic summaries mix student counts and observation counts; labels need comprehension testing.
- Class recommendations only inspect the last introduced subtopic for topic support, and all-unknown prerequisite students for check-ins. Earlier gaps, partial missingness, retention and extension may be missed.
- The individual and class recommendation rules differ. A teacher may see apparently inconsistent advice when moving between them.
- A prerequisite row's Review students action opens the general prerequisite-support filter, not a filter specific to that prerequisite.
- Current filters are narrow; custom groups, attendance context and complex differentiated planning are not integrated into this tab.
- Historical views can sit next to latest readiness and latest recommendations. Users may assume a shared time context that does not exist.
- Synthetic monotonic growth cannot test declining, noisy or contradictory evidence, and simulated follow-up improvement is not measured change.
- Local persistence lacks shared teacher editing, audit history and robust stable-ID migration for renamed/reordered curriculum content. The model uses topic names and indices in several identities.
- Dashboard completion/pace summaries and textbook calculations are not a unified production metric contract. Check cross-surface consistency before extending the design.

## Verification and source map

The current topic-focus page was inspected in the local browser and matched the implemented summary, distributions, readiness counts and five evidence tabs. Deeper behaviour and limitations above were established by reading source; this handoff is not an exhaustive usability or accessibility audit. Existing model tests cover separation of teaching edits from evidence, missingness, readiness states, deterministic scenarios and synthetic snapshots; they do not validate educational inference.

Repository-relative source paths, for anyone with the checkout:

| File | What it establishes |
|---|---|
| `src/pages/ClassWorkspace.tsx` | Class routing and tab selection |
| `src/dashboard/ClassContent.tsx` | Roster integration and shared textbook entry |
| `src/dashboard/model.ts` | Demo class context and focus |
| `src/textbook/TextbookProgress.tsx` | Main views, plans, filters, recommendations, draft persistence |
| `src/textbook/model.ts` | Content mapping, synthetic evidence, readiness, snapshots |
| `src/textbook/EvidenceUI.tsx` | Mastery descriptions, distribution variants, averages |
| `src/textbook/TopicTools.tsx` | Topic summary, scope/denominators, skill filters, pacing and historical cells |
| `src/textbook/StudentProgressSheet.tsx` | Individual view and its recommendation priority |
| `src/textbook/TopicRecommendations.tsx` | Recommendation explanation and review flow |
| `src/textbook/FollowUp.tsx` | Local follow-up simulation and teaching starter content |
| `src/components/TextbookProgressTab.tsx` | Legacy adapter |
| `src/textbook/model.test.mjs` | Existing model invariants and demo limitations |

The exploration brief supplies the design challenge and evaluation tasks. Use this reference to understand the current solution, not to constrain alternatives to its layout or implementation shortcuts.
