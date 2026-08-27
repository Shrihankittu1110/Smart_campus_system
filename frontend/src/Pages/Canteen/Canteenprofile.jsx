//frontend/src/pages/Canteen/CanteenProfile.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { buildImgUrl } from '../../utils/imageUrl';
import {
  Store, MapPin, User, FileText, Camera, Save,
  CheckCircle, XCircle, Loader2, Upload, Trash2, Phone, Mail
} from 'lucide-react';

const API = '/api/canteen/profile';

// Validation helpers
const validate = (form) => {
  const errors = {};

  // Owner name — letters and spaces only
  if (!form.ownerName.trim()) {
    errors.ownerName = 'Owner name is required';
  } else if (!/^[a-zA-Z\s]+$/.test(form.ownerName.trim())) {
    errors.ownerName = 'Owner name must contain letters only (no numbers or symbols)';
  } else if (form.ownerName.trim().length > 50) {
    errors.ownerName = 'Owner name must be 50 characters or less';
  }

  // Canteen name — letters and spaces only
  if (!form.canteenName.trim()) {
    errors.canteenName = 'Canteen name is required';
  } else if (!/^[a-zA-Z\s]+$/.test(form.canteenName.trim())) {
    errors.canteenName = 'Canteen name must contain letters only (no numbers or symbols)';
  } else if (form.canteenName.trim().length > 50) {
    errors.canteenName = 'Canteen name must be 50 characters or less';
  }

  // Email — exactly one @, domain must have exactly one dot segment
  if (form.email.trim()) {
    const emailRegex = /^[^\s@]+@[^@.\s]+\.[^@.\s]+$/;
    if (!emailRegex.test(form.email.trim())) {
      errors.email = 'Enter a valid email (e.g. name@example.com)';
    }
  }

  // Phone
  if (form.phone.trim()) {
    const digitsOnly = form.phone.trim().replace(/\s+/g, '');
    if (!/^07\d{8}$/.test(digitsOnly)) {
      errors.phone = 'Phone must start with 07 and be exactly 10 digits';
    }
  }

  // Description — no numbers allowed
  if (form.description.trim()) {
    if (/\d/.test(form.description.trim())) {
      errors.description = 'Description must not contain numbers';
    } else if (form.description.trim().length > 500) {
      errors.description = 'Description must be 500 characters or less';
    }
  }

  return errors;
};

export default function CanteenProfile() {
  const [profile, setProfile]       = useState(null);
  const [form, setForm]             = useState({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [imgFile, setImgFile]       = useState(null);
  const [errors, setErrors]         = useState({});
  const fileRef = useRef();

  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const r = await fetch(API, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (r.status === 401) {
          logout();
          navigate('/login');
          return;
        }

        const j = await r.json();
        if (j.success) {
          setProfile(j.data);
          setForm({
            ownerName:   j.data.ownerName   || '',
            canteenName: j.data.canteenName || '',
            email:       j.data.email       || user?.email || '',
            phone:       j.data.phone       || user?.phone || '',
            location:    j.data.location    || '',
            description: j.data.description || '',
          });
          setImgPreview(buildImgUrl(j.data.image));
        }
      } catch (err) {
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Live-block numbers and symbols for ownerName and canteenName
    if (name === 'ownerName' || name === 'canteenName') {
      if (/[^a-zA-Z\s]/.test(value)) return;
    }

    // Live-block digits in description
    if (name === 'description') {
      if (/\d/.test(value)) return;
    }

    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error');
      return;
    }
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImgFile(null);
    setImgPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async () => {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Please fix the errors before saving', 'error');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (imgFile) formData.append('image', imgFile);

      const r = await fetch(API, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (r.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      const j = await r.json();
      if (!r.ok) throw new Error(j.message);

      setProfile(j.data);
      setImgFile(null);
      setErrors({});

      if (j.data.image) setImgPreview(buildImgUrl(j.data.image));

      if (typeof updateUser === 'function') {
        updateUser({
          ...user,
          canteenName:  j.data.canteenName,
          profileImage: j.data.image,
        });
      }

      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      <p className="text-sm text-gray-400 mt-3">Loading profile...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Canteen Profile</h1>
          <p className="text-xs text-gray-400">
            Logged in as <span className="font-semibold text-green-500">{user?.email || user?.name || 'Canteen Owner'}</span>
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth: 'none' }}>
        <div className="grid grid-cols-3 gap-5">

          {/* Left — Image upload */}
          <div className="col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Canteen Image</p>

              <div className="relative group">
                {imgPreview ? (
                  <div className="relative rounded-xl overflow-hidden aspect-square">
                    <img src={imgPreview} alt="Canteen" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => fileRef.current?.click()}
                        className="w-9 h-9 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white transition-colors">
                        <Camera className="w-4 h-4 text-gray-700" />
                      </button>
                      <button onClick={handleRemoveImage}
                        className="w-9 h-9 bg-red-500/90 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors">
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center gap-3 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/20 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400 group-hover:text-green-500 transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Upload Image</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG up to 5MB</p>
                    </div>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </div>

              {imgFile && (
                <p className="text-[11px] text-green-500 font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> New image selected — save to apply
                </p>
              )}
            </div>

            {/* Status card */}
            {profile && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${profile.isApproved ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className={`text-sm font-bold ${profile.isApproved ? 'text-green-500' : 'text-yellow-500'}`}>
                    {profile.isApproved ? 'Approved' : 'Pending Approval'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${profile.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {profile.isActive ? 'Visible to Students' : 'Hidden'}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
                  <p className="text-[10px] text-gray-400">Role</p>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-300 capitalize mt-0.5">
                    {user?.role?.replace('_', ' ') || 'Canteen Owner'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right — Form */}
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Canteen Details</p>

            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5 block">
                  <User className="w-3 h-3 inline mr-1" /> Owner Name *
                </label>
                <input name="ownerName" value={form.ownerName} onChange={handleChange}
                  placeholder="Enter owner name"
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border ${errors.ownerName ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-600 focus:ring-green-400'} bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                {errors.ownerName && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {errors.ownerName}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5 block">
                  <Store className="w-3 h-3 inline mr-1" /> Canteen Name *
                </label>
                <input name="canteenName" value={form.canteenName} onChange={handleChange}
                  placeholder="Enter canteen name"
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border ${errors.canteenName ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-600 focus:ring-green-400'} bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                {errors.canteenName && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {errors.canteenName}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5 block">
                  <Mail className="w-3 h-3 inline mr-1" /> Email
                </label>
                <input name="email" value={form.email} onChange={handleChange}
                  placeholder="canteen@email.com" type="email"
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-600 focus:ring-green-400'} bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                {errors.email && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5 block">
                  <Phone className="w-3 h-3 inline mr-1" /> Phone
                </label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="0771234567"
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border ${errors.phone ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-600 focus:ring-green-400'} bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                {errors.phone && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5 block">
                <MapPin className="w-3 h-3 inline mr-1" /> Location
              </label>
              <input name="location" value={form.location} onChange={handleChange}
                placeholder="e.g. Block A, Ground Floor, Faculty of Computing"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all" />
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5 block">
                <FileText className="w-3 h-3 inline mr-1" /> Description
              </label>
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={5} placeholder="Tell students about your canteen — what you serve, your specialty, etc."
                className={`w-full px-3 py-2.5 text-sm rounded-xl border ${errors.description ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-600 focus:ring-green-400'} bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none transition-all`} />
              <div className="flex items-center justify-between mt-1">
                {errors.description ? (
                  <p className="text-[10px] text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {errors.description}
                  </p>
                ) : <span />}
                <p className="text-[10px] text-gray-400">{form.description?.length || 0} / 500</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}