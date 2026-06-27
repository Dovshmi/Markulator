import { useMemo, useState } from 'react';
import { calculateMaxMinTolerance, calculatePlusMinusTolerance } from './markulator.js';
import logoSymbol from './logoSymbol.js';

const emptyTol = { positive: '', nominal: '', negative: '' };
const emptyLimits = { max: '', min: '' };
const n = (v) => (v === '' ? 0 : Number(v));
const f = (v) => (v == null || Number.isNaN(v) ? '—' : v.toFixed(2));

export default function App() {
  const [mode, setMode] = useState('plus-minus');
  const [tol, setTol] = useState(emptyTol);
  const [limits, setLimits] = useState(emptyLimits);

  const result = useMemo(() => {
    if (mode === 'plus-minus') {
      if (!tol.positive && !tol.nominal && !tol.negative) return null;
      return calculatePlusMinusTolerance(n(tol.nominal), n(tol.positive), n(tol.negative));
    }
    if (!limits.max && !limits.min) return null;
    return calculateMaxMinTolerance(n(limits.max), n(limits.min));
  }, [mode, tol, limits]);

  const clear = () => {
    if (mode === 'plus-minus') setTol(emptyTol);
    else setLimits(emptyLimits);
  };

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="brand-row">
          <div className="logo-image-wrap" aria-label="Markulator symbol">
            <img src={logoSymbol} alt="Markulator symbol" className="logo-image" />
          </div>
          <div>
            <p className="eyebrow">המרת אינץ׳ למ״מ</p>
            <h1>Markulator</h1>
          </div>
        </div>
        <p className="hero-copy">מחשבון סבולות להמרת מידות מאינצ׳ים למילימטרים.</p>
        <div className="quick-guide">
          <article><span>01</span><strong>סבולת חיובית</strong><p>הערך העליון של הטולרנס.</p></article>
          <article><span>02</span><strong>מידה נומינלית</strong><p>המידה המרכזית של החלק.</p></article>
          <article><span>03</span><strong>סבולת שלילית</strong><p>הערך התחתון של הטולרנס.</p></article>
        </div>
      </section>

      <section className="calculator-card">
        <header className="card-header">
          <div><p className="section-label">שלב ראשון</p><h2>בחרו את סוג החישוב</h2></div>
          <span className="conversion-pill">1 אינץ׳ = 25.4 מ״מ</span>
        </header>

        <div className="mode-switch">
          <button className={mode === 'plus-minus' ? 'active' : ''} onClick={() => setMode('plus-minus')} type="button"><strong>סבולת ±</strong><span>Tol+ → Nominal → Tol-</span></button>
          <button className={mode === 'max-min' ? 'active' : ''} onClick={() => setMode('max-min')} type="button"><strong>מקסימום / מינימום</strong><span>גבול עליון וגבול תחתון</span></button>
        </div>

        <section className="form-section">
          <div className="section-title-row"><div><p className="section-label">שלב שני</p><h2>הזינו ערכים באינץ׳</h2></div><button className="clear-button" onClick={clear} type="button">ניקוי</button></div>
          {mode === 'plus-minus' ? (
            <div className="input-grid">
              <Field label="סבולת חיובית" helper="כמה המידה יכולה לגדול." suffix="+ in" value={tol.positive} placeholder="לדוגמה: 0.005" onChange={(positive) => setTol((x) => ({ ...x, positive }))} />
              <Field label="מידה נומינלית" helper="המידה הבסיסית לפני הוספת הסבולת." suffix="in" value={tol.nominal} placeholder="לדוגמה: 1.2500" onChange={(nominal) => setTol((x) => ({ ...x, nominal }))} />
              <Field label="סבולת שלילית" helper="כמה המידה יכולה לקטון." suffix="- in" value={tol.negative} placeholder="לדוגמה: 0.002" onChange={(negative) => setTol((x) => ({ ...x, negative }))} />
            </div>
          ) : (
            <div className="input-grid two">
              <Field label="ערך מקסימלי" helper="המידה הגבוהה ביותר המותרת." suffix="in" value={limits.max} placeholder="לדוגמה: 1.255" onChange={(max) => setLimits((x) => ({ ...x, max }))} />
              <Field label="ערך מינימלי" helper="המידה הנמוכה ביותר המותרת." suffix="in" value={limits.min} placeholder="לדוגמה: 1.248" onChange={(min) => setLimits((x) => ({ ...x, min }))} />
            </div>
          )}
        </section>

        <section className="result-section">
          <div className="section-title-row"><div><p className="section-label">שלב שלישי</p><h2>תוצאה במילימטרים</h2></div></div>
          <Results mode={mode} result={result} />
        </section>
      </section>
    </main>
  );
}

function Field({ label, helper, suffix, value, placeholder, onChange }) {
  return <label className="input-field"><span className="input-label">{label}</span><small>{helper}</small><div className="input-frame"><input type="number" inputMode="decimal" step="0.0001" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /><em>{suffix}</em></div></label>;
}

function Box({ title, value, note, main }) {
  return <article className={main ? 'result-box main' : 'result-box'}><span>{title}</span><div className="result-number"><strong>{f(value)}</strong><em>מ״מ</em></div><p>{note}</p></article>;
}

function Results({ mode, result }) {
  if (!result) return <div className="empty-result">הזינו ערכים בשדות למעלה, והתוצאה תופיע כאן מיד.</div>;
  if (mode === 'plus-minus') return <div className="result-layout"><Box title="סבולת חיובית" value={result.posTolMm} note="Tol+" /><Box main title="מידה נומינלית" value={result.nominalMm} note="Nominal" /><Box title="סבולת שלילית" value={result.negTolMm} note="Tol-" /><div className="limit-grid"><Box title="גבול עליון" value={result.maxLimitMm} note="נומינלי + סבולת חיובית" /><Box title="גבול תחתון" value={result.minLimitMm} note="נומינלי - סבולת שלילית" /></div></div>;
  return <div className="result-layout"><div className="limit-grid"><Box title="ערך מקסימלי" value={result.maxMm} note="Max" /><Box title="ערך מינימלי" value={result.minMm} note="Min" /></div><Box main title="טווח כולל" value={result.rangeMm} note="Range" /></div>;
}
