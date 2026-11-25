const test = require('node:test');
const assert = require('node:assert/strict');
const Service = require('../models/Service');
const Scheme = require('../models/Scheme');
const UploadedFile = require('../models/UploadedFile');
const serviceController = require('../controllers/serviceController');
const schemeController = require('../controllers/schemeController');
const adminController = require('../controllers/adminController');

const FILE_ID = '507f1f77bcf86cd799439011';

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
  };
}

test('service details expose only public uploaded document-example images', async () => {
  const previousFindOne = Service.findOne;
  Service.findOne = () => ({
    populate() { return this; },
    lean: async () => ({
      slug: 'sample-service',
      active: true,
      documentExamples: [
        {
          name: 'पहचान पत्र',
          imageFileId: {
            _id: FILE_ID,
            secureUrl: 'https://res.cloudinary.com/example/image/upload/sample.jpg',
            mimeType: 'image/jpeg',
            resourceType: 'image',
            isPrivate: false,
          },
        },
        {
          name: 'निजी फोटो',
          imageFileId: {
            secureUrl: 'https://res.cloudinary.com/example/image/upload/private.jpg',
            mimeType: 'image/jpeg',
            resourceType: 'image',
            isPrivate: true,
          },
        },
      ],
    }),
  });
  try {
    const res = response();
    await serviceController.get({ params: { id: 'sample-service' } }, res, (error) => { throw error; });
    assert.deepEqual(res.data.data.documentExamples, [{
      name: 'पहचान पत्र',
      imageUrl: 'https://res.cloudinary.com/example/image/upload/sample.jpg',
    }]);
  } finally {
    Service.findOne = previousFindOne;
  }
});

test('public schemes include their labeled document-example images', async () => {
  const previousFind = Scheme.find;
  Scheme.find = () => ({
    select() { return this; },
    populate() { return this; },
    sort() { return this; },
    lean: async () => [{
      slug: 'sample-scheme',
      name: 'उदाहरण योजना',
      documentExamples: [{
        name: 'आय प्रमाण पत्र',
        imageFileId: {
          secureUrl: 'https://res.cloudinary.com/example/image/upload/income.jpg',
          mimeType: 'image/jpeg',
          resourceType: 'image',
          isPrivate: false,
        },
      }],
    }],
  });
  try {
    const res = response();
    await schemeController.list({}, res, (error) => { throw error; });
    assert.deepEqual(res.data.data[0].documentExamples, [{
      name: 'आय प्रमाण पत्र',
      imageUrl: 'https://res.cloudinary.com/example/image/upload/income.jpg',
    }]);
  } finally {
    Scheme.find = previousFind;
  }
});

test('admins cannot attach document-example images they did not upload', async () => {
  const previousFind = UploadedFile.find;
  UploadedFile.find = () => ({
    select() { return this; },
    lean: async () => [],
  });
  try {
    const res = response();
    await adminController.createService({
      body: {
        name: 'उदाहरण सेवा',
        category: 'govt',
        documentExamples: [{ name: 'पहचान पत्र', imageFileId: FILE_ID }],
      },
      user: { _id: '507f1f77bcf86cd799439012' },
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 422);
    assert.match(res.data.message, /Admin खाते से अपलोड/);
  } finally {
    UploadedFile.find = previousFind;
  }
});
