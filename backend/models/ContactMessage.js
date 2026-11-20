const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  mobile: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  subject: { type: String, trim: true, maxlength: 120, default: '' },
  message: { type: String, required: true, trim: true, maxlength: 1500 },
  status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
}, { timestamps: { createdAt: true, updatedAt: false } });
module.exports = mongoose.model('ContactMessage', schema);
