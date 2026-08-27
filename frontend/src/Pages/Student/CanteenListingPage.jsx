import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Clock, ChevronRight, UtensilsCrossed, Star, StarOff } from "lucide-react";
import { canteenAPI } from "../../api/studentApi";
import { buildImgUrl } from '../../utils/imageUrl';

const STORAGE_KEY_FAV = "smartmess_fav_canteens";

function SkeletonCard() {
  return (
    <div className="card">
      <div className="skeleton w-full h-40 mb-4 rounded-xl" />
      <div className="skeleton h-5 w-2/3 mb-2" />
      <div className="skeleton h-3 w-full mb-1" />
      <div className="skeleton h-3 w-4/5 mb-4" />
      <div className="flex justify-between">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-4 w-20" />
      </div>
    </div>
  );
}

export default function CanteenListingPage({ publicMode = false }) {
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [favFilter, setFavFilter] = useState(false);
  const [favCanteens, setFavCanteens] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_FAV)) || []; } catch { return []; }
  });
  const navigate = useNavigate();
  const getMealsPath = (canteenId) =>
    publicMode ? `/login/user` : `/student/canteens/${canteenId}/meals`;

  useEffect(() => {
    canteenAPI.getAll().then((res) => {
      if (res.success) {
        
        setCanteens(res.data);
      }
      setLoading(false);
    });
  }, []);

  const toggleFav = (e, id) => {
    e.stopPropagation();
    const updated = favCanteens.includes(id)
      ? favCanteens.filter((f) => f !== id)
      : [...favCanteens, id];
    setFavCanteens(updated);
    localStorage.setItem(STORAGE_KEY_FAV, JSON.stringify(updated));
  };

  const filtered = canteens.filter((c) => {
    if (!c) return false; // ✅ skip null/undefined
    const name = c.canteenName || c.name || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchFav = favFilter ? favCanteens.includes(c._id) : true;
    return matchSearch && matchFav;
  });

  const favList = canteens.filter((c) => c && favCanteens.includes(c._id));

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="page-header animate-fade-down">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="section-title">Browse <span className="text-gradient">Canteens</span></h1>
              <p className="section-subtitle">Discover and order from campus canteens</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #16a34a20, #4ade8010)" }}>
              <UtensilsCrossed size={22} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Favourites Quick Access */}
        {!loading && favList.length > 0 && (
          <div className="mb-6 animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} className="text-amber-500" fill="currentColor" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Your Favourites</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {favList.map((c) => (
                <button key={c._id} onClick={() => navigate(getMealsPath(c._id))}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 transition-all flex-shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {c.image
                      ? <img src={buildImgUrl(c.image)} alt={c.canteenName || c.name} className="w-full h-full object-cover" />
                      : <UtensilsCrossed size={13} className="text-green-500" />}
                  </div>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                    {c.canteenName || c.name}
                  </span>
                  <ChevronRight size={12} className="text-amber-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex items-center gap-3 mb-6 animate-fade-up">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search canteens..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11" />
          </div>
          <button onClick={() => setFavFilter(!favFilter)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              favFilter
                ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-amber-300"
            }`}>
            <Star size={14} className={favFilter ? "text-amber-500" : "text-gray-400"} fill={favFilter ? "currentColor" : "none"} />
            Favourites
          </button>
        </div>

        {/* Count */}
        {!loading && (
          <div className="flex items-center gap-2 mb-5 animate-fade-in">
            <span className="text-sm text-gray-500">
              <span className="font-semibold text-gray-800 dark:text-white">{filtered.length}</span> canteen{filtered.length !== 1 ? "s" : ""}
              {favFilter && <span className="text-amber-600 ml-1">(favourites only)</span>}
            </span>
            {(search || favFilter) && (
              <button onClick={() => { setSearch(""); setFavFilter(false); }}
                className="text-xs text-green-600 hover:underline">Clear filters</button>
            )}
          </div>
        )}

        {/* Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="card text-center py-20 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
              {favFilter
                ? <Star size={28} className="text-gray-300" />
                : <UtensilsCrossed size={28} className="text-gray-400" />}
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg mb-1">
              {favFilter ? "No favourite canteens yet" : "No canteens found"}
            </p>
            <p className="text-sm text-gray-400">
              {favFilter ? "Tap the star on any canteen to save it here" : "Try a different search term"}
            </p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {!loading && filtered.map((canteen, i) => {
            const isFav = favCanteens.includes(canteen._id);
            return (
              <div key={canteen._id}
                onClick={() => navigate(getMealsPath(canteen._id))}
                className={`card-hover animate-fade-up animation-delay-${Math.min((i+1)*100, 500)} relative`}>

                {/* Fav button */}
                <button onClick={(e) => toggleFav(e, canteen._id)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: isFav ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.8)" }}>
                  {isFav
                    ? <Star size={15} className="text-amber-500" fill="currentColor" />
                    : <StarOff size={15} className="text-gray-400" />}
                </button>

                {/* Image */}
                <div className="w-full h-40 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-700 dark:to-gray-600 mb-4 overflow-hidden flex items-center justify-center">
                  {canteen.image
                    ? <img src={buildImgUrl(canteen.image)} alt={canteen.canteenName || canteen.name} className="w-full h-full object-cover" />
                    : <UtensilsCrossed size={40} className="text-green-300 dark:text-gray-500" />}
                </div>

                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1 pr-8">
                  {canteen.canteenName || canteen.name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {canteen.description || "Delicious meals available daily."}
                </p>

                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Clock size={12} className="text-green-500" />
                    {typeof canteen.operatingHours === "string" ? canteen.operatingHours : "Open Now"}
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium">
                    <MapPin size={10} />
                    {canteen.location || "On Campus"}
                  </span>
                </div>

                <button className="btn-primary w-full flex items-center justify-center gap-2">
                  {publicMode ? 'Login to View Menu' : 'View Menu'} <ChevronRight size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
