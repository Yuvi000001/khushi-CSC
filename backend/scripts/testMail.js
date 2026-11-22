require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sendMail } = require('../config/mailer');

const email = process.argv[2];
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: node scripts/testMail.js <email-address>');
  process.exit(1);
}

(async () => {
  const sent = await sendMail({
    to: email,
    subject: 'EmailJS connection test',
    html: '<p>This is a test email from the Khushi Online Centre backend.</p>',
  });
  if (!sent) {
    console.error('[mail-test] failed; see the EmailJS diagnostics above.');
    process.exitCode = 1;
    return;
  }
  console.log(`[mail-test] success: email sent to ${email}`);
})().catch(() => {
  console.error('[mail-test] failed unexpectedly.');
  process.exitCode = 1;
});
