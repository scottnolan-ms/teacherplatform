import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const cache=new Map();
function moduleUrl(file){const url=new URL(file,import.meta.url);if(cache.has(url.href))return cache.get(url.href);let code=ts.transpileModule(fs.readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;code=code.replace(/from ['"]([^'"]+)['"]/g,(_,path)=>`from '${moduleUrl(new URL(path+'.ts',url).href)}'`);const result=`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;cache.set(url.href,result);return result;}
const {initialData}=await import(moduleUrl('../data/seedData.ts'));
const {legacyClasses}=await import(moduleUrl('./class-data.ts'));
const {generateTaskDetailData}=await import(moduleUrl('../data/readiness-report.ts'));
const {generateCurriculumData}=await import(moduleUrl('../data/curriculumData.ts'));
const {readinessView,readinessLevel}=await import(moduleUrl('../components/TaskDetail/readiness-view.ts'));
const {attentionRows,followupStudents,evidenceExplanation}=await import(moduleUrl('../data/readiness-evidence.ts'));
const {readinessResponses}=await import(moduleUrl('../data/readiness-responses.ts'));
const classes=legacyClasses(initialData);
for(const id of ['class-a','class-b']){
 const c=classes.find(c=>c.id===id);
 assert.ok(c);
 assert.equal(c.tasks.length,1,'Superseded legacy tasks should be hidden');
 const task=initialData.tasks.find(t=>t.id===c.tasks[0].id);
 const students=initialData.students.filter(s=>s.classId===id);
 const result=initialData.taskResults.find(r=>r.taskId===task.id);
 const report=generateTaskDetailData(task,students,result,initialData.teacher.name,c.name);
 assert.deepEqual(report,generateTaskDetailData(task,students,result,initialData.teacher.name,c.name),'Reports must stay stable on reopening');
 assert.equal(c.tasks[0].progress,Math.round(report.students.reduce((sum,s)=>sum+s.completionProgress,0)/students.length));
 assert.equal(c.tasks[0].participation,report.students.filter(s=>s.questionsAnswered>0).length);
 for(const student of report.students){
  const responses=readinessResponses(student);
  assert.equal(responses.filter(r=>r.status!=='Unanswered').length,student.questionsAnswered,'Scorecard completion matches table');
  assert.equal(responses.reduce((sum,r)=>sum+r.marks,0),student.markCorrect,'Scorecard marks match table');
  if(student.readiness==='ready'&&student.questionsAnswered===student.totalQuestions) assert.equal(student.latestReadiness,'ready','Improving prerequisite evidence cannot reduce readiness');
 }
 for(const question of report.questions){
  const responses=report.students.map(s=>readinessResponses(s)[question.questionNumber-1]);
  assert.equal(question.correctCount,responses.filter(r=>r.status==='Correct').length);
  assert.equal(question.partialCount,responses.filter(r=>r.status==='Partial').length);
  assert.equal(question.incorrectCount,responses.filter(r=>r.status==='Incorrect').length);
  assert.equal(question.skippedCount,responses.filter(r=>r.status==='Unanswered').length);
 }
 const snapshot=readinessView(report,false,['Prerequisite']);
 const current=readinessView(report,true,[]);
 assert.ok(snapshot.students.some(s=>s.questionsAnswered===0&&readinessLevel(s)==='ready'),'Prior readiness with zero task progress');
 assert.ok(snapshot.students.some(s=>s.resultPercentage>=90&&readinessLevel(s)==='not-ready'),'High task result is independent of readiness');
 assert.ok(snapshot.students.some(s=>s.questionsAnswered===0&&!readinessLevel(s)),'No activity without prior evidence remains unchecked');
 assert.ok(snapshot.skillsData.skills.every(s=>s.skillType==='prerequisite'));
 assert.ok(current.skillsData.skills.some(s=>s.yearLevel===9&&s.skillType==='topic-standard'));
 assert.ok(current.skillsData.skills.length>snapshot.skillsData.skills.length);
 const partial=snapshot.students.find(s=>s.resultPercentage===100&&s.readiness==='partially-ready');
 assert.equal(partial.markCorrect,30);assert.equal(partial.markTotal,30);
 assert.equal(evidenceExplanation(partial).limited,4);
 for(const s of snapshot.students){const e=evidenceExplanation(s);assert.equal(e.limited+e.practice+e.proficient,13,'Prerequisite evidence must exclude current-year skills');}
 assert.ok(snapshot.students.some(s=>s.resultPercentage===60&&s.readiness==='ready'));
 assert.ok(snapshot.students.some(s=>s.resultPercentage===60&&s.readiness==='partially-ready'));
 const attention=attentionRows(snapshot.skillsData),ids=attention.map(s=>s.skillId);
 const followup=followupStudents(attention,ids);
 assert.equal(followup.length,new Set(followup).size,'Follow-up students must be deduplicated');
 assert.deepEqual(followupStudents(attention,[]),[]);
 assert.ok(!followup.includes(snapshot.students[0].studentId),'Ready prior evidence student should not need practice');
 const low=snapshot.students.find(s=>s.resultPercentage===90&&s.readiness==='not-ready');
 assert.ok(snapshot.skillsData.students.find(s=>s.studentId===low.studentId).averageMastery<2);
 assert.ok(current.skillsData.students.find(s=>s.studentId===low.studentId).averageMastery>snapshot.skillsData.students.find(s=>s.studentId===low.studentId).averageMastery);
 assert.deepEqual(snapshot.students.map(s=>s.resultPercentage),current.students.map(s=>s.resultPercentage),'Switching mastery view must not change task results');
 assert.ok(new Set(students.map(s=>s.avatarUrl)).size>10);
 assert.ok(generateCurriculumData(id,students).topics.length>0);
}
const missing={...initialData,taskResults:[]};
assert.ok(legacyClasses(missing).every(c=>c.tasks.length===0),'Tasks without student data must be hidden');
console.log('Recovered reports, stable data, supported tasks, avatars and shared curriculum passed.');
