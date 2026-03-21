import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SystemProvider } from './context/SystemContext';
import Login from './pages/Login';
import RoleSelection from './pages/RoleSelection';
import AdminLogin from './pages/AdminLogin';
import FacultyLogin from './pages/FacultyLogin';
import StudentLogin from './pages/StudentLogin';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import FacultyList from './pages/admin/FacultyList';
import StudentList from './pages/admin/StudentList';
import SubjectList from './pages/admin/SubjectList';
import DepartmentList from './pages/admin/DepartmentList';
import SectionManagement from './pages/admin/SectionManagement';
import FacultyAssignment from './pages/admin/FacultyAssignment';
import PublishResults from './pages/admin/PublishResults';
import AttendanceReports from './pages/admin/AttendanceReports';
import SystemSettings from './pages/admin/SystemSettings';
import AnnouncementManagement from './pages/admin/AnnouncementManagement';
import MarksManagement from './pages/admin/MarksManagement';
import BiometricSettings from './pages/admin/BiometricSettings';
import LandingPage from './pages/LandingPage';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import MarksEntry from './pages/faculty/MarksEntry';
import AttendanceSheet from './pages/faculty/AttendanceSheet';
import StudentResults from './pages/student/StudentResults';
import StudentProfile from './pages/student/profile/StudentProfile';
import TimeTableManagement from './pages/admin/TimeTableManagement';
import StudentTimeTable from './pages/student/StudentTimeTable';
import FacultyTimeTable from './pages/faculty/FacultyTimeTable';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard or unauthorized page
    return <Navigate to="/" />;
  }

  return children;
};

// Role Based Dashboard Redirector
import HodDashboard from './pages/hod/HodDashboard';
import StudentDashboard from './pages/student/StudentDashboard'; // Import added

const DashboardDispatcher = () => {
  const { user } = useAuth();
  // Role based redirection is handled within the dashboard layout index
  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'hod') return <HodDashboard />;
  if (user.role === 'faculty') return <FacultyDashboard />;
  if (user.role === 'student') return <StudentDashboard />; // Updated
  return <div>Unknown Role</div>;
}

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const TimeTableDispatcher = () => {
  const { user } = useAuth();
  if (user.role === 'admin' || user.role === 'hod') return <TimeTableManagement />;
  if (user.role === 'student') return <StudentTimeTable />;
  return <Navigate to="/dashboard" />;
}

function App() {
  return (
    <AuthProvider>
      <SystemProvider>
        <Router>
          <Routes>
            {/* Public Routes - Redirect to dashboard if logged in */}
            <Route path="/" element={
              <PublicOnlyRoute>
                <LandingPage />
              </PublicOnlyRoute>
            } />
            <Route path="/login" element={
              <PublicOnlyRoute>
                <RoleSelection />
              </PublicOnlyRoute>
            } />
            <Route path="/login/admin" element={
              <PublicOnlyRoute>
                <AdminLogin />
              </PublicOnlyRoute>
            } />
            <Route path="/login/faculty" element={
              <PublicOnlyRoute>
                <FacultyLogin />
              </PublicOnlyRoute>
            } />
            <Route path="/login/student" element={
              <PublicOnlyRoute>
                <StudentLogin />
              </PublicOnlyRoute>
            } />

            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardDispatcher />} />

              {/* Admin & HOD Shared Routes */}
              <Route path="faculty" element={<ProtectedRoute allowedRoles={['admin', 'hod']}><FacultyList /></ProtectedRoute>} />
              <Route path="students" element={<ProtectedRoute allowedRoles={['admin', 'hod']}><StudentList /></ProtectedRoute>} />
              <Route path="subjects" element={<ProtectedRoute allowedRoles={['admin', 'hod']}><SubjectList /></ProtectedRoute>} />
              <Route path="departments" element={<ProtectedRoute allowedRoles={['admin']}><DepartmentList /></ProtectedRoute>} />
              <Route path="sections" element={<ProtectedRoute allowedRoles={['admin', 'hod']}><SectionManagement /></ProtectedRoute>} />
              <Route path="assignments" element={<ProtectedRoute allowedRoles={['admin', 'hod']}><FacultyAssignment /></ProtectedRoute>} />
              <Route path="publish" element={<ProtectedRoute allowedRoles={['admin']}><PublishResults /></ProtectedRoute>} />
              <Route path="attendance-report" element={<ProtectedRoute allowedRoles={['admin', 'hod']}><AttendanceReports /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><SystemSettings /></ProtectedRoute>} />
              <Route path="announcements" element={<ProtectedRoute allowedRoles={['admin', 'hod']}><AnnouncementManagement /></ProtectedRoute>} />
              <Route path="marks-management" element={<ProtectedRoute allowedRoles={['admin', 'hod']}><MarksManagement /></ProtectedRoute>} />
              <Route path="biometrics" element={<ProtectedRoute allowedRoles={['admin']}><BiometricSettings /></ProtectedRoute>} />

              {/* Shared Routes */}
              <Route path="timetable" element={<ProtectedRoute allowedRoles={['admin', 'hod', 'faculty', 'student']}><TimeTableDispatcher /></ProtectedRoute>} />

              {/* Faculty Routes */}
              <Route path="marks-entry" element={<ProtectedRoute allowedRoles={['faculty']}><MarksEntry /></ProtectedRoute>} />
              <Route path="attendance" element={<ProtectedRoute allowedRoles={['faculty']}><AttendanceSheet /></ProtectedRoute>} />
              <Route path="my-timetable" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyTimeTable /></ProtectedRoute>} />

              {/* Student Routes */}
              <Route path="my-results" element={<ProtectedRoute allowedRoles={['student']}><StudentResults /></ProtectedRoute>} />
              <Route path="profile" element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />
            </Route>

            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SystemProvider>
    </AuthProvider>
  );
}

export default App;
