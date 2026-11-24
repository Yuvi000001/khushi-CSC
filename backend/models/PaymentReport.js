const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  itemType: { type: String, enum: ['service', 'scheme', 'custom'], required: true },
  itemSlug: { type: String, required: true, trim: true, maxlength: 80 },
  itemName: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0.01, max: 1000000 },
  customerName: { type: String, required() { return this.paymentMethod !== 'razorpay'; }, trim: true, minlength: 2, maxlength: 100 },
  mobile: { type: String, required() { return this.paymentMethod !== 'razorpay'; }, match: /^[6-9]\d{9}$/ },
  transactionId: { type: String, required: true, trim: true, lowercase: true, minlength: 6, maxlength: 50, unique: true },
  paymentMethod: { type: String, enum: ['upi', 'razorpay'], default: 'upi', index: true },
  razorpayOrderId: { type: String, trim: true, unique: true, sparse: true },
  razorpayPaymentId: { type: String, trim: true, unique: true, sparse: true },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending', index: true },
}, { timestamps: true });

module.exports = mongoose.model('PaymentReport', schema);
