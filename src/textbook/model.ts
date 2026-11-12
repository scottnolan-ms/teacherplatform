import type {DashboardClass} from '../dashboard/model';
import {topics as defaultTopics} from '../dashboard/model';
export type TopicPlan={name:string;state:'Planned'|'Teaching'|'Taught';start:string;end:string;introduced:number;subtopics:string[];prerequisites:string[]};
export type Plan={focus:string;topics:TopicPlan[]};
export type Learner={id:string;name:string};
export type Readiness='Ready'|'Partially ready'|'Not ready'|'Unchecked';
export const levels=['No evidence','Exploring','Emerging','Familiar','Proficient','Mastered'];
const content:Record<string,[string[],string[]]>={
 'Whole numbers':[['Place value','Addition and subtraction','Multiplication','Division','Order of operations'],['Recall multiplication facts','Use place value']],
 'Integers':[['Representing integers','Comparing integers','Adding and subtracting integers','Multiplying and dividing integers'],['Order whole numbers','Use a number line']],
 'Fractions':[['Equivalent fractions','Comparing fractions','Adding and subtracting fractions','Multiplying fractions','Dividing fractions'],['Find common factors','Use multiplication facts']],
 'Decimals and percentages':[['Decimal place value','Comparing decimals','Converting decimals and percentages','Percentage of a quantity','Percentage change'],['Equivalent fractions','Multiply and divide by 100']],
 'Linear equations':[['One-step equations','Two-step equations','Equations with brackets','Unknowns on both sides','Modelling with equations'],['Use inverse operations','Calculate with integers']],
 'Algebraic expressions':[['Writing expressions','Substitution','Collecting like terms','Expanding brackets','Factorising expressions'],['Use order of operations','Multiply integers']],
 'Measurement':[['Length and perimeter','Area of rectangles','Area of triangles','Volume','Converting units'],['Multiply decimals','Convert metric units']],
 'Geometry':[['Angle relationships','Angles in triangles','Angles in polygons','Geometric reasoning'],['Measure angles','Identify shapes']],
 'Statistics':[['Collecting data','Displaying data','Mean and median','Interpreting distributions'],['Read scales','Calculate averages']],
 'Probability':[['Describing chance','Sample spaces','Calculating probabilities','Experimental probability'],['Simplify fractions','List outcomes']],
 'Ratios and rates':[['Writing ratios','Equivalent ratios','Dividing in a ratio','Unit rates'],['Equivalent fractions','Divide whole numbers']],
 'Financial mathematics':[['Money calculations','Best buys','Discounts','Simple interest'],['Find percentages','Calculate with decimals']],
 'Transformations':[['Translations','Reflections','Rotations','Enlargement'],['Plot coordinates','Identify symmetry']],
 'Pythagoras and trigonometry':[['Pythagoras’ theorem','Finding a shorter side','Trigonometric ratios','Finding lengths'],['Calculate square roots','Use ratios']],
 'Linear relationships':[['Coordinates','Gradient','Intercepts','Graphing linear relationships'],['Substitute into expressions','Plot coordinates']],
 'Problem solving':[['Representing a problem','Choosing a strategy','Checking a solution'],['Use order of operations','Interpret mathematical statements']],
};
const DAY=86400000,iso=(ms:number)=>new Date(ms).toISOString().slice(0,10);
// Illustrative plan dates: four days per subtopic, laid end to end so the focus topic's coverage matches the class pace.
function seedDates(topics:TopicPlan[],focusIndex:number,focus:DashboardClass['focus']):TopicPlan[]{
 if(focusIndex<0)return topics;
 const days=(t:TopicPlan)=>t.subtopics.length*4,f=topics[focusIndex];
 const through=Math.max(0,Math.min(.95,(f.introduced+(focus?.pace==='Behind'?.5:focus?.pace==='Ahead'?-1.5:-.5))/Math.max(1,f.subtopics.length)));
 let cursor=Date.parse(DEMO_DATE)-Math.round(through*days(f))*DAY-topics.slice(0,focusIndex).reduce((n,t)=>n+days(t),0)*DAY;
 return topics.map((t,i)=>{const start=cursor;cursor+=days(t)*DAY;return {...t,start:i===focusIndex&&focus?.start||iso(start),end:i===focusIndex&&focus?.end||iso(cursor-DAY)}});
}
export function seedPlan(item:Pick<DashboardClass,'textbook'|'focus'>):Plan{
 const names=[...new Set([...(item.textbook?.topics??defaultTopics),...(item.focus?[item.focus.topic]:[])])];
 const focus=item.focus?.topic??'';const focusIndex=names.indexOf(focus);
 return {focus,topics:seedDates(names.map((name,i)=>{const [subtopics,prerequisites]=content[name]??[[`Representing ${name.toLowerCase()}`,`Working with ${name.toLowerCase()}`,`Applying ${name.toLowerCase()}`],['Use number operations','Interpret mathematical statements']];return {name,subtopics,prerequisites,state:i===focusIndex?'Teaching':i<focusIndex?'Taught':'Planned',start:'',end:'',introduced:i<focusIndex?subtopics.length:i===focusIndex?Math.min(item.focus?.done??0,subtopics.length):0}}),focusIndex,item.focus??null)};
}
function hash(value:string){let h=[...value].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,17);h=Math.imul(h^(h>>>16),0x45d9f3b);return (h^(h>>>16))>>>0}
// Illustrative evidence only. Zero is absence of evidence, never a low mastery level.
export function mastery(classId:string,studentId:string,topic:TopicPlan,index:number,hasHistory=true):number{
 if(!hasHistory)return 0;
 const n=hash(`${classId}/${studentId}/${topic.name}/${index}`);
 const stage=['Whole numbers','Integers'].includes(topic.name)?1:['Fractions','Decimals and percentages','Linear equations','Algebraic expressions'].includes(topic.name)?2:0;
 if(stage===0)return n%9===0?4:0;
 if(n%11===0)return 0;
 return stage===1?3+n%3:1+n%5;
}
export function prerequisiteLevels(classId:string,studentId:string,topic:TopicPlan,hasHistory=true){return topic.prerequisites.map((_,i)=>hasHistory&&hash(`${classId}/${studentId}/${topic.name}/coverage`)%7!==0?hash(`${classId}/${studentId}/prereq/${topic.name}/${i}/evidence`)%6:0)}
export function readiness(values:number[]):Readiness{
 if(!values.length||values.every(v=>v===0))return 'Unchecked';
 if(values.every(v=>v>=4))return 'Ready';
 if(values.some(v=>v>0&&v<3))return 'Not ready';
 return 'Partially ready';
}
export function distribution(values:number[]){return levels.map((_,i)=>values.filter(v=>v===i).length)}
export function pacing(topic:TopicPlan){
 if(!topic.end)return 'No target date';
 return `${topic.introduced} of ${topic.subtopics.length} introduced · target ${new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${topic.end}T12:00:00Z`))}`;
}
const skillNames:Record<string,string[]>={
 'Decimal place value':['Identify the value of a decimal digit','Represent decimals on a number line'],
 'Comparing decimals':['Compare decimals with different place values','Order a set of decimals'],
 'Converting decimals and percentages':['Convert decimals to percentages','Convert percentages to decimals'],
 'Percentage of a quantity':['Find a percentage of a quantity','Use percentages in context'],
 'Percentage change':['Calculate a percentage increase','Calculate a percentage decrease'],
 'Equivalent fractions':['Generate equivalent fractions','Simplify fractions using common factors'],
 'Comparing fractions':['Compare fractions with unlike denominators','Order fractions on a number line'],
 'Adding and subtracting fractions':['Find a common denominator','Add and subtract unlike fractions'],
 'Multiplying fractions':['Multiply proper fractions','Multiply mixed numbers'],
 'Dividing fractions':['Divide by a unit fraction','Divide one fraction by another'],
};
export function subtopicSkills(name:string){return skillNames[name]??[`${name}: foundational skills`,`${name}: application and reasoning`]}
export function skillMastery(classId:string,studentId:string,topic:TopicPlan,subtopicIndex:number,skillIndex:number,hasHistory=true){const level=mastery(classId,studentId,topic,subtopicIndex,hasHistory);return level===0?0:Math.max(1,Math.min(5,level+(hash(`${studentId}/${topic.name}/${subtopicIndex}/${skillIndex}/skill`)%3)-1))}

export function scenarioValue(value:number,key:string,scenario:'current'|'split'|'limited'|'none'){
 const seed=[...key].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
 if(scenario==='none')return 0;
 if(scenario==='limited')return seed%4===0?value:0;
 if(scenario==='split')return seed%11===0?0:seed%2===0?1+seed%2:4+seed%2;
 return value;
}

export const DEMO_DATE='2026-10-23';
export function snapshot(value:number,key:string,date:string){
 if(!value||!date||date<'2026-09-01')return 0;
 const days=Math.max(0,Math.floor((Date.parse(DEMO_DATE)-Date.parse(date))/86400000));
 const seed=[...key].reduce((a,c)=>a+c.charCodeAt(0),0);
 if(days>seed%28+7)return 0;
 return Math.max(1,value-Math.floor(days/(7+seed%7)));
}

// Demo tasks carry no topic, so the topic is inferred from the title: an exact subtopic name wins, otherwise the
// topic sharing the most significant words. Production tasks would carry their own topic reference.
export function taskTopic(title:string,topics:Pick<TopicPlan,'name'|'subtopics'>[]):string|null{
 const text=title.toLowerCase();
 const exact=topics.find(t=>text.includes(t.name.toLowerCase())||t.subtopics.some(s=>text.includes(s.toLowerCase())));
 if(exact)return exact.name;
 const score=(name:string)=>name.toLowerCase().split(/\W+/).filter(w=>w.length>=5&&text.includes(w.slice(0,6))).length;
 const best=topics.map(t=>({name:t.name,score:score(t.name)})).sort((a,b)=>b.score-a.score)[0];
 return best&&best.score>0?best.name:null;
}

export const shortDate=(date:string,year=false)=>new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',...(year?{year:'numeric'}:{}),timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
// Subtopics the plan expects to be introduced by a date, spreading a topic's subtopics evenly across its dates.
export function plannedBy(t:TopicPlan,today=DEMO_DATE){
 const n=t.subtopics.length;
 if(!t.start||!t.end||t.end<=t.start)return t.introduced;
 if(today<t.start)return 0;
 return Math.ceil(Math.min(1,(Date.parse(today)-Date.parse(t.start))/(Date.parse(t.end)-Date.parse(t.start)))*n);
}
export type Pace={status:'No dates'|'Upcoming'|'On track'|'Behind'|'Ahead'|'Complete';delta:number};
export function paceStatus(t:TopicPlan,today=DEMO_DATE):Pace{
 if(t.state==='Taught'||t.subtopics.length>0&&t.introduced>=t.subtopics.length)return {status:'Complete',delta:0};
 if(!t.start||!t.end||t.end<=t.start)return {status:'No dates',delta:0};
 const delta=t.introduced-plannedBy(t,today);
 if(today<t.start&&!delta)return {status:'Upcoming',delta:0};
 return {status:delta<0?'Behind':delta>0?'Ahead':'On track',delta};
}

export const shiftDate=(date:string,days:number)=>new Date(Date.parse(`${date}T12:00:00Z`)+days*86400000).toISOString().slice(0,10);
// Weekdays between two dates, in weeks to the nearest half. Term holidays are not modelled.
export function schoolWeeks(start:string,end:string){
 let days=0;
 for(let d=Date.parse(`${start}T12:00:00Z`);d<=Date.parse(`${end}T12:00:00Z`);d+=86400000){const day=new Date(d).getUTCDay();if(day!==0&&day!==6)days++}
 return Math.max(.5,Math.round(days/5*2)/2);
}
// Illustrative guide length for a topic, from its number of subtopics.
export const guideWeeks=(subtopics:number)=>{const low=Math.max(1,Math.round(subtopics*.6)),high=Math.max(low,Math.round(subtopics*.8));return low===high?`${low}`:`${low} – ${high}`};
