import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, ArrowLeft, BookOpen } from 'lucide-react';

const FacultyLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userData = await login(email, password);

            // Validate that the user is actually a faculty or HOD member
            if (userData.role !== 'faculty' && userData.role !== 'hod') {
                logout(); // Immediately logout if role doesn't match
                setError('Access denied. This portal is for faculty and HODs only.');
                setLoading(false);
                return;
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-blue-950/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
            {/* Back Button */}
            <div className="absolute top-6 left-6">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Back</span>
                </button>
            </div>

            {/* Header with Title */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform duration-200">
                        <BookOpen className="h-8 w-8 text-white" />
                    </div>
                </div>
                <h1 className="text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
                    Gradex
                </h1>
                <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
                    Faculty & HOD Portal
                </h2>
                <p className="mt-3 text-center text-base text-gray-600 dark:text-slate-400">
                    Sign in to manage courses, grades, and department
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-blue-100 dark:border-slate-700">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 px-1">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                                    placeholder="faculty@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 px-1">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign in as Faculty / HOD'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FacultyLogin;
