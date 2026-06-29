export const WEB_VERSION = 'Web v0.9.8';

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
    maxLowerThanMin: 'Maximum must be greater than or equal to minimum.',
  },
};

const roundToDigits = (value, digits) => Number(value.toFixed(digits));

export function getUnits(unitMode) {
  return unitMode === UNIT_MODES.IN_TO_MM
    ? { input: 'inch', output: 'mm', inputLabel: 'Inch', outputLabel: 'mm' }
    : { input: 'mm', output: 'inch', inputLabel: 'mm', outputLabel: 'Inch' };
}

export function convertValue(value, unitMode) {
  return unitMode === UNIT_MODES.IN_TO_MM ? value * 25.4 : value / 25.4;
}

export function convertResult(result, mode, unitMode, digits) {
  if (!result) return null;

  if (mode === 'plus-minus') {
    const nominal = unitMode === UNIT_MODES.IN_TO_MM ? result.nominalMm : result.nominalMm / 25.4;
    const positiveTolerance = unitMode === UNIT_MODES.IN_TO_MM ? result.posTolMm : result.posTolMm / 25.4;
    const negativeTolerance = unitMode === UNIT_MODES.IN_TO_MM ? result.negTolMm : result.negTolMm / 25.4;
    const upperLimit = unitMode === UNIT_MODES.IN_TO_MM ? result.maxLimitMm : result.maxLimitMm / 25.4;
    const lowerLimit = unitMode === UNIT_MODES.IN_TO_MM ? result.minLimitMm : result.minLimitMm / 25.4;

    return {
      nominal: roundToDigits(nominal, digits),
      positiveTolerance: roundToDigits(positiveTolerance, digits),
      negativeTolerance: roundToDigits(negativeTolerance, digits),
      upperLimit: roundToDigits(upperLimit, digits),
      lowerLimit: roundToDigits(lowerLimit, digits),
    };
  }

  const max = unitMode === UNIT_MODES.IN_TO_MM ? result.maxMm : result.maxMm / 25.4;
  const min = unitMode === UNIT_MODES.IN_TO_MM ? result.minMm : result.minMm / 25.4;
  const range = unitMode === UNIT_MODES.IN_TO_MM ? result.rangeMm : result.rangeMm / 25.4;

  return {
    max: roundToDigits(max, digits),
    min: roundToDigits(min, digits),
    range: roundToDigits(range, digits),
  };
}

export function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function hasInvalidNumbers(values) {
  return values.some((value) => Number.isNaN(value));
}

function hasNegativeNumbers(values) {
  return values.some((value) => typeof value === 'number' && value < 0);
}

export function validateInputs(mode, tol, limits, language) {
  const messages = MESSAGES[language] || MESSAGES.en;

  if (mode === 'plus-minus') {
    const values = [toNumber(tol.positive), toNumber(tol.nominal), toNumber(tol.negative)];
    if (hasInvalidNumbers(values)) return messages.invalidNumbers;
    if (hasNegativeNumbers(values)) return messages.negativeValues;
    if (values[1] === null) return messages.missingNominal;
    return '';
  }

  const max = toNumber(limits.max);
  const min = toNumber(limits.min);
  if (hasInvalidNumbers([max, min])) return messages.invalidNumbers;
  if (hasNegativeNumbers([max, min])) return messages.negativeValues;
  if (max === null || min === null) return messages.missingLimits;
  if (max < min) return messages.maxLowerThanMin;
  return '';
}

export function buildCopyText(mode, result, units, digits, language = 'he') {
  const converted = convertResult(result, mode, units.mode, digits);
  if (!converted) return '';

  if (mode === 'plus-minus') {
    if (language === 'he') {
      return `Markulator\nמידה נומינלית: ${converted.nominal} ${units.output}\nסבולת חיובית: ${converted.positiveTolerance} ${units.output}\nסבולת שלילית: ${converted.negativeTolerance} ${units.output}\nגבול עליון: ${converted.upperLimit} ${units.output}\nגבול תחתון: ${converted.lowerLimit} ${units.output}`;
    }
    return `Markulator\nNominal: ${converted.nominal} ${units.output}\nPositive tolerance: ${converted.positiveTolerance} ${units.output}\nNegative tolerance: ${converted.negativeTolerance} ${units.output}\nUpper limit: ${converted.upperLimit} ${units.output}\nLower limit: ${converted.lowerLimit} ${units.output}`;
  }

  if (language === 'he') {
    return `Markulator\nמקסימום: ${converted.max} ${units.output}\nמינימום: ${converted.min} ${units.output}\nטווח: ${converted.range} ${units.output}`;
  }
  return `Markulator\nMaximum: ${converted.max} ${units.output}\nMinimum: ${converted.min} ${units.output}\nRange: ${converted.range} ${units.output}`;
}

export function buildShortCopyText(mode, result, units, digits, language = 'he') {
  const converted = convertResult(result, mode, units.mode, digits);
  if (!converted) return '';

  if (mode === 'plus-minus') {
    if (language === 'he') return `עליון ${converted.upperLimit} ${units.output} | תחתון ${converted.lowerLimit} ${units.output}`;
    return `Upper ${converted.upperLimit} ${units.output} | Lower ${converted.lowerLimit} ${units.output}`;
  }

  if (language === 'he') return `טווח ${converted.range} ${units.output}`;
  return `Range ${converted.range} ${units.output}`;
}