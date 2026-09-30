import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
async function load(file){const source=ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)}
const {adaptiveRows,adaptiveStages,masteryLevel,masteryEvidence,masteryTone}=await load('./adaptive-data.ts');
const {questions,response}=await load('./report-data.ts');
assert.deepEqual([null,0,24,25,49,50,74,75,99,100].map(masteryLevel),[0,1,1,2,2,3,3,4,4,5]);
for(const stage of adaptiveStages){for(const s of adaptiveRows(stage)){
 assert.ok(s.required>=0&&s.required<=12);
 assert.ok(s.beforeDue<=s.required);
 assert.ok(s.progress>=0&&s.progress<=100);
 assert.ok(s.answered>=s.required);
 assert.equal(questions.filter(q=>['Correct','Partial','Incorrect'].includes(response(s,q).outcome)).length,s.answered);
 assert.ok(s.mastery===null||s.mastery>=s.baseline);
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
assert.match(masteryEvidence(early[7]),/no recorded activity/);
assert.match(masteryTone(62,'Before due date'),/ongoing/);
assert.match(masteryTone(62,'After due date'),/mid.*provisional/);
assert.match(masteryTone(62,'After expiry'),/mid.*final/);
console.log('Adaptive mastery boundaries, evidence, response counts, growth and lifecycle consistency passed.');
