import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../dashboard/Dashboard';
import type { DashboardClass, DemoTask } from '../dashboard/model';
import { taskTypes } from '../dashboard/model';
import AssignmentSettings, { CalculatorControl, Choice, Switch } from './AssignmentSettings';
import CreationDialog from './CreationDialog';
import { Difficulty, QuestionCard, QuestionPicker } from './Questions';
import StudentPreview from './StudentPreview';
import { assignmentError, makeTest, newGroup, questionBank, releaseLabels, versions } from './model';
import type { AssignmentGroup, CalculatorMode, CreationVersion, ReleaseRule, SelectedQuestion, TestSetup } from './model';
import './task-creation.css';

const stepLabels = ['Task type', 'Select questions', 'Design your task', 'Assign task'];
const currentOptions = [
  ['Adaptive task', 'Questions adapt to the student’s mastery', 'adaptive'],
  ['Custom task', 'Select questions manually', 'custom'],
  ['Topic readiness check-in', 'Check prerequisite skills before teaching a topic', 'readiness'],
];

export default function TestCreation({ item, version, onClose, onAssign, onOther }: {
  item: DashboardClass; version: CreationVersion; onClose: () => void;
  onAssign: (task: DemoTask) => void; onOther: (taskType: string) => void;
}) {
  const future = version === 'future';
  const perQuestion = version !== 'current';
  const roster = [...new Set(item.students)];
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('Linear equations test');
  const [mode, setMode] = useState<'learning' | 'test'>(future ? 'test' : 'learning');
  const [selected, setSelected] = useState<SelectedQuestion[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [groups, setGroups] = useState(() => [newGroup(1, roster)]);
  const [calculator, setCalculator] = useState<CalculatorMode>('all');
  const [release, setRelease] = useState<ReleaseRule>('manual');
  const [variations, setVariations] = useState(false);
  const [integrity, setIntegrity] = useState(true);
  const [error, setError] = useState('');
  const [studentPreview, setStudentPreview] = useState(false);
  const setup: TestSetup = { version, questions: selected, groups, calculator, release, variations, integrity };
  const questions = selected.map(item => questionBank.get(item.questionId)!);
  const marks = questions.reduce((total, question) => total + question.marks, 0);
  const minutes = questions.reduce((total, question) => total + question.minutes, 0);

  function navigateStep(next: number) {
    setError('');
    setStudentPreview(false);
    setStep(next);
  }

  function addQuestions(ids: number[]) {
    const additions = ids.map(questionId => ({ key: crypto.randomUUID(), questionId, calculator: false }));
    setSelected(current => [...current, ...additions].slice(0, 60));
  }

  function updateGroup(id: string, patch: Partial<AssignmentGroup>) {
    setError('');
    setGroups(current => current.map(group => group.id === id ? { ...group, ...patch } : group));
  }

  function assignStudent(id: string, student: string) {
    setError('');
    setGroups(current => current.map(group => group.id === id && !group.students.includes(student)
      ? { ...group, students: [...group.students, student] }
      : { ...group, students: group.students.filter(name => name !== student) }));
  }

  function updateCalculator(next: CalculatorMode) {
    setCalculator(next);
    setGroups(current => current.map(group => group.calculator === calculator ? { ...group, calculator: next } : group));
  }

  function checkAssignment() {
    const validation = assignmentError(groups);
    setError(validation);
    return !validation;
  }

  function send() {
    if (!checkAssignment()) return;
    const task = makeTest(title, setup, item);
    onAssign(task);
    onClose();
  }

  if (step === 0) return <CreationDialog label="Create a task" kind="drawer" onClose={onClose}>
    <header className="tc-create-drawer-header"><h2>Create a task</h2><button type="button" aria-label="Close task creation" className="tc-create-icon" onClick={onClose}>×</button></header>
    <div className="tc-create-drawer-body">
      <div className="tc-create-class"><Icon name="students"/>{item.name}<span>{`Year ${item.year}`}</span></div>
      {future ? <>
        <h3>What would you like students to do?</h3>
        {taskTypes.map(group => <section className="tc-create-purpose" key={group.purpose}>
          <h4>{group.purpose === 'Summative testing' ? 'Assess understanding' : group.purpose === 'Formative testing' ? 'Check readiness' : group.purpose}</h4>
          <p>{group.description}</p>
          {group.types.map(type => <button type="button" className="tc-create-type" key={type} onClick={() => type === 'Test' ? navigateStep(1) : onOther(type)}>
            <Icon name={type === 'Test' ? 'test' : 'task'}/><strong>{type === 'Test' ? 'Create a test' : type}</strong><Icon name="chevron"/>
          </button>)}
        </section>)}
      </> : <>
        <h3>Interactive questions</h3>
        {currentOptions.map(([name, description, icon]) => <button type="button" className="tc-create-type" key={name} onClick={() => name === 'Custom task' ? navigateStep(1) : onOther(name)}>
          <Icon name={icon}/><span><strong>{name}</strong><small>{description}</small></span>{name === 'Custom task' && <span className="tc-create-chip tc-create-purple">Test mode</span>}
        </button>)}
        <details className="tc-create-other"><summary>Other task types</summary>
          {['Revision task', 'Lesson', 'Worksheet'].map(name => <button type="button" className="tc-create-type" key={name} onClick={() => onOther(name)}><Icon name="task"/><strong>{name}</strong><Icon name="chevron"/></button>)}
        </details>
      </>}
    </div>
  </CreationDialog>;

  const nextLabel = step === 1 ? 'Design your task' : step === 2 ? 'Assign task' : 'Send';
  return <CreationDialog label={studentPreview ? 'Preview as a student' : stepLabels[step]} onClose={studentPreview ? () => setStudentPreview(false) : onClose}>
    <header className={`tc-create-header ${step === 1 ? 'tc-create-picker-header' : ''}`}>
      <button className="tc-create-icon" type="button" aria-label={studentPreview ? 'Back to assignment' : `Back to ${stepLabels[step - 1]}`} onClick={() => studentPreview ? setStudentPreview(false) : navigateStep(step - 1)}>←</button>
      <div><small>{studentPreview ? 'Future concept' : `Step ${step} of 3`}</small><h2>{studentPreview ? 'Preview as a student' : stepLabels[step]}</h2></div>
      {!studentPreview && <button type="button" className="tc-create-primary tc-create-next" disabled={!selected.length || (step === 2 && (!title.trim() || mode !== 'test'))} onClick={() => step < 3 ? navigateStep(step + 1) : send()}>{nextLabel} <span aria-hidden="true">{step === 3 ? '➤' : '→'}</span></button>}
      <button type="button" className="tc-create-icon tc-create-close" aria-label={studentPreview ? 'Close student preview' : 'Close task creation'} onClick={studentPreview ? () => setStudentPreview(false) : onClose}>×</button>
    </header>
    {error && <p className="tc-create-error" role="alert">{error}</p>}
    <div className="tc-create-picker-stage" hidden={step !== 1}><QuestionPicker future={future}
      textbook={item.textbook?.name ?? 'Australian Curriculum Year 7 – v9 2nd Edition'} selected={questions} count={selected.length}
      onAdd={id => addQuestions([id])}
      onRemove={id => setSelected(current => current.filter((_, index) => index !== current.map(question => question.questionId).lastIndexOf(id)))}
      onAddAll={ids => addQuestions(ids.filter(id => !selected.some(question => question.questionId === id)))}/></div>
    {studentPreview ? <StudentPreview title={title} setup={setup}/> : step > 1 && <div className="tc-create-split">
        <section className="tc-create-review" aria-label="Task summary and selected questions" key={step}>
          <h2>{title || 'Untitled task'}</h2>
          <dl className="tc-create-summary">
            <div><dt>Task mode</dt><dd><span className="tc-create-chip tc-create-purple"><Icon name={mode === 'test' ? 'test' : 'custom'}/>{mode === 'test' ? 'Test mode' : 'Learning mode'}</span></dd></div>
            <div><dt>Topics covered</dt><dd>Linear equations</dd></div>
            <div><dt>Difficulty range</dt><dd><Difficulty questions={questions}/></dd></div>
            <div><dt>Total questions</dt><dd>{selected.length} · {marks} {marks === 1 ? 'mark' : 'marks'}</dd></div>
            <div><dt>Estimated time</dt><dd>~{minutes} min</dd></div>
            {mode === 'test' && <div><dt>Task experience</dt><dd className="tc-create-chip-list"><span className="tc-create-chip">Hints off</span><span className="tc-create-chip">{variations ? 'Variations on' : 'Variations off'}</span><span className="tc-create-chip">{calculator === 'selected' ? `Calculator · ${selected.filter(question => question.calculator).length}/${selected.length}` : `Calculator ${calculator}`}</span></dd></div>}
          </dl>
          <div className="tc-create-list-actions"><h3>Questions</h3><button type="button" className="tc-create-text" onClick={() => setExpanded(expanded.length === selected.length ? [] : selected.map(question => question.key))}>{expanded.length === selected.length ? 'Collapse all' : 'Expand all'}</button></div>
          {selected.map((question, index) => <QuestionCard key={question.key} question={questions[index]} number={index + 1}
            expanded={expanded.includes(question.key)} onExpand={() => setExpanded(current => current.includes(question.key) ? current.filter(key => key !== question.key) : [...current, question.key])}
            calculator={mode === 'test' && perQuestion && (calculator === 'selected' || groups.some(group => group.calculator === 'selected')) ? <button type="button" className="tc-create-outline tc-create-calculator-toggle" aria-label={`Calculator for question ${index + 1}`} aria-pressed={question.calculator} onClick={() => setSelected(current => current.map(item => item.key === question.key ? { ...item, calculator: !item.calculator } : item))}>Calculator {question.calculator ? 'on' : 'off'}</button> : undefined}
            actions={step === 2 ? <>
              <button className="tc-create-text" type="button" disabled={index === 0} aria-label={`Move question ${index + 1} up`} onClick={() => setSelected(current => current.map((value, position) => position === index ? current[index - 1] : position === index - 1 ? current[index] : value))}>↑</button>
              <button className="tc-create-text" type="button" disabled={selected.length >= 60} aria-label={`Duplicate question ${index + 1}`} onClick={() => { const duplicate = { ...question, key: crypto.randomUUID() }; setSelected(current => [...current.slice(0, index + 1), duplicate, ...current.slice(index + 1)]); }}>⧉</button>
              <button className="tc-create-danger" type="button" disabled={selected.length === 1} aria-label={`Remove question ${index + 1}`} onClick={() => setSelected(current => current.filter(item => item.key !== question.key))}>Remove</button>
            </> : undefined}/>)}
        </section>
        <aside className="tc-create-settings" key={`settings-${step}`}>
          <h2>{step === 2 ? 'Design task' : 'Assign task'}</h2>
          {step === 2 ? <>
            <label>Task title<small>Give the test a name students will see.</small><input value={title} maxLength={100} onChange={event => setTitle(event.target.value)} required/></label>
            <fieldset className="tc-create-choices"><legend>Select task mode</legend>
              {!future && <Choice name="task-mode" label="Learning mode" description="For learning new skills and practising." checked={mode === 'learning'} onChange={() => setMode('learning')}/>}
              <Choice name="task-mode" label="Test mode" description="Students work independently without hints or step-by-step feedback." checked={mode === 'test'} onChange={() => setMode('test')}/>
            </fieldset>
            {mode === 'learning' ? <p className="tc-create-info">Select Test mode to continue this walkthrough.</p> : <>
              <details className="tc-create-settings-card" open><summary><Icon name="filter"/><strong>Customise student experience</strong><Icon name="down"/></summary>
                <CalculatorControl value={calculator} selected={perQuestion} onChange={updateCalculator}>
                  {calculator === 'selected' && <p className="tc-create-info">{selected.filter(question => question.calculator).length} of {selected.length} questions allow a calculator. Use the calculator buttons in the question list to change this.</p>}
                </CalculatorControl>
                <Switch label="Question variations per student" checked={variations} onChange={setVariations}/>
                <Switch label="Integrity monitoring" checked={integrity} onChange={setIntegrity}/>
              </details>
              <fieldset className="tc-create-choices tc-create-release"><legend>Result sharing preferences</legend>
                <p>When will results be shared with students?</p>
                {(Object.entries(releaseLabels) as [ReleaseRule, string][]).map(([id, label]) => <Choice key={id} name="release" label={label} checked={release === id} onChange={() => setRelease(id)}/>)}
              </fieldset>
            </>}
          </> : <>
            {groups.map(group => <AssignmentSettings key={group.id} group={group} groups={groups} className={item.name} roster={roster} perQuestion={perQuestion}
              onChange={patch => updateGroup(group.id, patch)}
              onAssignStudent={student => assignStudent(group.id, student)}
              onSelectAll={() => {
                const available = roster.filter(student => !groups.some(other => other.id !== group.id && other.students.includes(student)));
                updateGroup(group.id, { students: group.students.length === available.length ? [] : available });
              }}
              onRemove={groups.length > 1 ? () => {
                setError('');
                setGroups(current => current.filter(item => item.id !== group.id));
              } : undefined}/>)}
            <div className="tc-create-add-group"><p>Create different schedules or timing rules for different students.</p><button type="button" className="tc-create-soft" onClick={() => {
              const unassigned = roster.filter(student => !groups.some(group => group.students.includes(student)));
              const next = { ...newGroup(groups.length + 1, unassigned), calculator };
              const usedNames = new Set(groups.map(group => group.name));
              let number = groups.length + 1;
              while (usedNames.has(`Task group ${number}`)) number++;
              setError('');
              setGroups(current => [...current, { ...next, name: `Task group ${number}` }]);
            }}><Icon name="students"/>＋ Task group</button></div>
            {future && <div className="tc-create-add-group"><button type="button" className="tc-create-outline" onClick={() => { if (checkAssignment()) setStudentPreview(true); }}>Preview as a student →</button></div>}
          </>}
        </aside>
      </div>}
  </CreationDialog>;
}

export function TestCreationVersions() {
  return <div className="prototype-page">
    <Link to="/prototypes">← Prototypes</Link>
    <h1>Create a Test Mode task</h1>
    <p>7A Math · Linear equations</p>
    <div className="prototype-list">{versions.map(version => <Link className="prototype-card" key={version.id} to={`/dashboard?createTest=${version.id}`}>
      <div><h2>{version.label}</h2><p>{version.description}</p></div><span>Start walkthrough →</span>
    </Link>)}</div>
  </div>;
}
