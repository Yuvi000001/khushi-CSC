const IMAGE_EXTENSIONS = Object.freeze({
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
});

module.exports = {
  IMAGE_EXTENSIONS,
  IMAGE_MIME_TYPES: new Set(Object.values(IMAGE_EXTENSIONS)),
};
