export const paperTaskId = 'paper-plus-linear-equations';
export const paperTaskPath = `/classes/dash-7a/tasks/${paperTaskId}/report`;
export const stages = ['Awaiting work', 'Uploading', 'Matching', 'Review matches', 'Transcribing', 'Marking', 'Results ready', 'Upload issue'] as const;
export type Stage = typeof stages[number];
export type Sheet = {id: number; file: string; student: string; method: string; issue?: 'name' | 'quality'; excluded?: boolean; preview?: string; sourceStudent?:string};
export type Batch = {id: number; label: string; group: string; date: string; stage: Stage; progress: number; sheets: Sheet[]};
export type PageCaptureIntent = {kind:'add';student:string}|{kind:'replace';student:string;pageId:number};
export type StudentWorkUpdate = {id:number;student:string;kind:'add'|'replace'|'move-in'|'move-out'|'undo';previousPercent:number|null;counterpart?:string;pageCount?:number};
export function studentWorkState(batches:Batch[],student:string) {
  const relevant=batches.filter(batch=>batch.sheets.some(sheet=>sheet.student===student&&!sheet.excluded));
  const pages=studentPages(batches,student);
  const pending=relevant.filter(batch=>batch.stage!=='Results ready');
  const priority:Stage[]=['Upload issue','Awaiting work','Uploading','Matching','Review matches','Transcribing','Marking'];
  const stage=priority.find(stage=>pending.some(batch=>batch.stage===stage))??(pages.some(page=>page.issue)?'Review matches':pages.length?'Results ready':'Awaiting work');
  return {pages,relevant,pending,stage,ready:pages.length>0&&stage==='Results ready'};
}
export function advanceBatches(batches: Batch[], reviewFirst: boolean): Batch[] {
  if (!batches.some(batch => ['Uploading', 'Matching', 'Transcribing', 'Marking'].includes(batch.stage))) return batches;
  return batches.map(batch => {
    if (!['Uploading', 'Matching', 'Transcribing', 'Marking'].includes(batch.stage)) return batch;
    if (batch.progress < 100) return {...batch, progress: Math.min(100, batch.progress + (batch.stage === 'Uploading' ? 8 : batch.stage === 'Matching' ? 5 : 3))};
    const stage = batch.stage === 'Uploading' ? 'Matching' : batch.stage === 'Matching' ? reviewFirst || matchingIssues(batch.sheets).length ? 'Review matches' : 'Transcribing' : batch.stage === 'Transcribing' ? 'Marking' : 'Results ready';
    return {...batch, stage, progress: 0};
  });
}
export function markedStudents(batches: Batch[]) {return [...new Set(batches.flatMap(batch=>acceptedSheets(batch.sheets).map(sheet=>sheet.student)))].filter(student=>studentWorkState(batches,student).ready);}
export const demoSheets = (): Sheet[] => [
  {id: 1, file: '7A-scans.pdf · page 1', student: 'Emma Johnson', method: 'Student QR code'},
  {id: 2, file: '7A-scans.pdf · page 2', student: 'Liam Martinez', method: 'Student QR code'},
  {id: 3, file: '7A-scans.pdf · page 3', student: 'Sophia Okonkwo', method: 'Handwritten name'},
  {id: 4, file: '7A-scans.pdf · page 4', student: 'Noah Okafor', method: 'Handwritten name'},
  {id: 5, file: 'IMG_2405.jpg', student: '', method: 'Name looks like “Olivia”', issue: 'name'},
  {id: 6, file: 'IMG_2406.jpg', student: '', method: 'Photo is blurred', issue: 'quality'},
];
export function matchingIssues(sheets: Sheet[]) {return sheets.filter(s => !s.excluded && (!s.student || s.issue));}
export function acceptedSheets(sheets: Sheet[]) {return sheets.filter(s => !s.excluded && s.student && !s.issue);}
export function demoMarks(studentIndex: number) {return [2, 2 - studentIndex % 3, 2];}
export function demoScore(studentIndex: number) {return Math.round(demoMarks(studentIndex).reduce((sum, mark) => sum + mark, 0) / 6 * 100);}
export function uploadedSheets(files: File[], start: number): Sheet[] {
  return files.map((file, i) => ({id: start + i, file: file.name, student: '', method: file.type === 'application/pdf' ? 'PDF · confirm student in this demo' : 'Confirm student in this demo', issue: 'name', preview: file.type.startsWith('image/') && file.type !== 'image/tiff' ? URL.createObjectURL(file) : undefined}));
}

export function assignSheets(sheets: Sheet[], student: string): Sheet[] {return student === 'All students' ? sheets : sheets.map(sheet => ({...sheet, student, issue: undefined, method: 'Assigned by you'}));}

export function studentPages(batches: Batch[], student: string): Sheet[] {
  return batches.flatMap(batch => batch.sheets.filter(sheet => sheet.student === student && !sheet.excluded));
}

// Reprocess the replacement separately so classmates keep their marked results.
export function replaceStudentPage(batches: Batch[], student: string, pageId: number, replacement: Batch): Batch[] {
  if (!replacement.sheets.length || !batches.some(batch => batch.sheets.some(sheet => sheet.id === pageId && sheet.student === student)) || replacement.sheets.some(sheet => sheet.student !== student)) return batches;
  return [...batches.map(batch => batch.sheets.some(sheet => sheet.id === pageId && sheet.student === student) ? {...batch, sheets: batch.sheets.filter(sheet => sheet.id !== pageId || sheet.student !== student)} : batch).filter(batch => batch.sheets.length > 0), replacement];
}

export function applyStudentCapture(batches:Batch[],intent:PageCaptureIntent,batch:Batch):Batch[] {
  if (!batch.sheets.length || intent.kind==='replace'&&batch.sheets.length!==1) return batches;
  const scoped={...batch,sheets:assignSheets(batch.sheets,intent.student)};
  return intent.kind==='replace'?replaceStudentPage(batches,intent.student,intent.pageId,scoped):[...batches,scoped];
}

export function moveStudentPages(batches:Batch[],pageIds:number[],from:string,to:string,sourceBatch:Batch,destinationBatch:Batch,undoPages?:Sheet[]):Batch[] {
  const ids=new Set(pageIds);
  const pages=studentPages(batches,from).filter(page=>ids.has(page.id));
  // A selection moves as one transaction: never silently move just part of it.
  if(!ids.size||pages.length!==ids.size||!to||from===to||!undoPages&&batches.some(batch=>batch.stage==='Uploading'&&batch.sheets.some(sheet=>ids.has(sheet.id))))return batches;
  const remaining=studentPages(batches,from).filter(sheet=>!ids.has(sheet.id));
  const destination=[...studentPages(batches,to),...pages.map(page=>{
    const original=undoPages?.find(original=>original.id===page.id);
    return original?{...page,student:to,sourceStudent:original.sourceStudent,method:original.method,issue:original.issue}:{...page,student:to,sourceStudent:page.sourceStudent??from,method:`Moved from ${from}`,issue:page.issue==='quality'?'quality' as const:undefined};
  })];
  const stage=(student:string,pages:Sheet[]):Stage=>batches.some(batch=>batch.stage==='Uploading'&&batch.sheets.some(sheet=>sheet.student===student&&!sheet.excluded))?'Uploading':batches.some(batch=>batch.stage==='Matching'&&batch.sheets.some(sheet=>sheet.student===student&&!sheet.excluded))?'Matching':matchingIssues(pages).length?'Review matches':'Transcribing';
  const untouched=batches.map(batch=>batch.sheets.some(sheet=>!sheet.excluded&&(sheet.student===from||sheet.student===to))?{...batch,sheets:batch.sheets.filter(sheet=>sheet.excluded||sheet.student!==from&&sheet.student!==to)}:batch).filter(batch=>batch.sheets.length>0);
  return [...untouched,...(remaining.length?[{...sourceBatch,stage:stage(from,remaining),progress:0,sheets:remaining}]:[]),{...destinationBatch,stage:stage(to,destination),progress:0,sheets:destination}];
}

export function moveStudentPage(batches:Batch[],pageId:number,from:string,to:string,sourceBatch:Batch,destinationBatch:Batch):Batch[] {
  return moveStudentPages(batches,[pageId],from,to,sourceBatch,destinationBatch);
}

// Reverse the selected pages only, preserving work added since the move.
export function undoStudentPagesMove(batches:Batch[],originals:Sheet[],recipient:string,recipientBatch:Batch,originalBatch:Batch):Batch[] {
  const student=originals[0]?.student;
  if(!student||originals.some(page=>page.student!==student))return batches;
  return moveStudentPages(batches,originals.map(page=>page.id),recipient,student,recipientBatch,originalBatch,originals);
}
export function undoStudentPageMove(batches:Batch[],original:Sheet,recipient:string,recipientBatch:Batch,originalBatch:Batch):Batch[] {
  return undoStudentPagesMove(batches,[original],recipient,recipientBatch,originalBatch);
}
