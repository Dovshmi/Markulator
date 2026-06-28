function getUiLanguage() {
  return document.documentElement.lang === 'en' ? 'en' : 'he';
}

function applyCalculateButtonLabel() {
  const language = getUiLanguage();
  const label = language === 'en' ? 'Calculate' : 'חשב';
  const buttons = document.querySelectorAll('.form-save-button');

  buttons.forEach((button) => {
    if (button.textContent?.trim() !== label) {
      button.textContent = label;
      button.setAttribute('aria-label', label);
    }
  });
}

function scheduleApply() {
  window.requestAnimationFrame(applyCalculateButtonLabel);
}

function bindCalculateButtonLabel() {
  applyCalculateButtonLabel();

  const root = document.getElementById('root');
  if (!root || !('MutationObserver' in window)) return;

  const observer = new MutationObserver(scheduleApply);
  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'lang', 'dir'],
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindCalculateButtonLabel, { once: true });
} else {
  bindCalculateButtonLabel();
}
