import { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AddFacultyModal = ({ isOpen, onClose, onFacultyAdded, editingFaculty }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        employeeId: '',
        department: '',
        designation: 'Assistant Professor',
        specialization: ''
    });
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const { data } = await api.get('/departments');
                setDepartments(data);
                
                // If it's an HOD adding a new faculty, pre-fill department
                if (isOpen && !editingFaculty && user && user.role === 'hod' && user.departmentId) {
                    const myDept = data.find(d => d._id === user.departmentId);
                    if (myDept) {
                        setFormData(prev => ({ ...prev, department: myDept.name }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch departments", error);
            }
        };

        if (isOpen) {
            fetchDepartments();
        }
    }, [isOpen, user, editingFaculty]);

    // Populate form when editing
    useEffect(() => {
        if (editingFaculty) {
            setFormData({
                name: editingFaculty.user.name || '',
                email: editingFaculty.user.email || '',
                password: '', // Don't pre-fill password
                employeeId: editingFaculty.employeeId || '',
                department: editingFaculty.department || '',
                designation: editingFaculty.designation || 'Assistant Professor',
                specialization: Array.isArray(editingFaculty.specialization)
                    ? editingFaculty.specialization.join(', ')
                    : ''
            });
        } else if (isOpen) {
            // Reset form for new entry (except department if pre-filled in previous useEffect)
            setFormData(prev => ({
                ...prev,
                name: '',
                email: '',
                password: '',
                employeeId: '',
                // Preserve department if HOD
                department: (user && user.role === 'hod') ? prev.department : '',
                designation: 'Assistant Professor',
                specialization: ''
            }));
        }
        setError('');
    }, [editingFaculty, isOpen, user]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (editingFaculty) {
                // Update existing faculty
                await api.put(`/faculty/${editingFaculty._id}`, {
                    name: formData.name,
                    email: formData.email,
                    employeeId: formData.employeeId,
                    department: formData.department,
                    designation: formData.designation,
                    specialization: formData.specialization
                });
            } else {
                // Create new faculty
                await api.post('/faculty', formData);
            }

            onFacultyAdded();
            onClose();

            // Reset form
            setFormData({
                name: '', email: '', password: '', employeeId: '',
                department: '', designation: 'Assistant Professor', specialization: ''
            });
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${editingFaculty ? 'update' : 'add'} faculty`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                {/* Background overlay */}
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div className="relative bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:max-w-xl w-full max-h-[85vh] flex flex-col border border-gray-200 opacity-100 scale-100">
                    {/* Fixed Header */}
                    <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <h3 className="text-xl font-extrabold text-gray-900" id="modal-title">
                            {editingFaculty ? 'Edit Faculty Member' : 'Register New Faculty'}
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative text-sm font-semibold pr-10 animate-shake flex items-center gap-3">
                                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse shrink-0"></div>
                                <span className="flex-1">{error}</span>
                                <button
                                    onClick={() => setError('')}
                                    className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        <form id="faculty-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
                            {/* Identity Group */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1 w-8 bg-indigo-600 rounded-full"></div>
                                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Identity & Role</h4>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Full Name</label>
                                    <input type="text" name="name" required
                                        className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                        placeholder="e.g. Dr. Jane Smith"
                                        value={formData.name} onChange={handleChange} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Employee ID</label>
                                        <input type="text" name="employeeId" required
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-mono text-indigo-600 font-bold"
                                            placeholder="EMP12345"
                                            value={formData.employeeId} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Department</label>
                                        <select
                                            name="department"
                                            required
                                            disabled={user?.role === 'hod'}
                                            className={`w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium ${user?.role === 'hod' ? 'bg-gray-100 text-gray-500' : 'bg-gray-50/30 text-gray-900'}`}
                                            value={formData.department}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((dept) => (
                                                <option key={dept._id} value={dept.name}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Designation</label>
                                    <select name="designation"
                                        className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                        value={formData.designation} onChange={handleChange}>
                                        <option value="HOD">Head of Department (HOD)</option>
                                        <option value="Professor">Professor</option>
                                        <option value="Associate Professor">Associate Professor</option>
                                        <option value="Assistant Professor">Assistant Professor</option>
                                        <option value="Lecturer">Lecturer</option>
                                    </select>
                                </div>
                            </div>

                            {/* Credentials Group */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1 w-8 bg-emerald-600 rounded-full"></div>
                                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest">Access & Credentials</h4>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Email Address</label>
                                    <input type="email" name="email" required
                                        className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                        placeholder="faculty@college.edu"
                                        value={formData.email} onChange={handleChange} />
                                </div>

                                {!editingFaculty && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Account Password</label>
                                        <input type="password" name="password" required={!editingFaculty} minLength="6"
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                            placeholder="min. 6 characters"
                                            value={formData.password} onChange={handleChange} />
                                    </div>
                                )}
                            </div>

                            {/* Expertise Group */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1 w-8 bg-amber-600 rounded-full"></div>
                                    <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest">Expertise</h4>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Specialization (comma separated)</label>
                                    <input type="text" name="specialization" placeholder="e.g. Artificial Intelligence, Cryptography"
                                        className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                        value={formData.specialization} onChange={handleChange} />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Fixed Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row-reverse gap-3 shrink-0">
                        <button 
                            type="submit" 
                            form="faculty-form"
                            disabled={loading}
                            className="inline-flex justify-center items-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <><Save className="h-5 w-5 mr-2" /> {editingFaculty ? 'Update Profile' : 'Register Faculty'}</>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex justify-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
    );
};

export default AddFacultyModal;
