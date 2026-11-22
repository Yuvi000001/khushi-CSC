const multer = require('multer');
const path = require('path');
const { IMAGE_EXTENSIONS, IMAGE_MIME_TYPES } = require('../utils/imageTypes');
const DOCUMENT_TYPES = {
  '.pdf': new Set(['application/pdf', 'application/octet-stream']),
  '.doc': new Set(['application/msword', 'application/octet-stream']),
  '.docx': new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream']),
  '.xls': new Set(['application/vnd.ms-excel', 'application/octet-stream']),
  '.xlsx': new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip', 'application/octet-stream']),
  '.ppt': new Set(['application/vnd.ms-powerpoint', 'application/octet-stream']),
  '.pptx': new Set(['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip', 'application/octet-stream']),
  '.odt': new Set(['application/vnd.oasis.opendocument.text', 'application/zip', 'application/octet-stream']),
  '.ods': new Set(['application/vnd.oasis.opendocument.spreadsheet', 'application/zip', 'application/octet-stream']),
  '.odp': new Set(['application/vnd.oasis.opendocument.presentation', 'application/zip', 'application/octet-stream']),
  '.rtf': new Set(['application/rtf', 'text/rtf', 'application/octet-stream']),
  '.txt': new Set(['text/plain', 'application/octet-stream']),
  '.csv': new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel', 'application/octet-stream']),
};
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype || '';
    const imageMime = IMAGE_EXTENSIONS[ext];
    const acceptedImage = imageMime && (!mimeType || mimeType === 'application/octet-stream' || mimeType === imageMime);
    const accepted = (IMAGE_MIME_TYPES.has(mimeType) && imageMime === mimeType) || acceptedImage
      || (DOCUMENT_TYPES[ext] && DOCUMENT_TYPES[ext].has(file.mimetype));
    if (!accepted) return cb(Object.assign(new Error('JPG, PNG, WebP या मान्य PDF/Word/Excel/PowerPoint दस्तावेज़ चुनें।'), { status: 400 }));
    cb(null, true);
  },
}).single('file');
