import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import {
    FileText,
    FileSpreadsheet,
    Clock,
    Save,
    Loader2,
    Calendar,
    PieChart,
    BarChart3,
    CheckCircle2,
    X,
    UserCheck,
    UserX,
    OctagonAlert
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import clsx from 'clsx';

import { YEARS } from '../../utils/academicUtils';

const AttendanceReports = () => {
    const { user } = useAuth();
    const { systemSettings, updateSystemSettings } = useSystem();
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [reportType, setReportType] = useState('summary'); // 'summary' or 'absentees'
    const [reportData, setReportData] = useState([]);
    const [dailySummaryData, setDailySummaryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingDepts, setLoadingDepts] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);

    // Details Modal State
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedReportRow, setSelectedReportRow] = useState(null);
    const [detailsData, setDetailsData] = useState({ present: [], absent: [], onDuty: [] });
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Lock Time State
    const [lockTime, setLockTime] = useState('23:59');
    const [updatingLock, setUpdatingLock] = useState(false);

    useEffect(() => {
        if (user) {
            fetchDepartments();
            fetchSections();
        }
        if (systemSettings?.attendanceSettings?.attendanceLockTime) {
            setLockTime(systemSettings.attendanceSettings.attendanceLockTime);
        } else if (systemSettings?.attendanceLockTime) {
            setLockTime(systemSettings.attendanceLockTime);
        }
    }, [systemSettings, user]);

    const fetchDepartments = async () => {
        setLoadingDepts(true);
        try {
            const { data } = await api.get('/departments');
            setDepartments(data);
            
            // If user is HOD, default to their department and freeze
            if (user?.role === 'hod' && user.departmentId) {
                const userDept = data.find(d => d._id === user.departmentId || d.id === user.departmentId);
                if (userDept) {
                    setSelectedDept(userDept.code || userDept.name);
                }
            } else if (data.length > 0 && !selectedDept) {
                // Default to first department if none selected
                setSelectedDept(data[0].code || data[0].name || '');
            }
        } catch (error) {
            console.error("Failed to fetch departments", error);
        } finally {
            setLoadingDepts(false);
        }
    };

    const fetchSections = async () => {
        setLoadingSections(true);
        try {
            const { data } = await api.get('/sections');
            console.log("Sections:", data);
            setSections(data);
        } catch (error) {
            console.error("Failed to fetch sections", error);
        } finally {
            setLoadingSections(false);
        }
    };

    const handleLockTimeUpdate = async () => {
        setUpdatingLock(true);
        try {
            const updatedSettings = {
                ...systemSettings,
                attendanceSettings: {
                    ...(systemSettings.attendanceSettings || {}),
                    attendanceLockTime: lockTime
                }
            };
            await updateSystemSettings(updatedSettings);
        } catch (error) {
            console.error("Failed to update lock time", error);
        } finally {
            setUpdatingLock(false);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate,
                endDate,
                department: selectedDept,
                reportType
            });
            if (selectedYear) params.append('year', selectedYear);
            if (selectedSection) params.append('sectionId', selectedSection);

            const { data } = await api.get(`/attendance/report/daily?${params.toString()}`);
            setReportData(data);

            // Also fetch daily summary for the START DATE for the overview section
            const summaryParams = new URLSearchParams({
                date: startDate,
                department: selectedDept
            });
            const summaryRes = await api.get(`/attendance/report/daily-summary?${summaryParams.toString()}`);
            setDailySummaryData(summaryRes.data);
        } catch (error) {
            console.error("Failed to fetch report", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (row) => {
        setDetailsLoading(true);
        setSelectedReportRow(row);
        setIsDetailsModalOpen(true);
        try {
            const subjectParam = row.subjectId ? `&subjectId=${row.subjectId}` : '';
            const { data } = await api.get(`/attendance/report/student-details?date=${row.date}&department=${selectedDept}${subjectParam}&sectionId=${row.sectionId}`);
            setDetailsData(data);
        } catch (error) {
            console.error("Failed to fetch attendance details", error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        const title = reportType === 'absentees' ? 'Detailed Absentee Report' : 'Daily Attendance Report';
        doc.setFontSize(18);
        doc.text(title, 14, 20);
        doc.setFontSize(10);
        doc.text(`Period: ${startDate} to ${endDate} | Dept: ${selectedDept}`, 14, 30);

        let tableColumn, tableRows;
        if (reportType === 'absentees') {
            tableColumn = ["Date", "Student", "Reg No", "Year", "Sec", "Subject", "Batch"];
            tableRows = reportData.map(row => [
                row.date.split('T')[0], row.studentName, row.registerNumber,
                row.year, row.section, row.subjectName, row.batch
            ]);
        } else {
            tableColumn = ["Date", "Year", "Sec", "Subject", "Marked By", "Present", "Absent", "OD"];
            tableRows = reportData.map(row => [
                row.date, row.year, row.section, row.subjectName,
                row.markedByName || 'Pending', row.totalPresent, row.totalAbsent, row.totalOD
            ]);
        }

        doc.autoTable(tableColumn, tableRows, { startY: 40 });
        doc.save(`${title.replace(/ /g, '_')}_${selectedDept}.pdf`);
    };

    const exportExcel = () => {
        let exportData;
        if (reportType === 'absentees') {
            exportData = reportData.map(row => ({
                "Date": row.date.split('T')[0],
                "Student Name": row.studentName,
                "Register Number": row.registerNumber,
                "Batch": row.batch,
                "Year": row.year,
                "Section": row.section,
                "Subject": row.subjectName,
                "Subject Code": row.subjectCode
            }));
        } else {
            exportData = reportData.map(row => ({
                "Date": row.date,
                "Year": row.year,
                "Section": row.section,
                "Subject": row.subjectName,
                "Faculty": row.markedByName || 'Pending',
                "Present": row.totalPresent,
                "Absent": row.totalAbsent,
                "OD": row.totalOD
            }));
        }

        const workSheet = XLSX.utils.json_to_sheet(exportData);
        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, "Attendance");
        const filename = reportType === 'absentees' ? 'Absentee_Report' : 'Attendance_Report';
        XLSX.writeFile(workBook, `${filename}_${selectedDept}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Attendance Reports</h2>
                    <p className="text-gray-500 mt-1">Daily attendance overview, analysis, and export tools.</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                    <div className="flex items-center px-3 py-1 bg-gray-50 rounded text-sm text-gray-600 border border-gray-200">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium mr-2">Lock Time:</span>
                        <input
                            type="time"
                            value={lockTime}
                            onChange={(e) => setLockTime(e.target.value)}
                            className="bg-transparent border-none p-0 h-6 w-20 focus:ring-0 text-sm font-semibold text-gray-900"
                        />
                    </div>
                    <button
                        onClick={handleLockTimeUpdate}
                        disabled={updatingLock}
                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
                        title="Save Lock Time"
                    >
                        {updatingLock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Department</label>
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className={clsx(
                                "w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow font-medium",
                                user?.role === 'hod' && "bg-gray-100 cursor-not-allowed opacity-75"
                            )}
                            disabled={user?.role === 'hod' || loadingDepts}
                        >
                            {loadingDepts ? (
                                <option value="">Loading Departments...</option>
                            ) : (
                                <>
                                    <option value="">Select Department</option>
                                    {departments.map((d, i) => (
                                        <option key={i} value={d.code || d.name}>{d.name}</option>
                                    ))}
                                </>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                        >
                            <option value="">All Years</option>
                            {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Section</label>
                        <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow"
                            disabled={loadingSections}
                        >
                            {loadingSections ? (
                                <option value="">Loading...</option>
                            ) : (
                                <>
                                    <option value="">All Sections</option>
                                    {(() => {
                                        const filtered = sections.filter(s =>
                                            (!selectedDept || s.department === selectedDept || s.departmentId?.code === selectedDept || s.departmentId === selectedDept) &&
                                            (!selectedYear || s.year === selectedYear)
                                        );
                                        return filtered.length > 0 ? (
                                            filtered.map(s => (
                                                <option key={s._id} value={s._id}>Year {s.year} - {s.name} ({s.batch})</option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No sections available</option>
                                        );
                                    })()}
                                </>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white transition-shadow font-medium text-indigo-600"
                        >
                            <option value="summary">Class Summary</option>
                            <option value="absentees">Detailed Absentees</option>
                        </select>
                    </div>
                    <div className="lg:col-span-2">
                        <button
                            onClick={fetchReport}
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <BarChart3 className="h-5 w-5 mr-2" />}
                            Generate {reportType === 'absentees' ? 'Absentee List' : 'Attendance Report'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Results */}
            {reportData.length > 0 ? (
                <div className="space-y-6">
                    <div className="flex justify-end gap-3">
                        <button onClick={exportPDF} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                            <FileText className="h-4 w-4 mr-2 text-red-500" /> Export PDF
                        </button>
                        <button onClick={exportExcel} className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                            <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" /> Export Excel
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            {reportType === 'summary' ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Info</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marked By</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">OD</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reportData.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.date}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{row.departmentName}</div>
                                                    <div className="text-xs text-gray-500 flex gap-2 mt-1">
                                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">Year {row.year}</span>
                                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">Sec {row.section}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{row.subjectName}</div>
                                                    <div className="text-xs text-gray-500">{row.subjectCode}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {row.markedByName ? (
                                                        <span className="text-sm text-gray-900">{row.markedByName}</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-sm font-bold text-green-600">{row.totalPresent}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-sm font-bold text-red-600">{row.totalAbsent}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-sm font-bold text-yellow-600">{row.totalOD}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => fetchDetails(row)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Details</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reportData.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.date.split('T')[0]}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900">{row.studentName}</div>
                                                    <div className="text-xs text-gray-500">{row.registerNumber}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    Year {row.year} - {row.section}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{row.subjectName}</div>
                                                    <div className="text-xs text-gray-500">{row.subjectCode}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.batch}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            ) : dailySummaryData.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                    <div className="mx-auto h-12 w-12 text-gray-300">
                        <PieChart className="h-full w-full" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Select a different date or department to view reports.
                    </p>
                </div>
            ) : null}

            {/* Daily Department Overview Section */}
            {dailySummaryData.length > 0 && (
                <div className="mt-12 space-y-6 pt-12 border-t-2 border-dashed border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Daily Department Overview</h3>
                            <p className="text-sm text-gray-500 mt-1">Class-wise roll-up for {startDate}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-indigo-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Year</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Class</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">Present</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">Absent</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider">OD</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {dailySummaryData.map((row, i) => (
                                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.departmentName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Year {row.year}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{row.sectionName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-green-600">{row.totalPresent}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-red-600">{row.totalAbsent}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-yellow-600">{row.totalOD}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => fetchDetails({ ...row, section: row.sectionName })}
                                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md transition-colors"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {isDetailsModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    {/* Background overlay */}
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                        aria-hidden="true"
                        onClick={() => setIsDetailsModalOpen(false)}
                    ></div>

                    {/* Modal panel */}
                    <div className="relative bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200 opacity-100 scale-100">
                        {/* Fixed Header */}
                        <div className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-extrabold text-gray-900" id="modal-title">
                                    Attendance Details: {selectedReportRow?.subjectName || 'Daily Summary'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{selectedReportRow?.departmentName}</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{selectedReportRow?.section}</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-indigo-600">{selectedReportRow?.date}</span>
                                </p>
                            </div>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 custom-scrollbar">
                            {detailsLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center">
                                    <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
                                    <p className="text-gray-500 font-bold">Fetching records...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Present Section */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                                        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                                            <h4 className="font-bold text-emerald-900 flex items-center gap-2 text-sm">
                                                <UserCheck className="h-4 w-4 text-emerald-600" />
                                                Present
                                            </h4>
                                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                {detailsData.present.length}
                                            </span>
                                        </div>
                                        <div className="p-2 space-y-1.5 flex-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {detailsData.present.map((s, idx) => (
                                                <div key={idx} className="p-3 rounded-xl border border-gray-50 flex items-center justify-between hover:bg-emerald-50/50 transition-colors group">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-900">{s.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono">{s.registerNumber}</p>
                                                    </div>
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                                </div>
                                            ))}
                                            {detailsData.present.length === 0 && (
                                                <div className="py-8 text-center text-xs text-gray-400 italic">No records</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Absent Section */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                                        <div className="px-4 py-3 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                                            <h4 className="font-bold text-rose-900 flex items-center gap-2 text-sm">
                                                <UserX className="h-4 w-4 text-rose-600" />
                                                Absent
                                            </h4>
                                            <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                {detailsData.absent.length}
                                            </span>
                                        </div>
                                        <div className="p-2 space-y-1.5 flex-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {detailsData.absent.map((s, idx) => (
                                                <div key={idx} className="p-3 rounded-xl border border-gray-50 flex items-center justify-between hover:bg-rose-50/50 transition-colors group">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 group-hover:text-rose-900">{s.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono">{s.registerNumber}</p>
                                                    </div>
                                                    <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                                                </div>
                                            ))}
                                            {detailsData.absent.length === 0 && (
                                                <div className="py-8 text-center text-xs text-gray-400 italic">No records</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* OD Section */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                                        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                                            <h4 className="font-bold text-amber-900 flex items-center gap-2 text-sm">
                                                <UserCheck className="h-4 w-4 text-amber-600" />
                                                On Duty
                                            </h4>
                                            <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                {detailsData.onDuty?.length || 0}
                                            </span>
                                        </div>
                                        <div className="p-2 space-y-1.5 flex-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {detailsData.onDuty?.map((s, idx) => (
                                                <div key={idx} className="p-3 rounded-xl border border-gray-50 flex items-center justify-between hover:bg-amber-50/50 transition-colors group">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 group-hover:text-amber-900">{s.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-mono">{s.registerNumber}</p>
                                                    </div>
                                                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                                </div>
                                            ))}
                                            {(!detailsData.onDuty || detailsData.onDuty.length === 0) && (
                                                <div className="py-8 text-center text-xs text-gray-400 italic">No records</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Fixed Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end">
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AttendanceReports;
