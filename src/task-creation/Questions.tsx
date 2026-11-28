import { useState } from 'react';
import type { ReactNode } from 'react';
import { DifficultyChip } from '../components/DifficultyChip';
import { Icon } from '../dashboard/Dashboard';
import { chapterTopics, difficultyLevels, testQuestions } from './model';
import type { TestQuestion } from './model';

export function Difficulty({ questions }: { questions: TestQuestion[] }) {
  return <div className="tc-create-difficulty" aria-label="Difficulty breakdown">
    {difficultyLevels.map(level => {
      const count = questions.filter(question => question.difficulty === level).length;
      if (!count && questions.length) return null;
      const percent = questions.length ? Math.round(count / questions.length * 100) : 0;
      return <DifficultyChip key={level} level={level} percent={percent} style={{ flexGrow: count }}/>;
    })}
  </div>;
}

export function QuestionCard({ question, number, expanded, onExpand, actions, calculator }: {
  question: TestQuestion;
  number?: number;
  expanded: boolean;
  onExpand: () => void;
  actions?: ReactNode;
  calculator?: ReactNode;
}) {
  const [panel, setPanel] = useState<'solution' | 'try' | null>(null);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  return <article className="tc-create-question">
    <button className="tc-create-question-heading" type="button" onClick={onExpand} aria-expanded={expanded}>
      {number !== undefined && <span className="tc-create-number">{number}</span>}
      <span>Solve the equation<strong>{question.equation}</strong></span>
      <span className="tc-create-chevron"><span className={expanded ? 'tc-create-up' : undefined}><Icon name="down"/></span></span>
    </button>
    {expanded && <div className="tc-create-question-detail">Find the value of <var>x</var>. Show your working.</div>}
    {panel === 'solution' && <div className="tc-create-question-detail"><strong>Solution</strong><p>{question.solution} <var>x</var> = {question.answer}.</p></div>}
    {panel === 'try' && <form className="tc-create-try" onSubmit={event => { event.preventDefault(); setChecked(true); }}>
      <label>Answer for x <input type="number" step="any" required value={answer} onChange={event => { setAnswer(event.target.value); setChecked(false); }}/></label>
      <button className="tc-create-outline">Check</button>
      {checked && <span role="status">{Number(answer) === question.answer ? 'Correct' : 'Try again'}</span>}
    </form>}
    <footer>
      {calculator}
      <DifficultyChip level={question.difficulty}/>
      <span className="tc-create-chip"><Icon name="date"/>{question.minutes} min</span>
      <span className="tc-create-chip">{question.marks} {question.marks === 1 ? 'mark' : 'marks'}</span>
      <div className="tc-create-question-actions">
        <button type="button" className="tc-create-text" aria-expanded={panel === 'try'} onClick={() => setPanel(panel === 'try' ? null : 'try')}><Icon name="edit"/>Try</button>
        <button type="button" className="tc-create-text" aria-expanded={panel === 'solution'} onClick={() => setPanel(panel === 'solution' ? null : 'solution')}><Icon name="complete"/>Solution</button>
        {actions}
      </div>
    </footer>
  </article>;
}

export function QuestionPicker({ future, textbook, selected, count, onAdd, onRemove, onAddAll }: {
  future: boolean;
  textbook: string;
  selected: TestQuestion[];
  count: number;
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
  onAddAll: (ids: number[]) => void;
}) {
  const [chapter, setChapter] = useState(future ? 'Equations' : '');
  const [skill, setSkill] = useState(future ? 'Linear equations' : '');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<'Textbooks' | 'Skills' | 'Search'>('Textbooks');
  const [difficulty, setDifficulty] = useState('');
  const [onlySelected, setOnlySelected] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([]);
  const needle = query.trim().toLowerCase();
  const resultMode = source === 'Search' || onlySelected;
  const results = testQuestions.filter(question =>
    (onlySelected ? selected.some(item => item.id === question.id) :
      source === 'Search' ? [question.topic, question.skill, question.equation, 'linear equations'].some(value => value.toLowerCase().includes(needle)) :
        skill === 'Linear equations' || question.skill === skill) &&
    (!difficulty || question.difficulty === difficulty));
  const title = onlySelected ? 'Selected questions' : source === 'Search' ? 'Search questions' : skill;
  const sources = [['Textbooks', 'book'], ['Skills', 'skills'], ['Search', 'filter']] as const;
  return <>
    <div className="tc-create-stats" aria-live="polite">
      <div><span><strong>{count}</strong> {count === 1 ? 'Question' : 'Questions'}</span><span><strong>{selected.reduce((sum, question) => sum + question.marks, 0)}</strong> Marks</span><span><strong>~{selected.reduce((sum, question) => sum + question.minutes, 0)} min</strong> Time</span></div>
      <div>Difficulty <Difficulty questions={selected}/></div>
    </div>
    <div className={`tc-create-picker ${future ? 'tc-create-clean-picker' : ''}`}>
      {!future && <nav className="tc-create-source" aria-label="Question sources">
        {sources.map(([name, icon]) => <button type="button" key={name} aria-pressed={source === name} onClick={() => { setSource(name); setQuery(''); setOnlySelected(false); setSkill(''); }}><Icon name={icon}/>{name}</button>)}
      </nav>}
      <aside className="tc-create-library">
        <div className="tc-create-cover"><img src="/assets/textbook/cover-ac-year-7.jpg" alt=""/><strong>{textbook}</strong></div>
        <label className="tc-create-search"><Icon name="filter"/><input type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label={source === 'Search' ? 'Search questions' : 'Search textbook'} placeholder={source === 'Search' ? 'Search questions' : 'Search textbook'}/></label>
        {source === 'Textbooks' && <nav aria-label="Textbook chapters">{chapterTopics.filter(topic => !needle || [topic.name, ...topic.subtopics, ...(topic.name === 'Equations' ? ['Linear equations'] : [])].some(value => value.toLowerCase().includes(needle))).map(topic => {
          const open = chapter === topic.name || Boolean(needle);
          const skills = topic.name === 'Equations' ? ['Linear equations', ...topic.subtopics] : topic.subtopics;
          return <div className="tc-create-chapter" key={topic.name}>
            <button type="button" aria-expanded={open} onClick={() => { setChapter(open ? '' : topic.name); setOnlySelected(false); }}><span>{topic.name}</span><Icon name="down"/></button>
            {open && <div>{skills.filter(name => !needle || topic.name.toLowerCase().includes(needle) || name.toLowerCase().includes(needle)).map(name => <button type="button" key={name} aria-current={skill === name && !onlySelected ? 'true' : undefined} onClick={() => { setSkill(name); setOnlySelected(false); }}>{name}</button>)}</div>}
          </div>;
        })}</nav>}
        {source === 'Skills' && <nav className="tc-create-chapter" aria-label="Skills">{chapterTopics[1].subtopics.filter(name => name.toLowerCase().includes(needle)).map(name => <button type="button" key={name} aria-current={skill === name && !onlySelected ? 'true' : undefined} onClick={() => { setSkill(name); setOnlySelected(false); }}>{name}</button>)}</nav>}
      </aside>
      <section className="tc-create-question-list" aria-label="Available questions">
        {future && <div className="tc-create-selected-tabs" aria-label="Question view"><button type="button" aria-pressed={!onlySelected} onClick={() => setOnlySelected(false)}>Question bank</button><button type="button" aria-pressed={onlySelected} onClick={() => setOnlySelected(true)}>Selected ({count})</button></div>}
        {title ? <>
          <h2>{title}</h2>
          <div className="tc-create-list-actions">
            <select aria-label="Difficulty" value={difficulty} onChange={event => setDifficulty(event.target.value)}><option value="">Difficulty</option>{difficultyLevels.map(level => <option key={level}>{level}</option>)}</select>
            <button type="button" className="tc-create-text" disabled={!results.length} onClick={() => setExpanded(results.every(question => expanded.includes(question.id)) ? [] : results.map(question => question.id))}>{results.length > 0 && results.every(question => expanded.includes(question.id)) ? 'Collapse all' : 'Expand all'}</button>
            {!onlySelected && <button type="button" className="tc-create-outline tc-create-list-end" disabled={!results.length || count === 60 || results.every(question => selected.some(item => item.id === question.id))} onClick={() => onAddAll(results.map(question => question.id))}>＋ Add all ({results.length})</button>}
          </div>
          {results.map(question => {
            const copies = selected.filter(item => item.id === question.id).length;
            return <QuestionCard key={question.id} question={question} expanded={expanded.includes(question.id)}
              onExpand={() => setExpanded(values => values.includes(question.id) ? values.filter(id => id !== question.id) : [...values, question.id])}
              actions={<div className="tc-create-count">
                {copies > 0 && <><button type="button" aria-label={`Remove ${question.equation}`} onClick={() => onRemove(question.id)}>−</button><span>{copies}</span></>}
                <button type="button" aria-label={`Add ${question.equation}`} disabled={count === 60} onClick={() => onAdd(question.id)}>+</button>
              </div>}/>;
          })}
          {!results.length && <p className="tc-create-muted">{onlySelected ? 'Choose questions from the question bank.' : 'No sample questions match this selection.'}</p>}
        </> : <div className="tc-create-picker-empty"><img src="/assets/dashboard/book.svg" alt=""/><h2>Choose a textbook subtopic</h2><p>Open Equations to find questions for this test.</p></div>}
        {resultMode && <span className="tc-create-sr" role="status">{results.length} matching questions</span>}
      </section>
    </div>
  </>;
}
