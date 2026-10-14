import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
async function load(file){const source=ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)}
const {testDemoRows,NOW,seed,applyAction,tickAttempts}=await load('./model.ts');
const {reportAttempt,scorecardResult}=await load('./report-data.ts');
for(const scenario of ['Pending','Before due date','After due date','Closed','Mixed states']){
 const rows=testDemoRows(scenario);
 assert.deepEqual(rows.map(s=>s.name),seed.map(s=>s.name));
 assert.equal(rows.length,12);
 for(const group of ['Group 1','Group 2','Group 3']){
  const members=rows.filter(s=>s.group===group);
  assert.equal(members.length,4);
  for(const key of ['durationMinutes','mode','calculator','penalties'])assert.equal(new Set(members.map(s=>s[key])).size,1,`${scenario}: ${group} has consistent ${key}`);
  assert.ok(members.every(s=>Date.parse(s.start)<Date.parse(s.due)&&Date.parse(s.due)<Date.parse(s.expires)));
 }
 for(const row of rows){
  const marked=reportAttempt(row,NOW,false),result=scorecardResult(marked,NOW);
  const shouldMark=row.status==='Completed'||row.status==='Closed'||NOW>=Date.parse(row.due);
  assert.equal(marked.markingPending,!shouldMark);
  assert.equal(result.percent!==null,shouldMark);
 }
}
const pending=testDemoRows('Pending');
assert.ok(pending.every(s=>s.status==='Scheduled'&&s.progress===0&&s.timeSpent===0&&Date.parse(s.start)>NOW));
assert.equal(pending[0].remaining,2400);assert.equal(pending[4].remaining,2700);assert.equal(pending[8].mode,'Untimed');
const before=testDemoRows('Before due date');
assert.equal(new Set(before.filter(s=>s.progress>0).map(s=>s.group)).size,2);
assert.ok(before.filter(s=>s.group==='Group 2').every(s=>s.status==='Scheduled'&&s.progress===0));
assert.ok(before.filter(s=>s.group==='Group 1'&&s.status==='In progress').every(s=>s.remaining===600&&s.timeSpent===30&&s.progress>=70&&s.progress<100));
assert.ok(before.filter(s=>s.group==='Group 1').every(s=>s.calculator===false&&s.durationMinutes===40));
assert.ok(before.filter(s=>s.group==='Group 2').every(s=>s.durationMinutes===45));
assert.equal(before.filter(s=>s.status==='Completed').length,3);
const active=before[2],due=Date.parse(active.due);
assert.equal(reportAttempt(active,due-1,false).markingPending,true);
assert.equal(reportAttempt(active,due,false).markingPending,false);
assert.equal(reportAttempt(active,due,false).markingProgress,active.progress);
const snapshot=tickAttempts([active],due)[0];
assert.equal(reportAttempt({...snapshot,progress:100,status:'In progress',closedAt:undefined},due+1000,false).markingProgress,active.progress);
const opts={policy:'automatic',due:'2026-09-29T15:00',start:'2026-09-29T09:00',fresh:false,minutes:60,group:'New sitting'};
const paused=applyAction(before,[active.id],'Pause',opts,NOW);
const resumed=applyAction(paused,[active.id],'Resume',opts,NOW+300000);
assert.equal(Date.parse(resumed[2].due)-Date.parse(active.due),300000);
assert.equal(resumed[2].remaining,600);assert.equal(resumed[2].durationMinutes,40);
assert.equal(resumed[3].due,before[3].due);
const restarted=applyAction(before,[active.id],'Restart',opts,NOW);
assert.equal(restarted[2].remaining,2400);assert.equal(restarted[2].durationMinutes,40);
const reassigned=applyAction(before,[3,9],'Reassign',{...opts,minutes:45},NOW).slice(12);
assert.ok(reassigned.every(s=>s.durationMinutes===45&&s.mode==='Scheduled'&&s.calculator===false));
const started=applyAction(pending,[5,6,7,8],'Start now',opts,NOW).filter(s=>s.group==='Group 2');
assert.ok(started.every(s=>Date.parse(s.due)-NOW===45*60000&&s.remaining===2700));
console.log('Three-group duration, calculator, lifecycle, marking boundaries and individual control exceptions passed.');

const absent=before.find(s=>s.name==='Noah Okafor');
assert.equal(absent.status,'Paused');assert.equal(absent.previous,'Scheduled');
assert.equal(absent.progress,0);assert.equal(absent.timeSpent,0);assert.equal(absent.remaining,2400);
assert.equal(reportAttempt(absent,NOW,false).markingPending,true);
const closed=testDemoRows('Closed'),makeup=closed.find(s=>s.id===absent.id),peer=closed.find(s=>s.group===makeup.group&&s.id!==makeup.id);
assert.equal(Date.parse(makeup.due)-Date.parse(peer.due),86400000);
assert.equal(Date.parse(makeup.start)-Date.parse(peer.start),86400000);
assert.equal(makeup.durationMinutes,peer.durationMinutes);assert.equal(makeup.progress,100);
assert.ok(Date.parse(makeup.closedAt)<Date.parse(makeup.due)&&Date.parse(makeup.expires)<NOW);
assert.equal(testDemoRows('After due date').find(s=>s.id===absent.id).status,'Paused');
console.log('Absent student and next-day make-up schedule passed.');

const {isTestExtension}=await load('./report-data.ts');
const extension=testDemoRows('Extension');
for(const raw of extension){
 const s=reportAttempt(raw,NOW,false);
 if(raw.group!=='Group 3'||raw.status==='Completed'){assert.equal(isTestExtension(s,NOW),false);continue;}
 assert.ok(raw.progress>raw.dueProgress);
 assert.equal(isTestExtension(s,NOW),true);
 assert.equal(s.markingProgress,raw.dueProgress);
 assert.equal(isTestExtension(s,Date.parse(raw.due)-1),false);
 assert.equal(isTestExtension({...s,mode:'Scheduled'},NOW),false);
 const final=reportAttempt(raw,Date.parse(raw.expires),false);
 assert.equal(isTestExtension(final,Date.parse(raw.expires)),false);
 assert.equal(final.markingProgress,raw.progress);
 const submitted=reportAttempt({...raw,status:'Completed'},NOW,false);
 assert.equal(submitted.markingProgress,raw.progress);
}
console.log('Extension snapshots, eligibility and expiry finalisation passed.');
