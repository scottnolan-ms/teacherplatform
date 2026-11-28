import { useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../dashboard/Dashboard';
import { calculatorLabels, displayDate, dueTime } from './model';
import type { AssignmentGroup, CalculatorMode } from './model';

export function Switch({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void;
}) {
  return <label className="tc-create-switch">
    <span><strong>{label}</strong>{description && <small>{description}</small>}</span>
    <input type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.target.checked)}/>
  </label>;
}

export function Choice({ name, label, description, checked, onChange }: {
  name: string; label: string; description?: string; checked: boolean; onChange: () => void;
}) {
  return <label className="tc-create-choice">
    <input type="radio" name={name} checked={checked} onChange={onChange}/>
    <span><strong>{label}</strong>{description && <small>{description}</small>}</span>
  </label>;
}

export function CalculatorControl({ value, selected, onChange, children }: {
  value: CalculatorMode; selected: boolean; onChange: (mode: CalculatorMode) => void; children?: ReactNode;
}) {
  const modes: CalculatorMode[] = selected ? ['off', 'selected', 'all'] : ['off', 'all'];
  return <div className="tc-create-calculator">
    <div><strong>Calculator tools</strong><div className="tc-create-segment" role="group" aria-label="Calculator tools">
      {modes.map(mode => <button type="button" key={mode} aria-pressed={value === mode} onClick={() => onChange(mode)}>{calculatorLabels[mode]}</button>)}
    </div></div>
    <small>{value === 'all' ? 'Available on every question.' : value === 'off' ? 'Calculator access is disabled.' : 'Available on the questions you select.'}</small>
    {children}
  </div>;
}

export default function AssignmentSettings({ group, groups, className, roster, perQuestion, onChange, onRemove, onAssignStudent, onSelectAll }: {
  group: AssignmentGroup;
  groups: AssignmentGroup[];
  className: string;
  roster: string[];
  perQuestion: boolean;
  onChange: (patch: Partial<AssignmentGroup>) => void;
  onRemove?: () => void;
  onAssignStudent: (student: string) => void;
  onSelectAll: () => void;
}) {
  const [moving, setMoving] = useState<string | null>(null);
  const scheduled = group.timer === 'scheduled';
  const timed = group.timer !== 'untimed';
  const [savedTimer, setSavedTimer] = useState<Exclude<AssignmentGroup['timer'], 'untimed'>>('when-student-begins');
  const movable = moving && groups.find(other => other.id !== group.id && other.students.includes(moving));
  const available = roster.filter(student => !groups.some(other => other.id !== group.id && other.students.includes(student)));
  return <details className={groups.length > 1 ? 'tc-create-group' : 'tc-create-single-group'} open>
    {groups.length > 1 ? <summary><strong>{group.name || 'Task group'}</strong><span className="tc-create-chip"><Icon name="students"/>{group.students.length} assigned</span></summary> : <summary className="tc-create-sr">Assignment settings</summary>}
    <div className="tc-create-group-fields">
      {groups.length > 1 && <label>Task group name<input value={group.name} onChange={event => onChange({ name: event.target.value })}/></label>}
      <div className="tc-create-setting-title"><h3>Who is this for?</h3><span className="tc-create-chip"><Icon name="students"/>{group.students.length} Assigned</span></div>
      <details className="tc-create-roster">
        <summary><Icon name="students"/><strong>{className}</strong><span>{group.students.length}/{roster.length} selected</span><Icon name="down"/></summary>
        <div>
          <label className="tc-create-roster-student"><input type="checkbox" checked={available.length > 0 && group.students.length === available.length} disabled={!available.length} onChange={onSelectAll}/>Select all available students</label>
          {roster.map(student => {
            const other = groups.find(value => value.id !== group.id && value.students.includes(student));
            return other ? <div className="tc-create-roster-student" key={student}><span>{student}<small> · {other.name}</small></span><button type="button" className="tc-create-text" aria-label={`Move ${student}`} onClick={() => setMoving(student)}>Move</button></div>
              : <label className="tc-create-roster-student" key={student}><input type="checkbox" checked={group.students.includes(student)} onChange={() => onAssignStudent(student)}/>{student}</label>;
          })}
          {moving && movable && <div className="tc-create-info" role="group" aria-label="Confirm student move">
            <p>Move {moving} from {movable.name} to {group.name}?</p>
            <button type="button" className="tc-create-text" onClick={() => setMoving(null)}>Cancel</button>
            <button type="button" className="tc-create-primary" onClick={() => { onAssignStudent(moving); setMoving(null); }}>Move student</button>
          </div>}
        </div>
      </details>
      <h3>When would you like to set the task?</h3>
      <label>Start date &amp; time<input required type="datetime-local" value={group.start} onChange={event => onChange({ start: event.target.value })}/></label>
      <label>Due date &amp; time<input required type="datetime-local" value={dueTime(group)} disabled={scheduled} onChange={event => onChange({ due: event.target.value })}/></label>
      <h3>Are there any time parameters?</h3>
      <Switch label="Set a time limit" description="Students see a countdown while completing the task." checked={timed} onChange={enabled => {
        if (!enabled && group.timer !== 'untimed') setSavedTimer(group.timer);
        onChange({ timer: enabled ? savedTimer : 'untimed' });
      }}/>
      {timed && <>
        <label>Duration (minutes)<input type="number" min="1" max="180" value={group.duration || ''} onChange={event => onChange({ duration: Number(event.target.value) })}/></label>
        <fieldset className="tc-create-choices">
          <legend>Timer starts</legend>
          <Choice name={group.id} label="When student begins" description="Each student gets up to the set duration before the due time." checked={!scheduled} onChange={() => onChange({ timer: 'when-student-begins' })}/>
          <Choice name={group.id} label="At scheduled start time" description="The countdown starts at the scheduled time for everyone in this group." checked={scheduled} onChange={() => onChange({ timer: 'scheduled' })}/>
        </fieldset>
        {scheduled && <p className="tc-create-info">The due date is set by the start time and test duration.</p>}
      </>}
      {perQuestion && groups.length > 1 && <CalculatorControl value={group.calculator} selected onChange={calculator => onChange({ calculator })}/>}
      {onRemove && <button className="tc-create-danger" type="button" onClick={onRemove}>Remove {group.name}</button>}
    </div>
  </details>;
}

export function ScheduleSummary({ group }: { group: AssignmentGroup }) {
  const duration = group.timer === 'untimed' ? 'No time limit' : `${group.duration} minutes · ${group.timer === 'scheduled' ? 'Scheduled start' : 'Timer starts when student begins'}`;
  return <dl className="tc-create-summary">
    <div><dt>Opens</dt><dd>{displayDate(group.start)}</dd></div>
    <div><dt>Due</dt><dd>{displayDate(dueTime(group))}</dd></div>
    <div><dt>Timing</dt><dd>{duration}</dd></div>
  </dl>;
}
