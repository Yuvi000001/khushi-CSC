const emailjs = require('@emailjs/nodejs');

async function sendMail({ to, subject, html }) {
  const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } = process.env;
  if (!to || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY) {
    console.warn('[mail] skipped (EmailJS not configured / no recipient)');
    return false;
  }
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: to,
      subject,
      message_html: html,
    }, { publicKey: EMAILJS_PUBLIC_KEY, privateKey: EMAILJS_PRIVATE_KEY });
    return true;
  } catch (error) {
    console.error('[mail] send failed:', error.status || error.message);
    return false;
  }
}
module.exports = { sendMail };
