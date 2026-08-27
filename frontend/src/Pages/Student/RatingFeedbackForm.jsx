import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft, CheckCircle, AlertCircle, Utensils } from "lucide-react";
import { trackingAPI } from "../../api/studentApi";
import { useAuth } from "../../context/AuthContext";   // ✅ use the same auth hook as everywhere else

const QUICK_TAGS = [
  "Delicious", "Good Portion", "Fast Service", "Value for Money",
  "Fresh Food", "Friendly Staff", "Clean Area", "Would Recommend",
];

export default function RatingFeedbackForm() {
  const { orderId, canteenId } = useParams();
  const navigate = useNavigate();

  // ✅ Get user from AuthContext — same as the rest of the app
  const { user } = useAuth();
  const studentId = user?._id || user?.id;

  const [order, setOrder]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [rating, setRating]         = useState(0);
  const [hover, setHover]           = useState(0);
  const [feedback, setFeedback]     = useState("");
  const [tags, setTags]             = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    trackingAPI.trackStatus(orderId).then((res) => {
      if (res.success) setOrder(res.data);
      setLoading(false);
    });
  }, [orderId]);

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) { setError("Please select a rating"); return; }

    // ✅ Guard: if studentId still null, show a clear error instead of a cryptic backend crash
    if (!studentId) {
      setError("Could not identify your account. Please log out and log back in.");
      return;
    }

    setSubmitting(true);
    setError("");

    const res = await trackingAPI.submitRating({
      studentId,
      orderId,
      canteenId,
      rating,
      feedback,
      tags,
    });

    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.message || "Failed to submit. Please try again.");
    }
    setSubmitting(false);
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent!"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 w-80">
          <div className="skeleton h-8 w-48 mx-auto" />
          <div className="skeleton h-4 w-32 mx-auto" />
          <div className="skeleton h-32 w-full rounded-2xl mt-6" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card max-w-sm w-full text-center py-12 animate-scale-up">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Your feedback helps improve the canteen experience
          </p>
          <div className="flex justify-center gap-1 mb-6">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} size={24}
                className={s <= rating ? "text-amber-400" : "text-gray-200 dark:text-gray-600"}
                fill={s <= rating ? "currentColor" : "none"} />
            ))}
          </div>
          <button onClick={() => navigate("/student/orders")} className="btn-primary w-full">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">

        {/* Back */}
        <button onClick={() => navigate("/student/orders")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors mb-6 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Orders
        </button>

        <div className="card animate-fade-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-3">
              <Utensils size={26} className="text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Rate Your Order</h1>
            {order && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Order #{orderId?.slice(-8).toUpperCase()} · RS {order.totalAmount?.toFixed(2)}
              </p>
            )}
          </div>

          {/* Star rating */}
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              How was your experience?
            </p>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map((star) => (
                <button key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110">
                  <Star
                    size={36}
                    className={`transition-all duration-150 ${
                      star <= (hover || rating) ? "text-amber-400" : "text-gray-200 dark:text-gray-600"
                    }`}
                    fill={star <= (hover || rating) ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            {(hover || rating) > 0 && (
              <p className="text-sm font-semibold text-amber-500 mt-2 animate-fade-in">
                {ratingLabels[hover || rating]}
              </p>
            )}
          </div>

          {/* Quick tags */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              What did you like? (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    tags.includes(tag)
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-green-300"
                  }`}>
                  {tags.includes(tag) && <span className="w-1 h-1 rounded-full bg-green-500" />}
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback textarea */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
              Additional Feedback (optional)
            </label>
            <textarea
              placeholder="Tell us more about your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value.slice(0, 300))}
              rows={4}
              className="input-field w-full resize-none text-sm"
            />
            <p className="text-[11px] text-gray-400 text-right mt-1">{feedback.length}/300</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4 animate-fade-in">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={submitting || rating === 0}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40">
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
            ) : (
              <><Star size={15} fill="currentColor" /> Submit Rating</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}