import { useState } from 'react';
import { Link } from 'react-router-dom';
import './TodayDashboard.css';
import DashboardSwitcher from '../dashboard/DashboardSwitcher';

type DashboardView = 'today' | 'overview';
type Tone = 'purple' | 'blue' | 'green' | 'amber' | 'red';

const periods = [
  { period: 'P1', className: '9C', detail: 'Algebraic expressions', state: 'Done' },
  { period: 'P2', className: 'Planning', detail: 'Review 10A readiness', state: 'Free' },
  { period: 'P3', className: '8B', detail: 'Equivalent fractions', state: 'Done' },
  { period: 'P4', className: '7A', detail: 'Decimals & Percentages', state: 'Next' },
  { period: 'P5', className: '10A', detail: 'Linear relationships', state: 'Later' },
  { period: 'P6', className: '10C', detail: 'Simultaneous equations', state: 'Later' },
];

const briefingItems = [
  {
    title: '13 / 25 students stumbled on equivalent fractions',
    reason: 'This skill is needed for today\'s decimals work.',
    action: 'Review',
    tone: 'amber' as Tone,
  },
  {
    title: '3 students finished fast and aced it',
    reason: 'Ava Nguyen, Noah Patel, and Emily Chen all showed strong growth.',
    action: 'Reward',
    tone: 'green' as Tone,
  },
  {
    title: '2 / 25 students have not started the homework',
    reason: 'A quick reminder should still land before Period 4.',
    action: 'Remind',
    tone: 'blue' as Tone,
  },
];

const upcomingClasses = [
  {
    className: 'Year 10A Math',
    time: 'Period 5 · 13:00-13:45',
    topic: 'Linear Relationships',
    status: 'On track',
    review: '8 items',
    tone: 'green' as Tone,
  },
  {
    className: 'Year 10C Math',
    time: 'Period 6 · 14:00-14:45',
    topic: 'Simultaneous Equations',
    status: 'Slightly behind',
    review: '5 items',
    tone: 'amber' as Tone,
  },
];

const recommendations = [
  {
    label: 'Reward',
    title: 'Reward 5 students for their achievements',
    description: 'Students have shown growth, persistence, and aptitude toward their assigned work.',
    confidence: 'High confidence · 88%',
    action: 'Review',
    tone: 'green' as Tone,
  },
  {
    label: 'Remediate',
    title: '7 students may struggle in tomorrow\'s Year 10 test',
    description: 'Recent simultaneous-equations quizzes and incomplete prerequisite work suggest they are not ready yet.',
    confidence: 'Medium confidence · 64%',
    action: 'Review',
    tone: 'red' as Tone,
  },
  {
    label: 'Remind',
    title: '5 students in Year 8B have not started this week\'s task',
    description: 'Adaptive practice was set Monday and is due Thursday. A nudge now typically lifts completion.',
    confidence: 'Medium confidence · 76%',
    action: 'Remind',
    tone: 'blue' as Tone,
  },
];

const classHealth = [
  {
    name: 'Year 7A Math',
    unit: 'Decimals & Percentages',
    status: 'On track',
    progress: 50,
    pacing: 'On plan',
    secure: 24,
    developing: 33,
    support: 43,
    critical: 8,
    students: 25,
    nextLesson: 'Today, Period 4',
    classPath: '/classes/class-a',
    tone: 'amber' as Tone,
  },
  {
    name: 'Year 7B Math',
    unit: 'Decimals & Percentages',
    status: 'Ahead',
    progress: 75,
    pacing: '2 lessons ahead',
    secure: 68,
    developing: 20,
    support: 12,
    critical: 1,
    students: 26,
    nextLesson: 'In 2 days, Tuesday',
    classPath: '/classes/class-b',
    tone: 'green' as Tone,
  },
  {
    name: 'Year 8B Math',
    unit: 'Equivalent Fractions',
    status: 'Needs nudge',
    progress: 42,
    pacing: '1 lesson behind',
    secure: 46,
    developing: 34,
    support: 20,
    critical: 3,
    students: 28,
    nextLesson: 'Tomorrow, Period 2',
    classPath: '/classes/class-a',
    tone: 'blue' as Tone,
  },
  {
    name: 'Year 9C Math',
    unit: 'Algebraic Expressions',
    status: 'On track',
    progress: 61,
    pacing: 'On plan',
    secure: 58,
    developing: 29,
    support: 13,
    critical: 2,
    students: 30,
    nextLesson: 'Friday, Period 1',
    classPath: '/classes/class-b',
    tone: 'purple' as Tone,
  },
  {
    name: 'Year 10A Math',
    unit: 'Linear Relationships',
    status: 'Review needed',
    progress: 64,
    pacing: 'Assessment in 3 lessons',
    secure: 41,
    developing: 37,
    support: 22,
    critical: 7,
    students: 24,
    nextLesson: 'Today, Period 5',
    classPath: '/classes/class-a',
    tone: 'red' as Tone,
  },
  {
    name: 'Year 10C Math',
    unit: 'Solving Equations with Brackets',
    status: 'Slightly behind',
    progress: 48,
    pacing: '1 lesson behind',
    secure: 52,
    developing: 31,
    support: 17,
    critical: 4,
    students: 22,
    nextLesson: 'Today, Period 6',
    classPath: '/classes/class-b',
    tone: 'amber' as Tone,
  },
];

const attentionStudents = [
  { name: 'Maya Roberts', detail: 'Risk: Equivalent fractions', action: 'Assign remediation', tone: 'red' as Tone },
  { name: 'Luke Brown', detail: 'Has not started 3 recent tasks', action: 'Send reminder', tone: 'amber' as Tone },
  { name: 'Ava Nguyen', detail: 'High growth this week', action: 'Recognise', tone: 'green' as Tone },
  { name: 'Jackson Lee', detail: 'Low confidence on brackets', action: 'Review work', tone: 'blue' as Tone },
];

function Pill({ children, tone = 'purple' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`dashboard-pill dashboard-pill--${tone}`}>{children}</span>;
}

function MiloPanel({ view }: { view: DashboardView }) {
  return (
    <aside className="milo-panel" aria-label="Milo AI assistant">
      <div className="milo-panel__top">
        <div className="milo-avatar">M</div>
        <div>
          <div className="milo-eyebrow">Milo assistant</div>
          <h2>{view === 'today' ? 'Today briefing' : 'Class health briefing'}</h2>
        </div>
      </div>

      <div className="milo-summary">
        <p>
          Good morning, Sarah. I reviewed today&apos;s 4 classes, 97 students, and 3 due assessments.
        </p>
        <strong>
          {view === 'today'
            ? 'The most important thing right now: review equivalent fractions before Year 7A.'
            : 'The most important thing right now: 7 Year 10 students are not ready for tomorrow\'s test.'}
        </strong>
      </div>

      <div className="milo-prompts">
        <button>Create tomorrow&apos;s Year 10 lesson</button>
        <button>Generate intervention tasks</button>
        <button>Explain Year 10 Advanced readiness</button>
      </div>

      <div className="milo-info">
        <button aria-label="Dismiss Milo information">x</button>
        <span>Introducing Milo, your AI Assistant.</span>
        <a href="#">Learn more</a>
      </div>

      <label className="milo-input">
        <span>Ask anything about your classes</span>
        <div>
          <input placeholder="Ask Milo..." />
          <button>Ask</button>
        </div>
      </label>
    </aside>
  );
}

function TodayView() {
  return (
    <div className="today-layout">
      <section className="period-rail" aria-label="Today timetable">
        <div className="section-heading">
          <span>School day</span>
          <strong>Wednesday</strong>
        </div>
        {periods.map((period) => (
          <button
            key={`${period.period}-${period.className}`}
            className={`period-item ${period.state === 'Next' ? 'period-item--active' : ''}`}
          >
            <span>{period.period}</span>
            <strong>{period.className}</strong>
            <small>{period.detail}</small>
            <em>{period.state}</em>
          </button>
        ))}
      </section>

      <section className="lesson-stack">
        <article className="lesson-briefing">
          <div className="lesson-briefing__header">
            <div>
              <div className="dashboard-eyebrow">Next class</div>
              <h2>Year 7A Math</h2>
              <p>Period 4 · 12:00-12:45 · Starts in 18 min</p>
            </div>
            <Pill tone="green">On track</Pill>
          </div>

          <div className="lesson-topic-row">
            <div>
              <span>Topic</span>
              <strong>5. Decimals & Percentages</strong>
              <small>Converting fractions, decimals, and percentages</small>
            </div>
            <div className="topic-progress">
              <div className="topic-progress__meter">
                <span style={{ width: '50%' }} />
              </div>
              <strong>50% through topic</strong>
            </div>
            <div className="confidence-strip">
              <span><b>43%</b> low confidence</span>
              <span><b>33%</b> developing</span>
              <span><b>24%</b> secure</span>
              <span><b>8</b> critical gaps</span>
            </div>
          </div>

          <div className="priority-card">
            <div>
              <span className="dashboard-eyebrow">Most important action</span>
              <h3>Review equivalent fractions before today&apos;s lesson.</h3>
              <p>52% of the class missed Question 8, and equivalent fractions are needed for today&apos;s decimals work.</p>
            </div>
            <div className="button-row">
              <Link className="dashboard-btn dashboard-btn--primary" to="/classes/class-a/tasks/task-class-a-1">
                Review misconception
              </Link>
              <Link className="dashboard-btn dashboard-btn--secondary" to="/tasks/task-class-a-1/report">
                Open task report
              </Link>
              <button className="dashboard-btn dashboard-btn--ghost">Dismiss</button>
            </div>
          </div>

          <div className="briefing-grid">
            <section className="briefing-section">
              <div className="section-heading">
                <span>Before class</span>
                <strong>3 things to know</strong>
              </div>
              <div className="insight-list">
                {briefingItems.map((item) => (
                  <div className="insight-item" key={item.title}>
                    <Pill tone={item.tone}>{item.action}</Pill>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.reason}</p>
                    </div>
                    <button className="dashboard-btn dashboard-btn--secondary">{item.action}</button>
                  </div>
                ))}
              </div>
              <div className="quiet-actions">
                <button>Why am I seeing this?</button>
                <Link to="/tasks/task-class-a-1/report">View task report</Link>
                <button>Approve all</button>
              </div>
            </section>

            <section className="briefing-section">
              <div className="section-heading">
                <span>In class</span>
                <strong>Today&apos;s lesson focus</strong>
              </div>
              <div className="resource-list">
                <Link className="resource-list__primary" to="/textbook">Open lesson</Link>
                <button>Open textbook section 5.02</button>
                <button>Explore questions</button>
                <button>Assign quick in-class task</button>
                <button>Review topic readiness report</button>
              </div>
            </section>
          </div>

          <section className="after-class">
            <div className="section-heading">
              <span>After class</span>
              <strong>Recommended next steps</strong>
            </div>
            <div className="next-step-grid">
              <div>
                <strong>Assign short remediation task</strong>
                <p>5-question personalised task for students with prerequisite gaps.</p>
                <button className="dashboard-btn dashboard-btn--primary">Assign</button>
              </div>
              <div>
                <strong>Decimals & Percentages Practice</strong>
                <p>Scheduled · Starts today · Due in 1w 3d.</p>
                <button className="dashboard-btn dashboard-btn--secondary">Edit</button>
              </div>
              <div>
                <strong>Assessment readiness</strong>
                <p>Only 3 lessons before the fractions assessment.</p>
                <button className="dashboard-btn dashboard-btn--secondary">Review schedule</button>
              </div>
            </div>
          </section>
        </article>

        <div className="collapsed-classes">
          {upcomingClasses.map((item) => (
            <article className="collapsed-class" key={item.className}>
              <div>
                <strong>{item.className}</strong>
                <span>{item.time}</span>
              </div>
              <p>Topic: {item.topic}</p>
              <Pill tone={item.tone}>{item.status}</Pill>
              <span>{item.review} to review</span>
              <button className="dashboard-btn dashboard-btn--secondary">Expand</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function OverviewView() {
  return (
    <div className="overview-layout">
      <section className="recommendations-section">
        <div className="section-title-row">
          <div>
            <div className="dashboard-eyebrow">Prioritised by impact</div>
            <h2>Recommended actions</h2>
          </div>
          <div className="section-actions">
            <span>Updated 7 min ago</span>
            <button className="dashboard-btn dashboard-btn--secondary">All recommendations</button>
            <button className="dashboard-btn dashboard-btn--primary">Approve all</button>
          </div>
        </div>

        <div className="recommendation-grid">
          {recommendations.map((item) => (
            <article className={`recommendation-card recommendation-card--${item.tone}`} key={item.title}>
              <Pill tone={item.tone}>{item.label}</Pill>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span>{item.confidence}</span>
              <div className="button-row">
                <button className="dashboard-btn dashboard-btn--primary">{item.action}</button>
                <button className="dashboard-btn dashboard-btn--ghost">Dismiss</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="filters-row" aria-label="Class filters">
        {['All classes', '7A', '8B', '9C', '10A', '10C'].map((filter, index) => (
          <button className={index === 0 ? 'active' : ''} key={filter}>{filter}</button>
        ))}
      </section>

      <div className="overview-columns">
        <section className="class-health-grid" aria-label="Class health">
          {classHealth.map((item) => (
            <article className="class-health-card" key={item.name}>
              <div className="class-health-card__top">
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.unit}</p>
                </div>
                <Pill tone={item.tone}>{item.status}</Pill>
              </div>

              <div className="health-progress">
                <div>
                  <span>Current unit</span>
                  <strong>{item.progress}%</strong>
                </div>
                <div className="topic-progress__meter">
                  <span style={{ width: `${item.progress}%` }} />
                </div>
              </div>

              <div className="health-distribution">
                <span><b>{item.secure}%</b> secure</span>
                <span><b>{item.developing}%</b> developing</span>
                <span><b>{item.support}%</b> support</span>
              </div>

              <dl className="health-facts">
                <div>
                  <dt>Pacing</dt>
                  <dd>{item.pacing}</dd>
                </div>
                <div>
                  <dt>Students</dt>
                  <dd>{item.students}</dd>
                </div>
                <div>
                  <dt>Critical gaps</dt>
                  <dd>{item.critical}</dd>
                </div>
                <div>
                  <dt>Next lesson</dt>
                  <dd>{item.nextLesson}</dd>
                </div>
              </dl>

              <div className="button-row">
                <Link className="dashboard-btn dashboard-btn--primary" to={item.classPath}>Open class</Link>
                <Link className="dashboard-btn dashboard-btn--secondary" to={`${item.classPath}?tab=textbook-progress`}>Topic report</Link>
              </div>
            </article>
          ))}
        </section>

        <aside className="student-attention">
          <div className="section-heading">
            <span>Student attention</span>
            <strong>What needs follow-up</strong>
          </div>
          {attentionStudents.map((student) => (
            <div className="attention-row" key={student.name}>
              <div className={`attention-avatar attention-avatar--${student.tone}`}>
                {student.name.split(' ').map((part) => part[0]).join('')}
              </div>
              <div>
                <strong>{student.name}</strong>
                <span>{student.detail}</span>
              </div>
              <button>{student.action}</button>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

export default function TodayDashboard() {
  const [view, setView] = useState<DashboardView>('today');

  return (
    <div className="dashboard-shell"><DashboardSwitcher/>
      <header className="dashboard-topbar">
        <div className="dashboard-topbar__context">
          <Pill tone="purple">Week 3</Pill>
          <span>Next class: 7A in 36:34</span>
        </div>
        <div className="dashboard-search">
          <span aria-hidden="true">Search</span>
          <input aria-label="Search" placeholder="Search classes, students, tasks" />
        </div>
        <div className="dashboard-user">
          <button aria-label="Notifications">!</button>
          <span>Good morning, Sarah</span>
          <div className="teacher-avatar">S</div>
        </div>
      </header>

      <div className="dashboard-main">
        <main className="dashboard-content">
          <div className="dashboard-hero">
            <div>
              <div className="dashboard-eyebrow">Teacher dashboard</div>
              <h1>{view === 'today' ? 'Today' : 'Overview'}</h1>
              <p>
                {view === 'today'
                  ? 'A lesson briefing for what matters before your next class.'
                  : 'A class health view focused on risks, progress, and recommended actions.'}
              </p>
            </div>
            <div className="view-toggle" role="tablist" aria-label="Dashboard view">
              <button
                role="tab"
                aria-selected={view === 'today'}
                className={view === 'today' ? 'active' : ''}
                onClick={() => setView('today')}
              >
                Today
              </button>
              <button
                role="tab"
                aria-selected={view === 'overview'}
                className={view === 'overview' ? 'active' : ''}
                onClick={() => setView('overview')}
              >
                Overview
              </button>
            </div>
          </div>

          {view === 'today' ? <TodayView /> : <OverviewView />}
        </main>

        <MiloPanel view={view} />
      </div>
    </div>
  );
}
