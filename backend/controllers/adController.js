const UploadedFile = require('../models/UploadedFile');

const deliveryUrl = (url) => url.replace('/upload/', '/upload/f_auto,q_auto/');
const query = () => UploadedFile.find({
  folder: 'khushi/ads',
  isPrivate: false,
  resourceType: 'image',
}).select('_id secureUrl originalName createdAt').sort({ createdAt: 1, _id: 1 }).lean();

exports.list = async (req, res, next) => {
  try {
    const ads = await query();
    res.json({
      success: true,
      data: ads.map((ad) => ({ _id: ad._id, url: deliveryUrl(ad.secureUrl), alt: ad.originalName || 'खुशी ऑनलाइन सेंटर का विज्ञापन' })),
    });
  } catch (error) { next(error); }
};

exports.adminList = async (req, res, next) => {
  try {
    const ads = await query();
    res.json({ success: true, data: ads.map((ad) => ({ _id: ad._id, url: deliveryUrl(ad.secureUrl), originalName: ad.originalName, createdAt: ad.createdAt })) });
  } catch (error) { next(error); }
};
