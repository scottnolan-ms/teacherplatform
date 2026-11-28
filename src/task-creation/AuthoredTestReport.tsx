import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SuccessToast } from '../components/SuccessToast';
import { Icon } from '../dashboard/Dashboard';
import type { DashboardClass, DemoTask } from '../dashboard/model';
import TestControls from '../test-controls/TestControls';
import type { Attempt } from '../test-controls/model';
import type { Question } from '../test-controls/report-data';
import { CalculatorControl } from './AssignmentSettings';
import CreationDialog from './CreationDialog';
import { dueTime, questionBank, usesCalculator, versions } from './model';
import type { TestSetup } from './model';

export default function AuthoredTestReport({ item, task, onSave }: {
  item: DashboardClass; task: DemoTask & { testSetup: TestSetup }; onSave: (setup: TestSetup) => void;
}) {
  const setup = task.testSetup;
  const [params, setParams] = useSearchParams();
  const hasSamples = params.get('scenario') === 'sample';
  const [editing, setEditing] = useState<TestSetup | null>(null);
  const [revision, setRevision] = useState(0);
  const [showSaved, setShowSaved] = useState(false);
  const [now] = useState(Date.now);
  const questions: Question[] = setup.questions.map((entry, index) => ({
    ...questionBank.get(entry.questionId)!,
    id: index + 1,
    multipartDemo: false,
    subproblems: 1,
  }));
  const students = setup.groups.flatMap(group => group.students.map(name => ({ group, name })));
  const sampleCount = Math.ceil(students.length * 0.75);
  const lastDueTime = setup.groups.map(dueTime).sort().at(-1)!;
  const latestDue = Date.parse(lastDueTime);
  const earliestStart = Math.min(...setup.groups.map(group => Date.parse(group.start)));
  const rows: Attempt[] = students.map(({ group, name }, index) => {
    const submitted = hasSamples && index < sampleCount;
    const calculatorQuestions = setup.questions.flatMap((entry, position) => usesCalculator(group, entry) ? [position + 1] : []);
    return {
      id: index + 1,
      name, group: group.name,
      mode: group.timer === 'scheduled' ? 'Scheduled' : group.timer === 'untimed' ? 'Untimed' : 'Self-paced',
      status: submitted ? 'Completed' : 'Scheduled',
      remaining: submitted ? 0 : group.duration * 60,
      progress: submitted ? 100 : 0,
      start: group.start, due: dueTime(group), expires: dueTime(group),
      version: 1, reportMode: 'test', timeSpent: submitted ? Math.min(group.duration, 7 + index % 10) : 0,
      submittedAt: submitted ? dueTime(group) : undefined,
      calculator: calculatorQuestions.length > 0,
      calculatorQuestions,
      durationMinutes: group.timer === 'untimed' ? null : group.duration,
      reportQuestions: questions,
    };
  });
  const releasePolicy = setup.release === 'available' || setup.release === 'group' || setup.release === 'all'
    ? setup.release : setup.release === 'expiry' ? 'custom' : 'manual';

  function updateDraft(patch: Partial<TestSetup>) {
    setEditing(current => current && { ...current, ...patch });
  }

  return <>
    <TestControls key={`${hasSamples}-${revision}`} context={{
      title: task.title, className: item.name, classPath: `/classes/${item.id}/tasks`, teacher: item.teacher,
      backTo: '/prototypes/test-mode-creation', taskQuestions: questions, rows,
      now: hasSamples ? latestDue + 1000 : Math.min(now, earliestStart - 1000),
      releasePolicy, releaseTime: setup.release === 'expiry' ? lastDueTime : undefined,
      toolbar: <>
        <span>{versions.find(version => version.id === setup.version)?.label}</span>
        <div role="group" aria-label="Report scenario" className="tc-status-toggle">
          <button type="button" className={!hasSamples ? 'active' : undefined} aria-pressed={!hasSamples} onClick={() => setParams({}, { replace: true })}>Just assigned</button>
          <button type="button" className={hasSamples ? 'active' : undefined} aria-pressed={hasSamples} onClick={() => setParams({ scenario: 'sample' }, { replace: true })}>Sample submissions</button>
        </div>
      </>,
      actions: setup.version !== 'current' && !hasSamples
        ? <button type="button" onClick={() => setEditing(setup)}><Icon name="edit"/>Edit calculator settings</button>
        : undefined,
    }}/>
    {editing && <CreationDialog kind="drawer" label="Calculator options" onClose={() => setEditing(null)}>
      <header className="tc-create-drawer-header">
        <h2>Calculator options</h2>
        <button type="button" className="tc-create-primary" onClick={() => { onSave(editing); setRevision(value => value + 1); setEditing(null); setShowSaved(true); }}>✓ Apply</button>
        <button className="tc-create-icon" type="button" onClick={() => setEditing(null)} aria-label="Close calculator options">×</button>
      </header>
      <div className="tc-create-drawer-body">
        <p>Choose which questions allow a calculator. This applies to every task group set to Selected.</p>
        {editing.groups.map(group => <section className="tc-create-edit-group" key={group.id}>
          <h3>{group.name}</h3>
          <CalculatorControl value={group.calculator} selected onChange={calculator => updateDraft({ groups: editing.groups.map(value => value.id === group.id ? { ...value, calculator } : value) })}/>
        </section>)}
        <h3>Calculator is on for {editing.questions.filter(question => question.calculator).length} of {questions.length} questions</h3>
        <div className="tc-create-list-actions">
          <button type="button" className="tc-create-soft" onClick={() => updateDraft({ questions: editing.questions.map(question => ({ ...question, calculator: true })) })}>Turn all on</button>
          <button type="button" className="tc-create-outline" onClick={() => updateDraft({ questions: editing.questions.map(question => ({ ...question, calculator: false })) })}>Turn all off</button>
          <button type="button" className="tc-create-text" onClick={() => updateDraft({ questions: setup.questions })}>Reset selection</button>
        </div>
        {editing.questions.map((entry, index) => <div className="tc-create-edit-question" key={entry.key}>
          <span><small>Question {index + 1}</small><strong>{questions[index].equation}</strong></span>
          <button type="button" className="tc-create-outline tc-create-calculator-toggle" aria-label={`Calculator for question ${index + 1}`} aria-pressed={entry.calculator}
            onClick={() => updateDraft({ questions: editing.questions.map(question => question.key === entry.key ? { ...question, calculator: !question.calculator } : question) })}>
            {entry.calculator ? 'On' : 'Off'}
          </button>
        </div>)}
      </div>
    </CreationDialog>}
    {showSaved && <SuccessToast title="Calculator settings updated" onDismiss={() => setShowSaved(false)}/>}
  </>;
}
