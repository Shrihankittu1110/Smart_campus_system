import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft, Trash2, Store, ChevronRight } from "lucide-react";
import { cartAPI } from "../../api/studentApi";
import { useAuth } from "../../context/AuthContext";
import { buildImgUrl } from "../../utils/imageUrl";

function CartSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="card flex items-center gap-4">
          <div className="skeleton w-16 h-16 rounded-xl flex-shrink-0" />
          <div className="flex-1">
            <div className="skeleton h-4 w-2/3 mb-2" />
            <div className="skeleton h-3 w-1/3" />
          </div>
          <div className="skeleton h-8 w-24 rounded-xl" />
          <div className="skeleton h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function CartPage() {
  const { user } = useAuth();
  const studentId = user?._id || user?.id;

  const [cart, setCart]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState("");
  const navigate = useNavigate();

  useEffect(() => { if (studentId) fetchCart(); }, [studentId]);

  const fetchCart = async () => {
    setLoading(true);
    const res = await cartAPI.getCart(studentId);
    if (res.success) setCart(res.data);
    setLoading(false);
  };

  const handleIncrease = async (item) => {
    setUpdating(item.meal._id || item.meal);
    const res = await cartAPI.updateItem({
      studentId,
      mealId: item.meal._id || item.meal,
      quantity: item.quantity + 1,
    });
    if (res.success) setCart(res.data);
    else await fetchCart();
    setUpdating("");
  };

  const handleDecrease = async (item) => {
    const mealId = item.meal._id || item.meal;
    setUpdating(mealId);
    if (item.quantity <= 1) {
      const res = await cartAPI.removeItem({ studentId, mealId });
      if (res.success) setCart(res.data);
      else await fetchCart();
    } else {
      const res = await cartAPI.updateItem({ studentId, mealId, quantity: item.quantity - 1 });
      if (res.success) setCart(res.data);
      else await fetchCart();
    }
    setUpdating("");
  };

  const handleRemove = async (item) => {
    const mealId = item.meal._id || item.meal;
    setUpdating(mealId);
    const res = await cartAPI.removeItem({ studentId, mealId });
    if (res.success) setCart(res.data);
    else await fetchCart();
    setUpdating("");
  };

  const handleClear = async () => {
    await cartAPI.clearCart(studentId);
    await fetchCart();
  };

  const items    = cart?.items || [];
  const getPrice = (i) => i.meal?.basePrice || i.meal?.price || i.price || 0;
  const subtotal = items.reduce((s, i) => s + getPrice(i) * i.quantity, 0);
  const canteen  = cart?.canteen;

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="page-header animate-fade-down flex items-start justify-between">
          <div>
            <h1 className="section-title">My <span className="text-gradient">Cart</span></h1>
            <p className="section-subtitle">Review your items before checkout</p>
          </div>
          <button
            onClick={() => navigate("/student/canteens")}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={14} /> Continue Shopping
          </button>
        </div>

        {loading && <CartSkeleton />}

        {!loading && items.length === 0 && (
          <div className="card text-center py-20 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={28} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg mb-1">Your cart is empty</p>
            <p className="text-sm text-gray-400 mb-6">Add some meals to get started!</p>
            <button onClick={() => navigate("/student/canteens")} className="btn-primary mx-auto">
              Browse Canteens
            </button>
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            {/* Canteen banner */}
            {canteen && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 animate-fade-up"
                style={{ background: "linear-gradient(135deg, #16a34a15, #4ade8010)", border: "1px solid #16a34a30" }}
              >
                <Store size={16} className="text-green-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-gray-800 dark:text-white flex-1">
                  {canteen.name || "Canteen"}
                </p>
                <span className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? "s" : ""}</span>
              </div>
            )}

            {/* Cart items */}
            <div className="space-y-3 mb-6">
              {items.map((item, i) => {
                const mealId = item.meal?._id || item.meal;
                const isUpdating = updating === mealId;
                return (
                  <div
                    key={mealId || i}
                    className={`card flex items-center gap-4 animate-fade-up transition-all ${isUpdating ? "opacity-60" : ""}`}
                  >
                    {/* Meal image/icon */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.meal?.image
                        ? <img src={buildImgUrl(item.meal.image)} alt={item.meal?.name || item.name} className="w-full h-full object-cover" />
                        : <ShoppingCart size={20} className="text-green-300 dark:text-gray-500" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{item.meal?.name || item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        RS {(item.meal?.basePrice || item.meal?.price || item.price || 0).toFixed(2)} each
                      </p>
                    </div>

                    {/* Quantity controls — text characters so Playwright can find them */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDecrease(item)}
                        disabled={isUpdating}
                        aria-label="Decrease quantity"
                        className="w-7 h-7 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-40 font-bold text-base"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-bold text-gray-900 dark:text-white text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleIncrease(item)}
                        disabled={isUpdating}
                        aria-label="Increase quantity"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all disabled:opacity-40 font-bold text-base"
                        style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right flex-shrink-0 min-w-[60px]">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        RS {((item.meal?.basePrice || item.meal?.price || item.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(item)}
                      disabled={isUpdating}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0 disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="glass-card mb-4 animate-fade-up">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                  <span>RS {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Service Fee</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-white text-base">
                  <span>Total</span>
                  <span className="text-gradient">RS {subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 animate-fade-up">
              <button
                onClick={handleClear}
                className="btn-danger flex items-center gap-2 text-sm px-4"
              >
                <Trash2 size={14} /> Clear Cart
              </button>
              <button
                onClick={() => navigate("/student/checkout")}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ChevronRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
