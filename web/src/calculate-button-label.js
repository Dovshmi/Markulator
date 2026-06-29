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

function applySingleStickyCopyAction() {
  const language = getUiLanguage();
  const copyLabel = language === 'en' ? 'Copy' : 'העתק';
  const stickyBar = document.querySelector('.sticky-action-bar');
  if (!stickyBar) return;

  const buttons = Array.from(stickyBar.querySelectorAll('button'));
  if (buttons.length < 2) return;

  const shortCopyButton = buttons[0];
  const fullCopyButton = buttons[1];

  shortCopyButton.hidden = true;
  shortCopyButton.setAttribute('aria-hidden', 'true');
  shortCopyButton.tabIndex = -1;
  shortCopyButton.classList.remove('sticky-copy-action');

  fullCopyButton.hidden = false;
  fullCopyButton.removeAttribute('aria-hidden');
  fullCopyButton.tabIndex = 0;
  fullCopyButton.textContent = copyLabel;
  fullCopyButton.setAttribute('aria-label', copyLabel);
  fullCopyButton.classList.add('sticky-copy-action');
}

function applyUiLabels() {
  applyCalculateButtonLabel();
  applySingleStickyCopyAction();
}

function scheduleApply() {
  window.requestAnimationFrame(applyUiLabels);
}

function bindCalculateButtonLabel() {
  applyUiLabels();

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
