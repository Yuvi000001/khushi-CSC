const cloudinary = require('../config/cloudinary');

module.exports = function privateCloudinaryUrl(file) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !['image', 'raw'].includes(file.resourceType)) return null;
  const signedUrl = cloudinary.utils.private_download_url(file.cloudinaryPublicId, file.format, {
    resource_type: file.resourceType,
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + 600,
  });
  const url = new URL(signedUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'api.cloudinary.com'
    || url.pathname !== `/v1_1/${cloudName}/${file.resourceType}/download`) return null;
  return url;
};
