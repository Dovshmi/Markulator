import { UNIT_MODES, formatNumber } from './calcTools.js';

const FIELDS = {
  positive: {
    labelKey: 'positiveTolerance',
    helperKey: 'positiveHelper',
    className: 'upper',
    sign: '+',
    resultKey: 'posTolMm',
  },
  nominal: {
    labelKey: 'nominal',
    helperKey: 'nominalHelper',
    className: 'nominal',
    sign: '',
    resultKey: 'nominalMm',
  },
  negative: {
    labelKey: 'negativeTolerance',
    helperKey: 'negativeHelper',
    className: 'lower',
    sign: '-',
    resultKey: 'negTolMm',
  },
};

function getUnitName(unit) {
  return unit === 'in' ? 'Inches' : 'Millimeters';
}

function getInputSuffix(field, unit) {
  const sign = FIELDS[field].sign;
  return sign ? `${sign} ${unit}` : unit;
}

function getOutputValue(field, result, digits) {
  if (!result) return '—';
  return formatNumber(result[FIELDS[field].resultKey], digits);
}

export default function ToleranceBridge({ unitMode, tol, setTol, result, digits, text, placeholders }) {
  const sourceUnit = unitMode === UNIT_MODES.IN_TO_MM ? 'in' : 'mm';
  const targetUnit = unitMode === UNIT_MODES.IN_TO_MM ? 'mm' : 'in';

  const leftSide = { kind: 'source', unit: sourceUnit, title: getUnitName(sourceUnit) };
  const rightSide = { kind: 'target', unit: targetUnit, title: getUnitName(targetUnit) };

  const renderCell = (side, field, sideName) => {
    const config = FIELDS[field];
    const label = text[config.labelKey];
    const helper = text[config.helperKey];
    const cellClass = `tolerance-cell tolerance-cell-${config.className} tolerance-cell-${sideName} tolerance-cell-${side.kind}`;

    if (side.kind === 'source') {
      return (
        <label className={cellClass}>
          <span className="tolerance-cell-label">{label}</span>
          <small>{helper}</small>
          <div className="tolerance-value-frame tolerance-input-frame">
            <input
              type="number"
              inputMode="decimal"
              step="0.0001"
              value={tol[field]}
              placeholder={placeholders[field]}
              onFocus={(event) => event.target.select()}
              onChange={(event) => setTol((current) => ({ ...current, [field]: event.target.value }))}
            />
            <em>{getInputSuffix(field, side.unit)}</em>
          </div>
        </label>
      );
    }

    return (
      <div className={cellClass} aria-label={`${label} ${side.unit}`}>
        <span className="tolerance-cell-label">{label}</span>
        <small>{helper}</small>
        <div className="tolerance-value-frame tolerance-output-frame">
          <strong>{getOutputValue(field, result, digits)}</strong>
          <em>{side.unit}</em>
        </div>
      </div>
    );
  };

  return (
    <div key={`tolerance-bridge-${unitMode}`} className="tolerance-bridge mode-content" dir="ltr">
      <div className="tolerance-unit-label tolerance-unit-left">
        <span>{leftSide.title}</span>
        <strong>{leftSide.unit}</strong>
      </div>
      <div className="tolerance-unit-label tolerance-unit-right">
        <span>{rightSide.title}</span>
        <strong>{rightSide.unit}</strong>
      </div>

      {renderCell(leftSide, 'positive', 'left')}
      {renderCell(rightSide, 'positive', 'right')}

      {renderCell(leftSide, 'nominal', 'left')}
      <div className="tolerance-nominal-connector" aria-hidden="true"><span>↔</span></div>
      {renderCell(rightSide, 'nominal', 'right')}

      {renderCell(leftSide, 'negative', 'left')}
      {renderCell(rightSide, 'negative', 'right')}
    </div>
  );
}
