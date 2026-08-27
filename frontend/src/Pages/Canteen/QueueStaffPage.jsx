import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Loader2, RefreshCw, Ticket, UsersRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/apiUrl';

export default function QueueStaffPage() {
  const { token } = useAuth();
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');
  const [message, setMessage] = useState('');

  const fetchQueue = async (quiet = false) => {
    if (!token) return;
    if (!quiet) setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/queue/staff'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setQueue(json.data);
      } else {
        setMessage(json.message || 'Unable to load queue.');
      }
    } catch {
      setMessage('Unable to load queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const timer = setInterval(() => fetchQueue(true), 10000);
    return () => clearInterval(timer);
  }, [token]);

  const completeToken = async (id) => {
    setUpdating(id);
    setMessage('');
    try {
      const res = await fetch(apiUrl(`/api/queue/staff/tokens/${id}/complete`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setMessage(json.message || (json.success ? 'Token completed.' : 'Unable to complete token.'));
      if (json.success) setQueue((current) => ({ ...current, ...json.data }));
    } catch {
      setMessage('Unable to complete token.');
    } finally {
      setUpdating('');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  const tokens = queue?.tokens || [];

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900 px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Queue Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {queue?.canteen?.canteenName || queue?.canteen?.name || 'Canteen'} live service queue
            </p>
          </div>
          <button onClick={() => fetchQueue()} className="btn-secondary flex items-center justify-center gap-2">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400">Current Token</p>
              <Ticket className="w-5 h-5 text-green-500" />
            </div>
            <p className="mt-2 text-4xl font-black text-gray-900 dark:text-white">
              {queue?.currentToken?.tokenCode || 'None'}
            </p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400">Waiting</p>
              <UsersRound className="w-5 h-5 text-blue-500" />
            </div>
            <p className="mt-2 text-4xl font-black text-gray-900 dark:text-white">{queue?.waitingCount || 0}</p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400">Completed Today</p>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="mt-2 text-4xl font-black text-gray-900 dark:text-white">{queue?.completedToday || 0}</p>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/10 dark:text-green-300">
            {message}
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-4">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Live Queue</h2>
              <p className="text-xs text-gray-400 mt-1">Mark served students as completed to advance the current token.</p>
            </div>
            <span className="badge-blue"><Clock size={13} /> {queue?.averageServiceMinutes || 5} min avg</span>
          </div>

          {tokens.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Ticket className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm">No students are waiting right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {tokens.map((item, index) => (
                <div key={item._id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${
                      index === 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {item.tokenCode}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {item.student?.name || 'Student'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Position {index + 1} - Approx. {index * (queue?.averageServiceMinutes || 5)} min wait
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => completeToken(item._id)}
                    disabled={!!updating}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    {updating === item._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Complete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
