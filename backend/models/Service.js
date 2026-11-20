const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  nameEn: { type: String, trim: true, default: '' },
  category: { type: String, enum: ['govt', 'identity', 'digital'], required: true },
  description: { type: String, trim: true, default: '' },
  icon: { type: String, default: 'document' },
  features: [String],
  documents: [String],
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('Service', schema);
