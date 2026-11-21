const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const UploadedFile = require('../models/UploadedFile');
const Scheme = require('../models/Scheme');
const DownloadForm = require('../models/DownloadForm');
const path = require('path');
const crypto = require('crypto');

const FOLDERS = { profiles: 'khushi/profiles', gallery: 'khushi/gallery', documents: 'khushi/documents', forms: 'khushi/forms' };
const MAGIC = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.slice(0, 4).toString('hex') === '89504e47',
  'image/webp': (b) => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP',
  'application/pdf': (b) => b.slice(0, 4).toString() === '%PDF',
  'application/msword': (b) => b.slice(0, 4).toString('hex') === 'd0cf11e0',
  'application/vnd.ms-excel': (b) => b.slice(0, 4).toString('hex') === 'd0cf11e0',
  'application/vnd.ms-powerpoint': (b) => b.slice(0, 4).toString('hex') === 'd0cf11e0',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (b) => b.slice(0, 2).toString() === 'PK',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': (b) => b.slice(0, 2).toString() === 'PK',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': (b) => b.slice(0, 2).toString() === 'PK',
  'application/vnd.oasis.opendocument.text': (b) => b.slice(0, 2).toString() === 'PK',
  'application/vnd.oasis.opendocument.spreadsheet': (b) => b.slice(0, 2).toString() === 'PK',
  'application/vnd.oasis.opendocument.presentation': (b) => b.slice(0, 2).toString() === 'PK',
  'application/rtf': (b) => b.slice(0, 5).toString() === '{\\rtf',
  'text/rtf': (b) => b.slice(0, 5).toString() === '{\\rtf',
};
const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp', '.rtf', '.txt', '.csv']);
const FORM_SIGNATURES = {
  '.pdf': (b) => b.slice(0, 4).toString() === '%PDF',
  '.doc': (b) => b.slice(0, 4).toString('hex') === 'd0cf11e0',
  '.xls': (b) => b.slice(0, 4).toString('hex') === 'd0cf11e0',
  '.ppt': (b) => b.slice(0, 4).toString('hex') === 'd0cf11e0',
  '.docx': (b) => b.slice(0, 2).toString() === 'PK',
  '.xlsx': (b) => b.slice(0, 2).toString() === 'PK',
  '.pptx': (b) => b.slice(0, 2).toString() === 'PK',
  '.odt': (b) => b.slice(0, 2).toString() === 'PK',
  '.ods': (b) => b.slice(0, 2).toString() === 'PK',
  '.odp': (b) => b.slice(0, 2).toString() === 'PK',
  '.rtf': (b) => b.slice(0, 5).toString() === '{\\rtf',
  '.txt': (b) => !b.includes(0),
  '.csv': (b) => !b.includes(0),
};

const stream = (buffer, opts) => new Promise((resolve, reject) => {
  cloudinary.uploader.upload_stream(opts, (err, r) => (err ? reject(err) : resolve(r))).end(buffer);
});

exports.upload = async (req, res, next) => {
  let result;
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ success: false, message: 'फ़ाइल अपलोड configure नहीं है। पहले .env में Cloudinary जानकारी जोड़ें।' });
    }
    const f = req.file;
    if (!f) return res.status(400).json({ success: false, message: 'फ़ाइल चुनें।' });
    const kind = FOLDERS[req.body.kind] ? req.body.kind : 'documents';
    if (kind === 'gallery' && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'अनुमति नहीं है।' });
    if ((kind === 'forms' && req.user.role !== 'admin')) return res.status(403).json({ success: false, message: 'अनुमति नहीं है।' });
    const ext = path.extname(f.originalname).toLowerCase();
    if (kind === 'forms' && !DOCUMENT_EXTENSIONS.has(ext)) {
      return res.status(400).json({ success: false, message: 'PDF, Word, Excel, PowerPoint, OpenDocument, RTF, TXT या CSV फ़ाइल चुनें।' });
    }
    const magic = MAGIC[f.mimetype];
    const invalidContent = kind === 'forms'
      ? !FORM_SIGNATURES[ext](f.buffer)
      : (!magic || !magic(f.buffer));
    if (invalidContent) {
      return res.status(400).json({ success: false, message: 'फ़ाइल की सामग्री मान्य नहीं है।' });
    }
    const isImage = f.mimetype.startsWith('image/');
    if (isImage && f.size > 5 * 1024 * 1024) return res.status(400).json({ success: false, message: 'फोटो 5MB से छोटी होनी चाहिए।' });
    if (kind === 'forms' && f.size > 20 * 1024 * 1024) return res.status(400).json({ success: false, message: 'दस्तावेज़ 20MB से छोटी होनी चाहिए।' });
    if (kind === 'documents' && f.size > 10 * 1024 * 1024) return res.status(400).json({ success: false, message: 'फ़ाइल 10MB से छोटी होनी चाहिए।' });
    const isForm = kind === 'forms';
    const isPrivate = kind === 'documents' || isForm;

    result = await stream(f.buffer, {
      folder: FOLDERS[kind],
      resource_type: isForm ? 'raw' : 'auto',
      type: isPrivate ? 'authenticated' : 'upload',
      ...(isForm ? {
        public_id: `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`,
      } : {}),
    });
    const doc = await UploadedFile.create({
      ownerId: req.user._id,
      cloudinaryPublicId: result.public_id,
      secureUrl: result.secure_url,
      resourceType: result.resource_type,
      format: result.format,
      originalName: f.originalname,
      mimeType: f.mimetype,
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
    if (await Scheme.exists({ imageFileId: f._id })) {
      return res.status(409).json({ success: false, message: 'यह फोटो एक योजना में इस्तेमाल हो रही है। पहले योजना की फोटो बदलें या योजना हटाएं।' });
    }
    if (await DownloadForm.exists({ fileId: f._id })) {
      return res.status(409).json({ success: false, message: 'यह फ़ाइल डाउनलोड फॉर्म में इस्तेमाल हो रही है। पहले डाउनलोड फॉर्म हटाएं।' });
    }
    await cloudinary.uploader.destroy(f.cloudinaryPublicId, { resource_type: f.resourceType, type: f.isPrivate ? 'authenticated' : 'upload' });
    await f.deleteOne();
    res.json({ success: true, message: 'फ़ाइल हटा दी गई।' });
  } catch (e) { next(e); }
};
