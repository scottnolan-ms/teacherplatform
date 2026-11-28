import { useState } from 'react';
import { releaseLabels, questionBank, usesCalculator } from './model';
import type { AssignmentGroup, TestSetup } from './model';
import { ScheduleSummary } from './AssignmentSettings';

export default function StudentPreview({ title, setup }: { title: string; setup: TestSetup }) {
  const [groupId, setGroupId] = useState(setup.groups[0].id);
  const [index, setIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const group: AssignmentGroup = setup.groups.find(item => item.id === groupId) ?? setup.groups[0];
  const selected = setup.questions[index];
  const question = selected && questionBank.get(selected.questionId);
  return <section className="tc-create-student-preview">
    <div className="tc-create-info">Student preview · Your working here stays in this preview.</div>
    <h2>{title}</h2>
    {setup.groups.length > 1 && <label>Preview task group<select value={groupId} onChange={event => { setGroupId(event.target.value); setIndex(-1); }}>{setup.groups.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    {question && selected ? <>
      <div className="tc-create-preview-bar"><strong>Question {index + 1} of {setup.questions.length}</strong><span className="tc-create-chip">{usesCalculator(group, selected) ? 'Calculator available' : 'Calculator off'}</span></div>
      <article className="tc-create-workbook"><p>Solve the equation</p><strong>{question.equation}</strong>
        <label>Show your working<textarea rows={5} value={answers[selected.key] ?? ''} onChange={event => setAnswers(value => ({ ...value, [selected.key]: event.target.value }))}/></label>
      </article>
      <footer><button type="button" className="tc-create-outline" onClick={() => setIndex(index - 1)}>← {index === 0 ? 'Instructions' : 'Previous question'}</button>
        {index + 1 < setup.questions.length && <button type="button" className="tc-create-primary" onClick={() => setIndex(index + 1)}>Next question →</button>}</footer>
    </> : <>
      <p>{setup.questions.length} questions · Test mode</p>
      <ScheduleSummary group={group}/>
      <dl className="tc-create-summary"><div><dt>Results</dt><dd>{releaseLabels[setup.release]}</dd></div><div><dt>Calculator</dt><dd>{setup.questions.filter(question => usesCalculator(group, question)).length} of {setup.questions.length} questions</dd></div></dl>
      <button type="button" className="tc-create-primary" onClick={() => setIndex(0)}>Preview first question →</button>
    </>}
  </section>;
}
