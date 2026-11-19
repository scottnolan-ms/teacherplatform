import {useEffect,useRef,useState} from 'react';

export function PageMoveToast({pageCount,originalStudent,recipient,undone,complete,onUndo,onDismiss}:{pageCount:number;originalStudent:string;recipient:string;undone:boolean;complete:boolean;onUndo:()=>void;onDismiss:()=>void}) {
  const ref=useRef<HTMLDivElement>(null);
  const dismiss=useRef(onDismiss);
  useEffect(()=>{dismiss.current=onDismiss;},[onDismiss]);
  const [paused,setPaused]=useState(false);
  // A popover stays above the original-pages dialog without closing the scorecard.
  useEffect(()=>{ref.current?.showPopover();},[]);
  useEffect(()=>{
    if(paused||undone&&!complete)return;
    const timer=window.setTimeout(()=>dismiss.current(),20000);
    return ()=>window.clearTimeout(timer);
  },[paused,undone,complete]);
  return <div ref={ref} popover="manual" className="pp-move-toast" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setPaused(false);}}>
    <i className="pp-toast-success" aria-hidden="true"/>
    <div className="pp-toast-message"><div role="status" aria-live="polite" aria-atomic="true"><strong>{undone?'Reassignment undone':pageCount===1?'Page moved':`${pageCount} pages moved`}</strong><p>{undone?`${pageCount===1?`${originalStudent}’s page`:`${pageCount} pages for ${originalStudent}`} restored. ${complete?'Both students’ results updated.':'Recalculating both students’ results…'}`:`Assigned to ${recipient}. Recalculating both students’ results.`}</p></div>{!undone&&<button className="pp-toast-undo" onClick={onUndo}>Undo</button>}</div>
    <button className="pp-toast-dismiss" aria-label="Dismiss page move notification" onClick={onDismiss}><i aria-hidden="true"/></button>
  </div>;
}
