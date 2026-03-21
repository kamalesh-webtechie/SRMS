import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Mail, Edit, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import AddFacultyModal from '../../components/AddFacultyModal';
import { useAuth } from '../../context/AuthContext';

const FacultyList = () => {
    const { user } = useAuth();
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchFaculty = async () => {
        try {
            let url = '/faculty';
            if (user && user.role === 'hod' && user.departmentId) {
                url += `?departmentId=${user.departmentId}`;
            }
            const { data } = await api.get(url);
            setFaculty(data);
        } catch (error) {
            console.error("Failed to fetch faculty", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaculty();
    }, [user]);

    const [undoStack, setUndoStack] = useState(null);

    const handleDelete = async (id) => {
        const itemToDelete = faculty.find(f => f._id === id);
        if (!itemToDelete) return;

        const originalData = [...faculty];
        // Immediate UI Update
        setFaculty(prev => prev.filter(f => f._id !== id));

        // Clear existing undo
        if (undoStack?.timer) clearTimeout(undoStack.timer);

        const timer = setTimeout(async () => {
            try {
                await api.delete(`/faculty/${id}`);
                setUndoStack(null);
            } catch (error) {
                console.error("Failed to delete", error);
                setFaculty(originalData);
                setUndoStack(null);
            }
        }, 6000);

        setUndoStack({
            message: `Faculty "${itemToDelete.user.name}" removed.`,
            action: () => {
                clearTimeout(timer);
                setFaculty(originalData);
                setUndoStack(null);
            },
            timer
        });
    };

    const handleEdit = (person) => {
        setEditingFaculty(person);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFaculty(null);
    };

    const filteredFaculty = faculty.filter(f =>
        f.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {undoStack && (
                <div className="fixed bottom-4 right-4 z-[100] bg-gray-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center justify-between min-w-[320px] animate-slide-up border border-gray-700">
                    <div className="flex items-center">
                        <div className="mr-3 text-orange-400">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                            </span>
                        </div>
                        <p className="font-medium">{undoStack.message}</p>
                    </div>
                    <button
                        onClick={undoStack.action}
                        className="ml-6 flex items-center bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded font-bold transition-colors group"
                    >
                        <RotateCcw className="h-4 w-4 mr-2 group-hover:rotate-[-45deg] transition-transform" />
                        UNDO
                    </button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-primary">Faculty Management</h2>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-accent text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Faculty
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-shadow"
                    placeholder="Search faculty by name, ID or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white shadow sm:rounded-lg border border-slate-200 overflow-x-auto">
                {loading ? (
                    <div className="p-8 text-center text-text">Loading faculty data...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name / Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID & Dept
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Designation
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Specialization
                                </th>
                                {user?.role === 'admin' && (
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredFaculty.map((person) => (
                                <tr key={person._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                    {person.user.name.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{person.user.name}</div>
                                                <div className="text-sm text-gray-500 flex items-center">
                                                    <Mail className="h-3 w-3 mr-1" /> {person.user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">ID: {person.employeeId}</div>
                                        <div className="text-sm text-gray-500">{person.department}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {person.designation}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                                        {person.specialization.join(', ')}
                                    </td>
                                    {user?.role === 'admin' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(person)}
                                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition-colors"
                                                    title="Edit Faculty"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(person._id)}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full hover:bg-red-100 transition-colors"
                                                    title="Delete Faculty"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredFaculty.length === 0 && (
                                <tr>
                                    <td colSpan={user?.role === 'admin' ? "5" : "4"} className="px-6 py-10 text-center text-gray-500">
                                        No faculty members found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <AddFacultyModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onFacultyAdded={fetchFaculty}
                editingFaculty={editingFaculty}
            />
        </div>
    );
};

export default FacultyList;
