import { UNIT_MODES } from './calcTools.js';

const FIELDS = {
  positive: { labelKey: 'positiveTolerance', compactLabelKey: 'mobileUpper', sign: '+' },
  nominal: { labelKey: 'nominal', compactLabelKey: 'mobileNominal', sign: '' },
  negative: { labelKey: 'negativeTolerance', compactLabelKey: 'mobileLower', sign: '-' },
};

function getUnitName(unit) {
  return unit === 'in' ? 'Inches' : 'Millimeters';
}

function getInputSuffix(field, unit) {
  const sign = FIELDS[field].sign;
  return sign ? `${sign} ${unit}` : unit;
}

function getLabel(text, field) {
  const config = FIELDS[field];
  return text[config.compactLabelKey] || text[config.labelKey];
}

function getIdleInputStyle(value, isMiddle) {
  if (value) return undefined;
  return { fontSize: isMiddle ? '1.12rem' : '0.94rem' };
}

function ValueInput({ field, unit, value, onChange, placeholderLabel, isMiddle = false }) {
  return (
    <span className="tolerance-value-frame tolerance-input-frame">
      <input
        type="number"
        inputMode="decimal"
        step="0.0001"
        value={value}
        placeholder={placeholderLabel}
        style={getIdleInputStyle(value, isMiddle)}
        onChange={(event) => onChange(field, event.currentTarget.value)}
      />
      <em>{getInputSuffix(field, unit)}</em>
    </span>
  );
}

export default function ToleranceBridge({ unitMode, leftValues, rightValues, onSideChange, text }) {
  const leftUnit = unitMode === UNIT_MODES.IN_TO_MM ? 'in' : 'mm';
  const rightUnit = unitMode === UNIT_MODES.IN_TO_MM ? 'mm' : 'in';

  const renderMiniCard = (side, field, position) => {
    const isLeft = side === 'left';
    const unit = isLeft ? leftUnit : rightUnit;
    const values = isLeft ? leftValues : rightValues;
    const fullLabel = text[FIELDS[field].labelKey];
    const label = getLabel(text, field);
    const sideClass = isLeft ? 'source' : 'target';

    return (
      <label className={`tolerance-mini-card tolerance-${position} tolerance-${sideClass}`} aria-label={`${fullLabel} ${unit}`}>
        <span className="tolerance-box-content">
          <ValueInput
            field={field}
            unit={unit}
            value={values[field] || ''}
            onChange={(changedField, value) => onSideChange(side, changedField, value)}
            placeholderLabel={label}
          />
        </span>
      </label>
    );
  };

  const nominalLabel = getLabel(text, 'nominal');

  return (
    <section key={`tolerance-bridge-${unitMode}`} className="tolerance-bridge mode-content" dir="ltr" aria-label="Tolerance calculator">
      <div className="tolerance-unit-title tolerance-unit-left"><span>{getUnitName(leftUnit)}</span><b>{leftUnit}</b></div>
      <div className="tolerance-unit-title tolerance-unit-right"><span>{getUnitName(rightUnit)}</span><b>{rightUnit}</b></div>

      {renderMiniCard('left', 'positive', 'upper-left')}
      {renderMiniCard('right', 'positive', 'upper-right')}

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
          <label className="tolerance-middle-panel tolerance-source" aria-label={`${text.nominal} ${leftUnit}`}>
            <ValueInput field="nominal" unit={leftUnit} value={leftValues.nominal || ''} onChange={(field, value) => onSideChange('left', field, value)} placeholderLabel={nominalLabel} isMiddle />
          </label>
          <label className="tolerance-middle-panel tolerance-target" aria-label={`${text.nominal} ${rightUnit}`}>
            <ValueInput field="nominal" unit={rightUnit} value={rightValues.nominal || ''} onChange={(field, value) => onSideChange('right', field, value)} placeholderLabel={nominalLabel} isMiddle />
          </label>
        </div>
      </section>

      {renderMiniCard('left', 'negative', 'lower-left')}
      {renderMiniCard('right', 'negative', 'lower-right')}
    </section>
  );
}
