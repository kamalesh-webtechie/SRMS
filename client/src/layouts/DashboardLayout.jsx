import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';
import api from '../services/api';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Settings,
    LogOut,
    Menu,
    X,
    School,
    Book,
    ClipboardList,
    Award,
    Send,
    User,
    Layers,
    UserCheck,
    Calendar,
    Megaphone // For Announcements if needed, using Award for now but let's see. Award is already imported.
} from 'lucide-react';
import clsx from 'clsx';
import GlobalDateTime from '../components/GlobalDateTime';

const SidebarItem = ({ icon: Icon, label, to, active, hasBadge, collapsed, onClick }) => {
    return (
        <Link
            to={to}
            onClick={onClick}
            className={clsx(
                "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 relative group",
                active
                    ? "bg-accent text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white",
                collapsed ? "justify-center px-2" : ""
            )}
            title={collapsed ? label : undefined}
        >
            <Icon className={clsx("h-5 w-5 transition-all duration-300 ease-in-out flex-shrink-0", collapsed ? "mr-0" : "mr-3")} />
            <span
                className={clsx(
                    "transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden",
                    collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
                style={{ transitionDelay: collapsed ? '0ms' : '50ms' }}
            >
                {label}
            </span>
            {hasBadge && (
                <span className={clsx("absolute right-4 flex h-2 w-2 transition-all duration-300", collapsed && "top-2 right-2")}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
            )}
        </Link>
    )
}

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const { systemSettings } = useSystem();
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const [hasNewResult, setHasNewResult] = useState(false);
    const location = useLocation();

    // Close sidebar on mobile when location changes
    useEffect(() => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }, [location.pathname]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (user && user.role === 'student') {
            const checkResults = async () => {
                try {
                    const meRes = await api.get('/auth/me');
                    if (meRes.data.profile) {
                        const profileId = meRes.data.profile._id;
                        const { data } = await api.get(`/academic/results/student/${profileId}`);
                        if (data.student?.hasNewResult) {
                            setHasNewResult(true);
                        }
                    }
                } catch (error) {
                    console.error("Failed to check results badge", error);
                }
            };
            checkResults();
        }
    }, [user, location.pathname]);

    const handleSidebarToggle = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const handleNavItemClick = () => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={clsx(
                "fixed inset-y-0 left-0 z-50 bg-primary transition-all duration-300 ease-in-out md:relative",
                isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:translate-x-0 md:w-20"
            )}>
                <div className="flex flex-col h-full border-r border-slate-700">
                    <div className={clsx("flex items-center h-20 px-4 bg-secondary", isSidebarOpen ? "justify-between" : "justify-center")}>
                        <div className="flex items-center">
                            {(systemSettings?.collegeProfile?.logoUrl || systemSettings?.collegeLogo) ? (
                                <img src={systemSettings?.collegeProfile?.logoUrl || systemSettings?.collegeLogo} alt="Logo" className="h-10 w-10 rounded-full" />
                            ) : (
                                // Fallback icon if no logo image, or just show text if open
                                !isSidebarOpen && <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center text-white font-bold">G</div>
                            )}
                            {isSidebarOpen && (
                                <span className="text-lg font-bold text-white leading-tight ml-2">
                                    {systemSettings?.collegeProfile?.collegeName || systemSettings?.collegeName || 'Gradex'}
                                </span>
                            )}
                        </div>
                        {isSidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="md:hidden text-white p-2 hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4 px-2 space-y-1">
                        <SidebarItem
                            icon={LayoutDashboard}
                            label="Dashboard"
                            to="/dashboard"
                            active={location.pathname === '/dashboard'}
                            collapsed={!isSidebarOpen}
                            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                        />
                        {/* Admin Menus */}
                        {user.role === 'admin' && (
                            <>
                                <SidebarItem
                                    to="/dashboard/departments"
                                    active={location.pathname.startsWith('/dashboard/departments')}
                                    icon={School}
                                    label="Departments"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/sections"
                                    active={location.pathname.startsWith('/dashboard/sections')}
                                    icon={Layers}
                                    label="Sections"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/subjects"
                                    active={location.pathname.startsWith('/dashboard/subjects')}
                                    icon={Book}
                                    label="Subjects"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/students"
                                    active={location.pathname.startsWith('/dashboard/students')}
                                    icon={GraduationCap}
                                    label="Students"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/faculty"
                                    active={location.pathname.startsWith('/dashboard/faculty')}
                                    icon={Users}
                                    label="Faculty"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/allocations"
                                    active={location.pathname.startsWith('/dashboard/allocations')}
                                    icon={UserCheck}
                                    label="Allocations"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/timetable"
                                    active={location.pathname.startsWith('/dashboard/timetable')}
                                    icon={Calendar}
                                    label="Time Table"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/marks-management"
                                    active={location.pathname.startsWith('/dashboard/marks-management')}
                                    icon={ClipboardList}
                                    label="Manage Marks"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/attendance-report"
                                    active={location.pathname.startsWith('/dashboard/attendance-report')}
                                    icon={ClipboardList}
                                    label="Attendance Reports"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/publish"
                                    active={location.pathname.startsWith('/dashboard/publish')}
                                    icon={Send}
                                    label="Publish Results"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/announcements"
                                    active={location.pathname.startsWith('/dashboard/announcements')}
                                    icon={Award} // Using Award temporarily or find better icon
                                    label="Announcements"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/settings"
                                    active={location.pathname.startsWith('/dashboard/settings')}
                                    icon={Settings}
                                    label="System Settings"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                            </>
                        )}
                        {/* HOD Menus */}
                        {user.role === 'hod' && (
                            <>
                                <SidebarItem
                                    to="/dashboard/sections"
                                    active={location.pathname.startsWith('/dashboard/sections')}
                                    icon={Layers}
                                    label="Sections"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/subjects"
                                    active={location.pathname.startsWith('/dashboard/subjects')}
                                    icon={Book}
                                    label="Subjects"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/students"
                                    active={location.pathname.startsWith('/dashboard/students')}
                                    icon={GraduationCap}
                                    label="Students"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/faculty"
                                    active={location.pathname.startsWith('/dashboard/faculty')}
                                    icon={Users}
                                    label="Faculty"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/allocations"
                                    active={location.pathname.startsWith('/dashboard/allocations')}
                                    icon={UserCheck}
                                    label="Class Allocations"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/timetable"
                                    active={location.pathname.startsWith('/dashboard/timetable')}
                                    icon={Calendar}
                                    label="Time Table"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/marks-management"
                                    active={location.pathname.startsWith('/dashboard/marks-management')}
                                    icon={ClipboardList}
                                    label="Approve Marks"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/attendance-report"
                                    active={location.pathname.startsWith('/dashboard/attendance-report')}
                                    icon={ClipboardList}
                                    label="Attendance"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    to="/dashboard/announcements"
                                    active={location.pathname.startsWith('/dashboard/announcements')}
                                    icon={Award}
                                    label="Announcements"
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                            </>
                        )}
                        {/* Faculty Menus */}
                        {user.role === 'faculty' && (
                            <>
                                <SidebarItem
                                    icon={ClipboardList}
                                    label="Enter Marks"
                                    to="/dashboard/marks-entry"
                                    active={location.pathname.startsWith('/dashboard/marks-entry')}
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    icon={Users}
                                    label="Attendance"
                                    to="/dashboard/attendance"
                                    active={location.pathname === '/dashboard/attendance'}
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    icon={Calendar}
                                    label="My Timetable"
                                    to="/dashboard/my-timetable"
                                    active={location.pathname === '/dashboard/my-timetable'}
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />

                            </>
                        )}
                        {/* Student Menus */}
                        {user.role === 'student' && (
                            <>
                                <SidebarItem
                                    icon={User}
                                    label="My Profile"
                                    to="/dashboard/profile"
                                    active={location.pathname === '/dashboard/profile'}
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    icon={Award}
                                    label="My Results"
                                    to="/dashboard/my-results"
                                    active={location.pathname.startsWith('/dashboard/my-results')}
                                    hasBadge={hasNewResult}
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                                <SidebarItem
                                    icon={Calendar}
                                    label="Timetable"
                                    to="/dashboard/timetable"
                                    active={location.pathname === '/dashboard/timetable'}
                                    collapsed={!isSidebarOpen}
                                    onClick={handleNavItemClick}
                                />
                            </>
                        )}
                        {/* Placeholder for other roles */}
                        <div className="mt-auto pt-10">
                            <button
                                onClick={logout}
                                className={clsx(
                                    "w-full flex items-center px-4 py-3 text-sm font-medium text-slate-300 rounded-md hover:bg-red-600 hover:text-white transition-colors duration-200",
                                    !isSidebarOpen && "justify-center px-2"
                                )}
                                title={!isSidebarOpen ? "Logout" : undefined}
                            >
                                <LogOut className={clsx("h-5 w-5", isSidebarOpen ? "mr-3" : "mr-0")} />
                                {isSidebarOpen && "Logout"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative md:z-50">
                <header className="flex items-center justify-between h-16 bg-white shadow-sm px-6 border-b border-slate-200">
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="text-gray-500 hover:text-primary focus:outline-none mr-4"
                    >
                        <Menu className={clsx("h-6 w-6 transition-transform duration-300 ease-in-out", isSidebarOpen ? "rotate-0" : "rotate-180")} />
                    </button>
                    <div className="flex items-center space-x-4">
                        <GlobalDateTime />
                        <span className="text-sm font-medium text-text hidden sm:inline-block">
                            Welcome, {user.name} ({user.role})
                        </span>
                        <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white font-bold overflow-hidden border border-gray-200">
                            {user.profilePhotoUrl ? (
                                <img
                                    src={getMediaUrl(user.profilePhotoUrl)}
                                    alt={user.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                user.name.charAt(0)
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
                    <div key={location.pathname} className="animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
