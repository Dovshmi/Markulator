export const WEB_VERSION = 'Web v0.7';

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

export function buildCopyText(mode, result, digits) {
  if (mode === 'plus-minus') {
    return [
      `Tol+ ${formatNumber(result.posTolMm, digits)} mm`,
      `Nominal ${formatNumber(result.nominalMm, digits)} mm`,
      `Tol- ${formatNumber(result.negTolMm, digits)} mm`,
      `Upper limit ${formatNumber(result.maxLimitMm, digits)} mm`,
      `Lower limit ${formatNumber(result.minLimitMm, digits)} mm`,
    ].join('\n');
  }

  return [
    `Max ${formatNumber(result.maxMm, digits)} mm`,
    `Min ${formatNumber(result.minMm, digits)} mm`,
    `Range ${formatNumber(result.rangeMm, digits)} mm`,
  ].join('\n');
}
