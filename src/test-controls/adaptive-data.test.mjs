import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
async function load(file){const source=ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)}
const {adaptiveRows,adaptiveStages,masteryLevel,masteryEvidence,masteryTone,masterySource,adaptiveProgressState,needsAttention,masteryDrop,progressSegments,adaptiveProgressCopy}=await load('./adaptive-data.ts');
const {questions,response}=await load('./report-data.ts');
assert.deepEqual([null,0,24,25,49,50,74,75,99,100].map(masteryLevel),[0,1,1,2,2,3,3,4,4,5]);
for(const stage of adaptiveStages){for(const s of adaptiveRows(stage)){
 assert.ok(s.required>=0&&s.required<=15);
 assert.ok(s.beforeDue<=s.required);
 assert.ok(s.progress>=0&&s.progress<=100);
 assert.ok(s.answered>=s.required);
 assert.equal(questions.filter(q=>['Correct','Partial','Incorrect'].includes(response(s,q).outcome)).length,s.answered);
 assert.ok(s.mastery===null||s.mastery>=0&&s.mastery<=100);
 assert.equal(s.mastery,s.taskMastery===null?null:s.taskMastery+s.externalGain);
 assert.ok(s.skillCurrent.every((v,i)=>v>=s.skillTask[i]&&s.skillTask[i]>=s.skillStart[i]&&v<=5));
 if(stage==='Before due date')assert.equal(s.beforeDue,s.required);
 if(stage==='After expiry')assert.equal(s.status,'Closed');
 if(!s.answered)assert.equal(s.timeSpent,0);
}}
const early=adaptiveRows('Before due date'),late=adaptiveRows('After due date'),expired=adaptiveRows('After expiry');
for(let i=0;i<early.length;i++){assert.ok(late[i].required>=early[i].required);assert.equal(late[i].mastery,expired[i].mastery);assert.equal(late[i].required,expired[i].required)}
assert.match(masteryEvidence(early[6]),/haven’t started/);
assert.match(masteryEvidence(late[3]),/outside this task/);
assert.match(masteryEvidence(early[7]),/no recorded mastery level/);
assert.match(masteryTone(62,'Before due date'),/ongoing/);
assert.match(masteryTone(62,'After due date'),/mid.*provisional/);
assert.match(masteryTone(62,'After expiry'),/mid.*final/);
console.log('Adaptive mastery boundaries, evidence, response counts, growth and lifecycle consistency passed.');

const edge=adaptiveRows('Before due date','Progress edge cases');
assert.deepEqual(edge.map(adaptiveProgressState),['not-started','started','no-diamonds','revision-only','progress','bonus','complete','progress']);
assert.equal(adaptiveProgressState(adaptiveRows('After expiry','Progress edge cases')[5]),'expired');
assert.deepEqual(adaptiveRows('Before due date','Evidence edge cases').map(masterySource),['mostly','mostly','only','task','task','task','none','task']);
const sample=edge[4];
assert.equal(masterySource({...sample,adaptiveAnswered:2,otherQuestions:4}),'task');
assert.equal(masterySource({...sample,adaptiveAnswered:2,otherQuestions:5}),'mostly');
assert.equal(masterySource({...sample,adaptiveAnswered:3,otherQuestions:5}),'task');
assert.equal(masterySource({...sample,adaptiveAnswered:3,otherQuestions:6}),'mostly');
assert.equal(masterySource({...sample,otherQuestions:null}),'task');
assert.equal(masterySource({...sample,mastery:0}),'task');
assert.ok(adaptiveRows('Before due date','No revision').every(s=>s.revisionAnswered===0&&s.revisionAssigned===0));
assert.deepEqual(adaptiveRows('Before due date','Empty cohort'),[]);
for(const s of edge)assert.equal(questions.filter(q=>['Correct','Partial','Incorrect'].includes(response(s,q).outcome)).length,s.adaptiveAnswered+s.revisionAnswered);
assert.match(masteryTone(100,'Before due date'),/provisional/);
assert.match(masteryTone(100,'Before due date',true),/final/);
console.log('Progress edges, evidence attribution boundaries, legacy fallback and revision fixtures passed.');

assert.equal(needsAttention({baseline:80,mastery:61,baselineStatus:'reliable'}),false);
assert.equal(needsAttention({baseline:80,mastery:60,baselineStatus:'reliable'}),true);
assert.equal(needsAttention({baseline:80,mastery:64,baselineStatus:'reliable'}),false);
assert.equal(needsAttention({baseline:20,mastery:0,baselineStatus:'reliable'}),true);
assert.equal(needsAttention({baseline:null,mastery:0,baselineStatus:'none'}),false);
assert.equal(needsAttention({baseline:80,mastery:null,baselineStatus:'reliable'}),false);
assert.equal(needsAttention({baseline:80,mastery:40,baselineStatus:'limited'}),false);
assert.equal(masteryDrop({baseline:40,mastery:60,baselineStatus:'reliable'}),0);
assert.ok(adaptiveRows('Before due date').some(needsAttention));
console.log('Attention threshold: 20-point drop, zero, missing and unreliable baselines passed.');

const extra=adaptiveRows('Before due date')[1];
assert.equal(adaptiveProgressCopy(extra).label,'15/12');
assert.equal(extra.closedAt,undefined);
assert.ok(adaptiveRows('Before due date')[0].closedAt);
assert.deepEqual(progressSegments(extra,false),{early:80,late:0,extra:20,target:80});
const split=progressSegments({...extra,beforeDue:9},true);
assert.equal(split.early+split.late+split.extra,100);
assert.equal(split.extra,20);
console.log('Extra-work counts, completion and bounded bar segments passed.');
