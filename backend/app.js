const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { createRateLimitStore } = require('./config/rateLimitStore');
const sanitize = require('mongo-sanitize');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // Render / Nginx जैसे proxy के पीछे सही IP के लिए

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://checkout.razorpay.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
      frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      formAction: ["'self'"],
    },
  },
}));

app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const origins = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => (!origin || origins.includes(origin) ? cb(null, true) : cb(new Error('CORS_BLOCKED'))),
  credentials: true,
}));

app.use(cookieParser());
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('api'),
}));
app.post(
  '/api/webhooks/razorpay',
  express.raw({ type: 'application/json', limit: '100kb' }),
  require('./controllers/paymentController').handleRazorpayWebhook,
);
app.use(express.json({ limit: '50kb' }));
app.use((req, res, next) => { req.body = sanitize(req.body); req.params = sanitize(req.params); req.query = sanitize(req.query); next(); });

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/schemes', require('./routes/schemeRoutes'));
app.use('/api/ads', require('./routes/adRoutes'));
app.use('/api/forms', require('./routes/downloadFormRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api', notFound);

// Frontend ko isi server se chalana (SERVE_FRONTEND=true) - sabse aasan live setup
const frontendDir = path.join(__dirname, '..', 'frontend');
if (process.env.SERVE_FRONTEND !== 'false' && fs.existsSync(path.join(frontendDir, 'index.html'))) {
  app.use(express.static(frontendDir, { maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0, index: false }));
  app.get('*', (req, res) => res.sendFile(path.join(frontendDir, 'index.html')));
}

app.use(errorHandler);
module.exports = app;
