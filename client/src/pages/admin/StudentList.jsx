import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Search, Mail, BookOpen, Edit, RotateCcw, XCircle, Users, Filter, CheckCircle } from 'lucide-react';
import api, { getMediaUrl } from '../../services/api';
import AddStudentModal from '../../components/AddStudentModal';
import BulkStudentUpload from '../../components/BulkStudentUpload';
import { getActiveBatches, YEARS } from '../../utils/academicUtils';
import { useAuth } from '../../context/AuthContext';

const StudentList = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
     const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingSections, setLoadingSections] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [undoStack, setUndoStack] = useState(null);
    const pendingDeleteRef = useRef(null);

    // Commit pending delete if component unmounts
    useEffect(() => {
        return () => {
            if (pendingDeleteRef.current) {
                const { action, timer } = pendingDeleteRef.current;
                clearTimeout(timer);
                action().catch(err => console.error("Unmount background delete failed", err));
            }
        };
    }, []);
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [filters, setFilters] = useState({
        department: '',
        year: '',
        section: '',
        batch: ''
    });

    const handleDelete = async (id) => {
        const studentToDelete = students.find(s => s._id === id);
        if (!studentToDelete) return;

        // Commit existing pending delete before starting a new one
        if (pendingDeleteRef.current) {
            const { action, timer } = pendingDeleteRef.current;
            clearTimeout(timer);
            action().catch(e => console.error("Earlier delete commit failed", e));
        }

        const originalStudents = [...students];
        setStudents(prev => prev.filter(s => s._id !== id));
        setSelectedIds(prev => prev.filter(sid => sid !== id));

        const deleteAction = async () => {
            try {
                await api.delete(`/students/${id}`);
                pendingDeleteRef.current = null;
            } catch (err) {
                console.error("Delayed delete failed", err);
                // Can't easily restore state here if it was a background commit from another delete,
                // but for this specific component, we try:
                setStudents(prev => [...prev, studentToDelete]);
                pendingDeleteRef.current = null;
            }
        };

        const timer = setTimeout(async () => {
            try {
                await api.delete(`/students/${id}`);
                setUndoStack(null);
                pendingDeleteRef.current = null;
            } catch (error) {
                console.error("Failed to delete", error);
                setStudents(originalStudents);
                setUndoStack(null);
                pendingDeleteRef.current = null;
            }
        }, 3000); // Reduced from 10s to 3s for better UX

        pendingDeleteRef.current = { action: deleteAction, timer };

        setUndoStack({
            message: `Student "${studentToDelete.user.name}" deleted.`,
            action: () => {
                clearTimeout(timer);
                setStudents(originalStudents);
                setUndoStack(null);
                pendingDeleteRef.current = null;
            },
            timer
        });
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const originalStudents = [...students];
        const originalSelected = [...selectedIds];
        const count = selectedIds.length;

        setStudents(prev => prev.filter(s => !selectedIds.includes(s._id)));
        setSelectedIds([]);

        if (undoStack?.timer) clearTimeout(undoStack.timer);

        const timer = setTimeout(async () => {
            try {
                await api.post('/students/delete-many', { ids: originalSelected });
                setUndoStack(null);
            } catch (error) {
                console.error("Failed to delete students", error);
                setStudents(originalStudents);
                setUndoStack(null);
            }
        }, 10000);

        setUndoStack({
            message: `${count} students deleted.`,
            action: () => {
                clearTimeout(timer);
                setStudents(originalStudents);
                setSelectedIds(originalSelected);
                setUndoStack(null);
            },
            timer
        });
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    }
    const fetchData = async () => {
        setLoading(true);
        console.log("StudentList: Fetching data for user:", user?._id, "role:", user?.role);
        try {
            let studentUrl = '/students';
            if (user && user.role === 'hod' && user.departmentId) {
                studentUrl += `?departmentId=${user.departmentId}`;
            }
            console.log("StudentList: Fetching URL:", studentUrl);

             setLoadingSections(true);
            const [studentRes, deptRes, sectionRes] = await Promise.all([
                api.get(studentUrl),
                api.get('/departments'),
                api.get('/sections')
            ]);
            
            console.log("StudentList: Received students count:", studentRes.data?.length);
            console.log("Sections:", sectionRes.data);
            
            // Ensure data is array before setting
            setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
            setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
            setSections(Array.isArray(sectionRes.data) ? sectionRes.data : []);
            setLoadingSections(false);

            if (user && user.role === 'hod' && user.departmentId && Array.isArray(deptRes.data)) {
                const myDept = deptRes.data.find(d => d._id === user.departmentId);
                if (myDept) {
                    console.log("StudentList: Auto-setting department filter to:", myDept.name);
                    setFilters(prev => ({ ...prev, department: myDept.name }));
                }
            }
        } catch (error) {
            console.error("StudentList: Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user?._id]); // Depend on user ID

    const filteredStudents = (Array.isArray(students) ? students : []).filter(s => {
        if (!s) return false;
        const name = s.user?.name || '';
        const regNo = s.registerNumber || '';

        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            regNo.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDept = !filters.department || s.department === filters.department;
        const matchesBatch = !filters.batch || s.batch === filters.batch;
        const matchesYear = !filters.year || s.currentYear === filters.year;
        const matchesSection = !filters.section || s.sectionId === filters.section;

        return matchesSearch && matchesDept && matchesBatch && matchesYear && matchesSection;
    });

    const batches = getActiveBatches() || [];
    const years = YEARS || [];

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredStudents.map(s => s._id).filter(id => !!id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id) => {
        if (!id) return;
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">

            {undoStack && (
                <div className="fixed bottom-6 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-medium animate-slide-up flex items-center gap-3 bg-gray-900 border border-gray-700 min-w-[320px]">
                    <div className="flex-1 text-sm flex items-center">
                        <span className="relative flex h-2 w-2 mr-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        {undoStack.message}
                    </div>
                    <button
                        onClick={undoStack.action}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-bold transition-colors uppercase tracking-wide"
                    >
                        Undo
                    </button>
                    <button
                        onClick={() => setUndoStack(null)}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <XCircle className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Student Registry</h2>
                    <p className="text-gray-500 mt-1">Manage student profiles, enrollments, and data.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {user?.role === 'admin' && selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none shadow-md transition-all duration-200"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete ({selectedIds.length})
                        </button>
                    )}
                    {user?.role === 'admin' && (
                        <>
                            <button
                                onClick={() => setIsBulkOpen(true)}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none shadow-sm transition-all duration-200"
                            >
                                <BookOpen className="h-4 w-4 mr-2" />
                                Import CSV
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none shadow-md transition-all duration-200"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Student
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all"
                        placeholder="Search Name or Reg No..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        className={`text-sm border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-1.5 px-3 ${user?.role === 'hod' ? 'bg-gray-100 text-gray-500 font-medium' : 'bg-white'}`}
                        value={filters.department}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                        disabled={user?.role === 'hod'}
                    >
                        <option value="">All Departments</option>
                        {(Array.isArray(departments) ? departments : []).map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                    </select>

                    <select
                        className="text-sm border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-1.5 px-3 bg-white"
                        value={filters.year}
                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    >
                        <option value="">All Years</option>
                        {years.map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>

                    <select
                        className="text-sm border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-1.5 px-3 bg-white"
                        value={filters.batch}
                        onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
                    >
                        <option value="">All Batches</option>
                        {batches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <select
                        className="text-sm border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 py-1.5 px-3 bg-white"
                        value={filters.section}
                        onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                        disabled={!filters.department || loadingSections}
                    >
                        {loadingSections ? (
                            <option value="">Loading...</option>
                        ) : (
                            <>
                                <option value="">All Sections</option>
                                {(() => {
                                    const filtered = (Array.isArray(sections) ? sections : [])
                                        .filter(s => !filters.department || s.department === filters.department);
                                    return filtered.length > 0 ? (
                                        filtered.map(s => <option key={s._id} value={s._id}>{s.name} ({s.batch})</option>)
                                    ) : (
                                        <option value="" disabled>No sections available</option>
                                    );
                                })()}
                            </>
                        )}
                    </select>

                    {(filters.department || filters.year || filters.batch || filters.section) && (
                        <button
                            onClick={() => setFilters({ department: '', year: '', section: '', batch: '' })}
                            className="text-sm text-red-600 font-medium hover:text-red-700 p-1 flex items-center"
                        >
                            <Filter className="h-4 w-4 mr-1" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                        <p className="mt-2 text-gray-500">Loading student records...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {user?.role === 'admin' && (
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                onChange={toggleSelectAll}
                                                checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                            />
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reg No</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</th>
                                    {user?.role === 'admin' && (
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStudents.map((student) => {
                                    if (!student) return null;
                                    const photo = student.profilePhotoUrl || student.profilePhoto || '';
                                    const photoSrc = getMediaUrl(photo);

                                    return (
                                        <tr key={student._id} className="hover:bg-gray-50 transition-colors duration-150">
                                            {user?.role === 'admin' && (
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        onChange={() => toggleSelect(student._id)}
                                                        checked={selectedIds.includes(student._id)}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden border border-gray-200 shrink-0" >
                                                        {photoSrc ? (
                                                            <img
                                                                src={photoSrc}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                                onError={(e) => { e.target.onerror = null; e.target.src = '' }} // Fallback if 404
                                                            />
                                                        ) : (
                                                            student.user?.name ? student.user.name.charAt(0) : '?'
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{student.user?.name || 'Unknown User'}</div>
                                                        <div className="text-xs text-gray-500 flex items-center">
                                                            <Mail className="h-3 w-3 mr-1" /> {student.user?.email || 'No Email'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${student.gender === 'Female' ? 'bg-pink-100 text-pink-700' :
                                                    student.gender === 'Male' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {student.gender || 'Male'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-mono font-medium text-indigo-600">{student.registerNumber}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{student.rollNumber || '—'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {student.department}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="text-sm font-bold text-gray-900">{student.currentYear || 'I'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                                                {student.section?.name || '—'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.batch}
                                            </td>
                                            {user?.role === 'admin' && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(student)}
                                                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(student._id)}
                                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                {filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={user?.role === 'admin' ? 10 : 8} className="px-6 py-12 text-center">
                                            <div className="mx-auto h-12 w-12 text-gray-300">
                                                <Users className="h-full w-full" />
                                            </div>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                                            <p className="mt-1 text-sm text-gray-500">Get started by adding a new student.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AddStudentModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onStudentAdded={fetchData}
                editingStudent={editingStudent}
            />

            <BulkStudentUpload
                isOpen={isBulkOpen}
                onClose={() => setIsBulkOpen(false)}
                onUploadSuccess={fetchData}
            />
        </div>
    );
};

export default StudentList;
