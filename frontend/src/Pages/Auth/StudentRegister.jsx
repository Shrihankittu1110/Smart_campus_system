import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    MdPerson,
    MdEmail,
    MdLock,
    MdPhone,
    MdSchool,
    MdBadge,
    MdVisibility,
    MdVisibilityOff,
} from 'react-icons/md';
import { FaGraduationCap } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

export default function StudentRegister() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { theme } = useTheme();
    const dark = theme === 'dark';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        university: '',
        studentId: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const borderColor = '#22c55e';
    const glowColor = 'rgba(34,197,94,0.3)';
    const accentLight = 'rgba(34,197,94,0.08)';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.password) {
            toast.error('Please fill in all required fields');
            return;
        }
        if (!/^[^\s@]+@gmail\.com$/i.test(formData.email.trim())) {
            toast.error('Email must be a valid @gmail.com address');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const result = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: 'student',
                phone: formData.phone,
                university: formData.university,
                studentId: formData.studentId,
            });
            if (result.success) {
                toast.success('Registration successful! Please login.');
                setTimeout(() => navigate('/login/user'), 1500);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Registration failed. Please try again.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const inputField = (icon, name, label, type = 'text', placeholder = '', required = true) => (
        <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
                {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400">{icon}</span>}
                <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={`input-field ${icon ? 'pl-10' : ''}`}
                    required={required}
                />
            </div>
        </div>
    );

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
                {/* Back */}
                <div className="w-full max-w-lg mb-6 animate-fade-down">
                    <Link
                        to="/login/user"
                        className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-400 transition-all duration-200"
                    >
                        ← Back to Login
                    </Link>
                </div>

                {/* Registration Card */}
                <div
                    className="w-full max-w-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-2 rounded-2xl p-8 animate-fade-up shadow-xl relative overflow-hidden"
                    style={{
                        borderColor: borderColor + '44',
                        boxShadow: `0 24px 60px ${glowColor}, 0 0 0 1px ${borderColor}11`,
                    }}
                >
                    {/* Background Icon */}
                    <FaGraduationCap className="absolute -right-6 -bottom-6 w-28 h-28 opacity-5 dark:opacity-10 transform rotate-12" />

                    {/* Corner accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-30" style={{ background: accentLight }} />

                    {/* Header */}
                    <div className="text-center mb-8 relative z-10">
                        <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg mx-auto mb-4"
                            style={{
                                background: `linear-gradient(135deg, ${borderColor}80, ${borderColor})`,
                                boxShadow: `0 8px 20px ${glowColor}`,
                            }}
                        >
                            <MdPerson className="w-7 h-7" />
                        </div>
                        <h1 className="font-playfair text-2xl font-black text-gray-900 dark:text-white">
                            Student <span className="text-primary-500">Registration</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Create your SmartMess student account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                        {inputField(<MdPerson className="w-5 h-5" />, 'name', 'Full Name', 'text', 'Enter your full name')}
                        {inputField(<MdEmail className="w-5 h-5" />, 'email', 'Email Address', 'email', 'example@gmail.com')}

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Password <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Minimum 6 characters"
                                    className="input-field pl-10 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Confirm Password <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    className="input-field pl-10 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showConfirm ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200 dark:bg-gray-700" />

                        {inputField(<MdPhone className="w-5 h-5" />, 'phone', 'Phone Number', 'tel', '+94 77 XXX XXXX', false)}
                        {inputField(<MdSchool className="w-5 h-5" />, 'university', 'University', 'text', 'e.g. SLIIT, UOM', false)}
                        {inputField(<MdBadge className="w-5 h-5" />, 'studentId', 'Student ID', 'text', 'e.g. IT12345678', false)}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                            style={{
                                background: `linear-gradient(135deg, ${borderColor}cc, ${borderColor})`,
                                boxShadow: `0 4px 15px ${glowColor}`,
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Student Account'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center relative z-10">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Already have an account?{' '}
                            <Link to="/login/user" className="font-semibold text-primary-500 hover:underline">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-6 text-gray-400 dark:text-gray-500 text-xs animate-fade-up animation-delay-300">
                    SmartMess © {new Date().getFullYear()} — Smart Canteen Management System
                </p>
            </div>

            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover theme={dark ? 'dark' : 'light'} />
        </div>
    );
}
