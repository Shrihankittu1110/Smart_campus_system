import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext'; 
import { authFetch } from '../../../utils/authFetch';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Shield, UserPlus, X, Eye, EyeOff, Check } from 'lucide-react';

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ── Validation helpers ────────────────────────────────────────────────────────
const validate = (form) => {
  const errors = {};

  // Name — letters, spaces, hyphens, apostrophes only
  if (!form.name.trim())
    errors.name = 'Full name is required';
  else if (form.name.trim().length < 2)
    errors.name = 'Name must be at least 2 characters';
  else if (!/^[A-Za-z\s'\-]+$/.test(form.name.trim()))
    errors.name = 'Name can only contain letters and spaces';

  // Email
  if (!form.email.trim())
    errors.email = 'Email is required';
  else if (!/^[^\s@]+@gmail\.com$/i.test(form.email.trim()))
    errors.email = 'Email must be a valid @gmail.com address';

  // Password
  if (!form.password)
    errors.password = 'Password is required';
  else if (form.password.length < 8)
    errors.password = 'Minimum 8 characters';
  else if (!/(?=.*[A-Z])/.test(form.password))
    errors.password = 'Must include at least one uppercase letter';
  else if (!/(?=.*\d)/.test(form.password))
    errors.password = 'Must include at least one number';

  // Confirm Password
  if (!form.confirmPassword)
    errors.confirmPassword = 'Please confirm the password';
  else if (form.password !== form.confirmPassword)
    errors.confirmPassword = 'Passwords do not match';

  // NIC — 9 digits + V/X  OR  12 digits
  if (!form.nic.trim())
    errors.nic = 'NIC is required';
  else if (!/^(\d{9}[VvXx]|\d{12})$/.test(form.nic.trim()))
    errors.nic = 'Invalid NIC (e.g. 123456789V or 200012345678)';

  // Phone - 10 digits, no leading zero, no letters or symbols
  if (!form.phone.trim())
    errors.phone = 'Phone number is required';
  else if (!/^\d+$/.test(form.phone.trim()))
    errors.phone = 'Phone number must contain digits only';
  else if (!/^[1-9]\d{9}$/.test(form.phone.trim()))
    errors.phone = 'Enter a valid 10-digit number that does not start with 0';

  return errors;
};
const InputField = ({ label, name, type = 'text', value, onChange, error, placeholder, hint, maxLength, inputMode, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete="off"
        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
          error
            ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10'
            : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
        } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${
          error ? 'focus:ring-red-400' : 'focus:ring-primary-400 dark:focus:ring-primary-500'
        } focus:border-transparent transition-all ${children ? 'pr-10' : ''}`}
      />
      {children}
    </div>
    {error  && <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1">⚠ {error}</p>}
    {!error && hint && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
  </div>
);


/**
 * AdminHeader — reusable across all admin pages
 * Props: title, subtitle, onRefresh, refreshing, lastRefresh
 */
const AdminHeader = ({ title = 'Dashboard', subtitle = '', onRefresh, refreshing = false, lastRefresh }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showPass, setShowPass]   = useState({ password: false, confirm: false });
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [errors, setErrors]       = useState({});
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', nic: '', phone: '' });
  const [, setTick] = useState(0);

  // Get logged-in admin from localStorage
 // ✅ Fixed — reads from AuthContext
const { user } = useAuth();
const adminName = user?.name || 'Admin';
const adminPhoto = user?.profilePicture || user?.photo || null;
const initials = adminName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // NAME: letters and spaces only — block digits, punctuation, symbols instantly
    if (name === 'name' && value !== '' && !/^[A-Za-z ]*$/.test(value)) return;

    // PHONE: digits only — block everything else
    if (name === 'phone' && value !== '' && !/^[0-9]*$/.test(value)) return;

    // NIC: digits + optional trailing V/X — max 12 chars total, block everything else
    if (name === 'nic') {
      if (value.length > 12) return;                          // max 12 chars
      if (value !== '' && !/^[0-9]*[VvXx]?$/.test(value)) return; // digits then optional V/X at end only
    }

    // EMAIL: only allow chars valid in an email: letters, digits, @, ., _, -, +
    if (name === 'email' && value !== '' && !/^[A-Za-z0-9@.\-_+]*$/.test(value)) return;

    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: '' }));
    setServerError('');
  };
  const openModal = () => {
    setForm({ name: '', email: '', password: '', confirmPassword: '', nic: '', phone: '' });
    setErrors({});
    setServerError('');
    setSuccess(false);
    setShowModal(true);
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch('/api/admin/create-admin', {
    method: 'POST',
    body: JSON.stringify({ ...form, role: 'admin' }),
});
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to add admin');
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setShowModal(false); }, 1800);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Header bar ── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">

        {/* Left — dynamic page title */}
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight truncate">{title}</h1>
          {subtitle
            ? <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
            : <p className="text-xs text-gray-400 dark:text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          }
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 flex-shrink-0">

          {/* Refresh pill */}
          {onRefresh && (
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                Updated {lastRefresh ? timeAgo(lastRefresh) : '—'}
              </span>
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          )}

          {/* Add Admin button */}
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white transition-colors shadow-sm shadow-primary-200 dark:shadow-none"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Admin</span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-100 dark:bg-gray-800" />

          {/* Admin profile — clickable → profile page */}
          <button
            onClick={() => navigate('/admin/profile')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity group"
          >
            <div className="relative">
              {adminPhoto ? (
                <img src={adminPhoto} alt={adminName} className="w-9 h-9 rounded-xl object-cover shadow-sm" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
                  <span className="text-xs font-black text-white">{initials}</span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-primary-500" fill="currentColor" />
              </div>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none mb-0.5">{greeting()},</p>
              <p className="text-sm font-bold text-gray-800 dark:text-white leading-none group-hover:text-primary-500 transition-colors">{adminName}</p>
            </div>
          </button>
        </div>
      </header>

      {/* ── Add Admin Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <style>{`.no-scroll-bar::-webkit-scrollbar{display:none}`}</style>
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden max-h-[90vh] no-scroll-bar" style={{ overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>

            {/* Hide webkit scrollbar */}
            <style>{`[data-modal]::-webkit-scrollbar { display: none; }`}</style>
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">Add New Admin</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Grant admin access to a user</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddAdmin} className="px-6 py-5 space-y-4">
              <InputField label="Full Name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="e.g. Sarah Abdullah" hint="Letters only — no numbers or symbols" />
              <InputField label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="admin@gmail.com" />
              <InputField label="Password" name="password" type={showPass.password ? 'text' : 'password'} value={form.password} onChange={handleChange} error={errors.password} placeholder="Min. 8 chars, 1 uppercase, 1 number">
                <button type="button" onClick={() => setShowPass(s => ({ ...s, password: !s.password }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPass.password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </InputField>
              <InputField label="Confirm Password" name="confirmPassword" type={showPass.confirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} placeholder="Re-enter password">
                <button type="button" onClick={() => setShowPass(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPass.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </InputField>
              <InputField label="NIC Number" name="nic" value={form.nic} onChange={handleChange} error={errors.nic} placeholder="123456789V or 200012345678" hint="9 digits + V/X, or 12 digits" maxLength={12} />
              <InputField label="Phone Number" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="7123456789" hint="10 digits, cannot start with 0" maxLength={10} inputMode="numeric" />

              {serverError && (
                <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                  {serverError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading || success} className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
                  {success ? <><Check className="w-4 h-4" /> Added!</> : loading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adding...</> : <><UserPlus className="w-3.5 h-3.5" /> Add Admin</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;
