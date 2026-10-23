import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {test} from 'node:test';
const cache=new Map();
function moduleUrl(file){const url=new URL(file,import.meta.url);if(cache.has(url.href))return cache.get(url.href);let code=ts.transpileModule(fs.readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;code=code.replace(/from ['"]([^'"]+)['"]/g,(_,path)=>`from '${moduleUrl(new URL(path+'.ts',url).href)}'`);const result=`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;cache.set(url.href,result);return result;}
const {seedPlan,mastery,prerequisiteLevels,readiness,distribution,skillMastery,scenarioValue,snapshot}=await import(moduleUrl('./model.ts'));
const plan=seedPlan({focus:{topic:'Decimals and percentages',done:3,total:5,end:''}});
const topic=plan.topics.find(t=>t.name===plan.focus);
test('teaching edits do not change learning evidence',()=>{
 for(let i=0;i<40;i++)for(let j=0;j<topic.subtopics.length;j++){
  const changed={...topic,state:'Taught',introduced:5,start:'2026-10-01',end:'2026-10-30'};
  assert.equal(mastery('class-a',String(i),topic,j),mastery('class-a',String(i),changed,j));
  assert.deepEqual(prerequisiteLevels('class-a',String(i),topic),prerequisiteLevels('class-a',String(i),changed));
 }
});
test('missing evidence is separate from low mastery and all students remain in distributions',()=>{
 assert.equal(readiness([0,0]),'Unchecked');
 assert.equal(readiness([1,2]),'Not ready');
 assert.equal(readiness([4,5]),'Ready');
 assert.equal(readiness([4,0]),'Partially ready');
 assert.deepEqual(distribution([0,0,1,2,3,4,5]),[2,1,1,1,1,1]);
 assert.equal(distribution([]).reduce((a,b)=>a+b,0),0);
 assert.equal(mastery('class-a','one',topic,0,false),0);
 assert.equal(skillMastery('class-a','one',topic,0,0,false),0);
 assert.deepEqual(prerequisiteLevels('class-a','one',topic,false),[0,0]);
});
test('class plans are independent and focus coverage is bounded',()=>{
 const other=seedPlan({focus:{topic:'Fractions',done:999,total:999,end:''}});
 other.topics.reverse();
 assert.equal(plan.topics[0].name,'Whole numbers');
 const focus=other.topics.find(t=>t.name==='Fractions');
 assert.equal(focus.introduced,focus.subtopics.length);
 assert.equal(seedPlan({focus:null}).focus,'');
});
test('seed evidence covers all readiness states and remains deterministic',()=>{
 const states=new Set();
 for(let i=0;i<100;i++){
  const vals=prerequisiteLevels('class-a',String(i),topic);
  states.add(readiness(vals));
  assert.deepEqual(vals,prerequisiteLevels('class-a',String(i),topic));
 }
 assert.deepEqual([...states].sort(),['Not ready','Partially ready','Ready','Unchecked'].sort());
});

test('distribution scenarios preserve cohort size and separate absent evidence',()=>{
 const values=Array.from({length:28},(_,i)=>i%6);
 for(const scenario of ['current','split','limited','none']){
  const next=values.map((v,i)=>scenarioValue(v,String(i),scenario));
  assert.equal(distribution(next).reduce((a,b)=>a+b,0),28);
  assert.ok(next.every(v=>Number.isInteger(v)&&v>=0&&v<=5));
  if(scenario==='none')assert.ok(next.every(v=>v===0));
  if(scenario==='current')assert.deepEqual(next,values);
 }
});

test('historical snapshots preserve missing evidence and compare consistent dates',()=>{
 assert.equal(snapshot(0,'student:0','2026-10-23'),0);
 assert.equal(snapshot(5,'student:0','2026-08-01'),0);
 for(let level=1;level<=5;level++){
  assert.equal(snapshot(level,'student:0','2026-10-23'),level);
  assert.ok(snapshot(level,'student:0','2026-10-09')<=snapshot(level,'student:0','2026-10-16'));
  assert.ok(snapshot(level,'student:0','2026-10-16')<=level);
 }
});
