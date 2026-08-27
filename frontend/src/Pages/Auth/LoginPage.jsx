import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    MdPerson,
    MdStore,
    MdAdminPanelSettings,
    MdEmail,
    MdLock,
    MdVisibility,
    MdVisibilityOff,
} from 'react-icons/md';

const roleConfig = {
    user: {
        label: 'User',
        tagline: 'Students, Teachers & Staff',
        icon: <MdPerson className="w-7 h-7" />,
        gradient: 'from-primary-500 to-primary-600',
        borderColor: '#22c55e',
        accentLight: 'rgba(34,197,94,0.08)',
        glowColor: 'rgba(34,197,94,0.3)',
        registerLink: '/register/student',
        registerLabel: 'Create Student Account',
    },
    canteen: {
        label: 'Canteen',
        tagline: 'Food Vendors & Operators',
        icon: <MdStore className="w-7 h-7" />,
        gradient: 'from-cyan-500 to-blue-600',
        borderColor: '#06b6d4',
        accentLight: 'rgba(6,182,212,0.08)',
        glowColor: 'rgba(6,182,212,0.3)',
        registerLink: '/register/canteen',
        registerLabel: 'Register Canteen',
    },
    admin: {
        label: 'Admin',
        tagline: 'System Administrators',
        icon: <MdAdminPanelSettings className="w-7 h-7" />,
        gradient: 'from-purple-500 to-purple-700',
        borderColor: '#a78bfa',
        accentLight: 'rgba(167,139,250,0.08)',
        glowColor: 'rgba(167,139,250,0.3)',
        registerLink: null,
        registerLabel: null,
    },
};

export default function LoginPage() {
    const { role } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const { theme } = useTheme();
    const dark = theme === 'dark';

    const config = roleConfig[role] || roleConfig.user;

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

   const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
        toast.error('Please fill in all fields');
        return;
    }
    if (!/^[^\s@]+@gmail\.com$/i.test(formData.email.trim())) {
        toast.error('Email must be a valid @gmail.com address');
        return;
    }

    setIsLoading(true);
    try {
        const mappedRole = role === 'user' ? 'student' : role;
        const result = await login(formData.email, formData.password, mappedRole);
        if (result.success) {
            toast.success('Login successful!');
            
            // ← Replace the setTimeout navigate with this:
            const roleRedirects = {
                student: '/student/canteens',
                canteen: '/canteen/dashboard',
                admin: '/admin/dashboard',
            };
            const redirectTo = roleRedirects[result.user.role] || '/';
            setTimeout(() => navigate(redirectTo), 800);
        } else {
            toast.error(result.message || 'Login failed');
        }
    } catch (error) {
        const msg = error.response?.data?.message || 'Login failed. Please try again.';
        toast.error(msg);
    } finally {
        setIsLoading(false);
    }
};
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 font-sans transition-colors duration-400">
            {/* Mesh Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className={`absolute inset-0 ${dark
                        ? "bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,rgba(22,163,74,0.08)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(124,58,237,0.06)_0%,transparent_60%)]"
                        : "bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,rgba(22,163,74,0.12)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(124,58,237,0.07)_0%,transparent_60%)]"
                    }`} />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
                {/* Back to Portal */}
                <div className="w-full max-w-md mb-6 animate-fade-down">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-400 transition-all duration-200"
                    >
                        ← Back to Login Portal
                    </Link>
                </div>

                {/* Login Card */}
                <div
                    className="w-full max-w-md bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-2 rounded-2xl p-8 animate-fade-up shadow-xl relative overflow-hidden"
                    style={{
                        borderColor: config.borderColor + '44',
                        boxShadow: `0 24px 60px ${config.glowColor}, 0 0 0 1px ${config.borderColor}11`,
                    }}
                >
                    {/* Corner accent */}
                    <div
                        className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-30"
                        style={{ background: config.accentLight }}
                    />

                    {/* Role Icon & Title */}
                    <div className="text-center mb-8 relative z-10">
                        <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg mx-auto mb-4"
                            style={{
                                background: `linear-gradient(135deg, ${config.borderColor}80, ${config.borderColor})`,
                                boxShadow: `0 8px 20px ${config.glowColor}`,
                            }}
                        >
                            {config.icon}
                        </div>
                        <h1 className="font-playfair text-2xl font-black text-gray-900 dark:text-white">
                            {config.label} <span style={{ color: config.borderColor }}>Login</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{config.tagline}</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    className="input-field pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className="input-field pl-10 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{
                                background: `linear-gradient(135deg, ${config.borderColor}cc, ${config.borderColor})`,
                                boxShadow: `0 4px 15px ${config.glowColor}`,
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                `Sign in as ${config.label}`
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    {config.registerLink && (
                        <div className="mt-6 text-center relative z-10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Don't have an account?{' '}
                                <Link
                                    to={config.registerLink}
                                    className="font-semibold hover:underline transition-colors"
                                    style={{ color: config.borderColor }}
                                >
                                    {config.registerLabel}
                                </Link>
                            </p>
                        </div>
                    )}
                </div>

                {/* SmartMess branding */}
                <p className="mt-6 text-gray-400 dark:text-gray-500 text-xs animate-fade-up animation-delay-300">
                    SmartMess © {new Date().getFullYear()} — Smart Canteen Management System
                </p>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                theme={dark ? 'dark' : 'light'}
            />
        </div>
    );
}
