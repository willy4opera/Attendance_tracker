import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationProvider'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import DashboardLayout from './components/layout/DashboardLayout'
import { DashboardPage } from './pages/dashboard'
import SessionList from './pages/sessions/SessionList'
import CreateSession from './pages/sessions/CreateSession'
import UserManagement from './pages/users/UserManagement'
import { UserProfile } from './pages/profile'
import { 
  AttendanceDashboard, 
  QRCodeScanner, 
  QRCodeGenerator,
  SessionAttendance,
  AttendanceHistory,
  MarkAttendance 
} from './pages/attendance'
import { 
  ProjectList, 
  ProjectDetails, 
  CreateProject, 
  EditProject 
} from './pages/projects'
import './App.css'
import { DepartmentManagement } from './pages/department'

// Import new board and task components
import BoardList from './pages/boards/BoardList'
import BoardView from './pages/boards/BoardView'
import CreateBoard from './pages/boards/CreateBoard'
import BoardSettings from './pages/boards/BoardSettings'
import TaskDetails from './pages/tasks/TaskDetails'
import CreateTask from './pages/tasks/CreateTask'
import EditTask from './pages/tasks/EditTask'
import TaskList from './pages/tasks/TaskList'

// Import template pages
import { 
  TemplateList, 
  TemplateDetails, 
  CreateTemplate, 
  EditTemplate 
} from './pages/templates'

// Import demo pages
import { WorkflowDemo } from './pages/demo'

// Placeholder components for other routes
const Reports = () => <div className="p-4"><h1 className="text-2xl">Reports Page</h1></div>
const Files = () => <div className="p-4"><h1 className="text-2xl">Files Page</h1></div>
const Settings = () => <div className="p-4"><h1 className="text-2xl">Settings Page</h1></div>

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

// Create router with future flags
const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/register',
      element: <Register />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: 'dashboard',
          element: <DashboardPage />,
        },
        {
          path: 'sessions',
          element: <SessionList />,
        },
        {
          path: 'sessions/create',
          element: <CreateSession />,
        },
        {
          path: 'attendance',
          element: <AttendanceDashboard />,
        },
        {
          path: 'attendance/history',
          element: <AttendanceHistory />,
        },
        {
          path: 'attendance/mark/:sessionId',
          element: <MarkAttendance />,
        },
        {
          path: 'attendance/session/:sessionId',
          element: <SessionAttendance />,
        },
        {
          path: 'qr-scanner',
          element: <QRCodeScanner />,
        },
        {
          path: 'qr-generator/:sessionId',
          element: <QRCodeGenerator />,
        },
        // Project Management Routes
        {
          path: 'projects',
          element: <ProjectList />,
        },
        {
          path: 'projects/create',
          element: <CreateProject />,
        },
        {
          path: 'projects/:id',
          element: <ProjectDetails />,
        },
        {
          path: 'projects/:id/edit',
          element: <EditProject />,
        },
        // Project Management Demo Route
        {
          path: 'projects/demo/workflow',
          element: <WorkflowDemo />,
        },
        // Board Management Routes
        {
          path: 'boards',
          element: <BoardList />,
        },
        {
          path: 'boards/create',
          element: <CreateBoard />,
        },
        {
          path: 'boards/:id',
          element: <BoardView />,
        },
        {
          path: 'boards/:id/settings',
          element: <BoardSettings />,
        },
        // Task Management Routes
        {
          path: 'tasks',
          element: <TaskList />,
        },
        {
          path: 'tasks/:id',
          element: <TaskDetails />,
        },
        {
          path: 'tasks/create',
          element: <CreateTask />,
        },
        {
          path: 'tasks/:id/edit',
          element: <EditTask />,
        },
        // Template Management Routes
        {
          path: 'templates',
          element: <TemplateList />,
        },
        {
          path: 'templates/create',
          element: <CreateTemplate />,
        },
        {
          path: 'templates/:id',
          element: <TemplateDetails />,
        },
        {
          path: 'templates/:id/edit',
          element: <EditTemplate />,
        },
        {
          path: 'reports',
          element: <Reports />,
        },
        {
          path: 'files',
          element: <Files />,
        },
        {
          path: 'users',
          element: <UserManagement />,
        },
        {
          path: 'departments',
          element: <DepartmentManagement />,
        },
        {
          path: 'profile',
          element: <UserProfile />,
        },
        {
          path: 'settings',
          element: <Settings />,
        },
      ],
    },
  ],
  {
    future: {
    },
  }
)

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
