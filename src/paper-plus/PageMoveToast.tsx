import { SuccessToast } from '../components/SuccessToast';

export function PageMoveToast({ pageCount, originalStudent, recipient, undone, complete, onUndo, onDismiss }: {
  pageCount: number; originalStudent: string; recipient: string; undone: boolean; complete: boolean;
  onUndo: () => void; onDismiss: () => void;
}) {
  const title = undone ? 'Reassignment undone' : pageCount === 1 ? 'Page moved' : `${pageCount} pages moved`;
  const restored = pageCount === 1 ? `${originalStudent}’s page` : `${pageCount} pages for ${originalStudent}`;
  const update = complete ? 'Both students’ results updated.' : 'Recalculating both students’ results…';
  return <SuccessToast title={title} description={undone ? `${restored} restored. ${update}` : `Assigned to ${recipient}. Recalculating both students’ results.`}
    action={!undone && <button type="button" onClick={onUndo}>Undo</button>}
    duration={undone && !complete ? null : 20000} dismissLabel="Dismiss page move notification" onDismiss={onDismiss}/>;
}
