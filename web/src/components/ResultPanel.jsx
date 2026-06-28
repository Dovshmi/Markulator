import { formatNumber } from './calcTools.js';

const TEXT = {
  he: {
    empty: 'הזינו ערכים תקינים בשדות למעלה, והתוצאה תופיע כאן מיד.',
    positiveTolerance: 'סבולת חיובית',
    nominal: 'מידה נומינלית',
    negativeTolerance: 'סבולת שלילית',
    upperLimit: 'גבול עליון',
    lowerLimit: 'גבול תחתון',
    maxValue: 'ערך מקסימלי',
    minValue: 'ערך מינימלי',
    totalRange: 'טווח כולל',
    upperNote: 'נומינלי + סבולת חיובית',
    lowerNote: 'נומינלי - סבולת שלילית',
  },
  en: {
    empty: 'Enter valid values above and the result will appear here instantly.',
    positiveTolerance: 'Positive tolerance',
    nominal: 'Nominal value',
    negativeTolerance: 'Negative tolerance',
    upperLimit: 'Upper limit',
    lowerLimit: 'Lower limit',
    maxValue: 'Maximum value',
    minValue: 'Minimum value',
    totalRange: 'Total range',
    upperNote: 'Nominal + positive tolerance',
    lowerNote: 'Nominal - negative tolerance',
  },
};

function Box({ title, value, note, main, digits, unitLabel }) {
  return (
    <article className={main ? 'result-box main' : 'result-box'}>
      <span>{title}</span>
      <div className="result-number">
        <strong>{formatNumber(value, digits)}</strong>
        <em>{unitLabel}</em>
      </div>
      <p>{note}</p>
    </article>
  );
}

export default function ResultPanel({ mode, result, digits, unitLabel = 'mm', language = 'he' }) {
  const text = TEXT[language === 'en' ? 'en' : 'he'];

  if (!result) {
    return <div className="empty-result">{text.empty}</div>;
  }

  if (mode === 'plus-minus') {
    return (
      <div className="result-layout">
        <Box title={text.positiveTolerance} value={result.posTolMm} note="Tol+" digits={digits} unitLabel={unitLabel} />
        <Box main title={text.nominal} value={result.nominalMm} note="Nominal" digits={digits} unitLabel={unitLabel} />
        <Box title={text.negativeTolerance} value={result.negTolMm} note="Tol-" digits={digits} unitLabel={unitLabel} />
        <div className="limit-grid">
          <Box title={text.upperLimit} value={result.maxLimitMm} note={text.upperNote} digits={digits} unitLabel={unitLabel} />
          <Box title={text.lowerLimit} value={result.minLimitMm} note={text.lowerNote} digits={digits} unitLabel={unitLabel} />
        </div>
      </div>
    );
  }

  return (
    <div className="result-layout">
      <div className="limit-grid">
        <Box title={text.maxValue} value={result.maxMm} note="Max" digits={digits} unitLabel={unitLabel} />
        <Box title={text.minValue} value={result.minMm} note="Min" digits={digits} unitLabel={unitLabel} />
      </div>
      <Box main title={text.totalRange} value={result.rangeMm} note="Range" digits={digits} unitLabel={unitLabel} />
    </div>
  );
}
