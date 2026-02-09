import { useParams } from 'react-router-dom';
import StudentDetailContent from '../components/StudentDetailContent';

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();

  if (!studentId) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Student Not Found</h1>
          <p>No student ID provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <StudentDetailContent studentId={studentId} isCompact={false} />
    </div>
  );
}
