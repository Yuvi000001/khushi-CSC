const mongoose = require('mongoose');
const Service = require('../models/Service');

exports.findByIdOrSlug = (idOrSlug) =>
  /^[0-9a-fA-F]{24}$/.test(String(idOrSlug)) ? Service.findById(idOrSlug) : Service.findOne({ slug: idOrSlug });

exports.list = async (req, res, next) => {
  try {
    const items = await Service.find({ active: true }).sort({ displayOrder: 1, createdAt: 1 }).lean();
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const s = await exports.findByIdOrSlug(req.params.id).lean();
    if (!s || !s.active) return res.status(404).json({ success: false, message: 'सेवा नहीं मिली।' });
    res.json({ success: true, data: s });
  } catch (e) { next(e); }
};
