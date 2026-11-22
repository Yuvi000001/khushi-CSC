const mongoose = require('mongoose');
module.exports = async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI .env me set nahi hai');
  mongoose.set('strictQuery', true);
  const options = { serverSelectionTimeoutMS: 10000 };
  if (process.env.NODE_ENV === 'production') options.tls = true;
  await mongoose.connect(process.env.MONGODB_URI, options);
  console.log('[db] MongoDB connected');
};
