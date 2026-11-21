const UploadedFile = require('../models/UploadedFile');
const SystemState = require('../models/SystemState');

const INTERVAL_KEY = 'home-ad-interval';
const DEFAULT_INTERVAL_SECONDS = 2;
const deliveryUrl = (url) => url.replace('/upload/', '/upload/f_auto,q_auto/');
const query = () => UploadedFile.find({
  folder: 'khushi/ads',
  isPrivate: false,
  resourceType: 'image',
}).select('_id secureUrl originalName createdAt').sort({ createdAt: 1, _id: 1 }).lean();
const intervalSeconds = async () => {
  const setting = await SystemState.findOne({ key: INTERVAL_KEY }).select('value').lean();
  if (!setting || setting.value === undefined) return DEFAULT_INTERVAL_SECONDS;
  const value = Number(setting.value);
  if (!Number.isInteger(value) || value < 1 || value > 10) throw new Error('होम स्लाइड का समय अमान्य है।');
  return value;
};

exports.list = async (req, res, next) => {
  try {
    const [ads, seconds] = await Promise.all([query(), intervalSeconds()]);
    res.json({
      success: true,
      data: ads.map((ad) => ({ _id: ad._id, url: deliveryUrl(ad.secureUrl), alt: ad.originalName || 'खुशी ऑनलाइन सेंटर का विज्ञापन' })),
      intervalSeconds: seconds,
    });
  } catch (error) { next(error); }
};

exports.adminList = async (req, res, next) => {
  try {
    const [ads, seconds] = await Promise.all([query(), intervalSeconds()]);
    res.json({
      success: true,
      data: ads.map((ad) => ({ _id: ad._id, url: deliveryUrl(ad.secureUrl), originalName: ad.originalName, createdAt: ad.createdAt })),
      intervalSeconds: seconds,
    });
  } catch (error) { next(error); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const seconds = Number(req.body.intervalSeconds);
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 10) {
      return res.status(400).json({ success: false, message: 'स्लाइड का समय 1 से 10 सेकंड के बीच चुनें।' });
    }
    await SystemState.updateOne({ key: INTERVAL_KEY }, { $set: { value: seconds } }, { upsert: true, runValidators: true });
    res.json({ success: true, message: 'स्लाइड का समय सेव हो गया।', data: { intervalSeconds: seconds } });
  } catch (error) { next(error); }
};
