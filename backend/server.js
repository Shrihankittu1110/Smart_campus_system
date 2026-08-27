//backend/server.js
const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
dotenv.config();

const dns = require('node:dns');
dns.setServers(['1.1.1.1', '1.0.0.1']);

const app = express();
const port = process.env.PORT || 5000;
connectDB();

const allowedOrigins = [
  'https://smart-campus-system-iota.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    const isLocal =
      origin?.startsWith('http://localhost:') ||
      origin?.startsWith('http://127.0.0.1:');

    if (!origin || isLocal || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth routes
const authRoutes = require('./Auth/routes/authRoutes');
app.use('/api/auth', authRoutes);

// Admin routes
const dashboardRoutes      = require('./Admin/routes/dashboardRoutes');
const adminProfileRoutes   = require('./Admin/routes/Adminprofileroutes');
const Canteenroutes        = require('./Admin/routes/Canteenroutes');
const userRoutes           = require('./Admin/routes/userRoutes');
const analyticsRoutes      = require('./Admin/routes/analyticsRoutes');
const adminComplaintRoutes = require('./Admin/routes/complaintRoutes');
require('./Auth/models/User');

app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin', adminProfileRoutes);
app.use('/api/admin', Canteenroutes);
app.use('/api/admin', userRoutes);
app.use('/api/admin', analyticsRoutes);
app.use('/api/admin', adminComplaintRoutes);

// Canteen module routes
const canteenProfileRoutes   = require('./Canteen/routes/canteenProfileRoutes');
const reportRoutes           = require('./Canteen/routes/reportRoutes');
const mealRoutes             = require('./Canteen/routes/mealRoutes');
const canteenOrderRoutes     = require('./Canteen/routes/orderRoutes');
const revenueRoutes          = require('./Canteen/routes/revenueRoutes');
const reviewRoutes           = require('./Canteen/routes/reviewRoutes');
const canteenDashboardRoutes = require('./Canteen/routes/dashboardRoutes');

app.use('/api/canteen/dashboard', canteenDashboardRoutes);
app.use('/api/canteen/report',    reportRoutes);
app.use('/api/canteen/reviews',   reviewRoutes);
app.use('/api/canteen/revenue',   revenueRoutes);
app.use('/api/canteen/orders',    canteenOrderRoutes);
app.use('/api/canteen/meals',     mealRoutes);
app.use('/api/canteen',           canteenProfileRoutes);

// Student module routes
app.use('/api/student/canteens',   require('./routes/canteenBrowseRoutes'));
app.use('/api/student/cart',       require('./routes/cartRoutes'));
app.use('/api/student/orders',     require('./routes/orderRoutes'));
app.use('/api/student/payment',    require('./routes/paymentRoutes'));
app.use('/api/student/tracking',   require('./routes/studentTrackingRoutes'));
app.use('/api/student/complaints', require('./routes/complaintRoutes'));
app.use('/api/queue',              require('./routes/queueRoutes'));

// Chatbot routes
const chatbotRoutes = require('./Chatbot/chatbotRoutes');
app.use('/api/chatbot', chatbotRoutes);

// Health check
app.get('/', (_req, res) => res.send('SmartMess backend running!'));
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
