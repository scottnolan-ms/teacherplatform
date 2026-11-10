export type ReportFlag = {
  id: string;
  kind: 'integrity' | 'edited' | 'reassigned';
  label: string;
  at?: string;
  question?: string;
  detail?: string;
  signal?: 'exit' | 'time' | 'paste';
  seconds?: number;
};
export interface ReportActivity { flags?: ReportFlag[]; timeAwaySeconds?: number }
export function hasReportFlags(student: ReportActivity) { return !!student.flags?.length; }
export function timeAway(student: ReportActivity) {
  const seconds = student.timeAwaySeconds ?? (student.flags?.some(f=>f.signal==='time') ? student.flags.reduce((n,f)=>n+(f.signal==='time'?f.seconds??0:0),0) : undefined);
  return seconds === undefined ? '—' : `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
}
export function activityOrder(order: string[]) {
  const rest = order.filter(id=>id!=='flags'&&id!=='timeAway');
  const index = rest.findIndex(id=>['start','due','expires'].includes(id));
  rest.splice(index<0?rest.length:index,0,'flags','timeAway');
  return rest;
}
export function activityHidden(isTest: boolean, hasFlags: boolean, visibility: Record<string,boolean> = {}) {
  return ['flags','timeAway'].filter(id=>!(visibility[id]??(isTest||hasFlags)));
}
