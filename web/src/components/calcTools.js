export const WEB_VERSION = 'Web v1.0';

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
    if (!ready) return { ready: false, errors };

    const parsed = values.map(toNumber);
    if (parsed.some((value) => Number.isNaN(value))) errors.push(msg.invalidNumbers);
    if (parsed.some((value) => value != null && value < 0)) errors.push(msg.negativeValues);
    if (!tol.nominal) errors.push(msg.missingNominal);
    return { ready, errors };
  }

  const max = toNumber(limits.max);
  const min = toNumber(limits.min);
  const ready = Boolean(limits.max || limits.min);
  if (!ready) return { ready: false, errors };

  if (Number.isNaN(max) || Number.isNaN(min)) errors.push(msg.invalidNumbers);
  if (!limits.max || !limits.min) errors.push(msg.missingLimits);
  if (max != null && min != null && !Number.isNaN(max) && !Number.isNaN(min) && max < min) errors.push(msg.maxLowerThanMin);
  return { ready, errors };
}

export function buildCopyText(mode, result, digits, unitLabel = 'mm', language = 'he') {
  if (!result) return '';
  const labels = COPY_LABELS[getLanguage(language)];

  if (mode === 'plus-minus') {
    return [
      labels.tolPlus + ' ' + formatNumber(result.posTolMm, digits) + ' ' + unitLabel,
      labels.nominal + ' ' + formatNumber(result.nominalMm, digits) + ' ' + unitLabel,
      labels.tolMinus + ' ' + formatNumber(result.negTolMm, digits) + ' ' + unitLabel,
      labels.upper + ' ' + formatNumber(result.maxLimitMm, digits) + ' ' + unitLabel,
      labels.lower + ' ' + formatNumber(result.minLimitMm, digits) + ' ' + unitLabel,
    ].join('\n');
  }

  return [
    labels.max + ' ' + formatNumber(result.maxMm, digits) + ' ' + unitLabel,
    labels.min + ' ' + formatNumber(result.minMm, digits) + ' ' + unitLabel,
    labels.range + ' ' + formatNumber(result.rangeMm, digits) + ' ' + unitLabel,
  ].join('\n');
}

export function buildShortCopyText(mode, result, digits, unitLabel = 'mm', language = 'he') {
  if (!result) return '';
  const labels = COPY_LABELS[getLanguage(language)];

  if (mode === 'plus-minus') {
    return labels.nominal + ' ' + formatNumber(result.nominalMm, digits) + ' ' + unitLabel + ' | ' + labels.upper + ' ' + formatNumber(result.maxLimitMm, digits) + ' ' + unitLabel + ' | ' + labels.lower + ' ' + formatNumber(result.minLimitMm, digits) + ' ' + unitLabel;
  }

  return labels.max + ' ' + formatNumber(result.maxMm, digits) + ' ' + unitLabel + ' | ' + labels.min + ' ' + formatNumber(result.minMm, digits) + ' ' + unitLabel + ' | ' + labels.range + ' ' + formatNumber(result.rangeMm, digits) + ' ' + unitLabel;
}
