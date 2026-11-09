import {createContext, useContext, useState} from 'react';
import type {ReactNode} from 'react';
import type {Attempt} from './model';
import type {Question} from './report-data';
import './handwritten-responses.css';

type Format = 'Mixed responses' | 'All handwritten' | 'All typed';
const HandwritingContext = createContext(false);
const FormatContext = createContext<Format>('Mixed responses');
const FormatControlContext = createContext<{format:Format;setFormat:(format:Format)=>void}>({format:'Mixed responses',setFormat:()=>{}});
export const useHandwriting = () => useContext(HandwritingContext);
export function HandwritingScenario({children}:{children:ReactNode}) {
 return <HandwritingContext.Provider value={true}>{children}</HandwritingContext.Provider>;
}
export function ResponseFormatPreview({children}:{children:ReactNode}) {
 const [format,setFormat]=useState<Format>('Mixed responses');
 return <FormatContext.Provider value={format}><FormatControlContext.Provider value={{format,setFormat}}>{children}</FormatControlContext.Provider></FormatContext.Provider>;
}
export function ResponseFormatControls(){
 const {format,setFormat}=useContext(FormatControlContext);
 return <div className="hw-preview"><div><strong>Digital handwriting</strong><span>Compare response formats · illustrative submissions</span></div><label>Responses <select aria-label="Response format" value={format} onChange={e=>setFormat(e.target.value as Format)}><option>Mixed responses</option><option>All handwritten</option><option>All typed</option></select></label></div>;
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
function Ink({lines}:{lines:string[]}) {
 return <svg className="hw-ink" viewBox={`0 0 ${Math.max(480,...lines.map(line=>line.length*23+48))} ${Math.max(130,lines.length*62+30)}`} role="img" aria-label={`Handwritten response: ${lines.join('; ')}`}>
 {lines.map((line,row)=><g key={row} transform={`translate(24 ${24+row*62}) rotate(${row%2?-.7:.5})`} fill="none" stroke="#41434f" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{[...line.replace(/\s*\(shown in working\)/,'')].map((char,i)=><path key={i} d={glyphs[char]??''} transform={`translate(${i*23} ${i%3===0?1:0}) scale(.78 1)`}/>)}</g>)}
 </svg>;
}
export function DigitalResponse({student,q,lines,part=0,marks,rationale}:{student:Attempt;q:Question;lines:string[];part?:number;marks:ReactNode;rationale:ReactNode}) {
 const format=useContext(FormatContext);
 const type=format==='All typed'?'Typed':format==='All handwritten'?'Handwritten':q.id===1?(part===0?'Typed':'Mixed'):q.id%3===2?'Handwritten':q.id%3===0?'Mixed':'Typed';
 const [enlarged,setEnlarged]=useState(false),[reviewed,setReviewed]=useState(false);
 const needsReview=q.id===3&&type!=='Typed';
 const intermediate:Record<number,string[]>={2:['x = 18 ÷ 3'],3:['x = 9 + 4'],4:['2x = 8'],5:['5x = 25'],6:['x ÷ 4 = 3'],7:['x + 2 = 7'],8:['2x = 12'],9:['5x − 10 = 3x + 4','2x = 14'],10:['−2x = 8'],11:['x + 3 = 16'],12:['6x − 8 = 4x + 10','2x = 18'],13:['2x − 1 = 15','2x = 16'],14:['0.5x = 2.5'],15:['3x + 12 − 2x + 2 = 20','x + 14 = 20']};
 const working=lines.length>1?lines:[q.id===1&&part===1?'2x + 3 = 11':q.equation,...(q.id===1&&part===1?['2x = 8']:intermediate[q.id]??[]),...lines];
 const inkLines=type==='Mixed'?working.slice(0,-1):working;
 const final=lines.at(-1)??'';
 return <div className="hw-response"><div className="hw-response-meta"><span className={`hw-type hw-${type.toLowerCase()}`}>{type==='Mixed'?'Handwritten + typed':type==='Typed'?'Math input':'Digital handwriting'}</span>{needsReview&&<span className={reviewed?'hw-reviewed':'hw-review'}>{reviewed?'✓ Interpretation checked':'Check interpretation'}</span>}</div>
 {type==='Typed'?<div className="sc-working-lines">{lines.map((line,i)=><div className="sc-answer-row" key={i}><span className="sc-answer">{line}</span>{i===lines.length-1&&marks}</div>)}</div>:<>
 <div className="hw-columns"><section className="hw-captured"><header><strong>Student response</strong><button className="tc-text" aria-expanded={enlarged} aria-label={enlarged?'Reduce handwriting':'Enlarge handwriting'} onClick={()=>setEnlarged(!enlarged)}>{enlarged?'− Reduce':'+ Enlarge'}</button></header><div className="hw-source"><span className="hw-step-label">{type==='Mixed'?'1 · Handwritten working':'Written on screen'}</span><Ink lines={inkLines}/></div>{type==='Mixed'&&<div className="hw-typed"><span className="hw-step-label">2 · Typed final answer</span><span className="sc-answer">{final}</span></div>}</section>
 <section className="hw-interpreted"><header><strong>Interpreted response</strong></header><p className="hw-caption">{type==='Mixed'?'Handwriting interpreted; typed answer kept as entered.':'Maths read from the student’s handwriting.'}</p><div className="hw-read-lines">{working.map((line,i)=><div key={i}><span className="sc-answer">{line}</span><small>{type==='Mixed'&&i===working.length-1?'Typed':'Handwritten'}</small></div>)}</div>{needsReview&&<div className={`hw-review-note ${reviewed?'checked':''}`}><strong>{reviewed?'Interpretation checked':'Handwriting needs a closer look'}</strong><p>{reviewed?'The interpretation matches the original response. The mark is unchanged.':'Compare the final digit in the working with the interpretation before confirming the result.'}</p><button className="tc-text" onClick={()=>setReviewed(!reviewed)}>{reviewed?'Undo confirmation':'Confirm interpretation'}</button></div>}</section></div>
 {enlarged&&<section className="hw-enlarged" aria-label="Enlarged handwritten response"><header><strong>{student.name} · Q{q.id}{q.id===1?part===0?'A':'B':''}</strong><button className="tc-text" onClick={()=>setEnlarged(false)}>Close enlargement</button></header><Ink lines={inkLines}/></section>}
 </>}{rationale}{type!=='Typed'&&<div className="hw-mark-row">{marks}</div>}</div>;
}
