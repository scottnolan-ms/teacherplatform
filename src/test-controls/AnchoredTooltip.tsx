import {useLayoutEffect,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {createPortal} from 'react-dom';

export function AnchoredTooltip({anchor,id,className,children,role='tooltip'}:{anchor:DOMRect;id:string;className:string;children:ReactNode;role?:'tooltip'|'dialog'}) {
 const ref=useRef<HTMLDivElement>(null);
 const [position,setPosition]=useState({left:anchor.left,top:anchor.bottom+8});
 useLayoutEffect(()=>{const box=ref.current?.getBoundingClientRect();if(!box)return;const above=anchor.top-box.height-8;setPosition({left:Math.max(8,Math.min(window.innerWidth-box.width-8,anchor.left+(anchor.width-box.width)/2)),top:above>=8?above:Math.min(anchor.bottom+8,window.innerHeight-box.height-8)});},[anchor]);
 return createPortal(<div ref={ref} id={id} role={role} className={className} style={position}>{children}</div>,document.body);
}
