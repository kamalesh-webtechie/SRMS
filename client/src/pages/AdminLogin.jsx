import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, ArrowLeft, ShieldCheck, Timer, RefreshCw, Fingerprint, Eye, EyeOff } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('login'); // 'login' or 'otp'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const { login, logout, verifyOTP, resendOTP, getWebAuthnLoginOptions, verifyWebAuthnAuthentication } = useAuth();
    const systemContext = useSystem();
    const systemSettings = systemContext?.systemSettings;
    const navigate = useNavigate();

    // Timer logic for OTP resend
    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userData = await login(email, password);

            if (userData.otpRequired) {
                setStep('otp');
                setResendTimer(30); // Start 30s timer
                setLoading(false);
                return;
            }

            // Validate that the user is actually an admin (fallback if OTP wasn't required for some reason)
            if (userData.role !== 'admin') {
                logout();
                setError('Access denied. This portal is for administrators only.');
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

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;

        setLoading(true);
        setError('');
        try {
            await resendOTP(email);
            setResendTimer(30);
            setOtp(''); // Clear current OTP field
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        if (!email) {
            setError('Please enter your email first to use biometric login');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const options = await getWebAuthnLoginOptions(email);

            if (!options.allowCredentials || options.allowCredentials.length === 0) {
                setError('No biometric device registered for this account. Please log in with your password first.');
                setLoading(false);
                return;
            }

            // 2. Start biometric authentication in browser
            const authResponse = await startAuthentication({
                optionsJSON: options,
            });

            // 3. Verify authentication with server
            const verification = await verifyWebAuthnAuthentication(email, authResponse);

            if (verification.token) {
                navigate('/dashboard');
            } else {
                setError('Biometric verification failed.');
            }
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                setError('Biometric login canceled.');
            } else {
                setError(err.response?.data?.message || 'Biometric login failed. Make sure you have registered your device.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userData = await verifyOTP(email, otp);

            if (userData.role !== 'admin') {
                logout();
                setError('Access denied.');
                setLoading(false);
                return;
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 dark:from-slate-950 dark:to-red-950/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
            {/* Back Button */}
            <div className="absolute top-6 left-6">
                <button
                    onClick={() => step === 'otp' ? setStep('login') : navigate('/')}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">{step === 'otp' ? 'Back to Login' : 'Back'}</span>
                </button>
            </div>

            {/* Header with Title */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 transform hover:scale-105 transition-transform duration-200">
                        <ShieldCheck className="h-8 w-8 text-white" />
                    </div>
                </div>
                <h1 className="text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
                    Gradex
                </h1>
                <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
                    Administrator Portal
                </h2>
                <p className="mt-3 text-center text-base text-gray-600 dark:text-slate-400">
                    {step === 'login' ? 'Sign in to manage the system' : 'Verify your identity with OTP'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-red-100 dark:border-slate-700">
                    {step === 'login' ? (
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
                                        className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all duration-200"
                                        placeholder="admin@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 px-1">
                                    Password
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all duration-200 pr-12"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                                        ) : (
                                            <Eye className="h-5 w-5" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign in as Admin'
                                    )}
                                </button>
                            </div>

                            {systemSettings?.securitySettings?.twoFactorSettings?.biometric !== false && (
                                <div key="biometric-section">
                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">Or continue with</span>
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={handleBiometricLogin}
                                            disabled={loading}
                                            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm text-base font-semibold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                                        >
                                            <Fingerprint className="h-5 w-5 mr-2 text-red-500" />
                                            Use Biometrics
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleOtpSubmit}>
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
                                <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 px-1">
                                    One-Time Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        required
                                        className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-[0.5em] font-mono"
                                        placeholder="000000"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 text-center">
                                    An OTP has been sent to your administrator account.
                                </p>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify OTP'
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={loading || resendTimer > 0}
                                    className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {resendTimer > 0 ? (
                                        <>
                                            <Timer className="h-4 w-4" />
                                            Resend OTP in {resendTimer}s
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                            Resend OTP
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
