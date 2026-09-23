(() => {
  'use strict';

  const languageButtons = {
    tr: document.getElementById('langTr'),
    en: document.getElementById('langEn')
  };
  const pageCopy = {
    tr: {
      title: 'Firu Firu Games — İki oyun, tek pati dünyası',
      description: "Firu Firu Games'i keşfet: Paw Jump ve Bubble Paws tek mobil uygulamada. Google Play veya App Store'dan ücretsiz indir.",
      ogDescription: "Paw Jump ve Bubble Paws tek mobil uygulamada. Gerçek bir Cocker Spaniel’den doğan arcade macerası, ücretsiz.",
      locale: 'tr_TR'
    },
    en: {
      title: 'Firu Firu Games — Two games, one paw universe',
      description: 'Discover Firu Firu Games: Paw Jump and Bubble Paws in one mobile app. Download free on Google Play or the App Store.',
      ogDescription: 'Paw Jump and Bubble Paws in one mobile app. An arcade adventure inspired by a real Cocker Spaniel — free to download.',
      locale: 'en_US'
    }
  };
  let currentLanguage = 'tr';

  function savedLanguage() {
    try {
      const saved = localStorage.getItem('firu-site-language');
      return saved === 'en' ? 'en' : 'tr';
    } catch (_) {
      return 'tr';
    }
  }

  function setMeta(selector, attribute, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
  }

  function applyLanguage(language, persist = true) {
    currentLanguage = language === 'en' ? 'en' : 'tr';
    const copy = pageCopy[currentLanguage];
    document.documentElement.lang = currentLanguage;

    document.querySelectorAll('[data-tr][data-en]').forEach(element => {
      element.textContent = element.dataset[currentLanguage];
    });
    document.querySelectorAll('[data-aria-tr][data-aria-en]').forEach(element => {
      element.setAttribute('aria-label', element.dataset[`aria${currentLanguage === 'tr' ? 'Tr' : 'En'}`]);
    });
    document.querySelectorAll('[data-alt-tr][data-alt-en]').forEach(element => {
      element.alt = element.dataset[`alt${currentLanguage === 'tr' ? 'Tr' : 'En'}`];
    });

    document.title = copy.title;
    setMeta('meta[name="description"]', 'content', copy.description);
    setMeta('meta[property="og:title"]', 'content', copy.title);
    setMeta('meta[property="og:description"]', 'content', copy.ogDescription);
    setMeta('meta[property="og:locale"]', 'content', copy.locale);
    setMeta('meta[name="twitter:title"]', 'content', copy.title);
    setMeta('meta[name="twitter:description"]', 'content', copy.description);

    Object.entries(languageButtons).forEach(([languageCode, button]) => {
      if (button) button.setAttribute('aria-pressed', String(languageCode === currentLanguage));
    });

    if (persist) {
      try { localStorage.setItem('firu-site-language', currentLanguage); } catch (_) { /* Preference remains session-only. */ }
    }
    window.dispatchEvent(new CustomEvent('firu:languagechange', { detail: { language: currentLanguage } }));
  }

  Object.entries(languageButtons).forEach(([language, button]) => {
    button?.addEventListener('click', () => applyLanguage(language));
  });

  window.firuLanguage = {
    get: () => currentLanguage,
    set: language => applyLanguage(language)
  };
  applyLanguage(savedLanguage(), false);
})();
