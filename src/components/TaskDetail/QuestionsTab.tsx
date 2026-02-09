import type { QuestionDetail } from '../../types';

interface QuestionsTabProps {
  questions: QuestionDetail[];
}

export default function QuestionsTab({ questions }: QuestionsTabProps) {
  return (
    <div className="questions-tab">
      <table className="task-questions-table">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>Question</th>
            <th style={{ width: '80px' }}>Grade</th>
            <th>Subtopic(s)</th>
            <th>Skill(s)</th>
            <th className="response-header correct">
              <span className="response-icon">✓</span>
              Correct
            </th>
            <th className="response-header partial">
              <span className="response-icon">~</span>
              Partial
            </th>
            <th className="response-header incorrect">
              <span className="response-icon">✗</span>
              Incorrect
            </th>
            <th className="response-header skipped">
              <span className="response-icon">→</span>
              Skipped
            </th>
          </tr>
        </thead>
        <tbody>
          {questions.map(question => (
            <tr key={question.questionId}>
              <td className="question-number">Q{question.questionNumber}</td>
              <td className="question-grade">{question.grade}</td>
              <td>
                <div className="chip-list">
                  {question.subtopics.map(subtopic => (
                    <span key={subtopic.id} className="subtopic-chip">
                      {subtopic.name}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <div className="chip-list">
                  {question.skills.map(skill => (
                    <span key={skill.id} className="skill-chip" title={skill.name}>
                      {skill.code || skill.name}
                    </span>
                  ))}
                </div>
              </td>
              <td className="response-cell correct">
                <span className="response-count">{question.correctCount}</span>
              </td>
              <td className="response-cell partial">
                <span className="response-count">{question.partialCount}</span>
              </td>
              <td className="response-cell incorrect">
                <span className="response-count">{question.incorrectCount}</span>
              </td>
              <td className="response-cell skipped">
                <span className="response-count">{question.skippedCount}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
