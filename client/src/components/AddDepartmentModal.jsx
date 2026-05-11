import { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import api from '../services/api';

const AddDepartmentModal = ({ isOpen, onClose, onDepartmentAdded, editingDepartment }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        hodName: '',
        description: ''
    });

    useEffect(() => {
        if (editingDepartment) {
            setFormData({
                name: editingDepartment.name,
                code: editingDepartment.code || '',
                hodName: editingDepartment.hodName || '',
                description: editingDepartment.description || ''
            });
        } else {
            setFormData({
                name: '', code: '', hodName: '', description: ''
            });
        }
        setError('');
    }, [editingDepartment, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (editingDepartment) {
                await api.put(`/departments/${editingDepartment._id}`, formData);
            } else {
                await api.post('/departments', formData);
            }
            onDepartmentAdded();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${editingDepartment ? 'update' : 'add'} department`);
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
            <div className="relative bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:max-w-lg w-full max-h-[90vh] flex flex-col border border-gray-200 opacity-100 scale-100">
                {/* Fixed Header */}
                <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-extrabold text-gray-900">
                        {editingDepartment ? 'Edit Department' : 'Add New Department'}
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

                    <form id="add-dept-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Department Name *</label>
                            <input type="text" name="name" required
                                placeholder="e.g. Computer Science Engineering"
                                className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                value={formData.name} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Department Code *</label>
                            <input type="text" name="code" required
                                placeholder="e.g. CSE"
                                className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900 uppercase"
                                value={formData.code} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">HOD Name</label>
                            <input type="text" name="hodName"
                                placeholder="Optional"
                                className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                value={formData.hodName} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Description</label>
                            <textarea name="description" rows="3"
                                placeholder="Brief department overview..."
                                className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                value={formData.description} onChange={handleChange}></textarea>
                        </div>
                    </form>
                </div>

                {/* Fixed Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row-reverse gap-3 shrink-0">
                    <button
                        form="add-dept-form"
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center items-center px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <><Save className="h-5 w-5 mr-2" /> {editingDepartment ? 'Update' : 'Save'} Department</>}
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

export default AddDepartmentModal;
