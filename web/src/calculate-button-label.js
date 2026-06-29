const WEB_VERSION_LABEL = 'v0.9.9';

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

const QUICK_LONG_PRESS_MS = 520;
const QUICK_PRECISION_VALUES = ['2', '3', '4'];

function getQuickShell() {
  return document.querySelector('.app-shell');
}

function getQuickSettingsButton() {
  return document.querySelector('.form-settings-button');
}

function getQuickDrawer() {
  return document.querySelector('.settings-drawer');
}

function getQuickPrecisionSelect() {
  return document.querySelector('.settings-drawer .settings-select select');
}

function getQuickPrecisionSection() {
  return document.querySelector('.settings-drawer > .drawer-section:nth-of-type(5)');
}

function positionQuickSettings() {
  const button = getQuickSettingsButton();
  const drawer = getQuickDrawer();
  if (!button || !drawer) return;

  const rect = button.getBoundingClientRect();
  const isEnglish = getQuickShell()?.classList.contains('lang-en');
  const viewportPadding = 8;
  const gap = 10;
  const y = Math.max(viewportPadding, Math.min(rect.top - 5, window.innerHeight - 72));
  const x = isEnglish
    ? Math.max(viewportPadding, rect.left - gap)
    : Math.min(window.innerWidth - viewportPadding, rect.right + gap);

  drawer.style.setProperty('--quick-settings-top', `${y}px`);
  drawer.style.setProperty('--quick-settings-x', `${x}px`);
}

function syncQuickPrecisionDigits() {
  const section = getQuickPrecisionSection();
  const select = getQuickPrecisionSelect();
  if (!section || !select) return;
  section.dataset.digits = select.value || '2';
}

function syncQuickThemeMode() {
  const drawer = getQuickDrawer();
  const themeSection = drawer?.querySelector('.drawer-section:nth-of-type(3)');
  const activeButton = drawer?.querySelector('.theme-switch button.active');
  if (!themeSection || !activeButton) return;

  const buttons = Array.from(drawer.querySelectorAll('.theme-switch button'));
  const activeIndex = buttons.indexOf(activeButton);
  const modes = ['auto', 'light', 'dark'];
  themeSection.dataset.themeMode = modes[Math.max(0, activeIndex)] || 'auto';
}

function setQuickPrecision(select, value) {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  syncQuickPrecisionDigits();
}

function cycleQuickPrecision() {
  const select = getQuickPrecisionSelect();
  if (!select) return;
  const currentIndex = QUICK_PRECISION_VALUES.indexOf(select.value || '2');
  setQuickPrecision(select, QUICK_PRECISION_VALUES[(currentIndex + 1) % QUICK_PRECISION_VALUES.length]);
}

function closeQuickPrecisionPicker() {
  document.querySelector('.precision-mini-picker')?.remove();
}

function openQuickPrecisionPicker() {
  const section = getQuickPrecisionSection();
  const select = getQuickPrecisionSelect();
  if (!section || !select) return;

  closeQuickPrecisionPicker();
  const picker = document.createElement('div');
  picker.className = 'precision-mini-picker';

  QUICK_PRECISION_VALUES.forEach((value) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value;
    button.className = select.value === value ? 'active' : '';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setQuickPrecision(select, value);
      closeQuickPrecisionPicker();
    });
    picker.appendChild(button);
  });

  section.appendChild(picker);
}

function bindQuickPrecisionSection() {
  const section = getQuickPrecisionSection();
  const select = getQuickPrecisionSelect();
  if (!section || !select || section.dataset.quickPrecisionBound === 'true') return;

  section.dataset.quickPrecisionBound = 'true';
  syncQuickPrecisionDigits();

  let timer = null;
  let usedLongPress = false;

  const clearTimer = () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
  };

  section.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    usedLongPress = false;
    clearTimer();
    timer = window.setTimeout(() => {
      usedLongPress = true;
      openQuickPrecisionPicker();
    }, QUICK_LONG_PRESS_MS);
  });

  section.addEventListener('pointerup', (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearTimer();
    if (!usedLongPress) cycleQuickPrecision();
    usedLongPress = false;
  });

  section.addEventListener('pointerleave', clearTimer);
  section.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  select.addEventListener('change', syncQuickPrecisionDigits);
}

function clickQuickReact(button, section) {
  if (!button || !section) return;
  section.dataset.quickProgrammatic = 'true';
  button.click();
}

function bindQuickButtons() {
  const drawer = getQuickDrawer();
  if (!drawer || drawer.dataset.quickButtonsBound === 'true') return;
  drawer.dataset.quickButtonsBound = 'true';

  const languageSection = drawer.querySelector('.drawer-section:nth-of-type(2)');
  const themeSection = drawer.querySelector('.drawer-section:nth-of-type(3)');

  languageSection?.addEventListener('click', (event) => {
    if (languageSection.dataset.quickProgrammatic === 'true') {
      delete languageSection.dataset.quickProgrammatic;
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    closeQuickPrecisionPicker();
    const inactiveLanguage = drawer.querySelector('.language-switch button:not(.active)');
    clickQuickReact(inactiveLanguage, languageSection);
    window.setTimeout(positionQuickSettings, 0);
  }, true);

  themeSection?.addEventListener('click', (event) => {
    if (themeSection.dataset.quickProgrammatic === 'true') {
      delete themeSection.dataset.quickProgrammatic;
      window.setTimeout(syncQuickThemeMode, 0);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    closeQuickPrecisionPicker();
    const active = drawer.querySelector('.theme-switch button.active');
    const buttons = Array.from(drawer.querySelectorAll('.theme-switch button'));
    const index = Math.max(0, buttons.indexOf(active));
    clickQuickReact(buttons[(index + 1) % buttons.length], themeSection);
    window.setTimeout(syncQuickThemeMode, 0);
  }, true);
}

function bindQuickOutsideClose() {
  if (document.documentElement.dataset.quickSettingsOutsideBound === 'true') return;
  document.documentElement.dataset.quickSettingsOutsideBound = 'true';

  document.addEventListener('pointerdown', (event) => {
    const drawer = getQuickDrawer();
    const button = getQuickSettingsButton();
    if (!drawer?.classList.contains('open')) return;
    if (drawer.contains(event.target) || button?.contains(event.target)) return;
    closeQuickPrecisionPicker();
  }, true);
}

function enhanceQuickSettings() {
  positionQuickSettings();
  syncQuickPrecisionDigits();
  syncQuickThemeMode();
  bindQuickPrecisionSection();
  bindQuickButtons();
  bindQuickOutsideClose();
}

function bindQuickSettings() {
  const observer = new MutationObserver(enhanceQuickSettings);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'dir', 'lang'],
  });

  window.addEventListener('resize', positionQuickSettings);
  window.addEventListener('orientationchange', () => window.setTimeout(positionQuickSettings, 150));
  enhanceQuickSettings();
}

function bootstrapUiHelpers() {
  bindCalculateButtonLabel();
  bindQuickSettings();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapUiHelpers, { once: true });
} else {
  bootstrapUiHelpers();
}
