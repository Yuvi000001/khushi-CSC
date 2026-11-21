const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: Number,
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('SystemState', schema);
