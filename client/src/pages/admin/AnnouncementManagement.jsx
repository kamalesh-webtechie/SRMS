import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Megaphone,
    Plus,
    Edit,
    Trash2,
    X,
    Paperclip,
    Calendar,
    Users,
    AlertCircle,
    CheckCircle,
    Loader2,
    Search,
    Filter
} from 'lucide-react';
import clsx from 'clsx';

import { useAuth } from '../../context/AuthContext';

const AnnouncementManagement = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        targetRoles: [],
        priority: 'normal',
        expiresAt: '',
        attachment: null
    });
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (user) {
            fetchAnnouncements();
        }
    }, [user]);

    const fetchAnnouncements = async () => {
        try {
            const { data } = await api.get('/announcements');
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, attachment: e.target.files[0] }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('message', formData.message);
        data.append('priority', formData.priority);
        if (formData.expiresAt) data.append('expiresAt', formData.expiresAt);
        formData.targetRoles.forEach(role => data.append('targetRoles', role));
        if (formData.attachment) data.append('attachment', formData.attachment);

        try {
            if (editingId) {
                await api.put(`/announcements/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setMessage({ type: 'success', text: 'Announcement updated successfully!' });
            } else {
                await api.post('/announcements', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setMessage({ type: 'success', text: 'Announcement created successfully!' });
            }
            fetchAnnouncements();
            resetForm();
        } catch (error) {
            console.error('Error saving announcement:', error);
            const errorMsg = error.response?.data?.message || 'Failed to save announcement.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            try {
                await api.delete(`/announcements/${id}`);
                fetchAnnouncements();
                setMessage({ type: 'success', text: 'Announcement deleted.' });
            } catch (error) {
                console.error('Error deleting announcement:', error);
                setMessage({ type: 'error', text: 'Failed to delete announcement.' });
            }
        }
    };

    const handleEdit = (announcement) => {
        setEditingId(announcement._id);
        setFormData({
            title: announcement.title,
            message: announcement.message,
            targetRoles: announcement.targetRoles,
            priority: announcement.priority,
            expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().split('T')[0] : '',
            attachment: null // File input cannot be pre-populated
        });
        setShowForm(true);
        setMessage(null);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            message: '',
            targetRoles: [],
            priority: 'normal',
            expiresAt: '',
            attachment: null
        });
        setEditingId(null);
        setShowForm(false);
        setMessage(null);
    };

    const handleRoleToggle = (role) => {
        setFormData(prev => ({
            ...prev,
            targetRoles: prev.targetRoles.includes(role)
                ? prev.targetRoles.filter(r => r !== role)
                : [...prev.targetRoles, role]
        }));
    };

    const filteredAnnouncements = announcements.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Announcement Management</h2>
                    <p className="text-gray-500 mt-1">Broadcast updates, news, and alerts to students and faculty.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none shadow-md transition-all duration-200"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Announcement
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all duration-200"
                        placeholder="Search announcements..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {message && !showForm && (
                <div className={clsx(
                    "p-4 rounded-lg text-sm flex items-start gap-3 shadow-sm animate-fade-in",
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                )}>
                    {message.type === 'success' ? <CheckCircle className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                    {message.text}
                </div>
            )}

            {/* Announcements List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Loading announcements...</p>
                    </div>
                ) : filteredAnnouncements.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                        <div className="mx-auto h-12 w-12 text-gray-300">
                            <Megaphone className="h-full w-full" />
                        </div>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements found</h3>
                        <p className="mt-1 text-sm text-gray-500">Create a new announcement to get started.</p>
                    </div>
                ) : (
                    filteredAnnouncements.map(announcement => (
                        <div key={announcement._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-gray-900">{announcement.title}</h3>
                                        {announcement.priority === 'high' && (
                                            <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full border border-red-200">
                                                High Priority
                                            </span>
                                        )}
                                        {announcement.departmentId ? (
                                            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                                                Department Only
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                                                Global
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{announcement.message}</p>

                                    {announcement.attachmentUrl && (
                                        <div className="mt-3">
                                            {announcement.attachmentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                <img
                                                    src={getMediaUrl(announcement.attachmentUrl)}
                                                    alt="Attachment"
                                                    className="max-h-64 rounded-lg border border-gray-200 object-cover"
                                                />
                                            ) : (
                                                <a
                                                    href={getMediaUrl(announcement.attachmentUrl)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                                                >
                                                    <Paperclip className="h-4 w-4" />
                                                    View Attachment
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-2 border-t border-gray-100 mt-4">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium text-gray-700">Target:</span>
                                            <div className="flex gap-1">
                                                {announcement.targetRoles.map(role => (
                                                    <span key={role} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs capitalize font-medium border border-indigo-100">
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span>Posted: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {announcement.expiresAt && (
                                            <div className="flex items-center gap-1.5">
                                                <AlertCircle className="h-4 w-4 text-orange-400" />
                                                <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(announcement)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(announcement._id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={resetForm}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                        {/* Fixed Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingId ? 'Edit Announcement' : 'Create New Announcement'}
                            </h3>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {message && (
                                <div className={clsx(
                                    "mb-6 p-4 rounded-lg text-sm flex items-start gap-3 shadow-sm",
                                    message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                                )}>
                                    {message.type === 'success' ? <CheckCircle className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                                    {message.text}
                                </div>
                            )}

                            <form id="announcement-form" onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white transition-all shadow-sm"
                                        placeholder="e.g. Mid-Term Exam Schedule"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Message *</label>
                                    <textarea
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white transition-all shadow-sm"
                                        rows="5"
                                        placeholder="Detailed announcement text..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">
                                        Target Audience * 
                                        {user?.role === 'hod' && <span className="text-xs font-normal text-indigo-600 ml-2 italic">(Your department only)</span>}
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {['admin', 'hod', 'faculty', 'student'].filter(r => user?.role !== 'hod' || r !== 'admin').map(role => (
                                            <label key={role} className={clsx(
                                                "flex items-center justify-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-all select-none text-center",
                                                formData.targetRoles.includes(role)
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md ring-2 ring-indigo-200"
                                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                                            )}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.targetRoles.includes(role)}
                                                    onChange={() => handleRoleToggle(role)}
                                                    className="hidden"
                                                />
                                                <span className="text-xs font-bold capitalize tracking-wide">{role}s</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Priority</label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white transition-all shadow-sm"
                                        >
                                            <option value="normal">Normal Priority</option>
                                            <option value="high">High Priority</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Expires On (Optional)</label>
                                        <input
                                            type="date"
                                            value={formData.expiresAt}
                                            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Attachment (Image/File)</label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition-colors bg-white">
                                        <div className="space-y-1 text-center">
                                            <Paperclip className="mx-auto h-10 w-10 text-gray-400" />
                                            <div className="flex text-sm text-gray-600">
                                                <label className="relative cursor-pointer bg-white rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                                    <span>Upload a file</span>
                                                    <input type="file" onChange={handleFileChange} className="sr-only" />
                                                </label>
                                                <p className="pl-1 text-gray-500">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                PNG, JPG, PDF, DOCX up to 10MB
                                                {formData.attachment && <span className="block mt-1 text-green-600 font-bold">Selected: {formData.attachment.name}</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Fixed Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0 flex flex-col sm:flex-row gap-3">
                            <button
                                form="announcement-form"
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                                {editingId ? 'Update' : 'Post'} Announcement
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 font-bold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementManagement;
