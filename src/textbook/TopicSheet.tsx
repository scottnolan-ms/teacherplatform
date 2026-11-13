import {useEffect,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {masteryScore} from './model';
import type {PageRange} from './model';

export type TopicEntry={name:string;label:string;number:number;pages?:PageRange;introduced:number;total:number;pace:string;paceClass:string;average:number;focus:boolean};
type Order='sequence'|'textbook';
type Props={title:string;bar:string;order:Order;onOrder:(order:Order)=>void;hasSequence:boolean;entries:TopicEntry[];current:string;onTopic:(name:string)=>void;onClose:()=>void;header:ReactNode;children:ReactNode};

// A topic opened from the Overview: the topic list stays alongside so a teacher can move between topics without leaving the sheet.
export default function TopicSheet({title,bar,order,onOrder,hasSequence,entries,current,onTopic,onClose,header,children}:Props){
 const [closing,setClosing]=useState(false);
 // Leaves with the same slide as it enters, then hands back to the Overview.
 const close=()=>{if(closing)return;setClosing(true);setTimeout(onClose,matchMedia('(prefers-reduced-motion: reduce)').matches?0:240)};
 const sheet=useRef<HTMLDivElement>(null),main=useRef<HTMLDivElement>(null),list=useRef<HTMLElement>(null);
 // Not a native modal: recommendation sheets and menus are portalled to the page and must be able to sit above this one.
 useEffect(()=>{const previous=document.activeElement as HTMLElement;sheet.current?.focus();return()=>{if(previous?.isConnected)previous.focus()}},[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!e.defaultPrevented&&!document.querySelector('dialog[open],.rc-backdrop'))close()};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)});
 useEffect(()=>{main.current?.scrollTo({top:0});list.current?.querySelector('[aria-current=true]')?.scrollIntoView({block:'nearest'})},[current]);
 return <div className={closing?'tp-ts-backdrop closing':'tp-ts-backdrop'} onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="tp-topic-sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={sheet}>
  <header className="tp-ts-bar"><strong>{bar}</strong><button className="tp-ts-close" aria-label="Close topic" onClick={close}>×</button></header>
  <div className="tp-ts-body">
   <nav className="tp-ts-list" aria-label="Topics" ref={list}><div className="tp-ts-order">{hasSequence?<div className="tp-toggle" role="group" aria-label="Topic order">{(['sequence','textbook'] as const).map(v=><button key={v} className={order===v?'active':''} aria-pressed={order===v} onClick={()=>onOrder(v)}>{v==='sequence'?'My sequence':'Textbook order'}</button>)}</div>:<p className="tp-ts-order-label">Textbook order</p>}<select className="tp-ts-select" aria-label="Topic" value={current} onChange={e=>onTopic(e.target.value)}>{entries.map(t=><option key={t.name} value={t.name}>{t.label?`${t.label} · `:''}Topic {t.number} · {t.name}{t.focus?' (topic focus)':''}</option>)}</select></div>{entries.map(t=><button key={t.name} className={t.name===current?'active':''} aria-current={t.name===current} onClick={()=>onTopic(t.name)}>
    {t.label&&<span className="tp-number">{t.label}</span>}
    <span className="tp-ts-name"><span className="tp-topic-eyebrow"><span className="tp-topic-chip" title={t.pages?`Pages ${t.pages.start}–${t.pages.end} in the print textbook`:undefined}>Topic {t.number}</span></span><strong>{t.name}</strong><small>{t.introduced} / {t.total} introduced{t.focus?' · Topic focus':''}</small><span className="tp-ts-signal"><span className={`tp-pace ${t.paceClass}`}>{t.pace}</span>{t.average?<span className="tp-ts-level" title="Average mastery across introduced subtopics"><img src={`/assets/textbook-mastery/skill-${Math.floor(t.average)}.svg`} alt=""/>{masteryScore(t.average)}<span className="tp-sr">average mastery score out of 100</span></span>:<span className="tp-ts-level tp-muted">No evidence</span>}</span></span>
   </button>)}</nav>
   <div className="tp-ts-main" ref={main}><div className="tp-ts-heading">{header}</div>{children}</div>
  </div>
 </div></div>;
}
