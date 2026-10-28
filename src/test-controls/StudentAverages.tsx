import type { Attempt } from './model';
import { customProgress, isTestExtension, questions, response, scorecardResult } from './report-data';
import { DisplayRow } from './TableDisplay';
import { ResultChip } from './ReportViews';

const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const number = (value: number) => Number(value.toFixed(1));

export function AveragesLabel() {
  return <span className="tr-averages-label"><i aria-hidden="true" />Averages</span>;
}

export function StudentAverages({ students, columns, now, progressive }: {
  students: Attempt[]; columns: string[]; now: number; progressive: boolean;
}) {
  const results = students.map(student => scorecardResult(student, now)).filter(result => result.percent !== null);
  const marked = students.filter(student => !student.markingPending);
  const progress = mean(students.map(student => progressive?customProgress(student,now).percent:student.progress));
  const result = mean(results.map(result => result.percent!));
  const time = mean(students.map(student => student.timeSpent ?? (student.progress ? 12 + student.id % 9 : 0)));
  const outcomes = [
    { label: 'Correct', icon: 'a8598', tone: 'correct', matches: ['Correct'] },
    { label: 'Partial', icon: 'ac4f8', tone: 'partial', matches: ['Partial'] },
    { label: 'Incorrect', icon: '03712', tone: 'incorrect', matches: ['Incorrect'] },
    { label: 'Unanswered', icon: '2e82a', tone: 'unanswered', matches: ['Not started', 'In progress'] },
  ];
  return <DisplayRow ids={['identity', ...columns, 'actions']} className="tr-averages">
    <td><AveragesLabel /></td>
    {columns.map(column => <td key={column}>
      {column === 'progress' && progress !== null && `${Math.round(progress)}%`}
      {column === 'results' && result !== null && <ResultChip percent={Math.round(result)} provisional={progressive && results.some(r => r.stage !== 'Closed') || students.some(s=>isTestExtension(s,now))} ongoing={progressive && results.every(r => r.stage === 'Before due date')} />}
      {column === 'marks' && results.length > 0 && `${number(mean(results.map(r => r.earned))!)} / ${number(mean(results.map(r => r.available))!)}`}
      {column === 'questions' && marked.length > 0 && <div className="tr-question-breakdown">{outcomes.map(outcome => {
        const average = mean(marked.map(student => questions.filter(question => outcome.matches.includes(response(student, question).outcome)).length))!;
        return <span key={outcome.tone} className={outcome.tone} title={`${outcome.label}: ${number(average)} on average`}><i aria-hidden="true" style={{ maskImage: `url(/assets/report-details/${outcome.icon}.svg)` }} />{number(average)}</span>;
      })}</div>}
      {column === 'time' && time !== null && `${number(time)}m`}
    </td>)}
    <td />
  </DisplayRow>;
}
