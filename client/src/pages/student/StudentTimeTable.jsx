import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import api from '../../services/api';

const StudentTimeTable = () => {
    const [timetable, setTimetable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const { data } = await api.get('/timetable/student');
            setTimetable(data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load timetable');
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

    if (error || !timetable) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{error || 'No timetable available for your section'}</p>
            </div>
        );
    }

    // Get all unique period numbers to create columns
    const allPeriods = [];
    timetable.days.forEach(d => {
        d.periods.forEach(p => {
            if (!allPeriods.find(ap => ap.periodNumber === p.periodNumber)) {
                allPeriods.push({
                    periodNumber: p.periodNumber,
                    startTime: p.startTime,
                    endTime: p.endTime
                });
            }
        });
    });
    allPeriods.sort((a, b) => a.periodNumber - b.periodNumber);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Weekly Timetable</h2>
                    <p className="text-gray-500 mt-1">
                        {timetable.department} • Year {timetable.year} • Section {timetable.section} • Semester {timetable.semester}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 bg-gray-100/50 sticky left-0 z-10 w-28 border-r">Day / Period</th>
                                {allPeriods.map((p, idx) => (
                                    <th key={idx} className="px-4 py-3 text-center min-w-[160px] border-r border-gray-200">
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
                            {dayOrder.map((day) => {
                                const dayData = timetable.days.find(d => d.day === day);
                                return (
                                    <tr key={day} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-4 py-6 whitespace-nowrap text-sm font-bold text-gray-900 bg-gray-50 sticky left-0 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0,03)]">
                                            {day}
                                        </td>
                                        {allPeriods.map((ap, pIdx) => {
                                            const slot = dayData?.periods.find(p => p.periodNumber === ap.periodNumber);
                                            if (!slot) return <td key={pIdx} className="px-4 py-4 border-r border-gray-100 bg-gray-50/20"></td>;

                                            return (
                                                <td key={pIdx} className={`px-4 py-4 border-r border-gray-200 min-w-[160px] ${slot.type !== 'class' ? 'bg-amber-50/30' : ''}`}>
                                                    {slot.type === 'class' ? (
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-bold text-gray-900 leading-tight">
                                                                {slot.subject.length > 5 ? `${slot.subject.substring(0, 3)}` : slot.subject}
                                                            </div>
                                                            <div className="flex items-center text-xs text-gray-600">
                                                                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold mr-1.5 shrink-0">
                                                                    {(slot.facultyId?.name || 'T').charAt(0)}
                                                                </div>
                                                                <span className="truncate font-medium">{slot.facultyId?.name || 'TBA'}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${slot.type === 'break' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                                }`}>
                                                                {slot.type}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

                </div>
            </div>

            {/* Faculty Information Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Faculty Information</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Faculty Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Emp ID</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                                const facultyMap = new Map();
                                timetable.days.forEach(d => {
                                    d.periods.forEach(p => {
                                        if (p.type === 'class' && p.facultyId) {
                                            const fid = p.facultyId._id || p.facultyId;
                                            if (!facultyMap.has(fid)) {
                                                facultyMap.set(fid, {
                                                    name: p.facultyId.name,
                                                    empId: p.facultyId.facultyProfile?.employeeId || 'N/A',
                                                    department: p.facultyId.facultyProfile?.department || 'N/A',
                                                    subject: p.subject
                                                });
                                            }
                                        }
                                    });
                                });
                                
                                return Array.from(facultyMap.values()).map((f, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{f.subject}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{f.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{f.empId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.department}</td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentTimeTable;
