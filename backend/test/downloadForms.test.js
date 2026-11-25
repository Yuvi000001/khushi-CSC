const test = require('node:test');
const assert = require('node:assert/strict');
const DownloadForm = require('../models/DownloadForm');
const PaymentReport = require('../models/PaymentReport');
const downloadForms = require('../controllers/downloadFormController');
const payments = require('../controllers/paymentController');
const razorpay = require('../utils/razorpay');

const FORM_ID = '507f1f77bcf86cd799439011';

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
  };
}

test('download forms accept a zero price for free forms', async () => {
  const form = new DownloadForm({
    title: 'Free form',
    price: 0,
    fileId: FORM_ID,
  });
  await assert.doesNotReject(form.validate());
});

test('Razorpay form orders use the saved form price instead of a client amount', async () => {
  const previousFindOne = DownloadForm.findOne;
  const previousCreateOrder = razorpay.createOrder;
  const previousGetKeyId = razorpay.getKeyId;
  const previousCreateReport = PaymentReport.create;
  let orderRequest;
  let report;
  DownloadForm.findOne = () => ({
    select() { return this; },
    lean: async () => ({ _id: FORM_ID, title: 'Ayushman form', price: 5 }),
  });
  razorpay.createOrder = async (value) => {
    orderRequest = value;
    return { id: 'order_form123', amount: 500, currency: 'INR' };
  };
  razorpay.getKeyId = () => 'rzp_test_key';
  PaymentReport.create = async (value) => { report = value; };
  try {
    const res = response();
    await payments.createRazorpayOrder({
      body: { itemType: 'form', itemSlug: FORM_ID, amount: 0.01 },
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 201);
    assert.equal(orderRequest.amount, 500);
    assert.equal(report.amount, 5);
    assert.equal(report.itemType, 'form');
    assert.equal(report.itemSlug, FORM_ID);
    assert.equal(res.data.data.amount, 500);
  } finally {
    DownloadForm.findOne = previousFindOne;
    razorpay.createOrder = previousCreateOrder;
    razorpay.getKeyId = previousGetKeyId;
    PaymentReport.create = previousCreateReport;
  }
});

test('paid form downloads require a verified payment for that exact form and amount', async () => {
  const previousFindOne = DownloadForm.findOne;
  const previousExists = PaymentReport.exists;
  let paymentQuery;
  DownloadForm.findOne = () => ({
    populate: async () => ({
      _id: FORM_ID,
      price: 5,
      fileId: {},
    }),
  });
  PaymentReport.exists = async (query) => {
    paymentQuery = query;
    return null;
  };
  try {
    const res = response();
    await downloadForms.download({
      params: { id: FORM_ID },
      query: { payment_id: 'pay_test123' },
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 403);
    assert.deepEqual(paymentQuery, {
      itemType: 'form',
      itemSlug: FORM_ID,
      amount: 5,
      razorpayPaymentId: 'pay_test123',
      status: 'verified',
    });
  } finally {
    DownloadForm.findOne = previousFindOne;
    PaymentReport.exists = previousExists;
  }
});
