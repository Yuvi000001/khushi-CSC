const mongoose = require('mongoose');
const Service = require('../models/Service');

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const documentExamples = (examples = []) => examples.flatMap((example) => {
  const file = example.imageFileId;
  return file && !file.isPrivate && file.resourceType === 'image' && IMAGE_MIME_TYPES.includes(file.mimeType)
    ? [{ name: example.name, imageUrl: file.secureUrl }]
    : [];
});

exports.findByIdOrSlug = (idOrSlug) =>
  /^[0-9a-fA-F]{24}$/.test(String(idOrSlug)) ? Service.findById(idOrSlug) : Service.findOne({ slug: idOrSlug });

exports.list = async (req, res, next) => {
  try {
    const items = await Service.find({ active: true }).select('-documentExamples').sort({ displayOrder: 1, createdAt: 1 }).lean();
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const s = await exports.findByIdOrSlug(req.params.id)
      .populate('documentExamples.imageFileId', 'secureUrl mimeType isPrivate resourceType')
      .lean();
    if (!s || !s.active) return res.status(404).json({ success: false, message: 'सेवा नहीं मिली।' });
    s.documentExamples = documentExamples(s.documentExamples);
    res.json({ success: true, data: s });
  } catch (e) { next(e); }
};
