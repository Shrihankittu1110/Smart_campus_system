import { useEffect, useMemo, useState } from 'react';
import { Clock, Loader2, MapPin, RefreshCw, Ticket, UsersRound } from 'lucide-react';
import { canteenAPI } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/apiUrl';

const queueHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export default function QueueTokenPage() {
  const { token } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const selected = useMemo(
    () => canteens.find((canteen) => canteen._id === selectedCanteen),
    [canteens, selectedCanteen]
  );

  const fetchStatus = async (canteenId = selectedCanteen) => {
    if (!token || !canteenId) return;
    try {
      const res = await fetch(apiUrl(`/api/queue/status?canteenId=${canteenId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setStatus(json.data);
    } catch {
      setMessage('Unable to load queue status right now.');
    }
  };

  const loadQueue = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [canteenRes, myTokenRes] = await Promise.all([
        canteenAPI.getAll(),
        fetch(apiUrl('/api/queue/my-token'), { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json()),
      ]);

      const list = canteenRes.success ? canteenRes.data : [];
      setCanteens(list);

      const activeCanteenId = myTokenRes.data?.token?.canteen?._id || list[0]?._id || '';
      setSelectedCanteen(activeCanteenId);

      if (myTokenRes.data?.status) {
        setStatus(myTokenRes.data.status);
      } else if (activeCanteenId) {
        await fetchStatus(activeCanteenId);
      }
    } catch {
      setMessage('Unable to load queue details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [token]);

  useEffect(() => {
    if (!selectedCanteen) return undefined;
    fetchStatus(selectedCanteen);
    const timer = setInterval(() => fetchStatus(selectedCanteen), 10000);
    return () => clearInterval(timer);
  }, [selectedCanteen, token]);

  const generateToken = async () => {
    if (!selectedCanteen) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(apiUrl('/api/queue/tokens'), {
        method: 'POST',
        headers: queueHeaders(token),
        body: JSON.stringify({ canteenId: selectedCanteen }),
      });
      const json = await res.json();
      setMessage(json.message || (json.success ? 'Token generated.' : 'Unable to generate token.'));
      if (json.success) setStatus(json.data);
    } catch {
      setMessage('Unable to generate token.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="page-header">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="section-title">Queue <span className="text-gradient">Tokens</span></h1>
              <p className="section-subtitle">Get your pickup token and follow the live queue.</p>
            </div>
            <button onClick={() => fetchStatus()} className="btn-secondary flex items-center justify-center gap-2">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <section className="card h-fit">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Canteen</label>
            <select
              value={selectedCanteen}
              onChange={(event) => {
                setSelectedCanteen(event.target.value);
                setStatus(null);
                setMessage('');
              }}
              className="input-field mt-2"
            >
              {canteens.map((canteen) => (
                <option key={canteen._id} value={canteen._id}>
                  {canteen.canteenName || canteen.name}
                </option>
              ))}
            </select>

            {selected && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <MapPin size={15} className="text-green-500" />
                {selected.location || 'On Campus'}
              </div>
            )}

            <button
              onClick={generateToken}
              disabled={saving || !selectedCanteen || status?.myToken}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Ticket size={17} />}
              {status?.myToken ? 'Token Active' : 'Generate Token'}
            </button>

            {message && <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{message}</p>}
          </section>

          <section className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card">
                <p className="text-xs font-semibold text-gray-400">Current Token</p>
                <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                  {status?.currentToken?.tokenCode || 'None'}
                </p>
              </div>
              <div className="card">
                <p className="text-xs font-semibold text-gray-400">Estimated Wait</p>
                <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                  {status?.myToken ? `${status.estimatedWaitMinutes} min` : '--'}
                </p>
              </div>
              <div className="card">
                <p className="text-xs font-semibold text-gray-400">Waiting Now</p>
                <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                  {status?.waitingCount ?? 0}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Your Queue Status</p>
                  <p className="text-xs text-gray-400 mt-1">Live updates refresh every 10 seconds.</p>
                </div>
                <UsersRound className="w-5 h-5 text-green-500" />
              </div>

              {status?.myToken ? (
                <div className="mt-6 rounded-xl border border-green-100 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400">Your token</p>
                      <p className="text-5xl font-black text-green-700 dark:text-green-300 mt-1">
                        {status.myToken.tokenCode}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <span className="badge-green">Position {status.myPosition}</span>
                      <span className="badge-blue"><Clock size={13} /> {status.estimatedWaitMinutes} min</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 py-12 text-center text-gray-400">
                  <Ticket className="w-10 h-10 mx-auto mb-3" />
                  <p className="text-sm">Generate a token to join this queue.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
