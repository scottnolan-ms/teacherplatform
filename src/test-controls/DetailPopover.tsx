import {useEffect, useId, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {AnchoredTooltip} from './AnchoredTooltip';

/** Shared hover/focus/tap surface. The action remains reachable inside the popup. */
export function DetailPopover({label,children,content,className='',disabled=false,action,onActivate}:{label:string;children:ReactNode;content:ReactNode;className?:string;disabled?:boolean;action?:{label:string;onClick:()=>void};onActivate?:()=>void}){
 const id=useId(),trigger=useRef<HTMLButtonElement>(null),body=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [anchor,setAnchor]=useState<DOMRect|null>(null);
 const cancel=()=>{if(timer.current)clearTimeout(timer.current)};
 const show=()=>{cancel();setAnchor(trigger.current?.getBoundingClientRect()??null)};
 const close=()=>{cancel();setAnchor(null)};
 const leave=()=>{cancel();timer.current=setTimeout(()=>setAnchor(null),180)};
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 useEffect(()=>{
  if(!anchor)return;
  const outside=(e:PointerEvent)=>{if(!trigger.current?.contains(e.target as Node)&&!body.current?.contains(e.target as Node))setAnchor(null)};
  const dismiss=()=>setAnchor(null);
  document.addEventListener('pointerdown',outside);window.addEventListener('resize',dismiss);window.addEventListener('scroll',dismiss,true);
  return()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',dismiss);window.removeEventListener('scroll',dismiss,true)};
 },[anchor]);
 const key=(e:React.KeyboardEvent)=>{if(e.key==='Escape'&&anchor){e.stopPropagation();e.preventDefault();trigger.current?.focus();close()}else if(e.key==='Tab'&&!e.shiftKey&&e.target===trigger.current&&anchor&&action){e.preventDefault();body.current?.querySelector('button')?.focus()}};
 return <><button ref={trigger} type="button" className={`detail-trigger ${className}`} aria-label={label} aria-disabled={disabled||undefined} aria-describedby={anchor?id:undefined} aria-expanded={action?!!anchor:undefined} aria-haspopup={action?'dialog':undefined} onMouseEnter={show} onMouseLeave={leave} onFocus={show} onBlur={e=>{if(!body.current?.contains(e.relatedTarget as Node))close()}} onKeyDown={key} onClick={()=>{if(onActivate&&!disabled){close();onActivate()}else show()}}>{children}</button>{anchor&&<AnchoredTooltip anchor={anchor} id={id} className="ar-tooltip detail-popover" role={action?'dialog':'tooltip'}><div ref={body} onMouseEnter={cancel} onMouseLeave={leave} onKeyDown={key} onBlur={e=>{if(!body.current?.contains(e.relatedTarget as Node)&&e.relatedTarget!==trigger.current)close()}}>{content}{action&&<button className="detail-popover-action" onClick={()=>{close();action.onClick()}}>{action.label} →</button>}</div></AnchoredTooltip>}</>;
}
