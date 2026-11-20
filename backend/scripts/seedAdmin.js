// Pehla admin banane ke liye: .env me ADMIN_* bharein, phir `npm run seed:admin`
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_MOBILE, ADMIN_PASSWORD, MONGODB_URI } = process.env;
  if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) { console.error('MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD .env me bharein'); process.exit(1); }
  if (ADMIN_PASSWORD.length < 10 || ADMIN_PASSWORD === 'choose_a_strong_password') { console.error('Kam se kam 10 akshar ka mazboot password rakhein'); process.exit(1); }
  await mongoose.connect(MONGODB_URI);
  const email = ADMIN_EMAIL.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const existing = await User.findOne({ email });
  if (existing) { existing.role = 'admin'; existing.passwordHash = passwordHash; existing.verified = true; await existing.save(); console.log('Admin updated:', email); }
  else { await User.create({ name: ADMIN_NAME || 'Admin', email, mobile: ADMIN_MOBILE || '7470630571', passwordHash, role: 'admin', verified: true }); console.log('Admin created:', email); }
  await mongoose.disconnect();
  console.log('Ab .env se ADMIN_PASSWORD hata dein.');
})().catch((e) => { console.error(e.message); process.exit(1); });
