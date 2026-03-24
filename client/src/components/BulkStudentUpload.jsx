import { useState, useRef, useEffect } from 'react';
import {
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    X,
    Loader2,
    Table as TableIcon,
    Info,
    Bot,
    AlertTriangle,
    Download,
    FileSpreadsheet,
    RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import clsx from 'clsx';
import { getActiveBatches } from '../utils/academicUtils';

const BulkStudentUpload = ({ isOpen, onClose, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [knownDepartments, setKnownDepartments] = useState([]);
    const [validationWarnings, setValidationWarnings] = useState([]);
    const [mapping, setMapping] = useState({});
    const [availableFields, setAvailableFields] = useState([]);
    const [isMappingStage, setIsMappingStage] = useState(false);
    const [rawHeaders, setRawHeaders] = useState([]);
    const [rawRows, setRawRows] = useState([]);
    const [mappingLoading, setMappingLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Auto-dismiss result after 10 seconds
    useEffect(() => {
        if (result) {
            const timer = setTimeout(() => setResult(null), 10000);
            return () => clearTimeout(timer);
        }
    }, [result]);

    useEffect(() => {
        if (isOpen) {
            fetchDepartments();
            // Define standard system fields immediately
            setAvailableFields([
                { key: 'name', label: 'Student Name', required: true },
                { key: 'registerNumber', label: 'Register Number', required: true },
                { key: 'rollNumber', label: 'Roll Number', required: true },
                { key: 'department', label: 'Department', required: true },
                { key: 'section', label: 'Section', required: true },
                { key: 'batch', label: `Batch (e.g. ${getActiveBatches()[0] || '2023-2027'})`, required: true },
                { key: 'dob', label: 'Date of Birth (YYYY-MM-DD)', required: true },
                { key: 'email', label: 'Email Address', required: false },
                { key: 'gender', label: 'Gender (Male/Female/Other)', required: false },
                { key: 'contactNumber', label: 'Contact Number', required: false },
                { key: 'whatsappNumber', label: 'WhatsApp Number', required: false },
                { key: 'bloodGroup', label: 'Blood Group', required: false },
                { key: 'address', label: 'Address', required: false },
                { key: 'guardianName', label: 'Guardian Name', required: false },
                { key: 'guardianContact', label: 'Guardian Contact', required: false }
            ]);
        } else {
            resetState();
        }
    }, [isOpen]);

    const resetState = () => {
        setFile(null);
        setParsedData([]);
        setResult(null);
        setValidationWarnings([]);
        setMapping({});
        setIsMappingStage(false);
        setRawHeaders([]);
        setRawRows([]);
    };

    const fetchDepartments = async () => {
        try {
            const { data } = await api.get('/departments');
            setKnownDepartments(data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const downloadTemplate = (type) => {
        const headers = ['name', 'email', 'registerNumber', 'rollNumber', 'department', 'section', 'batch', 'gender', 'contactNumber', 'whatsappNumber', 'bloodGroup', 'address', 'guardianName', 'guardianContact', 'dob'];
        const sampleBatch = getActiveBatches()[0] || '2023-2027';
        const sampleRow = ['John Doe', 'john@example.com', 'REG2023001', '101', 'Computer Science and Engineering', 'A', sampleBatch, 'Male', '9876543210', '9876543211', 'O+', '123 Street, City', 'Guardian Name', '9876543212', '2005-01-01'];

        if (type === 'csv') {
            const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'student_import_template.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
            XLSX.utils.book_append_sheet(wb, ws, "Students");
            XLSX.writeFile(wb, "student_import_template.xlsx");
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    setResult({ success: false, message: "File is empty or missing headers." });
                    return;
                }

                const fileHeaders = jsonData[0].map(h => String(h).trim());
                const rows = jsonData.slice(1);

                setRawHeaders(fileHeaders);
                setRawRows(rows);

                // Auto-map based on exact or approximate matches (Improved)
                const initialMapping = {};
                fileHeaders.forEach(header => {
                    const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
                    
                    // Priority 1: Exact key or label match
                    const exactMatch = availableFields.find(f => 
                        f.key.toLowerCase() === cleanHeader || 
                        f.label.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanHeader
                    );

                    if (exactMatch) {
                        initialMapping[header] = exactMatch.key;
                        return;
                    }

                    // Priority 2: Partial matches
                    const partialMatch = availableFields.find(f => {
                        const lowerKey = f.key.toLowerCase();
                        const lowerLabel = f.label.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return cleanHeader.includes(lowerKey) || 
                               lowerKey.includes(cleanHeader) || 
                               cleanHeader.includes(lowerLabel.replace('student', '').trim())
                    });

                    if (partialMatch) {
                        initialMapping[header] = partialMatch.key;
                    }
                });

                setMapping(initialMapping);
                setIsMappingStage(true);

            } catch (err) {
                console.error(err);
                setResult({ success: false, message: "Failed to parse file." });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const confirmMapping = () => {
        // Validation: Check for required fields locally first
        const requiredFields = availableFields.filter(f => f.required).map(f => f.key);
        const mappedSystemFields = Object.values(mapping);
        const missingRequired = requiredFields.filter(f => !mappedSystemFields.includes(f));

        if (missingRequired.length > 0) {
            const missingLabels = availableFields.filter(f => missingRequired.includes(f.key)).map(f => f.label);
            setResult({
                success: false,
                message: "Missing required mappings",
                errors: [`Please map: ${missingLabels.join(', ')}`]
            });
            return;
        }

        const dataObjects = rawRows.map(row => {
            if (row.length === 0) return null;
            const obj = {};
            rawHeaders.forEach((header, index) => {
                const mappedKey = mapping[header];
                if (mappedKey && index < row.length) {
                    let value = row[index];
                    // Clean strings
                    if (typeof value === 'string') value = value.trim();
                    obj[mappedKey] = value;
                }
            });
            return obj;
        }).filter(r => r !== null && Object.keys(r).length > 0);

        // Analyze and Clean Data
        const processedData = dataObjects.map(d => ({
            ...d,
            registerNumber: d.registerNumber ? String(d.registerNumber) : '',
            contactNumber: d.contactNumber ? String(d.contactNumber) : '',
            rollNumber: d.rollNumber ? String(d.rollNumber) : '',
        }));

        setParsedData(processedData);
        setIsMappingStage(false);
        setResult(null);

        // Validate Departments
        if (knownDepartments.length > 0) {
            const warnings = [];
            const deptNames = knownDepartments.map(d => d.name.toLowerCase());
            const unknownDepts = new Set();

            processedData.forEach((row, i) => {
                if (row.department) {
                    const trimmedDept = String(row.department).toLowerCase();
                    if (!deptNames.includes(trimmedDept)) {
                        unknownDepts.add(row.department);
                    }
                } else {
                    warnings.push(`Record ${i+1}: Missing Department`);
                }

                if (!row.name) warnings.push(`Record ${i+1}: Missing Student Name`);
                if (!row.registerNumber) warnings.push(`Record ${i+1}: Missing Register Number`);
                if (!row.rollNumber) warnings.push(`Record ${i+1}: Missing Roll Number`);
                if (!row.dob) warnings.push(`Record ${i+1}: Missing Date of Birth`);
                if (!row.section) warnings.push(`Record ${i+1}: Missing Section`);
                if (!row.batch) warnings.push(`Record ${i+1}: Missing Batch`);
            });

            if (unknownDepts.size > 0) {
                warnings.push(`Unknown departments: ${Array.from(unknownDepts).join(', ')}`);
            }

            // Deduplicate warnings
            setValidationWarnings([...new Set(warnings)]);
        }
    };

    const handleUpload = async () => {
        if (validationWarnings.some(w => w.includes("missing"))) {
            if (!window.confirm("There are validation warnings (missing fields). Do you want to proceed? Rows with errors may fail.")) {
                return;
            }
        }

        setLoading(true);
        setResult(null);
        try {
            const { data } = await api.post('/students/bulk', parsedData);

            const createdCount = data.createdCount || 0;
            const errorCount = data.errorCount || 0;
            const hasErrors = errorCount > 0;

            setResult({
                success: !hasErrors && createdCount > 0,
                message: data.message,
                errors: data.errors,
                isPartial: hasErrors && createdCount > 0,
                isTotalFailure: hasErrors && createdCount === 0,
                createdCount,
                errorCount
            });

            if (!hasErrors && createdCount > 0) {
                setTimeout(() => {
                    onUploadSuccess();
                    onClose();
                }, 2000);
            } else if (createdCount > 0) {
                // Refresh list anyway if some were created
                onUploadSuccess();
            }
        } catch (error) {
            setResult({ success: false, message: error.response?.data?.message || 'Upload failed' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const hasCriticalErrors = validationWarnings.some(w => 
        w.toLowerCase().includes("missing student name") || 
        w.toLowerCase().includes("missing register number") || 
        w.toLowerCase().includes("missing roll number") || 
        w.toLowerCase().includes("missing department") ||
        w.toLowerCase().includes("missing section") ||
        w.toLowerCase().includes("missing batch") ||
        w.toLowerCase().includes("missing date of birth")
    );

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Upload className="h-5 w-5 text-indigo-600" />
                        Bulk Student Import
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {!result ? (
                        <div className="space-y-8">
                            {/* Step 1: Upload & Instructions */}
                            {!isMappingStage && parsedData.length === 0 && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Upload Box */}
                                    <div className="flex flex-col">
                                        <div
                                            className={clsx(
                                                "flex-1 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group bg-gray-50/50 hover:bg-indigo-50/50",
                                                file ? "border-indigo-300" : "border-gray-200 hover:border-indigo-400"
                                            )}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-200">
                                                <Upload className="h-8 w-8 text-indigo-600" />
                                            </div>
                                            <p className="text-lg font-semibold text-gray-900 mb-1">
                                                {file ? file.name : "Click to upload file"}
                                            </p>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Drag and drop or browse from computer
                                            </p>
                                            <div className="flex gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                <span>CSV</span>
                                                <span className="w-px h-3 bg-gray-300"></span>
                                                <span>XLSX</span>
                                                <span className="w-px h-3 bg-gray-300"></span>
                                                <span>XLS</span>
                                            </div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept=".csv, .xlsx, .xls"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Instructions */}
                                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col">
                                        <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Info className="h-4 w-4 text-indigo-600" /> Guidelines
                                        </h4>

                                        <div className="space-y-4 flex-1">
                                            <div className="text-sm text-gray-600 space-y-2">
                                                <p>1. Download the template below.</p>
                                                <p>2. Fill in student details. <span className="font-medium text-indigo-600">Department Name</span> must match exactly.</p>
                                                <p>3. Upload the file to verify and map columns.</p>
                                            </div>

                                            <div className="pt-4 border-t border-gray-200">
                                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Download Templates</h5>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => downloadTemplate('excel')}
                                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                                                    >
                                                        <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel Template
                                                    </button>
                                                    <button
                                                        onClick={() => downloadTemplate('csv')}
                                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                                                    >
                                                        <FileText className="h-4 w-4 text-blue-600" /> CSV Template
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Mapping */}
                            {isMappingStage && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 p-4 bg-indigo-50 text-indigo-900 rounded-lg border border-indigo-100">
                                        <Bot className="h-5 w-5 text-indigo-600" />
                                        <div>
                                            <h4 className="font-semibold text-sm">Review Column Mapping</h4>
                                            <p className="text-xs opacity-80">Match your file columns to the system fields. Required fields are marked.</p>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">File Header</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Map To System Field</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Preview (Row 1)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {rawHeaders.map((header, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{header}</td>
                                                        <td className="px-6 py-4">
                                                            <select
                                                                value={mapping[header] || ''}
                                                                onChange={(e) => setMapping({ ...mapping, [header]: e.target.value })}
                                                                className={clsx(
                                                                    "block w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3",
                                                                    !mapping[header] && "text-gray-400"
                                                                )}
                                                            >
                                                                <option value="">Do not import</option>
                                                                {availableFields.map(f => (
                                                                    <option key={f.key} value={f.key} className="text-gray-900">
                                                                        {f.label} {f.required ? '*' : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs block">
                                                            {rawRows[0] ? rawRows[0][idx] : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Validation Review */}
                            {parsedData.length > 0 && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                    {validationWarnings.length > 0 ? (
                                        <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-bold text-orange-800">Validation Issues Found</h4>
                                                <ul className="mt-2 space-y-1 text-sm text-orange-700 list-disc list-inside">
                                                    {validationWarnings.map((warning, i) => (
                                                        <li key={i}>{warning}</li>
                                                    ))}
                                                </ul>
                                                <p className="mt-2 text-xs text-orange-600 font-medium">Please correct these in your file and re-upload, or proceed if minor.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
                                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                            <p className="text-sm font-medium text-green-800">Ready to import {parsedData.length} records. No critical issues found.</p>
                                        </div>
                                    )}

                                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                            <h4 className="text-sm font-bold text-gray-700">Data Preview</h4>
                                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                                {parsedData.length} Records
                                            </span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                                                    <tr>
                                                        <th className="px-6 py-3">Name</th>
                                                        <th className="px-6 py-3">Email</th>
                                                        <th className="px-6 py-3">Reg No</th>
                                                        <th className="px-6 py-3">Department</th>
                                                        <th className="px-6 py-3">Batch</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {parsedData.slice(0, 5).map((row, i) => (
                                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-3 font-medium text-gray-900">{row.name}</td>
                                                            <td className="px-6 py-3 text-gray-500">{row.email}</td>
                                                            <td className="px-6 py-3 text-gray-500">{row.registerNumber}</td>
                                                            <td className="px-6 py-3">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                                                    {row.department}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-gray-500">{row.batch}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {parsedData.length > 5 && (
                                            <div className="bg-gray-50 px-6 py-3 text-xs text-center text-gray-500 font-medium">
                                                + {parsedData.length - 5} more records
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-in zoom-in-95 duration-300">
                            {/* Result Summary Bar */}
                            <div className={clsx(
                                "p-6 rounded-xl flex items-center gap-4 mb-8",
                                result.success ? "bg-green-50 border border-green-100" :
                                    result.isPartial ? "bg-orange-50 border border-orange-100" :
                                        "bg-red-50 border border-red-100"
                            )}>
                                <div className={clsx(
                                    "p-3 rounded-full",
                                    result.success ? "bg-green-100" :
                                        result.isPartial ? "bg-orange-100" :
                                            "bg-red-100"
                                )}>
                                    {result.success ? (
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    ) : result.isPartial ? (
                                        <AlertTriangle className="h-8 w-8 text-orange-600" />
                                    ) : (
                                        <AlertCircle className="h-8 w-8 text-red-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {result.success ? "Import Successful!" :
                                            result.isPartial ? "Partial Success" :
                                                "Import Failed"}
                                    </h3>
                                    <p className={clsx(
                                        "text-sm font-medium",
                                        result.success ? "text-green-700" :
                                            result.isPartial ? "text-orange-700" :
                                                "text-red-700"
                                    )}>
                                        {result.createdCount || 0} students created. {result.errorCount || 0} rows failed.
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Errors Section */}
                            {result.errors && result.errors.length > 0 && (
                                <div className="flex-1 overflow-hidden flex flex-col">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                            <AlertCircle className="h-3 w-3" /> Failed Records Detail
                                        </h4>
                                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                            {result.errors.length} Errors
                                        </span>
                                    </div>
                                    <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 overflow-y-auto p-4 custom-scrollbar">
                                        <ul className="space-y-2.5">
                                            {result.errors.map((err, i) => (
                                                <li key={i} className="flex gap-3 text-sm text-red-700 bg-white p-3 rounded-lg border-l-4 border-red-500 shadow-sm animate-in slide-in-from-left duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                                                    <span className="font-bold shrink-0">#{i + 1}</span>
                                                    <span className="opacity-90 leading-relaxed font-medium">{err}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="mt-4 p-4 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-700 flex gap-2">
                                        <Info className="h-4 w-4 shrink-0" />
                                        <p>
                                            <strong>Tip:</strong> Download the failed rows as a new CSV, fix the errors, and upload again. 
                                            Only students who were not created should be included in the re-upload.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!result.success && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={() => setResult(null)}
                                        className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 shadow-sm text-sm font-bold text-gray-700 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Try Upload Again
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!result?.success && (
                    <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm"
                        >
                            Cancel
                        </button>

                        {isMappingStage ? (
                            <button
                                type="button"
                                onClick={confirmMapping}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Continue to Preview
                            </button>
                        ) : parsedData.length > 0 ? (
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsMappingStage(true); setParsedData([]); setValidationWarnings([]); }}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    Back to Mapping
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={loading || hasCriticalErrors}
                                    className={clsx(
                                        "px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center",
                                        loading || hasCriticalErrors
                                            ? "bg-gray-400 cursor-not-allowed opacity-75"
                                            : "bg-indigo-600 hover:bg-indigo-700"
                                    )}
                                >
                                    {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                                    Confirm Import
                                </button>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BulkStudentUpload;
