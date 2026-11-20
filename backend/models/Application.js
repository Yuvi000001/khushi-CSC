const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  reference: { type: String, required: true, unique: true },
  applicantName: { type: String, required: true, trim: true, maxlength: 80 },
  applicantMobile: { type: String, required: true, trim: true },
  notes: { type: String, trim: true, maxlength: 1000, default: '' },
  status: { type: String, enum: ['pending', 'progress', 'done', 'cancelled'], default: 'pending' },
  statusHistory: [{
    status: String, note: String, at: { type: Date, default: Date.now },
  }],
}, { timestamps: true });
module.exports = mongoose.model('Application', schema);
