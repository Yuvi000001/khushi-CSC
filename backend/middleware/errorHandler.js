exports.notFound = (req, res) => res.status(404).json({ success: false, message: 'यह पेज या API उपलब्ध नहीं है।' });
exports.errorHandler = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: 'फ़ाइल बहुत बड़ी है।' });
  if (err.code === 11000) return res.status(409).json({ success: false, message: 'यह जानकारी पहले से मौजूद है।' });
  if (err.message === 'CORS_BLOCKED') return res.status(403).json({ success: false, message: 'अनुमति नहीं है।' });
  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err.message);
  res.status(status).json({
    success: false,
    message: status >= 500 && process.env.NODE_ENV === 'production' ? 'सर्वर में समस्या है। कृपया बाद में कोशिश करें।' : err.message,
  });
};
