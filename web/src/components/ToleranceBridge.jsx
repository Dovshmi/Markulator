import { useEffect, useMemo, useRef, useState } from 'react';
import { UNIT_MODES, formatNumber } from './calcTools.js';

const EMPTY_VALUES = { positive: '', nominal: '', negative: '' };
const FIELD_ORDER = ['positive', 'nominal', 'negative'];
let lastGlobalPointerDownAt = 0;

const FIELDS = {
  positive: { labelKey: 'positiveTolerance', compactLabelKey: 'mobileUpper', sign: '+', resultKey: 'posTolMm' },
  nominal: { labelKey: 'nominal', compactLabelKey: 'mobileNominal', sign: '', resultKey: 'nominalMm' },
  negative: { labelKey: 'negativeTolerance', compactLabelKey: 'mobileLower', sign: '-', resultKey: 'negTolMm' },
};

function getUnitName(unit) {
  return unit === 'in' ? 'Inches' : 'Millimeters';
}

function getInputSuffix(field, unit) {
  const sign = FIELDS[field].sign;
  return sign ? `${sign} ${unit}` : unit;
}

function getOutputValue(field, result, digits) {
  if (!result) return '';
  return formatNumber(result[FIELDS[field].resultKey], digits);
}

function getLabel(text, field) {
  const config = FIELDS[field];
  return text[config.compactLabelKey] || text[config.labelKey];
}

function getIdleInputStyle(value, isMiddle) {
  if (value) return undefined;
  return { fontSize: isMiddle ? '1.12rem' : '0.94rem' };
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
    positive: convertToRightUnit(leftValues.positive, unitMode, digits),
    nominal: convertToRightUnit(leftValues.nominal, unitMode, digits),
    negative: convertToRightUnit(leftValues.negative, unitMode, digits),
  };
}

function buildRightValuesFromResult(result, fallbackValues, digits) {
  if (!result) return fallbackValues;
  return {
    positive: getOutputValue('positive', result, digits),
    nominal: getOutputValue('nominal', result, digits),
    negative: getOutputValue('negative', result, digits),
  };
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

function focusToleranceInput(input) {
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

  const nextFields = getFieldsAfterCurrent(field);

  for (const nextField of nextFields) {
    const input = bridge.querySelector(`input[data-tolerance-side="${side}"][data-tolerance-field="${nextField}"]`);
    if (input && input.value.trim() === '') return input;
  }

  return null;
}

function moveToNextField(event, side, field, phase = 'down') {
  if (event.key !== 'Enter') return;

  const bridge = event.currentTarget.closest('.tolerance-bridge');

  if (phase === 'up') {
    const lastKeyboardNavigation = Number(bridge?.dataset.toleranceLastKeyboardNavigation || 0);
    if (lastKeyboardNavigation && Date.now() - lastKeyboardNavigation < 450) {
      event.preventDefault();
      return;
    }
  }

  event.preventDefault();

  if (phase === 'down' && bridge) {
    bridge.dataset.toleranceLastKeyboardNavigation = String(Date.now());
  }

  const nextInput = findNextEmptyInput(bridge, side, field);

  if (nextInput) {
    focusToleranceInput(nextInput);
    return;
  }

  event.currentTarget.blur();
}

function handleInputBlur(event, side, field) {
  const bridge = event.currentTarget.closest('.tolerance-bridge');
  if (!bridge || typeof window === 'undefined' || typeof document === 'undefined') return;

  const blurStartedAt = Date.now();

  window.setTimeout(() => {
    const wasUserTap = blurStartedAt - lastGlobalPointerDownAt < 700;
    if (wasUserTap) return;

    const lastKeyboardNavigation = Number(bridge.dataset.toleranceLastKeyboardNavigation || 0);
    const wasHandledByKeyEvent = lastKeyboardNavigation && blurStartedAt - lastKeyboardNavigation < 700;
    if (wasHandledByKeyEvent) return;

    const activeElement = document.activeElement;
    const activeBridge = activeElement?.closest?.('.tolerance-bridge');
    const expectedInput = findNextEmptyInput(bridge, side, field);

    if (activeBridge !== bridge) {
      if (expectedInput) focusToleranceInput(expectedInput);
      return;
    }

    const isToleranceInput = activeElement?.matches?.('input[data-tolerance-side][data-tolerance-field]');
    if (!isToleranceInput) return;

    if (!expectedInput) {
      activeElement.blur();
      return;
    }

    if (activeElement !== expectedInput) {
      focusToleranceInput(expectedInput);
    }
  }, 60);
}

function ValueInput({ side, activeSide, onFocusSide, field, unit, value, onChange, placeholderLabel, hasNextEmptyField, isMiddle = false }) {
  return (
    <span className="tolerance-value-frame tolerance-input-frame">
      <input
        type="number"
        inputMode="decimal"
        enterKeyHint={hasNextEmptyField ? 'next' : 'done'}
        tabIndex={getTabIndex(activeSide, side, field)}
        step="0.0001"
        value={value}
        placeholder={placeholderLabel}
        style={getIdleInputStyle(value, isMiddle)}
        data-tolerance-side={side}
        data-tolerance-field={field}
        name={`tolerance-${side}-${field}`}
        onFocus={() => onFocusSide(side)}
        onPointerDown={() => onFocusSide(side)}
        onKeyDown={(event) => moveToNextField(event, side, field, 'down')}
        onKeyUp={(event) => moveToNextField(event, side, field, 'up')}
        onBlur={(event) => handleInputBlur(event, side, field)}
        onChange={(event) => onChange(field, event.currentTarget.value)}
      />
      <em>{getInputSuffix(field, unit)}</em>
    </span>
  );
}

export default function ToleranceBridge({ unitMode, tol, setTol, result, digits, text, onSwitchUnitMode }) {
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
  const fallbackRightValues = useMemo(() => buildRightValuesFromLeft(tol, unitMode, digits), [tol, unitMode, digits]);
  const calculatedRightValues = useMemo(() => buildRightValuesFromResult(result, fallbackRightValues, digits), [result, fallbackRightValues, digits]);
  const rightValues = editingSide === 'right' ? rightDraft : calculatedRightValues;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const markPointerDown = () => {
      lastGlobalPointerDownAt = Date.now();
    };

    window.addEventListener('pointerdown', markPointerDown, true);
    window.addEventListener('touchstart', markPointerDown, true);

    return () => {
      window.removeEventListener('pointerdown', markPointerDown, true);
      window.removeEventListener('touchstart', markPointerDown, true);
    };
  }, []);

  useEffect(() => () => {
    window.clearTimeout(conversionTimerRef.current);
    if (conversionFrameRef.current != null) window.cancelAnimationFrame?.(conversionFrameRef.current);
  }, []);

  useEffect(() => {
    if (previousUnitModeRef.current !== unitMode) {
      setTol(swapValuesRef.current);
      setEditingSide('left');
      setNavigationSide('left');
      setRightDraft(EMPTY_VALUES);
      previousUnitModeRef.current = unitMode;
      return;
    }

    swapValuesRef.current = editingSide === 'right' ? rightDraft : calculatedRightValues;
  }, [unitMode, editingSide, rightDraft, calculatedRightValues, setTol]);

  const updateSource = (field, value) => {
    setEditingSide('left');
    setNavigationSide('left');
    setTol((current) => ({ ...current, [field]: value }));
  };

  const updateTarget = (field, value) => {
    const nextRightValues = { ...(editingSide === 'right' ? rightDraft : calculatedRightValues), [field]: value };
    setEditingSide('right');
    setNavigationSide('right');
    setRightDraft(nextRightValues);
    setTol((current) => ({ ...current, [field]: convertToLeftUnit(value, unitMode) }));
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

  const renderMiniCard = (side, field, position) => {
    const isSource = side === 'source';
    const unit = isSource ? sourceUnit : targetUnit;
    const fullLabel = text[FIELDS[field].labelKey];
    const label = getLabel(text, field);
    const sideValues = isSource ? tol : rightValues;
    const value = sideValues[field];
    const onChange = isSource ? updateSource : updateTarget;
    const navSide = isSource ? 'left' : 'right';

    return (
      <label className={`tolerance-mini-card tolerance-${position} tolerance-${side}`} aria-label={`${fullLabel} ${unit}`}>
        <span className="tolerance-box-content">
          <ValueInput side={navSide} activeSide={navigationSide} onFocusSide={setNavigationSide} field={field} unit={unit} value={value || ''} onChange={onChange} placeholderLabel={label} hasNextEmptyField={hasEmptyFieldAfterCurrent(sideValues, field)} />
        </span>
      </label>
    );
  };

  const nominalLabel = getLabel(text, 'nominal');

  return (
    <section className={`tolerance-bridge mode-content ${conversionAnimating ? 'tolerance-conversion-animating' : ''}`} dir="ltr" aria-label="Tolerance calculator">
      <div className="tolerance-unit-title tolerance-unit-left"><span>{getUnitName(sourceUnit)}</span><b>{sourceUnit}</b></div>
      <button type="button" className="tolerance-swap-button" aria-label={text.conversionDirection} onClick={handleSwitchDirection}>⇄</button>
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
            <ValueInput side="left" activeSide={navigationSide} onFocusSide={setNavigationSide} field="nominal" unit={sourceUnit} value={tol.nominal || ''} onChange={updateSource} placeholderLabel={nominalLabel} hasNextEmptyField={hasEmptyFieldAfterCurrent(tol, 'nominal')} isMiddle />
          </label>
          <label className="tolerance-middle-panel tolerance-target" aria-label={`${text.nominal} ${targetUnit}`}>
            <ValueInput side="right" activeSide={navigationSide} onFocusSide={setNavigationSide} field="nominal" unit={targetUnit} value={rightValues.nominal || ''} onChange={updateTarget} placeholderLabel={nominalLabel} hasNextEmptyField={hasEmptyFieldAfterCurrent(rightValues, 'nominal')} isMiddle />
          </label>
        </div>
      </section>

      {renderMiniCard('source', 'negative', 'lower-left')}
      {renderMiniCard('target', 'negative', 'lower-right')}
    </section>
  );
}
