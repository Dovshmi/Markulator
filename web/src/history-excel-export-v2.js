const HISTORY_KEY = 'markulator-history-v1';
const MM_PER_INCH = 25.4;

const LABELS = {
  he: { export: 'ייצוא לאקסל', working: 'יוצר קובץ...', done: 'קובץ נוצר', empty: 'אין היסטוריה', failed: 'שגיאה בייצוא' },
  en: { export: 'Export Excel', working: 'Creating...', done: 'Excel ready', empty: 'No history', failed: 'Export failed' },
};

let scheduled = false;
let observer = null;

function lang() { return document.documentElement.lang === 'en' ? 'en' : 'he'; }
function setText(el, value) { if (el.textContent !== value) el.textContent = value; }
function readHistory() { try { const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } }
function asNumber(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : ''; }
function direction(item) { return item?.unitMode === 'mm-to-in' ? 'mm → inch' : 'inch → mm'; }
function savedAt(item) { const ts = Number(item.createdAt || item.id); return Number.isFinite(ts) ? new Date(ts).toLocaleString('en-GB') : ''; }
function xml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }

function cell(value, type = 'String', style = 'Cell', extra = '') {
  if (value === '' || value == null) return `<Cell ss:StyleID="${style}"${extra}/>`;
  return `<Cell ss:StyleID="${style}"${extra}><Data ss:Type="${type}">${xml(value)}</Data></Cell>`;
}
function formula(formulaText, style = 'Formula') { return `<Cell ss:StyleID="${style}" ss:Formula="${xml(formulaText)}"><Data ss:Type="Number">0</Data></Cell>`; }
function row(cells, attrs = '') { return `<Row${attrs ? ` ${attrs}` : ''}>${cells.join('')}</Row>`; }
function titleRow(text, span) { return row([cell(text, 'String', 'Title', ` ss:MergeAcross="${span - 1}"`)], 'ss:Height="34"'); }
function noteRow(text, span) { return row([cell(text, 'String', 'Note', ` ss:MergeAcross="${span - 1}"`)], 'ss:Height="36"'); }
function headerRow(values) { return row(values.map((v) => cell(v, 'String', 'Header')), 'ss:Height="25"'); }
function hidden() { return 'ss:Hidden="1" ss:OutlineLevel="1"'; }
function blank(span, attrs = '') { return row([cell('', 'String', 'Spacer', ` ss:MergeAcross="${span - 1}"`)], attrs); }

function tolPlusFormula(r) {
  const plus = `R${r}C7`, nominal = `R${r}C8`;
  const plusRound = `ROUND(${plus}*${MM_PER_INCH},2)`;
  const nominalRound = `ROUND(${nominal}*${MM_PER_INCH},2)`;
  const overshoots = `ROUND(${nominalRound}+${plusRound},2)>(${nominal}*${MM_PER_INCH}+${plus}*${MM_PER_INCH})`;
  return `=IF(R${r}C4="inch → mm",IF(${overshoots},IF(${plusRound}>0,${plusRound}-0.01,${plusRound}),${plusRound}),${plus}/${MM_PER_INCH})`;
}
function tolNominalFormula(r) {
  const plus = `R${r}C7`, nominal = `R${r}C8`, minus = `R${r}C9`;
  const plusRound = `ROUND(${plus}*${MM_PER_INCH},2)`;
  const nominalRound = `ROUND(${nominal}*${MM_PER_INCH},2)`;
  const minusRound = `ROUND(${minus}*${MM_PER_INCH},2)`;
  const overshoots = `ROUND(${nominalRound}+${plusRound},2)>(${nominal}*${MM_PER_INCH}+${plus}*${MM_PER_INCH})`;
  const undershoots = `ROUND(${nominalRound}-${minusRound},2)<(${nominal}*${MM_PER_INCH}-${minus}*${MM_PER_INCH})`;
  return `=IF(R${r}C4="inch → mm",${nominalRound}+IF(${overshoots},IF(${plusRound}>0,0,-0.01),0)+IF(${undershoots},IF(${minusRound}>0,0,0.01),0),${nominal}/${MM_PER_INCH})`;
}
function tolMinusFormula(r) {
  const nominal = `R${r}C8`, minus = `R${r}C9`;
  const nominalRound = `ROUND(${nominal}*${MM_PER_INCH},2)`;
  const minusRound = `ROUND(${minus}*${MM_PER_INCH},2)`;
  const undershoots = `ROUND(${nominalRound}-${minusRound},2)<(${nominal}*${MM_PER_INCH}-${minus}*${MM_PER_INCH})`;
  return `=IF(R${r}C4="inch → mm",IF(${undershoots},IF(${minusRound}>0,${minusRound}-0.01,${minusRound}),${minusRound}),${minus}/${MM_PER_INCH})`;
}
function maxFormula(r) {
  const max = `R${r}C6`, rounded = `ROUND(${max}*${MM_PER_INCH},2)`;
  return `=IF(R${r}C3="inch → mm",IF(${rounded}>${max}*${MM_PER_INCH},${rounded}-0.01,${rounded}),${max}/${MM_PER_INCH})`;
}
function minFormula(r) {
  const min = `R${r}C7`, rounded = `ROUND(${min}*${MM_PER_INCH},2)`;
  return `=IF(R${r}C3="inch → mm",IF(${rounded}<${min}*${MM_PER_INCH},${rounded}+0.01,${rounded}),${min}/${MM_PER_INCH})`;
}

function toleranceSummary(item, index, r) {
  const tol = item.values?.tol || {};
  return row([
    cell(index + 1, 'Number', 'Index'), cell(savedAt(item)), cell('Tolerance ±'), cell(direction(item), 'String', 'InputText'),
    formula(`=IF(R${r}C4="inch → mm","in","mm")`, 'FormulaText'), formula(`=IF(R${r}C4="inch → mm","mm","in")`, 'FormulaText'),
    cell(asNumber(tol.positive), 'Number', 'Input'), cell(asNumber(tol.nominal), 'Number', 'Input'), cell(asNumber(tol.negative), 'Number', 'Input'),
    formula(tolPlusFormula(r)), formula(tolNominalFormula(r)), formula(tolMinusFormula(r)),
    formula(`=IF(R${r}C4="inch → mm",ROUND(R${r}C11+R${r}C10,2),R${r}C11+R${r}C10)`, 'BigResult'),
    formula(`=IF(R${r}C4="inch → mm",ROUND(R${r}C11-R${r}C12,2),R${r}C11-R${r}C12)`, 'BigResult'),
    cell('Open +', 'String', 'ShowHint'),
  ], 'ss:Collapsed="1" ss:Height="23"');
}
function toleranceCard(index, r) {
  return [
    row([cell(`Calculation ${index + 1} — Tolerance ±`, 'String', 'CardTitle', ' ss:MergeAcross="14"')], `${hidden()} ss:Height="28"`),
    row([cell('INCH SIDE', 'String', 'InchHeader', ' ss:MergeAcross="6"'), cell('', 'String', 'RedDivider'), cell('MM SIDE', 'String', 'MmHeader', ' ss:MergeAcross="6"')], `${hidden()} ss:Height="28"`),
    row([cell('MAX', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C8+R${r}C7`, 'BigInput', ' ss:MergeAcross="3"'), formula(`=R${r}C5`, 'UnitPill', ' ss:MergeAcross="1"'), cell('', 'String', 'RedDivider'), cell('MAX', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C13`, 'BigResult', ' ss:MergeAcross="3"'), formula(`=R${r}C6`, 'UnitPill', ' ss:MergeAcross="1"')], `${hidden()} ss:Height="32"`),
    row([cell('NOM', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C8`, 'BigInput', ' ss:MergeAcross="3"'), formula(`=R${r}C5`, 'UnitPill', ' ss:MergeAcross="1"'), cell('', 'String', 'RedDivider'), cell('NOM', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C11`, 'BigResult', ' ss:MergeAcross="3"'), formula(`=R${r}C6`, 'UnitPill', ' ss:MergeAcross="1"')], `${hidden()} ss:Height="32"`),
    row([cell('MIN', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C8-R${r}C9`, 'BigInput', ' ss:MergeAcross="3"'), formula(`=R${r}C5`, 'UnitPill', ' ss:MergeAcross="1"'), cell('', 'String', 'RedDivider'), cell('MIN', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C14`, 'BigResult', ' ss:MergeAcross="3"'), formula(`=R${r}C6`, 'UnitPill', ' ss:MergeAcross="1"')], `${hidden()} ss:Height="32"`),
    row([cell('Tolerance +', 'String', 'SmallLabel'), formula(`=R${r}C7`, 'Input'), cell('Tolerance -', 'String', 'SmallLabel'), formula(`=R${r}C9`, 'Input'), cell('Exact conversion uses 25.4', 'String', 'Callout', ' ss:MergeAcross="2"'), cell('', 'String', 'RedDivider'), cell('Tol+ result', 'String', 'SmallLabel'), formula(`=R${r}C10`, 'Formula'), cell('Tol- result', 'String', 'SmallLabel'), formula(`=R${r}C12`, 'Formula'), cell('Safe rounding', 'String', 'Callout', ' ss:MergeAcross="1"')], `${hidden()} ss:Height="28"`),
    blank(15, hidden()),
  ];
}

function maxSummary(item, index, r) {
  const limits = item.values?.limits || {};
  return row([
    cell(index + 1, 'Number', 'Index'), cell(savedAt(item)), cell(direction(item), 'String', 'InputText'),
    formula(`=IF(R${r}C3="inch → mm","in","mm")`, 'FormulaText'), formula(`=IF(R${r}C3="inch → mm","mm","in")`, 'FormulaText'),
    cell(asNumber(limits.max), 'Number', 'Input'), cell(asNumber(limits.min), 'Number', 'Input'),
    formula(maxFormula(r), 'BigResult'), formula(minFormula(r), 'BigResult'),
    formula(`=IF(R${r}C3="inch → mm",ROUND(R${r}C8-R${r}C9,2),R${r}C8-R${r}C9)`, 'BigResult'),
    cell('Open +', 'String', 'ShowHint'),
  ], 'ss:Collapsed="1" ss:Height="23"');
}
function maxCard(index, r) {
  return [
    row([cell(`Calculation ${index + 1} — Maximum / Minimum`, 'String', 'CardTitle', ' ss:MergeAcross="10"')], `${hidden()} ss:Height="28"`),
    row([cell('INCH SIDE', 'String', 'InchHeader', ' ss:MergeAcross="4"'), cell('', 'String', 'RedDivider'), cell('MM SIDE', 'String', 'MmHeader', ' ss:MergeAcross="4"')], `${hidden()} ss:Height="28"`),
    row([cell('MAX', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C6`, 'BigInput', ' ss:MergeAcross="1"'), formula(`=R${r}C4`, 'UnitPill', ' ss:MergeAcross="1"'), cell('', 'String', 'RedDivider'), cell('MAX', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C8`, 'BigResult', ' ss:MergeAcross="1"'), formula(`=R${r}C5`, 'UnitPill', ' ss:MergeAcross="1"')], `${hidden()} ss:Height="32"`),
    row([cell('MIN', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C7`, 'BigInput', ' ss:MergeAcross="1"'), formula(`=R${r}C4`, 'UnitPill', ' ss:MergeAcross="1"'), cell('', 'String', 'RedDivider'), cell('MIN', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C9`, 'BigResult', ' ss:MergeAcross="1"'), formula(`=R${r}C5`, 'UnitPill', ' ss:MergeAcross="1"')], `${hidden()} ss:Height="32"`),
    row([cell('RANGE', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C6-R${r}C7`, 'BigInput', ' ss:MergeAcross="1"'), formula(`=R${r}C4`, 'UnitPill', ' ss:MergeAcross="1"'), cell('', 'String', 'RedDivider'), cell('RANGE', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C10`, 'BigResult', ' ss:MergeAcross="1"'), formula(`=R${r}C5`, 'UnitPill', ' ss:MergeAcross="1"')], `${hidden()} ss:Height="32"`),
    row([cell('Exact max', 'String', 'SmallLabel'), formula(`=IF(R${r}C3="inch → mm",R${r}C6*${MM_PER_INCH},R${r}C6/${MM_PER_INCH})`, 'CardFormula'), cell('Exact min', 'String', 'SmallLabel'), formula(`=IF(R${r}C3="inch → mm",R${r}C7*${MM_PER_INCH},R${r}C7/${MM_PER_INCH})`, 'CardFormula'), cell('', 'String', 'RedDivider'), cell('Safe rounding follows Markulator', 'String', 'Callout', ' ss:MergeAcross="4"')], `${hidden()} ss:Height="28"`),
    blank(11, hidden()),
  ];
}

function sheet(name, columns, rows, split = 4) {
  return `<Worksheet ss:Name="${xml(name)}"><Table>${columns.map((w) => `<Column ss:Width="${w}"/>`).join('')}${rows.join('')}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>${split}</SplitHorizontal><TopRowBottomPane>${split}</TopRowBottomPane><DoNotDisplayGridlines/><OutlineSummaryBelow/></WorksheetOptions></Worksheet>`;
}
function buildTolerance(items) {
  const rows = [titleRow('Tolerance ± History', 15), noteRow('History list: click the + outline on the left of a row to open a calculator block. Blue cells are editable; green cells recalculate.', 15), '<Row/>', headerRow(['#', 'Saved At', 'Mode', 'Direction', 'In Unit', 'Out Unit', 'Tol+ In', 'Nom In', 'Tol- In', 'Tol+ Out', 'Nom Out', 'Tol- Out', 'MAX Out', 'MIN Out', 'Show'])];
  let rNum = 5;
  if (!items.length) rows.push(noteRow('No saved Tolerance ± calculations were available.', 15));
  items.forEach((item, i) => { rows.push(toleranceSummary(item, i, rNum)); const details = toleranceCard(i, rNum); rows.push(...details); rNum += 1 + details.length; });
  return sheet('Tolerance', [38, 118, 92, 96, 70, 76, 82, 92, 82, 90, 100, 90, 94, 94, 110], rows);
}
function buildMaxMin(items) {
  const rows = [titleRow('Maximum / Minimum History', 11), noteRow('History list: click the + outline on the left of a row to open a calculator block. Blue cells are editable; green cells recalculate.', 11), '<Row/>', headerRow(['#', 'Saved At', 'Direction', 'In Unit', 'Out Unit', 'MAX In', 'MIN In', 'MAX Out', 'MIN Out', 'Range', 'Show'])];
  let rNum = 5;
  if (!items.length) rows.push(noteRow('No saved Maximum / Minimum calculations were available.', 11));
  items.forEach((item, i) => { rows.push(maxSummary(item, i, rNum)); const details = maxCard(i, rNum); rows.push(...details); rNum += 1 + details.length; });
  return sheet('Max-Min', [38, 118, 98, 70, 76, 92, 92, 98, 98, 90, 110], rows);
}
function buildMenu(toleranceCount, maxCount) {
  return sheet('Menu', [210, 130, 360], [titleRow('Markulator Excel Calculator Export', 3), noteRow('Two calculator sheets are included. Each sheet is a history list. Open each saved row with the + outline to show the full calculator layout.', 3), '<Row/>', headerRow(['Calculator sheet', 'Saved rows', 'Description']), row([cell('Tolerance ±', 'String', 'Option'), cell(toleranceCount, 'Number', 'BigResult'), cell('Nominal, positive tolerance, negative tolerance, MAX, NOM and MIN calculator block')]), row([cell('Maximum / Minimum', 'String', 'Option'), cell(maxCount, 'Number', 'BigResult'), cell('MAX, MIN and Range calculator block')])], 4);
}
function workbook(history) {
  const usable = history.filter((item) => item?.values && (item.values.tol || item.values.limits));
  const tolerance = usable.filter((item) => item.mode !== 'max-min');
  const maxMin = usable.filter((item) => item.mode === 'max-min');
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>Markulator Calculator Export</Title><Author>Markulator</Author><Created>${new Date().toISOString()}</Created></DocumentProperties><Styles><Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Aptos" ss:Size="10" ss:Color="#172033"/><Alignment ss:Vertical="Center"/></Style><Style ss:ID="Title"><Font ss:Size="18" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/></Style><Style ss:ID="Note"><Font ss:Color="#475569" ss:Italic="1"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/></Style><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E293B" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:WrapText="1"/></Style><Style ss:ID="Cell"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders><Alignment ss:WrapText="1"/></Style><Style ss:ID="Index"><Font ss:Bold="1"/><Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="Input"><NumberFormat ss:Format="0.0000"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C5FD"/></Borders></Style><Style ss:ID="InputText"><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/></Style><Style ss:ID="Formula"><NumberFormat ss:Format="0.0000"/><Font ss:Bold="1" ss:Color="#0F766E"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/></Style><Style ss:ID="FormulaText"><Font ss:Bold="1" ss:Color="#0F766E"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/></Style><Style ss:ID="BigResult"><NumberFormat ss:Format="0.0000"/><Font ss:Size="15" ss:Bold="1" ss:Color="#065F46"/><Interior ss:Color="#A7F3D0" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="BigInput"><NumberFormat ss:Format="0.0000"/><Font ss:Size="15" ss:Bold="1" ss:Color="#1E3A8A"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="ShowHint"><Font ss:Bold="1" ss:Color="#0369A1"/><Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="CardTitle"><Font ss:Size="13" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#111827" ss:Pattern="Solid"/></Style><Style ss:ID="InchHeader"><Font ss:Size="13" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#334155" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="MmHeader"><Font ss:Size="13" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F766E" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="RedDivider"><Interior ss:Color="#DC2626" ss:Pattern="Solid"/></Style><Style ss:ID="BigLabel"><Font ss:Size="16" ss:Bold="1" ss:Color="#111827"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="SmallLabel"><Font ss:Bold="1" ss:Color="#334155"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style><Style ss:ID="UnitPill"><Font ss:Bold="1" ss:Color="#0F172A"/><Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="CardFormula"><NumberFormat ss:Format="0.000000"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style><Style ss:ID="Callout"><Font ss:Bold="1" ss:Color="#92400E"/><Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/></Style><Style ss:ID="Spacer"><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style><Style ss:ID="Option"><Font ss:Size="12" ss:Bold="1"/><Interior ss:Color="#ECFEFF" ss:Pattern="Solid"/></Style></Styles>${buildMenu(tolerance.length, maxMin.length)}${buildTolerance(tolerance)}${buildMaxMin(maxMin)}</Workbook>`;
}
function download(history) { const blob = new Blob([workbook(history)], { type: 'application/vnd.ms-excel;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `Markulator-calculator-history-${new Date().toISOString().slice(0, 10)}.xls`; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1200); }
function flash(button, label, delay = 1250) { const language = lang(); setText(button, label); window.setTimeout(() => { setText(button, LABELS[language].export); button.disabled = false; }, delay); }
function exportClick(event) { event.preventDefault(); event.stopPropagation(); const button = event.currentTarget; const labels = LABELS[lang()]; const history = readHistory(); if (!history.length) { button.disabled = true; flash(button, labels.empty, 1000); return; } try { button.disabled = true; setText(button, labels.working); download(history); flash(button, labels.done, 1400); } catch (error) { console.error('Markulator Excel export failed:', error); flash(button, labels.failed, 1500); } }
function actions(header) { let box = header.querySelector('.history-actions'); if (box) return box; box = document.createElement('div'); box.className = 'history-actions'; const clear = Array.from(header.children).find((child) => child.matches?.('.clear-button')); if (clear) box.appendChild(clear); header.appendChild(box); return box; }
function ensureButton() { scheduled = false; const header = document.querySelector('.history-title'); if (!header) return; const labels = LABELS[lang()]; const box = actions(header); let button = box.querySelector('.history-excel-export-button'); if (!button) { button = document.createElement('button'); button.className = 'clear-button history-excel-export-button'; button.type = 'button'; button.addEventListener('click', exportClick); box.prepend(button); } if (!button.disabled) setText(button, labels.export); button.setAttribute('aria-label', labels.export); }
function schedule() { if (scheduled) return; scheduled = true; window.requestAnimationFrame(ensureButton); }
function bind() { ensureButton(); const root = document.getElementById('root'); if (!root || !('MutationObserver' in window)) return; observer?.disconnect?.(); observer = new MutationObserver((mutations) => { const shouldCheck = mutations.some((mutation) => Array.from(mutation.addedNodes || []).some((node) => node.nodeType === 1 && (node.matches?.('.history-title, .history-drawer-inner') || node.querySelector?.('.history-title, .history-drawer-inner')))); if (shouldCheck) schedule(); }); observer.observe(root, { childList: true, subtree: true }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true }); else bind();
