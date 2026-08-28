import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ShoppingCart, SlidersHorizontal, Plus, Check,
  AlertCircle, Utensils, X, Star, ChevronDown, Upload,
  Loader2, Send, Phone, Mail, Calendar, Flag
} from "lucide-react";
import { canteenAPI, cartAPI } from "../../api/studentApi";
import { useAuth } from "../../context/AuthContext";
import { buildImgUrl } from "../../utils/imageUrl";
import { apiUrl } from "../../utils/apiUrl";

const CATEGORIES = ["All", "Rice", "Breakfast", "Snacks", "Desserts", "Drinks", "Other"];

const COMPLAINT_CATEGORIES = [
  "Order Issue", "Food Quality", "Service", "Payment",
  "App Bug", "Performance", "Feature Idea", "Other"
];

const PRIORITY_LEVELS = [
  { value: "Low",    color: "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400",   dot: "bg-blue-500" },
  { value: "Medium", color: "text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  { value: "High",   color: "text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  { value: "Urgent", color: "text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400",         dot: "bg-red-500" },
];

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
    <div className="card">
      <div className="skeleton w-full h-36 mb-3" />
      <div className="skeleton h-3 w-16 mb-2" />
      <div className="skeleton h-5 w-3/4 mb-2" />
      <div className="skeleton h-3 w-full mb-1" />
      <div className="skeleton h-3 w-2/3 mb-4" />
      <div className="flex justify-between items-center">
        <div className="skeleton h-5 w-16" />
        <div className="skeleton h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export default function MealListingPage() {
  const { canteenId } = useParams();
  const { user } = useAuth();
  const studentId    = user?._id || user?.id;
  const studentName  = user?.name  || "Student";
  const studentEmail = user?.email || "";
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [canteen, setCanteen]   = useState(null);
  const [meals, setMeals]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [addedMap, setAddedMap] = useState({});
  const [toast, setToast]       = useState("");

  // ── FIX 3: different-canteen confirmation dialog ──────────────────────────
  const [pendingMeal, setPendingMeal]           = useState(null); // meal waiting for confirm
  const [showCanteenConfirm, setShowCanteenConfirm] = useState(false);

  // Rating modal state
  const [ratingModal, setRatingModal]         = useState(false);
  const [canteenRating, setCanteenRating]     = useState(0);
  const [canteenReview, setCanteenReview]     = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Complaint modal state
  const [reportModal, setReportModal]               = useState(false);
  const [reportCategory, setReportCategory]         = useState("");
  const [reportDesc, setReportDesc]                 = useState("");
  const [reportPriority, setReportPriority]         = useState("");
  const [reportDate, setReportDate]                 = useState("");
  const [reportContact, setReportContact]           = useState("Email");
  const [reportPhone, setReportPhone]               = useState("");
  const [reportPhoto, setReportPhoto]               = useState(null);
  const [reportPhotoPreview, setReportPhotoPreview] = useState(null);
  const [reportSubmitting, setReportSubmitting]     = useState(false);
  const [reportSubmitted, setReportSubmitted]       = useState(false);
  const [reportErrors, setReportErrors]             = useState({});
  const [showConfirm, setShowConfirm]               = useState(false);
  const [touched, setTouched]                       = useState({});

  useEffect(() => {
    canteenAPI.getById(canteenId).then((res) => {
      if (res.success) setCanteen(res.data);
    });
    fetchMeals();
  }, [canteenId]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (ratingModal) closeRatingModal();
        if (reportModal) closeReportModal();
        if (showCanteenConfirm) { setShowCanteenConfirm(false); setPendingMeal(null); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ratingModal, reportModal, showCanteenConfirm]);

  const fetchMeals = async (cat = "All", price = "") => {
    setLoading(true);
    let filters = "";
    if (cat !== "All") filters += `category=${cat}&`;
    if (price) filters += `maxPrice=${price}&`;
    filters += "available=true";
    const res = await canteenAPI.getMeals(canteenId, filters);
    if (res.success) setMeals(res.data);
    setLoading(false);
  };

  const handleCategoryFilter = (cat) => { setCategory(cat); fetchMeals(cat, maxPrice); };
  const handlePriceFilter    = (e) => { const p = e.target.value; setMaxPrice(p); fetchMeals(category, p); };

  // ── FIX 3: handle the 409 DIFFERENT_CANTEEN response ─────────────────────
  const handleAddToCart = async (meal, confirmClear = false) => {
    const payload = { studentId, mealId: meal._id, quantity: 1 };
    if (confirmClear) payload.confirmClear = true;

    const res = await cartAPI.addToCart(payload);

    if (!res.success && res.code === "DIFFERENT_CANTEEN") {
      // Show confirmation dialog — keep the meal reference so we can retry
      setPendingMeal(meal);
      setShowCanteenConfirm(true);
      return;
    }

    if (res.success) {
      setAddedMap((prev) => ({ ...prev, [meal._id]: true }));
      setToast(`${meal.name} added to cart!`);
      setTimeout(() => setToast(""), 2500);
      setTimeout(() => setAddedMap((prev) => ({ ...prev, [meal._id]: false })), 2000);
    }
  };

  // User confirmed clearing the old cart
  const handleConfirmCanteenSwitch = async () => {
    setShowCanteenConfirm(false);
    if (pendingMeal) {
      await handleAddToCart(pendingMeal, true);
      setPendingMeal(null);
    }
  };

  const closeRatingModal = () => {
    setRatingModal(false);
    setRatingSubmitted(false);
    setCanteenRating(0);
    setCanteenReview("");
  };

  const submitCanteenRating = () => {
    if (canteenRating === 0) return;
    setRatingSubmitted(true);
    setTimeout(() => closeRatingModal(), 1500);
  };

  // ── Report validation ──
  const validate = (fields = {}) => {
    const e = {};
    const cat  = fields.reportCategory ?? reportCategory;
    const desc = fields.reportDesc     ?? reportDesc;
    const pri  = fields.reportPriority ?? reportPriority;
    const date = fields.reportDate     ?? reportDate;
    const con  = fields.reportContact  ?? reportContact;
    const ph   = fields.reportPhone    ?? reportPhone;

    if (!cat)                          e.reportCategory = "Please select a category.";
    if (!pri)                          e.reportPriority = "Please select a priority level.";
    if (!date)                         e.reportDate     = "Please select the date of incident.";
    if (!desc.trim())                  e.reportDesc     = "Description is required.";
    else if (desc.trim().length < 20)  e.reportDesc     = `Too short — ${20 - desc.trim().length} more characters needed.`;
    else if (desc.trim().length > 500) e.reportDesc     = "Maximum 500 characters allowed.";
    if (con === "Phone" && !ph.trim()) e.reportPhone    = "Phone number is required.";
    else if (con === "Phone" && !/^\+?\d{7,15}$/.test(ph.trim())) e.reportPhone = "Enter a valid phone number.";
    return e;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setReportErrors(validate({ [field]: undefined }));
  };

  const handleReportChange = (field, value) => {
    const map = { reportCategory, reportDesc, reportPriority, reportDate, reportContact, reportPhone };
    map[field] = value;
    if (field === "reportCategory") setReportCategory(value);
    if (field === "reportDesc")     setReportDesc(value);
    if (field === "reportPriority") setReportPriority(value);
    if (field === "reportDate")     setReportDate(value);
    if (field === "reportContact")  setReportContact(value);
    if (field === "reportPhone")    setReportPhone(value);
    if (touched[field]) setReportErrors(validate(map));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setReportErrors((prev) => ({ ...prev, photo: "File too large. Max 5MB." }));
      return;
    }
    setReportErrors((prev) => { const n = { ...prev }; delete n.photo; return n; });
    setReportPhoto(file);
    setReportPhotoPreview(URL.createObjectURL(file));
  };

  const handleReportSubmitClick = () => {
    setTouched({
      reportCategory: true, reportDesc: true, reportPriority: true,
      reportDate: true, reportContact: true, reportPhone: true
    });
    const errs = validate();
    setReportErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    setReportSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("submittedByName",  studentName);
      formData.append("submittedByEmail", studentEmail);
      formData.append("submitterId",      studentId);
      formData.append("canteenId",        canteenId);
      formData.append("category",         reportCategory);
      formData.append("description",      reportDesc);
      formData.append("priority",         reportPriority);
      formData.append("incidentDate",     reportDate);
      formData.append("contactPreference", reportContact);
      if (reportContact === "Phone") formData.append("contactPhone", reportPhone);
      if (reportPhoto) formData.append("attachment", reportPhoto);

      const res  = await fetch(apiUrl("/api/student/complaints"), { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setReportSubmitted(true);
      else setReportErrors({ submit: data.message || "Failed to submit. Please try again." });
    } catch {
      setReportErrors({ submit: "Network error. Please try again." });
    }
    setReportSubmitting(false);
  };

  const closeReportModal = () => {
    setReportModal(false); setReportSubmitted(false); setReportCategory(""); setReportDesc("");
    setReportPriority(""); setReportDate(""); setReportContact("Email"); setReportPhone("");
    setReportPhoto(null); setReportPhotoPreview(null); setReportErrors({}); setTouched({});
    setShowConfirm(false);
  };

  const selectedPriceLabel = PRICE_OPTIONS.find((o) => o.value === maxPrice)?.label || "Any Price";
  const descLen = reportDesc.trim().length;

  const ErrMsg = ({ field }) =>
    reportErrors[field] && touched[field]
      ? <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{reportErrors[field]}</p>
      : null;

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Back to Canteens */}
        <button
          onClick={() => navigate("/student/canteens")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Canteens
        </button>

        {/* Canteen Header */}
        {canteen && (
          <div className="glass-card mb-6 animate-fade-down">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {canteen.image
                  ? <img src={buildImgUrl(canteen.image)} alt={canteen.name} className="w-full h-full object-cover" />
                  : <Utensils size={24} className="text-green-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{canteen.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{canteen.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setRatingModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors"
                >
                  <Star size={13} fill="currentColor" /> Rate Canteen
                </button>
                <button
                  onClick={() => setReportModal(true)}
                  className="btn-secondary flex items-center gap-2 text-xs"
                >
                  <AlertCircle size={13} /> Report
                </button>
                <button
                  onClick={() => navigate("/student/cart")}
                  className="btn-primary flex items-center gap-2"
                >
                  <ShoppingCart size={15} /> Cart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FIX 3: Different-canteen confirmation dialog ── */}
        {showCanteenConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 mx-6 max-w-sm w-full animate-scale-up">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={22} className="text-amber-500" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-center mb-2">
                Replace your cart?
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
                Your cart has items from a different canteen. Adding this item will clear your
                current cart and start a new one.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCanteenConfirm(false); setPendingMeal(null); }}
                  className="btn-secondary flex-1"
                >
                  Keep Cart
                </button>
                <button
                  onClick={handleConfirmCanteenSwitch}
                  className="btn-primary flex-1"
                >
                  Yes, Replace
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Rate Canteen Modal ── */}
        {ratingModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) closeRatingModal(); }}
          >
            <div className="modal bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-80 animate-scale-up">
              {ratingSubmitted ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                    <Check size={28} className="text-green-600" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white">Thank you!</p>
                  <p className="text-sm text-gray-500 mt-1">Your rating has been submitted</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">Rate {canteen?.name}</h3>
                    <button onClick={closeRatingModal}>
                      <X size={18} className="text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                  <div className="flex justify-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setCanteenRating(star)}>
                        <Star
                          size={32}
                          className={`transition-all duration-150 ${star <= canteenRating ? "text-amber-400" : "text-gray-200 dark:text-gray-600"}`}
                          fill={star <= canteenRating ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-xs text-gray-500 mb-4">
                    {["Tap to rate", "Poor", "Fair", "Good", "Very Good", "Excellent!"][canteenRating]}
                  </p>
                  <textarea
                    placeholder="Leave a review (optional)..."
                    value={canteenReview}
                    onChange={(e) => setCanteenReview(e.target.value)}
                    rows={3}
                    className="input-field w-full text-sm resize-none mb-4"
                  />
                  <button
                    onClick={submitCanteenRating}
                    disabled={canteenRating === 0}
                    className="btn-primary w-full disabled:opacity-40"
                  >
                    Submit Rating
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Complaint / Report Modal ── */}
        {reportModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeReportModal(); }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-up max-h-[92vh] overflow-y-auto">

              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Report an Issue</h3>
                    <p className="text-xs text-gray-400">We'll review and get back to you</p>
                  </div>
                </div>
                <button onClick={closeReportModal}>
                  <X size={18} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              {/* Confirm Dialog */}
              {showConfirm && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-2xl">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-6 shadow-2xl animate-scale-up">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Submit this report?</h4>
                    <p className="text-sm text-gray-500 mb-5">
                      Our team will review your complaint and respond via your preferred contact method.
                    </p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">Cancel</button>
                      <button
                        onClick={handleConfirmSubmit}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                        style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                      >
                        Yes, Submit
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {reportSubmitted ? (
                <div className="text-center py-14 px-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Report Submitted!</h4>
                  <p className="text-gray-500 text-sm mb-1">Thank you for your feedback.</p>
                  <p className="text-gray-400 text-xs mb-6">Our team will review it and respond within 24–48 hours.</p>
                  <button onClick={closeReportModal} className="btn-primary px-10">Done</button>
                </div>
              ) : (
                <div className="p-5 space-y-4">

                  {/* Auto student info */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Submitted By (Auto-filled)
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-bold text-green-600 flex-shrink-0">
                        {studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{studentName}</p>
                        <p className="text-xs text-gray-400">{studentEmail}</p>
                      </div>
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        Student
                      </span>
                    </div>
                  </div>

                  {/* Issue Category */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Issue Category <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {COMPLAINT_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => handleReportChange("reportCategory", cat)}
                          onBlur={() => handleBlur("reportCategory")}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all duration-200 ${
                            reportCategory === cat
                              ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                              : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <ErrMsg field="reportCategory" />
                  </div>

                  {/* Priority Level */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      <Flag size={11} className="inline mr-1" />Priority Level <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {PRIORITY_LEVELS.map(({ value, color, dot }) => (
                        <button
                          key={value}
                          onClick={() => handleReportChange("reportPriority", value)}
                          onBlur={() => handleBlur("reportPriority")}
                          className={`flex items-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-semibold justify-center transition-all ${
                            reportPriority === value
                              ? color
                              : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${reportPriority === value ? dot : "bg-gray-300"}`} />
                          {value}
                        </button>
                      ))}
                    </div>
                    <ErrMsg field="reportPriority" />
                  </div>

                  {/* Date of Incident */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      <Calendar size={11} className="inline mr-1" />Date of Incident <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={reportDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => handleReportChange("reportDate", e.target.value)}
                      onBlur={() => handleBlur("reportDate")}
                      className={`input-field w-full text-sm ${touched.reportDate && reportErrors.reportDate ? "border-red-400 focus:ring-red-400" : ""}`}
                    />
                    <ErrMsg field="reportDate" />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Description <span className="text-red-500">*</span>
                      <span className="font-normal text-gray-400 ml-1">(min 20, max 500 chars)</span>
                    </label>
                    <textarea
                      placeholder="Describe your issue in detail..."
                      value={reportDesc}
                      onChange={(e) => handleReportChange("reportDesc", e.target.value)}
                      onBlur={() => handleBlur("reportDesc")}
                      rows={4}
                      maxLength={500}
                      className={`input-field w-full text-sm resize-none ${touched.reportDesc && reportErrors.reportDesc ? "border-red-400 focus:ring-red-400" : ""}`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <ErrMsg field="reportDesc" />
                      <span className={`text-xs ml-auto ${descLen > 480 ? "text-red-500" : descLen >= 20 ? "text-green-500" : "text-gray-400"}`}>
                        {descLen}/500
                      </span>
                    </div>
                  </div>

                  {/* Contact Preference */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Contact Preference <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3 mb-3">
                      {["Email", "Phone"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleReportChange("reportContact", opt)}
                          className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            reportContact === opt
                              ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                              : "border-gray-200 dark:border-gray-600 text-gray-500 hover:border-green-300"
                          }`}
                        >
                          {opt === "Email" ? <Mail size={13} /> : <Phone size={13} />} {opt}
                        </button>
                      ))}
                    </div>
                    {reportContact === "Email" && (
                      <div className="input-field flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed">
                        <Mail size={13} className="text-green-500 flex-shrink-0" />{studentEmail}
                      </div>
                    )}
                    {reportContact === "Phone" && (
                      <>
                        <input
                          type="tel"
                          placeholder="+94 77 123 4567"
                          value={reportPhone}
                          onChange={(e) => handleReportChange("reportPhone", e.target.value)}
                          onBlur={() => handleBlur("reportPhone")}
                          className={`input-field w-full text-sm ${touched.reportPhone && reportErrors.reportPhone ? "border-red-400 focus:ring-red-400" : ""}`}
                        />
                        <ErrMsg field="reportPhone" />
                      </>
                    )}
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Attach Photo <span className="text-gray-400 font-normal">(optional, max 5MB)</span>
                    </label>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    {reportPhotoPreview ? (
                      <div className="relative">
                        <img src={reportPhotoPreview} alt="Preview" className="w-full h-40 object-cover rounded-xl border border-gray-200 dark:border-gray-600" />
                        <button
                          onClick={() => { setReportPhoto(null); setReportPhotoPreview(null); }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl py-5 flex flex-col items-center gap-1.5 text-gray-400 hover:border-green-400 hover:text-green-500 transition-all"
                      >
                        <Upload size={20} />
                        <span className="text-xs font-medium">Click to upload screenshot</span>
                        <span className="text-xs">JPG, PNG up to 5MB</span>
                      </button>
                    )}
                    {reportErrors.photo && <p className="text-xs text-red-500 mt-1">{reportErrors.photo}</p>}
                  </div>

                  {/* Submit error */}
                  {reportErrors.submit && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <X size={14} className="text-red-500 flex-shrink-0" />
                      <p className="text-red-600 dark:text-red-400 text-xs">{reportErrors.submit}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleReportSubmitClick}
                    disabled={reportSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-70"
                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                  >
                    {reportSubmitting
                      ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                      : <><Send size={16} /> Submit Report</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="card mb-6 animate-fade-up">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2 flex-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    category === cat
                      ? "text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700"
                  }`}
                  style={category === cat ? { background: "linear-gradient(135deg, #16a34a, #15803d)" } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative flex-shrink-0">
              <SlidersHorizontal
                size={13}
                className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10 ${maxPrice ? "text-green-600" : "text-gray-400"}`}
              />
              <select
                value={maxPrice}
                onChange={handlePriceFilter}
                className={`appearance-none pl-8 pr-8 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-green-400 ${
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
          {(category !== "All" || maxPrice) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400">Active filters:</span>
              {category !== "All" && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-800">
                  {category} <button onClick={() => handleCategoryFilter("All")}><X size={10} /></button>
                </span>
              )}
              {maxPrice && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-800">
                  {selectedPriceLabel} <button onClick={() => { setMaxPrice(""); fetchMeals(category, ""); }}><X size={10} /></button>
                </span>
              )}
              <button
                onClick={() => { setCategory("All"); setMaxPrice(""); fetchMeals("All", ""); }}
                className="text-xs text-red-500 hover:text-red-600 ml-auto"
              >
                Clear all
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

        {/* Meals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading && [1, 2, 3, 4, 5, 6].map((i) => <MealSkeleton key={i} />)}
          {!loading && meals.map((meal, i) => (
            <div
              key={meal._id}
              className={`card group animate-fade-up animation-delay-${Math.min((i + 1) * 100, 500)} flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
            >
              <div className="w-full h-36 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 mb-3 overflow-hidden flex items-center justify-center">
                {meal.image
                  ? <img src={buildImgUrl(meal.image)} alt={meal.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <Utensils size={32} className="text-green-200 dark:text-gray-500" />}
              </div>
              <span className="badge badge-green mb-2 self-start text-[11px]">{meal.category}</span>
              <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug mb-1">{meal.name}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mb-3 flex-1 line-clamp-2">{meal.description}</p>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50 dark:border-gray-700">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  <span className="text-xs font-medium text-gray-400 mr-0.5">RS</span>
                  {(meal.basePrice || meal.price || 0).toFixed(2)}
                </span>
                <button
                  onClick={() => handleAddToCart(meal)}
                  disabled={addedMap[meal._id]}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    addedMap[meal._id]
                      ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 cursor-not-allowed"
                      : "btn-primary"
                  }`}
                >
                  {addedMap[meal._id] ? <><Check size={13} /> Added</> : <><Plus size={13} /> Add to Cart</>}
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && meals.length === 0 && (
          <div className="card text-center py-20 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
              <Utensils size={24} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No meals found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
