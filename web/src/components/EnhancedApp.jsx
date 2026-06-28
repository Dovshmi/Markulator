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
const LANGUAGE_KEY = 'markulator-language-v1';
const THEME_KEY = 'markulator-theme-v1';

const TEXT = {
  he: {
    appDescription: 'מחשבון סבולות להמרת מידות בין אינצ׳ים למילימטרים.',
    settings: 'הגדרות',
    appMenu: 'תפריט אפליקציה',
    closeMenu: 'סגור תפריט',
    openSettings: 'פתח תפריט הגדרות',
    language: 'שפה',
    languageHelp: 'בחרו את שפת הממשק. הבחירה נשמרת בדפדפן.',
    hebrew: 'עברית',
    english: 'English',
    theme: 'ערכת צבעים',
    themeHelp: 'בחרו מצב בהיר, כהה או אוטומטי לפי המכשיר.',
    autoTheme: 'אוטומטי',
    lightTheme: 'בהיר',
    darkTheme: 'כהה',
    conversionDirection: 'כיוון המרה',
    conversionHelp: 'בחרו באילו יחידות להזין ובאילו יחידות לקבל תוצאה.',
    resultPrecision: 'דיוק תוצאה',
    digits2: '2 ספרות',
    digits3: '3 ספרות',
    digits4: '4 ספרות',
    step1: 'שלב ראשון',
    chooseCalcType: 'בחרו את סוג החישוב',
    plusMinus: 'סבולת ±',
    plusMinusHint: 'סבולת+ • נומינלי • סבולת-',
    maxMin: 'מקסימום / מינימום',
    maxMinHint: 'גבול עליון וגבול תחתון',
    step2: 'שלב שני',
    enterValues: 'הזינו ערכים ב־',
    positiveTolerance: 'סבולת חיובית',
    positiveHelper: 'כמה המידה יכולה לגדול.',
    nominal: 'מידה נומינלית',
    nominalHelper: 'המידה הבסיסית לפני הוספת הסבולת.',
    negativeTolerance: 'סבולת שלילית',
    negativeHelper: 'כמה המידה יכולה לקטון.',
    maxValue: 'ערך מקסימלי',
    maxHelper: 'המידה הגבוהה ביותר המותרת.',
    minValue: 'ערך מינימלי',
    minHelper: 'המידה הנמוכה ביותר המותרת.',
    save: 'שמירה',
    clear: 'ניקוי',
    step3: 'שלב שלישי',
    resultIn: 'תוצאה ב־',
    shortCopy: 'העתקה קצרה',
    fullCopy: 'העתקה מלאה',
    share: 'שיתוף',
    shortCopied: 'התוצאה הקצרה הועתקה',
    fullCopied: 'התוצאה המלאה הועתקה',
    shared: 'התוצאה שותפה',
    shareFallback: 'שיתוף לא זמין - התוצאה הועתקה',
    copied: 'התוצאה הועתקה',
    autoCopyUnavailable: 'העתקה אוטומטית לא זמינה בדפדפן הזה',
    saved: 'התוצאה נשמרה בהיסטוריה',
    historyCopied: 'חישוב מההיסטוריה הועתק',
    explanationPlus: 'הגבול העליון מחושב לפי מידה נומינלית + סבולת חיובית. הגבול התחתון מחושב לפי מידה נומינלית - סבולת שלילית.',
    explanationLimits: 'הטווח הכולל מחושב לפי הערך המקסימלי פחות הערך המינימלי.',
    historyTitle: 'היסטוריית חישובים',
    clearHistory: 'נקה היסטוריה',
    emptyHistory: 'עדיין אין חישובים שמורים. אחרי חישוב, לחצו על שמירה.',
    editValues: 'ערוך ערכים',
    copy: 'העתק',
    mobileNominal: 'נומינלי',
    mobileUpper: 'עליון',
    mobileLower: 'תחתון',
    mobileMax: 'מקסימום',
    mobileMin: 'מינימום',
    mobileRange: 'טווח',
    positivePlaceholderIn: 'לדוגמה: 0.005',
    positivePlaceholderMm: 'לדוגמה: 0.13',
    nominalPlaceholderIn: 'לדוגמה: 1.2500',
    nominalPlaceholderMm: 'לדוגמה: 31.75',
    negativePlaceholderIn: 'לדוגמה: 0.002',
    negativePlaceholderMm: 'לדוגמה: 0.05',
    maxPlaceholderIn: 'לדוגמה: 1.255',
    maxPlaceholderMm: 'לדוגמה: 31.88',
    minPlaceholderIn: 'לדוגמה: 1.248',
    minPlaceholderMm: 'לדוגמה: 31.70',
  },
  en: {
    appDescription: 'Tolerance calculator for converting between inches and millimeters.',
    settings: 'Settings',
    appMenu: 'App menu',
    closeMenu: 'Close menu',
    openSettings: 'Open settings menu',
    language: 'Language',
    languageHelp: 'Choose the interface language. Your choice is saved in this browser.',
    hebrew: 'עברית',
    english: 'English',
    theme: 'Theme',
    themeHelp: 'Choose light, dark, or automatic mode based on your device.',
    autoTheme: 'Auto',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    conversionDirection: 'Conversion direction',
    conversionHelp: 'Choose the input unit and the output unit.',
    resultPrecision: 'Result precision',
    digits2: '2 decimals',
    digits3: '3 decimals',
    digits4: '4 decimals',
    step1: 'Step one',
    chooseCalcType: 'Choose calculation type',
    plusMinus: 'Tolerance ±',
    plusMinusHint: 'Tol+ → Nominal → Tol-',
    maxMin: 'Maximum / Minimum',
    maxMinHint: 'Upper limit and lower limit',
    step2: 'Step two',
    enterValues: 'Enter values in ',
    positiveTolerance: 'Positive tolerance',
    positiveHelper: 'How much the measurement may increase.',
    nominal: 'Nominal value',
    nominalHelper: 'The base measurement before tolerance is applied.',
    negativeTolerance: 'Negative tolerance',
    negativeHelper: 'How much the measurement may decrease.',
    maxValue: 'Maximum value',
    maxHelper: 'The highest allowed measurement.',
    minValue: 'Minimum value',
    minHelper: 'The lowest allowed measurement.',
    save: 'Save',
    clear: 'Clear',
    step3: 'Step three',
    resultIn: 'Result in ',
    shortCopy: 'Short copy',
    fullCopy: 'Full copy',
    share: 'Share',
    shortCopied: 'Short result copied',
    fullCopied: 'Full result copied',
    shared: 'Result shared',
    shareFallback: 'Sharing is unavailable - result copied instead',
    copied: 'Result copied',
    autoCopyUnavailable: 'Automatic copy is unavailable in this browser',
    saved: 'Result saved to history',
    historyCopied: 'History calculation copied',
    explanationPlus: 'The upper limit is calculated as nominal value + positive tolerance. The lower limit is calculated as nominal value - negative tolerance.',
    explanationLimits: 'The total range is calculated as the maximum value minus the minimum value.',
    historyTitle: 'Calculation history',
    clearHistory: 'Clear history',
    emptyHistory: 'No saved calculations yet. After calculating, tap Save.',
    editValues: 'Edit values',
    copy: 'Copy',
    mobileNominal: 'Nominal',
    mobileUpper: 'Upper',
    mobileLower: 'Lower',
    mobileMax: 'Max',
    mobileMin: 'Min',
    mobileRange: 'Range',
    positivePlaceholderIn: 'Example: 0.005',
    positivePlaceholderMm: 'Example: 0.13',
    nominalPlaceholderIn: 'Example: 1.2500',
    nominalPlaceholderMm: 'Example: 31.75',
    negativePlaceholderIn: 'Example: 0.002',
    negativePlaceholderMm: 'Example: 0.05',
    maxPlaceholderIn: 'Example: 1.255',
    maxPlaceholderMm: 'Example: 31.88',
    minPlaceholderIn: 'Example: 1.248',
    minPlaceholderMm: 'Example: 31.70',
  },
};

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getSavedThemeMode() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return ['auto', 'light', 'dark'].includes(saved) ? saved : 'auto';
  } catch {
    return 'auto';
  }
}

function buildConvertedResult(mode, tol, limits, unitMode) {
  if (unitMode === UNIT_MODES.IN_TO_MM) {
    if (mode === 'plus-minus') return calculatePlusMinusTolerance(toNumber(tol.nominal), toNumber(tol.positive), toNumber(tol.negative));
    return calculateMaxMinTolerance(toNumber(limits.max), toNumber(limits.min));
  }

  if (mode === 'plus-minus') {
    const nominalMm = convertValue(toNumber(tol.nominal), unitMode);
    const posTolMm = convertValue(toNumber(tol.positive), unitMode);
    const negTolMm = convertValue(toNumber(tol.negative), unitMode);
    return { nominalMm, posTolMm, negTolMm, maxLimitMm: nominalMm + posTolMm, minLimitMm: nominalMm - negTolMm };
  }

  const maxMm = convertValue(toNumber(limits.max), unitMode);
  const minMm = convertValue(toNumber(limits.min), unitMode);
  return { maxMm, minMm, rangeMm: maxMm - minMm };
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
  const [themeMode, setThemeMode] = useState(getSavedThemeMode);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const [themeAnimating, setThemeAnimating] = useState(false);
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'he'; } catch { return 'he'; }
  });
  const inputSectionRef = useRef(null);
  const resultSectionRef = useRef(null);
  const themeTimerRef = useRef(null);
  const text = TEXT[language];
  const dir = language === 'he' ? 'rtl' : 'ltr';
  const resolvedTheme = themeMode === 'auto' ? systemTheme : themeMode;

  const units = useMemo(() => getUnits(unitMode), [unitMode]);
  const validation = useMemo(() => validateInputs(mode, tol, limits, language), [mode, tol, limits, language]);

  useEffect(() => {
    document.documentElement.lang = language === 'he' ? 'he' : 'en';
    document.documentElement.dir = dir;
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { return; }
  }, [language, dir]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const updateSystemTheme = () => setSystemTheme(query.matches ? 'light' : 'dark');
    updateSystemTheme();
    query.addEventListener?.('change', updateSystemTheme);
    return () => query.removeEventListener?.('change', updateSystemTheme);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, themeMode); } catch { return; }
    document.documentElement.style.colorScheme = resolvedTheme;
    document.body.classList.toggle('theme-light', resolvedTheme === 'light');
    document.body.classList.toggle('theme-dark', resolvedTheme === 'dark');
    setThemeAnimating(true);
    window.clearTimeout(themeTimerRef.current);
    themeTimerRef.current = window.setTimeout(() => setThemeAnimating(false), 520);
    return () => window.clearTimeout(themeTimerRef.current);
  }, [themeMode, resolvedTheme]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (Array.isArray(saved)) setHistory(saved.slice(0, 6));
    } catch { setHistory([]); }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 6))); } catch { return; }
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
    if (mode === 'plus-minus') return [[text.mobileNominal, result.nominalMm], [text.mobileUpper, result.maxLimitMm], [text.mobileLower, result.minLimitMm]];
    return [[text.mobileMax, result.maxMm], [text.mobileMin, result.minMm], [text.mobileRange, result.rangeMm]];
  }, [mode, result, text]);

  const currentText = useMemo(() => buildCopyText(mode, result, digits, units.outputLabel, language), [mode, result, digits, units.outputLabel, language]);
  const shortText = useMemo(() => buildShortCopyText(mode, result, digits, units.outputLabel, language), [mode, result, digits, units.outputLabel, language]);

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

  const scrollToInputs = () => inputSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const copyText = async (copyValue, successMessage) => {
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopyStatus(successMessage);
    } catch { setCopyStatus(text.autoCopyUnavailable); }
  };

  const shareResult = async () => {
    if (!result) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Markulator result', text: currentText });
        setCopyStatus(text.shared);
      } catch { return; }
      return;
    }
    await copyText(currentText, text.shareFallback);
  };

  const saveHistory = () => {
    if (!result) return;
    const item = { id: Date.now(), mode, unitMode, unitLabel: units.outputLabel, text: shortText, fullText: currentText };
    setHistory((items) => [item, ...items.filter((x) => x.text !== item.text)].slice(0, 6));
    setCopyStatus(text.saved);
  };

  const clearHistory = () => setHistory([]);

  const inputSuffix = units.input;
  const targetLabel = units.outputLabel;
  const plusPlaceholder = unitMode === UNIT_MODES.IN_TO_MM ? text.positivePlaceholderIn : text.positivePlaceholderMm;
  const nominalPlaceholder = unitMode === UNIT_MODES.IN_TO_MM ? text.nominalPlaceholderIn : text.nominalPlaceholderMm;
  const minusPlaceholder = unitMode === UNIT_MODES.IN_TO_MM ? text.negativePlaceholderIn : text.negativePlaceholderMm;
  const maxPlaceholder = unitMode === UNIT_MODES.IN_TO_MM ? text.maxPlaceholderIn : text.maxPlaceholderMm;
  const minPlaceholder = unitMode === UNIT_MODES.IN_TO_MM ? text.minPlaceholderIn : text.minPlaceholderMm;

  return (
    <main className={`app-shell lang-${language} theme-${resolvedTheme} theme-mode-${themeMode} ${themeAnimating ? 'theme-animating' : ''}`} dir={dir} lang={language}>
      <button className="app-menu-button" type="button" aria-label={text.openSettings} onClick={() => setDrawerOpen(true)}><span></span><span></span><span></span></button>
      {drawerOpen && <button className="drawer-backdrop" type="button" aria-label={text.closeMenu} onClick={() => setDrawerOpen(false)} />}

      <aside className={`settings-drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="drawer-header"><div><p className="section-label">{text.settings}</p><h2>{text.appMenu}</h2></div><button type="button" className="drawer-close" aria-label={text.closeMenu} onClick={() => setDrawerOpen(false)}>×</button></div>

        <div className="drawer-section">
          <strong>{text.language}</strong><small>{text.languageHelp}</small>
          <div className="unit-switch language-switch" aria-label={text.language}>
            <button className={language === 'he' ? 'active' : ''} type="button" onClick={() => setLanguage('he')}>{text.hebrew}</button>
            <button className={language === 'en' ? 'active' : ''} type="button" onClick={() => setLanguage('en')}>{text.english}</button>
          </div>
        </div>

        <div className="drawer-section">
          <strong>{text.theme}</strong><small>{text.themeHelp}</small>
          <div className="unit-switch theme-switch" aria-label={text.theme}>
            <button className={themeMode === 'auto' ? 'active' : ''} type="button" onClick={() => setThemeMode('auto')}>◎ {text.autoTheme}</button>
            <button className={themeMode === 'light' ? 'active' : ''} type="button" onClick={() => setThemeMode('light')}>☀ {text.lightTheme}</button>
            <button className={themeMode === 'dark' ? 'active' : ''} type="button" onClick={() => setThemeMode('dark')}>☾ {text.darkTheme}</button>
          </div>
        </div>

        <div className="drawer-section">
          <strong>{text.conversionDirection}</strong><small>{text.conversionHelp}</small>
          <div className="unit-switch" aria-label={text.conversionDirection}>
            <button className={unitMode === UNIT_MODES.IN_TO_MM ? 'active' : ''} type="button" onClick={() => setUnitMode(UNIT_MODES.IN_TO_MM)}>inch → mm</button>
            <button className={unitMode === UNIT_MODES.MM_TO_IN ? 'active' : ''} type="button" onClick={() => setUnitMode(UNIT_MODES.MM_TO_IN)}>mm → inch</button>
          </div>
        </div>

        <div className="drawer-section">
          <label className="select-field settings-select">{text.resultPrecision}<select value={digits} onChange={(e) => setDigits(Number(e.target.value))}><option value="2">{text.digits2}</option><option value="3">{text.digits3}</option><option value="4">{text.digits4}</option></select></label>
        </div>

        <div className="drawer-section drawer-status"><span>{WEB_VERSION}</span><span>{themeMode === 'auto' ? `${text.autoTheme} · ${resolvedTheme}` : themeMode}</span></div>
      </aside>

      <section className="hero-card compact-hero">
        <div className="brand-row brand-row-fixed"><div className="brand-title-block"><p className="eyebrow">{WEB_VERSION}</p><h1>Markulator</h1></div><div className="logo-image-wrap" aria-label="Markulator symbol"><img src={logoSymbol} alt="Markulator symbol" className="logo-image" /></div></div>
      </section>

      <section className="calculator-card">
        <header className="card-header"><div><p className="section-label">{text.step1}</p><h2>{text.chooseCalcType}</h2></div><span className="conversion-pill">{unitMode === UNIT_MODES.IN_TO_MM ? 'inch → mm' : 'mm → inch'}</span></header>
        <div className="mode-switch"><button className={mode === 'plus-minus' ? 'active' : ''} aria-pressed={mode === 'plus-minus'} onClick={() => switchMode('plus-minus')} type="button"><strong>{text.plusMinus}</strong><span>{text.plusMinusHint}</span></button><button className={mode === 'max-min' ? 'active' : ''} aria-pressed={mode === 'max-min'} onClick={() => switchMode('max-min')} type="button"><strong>{text.maxMin}</strong><span>{text.maxMinHint}</span></button></div>

        <section className="form-section" ref={inputSectionRef}>
          <div className="section-title-row"><div><p className="section-label">{text.step2}</p><h2>{text.enterValues}{units.input}</h2></div></div>
          {mode === 'plus-minus' ? (
            <div key={`plus-minus-form-${unitMode}`} className="input-grid mode-content"><InputField label={text.positiveTolerance} helper={text.positiveHelper} suffix={`+ ${inputSuffix}`} value={tol.positive} placeholder={plusPlaceholder} onChange={(positive) => setTol((x) => ({ ...x, positive }))} /><InputField label={text.nominal} helper={text.nominalHelper} suffix={inputSuffix} value={tol.nominal} placeholder={nominalPlaceholder} onChange={(nominal) => setTol((x) => ({ ...x, nominal }))} /><InputField label={text.negativeTolerance} helper={text.negativeHelper} suffix={`- ${inputSuffix}`} value={tol.negative} placeholder={minusPlaceholder} onChange={(negative) => setTol((x) => ({ ...x, negative }))} /></div>
          ) : (
            <div key={`max-min-form-${unitMode}`} className="input-grid two mode-content"><InputField label={text.maxValue} helper={text.maxHelper} suffix={inputSuffix} value={limits.max} placeholder={maxPlaceholder} onChange={(max) => setLimits((x) => ({ ...x, max }))} /><InputField label={text.minValue} helper={text.minHelper} suffix={inputSuffix} value={limits.min} placeholder={minPlaceholder} onChange={(min) => setLimits((x) => ({ ...x, min }))} /></div>
          )}
          <div className="form-clear-row form-action-row"><button className="clear-button form-save-button" onClick={saveHistory} type="button" disabled={!result}>{text.save}</button><button className="clear-button form-clear-button" onClick={clear} type="button"><span aria-hidden="true">🗑️</span> {text.clear}</button></div>
          {copyStatus && <div className="form-status">{copyStatus}</div>}
          {validation.errors.length > 0 && <div className="validation-box">{validation.errors.map((msg) => <p key={msg}>{msg}</p>)}</div>}
        </section>

        <section className="result-section" ref={resultSectionRef}>
          <div className="section-title-row"><div><p className="section-label">{text.step3}</p><h2>{text.resultIn}{targetLabel}</h2></div></div>
          <div className="result-actions enhanced-actions"><button className="clear-button" type="button" onClick={() => copyText(shortText, text.shortCopied)} disabled={!result}>{text.shortCopy}</button><button className="clear-button" type="button" onClick={() => copyText(currentText, text.fullCopied)} disabled={!result}>{text.fullCopy}</button><button className="clear-button" type="button" onClick={shareResult} disabled={!result}>{text.share}</button></div>
          <div key={`result-${mode}-${unitMode}`} className="result-transition"><ResultPanel mode={mode} result={result} digits={digits} unitLabel={targetLabel} language={language} /></div>
          {result && <div className="result-explanation">{mode === 'plus-minus' ? text.explanationPlus : text.explanationLimits}</div>}
        </section>

        <section className="history-section"><div className="section-title-row history-title"><div><p className="section-label">v0.9.4</p><h2>{text.historyTitle}</h2></div>{history.length > 0 && <button className="clear-button" type="button" onClick={clearHistory}>{text.clearHistory}</button>}</div>{history.length === 0 ? <p className="history-empty">{text.emptyHistory}</p> : <div className="history-list">{history.map((item) => <button key={item.id} type="button" onClick={() => copyText(item.fullText, text.historyCopied)}><span>{item.unitMode === UNIT_MODES.IN_TO_MM ? 'inch → mm' : 'mm → inch'}</span><strong>{item.text}</strong></button>)}</div>}</section>
      </section>

      {result && <aside className={`mobile-result-bar ${resultSectionVisible ? 'input-mode' : ''}`} aria-live="polite">{resultSectionVisible ? <div className="mobile-input-actions"><button type="button" onClick={saveHistory} disabled={!result}>{text.save}</button><button type="button" onClick={clear}>{text.clear}</button><button type="button" onClick={scrollToInputs}>{text.editValues}</button></div> : <><div className="mobile-result-items">{mobileResult.map(([label, value]) => <span key={label}><small>{label}</small><strong>{formatNumber(value, digits)} {targetLabel}</strong></span>)}</div><button type="button" onClick={() => copyText(shortText, text.copied)}>{text.copy}</button></>}</aside>}

      <footer className="app-footer">Markulator · {WEB_VERSION} · PWA-ready</footer>
    </main>
  );
}
