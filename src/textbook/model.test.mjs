import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {test} from 'node:test';
const cache=new Map();
function moduleUrl(file){const url=new URL(file,import.meta.url);if(cache.has(url.href))return cache.get(url.href);let code=ts.transpileModule(fs.readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;code=code.replace(/from ['"]([^'"]+)['"]/g,(_,path)=>`from '${moduleUrl(new URL(path+'.ts',url).href)}'`);const result=`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;cache.set(url.href,result);return result;}
const {taskTopic,seedPlan,refreshFeaturedJourney,subtopicComplete,priorSubtopicSupport,averageLevelsByStudent,mastery,prerequisiteLevels,readiness,distribution,skillMastery,scenarioValue,snapshot}=await import(moduleUrl('./model.ts'));
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

test('tasks are matched to one topic from their title',()=>{
 const topics=seedPlan({focus:{topic:'Decimals and percentages',done:3,total:5,end:''}}).topics;
 assert.equal(taskTopic('Converting decimals to percentages and vice versa',topics),'Decimals and percentages');
 assert.equal(taskTopic('Decimals and percentages practice',topics),'Decimals and percentages');
 assert.equal(taskTopic('Equivalent fractions',topics),'Fractions');
 assert.equal(taskTopic('Linear equations practice',topics),'Linear equations');
 assert.equal(taskTopic('Algebra readiness',topics),'Algebraic expressions');
 assert.equal(taskTopic('End of term quiz',topics),null);
});

test('the featured journey has contiguous coverage in teaching order and gaps in textbook order',()=>{
 const focus={topic:'Decimals and percentages',done:3,total:5,end:''};
 const demo=seedPlan({id:'dash-7a',focus});
 const textbook=seedPlan({focus}).topics.map(({name})=>demo.topics.find(t=>t.name===name));
 const coverage=topics=>topics.slice(0,5).map(t=>t.introduced/t.subtopics.length);
 assert.deepEqual(coverage(demo.topics),[1,1,1,0.6,0]);
 assert.deepEqual(coverage(textbook),[1,1,0,0.6,1]);
});

test('legacy 7A journey data is refreshed while custom sequences stay intact',()=>{
 const focus={topic:'Decimals and percentages',done:3,total:5,end:''};
 const seed=seedPlan({id:'dash-7a',focus});
 const index=[0,1,4,2,3];
 const legacy={...seed,topics:[...index.map((from,to)=>({
  ...seed.topics[from],
  ...Object.fromEntries(['state','introduced','start','end'].map(key=>[key,seed.topics[to][key]])),
 })),...seed.topics.slice(5)]};
 // The older demo had a planned topic before the partially introduced focus.
 Object.assign(legacy.topics[3],{state:'Planned',introduced:0});
 Object.assign(legacy.topics[4],{state:'Teaching',introduced:3});
 assert.deepEqual(refreshFeaturedJourney(legacy,seed),seed);
 const custom={...legacy,topics:legacy.topics.map((t,i)=>i===3?{...t,state:'Teaching',introduced:1}:t)};
 assert.equal(refreshFeaturedJourney(custom,seed),custom);
});

test('completion requires a strict majority of the full class at Familiar or above',()=>{
 assert.equal(subtopicComplete([3,4,1,0]),false);
 assert.equal(subtopicComplete([3,4,5,0]),true);
 assert.equal(subtopicComplete([]),false);
 assert.deepEqual(averageLevelsByStudent([[3,0,0],[5,3,0]],3),[4,3,0]);
});

test('7A evidence follows the illustrated teaching sequence and remains independent of plan edits',()=>{
 const focus={topic:'Decimals and percentages',done:3,total:5,end:''};
 const featured=seedPlan({id:'dash-7a',focus});
 const students=Array.from({length:28},(_,index)=>`dash-7a-${index}`);
 const byTopic=name=>featured.topics.find(entry=>entry.name===name);
 const results=(entry,index)=>students.map(student=>mastery('dash-7a',student,entry,index));
 const topicMean=entry=>{
  const means=averageLevelsByStudent(entry.subtopics.map((_,index)=>results(entry,index)),students.length).filter(Boolean);
  return means.reduce((sum,level)=>sum+level,0)/means.length;
 };
 assert.ok(topicMean(byTopic('Whole numbers'))>=4);
 assert.ok(topicMean(byTopic('Integers'))>=3);
 assert.ok(topicMean(byTopic('Linear equations'))<topicMean(byTopic('Integers')));
 const decimals=byTopic(focus.topic);
 assert.ok(subtopicComplete(results(decimals,0)));
 assert.ok(results(decimals,2).some(level=>level>0&&level<3));
 assert.ok(results(decimals,3).every(level=>level===0));
 const fractions=byTopic('Fractions');
 assert.ok(fractions.subtopics.every((_,index)=>results(fractions,index).every(level=>level===0)));
 assert.ok(students.some(student=>prerequisiteLevels('dash-7a',student,fractions).some(Boolean)));
 assert.deepEqual(results({...fractions,introduced:5,state:'Taught'},0),results(fractions,0));
});

test('support flags low mastery and missing evidence in introduced prior subtopics',()=>{
 const prior={...topic,name:'Prior',state:'Taught',introduced:2,subtopics:['Class completed','Class practising','Not introduced']};
 const focus={...topic, name:'Focus'};
 const upcoming={...prior,name:'Upcoming',state:'Planned',end:''};
 const data=new Map([
  ['Prior',[[3,4,2,0,5],[0,2,0,2,3],[1,1,1,1,1]]],
  ['Focus',[[1,1,1,1,1]]],
  ['Upcoming',[[1,1,1,1,1]]],
 ]);
 const flags=priorSubtopicSupport({focus:'Focus',topics:[prior,focus,upcoming]}, t=>data.get(t.name));
 assert.deepEqual([...flags],[
  [2,[{topic:'Prior',subtopic:'Class completed',mastery:2}]],
  [3,[{topic:'Prior',subtopic:'Class completed',mastery:0},{topic:'Prior',subtopic:'Class practising',mastery:2}]],
  [1,[{topic:'Prior',subtopic:'Class practising',mastery:2}]],
 ]);
 const undatedFocus={...focus,state:'Teaching',end:''};
 assert.deepEqual(priorSubtopicSupport({focus:'',topics:[prior,undatedFocus,upcoming]},t=>data.get(t.name)),flags);
});
