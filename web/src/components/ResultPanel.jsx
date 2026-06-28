import { formatNumber } from './calcTools.js';

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

export default function ResultPanel({ mode, result, digits, unitLabel = 'מ״מ' }) {
  if (!result) {
    return <div className="empty-result">הזינו ערכים תקינים בשדות למעלה, והתוצאה תופיע כאן מיד.</div>;
  }

  if (mode === 'plus-minus') {
    return (
      <div className="result-layout">
        <Box title="סבולת חיובית" value={result.posTolMm} note="Tol+" digits={digits} unitLabel={unitLabel} />
        <Box main title="מידה נומינלית" value={result.nominalMm} note="Nominal" digits={digits} unitLabel={unitLabel} />
        <Box title="סבולת שלילית" value={result.negTolMm} note="Tol-" digits={digits} unitLabel={unitLabel} />
        <div className="limit-grid">
          <Box title="גבול עליון" value={result.maxLimitMm} note="נומינלי + סבולת חיובית" digits={digits} unitLabel={unitLabel} />
          <Box title="גבול תחתון" value={result.minLimitMm} note="נומינלי - סבולת שלילית" digits={digits} unitLabel={unitLabel} />
        </div>
      </div>
    );
  }

  return (
    <div className="result-layout">
      <div className="limit-grid">
        <Box title="ערך מקסימלי" value={result.maxMm} note="Max" digits={digits} unitLabel={unitLabel} />
        <Box title="ערך מינימלי" value={result.minMm} note="Min" digits={digits} unitLabel={unitLabel} />
      </div>
      <Box main title="טווח כולל" value={result.rangeMm} note="Range" digits={digits} unitLabel={unitLabel} />
    </div>
  );
}
