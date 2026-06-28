function getLanguage() {
  return document.documentElement.lang === 'en' ? 'en' : 'he';
}

function getLabel() {
  return getLanguage() === 'en' ? 'Switch conversion direction' : 'החלף כיוון המרה';
}

function findUnitButton(directionText) {
  return Array.from(document.querySelectorAll('.unit-switch button'))
    .find((button) => button.textContent?.trim() === directionText);
}

function getCurrentDirection() {
  return document.querySelector('.conversion-pill')?.textContent?.trim() || 'inch → mm';
}

function toggleDirection() {
  const current = getCurrentDirection();
  const next = current.includes('mm → inch') ? 'inch → mm' : 'mm → inch';
  const targetButton = findUnitButton(next);
  targetButton?.click();
}

function enhancePill() {
  const pill = document.querySelector('.conversion-pill');
  if (!pill) return;

  pill.classList.add('conversion-pill-toggle');
  pill.setAttribute('role', 'button');
  pill.setAttribute('tabindex', '0');
  pill.setAttribute('aria-label', getLabel());
  pill.setAttribute('title', getLabel());

  if (pill.dataset.toggleBound === 'true') return;
  pill.dataset.toggleBound = 'true';

  pill.addEventListener('click', toggleDirection);
  pill.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggleDirection();
  });
}

function scheduleEnhance() {
  window.requestAnimationFrame(enhancePill);
}

function bindConversionPillToggle() {
  enhancePill();

  const root = document.getElementById('root');
  if (!root || !('MutationObserver' in window)) return;

  const observer = new MutationObserver(scheduleEnhance);
  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'lang', 'dir'],
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindConversionPillToggle, { once: true });
} else {
  bindConversionPillToggle();
}
