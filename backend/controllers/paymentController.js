const mongoose = require('mongoose');
const PaymentReport = require('../models/PaymentReport');
const Service = require('../models/Service');
const Scheme = require('../models/Scheme');

const bad = (res, message, status = 404) => res.status(status).json({ success: false, message });

exports.submit = async (req, res, next) => {
  try {
    const Model = req.body.itemType === 'service' ? Service : Scheme;
    const item = await Model.findOne({ slug: req.body.itemSlug, active: true }).select('name price').lean();
    if (!item || !(item.price > 0)) return bad(res, 'इस सेवा या योजना का भुगतान उपलब्ध नहीं है।', 404);
    if (Math.round(Number(req.body.amount) * 100) !== Math.round(item.price * 100)) {
      return bad(res, 'राशि बदल गई है। पेज रीफ़्रेश करके नया QR खोलें।', 409);
    }

    const report = await PaymentReport.create({
      itemType: req.body.itemType,
      itemSlug: req.body.itemSlug,
      itemName: item.name,
      amount: item.price,
      customerName: req.body.customerName,
      mobile: req.body.mobile,
      transactionId: req.body.transactionId,
    });
    res.status(201).json({
      success: true,
      message: 'भुगतान रिपोर्ट मिल गई। यह अभी जाँच के लिए लंबित है।',
      data: { reference: report._id },
    });
  } catch (error) {
    if (error.code === 11000) return bad(res, 'यह UPI transaction reference पहले ही दर्ज है।', 409);
    next(error);
  }
};

exports.adminList = async (req, res, next) => {
  try {
    const data = await PaymentReport.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 'भुगतान रिपोर्ट नहीं मिली।');
    const report = await PaymentReport.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body.status } },
      { new: true, runValidators: true },
    );
    if (!report) return bad(res, 'भुगतान रिपोर्ट नहीं मिली।');
    res.json({ success: true, message: 'भुगतान की स्थिति अपडेट हो गई।' });
  } catch (error) { next(error); }
};
