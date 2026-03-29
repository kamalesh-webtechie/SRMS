import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import api from '../../services/api';
import { getActiveBatches, YEARS, getBatchStartYear } from '../../utils/academicUtils';
import { useAuth } from '../../context/AuthContext';

const SectionManagement = () => {
    const { user } = useAuth();
    const [sections, setSections] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingSections, setLoadingSections] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [formData, setFormData] = useState({
        departmentId: '',
        semester: 1,
        name: '',
        batch: import.meta.env.MODE === 'development' ? '2023-2027' : ''
    });
    const [error, setError] = useState('');

    const fetchSections = async () => {
        setLoadingSections(true);
        try {
            const { data } = await api.get('/sections');
            console.log("Sections:", data);
            setSections(data);
        } catch (error) {
            console.error("Failed to fetch sections", error);
        } finally {
            setLoading(false);
            setLoadingSections(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const { data } = await api.get('/departments');
            if (Array.isArray(data)) {
                setDepartments(data);
                
                // If HOD, pre-select their department
                if (user?.role === 'hod' && user?.departmentId) {
                    setFormData(prev => ({ ...prev, departmentId: user.departmentId }));
                } else if (data.length > 0 && !formData.departmentId) {
                    setFormData(prev => ({ ...prev, departmentId: data[0]._id }));
                }
            } else {
                console.error("Departments API did not return an array:", data);
            }
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    useEffect(() => {
        fetchSections();
        fetchDepartments();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this section?')) {
            try {
                await api.delete(`/sections/${id}`);
                setSections(sections.filter(s => s._id !== id));
            } catch (error) {
                console.error("Failed to delete section", error);
                alert("Failed to delete section");
            }
        }
    };

    const handleEdit = (section) => {
        setEditingSection(section);
        setFormData({
            departmentId: section.departmentId._id,
            semester: section.semester,
            name: section.name,
            batch: section.batch,
            year: section.year || 'I'
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSection(null);
        setError('');
        // Reset form to defaults
        setFormData(prev => ({
            departmentId: user?.role === 'hod' && user?.departmentId ? user.departmentId : (departments.length > 0 ? departments[0]._id : ''),
            semester: prev.semester || 1, // Keep calculated or 1
            name: '',
            batch: '',
            year: 'I'
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingSection) {
                await api.put(`/sections/${editingSection._id}`, formData);
            } else {
                await api.post('/sections', formData);
            }
            fetchSections();
            handleCloseModal();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save section');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ 
            ...formData, 
            [name]: name === 'semester' ? Number(value) : value 
        });
    };

    // Helper for Start Year
    const getStartYear = () => {
        return getBatchStartYear(formData.batch) || new Date().getFullYear();
    };

    const handleYearChange = (e) => {
        const year = parseInt(e.target.value);
        if (!isNaN(year)) {
            // Calculate Batch
            const batchString = `${year}-${year + 4}`;

            // Calculate Semester based on Year and Current Date
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth(); // 0-11

            let calculatedSem = 1;
            const diffYears = currentYear - year;

            // Academic year typically starts around June/July
            if (currentMonth >= 6) { // Jul-Dec (Odd Sem)
                calculatedSem = diffYears * 2 + 1;
            } else { // Jan-Jun (Even Sem)
                calculatedSem = diffYears * 2;
            }

            if (calculatedSem < 1) calculatedSem = 1;
            if (calculatedSem > 8) calculatedSem = 8; // Cap at 8

            setFormData(prev => ({
                ...prev,
                batch: batchString,
                semester: calculatedSem
            }));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Section Management</h2>
                    <p className="text-gray-500 mt-1">Manage academic sections and batches for each department.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-all duration-200"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Section
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                        <p className="mt-2 text-gray-500">Loading sections...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sections.map((section) => (
                                    <tr key={section._id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{section.departmentId?.name || section.department}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Year {section.year || 'I'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                    {section.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {section.batch}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${section.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${section.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                                {section.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => handleEdit(section)}
                                                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(section._id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {sections.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <div className="mx-auto h-12 w-12 text-gray-300">
                                                <Plus className="h-full w-full" />
                                            </div>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No sections</h3>
                                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new section.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    {/* Background overlay */}
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                        aria-hidden="true"
                        onClick={handleCloseModal}
                    ></div>

                    {/* Modal panel */}
                    <div className="relative bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:max-w-lg w-full max-h-[90vh] flex flex-col border border-gray-200 opacity-100 scale-100">
                            {/* Fixed Header */}
                            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between items-center border-b border-gray-200 shrink-0">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingSection ? 'Edit Section' : 'Add New Section'}
                                </h3>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500 transition-colors p-1">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 py-5 sm:p-6">
                                {error && (
                                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start">
                                        <div className="flex-shrink-0 mr-2">
                                            <X className="h-4 w-4 mt-0.5" />
                                        </div>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form id="section-form" onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Department</label>
                                        <select name="departmentId" required
                                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow disabled:bg-gray-100 disabled:text-gray-500"
                                            value={formData.departmentId} onChange={handleChange}
                                            disabled={user?.role === 'hod'}
                                        >
                                            {departments.length > 0 ? (
                                                departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)
                                            ) : (
                                                <option value="" disabled>No departments found</option>
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Year</label>
                                        <select name="year" required
                                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                            value={formData.year} onChange={handleChange}>
                                            {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Section Name</label>
                                        <input type="text" name="name" required placeholder="A, B, C..."
                                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow uppercase font-bold"
                                            value={formData.name} onChange={handleChange} />
                                        <p className="mt-1 text-xs text-gray-500">Single letter identifier for the section</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Semester (Current Assignment)</label>
                                        <select name="semester" required
                                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                            value={formData.semester} onChange={handleChange}>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                                <option key={s} value={s}>Semester {s}</option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500 italic">Sections appear in other modules based on this semester.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Academic Batch</label>
                                        <select
                                            name="batch"
                                            required
                                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                            value={formData.batch}
                                            onChange={(e) => {
                                                const batch = e.target.value;
                                                const year = getBatchStartYear(batch);
                                                handleYearChange({ target: { value: year } });
                                            }}
                                        >
                                            <option value="">Select Batch</option>
                                            {getActiveBatches().map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                        <p className="mt-1 text-xs text-indigo-600 font-medium italic">
                                            Batch: {formData.batch || 'YYYY-YYYY'}
                                        </p>
                                    </div>
                                </form>
                            </div>

                            {/* Fixed Footer */}
                            <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200 shrink-0 flex flex-col sm:flex-row gap-3">
                                <button
                                    form="section-form"
                                    type="submit"
                                    className="flex-1 inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-all active:scale-95">
                                    {editingSection ? 'Update Section' : 'Create Section'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                </div>
            )}
        </div >
    );
};

export default SectionManagement;
