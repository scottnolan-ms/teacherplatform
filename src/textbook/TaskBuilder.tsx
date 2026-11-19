import type {Learner, TopicPlan} from './model';
import {shortDate, subtopicSkills} from './model';

export type Draft = {
 id?: string;
 topic: string;
 kind: string;
 students: string[];
 content: string[];
 title?: string;
 due?: string;
};

export type Assignment = Draft & {id: string; title: string; due: string};

interface TaskBuilderProps {
 draft: Draft;
 topics: TopicPlan[];
 learners: Learner[];
 className: string;
 onChange: (draft: Draft) => void;
 onTopic: (topic: TopicPlan) => void;
 onSave: () => void;
 onAssign: (title:string,due:string) => void;
 onCancel: () => void;
}

export function TaskBuilder({draft,topics,learners,className,onChange,onTopic,onSave,onAssign,onCancel}:TaskBuilderProps) {
 const topic=topics.find(t=>t.name===draft.topic);
 const title=draft.title??(topic?`${topic.name} · ${draft.kind.toLowerCase()}`:'');
 const due=draft.due??'';
 const canSave=Boolean(topic&&draft.content.length&&draft.students.length);
 const toggle=(items:string[],value:string,checked:boolean)=>checked?[...new Set([...items,value])]:items.filter(item=>item!==value);

 return <form className="tp-task-builder" onSubmit={e=>{
  e.preventDefault();
  if(canSave&&title.trim()&&due)onAssign(title.trim(),due);
 }}>
  <h2>Build a task</h2>
  <p>{className} · {draft.kind}</p>
  <label>Topic<select aria-label="Topic" value={draft.topic} onChange={e=>{
   const next=topics.find(t=>t.name===e.target.value);
   if(next)onTopic(next);
  }}><option value="" disabled>Choose a topic</option>{topics.map(t=><option key={t.name}>{t.name}</option>)}</select></label>
  <div className="tp-task-fields">
   <label>Task name<input value={title} onChange={e=>onChange({...draft,title:e.target.value})} required/></label>
   <label>Due date<input type="date" value={due} onInput={e=>onChange({...draft,due:e.currentTarget.value})} required/></label>
  </div>
  {topic&&<fieldset><legend>Skills ({draft.content.length} selected)</legend>
   <div className="tp-task-skill-groups">{[...topic.subtopics.map(name=>[name,subtopicSkills(name)] as const),['Prerequisite skills',topic.prerequisites] as const].filter(([,skills])=>skills.length).map(([group,skills])=><div key={group}>
    <strong>{group}</strong>
    {skills.map(skill=><label className="tp-check" key={skill}><input type="checkbox" checked={draft.content.includes(skill)} onChange={e=>onChange({...draft,content:toggle(draft.content,skill,e.target.checked)})}/>{skill}</label>)}
   </div>)}</div>
  </fieldset>}
  <fieldset><legend>Students ({draft.students.length} selected)</legend>
   <div className="tp-draft-students">{learners.map(student=><label className="tp-check" key={student.id}><input type="checkbox" checked={draft.students.includes(student.id)} onChange={e=>onChange({...draft,students:toggle(draft.students,student.id,e.target.checked)})}/>{student.name}</label>)}</div>
  </fieldset>
  <p className="tp-footnote">Assignments are recorded in this browser for the prototype.</p>
  <footer><button type="button" onClick={onCancel}>Cancel</button><button type="button" className="tp-outline" disabled={!canSave} onClick={onSave}>Save draft</button><button className="tp-primary" disabled={!canSave||!title.trim()||!due}>Assign task</button></footer>
 </form>;
}

export function TextbookAssignments({assignments,learners}:{assignments:Assignment[];learners:Learner[]}) {
 if(!assignments.length)return null;
 return <ul className="tp-assigned-tasks">{assignments.map(task=><li key={task.id}>
  <details><summary><strong>{task.title}</strong><span>Due {shortDate(task.due,true)} · {task.students.length} {task.students.length===1?'student':'students'}</span></summary>
   <p>{task.content.join(' · ')}</p>
   <p>{learners.filter(s=>task.students.includes(s.id)).map(s=>s.name).join(', ')}</p>
  </details>
 </li>)}</ul>;
}
