import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SystemContext = createContext();

export const useSystem = () => useContext(SystemContext);

export const SystemProvider = ({ children }) => {
    const [systemSettings, setSystemSettings] = useState({
        collegeName: 'SRMS College',
        collegeAddress: '',
        collegeLogo: '', // URL
        collegeEmail: '',
        collegePhone: ''
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/system');
            if (data) setSystemSettings(data);
        } catch (error) {
            console.error("Failed to load system settings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSystemSettings = async (newSettings) => {
        try {
            const { data } = await api.put('/system', newSettings);
            setSystemSettings(data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Update failed' };
        }
    };

    return (
        <SystemContext.Provider value={{ systemSettings, updateSystemSettings, loading }}>
            {children}
        </SystemContext.Provider>
    );
};
