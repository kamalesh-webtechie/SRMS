import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Send,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Trash2,
    Globe,
    History,
    Eye,
    EyeOff,
    Monitor
} from 'lucide-react';
import clsx from 'clsx';

const PublishResults = () => {
    const [departments, setDepartments] = useState([]);
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [selectedYear, setSelectedYear] = useState('I');
    const [examType, setExamType] = useState('Internal 1');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [publications, setPublications] = useState([]);
    const [fetchingPubs, setFetchingPubs] = useState(true);

    useEffect(() => {
        fetchDepts();
        fetchPublications();
    }, []);

    const fetchDepts = async () => {
        try {
            const { data } = await api.get('/departments');
            setDepartments(data);
            if (data.length > 0) setSelectedDeptId(data[0]._id);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const fetchPublications = async () => {
        setFetchingPubs(true);
        try {
            const { data } = await api.get('/result-publications');
            setPublications(data);
        } catch (error) {
            console.error("Failed to fetch publications", error);
        } finally {
            setFetchingPubs(false);
        }
    };

    const handlePublish = async () => {
        if (!selectedDeptId) {
            setMessage({ type: 'error', text: 'Please select a department.' });
            return;
        }

        const dept = departments.find(d => d._id === selectedDeptId);

        if (!window.confirm(`Are you sure you want to publish ${examType} results for ${dept?.name} (Year ${selectedYear})?`)) {
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { data } = await api.post('/result-publications', {
                departmentId: selectedDeptId,
                year: selectedYear,
                examType
            });
            setMessage({ type: 'success', text: data.message });
            fetchPublications();
        } catch (error) {
            console.error("Publish error", error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Publication failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUnpublish = async (id, deptName, year, type) => {
        if (!window.confirm(`Are you sure you want to unpublish results for ${deptName} - Year ${year} (${type})?`)) {
            return;
        }

        try {
            await api.put(`/result-publications/${id}/unpublish`);
            fetchPublications();
            setMessage({ type: 'success', text: 'Result unpublished successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to unpublish.' });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Result Publication</h2>
                    <p className="text-gray-500 mt-1">Manage and release student exam results to the specific portals.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Publish Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Send className="h-5 w-5 text-indigo-600" />
                            Publish New Result
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Department</label>
                                <select
                                    value={selectedDeptId}
                                    onChange={(e) => setSelectedDeptId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                                >
                                    <option value="">Select Department...</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Year</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['I', 'II', 'III', 'IV'].map(y => (
                                        <button
                                            key={y}
                                            onClick={() => setSelectedYear(y)}
                                            className={clsx(
                                                "py-2 px-3 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
                                                selectedYear === y
                                                    ? "bg-indigo-600 text-white border-transparent"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                            )}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Exam Type</label>
                                <select
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                                >
                                    <option value="Internal 1">Internal 1</option>
                                    <option value="Internal 2">Internal 2</option>
                                    <option value="Semester">Semester End</option>
                                </select>
                            </div>

                            <button
                                onClick={handlePublish}
                                disabled={loading || !selectedDeptId}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Publish Results"}
                            </button>

                            {message && (
                                <div className={clsx(
                                    "p-4 rounded-lg text-sm flex items-start gap-3",
                                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                )}>
                                    {message.type === 'success' ? <CheckCircle className="h-5 w-5 flex-shrink-0" /> : <AlertTriangle className="h-5 w-5 flex-shrink-0" />}
                                    {message.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <History className="h-5 w-5 text-gray-500" />
                                Publication History
                            </h3>
                            <button onClick={fetchPublications} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                Refresh
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {fetchingPubs ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 text-indigo-500 animate-spin" />
                                                <p className="mt-2 text-sm text-gray-500">Loading history...</p>
                                            </td>
                                        </tr>
                                    ) : publications.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center">
                                                <Monitor className="mx-auto h-12 w-12 text-gray-300" />
                                                <p className="mt-2 text-sm font-medium text-gray-900">No results published yet</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        publications.map((pub) => (
                                            <tr key={pub._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">{pub.departmentId?.name}</span>
                                                    <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        {pub.departmentId?.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                    {pub.year}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {pub.examType}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={clsx(
                                                        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                                        pub.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                                    )}>
                                                        {pub.isPublished ? 'Published' : 'Archived'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {pub.isPublished && (
                                                        <button
                                                            onClick={() => handleUnpublish(pub._id, pub.departmentId?.name, pub.year, pub.examType)}
                                                            className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                                                        >
                                                            <EyeOff className="h-4 w-4" /> Unpublish
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublishResults;
