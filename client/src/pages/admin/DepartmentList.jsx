import { useState, useEffect } from 'react';
import { Plus, Search, Building, Trash2, Edit } from 'lucide-react';
import api from '../../services/api';
import AddDepartmentModal from '../../components/AddDepartmentModal';

const DepartmentList = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingDepartment, setEditingDepartment] = useState(null);

    const fetchDepartments = async () => {
        try {
            const { data } = await api.get('/departments');
            setDepartments(data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure? This action cannot be undone.')) {
            try {
                await api.delete(`/departments/${id}`);
                setDepartments(departments.filter(d => d._id !== id));
            } catch (error) {
                console.error("Failed to delete department", error);
                alert("Failed to delete department");
            }
        }
    };

    const handleEdit = (dept) => {
        setEditingDepartment(dept);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDepartment(null);
    };

    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-primary">Department Management</h2>
                    <p className="text-gray-500">Manage academic departments and HODs.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-accent text-white rounded-md hover:bg-blue-600 transition-colors shadow-lg"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Department
                </button>
            </div>

            <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-shadow"
                    placeholder="Search Department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-10">Loading departments...</div>
                ) : (
                    filteredDepartments.map((dept) => (
                        <div key={dept._id} className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hovered-item relative group">
                            <div className="flex justify-between items-start">
                                <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center text-primary mb-4">
                                    <Building className="h-6 w-6" />
                                </div>
                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(dept)}
                                        className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                                        title="Edit Department"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(dept._id)}
                                        className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                        title="Delete Department"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-gray-900">{dept.name}</h3>
                                {dept.code && (
                                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded uppercase border border-indigo-200">
                                        {dept.code}
                                    </span>
                                )}
                            </div>


                            <div className="mt-4 space-y-2">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-gray-900">HOD:</span> {dept.hodName || 'Not Assigned'}
                                </p>
                                <p className="text-sm text-gray-500 line-clamp-2">
                                    {dept.description}
                                </p>
                            </div>
                        </div>
                    ))
                )}

                {filteredDepartments.length === 0 && !loading && (
                    <div className="col-span-full text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        No departments found. Add one to get started.
                    </div>
                )}
            </div>

            <AddDepartmentModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onDepartmentAdded={fetchDepartments}
                editingDepartment={editingDepartment}
            />
        </div>
    );
};

export default DepartmentList;
