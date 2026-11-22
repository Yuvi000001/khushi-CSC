const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const sanitize = require('mongo-sanitize');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1); // Render / Nginx जैसे proxy के पीछे सही IP के लिए

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
}));

const origins = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => (!origin || origins.includes(origin) ? cb(null, true) : cb(new Error('CORS_BLOCKED'))),
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '50kb' }));
app.use((req, res, next) => { req.body = sanitize(req.body); req.params = sanitize(req.params); req.query = sanitize(req.query); next(); });

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 400, standardHeaders: true, legacyHeaders: false }));
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
