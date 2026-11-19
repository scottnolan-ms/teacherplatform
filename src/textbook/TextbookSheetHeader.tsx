import {ClassAvatar} from '../dashboard/Dashboard';
import type {DashboardClass} from '../dashboard/model';

export function TextbookSheetHeader({item,title,closeLabel,onClose}:{item:DashboardClass;title:string;closeLabel:string;onClose:()=>void}){
 return <header className="tp-textbook-sheet-header">
  <ClassAvatar item={item}/>
  <div><small>{item.name}</small><h2>{title}</h2></div>
  <button type="button" className="tp-textbook-sheet-close" aria-label={closeLabel} onClick={onClose}>×</button>
 </header>;
}
