import { useState } from 'react';
import type { AdaptiveStage } from './adaptive-data';
export function readProgressiveStage():AdaptiveStage {const value=sessionStorage.getItem('progressive-results-stage');return value==='After due date'||value==='After expiry'?value:'Before due date'}
export function rememberProgressiveStage(value:string){if(['Before due date','After due date','After expiry'].includes(value))sessionStorage.setItem('progressive-results-stage',value)}
export function useProgressiveStage(){const [stage,setStage]=useState(readProgressiveStage);return [stage,(value:AdaptiveStage)=>{rememberProgressiveStage(value);setStage(value)}] as const}
