import { calculateMaxMinTolerance, calculatePlusMinusTolerance } from './markulator.js';

const MM_PER_INCH = 25.4;

const LABELS = {
  he: {
    copy: 'העתק',
    copied: 'הועתק',
    nominal: 'נומינלי',
    upper: 'עליון',
    lower: 'תחתון',
    max: 'מקסימום',
    min: 'מינימום',
    range: 'טווח',
  },
  en: {
    copy: 'Copy',
    copied: 'Copied',
    nominal: 'Nominal',
    upper: 'Upper',
    lower: 'Lower',
    max: 'Max',
    min: 'Min',
    range: 'Range',
  },
};

function toNumber(value) {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function formatNumber(value, digits) {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}

function getLanguage() {
  return document.documentElement.lang === 'en' ? 'en' : 'he';
}

function getMode() {
  const activeButton = document.querySelector('.mode-switch button.active');
  const buttons = Array.from(document.querySelectorAll('.mode-switch button'));
  return buttons.indexOf(activeButton) === 1 ? 'max-min' : 'plus-minus';
}

function getUnitMode() {
  const text = document.querySelector('.conversion-pill')?.textContent || '';
  return text.includes('mm → inch') ? 'mm-to-in' : 'in-to-mm';
}

function getDigits() {
  const value = document.querySelector('.settings-select select')?.value;
  const digits = Number(value);
  return [2, 3, 4].includes(digits) ? digits : 2;
}

function getVisibleInputs() {
  return Array.from(document.querySelectorAll('.form-section .mode-content input'));
}

function buildResult() {
  const mode = getMode();
  const unitMode = getUnitMode();
  const inputs = getVisibleInputs();

  if (mode === 'plus-minus') {
    const [positiveInput, nominalInput, negativeInput] = inputs;
    const positiveRaw = positiveInput?.value || '';
    const nominalRaw = nominalInput?.value || '';
    const negativeRaw = negativeInput?.value || '';
    const values = [positiveRaw, nominalRaw, negativeRaw];
    if (!values.some(Boolean)) return null;

    const positive = toNumber(positiveRaw);
    const nominal = toNumber(nominalRaw);
    const negative = toNumber(negativeRaw);
    const parsed = [positive, nominal, negative];
    if (parsed.some((value) => Number.isNaN(value))) return null;
    if (parsed.some((value) => value != null && value < 0)) return null;
    if (!nominalRaw) return null;

    if (unitMode === 'in-to-mm') {
      return { mode, unit: 'mm', result: calculatePlusMinusTolerance(nominal, positive, negative) };
    }

    const nominalMm = nominal / MM_PER_INCH;
    const posTolMm = positive / MM_PER_INCH;
    const negTolMm = negative / MM_PER_INCH;
    return {
      mode,
      unit: 'in',
      result: {
        nominalMm,
        posTolMm,
        negTolMm,
        maxLimitMm: nominalMm + posTolMm,
        minLimitMm: nominalMm - negTolMm,
      },
    };
  }

  const [maxInput, minInput] = inputs;
  const maxRaw = maxInput?.value || '';
  const minRaw = minInput?.value || '';
  if (!maxRaw && !minRaw) return null;

  const max = toNumber(maxRaw);
  const min = toNumber(minRaw);
  if (Number.isNaN(max) || Number.isNaN(min)) return null;
  if (!maxRaw || !minRaw) return null;
  if (max < min) return null;

  if (unitMode === 'in-to-mm') {
    return { mode, unit: 'mm', result: calculateMaxMinTolerance(max, min) };
  }

  const maxMm = max / MM_PER_INCH;
  const minMm = min / MM_PER_INCH;
  return { mode, unit: 'in', result: { maxMm, minMm, rangeMm: maxMm - minMm } };
}

function buildItems(data, language) {
  const labels = LABELS[language];

  if (data.mode === 'plus-minus') {
    return [
      { key: 'upper', label: labels.upper, value: data.result.maxLimitMm, icon: '↑' },
      { key: 'nominal', label: labels.nominal, value: data.result.nominalMm },
      { key: 'lower', label: labels.lower, value: data.result.minLimitMm, icon: '↓' },
    ];
  }

  return [
    { key: 'max', label: labels.max, value: data.result.maxMm },
    { key: 'min', label: labels.min, value: data.result.minMm },
    { key: 'range', label: labels.range, value: data.result.rangeMm },
  ];
}

function buildCopyText(items, unit, digits) {
  return items.map((item) => `${item.label} ${formatNumber(item.value, digits)} ${unit}`).join(' | ');
}

function isResultDrawerVisible() {
  const drawer = document.getElementById('result-drawer');
  if (!drawer || !drawer.classList.contains('open')) return false;
  const rect = drawer.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.height > 40 && rect.top < viewportHeight * 0.78 && rect.bottom > viewportHeight * 0.18;
}

function createBar() {
  const bar = document.createElement('aside');
  bar.className = 'sticky-result-bar';
  bar.setAttribute('aria-live', 'polite');
  bar.innerHTML = `
    <button type="button" class="sticky-result-copy"></button>
    <div class="sticky-result-items"></div>
  `;
  document.body.appendChild(bar);
  return bar;
}

let bar;
let latestCopyText = '';
let updateTimer;

function updateBar() {
  if (!bar) bar = createBar();

  const data = buildResult();
  const shouldShow = Boolean(data) && !isResultDrawerVisible();
  document.body.classList.toggle('sticky-result-bar-active', shouldShow);
  bar.classList.toggle('visible', shouldShow);

  if (!data) {
    latestCopyText = '';
    return;
  }

  const language = getLanguage();
  const digits = getDigits();
  const labels = LABELS[language];
  const items = buildItems(data, language);
  latestCopyText = buildCopyText(items, data.unit, digits);

  const copyButton = bar.querySelector('.sticky-result-copy');
  const itemsContainer = bar.querySelector('.sticky-result-items');
  copyButton.textContent = labels.copy;
  copyButton.setAttribute('aria-label', labels.copy);
  itemsContainer.innerHTML = items.map((item) => `
    <span class="sticky-result-item sticky-result-${item.key}">
      <small>${item.icon ? `<b class="sticky-result-icon" aria-hidden="true">${item.icon}</b>` : ''}<em>${item.label}</em></small>
      <strong>${formatNumber(item.value, digits)} ${data.unit}</strong>
    </span>
  `).join('');
}

function scheduleUpdate() {
  window.clearTimeout(updateTimer);
  updateTimer = window.setTimeout(updateBar, 40);
}

function bindEvents() {
  document.addEventListener('input', scheduleUpdate, true);
  document.addEventListener('change', scheduleUpdate, true);
  document.addEventListener('click', scheduleUpdate, true);
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });

  document.addEventListener('click', async (event) => {
    const button = event.target.closest?.('.sticky-result-copy');
    if (!button || !latestCopyText) return;

    const language = getLanguage();
    try {
      await navigator.clipboard.writeText(latestCopyText);
      const original = LABELS[language].copy;
      button.textContent = LABELS[language].copied;
      window.setTimeout(() => { button.textContent = original; }, 1100);
    } catch {
      // Clipboard permission may be unavailable; leave the visual state unchanged.
    }
  });

  const root = document.getElementById('root');
  if (root && 'MutationObserver' in window) {
    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'dir', 'lang'] });
  }

  scheduleUpdate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindEvents, { once: true });
} else {
  bindEvents();
}
