import React, { useState, useRef } from 'react';
import AdminHeader from './components/AdminHeader';
import { authFetch } from '../../utils/authFetch';
import { useAuth } from '../../context/AuthContext';
import { Camera, Save, Lock, User, Phone, CreditCard, Mail, RefreshCw, Check, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const validateProfile = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Full name is required';
  else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!form.phone.trim()) errors.phone = 'Phone number is required';
  else if (!/^[1-9]\d{9}$/.test(form.phone.trim())) errors.phone = 'Enter a valid 10-digit number that does not start with 0';
  if (form.nic && !/^(\d{9}[VvXx]|\d{12})$/.test(form.nic.trim())) errors.nic = 'Enter a valid NIC';
  return errors;
};

const validatePassword = (form) => {
  const errors = {};
  if (!form.currentPassword) errors.currentPassword = 'Current password is required';
  if (!form.newPassword) errors.newPassword = 'New password is required';
  else if (form.newPassword.length < 8) errors.newPassword = 'Minimum 8 characters';
  else if (!/(?=.*[A-Z])/.test(form.newPassword)) errors.newPassword = 'Include at least one uppercase letter';
  else if (!/(?=.*\d)/.test(form.newPassword)) errors.newPassword = 'Include at least one number';
  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (form.newPassword !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
  return errors;
};

const InputField = ({ label, name, type = 'text', value, onChange, error, placeholder, disabled, icon: Icon, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
      <input
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 text-sm rounded-xl border ${
          error ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10'
                : disabled ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
        } text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
          error ? 'focus:ring-red-400' : 'focus:ring-primary-400'
        } focus:border-transparent transition-all ${children ? 'pr-10' : ''}`}
      />
      {children}
    </div>
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

const AdminProfile = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // ✅ Use AuthContext instead of localStorage
  const { user: stored } = useAuth();

  const [preview, setPreview]     = useState(stored?.profilePicture || stored?.photo || null);
  const [photoFile, setPhotoFile] = useState(null);
  const [form, setForm]           = useState({
    name:  stored?.name  || '',
    phone: stored?.phone || '',
    nic:   stored?.nic   || '',
  });
  const [profileErrors, setProfileErrors]       = useState({});
  const [profileLoading, setProfileLoading]     = useState(false);
  const [profileSuccess, setProfileSuccess]     = useState(false);
  const [profileServerErr, setProfileServerErr] = useState('');

  const [passForm, setPassForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passErrors, setPassErrors]     = useState({});
  const [passLoading, setPassLoading]   = useState(false);
  const [passSuccess, setPassSuccess]   = useState(false);
  const [passServerErr, setPassServerErr] = useState('');
  const [showPass, setShowPass]     = useState({ current: false, new: false, confirm: false });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoFile(reader.result);
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFormChange = (e) => {
    if (e.target.name === 'phone' && e.target.value !== '' && !/^[0-9]*$/.test(e.target.value)) return;
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setProfileErrors(er => ({ ...er, [e.target.name]: '' }));
    setProfileServerErr('');
  };

  const handlePassChange = (e) => {
    setPassForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setPassErrors(er => ({ ...er, [e.target.name]: '' }));
    setPassServerErr('');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const errs = validateProfile(form);
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setProfileLoading(true);
    setProfileServerErr('');
    try {
      const body = {
        name: form.name,
        phone: form.phone,
        nic: form.nic,
        ...(photoFile ? { profilePicture: photoFile } : {}),
      };

      // ✅ Using authFetch
      const res = await authFetch('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update profile');

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err) {
      setProfileServerErr(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    const errs = validatePassword(passForm);
    if (Object.keys(errs).length) { setPassErrors(errs); return; }
    setPassLoading(true);
    setPassServerErr('');
    try {
      // ✅ Using authFetch
      const res = await authFetch('/api/admin/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to change password');
      setPassSuccess(true);
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPassSuccess(false), 2500);
    } catch (err) {
      setPassServerErr(err.message);
    } finally {
      setPassLoading(false);
    }
  };

  const initials = form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'AD';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <AdminHeader title="My Profile" subtitle="Manage your account details" />

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="max-w-3xl mx-auto space-y-5">

          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-primary-500 to-primary-400 relative">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            </div>

            <div className="px-6 pb-5">
              <div className="flex items-end justify-between -mt-10 mb-4">
                <div className="relative">
                  {preview ? (
                    <img src={preview} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-lg" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center">
                      <span className="text-xl font-black text-white">{initials}</span>
                    </div>
                  )}
                  <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-md transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
                <div className="pb-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Click avatar to change photo</p>
                  <p className="text-[10px] text-gray-300 dark:text-gray-600">Max 5MB · JPG, PNG, WebP</p>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Full Name" name="name" value={form.name} onChange={handleFormChange} error={profileErrors.name} placeholder="Your full name" icon={User} />
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" value={stored?.email || ''} disabled className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-70" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                  <InputField label="Phone Number" name="phone" value={form.phone} onChange={handleFormChange} error={profileErrors.phone} placeholder="e.g. 7123456789" icon={Phone} />
                  <InputField label="NIC Number" name="nic" value={form.nic} onChange={handleFormChange} error={profileErrors.nic} placeholder="e.g. 200012345678" icon={CreditCard} />
                </div>

                {profileServerErr && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">{profileServerErr}</div>
                )}

                <div className="flex justify-end">
                  <button type="submit" disabled={profileLoading || profileSuccess} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-60 shadow-sm">
                    {profileSuccess ? <><Check className="w-4 h-4" /> Saved!</> : profileLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                <Lock className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Change Password</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Keep your account secure</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSave} className="space-y-4">
              {[
                { label: 'Current Password',     name: 'currentPassword', key: 'current' },
                { label: 'New Password',         name: 'newPassword',     key: 'new'     },
                { label: 'Confirm New Password', name: 'confirmPassword', key: 'confirm' },
              ].map(({ label, name, key }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPass[key] ? 'text' : 'password'}
                      name={name} value={passForm[name]} onChange={handlePassChange}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border ${
                        passErrors[name] ? 'border-red-400 bg-red-50 dark:bg-red-900/10 dark:border-red-500'
                                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                      } text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                        passErrors[name] ? 'focus:ring-red-400' : 'focus:ring-primary-400'
                      } focus:border-transparent transition-all`}
                    />
                    <button type="button" onClick={() => setShowPass(s => ({ ...s, [key]: !s[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {showPass[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passErrors[name] && <p className="text-[10px] text-red-500 mt-1 font-medium">{passErrors[name]}</p>}
                </div>
              ))}

              {passServerErr && (
                <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">{passServerErr}</div>
              )}

              <div className="flex justify-end">
                <button type="submit" disabled={passLoading || passSuccess} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-60 shadow-sm">
                  {passSuccess ? <><Check className="w-4 h-4" /> Updated!</> : passLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...</> : <><Lock className="w-4 h-4" /> Update Password</>}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
