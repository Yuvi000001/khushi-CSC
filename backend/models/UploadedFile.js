const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cloudinaryPublicId: { type: String, required: true },
  secureUrl: { type: String, required: true },
  resourceType: { type: String, default: 'image' },
  format: String,
  originalName: String,
  mimeType: String,
  bytes: Number,
  folder: String,
  isPrivate: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });
module.exports = mongoose.model('UploadedFile', schema);
