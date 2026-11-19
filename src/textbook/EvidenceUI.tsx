import {useEffect,useId,useRef,useState} from 'react';
import {AnchoredTooltip} from '../test-controls/AnchoredTooltip';
import {distribution,levels,masteryScore} from './model';
import type {PageRange} from './model';
import {useEvidenceOptions} from './distribution-options';
const highestFirst=[5,4,3,2,1,0];
const descriptions=['Results are unavailable for this level.','Understanding is developing; success is not yet consistent.','Some understanding is established, with substantial practice still needed.','Working understanding is established; more practice supports consistency.','Strong understanding is established across most questions.','Understanding is well established across the skill or subtopic.'];
export function ProgressIcon({value,skill=false}:{value:number;skill?:boolean}){
 const {mastery}=useEvidenceOptions();
 const directory='/assets/textbook-mastery';
 if(skill)return <img className="tp-progress-icon" src={`${directory}/skill-${value}.svg`} alt=""/>;
 if(value===5&&mastery==='01')return <img className="tp-progress-icon" src={`${directory}/subtopic-mastered-purple.svg`} alt=""/>;
 const asset=mastery==='04'&&value===4?'subtopic-proficient-option-04':mastery==='04'&&value===5?'subtopic-mastered-option-04':`subtopic-icon-${value}`;
 return <i className="tp-progress-icon tp-mastery-icon" aria-hidden="true" style={{maskImage:`url(${directory}/${asset}.svg)`}}/>;
}

export function Distribution({values,subject,skill=false,muted=false}:{values:number[];subject:string;skill?:boolean;muted?:boolean}){
 const title=`${skill?'Proficiency':'Mastery'} distribution for ${subject}`;
 const {layout:requestedLayout,mastery,hideCounts}=useEvidenceOptions();const layout=requestedLayout==='dots'&&values.length>60?'symbols':requestedLayout;const counts=distribution(values);const id=useId();
 const [tip,setTip]=useState<{anchor:DOMRect;level:number|null}|null>(null);
 useEffect(()=>{const hide=()=>setTip(null);window.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);return()=>{window.removeEventListener('scroll',hide,true);window.removeEventListener('resize',hide)}},[]);
 const reveal=(el:HTMLElement,level:number|null)=>setTip({anchor:el.getBoundingClientRect(),level});
 const tipProps=(level:number|null)=>({tabIndex:0,'aria-describedby':tip?.level===level?id:undefined,onFocus:(e:React.FocusEvent<HTMLElement>)=>reveal(e.currentTarget,level),onMouseEnter:(e:React.MouseEvent<HTMLElement>)=>reveal(e.currentTarget,level),onMouseLeave:()=>setTip(null),onBlur:()=>setTip(null),onKeyDown:(e:React.KeyboardEvent<HTMLElement>)=>{if(e.key==='Escape'){e.stopPropagation();setTip(null)}},onClick:(e:React.MouseEvent<HTMLElement>)=>reveal(e.currentTarget,level)});
 const label=(i:number)=>`${levels[i]}: ${counts[i]} of ${values.length} students (${values.length?Math.round(counts[i]/values.length*100):0}%)`;
 if(!values.length)return <span className="tp-muted">No students in this class</span>;
 return <div className={`tp-distribution tp-dist-${layout} ${skill?'tp-proficiency-scale':'tp-mastery-scale'}`}>
  {requestedLayout==='dots'&&values.length>60&&<small>Large cohort: showing a scalable bar instead of individual dots.</small>}
  {layout==='symbols'?<><div className="tp-bar tp-symbol-bar" role="group" aria-label={title}>{highestFirst.map(i=>counts[i]>0&&<button type="button" key={i} className={`tp-segment-${i}`} style={{flex:counts[i]}} aria-label={label(i)} {...tipProps(i)}><span><ProgressIcon value={i} skill={skill}/>{!hideCounts&&<b>{counts[i]}</b>}</span></button>)}</div></>:layout==='stacked'?<><div className="tp-bar tp-bar-labelled" role="group" aria-label={title}>{counts.map((n,i)=>n>0&&<button type="button" key={i} className={`tp-segment-${i}`} style={{flex:n}} aria-label={label(i)} {...tipProps(i)}>{!hideCounts&&n>=3?n:''}</button>)}</div></>:layout==='counts'?<div className="tp-count-grid" role="group" aria-label={title}>{counts.map((n,i)=><button type="button" key={i} className={`tp-count-cell ${n?'':'tp-count-zero'}`} aria-label={label(i)} {...tipProps(i)}><span className={`tp-count-marker tp-segment-${i}`}><ProgressIcon value={i} skill={skill}/></span><strong>{n}</strong><span>{levels[i]}</span></button>)}</div>:<><div className="tp-dot-groups" role="group" aria-label={title}>{counts.map((n,i)=>n>0&&<button type="button" key={i} aria-label={label(i)} {...tipProps(i)}><span className="tp-dot-pack">{Array.from({length:n},(_,j)=><i key={j} className={`tp-segment-${i}`}/>)}</span><span>{n} {levels[i]}</span></button>)}</div><small>Each dot is one student · {values.length} students</small></>}
  {tip&&<AnchoredTooltip id={id} className="tp-mastery-tooltip" anchor={tip.anchor}><strong>{title}</strong>{tip.level!==null&&<><h4>{levels[tip.level]}{tip.level>0?` · level ${tip.level} of 5`:''}</h4><p>{descriptions[tip.level]}</p><b>{label(tip.level)}</b></>}<div className={`tp-tooltip-breakdown ${skill?'tp-proficiency-scale':'tp-mastery-scale'} ${muted?'tp-subtopic-muted':''}`} data-mastery-palette={skill?undefined:mastery}>{highestFirst.map(i=><div key={i} data-level={i} className={tip.level===i?'tp-breakdown-current':undefined} aria-current={tip.level===i?true:undefined}><span className="tp-breakdown-icon"><ProgressIcon value={i} skill={skill}/></span><span>{levels[i]}</span><b>{counts[i]}</b><span>{Math.round(counts[i]/values.length*100)}%</span></div>)}</div><small>All {values.length} students are included. Percentages may round.</small></AnchoredTooltip>}
 </div>
}

const pad=(n:number)=>String(n).padStart(2,'0');
// A small label with a tooltip on hover or focus; used for textbook numbering and mastery scores.
function useTip(){const id=useId();const [anchor,setAnchor]=useState<DOMRect|null>(null);
 useEffect(()=>{if(!anchor)return;const hide=()=>setAnchor(null);window.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);return()=>{window.removeEventListener('scroll',hide,true);window.removeEventListener('resize',hide)}},[anchor]);
 const show=(e:{currentTarget:HTMLElement})=>setAnchor(e.currentTarget.getBoundingClientRect());
 return {id,anchor,props:{tabIndex:0,'aria-describedby':anchor?id:undefined,onMouseEnter:show,onFocus:show,onMouseLeave:()=>setAnchor(null),onBlur:()=>setAnchor(null),onKeyDown:(e:React.KeyboardEvent)=>{if(e.key==='Escape')setAnchor(null)}}};
}
// "Topic 4" or "4.02": the place in the textbook, with print page numbers in the tooltip.
export function TopicChip({label,pages}:{label:string;pages?:PageRange}){
 const tip=useTip();
 return <><span className="tp-topic-chip" data-row-tooltip={pages?true:undefined} {...(pages?tip.props:{})}>{label}</span>{pages&&tip.anchor&&<AnchoredTooltip id={tip.id} className="tp-mastery-tooltip tp-page-tooltip" anchor={tip.anchor}><strong>{label}</strong><p>Pages {pages.start}–{pages.end} in the print textbook</p></AnchoredTooltip>}</>;
}
// Eyebrow above a topic name: its place in the class sequence (when one exists), then its textbook topic number.
export function TopicEyebrow({seq,number,pages,focus=false}:{seq?:number;number:number;pages?:PageRange;focus?:boolean}){
 return <span className="tp-topic-eyebrow">{seq!==undefined&&<><span className="tp-seq" title="Position in your scope and sequence">Seq. {pad(seq)}</span><span aria-hidden="true">•</span></>}<TopicChip label={`Topic ${number}`} pages={pages}/>{focus&&<span className="tp-in-focus">In focus</span>}</span>;
}
const scoreCopy=[['',''],['is exploring this','Not yet succeeding consistently, even on the easier questions.'],['is emerging in this','Succeeding mainly on the easier questions.'],['is familiar with this','Succeeding on the core questions.'],['is proficient in this','Strong understanding, not yet succeeding on the hardest questions.'],['has mastered this','Succeeding consistently, including on the hardest questions.']];
export function AverageMastery({values,skill=false,noun,individual=false,small=false}:{values:number[];skill?:boolean;noun?:string;individual?:boolean;small?:boolean}){
 const tip=useTip();
 const known=values.filter(v=>v>0);const mean=known.length?known.reduce((a,b)=>a+b,0)/known.length:0;
 // Illustrative ordinal mean; retain the lower tier until the next whole level is reached.
 const tier=Math.floor(mean),score=masteryScore(mean),what=noun??(skill?'skill':'subtopic'),measure=skill?'Proficiency':'Mastery';
 return <div className="tp-average"><span className={`tp-${skill?'skill':'subtopic'}-chip tp-tier-${tier}${small?' tp-mastery-chip-small':''}`} aria-label={known.length?`${levels[tier]}, ${measure.toLowerCase()} score ${score} out of 100`:'No evidence'} {...tip.props}><ProgressIcon value={tier} skill={skill}/>{levels[tier]}{known.length>0&&<b>{score}</b>}</span>
  {tip.anchor&&<AnchoredTooltip id={tip.id} className="tp-mastery-tooltip tp-score-tooltip" anchor={tip.anchor}>{known.length?<><strong>{individual?'This student':'The class'} {scoreCopy[tier][0]} {what}.</strong><p>{scoreCopy[tier][1]}</p><div className="tp-score-row"><span>{measure} score</span><b>{score} <i>/ 100</i></b></div>{!individual&&<small>Average across students with available results.</small>}</>:<><strong>No evidence yet</strong><p>{measure} will appear when results are available.</p></>}</AnchoredTooltip>}
 </div>
}

export function ProgressKey({scope='both'}:{scope?:'both'|'mastery'|'skill'}){
 const dialog=useRef<HTMLDialogElement>(null);
 const id=useId();
 const title=scope==='both'?'Mastery & proficiency':scope==='skill'?'Skill proficiency':'Mastery';
 return <>
  <button type="button" className="tp-key-chip" aria-haspopup="dialog" onClick={()=>dialog.current?.showModal()}>
   <span>{title}</span><i aria-hidden="true">i</i>
  </button>
  <dialog ref={dialog} className="tp-dialog tp-key-dialog" aria-labelledby={id} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}}>
   <div className="tp-dialog-body">
    <button type="button" className="tp-dialog-close" aria-label="Close progress key" onClick={()=>dialog.current?.close()}>×</button>
    <h2 id={id}>Understanding {title.toLowerCase()}</h2>
    <p>{scope==='both'?'Mastery describes understanding across a subtopic. Proficiency describes understanding of an individual skill.':scope==='skill'?'Proficiency describes understanding of an individual skill.':'Mastery describes understanding across a subtopic.'}</p>
    {(scope==='both'?['mastery','skill']:[scope]).map((scale,index)=><details key={scale} open={index===0} className={scale==='skill'?'tp-proficiency-scale':'tp-mastery-scale'}>
     <summary><span className="tp-key-disclosure" aria-hidden="true"/>{scale==='skill'?'Skill proficiency levels':'Subtopic mastery levels'}</summary>
     <ul>{highestFirst.map(level=><li key={level}>
      <ProgressIcon value={level} skill={scale==='skill'}/>
      <div><strong>{levels[level]}</strong><p>{level===0?'There are no results available yet.':descriptions[level]}</p></div>
     </li>)}</ul>
    </details>)}
   </div>
  </dialog>
 </>;
}
