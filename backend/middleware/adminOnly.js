module.exports = function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'यह सुविधा सिर्फ प्रशासक के लिए है।' });
  }
  next();
};
