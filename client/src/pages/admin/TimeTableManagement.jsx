import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Save, AlertCircle, Calendar, Clock, Upload } from 'lucide-react';
import api from '../../services/api';
import { getActiveBatches, YEARS, SEMESTERS } from '../../utils/academicUtils';
import { useSystem } from '../../context/SystemContext';
import { useAuth } from '../../context/AuthContext';
import BulkTimeTableUpload from '../../components/BulkTimeTableUpload';

const TimeTableManagement = () => {
    const { user } = useAuth();
    const isHod = user?.role === 'hod';

    const [timetables, setTimetables] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingSections, setLoadingSections] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentTimetable, setCurrentTimetable] = useState(null);

    const { systemSettings } = useSystem();
    const ttConfig = systemSettings?.timetableSettings || {};

    // Form state
    const [formData, setFormData] = useState({
        department: isHod ? user?.department : '',
        batch: '',
        year: '',
        section: '',
        semester: '',
        startTime: ttConfig.startTime || '09:00',
        periodDuration: ttConfig.periodDuration || 60,
        totalPeriods: ttConfig.totalPeriods || 6,
        shortBreakAfter: ttConfig.shortBreak?.afterPeriod || 2,
        shortBreakDuration: ttConfig.shortBreak?.duration || 15,
        lunchAfter: ttConfig.lunchBreak?.afterPeriod || 4,
        lunchDuration: ttConfig.lunchBreak?.duration || 60
    });

    const [dayPeriods, setDayPeriods] = useState({});
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 10000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const fetchData = async () => {
        setLoadingSections(true);
        try {
            const [ttRes, deptRes, secRes, facRes, subRes] = await Promise.all([
                api.get('/timetable'),
                api.get('/departments'),
                api.get('/sections'),
                api.get('/faculty'),
                api.get('/academic/subjects')
            ]);
            
            const fetchedDepartments = deptRes.data || [];
            setDepartments(fetchedDepartments);
            setSections(secRes.data || []);
            setSubjects(subRes.data || []);

            // Set HOD department name automatically
            if (isHod && user?.departmentId) {
                const hodDept = fetchedDepartments.find(d => d._id === user.departmentId);
                if (hodDept) {
                    setFormData(prev => ({ ...prev, department: hodDept.name }));
                }
            }

            // Sort Faculty: HOD's department first
            let fetchedFaculties = facRes.data || [];
            if (isHod && user?.departmentId) {
                const hodDept = fetchedDepartments.find(d => d._id === user.departmentId);
                if (hodDept) {
                    fetchedFaculties = [...fetchedFaculties].sort((a, b) => {
                        const aInDept = a.department === hodDept.name;
                        const bInDept = b.department === hodDept.name;
                        if (aInDept && !bInDept) return -1;
                        if (!aInDept && bInDept) return 1;
                        return 0;
                    });
                }
            }
            setFaculties(fetchedFaculties);
            
            setTimetables(ttRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch data', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
            setLoadingSections(false);
        }
    };

    const generateTimeSlots = () => {
        const baseSlots = [];
        let currentTime = formData.startTime;

        for (let i = 1; i <= formData.totalPeriods; i++) {
            const [hours, minutes] = currentTime.split(':').map(Number);
            const startMinutes = hours * 60 + minutes;
            const endMinutes = startMinutes + formData.periodDuration;
            const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

            baseSlots.push({
                periodNumber: i,
                startTime: currentTime,
                endTime: endTime,
                subject: '',
                facultyId: '',
                type: 'class'
            });

            currentTime = endTime;

            // Add short break
            if (i === formData.shortBreakAfter) {
                const breakEnd = endMinutes + (formData.shortBreakDuration || 15);
                baseSlots.push({
                    periodNumber: i + 0.1,
                    startTime: endTime,
                    endTime: `${String(Math.floor(breakEnd / 60)).padStart(2, '0')}:${String(breakEnd % 60).padStart(2, '0')}`,
                    subject: '',
                    facultyId: '',
                    type: 'break'
                });
                currentTime = `${String(Math.floor(breakEnd / 60)).padStart(2, '0')}:${String(breakEnd % 60).padStart(2, '0')}`;
            }

            // Add lunch break
            if (i === formData.lunchAfter) {
                const lunchEnd = endMinutes + formData.lunchDuration;
                baseSlots.push({
                    periodNumber: i + 0.2,
                    startTime: endTime,
                    endTime: `${String(Math.floor(lunchEnd / 60)).padStart(2, '0')}:${String(lunchEnd % 60).padStart(2, '0')}`,
                    subject: '',
                    facultyId: '',
                    type: 'lunch'
                });
                currentTime = `${String(Math.floor(lunchEnd / 60)).padStart(2, '0')}:${String(lunchEnd % 60).padStart(2, '0')}`;
            }
        }

        const newDayPeriods = {};
        days.forEach(day => {
            newDayPeriods[day] = JSON.parse(JSON.stringify(baseSlots));
        });
        setDayPeriods(newDayPeriods);
    };

    const addCustomBreak = () => {
        const currentPeriods = dayPeriods[selectedDay] || [];
        const lastPeriod = currentPeriods[currentPeriods.length - 1];
        let startTime = formData.startTime;
        let periodNumber = 1;

        if (lastPeriod) {
            startTime = lastPeriod.endTime;
            periodNumber = Math.floor(lastPeriod.periodNumber) + 1;
        }

        const [hours, minutes] = startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + 15; // Default 15 min break
        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

        const newBreak = {
            periodNumber: periodNumber - 0.5, // Informal position
            startTime,
            endTime,
            subject: '',
            facultyId: '',
            type: 'break'
        };

        setDayPeriods({
            ...dayPeriods,
            [selectedDay]: [...currentPeriods, newBreak].sort((a, b) => a.periodNumber - b.periodNumber)
        });
    };

    const removePeriod = (periodNumber) => {
        setDayPeriods({
            ...dayPeriods,
            [selectedDay]: dayPeriods[selectedDay].filter(p => p.periodNumber !== periodNumber)
        });
    };

    const handleGenerateSlots = () => {
        if (!formData.department || !formData.batch || !formData.section || !formData.semester) {
            setError('Please select Department, Batch, Section, and Semester');
            return;
        }
        generateTimeSlots();
    };

    const handleSlotChange = (day, periodNumber, field, value) => {
        setDayPeriods(prev => ({
            ...prev,
            [day]: prev[day].map(slot =>
                slot.periodNumber === periodNumber ? { ...slot, [field]: value } : slot
            )
        }));
    };

    const handleSaveTimetable = async () => {
        try {
            // Validate that all class periods for all days have subject and faculty
            for (const day of days) {
                const daySlots = dayPeriods[day] || [];
                const invalidSlots = daySlots.filter(s => s.type === 'class' && (!s.subject || !s.facultyId));
                if (invalidSlots.length > 0) {
                    setError(`Please assign subject and faculty to all class periods on ${day} `);
                    return;
                }
            }

            const timetableData = {
                department: formData.department,
                batch: formData.batch,
                year: formData.year,
                section: formData.section,
                semester: formData.semester,
                days: days.map(day => ({
                    day,
                    periods: (dayPeriods[day] || []).map(p => ({
                        ...p,
                        facultyId: typeof p.facultyId === 'object' ? p.facultyId?._id : p.facultyId
                    }))
                }))
            };

            if (editMode && currentTimetable) {
                await api.put(`/timetable/update/${currentTimetable._id}`, timetableData);
                setSuccessMessage('Timetable updated successfully');
            } else {
                await api.post('/timetable/create', timetableData);
                setSuccessMessage('Timetable created successfully');
            }

            fetchData();
            setShowModal(false);
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save timetable');
        }
    };

    const handleBulkData = (data) => {
        setDayPeriods(data.reduce((acc, day) => {
            acc[day.day] = day.periods;
            return acc;
        }, {}));
        setShowBulkModal(false);
        setShowModal(true);
        setSuccessMessage('Timetable data imported. Please review and save.');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this timetable?')) {
            try {
                await api.delete(`/timetable/delete/${id}`);
                setSuccessMessage('Timetable deleted successfully');
                fetchData();
            } catch (err) {
                setError('Failed to delete timetable');
            }
        }
    };

    const handleEdit = (timetable) => {
        setCurrentTimetable(timetable);
        setEditMode(true);
        setFormData({
            department: timetable.department,
            batch: timetable.batch,
            year: timetable.year || '',
            section: timetable.section,
            semester: timetable.semester,
            startTime: timetable.days[0]?.periods[0]?.startTime || ttConfig.startTime || '09:00',
            periodDuration: ttConfig.periodDuration || 60,
            totalPeriods: ttConfig.totalPeriods || 6,
            shortBreakAfter: ttConfig.shortBreak?.afterPeriod || 2,
            shortBreakDuration: ttConfig.shortBreak?.duration || 15,
            lunchAfter: ttConfig.lunchBreak?.afterPeriod || 4,
            lunchDuration: ttConfig.lunchDuration || 60
        });
        const initialDayPeriods = {};
        timetable.days.forEach(d => {
            initialDayPeriods[d.day] = d.periods;
        });
        setDayPeriods(initialDayPeriods);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            department: '',
            batch: '',
            year: '',
            section: '',
            semester: '',
            startTime: ttConfig.startTime || '09:00',
            periodDuration: ttConfig.periodDuration || 60,
            totalPeriods: ttConfig.totalPeriods || 6,
            shortBreakAfter: ttConfig.shortBreak?.afterPeriod || 2,
            shortBreakDuration: ttConfig.shortBreak?.duration || 15,
            lunchAfter: ttConfig.lunchBreak?.afterPeriod || 4,
            lunchDuration: ttConfig.lunchBreak?.duration || 60
        });

        // Re-apply HOD department if resetting
        if (isHod && user?.departmentId) {
            const hodDept = departments.find(d => d._id === user.departmentId);
            if (hodDept) {
                setFormData(prev => ({ ...prev, department: hodDept.name }));
            }
        }
        setDayPeriods({});
        setEditMode(false);
        setCurrentTimetable(null);
    };

    const getFilteredSections = () => {
        return sections.filter(s => {
            const deptMatch = formData.department ? s.department === formData.department : true;
            const batchMatch = formData.batch ? s.batch === formData.batch : true;
            return deptMatch && batchMatch;
        });
    };

    const getBatchOptions = () => {
        const batchOptions = getActiveBatches();
        return batchOptions;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Time Table Management</h2>
                    <p className="text-gray-500 mt-1">Create and manage class timetables</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { resetForm(); setShowBulkModal(true); }}
                        className="inline-flex items-center px-4 py-2 border border-indigo-200 text-sm font-medium rounded-lg shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Upload
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Timetable
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <span className="font-bold mr-1">Note:</span> {error}
            </div>}

            {successMessage && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-semibold">
                {successMessage}
            </div>}

            {/* Timetables List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Existing Timetables</h3>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                        <p className="mt-2 text-gray-500">Loading timetables...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Semester</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {timetables.map((tt) => (
                                    <tr key={tt._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tt.department}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tt.batch}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tt.year}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tt.section}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tt.semester}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button onClick={() => handleEdit(tt)} className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-indigo-50">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(tt._id)} className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {timetables.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No timetables found. Create one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between sticky top-0 z-10">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <AlertCircle className="h-5 w-5 mr-2 text-indigo-600" />
                                {editMode ? 'Edit Timetable' : 'Create Timetable'}
                            </h3>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                                <span className="font-bold mr-1">Note:</span> {error}
                            </div>}
                            {/* Configuration */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
                                    <select className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        disabled={isHod}
                                        value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value, batch: '', year: '', section: '', semester: '' })}>
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Batch</label>
                                    <select className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        disabled={!formData.department}
                                        value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value, year: '', section: '', semester: '' })}>
                                        <option value="">Select Batch</option>
                                        {getBatchOptions().map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Year</label>
                                    <select className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        disabled={!formData.batch}
                                        value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value, section: '', semester: '' })}>
                                        <option value="">Select Year</option>
                                        {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Section</label>
                                    <select className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        disabled={!formData.year || loadingSections}
                                        value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value, semester: '' })}>
                                        {loadingSections ? (
                                            <option value="">Loading...</option>
                                        ) : (
                                            <>
                                                <option value="">Select Section</option>
                                                {(() => {
                                                    const filtered = getFilteredSections();
                                                    return filtered.length > 0 ? (
                                                        filtered.map(s => <option key={s._id} value={s.name}>{s.name}</option>)
                                                    ) : (
                                                        <option value="" disabled>No sections available</option>
                                                    );
                                                })()}
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Semester</label>
                                    <select className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        disabled={!formData.section}
                                        value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}>
                                        <option value="">Select Semester</option>
                                        {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-sm font-bold text-gray-700 mb-3">Time Configuration</h4>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                                        <input type="time" className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Period Duration (min)</label>
                                        <input type="number" className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            value={formData.periodDuration} onChange={(e) => setFormData({ ...formData, periodDuration: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Total Periods</label>
                                        <input type="number" className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            value={formData.totalPeriods} onChange={(e) => setFormData({ ...formData, totalPeriods: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Short Break After</label>
                                        <input type="number" className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            value={formData.shortBreakAfter} onChange={(e) => setFormData({ ...formData, shortBreakAfter: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Short Duration (min)</label>
                                        <input type="number" className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            value={formData.shortBreakDuration} onChange={(e) => setFormData({ ...formData, shortBreakDuration: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Lunch After</label>
                                        <input type="number" className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            value={formData.lunchAfter} onChange={(e) => setFormData({ ...formData, lunchAfter: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Lunch Duration (min)</label>
                                        <input type="number" className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            value={formData.lunchDuration} onChange={(e) => setFormData({ ...formData, lunchDuration: parseInt(e.target.value) })} />
                                    </div>
                                </div>
                                <button onClick={handleGenerateSlots} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Generate Time Slots
                                </button>
                            </div>

                            {/* Generated Slots */}
                            {Object.keys(dayPeriods).length > 0 && (
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                                        <h4 className="text-sm font-bold text-gray-700">Assign Subjects & Faculty</h4>
                                        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar max-w-full">
                                            {days.map(day => (
                                                <button
                                                    key={day}
                                                    onClick={() => setSelectedDay(day)}
                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${selectedDay === day
                                                        ? 'bg-white text-indigo-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    {day.substring(0, 3)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Faculty</th>
                                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {(dayPeriods[selectedDay] || []).map((slot, idx) => (
                                                    <tr key={`${selectedDay}-${idx}`} className={slot.type !== 'class' ? 'bg-gray-50' : ''}>
                                                        <td className="px-4 py-2 text-sm text-gray-900">{Math.floor(slot.periodNumber)}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-900">
                                                            <div className="flex items-center space-x-1">
                                                                <input
                                                                    type="time"
                                                                    className="border-none bg-transparent p-0 text-sm focus:ring-0 w-20"
                                                                    value={slot.startTime}
                                                                    onChange={(e) => handleSlotChange(selectedDay, slot.periodNumber, 'startTime', e.target.value)}
                                                                />
                                                                <span className="text-gray-400">-</span>
                                                                <input
                                                                    type="time"
                                                                    className="border-none bg-transparent p-0 text-sm focus:ring-0 w-20"
                                                                    value={slot.endTime}
                                                                    onChange={(e) => handleSlotChange(selectedDay, slot.periodNumber, 'endTime', e.target.value)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            <select
                                                                className={`px-2 py-1 rounded-full text-xs font-semibold bg-transparent border-none focus:ring-0 ${slot.type === 'class' ? 'text-blue-800' :
                                                                    slot.type === 'break' ? 'text-yellow-800' :
                                                                        'text-green-800'
                                                                    }`}
                                                                value={slot.type}
                                                                onChange={(e) => handleSlotChange(selectedDay, slot.periodNumber, 'type', e.target.value)}
                                                            >
                                                                <option value="class">CLASS</option>
                                                                <option value="break">BREAK</option>
                                                                <option value="lunch">LUNCH</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {slot.type === 'class' ? (
                                                                <select className="w-full border border-gray-300 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                                    value={slot.subject} onChange={(e) => handleSlotChange(selectedDay, slot.periodNumber, 'subject', e.target.value)}>
                                                                    <option value="">Select Subject</option>
                                                                    {subjects.filter(s => s.semester === parseInt(formData.semester)).map(s => (
                                                                        <option key={s._id} value={s.name}>{s.name} ({s.code})</option>
                                                                    ))}
                                                                </select>
                                                            ) : <span className="text-gray-400">-</span>}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {slot.type === 'class' ? (
                                                                <select className="w-full border border-gray-300 rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                                    value={typeof slot.facultyId === 'object' ? slot.facultyId?._id : slot.facultyId}
                                                                    onChange={(e) => handleSlotChange(selectedDay, slot.periodNumber, 'facultyId', e.target.value)}>
                                                                    <option value="">Select Faculty</option>
                                                                    {faculties.map(f => {
                                                                        const isCurrentDept = isHod && f.department === formData.department;
                                                                        return (
                                                                            <option key={f._id} value={f.user?._id}>
                                                                                {f.user?.name} {isCurrentDept ? '(Your Dept)' : `(${f.department})`}
                                                                            </option>
                                                                        );
                                                                    })}
                                                                </select>
                                                            ) : <span className="text-gray-400">-</span>}
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            <button
                                                                onClick={() => removePeriod(slot.periodNumber)}
                                                                className="text-red-400 hover:text-red-600 transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-4 flex justify-start">
                                        <button
                                            onClick={addCustomBreak}
                                            className="inline-flex items-center px-3 py-1.5 border border-indigo-600 text-xs font-medium rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            Add Custom Break for {selectedDay}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button onClick={handleSaveTimetable} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Timetable
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {showBulkModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                    <BulkTimeTableUpload 
                        onClose={() => setShowBulkModal(false)}
                        onDataUpload={handleBulkData}
                        faculties={faculties}
                        subjects={subjects}
                        metadata={formData}
                    />
                </div>
            )}
        </div>
    );
};

export default TimeTableManagement;
