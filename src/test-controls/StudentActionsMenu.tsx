import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Link} from 'react-router-dom';
import {ReportIconButton} from './ReportIconButton';
import {StudentAvatar} from './StudentAvatar';
import './student-actions-menu.css';
export type StudentActionItem={label:string;section:string;icon?:string;onClick?:()=>void;href?:string;disabled?:boolean};
export function StudentActionsMenu({name,avatarUrl,actions}:{name:string;avatarUrl?:string;actions:StudentActionItem[]}){
 const [position,setPosition]=useState<{left:number;top:number}|null>(null),trigger=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null);
 const close=()=>{setPosition(null);trigger.current?.focus({preventScroll:true})};
 useEffect(()=>{
  if(!position)return;
  menu.current?.querySelector<HTMLElement>('button:not(:disabled),a')?.focus({preventScroll:true});
  const dismiss=()=>setPosition(null);
  window.addEventListener('resize',dismiss);
  return()=>window.removeEventListener('resize',dismiss);
 },[position]);
 return <><ReportIconButton icon="more" label={`More actions for ${name}`} ref={trigger} aria-haspopup="menu" aria-expanded={!!position} onClick={()=>{if(position){close();return}const r=trigger.current!.getBoundingClientRect();const height=76+actions.length*40+new Set(actions.map(a=>a.section)).size*28;setPosition({left:Math.max(8,Math.min(r.right-264,window.innerWidth-272)),top:Math.max(8,Math.min(r.bottom+6,window.innerHeight-height-8))})}}/>{position&&createPortal(<div className="student-actions-layer" onKeyDown={e=>{
  e.stopPropagation();const items=Array.from(menu.current?.querySelectorAll<HTMLElement>('[role=menuitem]:not(:disabled)')??[]),index=items.indexOf(document.activeElement as HTMLElement);
  if(e.key==='Escape'){e.preventDefault();close()}
  if(['ArrowDown','ArrowUp','Home','End','Tab'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowUp'||e.key==='Tab'&&e.shiftKey?-1:1)+items.length)%items.length;items[next]?.focus()}
 }}><div className="student-actions-dismiss" onClick={close}/><div className="student-actions-menu" role="menu" aria-label={`Actions for ${name}`} ref={menu} style={position}><header><StudentAvatar name={name} src={avatarUrl}/><strong>{name}</strong></header>{actions.map((action,i)=><div key={action.label}>{(i===0||actions[i-1].section!==action.section)&&<h4>{action.section}</h4>}{action.href?<Link role="menuitem" to={action.href} onClick={close}>{action.icon&&<i aria-hidden="true" style={{maskImage:`url(${action.icon})`}}/>}{action.label}</Link>:<button role="menuitem" disabled={action.disabled} onClick={()=>{close();action.onClick?.()}}>{action.icon&&<i aria-hidden="true" style={{maskImage:`url(${action.icon})`}}/>}{action.label}</button>}</div>)}</div></div>,document.body)}</>;
}
