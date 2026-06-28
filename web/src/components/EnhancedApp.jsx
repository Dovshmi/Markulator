import { useMemo, useState } from 'react';
import { calculateMaxMinTolerance, calculatePlusMinusTolerance } from '../markulator.js';
import logoSymbol from '../assets/logo-symbol.jpg';
import InputField from './InputField.jsx';
import ResultPanel from './ResultPanel.jsx';
import { WEB_VERSION, buildCopyText, formatNumber, toNumber, validateInputs } from './calcTools.js';

const emptyTol = { positive: '', nominal: '', negative: '' };
const emptyLimits = { max: '', min: '' };

export default function EnhancedApp() {
  const [mode, setMode] = useState('plus-minus');
  const [tol, setTol] = useState(emptyTol);
  const [limits, setLimits] = useState(emptyLimits);
  const [digits, setDigits] = useState(2);
  const [copyStatus, setCopyStatus] = useState('');

  const validation = useMemo(() => validateInputs(mode, tol, limits), [mode, tol, limits]);

  const result = useMemo(() => {
    if (!validation.ready || validation.errors.length) return null;
    if (mode === 'plus-minus') {
      return calculatePlusMinusTolerance(toNumber(tol.nominal), toNumber(tol.positive), toNumber(tol.negative));
    }
    return calculateMaxMinTolerance(toNumber(limits.max), toNumber(limits.min));
  }, [mode, tol, limits, validation]);

  const mobileResult = useMemo(() => {
    if (!result) return [];
    if (mode === 'plus-minus') {
      return [
        ['נומינלי', result.nominalMm],
        ['עליון', result.maxLimitMm],
        ['תחתון', result.minLimitMm],
      ];
    }
    return [
      ['מקסימום', result.maxMm],
      ['מינימום', result.minMm],
      ['טווח', result.rangeMm],
    ];
  }, [mode, result]);

  const switchMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setCopyStatus('');
  };

  const clear = () => {
    if (mode === 'plus-minus') setTol(emptyTol);
    else setLimits(emptyLimits);
    setCopyStatus('');
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(buildCopyText(mode, result, digits));
      setCopyStatus('התוצאה הועתקה');
    } catch {
      setCopyStatus('העתקה אוטומטית לא זמינה בדפדפן הזה');
    }
  };

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="brand-row">
          <div className="logo-image-wrap" aria-label="Markulator symbol">
            <img src={logoSymbol} alt="Markulator symbol" className="logo-image" />
          </div>
          <div>
            <p className="eyebrow">{WEB_VERSION}</p>
            <h1>Markulator</h1>
          </div>
        </div>
        <p className="hero-copy">מחשבון סבולות להמרת מידות מאינצ׳ים למילימטרים.</p>
        <details className="mobile-guide">
          <summary>איך זה עובד?</summary>
          <p>בחרו סוג חישוב, הזינו ערכים באינץ׳ וקבלו תוצאה במילימטרים.</p>
        </details>
        <div className="quick-guide">
          <article><span>01</span><strong>סבולת חיובית</strong><p>כמה המידה יכולה לגדול.</p></article>
          <article><span>02</span><strong>מידה נומינלית</strong><p>המידה המרכזית של החלק.</p></article>
          <article><span>03</span><strong>סבולת שלילית</strong><p>כמה המידה יכולה לקטון.</p></article>
        </div>
      </section>

      <section className="calculator-card">
        <header className="card-header">
          <div><p className="section-label">שלב ראשון</p><h2>בחרו את סוג החישוב</h2></div>
          <span className="conversion-pill">1 אינץ׳ = 25.4 מ״מ</span>
        </header>

        <div className="mode-switch">
          <button className={mode === 'plus-minus' ? 'active' : ''} aria-pressed={mode === 'plus-minus'} onClick={() => switchMode('plus-minus')} type="button"><strong>סבולת ±</strong><span>Tol+ → Nominal → Tol-</span></button>
          <button className={mode === 'max-min' ? 'active' : ''} aria-pressed={mode === 'max-min'} onClick={() => switchMode('max-min')} type="button"><strong>מקסימום / מינימום</strong><span>גבול עליון וגבול תחתון</span></button>
        </div>

        <section className="form-section">
          <div className="section-title-row"><div><p className="section-label">שלב שני</p><h2>הזינו ערכים באינץ׳</h2></div></div>
          {mode === 'plus-minus' ? (
            <div key="plus-minus-form" className="input-grid mode-content">
              <InputField label="סבולת חיובית" helper="כמה המידה יכולה לגדול." suffix="+ in" value={tol.positive} placeholder="לדוגמה: 0.005" onChange={(positive) => setTol((x) => ({ ...x, positive }))} />
              <InputField label="מידה נומינלית" helper="המידה הבסיסית לפני הוספת הסבולת." suffix="in" value={tol.nominal} placeholder="לדוגמה: 1.2500" onChange={(nominal) => setTol((x) => ({ ...x, nominal }))} />
              <InputField label="סבולת שלילית" helper="כמה המידה יכולה לקטון." suffix="- in" value={tol.negative} placeholder="לדוגמה: 0.002" onChange={(negative) => setTol((x) => ({ ...x, negative }))} />
            </div>
          ) : (
            <div key="max-min-form" className="input-grid two mode-content">
              <InputField label="ערך מקסימלי" helper="המידה הגבוהה ביותר המותרת." suffix="in" value={limits.max} placeholder="לדוגמה: 1.255" onChange={(max) => setLimits((x) => ({ ...x, max }))} />
              <InputField label="ערך מינימלי" helper="המידה הנמוכה ביותר המותרת." suffix="in" value={limits.min} placeholder="לדוגמה: 1.248" onChange={(min) => setLimits((x) => ({ ...x, min }))} />
            </div>
          )}

          <div className="utility-row">
            <label className="select-field">דיוק תוצאה<select value={digits} onChange={(e) => setDigits(Number(e.target.value))}><option value="2">2 ספרות</option><option value="3">3 ספרות</option><option value="4">4 ספרות</option></select></label>
            <span className="version-pill">{WEB_VERSION}</span>
          </div>

          <div className="form-clear-row">
            <button className="clear-button form-clear-button" onClick={clear} type="button">
              <span aria-hidden="true">🗑️</span>
              ניקוי
            </button>
          </div>

          {validation.errors.length > 0 && <div className="validation-box">{validation.errors.map((msg) => <p key={msg}>{msg}</p>)}</div>}
        </section>

        <section className="result-section">
          <div className="section-title-row"><div><p className="section-label">שלב שלישי</p><h2>תוצאה במילימטרים</h2></div><div className="result-actions"><button className="clear-button" type="button" onClick={copyResult} disabled={!result}>העתקת תוצאה</button>{copyStatus && <span>{copyStatus}</span>}</div></div>
          <div key={`result-${mode}`} className="result-transition">
            <ResultPanel mode={mode} result={result} digits={digits} />
          </div>
        </section>
      </section>

      {result && (
        <aside className="mobile-result-bar" aria-live="polite">
          <div className="mobile-result-items">
            {mobileResult.map(([label, value]) => (
              <span key={label}><small>{label}</small><strong>{formatNumber(value, digits)} mm</strong></span>
            ))}
          </div>
          <button type="button" onClick={copyResult}>העתק</button>
        </aside>
      )}

      <footer className="app-footer">Markulator · {WEB_VERSION} · PWA-ready</footer>
    </main>
  );
}
