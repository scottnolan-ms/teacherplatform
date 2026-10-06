import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const load=async file=>import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')}`);
const {classActivity}=await load('./class-activity.ts');
const {seedDashboard}=await load('./model.ts');
const now=new Date('2026-10-06T12:00:00');
for(const item of seedDashboard()){
 const week=classActivity(item,'This week',now),month=classActivity(item,'Last 30 days',now);
 assert.deepEqual(week,classActivity(item,'This week',now));
 assert.equal(week.length,item.students.length);
 for(const [i,r] of week.entries()){
  assert.ok(r.completed<=r.assigned);
  assert.ok(r.questions<=month[i].questions);
  assert.ok(r.minutes<=month[i].minutes);
  assert.ok(r.selfLed<=month[i].selfLed);
  assert.ok(r.accuracy===null||r.accuracy>=0&&r.accuracy<=100);
  if(!r.questions){assert.equal(r.completed,0);assert.equal(r.points,0);assert.equal(r.accuracy,null)}
  if(r.lastTaskId)assert.ok(item.tasks.some(t=>t.id===r.lastTaskId));
 }
 if(!item.history&&!item.tasks.length)assert.ok(week.every(r=>!r.questions&&!r.completed&&!r.selfLed));
}
console.log('Stable per-class activity, date aggregation, empty classes and metric consistency passed.');
