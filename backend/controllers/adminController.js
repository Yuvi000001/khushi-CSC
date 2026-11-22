const mongoose = require('mongoose');
const User = require('../models/User');
const Service = require('../models/Service');
const Application = require('../models/Application');
const ContactMessage = require('../models/ContactMessage');
const UploadedFile = require('../models/UploadedFile');
const PaymentReport = require('../models/PaymentReport');
const { sendMail } = require('../config/mailer');
const tpl = require('../utils/emailTemplates');

const bad = (res, m, c = 404) => res.status(c).json({ success: false, message: m });
const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ist = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

exports.dashboard = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 6 * 86400000);
    since.setHours(0, 0, 0, 0);
    const [total, pending, progress, done, users, enquiries, newEnq, recent, pendingPayments, recentPayments, byDay] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'progress' }),
      Application.countDocuments({ status: 'done' }),
      User.countDocuments(),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ status: 'new' }),
      Application.find().populate('serviceId', 'name').sort({ createdAt: -1 }).limit(6).lean(),
      PaymentReport.countDocuments({ status: 'pending' }),
      PaymentReport.find().sort({ createdAt: -1 }).limit(10).lean(),
      Application.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, n: { $sum: 1 } } },
      ]),
    ]);
    const map = Object.fromEntries(byDay.map((d) => [d._id, d.n]));
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const key = ist(Date.now() - i * 86400000);
      weekly.push({ date: key, count: map[key] || 0 });
    }
    res.json({ success: true, data: { stats: { total, pending, progress, done, users, enquiries, newEnquiries: newEnq, pendingPayments }, weekly, recent, recentPayments } });
  } catch (e) { next(e); }
};

exports.applications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1), limit = 15;
    const q = {};
    if (['pending', 'progress', 'done', 'cancelled'].includes(req.query.status)) q.status = req.query.status;
    if (req.query.q) {
      const re = new RegExp(escRe(String(req.query.q).slice(0, 40)), 'i');
      q.$or = [{ reference: re }, { applicantName: re }, { applicantMobile: re }];
    }
    const [items, total] = await Promise.all([
      Application.find(q).populate('serviceId', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Application.countDocuments(q),
    ]);
    res.json({ success: true, data: { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (e) { next(e); }
};

exports.updateApplicationStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 'आवेदन नहीं मिला।');
    const app = await Application.findById(req.params.id).populate('userId', 'email');
    if (!app) return bad(res, 'आवेदन नहीं मिला।');
    app.status = req.body.status;
    app.statusHistory.push({ status: req.body.status, note: req.body.note || '' });
    await app.save();
    if (app.userId && app.userId.email) sendMail({ to: app.userId.email, ...tpl.statusUpdate(app.applicantName, app.reference, app.status) });
    res.json({ success: true, message: 'स्थिति बदल दी गई।' });
  } catch (e) { next(e); }
};

exports.deleteApplication = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 'आवेदन नहीं मिला।');
    const r = await Application.findByIdAndDelete(req.params.id);
    if (!r) return bad(res, 'आवेदन नहीं मिला।');
    res.json({ success: true, message: 'आवेदन हटा दिया गया।' });
  } catch (e) { next(e); }
};

const SERVICE_FIELDS = ['name', 'nameEn', 'category', 'description', 'price', 'icon', 'features', 'documents', 'active', 'displayOrder'];
const pick = (body) => Object.fromEntries(SERVICE_FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `service-${Date.now()}`;

exports.allServices = async (req, res, next) => {
  try { res.json({ success: true, data: await Service.find().sort({ displayOrder: 1, createdAt: 1 }).lean() }); } catch (e) { next(e); }
};

exports.createService = async (req, res, next) => {
  try {
    const data = pick(req.body);
    let slug = slugify(req.body.nameEn || req.body.name);
    if (await Service.findOne({ slug })) slug += `-${Date.now().toString(36)}`;
    const s = await Service.create({ ...data, slug });
    res.status(201).json({ success: true, message: 'सेवा जोड़ दी गई।', data: s });
  } catch (e) { next(e); }
};

exports.updateService = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 'सेवा नहीं मिली।');
    const s = await Service.findByIdAndUpdate(req.params.id, { $set: pick(req.body) }, { new: true, runValidators: true });
    if (!s) return bad(res, 'सेवा नहीं मिली।');
    res.json({ success: true, message: 'सेवा अपडेट हो गई।', data: s });
  } catch (e) { next(e); }
};

exports.deleteService = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 'सेवा नहीं मिली।');
    const s = await Service.findByIdAndDelete(req.params.id);
    if (!s) return bad(res, 'सेवा नहीं मिली।');
    res.json({ success: true, message: 'सेवा हटा दी गई।' });
  } catch (e) { next(e); }
};

exports.enquiries = async (req, res, next) => {
  try { res.json({ success: true, data: await ContactMessage.find().sort({ createdAt: -1 }).limit(200).lean() }); } catch (e) { next(e); }
};

exports.updateEnquiryStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 'पूछताछ नहीं मिली।');
    const r = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status });
    if (!r) return bad(res, 'पूछताछ नहीं मिली।');
    res.json({ success: true, message: 'स्थिति बदल दी गई।' });
  } catch (e) { next(e); }
};

exports.users = async (req, res, next) => {
  try { res.json({ success: true, data: await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(300).lean() }); } catch (e) { next(e); }
};

exports.files = async (req, res, next) => {
  try { res.json({ success: true, data: await UploadedFile.find().populate('ownerId', 'name').sort({ createdAt: -1 }).limit(200).lean() }); } catch (e) { next(e); }
};
