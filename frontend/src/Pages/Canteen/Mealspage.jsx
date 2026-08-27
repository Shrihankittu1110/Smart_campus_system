// frontend/src/pages/Canteen/MealsPage.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Filter, Edit2, Trash2, X, Save, Loader2,
  CheckCircle, XCircle, Upload, Camera, FileText, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, Eye, EyeOff, Download, Grid, List,
  AlertCircle, Clock, DollarSign, Tag, Package, Image as ImageIcon,
  MoreVertical, Star, TrendingUp, Coffee, ShoppingBag, Utensils
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '../../context/ThemeContext';

const CATEGORIES = ['Rice', 'Snacks', 'Desserts', 'Drinks', 'Breakfast', 'Other'];
const SIZES      = ['Small', 'Medium', 'Large'];
const API        = '/api/canteen/meals';


const makeEmptyForm = () => ({
  name:        '',
  description: '',
  category:    'Rice',
  basePrice:   '',
  isAvailable: true,
  defaultSize: 'Medium',
  sizes: {
    Small:  { enabled: false, price: '' },
    Medium: { enabled: true,  price: '' }, // starts enabled but CAN be toggled off
    Large:  { enabled: false, price: '' },
  },
});


const makeEditForm = (meal) => ({
  name:        meal.name        || '',
  description: meal.description || '',
  category:    meal.category    || 'Rice',
  basePrice:   meal.basePrice !== undefined ? String(meal.basePrice) : '',
  isAvailable: meal.isAvailable ?? true,
  defaultSize: meal.defaultSize || 'Medium',
  sizes: {
    Small:  {
      enabled: meal.sizes?.Small?.enabled  ?? false,
      price:   meal.sizes?.Small?.price  != null ? String(meal.sizes.Small.price)  : '',
    },
    Medium: {
      // Load exactly what was saved — no forced override
      enabled: meal.sizes?.Medium?.enabled ?? false,
      price:   meal.sizes?.Medium?.price != null ? String(meal.sizes.Medium.price) : '',
    },
    Large:  {
      enabled: meal.sizes?.Large?.enabled  ?? false,
      price:   meal.sizes?.Large?.price  != null ? String(meal.sizes.Large.price)  : '',
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className="fixed top-5 right-5 z-[100] animate-slide-in">
      <div className={`px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-3 ${
        toast.type === 'error'
          ? 'bg-gradient-to-r from-red-500 to-red-600'
          : 'bg-gradient-to-r from-emerald-500 to-green-600'
      } text-white min-w-[300px]`}>
        {toast.type === 'error'
          ? <XCircle className="w-5 h-5 flex-shrink-0" />
          : <CheckCircle className="w-5 h-5 flex-shrink-0" />}
        <span className="flex-1">{toast.msg}</span>
        <button onClick={onClose} className="hover:bg-white/20 rounded-lg p-1 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CategoryBadge({ category }) {
  const colors = {
    Rice:      'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    Snacks:    'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-500/30',
    Desserts:  'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400 border-pink-200 dark:border-pink-500/30',
    Drinks:    'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    Breakfast: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
    Other:     'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200 dark:border-gray-500/30',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[category] || colors.Other}`}>
      {category}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-${color}-100 dark:bg-${color}-500/20 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {['grid', 'list'].map((v) => (
        <button key={v} onClick={() => onChange(v)}
          className={`p-2 rounded-lg transition-all ${
            view === v
              ? 'bg-white dark:bg-gray-700 shadow-sm text-green-600 dark:text-green-400'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}>
          {v === 'grid' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MealsPage() {
  const { theme } = useTheme();

  const [meals, setMeals]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState(null);
  const [search, setSearch]             = useState('');
  const [filterCat, setFilterCat]       = useState('All');
  const [filterAvail, setFilterAvail]   = useState('All');
  const [showModal, setShowModal]       = useState(false);
  const [editMeal, setEditMeal]         = useState(null);
  const [form, setForm]                 = useState(makeEmptyForm);
  const [formErrors, setFormErrors]     = useState({});
  const [imgFile, setImgFile]           = useState(null);
  const [imgPreview, setImgPreview]     = useState(null);
  const [deleteId, setDeleteId]         = useState(null);
  const [viewMode, setViewMode]         = useState('grid');
  const [showFilters, setShowFilters]   = useState(false);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [sortBy, setSortBy]             = useState('name');
  const [sortOrder, setSortOrder]       = useState('asc');

  const fileRef = useRef();

  const showToastMessage = (msg, type = 'success') => setToast({ msg, type });

  const buildImgUrl = (p) => {
    if (!p) return null;
    if (p.startsWith('data:') || p.startsWith('blob:') || p.startsWith('http')) return p;
    return `${import.meta.env.VITE_API_URL || ''}${p}`;
  };

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchMeals = async () => {
    setLoading(true);
    try {
      const r = await fetch(API, { headers: authHeader() });
      const j = await r.json();
      if (j.success) setMeals(j.data);
      else showToastMessage(j.message || 'Failed to load meals', 'error');
    } catch {
      showToastMessage('Failed to load meals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeals(); }, []);

  // ── derived stats ──────────────────────────────────────────────────────────
  const totalMeals      = meals.length;
  const availableMeals  = meals.filter(m => m.isAvailable).length;
  const outOfStockMeals = totalMeals - availableMeals;
  const totalCategories = new Set(meals.map(m => m.category)).size;

  // ── modal open / close ─────────────────────────────────────────────────────
  const openAdd = () => {
    setEditMeal(null);
    setForm(makeEmptyForm());
    setFormErrors({});
    setImgFile(null);
    setImgPreview(null);
    setShowModal(true);
  };

  const openEdit = (meal) => {
    setEditMeal(meal);
    setForm(makeEditForm(meal));
    setFormErrors({});
    setImgFile(null);
    setImgPreview(meal.image ? buildImgUrl(meal.image) : null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMeal(null);
    setImgPreview(null);
    setImgFile(null);
    setFormErrors({});
  };

  // ── field change handler ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    if ((name === 'name' || name === 'description') && /[^a-zA-Z\s]/.test(value)) return;

    if (name === 'basePrice') {
      if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;

      setForm(f => ({
        ...f,
        basePrice: value,
        sizes: {
          ...f.sizes,
          [f.defaultSize]: { ...f.sizes[f.defaultSize], price: value },
        },
      }));
      if (formErrors.basePrice) setFormErrors(p => ({ ...p, basePrice: undefined }));
      return;
    }

    setForm(f => ({ ...f, [name]: value }));
    if (formErrors[name]) setFormErrors(p => ({ ...p, [name]: undefined }));
  };

  const handleDefaultSize = (size) => {
    setForm(f => ({
      ...f,
      defaultSize: size,
      sizes: {
        ...f.sizes,
        [size]: { ...f.sizes[size], enabled: true, price: f.basePrice || f.sizes[size].price },
      },
    }));
  };

  
  const handleSizeToggle = (size) => {
    setForm(f => {
      const nowEnabled = !f.sizes[size].enabled;
      const newSizes   = { ...f.sizes, [size]: { ...f.sizes[size], enabled: nowEnabled } };

      let newDefault = f.defaultSize;
      if (!nowEnabled && f.defaultSize === size) {
        const fallback = SIZES.find(s => s !== size && newSizes[s].enabled);
        newDefault = fallback || null; // null = no sizes enabled (validation will catch this)
      }

      return { ...f, defaultSize: newDefault, sizes: newSizes };
    });
  };

  const handleSizePrice = (size, val) => {
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;
    setForm(f => ({ ...f, sizes: { ...f.sizes, [size]: { ...f.sizes[size], price: val } } }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToastMessage('Image must be under 5MB', 'error'); return; }
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  // ── validation ─────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};
    if (!form.name.trim())
      errors.name = 'Meal name is required';
    else if (!/^[a-zA-Z\s]+$/.test(form.name.trim()))
      errors.name = 'Meal name must contain letters only (no numbers or symbols)';

    if (!form.category) errors.category = 'Category is required';

    if (!form.basePrice || form.basePrice === '')
      errors.basePrice = 'Base price is required';
    else if (isNaN(parseFloat(form.basePrice)) || parseFloat(form.basePrice) < 0)
      errors.basePrice = 'Enter a valid price';

    if (form.description.trim() && !/^[a-zA-Z\s]+$/.test(form.description.trim()))
      errors.description = 'Description must contain letters only (no numbers or symbols)';

    // validate at least one size is enabled
    const anyEnabled = SIZES.some(s => form.sizes[s].enabled);
    if (!anyEnabled)
      errors.sizes = 'At least one size must be enabled';

    //  validate defaultSize is set and is an enabled size
    if (!form.defaultSize || !form.sizes[form.defaultSize]?.enabled)
      errors.defaultSize = 'Please select a default size from the enabled sizes';

    SIZES.forEach(size => {
      if (form.sizes[size].enabled) {
        const p = form.sizes[size].price;
        if (p === '' || p === undefined || p === null)
          errors[`size_${size}`] = `${size} price is required when enabled`;
        else if (isNaN(parseFloat(p)) || parseFloat(p) < 0)
          errors[`size_${size}`] = `Enter a valid ${size} price`;
      }
    });

    return errors;
  };

  // ── save (add or update) ───────────────────────────────────────────────────
  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToastMessage('Please fix the errors before saving', 'error');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',        form.name.trim());
      fd.append('description', form.description.trim());
      fd.append('category',    form.category);
      fd.append('basePrice',   form.basePrice);
      fd.append('isAvailable', form.isAvailable);
      fd.append('defaultSize', form.defaultSize);
      fd.append('sizes',       JSON.stringify(form.sizes));
      if (imgFile) fd.append('image', imgFile);

      const url    = editMeal ? `${API}/${editMeal._id}` : API;
      const method = editMeal ? 'PUT' : 'POST';

      const r = await fetch(url, { method, headers: authHeader(), body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || `HTTP ${r.status}`);

      showToastMessage(editMeal ? 'Meal updated successfully!' : 'Meal added successfully!');
      closeModal();
      fetchMeals();
    } catch (err) {
      showToastMessage(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const r = await fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeader() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      showToastMessage('Meal deleted successfully!');
      setDeleteId(null);
      fetchMeals();
    } catch (err) {
      showToastMessage(err.message || 'Failed to delete', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedMeals.length) return;
    try {
      await Promise.all(selectedMeals.map(id =>
        fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeader() })
      ));
      showToastMessage(`${selectedMeals.length} meals deleted successfully!`);
      setSelectedMeals([]);
      fetchMeals();
    } catch {
      showToastMessage('Failed to delete some meals', 'error');
    }
  };

  // ── availability ───────────────────────────────────────────────────────────
  const handleToggleAvail = async (meal) => {
    try {
      await fetch(`${API}/${meal._id}/availability`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body:    JSON.stringify({ isAvailable: !meal.isAvailable }),
      });
      fetchMeals();
      showToastMessage(`Meal marked as ${!meal.isAvailable ? 'available' : 'out of stock'}`);
    } catch {
      showToastMessage('Failed to update', 'error');
    }
  };

  const handleBulkToggle = async (makeAvailable) => {
    if (!selectedMeals.length) return;
    try {
      await Promise.all(selectedMeals.map(id =>
        fetch(`${API}/${id}/availability`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body:    JSON.stringify({ isAvailable: makeAvailable }),
        })
      ));
      showToastMessage(`${selectedMeals.length} meals updated!`);
      setSelectedMeals([]);
      fetchMeals();
    } catch {
      showToastMessage('Failed to update meals', 'error');
    }
  };

  // ── export PDF ─────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24); doc.setFont('helvetica', 'bold');
    doc.text('SmartMess', 105, 20, { align: 'center' });
    doc.setFontSize(12); doc.setFont('helvetica', 'normal');
    doc.text('Meal Inventory Report', 105, 30, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 38, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 55); doc.setFont('helvetica', 'normal');
    doc.text(`Total Meals: ${totalMeals}`,     14, 63);
    doc.text(`Available: ${availableMeals}`,   14, 71);
    doc.text(`Out of Stock: ${outOfStockMeals}`, 14, 79);
    doc.text(`Categories: ${totalCategories}`, 14, 87);
    autoTable(doc, {
      startY: 100,
      head: [['Meal Name', 'Category', 'Base Price', 'Status', 'Description']],
      body: filteredMeals.map(m => [
        m.name, m.category, `Rs. ${m.basePrice}`,
        m.isAvailable ? 'Available' : 'Out of Stock',
        m.description?.substring(0, 30) || '-',
      ]),
      headStyles:          { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles:  { fillColor: [240, 253, 244] },
      styles:              { fontSize: 9 },
    });
    doc.save('meal-inventory-report.pdf');
  };

  // ── filter + sort ──────────────────────────────────────────────────────────
  const filteredMeals = meals
    .filter(m => {
      const q = search.toLowerCase();
      return (
        (m.name.toLowerCase().includes(q) ||
         m.category.toLowerCase().includes(q) ||
         m.description?.toLowerCase().includes(q)) &&
        (filterCat   === 'All' || m.category === filterCat) &&
        (filterAvail === 'All' ||
          (filterAvail === 'Available'    &&  m.isAvailable) ||
          (filterAvail === 'Out of Stock' && !m.isAvailable))
      );
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'price')         { aVal = +a.basePrice; bVal = +b.basePrice; }
      else if (sortBy === 'category') { aVal = a.category;   bVal = b.category; }
      else                            { aVal = a.name;       bVal = b.name; }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  const FieldError = ({ field }) => formErrors[field] ? (
    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
      <XCircle className="w-3 h-3" /> {formErrors[field]}
    </p>
  ) : null;

  // ── helper: how many sizes are currently enabled ───────────────────────────
  const enabledSizeCount = SIZES.filter(s => form.sizes[s].enabled).length;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meal Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your canteen's menu items</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-green-600/20">
              <Plus className="w-4 h-4" /> Add New Meal
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <StatCard icon={Utensils}    label="Total Meals"  value={totalMeals}      color="blue"   />
          <StatCard icon={CheckCircle} label="Available"    value={availableMeals}  color="green"  />
          <StatCard icon={XCircle}     label="Out of Stock" value={outOfStockMeals} color="red"    />
          <StatCard icon={Tag}         label="Categories"   value={totalCategories} color="purple" />
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex-shrink-0 px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search meals by name, category..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <Filter className="w-4 h-4" /> Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <select value={`${sortBy}-${sortOrder}`}
            onChange={e => { const [by, order] = e.target.value.split('-'); setSortBy(by); setSortOrder(order); }}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="category-asc">Category (A-Z)</option>
          </select>
          {selectedMeals.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-500">{selectedMeals.length} selected</span>
              <button onClick={() => handleBulkToggle(true)}
                className="px-3 py-2 text-sm font-medium rounded-xl bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-all">
                Set Available
              </button>
              <button onClick={() => handleBulkToggle(false)}
                className="px-3 py-2 text-sm font-medium rounded-xl bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-all">
                Set Out of Stock
              </button>
              <button onClick={handleBulkDelete}
                className="px-3 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all">
                Delete Selected
              </button>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={filterAvail} onChange={e => setFilterAvail(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="All">All Status</option>
                <option value="Available">Available</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {(search || filterCat !== 'All' || filterAvail !== 'All') && (
              <button onClick={() => { setSearch(''); setFilterCat('All'); setFilterAvail('All'); }}
                className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                <X className="w-4 h-4" /> Clear Filters
              </button>
            )}
            <span className="text-sm text-gray-500 ml-auto">
              {filteredMeals.length} {filteredMeals.length === 1 ? 'result' : 'results'}
            </span>
          </div>
        )}
      </div>

      {/* ── Meals Grid / List ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-3" />
            <p className="text-sm text-gray-500">Loading meals...</p>
          </div>
        ) : filteredMeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-20 h-20 mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Utensils className="w-10 h-10" />
            </div>
            <p className="font-semibold text-lg text-gray-600 dark:text-gray-300">No meals found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new meal</p>
            <button onClick={openAdd}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-all">
              Add Your First Meal
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredMeals.map(meal => (
              <div key={meal._id}
                className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                  {meal.image ? (
                    <img src={buildImgUrl(meal.image)} alt={meal.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                      <Utensils className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-lg ${meal.isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {meal.isAvailable ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <CategoryBadge category={meal.category} />
                  </div>
                  <div className="absolute top-3 left-3">
                    <input type="checkbox" checked={selectedMeals.includes(meal._id)}
                      onChange={e => {
                        setSelectedMeals(prev =>
                          e.target.checked ? [...prev, meal._id] : prev.filter(id => id !== meal._id)
                        );
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{meal.name}</h3>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">Rs. {meal.basePrice}</span>
                  </div>
                  {meal.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{meal.description}</p>
                  )}
                  {Object.values(meal.sizes || {}).some(s => s.enabled) && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {SIZES.map(s => meal.sizes?.[s]?.enabled && (
                        <span key={s}
                          className={`px-2 py-1 text-xs font-medium rounded-lg border ${
                            meal.defaultSize === s
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent'
                          }`}>
                          {s}: Rs. {meal.sizes[s].price}
                          {meal.defaultSize === s && <span className="ml-1 opacity-70">(default)</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => handleToggleAvail(meal)}
                      className={`p-2 rounded-lg transition-colors ${meal.isAvailable ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                      {meal.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(meal)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(meal._id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox"
                      checked={selectedMeals.length === filteredMeals.length && filteredMeals.length > 0}
                      onChange={e => setSelectedMeals(e.target.checked ? filteredMeals.map(m => m._id) : [])}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  </th>
                  {['Image','Name','Category','Base Price','Sizes','Status','Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMeals.map(meal => (
                  <tr key={meal._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedMeals.includes(meal._id)}
                        onChange={e => setSelectedMeals(prev =>
                          e.target.checked ? [...prev, meal._id] : prev.filter(id => id !== meal._id)
                        )}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        {meal.image
                          ? <img src={buildImgUrl(meal.image)} alt={meal.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Utensils className="w-5 h-5 text-gray-400" /></div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{meal.name}</td>
                    <td className="px-4 py-3"><CategoryBadge category={meal.category} /></td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">Rs. {meal.basePrice}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {SIZES.map(s => meal.sizes?.[s]?.enabled && (
                          <span key={s}
                            className={`px-2 py-1 text-xs font-medium rounded border ${
                              meal.defaultSize === s
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-transparent'
                            }`}>
                            {s[0]}: {meal.sizes[s].price}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${meal.isAvailable ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {meal.isAvailable ? 'Available' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleToggleAvail(meal)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                          {meal.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEdit(meal)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(meal._id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editMeal ? 'Edit Meal' : 'Add New Meal'}
              </h2>
              <button onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meal Image</label>
                <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                  {imgPreview ? (
                    <div className="relative rounded-xl overflow-hidden aspect-video">
                      <img src={imgPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-3 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <p className="text-sm text-gray-500">Click to upload image (max 5MB)</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                </div>
              </div>

              {/* Name + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meal Name <span className="text-red-500">*</span>
                  </label>
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g., Chicken Rice and Curry"
                    className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.name ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-600 focus:ring-green-500'} bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                  <FieldError field="name" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select name="category" value={form.category} onChange={handleChange}
                      className={`w-full appearance-none px-4 py-2.5 rounded-xl border ${formErrors.category ? 'border-red-400' : 'border-gray-200 dark:border-gray-600 focus:ring-green-500'} bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <FieldError field="category" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Base Price (Rs.) <span className="text-red-500">*</span>
                  </label>
                  <input name="basePrice" value={form.basePrice} onChange={handleChange}
                    type="text" inputMode="decimal" placeholder="e.g. 250"
                    className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.basePrice ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-600 focus:ring-green-500'} bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                  <FieldError field="basePrice" />
                  {/* FIX: hint shows which size gets the base price auto-fill */}
                  {!formErrors.basePrice && form.basePrice && form.defaultSize && (
                    <p className="text-[11px] text-green-600 mt-1">
                      ✓ Auto-filled as {form.defaultSize} price below
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  rows={3} placeholder="Describe the meal ingredients, preparation style, etc..."
                  className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.description ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-600 focus:ring-green-500'} bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none transition-all`} />
                <FieldError field="description" />
              </div>

              {/* ── Size Variations & Default ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Size Variations & Prices
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  Toggle any size on or off. At least one must be enabled.
                  Click <span className="font-semibold text-green-600">Set as Default</span> on any enabled size.
                </p>

                {/* Global size errors */}
                {formErrors.sizes && (
                  <p className="text-[11px] text-red-500 mb-2 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {formErrors.sizes}
                  </p>
                )}
                {formErrors.defaultSize && (
                  <p className="text-[11px] text-red-500 mb-2 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {formErrors.defaultSize}
                  </p>
                )}

                <div className="space-y-3">
                  {SIZES.map(size => {
                    const isEnabled = form.sizes[size].enabled;
                    const isDefault = form.defaultSize === size;
                    // FIX: prevent disabling the LAST enabled size (must keep at least one)
                    const isLastEnabled = isEnabled && enabledSizeCount === 1;

                    return (
                      <div key={size}
                        className={`rounded-xl border transition-all ${
                          isDefault
                            ? 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-900/10'
                            : isEnabled
                              ? 'border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700/30'
                              : 'border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/10 opacity-60'
                        }`}>
                        <div className="flex items-center gap-3 p-4">
                          {/* toggle — FIX: all sizes toggleable, but can't disable last one */}
                          <button
                            type="button"
                            onClick={() => handleSizeToggle(size)}
                            disabled={isLastEnabled}
                            title={isLastEnabled ? 'At least one size must remain enabled' : undefined}
                            className={`transition-colors flex-shrink-0 ${isEnabled ? 'text-green-600' : 'text-gray-400'} ${isLastEnabled ? 'cursor-not-allowed opacity-50' : 'hover:opacity-80'}`}>
                            {isEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                          </button>

                          {/* size label — FIX: "always on" badge removed */}
                          <div className="flex items-center gap-2 w-20 flex-shrink-0">
                            <span className={`text-sm font-semibold ${isEnabled ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                              {size}
                            </span>
                          </div>

                          {/* price input */}
                          <div className="flex-1">
                            <input type="text" inputMode="decimal"
                              value={form.sizes[size].price}
                              onChange={e => handleSizePrice(size, e.target.value)}
                              disabled={!isEnabled}
                              placeholder="Price (Rs.)"
                              className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-40 disabled:cursor-not-allowed ${formErrors[`size_${size}`] ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`} />
                            {formErrors[`size_${size}`] && (
                              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> {formErrors[`size_${size}`]}
                              </p>
                            )}
                          </div>

                          {/* Set as Default button — only shown when size is enabled */}
                          {isEnabled && (
                            <button
                              type="button"
                              onClick={() => handleDefaultSize(size)}
                              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                                isDefault
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : 'border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400 hover:border-green-400 hover:text-green-600 dark:hover:border-green-500 dark:hover:text-green-400'
                              }`}>
                              {isDefault ? '✓ Default' : 'Set Default'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {form.defaultSize
                    ? <>Current default: <span className="font-semibold text-green-600 dark:text-green-400">{form.defaultSize}</span></>
                    : <span className="text-red-400">No default set — please enable and select a size</span>
                  }
                </p>
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Availability Status</p>
                  <p className="text-sm text-gray-500 mt-1">Toggle to mark this meal as available or out of stock</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, isAvailable: !f.isAvailable }))}
                  className={`transition-colors ${form.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                  {form.isAvailable ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button onClick={closeModal}
                className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : editMeal ? 'Update Meal' : 'Add Meal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Meal?</h3>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone. The meal will be permanently removed from your menu.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteId)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}