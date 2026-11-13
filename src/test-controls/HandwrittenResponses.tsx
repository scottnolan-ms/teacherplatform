import {createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import type {ReactNode} from 'react';
import type {Attempt} from './model';
import type {Question} from './report-data';
import './handwritten-responses.css';

type Interpretation = 'final' | 'split' | 'working';
const InterpretationContext = createContext<Interpretation>('split');
type Format = 'Mixed responses' | 'All handwritten' | 'All typed';
const HandwritingContext = createContext(false);
const FormatContext = createContext<Format>('Mixed responses');
const FormatControlContext = createContext<{format:Format;setFormat:(format:Format)=>void;interpretation:Interpretation;setInterpretation:(interpretation:Interpretation)=>void}>({format:'Mixed responses',setFormat:()=>{},interpretation:'split',setInterpretation:()=>{}});
export const useHandwriting = () => useContext(HandwritingContext);
// Prototype variation: the marked final answer input stays neutral (default) or takes a subtle tint of its mark.
// Kept outside React state so the scorecard sheet, the handwriting modal and the design options drawer stay in step.
type MarkedTint='default'|'tinted';
let markedTint:MarkedTint='default';
const tintListeners=new Set<()=>void>();
const setMarkedTint=(value:MarkedTint)=>{markedTint=value;document.documentElement.dataset.markedAnswer=value;tintListeners.forEach(listener=>listener())};
const subscribeTint=(listener:()=>void)=>{tintListeners.add(listener);return()=>{tintListeners.delete(listener)}};
export function MarkedAnswerOption(){
 const value=useSyncExternalStore(subscribeTint,()=>markedTint);
 return <label>Marked answer <select aria-label="Marked final answer input" value={value} onChange={e=>setMarkedTint(e.target.value as MarkedTint)}><option value="default">01 · Default</option><option value="tinted">02 · Tinted by mark</option></select></label>;
}
export const markTone=(earned:number,total:number)=>earned>=total?'correct':earned>0?'partial':'incorrect';
export function HandwritingScenario({children}:{children:ReactNode}) {
 return <HandwritingContext.Provider value={true}>{children}</HandwritingContext.Provider>;
}
export function ResponseFormatPreview({children}:{children:ReactNode}) {
 const [format,setFormat]=useState<Format>('Mixed responses');
 const [interpretation,setInterpretation]=useState<Interpretation>('split');
 return <FormatContext.Provider value={format}><InterpretationContext.Provider value={interpretation}><FormatControlContext.Provider value={{format,setFormat,interpretation,setInterpretation}}>{children}</FormatControlContext.Provider></InterpretationContext.Provider></FormatContext.Provider>;
}
export function ResponseFormatControls(){
 const {format,setFormat,interpretation,setInterpretation}=useContext(FormatControlContext);
 return <div className="hw-preview"><div><strong>Digital handwriting</strong><span>Compare response formats · illustrative submissions</span></div><div className="hw-preview-controls"><label>Iteration <select aria-label="Interpretation iteration" value={interpretation} onChange={e=>setInterpretation(e.target.value as Interpretation)}><option value="final">01 · Final answer only</option><option value="split">02 · Written / typed split</option><option value="working">Full working interpretation</option></select></label><label>Responses <select aria-label="Response format" value={format} onChange={e=>setFormat(e.target.value as Format)}><option>Mixed responses</option><option>All handwritten</option><option>All typed</option></select></label><MarkedAnswerOption/></div></div>;
}
// Vector strokes keep the illustrative digital ink crisp when enlarged.
const glyphs:Record<string,string>={
 '0':'M15 3 C1 -1 0 29 11 29 C24 30 24 2 15 3',
 '1':'M7 9 L15 2 L12 29 M5 29 L21 29',
 '2':'M3 8 C6 -2 25 0 21 11 C17 18 8 20 2 29 L23 28',
 '3':'M3 4 C23 -3 27 10 12 14 C28 12 27 32 3 28',
 '4':'M17 1 L2 20 L25 19 M19 3 L17 31',
 '5':'M24 2 L7 3 L4 15 C24 8 30 30 4 29',
 '6':'M22 2 C4 -1 -2 29 13 29 C28 28 26 10 7 15',
 '7':'M2 3 L25 2 L10 31',
 '8':'M14 15 C-6 5 10 -4 20 3 C32 14 -2 15 4 26 C11 37 34 23 14 15',
 '9':'M21 15 C1 24 -3 1 14 2 C30 1 23 26 8 31',
 x:'M2 8 C10 12 13 24 23 29 M24 7 L2 29',
 '+':'M2 16 L25 15 M14 4 L12 29', '-':'M2 17 L24 16', '−':'M2 17 L24 16',
 '=':'M2 12 L24 11 M2 22 L23 21', '/':'M23 0 L2 32', '÷':'M2 17 L24 16 M13 5 L14 5 M11 29 L12 29',
 '(':'M18 0 Q0 15 13 33', ')':'M5 0 Q22 15 3 33', '.':'M10 28 L11 29'
};
function Ink({lines,rows,highlightLast=false}:{lines:string[];rows?:number;highlightLast?:boolean}) {
 const clean=lines.map(line=>line.replace(/\s*\(shown in working\)/,''));
 const last=clean.length-1;
 return <svg className="hw-ink" viewBox={`0 0 ${Math.max(480,...clean.map(line=>line.length*23+48))} ${rows?rows*62+30:Math.max(130,clean.length*62+30)}`} preserveAspectRatio="xMinYMin meet" role="img" aria-label={`Handwritten response: ${clean.join('; ')}`}>
 {highlightLast&&last>=0&&<rect className="hw2-answer-region" x="10" y={last*62+12} width={clean[last].length*23+22} height="54" rx="8"/>}
 {clean.map((line,row)=><g key={row} transform={`translate(24 ${24+row*62}) rotate(${row%2?-.7:.5})`} fill="none" stroke="#41434f" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{[...line].map((char,i)=><path key={i} d={glyphs[char]??''} transform={`translate(${i*23} ${i%3===0?1:0}) scale(.78 1)`}/>)}</g>)}
 </svg>;
}
// Iteration 02: a fixed-shape handwriting tile. Long responses are cropped, not shrunk, and open in a modal.
const TILE_ROWS=3;
function InkTile({lines,anchor,highlightLast,label,onOpen}:{lines:string[];anchor:'start'|'end';highlightLast:boolean;label:string;onOpen:()=>void}) {
 const hidden=Math.max(0,lines.length-TILE_ROWS);
 const shown=anchor==='end'?lines.slice(-TILE_ROWS):lines.slice(0,TILE_ROWS);
 return <button type="button" className={`hw2-tile ${hidden?`hw2-crop-${anchor}`:''}`} onClick={onOpen} aria-label={`Open handwriting for ${label}`}>
  <Ink lines={shown} rows={TILE_ROWS} highlightLast={highlightLast}/>
  {hidden>0&&<span className="hw2-more">+{hidden} more line{hidden>1?'s':''}</span>}
  <span className="hw2-expand" aria-hidden="true"><i style={{maskImage:'url(/assets/scorecard-v2/f6387.svg)'}}/></span>
 </button>;
}
function InkModal({title,lines,highlightLast,children,onClose}:{title:string;lines:string[];highlightLast:boolean;children:ReactNode;onClose:()=>void}) {
 const ref=useRef<HTMLDivElement>(null),[zoom,setZoom]=useState(1);
 // Capture keys before the report sheet's own handler so Escape closes only this modal.
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;ref.current?.focus({preventScroll:true});const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement).closest?.('.hw2-mark-menu')&&e.key==='Escape')return;if(e.key==='Escape'){e.stopPropagation();onClose();return}if(e.key!=='Tab')return;e.stopPropagation();const elements=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),summary,textarea')??[]);if(!elements.length)return;const first=elements[0],final=elements[elements.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();final.focus()}else if(!e.shiftKey&&document.activeElement===final){e.preventDefault();first.focus()}};window.addEventListener('keydown',key,true);return()=>{window.removeEventListener('keydown',key,true);previous?.focus({preventScroll:true})}},[onClose]);
 return createPortal(<div className="tc-app hw2-modal-backdrop" onClick={onClose}><div className="hw2-modal" role="dialog" aria-modal="true" aria-label={`Handwritten response · ${title}`} tabIndex={-1} ref={ref} onClick={e=>e.stopPropagation()}>
  <header><strong>{title}</strong><div className="hw2-zoom"><button className="tc-text" aria-label="Zoom out" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.5))}>−</button><span>{Math.round(zoom*100)}%</span><button className="tc-text" aria-label="Zoom in" disabled={zoom>=2.5} onClick={()=>setZoom(z=>Math.min(2.5,z+.5))}>+</button></div><button className="tc-icon-button" aria-label="Close handwriting" onClick={onClose}>×</button></header>
  <div className="hw2-modal-body"><div className="hw2-modal-ink"><div style={{width:`${zoom*100}%`}}><Ink lines={lines} highlightLast={highlightLast}/></div></div><aside>{children}</aside></div>
 </div></div>,document.body);
}
// Demo only: the override lives in the question card's state and does not change the student's totals.
export type Override={mark:number;note:string;at:string};
export type MarkControl={earned:number;total:number;override:Override|null;setOverride:(override:Override|null)=>void;chip:(earned:number,original?:boolean)=>ReactNode;icon:(outcome:'Correct'|'Partial'|'Incorrect')=>ReactNode;rationale:(overridden:boolean)=>ReactNode};
export const currentMark=(mark:MarkControl)=>mark.override?.mark??mark.earned;
// The dropdown keeps working after an override so the teacher can change their mind.
export function MarkEditor({mark}:{mark:MarkControl}) {
 const {override}=mark,current=currentMark(mark);
 const [open,setOpen]=useState(false),[draft,setDraft]=useState(current);
 const options=[{outcome:'Correct' as const,value:mark.total},{outcome:'Partial' as const,value:mark.total/2},{outcome:'Incorrect' as const,value:0}];
 const apply=(value:number)=>mark.setOverride(value===mark.earned?null:{mark:value,note:override?.note??'',at:'Just now'});
 return <span className="hw2-mark-edit" onKeyDown={e=>{if(open&&e.key==='Escape'){e.stopPropagation();setOpen(false)}}}>
  {override&&mark.chip(mark.earned,true)}
  <button type="button" className="hw2-mark-button" aria-haspopup="dialog" aria-expanded={open} aria-label={`Mark ${current} out of ${mark.total}. Change mark`} onClick={()=>{setDraft(current);setOpen(!open)}}>{mark.chip(current)}<svg className="hw2-caret" viewBox="0 0 10 6" width="10" height="6" aria-hidden="true"><path d="M0 0h10L5 6z" fill="currentColor"/></svg></button>
  {open&&<div className="hw2-mark-menu" role="dialog" aria-label="Select mark">
   <strong>Select mark</strong>
   <div className="hw2-mark-options" role="radiogroup" aria-label="Mark">{options.map(option=><button type="button" key={option.outcome} role="radio" aria-checked={draft===option.value} className={`hw2-${option.outcome.toLowerCase()}`} onClick={()=>setDraft(option.value)}>{mark.icon(option.outcome)}<span>{option.outcome} {option.value} {option.value===0||option.value>1?'Marks':'Mark'}</span><i className="hw2-radio" aria-hidden="true"/></button>)}</div>
   <div className="hw2-mark-actions"><button type="button" onClick={()=>{mark.setOverride(null);setOpen(false)}}>Revert</button><button type="button" onClick={()=>{apply(draft);setOpen(false)}}>Apply</button></div>
  </div>}
 </span>;
}
export function MarkEdited({mark}:{mark:MarkControl}) {
 const {override}=mark,[editing,setEditing]=useState(false);
 if(!override)return null;
 return <section className="sc-edited"><strong>Mark edited</strong><div className="sc-edited-by"><img src="/assets/scorecard-v2/5f58f.png" alt=""/><span><b>Mitchell</b>, Sarah (you)</span><time>{override.at}</time><button type="button" onClick={()=>setEditing(!editing)}><i aria-hidden="true" className="sc-icon" style={{maskImage:'url(/assets/scorecard-v2/c153a.svg)'}}/>{editing?'Save note':override.note?'Edit note':'Add note'}</button></div>{editing?<textarea aria-label="Teacher mark note" placeholder="Add a note (optional)" value={override.note} onChange={e=>mark.setOverride({...override,note:e.target.value})}/>:override.note&&<p>{override.note}</p>}</section>;
}
// Every line of working shows its mark for transparency; the final line carries the editable mark.
// Step marks are illustrative: the demo data only stores the mark for the whole part.
export function WorkingLines({lines,mark}:{lines:string[];mark:MarkControl}) {
 const last=lines.length-1,tone=markTone(currentMark(mark),mark.total);
 return <div className="sc-working-lines">{lines.map((line,i)=>{const partial=i===last-1&&mark.earned<mark.total;return <div className="sc-answer-row" key={i}><span className={`sc-answer ${i===last?`is-marked ${tone}`:''}`}>{line}</span>{i===last?<span className="sc-marks"><MarkEditor mark={mark}/></span>:<span className={`sc-step-mark ${partial?'partial':''}`} role="img" aria-label={partial?'Working step: partial credit':'Working step: credited'}>{partial?mark.icon('Partial'):<i aria-hidden="true" className="sc-icon" style={{maskImage:'url(/assets/scorecard-v2/8639f.svg)'}}/>}</span>}</div>})}</div>;
}
function SplitResponse({title,type,inkLines,final,needsReview:flagged,mark}:{title:string;type:'Handwritten'|'Mixed';inkLines:string[];final:string;needsReview:boolean;mark:MarkControl}) {
 const [open,setOpen]=useState(false),[reviewed,setReviewed]=useState(false);
 // Confidence example: a low-confidence reading stays flagged until the teacher confirms it or overrides the mark.
 const needsReview=flagged&&!mark.override&&!reviewed,checked=flagged&&!mark.override&&reviewed;
 const edited=<MarkEdited mark={mark}/>;
 const rationaleNode=mark.rationale(!!mark.override);
 const close=useCallback(()=>setOpen(false),[]);
 const mixed=type==='Mixed';
 const marked=<section className={`hw2-marked ${needsReview?'hw2-check':''}`}><div className="hw2-marked-head"><strong>Marked answer</strong>{needsReview&&<span className="hw-review">Check reading</span>}{checked&&<span className="hw-reviewed">✓ Reading checked</span>}</div><div className="hw2-marked-row"><div className="hw2-marked-answer"><span className={`sc-answer ${needsReview?'':`is-marked ${markTone(currentMark(mark),mark.total)}`}`}>{final}</span><small>{mixed?'Typed':'Read from handwriting'}</small></div><span className="hw2-marks"><MarkEditor mark={mark}/></span></div></section>;
 const flag=(needsReview||checked)&&<div className={`hw-review-note ${checked?'checked':''}`}><strong>{checked?'Reading checked':'Low-confidence reading'}</strong><p>{checked?'The marked answer matches the handwriting. The mark is unchanged.':'Compare the marked answer with the highlighted handwriting. Confirm the reading, or if it was misread, edit the mark and add a note.'}</p><button type="button" className="tc-text" onClick={()=>setReviewed(!reviewed)}>{checked?'Undo confirmation':'Confirm reading'}</button></div>;
 const chip=(kind:'Typed'|'Written')=><span className="hw2-chip"><i aria-hidden="true" style={{maskImage:`url(/assets/scorecard-v2/${kind==='Typed'?'ea275':'df15c'}.svg)`}}/>{kind}</span>;
 // Both inputs are kept. In two columns the typed answer leads (it anchors the left edge and can grow); in one column the handwriting leads.
 return <div className="hw-response hw2">
  <strong className="hw2-heading">Student response</strong>
  <div className="hw2-modules">
   {mixed&&<section className="hw2-module hw2-module-typed"><div className="hw2-module-head">{chip('Typed')}<small>Final answer</small></div><span className="sc-answer">{final}</span></section>}
   <section className="hw2-module hw2-module-written"><div className="hw2-module-head">{chip('Written')}<small>{mixed?'Working · not marked':'Answer read from the highlighted line'}</small></div><InkTile lines={inkLines} anchor={mixed?'start':'end'} highlightLast={!mixed} label={title} onOpen={()=>setOpen(true)}/></section>
  </div>
  {marked}{edited}{flag}{needsReview&&<button className="tc-text hw2-open" onClick={()=>setOpen(true)}>Open handwriting</button>}
  <div className="hw2-rationale">{rationaleNode}</div>
  {open&&<InkModal title={title} lines={inkLines} highlightLast={!mixed} onClose={close}>{marked}{edited}{flag}{rationaleNode}</InkModal>}
 </div>;
}
export function DigitalResponse({student,q,lines,part=0,mark}:{student:Attempt;q:Question;lines:string[];part?:number;mark:MarkControl}) {
 const marks=<span className="sc-marks"><MarkEditor mark={mark}/></span>,rationale=mark.rationale(!!mark.override);
 const format=useContext(FormatContext);
 const interpretation=useContext(InterpretationContext);
 const finalOnly=interpretation!=='working';
 const type=format==='All typed'?'Typed':format==='All handwritten'?'Handwritten':q.id===1?(part===0?'Typed':'Mixed'):q.id%3===2?'Handwritten':q.id%3===0?'Mixed':'Typed';
 const [enlarged,setEnlarged]=useState(false),[reviewed,setReviewed]=useState(false);
 // The split view marks only the final answer, so its confidence example must be a handwritten answer (Q5 in mixed responses, where Q3 is typed).
 const needsReview=interpretation==='split'?type==='Handwritten'&&q.id===(format==='Mixed responses'?5:3):q.id===3&&(type==='Handwritten'||(type==='Mixed'&&!finalOnly));
 const intermediate:Record<number,string[]>={2:['x = 18 ÷ 3'],3:['x = 9 + 4'],4:['2x = 8'],5:['5x = 25'],6:['x ÷ 4 = 3'],7:['x + 2 = 7'],8:['2x = 12'],9:['5x − 10 = 3x + 4','2x = 14'],10:['−2x = 8'],11:['x + 3 = 16'],12:['6x − 8 = 4x + 10','2x = 18'],13:['2x − 1 = 15','2x = 16'],14:['0.5x = 2.5'],15:['3x + 12 − 2x + 2 = 20','x + 14 = 20']};
 const working=lines.length>1?lines:[q.id===1&&part===1?'2x + 3 = 11':q.equation,...(q.id===1&&part===1?['2x = 8']:intermediate[q.id]??[]),...lines];
 const inkLines=type==='Mixed'?working.slice(0,-1):working;
 const final=lines.at(-1)??'';
 const interpretedLines=finalOnly?[final]:working;
 if(interpretation==='split'&&type!=='Typed')return <SplitResponse title={`${student.name} · Q${q.id}${q.id===1?part===0?'A':'B':''}`} type={type} inkLines={inkLines} final={final} needsReview={needsReview} mark={mark}/>;
 return <div className="hw-response"><div className="hw-response-meta"><span className={`hw-type hw-${type.toLowerCase()}`}>{type==='Mixed'?'Handwritten + typed':type==='Typed'?'Math input':'Digital handwriting'}</span>{needsReview&&<span className={reviewed?'hw-reviewed':'hw-review'}>{reviewed?'✓ Interpretation checked':'Check interpretation'}</span>}</div>
 {type==='Typed'?<WorkingLines lines={lines} mark={mark}/>:<>
 <div className="hw-columns"><section className="hw-captured"><header><strong>Student response</strong><button className="tc-text" aria-expanded={enlarged} aria-label={enlarged?'Reduce handwriting':'Enlarge handwriting'} onClick={()=>setEnlarged(!enlarged)}>{enlarged?'− Reduce':'+ Enlarge'}</button></header><div className="hw-source"><span className="hw-step-label">{type==='Mixed'?'1 · Handwritten working':'Written on screen'}</span><Ink lines={inkLines}/></div>{type==='Mixed'&&<div className="hw-typed"><span className="hw-step-label">2 · Typed final answer</span><span className="sc-answer">{final}</span></div>}</section>
 <section className="hw-interpreted"><header><strong>Interpreted response</strong></header><p className="hw-caption">{finalOnly?(type==='Mixed'?'Final answer kept exactly as typed.':'Final answer read from the student’s handwriting.'):(type==='Mixed'?'Handwriting interpreted; typed answer kept as entered.':'Maths read from the student’s handwriting.')}</p><div className="hw-read-lines">{interpretedLines.map((line,i)=><div key={i}><span className="sc-answer">{line}</span><small>{type==='Mixed'&&i===interpretedLines.length-1?'Typed':'Handwritten'}</small></div>)}</div>{needsReview&&<div className={`hw-review-note ${reviewed?'checked':''}`}><strong>{reviewed?'Interpretation checked':'Handwriting needs a closer look'}</strong><p>{reviewed?'The interpretation matches the original response. The mark is unchanged.':'Compare the final answer in the handwriting with the interpretation before confirming the result.'}</p><button className="tc-text" onClick={()=>setReviewed(!reviewed)}>{reviewed?'Undo confirmation':'Confirm interpretation'}</button></div>}</section></div>
 {enlarged&&<section className="hw-enlarged" aria-label="Enlarged handwritten response"><header><strong>{student.name} · Q{q.id}{q.id===1?part===0?'A':'B':''}</strong><button className="tc-text" onClick={()=>setEnlarged(false)}>Close enlargement</button></header><Ink lines={inkLines}/></section>}
 </>}<MarkEdited mark={mark}/>{rationale}{type!=='Typed'&&<div className="hw-mark-row">{marks}</div>}</div>;
}
