const multer = require('multer');
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) return cb(Object.assign(new Error('सिर्फ JPG, PNG, WebP या PDF फ़ाइल चलेगी।'), { status: 400 }));
    cb(null, true);
  },
}).single('file');
