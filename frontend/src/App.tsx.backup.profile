import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import DashboardLayout from './components/layout/DashboardLayout'
import { DashboardPage } from './pages/dashboard'
import SessionList from './pages/sessions/SessionList'
import CreateSession from './pages/sessions/CreateSession'
import UserManagement from './pages/users/UserManagement'
import { 
  AttendanceDashboard, 
  QRCodeScanner, 
  QRCodeGenerator,
  SessionAttendance,
  AttendanceHistory,
  MarkAttendance 
} from './pages/attendance'
import './App.css'

// Placeholder components for other routes
const Reports = () => <div className="p-4"><h1 className="text-2xl">Reports Page</h1></div>
const Files = () => <div className="p-4"><h1 className="text-2xl">Files Page</h1></div>
const Profile = () => <div className="p-4"><h1 className="text-2xl">Profile Page</h1></div>
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
          path: 'profile',
          element: <Profile />,
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
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
