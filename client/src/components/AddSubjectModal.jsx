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
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-h-[90vh] flex flex-col">
                    {/* Fixed Header */}
                    <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between items-center border-b border-gray-200 shrink-0">
                        <h3 className="text-xl font-bold text-gray-900">
                            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors p-1">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-5 sm:p-6">
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative text-sm">
                                {error}
                            </div>
                        )}

                        <form id="add-subject-form" onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Subject Name *</label>
                                <input type="text" name="name" required
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                    value={formData.name} onChange={handleChange} />
                            </div>

                            {user?.role !== 'hod' && (
                                <div className="flex items-center space-x-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isCommon"
                                        name="isCommon"
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        checked={formData.isCommon}
                                        onChange={(e) => setFormData({ ...formData, isCommon: e.target.checked })}
                                    />
                                    <label htmlFor="isCommon" className="text-sm font-bold text-gray-700 px-1">
                                        Common to all departments
                                    </label>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Subject Code *</label>
                                    <input type="text" name="code" required
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow font-mono"
                                        value={formData.code} onChange={handleChange} placeholder="e.g., CS101" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Department</label>
                                    <select
                                        name="department"
                                        required={!formData.isCommon}
                                        disabled={formData.isCommon || user?.role === 'hod'}
                                        className={`w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow ${formData.isCommon || user?.role === 'hod' ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Year</label>
                                    <select name="year" required
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                        value={formData.year} onChange={handleChange}>
                                        <option value="I">I Year</option>
                                        <option value="II">II Year</option>
                                        <option value="III">III Year</option>
                                        <option value="IV">IV Year</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Semester</label>
                                    <select name="semester" required
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                        value={formData.semester} onChange={handleChange}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                            <option key={sem} value={sem}>{sem}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Credits</label>
                                    <input type="number" name="credits" required min="1" max="10"
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                        value={formData.credits} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Type</label>
                                    <select name="type" required
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
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
                    <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200 shrink-0 flex flex-col sm:flex-row gap-3">
                        <button
                            form="add-subject-form"
                            type="submit"
                            disabled={loading}
                            className="flex-1 inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <><Save className="h-5 w-5 mr-2" /> {editingSubject ? 'Update' : 'Save'} Subject</>}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default AddSubjectModal;
