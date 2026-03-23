import { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import api from '../services/api';
import { getActiveBatches, YEARS } from '../utils/academicUtils';
import { useAuth } from '../context/AuthContext';

const AddStudentModal = ({ isOpen, onClose, onStudentAdded, editingStudent }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        registerNumber: '',
        rollNumber: '',
        department: '', // Storing Name/Code as per existing schema
        departmentId: '', // Helper for fetching sections
        semester: 1, // Will be derived from section
        sectionId: '',
        batch: import.meta.env.MODE === 'development' ? '2023-2027' : '',
        currentYear: 'I',
        gender: 'Male',
        dob: '',
        contactNumber: '',
        whatsappNumber: '',
        address: '',
        bloodGroup: '',
        guardianName: '',
        guardianContact: ''
    });

    useEffect(() => {
        if (editingStudent) {
            setFormData({
                name: editingStudent.user.name || '',
                email: editingStudent.user.email || '',
                registerNumber: editingStudent.registerNumber || '',
                rollNumber: editingStudent.rollNumber || '',
                department: editingStudent.department || '',
                departmentId: editingStudent.departmentId || '', 
                semester: editingStudent.semester || 1,
                sectionId: editingStudent.sectionId || '',
                batch: editingStudent.batch || '',
                currentYear: editingStudent.currentYear || 'I',
                gender: editingStudent.gender || 'Male',
                dob: editingStudent.dob ? new Date(editingStudent.dob).toISOString().split('T')[0] : '',
                contactNumber: editingStudent.contactNumber || '',
                whatsappNumber: editingStudent.whatsappNumber || '',
                address: editingStudent.address || '',
                bloodGroup: editingStudent.bloodGroup || '',
                guardianName: editingStudent.guardianName || '',
                guardianContact: editingStudent.guardianContact || ''
            });
            setProfilePhoto(null); // Reset file input on edit open
        } else {
            setFormData({
                name: '', email: '', registerNumber: '', rollNumber: '',
                department: '', departmentId: '', semester: 1, sectionId: '',
                batch: import.meta.env.MODE === 'development' ? '2023-2027' : '',
                currentYear: 'I',
                gender: 'Male',
                dob: '', contactNumber: '',
                whatsappNumber: '', address: '', bloodGroup: '',
                guardianName: '', guardianContact: ''
            });

            // If HOD, pre-set department
            if (user && user.role === 'hod' && user.departmentId) {
                // We'll need to wait for departments list to get the name if we only have ID
                // But the next useEffect handles syncing ID -> Name
                setFormData(prev => ({ ...prev, departmentId: user.departmentId }));
            }
            setProfilePhoto(null);
        }
        setError('');
    }, [editingStudent, isOpen, user]);

    // Match department ID and fetch sections
    useEffect(() => {
        if (formData.department && departments.length > 0 && !formData.departmentId) {
            const dept = departments.find(d => d.name === formData.department);
            if (dept) {
                setFormData(prev => ({ ...prev, departmentId: dept._id }));
            }
        }
    }, [departments, formData.department]);

    // Fetch sections when deptId changes (Removed semester dependency)
    useEffect(() => {
        const fetchSections = async () => {
            if (formData.departmentId) {
                try {
                    // Fetch all sections for the department
                    const { data } = await api.get(`/sections/by-department/${formData.departmentId}`);
                    setSections(data);
                } catch (e) {
                    console.error("Failed to fetch sections", e);
                    setSections([]);
                }
            } else {
                setSections([]);
            }
        };
        fetchSections();
    }, [formData.departmentId]);

    // Fetch Departments for dropdown
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const { data } = await api.get('/departments');
                setDepartments(data);
            } catch (error) {
                console.error("Failed to fetch departments", error);
            }
        };
        if (isOpen) {
            fetchDepartments();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'departmentId') {
            const dept = departments.find(d => d._id === value);
            setFormData(prev => ({
                ...prev,
                departmentId: value,
                department: dept ? dept.name : '',
                sectionId: '', // Reset
                semester: 1 // Default
            }));
        } else if (name === 'sectionId') {
            const sec = sections.find(s => s._id === value);
            setFormData(prev => ({
                ...prev,
                sectionId: value,
                semester: sec ? sec.semester : prev.semester, // Auto-populate semester
                batch: sec ? sec.batch : prev.batch // Auto-populate batch
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        setProfilePhoto(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== 'departmentId') {
                    data.append(key, formData[key]);
                }
            });
            if (profilePhoto) {
                data.append('profilePhoto', profilePhoto);
            }

            // Debug log
            // for (let pair of data.entries()) {
            //     console.log(pair[0] + ', ' + pair[1]);
            // }

            if (editingStudent) {
                await api.put(`/students/${editingStudent._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/students', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            onStudentAdded();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || `Failed to ${editingStudent ? 'update' : 'add'} student`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full max-h-[90vh] flex flex-col border border-gray-200">
                    {/* Fixed Header */}
                    <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <h3 className="text-xl font-extrabold text-gray-900">
                            {editingStudent ? 'Edit Student Profile' : 'Register New Student'}
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative text-sm font-semibold pr-10 animate-shake flex items-center gap-3">
                                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse shrink-0"></div>
                                <span className="flex-1">{error}</span>
                                <button
                                    onClick={() => setError('')}
                                    className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        <form id="student-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
                            {/* Personal Information Group */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1 w-8 bg-indigo-600 rounded-full"></div>
                                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Personal Details</h4>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Full Name</label>
                                    <input type="text" name="name" required
                                        className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                        placeholder="e.g. John Doe"
                                        value={formData.name} onChange={handleChange} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Gender</label>
                                        <select name="gender" required
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                            value={formData.gender} onChange={handleChange}>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Transgender">Transgender</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Date of Birth</label>
                                        <input type="date" name="dob" required={!editingStudent}
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                            value={formData.dob} onChange={handleChange} />
                                        <p className="mt-1.5 text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-md inline-block">DOB is used as initial password</p>
                                    </div>
                                </div>
                            </div>

                            {/* Academic Information Group */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1 w-8 bg-emerald-600 rounded-full"></div>
                                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest">Academic Records</h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Register No.</label>
                                        <input type="text" name="registerNumber" required
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-mono text-indigo-600 font-bold"
                                            placeholder="REG123456"
                                            value={formData.registerNumber} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Roll No.</label>
                                        <input type="text" name="rollNumber"
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                            placeholder="optional"
                                            value={formData.rollNumber} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Department</label>
                                        <select name="departmentId" required
                                            disabled={user?.role === 'hod'}
                                            className={`w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium ${user?.role === 'hod' ? 'bg-gray-100 text-gray-500' : 'bg-gray-50/30 text-gray-900'}`}
                                            value={formData.departmentId} onChange={handleChange}>
                                            <option value="">Select Department</option>
                                            {departments.map(d => (
                                                <option key={d._id} value={d._id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Section</label>
                                        <select name="sectionId" required
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900 disabled:opacity-50"
                                            value={formData.sectionId} onChange={handleChange} disabled={!formData.departmentId}>
                                            <option value="">Select Section</option>
                                            {sections.map(s => (
                                                <option key={s._id} value={s._id}>{s.name} ({s.batch})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Batch</label>
                                        <select name="batch" required
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                            value={formData.batch} onChange={handleChange}>
                                            <option value="">Select Batch</option>
                                            {getActiveBatches().map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Current Year</label>
                                        <select name="currentYear" required
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                            value={formData.currentYear} onChange={handleChange}>
                                            {YEARS.map(y => (
                                                <option key={y} value={y}>Year {y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information Group */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1 w-8 bg-amber-600 rounded-full"></div>
                                    <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest">Connect & Contact</h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Email Address</label>
                                        <input type="email" name="email" required
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                            placeholder="student@college.edu"
                                            value={formData.email} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Contact Number</label>
                                        <input type="text" name="contactNumber"
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                            placeholder="Phone number"
                                            value={formData.contactNumber} onChange={handleChange} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">WhatsApp Number</label>
                                        <input type="text" name="whatsappNumber"
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                            placeholder="WhatsApp number"
                                            value={formData.whatsappNumber} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Blood Group</label>
                                        <select name="bloodGroup"
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                            value={formData.bloodGroup} onChange={handleChange}>
                                            <option value="">Select Group</option>
                                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Guardian Information Group */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1 w-8 bg-pink-600 rounded-full"></div>
                                    <h4 className="text-xs font-black text-pink-600 uppercase tracking-widest">Guardian Info</h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Guardian Name</label>
                                        <input type="text" name="guardianName"
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                            value={formData.guardianName} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Guardian Contact</label>
                                        <input type="text" name="guardianContact"
                                            className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                            value={formData.guardianContact} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Address</label>
                                <textarea name="address" rows="2"
                                    className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/30 transition-all font-medium text-gray-900"
                                    placeholder="Permanent address..."
                                    value={formData.address} onChange={handleChange}></textarea>
                            </div>

                            <div className="pt-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 px-1 uppercase tracking-wider">Profile Illustration / Photo</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-indigo-400 transition-colors bg-gray-50/30">
                                    <div className="space-y-1 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="flex text-sm text-gray-600">
                                            <label className="relative cursor-pointer bg-transparent rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                                <span>Upload a file</span>
                                                <input type="file" name="profilePhoto" accept="image/*" className="sr-only" onChange={handleFileChange} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                        {profilePhoto && <p className="text-xs font-bold text-emerald-600 mt-2">Selected: {profilePhoto.name}</p>}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Fixed Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row-reverse gap-3 shrink-0">
                        <button 
                            type="submit" 
                            form="student-form"
                            disabled={loading}
                            className="inline-flex justify-center items-center px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <><Save className="h-5 w-5 mr-2" /> {editingStudent ? 'Update Profile' : 'Register Student'}</>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex justify-center px-6 py-2.5 border border-gray-300 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddStudentModal;
