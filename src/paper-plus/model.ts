export const paperTaskId = 'paper-plus-linear-equations';
export const paperTaskPath = `/classes/dash-7a/tasks/${paperTaskId}/report`;
export const stages = ['Awaiting work', 'Uploading', 'Matching', 'Review matches', 'Transcribing', 'Marking', 'Results ready', 'Upload issue'] as const;
export type Stage = typeof stages[number];
export type Sheet = {id: number; file: string; student: string; method: string; issue?: 'name' | 'quality'; excluded?: boolean; preview?: string};
export type Batch = {id: number; label: string; group: string; date: string; stage: Stage; progress: number; sheets: Sheet[]};
export type PageCaptureIntent = {kind:'add';student:string}|{kind:'replace';student:string;pageId:number};
export function advanceBatches(batches: Batch[], reviewFirst: boolean): Batch[] {
  if (!batches.some(batch => ['Uploading', 'Matching', 'Transcribing', 'Marking'].includes(batch.stage))) return batches;
  return batches.map(batch => {
    if (!['Uploading', 'Matching', 'Transcribing', 'Marking'].includes(batch.stage)) return batch;
    if (batch.progress < 100) return {...batch, progress: Math.min(100, batch.progress + (batch.stage === 'Uploading' ? 8 : batch.stage === 'Matching' ? 5 : 3))};
    const stage = batch.stage === 'Uploading' ? 'Matching' : batch.stage === 'Matching' ? reviewFirst || matchingIssues(batch.sheets).length ? 'Review matches' : 'Transcribing' : batch.stage === 'Transcribing' ? 'Marking' : 'Results ready';
    return {...batch, stage, progress: 0};
  });
}
export function markedStudents(batches: Batch[]) {return [...new Set(batches.filter(b => b.stage === 'Results ready').flatMap(b => acceptedSheets(b.sheets).map(s => s.student)))];}
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
