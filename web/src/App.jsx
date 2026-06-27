import { useMemo, useState } from 'react';
import {
  calculateMaxMinTolerance,
  calculatePlusMinusTolerance,
} from './markulator.js';

const initialPlusMinus = {
  nominal: '',
  positive: '',
  negative: '',
};

const initialMaxMin = {
  max: '',
  min: '',
};

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(2);
}

export default function App() {
  const [mode, setMode] = useState('plus-minus');
  const [plusMinus, setPlusMinus] = useState(initialPlusMinus);
  const [maxMin, setMaxMin] = useState(initialMaxMin);

  const plusMinusResult = useMemo(() => {
    if (!plusMinus.nominal && !plusMinus.positive && !plusMinus.negative) {
      return null;
    }
    return calculatePlusMinusTolerance(
      parseNumber(plusMinus.nominal),
      parseNumber(plusMinus.positive),
      parseNumber(plusMinus.negative)
    );
  }, [plusMinus]);

  const maxMinResult = useMemo(() => {
    if (!maxMin.max && !maxMin.min) {
      return null;
    }
    return calculateMaxMinTolerance(
      parseNumber(maxMin.max),
      parseNumber(maxMin.min)
    );
  }, [maxMin]);

  const activeResult = mode === 'plus-minus' ? plusMinusResult : maxMinResult;

  function clearCurrent() {
    if (mode === 'plus-minus') {
      setPlusMinus(initialPlusMinus);
    } else {
      setMaxMin(initialMaxMin);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="brand-row">
          <div className="logo-mark">M</div>
          <div>
            <p className="eyebrow">המרת אינץ׳ למ״מ</p>
            <h1>Markulator</h1>
          </div>
        </div>

        <p className="hero-copy">
          מחשבון סבולות נקי ומהיר להמרת מידות מאינצ׳ים למילימטרים, עם תוצאה ברורה
          לעבודה טכנית, ייצור, בדיקה ומדידה.
        </p>

        <div className="quick-guide">
          <article>
            <span>01</span>
            <strong>בחרו סוג חישוב</strong>
            <p>סבולת ± או ערכי מקסימום/מינימום ישירים.</p>
          </article>
          <article>
            <span>02</span>
            <strong>הזינו ערכים באינץ׳</strong>
            <p>המערכת מחשבת ומציגה תוצאה מידית.</p>
          </article>
          <article>
            <span>03</span>
            <strong>קראו תוצאה במ״מ</strong>
            <p>נומינלי, גבול עליון, גבול תחתון או טווח.</p>
          </article>
        </div>
      </section>

      <section className="calculator-card">
        <header className="card-header">
          <div>
            <p className="section-label">שלב ראשון</p>
            <h2>בחרו את סוג החישוב</h2>
          </div>
          <span className="conversion-pill">1 אינץ׳ = 25.4 מ״מ</span>
        </header>

        <div className="mode-switch" role="tablist" aria-label="סוג חישוב">
          <button
            className={mode === 'plus-minus' ? 'active' : ''}
            onClick={() => setMode('plus-minus')}
            type="button"
          >
            <strong>סבולת ±</strong>
            <span>מידה נומינלית + סטייה חיובית ושלילית</span>
          </button>
          <button
            className={mode === 'max-min' ? 'active' : ''}
            onClick={() => setMode('max-min')}
            type="button"
          >
            <strong>מקסימום / מינימום</strong>
            <span>כאשר יש כבר גבול עליון וגבול תחתון</span>
          </button>
        </div>

        <section className="form-section">
          <div className="section-title-row">
            <div>
              <p className="section-label">שלב שני</p>
              <h2>הזינו ערכים באינץ׳</h2>
            </div>
            <button className="clear-button" type="button" onClick={clearCurrent}>
              ניקוי
            </button>
          </div>

          {mode === 'plus-minus' ? (
            <div className="input-grid">
              <InputField
                label="מידה נומינלית"
                helper="המידה הבסיסית לפני הוספת הסבולת."
                suffix="in"
                value={plusMinus.nominal}
                placeholder="לדוגמה: 1.2500"
                onChange={(value) =>
                  setPlusMinus((current) => ({ ...current, nominal: value }))
                }
              />
              <InputField
                label="סבולת חיובית"
                helper="כמה המידה יכולה לגדול."
                suffix="+ in"
                value={plusMinus.positive}
                placeholder="לדוגמה: 0.005"
                onChange={(value) =>
                  setPlusMinus((current) => ({ ...current, positive: value }))
                }
              />
              <InputField
                label="סבולת שלילית"
                helper="כמה המידה יכולה לקטון."
                suffix="- in"
                value={plusMinus.negative}
                placeholder="לדוגמה: 0.002"
                onChange={(value) =>
                  setPlusMinus((current) => ({ ...current, negative: value }))
                }
              />
            </div>
          ) : (
            <div className="input-grid two">
              <InputField
                label="ערך מקסימלי"
                helper="המידה הגבוהה ביותר המותרת באינץ׳."
                suffix="in"
                value={maxMin.max}
                placeholder="לדוגמה: 1.255"
                onChange={(value) =>
                  setMaxMin((current) => ({ ...current, max: value }))
                }
              />
              <InputField
                label="ערך מינימלי"
                helper="המידה הנמוכה ביותר המותרת באינץ׳."
                suffix="in"
                value={maxMin.min}
                placeholder="לדוגמה: 1.248"
                onChange={(value) =>
                  setMaxMin((current) => ({ ...current, min: value }))
                }
              />
            </div>
          )}
        </section>

        <section className="result-section">
          <div className="section-title-row">
            <div>
              <p className="section-label">שלב שלישי</p>
              <h2>תוצאה במילימטרים</h2>
            </div>
          </div>
          <ResultPanel mode={mode} result={activeResult} />
        </section>
      </section>
    </main>
  );
}

function InputField({ label, helper, suffix, value, placeholder, onChange }) {
  return (
    <label className="input-field">
      <span className="input-label">{label}</span>
      <small>{helper}</small>
      <div className="input-frame">
        <input
          type="number"
          inputMode="decimal"
          step="0.0001"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <em>{suffix}</em>
      </div>
    </label>
  );
}

function ResultPanel({ mode, result }) {
  if (!result) {
    return (
      <div className="empty-result">
        הזינו ערכים בשדות למעלה, והתוצאה במילימטרים תופיע כאן מיד.
      </div>
    );
  }
  if (mode === 'plus-minus') {
    return (
      <div className="result-layout">
        <ResultBox
          tone="main"
          title="מידה נומינלית"
          value={result.nominalMm}
          description="המידה הבסיסית לאחר המרה למילימטרים."
        />
        <div className="limit-grid">
          <ResultBox
            title="גבול עליון"
            value={result.maxLimitMm}
            description="נומינלי + סבולת חיובית."
          />
          <ResultBox
            title="גבול תחתון"
            value={result.minLimitMm}
            description="נומינלי - סבולת שלילית."
          />
        </div>
        <div className="tolerance-strip">
          <MiniResult label="סבולת חיובית" value={result.posTolMm} />
          <MiniResult label="סבולת שלילית" value={result.negTolMm} />
        </div>
      </div>
    );
  }
  return (
    <div className="result-layout">
      <div className="limit-grid">
        <ResultBox
          title="ערך מקסימלי"
          value={result.maxMm}
          description="הערך המקסימלי לאחר המרה למילימטרים."
        />
        <ResultBox
          title="ערך מינימלי"
          value={result.minMm}
          description="הערך המינימלי לאחר המרה למילימטרים."
        />
      </div>
      <ResultBox
        tone="main"
        title="טווח כולל"
        value={result.rangeMm}
        description="ההפרש בין הערך המקסימלי לערך המינימלי."
      />
    </div>
  );
}

function ResultBox({ title, value, description, tone = 'normal' }) {
  return (
    <article className={tone === 'main' ? 'result-box main' : 'result-box'}>
      <span>{title}</span>
      <div className="result-number">
        <strong>{formatNumber(value)}</strong>
        <em>מ״מ</em>
      </div>
      <p>{description}</p>
    </article>
  );
}

function MiniResult({ label, value }) {
  return (
    <div className="mini-result">
      <span>{label}</span>
      <strong>{formatNumber(value)} מ״מ</strong>
    </div>
  );
}
