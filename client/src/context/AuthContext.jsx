import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/auth/me');
                    setUser(data.user);
                } catch (error) {
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        if (data.token) {
            localStorage.setItem('token', data.token);
            setUser({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role,
                departmentId: data.departmentId
            });
        }
        return data;
    };

    const verifyOTP = async (email, otp) => {
        const { data } = await api.post('/auth/verify-otp', { email, otp });
        if (data.token) {
            localStorage.setItem('token', data.token);
            setUser({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role,
                departmentId: data.departmentId
            });
        }
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    const resendOTP = async (email) => {
        const { data } = await api.post('/auth/resend-otp', { email });
        return data;
    };

    // WebAuthn Functions
    const getWebAuthnRegisterOptions = async () => {
        const { data } = await api.post('/auth/webauthn/register-options');
        return data;
    };

    const verifyWebAuthnRegistration = async (body) => {
        const { data } = await api.post('/auth/webauthn/verify-registration', body);
        return data;
    };

    const getWebAuthnLoginOptions = async (email) => {
        const { data } = await api.post('/auth/webauthn/login-options', { email });
        return data;
    };

    const verifyWebAuthnAuthentication = async (email, body) => {
        const { data } = await api.post('/auth/webauthn/verify-authentication', { email, body });
        if (data.token) {
            localStorage.setItem('token', data.token);
            setUser({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role
            });
        }
        return data;
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            verifyOTP,
            resendOTP,
            getWebAuthnRegisterOptions,
            verifyWebAuthnRegistration,
            getWebAuthnLoginOptions,
            verifyWebAuthnAuthentication,
            loading,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
