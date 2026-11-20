const mongoose = require('mongoose');
const Application = require('../models/Application');
const { findByIdOrSlug } = require('./serviceController');
const generateReference = require('../utils/generateReference');
const { sendMail } = require('../config/mailer');
const tpl = require('../utils/emailTemplates');

exports.create = async (req, res, next) => {
  try {
    const service = await findByIdOrSlug(req.body.serviceId);
    if (!service || !service.active) return res.status(404).json({ success: false, message: 'सेवा नहीं मिली।' });
    let app;
    for (let i = 0; i < 5 && !app; i++) {
      try {
        app = await Application.create({
          userId: req.user._id, // browser से कभी नहीं लेते
          serviceId: service._id,
          reference: generateReference(),
          applicantName: req.body.applicantName,
          applicantMobile: req.body.applicantMobile,
          notes: req.body.notes || '',
          statusHistory: [{ status: 'pending', note: 'आवेदन दर्ज हुआ' }],
        });
      } catch (e) { if (e.code !== 11000) throw e; }
    }
    if (!app) throw new Error('reference generate nahi hua');
    sendMail({ to: req.user.email, ...tpl.applicationAck(app.applicantName, app.reference, service.name) });
    res.status(201).json({ success: true, message: 'आवेदन दर्ज हो गया।', data: { reference: app.reference, id: app._id } });
  } catch (e) { next(e); }
};

exports.my = async (req, res, next) => {
  try {
    const items = await Application.find({ userId: req.user._id })
      .populate('serviceId', 'name nameEn slug icon').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'आवेदन नहीं मिला।' });
    const app = await Application.findById(req.params.id).populate('serviceId', 'name nameEn slug').lean();
    const owner = app && String(app.userId) === String(req.user._id);
    if (!app || (!owner && req.user.role !== 'admin')) return res.status(404).json({ success: false, message: 'आवेदन नहीं मिला।' });
    res.json({ success: true, data: app });
  } catch (e) { next(e); }
};
