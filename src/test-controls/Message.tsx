import type {ReactNode} from 'react';
import './message.css';
export function Message({tone='info',title,children,id,inline=false}:{tone?:'info'|'warning'|'error'|'success';title?:string;children:ReactNode;id?:string;inline?:boolean}){
 return <div id={id} className={`task-message ${tone} ${inline?'inline':''}`} role={tone==='error'?'alert':'status'}><span className="message-symbol" aria-hidden="true" style={{maskImage:`url(/assets/messages/${tone}.svg)`}}/><div>{title&&<strong>{title}</strong>}<div>{children}</div></div></div>;
}
