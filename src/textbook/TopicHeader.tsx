import {useEffect,useRef,useState} from 'react';
import type {ReactNode,RefObject} from 'react';
import {SubtopicFlag,TopicEyebrow} from './EvidenceUI';
import {paceStatus,shortDate} from './model';
import type {PageRange,TopicPlan} from './model';

interface Props {
 topic:TopicPlan;
 number:number;
 seq?:number;
 pages?:PageRange;
 focused:boolean;
 sheet:boolean;
 summaryRef:RefObject<HTMLElement|null>;
 actions:ReactNode;
}

export function TopicHeader({topic,number,seq,pages,focused,sheet,summaryRef,actions}:Props){
 const headerRef=useRef<HTMLElement>(null);
 const [summaryAbove,setSummaryAbove]=useState(false);
 useEffect(()=>{
  const header=headerRef.current;
  const summary=summaryRef.current;
  if(!header||!summary)return;
  let frame=0;
  const check=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>setSummaryAbove(summary.getBoundingClientRect().bottom<=header.getBoundingClientRect().bottom));
  };
  const resize=new ResizeObserver(check);
  resize.observe(header);
  resize.observe(summary);
  window.addEventListener('scroll',check,true);
  window.addEventListener('resize',check);
  check();
  return ()=>{
   cancelAnimationFrame(frame);
   resize.disconnect();
   window.removeEventListener('scroll',check,true);
   window.removeEventListener('resize',check);
  };
 },[summaryRef,topic.name]);
 const pace=paceStatus(topic);
 const label=pace.status==='Behind'?`Behind by ${-pace.delta}`:pace.status==='Ahead'?`Ahead by ${pace.delta}`:pace.status;
 return <header ref={headerRef} className={sheet?'tp-topic-heading tp-ts-heading':'tp-topic-heading tp-focus-heading'}>
  <div className="tp-topic-heading-title">
   <TopicEyebrow seq={seq} number={number} pages={pages} focus={focused}/>
   {sheet?<h2>{topic.name}</h2>:<h3>{topic.name}</h3>}
  </div>
  {summaryAbove&&<div className="tp-topic-stats" aria-label="Topic at a glance">
   <span className="tp-subtopic-count"><SubtopicFlag/><b>{topic.introduced} of {topic.subtopics.length}</b><span className="tp-sr"> subtopics introduced</span></span>
  </div>}
  <div className="tp-topic-heading-actions">
   <div className="tp-topic-pacing"><span className={`tp-pace tp-pace-${pace.status.toLowerCase().replace(' ','-')}`}>{label}</span>
    {topic.end&&<span className="tp-muted">Target {shortDate(topic.end)}</span>}
   </div>
   {actions}
  </div>
 </header>;
}
