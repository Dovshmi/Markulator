import { formatNumber } from './calcTools.js';

function Box({ title, value, note, main, digits }) {
  return (
    <article className={main ? 'result-box main' : 'result-box'}>
      <span>{title}</span>
      <div className="result-number">
        <strong>{formatNumber(value, digits)}</strong>
        <em>מ״מ</em>
      </div>
      <p>{note}</p>
    </article>
  );
}

export default function ResultPanel({ mode, result, digits }) {
  if (!result) {
    return <div className="empty-result">הזינו ערכים תקינים בשדות למעלה, והתוצאה תופיע כאן מיד.</div>;
  }

  if (mode === 'plus-minus') {
    return (
      <div className="result-layout">
        <Box title="סבולת חיובית" value={result.posTolMm} note="Tol+" digits={digits} />
        <Box main title="מידה נומינלית" value={result.nominalMm} note="Nominal" digits={digits} />
        <Box title="סבולת שלילית" value={result.negTolMm} note="Tol-" digits={digits} />
        <div className="limit-grid">
          <Box title="גבול עליון" value={result.maxLimitMm} note="נומינלי + סבולת חיובית" digits={digits} />
          <Box title="גבול תחתון" value={result.minLimitMm} note="נומינלי - סבולת שלילית" digits={digits} />
        </div>
      </div>
    );
  }

  return (
    <div className="result-layout">
      <div className="limit-grid">
        <Box title="ערך מקסימלי" value={result.maxMm} note="Max" digits={digits} />
        <Box title="ערך מינימלי" value={result.minMm} note="Min" digits={digits} />
      </div>
      <Box main title="טווח כולל" value={result.rangeMm} note="Range" digits={digits} />
    </div>
  );
}
