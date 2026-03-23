import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { User, Phone, Mail, MapPin, Activity, Calendar, Camera, Save, Loader2, Trash2 } from 'lucide-react';
import StudentAttendance from './StudentAttendance';
import ImageCropper from '../../../components/ImageCropper';

const StudentProfile = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Photo Upload State
    const [imageSrc, setImageSrc] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    // Editable Fields
    const [editableData, setEditableData] = useState({
        bloodGroup: '',
        address: '',
        whatsappNumber: '',
        dob: '',
        profilePhoto: ''
    });

    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // We need to fetch the specific student profile linked to this user
                const meRes = await api.get('/auth/me');
                if (meRes.data.profile) {
                    setProfile(meRes.data.profile);
                    setEditableData({
                        bloodGroup: meRes.data.profile.bloodGroup || '',
                        address: meRes.data.profile.address || '',
                        whatsappNumber: meRes.data.profile.whatsappNumber || '',
                        dob: meRes.data.profile.dob ? new Date(meRes.data.profile.dob).toISOString().split('T')[0] : '',
                        profilePhoto: meRes.data.profile.profilePhotoUrl || meRes.data.profile.profilePhoto || ''
                    });
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setEditableData({ ...editableData, [e.target.name]: e.target.value });
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result);
                setShowCropper(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob) => {
        setShowCropper(false);
        setSaving(true);
        setMessage(null);

        const formData = new FormData();
        // Create a file from blob
        const file = new File([croppedBlob], "profile_photo.jpg", { type: "image/jpeg" });
        formData.append('photo', file);

        try {
            const { data } = await api.put('/students/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (data.success) {
                const newUrl = data.profilePhotoUrl;
                // Update local state
                setEditableData(prev => ({ ...prev, profilePhoto: newUrl }));
                // Update Global Context (if it stores photoUrl)
                if (updateUser) updateUser({ profilePhotoUrl: newUrl });

                setMessage({ type: 'success', text: 'Photo updated successfully!' });
            }
        } catch (error) {
            console.error("Upload failed", error);
            setMessage({ type: 'error', text: 'Failed to upload photo.' });
        } finally {
            setSaving(false);
            setImageSrc(null); // Cleanup
        }
    };

    const handleRemovePhoto = async () => {
        if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
        setSaving(true);
        try {
            const { data } = await api.delete('/students/profile/photo');
            if (data.success) {
                setEditableData(prev => ({ ...prev, profilePhoto: '' }));
                if (updateUser) updateUser({ profilePhotoUrl: '' });
                setMessage({ type: 'success', text: 'Photo removed successfully!' });
            }
        } catch (error) {
            console.error("Remove failed", error);
            setMessage({ type: 'error', text: 'Failed to remove photo.' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelCrop = () => {
        setShowCropper(false);
        setImageSrc(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const { data } = await api.put('/students/profile', editableData);
            setProfile(data); // Update view with returned data
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Profile...</div>;
    if (!profile) return <div className="p-10 text-center">Profile not found. Contact Admin.</div>;

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
            <h2 className="text-3xl font-bold text-primary">Student Profile</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Photo & Static Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 text-center">
                        <div className="relative inline-block group mb-4">
                            <div className="h-32 w-32 rounded-full overflow-hidden mx-auto bg-gray-100 border-4 border-white shadow-sm">
                                {editableData.profilePhoto ? (
                                    <img
                                        src={getMediaUrl(editableData.profilePhoto)}
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-full w-full p-6 text-gray-300" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-secondary transition-colors shadow-sm">
                                <Camera className="h-4 w-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                            </label>
                        </div>

                        {editableData.profilePhoto && (
                            <button
                                onClick={handleRemovePhoto}
                                className="text-xs text-red-500 hover:text-red-700 flex items-center justify-center mx-auto space-x-1"
                            >
                                <Trash2 className="h-3 w-3" />
                                <span>Remove Photo</span>
                            </button>
                        )}
                        {/* ... */}

                        {/* Add Cropper Modal */}
                        {showCropper && (
                            <ImageCropper
                                imageSrc={imageSrc}
                                onCancel={handleCancelCrop}
                                onCropComplete={handleCropComplete}
                            />
                        )}

                        <h3 className="mt-4 text-xl font-bold text-gray-800">{user.name}</h3>
                        <p className="text-gray-500">{profile.registerNumber}</p>
                        <div className="mt-2 inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                            {profile.department}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                        <h4 className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-4">Academic Details</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-600">Roll Number</span>
                                <span className="font-medium text-gray-900">{profile.rollNumber || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-600">Batch</span>
                                <span className="font-medium text-gray-900">{profile.batch}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-600">Section</span>
                                <span className="font-medium text-emerald-600">{profile.section?.name || 'Not Assigned'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-600">Email (Official)</span>
                                <span className="font-medium text-gray-900 truncate max-w-[150px]" title={user.email}>{user.email}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center">
                            * These details can only be updated by Admin
                        </p>
                    </div>
                </div>

                {/* Right Column: Editable Details */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">Personal Information</h3>
                            <p className="text-sm text-gray-500">Update your personal contact details here.</p>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 px-1">
                                    <Activity className="inline w-4 h-4 mr-1 text-gray-400" /> Blood Group
                                </label>
                                <select
                                    name="bloodGroup"
                                    value={editableData.bloodGroup}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <option value="">Select</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 px-1">
                                    <Calendar className="inline w-4 h-4 mr-1 text-gray-400" /> Date of Birth
                                </label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={editableData.dob}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 px-1">
                                    <Phone className="inline w-4 h-4 mr-1 text-gray-400" /> WhatsApp Number
                                </label>
                                <input
                                    type="text"
                                    name="whatsappNumber"
                                    value={editableData.whatsappNumber}
                                    onChange={handleChange}
                                    placeholder="+1 234 567 890"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 px-1">
                                    <Mail className="inline w-4 h-4 mr-1 text-gray-400" /> Personal Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editableData.email || ''} // Handle override if exists
                                    onChange={handleChange}
                                    placeholder="personal@gmail.com"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 px-1">
                                    <MapPin className="inline w-4 h-4 mr-1 text-gray-400" /> Address
                                </label>
                                <textarea
                                    name="address"
                                    rows="3"
                                    value={editableData.address}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="Enter your full permanent address"
                                ></textarea>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            {message && (
                                <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {message.text}
                                </span>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="ml-auto bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary transition-colors flex items-center disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                Update Profile
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <StudentAttendance />
        </div>
    );
};

export default StudentProfile;
