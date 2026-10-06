import {presetFilters} from './task-list-model';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ClassChrome} from './ClassChrome';
import ClassContent from './ClassContent';
import type {DashboardClass,Bucket} from './model';
import {useProgressiveStage} from '../test-controls/progressive-scenario';
import '../pages/class-workspace.css';
export default function ClassSheetContent({item,initialSection,preset,onClose,onReport,onAssign}:{item:DashboardClass;initialSection:string;preset?:Bucket;onClose:()=>void;onReport:(id:string)=>void;onAssign:()=>void}){
 const [section,setSection]=useState(initialSection),[stage]=useProgressiveStage(),[filters,setFilters]=useState(()=>presetFilters(preset??'All'));
 return <div className="class-sheet-shared"><ClassChrome item={item} abbreviation={item.name.match(/\d+[A-Z]/i)?.[0]??String(item.year)} section={section} onSection={setSection} headerActions={<><Link className="cw-full-page" to={`/classes/${item.id}${section==='tasks'?`/tasks?preset=${encodeURIComponent(filters.preset??'All')}&filters=${encodeURIComponent(JSON.stringify(filters))}`:`?tab=${section}`}`}>View full page →</Link><button className="dash-close" aria-label="Close dashboard sheet" onClick={onClose}><i/></button></>}/><ClassContent item={item} section={section} stage={stage} preset={preset} filters={filters} onFiltersChange={setFilters} onSection={setSection} onReport={onReport} onAssign={onAssign}/></div>;
}
