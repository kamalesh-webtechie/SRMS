import { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Save, Upload, Building, Phone, Mail, MapPin, Loader2, Server, Shield, BookOpen, Clock, Award, Cpu, AlertTriangle, Calendar, Eye, EyeOff } from 'lucide-react';

const SystemSettings = () => {
    const { systemSettings, updateSystemSettings } = useSystem();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('college');
    const [showApiKey, setShowApiKey] = useState(false);

    // Local state for form data, initialized when settings load
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (systemSettings) {
            // Deep copy to allow editing without affecting context immediately
            setFormData(JSON.parse(JSON.stringify(systemSettings)));
        }
    }, [systemSettings]);

    const handleNestedChange = (section, field, value) => {
        setFormData(prev => {
            const sectionData = prev[section] || {};
            return {
                ...prev,
                [section]: {
                    ...sectionData,
                    [field]: value
                }
            };
        });
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleNestedChange('collegeProfile', 'logoUrl', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (section) => {
        setLoading(true);
        setMessage(null);

        // Prepare payload - we can send just the section or the whole thing.
        // Controller handles merges. Sending specific section object is cleaner.
        const payload = {};
        payload[section] = formData[section];

        const result = await updateSystemSettings(payload);

        if (result.success) {
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: result.error || 'Update failed' });
        }
        setLoading(false);
    };

    const tabs = [
        { id: 'college', label: 'College Profile', icon: Building },
        { id: 'academic', label: 'Academic', icon: BookOpen },
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'marks', label: 'Marks & Exams', icon: Award },
        { id: 'grading', label: 'Grading', icon: Server },
        { id: 'ai', label: 'AI Config', icon: Cpu },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'timetable', label: 'Timetable', icon: Calendar },
        { id: 'flags', label: 'System Flags', icon: AlertTriangle },
    ];

    if (loading && !formData.collegeProfile) {
        return (
            <div className="max-w-6xl mx-auto p-10 text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
                <p className="text-gray-500">Loading System Configuration...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-primary">System Configuration</h2>
                    <p className="text-gray-500">Manage institution policies and settings.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                        <nav className="flex flex-col">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-6 py-4 text-sm font-medium transition-colors border-l-4 text-left ${activeTab === tab.id
                                        ? 'bg-blue-50 text-primary border-primary'
                                        : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <tab.icon className={`h-5 w-5 mr-3 ${activeTab === tab.id ? 'text-primary' : 'text-gray-400'}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg shadow-sm border flex items-center animate-slide-up ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                            <span className="font-medium mr-2">
                                {message.type === 'success' ? 'Success:' : 'Error:'}
                            </span>
                            {message.text}
                        </div>
                    )}

                    {/* College Profile */}
                    {activeTab === 'college' && (
                        <SectionCard title="College Profile" description="Institution identity and contact info" onSave={() => handleSave('collegeProfile')} loading={loading}>
                            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mb-6">
                                <div className="relative group">
                                    <div className="h-32 w-32 rounded-full overflow-hidden bg-white shadow-md flex items-center justify-center">
                                        {formData.collegeProfile?.logoUrl ? (
                                            <img src={formData.collegeProfile.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                                        ) : (
                                            <Building className="h-12 w-12 text-gray-300" />
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-secondary transition-colors shadow-sm transform translate-x-1/4 translate-y-1/4">
                                        <Upload className="h-4 w-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </label>
                                </div>
                                <p className="mt-3 text-sm text-gray-500">Upload College Logo</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="College Name" value={formData.collegeProfile?.collegeName} onChange={(v) => handleNestedChange('collegeProfile', 'collegeName', v)} icon={Building} />
                                <Input label="Short Name" value={formData.collegeProfile?.shortName} onChange={(v) => handleNestedChange('collegeProfile', 'shortName', v)} />
                                <Input label="Contact Email" type="email" value={formData.collegeProfile?.contactEmail} onChange={(v) => handleNestedChange('collegeProfile', 'contactEmail', v)} icon={Mail} />
                                <Input label="Contact Phone" value={formData.collegeProfile?.contactPhone} onChange={(v) => handleNestedChange('collegeProfile', 'contactPhone', v)} icon={Phone} />
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        rows="3"
                                        value={formData.collegeProfile?.address || ''}
                                        onChange={(e) => handleNestedChange('collegeProfile', 'address', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none"
                                    ></textarea>
                                </div>
                                <Input label="Website" value={formData.collegeProfile?.website} onChange={(v) => handleNestedChange('collegeProfile', 'website', v)} />
                            </div>
                        </SectionCard>
                    )}

                    {/* Academic Settings */}
                    {activeTab === 'academic' && (
                        <SectionCard title="Academic Configuration" description="Manage years and structure" onSave={() => handleSave('academicSettings')} loading={loading}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Select label="Current Academic Year" value={formData.academicSettings?.currentAcademicYear}
                                    options={formData.academicSettings?.supportedAcademicYears?.map(y => ({ label: y, value: y })) || []}
                                    onChange={(v) => handleNestedChange('academicSettings', 'currentAcademicYear', v)}
                                />
                                <Input label="Semesters Per Year" type="number" value={formData.academicSettings?.semestersPerYear} onChange={(v) => handleNestedChange('academicSettings', 'semestersPerYear', parseInt(v))} />
                                <Input label="Total Program Years" type="number" value={formData.academicSettings?.totalYears} onChange={(v) => handleNestedChange('academicSettings', 'totalYears', parseInt(v))} />
                                <Toggle label="Allow Multi-Section Per Year" checked={formData.academicSettings?.allowMultiSectionPerYear} onChange={(v) => handleNestedChange('academicSettings', 'allowMultiSectionPerYear', v)} />

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Supported Academic Years (Comma separated)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none"
                                        value={formData.academicSettings?.supportedAcademicYears?.join(', ') || ''}
                                        onChange={(e) => handleNestedChange('academicSettings', 'supportedAcademicYears', e.target.value.split(',').map(s => s.trim()))}
                                    />
                                </div>
                            </div>
                        </SectionCard>
                    )}

                    {/* Attendance Settings */}
                    {activeTab === 'attendance' && (
                        <SectionCard title="Attendance Rules" description="Policies for student attendance" onSave={() => handleSave('attendanceSettings')} loading={loading}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Minimum Attendance %" type="number" value={formData.attendanceSettings?.minimumAttendancePercentage} onChange={(v) => handleNestedChange('attendanceSettings', 'minimumAttendancePercentage', parseFloat(v))} />
                                <Select label="Attendance Mode" value={formData.attendanceSettings?.attendanceMode}
                                    options={[{ label: 'Daily', value: 'DAILY' }, { label: 'Period-wise', value: 'PERIOD' }]}
                                    onChange={(v) => handleNestedChange('attendanceSettings', 'attendanceMode', v)}
                                />
                                <Input label="Edit Time Limit (Minutes)" type="number" value={formData.attendanceSettings?.editTimeLimitInMinutes} onChange={(v) => handleNestedChange('attendanceSettings', 'editTimeLimitInMinutes', parseInt(v))} />
                                <Toggle label="Allow Faculty Edit After Submit" checked={formData.attendanceSettings?.allowFacultyEditAfterSubmit} onChange={(v) => handleNestedChange('attendanceSettings', 'allowFacultyEditAfterSubmit', v)} />
                                <Toggle label="Require Reason for Absents" checked={formData.attendanceSettings?.requireReasonForAbsentEdit} onChange={(v) => handleNestedChange('attendanceSettings', 'requireReasonForAbsentEdit', v)} />
                            </div>
                        </SectionCard>
                    )}

                    {/* Marks Settings */}
                    {activeTab === 'marks' && (
                        <SectionCard title="Marks & Exams" description="Evaluation configuration" onSave={() => handleSave('marksSettings')} loading={loading}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Internal Max Marks" type="number" value={formData.marksSettings?.internalMaxMarks} onChange={(v) => handleNestedChange('marksSettings', 'internalMaxMarks', parseInt(v))} />
                                <Input label="External Max Marks" type="number" value={formData.marksSettings?.externalMaxMarks} onChange={(v) => handleNestedChange('marksSettings', 'externalMaxMarks', parseInt(v))} />
                                <Input label="Marks Edit Deadline (Days)" type="number" value={formData.marksSettings?.marksEditDeadlineDays} onChange={(v) => handleNestedChange('marksSettings', 'marksEditDeadlineDays', parseInt(v))} />
                                <Select label="Rounding Rule" value={formData.marksSettings?.roundingRule}
                                    options={['NONE', 'NEAREST', 'FLOOR', 'CEIL'].map(v => ({ label: v, value: v }))}
                                    onChange={(v) => handleNestedChange('marksSettings', 'roundingRule', v)}
                                />
                                <Toggle label="Allow Marks Re-Entry" checked={formData.marksSettings?.allowReEntryOfMarks} onChange={(v) => handleNestedChange('marksSettings', 'allowReEntryOfMarks', v)} />
                            </div>
                        </SectionCard>
                    )}

                    {/* Grading Settings */}
                    {activeTab === 'grading' && (
                        <SectionCard title="Grading Rules" description="CGPA and percentage Logic" onSave={() => handleSave('gradingSettings')} loading={loading}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <Select label="Grading Type" value={formData.gradingSettings?.gradingType}
                                    options={['PERCENTAGE', 'CGPA'].map(v => ({ label: v, value: v }))}
                                    onChange={(v) => handleNestedChange('gradingSettings', 'gradingType', v)}
                                />
                                <Input label="Pass Percentage" type="number" value={formData.gradingSettings?.passPercentage} onChange={(v) => handleNestedChange('gradingSettings', 'passPercentage', parseFloat(v))} />
                            </div>

                            <h4 className="font-semibold mb-2 text-gray-700">Grade Scale</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Min %</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Max %</th>
                                                <th className="px-4 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {formData.gradingSettings?.gradeScale?.map((grade, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2"><input className="w-full border-none focus:ring-0 text-sm" value={grade.grade} onChange={(e) => {
                                                        const newScale = [...formData.gradingSettings.gradeScale];
                                                        newScale[idx].grade = e.target.value;
                                                        handleNestedChange('gradingSettings', 'gradeScale', newScale);
                                                    }} /></td>
                                                    <td className="px-4 py-2"><input type="number" className="w-full border-none focus:ring-0 text-sm" value={grade.min} onChange={(e) => {
                                                        const newScale = [...formData.gradingSettings.gradeScale];
                                                        newScale[idx].min = parseFloat(e.target.value);
                                                        handleNestedChange('gradingSettings', 'gradeScale', newScale);
                                                    }} /></td>
                                                    <td className="px-4 py-2"><input type="number" className="w-full border-none focus:ring-0 text-sm" value={grade.max} onChange={(e) => {
                                                        const newScale = [...formData.gradingSettings.gradeScale];
                                                        newScale[idx].max = parseFloat(e.target.value);
                                                        handleNestedChange('gradingSettings', 'gradeScale', newScale);
                                                    }} /></td>
                                                    <td className="px-4 py-2 text-right">
                                                        <button onClick={() => {
                                                            const newScale = formData.gradingSettings.gradeScale.filter((_, i) => i !== idx);
                                                            handleNestedChange('gradingSettings', 'gradeScale', newScale);
                                                        }} className="text-red-500 hover:text-red-700 text-xs text-center px-2">X</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button onClick={() => {
                                    handleNestedChange('gradingSettings', 'gradeScale', [...(formData.gradingSettings?.gradeScale || []), { grade: 'A', min: 0, max: 0 }]);
                                }} className="w-full py-2 bg-gray-50 text-sm font-medium text-primary hover:bg-gray-100 border-t">+ Add Grade Row</button>
                            </div>
                        </SectionCard>
                    )}

                    {/* AI Settings */}
                    {activeTab === 'ai' && (
                        <SectionCard title="AI Integration" description="Configure generative AI capabilities" onSave={() => handleSave('aiSettings')} loading={loading}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Select label="AI Provider" value={formData.aiSettings?.provider}
                                    options={[{ label: 'Simulation (Free)', value: 'simulation' }, { label: 'OpenAI (GPT-4)', value: 'openai' }, { label: 'Google Gemini', value: 'gemini' }]}
                                    onChange={(v) => handleNestedChange('aiSettings', 'provider', v)}
                                />
                                <div className="relative">
                                    <Input 
                                        type={showApiKey ? 'text' : 'password'} 
                                        label="API Key" 
                                        value={formData.aiSettings?.apiKey || ''} 
                                        placeholder="Enter your API Key" 
                                        onChange={(v) => handleNestedChange('aiSettings', 'apiKey', v)} 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-3 top-9 text-gray-400 hover:text-primary transition-colors"
                                    >
                                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Toggle label="Enable AI Features" checked={formData.aiSettings?.enabled} onChange={(v) => handleNestedChange('aiSettings', 'enabled', v)} />
                            </div>
                        </SectionCard>
                    )}

                    {/* Security */}
                    {activeTab === 'security' && (
                        <SectionCard title="Security Rules" description="Access control and sessions" onSave={() => handleSave('securitySettings')} loading={loading}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Session Timeout (Minutes)" type="number" value={formData.securitySettings?.sessionTimeoutMinutes} onChange={(v) => handleNestedChange('securitySettings', 'sessionTimeoutMinutes', parseInt(v))} />
                                <Input label="Min Password Length" type="number" value={formData.securitySettings?.passwordMinLength} onChange={(v) => handleNestedChange('securitySettings', 'passwordMinLength', parseInt(v))} />
                                <Input label="Max Login Attempts" type="number" value={formData.securitySettings?.maxLoginAttempts} onChange={(v) => handleNestedChange('securitySettings', 'maxLoginAttempts', parseInt(v))} />
                                <Toggle label="Require Strong Passwords" checked={formData.securitySettings?.requireStrongPassword} onChange={(v) => handleNestedChange('securitySettings', 'requireStrongPassword', v)} />
                            </div>

                            <div className="mt-8">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <Shield className="h-5 w-5 mr-2 text-primary" />
                                    Login Methods (2FA)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Toggle
                                        label="Email OTP Authentication"
                                        checked={formData.securitySettings?.twoFactorSettings?.emailOtp}
                                        onChange={(v) => {
                                            const settings = { ...formData.securitySettings.twoFactorSettings, emailOtp: v };
                                            handleNestedChange('securitySettings', 'twoFactorSettings', settings);
                                        }}
                                    />
                                    <Toggle
                                        label="Phone OTP (SMS)"
                                        checked={formData.securitySettings?.twoFactorSettings?.phoneOtp}
                                        onChange={(v) => {
                                            const settings = { ...formData.securitySettings.twoFactorSettings, phoneOtp: v };
                                            handleNestedChange('securitySettings', 'twoFactorSettings', settings);
                                        }}
                                    />
                                    <Toggle
                                        label="Biometric (Passkeys)"
                                        checked={formData.securitySettings?.twoFactorSettings?.biometric}
                                        onChange={(v) => {
                                            const settings = { ...formData.securitySettings.twoFactorSettings, biometric: v };
                                            handleNestedChange('securitySettings', 'twoFactorSettings', settings);
                                        }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500">Enable or disable authentication factors institution-wide.</p>
                            </div>
                        </SectionCard>
                    )}

                    {/* System Flags */}
                    {activeTab === 'flags' && (
                        <SectionCard title="System Control Flags" description="Global enable/disable switches" onSave={() => handleSave('systemFlags')} loading={loading}>
                            <div className="space-y-4">
                                <Toggle label="Maintenance Mode (Disable All Access)" checked={formData.systemFlags?.maintenanceMode} onChange={(v) => handleNestedChange('systemFlags', 'maintenanceMode', v)} />
                                <Toggle label="Allow Student Login" checked={formData.systemFlags?.allowStudentLogin} onChange={(v) => handleNestedChange('systemFlags', 'allowStudentLogin', v)} />
                                <Toggle label="Allow Faculty Login" checked={formData.systemFlags?.allowFacultyLogin} onChange={(v) => handleNestedChange('systemFlags', 'allowFacultyLogin', v)} />
                            </div>
                        </SectionCard>
                    )}

                    {/* Timetable Settings */}
                    {activeTab === 'timetable' && (
                        <SectionCard title="Timetable Configuration" description="Default schedule settings" onSave={() => handleSave('timetableSettings')} loading={loading}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Default Start Time" type="time" value={formData.timetableSettings?.startTime} onChange={(v) => handleNestedChange('timetableSettings', 'startTime', v)} />
                                <Input label="Period Duration (Minutes)" type="number" value={formData.timetableSettings?.periodDuration} onChange={(v) => handleNestedChange('timetableSettings', 'periodDuration', parseInt(v))} />
                                <Input label="Total Periods per Day" type="number" value={formData.timetableSettings?.totalPeriods} onChange={(v) => handleNestedChange('timetableSettings', 'totalPeriods', parseInt(v))} />
                                <div className="hidden md:block"></div> {/* Spacer */}

                                <div className="border-t border-gray-100 pt-6 md:col-span-2">
                                    <h4 className="font-semibold mb-4 text-gray-700">Lunch Break</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="After Period Number" type="number" value={formData.timetableSettings?.lunchBreak?.afterPeriod}
                                            onChange={(v) => {
                                                const lb = { ...formData.timetableSettings.lunchBreak, afterPeriod: parseInt(v) };
                                                handleNestedChange('timetableSettings', 'lunchBreak', lb);
                                            }}
                                        />
                                        <Input label="Duration (Minutes)" type="number" value={formData.timetableSettings?.lunchBreak?.duration}
                                            onChange={(v) => {
                                                const lb = { ...formData.timetableSettings.lunchBreak, duration: parseInt(v) };
                                                handleNestedChange('timetableSettings', 'lunchBreak', lb);
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6 md:col-span-2">
                                    <h4 className="font-semibold mb-4 text-gray-700">Short Break</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="After Period Number" type="number" value={formData.timetableSettings?.shortBreak?.afterPeriod}
                                            onChange={(v) => {
                                                const sb = { ...formData.timetableSettings.shortBreak, afterPeriod: parseInt(v) };
                                                handleNestedChange('timetableSettings', 'shortBreak', sb);
                                            }}
                                        />
                                        <Input label="Duration (Minutes)" type="number" value={formData.timetableSettings?.shortBreak?.duration}
                                            onChange={(v) => {
                                                const sb = { ...formData.timetableSettings.shortBreak, duration: parseInt(v) };
                                                handleNestedChange('timetableSettings', 'shortBreak', sb);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                    )}

                </div>
            </div>
        </div>
    );
};

// UI Components
const SectionCard = ({ title, description, children, onSave, loading }) => (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-slide-up">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <button onClick={onSave} disabled={loading} className="flex items-center px-5 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary transition disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save
            </button>
        </div>
        <div className="p-8">{children}</div>
    </div>
);

const Input = ({ label, type = 'text', value, onChange, placeholder, icon: Icon }) => (
    <div>
        <label className="block text-sm font-bold text-gray-700 mb-2 px-1 flex items-center">
            {Icon && <Icon className="h-4 w-4 mr-1 text-gray-400" />} {label}
        </label>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
        />
    </div>
);

const Select = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">{label}</label>
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary focus:outline-none bg-white"
        >
            {options.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);

const Toggle = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer" onClick={() => onChange(!checked)}>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </div>
    </div>
);

export default SystemSettings;
