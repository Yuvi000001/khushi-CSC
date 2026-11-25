const Scheme = require('../models/Scheme');
const UploadedFile = require('../models/UploadedFile');

const bad = (res, message, status = 404) => res.status(status).json({ success: false, message });
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_FIELDS = 'secureUrl originalName mimeType isPrivate resourceType';
const FIELDS = ['name', 'nameEn', 'description', 'descriptionEn', 'category', 'categoryEn', 'price', 'icon', 'imageUrl', 'imageFileId', 'documentExamples', 'active', 'displayOrder'];
const pick = (body) => Object.fromEntries(FIELDS.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));
const slugify = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const documentExamples = (examples = [], includeIds = false) => examples.flatMap((example) => {
  const file = example.imageFileId;
  return file && !file.isPrivate && file.resourceType === 'image' && IMAGE_MIME_TYPES.includes(file.mimeType)
    ? [{ name: example.name, ...(includeIds ? { imageFileId: file._id } : {}), imageUrl: file.secureUrl }]
    : [];
});

async function validateImage(data, res) {
  if (data.imageFileId) {
    const file = await UploadedFile.findOne({ _id: data.imageFileId, resourceType: 'image', isPrivate: false }).select('secureUrl');
    if (!file) {
      bad(res, 'योजना की सार्वजनिक फोटो अपलोड करें।', 422);
      return false;
    }
    data.imageUrl = file.secureUrl;
  } else if (data.imageUrl) {
    bad(res, 'योजना की फोटो अपलोड करें।', 422);
    return false;
  }
  return true;
}

async function validateDocumentExamples(data, req, res) {
  if (!Array.isArray(data.documentExamples) || !data.documentExamples.length) return true;
  const ids = data.documentExamples.map((example) => example.imageFileId);
  const files = await UploadedFile.find({
    _id: { $in: ids },
    ownerId: req.user._id,
    folder: 'khushi/gallery',
    resourceType: 'image',
    isPrivate: false,
    mimeType: { $in: IMAGE_MIME_TYPES },
  }).select('_id').lean();
  if (files.length !== ids.length) {
    bad(res, 'दस्तावेज़ की उदाहरण फोटो अपने Admin खाते से अपलोड करें।', 422);
    return false;
  }
  return true;
}

exports.list = async (req, res, next) => {
  try {
    const data = await Scheme.find({ active: true })
      .select('slug name nameEn description descriptionEn category categoryEn price icon imageUrl displayOrder documentExamples')
      .populate('documentExamples.imageFileId', 'secureUrl mimeType isPrivate resourceType')
      .sort({ displayOrder: 1, createdAt: 1 }).lean();
    res.json({ success: true, data: data.map((scheme) => ({ ...scheme, documentExamples: documentExamples(scheme.documentExamples) })) });
  } catch (e) { next(e); }
};

exports.adminList = async (req, res, next) => {
  try {
    const data = await Scheme.find().populate('documentExamples.imageFileId', IMAGE_FIELDS).sort({ displayOrder: 1, createdAt: 1 }).lean();
    res.json({ success: true, data: data.map((scheme) => ({
      ...scheme,
      documentExamples: documentExamples(scheme.documentExamples, true),
    })) });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const data = pick(req.body);
    if (!await validateImage(data, res)) return;
    if (!await validateDocumentExamples(data, req, res)) return;
    const baseSlug = slugify(req.body.slug || req.body.nameEn) || `scheme-${Date.now().toString(36)}`;
    let slug = baseSlug;
    let suffix = 2;
    while (await Scheme.exists({ slug })) {
      slug = `${baseSlug.slice(0, 73)}-${suffix++}`;
    }
    const scheme = await Scheme.create({ ...data, slug });
    res.status(201).json({ success: true, message: 'योजना जोड़ दी गई।', data: scheme });
  } catch (e) {
    if (e.code === 11000) return bad(res, 'इस नाम की योजना पहले से मौजूद है।', 409);
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const slug = String(req.params.slug).toLowerCase();
    const data = pick(req.body);
    if (!await validateImage(data, res)) return;
    if (!await validateDocumentExamples(data, req, res)) return;
    const scheme = await Scheme.findOneAndUpdate({ slug }, { $set: data }, { new: true, runValidators: true });
    if (!scheme) return bad(res, 'योजना नहीं मिली।');
    res.json({ success: true, message: 'योजना अपडेट हो गई।', data: scheme });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const slug = String(req.params.slug).toLowerCase();
    const scheme = await Scheme.findOneAndDelete({ slug });
    if (!scheme) return bad(res, 'योजना नहीं मिली।');
    res.json({
      success: true,
      message: 'योजना हटा दी गई।',
      data: {
        imageFileId: scheme.imageFileId || null,
        documentExampleFileIds: (scheme.documentExamples || []).map((example) => example.imageFileId),
      },
    });
  } catch (e) { next(e); }
};
