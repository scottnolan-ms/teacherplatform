import {useEffect,useId,useState} from 'react';
import {AnchoredTooltip} from '../test-controls/AnchoredTooltip';
import {distribution,levels,masteryScore} from './model';
import type {PageRange} from './model';
import {useEvidenceOptions} from './distribution-options';
const descriptions=['There is not enough evidence to estimate mastery. This does not mean low ability.','Understanding is developing; success is not yet consistent.','Some understanding is established, with substantial practice still needed.','Working understanding is established; more practice supports consistency.','Strong understanding is established across most questions.','Understanding is well established across the skill or subtopic.'];
export function Level({value,compact=false}:{value:number;compact?:boolean}){return <span className={`tp-level tp-level-${value} ${compact?'tp-level-compact':''}`} title={`${levels[value]}${value?` · level ${value} of 5`:''}. ${descriptions[value]}`}><b>{value===0?'—':value===5?'★':value}</b><span className={compact?'tp-sr-only':''}>{levels[value]}</span></span>}
export function Distribution({values,subject='Mastery distribution'}:{values:number[];subject?:string}){
 const {layout:requestedLayout}=useEvidenceOptions();const layout=requestedLayout==='dots'&&values.length>60?'symbols':requestedLayout;const counts=distribution(values);const id=useId();
 const [tip,setTip]=useState<{anchor:DOMRect;level:number|null}|null>(null);
 useEffect(()=>{const hide=()=>setTip(null);window.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);return()=>{window.removeEventListener('scroll',hide,true);window.removeEventListener('resize',hide)}},[]);
 const reveal=(el:HTMLElement,level:number|null)=>setTip({anchor:el.getBoundingClientRect(),level});
 const tipProps=(level:number|null)=>({tabIndex:0,'aria-describedby':tip?.level===level?id:undefined,onFocus:(e:React.FocusEvent<HTMLElement>)=>reveal(e.currentTarget,level),onMouseEnter:(e:React.MouseEvent<HTMLElement>)=>reveal(e.currentTarget,level),onMouseLeave:()=>setTip(null),onBlur:()=>setTip(null),onKeyDown:(e:React.KeyboardEvent<HTMLElement>)=>{if(e.key==='Escape'){e.stopPropagation();setTip(null)}},onClick:(e:React.MouseEvent<HTMLElement>)=>reveal(e.currentTarget,level)});
 const label=(i:number)=>`${levels[i]}: ${counts[i]} of ${values.length} students (${values.length?Math.round(counts[i]/values.length*100):0}%)`;
 if(!values.length)return <span className="tp-muted">No students in this class</span>;
 return <div className={`tp-distribution tp-dist-${layout}`}>
  {requestedLayout==='dots'&&values.length>60&&<small>Large cohort: showing a scalable bar instead of individual dots.</small>}
  {layout==='symbols'?<><div className="tp-bar tp-symbol-bar" aria-label={subject}>{[5,4,3,2,1,0].map(i=>counts[i]>0&&<button type="button" key={i} className={`tp-segment-${i}`} style={{flex:counts[i]}} aria-label={label(i)} {...tipProps(i)}><span><img src={`/assets/textbook-mastery/skill-${i}.svg`} alt=""/><b>{counts[i]}</b></span></button>)}</div><small>{counts[4]+counts[5]} of {values.length} proficient or mastered · {counts[0]} no evidence</small></>:layout==='stacked'?<><div className="tp-bar tp-bar-labelled" aria-label={subject}>{counts.map((n,i)=>n>0&&<button type="button" key={i} className={`tp-segment-${i}`} style={{flex:n}} aria-label={label(i)} {...tipProps(i)}>{n>=3?n:''}</button>)}</div><small>{counts[4]+counts[5]} of {values.length} proficient or mastered · {counts[0]} no evidence</small></>:layout==='counts'?<div className="tp-count-grid" aria-label={subject}>{counts.map((n,i)=><button type="button" key={i} className={`tp-count-cell ${n?'':'tp-count-zero'}`} aria-label={label(i)} {...tipProps(i)}><span className={`tp-count-marker tp-segment-${i}`}>{i===0?'—':i===5?'★':i}</span><strong>{n}</strong><span>{levels[i]}</span></button>)}</div>:<><div className="tp-dot-groups" aria-label={subject}>{counts.map((n,i)=>n>0&&<button type="button" key={i} aria-label={label(i)} {...tipProps(i)}><span className="tp-dot-pack">{Array.from({length:n},(_,j)=><i key={j} className={`tp-segment-${i}`}/>)}</span><span>{n} {levels[i]}</span></button>)}</div><small>Each dot is one student · {values.length} students</small></>}
  {tip&&<AnchoredTooltip id={id} className="tp-mastery-tooltip" anchor={tip.anchor}><strong>{subject}</strong>{tip.level!==null&&<><h4>{levels[tip.level]}{tip.level>0?` · level ${tip.level} of 5`:''}</h4><p>{descriptions[tip.level]}</p><b>{label(tip.level)}</b></>}<div className="tp-tooltip-breakdown">{counts.map((n,i)=><div key={i}><img src={`/assets/textbook-mastery/skill-${i}.svg`} alt=""/><span>{levels[i]}</span><b>{n}</b><span>{Math.round(n/values.length*100)}%</span></div>)}</div><small>All {values.length} students are included. Percentages may round.</small></AnchoredTooltip>}
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
 return <><span className="tp-topic-chip" {...(pages?tip.props:{})}>{label}</span>{pages&&tip.anchor&&<AnchoredTooltip id={tip.id} className="tp-mastery-tooltip tp-page-tooltip" anchor={tip.anchor}><strong>{label}</strong><p>Pages {pages.start}–{pages.end} in the print textbook</p></AnchoredTooltip>}</>;
}
// Eyebrow above a topic name: its place in the class sequence (when one exists), then its textbook topic number.
export function TopicEyebrow({seq,number,pages}:{seq?:number;number:number;pages?:PageRange}){
 return <span className="tp-topic-eyebrow">{seq!==undefined&&<><span className="tp-seq" title="Position in your scope and sequence">Seq. {pad(seq)}</span><span aria-hidden="true">•</span></>}<TopicChip label={`Topic ${number}`} pages={pages}/></span>;
}
const scoreCopy=[['',''],['is exploring this','Not yet succeeding consistently, even on the easier questions.'],['is emerging in this','Succeeding mainly on the easier questions.'],['is familiar with this','Succeeding on the core questions.'],['is proficient in this','Strong understanding, not yet succeeding on the hardest questions.'],['has mastered this','Succeeding consistently, including on the hardest questions.']];
export function AverageMastery({values,skill=false,noun}:{values:number[];skill?:boolean;noun?:string}){
 const tip=useTip();
 const known=values.filter(v=>v>0);const mean=known.length?known.reduce((a,b)=>a+b,0)/known.length:0;
 // Illustrative ordinal mean; retain the lower tier until the next whole level is reached.
 const tier=Math.floor(mean),score=masteryScore(mean),what=noun??(skill?'skill':'subtopic');
 return <div className="tp-average"><span className={skill?`tp-skill-chip tp-tier-${tier}`:`tp-subtopic-chip tp-tier-${tier}`} aria-label={known.length?`${levels[tier]}, mastery score ${score} out of 100`:'No evidence'} {...tip.props}>{skill?<img src={`/assets/textbook-mastery/skill-${tier}.svg`} alt=""/>:<i aria-hidden="true" style={{maskImage:`url(/assets/textbook-mastery/subtopic-icon-${tier}.svg)`}}/>}{levels[tier]}{known.length>0&&<b>{score}</b>}</span><small>{known.length} of {values.length} with evidence</small>
  {tip.anchor&&<AnchoredTooltip id={tip.id} className="tp-mastery-tooltip tp-score-tooltip" anchor={tip.anchor}>{known.length?<><strong>The class {scoreCopy[tier][0]} {what}.</strong><p>{scoreCopy[tier][1]}</p><div className="tp-score-row"><span>Mastery score</span><b>{score} <i>/ 100</i></b></div><small>Illustrative average across {known.length} of {values.length} students with evidence. Missing evidence is excluded.</small></>:<><strong>No evidence yet</strong><p>There is not enough evidence to estimate mastery. This does not mean low ability.</p></>}</AnchoredTooltip>}
 </div>
}

// The key for mastery levels; each chip takes the surface colour its level has in the distribution bars.
export function MasteryKey(){
 const {layout}=useEvidenceOptions();
 return <div className={layout==='symbols'?'tp-legend tp-legend-symbols':'tp-legend'} aria-label="Mastery key">{levels.map((label,i)=><span key={label} className={`tp-legend-chip tp-segment-${i}`}><img className="tp-legend-symbol" src={`/assets/textbook-mastery/skill-${i}.svg`} alt=""/>{label}</span>)}</div>;
}
