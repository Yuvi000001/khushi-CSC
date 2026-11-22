const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const UploadedFile = require('../models/UploadedFile');
const Scheme = require('../models/Scheme');
const DownloadForm = require('../models/DownloadForm');
const privateCloudinaryUrl = require('../utils/privateCloudinaryUrl');
const path = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const { IMAGE_EXTENSIONS } = require('../utils/imageTypes');

const FOLDERS = { profiles: 'khushi/profiles', gallery: 'khushi/gallery', documents: 'khushi/documents', forms: 'khushi/forms', ads: 'khushi/ads' };
const PREVIEW_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
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
    if (['gallery', 'forms', 'ads'].includes(kind) && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'अनुमति नहीं है।' });
    const ext = path.extname(f.originalname).toLowerCase();
    if (kind === 'forms' && !DOCUMENT_EXTENSIONS.has(ext)) {
      return res.status(400).json({ success: false, message: 'PDF, Word, Excel, PowerPoint, OpenDocument, RTF, TXT या CSV फ़ाइल चुनें।' });
    }
    const imageType = IMAGE_EXTENSIONS[ext];
    const declaredImageType = f.mimetype === imageType || f.mimetype === 'application/octet-stream';
    const isImage = !!imageType && declaredImageType;
    const magic = MAGIC[f.mimetype];
    const imageMagic = imageType && MAGIC[imageType];
    const invalidContent = kind === 'forms'
      ? !FORM_SIGNATURES[ext](f.buffer)
      : isImage
        ? !imageMagic || !imageMagic(f.buffer)
        : kind === 'ads' || !magic || !magic(f.buffer);
    if (invalidContent) {
      return res.status(400).json({ success: false, message: 'फ़ाइल की सामग्री मान्य नहीं है।' });
    }
    if (kind === 'ads' && f.size > 5 * 1024 * 1024) return res.status(400).json({ success: false, message: 'फोटो 5MB से छोटी होनी चाहिए।' });
    if (isImage && kind !== 'ads' && f.size > 5 * 1024 * 1024) return res.status(400).json({ success: false, message: 'फोटो 5MB से छोटी होनी चाहिए।' });
    if (kind === 'forms' && f.size > 20 * 1024 * 1024) return res.status(400).json({ success: false, message: 'दस्तावेज़ 20MB से छोटी होनी चाहिए।' });
    if (kind === 'documents' && f.size > 10 * 1024 * 1024) return res.status(400).json({ success: false, message: 'फ़ाइल 10MB से छोटी होनी चाहिए।' });
    const isForm = kind === 'forms';
    const isPrivate = kind === 'documents' || isForm;

    try {
      result = await stream(f.buffer, {
        folder: FOLDERS[kind],
        resource_type: isForm ? 'raw' : 'auto',
        type: isPrivate ? 'authenticated' : 'upload',
        ...(isForm ? {
          public_id: `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`,
        } : {}),
      });
    } catch (error) {
      if (kind === 'ads' && [400, 415].includes(error.http_code)) {
        return res.status(400).json({ success: false, message: 'यह फोटो फ़ॉर्मेट स्वीकार नहीं हुआ। कोई दूसरा image format चुनें।' });
      }
      throw error;
    }
    if (kind === 'ads' && result.resource_type !== 'image') {
      const uploaded = result;
      result = null;
      await cloudinary.uploader.destroy(uploaded.public_id, { resource_type: uploaded.resource_type, type: uploaded.type });
      return res.status(400).json({ success: false, message: 'यह image format होम स्लाइड में नहीं दिख सकता। कोई दूसरा फोटो फ़ॉर्मेट चुनें।' });
    }
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

exports.view = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'फ़ाइल नहीं मिली।' });
    const file = await UploadedFile.findById(req.params.id);
    if (!file || (String(file.ownerId) !== String(req.user._id) && req.user.role !== 'admin')) {
      return res.status(404).json({ success: false, message: 'फ़ाइल नहीं मिली।' });
    }
    if (!PREVIEW_MIME_TYPES.has(file.mimeType)) {
      return res.status(415).json({ success: false, message: 'इस फ़ाइल का preview उपलब्ध नहीं है।' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return res.status(503).json({ success: false, message: 'फ़ाइल preview configure नहीं है।' });

    let url;
    if (file.isPrivate) {
      url = privateCloudinaryUrl(file);
      if (!url) {
        return res.status(502).json({ success: false, message: 'फ़ाइल preview उपलब्ध नहीं है।' });
      }
    } else {
      url = new URL(file.secureUrl);
      if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com'
        || !url.pathname.startsWith(`/${cloudName}/`)) {
        return res.status(502).json({ success: false, message: 'फ़ाइल preview उपलब्ध नहीं है।' });
      }
    }

    const upstream = await fetch(url);
    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ success: false, message: 'फ़ाइल preview उपलब्ध नहीं है।' });
    }
    const filename = String(file.originalName || file.cloudinaryPublicId).split(/[\\/]/).pop().replace(/[\r\n"]/g, '_');
    const fallback = filename.replace(/[^\x20-\x7E]/g, '_').replace(/[\\/]/g, '_');
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `${file.mimeType === 'application/pdf' ? 'attachment' : 'inline'}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    });
    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (e) {
    if (res.headersSent) return res.destroy(e);
    next(e);
  }
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
