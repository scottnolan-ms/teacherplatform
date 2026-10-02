import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const cache=new Map();
function moduleUrl(file){const url=new URL(file,import.meta.url);if(cache.has(url.href))return cache.get(url.href);let code=ts.transpileModule(fs.readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;code=code.replace(/from ['"]([^'"]+)['"]/g,(_,path)=>`from '${moduleUrl(new URL(path+'.ts',url).href)}'`);const result=`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;cache.set(url.href,result);return result;}
const {progressiveClass,progressiveStudentStatus,progressiveActivity}=await import(moduleUrl('./progressive-class.ts'));
for(const stage of ['Before due date','After due date','After expiry']){
 const c=progressiveClass(stage);
 const {adaptiveRows}=await import(moduleUrl('../test-controls/adaptive-data.ts'));
 const {demoRows}=await import(moduleUrl('../test-controls/model.ts'));
 const {customDemoRows}=await import(moduleUrl('../test-controls/report-data.ts'));
 const custom=customDemoRows(demoRows(stage)),adaptive=adaptiveRows(stage);
 assert.equal(c.tasks[0].progress,Math.round(custom.reduce((sum,row)=>sum+row.progress,0)/custom.length));
 assert.equal(c.tasks[1].progress,Math.round(adaptive.reduce((sum,row)=>sum+row.required/12*100,0)/adaptive.length));assert.equal(c.tasks.length,2);assert.equal(c.students.length,13);assert.equal(new Set(c.students).size,13);assert.ok(c.students.includes('Lily Chen'));assert.ok(c.students.includes('Amelia Chen'));
 assert.equal(c.tasks[0].assignedCount,12);assert.equal(c.tasks[1].assignedCount,8);
 for(const task of c.tasks){assert.ok(task.participation<=task.assignedCount);assert.equal(task.completed,stage==='After expiry');assert.ok(task.progress>=0&&task.progress<=100)}
 assert.equal(progressiveStudentStatus('linear-equations-custom','Lily Chen',stage),'Not assigned');assert.equal(progressiveStudentStatus('linear-equations-adaptive','Amelia Chen',stage),'Not assigned');assert.equal(progressiveStudentStatus('linear-equations-adaptive','Emma Johnson',stage),'Completed');
 for(const name of c.students){const a=progressiveActivity(name,stage);assert.ok(a.accuracy===null||a.accuracy>=0&&a.accuracy<=100);assert.ok(a.questions>=0)}
}
console.log('Class roster, task membership, lifecycle and activity checks passed.');
