import { CONFIG } from '../config.js';
import { api } from '../api.js';
import { icon } from '../icons/icons.js';
import { getLanguage } from '../i18n.js';

const COPY = {
  hi: {
    title: 'खुशी ऑनलाइन सेंटर',
    subtitle: 'FAQ सहायक',
    welcome: 'नमस्ते! मैं सेवाओं, दस्तावेज़, शुल्क और आवेदन की स्थिति से जुड़े सामान्य सवालों में मदद कर सकता हूँ।',
    topics: {
      services: 'सेवाएं',
      documents: 'दस्तावेज़',
      fees: 'शुल्क',
      status: 'आवेदन की स्थिति',
      contact: 'संपर्क',
    },
    questions: {
      services: 'कौन-कौन सी सेवाएं उपलब्ध हैं?',
      documents: 'कौन से दस्तावेज़ चाहिए?',
      fees: 'सेवा का शुल्क कितना है?',
      status: 'आवेदन की स्थिति कैसे देखें?',
      contact: 'केंद्र से संपर्क कैसे करें?',
    },
    answers: {
      services: 'उपलब्ध सेवाएं देखने और उनकी जानकारी पढ़ने के लिए Services पेज खोलें।',
      documents: 'जरूरी दस्तावेज़ सेवा के अनुसार बदलते हैं। Services पेज पर संबंधित सेवा चुनें।',
      fees: 'शुल्क सेवा के अनुसार अलग हो सकता है और सरकारी शुल्क अलग हो सकता है। भुगतान से पहले केंद्र से कुल राशि की पुष्टि करें।',
      status: 'लॉगिन करके अपनी Profile या My Applications में आवेदन की स्थिति देखें।',
      contact: 'कॉल या WhatsApp से केंद्र से संपर्क करें।',
      hours: 'केंद्र का समय अभी वेबसाइट पर प्रकाशित नहीं है। फोन या WhatsApp से पूछें।',
      address: 'पता: राम द्वारा, विदिशा, मध्य प्रदेश।',
      apply: 'सेवा चुनकर उसकी जानकारी और दस्तावेज़ देखें। आवेदन में सहायता के लिए केंद्र से संपर्क करें; प्रक्रिया सेवा और पोर्टल की उपलब्धता पर निर्भर करती है।',
      greeting: 'नमस्ते! आप सेवाओं, दस्तावेज़, शुल्क, आवेदन या संपर्क के बारे में पूछ सकते हैं।',
      fallback: 'मैं अभी सेवाओं, दस्तावेज़, शुल्क, आवेदन की स्थिति और संपर्क से जुड़े सामान्य सवालों में मदद कर सकता हूँ। बाकी जानकारी के लिए WhatsApp करें।',
      loading: 'वेबसाइट की ताज़ा सेवा जानकारी देख रहा हूँ…',
      refreshError: 'ताज़ा सेवा जानकारी अभी नहीं मिल सकी। कृपया थोड़ी देर बाद फिर पूछें या केंद्र से संपर्क करें।',
    },
    noServices: 'अभी कोई सेवा सूचीबद्ध नहीं है। Services पेज देखें या केंद्र से संपर्क करें।',
    noServiceDescription: 'इस सेवा का विवरण अभी उपलब्ध नहीं है।',
    noDocuments: 'इस सेवा के दस्तावेज़ अभी सूचीबद्ध नहीं हैं।',
    serviceFeeNotListed: 'का केंद्र सेवा शुल्क अभी सूचीबद्ध नहीं है। कृपया भुगतान से पहले केंद्र से पुष्टि करें। सरकारी शुल्क अलग हो सकता है।',
    serviceFeeListed: 'का केंद्र सेवा शुल्क ₹{amount} है। सरकारी शुल्क इसमें शामिल नहीं है।',
    serviceDocuments: 'के लिए सामान्यतः ये दस्तावेज़ चाहिए: ',
    serviceFeatures: 'मुख्य सुविधाएं: ',
    serviceLink: 'सेवा की पूरी जानकारी',
    servicesIntro: 'वेबसाइट पर अभी उपलब्ध सेवाएं: ',
    links: {
      services: [{ href: '/services', label: 'सभी सेवाएं देखें' }],
      documents: [{ href: '/services', label: 'सेवाएं देखें' }],
      fees: [{ href: CONFIG.WHATSAPP, label: 'सटीक शुल्क WhatsApp पर पूछें' }],
      status: [{ href: '/login', label: 'लॉगिन करें' }],
      contact: [{ href: CONFIG.CALL, label: 'कॉल करें' }, { href: CONFIG.WHATSAPP, label: 'WhatsApp करें' }],
      hours: [{ href: CONFIG.CALL, label: 'कॉल करें' }, { href: CONFIG.WHATSAPP, label: 'WhatsApp करें' }],
      address: [{ href: CONFIG.MAPS, label: 'मैप पर देखें' }],
      apply: [{ href: '/services', label: 'सेवाएं देखें' }],
      refreshError: [{ href: '/services', label: 'सेवाएं देखें' }, { href: CONFIG.WHATSAPP, label: 'WhatsApp करें' }],
    },
    placeholder: 'अपना सवाल लिखें',
    send: 'सवाल भेजें',
    open: 'FAQ चैट खोलें',
    close: 'चैट बंद करें',
    safety: 'आपके सवाल सर्वर पर नहीं भेजे जाते; सेवा विवरण वेबसाइट से refresh होते हैं। Aadhaar नंबर, OTP या PIN साझा न करें।',
  },
  en: {
    title: 'Khushi Online Centre',
    subtitle: 'FAQ assistant',
    welcome: 'Hello! I can help with common questions about services, documents, fees, and application status.',
    topics: {
      services: 'Services',
      documents: 'Documents',
      fees: 'Fees',
      status: 'Application status',
      contact: 'Contact',
    },
    questions: {
      services: 'What services are available?',
      documents: 'Which documents are required?',
      fees: 'How much does a service cost?',
      status: 'How can I check my application status?',
      contact: 'How can I contact the centre?',
    },
    answers: {
      services: 'Open the Services page to see the available services and their details.',
      documents: 'Required documents vary by service. Select the relevant service on the Services page.',
      fees: 'Fees vary by service, and government charges may be separate. Confirm the total with the centre before paying.',
      status: 'Log in and check your application in Profile or My Applications.',
      contact: 'Contact the centre by phone or WhatsApp.',
      hours: 'The centre hours are not currently published on the website. Please call or WhatsApp to ask.',
      address: 'Address: Ram Dwara, Vidisha, Madhya Pradesh.',
      apply: 'Choose a service to review its details and documents. Contact the centre for application assistance; the process depends on the service and portal availability.',
      greeting: 'Hello! Ask me about services, documents, fees, applications, or contacting the centre.',
      fallback: 'I can answer common questions about services, documents, fees, application status, and contact details. For other questions, message us on WhatsApp.',
      loading: 'Checking the latest service information from the website…',
      refreshError: 'I could not load the latest service information. Please try again shortly or contact the centre.',
    },
    noServices: 'No services are currently listed. Visit the Services page or contact the centre.',
    noServiceDescription: 'Details for this service are not currently available.',
    noDocuments: 'Documents for this service are not currently listed.',
    serviceFeeNotListed: 'does not have a centre service fee listed yet. Please confirm the fee before paying. Government charges may be separate.',
    serviceFeeListed: 'has a centre service fee of ₹{amount}. Government charges are not included.',
    serviceDocuments: 'Usually required documents for ',
    serviceFeatures: 'Main features: ',
    serviceLink: 'View service details',
    servicesIntro: 'Services currently available on the website: ',
    links: {
      services: [{ href: '/services', label: 'View all services' }],
      documents: [{ href: '/services', label: 'Browse services' }],
      fees: [{ href: CONFIG.WHATSAPP, label: 'Ask for the exact fee on WhatsApp' }],
      status: [{ href: '/login', label: 'Log in' }],
      contact: [{ href: CONFIG.CALL, label: 'Call' }, { href: CONFIG.WHATSAPP, label: 'WhatsApp' }],
      hours: [{ href: CONFIG.CALL, label: 'Call' }, { href: CONFIG.WHATSAPP, label: 'WhatsApp' }],
      address: [{ href: CONFIG.MAPS, label: 'View map' }],
      apply: [{ href: '/services', label: 'Browse services' }],
      refreshError: [{ href: '/services', label: 'Browse services' }, { href: CONFIG.WHATSAPP, label: 'WhatsApp' }],
    },
    placeholder: 'Type your question',
    send: 'Send question',
    open: 'Open FAQ chat',
    close: 'Close chat',
    safety: 'Your questions are not sent to a server; service details refresh from the website. Do not share Aadhaar numbers, OTPs, or PINs.',
  },
};

const TOPIC_ORDER = ['services', 'documents', 'fees', 'status', 'contact'];
const SERVICE_INTENTS = new Set(['services', 'documents', 'fees', 'apply', 'fallback']);
const INTENTS = [
  ['fees', /fee|fees|charge|cost|price|payment|शुल्क|फीस|भुगतान|पैसे|कीमत|दाम/i],
  ['status', /status|track|tracking|स्थिति|स्टेटस/i],
  ['documents', /document|paper|कागज़|कागज|दस्तावेज़|दस्तावेज/i],
  ['hours', /hours|timing|open|समय|कितने बजे|खुला/i],
  ['address', /address|location|where|पता|कहाँ|कहां|लोकेशन/i],
  ['contact', /contact|call|phone|whatsapp|संपर्क|कॉल|फोन|व्हाट्सएप|बात करें/i],
  ['services', /service|सेवा/i],
  ['apply', /apply|application|how to|आवेदन|फॉर्म|कैसे/i],
];

function getIntent(question) {
  if (/^(hi|hello|hey)\b|नमस्ते|नमस्कार/i.test(question.trim())) return 'greeting';
  return INTENTS.find(([, pattern]) => pattern.test(question))?.[0] || 'fallback';
}

function makeMessage(entry, copy) {
  const row = document.createElement('div');
  row.className = `faq-chat-message faq-chat-message--${entry.role}`;
  const text = document.createElement('p');
  text.textContent = entry.role === 'user' ? entry.text : entry.text ?? (entry.key === 'welcome' ? copy.welcome : copy.answers[entry.key]);
  row.append(text);

  if (entry.role === 'bot') {
    for (const item of entry.links || copy.links[entry.key] || []) {
      const link = document.createElement('a');
      link.className = 'faq-chat-answer-link';
      link.href = item.href;
      link.textContent = item.label;
      if (item.href.startsWith('/')) link.dataset.link = '';
      else {
        link.target = '_blank';
        link.rel = 'noopener';
      }
      row.append(link);
    }
  }
  return row;
}

function findService(question, services) {
  const query = question.toLocaleLowerCase();
  return services.find((service) => [service.name, service.nameEn, service.slug]
    .filter((name) => typeof name === 'string' && name.trim().length > 2)
    .some((name) => query.includes(name.trim().toLocaleLowerCase())));
}

function serviceLink(service, copy) {
  return [{ href: `/services/${encodeURIComponent(service.slug)}`, label: copy.serviceLink }];
}

function createAnswer(question, intent, services, language, copy) {
  const service = findService(question, services);
  const name = service && (language === 'en' && service.nameEn ? service.nameEn : service.name);

  if (intent === 'services' && !service) {
    const names = services.map((item) => language === 'en' && item.nameEn ? item.nameEn : item.name).filter(Boolean);
    return {
      text: names.length ? `${copy.servicesIntro}${names.join(', ')}` : copy.noServices,
      links: copy.links.services,
    };
  }

  if (service && intent === 'fees') {
    const price = Number(service.price);
    const amount = Number.isFinite(price) && price > 0 ? price.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : null;
    return {
      text: amount
        ? `${name} ${copy.serviceFeeListed.replace('{amount}', amount)}`
        : `${name} ${copy.serviceFeeNotListed}`,
      links: amount ? serviceLink(service, copy) : copy.links.fees,
    };
  }

  if (service && intent === 'documents') {
    const documents = Array.isArray(service.documents) ? service.documents.filter((item) => typeof item === 'string' && item.trim()) : [];
    return {
      text: documents.length ? `${copy.serviceDocuments}${name}: ${documents.join(', ')}` : `${name}: ${copy.noDocuments}`,
      links: serviceLink(service, copy),
    };
  }

  if (service && ['services', 'apply', 'fallback'].includes(intent)) {
    const description = language === 'en' ? service.descriptionEn || service.description : service.description;
    const features = Array.isArray(service.features) ? service.features.filter((item) => typeof item === 'string' && item.trim()).slice(0, 5) : [];
    const details = [name, description || copy.noServiceDescription];
    if (features.length) details.push(`${copy.serviceFeatures}${features.join(', ')}`);
    return { text: details.join('. '), links: serviceLink(service, copy) };
  }

  return { key: intent };
}

export function initFaqChat() {
  const root = document.createElement('div');
  root.id = 'faq-chat-widget';
  document.body.append(root);

  let isOpen = false;
  let isBusy = false;
  const messages = [{ role: 'bot', key: 'welcome' }];

  function renderMessages() {
    const copy = COPY[getLanguage()];
    const log = root.querySelector('.faq-chat-messages');
    log.replaceChildren(...messages.map((entry) => makeMessage(entry, copy)));
    log.scrollTop = log.scrollHeight;
  }

  function render() {
    const copy = COPY[getLanguage()];
    root.innerHTML = `
      <button class="faq-chat-launcher" type="button" data-faq-toggle aria-controls="faq-chat-panel" aria-expanded="${isOpen}" aria-label="${copy.open}">
        ${icon('chat', 25)}<span class="faq-chat-sr">${copy.open}</span>
      </button>
      <section id="faq-chat-panel" class="faq-chat-panel" role="dialog" aria-labelledby="faq-chat-title" aria-modal="false"${isOpen ? '' : ' hidden'}>
        <header class="faq-chat-header">
          <div><h2 id="faq-chat-title">${copy.title}</h2><p>${copy.subtitle}</p></div>
          <button class="faq-chat-close" type="button" data-faq-close aria-label="${copy.close}">${icon('close', 20)}</button>
        </header>
        <div class="faq-chat-messages" role="log" aria-live="polite" aria-label="${copy.subtitle}"></div>
        <div class="faq-chat-topics" aria-label="${copy.subtitle}">
          ${TOPIC_ORDER.map((key) => `<button type="button" data-faq-topic="${key}"${isBusy ? ' disabled' : ''}>${copy.topics[key]}</button>`).join('')}
        </div>
        <form class="faq-chat-form">
          <label class="faq-chat-sr" for="faq-chat-input">${copy.placeholder}</label>
          <input id="faq-chat-input" name="question" type="text" maxlength="240" autocomplete="off" placeholder="${copy.placeholder}" required${isBusy ? ' disabled' : ''}>
          <button type="submit" aria-label="${copy.send}"${isBusy ? ' disabled' : ''}>${icon('arrow', 20)}</button>
        </form>
        <p class="faq-chat-safety">${copy.safety}</p>
      </section>`;

    renderMessages();
  }

  async function answer(question, intent) {
    isBusy = true;
    messages.push({ role: 'user', text: question }, { role: 'bot', key: 'loading' });
    render();
    try {
      let services = [];
      if (SERVICE_INTENTS.has(intent)) {
        const response = await api('/services');
        if (!Array.isArray(response.data)) throw new Error('Invalid service list response.');
        services = response.data;
      }
      messages[messages.length - 1] = { role: 'bot', ...createAnswer(question, intent, services, getLanguage(), COPY[getLanguage()]) };
    } catch (error) {
      console.error('Could not refresh FAQ service information.', error);
      messages[messages.length - 1] = { role: 'bot', key: 'refreshError' };
    } finally {
      isBusy = false;
      render();
      if (isOpen) root.querySelector('#faq-chat-input').focus();
    }
  }

  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-faq-toggle], [data-faq-close], [data-faq-topic]');
    if (!target) return;
    if (target.hasAttribute('data-faq-toggle')) {
      isOpen = !isOpen;
      render();
      if (isOpen) root.querySelector('#faq-chat-input').focus();
    } else if (target.hasAttribute('data-faq-close')) {
      isOpen = false;
      render();
      root.querySelector('[data-faq-toggle]').focus();
    } else {
      if (isBusy) return;
      const key = target.dataset.faqTopic;
      const copy = COPY[getLanguage()];
      answer(copy.questions[key], key);
    }
  });

  root.addEventListener('submit', (event) => {
    if (!event.target.matches('.faq-chat-form')) return;
    event.preventDefault();
    const input = root.querySelector('#faq-chat-input');
    const question = input.value.trim();
    if (!question || isBusy) return;
    answer(question, getIntent(question));
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) {
      isOpen = false;
      render();
      root.querySelector('[data-faq-toggle]').focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-language-toggle]')) return;
    window.setTimeout(render, 0);
  });

  render();
}
