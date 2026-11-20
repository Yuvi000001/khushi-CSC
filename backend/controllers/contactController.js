const ContactMessage = require('../models/ContactMessage');
const { sendMail } = require('../config/mailer');
const tpl = require('../utils/emailTemplates');

exports.create = async (req, res, next) => {
  try {
    const { name, mobile, email, subject, message } = req.body;
    await ContactMessage.create({ name, mobile, email, subject, message });
    if (email) sendMail({ to: email, ...tpl.contactAck(name) });
    res.status(201).json({ success: true, message: 'आपका संदेश मिल गया है। हम जल्द संपर्क करेंगे।' });
  } catch (e) { next(e); }
};
