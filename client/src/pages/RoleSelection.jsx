import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, BookOpen, GraduationCap, Moon, Sun, Globe } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

const TRANSLATIONS = {
    en: {
        title: 'Gradex',
        subtitle: 'Student Result Management System',
        description: 'Secure, accurate, and role-based management of student results and academic performance with AI-assisted insights.',
        selectPortal: 'Select Your Portal',
        chooseRole: 'Choose your role to continue to the login page',
        adminPortal: 'Admin Portal',
        adminDesc: 'Manage system, faculty, students, and results',
        facultyPortal: 'Faculty & HOD Portal',
        facultyDesc: 'Manage courses, grades, attendance, and department',
        studentPortal: 'Student Portal',
        studentDesc: 'View results, attendance, and profile',
        continue: 'Continue',
        footer: "Don't have access? Contact your system administrator"
    },
    ta: {
        title: 'Gradex',
        subtitle: 'மாணவர் தேர்வு முடிவு மேலாண்மை அமைப்பு',
        description: 'AI-உதவியுடன் கூடிய பாதுகாப்பான மற்றும் துல்லியமான மாணவர் தேர்வு முடிவு மேலாண்மை.',
        selectPortal: 'உங்கள் போர்ட்டலைத் தேர்ந்தெடுக்கவும்',
        chooseRole: 'உள்நுழைவு பக்கத்திற்குச் செல்ல உங்கள் பாத்திரத்தைத் தேர்வுசெய்யவும்',
        adminPortal: 'நிர்வாக போர்ட்டல்',
        adminDesc: 'அமைப்பு, ஆசிரியர்கள், மாணவர்கள் மற்றும் முடிவுகளை நிர்வகிக்கவும்',
        facultyPortal: 'ஆசிரியர் / துறைத்தலைவர் போர்ட்டல்',
        facultyDesc: 'பாடங்கள், தரங்கள், வருகைப்பதிவு மற்றும் துறையை நிர்வகிக்கவும்',
        studentPortal: 'மாணவர் போர்ட்டல்',
        studentDesc: 'முடிவுகள், வருகைப்பதிவு மற்றும் சுயவிவரத்தைப் பார்க்கவும்',
        continue: 'தொடரவும்',
        footer: 'அணுகல் இல்லையா? உங்கள் கணினி நிர்வாகியைத் தொடர்பு கொள்ளவும்'
    }
};

const RoleSelection = () => {
    const navigate = useNavigate();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

    // Apply Theme
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Apply Language
    useEffect(() => {
        localStorage.setItem('lang', lang);
    }, [lang]);

    const t = TRANSLATIONS[lang];

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const toggleLang = () => {
        setLang(prev => prev === 'en' ? 'ta' : 'en');
    };

    const roles = [
        {
            type: 'faculty',
            title: t.facultyPortal,
            description: t.facultyDesc,
            icon: BookOpen,
            gradient: 'from-blue-500 to-indigo-600',
            bgGradient: 'from-blue-50 to-indigo-50',
            darkBgGradient: 'dark:from-blue-950/20 dark:to-indigo-950/20',
            iconColor: 'text-blue-600 dark:text-blue-400'
        },
        {
            type: 'student',
            title: t.studentPortal,
            description: t.studentDesc,
            icon: GraduationCap,
            gradient: 'from-green-500 to-emerald-600',
            bgGradient: 'from-green-50 to-emerald-50',
            darkBgGradient: 'dark:from-green-950/20 dark:to-emerald-950/20',
            iconColor: 'text-green-600 dark:text-green-400'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
            {/* Animated Background */}
            <AnimatedBackground />

            {/* Top Header Bar */}
            <div className="w-full max-w-7xl mx-auto mb-8 sm:mb-12 relative z-10">
                <div className="flex items-start justify-between">
                    {/* Left: Title and Description */}
                    <div className="flex-1 pr-4">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
                            {t.title}
                        </h1>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-slate-200 mb-2">
                            {t.subtitle}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                            {t.description}
                        </p>
                    </div>

                    {/* Right: Theme and Language Toggles */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLang}
                            className="p-2.5 sm:p-3 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5"
                            title="Switch Language"
                        >
                            <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-xs font-bold uppercase hidden sm:inline">{lang}</span>
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 sm:p-3 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Toggle Theme"
                        >
                            {theme === 'light' ? <Moon className="h-4 w-4 sm:h-5 sm:w-5" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center relative z-10">
                {/* Portal Selection Header */}
                <div className="text-center mb-8 sm:mb-12 max-w-4xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        {t.selectPortal}
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400">
                        {t.chooseRole}
                    </p>
                </div>

                {/* Role Cards */}
                <div className="w-full max-w-6xl mx-auto">
                    <div className={`grid grid-cols-1 ${roles.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'} gap-6 lg:gap-8`}>
                        {roles.map((role) => {
                            const IconComponent = role.icon;
                            return (
                                <button
                                    key={role.type}
                                    onClick={() => navigate(`/login/${role.type}`)}
                                    className={`relative group bg-gradient-to-br ${role.bgGradient} ${role.darkBgGradient} p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-opacity-50 overflow-hidden`}
                                >
                                    {/* Gradient Overlay on Hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                    {/* Content */}
                                    <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                        {/* Icon */}
                                        <div className={`h-14 w-14 sm:h-16 sm:w-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110`}>
                                            <IconComponent className={`h-7 w-7 sm:h-8 sm:w-8 ${role.iconColor}`} />
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                            {role.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                                            {role.description}
                                        </p>

                                        {/* Continue Button */}
                                        <div className="pt-2">
                                            <div className={`inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r ${role.gradient} text-white text-sm font-semibold shadow-sm group-hover:shadow-md transform group-hover:translate-x-1 transition-all duration-200`}>
                                                {t.continue}
                                                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Note */}
                <div className="mt-8 sm:mt-12 text-center">
                    <p className="text-sm text-gray-500 dark:text-slate-500">
                        {t.footer}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;
