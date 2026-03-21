import { useState, useEffect } from 'react';
import { Plus, Search, Book, Edit, Trash2, CheckCircle, XCircle, Loader2, Filter } from 'lucide-react';
import api from '../../services/api';
import AddSubjectModal from '../../components/AddSubjectModal';
import { useAuth } from '../../context/AuthContext';

const SubjectList = () => {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingSubject, setEditingSubject] = useState(null);
    const [message, setMessage] = useState(null);

    // Auto-dismiss message after 10 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const fetchSubjects = async () => {
        try {
            const { data } = await api.get('/academic/subjects');
            setSubjects(data);
        } catch (error) {
            console.error("Failed to fetch subjects", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchSubjects();
    }, [user]);

    const handleEdit = (subject) => {
        setEditingSubject(subject);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            try {
                await api.delete(`/academic/subjects/${id}`);
                setSubjects(subjects.filter(s => s._id !== id));
                setMessage({ type: 'success', text: 'Subject deleted successfully.' });
            } catch (error) {
                console.error("Failed to delete subject", error);
                setMessage({ type: 'error', text: 'Failed to delete subject.' });
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSubject(null);
    };

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
                    <p className="text-gray-500 mt-1">Manage curriculum, subjects, and credits.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-all duration-200"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Subject
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all duration-200"
                        placeholder="Search Subject by Name, Code or Dept..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Potential Filter Dropdowns could go here */}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                        <p className="mt-2 text-gray-500">Loading subjects...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">code</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sem / Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Credits</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredSubjects.map((subject) => (
                                    <tr key={subject._id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 font-mono">
                                                {subject.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3">
                                                    <Book className="h-4 w-4" />
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {subject.isCommon ? (
                                                <span className="text-gray-400">Common Subject</span>
                                            ) : (
                                                subject.department
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">Sem {subject.semester || '-'}</div>
                                            <div className="text-xs text-gray-500">Year {subject.year || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subject.type === 'Practical' ? 'bg-purple-100 text-purple-800' :
                                                subject.type === 'Theory & Practical' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {subject.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {subject.credits}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => handleEdit(subject)}
                                                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject._id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredSubjects.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <div className="mx-auto h-12 w-12 text-gray-300">
                                                <Book className="h-full w-full" />
                                            </div>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
                                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new subject.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AddSubjectModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubjectAdded={fetchSubjects}
                editingSubject={editingSubject}
            />

            {/* Notification Message */}
            {message && (
                <div className={`fixed bottom-6 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-medium animate-slide-up flex items-center gap-3 ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    <span>{message.text}</span>
                    <button
                        onClick={() => setMessage(null)}
                        className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <XCircle className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default SubjectList;
