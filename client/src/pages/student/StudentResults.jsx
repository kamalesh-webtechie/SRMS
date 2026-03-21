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

const StudentResults = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [semester, setSemester] = useState('');
    const [examType, setExamType] = useState('Internal 1');
    const [result, setResult] = useState(null);
    const [showPassedOnlyCgpa, setShowPassedOnlyCgpa] = useState(false);
    const [showConversionTable, setShowConversionTable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load profile key data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/auth/me');
                if (data.profile) {
                    setProfile(data.profile);
                    setSemester(data.profile.semester);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, []);

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
                        <button className="h-12 px-6 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wide text-xs border border-transparent hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2 group">
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
                        {examType === 'Semester' ? (
                            /* Terminal Result Card */
                            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden transform hover:-translate-y-2 transition-transform duration-700">
                                <div className="bg-gradient-to-br from-primary via-secondary to-primary px-12 py-14 flex flex-col lg:flex-row justify-between items-center text-white relative">
                                    <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                                    <div className="relative z-10 flex items-center gap-8 mb-8 lg:mb-0">
                                        <div className="p-5 bg-white/10 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-2xl">
                                            <TrendingUp className="h-12 w-12 text-accent" />
                                        </div>
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/40 mb-3 leading-none">
                                                Final Assessment
                                            </div>
                                            <h4 className="text-3xl font-black uppercase tracking-tight leading-none">Semester {result.semester} Console</h4>
                                            <p className="text-white/50 text-sm font-black tracking-widest uppercase mt-3">Authenticated Result Stream</p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 grid grid-cols-2 lg:grid-cols-3 gap-8 w-full lg:w-auto">
                                        <div className="text-center bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 min-w-[160px]">
                                            <span className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Credits Earned</span>
                                            <span className="text-5xl font-black tracking-tighter">{result.totalCredits}</span>
                                        </div>
                                        <div className="text-center bg-white p-8 rounded-[2rem] shadow-2xl min-w-[160px] transform scale-110 -rotate-2">
                                            <span className="block text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-3">SGPA Metric</span>
                                            <span className="text-6xl font-black text-primary tracking-tighter leading-none">{result.sgpa}</span>
                                        </div>
                                        <div 
                                            className="text-center bg-primary/20 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 min-w-[160px] cursor-pointer group/cgpa relative"
                                            onClick={() => setShowPassedOnlyCgpa(!showPassedOnlyCgpa)}
                                        >
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/cgpa:opacity-100 transition-opacity whitespace-nowrap bg-white text-primary text-[10px] px-2 py-1 rounded shadow-lg font-bold">
                                                Click to Toggle Mode
                                            </div>
                                            <span className="block text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-3">
                                                {showPassedOnlyCgpa ? "CGPA (Excl. Failures)" : "Global CGPA"}
                                            </span>
                                            <span className="text-5xl font-black text-white tracking-tighter leading-none">
                                                {showPassedOnlyCgpa ? result.student?.cgpaExcludingFailures : result.student?.cgpa}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50 border-b border-slate-100">
                                                <th className="px-12 py-8 whitespace-nowrap">Course Signature</th>
                                                <th className="px-12 py-8 text-center whitespace-nowrap">Unit Weight</th>
                                                <th className="px-12 py-8 text-center whitespace-nowrap">Achievement</th>
                                                <th className="px-12 py-8 text-right whitespace-nowrap">Validation</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {result.subjects.map((sub, i) => (
                                                <tr key={i} className="group hover:bg-slate-50/50 transition-all duration-500">
                                                    <td className="px-12 py-8 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-lg font-black text-slate-800 group-hover:text-primary transition-colors">{sub.subjectName}</span>
                                                            <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-2">{sub.subjectCode}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-8 text-center whitespace-nowrap">
                                                        <span className="text-sm font-black text-slate-400 group-hover:text-slate-800 transition-colors uppercase tracking-widest">{sub.credits} Units</span>
                                                    </td>
                                                     <td className="px-12 py-8 text-center whitespace-nowrap">
                                                        <div className="flex flex-col items-center">
                                                            <div className={clsx(
                                                                "h-12 w-12 rounded-xl flex items-center justify-center text-xl font-black transition-all shadow-sm",
                                                                sub.grade === 'U' ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-50 text-slate-800 group-hover:bg-primary group-hover:text-white"
                                                            )}>
                                                                {sub.grade}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Pt: {sub.gradePoint}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-8 text-right whitespace-nowrap">
                                                        <span className={clsx(
                                                            "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-inset",
                                                            sub.status === 'Pass' ? "bg-green-50 text-green-700 ring-green-100" : "bg-red-50 text-red-700 ring-red-100"
                                                        )}>
                                                            {sub.status === 'Pass' ? 'Authenticated' : 'Unconfirmed'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="px-12 py-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                                    <span>Institutional Academic Stream System</span>
                                    <div className="flex gap-4">
                                        <Stars className="h-4 w-4" />
                                        <Stars className="h-4 w-4" />
                                        <Stars className="h-4 w-4 text-accent" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Internal Reports Grid */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {result.internals.map((internal, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden flex flex-col h-full">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-10 -mt-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="flex justify-between items-start mb-6 shrink-0 relative z-10">
                                            <div className="h-14 w-14 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-2xl font-bold text-slate-800 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-sm">
                                                {internal.grade}
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200">{internal.subjectCode}</span>
                                            </div>
                                        </div>

                                        <h5 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2 mb-6 flex-1 group-hover:text-indigo-700 transition-colors relative z-10">{internal.subjectName}</h5>

                                        <div className="space-y-4 pt-6 border-t border-slate-100 shrink-0 relative z-10">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Score</span>
                                                    <span className="text-3xl font-extrabold text-slate-900">
                                                        {internal.marks} <span className="text-sm text-slate-400 font-bold ml-0.5">/ {internal.maxMarks}</span>
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Performance</span>
                                                    <span className="text-sm font-bold text-indigo-600 px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-100 inline-block">
                                                        {((internal.marks / internal.maxMarks) * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
                                                    style={{ width: `${(internal.marks / internal.maxMarks) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
