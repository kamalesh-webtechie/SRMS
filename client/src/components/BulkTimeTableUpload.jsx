import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, ChevronRight, X, Info, HelpCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const BulkTimeTableUpload = ({ onDataUpload, faculties, subjects, onClose, metadata }) => {
    const [file, setFile] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [previewData, setPreviewData] = useState([]);
    const [mapping, setMapping] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Upload, 2: Map Headers, 3: Preview

    const fileInputRef = useRef(null);

    // Schema fields we need to map to
    const targetFields = [
        { key: 'day', label: 'Day (Monday-Sunday)', mandatory: true },
        { key: 'periodNumber', label: 'Period Number', mandatory: true },
        { key: 'startTime', label: 'Start Time (HH:MM)', mandatory: true },
        { key: 'endTime', label: 'End Time (HH:MM)', mandatory: true },
        { key: 'type', label: 'Type (class/break/lunch)', mandatory: false },
        { key: 'subject', label: 'Subject Name/Code', mandatory: false },
        { key: 'faculty', label: 'Faculty Name', mandatory: false }
    ];

    // Synonyms for auto-detection
    const synonyms = {
        day: ['day', 'weekday', 'days'],
        periodNumber: ['period', 'period number', 'period#', 'slot', 'no', 'slno'],
        startTime: ['start', 'start time', 'from', 'begins'],
        endTime: ['end', 'end time', 'to', 'finishes'],
        type: ['type', 'category', 'kind'],
        subject: ['subject', 'subject name', 'course', 'sub', 'subject code'],
        faculty: ['faculty', 'teacher', 'professor', 'staff', 'faculty name', 'instructor']
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = (file) => {
        setIsProcessing(true);
        setError('');
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (json.length < 2) {
                    setError('The file seems empty or missing data rows.');
                    setIsProcessing(false);
                    return;
                }

                const fileHeaders = json[0].map(h => h?.toString().trim());
                setHeaders(fileHeaders);
                setFile(file);
                
                // Auto-detect mapping
                const autoMapping = {};
                fileHeaders.forEach((header, index) => {
                    if (!header) return;
                    const lowerHeader = header.toLowerCase();
                    
                    for (const [field, syns] of Object.entries(synonyms)) {
                        if (syns.some(s => lowerHeader.includes(s) || s === lowerHeader)) {
                            if (!autoMapping[field]) autoMapping[field] = header;
                        }
                    }
                });
                
                setMapping(autoMapping);
                setPreviewData(json.slice(1));
                setStep(2);
            } catch (err) {
                setError('Error reading file: ' + err.message);
            } finally {
                setIsProcessing(false);
            }
        };

        reader.onerror = () => {
            setError('Failed to read file');
            setIsProcessing(false);
        };

        reader.readAsBinaryString(file);
    };

    const handleMappingChange = (field, value) => {
        setMapping(prev => ({ ...prev, [field]: value }));
    };

    const validateAndSubmit = () => {
        // Check mandatory fields
        const missing = targetFields.filter(f => f.mandatory && !mapping[f.key]);
        if (missing.length > 0) {
            setError(`Please map mandatory fields: ${missing.map(m => m.label).join(', ')}`);
            return;
        }

        const facultyMap = {};
        faculties.forEach(f => {
            if (f.user && f.user.name) {
                facultyMap[f.user.name.toLowerCase().trim()] = f.user._id;
            }
        });

        // Process rows
        const processedDays = {};
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        previewData.forEach((row) => {
            const rawData = {};
            headers.forEach((h, i) => { rawData[h] = row[i]; });

            const dayVal = rawData[mapping.day]?.toString().trim();
            if (!dayVal) return;

            // Find best match for day
            const matchedDay = daysOfWeek.find(d => d.toLowerCase() === dayVal.toLowerCase() || d.startsWith(dayVal.substring(0,3)));
            if (!matchedDay) return;

            if (!processedDays[matchedDay]) processedDays[matchedDay] = { day: matchedDay, periods: [] };

            const facultyName = rawData[mapping.faculty]?.toString().trim();
            const facultyId = facultyName ? facultyMap[facultyName.toLowerCase()] : null;

            const period = {
                periodNumber: parseFloat(rawData[mapping.periodNumber]),
                startTime: formatTime(rawData[mapping.startTime]),
                endTime: formatTime(rawData[mapping.endTime]),
                type: rawData[mapping.type]?.toString().toLowerCase() || 'class',
                subject: rawData[mapping.subject]?.toString().trim() || '',
                facultyId: facultyId || facultyName // Keep name if ID not found, backend handles
            };

            processedDays[matchedDay].periods.push(period);
        });

        // Convert to array and sort
        const finalDays = Object.values(processedDays).map(d => ({
            ...d,
            periods: d.periods.sort((a, b) => a.periodNumber - b.periodNumber)
        }));

        onDataUpload(finalDays);
    };

    const formatTime = (time) => {
        if (!time) return '';
        const t = time.toString().trim();
        if (t.includes(':')) {
            const parts = t.split(':');
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
        // Handle numeric time from Excel (fractions of a day)
        if (!isNaN(t) && parseFloat(t) < 1) {
            const totalMinutes = Math.round(parseFloat(t) * 24 * 60);
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        }
        return t;
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Bulk Timetable Import</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {metadata.department} | Batch {metadata.batch} | {metadata.year} Year | {metadata.section} | Sem {metadata.semester}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-start animate-shake">
                        <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* Stepper */}
                <div className="flex items-center justify-center mb-10">
                    {[1, 2].map((s) => (
                        <React.Fragment key={s}>
                            <div className={`flex flex-col items-center relative ${step >= s ? 'text-primary' : 'text-slate-300'}`}>
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                    step === s ? 'border-primary bg-primary text-white shadow-lg' : 
                                    step > s ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white'
                                }`}>
                                    {step > s ? <CheckCircle2 className="h-6 w-6" /> : <span className="font-bold">{s}</span>}
                                </div>
                                <span className="absolute -bottom-6 text-xs font-bold whitespace-nowrap">
                                    {s === 1 ? 'Upload File' : 'Map Headers'}
                                </span>
                            </div>
                            {s < 2 && (
                                <div className={`w-24 h-0.5 mx-4 mt-[-24px] ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step 1: Upload */}
                {step === 1 && (
                    <div className="animate-fade-in py-8">
                        <div 
                            className="border-3 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center hover:border-primary hover:bg-blue-50/30 transition-all group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="h-20 w-20 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                                <Upload className="h-10 w-10" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-700 mb-2">Select Timetable File</h4>
                            <p className="text-slate-500 text-sm mb-6 text-center max-w-xs">
                                Support standard Excel (.xlsx, .xls) and CSV formats.
                            </p>
                            <button className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all active:scale-95">
                                Browse Files
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".xlsx, .xls, .csv"
                                className="hidden"
                            />
                        </div>

                        <div className="mt-8 bg-amber-50 rounded-xl p-4 border border-amber-100">
                            <div className="flex">
                                <Info className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
                                <div>
                                    <h5 className="text-sm font-bold text-amber-800">Pro Tip: Auto-Detection</h5>
                                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                        Use descriptive headers like "Day", "Period", "Start Time", "End Time", "Subject", and "Faculty" in your file. Our system will automatically match them for you!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Mapping */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <div className="bg-slate-50 p-4 rounded-xl mb-6 flex items-center border border-slate-100">
                            <FileText className="h-8 w-8 text-primary mr-4" />
                            <div>
                                <p className="text-sm font-bold text-slate-800">{file?.name}</p>
                                <p className="text-xs text-slate-500">Found {headers.length} headers and {previewData.length} data rows</p>
                            </div>
                            <button 
                                onClick={() => {setStep(1); setFile(null);}} 
                                className="ml-auto text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1 bg-red-50 rounded-lg"
                            >
                                Change File
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center">
                                    <ChevronRight className="h-4 w-4 mr-1 text-primary" />
                                    Map File Headers
                                </h4>
                                <div className="space-y-3">
                                    {targetFields.map(field => (
                                        <div key={field.key} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-primary/50 transition-colors">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="text-xs font-bold text-slate-600">
                                                    {field.label} {field.mandatory && <span className="text-red-500">*</span>}
                                                </label>
                                                {mapping[field.key] ? (
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Bound
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">Not mapped</span>
                                                )}
                                            </div>
                                            <select 
                                                className={`w-full text-sm rounded-lg border-slate-200 focus:ring-primary focus:border-primary py-1.5 ${
                                                    mapping[field.key] ? 'border-emerald-200 bg-emerald-50/20' : ''
                                                }`}
                                                value={mapping[field.key] || ''}
                                                onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                            >
                                                <option value="">-- Don't Map --</option>
                                                {headers.map((h, i) => (
                                                    <option key={i} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center">
                                    <ChevronRight className="h-4 w-4 mr-1 text-primary" />
                                    Preview (First 5 Rows)
                                </h4>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto">
                                    <table className="min-w-full text-[10px]">
                                        <thead className="bg-slate-100 border-b border-slate-200">
                                            <tr>
                                                {headers.slice(0, 4).map((h, i) => (
                                                    <th key={i} className="px-2 py-2 text-left text-slate-500 font-bold max-w-[80px] truncate">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.slice(0, 5).map((row, ri) => (
                                                <tr key={ri} className="border-b border-slate-100 last:border-0">
                                                    {row.slice(0, 4).map((cell, ci) => (
                                                        <td key={ci} className="px-2 py-2 text-slate-600 truncate max-w-[80px]">{cell?.toString()}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex items-start">
                                        <HelpCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                                        <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                                            We'll match <b>Faculty Names</b> and <b>Subject Names</b> found in the file with your system data. If a perfect match isn't found, you can still edit them manually in the next step.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button 
                    onClick={onClose} 
                    className="text-sm font-bold text-slate-500 hover:text-slate-700 px-4 py-2 hover:bg-slate-200 rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <div className="flex space-x-3">
                    {step === 2 && (
                        <button 
                            disabled={isProcessing}
                            onClick={validateAndSubmit}
                            className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all flex items-center disabled:opacity-50"
                        >
                            Import Data < ChevronRight className="ml-2 h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkTimeTableUpload;
