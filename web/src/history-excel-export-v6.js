const HISTORY_KEY = 'markulator-history-v1';
const MM = 25.4;

const LABELS = {
  he: { export: 'ייצוא לאקסל', working: 'יוצר קובץ...', done: 'קובץ נוצר', empty: 'אין היסטוריה', failed: 'שגיאה בייצוא' },
  en: { export: 'Export Excel', working: 'Creating...', done: 'Excel ready', empty: 'No history', failed: 'Export failed' },
};

let scheduled = false;
let observer = null;

const xml = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const sheetRef = (name) => `#'${String(name).replace(/'/g, "''")}'!A1`;
const lang = () => document.documentElement.lang === 'en' ? 'en' : 'he';
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : ''; };
const direction = (item) => item?.unitMode === 'mm-to-in' ? 'mm → inch' : 'inch → mm';
const savedAt = (item) => { const t = Number(item.createdAt || item.id); return Number.isFinite(t) ? new Date(t).toLocaleString('en-GB') : ''; };

function setButtonText(button, text) { if (button.textContent !== text) button.textContent = text; }
function readHistory() { try { const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } }

function cell(value, type = 'String', style = 'Cell', extra = '') {
  if (value === '' || value == null) return `<Cell ss:StyleID="${style}"${extra}/>`;
  return `<Cell ss:StyleID="${style}"${extra}><Data ss:Type="${type}">${xml(value)}</Data></Cell>`;
}
function formula(value, style = 'Formula', extra = '') {
  return `<Cell ss:StyleID="${style}" ss:Formula="${xml(value)}"${extra}><Data ss:Type="Number">0</Data></Cell>`;
}
function textFormula(value, style = 'FormulaText', extra = '') {
  return `<Cell ss:StyleID="${style}" ss:Formula="${xml(value)}"${extra}><Data ss:Type="String"></Data></Cell>`;
}
function linkCell(text, sheet, style = 'Link', extra = '') {
  return `<Cell ss:StyleID="${style}" ss:HRef="${xml(sheetRef(sheet))}"${extra}><Data ss:Type="String">${xml(text)}</Data></Cell>`;
}
function row(cells, attrs = '') { return `<Row${attrs ? ` ${attrs}` : ''}>${cells.join('')}</Row>`; }
function merge(text, span, style, attrs = '') { return row([cell(text, 'String', style, ` ss:MergeAcross="${span - 1}"`)], attrs); }
function header(values) { return row(values.map((v) => cell(v, 'String', 'Header')), 'ss:Height="25"'); }
function blank(span, h = 11) { return merge('', span, 'Blank', `ss:Height="${h}"`); }
function redBar(span) { return merge('', span, 'RedBar', 'ss:Height="18"'); }
function emptyBox(span) { return row([cell('', 'String', 'Box', ` ss:MergeAcross="${span - 1}"`)], 'ss:Height="34"'); }

function worksheet(name, columns, rows) {
  return `<Worksheet ss:Name="${xml(name)}"><Table>${columns.map((w) => `<Column ss:Width="${w}"/>`).join('')}${rows.join('')}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><DoNotDisplayGridlines/><FreezePanes/><FrozenNoSplit/><SplitHorizontal>2</SplitHorizontal><TopRowBottomPane>2</TopRowBottomPane></WorksheetOptions></Worksheet>`;
}

function plusMmFormula() {
  const p = 'R9C3', n = 'R10C2', f = 'R13C2';
  const pr = `ROUND(${p}*${f},2)`, nr = `ROUND(${n}*${f},2)`;
  const over = `ROUND(${nr}+${pr},2)>(${n}*${f}+${p}*${f})`;
  return `=IF(${over},IF(${pr}>0,${pr}-0.01,${pr}),${pr})`;
}
function nomMmFormula() {
  const p = 'R9C3', n = 'R10C2', m = 'R11C3', f = 'R13C2';
  const pr = `ROUND(${p}*${f},2)`, nr = `ROUND(${n}*${f},2)`, mr = `ROUND(${m}*${f},2)`;
  const over = `ROUND(${nr}+${pr},2)>(${n}*${f}+${p}*${f})`;
  const under = `ROUND(${nr}-${mr},2)<(${n}*${f}-${m}*${f})`;
  return `=${nr}+IF(${over},IF(${pr}>0,0,-0.01),0)+IF(${under},IF(${mr}>0,0,0.01),0)`;
}
function minusMmFormula() {
  const n = 'R10C2', m = 'R11C3', f = 'R13C2';
  const nr = `ROUND(${n}*${f},2)`, mr = `ROUND(${m}*${f},2)`;
  const under = `ROUND(${nr}-${mr},2)<(${n}*${f}-${m}*${f})`;
  return `=IF(${under},IF(${mr}>0,${mr}-0.01,${mr}),${mr})`;
}
function maxMmFormula() {
  const max = 'R3C2', f = 'R6C2';
  const r = `ROUND(${max}*${f},2)`;
  return `=IF(${r}>${max}*${f},${r}-0.01,${r})`;
}
function minMmFormula() {
  const min = 'R4C2', f = 'R6C2';
  const r = `ROUND(${min}*${f},2)`;
  return `=IF(${r}<${min}*${f},${r}+0.01,${r})`;
}

function menuSheet(tolerance, maxMin) {
  return worksheet('Menu', [220, 110, 520], [
    merge('Markulator Excel Calculator Export', 3, 'Title', 'ss:Height="34"'),
    merge('Click OPEN SHEET in a history row. Each saved calculation has its own calculator sheet, styled close to the original tolerance workbook.', 3, 'Note', 'ss:Height="38"'),
    blank(3),
    header(['Section', 'Rows', 'Open']),
    row([cell('Tolerance ±', 'String', 'Option'), cell(tolerance.length, 'Number', 'ResultBig'), linkCell('Open Tolerance History', 'Tolerance History')], 'ss:Height="26"'),
    row([cell('Maximum / Minimum', 'String', 'Option'), cell(maxMin.length, 'Number', 'ResultBig'), linkCell('Open Max-Min History', 'Max-Min History')], 'ss:Height="26"'),
  ]);
}

function toleranceHistorySheet(items) {
  const rows = [
    merge('Tolerance ± History', 12, 'Title', 'ss:Height="34"'),
    merge('Click OPEN SHEET to open the dedicated calculator sheet for that saved calculation.', 12, 'Note', 'ss:Height="36"'),
    blank(12),
    header(['Open', 'Saved At', 'Direction', 'Input Unit', 'Output Unit', 'Tol+ In', 'Nom In', 'Tol- In', 'Sheet', 'Tol+ Out', 'Nom Out', 'Tol- Out']),
  ];
  items.forEach((item, index) => {
    const tol = item.values?.tol || {};
    const d = direction(item);
    const sheet = `TOL-${index + 1}`;
    rows.push(row([
      linkCell('OPEN SHEET', sheet),
      cell(savedAt(item)),
      cell(d),
      cell(d === 'inch → mm' ? 'in' : 'mm'),
      cell(d === 'inch → mm' ? 'mm' : 'in'),
      cell(num(tol.positive), 'Number', 'Input'),
      cell(num(tol.nominal), 'Number', 'Input'),
      cell(num(tol.negative), 'Number', 'Input'),
      linkCell(sheet, sheet),
      linkCell('view', sheet),
      linkCell('view', sheet),
      linkCell('view', sheet),
    ], 'ss:Height="25"'));
  });
  return worksheet('Tolerance History', [120, 120, 100, 75, 82, 85, 90, 85, 100, 85, 90, 85], rows);
}

function maxHistorySheet(items) {
  const rows = [
    merge('Maximum / Minimum History', 10, 'Title', 'ss:Height="34"'),
    merge('Click OPEN SHEET to open the dedicated calculator sheet for that saved calculation.', 10, 'Note', 'ss:Height="36"'),
    blank(10),
    header(['Open', 'Saved At', 'Direction', 'Input Unit', 'Output Unit', 'MAX In', 'MIN In', 'Sheet', 'MAX Out', 'MIN Out']),
  ];
  items.forEach((item, index) => {
    const limits = item.values?.limits || {};
    const d = direction(item);
    const sheet = `MAX-${index + 1}`;
    rows.push(row([
      linkCell('OPEN SHEET', sheet),
      cell(savedAt(item)),
      cell(d),
      cell(d === 'inch → mm' ? 'in' : 'mm'),
      cell(d === 'inch → mm' ? 'mm' : 'in'),
      cell(num(limits.max), 'Number', 'Input'),
      cell(num(limits.min), 'Number', 'Input'),
      linkCell(sheet, sheet),
      linkCell('view', sheet),
      linkCell('view', sheet),
    ], 'ss:Height="25"'));
  });
  return worksheet('Max-Min History', [120, 120, 100, 75, 82, 85, 85, 100, 85, 85], rows);
}

function toleranceCalcSheet(item, index) {
  const tol = item.values?.tol || {};
  const inToMm = item.unitMode !== 'mm-to-in';
  const sheet = `TOL-${index + 1}`;
  const rows = [
    merge(`Tolerance ± Calculator — ${sheet}`, 14, 'CalcTitle', 'ss:Height="28"'),
    row([linkCell('← Back to Tolerance History', 'Tolerance History', 'BackLink', ' ss:MergeAcross="13"')], 'ss:Height="22"'),
    blank(14, 16),
    row([cell('', 'String'), cell('TOL  IN', 'String', 'TopLabel'), cell('TOL  M"M', 'String', 'TopLabel'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String')], 'ss:Height="22"'),
    row([cell('Max', 'String', 'GiantLabel'), formula('=R10C2+R9C3', 'LargeFormula'), formula('=R10C6+R9C7', 'LargeFormula'), cell('', 'String'), cell('', 'String'), cell('', 'String', 'Box', ' ss:MergeAcross="1"'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String')], 'ss:Height="38"'),
    row([cell('Min', 'String', 'GiantLabel'), formula('=R10C2-R11C3', 'LargeFormula'), formula('=R10C6-R11C7', 'LargeFormula'), cell('', 'String'), cell('', 'String'), cell('', 'String', 'Box', ' ss:MergeAcross="1"'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String')], 'ss:Height="38"'),
    redBar(14),
    row([cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('TOL  M"M', 'String', 'TopLabel'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('nom-mm', 'String', 'TinyHeader'), cell('tol-mm', 'String', 'TinyHeader'), cell('tol-o', 'String', 'TinyHeader'), cell('max/min-mm', 'String', 'TinyHeader')], 'ss:Height="24"'),
    row([cell('', 'String'), cell('+', 'String', 'Sign'), inToMm ? cell(num(tol.positive), 'Number', 'Input') : formula('=R9C7/R13C2', 'Formula'), cell('', 'String'), cell('', 'String'), cell('+', 'String', 'Sign'), inToMm ? formula(plusMmFormula(), 'Formula') : cell(num(tol.positive), 'Number', 'Input'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), formula('=R9C7', 'Formula'), formula('=R9C7', 'Formula'), formula('=R10C6+R9C7', 'Formula')], 'ss:Height="38"'),
    row([cell('Nom', 'String', 'GiantLabel'), inToMm ? cell(num(tol.nominal), 'Number', 'InputLarge') : formula('=R10C6/R13C2', 'LargeFormula'), cell('', 'String'), cell('', 'String'), cell('Nom', 'String', 'GiantLabel'), inToMm ? formula(nomMmFormula(), 'ResultLarge') : cell(num(tol.nominal), 'Number', 'InputLarge'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), formula('=R10C6', 'Formula'), cell('', 'String'), cell('', 'String'), cell('', 'String')], 'ss:Height="42"'),
    row([cell('', 'String'), cell('-', 'String', 'Sign'), inToMm ? cell(num(tol.negative), 'Number', 'Input') : formula('=R11C7/R13C2', 'Formula'), cell('', 'String'), cell('', 'String'), cell('-', 'String', 'Sign'), inToMm ? formula(minusMmFormula(), 'Formula') : cell(num(tol.negative), 'Number', 'Input'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), formula('=R11C7', 'Formula'), formula('=R11C7', 'Formula'), formula('=R10C6-R11C7', 'Formula')], 'ss:Height="38"'),
    blank(14, 12),
    row([cell('', 'String'), cell('Conversion factor', 'String', 'SmallLabel'), cell(MM, 'Number', 'Input'), cell('mm / inch', 'String', 'Unit'), cell('', 'String'), cell('Logic', 'String', 'SmallLabel'), cell('Markulator safe rounding', 'String', 'Callout', ' ss:MergeAcross="1"'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String'), cell('', 'String')], 'ss:Height="26"'),
    redBar(14),
    row([cell('Saved', 'String', 'SmallLabel'), cell(savedAt(item), 'String', 'Note', ' ss:MergeAcross="3"'), cell('Direction', 'String', 'SmallLabel'), cell(direction(item), 'String', 'Note', ' ss:MergeAcross="2"')], 'ss:Height="24"'),
  ];
  return worksheet(sheet, [58, 118, 86, 54, 78, 118, 86, 58, 58, 58, 70, 70, 70, 90], rows);
}

function maxCalcSheet(item, index) {
  const limits = item.values?.limits || {};
  const inToMm = item.unitMode !== 'mm-to-in';
  const sheet = `MAX-${index + 1}`;
  const rows = [
    merge(`Maximum / Minimum Calculator — ${sheet}`, 10, 'CalcTitle', 'ss:Height="28"'),
    row([linkCell('← Back to Max-Min History', 'Max-Min History', 'BackLink', ' ss:MergeAcross="9"')], 'ss:Height="22"'),
    blank(10, 16),
    row([cell('', 'String'), cell('IN', 'String', 'TopLabel'), cell('M"M', 'String', 'TopLabel'), cell('', 'String'), cell('', 'String'), cell('', 'String', 'Box', ' ss:MergeAcross="1"'), cell('', 'String'), cell('', 'String'), cell('', 'String')], 'ss:Height="22"'),
    row([cell('Max', 'String', 'GiantLabel'), inToMm ? cell(num(limits.max), 'Number', 'InputLarge') : formula('=R5C3/R8C2', 'LargeFormula'), inToMm ? formula(maxMmFormula(), 'ResultLarge') : cell(num(limits.max), 'Number', 'InputLarge'), cell('', 'String'), cell('', 'String'), cell('', 'String', 'Box', ' ss:MergeAcross="1"'), cell('', 'String'), cell('', 'String'), cell('', 'String')], 'ss:Height="42"'),
    row([cell('Min', 'String', 'GiantLabel'), inToMm ? cell(num(limits.min), 'Number', 'InputLarge') : formula('=R6C3/R8C2', 'LargeFormula'), inToMm ? formula(minMmFormula(), 'ResultLarge') : cell(num(limits.min), 'Number', 'InputLarge'), cell('', 'String'), cell('', 'String'), cell('', 'String', 'Box', ' ss:MergeAcross="1"'), cell('', 'String'), cell('', 'String'), cell('', 'String')], 'ss:Height="42"'),
    redBar(10),
    row([cell('Factor', 'String', 'SmallLabel'), cell(MM, 'Number', 'Input'), cell('mm / inch', 'String', 'Unit'), cell('', 'String'), cell('Range', 'String', 'SmallLabel'), formula('=R5C3-R6C3', 'ResultBig'), cell('mm', 'String', 'Unit'), cell('', 'String'), cell('', 'String'), cell('', 'String')], 'ss:Height="30"'),
    row([cell('Range', 'String', 'SmallLabel'), formula('=R5C2-R6C2', 'ResultBig'), cell('in', 'String', 'Unit'), cell('', 'String'), cell('Logic', 'String', 'SmallLabel'), cell('Markulator safe rounding', 'String', 'Callout', ' ss:MergeAcross="1"')], 'ss:Height="30"'),
    redBar(10),
    row([cell('Saved', 'String', 'SmallLabel'), cell(savedAt(item), 'String', 'Note', ' ss:MergeAcross="2"'), cell('Direction', 'String', 'SmallLabel'), cell(direction(item), 'String', 'Note', ' ss:MergeAcross="2"')], 'ss:Height="24"'),
  ];
  return worksheet(sheet, [58, 118, 86, 54, 78, 118, 86, 58, 58, 58], rows);
}

function styles() {
  return `<Styles>
    <Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Arial" ss:Size="10" ss:Color="#000000"/><Alignment ss:Vertical="Center"/></Style>
    <Style ss:ID="Title"><Font ss:FontName="Arial" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/></Style>
    <Style ss:ID="CalcTitle"><Font ss:FontName="Arial" ss:Size="14" ss:Bold="1" ss:Color="#111111"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Note"><Font ss:FontName="Arial" ss:Size="9" ss:Italic="1" ss:Color="#008040"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/></Style>
    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E293B" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/></Borders></Style>
    <Style ss:ID="Cell"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/></Borders></Style>
    <Style ss:ID="Link"><Font ss:Bold="1" ss:Color="#2563EB" ss:Underline="Single"/><Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
    <Style ss:ID="BackLink"><Font ss:Bold="1" ss:Color="#2563EB" ss:Underline="Single"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Option"><Font ss:Bold="1"/><Interior ss:Color="#ECFEFF" ss:Pattern="Solid"/></Style>
    <Style ss:ID="TopLabel"><Font ss:FontName="Arial" ss:Size="12"/><Alignment ss:Horizontal="Center"/></Style>
    <Style ss:ID="TinyHeader"><Font ss:Size="8"/><Alignment ss:Horizontal="Center"/></Style>
    <Style ss:ID="GiantLabel"><Font ss:FontName="Arial" ss:Size="18"/><Alignment ss:Horizontal="Left"/></Style>
    <Style ss:ID="Sign"><Font ss:FontName="Arial" ss:Size="15"/><Alignment ss:Horizontal="Right"/></Style>
    <Style ss:ID="Input"><NumberFormat ss:Format="0.0000"/><Font ss:Size="11" ss:Color="#1E3A8A"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#2563EB"/></Borders></Style>
    <Style ss:ID="InputLarge"><NumberFormat ss:Format="0.0000"/><Font ss:Size="16" ss:Bold="1" ss:Color="#1E3A8A"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563EB"/></Borders></Style>
    <Style ss:ID="Formula"><NumberFormat ss:Format="0.0000"/><Font ss:Size="11" ss:Color="#006060"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#22C55E"/></Borders></Style>
    <Style ss:ID="LargeFormula"><NumberFormat ss:Format="0.0000"/><Font ss:Size="16" ss:Color="#111111"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Right"/></Style>
    <Style ss:ID="ResultLarge"><NumberFormat ss:Format="0.0000"/><Font ss:Size="16" ss:Bold="1" ss:Color="#006060"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/><Alignment ss:Horizontal="Right"/></Style>
    <Style ss:ID="ResultBig"><NumberFormat ss:Format="0.0000"/><Font ss:Size="13" ss:Bold="1" ss:Color="#006060"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
    <Style ss:ID="RedBar"><Interior ss:Color="#FF0000" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Box"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/></Borders></Style>
    <Style ss:ID="SmallLabel"><Font ss:Bold="1"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Unit"><Font ss:Bold="1"/><Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
    <Style ss:ID="Callout"><Font ss:Bold="1" ss:Color="#B45309"/><Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/></Style>
    <Style ss:ID="Blank"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/></Style>
  </Styles>`;
}

function workbook(history) {
  const usable = history.filter((item) => item?.values && (item.values.tol || item.values.limits));
  const tolerance = usable.filter((item) => item.mode !== 'max-min');
  const maxMin = usable.filter((item) => item.mode === 'max-min');
  const calcSheets = [
    ...tolerance.map((item, index) => toleranceCalcSheet(item, index)),
    ...maxMin.map((item, index) => maxCalcSheet(item, index)),
  ].join('');
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>Markulator Calculator Export</Title><Author>Markulator</Author><Created>${new Date().toISOString()}</Created></DocumentProperties>${styles()}${menuSheet(tolerance, maxMin)}${toleranceHistorySheet(tolerance)}${maxHistorySheet(maxMin)}${calcSheets}</Workbook>`;
}

function download(history) { const blob = new Blob([workbook(history)], { type: 'application/vnd.ms-excel;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `Markulator-calculator-history-${new Date().toISOString().slice(0, 10)}.xls`; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1200); }
function flash(button, label, delay = 1250) { const currentLang = lang(); setButtonText(button, label); window.setTimeout(() => { setButtonText(button, LABELS[currentLang].export); button.disabled = false; }, delay); }
function exportClick(event) { event.preventDefault(); event.stopPropagation(); const button = event.currentTarget; const labels = LABELS[lang()]; const history = readHistory(); if (!history.length) { button.disabled = true; flash(button, labels.empty, 1000); return; } try { button.disabled = true; setButtonText(button, labels.working); download(history); flash(button, labels.done, 1400); } catch (error) { console.error('Markulator Excel export failed:', error); flash(button, labels.failed, 1500); } }
function actions(header) { let box = header.querySelector('.history-actions'); if (box) return box; box = document.createElement('div'); box.className = 'history-actions'; const clear = Array.from(header.children).find((child) => child.matches?.('.clear-button')); if (clear) box.appendChild(clear); header.appendChild(box); return box; }
function ensureButton() { scheduled = false; const header = document.querySelector('.history-title'); if (!header) return; const labels = LABELS[lang()]; const box = actions(header); let button = box.querySelector('.history-excel-export-button'); if (!button) { button = document.createElement('button'); button.className = 'clear-button history-excel-export-button'; button.type = 'button'; button.addEventListener('click', exportClick); box.prepend(button); } if (!button.disabled) setButtonText(button, labels.export); button.setAttribute('aria-label', labels.export); }
function schedule() { if (scheduled) return; scheduled = true; window.requestAnimationFrame(ensureButton); }
function bind() { ensureButton(); const root = document.getElementById('root'); if (!root || !('MutationObserver' in window)) return; observer?.disconnect?.(); observer = new MutationObserver((mutations) => { const shouldCheck = mutations.some((mutation) => Array.from(mutation.addedNodes || []).some((node) => node.nodeType === 1 && (node.matches?.('.history-title, .history-drawer-inner') || node.querySelector?.('.history-title, .history-drawer-inner')))); if (shouldCheck) schedule(); }); observer.observe(root, { childList: true, subtree: true }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true }); else bind();
