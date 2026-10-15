import {useRef, useState} from 'react';
import type {ReactNode} from 'react';
import './design-options.css';

export function DesignOptions({children}:{children:ReactNode}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const [closing,setClosing]=useState(false);
 const close=()=>setClosing(true);
 return <><button onClick={()=>{setClosing(false);dialog.current?.showModal()}}>Design options</button><dialog ref={dialog} className={`prototype-design-sheet ${closing?'is-closing':''}`} aria-labelledby="design-options-title" onCancel={e=>{e.preventDefault();close()}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}}} onAnimationEnd={e=>{if(closing&&e.target===e.currentTarget){dialog.current?.close();setClosing(false)}}}><header><h2 id="design-options-title">Design options</h2><button aria-label="Close design options" onClick={close}>×</button></header><div className="prototype-design-body"><p>Explore UI variants. Changes apply immediately.</p>{children}</div><footer><button onClick={close}>Done</button></footer></dialog></>;
}
