import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    BarChart2,
    BookOpen,
    ShieldCheck,
    Users,
    Moon,
    Sun,
    Globe,
    CheckCircle,
    Code,
    Mail
} from 'lucide-react';

const TRANSLATIONS = {
    en: {
        nav: {
            features: "Features",
            demo: "Demo",
            docs: "Documentation",
            contact: "Contact"
        },
        hero: {
            title: "Gradex",
            titleHighlight: "Student Result Management System",
            subtitle: "Secure, accurate, and role-based management of student results and academic performance with AI-assisted insights.",
            getStarted: "Get Started",
            learnMore: "Sign In"
        },
        features: {
            title: "Gradex System Features",
            desc: "From intuitive attendance tracking to deep performance analytics, SRMS.Ai provides a comprehensive suite of tools for modern education.",
            analytics: "Smart Analytics",
            analyticsDesc: "Visualize student performance with dynamic charts and AI-driven insights to identify trends early.",
            courses: "Course Management",
            coursesDesc: "Effortlessly manage subjects, departments, and curriculum distribution across semesters.",
            attendance: "Attendance Tracking",
            attendanceDesc: "Digital attendance sheets with instant reporting and aggregated statistics for faculty and admins."
        },
        demo: {
            title: "Experience the Future",
            desc: "See how SRMS.Ai transforms the academic experience for every stakeholder.",
            students: "For Students",
            faculty: "For Faculty",
            admin: "For Admins"
        },
        footer: {
            rights: "All rights reserved.",
            privacy: "Privacy Policy",
            terms: "Terms of Service",
            support: "Support"
        }
    },
    ta: {
        nav: {
            features: "அம்சங்கள்",
            demo: "டெமோ",
            docs: "ஆவணங்கள்",
            contact: "தொடர்பு"
        },
        hero: {
            title: "Gradex",
            titleHighlight: "மாணவர் தேர்வு முடிவு மேலாண்மை அமைப்பு",
            subtitle: "AI-உதவியுடன் கூடிய பாதுகாப்பான மற்றும் துல்லியமான மாணவர் தேர்வு முடிவு மேலாண்மை.",
            getStarted: "தொடங்கவும்",
            learnMore: "உள்நுழைய"
        },
        features: {
            title: "கல்வித் துறையை நிர்வகிக்க தேவையான அனைத்தும்",
            desc: "எளிதான வருகைப் பதிவு கண்காணிப்பு முதல் ஆழமான செயல்திறன் பகுப்பாய்வு வரை, SRMS.Ai நவீன கல்விக்கான முழுமையான கருவிகளை வழங்குகிறது.",
            analytics: "ஸ்மார்ட் பகுப்பாய்வு",
            analyticsDesc: "மாணவர் செயல்திறனை மாறும் வரைபடங்கள் மற்றும் AI நுண்ணறிவுகளுடன் காட்சிப்படுத்தி போக்குகளை முன்கூட்டியே கண்டறியவும்.",
            courses: "பாட மேலாண்மை",
            coursesDesc: "பாடங்கள், துறைகள் மற்றும் பாடத்திட்ட விநியோகத்தை பருவங்களுக்கு இடையில் எளிதாக நிர்வகிக்கவும்.",
            attendance: "வருகைப் பதிவு",
            attendanceDesc: "ஆசிரியர்கள் மற்றும் நிர்வாகிகளுக்கான உடனடி அறிக்கைகள் மற்றும் ஒருங்கிணைந்த புள்ளிவிவரங்களுடன் டிஜிட்டல் வருகைப் பதிவு தாள்கள்."
        },
        demo: {
            title: "எதிர்காலத்தை அனுபவிக்கவும்",
            desc: "SRMS.Ai ஒவ்வொரு பங்குதாரருக்கும் கல்வி அனுபவத்தை எவ்வாறு மாற்றுகிறது என்பதைப் பாருங்கள்.",
            students: "மாணவர்களுக்கு",
            faculty: "ஆசிரியர்களுக்கு",
            admin: "நிர்வாகிகளுக்கு"
        },
        footer: {
            rights: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
            privacy: "தனியுரிமைக் கொள்கை",
            terms: "சேவை விதிமுறைகள்",
            support: "ஆதரவு"
        }
    }
};

const LandingPage = () => {
    const navigate = useNavigate();

    // Theme State
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // Language State
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

    // Scroll State for sticky navbar
    const [isScrolled, setIsScrolled] = useState(false);

    // Apply Theme Side Effect
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Apply Language Side Effect
    useEffect(() => {
        localStorage.setItem('lang', lang);
    }, [lang]);

    // Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const t = TRANSLATIONS[lang];

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const toggleLang = () => {
        setLang(prev => prev === 'en' ? 'ta' : 'en');
    };

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-background dark:bg-slate-900 transition-colors duration-300">
            {/* Sticky Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-slate-800' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="h-8 w-8 bg-primary dark:bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <BarChart2 className="text-white h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Gradex</span>
                    </div>

                    {/* Nav Links (Desktop) */}
                    <div className="hidden md:flex items-center space-x-8">
                        {['features', 'demo', 'docs', 'contact'].map((item) => (
                            <button
                                key={item}
                                onClick={() => scrollToSection(item)}
                                className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-colors capitalize"
                            >
                                {t.nav[item]}
                            </button>
                        ))}
                    </div>

                    {/* Actions: Lang, Theme */}
                    <div className="flex items-center space-x-4">
                        {/* Language Toggle */}
                        <div className="relative group">
                            <button
                                onClick={toggleLang}
                                className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2"
                                title="Switch Language"
                            >
                                <Globe className="h-5 w-5" />
                                <span className="text-xs font-bold uppercase">{lang}</span>
                            </button>
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            title="Toggle Theme"
                        >
                            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="px-6 pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 text-center lg:text-left space-y-8 animate-fade-in">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                        {t.hero.title} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 dark:from-blue-400 dark:to-purple-400">
                            {t.hero.titleHighlight}
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0">
                        {t.hero.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <button
                            onClick={() => scrollToSection('features')}
                            className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-gray-900 dark:bg-blue-600 rounded-full hover:bg-gray-800 dark:hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20"
                        >
                            <span>{t.hero.getStarted}</span>
                            <ArrowRight className="h-5 w-5" />
                        </button>
                        {/* Modified: Learn More now opens authentication */}
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-all border border-transparent dark:border-slate-700"
                        >
                            {t.hero.learnMore}
                        </button>
                    </div>

                    <div className="pt-8 flex items-center justify-center lg:justify-start space-x-8 text-gray-400 dark:text-slate-500">
                        <div className="flex items-center space-x-2">
                            <ShieldCheck className="h-5 w-5" />
                            <span className="text-sm font-medium">Secure & Scalable</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Users className="h-5 w-5" />
                            <span className="text-sm font-medium">Multi-Role Access</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full max-w-2xl lg:max-w-none">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 aspect-[4/3] group ring-1 ring-slate-900/5 dark:ring-white/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 mix-blend-multiply dark:mix-blend-overlay" />
                        <img
                            src="/landing-hero.png"
                            alt="Dashboard Preview"
                            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105 opacity-90 dark:opacity-80"
                        />

                        {/* Floating Cards (Mock UI elements) - Dark Mode sensitive */}
                        <div className="absolute top-8 left-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 dark:border-slate-600 animate-float-slow">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                                    <BarChart2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase">Performance</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">+12.5%</div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-8 right-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 dark:border-slate-600 animate-float-delayed">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase">Attendance</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">98.2%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Feature Grid */}
            <section id="features" className="bg-gray-50 dark:bg-slate-950 py-24 px-6 transition-colors duration-300">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t.features.title}</h2>
                        <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">{t.features.desc}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <BarChart2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
                                title: t.features.analytics,
                                description: t.features.analyticsDesc
                            },
                            {
                                icon: <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />,
                                title: t.features.courses,
                                description: t.features.coursesDesc
                            },
                            {
                                icon: <Users className="h-8 w-8 text-green-600 dark:text-green-400" />,
                                title: t.features.attendance,
                                description: t.features.attendanceDesc
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md dark:hover:bg-slate-800/80 transition-all duration-300 group">
                                <div className="h-14 w-14 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Demo/Docs/Contact Sections for scrolling anchors */}
            <section id="demo" className="py-20 px-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t.demo.title}</h2>
                    <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto mb-12">{t.demo.desc}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { role: t.demo.students, path: '/login/student', color: 'text-green-500' },
                            { role: t.demo.faculty, path: '/login/faculty', color: 'text-blue-500' }
                        ].map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => navigate(item.path)}
                                className="p-6 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-solid hover:border-gray-400 dark:hover:bg-slate-800 transition-all group"
                            >
                                <CheckCircle className={`h-10 w-10 ${item.color} mx-auto mb-4 group-hover:scale-110 transition-transform`} />
                                <h4 className="font-bold text-lg dark:text-white">{item.role}</h4>
                                <p className="text-xs text-gray-500 mt-2">Click to enter portal</p>
                            </button>
                        ))}
                        <div className="p-6 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                            <ShieldCheck className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                            <h4 className="font-bold text-lg text-gray-400">{t.demo.admin}</h4>
                        </div>
                    </div>
                </div>
            </section>

            <section id="docs" className="py-20 px-6 bg-gray-50 dark:bg-slate-950">
                <div className="max-w-4xl mx-auto text-center">
                    <Code className="h-12 w-12 text-primary dark:text-blue-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Developer Friendly</h2>
                    <p className="text-gray-600 dark:text-slate-400 mb-8">
                        Built with modern tech stack. Detailed API documentation available across all modules.
                    </p>
                    <button className="px-6 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        View API Docs
                    </button>
                </div>
            </section>

            <section id="contact" className="py-20 px-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto text-center">
                    <Mail className="h-12 w-12 text-accent dark:text-purple-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Get in Touch</h2>
                    <p className="text-gray-600 dark:text-slate-400">admin@srms.edu</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white dark:bg-slate-900 py-12 px-6 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-slate-500">
                    <div className="mb-4 md:mb-0">
                        &copy; 2026 Gradex - {t.footer.rights}
                    </div>
                    <div className="flex space-x-6">
                        <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.privacy}</a>
                        <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.terms}</a>
                        <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">{t.footer.support}</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
