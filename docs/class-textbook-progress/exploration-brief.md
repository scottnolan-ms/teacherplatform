# Exploration brief: Class textbook progress

## The problem to explore

A mathematics teacher needs to connect their intended teaching sequence with evidence of how a class is learning, then decide what to do next. That decision might be to move on, revisit an idea, support a subset of students, provide extension, or collect better evidence before deciding.

The current prototype calls this space **Class → Textbook progress**. Its working promise is: “Your teaching plan, informed by how students are learning.” Treat that name, location, hierarchy and layout as design hypotheses, not requirements.

The central question is: **How can we help a teacher make a defensible next teaching decision without making them interpret a large reporting system or mistake missing evidence for weak understanding?**

This is a mathematics teacher portal in an Australian curriculum context. The implementation includes textbook topics, subtopics, skills, prerequisites, class rosters, teaching plans and simulated mastery. It sits alongside class Activity, Planner, Insights, Skills and Tasks, and a dashboard with topic-focus shortcuts. Explore how those surfaces should cooperate and whether the current tab duplicates them.

## Intended outcomes to validate

- Understand where the class is in its teaching sequence without equating content covered with content learned.
- See which students understand the current material, who needs support, who may need extension, and whose evidence is insufficient.
- Distinguish a missing prerequisite from a difficulty within the current topic.
- Select a practical next step and inspect the evidence supporting it.
- Revisit the decision after further work and see what changed, including uncertainty or deterioration.
- Keep individual differences visible without requiring the teacher to inspect every student every time.

These are proposed outcomes inferred from the prototype, not findings from teacher research. We do not yet have validated task-frequency, usability, workload or learning-impact evidence for this design.

## Teacher jobs and decision moments

| Moment | Teacher question | Useful outcome |
|---|---|---|
| Before a topic | What foundations are established, and what do I still need to check? | A justified starting point and an evidence-gathering or support plan |
| Before tomorrow’s lesson | What should I teach next, and to whom? | A manageable whole-class or differentiated lesson decision |
| During a topic | Is the class progressing, or is a particular concept blocking learning? | A clear distinction between broad difficulty, a small group and missing evidence |
| After practice | Has the evidence changed enough to adjust my approach? | A comparable before/after view with limitations made clear |
| At topic end | Can we move on while supporting those who need more time? | A decision that accommodates individual differences |
| Across the term | What has been introduced, what has been learned and what needs revisiting? | A useful overview of teaching coverage and retention |

Do not assume that assigning more digital practice is always the best response. Alternatives may include discussion, worked examples, classroom observation, a short diagnostic, regrouping, extension, or deliberately taking no action.

## Meaning that any alternative must preserve

Teaching coverage, task completion, task result, prerequisite readiness, topic mastery, evidence coverage and growth are different concepts. A student can complete work without establishing mastery, understand a topic before it is formally introduced, or have no digital evidence despite strong understanding outside the platform.

Missing evidence must remain distinguishable from demonstrated difficulty. Counts and percentages need explicit populations and denominators. Recommendations should expose their reason, relevant students and evidence, and remain reviewable by the teacher. Changing a teaching plan must not manufacture a change in learning evidence.

The five mastery levels used in the prototype are Exploring, Emerging, Familiar, Proficient and Mastered, plus a separate No evidence state. Whether this scale, its presentation, or an average of those levels is the right teacher-facing model remains open for investigation.

## What is genuinely available today

The prototype provides a navigable class/topic/student experience, editable class plans, illustrative distributions, rule-based recommendations and local drafts. Its mastery values, prerequisite mappings and historical changes are synthetic. It has no connected assignment delivery, raw-response evidence trail, validated inference engine or live longitudinal measurement.

A production experience could draw on task responses, diagnostic check-ins, independent practice, timestamps, content mappings, prior work and teacher observations. Their availability, quality, permissions and inference rules have **not** been established by this prototype. Label any proposal depending on them as a dependency, not an existing capability. See the reference document for a proposed data inventory.

## Freedom to explore

You may replace the textbook-first hierarchy, topic focus model, summary cards, tables, tabs, visualisations, recommendation placement and action flows. You may propose a smaller feature, a different home within the product, or separate planning from evidence review. Do not preserve existing UI merely because it is implemented.

Investigate at least three structurally different approaches. Possible starting points—not a required shortlist—include a lesson-decision workspace, an evidence-and-uncertainty overview, a student-group workspace, a curriculum map, or a minimal planner with contextual evidence. Explain what each makes easier and what it makes harder. Include one intentionally simpler alternative with fewer metrics and controls.

## Questions worth challenging early

1. Is “textbook progress” what teachers think they are doing, or does the name imply pages completed rather than learning?
2. Is the primary unit a topic, skill, upcoming lesson, learning objective, student group or decision?
3. Are planning and reporting helpful together, or does combining them create cognitive load and maintenance work?
4. Which information is needed immediately, and which belongs behind an explicit investigation step?
5. Is the readiness label actionable when it combines missing evidence with intermediate understanding? Would separate sufficiency and attainment signals be clearer?
6. Can a class average conceal a split cohort or improve simply because struggling students have no new evidence?
7. How should old, sparse, contradictory or heavily scaffolded evidence affect a decision?
8. How can teachers incorporate classroom knowledge, disagree with a recommendation, and record why?
9. Does the design support advanced students and retention as well as remediation?
10. When should the system recommend collecting evidence instead of practising, or avoid recommending anything?
11. How should a class moving through topics nonlinearly, or teaching multiple topics concurrently, be represented?
12. How do we close the loop from a suggested action to later evidence without claiming the action caused improvement?

## Scenarios for comparing alternatives

| Scenario | What the design must help a teacher notice or do |
|---|---|
| 28 students; same average, very different distributions | Distinguish a uniformly intermediate class from two groups at opposite ends |
| Only 4 of 28 have evidence, all strong | Avoid concluding the class is ready; choose whether and how to gather evidence |
| Students have partial prerequisite evidence | Separate known strengths, demonstrated gaps and unanswered questions |
| Topic marked Taught, but learning evidence is weak | Keep coverage and understanding separate; identify a suitable response |
| Strong evidence in a topic not yet introduced | Allow prior knowledge, extension and revising the plan |
| Student completes a check-in with a high result but readiness is low | Explain different constructs and show supporting evidence |
| Student joins mid-term or works mainly offline | Preserve missingness and cohort context without labelling low ability |
| Older strong evidence conflicts with recent difficulty | Make recency, source and uncertainty inspectable |
| Several lessons cover skills out of textbook order | Avoid forcing a misleading sequential coverage model |
| No students, no evidence, no focus or no dates | Offer a useful next step without fabricated metrics |
| Follow-up completed but mastery unchanged or lower | Distinguish participation, measurement and learning; support reconsideration |
| Large cohort, keyboard-only use, narrow screen | Preserve comprehension and navigation without colour-only meaning |

Use synthetic examples only. Do not invent research findings or claim the current algorithms are educationally validated.

## Requested outputs from Claude

1. Restate the problem, primary user and decision moments; distinguish facts from assumptions and list the most consequential unanswered questions.
2. Critique the current conceptual model, including what may be missing—not just its visual styling.
3. Describe at least three alternative interaction models with a concrete teacher walkthrough, main information hierarchy, actions and required data. Include low-data and empty states.
4. Compare alternatives on decision clarity, evidence honesty, teacher effort, support for varied learners, accessibility, integration with adjacent features and implementation/data cost. Explain tradeoffs rather than presenting arbitrary scores as facts.
5. Recommend a direction or a testable hybrid, state what you would remove or defer, and identify the smallest useful version.
6. Propose research and prototype tests: participant types, tasks, observations, success criteria and results that would disprove the recommendation.
7. Identify data and calculation contracts needing confirmation before implementation.

Suggested evaluation measures include correct interpretation of missingness and denominators, time to a justified next action, ability to identify affected students, explanation of why an action fits, teacher confidence calibrated to evidence, and effort required to maintain the plan. These are proposed measures; no benchmark has been established. Task assignment rate alone is not a measure of success.

## Ready-to-paste instruction

> Act as a critical product-design and learning-analytics collaborator. Use the attached Class textbook progress brief and reference to explore better ways to help a mathematics teacher decide what to teach next, who needs what support, and when more evidence is needed. First frame the problem independently of the existing layout. Then examine the implementation as one hypothesis, not the target to reproduce. Preserve the distinction between teaching coverage, task results, prerequisite readiness, mastery, missing evidence and growth. Identify conceptual gaps, challenge unsupported assumptions and propose at least three substantially different solutions, including a simpler one. For each, give a teacher walkthrough, information hierarchy, data dependencies, uncertainty treatment and tradeoffs. Recommend what to test next and what would falsify your preferred direction. Clearly separate observed implementation facts, inferred product intent, proposed capabilities and open questions. Do not assume live data or validated calculations exist, invent user research, or start coding until the alternatives and their dependencies have been considered. Ask only the few questions that would materially change your recommendation; proceed with explicit assumptions for the rest.
