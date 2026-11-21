const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  nameEn: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, default: '', maxlength: 600 },
  descriptionEn: { type: String, trim: true, default: '', maxlength: 600 },
  category: { type: String, trim: true, default: '', maxlength: 80 },
  categoryEn: { type: String, trim: true, default: '', maxlength: 80 },
  icon: { type: String, trim: true, default: 'document', maxlength: 30 },
  imageUrl: { type: String, trim: true, default: '', maxlength: 2048 },
  imageFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadedFile', default: null },
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Scheme', schema);
