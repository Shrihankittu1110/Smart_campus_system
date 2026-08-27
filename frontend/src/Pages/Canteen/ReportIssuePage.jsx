
import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Bug, Zap, Lightbulb, HelpCircle, AlertTriangle,
  Upload, X, Send, CheckCircle, Phone, Mail,
  MessageSquare, Clock, Shield, Loader2
} from 'lucide-react';

const CATEGORIES = [
  { key: 'Bug Issue',       icon: Bug,          color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',    border: 'border-red-200 dark:border-red-800/40',    ring: 'ring-red-400'    },
  { key: 'Performance',     icon: Zap,          color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800/40', ring: 'ring-yellow-400' },
  { key: 'Feature Idea',    icon: Lightbulb,    color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',  border: 'border-blue-200 dark:border-blue-800/40',  ring: 'ring-blue-400'   },
  { key: 'App Bug',         icon: AlertTriangle,color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800/40', ring: 'ring-orange-400' },
  { key: 'Other',           icon: HelpCircle,   color: 'text-gray-500',   bg: 'bg-gray-50 dark:bg-gray-800',     border: 'border-gray-200 dark:border-gray-700',     ring: 'ring-gray-400'   },
];

export default function ReportIssuePage() {
  const { user, token } = useAuth();

  // ✅ Do NOT compute canteen at top level — user may be null on first render
  const userId = user?._id || user?.id || '';

  const [form, setForm] = useState({
    reporterName: user?.name || '',
    category:     '',
    description:  '',
  });
  const [image,     setImage]     = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category)           { setError('Please select a category'); return; }
    if (!form.description.trim()) { setError('Please describe the issue'); return; }

    // ✅ Read canteen name HERE at submit time — user is guaranteed to be loaded by now
    const canteenName = user?.canteenName || 'My Canteen';

    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('submittedByName',  form.reporterName || user?.name || '');
      fd.append('submittedByEmail', user?.email || '');
      fd.append('submitterId',      userId);
      fd.append('submitterType',    'canteen');
      fd.append('canteenName',      canteenName);
      fd.append('category',         form.category);
      fd.append('description',      form.description);
      if (image) fd.append('attachment', image);

      const r = await fetch('/api/canteen/report', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || 'Failed to submit');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({ reporterName: user?.name || '', category: '', description: '' });
    setImage(null);
    setPreview(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center px-6">
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/60 p-10 max-w-md w-full text-center shadow-xl">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-black text-gray-800 dark:text-white mb-2">Report Submitted!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Our team will review your report and get back to you shortly.
        </p>
        <button onClick={handleReset}
          className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors">
          Submit Another Report
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/60">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Report an Issue</h1>
        <p className="text-xs text-gray-400">Help us improve SmartMess</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6">

            {/* ── Form (left 2 cols) ── */}
            <form onSubmit={handleSubmit} className="col-span-2 space-y-5">

              {/* Auto-captured info */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Auto Captured</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-gray-400 mb-0.5">Canteen</p>
                    {/* ✅ Read directly from user at render time */}
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                      {user?.canteenName || 'Loading...'}
                    </p>
                  </div>
                 <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3">
       <p className="text-[10px] text-gray-400 mb-0.5">User ID</p>
      <p className="text-sm font-bold text-gray-800 dark:text-white truncate font-mono">
    {userId ? `Canteen-${userId.slice(-4)}` : 'Not logged in'}
  </p>
</div>
                </div>
              </div>

              {/* Reporter name */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-3">Reporter Name</label>
                <input
                  value={form.reporterName}
                  onChange={e => {
                    const value = e.target.value;
                    if (/^[A-Za-z\s]*$/.test(value)) {
                      setForm(f => ({ ...f, reporterName: value }));
                      setError('');
                    } else {
                      setError('Name can only contain letters and spaces');
                    }
                  }}
                  placeholder="Your name"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
                />
              </div>

              {/* Category */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-3">Category</label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map(({ key, icon: Icon, color, bg, border, ring }) => (
                    <button key={key} type="button"
                      onClick={() => { setForm(f => ({ ...f, category: key })); setError(''); }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        form.category === key
                          ? `${bg} ${border} ring-2 ${ring} scale-105`
                          : 'border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                      }`}>
                      <Icon className={`w-5 h-5 ${form.category === key ? color : 'text-gray-400'}`} />
                      <span className={`text-[10px] font-bold text-center leading-tight ${form.category === key ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>
                        {key}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-3">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={5}
                  placeholder="Describe the issue in detail — what happened, when, and how to reproduce it..."
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-1 text-right">{form.description.length} characters</p>
              </div>

              {/* Image upload */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-3">Attach Screenshot (optional)</label>
                {preview ? (
                  <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img src={preview} alt="preview" className="w-full max-h-48 object-cover" />
                    <button type="button" onClick={() => { setImage(null); setPreview(null); fileRef.current.value = ''; }}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current.click()}
                    className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-green-400 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-all group">
                    <Upload className="w-6 h-6 text-gray-300 group-hover:text-green-500 transition-colors" />
                    <p className="text-xs font-semibold text-gray-400 group-hover:text-green-500 transition-colors">Click to upload image</p>
                    <p className="text-[10px] text-gray-300">PNG, JPG up to 5MB</p>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-600 dark:text-red-400 font-semibold">
                  ⚠ {error}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={handleReset}
                  className="flex-1 py-3.5 rounded-xl border-2 border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  Discard
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Report</>}
                </button>
              </div>
            </form>

            {/* ── Side Panel ── */}
            <div className="space-y-4">

              {/* Emergency help poster */}
              <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Need Emergency Help?</p>
                  <h3 className="text-lg font-black leading-tight mb-3">Critical issue? Call us directly!</h3>
                  <div className="space-y-2">
                    <a href="tel:+94112345678"
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2.5 transition-colors">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] opacity-70">Hotline</p>
                        <p className="text-sm font-bold">+94 11 234 5678</p>
                      </div>
                    </a>
                    <a href="mailto:support@smartmess.com"
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2.5 transition-colors">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] opacity-70">Email</p>
                        <p className="text-sm font-bold">support@smartmess.com</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Response time */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-green-500" />
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Response Times</p>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Bug Issue',    time: '2–4 hours',  color: 'bg-red-400'    },
                    { label: 'Performance',  time: '4–8 hours',  color: 'bg-yellow-400' },
                    { label: 'Feature Idea', time: '2–3 days',   color: 'bg-blue-400'   },
                    { label: 'Other',        time: '1–2 days',   color: 'bg-gray-400'   },
                  ].map(({ label, time, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${color}`} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-green-500" />
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tips</p>
                </div>
                <ul className="space-y-2">
                  {[
                    'Be specific about when the issue occurred',
                    'Attach a screenshot if possible',
                    'One issue per report works best',
                  ].map(tip => (
                    <li key={tip} className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Live chat teaser */}
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  <p className="text-xs font-bold text-green-700 dark:text-green-400">Live Chat</p>
                  <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">Online</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Available Mon–Fri, 8AM–6PM</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}