import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    Save,
    Lock,
    ChevronRight,
    BookOpen,
    Users,
    Award,
    CheckCircle,
    AlertCircle,
    Loader2,
    GraduationCap,
    ArrowRightCircle,
    FileEdit,
    BadgeCheck,
    Dna
} from 'lucide-react';
import clsx from 'clsx';

const MarksEntry = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
    const [semester, setSemester] = useState('');
    const [examType, setExamType] = useState('Internal 1');
    const [maxMarks, setMaxMarks] = useState(100);
    const [students, setStudents] = useState([]);
    const [marksValues, setMarksValues] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [existingMarkDoc, setExistingMarkDoc] = useState(null);

    // Fetch faculty assignments on load
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const { data } = await api.get('/marks/faculty-assignments');
                setAssignments(data);
            } catch (error) {
                console.error("Failed to fetch assignments", error);
            }
        };
        fetchAssignments();
    }, []);

    // Selection changes - User wants NO default semester selection
    useEffect(() => {
        if (!selectedAssignmentId) {
            setSemester('');
        }
    }, [selectedAssignmentId]);

    // Fetch students and existing marks when selection changes
    useEffect(() => {
        if (!selectedAssignmentId || !examType || !semester) {
            setStudents([]);
            setExistingMarkDoc(null);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            try {
                const assign = assignments.find(a => a._id === selectedAssignmentId);
                if (!assign) return;

                const sectionIdStr = (assign.sectionId._id || assign.sectionId).toString();
                const subjectIdStr = (assign.subjectId._id || assign.subjectId).toString();

                const studentRes = await api.get(`/marks/students/${sectionIdStr}`);
                setStudents(studentRes.data);

                const marksRes = await api.get(`/marks/admin-view?sectionId=${sectionIdStr}&semester=${semester}&examType=${examType}`);

                const myMarkDoc = marksRes.data.find(m => {
                    const mSubId = (m.subjectId?._id || m.subjectId || '').toString();
                    const mFacId = (m.facultyId?._id || m.facultyId || '').toString();
                    return mSubId === subjectIdStr && mFacId === user._id.toString();
                });

                if (myMarkDoc) {
                    setExistingMarkDoc(myMarkDoc);
                    setMaxMarks(myMarkDoc.maxMarks || 100);
                    const initialValues = {};
                    myMarkDoc.records.forEach(r => {
                        const sid = r.studentId._id || r.studentId;
                        initialValues[sid] = r.marks;
                    });
                    setMarksValues(initialValues);
                } else {
                    setExistingMarkDoc(null);
                    setMarksValues({});
                    setMaxMarks(100);
                }
            } catch (error) {
                console.error("Failed to load students/marks", error);
                const errMsg = error.response?.data?.message || error.message || 'Unknown error';
                setMessage({ type: 'error', text: `Failed to load class data: ${errMsg}` });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedAssignmentId, examType, semester, assignments, user._id]);

    const handleMarkChange = (studentId, value) => {
        if (existingMarkDoc?.isLocked) return;
        const val = parseFloat(value) || 0;
        if (val > maxMarks) return;
        setMarksValues(prev => ({ ...prev, [studentId]: val }));
    };

    const handleSave = async (isLocking = false) => {
        if (!selectedAssignmentId || !semester) return;

        const assign = assignments.find(a => a._id === selectedAssignmentId);
        const records = students.map(s => ({
            studentId: s._id,
            marks: marksValues[s._id] || 0
        }));

        if (isLocking && !window.confirm("ARE YOU SURE? Locking will permanently disable editing for these records. This action is recorded.")) {
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const { data } = await api.post('/marks/entry', {
                subjectId: assign.subjectId._id || assign.subjectId,
                sectionId: assign.sectionId._id || assign.sectionId,
                semester: Number(semester),
                examType,
                maxMarks: Number(maxMarks),
                records
            });

            if (isLocking) {
                await api.put(`/marks/${data.markDoc._id}/lock`);
                setExistingMarkDoc({ ...data.markDoc, isLocked: true });
                setMessage({ type: 'success', text: 'Marks secured and locked successfully.' });
            } else {
                setExistingMarkDoc(data.markDoc);
                setMessage({ type: 'success', text: 'Draft marks saved successfully.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Transaction failed.' });
        } finally {
            setSubmitting(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const isLocked = existingMarkDoc?.isLocked;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20 px-4 md:px-0">
            {/* Standard Admin Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Marks Entry & Scholastic Registry</h2>
                    <p className="text-gray-500 mt-1">Securely input and manage academic achievement data.</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
                        <span className="block text-xl font-bold text-gray-900">{assignments.length}</span>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active Groups</span>
                    </div>
                    <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
                        <span className="block text-xl font-bold text-gray-900">{students.length}</span>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Students</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Control Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center">
                                <FileEdit className="h-4 w-4 mr-2 text-indigo-600" /> Configuration
                            </h3>
                            {isLocked && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Immutable
                            </span>}
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Teaching Allocation</label>
                                <select
                                    value={selectedAssignmentId}
                                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
                                    disabled={isLocked}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                >
                                    <option value="">-- Choose Module --</option>
                                    {assignments.map(a => (
                                        <option key={a._id} value={a._id}>
                                            {a.subjectId?.name} (Year {a.sectionId?.year} - Section {a.sectionId?.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Semester</label>
                                    <select
                                        value={semester}
                                        onChange={(e) => setSemester(e.target.value)}
                                        disabled={isLocked}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                    >
                                        <option value="">-- Select --</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                            <option key={num} value={num}>SEM {num}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Max Marks</label>
                                    <input
                                        type="number"
                                        value={maxMarks}
                                        onChange={(e) => setMaxMarks(e.target.value)}
                                        disabled={isLocked}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Evaluation Type</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['Internal 1', 'Internal 2', 'Semester'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => !isLocked && setExamType(type)}
                                            className={clsx(
                                                "px-4 py-3 rounded-md text-sm font-medium transition-all flex justify-between items-center group border",
                                                examType === type
                                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                            )}
                                        >
                                            {type}
                                            {examType === type && <CheckCircle className="h-4 w-4 text-indigo-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {!isLocked && selectedAssignmentId && semester && (
                            <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-3">
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={submitting}
                                    className="w-full py-2.5 bg-white text-indigo-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save Draft
                                </button>
                                <button
                                    onClick={() => handleSave(true)}
                                    disabled={submitting}
                                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                    Lock & Finalize
                                </button>
                            </div>
                        )}

                        {isLocked && (
                            <div className="p-6 bg-green-50 border-t border-green-200 text-center">
                                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                <h4 className="text-green-800 font-bold text-sm">Entry Finalized</h4>
                                <p className="text-green-600 text-xs mt-1">Records are locked from editing.</p>
                            </div>
                        )}
                    </div>

                    {message && (
                        <div className={clsx(
                            "p-5 rounded-3xl font-bold text-sm flex items-center gap-3 animate-slide-up shadow-lg border",
                            message.type === 'success' ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                        )}>
                            {message.type === 'success' ? <CheckCircle className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                            {message.text}
                        </div>
                    )}
                </div>

                {/* Registry View */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center">
                                    <Users className="h-4 w-4 mr-2 text-indigo-600" /> Registry Entries
                                </h3>
                            </div>
                            <div className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded border border-gray-200">
                                {examType} • {semester ? `SEM ${semester}` : 'SEM -'}
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            {!selectedAssignmentId || !semester ? (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
                                    <BookOpen className="h-12 w-12 mb-3 opacity-20" />
                                    <p>Select an allocation to view students.</p>
                                </div>
                            ) : loading ? (
                                <div className="h-full flex flex-col items-center justify-center p-12">
                                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
                                    <p className="text-sm text-gray-500">Loading records...</p>
                                </div>
                            ) : students.length > 0 ? (
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Register No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Marks / {maxMarks}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {students.map((student, index) => (
                                            <tr key={student._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">
                                                    {student.registerNumber}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {student.user?.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <input
                                                        type="number"
                                                        value={marksValues[student._id] || 0}
                                                        onChange={(e) => handleMarkChange(student._id, e.target.value)}
                                                        disabled={isLocked}
                                                        min="0"
                                                        max={maxMarks}
                                                        className={clsx(
                                                            "w-20 text-right px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm",
                                                            isLocked ? "bg-gray-50 border-transparent text-gray-500" : "bg-white border-gray-300",
                                                            (marksValues[student._id] || 0) < (maxMarks * 0.4) && !isLocked ? "text-red-600 border-red-300 focus:border-red-500 focus:ring-red-200" : ""
                                                        )}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
                                    <Users className="h-12 w-12 mb-3 opacity-20" />
                                    <p>No students found in this section.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarksEntry;
