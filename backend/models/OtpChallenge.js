const mongoose = require('mongoose');

const signupDataSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 80 },
  mobile: { type: String, trim: true, match: /^[6-9]\d{9}$/ },
  passwordHash: { type: String },
}, { _id: false });

const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  purpose: { type: String, enum: ['signup', 'login'], required: true },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0, min: 0, max: 5 },
  expiresAt: { type: Date, required: true },
  lastSentAt: { type: Date, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionVersion: { type: Number },
  signupData: { type: signupDataSchema },
}, { timestamps: true });

schema.index({ email: 1, purpose: 1 }, { unique: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpChallenge', schema);
