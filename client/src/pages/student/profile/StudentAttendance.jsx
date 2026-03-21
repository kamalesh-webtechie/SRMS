import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const StudentAttendance = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const { data } = await api.get('/attendance/me');
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch attendance");
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    if (loading) return <div className="p-6 text-center text-gray-500">Loading attendance...</div>;
    if (stats.length === 0) return null; // Or show explicit "No records"

    // Calculate aggregated attendance
    const totalClasses = stats.reduce((sum, s) => sum + s.totalClasses, 0);
    const totalPresent = stats.reduce((sum, s) => sum + s.presentCount, 0);
    const overallPercentage = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(1) : 0;

    const pieData = [
        { name: 'Present', value: totalPresent },
        { name: 'Absent', value: totalClasses - totalPresent }
    ];
    const COLORS = ['#10b981', '#ef4444'];

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mt-8">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-indigo-500" />
                    Attendance Overview
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${overallPercentage >= 75 ? 'bg-green-100 text-green-800' :
                    overallPercentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                    Overall: {overallPercentage}%
                </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Chart */}
                <div className="h-48 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Subject List */}
                <div className="md:col-span-2 space-y-4 max-h-64 overflow-y-auto pr-2">
                    {stats.map((subject) => {
                        const pct = subject.percentage.toFixed(1);
                        return (
                            <div key={subject._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div>
                                    <p className="font-bold text-gray-800">{subject.subjectName}</p>
                                    <p className="text-xs text-gray-500">{subject.subjectCode}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-700">
                                        {subject.presentCount} / {subject.totalClasses}
                                    </div>
                                    <div className={`text-xs font-bold ${pct >= 75 ? 'text-green-600' : 'text-red-500'
                                        }`}>
                                        {pct}%
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {overallPercentage < 75 && (
                <div className="bg-orange-50 px-6 py-3 border-t border-orange-100 flex items-start text-sm text-orange-800">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <p>Your attendance is below 75%. Please attend more classes to avoid debarment.</p>
                </div>
            )}
        </div>
    );
};

export default StudentAttendance;
