import type {StudentTaskDetail,QuestionDetail} from '../types';
import {prerequisiteSkills} from './readiness-evidence';
// Illustrative responses share the report's marks and completion data.
const items=[
 ['Solve x + 7 = 12.','x = 5','Subtract 7 from both sides.','x = 19'],
 ['Evaluate 6 + 3 × 4.','18','Multiply 3 × 4, then add 6.','36'],
 ['Write an expression for three times a number, plus two.','3x + 2','Multiply the unknown by 3, then add 2.','3(x + 2)'],
 ['Solve 2x + 3 = 11.','x = 4','Subtract 3, then divide both sides by 2.','x = 7'],
 ['Does x = 3 satisfy 4x − 1 = 11?','Yes: 4 × 3 − 1 = 11','Substitute 3 for x and evaluate.','No'],
 ['Write an equation: a number plus 8 equals 14.','x + 8 = 14','Use x for the unknown number.','8x = 14'],
 ['Evaluate 3 × (5 + 2).','21','Evaluate the brackets first, then multiply by 3.','17'],
 ['Fill the blank: 8 + 6 = □ + 5.','9','Both sides must equal 14.','19'],
 ['Solve x ÷ 4 = 6.','x = 24','Multiply both sides by 4.','x = 2'],
 ['Write an expression for five less than a number.','x − 5','Subtract 5 from the unknown.','5 − x'],
 ['Evaluate 24 ÷ 6 + 2.','6','Divide 24 by 6 before adding 2.','3'],
 ['Three identical tickets cost $24. Write an equation for the ticket price p.','3p = 24','Three times the ticket price is 24.','p + 3 = 24'],
 ['Solve 5x = 35.','x = 7','Divide both sides by 5.','x = 30'],
 ['Solve x − 9 = 4.','x = 13','Add 9 to both sides.','x = 5'],
 ['Evaluate 20 − 2 × 6.','8','Multiply 2 × 6 before subtracting.','108'],
];
export type ResponseStatus='Correct'|'Partial'|'Incorrect'|'Unanswered';
export function readinessResponses(s:StudentTaskDetail){
 const correct=Math.floor(s.markCorrect/2),partial=s.markCorrect%2;
 const offset=Array.from(s.studentId).reduce((n,c)=>n+c.charCodeAt(0),0)%items.length;
 return items.map(([prompt,answer,working,wrong],i)=>{
 const order=(i+offset)%items.length,status:ResponseStatus=order>=s.questionsAnswered?'Unanswered':order<correct?'Correct':order<correct+partial?'Partial':'Incorrect';
 const [skill,code,year]=prerequisiteSkills[i%prerequisiteSkills.length];
 return {number:i+1,prompt,answer,working,skill,code,year,status,marks:status==='Correct'?2:status==='Partial'?1:0,response:status==='Correct'?answer:status==='Partial'?working:status==='Incorrect'?wrong:'No response'};
 });
}
export function populateReadinessQuestions(questions:QuestionDetail[],students:StudentTaskDetail[]){
 const responses=students.map(readinessResponses);
 questions.forEach((q,i)=>{const sample=responses[0]?.[i];if(!sample)return;const count=(status:ResponseStatus)=>responses.filter(r=>r[i].status===status).length;
 Object.assign(q,{questionPreview:sample.prompt,grade:`Year ${sample.year}`,correctCount:count('Correct'),partialCount:count('Partial'),incorrectCount:count('Incorrect'),skippedCount:count('Unanswered'),totalAttempts:students.length});
 });
}
