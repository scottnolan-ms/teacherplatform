import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
async function load(file){const source=ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)}
const {seed,demoRows,NOW}=await load('./model.ts');
const {questions,response,studentResult,questionResult,tierMatches,matchesProgress,resultTiers,scorecardResult}=await load('./report-data.ts');
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
