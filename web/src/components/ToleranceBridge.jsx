import { UNIT_MODES, formatNumber } from './calcTools.js';

const FIELDS = {
  positive: {
    labelKey: 'positiveTolerance',
    compactLabelKey: 'mobileUpper',
    sign: '+',
    resultKey: 'posTolMm',
  },
  nominal: {
    labelKey: 'nominal',
    compactLabelKey: 'mobileNominal',
    sign: '',
    resultKey: 'nominalMm',
  },
  negative: {
    labelKey: 'negativeTolerance',
    compactLabelKey: 'mobileLower',
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

function getLabel(text, field) {
  const config = FIELDS[field];
  return text[config.compactLabelKey] || text[config.labelKey];
}

function SourceValue({ field, unit, tol, setTol, placeholderLabel }) {
  return (
    <span className="tolerance-value-frame tolerance-input-frame">
      <input
        type="number"
        inputMode="decimal"
        step="0.0001"
        value={tol[field]}
        placeholder={placeholderLabel}
        onFocus={(event) => event.target.select()}
        onChange={(event) => setTol((current) => ({ ...current, [field]: event.target.value }))}
      />
      <em>{getInputSuffix(field, unit)}</em>
    </span>
  );
}

function TargetValue({ field, unit, result, digits }) {
  return (
    <span className="tolerance-value-frame tolerance-output-frame">
      <strong>{getOutputValue(field, result, digits)}</strong>
      <em>{unit}</em>
    </span>
  );
}

export default function ToleranceBridge({ unitMode, tol, setTol, result, digits, text }) {
  const sourceUnit = unitMode === UNIT_MODES.IN_TO_MM ? 'in' : 'mm';
  const targetUnit = unitMode === UNIT_MODES.IN_TO_MM ? 'mm' : 'in';

  const renderMiniCard = (side, field, position) => {
    const isSource = side === 'source';
    const unit = isSource ? sourceUnit : targetUnit;
    const fullLabel = text[FIELDS[field].labelKey];
    const label = getLabel(text, field);

    const content = (
      <span className="tolerance-box-content">
        <span className="tolerance-field-label">{label}</span>
        {isSource ? (
          <SourceValue field={field} unit={unit} tol={tol} setTol={setTol} placeholderLabel={label} />
        ) : (
          <TargetValue field={field} unit={unit} result={result} digits={digits} />
        )}
      </span>
    );

    const className = `tolerance-mini-card tolerance-${position} tolerance-${side}`;
    if (isSource) {
      return <label className={className} aria-label={`${fullLabel} ${unit}`}>{content}</label>;
    }
    return <div className={className} aria-label={`${fullLabel} ${unit}`}>{content}</div>;
  };

  const nominalLabel = getLabel(text, 'nominal');

  return (
    <section key={`tolerance-bridge-${unitMode}`} className="tolerance-bridge mode-content" dir="ltr" aria-label="Tolerance calculator">
      <div className="tolerance-unit-title tolerance-unit-left"><span>{getUnitName(sourceUnit)}</span><b>{sourceUnit}</b></div>
      <div className="tolerance-unit-title tolerance-unit-right"><span>{getUnitName(targetUnit)}</span><b>{targetUnit}</b></div>

      {renderMiniCard('source', 'positive', 'upper-left')}
      {renderMiniCard('target', 'positive', 'upper-right')}

      <section className="tolerance-middle-shell" aria-label="Nominal bridge">
        <svg viewBox="0 0 1000 202" preserveAspectRatio="none" aria-hidden="true">
          <path className="tolerance-main-shape tolerance-desktop-shape" d="M24 18 H382 C432 18 442 64 500 64 C558 64 568 18 618 18 H976 Q996 18 996 42 V160 Q996 184 976 184 H618 C568 184 558 138 500 138 C442 138 432 184 382 184 H24 Q4 184 4 160 V42 Q4 18 24 18 Z" />
          <path className="tolerance-soft-line tolerance-desktop-shape" d="M54 52 H364 C424 52 438 84 500 84 C562 84 576 52 636 52 H946" />
          <path className="tolerance-soft-line tolerance-desktop-shape" d="M54 150 H364 C424 150 438 118 500 118 C562 118 576 150 636 150 H946" />
          <path className="tolerance-main-shape tolerance-mobile-shape" d="M24 20 H372 C426 20 438 56 500 56 C562 56 574 20 628 20 H976 Q996 20 996 43 V159 Q996 182 976 182 H628 C574 182 562 146 500 146 C438 146 426 182 372 182 H24 Q4 182 4 159 V43 Q4 20 24 20 Z" />
          <path className="tolerance-soft-line tolerance-mobile-shape" d="M54 50 H358 C420 50 436 76 500 76 C564 76 580 50 642 50 H946" />
          <path className="tolerance-soft-line tolerance-mobile-shape" d="M54 152 H358 C420 152 436 126 500 126 C564 126 580 152 642 152 H946" />
        </svg>

        <div className="tolerance-middle-content">
          <label className="tolerance-middle-panel tolerance-source" aria-label={`${text.nominal} ${sourceUnit}`}>
            <span className="tolerance-field-label">{nominalLabel}</span>
            <SourceValue field="nominal" unit={sourceUnit} tol={tol} setTol={setTol} placeholderLabel={nominalLabel} />
          </label>
          <div className="tolerance-middle-panel tolerance-target" aria-label={`${text.nominal} ${targetUnit}`}>
            <span className="tolerance-field-label">{nominalLabel}</span>
            <TargetValue field="nominal" unit={targetUnit} result={result} digits={digits} />
          </div>
        </div>
      </section>

      {renderMiniCard('source', 'negative', 'lower-left')}
      {renderMiniCard('target', 'negative', 'lower-right')}
    </section>
  );
}
