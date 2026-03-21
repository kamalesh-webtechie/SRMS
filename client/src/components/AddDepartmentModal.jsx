import { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import api from '../services/api';

const AddDepartmentModal = ({ isOpen, onClose, onDepartmentAdded, editingDepartment }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',

        hodName: '',
        description: ''
    });

    useEffect(() => {
        if (editingDepartment) {
            setFormData({
                name: editingDepartment.name,

                hodName: editingDepartment.hodName || '',
                description: editingDepartment.description || ''
            });
        } else {
            setFormData({
                name: '', hodName: '', description: ''
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
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-h-[90vh] flex flex-col">
                    {/* Fixed Header */}
                    <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between items-center border-b border-gray-200 shrink-0">
                        <h3 className="text-xl font-bold text-gray-900">
                            {editingDepartment ? 'Edit Department' : 'Add New Department'}
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

                        <form id="add-dept-form" onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Department Name *</label>
                                <input type="text" name="name" required
                                    placeholder="e.g. Computer Science Engineering"
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                    value={formData.name} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">HOD Name</label>
                                <input type="text" name="hodName"
                                    placeholder="Optional"
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                    value={formData.hodName} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Description</label>
                                <textarea name="description" rows="3"
                                    placeholder="Brief department overview..."
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                                    value={formData.description} onChange={handleChange}></textarea>
                            </div>
                        </form>
                    </div>

                    {/* Fixed Footer */}
                    <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200 shrink-0 flex flex-col sm:flex-row gap-3">
                        <button
                            form="add-dept-form"
                            type="submit"
                            disabled={loading}
                            className="flex-1 inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <><Save className="h-5 w-5 mr-2" /> {editingDepartment ? 'Update' : 'Save'} Department</>}
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
            </div>
        </div>
    );
};

export default AddDepartmentModal;
