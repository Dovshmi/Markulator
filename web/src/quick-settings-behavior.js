const LONG_PRESS_MS = 520;
const PRECISION_VALUES = ['2', '3', '4'];

function getAppShell() {
  return document.querySelector('.app-shell');
}

function getSettingsButton() {
  return document.querySelector('.form-settings-button');
}

function getDrawer() {
  return document.querySelector('.settings-drawer');
}

function getPrecisionSelect() {
  return document.querySelector('.settings-drawer .settings-select select');
}

function getPrecisionSection() {
  return document.querySelector('.settings-drawer > .drawer-section:nth-of-type(5)');
}

function positionQuickSettings() {
  const button = getSettingsButton();
  const drawer = getDrawer();
  if (!button || !drawer) return;

  const rect = button.getBoundingClientRect();
  const isEnglish = getAppShell()?.classList.contains('lang-en');
  const viewportPadding = 8;
  const gap = 10;
  const y = Math.max(viewportPadding, Math.min(rect.top - 5, window.innerHeight - 72));
  const x = isEnglish
    ? Math.max(viewportPadding, rect.left - gap)
    : Math.min(window.innerWidth - viewportPadding, rect.right + gap);

  drawer.style.setProperty('--quick-settings-top', `${y}px`);
  drawer.style.setProperty('--quick-settings-x', `${x}px`);
}

function syncPrecisionDigits() {
  const section = getPrecisionSection();
  const select = getPrecisionSelect();
  if (!section || !select) return;
  section.dataset.digits = select.value || '2';
}

function syncThemeMode() {
  const drawer = getDrawer();
  const themeSection = drawer?.querySelector('.drawer-section:nth-of-type(3)');
  const activeButton = drawer?.querySelector('.theme-switch button.active');
  if (!themeSection || !activeButton) return;

  const buttons = Array.from(drawer.querySelectorAll('.theme-switch button'));
  const activeIndex = buttons.indexOf(activeButton);
  const modes = ['auto', 'light', 'dark'];
  themeSection.dataset.themeMode = modes[Math.max(0, activeIndex)] || 'auto';
}

function dispatchSelectValue(select, value) {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  syncPrecisionDigits();
}

function cyclePrecision() {
  const select = getPrecisionSelect();
  if (!select) return;
  const currentIndex = PRECISION_VALUES.indexOf(select.value || '2');
  const nextValue = PRECISION_VALUES[(currentIndex + 1) % PRECISION_VALUES.length];
  dispatchSelectValue(select, nextValue);
}

function closeMiniPicker() {
  document.querySelector('.precision-mini-picker')?.remove();
}

function openMiniPicker() {
  const section = getPrecisionSection();
  const select = getPrecisionSelect();
  if (!section || !select) return;

  closeMiniPicker();
  const picker = document.createElement('div');
  picker.className = 'precision-mini-picker';
  picker.setAttribute('role', 'menu');
  picker.setAttribute('aria-label', 'Result precision');

  PRECISION_VALUES.forEach((value) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value;
    button.className = select.value === value ? 'active' : '';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      dispatchSelectValue(select, value);
      closeMiniPicker();
    });
    picker.appendChild(button);
  });

  section.appendChild(picker);
}

function bindPrecisionSection() {
  const section = getPrecisionSection();
  const select = getPrecisionSelect();
  if (!section || !select || section.dataset.quickPrecisionBound === 'true') return;

  section.dataset.quickPrecisionBound = 'true';
  syncPrecisionDigits();

  let longPressTimer = null;
  let longPressUsed = false;

  const clearLongPress = () => {
    if (longPressTimer) window.clearTimeout(longPressTimer);
    longPressTimer = null;
  };

  section.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    longPressUsed = false;
    clearLongPress();
    longPressTimer = window.setTimeout(() => {
      longPressUsed = true;
      openMiniPicker();
    }, LONG_PRESS_MS);
  });

  section.addEventListener('pointerup', (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearLongPress();
    if (!longPressUsed) cyclePrecision();
    longPressUsed = false;
  });

  section.addEventListener('pointerleave', clearLongPress);
  section.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  select.addEventListener('change', syncPrecisionDigits);
}

function clickWithReact(button, section) {
  if (!button || !section) return;
  section.dataset.quickProgrammatic = 'true';
  button.click();
}

function bindQuickButtons() {
  const drawer = getDrawer();
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
    closeMiniPicker();
    const inactiveLanguage = drawer.querySelector('.language-switch button:not(.active)');
    clickWithReact(inactiveLanguage, languageSection);
    window.setTimeout(positionQuickSettings, 0);
  }, true);

  themeSection?.addEventListener('click', (event) => {
    if (themeSection.dataset.quickProgrammatic === 'true') {
      delete themeSection.dataset.quickProgrammatic;
      window.setTimeout(syncThemeMode, 0);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    closeMiniPicker();

    const active = drawer.querySelector('.theme-switch button.active');
    const buttons = Array.from(drawer.querySelectorAll('.theme-switch button'));
    const index = Math.max(0, buttons.indexOf(active));
    clickWithReact(buttons[(index + 1) % buttons.length], themeSection);
    window.setTimeout(syncThemeMode, 0);
  }, true);
}

function bindOutsideClose() {
  if (document.documentElement.dataset.quickSettingsOutsideBound === 'true') return;
  document.documentElement.dataset.quickSettingsOutsideBound = 'true';

  document.addEventListener('pointerdown', (event) => {
    const drawer = getDrawer();
    const button = getSettingsButton();
    if (!drawer?.classList.contains('open')) return;
    if (drawer.contains(event.target) || button?.contains(event.target)) return;
    closeMiniPicker();
  }, true);
}

function enhanceQuickSettings() {
  positionQuickSettings();
  syncPrecisionDigits();
  syncThemeMode();
  bindPrecisionSection();
  bindQuickButtons();
  bindOutsideClose();
}

function observeApp() {
  const observer = new MutationObserver(() => {
    enhanceQuickSettings();
  });

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeApp, { once: true });
} else {
  observeApp();
}
