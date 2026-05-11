import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import {
    Calendar,
    Save,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Users,
    ShieldCheck,
    UserPlus,
    UserMinus,
    AlertCircle,
    ChevronDown,
    Zap,
    GraduationCap,
    Lock,
    Unlock,
    Fingerprint,
    Search,
    Filter,
    X,
    Pencil
} from 'lucide-react';
import clsx from 'clsx';

const AttendanceSheet = () => {
    const { user } = useAuth();
    const { systemSettings } = useSystem();
    const isFaculty = user?.role === 'faculty';

    // Selection States
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
    const [departments, setDepartments] = useState([]);
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [sections, setSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(false);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Data State
    const [students, setStudents] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [remarksMap, setRemarksMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(true);
    const [message, setMessage] = useState(null);

    // Lock Logic
    let isLocked = false;
    try {
        if (isFaculty && systemSettings) {
            let lockTime = systemSettings.attendanceSettings?.attendanceLockTime || systemSettings.attendanceLockTime || '23:59';
            const today = new Date().toISOString().split('T')[0];
            if (selectedDate && selectedDate < today) {
                isLocked = true;
            } else if (selectedDate === today) {
                const parts = lockTime.split(':');
                if (parts.length === 2) {
                    const lockMins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                    const now = new Date();
                    if ((now.getHours() * 60 + now.getMinutes()) >= lockMins) isLocked = true;
                }
            }
        }
    } catch (err) { console.error(err); isLocked = false; }

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                if (isFaculty) {
                    const { data } = await api.get('/teaching-assignments/faculty/current');
                    setAssignments(data);
                } else {
                    const { data } = await api.get('/departments');
                    setDepartments(data);
                    if (data.length > 0) setSelectedDeptId(data[0]._id);
                }
            } catch (error) { console.error(error); }
        };
        fetchInitial();
    }, [isFaculty]);

    useEffect(() => {
        if (isFaculty || !selectedDeptId) return;
        const fetchData = async () => {
            setLoadingSections(true);
            try {
                const secRes = await api.get(`/sections/by-department/${selectedDeptId}`);
                console.log("Sections:", secRes.data);
                setSections(secRes.data);
                if (secRes.data.length > 0) setSelectedSectionId(secRes.data[0]._id);
                const dept = departments.find(d => d._id === selectedDeptId);
                if (dept) {
                    const subRes = await api.get(`/academic/subjects?department=${dept.code || dept.name}`);
                    setSubjects(subRes.data);
                    if (subRes.data.length > 0) setSelectedSubjectId(subRes.data[0]._id);
                }
            } catch (error) { 
                console.error(error); 
            } finally {
                setLoadingSections(false);
            }
        };
        fetchData();
    }, [isFaculty, selectedDeptId, departments]);

    useEffect(() => {
        let activeSubId = '', activeSecId = '';
        if (isFaculty) {
            const assign = assignments.find(a => a._id === selectedAssignmentId);
            if (assign) { activeSubId = assign.subjectId._id; activeSecId = assign.sectionId._id; }
        } else { activeSubId = selectedSubjectId; activeSecId = selectedSectionId; }

        if (!activeSubId || !activeSecId || !selectedDate) { setStudents([]); return; }

        const fetchSheet = async () => {
            setLoading(true);
            try {
                const studentRes = await api.get(`/students/by-section/${activeSecId}`);
                setStudents(studentRes.data);
                const attRes = await api.get(`/attendance/subject/${activeSubId}?date=${selectedDate}`);
                const existing = attRes.data;
                const sMap = {}, rMap = {};
                studentRes.data.forEach(s => {
                    const rec = existing.find(r => (r.student._id || r.student) === s._id);
                    sMap[s._id] = rec ? rec.status : '';
                    rMap[s._id] = rec ? (rec.remarks || '') : '';
                });
                setAttendanceMap(sMap);
                setRemarksMap(rMap);
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchSheet();
    }, [isFaculty, selectedAssignmentId, selectedSubjectId, selectedSectionId, selectedDate, assignments]);

    const handleSave = async () => {
        if (isLocked) return;
        setSaving(true);
        setMessage(null);
        try {
            let activeSubId = '', activeSecId = '';
            if (isFaculty) {
                const assign = assignments.find(a => a._id === selectedAssignmentId);
                if (assign) { activeSubId = assign.subjectId._id; activeSecId = assign.sectionId._id; }
            } else { activeSubId = selectedSubjectId; activeSecId = selectedSectionId; }

            const records = Object.keys(attendanceMap).map(studentId => {
                if (!attendanceMap[studentId]) {
                    throw new Error("Missing selection for some students.");
                }
                return {
                    studentId,
                    status: attendanceMap[studentId],
                    remarks: attendanceMap[studentId] === 'On-duty' ? remarksMap[studentId] : ''
                };
            });

            await api.post('/attendance', {
                subjectId: activeSubId,
                sectionId: activeSecId,
                date: selectedDate,
                records
            });
            setMessage({ type: 'success', text: 'Attendance data has been recorded successfully.' });
            setIsEditing(false); // Lock inputs after save
            setTimeout(() => setMessage(null), 5000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || error.message || 'Unable to update attendance records at this time.' });
        } finally { setSaving(false); }
    };

    const counts = {
        Present: Object.values(attendanceMap).filter(v => v === 'Present').length,
        Absent: Object.values(attendanceMap).filter(v => v === 'Absent').length,
        'On-duty': Object.values(attendanceMap).filter(v => v === 'On-duty').length,
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20 px-4 md:px-10">
            {/* Standard Admin Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Attendance Sheet</h2>
                    <p className="text-gray-500 mt-1">Manage daily student attendance records.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white px-3 py-2 rounded-md border border-gray-200 shadow-sm">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-gray-700 text-sm outline-none cursor-pointer"
                        />
                    </div>
                    <div className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border",
                        isLocked ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
                    )}>
                        {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        {isLocked ? 'Closed' : 'Open'}
                    </div>
                </div>
            </div>

            {/* Selection & Stats Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide px-1">Choose Assigned Class</label>
                        <div className="relative">
                            <select
                                value={selectedAssignmentId}
                                onChange={(e) => {
                                    setSelectedAssignmentId(e.target.value);
                                    setIsEditing(true); // Reset editing on new selection
                                }}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-slate-50 border-2 font-medium"
                                disabled={loadingSections}
                            >
                                {loadingSections ? (
                                    <option value="">Loading assignments/sections...</option>
                                ) : (
                                    <>
                                        <option value="">-- Select Class Context --</option>
                                        {assignments.length > 0 ? (
                                            assignments.map(a => (
                                                <option key={a._id} value={a._id}>
                                                    {a.sectionId?.departmentId?.name || "Dept"}, {a.sectionId?.year} Year, Sec {a.sectionId?.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No assignments found</option>
                                        )}
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 px-1">Today's Summary</label>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
                                <span className="block text-lg font-bold text-green-700">{counts.Present}</span>
                                <span className="text-xs font-medium text-green-600">Present</span>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2 text-center border border-red-100">
                                <span className="block text-lg font-bold text-red-700">{counts.Absent}</span>
                                <span className="text-xs font-medium text-red-600">Absent</span>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-2 text-center border border-yellow-100">
                                <span className="block text-lg font-bold text-yellow-700">{counts['On-duty']}</span>
                                <span className="text-xs font-medium text-yellow-600">OD</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nominal Roll Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                        <Users className="h-4 w-4 text-indigo-600" /> Students
                    </h3>
                    {!isLocked && students.length > 0 && (
                        <div className="flex items-center gap-2">
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors border border-indigo-100 bg-white"
                                    title="Edit Attendance"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving || !isEditing}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Attendance
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    {loading ? (
                        <div className="py-12 text-center flex flex-col items-center">
                            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
                            <p className="text-sm text-gray-500">Loading Records...</p>
                        </div>
                    ) : students.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {students.map((student, idx) => (
                                <div key={student._id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4 group">
                                    <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                                        <div className="w-6 text-slate-400 font-medium text-sm text-center">
                                            {idx + 1}.
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 shrink-0">
                                            {student.user?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                {student.user?.name}
                                            </h4>
                                            <div className="text-xs text-gray-500 font-mono font-medium">
                                                {student.registerNumber}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                                            {[
                                                { key: 'Present', label: 'P', activeClass: 'bg-white text-green-700 shadow-md border border-green-200' },
                                                { key: 'Absent', label: 'A', activeClass: 'bg-white text-red-700 shadow-md border border-red-200' },
                                                { key: 'On-duty', label: 'OD', activeClass: 'bg-white text-yellow-700 shadow-md border border-yellow-200' }
                                            ].map((status) => (
                                                <button
                                                    key={status.key}
                                                    onClick={() => !isLocked && isEditing && setAttendanceMap(p => ({ ...p, [student._id]: status.key }))}
                                                    disabled={isLocked || !isEditing}
                                                    className={clsx(
                                                        "h-8 w-11 rounded-md text-xs font-bold transition-all",
                                                        attendanceMap[student._id] === status.key ? status.activeClass : "text-gray-400 hover:text-gray-600",
                                                        (isLocked || !isEditing) && "cursor-not-allowed opacity-50 shadow-none"
                                                    )}
                                                >
                                                    {status.label}
                                                </button>
                                            ))}
                                        </div>
                                        {attendanceMap[student._id] === 'On-duty' && (
                                            <input
                                                type="text"
                                                placeholder="Remarks..."
                                                value={remarksMap[student._id]}
                                                disabled={isLocked || !isEditing}
                                                onChange={(e) => setRemarksMap(p => ({ ...p, [student._id]: e.target.value }))}
                                                className="w-full text-xs border-b border-yellow-300 bg-transparent outline-none focus:border-yellow-500 transition-colors h-6 text-right disabled:opacity-50"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center opacity-50">
                            <Users className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-sm text-gray-500">Select a subject to view students.</p>
                        </div>
                    )}
                </div>

                {!loading && students.length > 0 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-center text-slate-400 text-xs font-medium">
                        Students listed by Roll Number / Register Number
                    </div>
                )}
            </div>

            {message && (
                <div className={clsx(
                    "fixed top-10 right-10 z-[200] px-6 py-4 rounded-2xl shadow-xl border text-sm flex items-center gap-4 animate-slide-up max-w-md",
                    message.type === 'success' ? "bg-white text-slate-700 border-slate-200" : "bg-red-50 text-red-700 border-red-100"
                )}>
                    {message.type === 'success' ? (
                        <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0">
                            <CheckCircle className="h-5 w-5" />
                        </div>
                    ) : (
                        <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                    )}
                    <div className="flex-1 font-medium text-slate-600">
                        {message.text}
                    </div>
                    <button onClick={() => setMessage(null)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AttendanceSheet;
