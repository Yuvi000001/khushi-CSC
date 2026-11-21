const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('SystemState', schema);
