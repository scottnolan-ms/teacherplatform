# Teacher Groups Prototype

A clickable React prototype demonstrating custom groups (temporary + persistent) integrated into task creation/assignment and task reporting.

## Features

### Three Group Concepts

1. **Persistent Custom Groups** - Reusable, teacher-created groups that support targeting and reporting
2. **Temporary Custom Groups** - Single-use groups created within a task, existing only within that task flow
3. **Mathspace Groups** - System-defined labels (Explorer, Adventurer, Trailblazer) with teacher override capability

### Key Capabilities

- **Group Scoping**: Groups can be class-scoped (recommended) or cross-class
- **Flexible Membership**: Students can belong to unlimited custom groups
- **Permissions**: Shared staff permission model (any teacher can create/edit groups)
- **CRUD Operations**: Full create, read, update, delete for persistent groups
- **Safe Deletion**: Removing a group doesn't remove student task/performance data

## Implementation Details

### Technology Stack

- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Routing**: React Router v6
- **State Management**: React hooks + localStorage for persistence
- **Styling**: Plain CSS with utility classes

### Data Model

The prototype includes seed data:
- 1 school
- 1 teacher user
- 2 classes (Class A, Class B)
- 60 students total (30 per class)
- Each student assigned to a Mathspace Group
- 2 pre-existing persistent custom groups
- 3 question sets (Foundation, Standard, Advanced)

All data is stored in localStorage for persistence between sessions.

## Getting Started

### Installation

```bash
cd teacher-groups-prototype
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:5173/](http://localhost:5173/)

### Build for Production

```bash
npm run build
```

## User Flows (All Implemented)

### Flow A: Create Persistent Group (Global)

**Entry Point**: Classes → Class Detail → Groups tab → "Create Group"

**Steps**:
1. Enter group name, description, color, and tags
2. Choose scope (class-scoped recommended, or cross-class)
3. Select students from available pool
4. Review and save

**Result**: Group appears in persistent groups list and is available for task assignment

### Flow B: Create Group During Task Creation

**Entry Point**: Create Task (from sidebar)

**Steps**:
1. Enter task basics (title, class, due date)
2. Targeting step with three group sections:
   - **Mathspace Groups**: System groups (Explorer/Adventurer/Trailblazer)
   - **Persistent Custom Groups**: Previously created groups
   - **Temporary Groups**: Create single-use groups inline
3. Assign question sets to any group type
4. View group membership via expandable preview
5. Toggle "Mathspace auto-assign" for quick setup
6. Create temporary or persistent groups without leaving wizard
7. Review and create task

**Result**: Task created with group-based question set assignments

### Flow C: Task Report with Group Filtering

**Entry Point**: Task Detail → "View Full Report"

**Features**:
- Summary statistics (completion, average score)
- Filter by group type:
  - All students
  - Mathspace Groups
  - Persistent Custom Groups
  - Temporary Groups
- Select specific group to filter results
- Mathspace Group comparison table showing:
  - Student count per group
  - Completion rates
  - Average scores
  - Assigned question sets
- Detailed student results table with filtering

### Flow D: Create Group from Class Context

**Entry Point**: Classes → Class Detail → Groups Tab → "Create Group"

**Behavior**: Same as Flow A, but class is pre-selected and student picker limited to that class

### Flow E: Manage Student Group Membership

**Entry Point**: Students → Student Detail

**Features**:
- View and override student's Mathspace Group placement
- View all persistent custom groups the student belongs to
- Add student to multiple groups via modal with search
- Remove student from groups
- Changes reflect immediately across all views

## Navigation Structure

- **Dashboard** - Quick actions and overview (stub)
- **Create Task** - Full task creation wizard (✓ MVP)
- **Classes** - List and detail views with group management (✓ MVP)
- **Students** - List and detail views with group membership (✓ MVP)
- **Task Templates** - (stub)
- **Textbook & Search** - (stub)
- **Notifications** - (stub)
- **Profile/Admin** - (stub)

## Acceptance Criteria (All Met)

✅ Teacher can create a persistent group globally and within a class context
✅ Teacher can create a temporary group inline in task assignment
✅ Teacher can assign Question Sets to Mathspace Groups, Persistent Custom Groups, and Temporary Groups
✅ Teacher can view "who's in this group" during task assignment
✅ Teacher can open a task report and filter results by any group type
✅ Teacher can edit group membership from Student detail
✅ Teacher can delete a persistent group without deleting student task results

## UI Components

### Reusable Components

- **Group Pill**: Colored badge showing group name
- **Member Preview**: Shows first 5 members + count
- **Modal/Drawer**: For creating groups and viewing details
- **Searchable Student List**: Multi-select with checkboxes
- **Tag Input**: Comma-separated tag management
- **Filters**: Dynamic filtering by group type

### Validation

- Empty group names not allowed
- Duplicate names allowed with warning: "A group with this name already exists"
- Delete confirmation dialogs for safety

## Data Persistence

- **Persistent Groups**: Saved to localStorage, available across sessions
- **Temporary Groups**: Exist only in task draft; stored inside task record when task is created
- **Tasks & Results**: Saved to localStorage with fake performance data for demonstration

## Local Storage Key

All data is stored under the key: `teacher-groups-app-data`

To reset the app to initial state, open browser console and run:
```javascript
localStorage.removeItem('teacher-groups-app-data');
```

Then refresh the page.

## Known Limitations (Prototype Scope)

- No backend/API integration
- No authentication/authorization
- Fake task results (random scores)
- No real task content beyond placeholder question sets
- No image/file uploads
- No real-time updates across multiple users
- No undo/redo functionality
- Limited error handling (alerts used for simplicity)

## File Structure

```
src/
├── components/
│   ├── CreateGroupModal.tsx        # Persistent group creation
│   └── CreateTemporaryGroupModal.tsx # Temporary group creation
├── data/
│   ├── seedData.ts                 # Initial seed data
│   └── storage.ts                  # localStorage utilities
├── pages/
│   ├── ClassDetail.tsx             # Class detail with tabs
│   ├── ClassesList.tsx             # Classes listing
│   ├── CreateTask.tsx              # Task creation wizard
│   ├── Dashboard.tsx               # Home page
│   ├── StudentDetail.tsx           # Student profile + groups
│   ├── StudentsList.tsx            # Students listing
│   ├── Stub.tsx                    # Placeholder pages
│   ├── TaskDetail.tsx              # Task overview
│   └── TaskReport.tsx              # Task report with filtering
├── App.css                         # Main styles
├── App.tsx                         # Root component with routing
├── types.ts                        # TypeScript type definitions
└── main.tsx                        # Entry point
```

## Future Enhancements (Out of Scope)

- Drag-and-drop group creation from class roster
- Bulk import students from CSV
- Group templates/presets
- Advanced filtering (multiple groups, AND/OR logic)
- Export reports to PDF/Excel
- Group performance analytics over time
- Smart group suggestions based on performance
- Integration with learning management systems

## Support

This is a prototype for demonstration purposes. For questions or issues, refer to the codebase or create new tickets in your project management system.
