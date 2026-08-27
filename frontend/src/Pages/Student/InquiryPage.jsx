import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  MessageSquare, Send, Loader2, Check, X, AlertCircle,
  Phone, Mail, User, FileText, ArrowLeft, Upload, CreditCard
} from "lucide-react";

// Inquiry types — test expects "General Inquiry", "Order Issue", "Payment Problem"
const INQUIRY_TYPES = [
  "General Inquiry",
  "Order Issue",
  "Food Quality",
  "Payment Problem",
  "Account Issue",
  "Canteen Feedback",
  "App Bug",
  "Other",
];

const CONTACT_PREFS = ["Email", "Phone"];

export default function InquiryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name:        user?.name  || "",
    email:       user?.email || "",
    phone:       "",
    nic:         "",
    inquiryType: "",
    subject:     "",
    message:     "",
    contactPref: "Email",
  });

  const [attachment, setAttachment]       = useState(null);
  const [attachPreview, setAttachPreview] = useState(null);
  const [errors, setErrors]               = useState({});
  const [touched, setTouched]             = useState({});
  const [submitting, setSubmitting]       = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);

  // ── Validation — error messages match test regex patterns ──
  const validate = (f = form) => {
    const e = {};

    // name — test looks for /required/i
    if (!f.name.trim())
      e.name = "Full name is required.";
    else if (f.name.trim().length < 2)
      e.name = "Name must be at least 2 characters.";

    // email — test looks for /required/i
    if (!f.email.trim())
      e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
      e.email = "Enter a valid email address.";

    // phone — test looks for /valid phone/i
    if (!f.phone.trim())
      e.phone = "Phone number is required.";
    else if (!/^\+?\d{7,15}$/.test(f.phone.trim().replace(/\s/g, "")))
      e.phone = "Enter a valid phone number (e.g. +94771234567).";

    // NIC
    if (!f.nic.trim())
      e.nic = "NIC number is required.";
    else if (!/^(\d{9}[VvXx]|\d{12})$/.test(f.nic.trim()))
      e.nic = "Enter a valid Sri Lankan NIC (e.g. 952345678V or 200012345678).";

    // inquiryType
    if (!f.inquiryType)
      e.inquiryType = "Please select an inquiry type.";

    // subject
    if (!f.subject.trim())
      e.subject = "Subject is required.";
    else if (f.subject.trim().length < 5)
      e.subject = "Subject must be at least 5 characters.";

    // message — /1000 counter test needs textarea content
    if (!f.message.trim())
      e.message = "Message is required.";
    else if (f.message.trim().length < 20)
      e.message = `Too short — ${20 - f.message.trim().length} more characters needed.`;
    else if (f.message.trim().length > 1000)
      e.message = "Maximum 1000 characters allowed.";

    return e;
  };

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) setErrors(validate(updated));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, attachment: "File too large. Max 5MB." }));
      return;
    }
    setErrors((prev) => { const n = { ...prev }; delete n.attachment; return n; });
    setAttachment(file);
    if (file.type.startsWith("image/")) setAttachPreview(URL.createObjectURL(file));
    else setAttachPreview(null);
  };

  const handleSubmitClick = () => {
    // Touch all fields so all errors appear
    const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true]));
    setTouched(allTouched);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("submittedByName",  form.name);
      formData.append("submittedByEmail", form.email);
      formData.append("submitterId",      user?._id || user?.id || "");
      formData.append("category",         form.inquiryType);
      formData.append("description",
        `[Subject: ${form.subject}] [Phone: ${form.phone}] [NIC: ${form.nic}] [Contact Pref: ${form.contactPref}]\n\n${form.message}`
      );
      if (attachment) formData.append("attachment", attachment);

      const res  = await fetch("/api/student/complaints", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setSubmitted(true);
      else setErrors({ submit: data.message || "Failed to submit. Please try again." });
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setSubmitted(false);
    setForm({ name: user?.name||"", email: user?.email||"", phone:"", nic:"", inquiryType:"", subject:"", message:"", contactPref:"Email" });
    setErrors({}); setTouched({}); setAttachment(null); setAttachPreview(null);
  };

  const ErrMsg = ({ field }) =>
    errors[field] && touched[field]
      ? <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors[field]}</p>
      : null;

  const inputCls = (field) =>
    `input-field w-full text-sm ${touched[field] && errors[field] ? "border-red-400 focus:ring-red-400" : ""}`;

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card max-w-sm w-full text-center py-14 animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Inquiry Submitted!</h2>
          <p className="text-gray-500 text-sm mb-1">Thank you for reaching out.</p>
          <p className="text-gray-400 text-xs mb-6">We'll get back to you within 24–48 hours.</p>
          <div className="space-y-3">
            <button onClick={() => navigate("/student/canteens")} className="btn-primary w-full">Back to Canteens</button>
            <button onClick={resetForm} className="btn-secondary w-full">Submit Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        {/* Header — matches /submit an inquiry/i */}
        <div className="page-header animate-fade-down">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <MessageSquare size={20} className="text-green-600" />
            </div>
            <div>
              <h1 className="section-title mb-0">Submit an <span className="text-gradient">Inquiry</span></h1>
              <p className="section-subtitle">We're here to help — fill in the form below</p>
            </div>
          </div>
        </div>

        {/* Confirmation overlay — matches /submit this inquiry/i */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-6 max-w-sm w-full shadow-2xl animate-scale-up">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Submit this inquiry?</h4>
              <p className="text-sm text-gray-500 mb-5">
                Our team will review and respond via {form.contactPref} within 24–48 hours.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleConfirm} className="btn-primary flex-1">Yes, Submit</button>
              </div>
            </div>
          </div>
        )}

        <div className="card animate-fade-up space-y-5">

          {/* Auto-filled user info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Your Info (Auto-filled)
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #16a34a, #4ade80)" }}
              >
                {(user?.name || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{user?.name || "Student"}</p>
                <p className="text-xs text-gray-400">{user?.email || ""}</p>
              </div>
              <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                Student
              </span>
            </div>
          </div>

          {/* Full Name — first input[type="text"], auto-filled from user */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              <User size={11} className="inline mr-1" />Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
              className={inputCls("name")}
            />
            <ErrMsg field="name" />
          </div>

          {/* Email + Phone row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                <Mail size={11} className="inline mr-1" />Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                className={inputCls("email")}
              />
              <ErrMsg field="email" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                <Phone size={11} className="inline mr-1" />Phone <span className="text-red-500">*</span>
              </label>
              {/* Placeholder matches /\+94/i test */}
              <input
                type="tel"
                placeholder="+94 77 123 4567"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                onBlur={() => handleBlur("phone")}
                className={inputCls("phone")}
              />
              <ErrMsg field="phone" />
            </div>
          </div>

          {/* NIC */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              <CreditCard size={11} className="inline mr-1" />NIC Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 952345678V or 200012345678"
              value={form.nic}
              onChange={(e) => handleChange("nic", e.target.value.toUpperCase())}
              onBlur={() => handleBlur("nic")}
              maxLength={12}
              className={inputCls("nic")}
            />
            <div className="flex items-center justify-between mt-1">
              <ErrMsg field="nic" />
              <p className="text-[10px] text-gray-400 ml-auto">Old: 952345678V · New: 200012345678</p>
            </div>
          </div>

          {/* Inquiry Type — buttons matching test: /general inquiry/i, /order issue/i, /payment problem/i */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Inquiry Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INQUIRY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => { handleChange("inquiryType", type); handleBlur("inquiryType"); }}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all duration-200 ${
                    form.inquiryType === type
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-green-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <ErrMsg field="inquiryType" />
          </div>

          {/* Subject — placeholder matches /brief subject/i */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              <FileText size={11} className="inline mr-1" />Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Brief subject of your inquiry"
              value={form.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              onBlur={() => handleBlur("subject")}
              className={inputCls("subject")}
            />
            <ErrMsg field="subject" />
          </div>

          {/* Message — placeholder matches /describe your inquiry/i, counter shows /1000 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Message <span className="text-red-500">*</span>
              <span className="font-normal text-gray-400 ml-1">(min 20, max 1000 chars)</span>
            </label>
            <textarea
              placeholder="Please describe your inquiry in detail..."
              value={form.message}
              rows={5}
              onChange={(e) => handleChange("message", e.target.value)}
              onBlur={() => handleBlur("message")}
              maxLength={1000}
              className={`input-field w-full text-sm resize-none ${touched.message && errors.message ? "border-red-400 focus:ring-red-400" : ""}`}
            />
            <div className="flex items-center justify-between mt-1">
              <ErrMsg field="message" />
              {/* Counter matches /\/1000/i */}
              <span
                className={`text-xs ml-auto ${
                  form.message.length > 950 ? "text-red-500" : form.message.length >= 20 ? "text-green-500" : "text-gray-400"
                }`}
              >
                {form.message.length}/1000
              </span>
            </div>
          </div>

          {/* Contact Preference — buttons: Email, Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Preferred Contact Method <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {CONTACT_PREFS.map((pref) => (
                <button
                  key={pref}
                  onClick={() => handleChange("contactPref", pref)}
                  className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    form.contactPref === pref
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "border-gray-200 dark:border-gray-600 text-gray-500 hover:border-green-300"
                  }`}
                >
                  {pref === "Email" ? <Mail size={13} /> : <Phone size={13} />} {pref}
                </button>
              ))}
            </div>
            {form.contactPref === "Email" && (
              <div className="mt-2 input-field flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed">
                <Mail size={13} className="text-green-500" />{form.email || "Your email"}
              </div>
            )}
            {form.contactPref === "Phone" && (
              <div className="mt-2 input-field flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed">
                <Phone size={13} className="text-green-500" />{form.phone || "Your phone number"}
              </div>
            )}
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Attachment <span className="text-gray-400 font-normal">(optional, max 5MB)</span>
            </label>
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />
            {attachPreview ? (
              <div className="relative">
                <img src={attachPreview} alt="Preview" className="w-full h-36 object-cover rounded-xl border border-gray-200 dark:border-gray-600" />
                <button
                  onClick={() => { setAttachment(null); setAttachPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600"
                >
                  <X size={13} />
                </button>
              </div>
            ) : attachment ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20">
                <FileText size={18} className="text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400 flex-1 truncate">{attachment.name}</span>
                <button onClick={() => setAttachment(null)}><X size={14} className="text-red-500" /></button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl py-5 flex flex-col items-center gap-1.5 text-gray-400 hover:border-green-400 hover:text-green-500 transition-all"
              >
                <Upload size={20} />
                <span className="text-xs font-medium">Click to upload image or PDF</span>
                <span className="text-xs">Max 5MB</span>
              </button>
            )}
            {errors.attachment && <p className="text-xs text-red-500 mt-1">{errors.attachment}</p>}
          </div>

          {/* Error summary */}
          {Object.keys(errors).filter((k) => k !== "submit" && k !== "attachment" && touched[k]).length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Please fix the following:</p>
              <ul className="space-y-0.5">
                {Object.entries(errors)
                  .filter(([k]) => k !== "submit" && k !== "attachment" && touched[k])
                  .map(([k, v]) => (
                    <li key={k} className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={10} />{v}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Submit error */}
          {errors.submit && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <X size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400 text-xs">{errors.submit}</p>
            </div>
          )}

          {/* Submit button — matches /submit inquiry/i */}
          <button
            onClick={handleSubmitClick}
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-70"
          >
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
              : <><Send size={16} /> Submit Inquiry</>}
          </button>
        </div>
      </div>
    </div>
  );
}
