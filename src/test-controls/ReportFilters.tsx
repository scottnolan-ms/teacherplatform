import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ProgressFilter } from './report-data';
export function FilterPopover({label,children,onClear}:{label:string;children:ReactNode;onClear:()=>void}) {
 const ref=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{const close=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node)&&ref.current)ref.current.open=false};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[]);
 return <details ref={ref} className="tr-filter" onKeyDown={e=>{if(e.key==='Escape'&&ref.current){ref.current.open=false;ref.current.querySelector('summary')?.focus()}}}><summary>{label}<i className="tr-filter-icon" aria-hidden="true"/></summary><div className="tr-filter-popover">{children}<footer><button className="tc-text" onClick={onClear}>Clear</button><button className="tc-text" onClick={()=>{if(ref.current){ref.current.open=false;ref.current.querySelector('summary')?.focus()}}}>Done</button></footer></div></details>
}
export function MultiFilter({label,options,value,onChange,counts,neutral=false}:{label:string;options:string[];value:string[];onChange:(v:string[])=>void;counts?:number[];neutral?:boolean}) {
 return <FilterPopover label={`${label}: ${value.length===0?'All':value.length===1?value[0]:`${value.length} selected`}`} onClear={()=>onChange([])}><strong>Filter by {label.toLowerCase()}</strong>{options.map((option,i)=><label className={`tr-filter-option ${neutral?'tr-neutral':`tr-tier-${i}`}`} key={option}><span>{option}{counts&&<small> ({counts[i]})</small>}</span><input type="checkbox" checked={value.includes(option)} onChange={e=>onChange(e.target.checked?[...value,option]:value.filter(v=>v!==option))}/></label>)}</FilterPopover>
}
export function ProgressControl({value,onChange}:{value:ProgressFilter;onChange:(v:ProgressFilter)=>void}) {
 const [condition,setCondition]=useState('Less than');const [amount,setAmount]=useState('25');
 function update(c:string,a:string){setCondition(c);setAmount(a);if(a!==''&&Number(a)>=0&&Number(a)<=100)onChange({condition:c,amount:Number(a)})}
 return <FilterPopover label={`Progress: ${value?`${value.condition} ${value.amount}%`:'All'}`} onClear={()=>{onChange(null);setCondition('Less than');setAmount('25')}}><strong>Filter by progress</strong><label>Condition<select value={condition} onChange={e=>update(e.target.value,amount)}>{['Less than','At most','Exactly','At least','More than'].map(c=><option key={c}>{c}</option>)}</select></label><label>Percentage<input type="number" min="0" max="100" value={amount} onChange={e=>update(condition,e.target.value)}/></label>{(amount===''||Number(amount)<0||Number(amount)>100)&&<span role="alert">Enter a percentage from 0 to 100.</span>}<button className="tc-row-action" disabled={amount===''||Number(amount)<0||Number(amount)>100} onClick={()=>update(condition,amount)}>Use condition</button></FilterPopover>
}
