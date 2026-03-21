import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';
import {
    Users,
    GraduationCap,
    School,
    ArrowRight,
    Megaphone,
    ClipboardList,
    Award,
    Calendar,
    ChevronRight,
    TrendingUp,
    Fingerprint
} from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalFaculty: 0,
        totalDepartments: 0
    });
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, announcementsRes] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/announcements/my-announcements')
                ]);
                setStats(statsRes.data);
                setAnnouncements(announcementsRes.data);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-500 font-medium">Loading system overview...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
                <p className="text-red-600 font-medium">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-primary font-bold hover:underline">
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h2>
                    <p className="text-gray-500 mt-1 text-lg">Comprehensive overview of system and academic metrics.</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-gray-700 font-bold">Academic Year 2024-25</span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={GraduationCap}
                    color="bg-indigo-600 shadow-indigo-200"
                />
                <StatsCard
                    title="Total Faculty"
                    value={stats.totalFaculty}
                    icon={Users}
                    color="bg-emerald-600 shadow-emerald-200"
                />
                <StatsCard
                    title="Departments"
                    value={stats.totalDepartments}
                    icon={School}
                    color="bg-blue-600 shadow-blue-200"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (2/3) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Key Management Areas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Attendance Monitoring */}
                        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 transition-colors duration-300">
                                    <ClipboardList className="h-7 w-7 text-indigo-600 group-hover:text-white" />
                                </div>
                                <Link to="/dashboard/attendance-report" className="text-gray-400 hover:text-indigo-600 transition-colors">
                                    <ArrowRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Attendance Monitoring</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                Track daily registry across all departments. Generate analytical reports and monitor absenteeism trends.
                            </p>
                            <Link
                                to="/dashboard/attendance-report"
                                className="inline-flex items-center justify-center w-full py-3 bg-gray-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold transition-all duration-300 border border-transparent hover:border-indigo-100"
                            >
                                Open Attendance Logs
                            </Link>
                        </div>

                        {/* Result Management */}
                        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-purple-200 transition-all duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-purple-50 rounded-2xl group-hover:bg-purple-600 transition-colors duration-300">
                                    <Award className="h-7 w-7 text-purple-600 group-hover:text-white" />
                                </div>
                                <Link to="/dashboard/publish" className="text-gray-400 hover:text-purple-600 transition-colors text-xs">
                                    <ArrowRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Result Hub</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                Process academic performance, calculate grade points, and securely publish results to the student portal.
                            </p>
                            <Link
                                to="/dashboard/publish"
                                className="inline-flex items-center justify-center w-full py-3 bg-gray-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-xl font-bold transition-all duration-300 border border-transparent hover:border-purple-100"
                            >
                                Manage Performance
                            </Link>
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="bg-slate-50 rounded-2xl p-8 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                            Administrative Quick Access
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { name: 'Faculty List', path: '/dashboard/faculty', icon: Users, color: 'text-blue-600' },
                                { name: 'Students', path: '/dashboard/students', icon: GraduationCap, color: 'text-emerald-600' },
                                { name: 'Departments', path: '/dashboard/departments', icon: School, color: 'text-orange-600' },
                                { name: 'Biometrics', path: '/dashboard/biometrics', icon: Fingerprint, color: 'text-red-600' },
                                { name: 'Settings', path: '/dashboard/settings', icon: ChevronRight, color: 'text-slate-600' }
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-center group"
                                >
                                    <item.icon className={`h-6 w-6 mx-auto mb-2 ${item.color} group-hover:scale-110 transition-transform`} />
                                    <span className="text-xs font-bold text-gray-700">{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column (1/3) */}
                <div className="space-y-8">
                    {/* Announcements Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <Megaphone className="h-5 w-5 mr-2 text-blue-600" />
                                Recent Updates
                            </h3>
                            <Link to="/dashboard/announcements" className="text-xs font-bold text-primary hover:underline">
                                Manage
                            </Link>
                        </div>

                        <div className="p-6 space-y-4">
                            {announcements && announcements.length > 0 ? (
                                announcements.slice(0, 4).map((announcement) => (
                                    <div key={announcement._id} className="group p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-all cursor-default">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                {new Date(announcement.createdAt).toLocaleDateString()}
                                            </span>
                                            {announcement.priority === 'high' && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-extrabold rounded-full">Urgent</span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{announcement.title}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{announcement.message}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div className="bg-gray-50 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                                        <Megaphone className="h-6 w-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-400">No active announcements</p>
                                </div>
                            )}
                        </div>

                        {announcements.length > 4 && (
                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <Link
                                    to="/dashboard/announcements"
                                    className="flex items-center justify-center py-2 text-sm font-bold text-gray-600 hover:text-primary transition-colors"
                                >
                                    View Older Updates
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* System Activity Hub (Static/Placeholder) */}
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 shadow-lg shadow-indigo-100 text-white">
                        <h3 className="text-lg font-bold mb-4 flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 opacity-80" />
                            System Health
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="opacity-80">Database Logs</span>
                                <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-xs tracking-tighter">OPTIMIZED</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="opacity-80">Backup Status</span>
                                <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-xs">DAILY/SYNC</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                                <div className="bg-white rounded-full h-1.5 w-[98%] shadow-[0_0_8px_white]"></div>
                            </div>
                            <p className="text-[10px] opacity-60 text-center mt-4 uppercase font-bold tracking-widest">Global Sync Active</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

