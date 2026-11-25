import {TableSelectAll} from '../components/TableSelectAll';
import {useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import qrcode from 'qrcode-generator';
import {ReportHeader} from '../test-controls/ReportHeader';
import {PrototypeControls} from '../test-controls/DesignOptions';
import {studentNames} from '../dashboard/model';
import {advanceBatches, assignSheets, studentPages, studentWorkState, moveStudentPages, undoStudentPagesMove, applyStudentCapture, markedStudents, acceptedSheets, demoMarks, demoSheets, matchingIssues, stages, uploadedSheets} from './model';
import type {Batch, Sheet, Stage, PageCaptureIntent, StudentWorkUpdate} from './model';
import '../test-controls/test-controls.css';
import '../test-controls/report-controls.css';
import '../test-controls/recommendations.css';
import '../test-controls/report-views.css';
import {TableDisplayProvider, DisplayPanel, DisplayRow, DisplayName, DisplayAvatar} from '../test-controls/TableDisplay';
import {AveragesLabel} from '../test-controls/StudentAverages';
import {OrganiseStudents} from '../test-controls/PrototypeNavigation';
import {StudentOriginalPages} from './StudentOriginalPages';
import {PaperScorecard} from './PaperScorecard';
import type {PaperMarkEdits} from './PaperScorecard';
import {RecommendationCard, ResultsAccess} from '../test-controls/Recommendations';
import type {Recommendation} from '../test-controls/Recommendations';
import {PageMoveToast} from './PageMoveToast';
import './paper-plus.css';

type PaperScenario = Stage | 'Mixed batches' | 'Preparing to print';
const scenarioLabel = (value: PaperScenario) => value === 'Awaiting work' ? 'Awaiting submissions' : value;
type Modal = 'upload' | 'phone' | 'camera' | 'print' | 'guide' | 'review' | 'scorecard' | 'page' | 'responses' | 'release' | 'move-page' | null;
const names = studentNames.slice(0, 28);
const supported = /\.(jpe?g|png|tiff?|pdf)$/i;
function QR({value}: {value: string}) {
  const code = qrcode(0, 'M'); code.addData(value); code.make();
  return <span className="pp-qr" role="img" aria-label="QR code" dangerouslySetInnerHTML={{__html: code.createSvgTag({cellSize: 3, margin: 3, scalable: true})}}/>;
}
function Glyph({kind}: {kind: string}) {
  if (kind === 'upload') return <i className="pp-capture-icon" aria-hidden="true"/>;
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === 'upload' ? <><path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/></> : kind === 'phone' ? <><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4M10 5h4"/></> : kind === 'camera' ? <><path d="m8 6 2-3h4l2 3h5v14H3V6z"/><circle cx="12" cy="12" r="4"/></> : kind === 'print' ? <><path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 14h10v7H7zM17 11h1"/></> : <><path d="M5 3h11l4 4v14H5zM15 3v5h5M8 12h8M8 16h6"/></>}</svg>;
}
function Paper({name = 'Olivia', blank = false, qr = false, preview, filled = true, questionsOnly = false}: {name?: string; blank?: boolean; qr?: boolean; preview?: string; filled?: boolean; questionsOnly?: boolean}) {
  if (preview) return <img className="pp-photo-preview" src={preview} alt="Uploaded student work"/>;
  return <div className={`pp-paper ${blank ? 'pp-letterhead' : ''} ${questionsOnly ? 'pp-questions-only' : ''}`}><header><img className="pp-brand-logo" src="/assets/paper-plus/mathspace-logo.svg" alt="Mathspace"/>{qr && <QR value={`paper-plus:7a:linear-equations:${name}`}/>}</header><div className="pp-paper-title">{blank ? 'Working space' : 'Linear equations'}</div>{!questionsOnly && <div className="pp-paper-name">Name: <span>{blank || !name ? '____________________________' : name}</span></div>}<small>7A Math · Paper+ · {blank ? 'Date: ______________' : questionsOnly ? 'Write your answers on separate paper.' : 'Show your working for each question.'}</small>{Array.from({length: blank ? 8 : 3}, (_, i) => <div className="pp-paper-question" key={i}>{!blank && <><b>{i + 1}. Solve {['2x + 5 = 17', '3(x − 2) = 15', '4x + 3 = 2x + 11'][i]}</b>{filled && <span className="pp-handwriting">{i === 1 && demoMarks(Math.max(0, names.indexOf(name)))[1] < 2 ? '3x − 2 = 15' : ['2x = 12', '3x − 6 = 15', '2x = 8'][i]}<br/>{i === 1 && demoMarks(Math.max(0, names.indexOf(name)))[1] < 2 ? '3x = 17     x = 17/3' : ['x = 6', '3x = 21     x = 7', 'x = 4'][i]}</span>}</>}</div>)}<footer>mathspace.co · {blank ? 'Write your full name on every sheet' : 'Linear equations · page 1 of 1'}</footer></div>;
}
function Dialog({title, onClose, children, wide = false}: {title: string; onClose: () => void; children: ReactNode; wide?: boolean}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {const previous = document.activeElement as HTMLElement; ref.current?.showModal(); return () => {previous?.focus()};}, []);
  return <dialog ref={ref} className={`pp-dialog ${wide ? 'pp-wide' : ''}`} aria-label={title} onCancel={e => {e.preventDefault(); onClose();}} onClick={e => {if (e.target === e.currentTarget) {const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose();}}}><header className="pp-dialog-heading"><div><span className="pp-eyebrow">PAPER+</span><h2>{title}</h2></div><button onClick={onClose} aria-label={`Close ${title}`}>×</button></header>{children}</dialog>;
}

export default function PaperPlus() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<number | null>(null);
  const [captureDraft, setCaptureDraft] = useState<Sheet[]>([]);
  const [uploadGroup, setUploadGroup] = useState('Whole class');
  const [uploadDate, setUploadDate] = useState('2026-11-17');
  const [uploadOwner, setUploadOwner] = useState('Teacher');
  const [uploadStudent, setUploadStudent] = useState('All students');
  const [scenarioName, setScenarioName] = useState<PaperScenario>('Awaiting work');
  const [printPreparation, setPrintPreparation] = useState<number | null>(null);
  const preparingPrint = printPreparation !== null;
  useEffect(() => {
    if (printPreparation === null) return;
    const timer = window.setTimeout(() => {setPrintPreparation(null); setScenarioName('Awaiting work');}, 4 * 60 * 1000);
    return () => window.clearTimeout(timer);
  }, [printPreparation]);
  const [released, setReleased] = useState(false);
  const [recommendationIndex, setRecommendationIndex] = useState(0);
  const [markEdits, setMarkEdits] = useState<PaperMarkEdits>({});
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [sort, setSort] = useState('first-asc');
  const [dragging, setDragging] = useState(false);
  const nextId = useRef(0);
  const activeBatch = batches.find(b => b.id === activeBatchId) ?? batches.at(-1);
  const stage: Stage = activeBatch?.stage ?? 'Awaiting work';
  const sheets = activeBatch?.sheets ?? [];
  const allSheets = batches.flatMap(b => b.sheets);
  const markedNames = markedStudents(batches);
  const allMatched = acceptedSheets(allSheets);
  const allIssues = batches.filter(batch => batch.stage === 'Review matches').flatMap(batch => matchingIssues(batch.sheets));
  const matchedNames = [...new Set(batches.filter(batch => !['Uploading', 'Matching', 'Upload issue'].includes(batch.stage)).flatMap(batch => acceptedSheets(batch.sheets).map(sheet => sheet.student)))];
  const receivedNames = [...new Set(allMatched.map(sheet => sheet.student))];
  const setSheets = (update: Sheet[] | ((current: Sheet[]) => Sheet[])) => setBatches(current => current.map(b => b.id === activeBatch?.id ? {...b, sheets: typeof update === 'function' ? update(b.sheets) : update} : b));
  const [modal, setModal] = useState<Modal>(null);
  const [scorecardOpen,setScorecardOpen]=useState(false);
  const [originalsOpen,setOriginalsOpen]=useState(false);
  const [originalPageId,setOriginalPageId]=useState<number>();
  const [pageCaptureIntent,setPageCaptureIntent]=useState<PageCaptureIntent|null>(null);
  const [workUpdates,setWorkUpdates]=useState<StudentWorkUpdate[]>([]);
  const [moveToast,setMoveToast]=useState<{id:number;pages:Sheet[];recipient:string;undone:boolean}|null>(null);
  const [movingPageIds,setMovingPageIds]=useState<number[]>([]);
  const [moveDestination,setMoveDestination]=useState('');
  const [auto, setAuto] = useState(true);
  const [reviewFirst, setReviewFirst] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All students');
  const [tab, setTab] = useState('Students');
  const [selected, setSelected] = useState(0);
  const [previewSheet, setPreviewSheet] = useState<Sheet | null>(null);
  const [printType, setPrintType] = useState('With working space');
  const [includeNames, setIncludeNames] = useState(true);
  const openPrint = (format: string) => {setPrintType(format); setModal('print');};
  const [printNames, setPrintNames] = useState<string[]>(names);
  const [notice, setNotice] = useState('');
  const [fileError, setFileError] = useState('');
  const [phoneCount, setPhoneCount] = useState(0);
  const [session] = useState(() => Math.random().toString(36).slice(2, 10));
  const fileInput = useRef<HTMLInputElement>(null);
  const previews = useRef<string[]>([]);
  const matched = acceptedSheets(sheets);
  const issues = matchingIssues(sheets);
  const studentsWithWork = [...new Set(matched.map(s => s.student))];
  const done = stage === 'Results ready';
  const originalMarks = (name: string) => demoMarks(names.indexOf(name));
  const marks = (name: string) => originalMarks(name).map((mark, i) => markEdits[`${name}:${i+1}`]?.mark ?? mark);
  const score = (name: string) => Math.round(marks(name).reduce((a,b)=>a+b,0) / 6 * 100);
  const questionAverage = (question: number) => markedNames.length ? markedNames.reduce((sum, name) => sum + marks(name)[question], 0) / markedNames.length : 0;
  const changeStage = (next: Stage) => setBatches(current => current.map(b => b.id === activeBatch?.id ? {...b, stage: next, progress: 0} : b));
  const sampleSheets = (offset: number) => demoSheets().map((sheet, i) => ({...sheet, id: ++nextId.current, student: i < 4 ? names[(offset + i) % names.length] : '', method: i === 4 ? `Name looks like “${names[(offset + 4) % names.length].split(' ')[0]}”` : sheet.method}));
  const scenario = (next: PaperScenario) => {
    setPrintPreparation(current => next === 'Preparing to print' ? (current ?? 0) + 1 : null);
    setMoveToast(null);setWorkUpdates([]);setMovingPageIds([]);setMoveDestination('');setModal(null); setScorecardOpen(false);setOriginalsOpen(false);setPageCaptureIntent(null);setPhoneCount(0); setSelectedStudents([]); setScenarioName(next); setNotice(''); setRecommendationIndex(0); setUploadStudent('All students'); setReleased(false); setMarkEdits({});
    if (next === 'Awaiting work' || next === 'Preparing to print') {setBatches([]); setActiveBatchId(null); return;}
    const make = (state: Stage, offset: number, date: string): Batch => ({id: ++nextId.current, label: `Batch ${offset / 6 + 1}`, group: offset ? 'Group 2' : 'Group 1', date, stage: state, progress: 0, sheets: sampleSheets(offset).map((sheet, i) => state === 'Transcribing' || state === 'Marking' || state === 'Results ready' ? {...sheet, student: names[(offset + i) % names.length], issue: undefined} : sheet)});
    const nextBatches = next === 'Mixed batches' ? [make('Results ready', 0, '2026-11-16'), make('Marking', 6, '2026-11-17'), make('Review matches', 12, '2026-11-17')] : [make(next, 0, '2026-11-17')];
    setBatches(nextBatches); setActiveBatchId(nextBatches.at(-1)!.id);
  };
  const previousResult=(student:string)=>!studentPages(batches,student).length?null:markedNames.includes(student)?score(student):workUpdates.filter(update=>update.student===student).at(-1)?.previousPercent??null;
  const addBatch = (work: Sheet[], initial: Stage = 'Uploading', student = uploadStudent) => {
    if(pageCaptureIntent){
      if(pageCaptureIntent.kind==='replace'&&work.length!==1){setFileError('Choose or capture one page to replace the selected page.');return;}
      const latest=batches.filter(batch=>batch.sheets.some(sheet=>sheet.student===pageCaptureIntent.student)).at(-1);
      const batch:Batch={id:++nextId.current,label:`Batch ${batches.length+1}`,group:latest?.group??'Whole class',date:uploadDate||'2026-11-17',stage:initial,progress:0,sheets:work};
      setWorkUpdates(current=>[...current,{id:batch.id,student:pageCaptureIntent.student,kind:pageCaptureIntent.kind,previousPercent:previousResult(pageCaptureIntent.student)}]);
      setBatches(current=>applyStudentCapture(current,pageCaptureIntent,batch));setActiveBatchId(batch.id);setOriginalPageId(batch.sheets[0]?.id);setModal(null);setPageCaptureIntent(null);setCaptureDraft([]);setPhoneCount(0);return;
    }
    const id = ++nextId.current;
    setBatches(current => [...current, {id, label: `Batch ${current.length + 1}`, group: uploadGroup, date: uploadDate || '2026-11-17', stage: initial, progress: 0, sheets: assignSheets(work, student)}]);
    const assigned=assignSheets(work,student);setWorkUpdates(current=>[...current,...[...new Set(assigned.filter(sheet=>sheet.student).map(sheet=>sheet.student))].map(name=>({id,student:name,kind:'add' as const,previousPercent:previousResult(name)}))]);
    setActiveBatchId(id); setModal(null);
  };
  useEffect(() => () => {previews.current.forEach(url => URL.revokeObjectURL(url));}, []);
  useEffect(() => {
    if (!auto) return;
    const timer = window.setInterval(() => setBatches(current => advanceBatches(current, reviewFirst)), 300);
    return () => clearInterval(timer);
  }, [auto, reviewFirst]);
  useEffect(() => {
    const channel = new BroadcastChannel(`paper-plus-${session}`);
    channel.onmessage = e => {if (e.data?.kind === 'capture') setPhoneCount(c => pageCaptureIntent?.kind==='replace'?Math.min(1,c+1):c+1);};
    return () => channel.close();
  }, [session,pageCaptureIntent?.kind]);
  const upload = (files: FileList | File[], student = uploadStudent) => {
    const valid = Array.from(files).filter(f => supported.test(f.name));
    if (!valid.length) {setFileError('Choose a JPEG, PNG, TIFF or PDF file.'); return;}
    setFileError(valid.length < files.length ? 'Some files were skipped. Use JPEG, PNG, TIFF or PDF.' : '');
    const next = uploadedSheets(valid, nextId.current+1); nextId.current+=valid.length; next.forEach(s => {if (s.preview) previews.current.push(s.preview);});
    addBatch(next, 'Uploading', student);
  };
  const startDemo = () => addBatch(uploadStudent === 'All students' ? sampleSheets(batches.length * 6) : [{id:++nextId.current,file:`${uploadStudent} · page 1.jpg`,student:uploadStudent,method:'Assigned by you'}]);
  const patch = (id: number, update: Partial<Sheet>) => setSheets(current => current.map(s => s.id === id ? {...s, ...update} : s));
  const phoneUrl = `${window.location.origin}/prototypes/paper-plus/phone?session=${session}&student=${encodeURIComponent(uploadStudent)}&mode=${pageCaptureIntent?.kind??'add'}`;
  const namedWorksheets = printType === 'With working space' && includeNames;
  const printable = namedWorksheets ? printNames : [''];
  const activeName = names[selected];
  const visibleNames = names.filter(name => name.toLowerCase().includes(query.toLowerCase())).filter(name => filter === 'All students' || (filter === 'Work received' ? receivedNames.includes(name) : filter === 'Marked' ? markedNames.includes(name) : !receivedNames.includes(name))).sort((a, b) => {const key = (name: string) => sort.startsWith('last') ? name.split(' ').at(-1)! : name; return key(a).localeCompare(key(b)) * (sort.endsWith('desc') ? -1 : 1);});
  const selectAll = <TableSelectAll
    rowCount={visibleNames.length}
    selectedCount={visibleNames.filter(name => selectedStudents.includes(name)).length}
    onChange={checked => setSelectedStudents(current => checked ? [...new Set([...current, ...visibleNames])] : current.filter(name => !visibleNames.includes(name)))}
  />;
  const average = markedNames.length ? Math.round(markedNames.reduce((sum, name) => sum + score(name), 0) / markedNames.length) : null;
  const columns = ['paperWork', 'status', 'results', 'marks', 'group'];
  const openReview = (batch: Batch) => {setActiveBatchId(batch.id); setModal('review');};
  const openUpload = (student = 'All students') => {setPageCaptureIntent(null);setUploadStudent(student); setFileError(''); setModal('upload');};
  const openCamera = () => {setCaptureDraft([]); setModal('camera');};
  const beginPageCapture = (pageId?:number) => {setPageCaptureIntent(pageId===undefined?{kind:'add',student:activeName}:{kind:'replace',student:activeName,pageId});setUploadStudent(activeName);setFileError('');setCaptureDraft([]);setPhoneCount(0);setModal('upload');};
  const closeCapture = () => {if(pageCaptureIntent&&modal!=='upload'){setModal('upload');return;}setPageCaptureIntent(null);setModal(null);};
  const closeOriginals = () => {setOriginalsOpen(false);setPageCaptureIntent(null);setModal(null);};
  const movingPages=studentPages(batches,activeName).filter(page=>movingPageIds.includes(page.id));
  const moveLabel=movingPages.length===1?'page':`${movingPages.length} pages`;
  const beginMovePage=(ids:number[])=>{setMovingPageIds(ids);setMoveDestination('');setModal('move-page');};
  const confirmMovePage=()=>{
    if(!movingPages.length||movingPages.length!==movingPageIds.length||!moveDestination||moveDestination===activeName)return;
    const batchFor=(student:string,offset:number):Batch=>({id:++nextId.current,label:`Batch ${batches.length+offset}`,group:batches.filter(batch=>batch.sheets.some(sheet=>sheet.student===student)).at(-1)?.group??'Whole class',date:uploadDate||'2026-11-17',stage:'Transcribing',progress:0,sheets:[]});
    const source=batchFor(activeName,1),destination=batchFor(moveDestination,2);
    setWorkUpdates(current=>[...current,{id:source.id,student:activeName,kind:'move-out',pageCount:movingPages.length,counterpart:moveDestination,previousPercent:previousResult(activeName)},{id:destination.id,student:moveDestination,kind:'move-in',pageCount:movingPages.length,counterpart:activeName,previousPercent:previousResult(moveDestination)}]);
    setBatches(current=>moveStudentPages(current,movingPageIds,activeName,moveDestination,source,destination));
    setMoveToast({id:destination.id,pages:movingPages.map(page=>({...page})),recipient:moveDestination,undone:false});
    setOriginalPageId(studentPages(batches,activeName).find(page=>!movingPageIds.includes(page.id))?.id);setModal(null);
  };
  const undoMovePage=()=>{
    if(!moveToast||moveToast.undone)return;
    const {pages,recipient}=moveToast;
    const student=pages[0].student;
    if(!pages.every(page=>studentPages(batches,recipient).some(current=>current.id===page.id))){setMoveToast(null);return;}
    const batchFor=(student:string):Batch=>({id:++nextId.current,label:`Recalculation · ${student}`,group:batches.find(batch=>batch.sheets.some(sheet=>sheet.student===student))?.group??'Whole class',date:uploadDate,stage:'Transcribing',progress:0,sheets:[]});
    const source=batchFor(recipient),destination=batchFor(student);
    setWorkUpdates(current=>[...current,...[{student:recipient,id:source.id,counterpart:student},{student,id:destination.id,counterpart:recipient}].map(update=>({...update,kind:'undo' as const,pageCount:pages.length,previousPercent:previousResult(update.student)}))]);
    setBatches(current=>undoStudentPagesMove(current,pages,recipient,source,destination));
    if(activeName===student)setOriginalPageId(pages[0].id);
    setMoveToast({...moveToast,undone:true});
  };
  const moveNotification=moveToast&&<PageMoveToast key={moveToast.id} pageCount={moveToast.pages.length} originalStudent={moveToast.pages[0].student} recipient={moveToast.recipient} undone={moveToast.undone} complete={[moveToast.pages[0].student,moveToast.recipient].every(student=>{const state=studentWorkState(batches,student);return state.ready||!state.pages.length;})} onUndo={undoMovePage} onDismiss={()=>setMoveToast(null)}/>;
  const viewStudentPages=(student:string)=>{setSelected(names.indexOf(student));setOriginalPageId(undefined);};
  const reviewBatch = batches.find(batch => batch.stage === 'Review matches');
  const recommendations: Recommendation[] = [
    ...(!batches.length ? [{id:'preview',title:'Preview the assessment',description:'Check the questions and print worksheets with student names.',action:'Preview',icon:'paper-preview',tone:'purple'}] : []),
    ...(allIssues.length ? [{id:'review',title:`${allIssues.length} pages need a closer look`,description:'Confirm uncertain student names and check image quality.',action:'Review',icon:'students',tone:'orange'}] : []),
    ...(markedNames.length && !released ? [{id:'release',title:'Release marked results to students',description:'Choose when students can see feedback on their paper work.',action:'Release',icon:'unlock',tone:'green'}] : []),
    ...(markedNames.some(name=>score(name)<80) ? [{id:'support',title:'Review expansion and inverse operations',description:'Use the written responses to plan targeted support.',action:'Review',icon:'results',tone:'purple'}] : []),
    {id:'prepare',title:released?'Plan the next learning step':'Make the next batch easier to match',description:released?'Review their written working before assigning follow-up practice.':'Print names and a student QR code on each worksheet.',action:released?'Review':'Print',icon:released?'results':'paper-preview',tone:'purple'},
  ];
  const recommendation = recommendations[recommendationIndex % recommendations.length];
  const actOnRecommendation = () => {if(recommendation.id==='review'&&reviewBatch) openReview(reviewBatch); else if(recommendation.id==='release')setModal('release'); else if(recommendation.id==='support'||released){setSelected(names.indexOf(markedNames.find(name=>score(name)<80)??markedNames[0]??names[0]));setModal('scorecard');}else if(!preparingPrint) setModal('print');};
  const scenarioValue = preparingPrint && !batches.length ? 'Preparing to print' : scenarioName === 'Mixed batches' ? 'Mixed batches' : stage;
  const chooser = <div className={`pp-capture-chooser ${dragging?'pp-dragging':''}`} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setDragging(false);}} onDrop={e=>{e.preventDefault();setDragging(false);upload(e.dataTransfer.files,modal==='upload'?uploadStudent:'All students');}}><div className="pp-chooser-label"><Glyph kind="upload"/><div><strong>{dragging?'Drop work to upload':'Drop images or a PDF here'}</strong><small>JPEG, PNG, TIFF · PDFs can include multiple students</small></div></div><div className="pp-capture-methods"><button className="pp-primary" onClick={()=>{if(modal!=='upload')setUploadStudent('All students');fileInput.current?.click();}}><Glyph kind="paper"/>Choose files</button><button onClick={()=>{if(modal!=='upload')setUploadStudent('All students');openCamera();}}><Glyph kind="camera"/>Webcam</button><button onClick={()=>{if(modal!=='upload')setUploadStudent('All students');setPhoneCount(0);setModal('phone');}}><Glyph kind="phone"/>Phone</button></div></div>;
  return <TableDisplayProvider taskType="paper-plus" names={names} defaultOrder={columns}><div className="tc-app pp-app"><main className="tc-main pp-main">
    <div className="pp-topline"><Link to="/prototypes">← Prototypes</Link><label>Scenario<select aria-label="Paper+ top bar scenario" value={scenarioValue} onChange={e=>scenario(e.target.value as PaperScenario)}>{[...stages,'Preparing to print','Mixed batches'].map(value=><option key={value} value={value}>{scenarioLabel(value as PaperScenario)}</option>)}</select></label></div>
    <ReportHeader title="Linear equations on paper" className="7A Math" classPath="/classes/dash-7a/tasks" type="Paper+" typeIcon={<Glyph kind="upload"/>} pictogram={<span className="pp-task-pictogram"><span><img src="/assets/paper-plus/scan-pictogram.svg" alt=""/></span></span>} questions={3} skills={2} teacher="Sarah Mitchell (you)" dates={<>17 Nov – 20 Nov 2026</>} actions={<><button disabled={preparingPrint} title={preparingPrint ? 'Preparing your task. Usually ready in about 4 minutes.' : undefined} onClick={() => setModal('print')}><Glyph kind="print"/>{preparingPrint ? 'Preparing print…' : 'Print'}</button><button className="tc-primary" onClick={() => openUpload()}><Glyph kind="upload"/>Add student work</button></>}/>
    {batches.length > 0 && <section className="pp-summary pp-dashboard" aria-label="Task summary"><div className="pp-summary-heading"><h2>{!batches.length?'Task assigned':batches.some(batch=>['Uploading','Matching','Transcribing','Marking'].includes(batch.stage))?'Collecting and processing responses':markedNames.length?'Results':'Collecting responses'}</h2><ResultsAccess released={released} onEdit={()=>setModal('release')}/></div><div className="pp-summary-body"><div className="pp-summary-section"><h3>Summary</h3><div className="pp-summary-tiles">
      <button className="pp-action-tile" aria-label="Manage responses and upload work" onClick={()=>{setUploadStudent('All students');setModal('responses');}}><span>Responses</span><strong><Glyph kind="upload"/>{receivedNames.length} / {names.length}</strong><small>{allSheets.length?`${allSheets.length} ${allSheets.length===1?'page':'pages'} · manage & add`:'Upload or capture work'}</small></button>
      {batches.length>0&&<button onClick={()=>{setTab('Students');setFilter('Work received');}}><span>Matched</span><strong><i className="rc-metadata-icon" style={{maskImage:'url(/assets/report-controls/students.svg)'}}/>{matchedNames.length}</strong></button>}
      {batches.length>0&&<button onClick={()=>setModal('responses')}><span>Transcribed</span><strong><i className="rc-metadata-icon" style={{maskImage:'url(/assets/report-header/questions.svg)'}}/>{new Set(batches.filter(batch=>['Marking','Results ready'].includes(batch.stage)).flatMap(batch=>acceptedSheets(batch.sheets).map(sheet=>sheet.student))).size}</strong></button>}
      {batches.length>0&&<button onClick={()=>{setTab('Students');setFilter('Marked');}}><span>Marked</span><strong><i className="tr-scorecard-icon"/>{markedNames.length} / {receivedNames.length}</strong></button>}
      {allIssues.length>0&&<button className="pp-tile-attention" onClick={()=>{if(reviewBatch)openReview(reviewBatch);}}><span>Need review</span><strong><i className="pp-summary-symbol">!</i>{allIssues.length}</strong></button>}
      {!batches.length&&<button className="pp-due-tile" onClick={()=>setModal('print')}><span>Due</span><strong><i className="rc-metadata-icon" style={{maskImage:'url(/assets/paper-plus/calendar.svg)'}}/>20 Nov · 3:00pm<Glyph kind="print"/></strong><small>Print worksheets or letterhead</small></button>}
      {!batches.length&&<button onClick={()=>setModal('guide')}><span>Who uploads?</span><strong><i className="rc-metadata-icon" style={{maskImage:`url(/assets/report-header/${uploadOwner==='Teacher'?'teacher':'questions'}.svg)`}}/>{uploadOwner}</strong><small>{uploadOwner==='Teacher'?'Batch or individual':'Teacher can help'}</small></button>}
    </div></div><div className="pp-summary-recommendation"><div className="pp-recommendation-heading"><h3>Recommended action</h3><div><button aria-label="Previous recommendation" onClick={()=>setRecommendationIndex(index=>(index+recommendations.length-1)%recommendations.length)}>‹</button><button aria-label="Next recommendation" onClick={()=>setRecommendationIndex(index=>(index+1)%recommendations.length)}>›</button></div></div><RecommendationCard item={recommendation} onClick={actOnRecommendation}/></div></div></section>}
    {!batches.length && <section className="pp-getting-started" aria-label="Get started with Paper+">
      <div className="pp-start-state"><h2>Awaiting submissions</h2><span>0 of {names.length} students</span><ResultsAccess released={released} onEdit={()=>setModal('release')}/></div>
      <div className="pp-start-options">
        <section className="pp-print-start" aria-labelledby="pp-print-heading">
          <div className="pp-print-copy" role="status" aria-live="polite"><h3 id="pp-print-heading"><Glyph kind="print"/>{preparingPrint ? 'Preparing your worksheets' : 'Print for your class'}</h3><p>{preparingPrint ? 'Your print files will be ready in about 4 minutes.' : 'Choose a format for answering on the worksheet or on separate paper.'}</p></div>
          <div className="pp-option-footer"><button className="pp-print-start-button" disabled={preparingPrint} onClick={()=>openPrint('With working space')}><Glyph kind="print"/>Print with working space</button><button className="pp-print-start-button" disabled={preparingPrint} onClick={()=>openPrint('Questions only')}><Glyph kind="paper"/>Print questions only</button><button className="pp-print-start-button" disabled={preparingPrint} onClick={()=>openPrint('Blank letterhead')}><Glyph kind="paper"/>Blank letterhead</button></div>
          <small className="pp-print-note" role="status">{preparingPrint ? 'Preparing print files… You can upload work while you wait.' : 'With working space: add student names or leave the name field blank.'}</small>
        </section>
        <section className="pp-upload-start" aria-labelledby="pp-upload-heading">
          <div className="pp-print-copy"><div className="pp-upload-title"><h3 id="pp-upload-heading"><Glyph kind="upload"/>Upload student work</h3><button className="pp-help-chip" onClick={()=>setModal('guide')} aria-label="Tips for a quick class upload"><span aria-hidden="true">ⓘ</span> Upload tips</button></div><p>We’ll match pages to students and help mark their work.</p></div>
          {chooser}
        </section>
      </div>
    </section>}
    {fileError && <p className="pp-error" role="alert">{fileError}</p>}
    <section className="tc-report pp-report"><div className="tc-report-title"><div className="tc-report-tabs" role="tablist" aria-label="Paper+ report views">{['Students', 'Questions', 'Marks'].map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}><i className="tc-report-tab-icon" aria-hidden="true" style={{maskImage: `url(/assets/report-controls/${t.toLowerCase()}.svg)`}}/>{t}</button>)}</div><DisplayPanel columns={tab === 'Students' ? columns : []} students={tab === 'Students'}/></div><div className="tc-filterbar pp-report-filters">{tab === 'Students' ? <><select aria-label="Filter students by work status" value={filter} onChange={e => setFilter(e.target.value)}>{['All students', 'Work received', 'Marked', 'Awaiting work'].map(status => <option key={status}>{status}</option>)}</select>{selectedStudents.length > 0 && <span className="table-selection-count" role="status">{selectedStudents.length} selected</span>}<input className="tc-search" aria-label="Search students" placeholder="Search students…" value={query} onChange={e => setQuery(e.target.value)}/></> : <span>3 questions · 6 marks available · {markedNames.length} marked students</span>}</div><div className="tc-table-scroll">{tab === 'Students' ? <table><thead><DisplayRow ids={['identity', ...columns]}><th><div className="table-selection-heading">{selectAll}<label className="rp-name-sort">Student {visibleNames.length} / {names.length}<OrganiseStudents value={sort} onChange={setSort}/></label></div></th><th>Work received</th><th>Status</th><th>Result</th><th>Mark</th><th>Task group</th></DisplayRow></thead><tbody><DisplayRow ids={['identity', ...columns]} className="tr-averages"><td><AveragesLabel/></td><td>{allSheets.filter(sheet => !sheet.excluded).length} pages</td><td>{markedNames.length} marked</td><td>{average === null ? '—' : `${average}%`}</td><td>{markedNames.length ? `${(markedNames.reduce((sum, name) => sum + marks(name).reduce((a, b) => a + b, 0), 0) / markedNames.length).toFixed(1)} / 6` : '—'}</td><td>—</td></DisplayRow>{visibleNames.map(name => {
      const work = studentPages(batches,name), hasWork = work.length > 0, marked = markedNames.includes(name);
      const latest = batches.filter(batch => batch.sheets.some(sheet => !sheet.excluded && sheet.student === name)).at(-1);
      const state=studentWorkState(batches,name);
      const status=state.ready?'Marked':state.stage==='Review matches'?'Needs review':state.stage;
      return <DisplayRow key={name} ids={['identity', ...columns]} className={selectedStudents.includes(name) ? 'selected' : ''}><td><div className="tc-student"><input type="checkbox" aria-label={`Select ${name}`} checked={selectedStudents.includes(name)} onChange={e => setSelectedStudents(current => e.target.checked ? [...current, name] : current.filter(n => n !== name))}/><DisplayAvatar name={name}/><strong><DisplayName name={name}/></strong><button className="tr-student-scorecard" aria-label={hasWork?`Open scorecard for ${name}`:`Upload responses for ${name}`} onClick={()=>{if(hasWork){setSelected(names.indexOf(name));setModal('scorecard');}else openUpload(name);}}>{hasWork?<i className="tr-scorecard-icon" aria-hidden="true"/>:<Glyph kind="upload"/>}</button></div></td><td>{hasWork ? `${work.length} ${work.length === 1 ? 'page' : 'pages'}` : '—'}</td><td><span className={`pp-chip ${status === 'Marked' ? 'pp-green' : hasWork ? 'pp-purple' : ''}`}>{status}</span></td><td>{marked ? <span className={`tr-result ${score(name) >= 80 ? 'good' : 'mid'}`}>{score(name)}%</span> : '—'}</td><td>{marked ? `${marks(name).reduce((a, b) => a + b, 0)} / 6` : '—'}</td><td><span className="tc-group-name">{latest?.group ?? 'Whole class'}</span></td></DisplayRow>;
    })}</tbody></table> : markedNames.length ? <table><thead><tr><th>Question</th><th>Skill</th><th>Marked students</th><th>{tab === 'Marks' ? 'Average marks' : 'Average result'}</th></tr></thead><tbody>{['2x + 5 = 17', '3(x − 2) = 15', '4x + 3 = 2x + 11'].map((q, i) => <tr key={q}><td>Q{i + 1} · Solve {q}</td><td>{i === 1 ? 'Expand and solve' : 'Solve linear equations'}</td><td>{markedNames.length}</td><td>{tab === 'Marks' ? `${questionAverage(i).toFixed(1)} / 2` : `${Math.round(questionAverage(i) / 2 * 100)}%`}</td></tr>)}</tbody></table> : <div className="pp-empty-results"><Glyph kind="paper"/><h3>{tab} will appear after marking</h3><p>Upload work and confirm student matches to get started.</p></div>}{!visibleNames.length && tab === 'Students' && <div className="tc-empty">No students match these filters.<button onClick={() => {setQuery(''); setFilter('All students');}}>Clear filters</button></div>}</div></section>

    <footer className="pp-demo-note">Paper+ prototype · Matching, marking and results are simulated. <button onClick={() => setModal('guide')}>How to capture clear work</button></footer>
    <input ref={fileInput} type="file" multiple={pageCaptureIntent?.kind!=='replace'} accept=".jpg,.jpeg,.png,.tif,.tiff,.pdf" hidden onChange={e => {if (e.target.files?.length) upload(e.target.files); e.target.value = '';}}/>
    <PrototypeControls><label>Task scenario<select aria-label="Paper+ scenario" value={scenarioValue} onChange={e => scenario(e.target.value as PaperScenario)}>{[...stages,'Preparing to print','Mixed batches'].map(s => <option key={s} value={s}>{scenarioLabel(s as PaperScenario)}</option>)}</select></label>{preparingPrint && <button onClick={()=>{setPrintPreparation(null);setScenarioName('Awaiting work');}}>Simulate print ready</button>}<label><input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)}/>Animate and advance processing stages</label><label><input type="checkbox" checked={reviewFirst} onChange={e => setReviewFirst(e.target.checked)}/>Review all matches before marking</label><button onClick={() => scenario('Mixed batches')}>Show mixed batches</button><label>Who uploads?<select value={uploadOwner} onChange={e => setUploadOwner(e.target.value)}><option>Teacher</option><option>Student</option></select></label><p>Uncertain names and unreadable pages always require review. Turn off automatic progression to hold a stage for discussion.</p><button onClick={() => scenario('Awaiting work')}>Reset prototype</button></PrototypeControls>
    {modal === 'upload'&&<Dialog title={pageCaptureIntent?.kind==='replace'?`Replace page · ${uploadStudent}`:uploadStudent==='All students'?'Add student responses':`Add responses · ${uploadStudent}`} onClose={closeCapture}>{pageCaptureIntent?<div className="pp-locked-capture-scope"><b>{pageCaptureIntent.kind==='replace'?'Replace one page':'Add more pages'} for {pageCaptureIntent.student}</b><p>{pageCaptureIntent.kind==='replace'?'Choose a clearer file or capture a new photo. The original is kept until you finish.':'Choose files, use your webcam or connect your phone. New pages stay with this student.'}</p></div>:<div className="pp-upload-scope"><label>Upload for<select aria-label="Upload responses for" value={uploadStudent} onChange={e=>setUploadStudent(e.target.value)}><option>All students</option>{names.map(name=><option key={name}>{name}</option>)}</select></label>{uploadStudent!=='All students'&&<button onClick={()=>setUploadStudent('All students')}>Upload for all students</button>}</div>}{chooser}{!pageCaptureIntent&&<div className="pp-batch-fields"><label>Task group<select value={uploadGroup} onChange={e=>setUploadGroup(e.target.value)}><option>Whole class</option><option>Group 1</option><option>Group 2</option></select></label><label>Work completed on<input type="date" value={uploadDate} onInput={e=>setUploadDate(e.currentTarget.value)} onChange={e=>setUploadDate(e.target.value)}/></label></div>}{fileError&&<p className="pp-error" role="alert">{fileError}</p>}<div className="pp-inline-tip">{pageCaptureIntent?.kind==='replace'?'Only the selected page will be replaced. All other pages and students stay unchanged.':uploadStudent==='All students'?'Keep each student’s name visible. We’ll match the pages before marking.':`New pages will be assigned to ${uploadStudent}. Earlier uploads stay unchanged.`}</div><footer className="pp-dialog-footer"><button onClick={()=>setModal('guide')}>Capture tips</button><button className="pp-primary" onClick={startDemo}>{pageCaptureIntent?.kind==='replace'?'Use sample replacement →':pageCaptureIntent?'Use sample page →':uploadStudent==='All students'?'Use sample batch →':'Use sample response →'}</button></footer></Dialog>}
    {modal==='responses'&&<Dialog title="Manage responses" onClose={()=>setModal(null)} wide><div className="pp-responses-intro"><div><b>{receivedNames.length} / {names.length} students with work</b><p>{allSheets.length} pages across {batches.length} {batches.length===1?'batch':'batches'}. Add work whenever it’s ready.</p></div><button className="pp-primary" onClick={()=>openUpload()}><Glyph kind="upload"/>Add responses</button></div><div className="pp-managed-batches">{batches.length?batches.map(batch=><div className="pp-batch" key={batch.id}><div><strong>{batch.label}</strong><span>{batch.group} · {new Date(`${batch.date}T12:00:00`).toLocaleDateString('en-AU',{day:'numeric',month:'short'})} · {batch.sheets.filter(sheet=>!sheet.excluded).length} pages</span></div><div className="pp-batch-progress"><span className={`pp-chip ${batch.stage==='Results ready'?'pp-green':batch.stage==='Review matches'?'pp-amber':'pp-purple'}`}>{batch.stage}</span>{['Uploading','Matching','Transcribing','Marking'].includes(batch.stage)&&<><progress aria-label={`${batch.label} ${batch.stage}`} value={batch.progress} max={100}/><small>{batch.progress}%</small></>}</div>{['Review matches','Results ready'].includes(batch.stage)?<button onClick={()=>openReview(batch)}>{batch.stage==='Review matches'?'Review matches':'View pages'} →</button>:batch.stage==='Upload issue'?<button onClick={()=>setBatches(current=>current.map(b=>b.id===batch.id?{...b,stage:'Uploading',progress:0}:b))}>Retry upload</button>:<small>{auto?'Processing automatically':'Demo progression paused'}</small>}</div>):<div className="pp-responses-empty"><Glyph kind="upload"/><h3>No responses yet</h3><p>Upload a class batch or capture work for one student.</p></div>}</div><footer className="pp-dialog-footer"><span>Earlier results stay available while new work is processed.</span><button onClick={()=>setModal(null)}>Done</button></footer></Dialog>}
    {modal==='release'&&<Dialog title="Release results to students" onClose={()=>setModal(null)}><div className="pp-release-body"><h3>{released?'Marked results are visible to students':`${markedNames.length} students have marked results`}</h3><p>{released?'Newly marked responses will also become visible as more work is uploaded.':'Teachers can review marked work now. Release results when you’re ready for students to see their feedback.'}</p><p>Matching and marking continue independently. Students without marked work will keep waiting for their results.</p></div><footer className="pp-dialog-footer"><button onClick={()=>setModal(null)}>Cancel</button><button className="pp-primary" disabled={!markedNames.length&&!released} onClick={()=>{setReleased(!released);setModal(null);setNotice(released?'Student results are locked.':'Marked results released to students.');}}>{released?'Lock student results':'Release marked results'}</button></footer></Dialog>}
    {modal === 'phone' && <Dialog title="Capture with your phone" onClose={closeCapture}><div className="pp-capture-target">{uploadStudent==='All students'?'Class responses':`${pageCaptureIntent?.kind==='replace'?'Replacing one page':'Adding pages'} for ${uploadStudent}`}</div><div className="pp-phone-connect"><QR value={phoneUrl}/><div><span className="pp-chip pp-green">● Ready to connect</span><h3>Scan, snap, send.</h3><ol><li>Scan this code with your phone’s camera.</li><li>Photograph one student’s work at a time.</li><li>Pages arrive here, ready to match.</li></ol></div></div><div className="pp-inline-tip">Keep the page flat and well lit. Make sure the student’s full name is in every photo.</div><div className="pp-phone-received"><strong>{phoneCount} {phoneCount===1?'page':'pages'} received</strong><span>{phoneCount ? 'Ready to add to this task' : 'Waiting for photos…'}</span></div><p className="pp-prototype-callout">Prototype: open the capture preview in this browser to send demo pages. A phone connection needs a hosted upload service; localhost QR links won’t connect from another device.</p><footer className="pp-dialog-footer"><a href={phoneUrl} target="_blank" rel="noreferrer">Open capture preview ↗</a><button className="pp-primary" disabled={!phoneCount} onClick={() => {addBatch(Array.from({length: phoneCount}, (_, i) => ({id: ++nextId.current, file: `Phone photo ${i + 1}`, student: '', method: 'Confirm handwritten name', issue: 'name' as const})), 'Matching');}}>{pageCaptureIntent?.kind==='replace'?'Use replacement photo':`Finish capture · ${phoneCount} ${phoneCount===1?'page':'pages'}`}</button></footer></Dialog>}
    {modal === 'camera' && <Dialog title="Capture with your webcam" onClose={closeCapture}><div className="pp-capture-target">{uploadStudent==='All students'?'Class responses':`${pageCaptureIntent?.kind==='replace'?'Replacing one page':'Adding pages'} for ${uploadStudent}`}</div><Camera single={pageCaptureIntent?.kind==='replace'} onCapture={sheet => {if (sheet.preview) previews.current.push(sheet.preview); setCaptureDraft(current => [...current, uploadStudent==='All students'?sheet:{...sheet,student:uploadStudent,issue:undefined,method:'Assigned by you'}]); setNotice('Photo added. Capture another page or finish to match.');}} onFinish={() => {if (captureDraft.length) addBatch(captureDraft, 'Matching');}} count={captureDraft.length}/></Dialog>}
    {modal === 'guide' && <Dialog title="A quick guide to a class upload" onClose={closeCapture}><div className="pp-guide">{[['Start with a name', 'Print worksheets with student names for a QR-assisted match, or ask students to write their full name on every page of their own paper.'], ['Scan the whole class in one go', 'Use a school scanner to create one PDF. Keep each student’s pages together and scan both sides if they’ve used them.'], ['Photograph a page at a time', 'Use even lighting, avoid shadows, and include all four corners. Check that the name and mathematical working are sharp.'], ['Check the match, then mark', 'We’ll group pages by student. Confirm uncertain names, exclude blank pages and replace blurred photos before marking.']].map(([title, copy], i) => <article key={title}><span>{i + 1}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div><footer className="pp-dialog-footer"><span/><button className="pp-primary" onClick={() => setModal('upload')}>Add student work</button></footer></Dialog>}
    {modal === 'print' && <Dialog title="Print for your class" onClose={() => setModal(null)} wide>
      <div className="pp-print-layout"><div>
        <label className="pp-field">Print format<select value={printType} onChange={e => setPrintType(e.target.value)}><option>With working space</option><option>Questions only</option><option>Blank letterhead</option></select></label>
        <p>{printType === 'With working space' ? 'The same questions for every student, with space to show their working.' : printType === 'Questions only' ? 'A compact question sheet for the whole class. Students answer on separate paper.' : 'A Mathspace sheet with space for a student name and handwritten answers.'}</p>
        {printType === 'With working space' && <fieldset className="pp-name-options"><legend>Student names</legend><label><input type="radio" name="worksheet-names" checked={includeNames} onChange={()=>setIncludeNames(true)}/>Print a worksheet for each selected student, with their name and QR code</label><label><input type="radio" name="worksheet-names" checked={!includeNames} onChange={()=>setIncludeNames(false)}/>Leave space for students to write their name</label></fieldset>}
        {namedWorksheets && <><label className="pp-check"><input type="checkbox" checked={printNames.length === names.length} onChange={e => setPrintNames(e.target.checked ? names : [])}/>Select all {names.length} students</label><div className="pp-print-students">{names.map(name => <label key={name}><input type="checkbox" checked={printNames.includes(name)} onChange={e => setPrintNames(current => e.target.checked ? [...current, name] : current.filter(n => n !== name))}/>{name}</label>)}</div></>}
      </div><div className="pp-print-preview"><Paper name={namedWorksheets ? printNames[0] || 'Student name' : ''} qr={namedWorksheets} blank={printType === 'Blank letterhead'} questionsOnly={printType === 'Questions only'} filled={false}/><small>Preview · A4 · {namedWorksheets ? `${printNames.length} worksheets with names` : 'Choose the number of copies in the print dialog'}</small></div></div>
      <footer className="pp-dialog-footer"><span>{namedWorksheets ? 'Keep the name and QR code visible when scanning.' : printType === 'Questions only' ? 'Students can use their own paper or a blank letterhead to answer.' : 'Ask students to write their full name on every sheet.'}</span><button className="pp-primary" disabled={preparingPrint || !printable.length} onClick={() => window.print()}>Print {namedWorksheets ? `${printNames.length} worksheets` : printType === 'Questions only' ? 'questions' : printType === 'Blank letterhead' ? 'letterhead' : 'worksheets'}</button></footer>
      <div className="pp-print-output">{printable.map(name => <Paper key={name} name={name} qr={namedWorksheets} blank={printType === 'Blank letterhead'} questionsOnly={printType === 'Questions only'} filled={false}/>)}</div>
    </Dialog>}
    {modal === 'review' && <Dialog title={done ? 'Uploaded student work' : 'Review student matches'} onClose={() => setModal(null)} wide><div className="pp-review-summary"><span><b>{matched.length}</b> matched</span><span className={issues.length ? 'pp-attention' : ''}><b>{issues.length}</b> need attention</span><span><b>{sheets.filter(s => s.excluded).length}</b> excluded</span></div><div className="pp-review-list">{sheets.map(sheet => <article className={`pp-review-row ${sheet.excluded ? 'pp-excluded' : ''}`} key={sheet.id}><button className={`pp-sheet-thumb ${sheet.issue === 'quality' ? 'pp-blurred' : ''}`} aria-label={`Preview ${sheet.file}`} onClick={() => {setPreviewSheet(sheet); setModal('page');}}><Paper name={sheet.student || sheet.method.match(/“([^”]+)”/)?.[1] || 'Name unclear'} preview={sheet.preview}/></button><div className="pp-review-info"><b>{sheet.file}</b><span className={`pp-chip ${sheet.issue && !sheet.excluded ? 'pp-amber' : 'pp-green'}`}>{sheet.excluded ? 'Excluded from marking' : sheet.issue === 'quality' ? 'Unreadable photo' : sheet.issue === 'name' ? 'Confirm student' : sheet.method}</span>{sheet.issue === 'quality' ? <p>Working is too blurred to mark. Exclude this page, then upload a clearer photo.</p> : <p>{sheet.student ? 'Check the student and page before marking.' : sheet.method}</p>}</div><div className="pp-review-controls"><label>Student<select disabled={sheet.excluded || done || sheet.issue === 'quality'} value={sheet.student} onChange={e => patch(sheet.id, {student: e.target.value, issue: e.target.value ? undefined : 'name', method: 'Confirmed by you'})}><option value="">Select a student…</option>{names.map(n => <option key={n}>{n}</option>)}</select></label>{!done && <button onClick={() => patch(sheet.id, {excluded: !sheet.excluded})}>{sheet.excluded ? 'Restore page' : sheet.issue === 'quality' ? 'Exclude blurred page' : 'Exclude page'}</button>}</div></article>)}</div><div className="pp-inline-tip">Multiple pages assigned to the same student are grouped into one submission. Students without work stay in “Awaiting work”.</div><footer className="pp-dialog-footer"><span>{issues.length ? 'Resolve or exclude pages that need attention.' : `${studentsWithWork.length} students ready for marking.`}</span>{done ? <button onClick={() => setModal(null)}>Done</button> : <button className="pp-primary" disabled={issues.length > 0 || !matched.length} onClick={() => {setModal(null); changeStage('Transcribing');}}>Confirm & mark {studentsWithWork.length} students →</button>}</footer></Dialog>}
    {(scorecardOpen||modal === 'scorecard')&&<PaperScorecard suspended={originalsOpen||!!modal&&modal!=='scorecard'} groups={Object.fromEntries(names.map(name=>[name,batches.filter(batch=>batch.sheets.some(sheet=>!sheet.excluded&&sheet.student===name)).at(-1)?.group??'Whole class']))} pageCounts={Object.fromEntries(names.map(name=>[name,studentPages(batches,name).length]))} name={activeName} names={names} received={receivedNames} marked={markedNames} marks={marks} originalMarks={originalMarks} edits={markEdits} onEdit={(key,edit)=>setMarkEdits(current=>({...current,[key]:edit}))} onStudent={name=>setSelected(names.indexOf(name))} onUpload={student=>{setScorecardOpen(true);openUpload(student);}} onClose={()=>{setScorecardOpen(false);setModal(null);}} onOriginal={()=>{setScorecardOpen(true);setOriginalPageId(undefined);setOriginalsOpen(true);setModal(null);}}/>}
    {originalsOpen&&<Dialog title={`${activeName} · Original pages`} onClose={closeOriginals} wide>{!modal&&moveNotification}<StudentOriginalPages batches={batches} update={workUpdates.filter(update=>update.student===activeName).at(-1)} percent={score(activeName)} earned={marks(activeName).reduce((a,b)=>a+b,0)} onMove={beginMovePage} onViewStudent={viewStudentPages} selectedId={originalPageId} onSelectPage={setOriginalPageId} student={activeName} pages={studentPages(batches,activeName)} renderPage={page=><Paper name={page.sourceStudent??page.student} preview={page.preview}/>} onReplace={beginPageCapture} onAdd={()=>beginPageCapture()} onBack={closeOriginals}/></Dialog>}
    {modal==='move-page'&&movingPages.length>0&&<Dialog title={`Move ${moveLabel} to another student`} onClose={()=>setModal(null)}><div className="pp-move-page-body"><b>{movingPages.length===1?movingPages[0].file:`${movingPages.length} selected pages`}</b>{movingPages.length>1&&<ul>{movingPages.map(page=><li key={page.id}>{page.file}</li>)}</ul>}<p>Currently assigned to {activeName}.</p><label>Move page to<select aria-label="Move page to" value={moveDestination} onChange={event=>setMoveDestination(event.target.value)}><option value="">Select a student…</option>{names.filter(name=>name!==activeName).map(name=><option key={name}>{name}</option>)}</select></label>{moveDestination&&<p>{moveDestination} currently has {studentPages(batches,moveDestination).length} {studentPages(batches,moveDestination).length===1?'page':'pages'}. {movingPages.length===1?'This page':'These pages'} will be removed from {activeName} and added to {moveDestination}. Results for both students will be recalculated.</p>}</div><footer className="pp-dialog-footer"><button onClick={()=>setModal(null)}>Cancel</button><button className="pp-primary" disabled={!moveDestination} onClick={confirmMovePage}>Move {moveLabel}</button></footer></Dialog>}
    {modal === 'page' && previewSheet && <Dialog title={previewSheet.file} onClose={() => setModal('review')}><div className={`pp-page-preview ${previewSheet.issue === 'quality' ? 'pp-blurred' : ''}`}><Paper name={previewSheet.student || previewSheet.method.match(/“([^”]+)”/)?.[1] || 'Name unclear'} preview={previewSheet.preview}/></div><footer className="pp-dialog-footer"><span>{previewSheet.student || 'Student name needs confirmation'}</span><button className="pp-primary" onClick={() => setModal('review')}>Back to matches</button></footer></Dialog>}
    {!originalsOpen&&moveNotification}
    {notice && <div className="tc-toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></div>}
  </main></div></TableDisplayProvider>;
}

function Camera({onCapture, onFinish, count,single=false}: {single?:boolean;onCapture: (s: Sheet) => void; onFinish: () => void; count: number}) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState(0);
  useEffect(() => () => {stream.current?.getTracks().forEach(t => t.stop());}, []);
  const enable = async () => {try {const media = await navigator.mediaDevices.getUserMedia({video: true}); stream.current = media; if (video.current) video.current.srcObject = media; setActive(true);} catch {setError('Camera unavailable. Check your browser permissions, or use a sample photo below.');}};
  const capture = (demo = false) => {
    if(single&&captured>=1)return;
    let preview: string | undefined;
    if (!demo && video.current) {const canvas = document.createElement('canvas'); canvas.width = video.current.videoWidth; canvas.height = video.current.videoHeight; if (!canvas.width) return; canvas.getContext('2d')?.drawImage(video.current, 0, 0); preview = canvas.toDataURL('image/jpeg');}
    onCapture({id: Date.now(), file: `Webcam photo ${captured + 1}.jpg`, student: '', method: 'Confirm handwritten name', issue: 'name', preview}); setCaptured(c => c + 1);
  };
  return <><p className="pp-dialog-intro">Place one page in view. Keep the name and all four corners visible.</p><div className={`pp-camera ${active ? 'is-active' : ''}`}><video ref={video} autoPlay playsInline muted/>{!active && <div><Glyph kind="camera"/><h3>Ready when you are</h3><button className="pp-primary" onClick={enable}>Enable webcam</button></div>}<span className="pp-camera-corners"/></div>{error && <p role="alert" className="pp-error">{error}</p>}<p className="pp-captured" role="status">{captured} {captured===1?'photo':'photos'} captured in this session</p><footer className="pp-dialog-footer"><button disabled={single&&captured>=1} onClick={() => capture(true)}>Use sample photo</button><div>{active && <button disabled={single&&captured>=1} onClick={() => capture()}>Capture photo</button>}<button className="pp-primary" disabled={!count} onClick={onFinish}>{single?'Use replacement photo':'Finish & match pages'}</button></div></footer></>;
}

export function PhoneCapture() {
  const session = new URLSearchParams(window.location.search).get('session') || 'demo';
  const single=new URLSearchParams(window.location.search).get('mode')==='replace';
  const [count, setCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const send = () => {if(single&&count>=1)return;const channel = new BroadcastChannel(`paper-plus-${session}`); channel.postMessage({kind: 'capture'}); channel.close(); setCount(c => c + 1);};
  return <div className="pp-phone-page"><header><img className="pp-brand-logo" src="/assets/paper-plus/mathspace-logo.svg" alt="Mathspace"/></header><span className="pp-chip pp-green">Connected capture preview</span><h1>{finished ? 'You’re all done.' : 'Let’s capture their working.'}</h1><p>7A Math · Linear equations on paper</p><p>{new URLSearchParams(window.location.search).get('student')==='All students'?'Class responses':new URLSearchParams(window.location.search).get('student')||'Class responses'}</p>{finished ? <div className="pp-phone-done"><strong>✓</strong><h2>{count} {count===1?'page':'pages'} sent</h2><p>Return to the task report to match pages to students.</p><button onClick={() => setFinished(false)}>Capture more pages</button></div> : <><div className="pp-phone-frame"><Glyph kind="camera"/><p>One student’s work per photo.<br/>Keep their full name in the frame.</p></div><button className="pp-primary" disabled={single&&count>=1} onClick={() => input.current?.click()}>Take a photo</button><input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={e => {if (e.target.files?.length) send(); e.target.value = '';}}/><button disabled={single&&count>=1} onClick={send}>Send a sample page</button><p role="status">{count} {count===1?'page':'pages'} sent to the task</p><button disabled={!count} onClick={() => setFinished(true)}>Finish capture</button></>}<small>Prototype preview · Same-browser demo connection. Images aren’t sent to a server.</small></div>;
}
