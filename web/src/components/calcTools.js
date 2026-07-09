export const WEB_VERSION = 'Web v1.1';

export const UNIT_MODES = {
  IN_TO_MM: 'in-to-mm',
  MM_TO_IN: 'mm-to-in',
};

const MESSAGES = {
  he: {
    invalidNumbers: 'יש להזין מספרים תקינים בלבד.',
    negativeValues: 'הערכים לא יכולים להיות שליליים.',
    missingNominal: 'יש להזין מידה נומינלית.',
    missingLimits: 'יש להזין גם ערך מקסימלי וגם ערך מינימלי.',
    maxLowerThanMin: 'הערך המקסימלי חייב להיות גדול או שווה לערך המינימלי.',
  },
  en: {
    invalidNumbers: 'Enter valid numbers only.',
    negativeValues: 'Values cannot be negative.',
    missingNominal: 'Enter a nominal value.',
    missingLimits: 'Enter both maximum and minimum values.',
    maxLowerThanMin: 'Maximum value must be greater than or equal to minimum value.',
  },
};

const COPY_LABELS = {
  he: {
    tolPlus: 'סבולת +',
    nominal: 'נומינלי',
    tolMinus: 'סבולת -',
    upper: 'גבול עליון',
    lower: 'גבול תחתון',
    max: 'מקסימום',
    min: 'מינימום',
    range: 'טווח',
  },
  en: {
    tolPlus: 'Tol+',
    nominal: 'Nominal',
    tolMinus: 'Tol-',
    upper: 'Upper limit',
    lower: 'Lower limit',
    max: 'Max',
    min: 'Min',
    range: 'Range',
  },
};

function getLanguage(language) {
  return language === 'en' ? 'en' : 'he';
}

export function getUnits(unitMode) {
  if (unitMode === UNIT_MODES.MM_TO_IN) {
    return { input: 'mm', output: 'in', outputLabel: 'in', inputLabel: 'mm' };
  }
  return { input: 'in', output: 'mm', outputLabel: 'mm', inputLabel: 'in' };
}

export function convertValue(value, unitMode) {
  return unitMode === UNIT_MODES.MM_TO_IN ? value / 25.4 : value * 25.4;
}

export function toNumber(value) {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function formatNumber(value, digits) {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}

export function validateInputs(mode, tol, limits, language = 'he') {
  const errors = [];
  const msg = MESSAGES[getLanguage(language)];

  if (mode === 'plus-minus') {
    const values = [tol.positive, tol.nominal, tol.negative];
    const ready = values.some(Boolean);
    if (!ready) return { errors, ready: false };
    const nums = values.map(toNumber);
    if (nums.some((v) => Number.isNaN(v))) errors.push(msg.invalidNumbers);
    if (nums.some((v) => v != null && v < 0)) errors.push(msg.negativeValues);
    if (!tol.nominal) errors.push(msg.missingNominal);
    return { errors, ready: errors.length === 0 && nums.every((v) => v != null) };
  }

  const values = [limits.max, limits.min];
  const ready = values.some(Boolean);
  if (!ready) return { errors, ready: false };
  const nums = values.map(toNumber);
  if (nums.some((v) => Number.isNaN(v))) errors.push(msg.invalidNumbers);
  if (nums.some((v) => v != null && v < 0)) errors.push(msg.negativeValues);
  if (!limits.max || !limits.min) errors.push(msg.missingLimits);
  if (nums.every((v) => v != null && !Number.isNaN(v)) && nums[0] < nums[1]) errors.push(msg.maxLowerThanMin);
  return { errors, ready: errors.length === 0 && nums.every((v) => v != null) };
}

export function calculateTolerance(tol, unitMode, digits) {
  const positive = toNumber(tol.positive);
  const nominal = toNumber(tol.nominal);
  const negative = toNumber(tol.negative);
  const upper = nominal + positive;
  const lower = nominal - negative;

  return {
    input: {
      positive: formatNumber(positive, digits),
      nominal: formatNumber(nominal, digits),
      negative: formatNumber(negative, digits),
      upper: formatNumber(upper, digits),
      lower: formatNumber(lower, digits),
    },
    output: {
      positive: formatNumber(convertValue(positive, unitMode), digits),
      nominal: formatNumber(convertValue(nominal, unitMode), digits),
      negative: formatNumber(convertValue(negative, unitMode), digits),
      upper: formatNumber(convertValue(upper, unitMode), digits),
      lower: formatNumber(convertValue(lower, unitMode), digits),
    },
  };
}

export function calculateLimits(limits, unitMode, digits) {
  const max = toNumber(limits.max);
  const min = toNumber(limits.min);
  const range = max - min;

  return {
    input: {
      max: formatNumber(max, digits),
      min: formatNumber(min, digits),
      range: formatNumber(range, digits),
    },
    output: {
      max: formatNumber(convertValue(max, unitMode), digits),
      min: formatNumber(convertValue(min, unitMode), digits),
      range: formatNumber(convertValue(range, unitMode), digits),
    },
  };
}

export function buildCopyText({ mode, result, units, language = 'he' }) {
  if (!result) return '';
  const labels = COPY_LABELS[getLanguage(language)];

  if (mode === 'plus-minus') {
    return [
      `${labels.tolPlus}: ${result.input.positive} ${units.input} → ${result.output.positive} ${units.output}`,
      `${labels.nominal}: ${result.input.nominal} ${units.input} → ${result.output.nominal} ${units.output}`,
      `${labels.tolMinus}: ${result.input.negative} ${units.input} → ${result.output.negative} ${units.output}`,
      `${labels.upper}: ${result.input.upper} ${units.input} → ${result.output.upper} ${units.output}`,
      `${labels.lower}: ${result.input.lower} ${units.input} → ${result.output.lower} ${units.output}`,
    ].join('\n');
  }

  return [
    `${labels.max}: ${result.input.max} ${units.input} → ${result.output.max} ${units.output}`,
    `${labels.min}: ${result.input.min} ${units.input} → ${result.output.min} ${units.output}`,
    `${labels.range}: ${result.input.range} ${units.input} → ${result.output.range} ${units.output}`,
  ].join('\n');
}
