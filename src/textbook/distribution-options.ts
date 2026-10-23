import {createContext,useContext} from 'react';
export type DistributionLayout='stacked'|'counts'|'dots'|'symbols';
export type EvidenceScenario='current'|'split'|'limited'|'none';
export const EvidenceOptions=createContext<{layout:DistributionLayout;compact:boolean;scenario:EvidenceScenario}>({layout:'counts',compact:false,scenario:'current'});
export const useEvidenceOptions=()=>useContext(EvidenceOptions);
export {scenarioValue} from './model';
