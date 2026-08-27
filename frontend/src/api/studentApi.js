// frontend/src/api/studentApi.js
import { apiUrl } from '../utils/apiUrl';

const BASE_URL = apiUrl('/api/student');

// ─── Simple in-memory cache ───────────────────────────────────────────────────
// Caches GET responses for a short TTL so navigating back to a page doesn't
// re-hit the network every single time.
const cache = new Map();
const CACHE_TTL = 5_000; // 5 seconds

function cachedFetch(url) {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && now - cached.ts < CACHE_TTL) {
    return Promise.resolve(cached.data);
  }
  return fetch(url)
    .then((r) => r.json())
    .then((data) => {
      cache.set(url, { data, ts: now });
      return data;
    });
}

// Call this whenever you write data so stale cache entries are removed
function invalidateCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

// ─── Canteen API ──────────────────────────────────────────────────────────────
export const canteenAPI = {
  getAll: () => cachedFetch(`${BASE_URL}/canteens`),

  getById: (id) => cachedFetch(`${BASE_URL}/canteens/${id}`),

  getMeals: (canteenId, filters = '') =>
    cachedFetch(`${BASE_URL}/canteens/${canteenId}/meals?${filters}`),

  globalSearch: (query = '', category = '', maxPrice = '') => {
    const params = [];
    if (query) params.push(`q=${encodeURIComponent(query)}`);
    if (category && category !== 'All') params.push(`category=${category}`);
    if (maxPrice) params.push(`maxPrice=${maxPrice}`);
    // Search results are not cached — they depend on user input
    return fetch(`${BASE_URL}/canteens/search?${params.join('&')}`).then((r) => r.json());
  },

  getMostOrdered: (studentId) =>
    cachedFetch(`${BASE_URL}/canteens/most-ordered/${studentId}`),
};

// ─── Cart API ─────────────────────────────────────────────────────────────────
export const cartAPI = {
  getCart: (studentId) => cachedFetch(`${BASE_URL}/cart/${studentId}`),

  addToCart: (data) =>
    fetch(`${BASE_URL}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((r) => r.json())
      .then((res) => {
        invalidateCache(`/cart/${data.studentId}`);
        return res;
      }),

  updateItem: (data) =>
    fetch(`${BASE_URL}/cart/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((r) => r.json())
      .then((res) => {
        invalidateCache(`/cart/${data.studentId}`);
        return res;
      }),

  removeItem: (data) =>
    fetch(`${BASE_URL}/cart/remove`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((r) => r.json())
      .then((res) => {
        invalidateCache(`/cart/${data.studentId}`);
        return res;
      }),

  clearCart: (studentId) =>
    fetch(`${BASE_URL}/cart/clear/${studentId}`, { method: 'DELETE' })
      .then((r) => r.json())
      .then((res) => {
        invalidateCache(`/cart/${studentId}`);
        return res;
      }),
};

// ─── Order API ────────────────────────────────────────────────────────────────
export const orderAPI = {
  placeOrder: (data) =>
    fetch(`${BASE_URL}/orders/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((r) => r.json())
      .then((res) => {
        // Invalidate cart and order history caches after placing an order
        if (data.studentId) {
          invalidateCache(`/cart/${data.studentId}`);
          invalidateCache(`/tracking/history/${data.studentId}`);
        }
        return res;
      }),

  getById: (orderId) => fetch(`${BASE_URL}/orders/${orderId}`).then((r) => r.json()),

  cancelOrder: (orderId) =>
    fetch(`${BASE_URL}/orders/${orderId}/cancel`, { method: 'PATCH' }).then((r) => r.json()),
};

// ─── Payment API ──────────────────────────────────────────────────────────────
export const paymentAPI = {
  getByOrder: (orderId) => fetch(`${BASE_URL}/payment/${orderId}`).then((r) => r.json()),

  processPayment: (data) =>
    fetch(`${BASE_URL}/payment/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
};

// ─── Tracking API ─────────────────────────────────────────────────────────────
export const trackingAPI = {
  getHistory: (studentId) => cachedFetch(`${BASE_URL}/tracking/history/${studentId}`),

  trackStatus: (orderId) => fetch(`${BASE_URL}/tracking/status/${orderId}`).then((r) => r.json()),

  getExpenses: (studentId, year) =>
    cachedFetch(`${BASE_URL}/tracking/expenses/${studentId}?year=${year}`),

  submitRating: (data) =>
    fetch(`${BASE_URL}/tracking/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  getMyRatings: (studentId) => cachedFetch(`${BASE_URL}/tracking/ratings/${studentId}`),
};
