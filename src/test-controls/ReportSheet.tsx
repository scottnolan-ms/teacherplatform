import {useHandwriting, ResponseFormatControls} from './HandwrittenResponses';
import {createContext,useContext,useState,useEffect,useRef,useCallback} from 'react';
import type {ReactNode,RefObject} from 'react';
import {createPortal} from 'react-dom';
import questionTabIcon from '../assets/Icons/Question-Multiple-Angle.svg';
const ParentReportSheet=createContext<RefObject<HTMLDivElement|null>|null>(null);

export function ReportSheet({title,view,onViewChange,onClose,workbook=false,children,className='',renderHeader,toolbar,suspended=false,dialogLabel="Task report details"}:{dialogLabel?:string;suspended?:boolean;title:string;view:string;onViewChange:(view:'Scorecards'|'Questions')=>void;onClose:()=>void;workbook?:boolean;children:ReactNode;className?:string;renderHeader?:(close:()=>void)=>ReactNode;toolbar?:ReactNode}){
 const handwriting=useHandwriting();
 const [closing,setClosing]=useState(false);
 const requestClose=useCallback(()=>setClosing(true),[]);
 const ref=useRef<HTMLDivElement>(null);
 const parent=useContext(ParentReportSheet);
 const trigger=useRef<HTMLElement|null>(null);
 const onCloseRef=useRef(onClose);
 useEffect(()=>{onCloseRef.current=onClose},[onClose]);
 useEffect(()=>{
  if(!closing)return;
  const timeout=window.setTimeout(()=>onCloseRef.current(),matchMedia('(prefers-reduced-motion: reduce)').matches?0:220);
  return ()=>window.clearTimeout(timeout);
 },[closing]);
 useEffect(()=>{
  const sheet=ref.current;
  const active=document.activeElement;
  if(active instanceof HTMLElement&&!sheet?.contains(active))trigger.current=active;
  const parentSheet=parent?.current;
  if(parentSheet)parentSheet.inert=true;
  sheet?.focus({preventScroll:true});
  const key=(e:KeyboardEvent)=>{
   const sheet=ref.current;
   if(!sheet||sheet.inert||e.defaultPrevented||document.querySelector('dialog[open],.rc-backdrop,.ar-overlay'))return;
   const sheets=[...document.querySelectorAll<HTMLElement>('.tr-sheet[role="dialog"]:not([inert])')];
   if(sheets.at(-1)!==sheet)return;
   if(e.key==='Escape'){
    e.preventDefault();
    requestClose();
   }
   if(e.key==='Tab'){
    const elements=[...sheet.querySelectorAll<HTMLElement>('button:not(:disabled),summary,input:not(:disabled),select:not(:disabled),textarea,a[href],[tabindex="0"]')].filter(el=>el.tabIndex>=0&&el.getClientRects().length>0&&!el.closest('[inert]'));
    const first=elements[0],last=elements.at(-1);
    if(!first||!last){e.preventDefault();return}
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===sheet)){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
   }
  };
  document.addEventListener('keydown',key);
  return ()=>{
   document.removeEventListener('keydown',key);
   if(parentSheet)parentSheet.inert=false;
   requestAnimationFrame(()=>{if(!sheet?.isConnected&&trigger.current?.isConnected)trigger.current.focus({preventScroll:true})});
  };
 },[parent,requestClose]);
 return createPortal(<div className={`tc-app tr-detail-portal ${className} ${closing?'tr-sheet-closing':''}`}><div className="tr-sheet-backdrop" onClick={()=>{if(!suspended)requestClose()}}><div className="tr-sheet" inert={suspended} onAnimationEnd={e=>{if(!closing&&e.target===e.currentTarget&&workbook){const main=ref.current?.querySelector<HTMLElement>('.tr-sheet-main');const section=main?.querySelector<HTMLElement>('.tr-section-bar');if(main&&section)main.scrollTop=section.offsetTop-main.offsetTop}}} role="dialog" aria-modal="true" aria-label={dialogLabel} tabIndex={-1} ref={ref} onClick={e=>e.stopPropagation()}>{renderHeader?renderHeader(requestClose):<header className="tr-sheet-header"><div className="tc-report-tabs" role="tablist" aria-label="Detail views">{(['Scorecards','Questions'] as const).map(t=><button key={t} role="tab" aria-selected={view===t} className={view===t?'active':''} onClick={()=>{onViewChange(t)}}>{t==='Scorecards'?<i className="tr-scorecard-icon" aria-hidden="true"/>:<img className="tr-question-tab-icon" src={questionTabIcon} alt=""/>}{t}</button>)}</div><span>{title} · Demo responses</span><button className="tc-icon-button" aria-label="Close report details" onClick={requestClose}>×</button></header>}{handwriting&&<ResponseFormatControls/>}{toolbar}<div className={`tr-sheet-body ${view==='Questions'?'tr-question-sheet':''}`}><ParentReportSheet.Provider value={ref}>{children}</ParentReportSheet.Provider>
 </div></div></div></div>,document.body)
}
