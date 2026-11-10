import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
async function load(file){const source=ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)}
const {activityOrder,activityHidden,timeAway,hasReportFlags}=await load('./report-flags.ts');
const {seed,applyAction,NOW,testDemoRows}=await load('./model.ts');
const {reportAttempt}=await load('./report-data.ts');
assert.deepEqual(activityHidden(false,false),['flags','timeAway']);
assert.deepEqual(activityHidden(true,false),[]);
assert.deepEqual(activityHidden(false,true),[]);
assert.deepEqual(activityHidden(false,false,{flags:true}),['timeAway']);
assert.deepEqual(activityHidden(true,true,{flags:false}),['flags']);
assert.deepEqual(activityOrder(['progress','time','start','due','expires']),['progress','time','flags','timeAway','start','due','expires']);
assert.deepEqual(activityOrder(['progress','time']),['progress','time','flags','timeAway']);
assert.equal(timeAway({}),'—');assert.equal(timeAway({timeAwaySeconds:0}),'0:00');assert.equal(timeAway({timeAwaySeconds:162}),'2:42');
for(const fresh of [true,false]){
 const rows=applyAction(seed,[1],'Reassign',{fresh,group:'Make-up',minutes:40,start:seed[0].start,due:seed[0].due,policy:'custom'},NOW);
 assert.equal(rows.length,seed.length+1);assert.equal(hasReportFlags(rows.at(-1)),true);
 assert.equal(rows.at(-1).flags.at(-1).kind,'reassigned');assert.equal(hasReportFlags(rows[0]),false);
}
assert.ok(testDemoRows('Pending').every(s=>!hasReportFlags(s)));
assert.ok(testDemoRows('Before due date').some(hasReportFlags));
const marked=reportAttempt({...seed[6],progress:100,status:'Completed'},NOW,false);
assert.equal(marked.flags[0].kind,'edited');assert.equal(marked.flags[0].question,'1a');
assert.equal(reportAttempt(marked,NOW,false).flags.length,1);
assert.equal(hasReportFlags(reportAttempt({...seed[6],progress:0},NOW,false)),false);
console.log('Report activity visibility, date ordering, time formatting, reassignment and edited marks passed.');
