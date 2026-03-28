import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Search,
    Loader2,
    Filter,
    BookOpen,
    Lock,
    Unlock,
    Users,
    FileText,
    CheckCircle
} from 'lucide-react';
import clsx from 'clsx';

import { useAuth } from '../../context/AuthContext';

const MarksManagement = () => {
    const { user } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [marks, setMarks] = useState([]);

    // Filters
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [semester, setSemester] = useState(1);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [examType, setExamType] = useState('Internal 1');

    const [loading, setLoading] = useState(false);
    const [loadingFilters, setLoadingFilters] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    // Initial Load: Departments
    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const { data } = await api.get('/departments');
                setDepartments(data);
                
                if (user?.role === 'hod' && user?.departmentId) {
                    setSelectedDeptId(user.departmentId);
                } else if (data.length > 0) {
                    setSelectedDeptId(data[0]._id);
                }
            } catch (error) {
                console.error("Failed to fetch departments", error);
            }
        };
        if (user) fetchDepts();
    }, [user]);

    // Fetch Sections when Dept or Semester changes
    useEffect(() => {
        if (!selectedDeptId || !semester) return;

        const fetchSections = async () => {
            setLoadingFilters(true);
            try {
                const { data } = await api.get(`/sections/by-department/${selectedDeptId}/${semester}`);
                setSections(data);
                if (data.length > 0) setSelectedSectionId(data[0]._id);
                else setSelectedSectionId('');
            } catch (error) {
                console.error("Failed to fetch sections", error);
            } finally {
                setLoadingFilters(false);
            }
        };
        fetchSections();
    }, [selectedDeptId, semester]);

    // Main Search
    const handleSearch = async () => {
        if (!selectedSectionId) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/marks/admin-view?sectionId=${selectedSectionId}&semester=${semester}&examType=${examType}`);
            setMarks(data);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleForward = async (id) => {
        setActionLoading(id);
        try {
            await api.put(`/marks/${id}/forward`);
            // Refresh list
            handleSearch();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to forward marks');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Marks Management</h2>
                    <p className="text-gray-500 mt-1">View and audit student academic performance and exam records.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSearch}
                        disabled={!selectedSectionId || loading}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                        Search Records
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Department</label>
                        <select
                            value={selectedDeptId}
                            onChange={(e) => setSelectedDeptId(e.target.value)}
                            disabled={user?.role === 'hod'}
                            className={`w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow ${user?.role === 'hod' ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                        >
                            {departments.map(d => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Semester</label>
                        <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                <option key={s} value={s}>Semester {s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Section</label>
                        <select
                            value={selectedSectionId}
                            onChange={(e) => setSelectedSectionId(e.target.value)}
                            disabled={loadingFilters || sections.length === 0}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow disabled:bg-gray-50 disabled:text-gray-500"
                        >
                            {sections.length > 0 ? (
                                sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)
                            ) : (
                                <option value="">No sections found</option>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Exam Type</label>
                        <select
                            value={examType}
                            onChange={(e) => setExamType(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                        >
                            <option>Internal 1</option>
                            <option>Internal 2</option>
                            <option>Semester</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Loading marks data...</p>
                    </div>
                ) : marks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {marks.map((doc) => (
                            <div key={doc._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-indigo-500" />
                                            {doc.subjectId?.name}
                                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                                {doc.subjectId?.code}
                                            </span>
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">Faculty: {doc.facultyId?.name}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className={clsx(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider",
                                            doc.status === 'published' ? "bg-purple-100 text-purple-800" :
                                            doc.status === 'ready_to_publish' ? "bg-blue-100 text-blue-800" :
                                            doc.status === 'submitted_to_hod' ? "bg-orange-100 text-orange-800" :
                                            "bg-gray-100 text-gray-800"
                                        )}>
                                            {doc.status.replace(/_/g, ' ').toUpperCase()}
                                        </div>
                                        <div className={clsx(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider",
                                            doc.isLocked ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                        )}>
                                            {doc.isLocked ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                                            {doc.isLocked ? 'LOCKED' : 'UNLOCKED'}
                                        </div>
                                        {(user?.role === 'hod' || user?.role === 'admin') && doc.status === 'submitted_to_hod' && (
                                            <button
                                                onClick={() => handleForward(doc._id)}
                                                disabled={actionLoading === doc._id}
                                                className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                                            >
                                                {actionLoading === doc._id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                                                APPROVE & FORWARD
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Marks Obtained / {doc.maxMarks}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {doc.records.map((rec, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {rec.studentId?.registerNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {rec.studentId?.user?.name || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                        <span className={clsx(
                                                            "font-medium",
                                                            (rec.marks / doc.maxMarks) < 0.4 ? "text-red-600" : "text-gray-900"
                                                        )}>
                                                            {rec.marks}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                        <div className="mx-auto h-12 w-12 text-gray-300">
                            <FileText className="h-full w-full" />
                        </div>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {selectedSectionId ? "No marks have been entered for this selection." : "Select filters above and search to view marks."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarksManagement;
