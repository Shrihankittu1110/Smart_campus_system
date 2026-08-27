import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    MdPerson,
    MdEmail,
    MdPhone,
    MdSchool,
    MdBadge,
    MdStore,
    MdLocationOn,
    MdRestaurant,
    MdLock,
    MdEdit,
    MdSave,
    MdClose,
    MdLogout,
    MdVisibility,
    MdVisibilityOff,
    MdAdminPanelSettings,
} from 'react-icons/md';

const roleColors = {
    student: { border: '#22c55e', glow: 'rgba(34,197,94,0.3)', accent: 'rgba(34,197,94,0.08)', label: 'Student' },
    canteen: { border: '#06b6d4', glow: 'rgba(6,182,212,0.3)', accent: 'rgba(6,182,212,0.08)', label: 'Canteen' },
    admin: { border: '#a78bfa', glow: 'rgba(167,139,250,0.3)', accent: 'rgba(167,139,250,0.08)', label: 'Admin' },
};

const roleIcons = {
    student: <MdPerson className="w-7 h-7" />,
    canteen: <MdStore className="w-7 h-7" />,
    admin: <MdAdminPanelSettings className="w-7 h-7" />,
};

export default function ProfilePage() {
    const { user, updateProfile, changePassword, logout } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const dark = theme === 'dark';

    const colors = roleColors[user?.role] || roleColors.student;

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // Password change
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                university: user.university || '',
                studentId: user.studentId || '',
                canteenName: user.canteenName || '',
                location: user.location || '',
                licenseNumber: user.licenseNumber || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Name is required');
            return;
        }
        setIsLoading(true);
        try {
            const result = await updateProfile(formData);
            if (result.success) {
                toast.success('Profile updated successfully!');
                setIsEditing(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toast.error('Please fill in all password fields');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        setIsChangingPassword(true);
        try {
            const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
            if (result.success) {
                toast.success('Password changed successfully!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowPasswordSection(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) return null;

    const InfoRow = ({ icon, label, value, name, editable = true }) => (
        <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <span className="text-gray-400 dark:text-gray-500">{icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
                {isEditing && editable ? (
                    <input
                        type="text"
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleChange}
                        className="input-field mt-1 text-sm"
                    />
                ) : (
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{value || '—'}</p>
                )}
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

            <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-12">
                {/* Back */}
                <div className="w-full max-w-2xl mb-6 flex items-center justify-between animate-fade-down">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-400 transition-all duration-200"
                    >
                        ← Back to Home
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 text-red-500 text-sm font-medium px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                        <MdLogout className="w-4 h-4" /> Logout
                    </button>
                </div>

                {/* Profile Card */}
                <div
                    className="w-full max-w-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-2 rounded-2xl p-8 animate-fade-up shadow-xl relative overflow-hidden"
                    style={{
                        borderColor: colors.border + '44',
                        boxShadow: `0 24px 60px ${colors.glow}, 0 0 0 1px ${colors.border}11`,
                    }}
                >
                    {/* Corner accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-30" style={{ background: colors.accent }} />

                    {/* Avatar & Header */}
                    <div className="flex items-start gap-5 mb-8 relative z-10">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
                            style={{
                                background: `linear-gradient(135deg, ${colors.border}80, ${colors.border})`,
                                boxShadow: `0 8px 20px ${colors.glow}`,
                            }}
                        >
                            {roleIcons[user.role]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="font-playfair text-2xl font-black text-gray-900 dark:text-white truncate">{user.name}</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{user.email}</p>
                            <span
                                className="inline-flex items-center gap-1 mt-2 text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full border"
                                style={{
                                    color: colors.border,
                                    borderColor: colors.border + '55',
                                    background: colors.accent,
                                }}
                            >
                                {colors.label}
                            </span>
                        </div>
                        {/* Edit/Cancel/Save buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => { setIsEditing(false); setFormData({ name: user.name, phone: user.phone, university: user.university, studentId: user.studentId, canteenName: user.canteenName, location: user.location, licenseNumber: user.licenseNumber }); }}
                                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-500 hover:border-red-300 transition-all"
                                        title="Cancel"
                                    >
                                        <MdClose className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="p-2 rounded-lg text-white transition-all disabled:opacity-60"
                                        style={{ background: colors.border }}
                                        title="Save"
                                    >
                                        {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <MdSave className="w-5 h-5" />}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-all"
                                    title="Edit Profile"
                                >
                                    <MdEdit className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="relative z-10 space-y-1">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Personal Information</p>
                        <InfoRow icon={<MdPerson className="w-5 h-5" />} label="Full Name" value={user.name} name="name" />
                        <InfoRow icon={<MdEmail className="w-5 h-5" />} label="Email" value={user.email} name="email" editable={false} />
                        <InfoRow icon={<MdPhone className="w-5 h-5" />} label="Phone" value={user.phone} name="phone" />

                        {user.role === 'student' && (
                            <>
                                <div className="h-px bg-gray-200 dark:bg-gray-700 my-4" />
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Academic Information</p>
                                <InfoRow icon={<MdSchool className="w-5 h-5" />} label="University" value={user.university} name="university" />
                                <InfoRow icon={<MdBadge className="w-5 h-5" />} label="Student ID" value={user.studentId} name="studentId" />
                            </>
                        )}

                        {user.role === 'canteen' && (
                            <>
                                <div className="h-px bg-gray-200 dark:bg-gray-700 my-4" />
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Canteen Information</p>
                                <InfoRow icon={<MdRestaurant className="w-5 h-5" />} label="Canteen Name" value={user.canteenName} name="canteenName" />
                                <InfoRow icon={<MdLocationOn className="w-5 h-5" />} label="Location" value={user.location} name="location" />
                                <InfoRow icon={<MdBadge className="w-5 h-5" />} label="License Number" value={user.licenseNumber} name="licenseNumber" />
                            </>
                        )}
                    </div>

                    {/* Change Password Section */}
                    <div className="relative z-10 mt-8">
                        <div className="h-px bg-gray-200 dark:bg-gray-700 mb-6" />
                        <button
                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors"
                        >
                            <MdLock className="w-5 h-5" />
                            {showPasswordSection ? 'Hide Password Section' : 'Change Password'}
                        </button>

                        {showPasswordSection && (
                            <form onSubmit={handleChangePassword} className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                                    <div className="relative">
                                        <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showCurrent ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="input-field pl-10 pr-10"
                                            placeholder="Enter current password"
                                            required
                                        />
                                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            {showCurrent ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                                    <div className="relative">
                                        <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="input-field pl-10 pr-10"
                                            placeholder="Minimum 6 characters"
                                            required
                                        />
                                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            {showNew ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                                    <div className="relative">
                                        <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="input-field pl-10"
                                            placeholder="Re-enter new password"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                                    style={{
                                        background: `linear-gradient(135deg, ${colors.border}cc, ${colors.border})`,
                                        boxShadow: `0 4px 15px ${colors.glow}`,
                                    }}
                                >
                                    {isChangingPassword ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Changing...
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Account Info */}
                    <div className="relative z-10 mt-6 text-center">
                        <p className="text-gray-400 dark:text-gray-500 text-xs">
                            Member since {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
