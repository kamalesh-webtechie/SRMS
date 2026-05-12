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
    Monitor,
    X,
    Info,
    Check
} from 'lucide-react';
import clsx from 'clsx';

const PublishResults = () => {
    const [departments, setDepartments] = useState([]);
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [selectedYear, setSelectedYear] = useState('I');
    const [examType, setExamType] = useState('Internal 1');
    const [sections, setSections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [publications, setPublications] = useState([]);
    const [fetchingPubs, setFetchingPubs] = useState(true);
    
    // Preview/Confirmation State
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [fetchingPreview, setFetchingPreview] = useState(false);

    useEffect(() => {
        fetchDepts();
        fetchPublications();
    }, []);

    useEffect(() => {
        if (selectedDeptId && selectedYear) {
            fetchSections();
        } else {
            setSections([]);
            setSelectedSectionId('');
        }
    }, [selectedDeptId, selectedYear]);

    const fetchDepts = async () => {
        try {
            const { data } = await api.get('/departments');
            setDepartments(data);
            if (data.length > 0 && !selectedDeptId) setSelectedDeptId(data[0]._id);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const fetchSections = async () => {
        try {
            // Mapping year to typical semesters for section fetching
            const yearToSem = { 'I': 1, 'II': 3, 'III': 5, 'IV': 7 };
            const sem = yearToSem[selectedYear];
            const { data } = await api.get(`/sections/by-department/${selectedDeptId}/${sem}`);
            setSections(data);
            setSelectedSectionId(''); // Reset section when dept/year changes
        } catch (error) {
            console.error("Failed to fetch sections", error);
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

    const handlePublishClick = async () => {
        if (!selectedDeptId) {
            setMessage({ type: 'error', text: 'Please select a department.' });
            return;
        }

        setFetchingPreview(true);
        setShowConfirmation(true);
        setMessage(null);

        try {
            const { data } = await api.get('/result-publications/preview', {
                params: {
                    departmentId: selectedDeptId,
                    year: selectedYear,
                    examType,
                    sectionId: selectedSectionId || undefined
                }
            });
            setPreviewData(data);
        } catch (error) {
            console.error("Preview error", error);
            setMessage({ type: 'error', text: 'Failed to fetch status preview.' });
            setShowConfirmation(false);
        } finally {
            setFetchingPreview(false);
        }
    };

    const confirmPublish = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/result-publications', {
                departmentId: selectedDeptId,
                year: selectedYear,
                examType,
                sectionId: selectedSectionId || undefined
            });
            setMessage({ type: 'success', text: data.message });
            fetchPublications();
            setShowConfirmation(false);
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
                                            type="button"
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
                                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Section (Optional)</label>
                                <select
                                    value={selectedSectionId}
                                    onChange={(e) => setSelectedSectionId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                                >
                                    <option value="">All Sections</option>
                                    {sections.map(s => <option key={s._id} value={s._id}>{s.name} ({s.batch})</option>)}
                                </select>
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
                                onClick={handlePublishClick}
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
                                                    Year {pub.year} {pub.sectionId && `- Section ${pub.sectionId.name}`}
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

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={() => !loading && setShowConfirmation(false)}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                <h3 className="text-lg font-bold text-gray-900">Confirm Publication</h3>
                                <button onClick={() => !loading && setShowConfirmation(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="mb-6 bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                                    <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">Selection Summary</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-gray-500">Department:</span> <span className="font-semibold">{departments.find(d => d._id === selectedDeptId)?.name}</span></div>
                                        <div><span className="text-gray-500">Year:</span> <span className="font-semibold">{selectedYear}</span></div>
                                        <div><span className="text-gray-500">Exam:</span> <span className="font-semibold">{examType}</span></div>
                                        <div><span className="text-gray-500">Section:</span> <span className="font-semibold">{selectedSectionId ? sections.find(s => s._id === selectedSectionId)?.name : 'All Sections'}</span></div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                        <Info className="h-4 w-4 text-blue-500" />
                                        Subject Status Preview
                                    </h4>

                                    {fetchingPreview ? (
                                        <div className="py-8 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                                            <p className="mt-2 text-sm text-gray-500">Analyzing mark entries...</p>
                                        </div>
                                    ) : (
                                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Subject</th>
                                                        <th className="px-4 py-2 text-center text-xs font-bold text-gray-500">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {previewData.map(item => {
                                                        const isReady = item.statusSummary.ready === item.statusSummary.total;
                                                        const isPublished = item.statusSummary.published > 0;
                                                        
                                                        return (
                                                            <tr key={item._id}>
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                                    <div className="text-xs text-gray-500">{item.code} (Sem {item.semester})</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    {isPublished ? (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                            Published
                                                                        </span>
                                                                    ) : isReady ? (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                            <Check className="h-3 w-3" /> Ready
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                                                            <AlertTriangle className="h-3 w-3" /> Incomplete
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {previewData.some(p => p.statusSummary.ready < p.statusSummary.total && p.statusSummary.published === 0) && (
                                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-700">
                                                Some subjects are missing approved marks. Results for these subjects will NOT be visible to students even after publication.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => !loading && setShowConfirmation(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmPublish}
                                    disabled={loading || fetchingPreview}
                                    className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                    Confirm & Publish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublishResults;
