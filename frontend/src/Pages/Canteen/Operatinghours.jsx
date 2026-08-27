//frontend/src/pages/Canteen/OperatingHours.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, Save, CheckCircle, XCircle, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const DEFAULT_HOURS = DAYS.map(day => ({
  day,
  isOpen:    !['Saturday','Sunday'].includes(day),
  openTime:  '08:00',
  closeTime: '17:00',
}));

// ── Always returns a safe array of 7 day objects ──────────────────────────────
const parseHours = (raw) => {
  try {
    let data = raw;
    // If string, parse it
    if (typeof data === 'string') data = JSON.parse(data);
    // Must be a non-empty array
    if (!Array.isArray(data) || data.length === 0) return DEFAULT_HOURS;
    // Ensure every item has the required fields
    return data.map(d => ({
      day:       typeof d.day === 'string' ? d.day : '',
      isOpen:    typeof d.isOpen === 'boolean' ? d.isOpen : false,
      openTime:  d.openTime  || '08:00',
      closeTime: d.closeTime || '17:00',
    }));
  } catch {
    return DEFAULT_HOURS;
  }
};

export default function OperatingHours() {
  const { token } = useAuth();
  const [hours, setHours]     = useState(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchHours = async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/canteen/hours', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json();
        if (j.success) {
          setHours(parseHours(j.data));
        }
      } catch (err) {
        console.error('Failed to load hours:', err);
        setHours(DEFAULT_HOURS);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchHours();
  }, [token]);

  const toggle = (idx) =>
    setHours(h => h.map((d, i) => i === idx ? { ...d, isOpen: !d.isOpen } : d));

  const setTime = (idx, field, val) =>
    setHours(h => h.map((d, i) => i === idx ? { ...d, [field]: val } : d));

  const setAllWeekdays = () =>
    setHours(h => h.map(d =>
      !['Saturday','Sunday'].includes(d.day)
        ? { ...d, isOpen: true, openTime: '08:00', closeTime: '17:00' }
        : d
    ));

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/canteen/hours', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ hours }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      showToast('Operating hours saved!');
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      <p className="text-sm text-gray-400 mt-3">Loading hours...</p>
    </div>
  );

  const openDays   = hours.filter(d => d.isOpen).length;
  const closedDays = 7 - openDays;

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
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Operating Hours</h1>
          <p className="text-xs text-gray-400">Set your canteen's opening and closing times</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={setAllWeekdays}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Reset Weekdays
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Hours'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-800 dark:text-white">{openDays}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Open Days</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-400 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-800 dark:text-white">{closedDays}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Closed Days</p>
              </div>
            </div>
          </div>

          {/* Days */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-700/30">
              <div className="grid grid-cols-12 gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <div className="col-span-3">Day</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Open Time</div>
                <div className="col-span-3">Close Time</div>
                <div className="col-span-1"></div>
              </div>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {hours.map((day, idx) => (
                <div key={day.day || idx}
                  className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition-colors ${
                    !day.isOpen ? 'opacity-50' : ''
                  }`}>

                  <div className="col-span-3">
                    <p className={`text-sm font-bold ${
                      ['Saturday','Sunday'].includes(day.day)
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-800 dark:text-white'
                    }`}>{day.day}</p>
                    <p className="text-[10px] text-gray-400">
                      {['Saturday','Sunday'].includes(day.day) ? 'Weekend' : 'Weekday'}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      day.isOpen
                        ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${day.isOpen ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {day.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  <div className="col-span-3">
                    <input type="time" value={day.openTime || '08:00'}
                      disabled={!day.isOpen}
                      onChange={e => setTime(idx, 'openTime', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 disabled:cursor-not-allowed transition-all" />
                  </div>

                  <div className="col-span-3">
                    <input type="time" value={day.closeTime || '17:00'}
                      disabled={!day.isOpen}
                      onChange={e => setTime(idx, 'closeTime', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 disabled:cursor-not-allowed transition-all" />
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => toggle(idx)}
                      className={`transition-colors ${day.isOpen ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`}>
                      {day.isOpen
                        ? <ToggleRight className="w-7 h-7" />
                        : <ToggleLeft  className="w-7 h-7" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-gray-400 text-center pb-4">
            Changes will be visible to students after saving.
          </p>
        </div>
      </div>
    </div>
  );
}