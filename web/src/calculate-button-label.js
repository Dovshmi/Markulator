const WEB_VERSION_LABEL = 'v0.9.7';

function getUiLanguage() {
  return document.documentElement.lang === 'en' ? 'en' : 'he';
}

function setText(button, label) {
  if (button.textContent?.trim() !== label) {
    button.textContent = label;
  }
}

function setAttributeValue(element, name, value) {
  if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

function removeAttributeValue(element, name) {
  if (element.hasAttribute(name)) {
    element.removeAttribute(name);
  }
}

function setHidden(button, value) {
  if (button.hidden !== value) {
    button.hidden = value;
  }
}

function setTabIndex(button, value) {
  if (button.tabIndex !== value) {
    button.tabIndex = value;
  }
}

function setClass(button, className, enabled) {
  if (enabled && !button.classList.contains(className)) {
    button.classList.add(className);
  }

  if (!enabled && button.classList.contains(className)) {
    button.classList.remove(className);
  }
}

function applyCalculateButtonLabel() {
  const language = getUiLanguage();
  const label = language === 'en' ? 'Calculate' : 'חשב';
  const buttons = document.querySelectorAll('.form-save-button');

  buttons.forEach((button) => {
    setText(button, label);
    setAttributeValue(button, 'aria-label', label);
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

  setHidden(shortCopyButton, true);
  setAttributeValue(shortCopyButton, 'aria-hidden', 'true');
  setTabIndex(shortCopyButton, -1);
  setClass(shortCopyButton, 'sticky-copy-action', false);

  setHidden(fullCopyButton, false);
  removeAttributeValue(fullCopyButton, 'aria-hidden');
  setTabIndex(fullCopyButton, 0);
  setText(fullCopyButton, copyLabel);
  setAttributeValue(fullCopyButton, 'aria-label', copyLabel);
  setClass(fullCopyButton, 'sticky-copy-action', true);
}

function applyHistoryVersionLabel() {
  const versionLabel = document.querySelector('.history-title .section-label');
  if (versionLabel?.textContent?.trim()?.startsWith('v0.')) {
    setText(versionLabel, WEB_VERSION_LABEL);
  }
}

function applyUiLabels() {
  applyCalculateButtonLabel();
  applySingleStickyCopyAction();
  applyHistoryVersionLabel();
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
