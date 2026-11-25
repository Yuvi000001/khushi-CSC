const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, trim: true, unique: true },
  passwordHash: { type: String, required: true },
  sessionVersion: { type: Number, default: 0, min: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  verified: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ role: 1 }, {
  unique: true,
  partialFilterExpression: { role: 'admin' },
});
module.exports = mongoose.model('User', schema);
