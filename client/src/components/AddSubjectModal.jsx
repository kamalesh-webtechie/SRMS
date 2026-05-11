import { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AddSubjectModal = ({ isOpen, onClose, onSubjectAdded, editingSubject }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        department: '',
        departmentId: '', 
        semester: 1,
        year: 'I',
        credits: 3,
        type: 'Theory',
        isCommon: false
    });

    useEffect(() => {
        if (isOpen) {
            const fetchDepts = async () => {
                try {
                    const { data } = await api.get('/departments');
                    setDepartments(data);

                    if (editingSubject) {
                        setFormData({
                            name: editingSubject.name,
                            code: editingSubject.code,
                            department: editingSubject.department,
                            departmentId: editingSubject.departmentId || '',
                            semester: editingSubject.semester,
                            year: editingSubject.year || 'I',
                            credits: editingSubject.credits,
                            type: editingSubject.type || 'Theory',
                            isCommon: editingSubject.isCommon || false
                        });
                    } else {
                        // Reset when opening for new subject
                        let defaultDept = data.length > 0 ? data[0].name : '';
                        let defaultDeptId = '';
                        
                        if (user && user.role === 'hod' && user.departmentId) {
                            const myDept = data.find(d => d._id === user.departmentId);
                            if (myDept) {
                                defaultDept = myDept.name;
                                defaultDeptId = myDept._id;
                            }
                        }

                        setFormData({
                            name: '',
                            code: '',
                            department: defaultDept,
                            departmentId: defaultDeptId,
                            semester: 1,
                            year: 'I',
                            credits: 3,
                            type: 'Theory',
                            isCommon: false
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch departments", error);
                }
            };
            fetchDepts();
        }
        setError('');
    }, [isOpen, editingSubject, user]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (editingSubject) {
                await api.put(`/academic/subjects/${editingSubject._id}`, formData);
            } else {
                await api.post('/academic/subjects', formData);
            }
            onSubjectAdded();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${editingSubject ? 'update' : 'add'} subject`);
        } finally {
            setLoading(false);
        }
    };

    return (
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Background overlay */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                aria-hidden="true"
                onClick={onClose}
            ></div>

            {/* Modal panel */}
            <div className="relative bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:max-w-lg w-full max-h-[90vh] flex flex-col border border-gray-200 opacity-100 scale-100">
                {/* Fixed Header */}
                <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-extrabold text-gray-900">
                        {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative text-sm font-semibold">
                            {error}
                        </div>
                    )}

                    <form id="add-subject-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Subject Name *</label>
                            <input type="text" name="name" required
                                placeholder="e.g., Mathematics I"
                                className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                value={formData.name} onChange={handleChange} />
                        </div>

                        {user?.role !== 'hod' && (
                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isCommon"
                                    name="isCommon"
                                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-lg transition-all"
                                    checked={formData.isCommon}
                                    onChange={(e) => setFormData({ ...formData, isCommon: e.target.checked })}
                                />
                                <label htmlFor="isCommon" className="text-sm font-bold text-gray-700 px-1 cursor-pointer select-none">
                                    Common to all departments
                                </label>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Subject Code *</label>
                                <input type="text" name="code" required
                                    className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50/30 transition-all font-mono font-bold text-gray-900 uppercase"
                                    value={formData.code} onChange={handleChange} placeholder="CS101" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Department</label>
                                <select
                                    name="department"
                                    required={!formData.isCommon}
                                    disabled={formData.isCommon || user?.role === 'hod'}
                                    className={`w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary focus:outline-none transition-all font-medium ${formData.isCommon || user?.role === 'hod' ? 'bg-gray-100 text-gray-400' : 'bg-gray-50/30 text-gray-900'}`}
                                    value={formData.isCommon ? '' : formData.department}
                                    onChange={(e) => {
                                        const dept = departments.find(d => d.name === e.target.value);
                                        setFormData({
                                            ...formData,
                                            department: e.target.value,
                                            departmentId: dept ? dept._id : ''
                                        });
                                    }}
                                >
                                    <option value="">{formData.isCommon ? 'Common Subject' : 'Select Dept'}</option>
                                    {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Year</label>
                                <select name="year" required
                                    className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                    value={formData.year} onChange={handleChange}>
                                    <option value="I">I Year</option>
                                    <option value="II">II Year</option>
                                    <option value="III">III Year</option>
                                    <option value="IV">IV Year</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Semester</label>
                                <select name="semester" required
                                    className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                    value={formData.semester} onChange={handleChange}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Credits</label>
                                <input type="number" name="credits" required min="1" max="10"
                                    className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                    value={formData.credits} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Type</label>
                                <select name="type" required
                                    className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                    value={formData.type} onChange={handleChange}>
                                    <option value="Theory">Theory</option>
                                    <option value="Practical">Practical</option>
                                    <option value="Theory & Practical">Theory & Practical</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Fixed Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row-reverse gap-3 shrink-0">
                    <button
                        form="add-subject-form"
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center items-center px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <><Save className="h-5 w-5 mr-2" /> {editingSubject ? 'Update' : 'Save'} Subject</>}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center px-6 py-2.5 border border-gray-300 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>

    );
};

export default AddSubjectModal;
