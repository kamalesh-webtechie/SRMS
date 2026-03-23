import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Award, User, Megaphone, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import AIAnalysisCard from '../../components/AIAnalysisCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const PerformanceChart = ({ academicHistory }) => {
    // Transform history for chart
    const data = academicHistory.map(sem => ({
        name: `Sem ${sem.semester}`,
        sgpa: parseFloat(sem.sgpa),
        credits: sem.totalCredits
    })).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 h-full hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Performance Trend (SGPA)
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            domain={[0, 10]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="sgpa"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, fill: '#4f46e5', stroke: '#c7d2fe', strokeWidth: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const StudentDashboard = () => {
    const { user } = useAuth();
    const [resultData, setResultData] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch announcements
                let announcementsData = [];
                try {
                    const { data } = await api.get('/announcements/my-announcements');
                    announcementsData = data;
                } catch (e) {
                    console.warn("Announcements fetch failed", e);
                }
                setAnnouncements(announcementsData);

                const meRes = await api.get('/auth/me');
                if (meRes.data.profile) {
                    const profileId = meRes.data.profile._id;
                    const resultRes = await api.get(`/academic/results/student/${profileId}`);
                    setResultData(resultRes.data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 animate-fade-in">
                <div className="text-lg text-gray-500">Loading dashboard...</div>
            </div>
        );
    }

    if (!resultData) {
        return (
            <div className="text-center py-10 animate-fade-in">
                <h3 className="text-xl font-medium text-gray-600">Welcome, {user?.name}</h3>
                <p className="text-gray-500 mt-2">No academic profile data found.</p>
            </div>
        );
    }

    const { student, academicHistory } = resultData;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* New Result Notification */}
            {student.hasNewResult && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md animate-bounce-subtle flex items-center justify-between">
                    <div className="flex items-center">
                        <Award className="h-6 w-6 mr-3 text-green-600" />
                        <div>
                            <p className="font-bold text-lg">New Result Published!</p>
                            <p className="text-sm">Your latest exam results are now available for viewing.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.location.href = '/dashboard/my-results'}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition"
                    >
                        View Now
                    </button>
                </div>
            )}

            {/* Header / ID Card Style */}
            <div className="bg-gradient-to-r from-primary to-blue-800 rounded-lg shadow-lg p-6 text-white transform transition-all hover:scale-[1.01] duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30 overflow-hidden">
                            {(user.profilePhotoUrl || student.profilePhotoUrl) ? (
                                <img
                                    src={getMediaUrl(user.profilePhotoUrl || student.profilePhotoUrl)}
                                    alt={student.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <User className="h-8 w-8 text-white" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{student.name}</h2>
                            <p className="text-blue-200 flex items-center mt-1">
                                <Award className="h-4 w-4 mr-1" /> {student.registerNumber}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 text-right space-y-2">
                        <div>
                            <div className="text-blue-200 text-sm uppercase tracking-wider">Department</div>
                            <div className="text-xl font-bold">{student.department}</div>
                        </div>
                        <div>
                            <div className="text-blue-200 text-sm uppercase tracking-wider">Section</div>
                            <div className="text-xl font-bold bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm inline-block">
                                {student.section?.name || 'No Section'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Announcements Section */}
            {announcements && announcements.length > 0 && (
                <div className="bg-white border-l-4 border-indigo-500 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Megaphone className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Latest Announcements</h3>
                            <p className="text-sm text-gray-500">Important updates from the administration</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {announcements.slice(0, 3).map((announcement) => (
                            <div key={announcement._id} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-200 group relative overflow-hidden">
                                {announcement.priority === 'high' && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg shadow-sm">
                                            Priority
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h4 className="font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                                        {announcement.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                        {announcement.message}
                                    </p>

                                    <div className="pt-3 mt-1 flex items-center justify-between border-t border-gray-200/60">
                                        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(announcement.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            View <ChevronRight className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AIAnalysisCard studentName={student.name} academicHistory={academicHistory} />
                </div>
                <div>
                    <PerformanceChart academicHistory={academicHistory} />
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
