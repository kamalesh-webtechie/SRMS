import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import api from '../../services/api';

const FacultyTimeTable = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const { data } = await api.get('/timetable/faculty');
            setSchedule(data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    if (error || schedule.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{error || 'No classes allocated to you yet'}</p>
            </div>
        );
    }

    // Consolidated Data for Grid
    // Key format: 'Day-PeriodNumber'
    const gridData = {};
    const allPeriods = [];

    schedule.forEach(tt => {
        tt.days.forEach(d => {
            d.periods.forEach(p => {
                const key = `${d.day}-${p.periodNumber}`;
                if (!gridData[key]) gridData[key] = [];
                gridData[key].push({
                    subject: p.subject,
                    class: `${tt.department} - ${tt.year} Yr (${tt.section})`
                });

                if (!allPeriods.find(ap => ap.periodNumber === p.periodNumber)) {
                    allPeriods.push({
                        periodNumber: p.periodNumber,
                        startTime: p.startTime,
                        endTime: p.endTime
                    });
                }
            });
        });
    });

    allPeriods.sort((a, b) => a.periodNumber - b.periodNumber);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Weekly Teaching Schedule</h2>
                <p className="text-gray-500 mt-1">Unified view of all your allocated sessions</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 bg-gray-100/50 sticky left-0 z-10 w-28 border-r">Day / Period</th>
                                {allPeriods.map((p, idx) => (
                                    <th key={idx} className="px-4 py-3 text-center min-w-[200px] border-r border-gray-200">
                                        <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Period {p.periodNumber}</div>
                                        <div className="flex items-center justify-center text-[10px] text-gray-500 font-medium">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {p.startTime} - {p.endTime}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {dayOrder.map((day) => (
                                <tr key={day} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-6 whitespace-nowrap text-sm font-bold text-gray-900 bg-gray-50 sticky left-0 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0,03)]">
                                        {day}
                                    </td>
                                    {allPeriods.map((ap, pIdx) => {
                                        const assignments = gridData[`${day}-${ap.periodNumber}`];
                                        if (!assignments || assignments.length === 0) {
                                            return <td key={pIdx} className="px-4 py-4 border-r border-gray-100 bg-gray-50/10 text-center">
                                                <span className="text-xs text-gray-300 font-medium">No Class</span>
                                            </td>;
                                        }

                                        return (
                                            <td key={pIdx} className="px-4 py-4 border-r border-gray-200 min-w-[200px] bg-indigo-50/30">
                                                <div className="space-y-3">
                                                    {assignments.map((asgn, aIdx) => (
                                                        <div key={aIdx} className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm border-l-4 border-l-indigo-500">
                                                            <div className="text-sm font-bold text-gray-900 mb-1 leading-snug">{asgn.subject}</div>
                                                            <div className="flex items-center text-[10px] text-indigo-600 font-bold uppercase tracking-tight">
                                                                <BookOpen className="h-3 w-3 mr-1 shrink-0" />
                                                                <span className="truncate">{asgn.class}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                        <h4 className="text-sm font-bold text-indigo-900">Teaching Hours</h4>
                    </div>
                    <p className="text-xs text-indigo-700">All periods shown are based on the latest institutional timetable configuration.</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <h4 className="text-sm font-bold text-emerald-900">Portal View</h4>
                    </div>
                    <p className="text-xs text-emerald-700">This grid consolidates allocations from multiple departments and classes into a single weekly view.</p>
                </div>
            </div>
        </div>
    );
};

export default FacultyTimeTable;
