const crypto = require('crypto');
module.exports = function generateReference() {
  const d = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).replace(/-/g, '');
  return `KO${d}${crypto.randomInt(0, 10000).toString().padStart(4, '0')}`;
};
