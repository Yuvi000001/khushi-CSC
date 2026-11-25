const mongoose = require('mongoose');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const DownloadForm = require('../models/DownloadForm');
const UploadedFile = require('../models/UploadedFile');
const PaymentReport = require('../models/PaymentReport');
const privateCloudinaryUrl = require('../utils/privateCloudinaryUrl');

const bad = (res, message, status = 404) => res.status(status).json({ success: false, message });
const FILE_FIELDS = 'originalName mimeType bytes';

exports.list = async (req, res, next) => {
  try {
    const forms = await DownloadForm.find({ active: true })
      .populate('fileId', FILE_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      success: true,
      data: forms.filter((form) => form.fileId).map((form) => ({
        _id: form._id,
        title: form.title,
        description: form.description,
        price: Number(form.price) || 0,
        fileName: form.fileId.originalName,
        mimeType: form.fileId.mimeType,
        bytes: form.fileId.bytes,
      })),
    });
  } catch (e) { next(e); }
};

exports.adminList = async (req, res, next) => {
  try {
    const forms = await DownloadForm.find().populate('fileId', FILE_FIELDS).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: forms.map((form) => ({ ...form, price: Number(form.price) || 0 })) });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const file = await UploadedFile.findOne({
      _id: req.body.fileId,
      ownerId: req.user._id,
      folder: 'khushi/forms',
      isPrivate: true,
      resourceType: 'raw',
    });
    if (!file) return bad(res, 'अपलोड किया हुआ दस्तावेज़ नहीं मिला।', 422);
    const form = await DownloadForm.create({
      title: req.body.title,
      description: req.body.description || '',
      price: Number(req.body.price),
      fileId: file._id,
    });
    res.status(201).json({ success: true, message: 'डाउनलोड फॉर्म जोड़ दिया गया।', data: form });
  } catch (e) {
    if (e.code === 11000) return bad(res, 'यह दस्तावेज़ पहले से डाउनलोड फॉर्म में है।', 409);
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 'डाउनलोड फॉर्म नहीं मिला।');
    const form = await DownloadForm.findByIdAndDelete(req.params.id);
    if (!form) return bad(res, 'डाउनलोड फॉर्म नहीं मिला।');
    res.json({ success: true, message: 'डाउनलोड फॉर्म हटा दिया गया।', data: { fileId: form.fileId } });
  } catch (e) { next(e); }
};

exports.download = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 'डाउनलोड फॉर्म नहीं मिला।');
    const form = await DownloadForm.findOne({ _id: req.params.id, active: true }).populate('fileId');
    if (!form || !form.fileId) return bad(res, 'डाउनलोड फॉर्म नहीं मिला।');

    if (form.price > 0) {
      const paymentId = req.query.payment_id;
      if (typeof paymentId !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) {
        return bad(res, 'डाउनलोड से पहले Razorpay भुगतान पूरा करें।', 403);
      }
      const payment = await PaymentReport.exists({
        itemType: 'form',
        itemSlug: String(form._id),
        amount: form.price,
        razorpayPaymentId: paymentId,
        status: 'verified',
      });
      if (!payment) return bad(res, 'इस फॉर्म के लिए सफल भुगतान नहीं मिला।', 403);
    }

    const file = form.fileId;
    if (file.resourceType !== 'raw' || !file.isPrivate) {
      return bad(res, 'डाउनलोड फाइल उपलब्ध नहीं है।', 502);
    }
    const url = privateCloudinaryUrl(file);
    if (!url) {
      return bad(res, 'डाउनलोड फाइल उपलब्ध नहीं है।', 502);
    }
    const upstream = await fetch(url);
    if (!upstream.ok || !upstream.body) return bad(res, 'डाउनलोड फाइल उपलब्ध नहीं है।', 502);
    const filename = String(file.originalName || form.title).split(/[\\/]/).pop().replace(/[\r\n"]/g, '_');
    const fallback = filename.replace(/[^\x20-\x7E]/g, '_').replace(/[\\/]/g, '_');
    res.set({
      'Content-Type': file.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    });
    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (e) {
    if (res.headersSent) return res.destroy(e);
    next(e);
  }
};
