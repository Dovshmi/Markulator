import { useEffect, useMemo, useRef, useState } from 'react';
import { UNIT_MODES, formatNumber } from './calcTools.js';

const EMPTY_VALUES = { max: '', min: '' };
const FIELD_ORDER = ['max', 'min'];

const FIELDS = {
  max: { labelKey: 'maxValue', compactLabelKey: 'mobileMax', resultKey: 'maxMm' },
  min: { labelKey: 'minValue', compactLabelKey: 'mobileMin', resultKey: 'minMm' },
};

function getUnitName(unit) {
  return unit === 'in' ? 'Inches' : 'Millimeters';
}

function convertToLeftUnit(value, unitMode) {
  if (value === '' || value == null) return '';
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return String(unitMode === UNIT_MODES.IN_TO_MM ? number / 25.4 : number * 25.4);
}

function convertToRightUnit(value, unitMode, digits) {
  if (value === '' || value == null) return '';
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  const converted = unitMode === UNIT_MODES.IN_TO_MM ? number * 25.4 : number / 25.4;
  return formatNumber(converted, digits);
}

function buildRightValuesFromLeft(leftValues, unitMode, digits) {
  return {
    max: convertToRightUnit(leftValues.max, unitMode, digits),
    min: convertToRightUnit(leftValues.min, unitMode, digits),
  };
}

function buildRightValuesFromResult(result, fallbackValues, digits) {
  if (!result) return fallbackValues;
  return {
    max: formatNumber(result.maxMm, digits),
    min: formatNumber(result.minMm, digits),
  };
}

function getLabel(text, field) {
  const config = FIELDS[field];
  return text[config.compactLabelKey] || text[config.labelKey];
}

function getTabIndex(activeSide, side, field) {
  if (activeSide !== side) return -1;
  return FIELD_ORDER.indexOf(field) + 1;
}

function getFieldsAfterCurrent(field) {
  const currentIndex = FIELD_ORDER.indexOf(field);
  if (currentIndex < 0) return FIELD_ORDER;
  return [...FIELD_ORDER.slice(currentIndex + 1), ...FIELD_ORDER.slice(0, currentIndex)];
}

function hasEmptyFieldAfterCurrent(values, field) {
  return getFieldsAfterCurrent(field).some((nextField) => String(values[nextField] || '').trim() === '');
}

function focusLimitInput(input) {
  if (!input) return;
  try {
    input.focus({ preventScroll: true });
  } catch {
    input.focus();
  }
  input.select?.();
}

function findNextEmptyInput(bridge, side, field) {
  if (!bridge) return null;
  for (const nextField of getFieldsAfterCurrent(field)) {
    const input = bridge.querySelector(`input[data-limit-side="${side}"][data-limit-field="${nextField}"]`);
    if (input && input.value.trim() === '') return input;
  }
  return null;
}

function moveToNextField(event, side, field) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const bridge = event.currentTarget.closest('.limit-bridge');
  const nextInput = findNextEmptyInput(bridge, side, field);
  if (nextInput) {
    focusLimitInput(nextInput);
    return;
  }
  event.currentTarget.blur();
}

function LimitInput({ side, activeSide, onFocusSide, field, unit, value, onChange, placeholder, hasNextEmptyField }) {
  return (
    <span className="limit-value-frame">
      <input
        type="number"
        inputMode="decimal"
        enterKeyHint={hasNextEmptyField ? 'next' : 'done'}
        tabIndex={getTabIndex(activeSide, side, field)}
        step="0.0001"
        value={value}
        placeholder={placeholder}
        data-limit-side={side}
        data-limit-field={field}
        name={`limit-${side}-${field}`}
        onFocus={() => onFocusSide(side)}
        onPointerDown={() => onFocusSide(side)}
        onKeyDown={(event) => moveToNextField(event, side, field)}
        onChange={(event) => onChange(field, event.currentTarget.value)}
      />
      <em>{unit}</em>
    </span>
  );
}

export default function LimitBridge({ unitMode, limits, setLimits, result, digits, text, onSwitchUnitMode }) {
  const [editingSide, setEditingSide] = useState('left');
  const [navigationSide, setNavigationSide] = useState('left');
  const [rightDraft, setRightDraft] = useState(EMPTY_VALUES);
  const [conversionAnimating, setConversionAnimating] = useState(false);
  const previousUnitModeRef = useRef(unitMode);
  const swapValuesRef = useRef(EMPTY_VALUES);
  const conversionTimerRef = useRef(null);
  const conversionFrameRef = useRef(null);

  const sourceUnit = unitMode === UNIT_MODES.IN_TO_MM ? 'in' : 'mm';
  const targetUnit = unitMode === UNIT_MODES.IN_TO_MM ? 'mm' : 'in';
  const fallbackRightValues = useMemo(() => buildRightValuesFromLeft(limits, unitMode, digits), [limits, unitMode, digits]);
  const calculatedRightValues = useMemo(() => buildRightValuesFromResult(result, fallbackRightValues, digits), [result, fallbackRightValues, digits]);
  const rightValues = editingSide === 'right' ? rightDraft : calculatedRightValues;

  useEffect(() => () => {
    window.clearTimeout(conversionTimerRef.current);
    if (conversionFrameRef.current != null) window.cancelAnimationFrame?.(conversionFrameRef.current);
  }, []);

  useEffect(() => {
    if (previousUnitModeRef.current !== unitMode) {
      setLimits(swapValuesRef.current);
      setEditingSide('left');
      setNavigationSide('left');
      setRightDraft(EMPTY_VALUES);
      previousUnitModeRef.current = unitMode;
      return;
    }

    swapValuesRef.current = editingSide === 'right' ? rightDraft : calculatedRightValues;
  }, [unitMode, editingSide, rightDraft, calculatedRightValues, setLimits]);

  const updateSource = (field, value) => {
    setEditingSide('left');
    setNavigationSide('left');
    setLimits((current) => ({ ...current, [field]: value }));
  };

  const updateTarget = (field, value) => {
    const nextRightValues = { ...(editingSide === 'right' ? rightDraft : calculatedRightValues), [field]: value };
    setEditingSide('right');
    setNavigationSide('right');
    setRightDraft(nextRightValues);
    setLimits((current) => ({ ...current, [field]: convertToLeftUnit(value, unitMode) }));
  };

  const handleSwitchDirection = () => {
    setConversionAnimating(false);
    window.clearTimeout(conversionTimerRef.current);
    if (conversionFrameRef.current != null) window.cancelAnimationFrame?.(conversionFrameRef.current);

    const startSwapAnimation = () => setConversionAnimating(true);
    if (window.requestAnimationFrame) conversionFrameRef.current = window.requestAnimationFrame(startSwapAnimation);
    else startSwapAnimation();

    conversionTimerRef.current = window.setTimeout(() => setConversionAnimating(false), 760);
    onSwitchUnitMode?.();
  };

  const renderField = (side, field) => {
    const isSource = side === 'source';
    const unit = isSource ? sourceUnit : targetUnit;
    const values = isSource ? limits : rightValues;
    const navSide = isSource ? 'left' : 'right';
    const onChange = isSource ? updateSource : updateTarget;
    const label = getLabel(text, field);

    return (
      <label className={`limit-row-card limit-${field} limit-${side}`} aria-label={`${text[FIELDS[field].labelKey]} ${unit}`}>
        <LimitInput side={navSide} activeSide={navigationSide} onFocusSide={setNavigationSide} field={field} unit={unit} value={values[field] || ''} onChange={onChange} placeholder={label} hasNextEmptyField={hasEmptyFieldAfterCurrent(values, field)} />
      </label>
    );
  };

  return (
    <section className={`limit-bridge mode-content ${conversionAnimating ? 'limit-conversion-animating' : ''}`} dir="ltr" aria-label="Maximum minimum calculator">
      <div className="limit-unit-title limit-unit-left"><span>{getUnitName(sourceUnit)}</span><b>{sourceUnit}</b></div>
      <button type="button" className="limit-swap-button tolerance-swap-button" aria-label={text.conversionDirection} onClick={handleSwitchDirection}>⇄</button>
      <div className="limit-unit-title limit-unit-right"><span>{getUnitName(targetUnit)}</span><b>{targetUnit}</b></div>

      <section className="limit-bridge-shell" aria-label={text.maxMin}>
        <svg viewBox="0 0 1000 244" preserveAspectRatio="none" aria-hidden="true">
          <path className="limit-main-shape" d="M28 18 H382 C432 18 444 58 500 58 C556 58 568 18 618 18 H972 Q996 18 996 42 V202 Q996 226 972 226 H618 C568 226 556 186 500 186 C444 186 432 226 382 226 H28 Q4 226 4 202 V42 Q4 18 28 18 Z" />
          <path className="limit-soft-line" d="M58 76 H360 C424 76 438 102 500 102 C562 102 576 76 640 76 H942" />
          <path className="limit-soft-line" d="M58 168 H360 C424 168 438 142 500 142 C562 142 576 168 640 168 H942" />
        </svg>

        <div className="limit-bridge-content">
          <div className="limit-side-panel limit-source-panel">
            {renderField('source', 'max')}
            {renderField('source', 'min')}
          </div>

          <div className="limit-center-divider" aria-hidden="true"><span>MAX</span><span>MIN</span></div>

          <div className="limit-side-panel limit-target-panel">
            {renderField('target', 'max')}
            {renderField('target', 'min')}
          </div>
        </div>
      </section>
    </section>
  );
}
