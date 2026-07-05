const MM_PER_INCH = 25.4;

const LABELS = {
  he: {
    smartTitle: 'כלים חכמים',
    smartTag: 'BETA',
    pasteTitle: 'הדבקה חכמה',
    pastePlaceholder: 'לדוגמה: .400 +.020 -.020',
    apply: 'מלא',
    pasteHelp: 'מדביקים מידה משורטט/הערה והאפליקציה ממלאת את השדות.',
    pasteOk: 'השדות מולאו בהצלחה.',
    pasteFail: 'לא הצלחתי לזהות ערכים תקינים.',
    checkTitle: 'בדיקת מדידה בפועל',
    measuredPlaceholder: 'מדידה בפועל',
    check: 'בדוק',
    copyCard: 'העתק כרטיס',
    checkHelp: 'בודק אם המדידה בפועל נמצאת בין הגבול התחתון לעליון.',
    needValues: 'צריך חישוב תקין לפני בדיקה.',
    pass: 'PASS — בתוך הסבולת',
    fail: 'FAIL — מחוץ לסבולת',
    copied: 'כרטיס בדיקה הועתק.',
  },
  en: {
    smartTitle: 'Smart tools',
    smartTag: 'BETA',
    pasteTitle: 'Smart paste',
    pastePlaceholder: 'Example: .400 +.020 -.020',
    apply: 'Fill',
    pasteHelp: 'Paste a drawing-style tolerance line and Markulator fills the fields.',
    pasteOk: 'Fields filled successfully.',
    pasteFail: 'Could not detect valid values.',
    checkTitle: 'Actual measurement check',
    measuredPlaceholder: 'Actual measured value',
    check: 'Check',
    copyCard: 'Copy card',
    checkHelp: 'Checks whether the measured value is between lower and upper limit.',
    needValues: 'A valid calculation is needed first.',
    pass: 'PASS — inside tolerance',
    fail: 'FAIL — outside tolerance',
    copied: 'Inspection card copied.',
  },
};

let mounted = false;
let scheduled = false;
let observer = null;
let lastInspectionCard = '';

function language() {
  return document.documentElement.lang === 'en' ? 'en' : 'he';
}

function labels() {
  return LABELS[language()];
}

function numberFrom(value) {
  const parsed = Number(String(value || '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function visibleMode() {
  return document.querySelector('.mode-switch button.active')?.textContent?.toLowerCase().includes('max') ? 'max-min' : 'plus-minus';
}

function currentDirection() {
  const text = document.querySelector('.conversion-pill')?.textContent || '';
  return text.includes('mm') && text.indexOf('mm') < text.indexOf('inch') ? 'mm-to-in' : 'in-to-mm';
}

function outputUnit() {
  return currentDirection() === 'in-to-mm' ? 'mm' : 'in';
}

function inputUnit() {
  return currentDirection() === 'in-to-mm' ? 'in' : 'mm';
}

function setNativeValue(input, value) {
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, String(value));
  else input.value = String(value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function sourceToleranceInput(field) {
  return document.querySelector(`input[data-tolerance-side="left"][data-tolerance-field="${field}"]`);
}

function sourceLimitInput(field) {
  return document.querySelector(`input[data-limit-side="left"][data-limit-field="${field}"]`);
}

function targetToleranceValue(field) {
  return numberFrom(document.querySelector(`input[data-tolerance-side="right"][data-tolerance-field="${field}"]`)?.value);
}

function targetLimitValue(field) {
  return numberFrom(document.querySelector(`input[data-limit-side="right"][data-limit-field="${field}"]`)?.value);
}

function parseSmartText(raw) {
  const text = String(raw || '').replace(/,/g, '.').replace(/[−–—]/g, '-');
  const hasPlusMinus = /±|\+\/\-/.test(text);
  const matches = Array.from(text.matchAll(/([+-]?)\s*(\d*\.?\d+)/g)).map((match) => ({
    sign: match[1] || '',
    value: Number(match[2]),
  })).filter((item) => Number.isFinite(item.value));

  if (visibleMode() === 'max-min') {
    const values = matches.map((item) => item.value);
    if (values.length < 2) return null;
    return { mode: 'max-min', max: Math.max(values[0], values[1]), min: Math.min(values[0], values[1]) };
  }

  if (!matches.length) return null;

  if (hasPlusMinus && matches.length >= 2) {
    const nominal = matches.find((item) => !item.sign)?.value ?? matches[0].value;
    const tol = matches.find((item) => item.sign)?.value ?? matches[1].value;
    return { mode: 'plus-minus', nominal, positive: Math.abs(tol), negative: Math.abs(tol) };
  }

  const positive = matches.find((item) => item.sign === '+')?.value;
  const negative = matches.find((item) => item.sign === '-')?.value;
  const unsigned = matches.filter((item) => !item.sign).map((item) => item.value);
  const nominal = unsigned[0] ?? matches[0]?.value;

  if (nominal == null) return null;

  return {
    mode: 'plus-minus',
    nominal,
    positive: Math.abs(positive ?? unsigned[1] ?? 0),
    negative: Math.abs(negative ?? unsigned[2] ?? positive ?? unsigned[1] ?? 0),
  };
}

function applySmartPaste(input, status) {
  const t = labels();
  const parsed = parseSmartText(input.value);
  if (!parsed) {
    status.textContent = t.pasteFail;
    status.className = 'smart-tools-result warn';
    return;
  }

  if (parsed.mode === 'max-min') {
    setNativeValue(sourceLimitInput('max'), parsed.max);
    setNativeValue(sourceLimitInput('min'), parsed.min);
  } else {
    setNativeValue(sourceToleranceInput('positive'), parsed.positive);
    setNativeValue(sourceToleranceInput('nominal'), parsed.nominal);
    setNativeValue(sourceToleranceInput('negative'), parsed.negative);
  }

  status.textContent = t.pasteOk;
  status.className = 'smart-tools-result pass';
}

function getOutputLimits() {
  if (visibleMode() === 'max-min') {
    const max = targetLimitValue('max');
    const min = targetLimitValue('min');
    if (max == null || min == null) return null;
    return { upper: Math.max(max, min), lower: Math.min(max, min), nominal: null };
  }

  const positive = targetToleranceValue('positive');
  const nominal = targetToleranceValue('nominal');
  const negative = targetToleranceValue('negative');
  if (positive == null || nominal == null || negative == null) return null;
  return { upper: nominal + positive, lower: nominal - negative, nominal };
}

function checkMeasurement(input, status, meter) {
  const t = labels();
  const measured = numberFrom(input.value);
  const limits = getOutputLimits();
  const unit = outputUnit();

  if (measured == null || !limits) {
    status.textContent = t.needValues;
    status.className = 'smart-tools-result warn';
    meter.classList.remove('has-value');
    lastInspectionCard = '';
    return;
  }

  const pass = measured <= limits.upper && measured >= limits.lower;
  const distanceToUpper = limits.upper - measured;
  const distanceToLower = measured - limits.lower;
  const nearest = Math.min(Math.abs(distanceToUpper), Math.abs(distanceToLower));
  const range = Math.max(limits.upper - limits.lower, 0.0000001);
  const position = Math.max(0, Math.min(100, ((measured - limits.lower) / range) * 100));
  meter.classList.add('has-value');
  meter.querySelector('span').style.left = `${position}%`;

  status.textContent = `${pass ? t.pass : t.fail} · ${measured} ${unit} · ${limits.lower.toFixed(4)}–${limits.upper.toFixed(4)} ${unit} · nearest edge ${nearest.toFixed(4)} ${unit}`;
  status.className = `smart-tools-result ${pass ? 'pass' : 'fail'}`;

  lastInspectionCard = [
    'Markulator Inspection Card',
    `Status: ${pass ? 'PASS' : 'FAIL'}`,
    `Measured: ${measured} ${unit}`,
    `Lower: ${limits.lower.toFixed(4)} ${unit}`,
    `Upper: ${limits.upper.toFixed(4)} ${unit}`,
    `Nearest edge: ${nearest.toFixed(4)} ${unit}`,
    `Direction: ${inputUnit()} → ${outputUnit()}`,
  ].join('\n');
}

async function copyInspectionCard(status) {
  const t = labels();
  if (!lastInspectionCard) return;
  try {
    await navigator.clipboard.writeText(lastInspectionCard);
    status.textContent = t.copied;
    status.className = 'smart-tools-result pass';
  } catch {
    status.textContent = lastInspectionCard;
    status.className = 'smart-tools-result warn';
  }
}

function createPanel() {
  const t = labels();
  const panel = document.createElement('section');
  panel.className = 'smart-tools-panel';
  panel.setAttribute('aria-label', t.smartTitle);
  panel.innerHTML = `
    <div class="smart-tools-card">
      <div class="smart-tools-title"><span>${t.pasteTitle}</span><small>${t.smartTag}</small></div>
      <div class="smart-tools-row">
        <input class="smart-tools-input smart-paste-input" type="text" inputmode="text" autocomplete="off" placeholder="${t.pastePlaceholder}" />
        <button class="smart-tools-button smart-paste-button" type="button">${t.apply}</button>
      </div>
      <div class="smart-tools-help">${t.pasteHelp}</div>
      <div class="smart-tools-result smart-paste-status"></div>
    </div>
    <div class="smart-tools-card">
      <div class="smart-tools-title"><span>${t.checkTitle}</span><small>${outputUnit()}</small></div>
      <div class="smart-tools-row">
        <input class="smart-tools-input smart-measured-input" type="number" inputmode="decimal" step="0.0001" placeholder="${t.measuredPlaceholder} ${outputUnit()}" />
        <button class="smart-tools-button smart-check-button" type="button">${t.check}</button>
      </div>
      <div class="smart-tools-meter"><span></span></div>
      <div class="smart-tools-help">${t.checkHelp}</div>
      <div class="smart-tools-row">
        <button class="smart-tools-button secondary smart-copy-card-button" type="button">${t.copyCard}</button>
        <div class="smart-tools-result smart-check-status"></div>
      </div>
    </div>
  `;

  const pasteInput = panel.querySelector('.smart-paste-input');
  const pasteStatus = panel.querySelector('.smart-paste-status');
  const measuredInput = panel.querySelector('.smart-measured-input');
  const checkStatus = panel.querySelector('.smart-check-status');
  const meter = panel.querySelector('.smart-tools-meter');

  panel.querySelector('.smart-paste-button').addEventListener('click', () => applySmartPaste(pasteInput, pasteStatus));
  pasteInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') applySmartPaste(pasteInput, pasteStatus);
  });
  panel.querySelector('.smart-check-button').addEventListener('click', () => checkMeasurement(measuredInput, checkStatus, meter));
  measuredInput.addEventListener('input', () => checkMeasurement(measuredInput, checkStatus, meter));
  panel.querySelector('.smart-copy-card-button').addEventListener('click', () => copyInspectionCard(checkStatus));

  return panel;
}

function mountPanel() {
  scheduled = false;
  const form = document.querySelector('.form-section');
  if (!form || form.querySelector('.smart-tools-panel')) return;
  const anchor = form.querySelector('.calculator-mode-panel');
  if (!anchor) return;
  form.insertBefore(createPanel(), anchor);
  mounted = true;
}

function scheduleMount() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(mountPanel);
}

function bind() {
  mountPanel();
  const root = document.getElementById('root');
  if (!root || !('MutationObserver' in window)) return;
  observer?.disconnect?.();
  observer = new MutationObserver((mutations) => {
    if (mounted && document.querySelector('.smart-tools-panel')) return;
    const shouldMount = mutations.some((mutation) => Array.from(mutation.addedNodes || []).some((node) => node.nodeType === 1 && (node.matches?.('.form-section, .calculator-mode-panel') || node.querySelector?.('.form-section, .calculator-mode-panel'))));
    if (shouldMount) scheduleMount();
  });
  observer.observe(root, { childList: true, subtree: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
else bind();
