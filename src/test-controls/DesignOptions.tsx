import {createContext, useContext, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import './design-options.css';

const InDrawer=createContext(false);

function Sheet({fab,children}:{fab?:boolean;children:ReactNode}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const [closing,setClosing]=useState(false);
 const close=()=>setClosing(true),open=()=>{setClosing(false);dialog.current?.showModal()};
 const icon=<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>;
 return <>{fab?<button className="prototype-fab" aria-label="Prototype design options" title="Prototype design options" onClick={open}>{icon}</button>:<button onClick={open}>Design options</button>}<dialog ref={dialog} className={`prototype-design-sheet ${closing?'is-closing':''}`} aria-labelledby="design-options-title" onCancel={e=>{e.preventDefault();close()}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}}} onAnimationEnd={e=>{if(closing&&e.target===e.currentTarget){dialog.current?.close();setClosing(false)}}}><header><h2 id="design-options-title">Design options</h2><button aria-label="Close design options" onClick={close}>×</button></header><div className="prototype-design-body"><p>Explore UI variants and scenarios. Changes apply immediately.</p>{children}</div><footer><button onClick={close}>Done</button></footer></dialog></>;
}

export function DesignOptions({children}:{children:ReactNode}) {
 // Inside the floating prototype controls the options are already in the drawer.
 const inside=useContext(InDrawer);
 return inside?<>{children}</>:<Sheet>{children}</Sheet>;
}

// Prototype-only controls live behind one floating button so they take no room in the layout being explored.
export function PrototypeControls({children}:{children:ReactNode}) {
 return <Sheet fab><InDrawer.Provider value={true}>{children}</InDrawer.Provider></Sheet>;
}
