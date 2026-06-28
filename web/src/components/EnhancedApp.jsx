import { useEffect, useMemo, useRef, useState } from 'react';
import { calculateMaxMinTolerance, calculatePlusMinusTolerance } from '../markulator.js';
import logoSymbol from '../assets/logo-symbol.jpg';
import InputField from './InputField.jsx';
import ResultPanel from './ResultPanel.jsx';
import {
  UNIT_MODES,
  WEB_VERSION,
  buildCopyText,
  buildShortCopyText,
  convertValue,
  formatNumber,
  getUnits,
  toNumber,
  validateInputs,
} from './calcTools.js';

const emptyTol = { positive: '', nominal: '', negative: '' };
const emptyLimits = { max: '', min: '' };
const HISTORY_KEY = 'markulator-history-v1';

function buildConvertedResult(mode, tol, limits, unitMode) {
  if (unitMode === UNIT_MODES.IN_TO_MM) {
    if (mode === 'plus-minus') {
      return calculatePlusMinusTolerance(toNumber(tol.nominal), toNumber(tol.positive), toNumber(tol.negative));
    }
    return calculateMaxMinTolerance(toNumber(limits.max), toNumber(limits.min));
  }

  if (mode === 'plus-minus') {
    const nominalMm = convertValue(toNumber(tol.nominal), unitMode);
    const posTolMm = convertValue(toNumber(tol.positive), unitMode);
    const negTolMm = convertValue(toNumber(tol.negative), unitMode);
    return {
      nominalMm,
      posTolMm,
      negTolMm,
      maxLimitMm: nominalMm + posTolMm,
      minLimitMm: nominalMm - negTolMm,
    };
  }

  const maxMm = convertValue(toNumber(limits.max), unitMode);
  const minMm = convertValue(toNumber(limits.min), unitMode);
  return {
    maxMm,
    minMm,
    rangeMm: maxMm - minMm,
  };
}

export default function EnhancedApp() {
  const [mode, setMode] = useState('plus-minus');
  const [unitMode, setUnitMode] = useState(UNIT_MODES.IN_TO_MM);
  const [tol, setTol] = useState(emptyTol);
  const [limits, setLimits] = useState(emptyLimits);
  const [digits, setDigits] = useState(2);
  const [copyStatus, setCopyStatus] = useState('');
  const [history, setHistory] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resultSectionVisible, setResultSectionVisible] = useState(false);
  const inputSectionRef = useRef(null);
  const resultSectionRef = useRef(null);

  const units = useMemo(() => getUnits(unitMode), [unitMode]);
  const validation = useMemo(() => validateInputs(mode, tol, limits), [mode, tol, limits]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (Array.isArray(saved)) setHistory(saved.slice(0, 6));
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 6)));
    } catch {
      // Ignore storage errors.
    }
  }, [history]);

  useEffect(() => {
    document.body.classList.toggle('drawer-open', drawerOpen);
    return () => document.body.classList.remove('drawer-open');
  }, [drawerOpen]);

  useEffect(() => {
    const target = resultSectionRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setResultSectionVisible(entry.isIntersecting && entry.intersectionRatio >= 0.35),
      { threshold: [0, 0.35, 0.6] }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const result = useMemo(() => {
    if (!validation.ready || validation.errors.length) return null;
    return buildConvertedResult(mode, tol, limits, unitMode);
  }, [mode, tol, limits, validation, unitMode]);

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

  const currentText = useMemo(() => buildCopyText(mode, result, digits, units.outputLabel), [mode, result, digits, units.outputLabel]);
  const shortText = useMemo(() => buildShortCopyText(mode, result, digits, units.outputLabel), [mode, result, digits, units.outputLabel]);

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

  const scrollToInputs = () => {
    inputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const copyText = async (text, successMessage) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(successMessage);
    } catch {
      setCopyStatus('העתקה אוטומטית לא זמינה בדפדפן הזה');
    }
  };

  const shareResult = async () => {
    if (!result) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Markulator result', text: currentText });
        setCopyStatus('התוצאה שותפה');
      } catch {
        return;
      }
      return;
    }
    await copyText(currentText, 'שיתוף לא זמין - התוצאה הועתקה');
  };

  const saveHistory = () => {
    if (!result) return;
    const item = {
      id: Date.now(),
      mode,
      unitMode,
      unitLabel: units.outputLabel,
      text: shortText,
      fullText: currentText,
    };
    setHistory((items) => [item, ...items.filter((x) => x.text !== item.text)].slice(0, 6));
    setCopyStatus('התוצאה נשמרה בהיסטוריה');
  };

  const clearHistory = () => setHistory([]);

  const inputSuffix = units.input;
  const targetLabel = units.outputLabel;
  const plusPlaceholder = unitMode === UNIT_MODES.IN_TO_MM ? 'לדוגמה: 0.005' : 'לדוגמה: 0.13';
  const nominalPlaceholder = unitMode === UNIT_MODES.IN_TO_MM ? 'לדוגמה: 1.2500' : 'לדוגמה: 31.75';
  const minusPlaceholder = unitMode === UNIT_MODES.IN_TO_MM ? 'לדוגמה: 0.002' : 'לדוגמה: 0.05';
  const maxPlaceholder = unitMode === UNIT_MODES.IN_TO_MM ? 'לדוגמה: 1.255' : 'לדוגמה: 31.88';
  const minPlaceholder = unitMode === UNIT_MODES.IN_TO_MM ? 'לדוגמה: 1.248' : 'לדוגמה: 31.70';

  return (
    <main className="app-shell">
      <button className="app-menu-button" type="button" aria-label="פתח תפריט הגדרות" onClick={() => setDrawerOpen(true)}>
        <span></span><span></span><span></span>
      </button>

      {drawerOpen && <button className="drawer-backdrop" type="button" aria-label="סגור תפריט" onClick={() => setDrawerOpen(false)} />}

      <aside className={`settings-drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="drawer-header">
          <div><p className="section-label">הגדרות</p><h2>תפריט אפליקציה</h2></div>
          <button type="button" className="drawer-close" aria-label="סגור תפריט" onClick={() => setDrawerOpen(false)}>×</button>
        </div>

        <div className="drawer-section">
          <strong>כיוון המרה</strong>
          <small>בחרו באילו יחידות להזין ובאילו יחידות לקבל תוצאה.</small>
          <div className="unit-switch" aria-label="כיוון המרה">
            <button className={unitMode === UNIT_MODES.IN_TO_MM ? 'active' : ''} type="button" onClick={() => setUnitMode(UNIT_MODES.IN_TO_MM)}>inch → mm</button>
            <button className={unitMode === UNIT_MODES.MM_TO_IN ? 'active' : ''} type="button" onClick={() => setUnitMode(UNIT_MODES.MM_TO_IN)}>mm → inch</button>
          </div>
        </div>

        <div className="drawer-section">
          <label className="select-field settings-select">דיוק תוצאה<select value={digits} onChange={(e) => setDigits(Number(e.target.value))}><option value="2">2 ספרות</option><option value="3">3 ספרות</option><option value="4">4 ספרות</option></select></label>
        </div>

        <div className="drawer-section drawer-status">
          <span>{WEB_VERSION}</span>
          <span>{unitMode === UNIT_MODES.IN_TO_MM ? 'inch → mm' : 'mm → inch'}</span>
        </div>
      </aside>

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
        <p className="hero-copy">מחשבון סבולות להמרת מידות בין אינצ׳ים למילימטרים.</p>
        <details className="mobile-guide">
          <summary>איך זה עובד?</summary>
          <p>פתחו את תפריט הצד, הגדירו כיוון המרה ודיוק, הזינו ערכים וקבלו תוצאה.</p>
        </details>
        <div className="quick-guide">
          <article><span>01</span><strong>פתחו תפריט</strong><p>גלגל השיניים פותח את הגדרות האפליקציה.</p></article>
          <article><span>02</span><strong>הזינו סבולות</strong><p>המידה המרכזית והסטייה המותרת.</p></article>
          <article><span>03</span><strong>שמרו ושתפו</strong><p>העתקה, שיתוף והיסטוריית חישובים.</p></article>
        </div>
      </section>

      <section className="calculator-card">
        <header className="card-header">
          <div><p className="section-label">שלב ראשון</p><h2>בחרו את סוג החישוב</h2></div>
          <span className="conversion-pill">{unitMode === UNIT_MODES.IN_TO_MM ? 'inch → mm' : 'mm → inch'}</span>
        </header>

        <div className="mode-switch">
          <button className={mode === 'plus-minus' ? 'active' : ''} aria-pressed={mode === 'plus-minus'} onClick={() => switchMode('plus-minus')} type="button"><strong>סבולת ±</strong><span>Tol+ → Nominal → Tol-</span></button>
          <button className={mode === 'max-min' ? 'active' : ''} aria-pressed={mode === 'max-min'} onClick={() => switchMode('max-min')} type="button"><strong>מקסימום / מינימום</strong><span>גבול עליון וגבול תחתון</span></button>
        </div>

        <section className="form-section" ref={inputSectionRef}>
          <div className="section-title-row"><div><p className="section-label">שלב שני</p><h2>הזינו ערכים ב־{units.input}</h2></div></div>
          {mode === 'plus-minus' ? (
            <div key={`plus-minus-form-${unitMode}`} className="input-grid mode-content">
              <InputField label="סבולת חיובית" helper="כמה המידה יכולה לגדול." suffix={`+ ${inputSuffix}`} value={tol.positive} placeholder={plusPlaceholder} onChange={(positive) => setTol((x) => ({ ...x, positive }))} />
              <InputField label="מידה נומינלית" helper="המידה הבסיסית לפני הוספת הסבולת." suffix={inputSuffix} value={tol.nominal} placeholder={nominalPlaceholder} onChange={(nominal) => setTol((x) => ({ ...x, nominal }))} />
              <InputField label="סבולת שלילית" helper="כמה המידה יכולה לקטון." suffix={`- ${inputSuffix}`} value={tol.negative} placeholder={minusPlaceholder} onChange={(negative) => setTol((x) => ({ ...x, negative }))} />
            </div>
          ) : (
            <div key={`max-min-form-${unitMode}`} className="input-grid two mode-content">
              <InputField label="ערך מקסימלי" helper="המידה הגבוהה ביותר המותרת." suffix={inputSuffix} value={limits.max} placeholder={maxPlaceholder} onChange={(max) => setLimits((x) => ({ ...x, max }))} />
              <InputField label="ערך מינימלי" helper="המידה הנמוכה ביותר המותרת." suffix={inputSuffix} value={limits.min} placeholder={minPlaceholder} onChange={(min) => setLimits((x) => ({ ...x, min }))} />
            </div>
          )}

          <div className="form-clear-row form-action-row">
            <button className="clear-button form-save-button" onClick={saveHistory} type="button" disabled={!result}>שמירה</button>
            <button className="clear-button form-clear-button" onClick={clear} type="button"><span aria-hidden="true">🗑️</span> ניקוי</button>
          </div>

          {copyStatus && <div className="form-status">{copyStatus}</div>}
          {validation.errors.length > 0 && <div className="validation-box">{validation.errors.map((msg) => <p key={msg}>{msg}</p>)}</div>}
        </section>

        <section className="result-section" ref={resultSectionRef}>
          <div className="section-title-row"><div><p className="section-label">שלב שלישי</p><h2>תוצאה ב־{targetLabel}</h2></div></div>
          <div className="result-actions enhanced-actions">
            <button className="clear-button" type="button" onClick={() => copyText(shortText, 'התוצאה הקצרה הועתקה')} disabled={!result}>העתקה קצרה</button>
            <button className="clear-button" type="button" onClick={() => copyText(currentText, 'התוצאה המלאה הועתקה')} disabled={!result}>העתקה מלאה</button>
            <button className="clear-button" type="button" onClick={shareResult} disabled={!result}>שיתוף</button>
          </div>
          <div key={`result-${mode}-${unitMode}`} className="result-transition">
            <ResultPanel mode={mode} result={result} digits={digits} unitLabel={targetLabel} />
          </div>
          {result && (
            <div className="result-explanation">
              {mode === 'plus-minus'
                ? 'הגבול העליון מחושב לפי מידה נומינלית + סבולת חיובית. הגבול התחתון מחושב לפי מידה נומינלית - סבולת שלילית.'
                : 'הטווח הכולל מחושב לפי הערך המקסימלי פחות הערך המינימלי.'}
            </div>
          )}
        </section>

        <section className="history-section">
          <div className="section-title-row history-title"><div><p className="section-label">v0.9.1</p><h2>היסטוריית חישובים</h2></div>{history.length > 0 && <button className="clear-button" type="button" onClick={clearHistory}>נקה היסטוריה</button>}</div>
          {history.length === 0 ? (
            <p className="history-empty">עדיין אין חישובים שמורים. אחרי חישוב, לחצו על שמירה.</p>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <button key={item.id} type="button" onClick={() => copyText(item.fullText, 'חישוב מההיסטוריה הועתק')}>
                  <span>{item.unitMode === UNIT_MODES.IN_TO_MM ? 'inch → mm' : 'mm → inch'}</span>
                  <strong>{item.text}</strong>
                </button>
              ))}
            </div>
          )}
        </section>
      </section>

      {result && (
        <aside className={`mobile-result-bar ${resultSectionVisible ? 'input-mode' : ''}`} aria-live="polite">
          {resultSectionVisible ? (
            <div className="mobile-input-actions">
              <button type="button" onClick={saveHistory} disabled={!result}>שמירה</button>
              <button type="button" onClick={clear}>ניקוי</button>
              <button type="button" onClick={scrollToInputs}>ערוך ערכים</button>
            </div>
          ) : (
            <>
              <div className="mobile-result-items">
                {mobileResult.map(([label, value]) => (
                  <span key={label}><small>{label}</small><strong>{formatNumber(value, digits)} {targetLabel}</strong></span>
                ))}
              </div>
              <button type="button" onClick={() => copyText(shortText, 'התוצאה הועתקה')}>העתק</button>
            </>
          )}
        </aside>
      )}

      <footer className="app-footer">Markulator · {WEB_VERSION} · PWA-ready</footer>
    </main>
  );
}
