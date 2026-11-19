import {createContext,useContext} from 'react';
export type DistributionLayout='stacked'|'counts'|'dots'|'symbols';
export const masteryPalettes={
 '01':'01 · Purple and tan',
 '02':'02 · Peach, gold and mint',
 '03':'03 · Warm to green',
 '04':'04 · Orange, turquoise and green',
} as const;
export type MasteryPalette=keyof typeof masteryPalettes;
const defaultMasteryPalette:MasteryPalette='04';
export function masteryPalette(value:string|null):MasteryPalette{
 return value==='01'||value==='02'||value==='03'?value:defaultMasteryPalette;
}
export type EvidenceScenario='current'|'split'|'limited'|'none';
export const EvidenceOptions=createContext<{layout:DistributionLayout;compact:boolean;scenario:EvidenceScenario;mastery:MasteryPalette;hideCounts:boolean;subtleExpanded:boolean}>({layout:'counts',compact:false,scenario:'current',mastery:defaultMasteryPalette,hideCounts:false,subtleExpanded:false});
export const useEvidenceOptions=()=>useContext(EvidenceOptions);
export {scenarioValue} from './model';
