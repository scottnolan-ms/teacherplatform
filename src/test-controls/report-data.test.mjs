import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
async function load(file){const source=ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)}
const {seed,demoRows,NOW,migrateDemoSchedules}=await load('./model.ts');
const {questions,response,studentResult,questionResult,tierMatches,matchesProgress,resultTiers,scorecardResult,reportAttempt,customDemoRows}=await load('./report-data.ts');
assert.equal(questions.length,15);
for(const s of seed){const r=studentResult(s);assert.ok(r.earned<=r.available);assert.equal(r.answered,Math.floor(s.progress/100*15));assert.equal(resultTiers.filter(t=>tierMatches(r.percent,t)).length,1);if(!s.progress){assert.equal(r.percent,null);assert.ok(questions.every(q=>response(s,q).outcome==='Not started'))}}
for(const q of questions){const r=questionResult(seed,q);assert.equal(Object.values(r.counts).reduce((a,b)=>a+b,0),seed.length);assert.equal(r.participation,seed.length-r.counts['Not started']);assert.equal(questionResult([],q).percent,null)}
assert.equal(studentResult({...seed[0],progress:0,version:2}).percent,null);
assert.equal(matchesProgress(25,{condition:'Less than',amount:25}),false);
assert.equal(matchesProgress(25,{condition:'At most',amount:25}),true);
assert.equal(matchesProgress(100,{condition:'Exactly',amount:100}),true);
assert.equal(tierMatches(null,'0–24%'),false);
assert.equal(tierMatches(0,'0–24%'),true);
assert.equal(tierMatches(100,'80–99%'),false);
console.log('Report counts, result bands, fresh attempts and progress boundaries passed.');

const partial={...seed[0],progress:40,status:'Paused'};
const due=new Date(partial.due).getTime();
const before=scorecardResult(partial,due-1);
const after=scorecardResult(partial,due);
assert.equal(before.stage,'Before due date');
assert.equal(after.stage,'After due date');
assert.equal(before.available,6);
assert.equal(after.available,24);
assert.equal(before.earned,after.earned);
assert.equal(after.percent,Math.round(after.earned/24*100));
assert.equal(before.unattempted,9);
assert.equal(scorecardResult({...partial,status:'Completed'},due-1).stage,'Closed');
assert.equal(scorecardResult(partial,due-1,'Closed').available,24);
assert.equal(scorecardResult({...partial,progress:0},due-1).percent,null);
assert.equal(scorecardResult({...partial,progress:0},due).percent,0);
assert.equal(partial.status,'Paused');
console.log('Scorecard date boundary, denominators, completion and previews passed.');

const expiredResults=demoRows('After expiry').map(s=>scorecardResult(s,NOW));
assert.ok(expiredResults.some(r=>r.percent===100));
assert.ok(expiredResults.some(r=>r.percent>=80&&r.percent<100));
assert.ok(expiredResults.some(r=>r.percent>=50&&r.percent<80));
assert.ok(expiredResults.some(r=>r.percent<50));
assert.ok(expiredResults.every(r=>r.stage==='Closed'&&r.available===24));
const pausedExpired={...demoRows()[2],expires:new Date(NOW-1).toISOString()};
assert.equal(scorecardResult(pausedExpired,NOW).stage,'Closed');
console.log('Expired demo has a spread of result tiers and uses final denominators.');

const live=demoRows()[2];
const beforeTest=reportAttempt(live,NOW,false);
assert.equal(beforeTest.markingPending,true);
assert.equal(scorecardResult(beforeTest,NOW).percent,null);
const custom=reportAttempt(live,NOW,true);
assert.ok(scorecardResult(custom,NOW).percent>0);
const atDue=new Date(live.due).getTime();
const dueTest=reportAttempt(live,atDue,false);
assert.equal(dueTest.markingPending,false);
assert.equal(dueTest.markingProgress,live.dueProgress);
const extraWork=reportAttempt({...live,progress:100},atDue+1000,false);
assert.deepEqual(studentResult(extraWork),studentResult(dueTest));
const finalTest=reportAttempt({...live,progress:100},new Date(live.expires).getTime(),false);
assert.equal(finalTest.markingProgress,100);
assert.equal(scorecardResult(finalTest,atDue).available,24);
assert.equal(reportAttempt({...live,status:'Completed'},NOW,false).markingPending,false);
assert.ok(questions.every(q=>response(dueTest,q).outcome!=='In progress'));
assert.ok(customDemoRows(demoRows()).every(s=>s.status!=='Paused'&&s.mode==='Untimed'));
console.log('Separate test milestones, fixed due snapshot, final marking and custom live results passed.');

for(const scenario of ['Before due date','After due date','After expiry','Closed']){
 const rows=demoRows(scenario),a=rows[0],b=rows[7];
 assert.notEqual(a.start,b.start);assert.notEqual(a.due,b.due);
 assert.ok(Date.parse(a.start)<Date.parse(a.due));assert.ok(Date.parse(b.start)<Date.parse(b.due));
}
const customProgressDemo=customDemoRows(demoRows('Before due date')).map(s=>reportAttempt(s,NOW,true));
const cells=customProgressDemo.flatMap(s=>questions.map(q=>response(s,q)));
assert.ok(cells.some(r=>r.retried));
assert.ok(cells.some(r=>r.outcome==='In progress'&&r.completedSubproblems>0&&r.completedSubproblems<r.subproblems));
assert.ok(cells.every(r=>r.completedSubproblems>=0&&r.completedSubproblems<=r.subproblems));
assert.ok(demoRows().map(s=>reportAttempt(s,NOW,false)).every(s=>questions.every(q=>!response(s,q).retried)));
console.log('Distinct group schedules, partial cell progress and custom-only retries passed.');

const oldSchedules=demoRows('Before due date').map(s=>({...s,start:new Date(NOW-48*3600000).toISOString(),due:new Date(NOW+4*3600000).toISOString(),expires:new Date(NOW+28*3600000).toISOString()}));
const migrated=migrateDemoSchedules(oldSchedules,'Before due date');
assert.notEqual(migrated[0].due,migrated[7].due);
assert.deepEqual(migrateDemoSchedules(migrated,'Before due date'),migrated);
const rescheduled={...oldSchedules[7],due:'2026-10-10T12:00:00Z'};
assert.deepEqual(migrateDemoSchedules([rescheduled],'Before due date')[0],rescheduled);
console.log('Demo schedule migration is idempotent and preserves teacher changes.');
