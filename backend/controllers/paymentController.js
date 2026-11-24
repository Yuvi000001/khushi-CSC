const mongoose = require('mongoose');
const crypto = require('crypto');
const PaymentReport = require('../models/PaymentReport');
const Service = require('../models/Service');
const Scheme = require('../models/Scheme');
const razorpay = require('../utils/razorpay');

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

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    let itemName;
    let itemSlug;
    let itemPrice;
    if (req.body.itemType === 'custom') {
      if (req.body.itemSlug !== 'custom-payment') {
        return bad(res, 'भुगतान विकल्प सही नहीं है।', 400);
      }
      itemPrice = Number(req.body.amount);
      if (!Number.isFinite(itemPrice) || itemPrice < 1 || itemPrice > 1000000) {
        return bad(res, 'राशि ₹1 से ₹10,00,000 के बीच रखें।', 400);
      }
      itemName = 'सामान्य भुगतान';
      itemSlug = 'custom-payment';
    } else {
      const Model = req.body.itemType === 'service' ? Service : Scheme;
      const item = await Model.findOne({ slug: req.body.itemSlug, active: true }).select('name price').lean();
      if (!item || !(item.price > 0) || item.price > 1000000) {
        return bad(res, 'इस सेवा या योजना का भुगतान उपलब्ध नहीं है।', 404);
      }
      itemName = item.name;
      itemSlug = req.body.itemSlug;
      itemPrice = item.price;
    }

    const amount = Math.round(itemPrice * 100);
    const order = await razorpay.createOrder({
      amount,
      currency: 'INR',
      receipt: crypto.randomUUID(),
      notes: { itemType: req.body.itemType, itemSlug },
    });
    if (!order.id || order.amount !== amount || order.currency !== 'INR') {
      return bad(res, 'Razorpay से भुगतान ऑर्डर नहीं बन पाया।', 502);
    }

    await PaymentReport.create({
      itemType: req.body.itemType,
      itemSlug,
      itemName,
      amount: itemPrice,
      customerName: req.body.customerName || 'Razorpay ग्राहक',
      ...(req.body.mobile ? { mobile: req.body.mobile } : {}),
      transactionId: order.id,
      paymentMethod: 'razorpay',
      razorpayOrderId: order.id,
    });

    res.status(201).json({
      success: true,
      data: {
        keyId: razorpay.getKeyId(),
        orderId: order.id,
        amount,
        currency: 'INR',
        customerName: req.body.customerName,
        mobile: req.body.mobile,
      },
    });
  } catch (error) { next(error); }
};

exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return bad(res, 'Razorpay API secret सेट नहीं है।', 503);
    }
    const report = await PaymentReport.findOne({ razorpayOrderId: orderId });
    if (!report) return bad(res, 'भुगतान ऑर्डर नहीं मिला।', 404);
    if (!razorpay.verifyCheckoutSignature(orderId, paymentId, signature, process.env.RAZORPAY_KEY_SECRET)) {
      return bad(res, 'Razorpay भुगतान हस्ताक्षर अमान्य है।', 400);
    }
    if (report.status === 'verified') {
      if (report.razorpayPaymentId === paymentId) {
        return res.json({ success: true, data: { status: 'verified' }, message: 'भुगतान की पुष्टि हो गई।' });
      }
      return bad(res, 'इस ऑर्डर का भुगतान पहले ही दर्ज हो चुका है।', 409);
    }

    const payment = await razorpay.fetchPayment(paymentId);
    if (payment.id !== paymentId || payment.order_id !== orderId || payment.amount !== Math.round(report.amount * 100)) {
      return bad(res, 'Razorpay भुगतान का विवरण ऑर्डर से मेल नहीं खाता।', 409);
    }
    if (!['captured', 'authorized'].includes(payment.status)) {
      return bad(res, 'Razorpay ने भुगतान की पुष्टि नहीं की।', 409);
    }

    const status = payment.status === 'captured' ? 'verified' : 'pending';
    const updatedReport = await PaymentReport.findOneAndUpdate(
      { _id: report._id, status: { $ne: 'verified' } },
      { $set: { transactionId: paymentId, razorpayPaymentId: paymentId, status } },
      { new: true, runValidators: true },
    );
    const currentReport = updatedReport || await PaymentReport.findById(report._id).select('status razorpayPaymentId');
    if (!currentReport || (currentReport.razorpayPaymentId && currentReport.razorpayPaymentId !== paymentId)) {
      return bad(res, 'इस ऑर्डर का भुगतान पहले ही दर्ज हो चुका है।', 409);
    }
    const finalStatus = currentReport.status;
    const message = finalStatus === 'verified'
      ? 'भुगतान की पुष्टि हो गई।'
      : 'भुगतान अधिकृत है और अंतिम पुष्टि की प्रतीक्षा में है।';
    res.json({ success: true, data: { status: finalStatus }, message });
  } catch (error) { next(error); }
};

exports.handleRazorpayWebhook = async (req, res, next) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return bad(res, 'Razorpay webhook secret सेट नहीं है।', 503);
  const signature = req.get('x-razorpay-signature');
  if (!razorpay.verifyWebhookSignature(req.body, signature, secret)) {
    return bad(res, 'Razorpay webhook हस्ताक्षर अमान्य है।', 400);
  }

  try {
    const event = JSON.parse(req.body.toString('utf8'));
    if (!event || typeof event !== 'object') return bad(res, 'Razorpay webhook का JSON अमान्य है।', 400);
    const payment = event.payload && event.payload.payment && event.payload.payment.entity;
    if (
      !payment ||
      !payment.order_id ||
      !payment.id ||
      !Number.isSafeInteger(payment.amount)
    ) {
      return res.json({ success: true });
    }
    const report = await PaymentReport.findOne({ razorpayOrderId: payment.order_id });
    if (!report || payment.amount !== Math.round(report.amount * 100)) {
      return res.json({ success: true });
    }

    if (event.event === 'payment.captured') {
      await PaymentReport.findOneAndUpdate(
        { _id: report._id, status: { $ne: 'verified' } },
        { $set: { transactionId: payment.id, razorpayPaymentId: payment.id, status: 'verified' } },
        { runValidators: true },
      );
    } else if (event.event === 'payment.failed') {
      await PaymentReport.findOneAndUpdate(
        { _id: report._id, status: 'pending' },
        { $set: { transactionId: payment.id, razorpayPaymentId: payment.id, status: 'rejected' } },
        { runValidators: true },
      );
    }
    res.json({ success: true });
  } catch (error) {
    if (error instanceof SyntaxError) return bad(res, 'Razorpay webhook का JSON अमान्य है।', 400);
    next(error);
  }
};

exports.adminList = async (req, res, next) => {
  try {
    const requestedPage = Number(req.query.page);
    const safePage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = 15;
    const filter = ['pending', 'verified', 'rejected'].includes(req.query.status)
      ? { status: req.query.status }
      : {};
    const total = await PaymentReport.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(safePage, pages);
    const items = await PaymentReport.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean();
    res.json({ success: true, data: { items, total, page, pages } });
  } catch (error) { next(error); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 'भुगतान रिपोर्ट नहीं मिली।');
    const report = await PaymentReport.findById(req.params.id).select('paymentMethod');
    if (!report) return bad(res, 'भुगतान रिपोर्ट नहीं मिली।');
    if (report && report.paymentMethod === 'razorpay') {
      return bad(res, 'Razorpay भुगतानों की स्थिति webhook से स्वतः अपडेट होती है।', 409);
    }
    const updatedReport = await PaymentReport.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body.status } },
      { new: true, runValidators: true },
    );
    if (!updatedReport) return bad(res, 'भुगतान रिपोर्ट नहीं मिली।');
    res.json({ success: true, message: 'भुगतान की स्थिति अपडेट हो गई।' });
  } catch (error) { next(error); }
};
