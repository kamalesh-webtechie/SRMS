import { useState, useEffect } from 'react';
import { Trash2, UserCheck, Filter, BookOpen, Users, Calendar, Search } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const FacultyAssignment = () => {
    const { user } = useAuth();
    // Data List States
    const [assignments, setAssignments] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selection/Filter States
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedStudentYear, setSelectedStudentYear] = useState(''); // I, II, III, IV
    const [selectedSemester, setSelectedSemester] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        facultyId: '',
        subjectId: '',
        sectionId: '',
        semester: '',
        academicYear: '2024-2025' // Default
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fetchData = async () => {
        try {
            const [assRes, deptRes, facRes, subRes, secRes] = await Promise.all([
                api.get('/teaching-assignments'),
                api.get('/departments'),
                api.get('/faculty'),
                api.get('/academic/subjects'),
                api.get('/sections')
            ]);
            setAssignments(assRes.data);
            setDepartments(deptRes.data);
            setFaculties(facRes.data);
            setSubjects(subRes.data);
            setSections(secRes.data);
            
            // Auto-select department for HOD
            if (user && user.role === 'hod' && user.departmentId) {
                // If departmentId is stored as string in user context, use it directly.
                // Or find it in the departments list.
                const myDept = deptRes.data.find(d => String(d._id) === String(user.departmentId));
                if (myDept) {
                    setSelectedDept(myDept._id);
                    // Crucial: Set it in formData as well if needed down the line, although selectedDept drives the UI
                } else {
                    // Fallback
                    setSelectedDept(user.departmentId);
                }
            } else if (deptRes.data.length > 0) {
              // Optionally select first department for admin
            }
        } catch (error) {
            console.error("Failed to fetch assignment data", error);
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    // Auto-clear success message after 3 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Auto-clear error after 10 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Filter Logic
    const getFilteredSections = () => {
        return sections.filter(s => {
            const deptMatch = selectedDept ? (s.departmentId?._id === selectedDept || s.departmentId === selectedDept) : true;
            // Filter by Student Year (I, II, III, IV)
            const yearMatch = selectedStudentYear ? s.year === selectedStudentYear : true;
            return deptMatch && yearMatch;
        });
    };

    const getFilteredSubjects = () => {
        return subjects.filter(s => {
            // Find department name/code mapping
            const dept = departments.find(d => d._id === selectedDept);
            const deptMatch = selectedDept && dept ? (s.department === dept.name || s.isCommon) : true;

            // Filter by Semester
            const semMatch = selectedSemester ? s.semester === parseInt(selectedSemester) : true;

            return deptMatch && semMatch;
        });
    };

    const getFilteredFaculty = () => {
        // Return all faculties but sort them: Selected Dept Faculty First
        // Also handle HOD view where they might only see their own anyway based on backend filtering
        if (!selectedDept || faculties.length === 0) return faculties;

        const currentDept = departments.find(d => d._id === selectedDept);
        if (!currentDept) return faculties;

        // Separate faculties into "same department" and "other departments"
        const sameDept = faculties.filter(f => f.department === currentDept.name);
        const otherDept = faculties.filter(f => f.department !== currentDept.name);

        // Sort both arrays alphabetically
        sameDept.sort((a, b) => a.user.name.localeCompare(b.user.name));
        otherDept.sort((a, b) => a.user.name.localeCompare(b.user.name));

        // Combine them with Same Dept first
        return [...sameDept, ...otherDept];
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Update formData semester when selectedSemester changes
    useEffect(() => {
        if (selectedSemester) {
            setFormData(prev => ({ ...prev, semester: selectedSemester }));
        }
    }, [selectedSemester]);

    const handleAssign = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.facultyId || !formData.subjectId || !formData.sectionId || !formData.semester) {
            setError('Please select Faculty, Subject, Section and Semester');
            return;
        }

        try {
            const { data } = await api.post('/teaching-assignments', formData);
            setSuccessMessage(`Faculty member ${data.facultyId?.user?.name || 'Faculty'} has been successfully assigned to the course.`);
            fetchData();
            // Optional: clear form selection but keep filters?
            setFormData(prev => ({ ...prev, subjectId: '', sectionId: '' }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign faculty');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Remove this assignment?')) {
            try {
                await api.delete(`/teaching-assignments/${id}`);
                setAssignments(assignments.filter(a => a._id !== id));
            } catch (err) {
                console.error(err);
                alert('Failed to delete assignment');
            }
        }
    };

    const years = ['I', 'II', 'III', 'IV'];
    const academicYears = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];

    // Dynamic Semesters based on Year
    const getSemestersForYear = (year) => {
        if (!year) return [1, 2, 3, 4, 5, 6, 7, 8];
        const map = {
            'I': [1, 2],
            'II': [3, 4],
            'III': [5, 6],
            'IV': [7, 8]
        };
        return map[year] || [];
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Faculty Teaching Assignments</h2>
                <p className="text-gray-500 mt-1">Assign subjects and sections to faculty members.</p>
            </div>

            {/* Assignment Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <UserCheck className="h-5 w-5 mr-2 text-indigo-600" />
                        New Assignment
                    </h3>
                </div>

                <div className="p-6">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center shadow-sm animate-shake">
                        <span className="font-bold mr-1 uppercase tracking-wider">Note:</span> {error}
                    </div>}

                    {successMessage && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 font-semibold">
                        <UserCheck className="h-4 w-4 mr-2" />
                        {successMessage}
                    </div>}

                    <form onSubmit={handleAssign} className="space-y-6">
                        {/* Row 1: Context Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Department</label>
                                <select 
                                    className={`w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow ${user?.role === 'hod' ? 'bg-gray-100 text-gray-500 font-medium' : 'bg-white'}`}
                                    disabled={user?.role === 'hod'} // Lock to HOD's department
                                    value={selectedDept} 
                                    onChange={(e) => {
                                        setSelectedDept(e.target.value);
                                        setFormData(prev => ({ ...prev, facultyId: '', subjectId: '', sectionId: '' }));
                                    }}>
                                    <option value="">Select Department</option>
                                    {departments.map(d => (
                                        <option key={d._id} value={d._id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Academic Year</label>
                                <select name="academicYear" className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                    value={formData.academicYear} onChange={handleChange} required>
                                    {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Student Year</label>
                                <select className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                    value={selectedStudentYear} onChange={(e) => {
                                        setSelectedStudentYear(e.target.value);
                                        setFormData(prev => ({ ...prev, subjectId: '', sectionId: '' }));
                                        // Reset semester if it doesn't match new year
                                    }}>
                                    <option value="">Select Year</option>
                                    {years.map(y => <option key={y} value={y}>{y} Year</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Semester</label>
                                <select name="semester" className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                    value={selectedSemester} onChange={(e) => {
                                        setSelectedSemester(e.target.value);
                                        setFormData(prev => ({ ...prev, semester: e.target.value, subjectId: '' }));
                                    }}>
                                    <option value="">Select Semester</option>
                                    {getSemestersForYear(selectedStudentYear).map(s => (
                                        <option key={s} value={s}>Semester {s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 my-4"></div>

                        {/* Row 2: Selections (Filtered) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Section</label>
                                <select name="sectionId" className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                    value={formData.sectionId} onChange={handleChange} required
                                    disabled={!selectedDept}>
                                    <option value="">{selectedDept ? 'Select Section' : 'Select Department First'}</option>
                                    {getFilteredSections().map(s => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} ({s.batch})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Subject</label>
                                <select name="subjectId" className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                    value={formData.subjectId} onChange={handleChange} required
                                    disabled={!selectedDept}>
                                    <option value="">{selectedDept ? 'Select Subject' : 'Select Department First'}</option>
                                    {getFilteredSubjects().map(s => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} ({s.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Faculty</label>
                                <select name="facultyId" className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                    value={formData.facultyId} onChange={handleChange} required>
                                    <option value="">Select Faculty</option>
                                    {getFilteredFaculty().map(f => {
                                        return (
                                            <option key={f._id} value={f._id}>
                                                {f.user.name} ({f.department})
                                            </option>
                                        );
                                    })}
                                </select>
                                <p className="text-xs text-gray-500 mt-1 pl-1">Faculty from this department are listed first.</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="submit"
                                className="w-full md:w-auto inline-flex justify-center items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                <UserCheck className="h-4 w-4 mr-2" />
                                Assign Faculty
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Assignments List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Current Assignments</h3>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                        <p className="mt-2 text-gray-500">Loading assignments...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Faculty</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sem</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Academic Year</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {assignments.map((assignment) => (
                                    <tr key={assignment._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3 text-xs">
                                                    {(assignment.facultyId?.user?.name || "U")[0]}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {assignment.facultyId?.user?.name || assignment.facultyId?.name || "Unknown"}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{assignment.subjectId?.name}</div>
                                            <div className="text-xs text-gray-500">{assignment.subjectId?.code}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {assignment.sectionId?.departmentId?.name || assignment.sectionId?.department || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900">{assignment.sectionId?.name}</span>
                                            <span className="text-xs text-gray-500 ml-1">({assignment.sectionId?.year})</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {assignment.semester || assignment.subjectId?.semester || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {assignment.academicYear}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleDelete(assignment._id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {assignments.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            No assignments found. Use the filters to assign.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacultyAssignment;
