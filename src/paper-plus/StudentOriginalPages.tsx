import {useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import type {Sheet} from './model';

export function StudentOriginalPages({student,pages,renderPage,onReplace,onAdd,onBack,selectedId,onSelectPage}:{selectedId?:number;onSelectPage:(id:number)=>void;student:string;pages:Sheet[];renderPage:(page:Sheet)=>ReactNode;onReplace:(pageId:number)=>void;onAdd:()=>void;onBack:()=>void}) {
  const [zoom,setZoom]=useState(1);
  const [pageHeight,setPageHeight]=useState(720);
  const viewport=useRef<HTMLDivElement>(null),pageElement=useRef<HTMLDivElement>(null);
  const page=pages.find(item=>item.id===selectedId)??pages[0];
  const selectedIndex=pages.findIndex(item=>item.id===page?.id);
  const fit=()=>setZoom(Math.min(1,Math.max(.25,((viewport.current?.clientWidth??588)-48)/540)));
  useEffect(()=>{const element=viewport.current;if(!element)return;const observer=new ResizeObserver(()=>setZoom(Math.min(1,Math.max(.25,(element.clientWidth-48)/540))));observer.observe(element);return()=>observer.disconnect();},[]);
  useEffect(()=>{const element=pageElement.current;if(!element)return;const observer=new ResizeObserver(()=>setPageHeight(element.getBoundingClientRect().height/zoom));observer.observe(element);return()=>observer.disconnect();},[page?.id,zoom]);
  return <><div className="pp-original-toolbar"><span>Page {pages.length?selectedIndex+1:0} of {pages.length}</span><div role="group" aria-label="Page zoom"><button aria-label="Zoom out" disabled={zoom<=.25} onClick={()=>setZoom(value=>Math.max(.25,Math.round((value-.25)*100)/100))}>−</button><output aria-live="polite">{Math.round(zoom*100)}%</output><button aria-label="Zoom in" disabled={zoom>=3} onClick={()=>setZoom(value=>Math.min(3,Math.round((value+.25)*100)/100))}>+</button><button onClick={fit}>Fit to width</button></div><button className="pp-primary" onClick={onAdd}>+ Add pages</button></div>
    <div className="pp-original-layout"><aside className="pp-original-list" aria-label={`${student}'s pages`}>{pages.map((item,index)=><button key={item.id} aria-label={`View page ${index+1}: ${item.file}`} aria-pressed={page?.id===item.id} onClick={()=>{onSelectPage(item.id);fit();}}><span className={`pp-original-thumb ${item.issue==='quality'?'pp-original-blurred':''}`} aria-hidden="true">{renderPage(item)}</span><span><b>Page {index+1}</b><small>{item.file}</small>{item.issue==='quality'&&<em>Check image quality</em>}</span></button>)}</aside><div className="pp-original-viewport" ref={viewport} aria-label="Original page preview"><div className="pp-original-surface" style={{width:540*zoom,height:pageHeight*zoom}}><div ref={pageElement} className={`pp-original-page ${page?.issue==='quality'?'pp-original-blurred':''}`} style={{transform:`scale(${zoom})`}}>{page?renderPage(page):<p>No pages for this student yet.</p>}</div></div></div></div>
    <div className="pp-original-page-actions"><div><b>{page?.file??'No page selected'}</b><small>{page?.issue==='quality'?'This page may be blurry. Replace it with a clearer image.':'Page unclear? Upload a clearer copy. Only this student’s work will be reprocessed.'}</small></div><button disabled={!page} onClick={()=>{if(page)onReplace(page.id);}}>Replace this page</button></div>
    <footer className="pp-dialog-footer"><span>All pages are assigned to {student}.</span><button onClick={onBack}>Back to scorecard</button></footer>
  </>;
}
