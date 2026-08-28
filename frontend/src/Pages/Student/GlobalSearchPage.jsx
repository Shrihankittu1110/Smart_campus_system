import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, SlidersHorizontal, Plus, Check,
  Store, X, Utensils, ChevronDown
} from "lucide-react";
import { canteenAPI, cartAPI } from "../../api/studentApi";
import { useAuth } from "../../context/AuthContext";
import { buildImgUrl } from "../../utils/imageUrl";

const CATEGORIES = ["All", "Rice", "Breakfast", "Snacks", "Desserts", "Drinks", "Other"];

const PRICE_OPTIONS = [
  { label: "Any Price",     value: "" },
  { label: "Under RS 100",  value: "100" },
  { label: "Under RS 250",  value: "250" },
  { label: "Under RS 500",  value: "500" },
  { label: "Under RS 1000", value: "1000" },
  { label: "Under RS 1500", value: "1500" },
  { label: "Under RS 2000", value: "2000" },
];

function MealSkeleton() {
  return (
    <div className="card flex gap-4 items-center">
      <div className="skeleton w-16 h-16 rounded-xl flex-shrink-0" />
      <div className="flex-1">
        <div className="skeleton h-4 w-2/3 mb-2" />
        <div className="skeleton h-3 w-1/3 mb-2" />
        <div className="skeleton h-3 w-1/4" />
      </div>
      <div className="skeleton h-9 w-24 rounded-xl flex-shrink-0" />
    </div>
  );
}

export default function GlobalSearchPage() {
  const { user } = useAuth();
  const studentId = user?._id || user?.id;
  const navigate = useNavigate();

  const [query, setQuery]       = useState("");
  const [category, setCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(true);
  const [addedMap, setAddedMap] = useState({});
  const [toast, setToast]       = useState("");
  const debounceRef = useRef(null);

  // Trigger search whenever query, category, or price changes
  useEffect(() => {
    // No filters active — reset to initial state
    // Mark as searched immediately so UI updates
    setSearched(true);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch();
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query, category, maxPrice]);

  const doSearch = async () => {
    setLoading(true);
    try {
      const res = await canteenAPI.globalSearch(query, category, maxPrice);
      setResults(res.success ? res.data : []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleAddToCart = async (meal) => {
    const res = await cartAPI.addToCart({
      studentId: studentId || "64f1a2b3c4d5e6f7a8b9c0d1",
      mealId: meal._id,
      quantity: 1,
    });
    if (res.success) {
      setAddedMap((prev) => ({ ...prev, [meal._id]: true }));
      setToast(`${meal.name} added to cart`);
      setTimeout(() => setToast(""), 2500);
      setTimeout(() => setAddedMap((prev) => ({ ...prev, [meal._id]: false })), 2000);
    }
  };

  const clearAll = () => {
    setQuery("");
    setCategory("All");
    setMaxPrice("");
  };

  const selectedPriceLabel = PRICE_OPTIONS.find((o) => o.value === maxPrice)?.label || "Any Price";
  const hasActiveFilter = query || category !== "All" || maxPrice;

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="page-header animate-fade-down">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #16a34a20, #4ade8010)" }}
            >
              <Search size={20} className="text-green-600" />
            </div>
            <div>
              <h1 className="section-title">Search <span className="text-gradient">Meals</span></h1>
              <p className="section-subtitle">Find meals across all canteens instantly</p>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="glass-card mb-5 animate-fade-up">

          {/* Search input — placeholder matches /search for breakfast/i */}
          <div className="relative mb-4">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for breakfast, nasi lemak, teh tarik..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-11 pr-10 py-3 text-base"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category buttons + Price dropdown */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap gap-2 flex-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    category === cat
                      ? "text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-50 hover:text-green-700"
                  }`}
                  style={category === cat ? { background: "linear-gradient(135deg, #16a34a, #15803d)" } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Price select dropdown */}
            <div className="relative flex-shrink-0">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <SlidersHorizontal size={13} className={maxPrice ? "text-green-600" : "text-gray-400"} />
              </div>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className={`appearance-none pl-8 pr-8 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  maxPrice
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-green-300"
                }`}
              >
                {PRICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Active filters row — "Clear all" button matches /clear all/i */}
          {hasActiveFilter && (
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400">Active:</span>
              {category !== "All" && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-800">
                  {category}
                  <button onClick={() => setCategory("All")}><X size={10} /></button>
                </span>
              )}
              {maxPrice && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-800">
                  {selectedPriceLabel}
                  <button onClick={() => setMaxPrice("")}><X size={10} /></button>
                </span>
              )}
              <button
                onClick={clearAll}
                className="text-xs text-red-500 hover:text-red-600 ml-auto flex items-center gap-1"
              >
                <X size={11} /> Clear all
              </button>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="fixed top-5 right-5 flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-xl animate-slide-left z-50"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
          >
            <Check size={15} /> {toast}
          </div>
        )}

        {/* Initial empty state — matches /start searching/i */}
        {!searched && !loading && (
          <div className="card text-center py-16 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
              <Search size={24} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-600 dark:text-gray-400 mb-1">Start searching</p>
            <p className="text-sm text-gray-400">Type a meal name or select a category above</p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <MealSkeleton key={i} />)}
          </div>
        )}

        {/* Results count — matches /found/i */}
        {!loading && searched && (
          <p className="text-sm text-gray-500 mb-4 animate-fade-in">
            Found <span className="font-bold text-gray-800 dark:text-white">{results.length}</span>{" "}
            meal{results.length !== 1 ? "s" : ""}
            {query && <> for "<span className="text-green-600">{query}</span>"</>}
          </p>
        )}

        {/* No results */}
        {!loading && searched && results.length === 0 && (
          <div className="card text-center py-16 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
              <Utensils size={24} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No meals found</p>
            <p className="text-sm text-gray-400">Try a different search term or category</p>
          </div>
        )}

        {/* Results list */}
        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((meal, i) => (
              <div
                key={meal._id}
                className={`card flex items-center gap-4 animate-fade-up animation-delay-${Math.min((i + 1) * 50, 500)} hover:shadow-md transition-all duration-300`}
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {meal.image
                    ? <img src={buildImgUrl(meal.image)} alt={meal.name} className="w-full h-full object-cover" />
                    : <Utensils size={22} className="text-green-200 dark:text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{meal.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="badge badge-green text-[10px]">{meal.category}</span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Store size={10} /> {meal.canteen?.canteenName || meal.canteen?.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">{meal.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                    <span className="text-xs text-gray-400 mr-0.5">RS</span>{Number(meal.basePrice || meal.price || 0).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleAddToCart(meal)}
                    disabled={addedMap[meal._id]}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      addedMap[meal._id]
                        ? "bg-green-50 dark:bg-green-900/20 text-green-600 cursor-not-allowed"
                        : "btn-primary"
                    }`}
                  >
                    {addedMap[meal._id] ? <><Check size={12} /> Added</> : <><Plus size={12} /> Add</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
