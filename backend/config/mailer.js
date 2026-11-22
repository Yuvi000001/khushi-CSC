const emailjs = require('@emailjs/nodejs');

const REQUIRED_EMAILJS_ENV = [
  'EMAILJS_SERVICE_ID',
  'EMAILJS_TEMPLATE_ID',
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_PRIVATE_KEY',
];
const ERROR_HINTS = {
  403: "EmailJS dashboard > Account > Security me 'Allow API for non-browser applications' ON karein.",
  422: 'Template me To Email {{to_email}} set karein.',
  412: 'EmailJS me Gmail service reconnect karein.',
};

function redactCredentials(text) {
  let safeText = String(text || '');
  for (const name of REQUIRED_EMAILJS_ENV) {
    const value = process.env[name];
    if (value) safeText = safeText.split(value).join('[REDACTED]');
  }
  return safeText;
}

async function sendMail({ to, subject, html }) {
  const missing = REQUIRED_EMAILJS_ENV.filter((name) => !process.env[name]);
  if (!to || missing.length) {
    if (missing.length) console.warn('[mail] skipped; missing environment variables:', missing.join(', '));
    else console.warn('[mail] skipped; no recipient');
    return false;
  }

  const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } = process.env;
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: to,
      subject,
      message_html: html,
    }, { publicKey: EMAILJS_PUBLIC_KEY, privateKey: EMAILJS_PRIVATE_KEY });
    return true;
  } catch (error) {
    const status = error && error.status;
    const text = error && (error.text || error.message);
    console.error('[mail] send failed:', {
      status: status || null,
      text: redactCredentials(text || 'Unknown EmailJS error'),
      hint: ERROR_HINTS[status] || 'EmailJS service, template, and account settings check karein.',
    });
    return false;
  }
}
module.exports = { sendMail };
