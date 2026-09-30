import {useEffect,useId,useState} from 'react';
import {createPortal} from 'react-dom';
import type {Attempt} from './model';
export function ProgressDisplay({student:s,now,variant,custom,required,aggregate=false}:{student:Attempt;now:number;variant:'01'|'02';custom:boolean;aggregate?:boolean;required?:{done:number;before:number;total:number}}) {
 const id=useId();const [tip,setTip]=useState<{left:number;top:number}|null>(null);
 useEffect(()=>{const close=()=>setTip(null);window.addEventListener('scroll',close,true);window.addEventListener('resize',close);return()=>{window.removeEventListener('scroll',close,true);window.removeEventListener('resize',close)}},[]);
 const closed=s.status==='Closed'||s.status==='Completed';const p=Math.max(0,Math.min(100,required?Math.round(required.done/required.total*100):s.progress));
 const late=now>=new Date(s.due).getTime()&&(required?required.before<required.done:(s.dueProgress??p)<p);
 const before=late?Math.min(p,required?required.before/required.total*100:s.dueProgress??p):p;
 const notAttempted=closed&&p===0;
 const completed=p===100;
 const label=aggregate?`${p}% Progress`:notAttempted?'Not attempted':completed?new Date(s.closedAt??s.due).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):required?`${required.done} of ${required.total}`:`${p}% ${closed?'Complete':'Progress'}`;
 const total=required?.total??27,done=required?.done??Math.round(total*p/100),early=required?.before??Math.min(done,Math.round(total*before/100));
 const open=(el:HTMLElement)=>{const r=el.getBoundingClientRect();setTip({left:Math.max(8,Math.min(window.innerWidth-248,r.left+r.width/2-120)),top:Math.max(8,r.top-180)})};
 return <><div className={`rp-progress rp-v${variant} ${closed?'is-closed':''} ${late?'is-late':''} ${notAttempted?'not-attempted':''} ${p===0?'is-zero':''}`} tabIndex={0} role="img" aria-label={`${s.name}: ${p}% progress${closed?', closed':''}`} aria-describedby={tip?id:undefined} onMouseEnter={e=>open(e.currentTarget)} onMouseLeave={()=>setTip(null)} onFocus={e=>open(e.currentTarget)} onBlur={()=>setTip(null)} onKeyDown={e=>{if(e.key==='Escape')setTip(null)}}>
 <div className="rp-progress-label">{variant==='01'&&<i style={{maskImage:required?'url(/assets/adaptive/progress-diamond.svg)':aggregate?undefined:`url(/assets/report-controls/${notAttempted?'progress-none':completed?'closed':p===0?'progress-zero':p<25?'progress-10':p<50?'progress-25':p<75?'progress-half':p<90?'progress-75':'progress-90'}.svg)`,...(aggregate?{borderRadius:'50%',background:`conic-gradient(currentColor ${p}%, transparent 0)`,border:'1px solid currentColor',width:14,height:14,flex:'0 0 14px',boxSizing:'border-box' as const}: {})}}/>}<span>{label}</span>{late&&<img src="/assets/report-controls/progress-late.svg" alt="Work during extension"/>}</div>
 <div className="rp-progress-track"><span className="rp-before" style={{width:`${before}%`}}/>{late&&<span className="rp-late" style={{width:`${p-before}%`}}/>}<span className="rp-unfinished" style={{width:`${100-p}%`}}/></div>
 </div>{tip&&createPortal(<div className="rp-progress-tooltip" id={id} role="tooltip" style={{left:tip.left,top:tip.top}}><strong>{aggregate?'Class progress':required?'Required questions':custom?'Subproblems completed':'Test progress'}</strong>{aggregate?<p>Illustrative overall progress for this task.</p>:custom?<><p><i/> {done} of {total}</p>{late&&<><div><span>Before due date</span><b>{early}</b></div><div><span>During extension</span><b>{done-early}</b></div></>}</>:<p>Answers submitted; results appear after marking.</p>}<p>{p}% progress</p>{custom&&!required&&!aggregate&&<small>Illustrative subproblem counts</small>}</div>,document.body)}</>;
}
