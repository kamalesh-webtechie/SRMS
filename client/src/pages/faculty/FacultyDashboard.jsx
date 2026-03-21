import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard';
import { BookOpen, Users, ClipboardList, Megaphone, ArrowRight, GraduationCap, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const FacultyDashboard = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [facultyStats, setFacultyStats] = useState({ totalSubjects: 0, totalStudents: 0, avgPerformance: 0 });
    const [performanceData, setPerformanceData] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [announcementsRes, assignmentsRes, statsRes] = await Promise.all([
                    api.get('/announcements/my-announcements'),
                    api.get('/teaching-assignments/faculty/current'),
                    api.get('/teaching-assignments/faculty/stats')
                ]);

                setAnnouncements(announcementsRes.data);
                setAssignments(assignmentsRes.data);
                setFacultyStats(statsRes.data);

                // Simulating performance data
                await new Promise(r => setTimeout(r, 1000));
                setPerformanceData([
                    { name: 'Data Structures', classAvg: 78, passRate: 92 },
                    { name: 'Database Mgmt', classAvg: 85, passRate: 96 },
                    { name: 'Op. Systems', classAvg: 72, passRate: 88 },
                    { name: 'Comp. Networks', classAvg: 68, passRate: 84 },
                ]);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Standard Admin Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h2>
                    <p className="text-gray-500 mt-1">Welcome back, {user?.name || 'Faculty'}. Manage your academic responsibilities.</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    <span className="text-gray-700 font-medium">Fall 2024 Semester</span>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                    title="Total Subjects"
                    value={facultyStats.totalSubjects}
                    icon={BookOpen}
                    color="bg-blue-600"
                />
                <StatsCard
                    title="Total Students"
                    value={facultyStats.totalStudents}
                    icon={Users}
                    color="bg-indigo-600"
                />
                <StatsCard
                    title="Avg Performance"
                    value={`${facultyStats.avgPerformance}%`}
                    icon={TrendingUp}
                    color="bg-emerald-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Assigned Classes Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <BookOpen className="h-5 w-5 mr-2 text-indigo-600" />
                                My Teaching Assignments
                            </h3>
                        </div>

                        <div className="p-6">
                            {assignments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {assignments.map(assign => (
                                        <div key={assign._id} className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
                                            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="h-5 w-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0 bg-indigo-50 rounded-lg p-3 group-hover:bg-indigo-600 transition-colors duration-300">
                                                    <BookOpen className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                                                </div>
                                                <div className="ml-4">
                                                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                                                        {assign.subjectId?.name}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 font-mono mb-3">{assign.subjectId?.code}</p>

                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200">
                                                            {assign.sectionId?.name}
                                                        </span>
                                                        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-blue-100">
                                                            Year {assign.sectionId?.year}
                                                        </span>
                                                        <span className="bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-purple-100">
                                                            {assign.sectionId?.departmentId?.name || assign.subjectId?.department || "Dept"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="bg-slate-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                                        <BookOpen className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-medium">No subjects assigned for this term.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">Subject Performance Overview</h3>
                        </div>
                        <div className="p-6 h-80 w-full">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-slate-400">Loading Analytics...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={performanceData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                        <Tooltip
                                            cursor={{ fill: '#F1F5F9' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="classAvg" name="Class Average (%)" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        <Bar dataKey="passRate" name="Pass Rate (%)" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <Link to="/dashboard/marks-entry" className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md hover:bg-slate-50 transition-all group">
                                <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3 group-hover:bg-indigo-600 transition-colors">
                                    <ClipboardList className="h-5 w-5 text-indigo-700 group-hover:text-white" />
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-sm font-bold text-slate-900">Enter Marks</h4>
                                    <p className="text-xs text-slate-500 mt-1">Update internal scores</p>
                                </div>
                                <ArrowRight className="ml-auto h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                            </Link>

                            <Link to="/dashboard/attendance" className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-purple-300 hover:shadow-md hover:bg-slate-50 transition-all group">
                                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3 group-hover:bg-purple-600 transition-colors">
                                    <Users className="h-5 w-5 text-purple-700 group-hover:text-white" />
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-sm font-bold text-slate-900">Attendance</h4>
                                    <p className="text-xs text-slate-500 mt-1">Mark daily registry</p>
                                </div>
                                <ArrowRight className="ml-auto h-4 w-4 text-slate-300 group-hover:text-purple-600 transition-colors" />
                            </Link>
                        </div>
                    </div>

                    {/* Announcements Widget */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Megaphone className="h-5 w-5 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Announcements</h3>
                        </div>

                        <div className="space-y-4">
                            {announcements && announcements.length > 0 ? (
                                announcements.slice(0, 3).map((announcement) => (
                                    <div key={announcement._id} className="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-default">
                                        <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">{announcement.title}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{announcement.message}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                                {new Date(announcement.createdAt).toLocaleDateString()}
                                            </span>
                                            {announcement.priority === 'high' && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">High Priority</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No recent announcements.</p>
                            )}
                        </div>

                        <button className="w-full mt-6 py-2 bg-gray-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">
                            View All Updates
                        </button>
                    </div>

                    {/* Recent Notifications */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Upcoming Deadlines</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <span className="flex-shrink-0 h-2 w-2 mt-1.5 rounded-full bg-red-500 mr-3"></span>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Submit Internal 1 Marks</p>
                                    <p className="text-xs text-slate-400">Due by Friday, 5:00 PM</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="flex-shrink-0 h-2 w-2 mt-1.5 rounded-full bg-amber-500 mr-3"></span>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Department Meeting</p>
                                    <p className="text-xs text-slate-400">Tomorrow at 10:00 AM</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyDashboard;
