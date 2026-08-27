//frontend/src/Pages/canteen/ReviewsPage.jsx
import { useState, useEffect } from 'react';
import {
  Star, MessageSquare, Send, ChevronDown, Search,
  Loader2, CheckCircle, XCircle, User, X
} from 'lucide-react';

const API = '/api/canteen/reviews';

const FILTERS = ['All', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${
      toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
      {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
      {toast.msg}
    </div>
  );
}

function StarDisplay({ rating, size = 'sm' }) {
  const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${s} ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-600'}`} />
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div className="bg-yellow-400 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-6">{count}</span>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('All');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText]   = useState('');
  const [sending, setSending]       = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (j.success) setReviews(j.data);
    } catch { showToast('Failed to load reviews', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  // Send reply
  const handleReply = async (reviewId) => {
    if (!replyText.trim()) { showToast('Reply cannot be empty', 'error'); return; }
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${API}/${reviewId}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      showToast('Reply sent!');
      setReplyingTo(null);
      setReplyText('');
      // Update locally
      setReviews(prev => prev.map(rv =>
        rv._id === reviewId ? { ...rv, reply: replyText.trim(), repliedAt: new Date() } : rv
      ));
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
    finally { setSending(false); }
  };

  // Stats
  const total     = reviews.length;
  const avgRating = total > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
    : '0.0';
  const ratingCounts = [5, 4, 3, 2, 1].map(n => ({
    label: `${n} ★`,
    count: reviews.filter(r => r.rating === n).length,
  }));

  // Filter
  const filtered = reviews.filter(r => {
    const matchSearch = r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase()) ||
      r.mealName?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || r.rating === parseInt(filter[0]);
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Reviews & Feedback</h1>
          <p className="text-xs text-gray-400">{total} reviews · {avgRating} avg rating</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth: 'none' }}>

        {/* ── Rating Summary ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
          <div className="grid grid-cols-2 gap-6">
            {/* Left — big rating */}
            <div className="flex flex-col items-center justify-center border-r border-gray-100 dark:border-gray-700/60">
              <p className="text-6xl font-black text-gray-800 dark:text-white">{avgRating}</p>
              <StarDisplay rating={Math.round(parseFloat(avgRating))} size="lg" />
              <p className="text-xs text-gray-400 mt-1">{total} reviews</p>
            </div>
            {/* Right — bars */}
            <div className="space-y-2 justify-center flex flex-col">
              {ratingCounts.map(({ label, count }) => (
                <RatingBar key={label} label={label} count={count} total={total} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by student, meal or comment..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all" />
          </div>
          <div className="relative">
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all cursor-pointer">
              {FILTERS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <span className="text-xs text-gray-400">{filtered.length} results</span>
        </div>

        {/* ── Reviews List ── */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 animate-spin text-green-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-4xl mb-3">⭐</p>
            <p className="font-semibold">No reviews yet</p>
            <p className="text-sm mt-1">Reviews from students will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(review => (
              <div key={review._id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5 space-y-3">

                {/* Review header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">
                        {review.studentName || 'Anonymous'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StarDisplay rating={review.rating} />
                    {review.mealName && (
                      <p className="text-[10px] text-gray-400 mt-1">for {review.mealName}</p>
                    )}
                  </div>
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {review.comment}
                  </p>
                )}

                {/* Existing reply */}
                {review.reply && (
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400 mb-1">
                      Your Reply
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{review.reply}</p>
                    {review.repliedAt && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(review.repliedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Reply input */}
                {replyingTo === review._id ? (
                  <div className="space-y-2">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      rows={3}
                      placeholder="Write your reply..."
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none transition-all"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                      <button onClick={() => handleReply(review._id)} disabled={sending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white transition-colors">
                        {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Send Reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setReplyingTo(review._id);
                      setReplyText(review.reply || '');
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-700 transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {review.reply ? 'Edit Reply' : 'Reply'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}