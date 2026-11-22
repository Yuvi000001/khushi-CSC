const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STATUS = { pending: 'प्रतीक्षारत', progress: 'प्रक्रिया में', done: 'पूर्ण', cancelled: 'रद्द' };

const wrap = (title, body) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e6d9c6;border-radius:10px;overflow:hidden">
  <div style="background:#7A1F2B;color:#fff;padding:16px 20px"><strong>Khushi Online Centre</strong><br><span style="font-size:12px;opacity:.85">CSC ID : 241114270010 | khushionlinecentre11@gmail.com</span></div>
  <div style="padding:20px;color:#2A1D1A;line-height:1.7;font-size:15px"><h2 style="margin:0 0 12px;font-size:18px">${esc(title)}</h2>${body}</div>
  <div style="background:#f7f2ea;padding:12px 20px;font-size:12px;color:#6b5b55">यह सरकारी वेबसाइट नहीं है। कृपया Aadhaar नंबर, OTP या Bank PIN किसी को साझा न करें।</div>
</div>`;

exports.welcome = (name) => ({
  subject: 'खुशी ऑनलाइन सेंटर में आपका स्वागत है',
  html: wrap('स्वागत है', `<p>नमस्ते ${esc(name)},</p><p>आपका खाता बन गया है। अब आप सेवाओं के लिए आवेदन कर सकते हैं और अपने आवेदनों की स्थिति देख सकते हैं।</p>`),
});
exports.authOtp = (purpose, code) => {
  const action = purpose === 'signup' ? 'खाता बनाने' : 'लॉगिन करने';
  return {
    subject: `आपका OTP - खुशी ऑनलाइन सेंटर`,
    html: wrap('ईमेल सत्यापन कोड', `<p>${action} के लिए यह OTP दर्ज करें:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${esc(code)}</p><p>यह कोड 10 मिनट तक मान्य है और केवल एक बार उपयोग किया जा सकता है। इसे किसी के साथ साझा न करें।</p>`),
  };
};
exports.contactAck = (name) => ({
  subject: 'आपकी पूछताछ मिल गई है',
  html: wrap('धन्यवाद', `<p>नमस्ते ${esc(name)},</p><p>आपका संदेश हमें मिल गया है। हम जल्द ही आपसे संपर्क करेंगे।</p><p>मोबाइल: 7470630571<br>ईमेल: khushionlinecentre11@gmail.com</p>`),
});
exports.applicationAck = (name, reference, service) => ({
  subject: `आवेदन प्राप्त - ${reference}`,
  html: wrap('आवेदन प्राप्त हुआ', `<p>नमस्ते ${esc(name)},</p><p>आपका <b>${esc(service)}</b> का आवेदन दर्ज हो गया है।</p><p>संदर्भ संख्या: <b>${esc(reference)}</b></p><p>दस्तावेज़ों के साथ केंद्र पर संपर्क करें।</p>`),
});
exports.statusUpdate = (name, reference, status) => ({
  subject: `आवेदन अपडेट - ${reference}`,
  html: wrap('आवेदन की स्थिति बदली', `<p>नमस्ते ${esc(name)},</p><p>संदर्भ <b>${esc(reference)}</b> की नई स्थिति: <b>${esc(STATUS[status] || status)}</b></p>`),
});
exports.passwordReset = (name, link) => ({
  subject: 'पासवर्ड रीसेट लिंक',
  html: wrap('पासवर्ड रीसेट', `<p>नमस्ते ${esc(name)},</p><p>नया पासवर्ड बनाने के लिए नीचे के बटन पर क्लिक करें। यह लिंक 30 मिनट तक और सिर्फ एक बार चलेगा।</p><p><a href="${esc(link)}" style="background:#7A1F2B;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">पासवर्ड बदलें</a></p><p style="font-size:13px;color:#6b5b55">अगर आपने यह अनुरोध नहीं किया है तो इस ईमेल को अनदेखा करें।</p>`),
});
