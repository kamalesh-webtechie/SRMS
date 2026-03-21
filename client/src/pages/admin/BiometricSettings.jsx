import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { startRegistration } from '@simplewebauthn/browser';
import { ShieldCheck, Fingerprint, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const BiometricSettings = () => {
    const { getWebAuthnRegisterOptions, verifyWebAuthnRegistration, user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [prefLoading, setPrefLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

    useEffect(() => {
        if (user?.securityPreferences) {
            setIsBiometricEnabled(user.securityPreferences.biometricEnabled || false);
        }
    }, [user]);

    const handleTogglePreference = async () => {
        setPrefLoading(true);
        try {
            const newPrefs = {
                ...user.securityPreferences,
                biometricEnabled: !isBiometricEnabled
            };
            await updateUser({ securityPreferences: newPrefs });
            setIsBiometricEnabled(!isBiometricEnabled);
            setSuccess(`Biometric login ${!isBiometricEnabled ? 'enabled' : 'disabled'} successfully.`);
        } catch (err) {
            setError('Failed to update biometric preference.');
        } finally {
            setPrefLoading(false);
        }
    };

    const handleRegisterDevice = async () => {
        console.log('Biometric registration started...');
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            console.log('Fetching registration options...');
            const options = await getWebAuthnRegisterOptions();
            console.log('Options received:', options);

            // 2. Start biometric registration in browser
            const registrationResponse = await startRegistration({
                optionsJSON: options,
            });

            // 3. Verify registration with server
            const verification = await verifyWebAuthnRegistration(registrationResponse);

            if (verification.verified) {
                setSuccess('Device registered successfully! You can now log in with biometrics.');
            } else {
                setError('Verification failed. Please try again.');
            }
        } catch (err) {
            console.error(err);
            if (err.name === 'NotAllowedError') {
                setError('Registration canceled or timed out.');
            } else {
                setError(err.response?.data?.message || 'Biometric registration failed. Your browser or device might not support WebAuthn.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                            <Fingerprint className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Biometric Login</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Enable fingerprint or face recognition for faster access</p>
                        </div>
                    </div>

                    <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">Enable Biometric Login</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400">If on, you can log in using this device's security features.</p>
                            </div>
                            <button
                                onClick={handleTogglePreference}
                                disabled={prefLoading}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isBiometricEnabled ? 'bg-red-500' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBiometricEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        {!user?.webAuthnCredentials?.length && isBiometricEnabled && (
                            <p className="mt-3 text-xs text-amber-600 font-medium flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                You need to link a device below before this can be used.
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800 flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">{success}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Secure & Privacy Focused</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                                We never store your biometric data (fingerprints or face scans). WebAuthn uses public-key cryptography to verify your identity locally on your device.
                            </p>
                        </div>

                        <button
                            onClick={handleRegisterDevice}
                            disabled={loading}
                            className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin h-5 w-5 mr-3" />
                                    Communicating with device...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="h-5 w-5 mr-3" />
                                    Link This Device
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BiometricSettings;
