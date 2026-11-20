const nodemailer = require('nodemailer');
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) return null;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_APP_PASSWORD },
  });
  return transporter;
}
function fromAddress() {
  const f = process.env.MAIL_FROM || 'Khushi Online Centre';
  return f.includes('<') ? f : `"${f}" <${process.env.MAIL_USER}>`;
}
// Email fail hone par request fail nahi hoti; secrets log nahi hote.
async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t || !to) { console.warn('[mail] skipped (not configured / no recipient)'); return false; }
  try { await t.sendMail({ from: fromAddress(), to, subject, html }); return true; }
  catch (e) { console.error('[mail] send failed:', e.code || e.message); return false; }
}
module.exports = { sendMail };
