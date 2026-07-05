const HISTORY_KEY = 'markulator-history-v1';
const MM = 25.4;

const LABELS = {
  he: { export: 'ייצוא לאקסל', working: 'יוצר קובץ...', done: 'קובץ נוצר', empty: 'אין היסטוריה', failed: 'שגיאה בייצוא' },
  en: { export: 'Export Excel', working: 'Creating...', done: 'Excel ready', empty: 'No history', failed: 'Export failed' },
};

let scheduled = false;
let observer = null;

const xml = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const lang = () => document.documentElement.lang === 'en' ? 'en' : 'he';
const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : ''; };
const dir = (item) => item?.unitMode === 'mm-to-in' ? 'mm → inch' : 'inch → mm';
const savedAt = (item) => { const t = Number(item.createdAt || item.id); return Number.isFinite(t) ? new Date(t).toLocaleString('en-GB') : ''; };
const formulaSafe = (s) => xml(s);

function setButtonText(button, text) { if (button.textContent !== text) button.textContent = text; }
function readHistory() { try { const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } }

function cell(value, type = 'String', style = 'Cell', extra = '') {
  if (value === '' || value == null) return `<Cell ss:StyleID="${style}"${extra}/>`;
  return `<Cell ss:StyleID="${style}"${extra}><Data ss:Type="${type}">${xml(value)}</Data></Cell>`;
}
function formula(value, style = 'Formula', extra = '') {
  return `<Cell ss:StyleID="${style}" ss:Formula="${formulaSafe(value)}"${extra}><Data ss:Type="Number">0</Data></Cell>`;
}
function textFormula(value, style = 'FormulaText', extra = '') {
  return `<Cell ss:StyleID="${style}" ss:Formula="${formulaSafe(value)}"${extra}><Data ss:Type="String"></Data></Cell>`;
}
function linkCell(text, sheet, style = 'Link', extra = '') {
  return `<Cell ss:StyleID="${style}" ss:HRef="#${xml(sheet)}!A1"${extra}><Data ss:Type="String">${xml(text)}</Data></Cell>`;
}
function row(cells, attrs = '') { return `<Row${attrs ? ` ${attrs}` : ''}>${cells.join('')}</Row>`; }
function merge(text, span, style, attrs = '') { return row([cell(text, 'String', style, ` ss:MergeAcross="${span - 1}"`)], attrs); }
function header(values) { return row(values.map((v) => cell(v, 'String', 'Header')), 'ss:Height="27"'); }
function blank(span) { return merge('', span, 'Spacer', 'ss:Height="10"'); }

function tolPlusFormula() {
  const p = 'R9C2', n = 'R10C2';
  const pr = `ROUND(${p}*${MM},2)`, nr = `ROUND(${n}*${MM},2)`;
  const over = `ROUND(${nr}+${pr},2)>(${n}*${MM}+${p}*${MM})`;
  return `=IF(${over},IF(${pr}>0,${pr}-0.01,${pr}),${pr})`;
}
function tolNomFormula() {
  const p = 'R9C2', n = 'R10C2', m = 'R11C2';
  const pr = `ROUND(${p}*${MM},2)`, nr = `ROUND(${n}*${MM},2)`, mr = `ROUND(${m}*${MM},2)`;
  const over = `ROUND(${nr}+${pr},2)>(${n}*${MM}+${p}*${MM})`;
  const under = `ROUND(${nr}-${mr},2)<(${n}*${MM}-${m}*${MM})`;
  return `=${nr}+IF(${over},IF(${pr}>0,0,-0.01),0)+IF(${under},IF(${mr}>0,0,0.01),0)`;
}
function tolMinusFormula() {
  const n = 'R10C2', m = 'R11C2';
  const nr = `ROUND(${n}*${MM},2)`, mr = `ROUND(${m}*${MM},2)`;
  const under = `ROUND(${nr}-${mr},2)<(${n}*${MM}-${m}*${MM})`;
  return `=IF(${under},IF(${mr}>0,${mr}-0.01,${mr}),${mr})`;
}
function maxFormula() {
  const max = 'R6C2', rounded = `ROUND(${max}*${MM},2)`;
  return `=IF(${rounded}>${max}*${MM},${rounded}-0.01,${rounded})`;
}
function minFormula() {
  const min = 'R7C2', rounded = `ROUND(${min}*${MM},2)`;
  return `=IF(${rounded}<${min}*${MM},${rounded}+0.01,${rounded})`;
}

function worksheet(name, columns, rows) {
  return `<Worksheet ss:Name="${xml(name)}"><Table>${columns.map((w) => `<Column ss:Width="${w}"/>`).join('')}${rows.join('')}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><DoNotDisplayGridlines/><FreezePanes/><FrozenNoSplit/><SplitHorizontal>3</SplitHorizontal><TopRowBottomPane>3</TopRowBottomPane></WorksheetOptions></Worksheet>`;
}

function menuSheet(tolerance, maxMin) {
  return worksheet('Menu', [220, 120, 460], [
    merge('Markulator Excel Calculator Export', 3, 'Title', 'ss:Height="34"'),
    merge('Click a history row link. Every saved calculation opens its own calculator sheet, styled like the original Excel calculator.', 3, 'Note', 'ss:Height="42"'),
    blank(3),
    header(['Section', 'Rows', 'Open']),
    row([cell('Tolerance ±', 'String', 'Option'), cell(tolerance.length, 'Number', 'BigResult'), linkCell('Open Tolerance History', 'Tolerance History')]),
    row([cell('Maximum / Minimum', 'String', 'Option'), cell(maxMin.length, 'Number', 'BigResult'), linkCell('Open Max-Min History', 'Max-Min History')]),
  ]);
}

function toleranceHistorySheet(items) {
  const rows = [
    merge('Tolerance ± History', 12, 'Title', 'ss:Height="34"'),
    merge('Click OPEN SHEET on a history row to open a dedicated calculator sheet for that calculation.', 12, 'Note', 'ss:Height="38"'),
    blank(12),
    header(['Open', 'Saved At', 'Direction', 'Input Unit', 'Output Unit', 'Tol+ In', 'Nom In', 'Tol- In', 'Tol+ Out', 'Nom Out', 'Tol- Out', 'Result Sheet']),
  ];
  items.forEach((item, index) => {
    const tol = item.values?.tol || {};
    const d = dir(item);
    const sheet = `TOL-${index + 1}`;
    const inUnit = d === 'inch → mm' ? 'in' : 'mm';
    const outUnit = d === 'inch → mm' ? 'mm' : 'in';
    rows.push(row([
      linkCell('OPEN SHEET', sheet), cell(savedAt(item)), cell(d), cell(inUnit), cell(outUnit),
      cell(toNum(tol.positive), 'Number', 'Input'), cell(toNum(tol.nominal), 'Number', 'Input'), cell(toNum(tol.negative), 'Number', 'Input'),
      linkCell('view', sheet), linkCell('view', sheet), linkCell('view', sheet), linkCell(sheet, sheet),
    ], 'ss:Height="25"'));
  });
  return worksheet('Tolerance History', [120, 120, 100, 75, 82, 85, 90, 85, 85, 95, 85, 110], rows);
}

function maxHistorySheet(items) {
  const rows = [
    merge('Maximum / Minimum History', 10, 'Title', 'ss:Height="34"'),
    merge('Click OPEN SHEET on a history row to open a dedicated calculator sheet for that calculation.', 10, 'Note', 'ss:Height="38"'),
    blank(10),
    header(['Open', 'Saved At', 'Direction', 'Input Unit', 'Output Unit', 'MAX In', 'MIN In', 'MAX Out', 'MIN Out', 'Result Sheet']),
  ];
  items.forEach((item, index) => {
    const limits = item.values?.limits || {};
    const d = dir(item);
    const sheet = `MAX-${index + 1}`;
    const inUnit = d === 'inch → mm' ? 'in' : 'mm';
    const outUnit = d === 'inch → mm' ? 'mm' : 'in';
    rows.push(row([
      linkCell('OPEN SHEET', sheet), cell(savedAt(item)), cell(d), cell(inUnit), cell(outUnit),
      cell(toNum(limits.max), 'Number', 'Input'), cell(toNum(limits.min), 'Number', 'Input'),
      linkCell('view', sheet), linkCell('view', sheet), linkCell(sheet, sheet),
    ], 'ss:Height="25"'));
  });
  return worksheet('Max-Min History', [120, 120, 100, 75, 82, 85, 85, 85, 85, 110], rows);
}

function toleranceCalcSheet(item, index) {
  const tol = item.values?.tol || {};
  const isInToMm = item.unitMode !== 'mm-to-in';
  const sheet = `TOL-${index + 1}`;
  const leftInput = isInToMm ? 'BigInput' : 'BigResult';
  const rightInput = isInToMm ? 'BigResult' : 'BigInput';
  const rows = [
    merge(`Tolerance ± Calculator — ${sheet}`, 8, 'Title', 'ss:Height="34"'),
    row([linkCell('← Back to Tolerance History', 'Tolerance History', 'BackLink', ' ss:MergeAcross="7"')], 'ss:Height="28"'),
    row([cell(`Saved: ${savedAt(item)} | Direction: ${dir(item)}`, 'String', 'Note', ' ss:MergeAcross="7"')], 'ss:Height="30"'),
    blank(8),
    row([cell('INCH SIDE', 'String', 'InchHeader', ' ss:MergeAcross="2"'), cell('', 'String', 'RedDivider'), cell('MM SIDE', 'String', 'MmHeader', ' ss:MergeAcross="3"')], 'ss:Height="30"'),
    row([cell('MAX', 'String', 'BigLabel'), isInToMm ? formula('=R10C2+R9C2', leftInput) : formula('=R6C6/R6C7', leftInput), cell('in', 'String', 'Unit'), cell('', 'String', 'RedDivider'), cell('MAX', 'String', 'BigLabel'), isInToMm ? formula('=R10C6+R9C6', rightInput) : formula('=R10C6+R9C6', rightInput), cell('mm', 'String', 'Unit')], 'ss:Height="36"'),
    row([cell('NOM', 'String', 'BigLabel'), isInToMm ? formula('=R10C2', leftInput) : formula('=R10C6/R6C7', leftInput), cell('in', 'String', 'Unit'), cell('', 'String', 'RedDivider'), cell('NOM', 'String', 'BigLabel'), isInToMm ? formula('=R10C6', rightInput) : formula('=R10C6', rightInput), cell('mm', 'String', 'Unit')], 'ss:Height="36"'),
    row([cell('MIN', 'String', 'BigLabel'), isInToMm ? formula('=R10C2-R11C2', leftInput) : formula('=R7C6/R6C7', leftInput), cell('in', 'String', 'Unit'), cell('', 'String', 'RedDivider'), cell('MIN', 'String', 'BigLabel'), isInToMm ? formula('=R10C6-R11C6', rightInput) : formula('=R10C6-R11C6', rightInput), cell('mm', 'String', 'Unit')], 'ss:Height="36"'),
    blank(8),
    row([cell('Tol +', 'String', 'SmallLabel'), isInToMm ? cell(toNum(tol.positive), 'Number', 'Input') : formula('=R9C6/R6C7', 'Formula'), cell('in', 'String', 'Unit'), cell('', 'String', 'RedDivider'), cell('Tol +', 'String', 'SmallLabel'), isInToMm ? formula(tolPlusFormula(), 'Formula') : cell(toNum(tol.positive), 'Number', 'Input'), cell('mm', 'String', 'Unit')], 'ss:Height="28"'),
    row([cell('Nominal', 'String', 'SmallLabel'), isInToMm ? cell(toNum(tol.nominal), 'Number', 'Input') : formula('=R10C6/R6C7', 'Formula'), cell('in', 'String', 'Unit'), cell('', 'String', 'RedDivider'), cell('Nominal', 'String', 'SmallLabel'), isInToMm ? formula(tolNomFormula(), 'Formula') : cell(toNum(tol.nominal), 'Number', 'Input'), cell('mm', 'String', 'Unit')], 'ss:Height="28"'),
    row([cell('Tol -', 'String', 'SmallLabel'), isInToMm ? cell(toNum(tol.negative), 'Number', 'Input') : formula('=R11C6/R6C7', 'Formula'), cell('in', 'String', 'Unit'), cell('', 'String', 'RedDivider'), cell('Tol -', 'String', 'SmallLabel'), isInToMm ? formula(tolMinusFormula(), 'Formula') : cell(toNum(tol.negative), 'Number', 'Input'), cell('mm', 'String', 'Unit')], 'ss:Height="28"'),
    row([cell('Conversion factor', 'String', 'SmallLabel'), cell(MM, 'Number', 'Input'), cell('mm / inch', 'String', 'Unit'), cell('', 'String', 'RedDivider'), cell('Logic', 'String', 'SmallLabel'), cell('Markulator safe rounding', 'String', 'Callout', ' ss:MergeAcross="1"')], 'ss:Height="28"'),
  ];
  return worksheet(sheet, [92, 118, 72, 22, 92, 118, 72, 120], rows);
}

function maxCalcSheet(item, index) {
  const limits = item.values?.limits || {};
  const isInToMm = item.unitMode !== 'mm-to-in';
  const sheet = `MAX-${index + 1}`;
  const leftInput = isInToMm ? 'BigInput' : 'BigResult';
  const rightInput = isInToMm ? 'BigResult' : 'BigInput';
  const rows = [
    merge(`Maximum / Minimum Calculator — ${sheet}`, 8, 'Title', 'ss:Height="34"'),
    row([linkCell('← Back to Max-Min History', 'Max-Min History', 'BackLink', ' ss:MergeAcross="7"')], 'ss:Height="28"'),
    row([cell(`Saved: ${savedAt(item)} | Direction: ${dir(item)}`, 'String', 'Note', ' ss:MergeAcross="7"')], 'ss:Height="30"'),
    blank(8),
    row([cell('INCH SIDE', 'String', 'InchHeader', ' ss:MergeAcross="2"'), cell('', 'String', 'RedDivider'), cell('MM SIDE', 'String', 'MmHeader', ' ss:MergeAcross="3"')], 'ss:Height="30"'),
    row([cell('MAX', 'String', 'BigLabel'), isInToMm ? cell(toNum(limits.max), 'Number', leftInput) : formula('=R6C6/R8C2', leftInput), cell('in', 'String', 'Unit'), cell('', 'String', 'RedDivider'), cell('MAX', 'String', 'BigLabel'), isInToMm ? formula(maxFormula(), rightInput) : cell(toNum(limits.max), 'Number', rightInput), cell('mm', 'String', 'Unit')], 'ss:Height="36"'),
    row([cell('MIN', 'String', 'BigLabel'), isInToMm ? cell(toNum(limits.min), 'Number', leftInput) : formula('=R7C6/R8C2', leftInput), cell('in', 'String', 'Unit'), cell('', 'String', 'RedDivider'), cell('MIN', 'String', 'BigLabel'), isInToMm ? formula(minFormula(), rightInput) : cell(toNum(limits.min), 'Number', rightInput), cell('mm', 'String', 'Unit')], 'ss:Height="36"'),
    row([cell('Factor', 'String', 'SmallLabel'), cell(MM, 'Number', 'Input'), cell('mm / inch', 'String', 'Unit'), cell('', 'String', 'RedDivider'), cell('Range', 'String', 'BigLabel'), formula('=R6C6-R7C6', 'BigResult'), cell('mm', 'String', 'Unit')], 'ss:Height="32"'),
    row([cell('Range', 'String', 'BigLabel'), formula('=R6C2-R7C2', 'BigResult'), cell('in', 'String', 'Unit'), cell('', 'String', 'RedDivider'), cell('Logic', 'String', 'SmallLabel'), cell('Markulator safe rounding', 'String', 'Callout', ' ss:MergeAcross="1"')], 'ss:Height="32"'),
  ];
  return worksheet(sheet, [92, 118, 72, 22, 92, 118, 72, 120], rows);
}

function styles() {
  return `<Styles><Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Aptos" ss:Size="10" ss:Color="#172033"/><Alignment ss:Vertical="Center"/></Style><Style ss:ID="Title"><Font ss:Size="18" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/></Style><Style ss:ID="Note"><Font ss:Color="#475569" ss:Italic="1"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/></Style><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E293B" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/></Borders></Style><Style ss:ID="Cell"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style><Style ss:ID="Link"><Font ss:Bold="1" ss:Color="#2563EB" ss:Underline="Single"/><Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="BackLink"><Font ss:Bold="1" ss:Color="#2563EB" ss:Underline="Single"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/></Style><Style ss:ID="Option"><Font ss:Size="12" ss:Bold="1"/><Interior ss:Color="#ECFEFF" ss:Pattern="Solid"/></Style><Style ss:ID="Input"><NumberFormat ss:Format="0.0000"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/><Font ss:Bold="1" ss:Color="#1E3A8A"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#60A5FA"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#60A5FA"/></Borders></Style><Style ss:ID="Formula"><NumberFormat ss:Format="0.0000"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/><Font ss:Bold="1" ss:Color="#0F766E"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4ADE80"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4ADE80"/></Borders></Style><Style ss:ID="FormulaText"><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/><Font ss:Bold="1" ss:Color="#0F766E"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="BigInput"><NumberFormat ss:Format="0.0000"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/><Font ss:Size="15" ss:Bold="1" ss:Color="#1E3A8A"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#2563EB"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563EB"/></Borders></Style><Style ss:ID="BigResult"><NumberFormat ss:Format="0.0000"/><Interior ss:Color="#A7F3D0" ss:Pattern="Solid"/><Font ss:Size="15" ss:Bold="1" ss:Color="#065F46"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#047857"/></Borders></Style><Style ss:ID="InchHeader"><Font ss:Size="13" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#334155" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="MmHeader"><Font ss:Size="13" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F766E" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="RedDivider"><Interior ss:Color="#DC2626" ss:Pattern="Solid"/></Style><Style ss:ID="BigLabel"><Font ss:Size="16" ss:Bold="1" ss:Color="#111827"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="SmallLabel"><Font ss:Bold="1" ss:Color="#334155"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style><Style ss:ID="Unit"><Font ss:Bold="1"/><Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="Callout"><Font ss:Bold="1" ss:Color="#92400E"/><Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/></Style><Style ss:ID="Spacer"><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style></Styles>`;
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
function flash(button, label, delay = 1250) { const currentLanguage = lang(); setButtonText(button, label); window.setTimeout(() => { setButtonText(button, LABELS[currentLanguage].export); button.disabled = false; }, delay); }
function exportClick(event) { event.preventDefault(); event.stopPropagation(); const button = event.currentTarget; const labels = LABELS[lang()]; const history = readHistory(); if (!history.length) { button.disabled = true; flash(button, labels.empty, 1000); return; } try { button.disabled = true; setButtonText(button, labels.working); download(history); flash(button, labels.done, 1400); } catch (error) { console.error('Markulator Excel export failed:', error); flash(button, labels.failed, 1500); } }
function actions(header) { let box = header.querySelector('.history-actions'); if (box) return box; box = document.createElement('div'); box.className = 'history-actions'; const clear = Array.from(header.children).find((child) => child.matches?.('.clear-button')); if (clear) box.appendChild(clear); header.appendChild(box); return box; }
function ensureButton() { scheduled = false; const header = document.querySelector('.history-title'); if (!header) return; const labels = LABELS[lang()]; const box = actions(header); let button = box.querySelector('.history-excel-export-button'); if (!button) { button = document.createElement('button'); button.className = 'clear-button history-excel-export-button'; button.type = 'button'; button.addEventListener('click', exportClick); box.prepend(button); } if (!button.disabled) setButtonText(button, labels.export); button.setAttribute('aria-label', labels.export); }
function schedule() { if (scheduled) return; scheduled = true; window.requestAnimationFrame(ensureButton); }
function bind() { ensureButton(); const root = document.getElementById('root'); if (!root || !('MutationObserver' in window)) return; observer?.disconnect?.(); observer = new MutationObserver((mutations) => { const shouldCheck = mutations.some((mutation) => Array.from(mutation.addedNodes || []).some((node) => node.nodeType === 1 && (node.matches?.('.history-title, .history-drawer-inner') || node.querySelector?.('.history-title, .history-drawer-inner')))); if (shouldCheck) schedule(); }); observer.observe(root, { childList: true, subtree: true }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true }); else bind();
