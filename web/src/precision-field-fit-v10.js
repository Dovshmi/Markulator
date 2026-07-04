const PRECISION_CLASS_PREFIX = 'precision-';
const PRECISION_CLASSES = ['precision-1', 'precision-2', 'precision-3', 'precision-4'];
const VALUE_FRAME_SELECTOR = '.tolerance-value-frame, .limit-value-frame';

function getPrecisionValue() {
  const sectionValue = document.querySelector('.settings-drawer > .drawer-section:nth-of-type(5)')?.dataset?.digits;
  const selectValue = document.querySelector('.settings-drawer .settings-select select')?.value;
  const stored = document.body.dataset.precisionDigits;
  return sectionValue || selectValue || stored || '2';
}

function syncPrecisionBodyClass() {
  const precision = getPrecisionValue();
  document.body.dataset.precisionDigits = precision;
  PRECISION_CLASSES.forEach((className) => document.body.classList.toggle(className, className === `${PRECISION_CLASS_PREFIX}${precision}`));
}

function getNumericLength(value) {
  return String(value || '').replace(/[^0-9.]/g, '').length;
}

function syncFieldFitClasses() {
  const precision = getPrecisionValue();
  const forceTight = precision === '4';

  document.querySelectorAll(VALUE_FRAME_SELECTOR).forEach((frame) => {
    const input = frame.querySelector('input');
    const valueLength = getNumericLength(input?.value || '');
    const tight = forceTight || valueLength >= 6;
    const tighter = valueLength >= 8;

    frame.classList.toggle('value-fit-tight', tight);
    frame.classList.toggle('value-fit-tighter', tighter);
  });
}

function syncPrecisionFit() {
  syncPrecisionBodyClass();
  syncFieldFitClasses();
}

let rafId = 0;
function schedulePrecisionFit() {
  if (rafId) return;
  rafId = window.requestAnimationFrame(() => {
    rafId = 0;
    syncPrecisionFit();
  });
}

function observePrecisionFit() {
  syncPrecisionFit();

  document.addEventListener('input', schedulePrecisionFit, true);
  document.addEventListener('change', schedulePrecisionFit, true);
  document.addEventListener('keyup', schedulePrecisionFit, true);

  const observer = new MutationObserver(schedulePrecisionFit);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'data-digits'],
  });

  window.setInterval(syncPrecisionFit, 350);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observePrecisionFit, { once: true });
} else {
  observePrecisionFit();
}
