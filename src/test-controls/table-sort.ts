import type {Attempt} from './model';
import {scorecardResult,questions,response} from './report-data';
export type SortKey='first'|'last'|'status'|'remaining'|'progress'|'results'|'marks'|'questions'|'time'|'group'|'due'|'expires';
export function sortAttempts(rows:Attempt[],key:SortKey,direction:'asc'|'desc',now:number):Attempt[]{
 const value=(s:Attempt):string|number|null=>{switch(key){case 'first':return s.name;case 'last':return s.name.split(' ').slice(-1)[0]+' '+s.name;case 'results':return scorecardResult(s,now).percent;case 'marks':return s.markingPending?null:scorecardResult(s,now).earned;case 'questions':return s.markingPending?null:questions.filter(q=>response(s,q).outcome==='Correct').length;case 'remaining':return s.mode==='Untimed'||s.status==='Closed'||s.status==='Completed'?null:s.remaining;case 'time':return s.timeSpent??0;case 'due':return Date.parse(s.due);case 'expires':return s.expires?Date.parse(s.expires):null;default:return s[key]}}
 return [...rows].sort((a,b)=>{const av=value(a),bv=value(b);if(av===null)return bv===null?0:1;if(bv===null)return -1;const c=typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:'base'});return (direction==='asc'?c:-c)||a.id-b.id});
}
