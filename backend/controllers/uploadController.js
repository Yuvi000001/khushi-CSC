const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const UploadedFile = require('../models/UploadedFile');

const FOLDERS = { profiles: 'khushi/profiles', gallery: 'khushi/gallery', documents: 'khushi/documents' };
const MAGIC = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.slice(0, 4).toString('hex') === '89504e47',
  'image/webp': (b) => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP',
  'application/pdf': (b) => b.slice(0, 4).toString() === '%PDF',
};

const stream = (buffer, opts) => new Promise((resolve, reject) => {
  cloudinary.uploader.upload_stream(opts, (err, r) => (err ? reject(err) : resolve(r))).end(buffer);
});

exports.upload = async (req, res, next) => {
  let result;
  try {
    const f = req.file;
    if (!f) return res.status(400).json({ success: false, message: 'फ़ाइल चुनें।' });
    const kind = FOLDERS[req.body.kind] ? req.body.kind : 'documents';
    if (kind === 'gallery' && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'अनुमति नहीं है।' });
    if (!MAGIC[f.mimetype](f.buffer)) return res.status(400).json({ success: false, message: 'फ़ाइल की सामग्री मान्य नहीं है।' });
    const isImage = f.mimetype.startsWith('image/');
    if (isImage && f.size > 5 * 1024 * 1024) return res.status(400).json({ success: false, message: 'फोटो 5MB से छोटी होनी चाहिए।' });
    const isPrivate = kind === 'documents';

    result = await stream(f.buffer, {
      folder: FOLDERS[kind],
      resource_type: 'auto',
      type: isPrivate ? 'authenticated' : 'upload',
    });
    const doc = await UploadedFile.create({
      ownerId: req.user._id,
      cloudinaryPublicId: result.public_id,
      secureUrl: result.secure_url,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      folder: FOLDERS[kind],
      isPrivate,
    });
    res.status(201).json({ success: true, message: 'फ़ाइल अपलोड हो गई।', data: { id: doc._id, url: isPrivate ? null : doc.secureUrl, isPrivate } });
  } catch (e) {
    if (result) cloudinary.uploader.destroy(result.public_id, { resource_type: result.resource_type, type: result.type }).catch(() => {});
    next(e);
  }
};

// निजी दस्तावेज़ का अस्थायी (10 मिनट) डाउनलोड लिंक — सिर्फ मालिक या प्रशासक
exports.signedUrl = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'फ़ाइल नहीं मिली।' });
    const f = await UploadedFile.findById(req.params.id);
    if (!f || (String(f.ownerId) !== String(req.user._id) && req.user.role !== 'admin')) {
      return res.status(404).json({ success: false, message: 'फ़ाइल नहीं मिली।' });
    }
    if (!f.isPrivate) return res.json({ success: true, data: { url: f.secureUrl } });
    const url = cloudinary.utils.private_download_url(f.cloudinaryPublicId, f.format, {
      resource_type: f.resourceType, type: 'authenticated', expires_at: Math.floor(Date.now() / 1000) + 600,
    });
    res.json({ success: true, data: { url } });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'फ़ाइल नहीं मिली।' });
    const f = await UploadedFile.findById(req.params.id);
    if (!f) return res.status(404).json({ success: false, message: 'फ़ाइल नहीं मिली।' });
    await cloudinary.uploader.destroy(f.cloudinaryPublicId, { resource_type: f.resourceType, type: f.isPrivate ? 'authenticated' : 'upload' });
    await f.deleteOne();
    res.json({ success: true, message: 'फ़ाइल हटा दी गई।' });
  } catch (e) { next(e); }
};
