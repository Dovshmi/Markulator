export const WEB_VERSION = 'Web v0.9';

export const UNIT_MODES = {
  IN_TO_MM: 'in-to-mm',
  MM_TO_IN: 'mm-to-in',
};

export function getUnits(unitMode) {
  if (unitMode === UNIT_MODES.MM_TO_IN) {
    return { input: 'mm', output: 'in', outputLabel: 'in', inputLabel: 'מ״מ' };
  }
  return { input: 'in', output: 'mm', outputLabel: 'מ״מ', inputLabel: 'in' };
}

export function convertValue(value, unitMode) {
  if (unitMode === UNIT_MODES.MM_TO_IN) return value / 25.4;
  return value * 25.4;
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

export function validateInputs(mode, tol, limits) {
  const errors = [];

  if (mode === 'plus-minus') {
    const values = [tol.positive, tol.nominal, tol.negative];
    const ready = values.some(Boolean);
    if (!ready) return { ready: false, errors };

    const parsed = values.map(toNumber);
    if (parsed.some((value) => Number.isNaN(value))) errors.push('יש להזין מספרים תקינים בלבד.');
    if (parsed.some((value) => value != null && value < 0)) errors.push('הערכים לא יכולים להיות שליליים.');
    if (!tol.nominal) errors.push('יש להזין מידה נומינלית.');

    return { ready, errors };
  }

  const max = toNumber(limits.max);
  const min = toNumber(limits.min);
  const ready = Boolean(limits.max || limits.min);
  if (!ready) return { ready: false, errors };

  if (Number.isNaN(max) || Number.isNaN(min)) errors.push('יש להזין מספרים תקינים בלבד.');
  if (!limits.max || !limits.min) errors.push('יש להזין גם ערך מקסימלי וגם ערך מינימלי.');
  if (max != null && min != null && !Number.isNaN(max) && !Number.isNaN(min) && max < min) {
    errors.push('הערך המקסימלי חייב להיות גדול או שווה לערך המינימלי.');
  }

  return { ready, errors };
}

export function buildCopyText(mode, result, digits, unitLabel = 'מ״מ') {
  if (mode === 'plus-minus') {
    return [
      `Tol+ ${formatNumber(result.posTolMm, digits)} ${unitLabel}`,
      `Nominal ${formatNumber(result.nominalMm, digits)} ${unitLabel}`,
      `Tol- ${formatNumber(result.negTolMm, digits)} ${unitLabel}`,
      `Upper limit ${formatNumber(result.maxLimitMm, digits)} ${unitLabel}`,
      `Lower limit ${formatNumber(result.minLimitMm, digits)} ${unitLabel}`,
    ].join('\n');
  }

  return [
    `Max ${formatNumber(result.maxMm, digits)} ${unitLabel}`,
    `Min ${formatNumber(result.minMm, digits)} ${unitLabel}`,
    `Range ${formatNumber(result.rangeMm, digits)} ${unitLabel}`,
  ].join('\n');
}

export function buildShortCopyText(mode, result, digits, unitLabel = 'מ״מ') {
  if (!result) return '';
  if (mode === 'plus-minus') {
    return `Nominal ${formatNumber(result.nominalMm, digits)} ${unitLabel} | Upper ${formatNumber(result.maxLimitMm, digits)} ${unitLabel} | Lower ${formatNumber(result.minLimitMm, digits)} ${unitLabel}`;
  }
  return `Max ${formatNumber(result.maxMm, digits)} ${unitLabel} | Min ${formatNumber(result.minMm, digits)} ${unitLabel} | Range ${formatNumber(result.rangeMm, digits)} ${unitLabel}`;
}
