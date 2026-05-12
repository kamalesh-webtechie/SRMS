import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    BookOpen,
    Calendar,
    FileText,
    Loader2,
    Search,
    Award,
    TrendingUp,
    CheckCircle,
    ShieldAlert,
    Download,
    Cpu,
    Fingerprint,
    Stars,
    ChevronDown,
    Zap
} from 'lucide-react';
import clsx from 'clsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentResults = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [settings, setSettings] = useState(null);
    const [semester, setSemester] = useState('');
    const [examType, setExamType] = useState('Internal 1');
    const [result, setResult] = useState(null);
    const [showPassedOnlyCgpa, setShowPassedOnlyCgpa] = useState(false);
    const [showConversionTable, setShowConversionTable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Load profile and settings
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user profile
                const { data: userData } = await api.get('/auth/me');
                if (userData.profile) {
                    setProfile(userData.profile);
                    setSemester(userData.profile.semester);
                }

                // Fetch system settings
                const { data: settingsData } = await api.get('/system');
                setSettings(settingsData);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
            }
        };
        fetchData();
    }, []);

    const handleDownloadPDF = () => {
        try {
            if (!result) {
                alert("Please retrieve your records first.");
                return;
            }

            const doc = new jsPDF();
            const student = result.student || {};
            const timestamp = new Date().toLocaleString();

            const collegeName = settings?.collegeProfile?.collegeName || 'SRMS COLLEGE';

            // 1. Institutional Header
            doc.setFontSize(22);
            doc.setTextColor(63, 81, 181); // Indigo
            doc.text(collegeName.toUpperCase(), 105, 20, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('Authenticated Academic Transcript', 105, 28, { align: 'center' });
            doc.line(20, 32, 190, 32);

            // 2. Student Details
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.text(`Name: ${student.name || user?.name || 'N/A'}`, 20, 45);
            doc.text(`Reg No: ${student.registerNumber || 'N/A'}`, 20, 52);
            doc.text(`Department: ${student.department || 'N/A'}`, 20, 59);
            
            doc.text(`Year: ${student.currentYear || 'N/A'}`, 120, 45);
            doc.text(`Section: ${student.section?.name || 'N/A'}`, 120, 52);
            doc.text(`Semester: ${result.semester || 'N/A'}`, 120, 59);
            
            doc.text(`Exam Type: ${examType}`, 20, 66);
            doc.text(`Issued On: ${timestamp}`, 120, 66);

            // 3. Section Heading
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(`RESULT: SEMESTER ${result.semester || ''} - ${examType.toUpperCase()}`, 105, 80, { align: 'center' });

            // 4. Results Table
            const tableColumn = examType === 'Semester' 
                ? ["Course Code", "Course Title", "Credit", "Grade", "Grade Point"]
                : ["Course Code", "Course Title", "Score", "Max", "Grade", "%"];
            
            const tableRows = [];
            const subjects = result.subjects || [];
            const internals = result.internals || [];

            if (examType === 'Semester') {
                subjects.forEach(sub => {
                    tableRows.push([
                        sub.subjectCode || 'N/A',
                        sub.subjectName || 'N/A',
                        sub.credits || '0',
                        sub.grade || '-',
                        sub.gradePoint || '0'
                    ]);
                });
            } else {
                internals.forEach(internal => {
                    tableRows.push([
                        internal.subjectCode || 'N/A',
                        internal.subjectName || 'N/A',
                        internal.marks || '0',
                        internal.maxMarks || '0',
                        internal.grade || '-',
                        internal.maxMarks > 0 ? `${((internal.marks / internal.maxMarks) * 100).toFixed(0)}%` : '0%'
                    ]);
                });
            }

            autoTable(doc, {
                startY: 85,
                head: [tableColumn],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [63, 81, 181], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: 20, right: 20 }
            });

            // 5. Summary Footer
            const finalY = (doc.lastAutoTable?.finalY || 150) + 15;
            if (examType === 'Semester') {
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text(`SGPA: ${result.sgpa || '0.00'}`, 20, finalY);
                doc.text(`Total Credits: ${result.totalCredits || '0'}`, 120, finalY);
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(`Cumulative GPA (CGPA): ${student.cgpa || 'N/A'}`, 20, finalY + 10);
            } else {
                doc.setFontSize(10);
                doc.text('Note: This is an internal assessment report.', 20, finalY);
            }

            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('This is a computer-generated document and does not require a physical signature.', 105, 280, { align: 'center' });
            doc.text(`SRMS Digital Registry Verification Code: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 105, 285, { align: 'center' });

            doc.save(`${student.registerNumber || 'Student'}_Results_Sem${result.semester}_${examType.replace(' ', '_')}.pdf`);
        } catch (err) {
            console.error("PDF Generation Error:", err);
            alert("Failed to generate PDF. Please check the console for details.");
        }
    };

    const fetchResult = async () => {
        if (!semester || !examType) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const { data } = await api.get(`/academic/results/student/${profile._id}`);
            const semData = data.academicHistory.find(s => s.semester === Number(semester));

            if (!semData) {
                setError("Visibility Restriction: No published data found for this semester context.");
            } else {
                if (examType === 'Semester') {
                    if (semData.subjects && semData.subjects.length > 0) {
                        setResult({ ...semData, student: data.student });
                    } else {
                        setError("Terminal results for this cycle are not yet authorized for release.");
                    }
                } else {
                    const internalMarks = semData.internals.filter(i => i.examType === examType);
                    if (internalMarks.length > 0) {
                        setResult({ ...semData, internals: internalMarks, student: data.student });
                    } else {
                        setError(`Scholastic report for ${examType} is not available for this semester.`);
                    }
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || "Internal Registry Access Failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 animate-fade-in pb-20 px-4 md:px-0">
            {/* Professional Digital Identity Header */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 p-8 md:p-12 border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl mix-blend-multiply"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50/50 rounded-full -ml-32 -mb-32 blur-3xl mix-blend-multiply"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="h-24 w-24 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 transform hover:scale-105 transition-transform duration-300">
                            <Award className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold uppercase tracking-wider border border-slate-200">Official Profile</span>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold uppercase tracking-wider border border-emerald-100 flex items-center gap-1.5 leading-none">
                                    <Fingerprint className="h-3 w-3" /> Verified
                                </span>
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Academic Performance</h2>
                            <p className="text-slate-500 font-medium">Access your authenticated transcript and assessment metrics.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setShowConversionTable(true)}
                            className="h-12 px-6 bg-white text-slate-700 rounded-xl font-bold uppercase tracking-wide text-xs border border-slate-300 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 group"
                        >
                            <BookOpen className="h-4 w-4" /> Grading Rules
                        </button>
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={!result}
                            className="h-12 px-6 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wide text-xs border border-transparent hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="h-4 w-4 group-hover:animate-bounce" /> Transcript
                        </button>
                    </div>
                </div>

                {/* Query Hub */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="relative">
                        <label className="absolute -top-2.5 left-4 px-2 bg-white text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200 rounded-md shadow-sm z-10">Target Semester</label>
                        <div className="relative group">
                            <select
                                value={semester}
                                onChange={(e) => setSemester(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                    <option key={s} value={s}>Semester {s}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                        </div>
                    </div>

                    <div className="relative">
                        <label className="absolute -top-2.5 left-4 px-2 bg-white text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200 rounded-md shadow-sm z-10">Report Category</label>
                        <div className="relative group">
                            <select
                                value={examType}
                                onChange={(e) => setExamType(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-400"
                            >
                                <option value="Internal 1">Internal 1</option>
                                <option value="Internal 2">Internal 2</option>
                                <option value="Semester">Semester (Final Terminal)</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                        </div>
                    </div>

                    <button
                        onClick={fetchResult}
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex justify-center items-center gap-3 uppercase tracking-wide text-xs transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-[58px]"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                        Retrieve Records
                    </button>
                </div>
            </div>

            {/* Display Logic */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="py-40 text-center flex flex-col items-center">
                        <div className="relative">
                            <Cpu className="h-20 w-20 text-slate-100 animate-pulse" />
                            <Loader2 className="h-10 w-10 text-primary animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="mt-10 text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Accessing Distributed Ledger...</p>
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-[3rem] p-20 text-center border-4 border-dashed border-slate-50 animate-slide-up flex flex-col items-center">
                        <div className="h-32 w-32 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-xl shadow-amber-100/50 transform -rotate-3">
                            <ShieldAlert className="h-14 w-14 text-amber-500" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 uppercase tracking-[0.2em] mb-4">Access Restricted</h3>
                        <p className="text-slate-400 max-w-sm font-medium leading-relaxed">{error}</p>
                    </div>
                ) : result ? (
                    <div className="space-y-10 animate-slide-up">
                        {result && (
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <FileText className="h-6 w-6 text-indigo-600" />
                                    Semester {result.semester} - {examType}
                                </h3>
                            </div>
                        )}

                        {examType === 'Semester' ? (
                            /* Terminal Result Card */
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-8 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead>
                                            <tr className="text-left">
                                                <th className="px-6 py-4 text-sm font-bold text-blue-600">Course Code</th>
                                                <th className="px-6 py-4 text-sm font-bold text-blue-600">Course Title</th>
                                                <th className="px-6 py-4 text-sm font-bold text-blue-600 text-center">Credit</th>
                                                <th className="px-6 py-4 text-sm font-bold text-blue-600 text-center">Grade</th>
                                                <th className="px-6 py-4 text-sm font-bold text-blue-600 text-right">Grade Point</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {result.subjects.map((sub, i) => (
                                                <tr key={i} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm font-bold text-gray-700 uppercase">
                                                        {sub.subjectCode}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-500">
                                                        {sub.subjectName}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-700 text-center">
                                                        {sub.credits}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-700 text-center font-medium">
                                                        {sub.grade}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-700 text-right font-medium">
                                                        {sub.gradePoint}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50/80">
                                                <td colSpan="2" className="px-6 py-4 text-sm font-bold text-gray-600">
                                                    Total Credit Requirement: <span className="text-blue-600 ml-1">{result.totalCredits}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-600 text-center">
                                                    Total Credit Taken: <span className="text-blue-600 ml-1">{result.totalCredits}</span>
                                                </td>
                                                <td colSpan="2" className="px-6 py-4 text-sm font-bold text-gray-600 text-right">
                                                    SGPA: <span className="text-blue-600 ml-1">{result.sgpa}</span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                
                                {result.student?.cgpa && (
                                    <div className="px-8 py-4 bg-blue-50/30 border-t border-gray-100 flex justify-end">
                                        <div className="text-sm font-bold text-gray-700">
                                            Cumulative GPA (CGPA): <span className="text-blue-700 text-lg ml-2">{result.student.cgpa}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Internal Reports Grid */
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-8 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead>
                                            <tr className="text-left">
                                                <th className="px-6 py-4 text-sm font-bold text-indigo-600">Course Code</th>
                                                <th className="px-6 py-4 text-sm font-bold text-indigo-600">Course Title</th>
                                                <th className="px-6 py-4 text-sm font-bold text-indigo-600 text-center">Score</th>
                                                <th className="px-6 py-4 text-sm font-bold text-indigo-600 text-center">Max</th>
                                                <th className="px-6 py-4 text-sm font-bold text-indigo-600 text-center">Percentage</th>
                                                <th className="px-6 py-4 text-sm font-bold text-indigo-600 text-right">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {result.internals.map((internal, i) => (
                                                <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm font-bold text-gray-700 uppercase">
                                                        {internal.subjectCode}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-500 font-medium">
                                                        {internal.subjectName}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900 text-center font-black">
                                                        {internal.marks}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-400 text-center">
                                                        {internal.maxMarks}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-center">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                                                                <div 
                                                                    className="h-full bg-indigo-500 rounded-full" 
                                                                    style={{ width: `${(internal.marks / internal.maxMarks) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                                {((internal.marks / internal.maxMarks) * 100).toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-700 text-right">
                                                        <span className="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 font-black text-slate-700">
                                                            {internal.grade}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authenticated Continuous Assessment Report</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400"></div>
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-300"></div>
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-200"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Default State */
                    <div className="py-40 flex flex-col items-center justify-center text-center opacity-40">
                        <div className="h-32 w-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-10 transform -rotate-12 shadow-xl shadow-slate-100">
                            <Zap className="h-14 w-14 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-300 uppercase tracking-[0.2em]">Deployment Required</h3>
                        <p className="text-slate-400 font-medium mt-4 max-w-xs">Initialize official record retrieval by selecting a semester and target assessment scope.</p>
                    </div>
                )}
            </div>

            {/* R-2021 Grade Conversion Table Modal */}
            {showConversionTable && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowConversionTable(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-spring-up">
                        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Anna University R-2021</h3>
                                <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">Grading & Points System (CBCS)</p>
                            </div>
                            <button onClick={() => setShowConversionTable(false)} className="h-10 w-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                                <Zap className="h-5 w-5 rotate-12" />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="space-y-4">
                                {[
                                    { grade: 'O', desc: 'Outstanding', points: 10, range: '91 - 100' },
                                    { grade: 'A+', desc: 'Excellent', points: 9, range: '81 - 90' },
                                    { grade: 'A', desc: 'Very Good', points: 8, range: '71 - 80' },
                                    { grade: 'B+', desc: 'Good', points: 7, range: '61 - 70' },
                                    { grade: 'B', desc: 'Average', points: 6, range: '51 - 60' },
                                    { grade: 'C', desc: 'Satisfactory', points: 5, range: '45 - 50' },
                                    { grade: 'U', desc: 'Reappearance (Fail)', points: 0, range: '< 45' }
                                ].map((row, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center font-black text-slate-700 group-hover:text-indigo-600">
                                                {row.grade}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{row.desc}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{row.range}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-slate-400 group-hover:text-indigo-600">{row.points}</span>
                                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Points</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                                    * GPA = Σ(Ci × GPi) / Σ(Ci). CGPA is calculated using the weighted credit system across all semesters.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentResults;
