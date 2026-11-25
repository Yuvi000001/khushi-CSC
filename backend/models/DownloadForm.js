const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, default: '', maxlength: 500 },
  price: { type: Number, required: true, min: 0, max: 1000000, default: 0 },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadedFile', required: true, unique: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('DownloadForm', schema);
