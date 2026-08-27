import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Banknote, CreditCard, Smartphone,
  Check, Loader2, ShoppingBag, ClipboardList, X
} from "lucide-react";
import { cartAPI, orderAPI, paymentAPI } from "../../api/studentApi";
import { useAuth } from "../../context/AuthContext";

const PAYMENT_METHODS = [
  { id: "cash",    label: "Cash on Pickup",  desc: "Pay when you collect your order", Icon: Banknote },
  { id: "card",    label: "Online Banking",  desc: "FPX / Internet Banking",          Icon: CreditCard },
  { id: "ewallet", label: "E-Wallet",        desc: "Touch n Go / GrabPay / Boost",    Icon: Smartphone },
];

export default function CheckoutPage() {
  const { user } = useAuth();
  const studentId = user?._id || user?.id;

  const [cart, setCart]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing]       = useState(false);
  const [result, setResult]               = useState(null);
  const [orderId, setOrderId]             = useState(null);
  const [error, setError]                 = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!studentId) return;
    cartAPI.getCart(studentId).then((res) => {
      if (res.success) setCart(res.data);
      setLoading(false);
    });
  }, [studentId]);

  const items    = cart?.items || [];
  const subtotal = items.reduce((s, i) => {
    const price = i.meal?.basePrice || i.meal?.price || i.price || 0;
    return s + price * i.quantity;
  }, 0);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setProcessing(true);
    setError("");

    try {
      const orderRes = await orderAPI.placeOrder({
        studentId,
        canteenId:   cart.canteen?._id || cart.canteen,
        items: items.map((i) => ({
          meal:     i.meal?._id || i.meal,
          name:     i.meal?.name || i.name,
          price:    i.meal?.basePrice || i.meal?.price || i.price || 0,
          quantity: i.quantity,
        })),
        totalAmount:   subtotal,
        paymentMethod,
      });

      if (!orderRes.success) {
        setError(orderRes.message || "Failed to place order. Please try again.");
        setProcessing(false);
        return;
      }

      const newOrderId = orderRes.data._id;
      setOrderId(newOrderId);

      const payRes = await paymentAPI.processPayment({
        studentId,
        orderId:       newOrderId,
        amount:        subtotal,
        paymentMethod,
      });

      setResult(payRes.success ? "success" : "failed");
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setProcessing(false);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 w-80">
          <div className="skeleton h-8 w-48 mx-auto" />
          <div className="skeleton h-32 w-full rounded-2xl" />
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Success screen ──
  if (result === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card max-w-sm w-full text-center py-12 animate-scale-up">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #16a34a, #4ade80)" }}
          >
            <Check size={40} color="white" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order Placed!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">Your order has been placed successfully.</p>
          {orderId && (
            <p className="text-xs font-mono text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg inline-block mb-6">
              Order #{orderId.slice(-8).toUpperCase()}
            </p>
          )}
          <div className="space-y-3">
            <button onClick={() => navigate("/student/orders")} className="btn-primary w-full flex items-center justify-center gap-2">
              <ClipboardList size={16} /> Track My Order
            </button>
            <button onClick={() => navigate("/student/canteens")} className="btn-secondary w-full">
              Order More
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Failed screen ──
  if (result === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card max-w-sm w-full text-center py-12 animate-scale-up">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
            <X size={40} className="text-red-500" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Failed</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Something went wrong. Please try again.</p>
          <div className="space-y-3">
            <button onClick={() => { setResult(null); setError(""); }} className="btn-primary w-full">Try Again</button>
            <button onClick={() => navigate("/student/cart")} className="btn-secondary w-full flex items-center justify-center gap-2">
              <ArrowLeft size={14} /> Back to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main checkout screen — always renders even if cart is empty ──
  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">

        {/* Back to Cart */}
        <button
          onClick={() => navigate("/student/cart")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Cart
        </button>

        <div className="page-header animate-fade-down">
          <h1 className="section-title">Checkout</h1>
          <p className="section-subtitle">Review and confirm your order</p>
        </div>

        {/* Order Summary — always visible */}
        <div className="card mb-5 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag size={16} className="text-green-600" />
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Order Summary</h2>
            {cart?.canteen?.name && (
              <span className="ml-auto text-xs text-gray-400">{cart.canteen.name}</span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400">No items in cart.</p>
              <button onClick={() => navigate("/student/canteens")} className="btn-primary mt-4 mx-auto">
                Browse Canteens
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {items.map((item, i) => {
                  const price = item.meal?.basePrice || item.meal?.price || item.price || 0;
                  return (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.meal?.name || item.name} <span className="text-gray-400">× {item.quantity}</span>
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        RS {(price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>RS {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Service Fee</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-1">
                  <span>Total</span>
                  <span className="text-gradient">RS {subtotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Payment Method — always visible */}
        <div className="card mb-5 animate-fade-up animation-delay-100">
          <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-4">Payment Method</h2>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(({ id, label, desc, Icon }) => (
              <button
                key={id}
                onClick={() => setPaymentMethod(id)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-200 text-left ${
                  paymentMethod === id
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-green-200"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  paymentMethod === id ? "bg-green-100 dark:bg-green-900/40" : "bg-gray-100 dark:bg-gray-700"
                }`}>
                  <Icon size={18} className={paymentMethod === id ? "text-green-600 dark:text-green-400" : "text-gray-500"} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${paymentMethod === id ? "text-green-700 dark:text-green-400" : "text-gray-800 dark:text-white"}`}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  paymentMethod === id ? "border-green-500" : "border-gray-300 dark:border-gray-600"
                }`}>
                  {paymentMethod === id && <div className="w-2 h-2 rounded-full bg-green-500" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4 animate-fade-in">
            <X size={15} className="text-red-500 flex-shrink-0" />
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Place Order Button — always visible */}
        <button
          onClick={handlePlaceOrder}
          disabled={processing || items.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base animate-fade-up animation-delay-200 disabled:opacity-70"
        >
          {processing ? (
            <><Loader2 size={18} className="animate-spin" /> Processing...</>
          ) : (
            <><Check size={18} /> Place Order{subtotal > 0 ? ` · RS ${subtotal.toFixed(2)}` : ""}</>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          By placing your order, you agree to our terms of service
        </p>
      </div>
    </div>
  );
}

