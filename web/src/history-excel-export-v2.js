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
function n(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : ''; }
function dir(item) { return item?.unitMode === 'mm-to-in' ? 'mm → inch' : 'inch → mm'; }
function date(item) { const ts = Number(item.createdAt || item.id); return Number.isFinite(ts) ? new Date(ts).toLocaleString('en-GB') : ''; }
function xml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }

function c(value, type = 'String', style = 'Cell', extra = '') {
  if (value === '' || value == null) return `<Cell ss:StyleID="${style}"${extra}/>`;
  return `<Cell ss:StyleID="${style}"${extra}><Data ss:Type="${type}">${xml(value)}</Data></Cell>`;
}
function f(formula, style = 'Formula') { return `<Cell ss:StyleID="${style}" ss:Formula="${xml(formula)}"><Data ss:Type="Number">0</Data></Cell>`; }
function r(cells, attrs = '') { return `<Row${attrs ? ` ${attrs}` : ''}>${cells.join('')}</Row>`; }
function title(text, span) { return r([`<Cell ss:StyleID="Title" ss:MergeAcross="${span - 1}"><Data ss:Type="String">${xml(text)}</Data></Cell>`], 'ss:Height="34"'); }
function note(text, span) { return r([`<Cell ss:StyleID="Note" ss:MergeAcross="${span - 1}"><Data ss:Type="String">${xml(text)}</Data></Cell>`], 'ss:Height="36"'); }
function header(values) { return r(values.map((v) => c(v, 'String', 'Header')), 'ss:Height="25"'); }
function hidden() { return 'ss:Hidden="1" ss:OutlineLevel="1"'; }

function tolPlus(row) {
  const p = `R${row}C7`, nom = `R${row}C8`;
  const pr = `ROUND(${p}*${MM_PER_INCH},2)`, nr = `ROUND(${nom}*${MM_PER_INCH},2)`;
  const over = `ROUND(${nr}+${pr},2)>(${nom}*${MM_PER_INCH}+${p}*${MM_PER_INCH})`;
  return `=IF(R${row}C4="inch → mm",IF(${over},IF(${pr}>0,${pr}-0.01,${pr}),${pr}),${p}/${MM_PER_INCH})`;
}
function tolNom(row) {
  const p = `R${row}C7`, nom = `R${row}C8`, neg = `R${row}C9`;
  const pr = `ROUND(${p}*${MM_PER_INCH},2)`, nr = `ROUND(${nom}*${MM_PER_INCH},2)`, mr = `ROUND(${neg}*${MM_PER_INCH},2)`;
  const over = `ROUND(${nr}+${pr},2)>(${nom}*${MM_PER_INCH}+${p}*${MM_PER_INCH})`;
  const under = `ROUND(${nr}-${mr},2)<(${nom}*${MM_PER_INCH}-${neg}*${MM_PER_INCH})`;
  return `=IF(R${row}C4="inch → mm",${nr}+IF(${over},IF(${pr}>0,0,-0.01),0)+IF(${under},IF(${mr}>0,0,0.01),0),${nom}/${MM_PER_INCH})`;
}
function tolMinus(row) {
  const nom = `R${row}C8`, neg = `R${row}C9`;
  const nr = `ROUND(${nom}*${MM_PER_INCH},2)`, mr = `ROUND(${neg}*${MM_PER_INCH},2)`;
  const under = `ROUND(${nr}-${mr},2)<(${nom}*${MM_PER_INCH}-${neg}*${MM_PER_INCH})`;
  return `=IF(R${row}C4="inch → mm",IF(${under},IF(${mr}>0,${mr}-0.01,${mr}),${mr}),${neg}/${MM_PER_INCH})`;
}
function maxFormula(row) {
  const max = `R${row}C6`, rounded = `ROUND(${max}*${MM_PER_INCH},2)`;
  return `=IF(R${row}C3="inch → mm",IF(${rounded}>${max}*${MM_PER_INCH},${rounded}-0.01,${rounded}),${max}/${MM_PER_INCH})`;
}
function minFormula(row) {
  const min = `R${row}C7`, rounded = `ROUND(${min}*${MM_PER_INCH},2)`;
  return `=IF(R${row}C3="inch → mm",IF(${rounded}<${min}*${MM_PER_INCH},${rounded}+0.01,${rounded}),${min}/${MM_PER_INCH})`;
}

function toleranceRow(item, index, rowNumber) {
  const tol = item.values?.tol || {};
  return r([
    c(index + 1, 'Number', 'Index'), c(date(item)), c('Tolerance ±'), c(dir(item), 'String', 'InputText'),
    f(`=IF(R${rowNumber}C4="inch → mm","in","mm")`, 'FormulaText'), f(`=IF(R${rowNumber}C4="inch → mm","mm","in")`, 'FormulaText'),
    c(n(tol.positive), 'Number', 'Input'), c(n(tol.nominal), 'Number', 'Input'), c(n(tol.negative), 'Number', 'Input'),
    f(tolPlus(rowNumber)), f(tolNom(rowNumber)), f(tolMinus(rowNumber)),
    f(`=IF(R${rowNumber}C4="inch → mm",ROUND(R${rowNumber}C11+R${rowNumber}C10,2),R${rowNumber}C11+R${rowNumber}C10)`),
    f(`=IF(R${rowNumber}C4="inch → mm",ROUND(R${rowNumber}C11-R${rowNumber}C12,2),R${rowNumber}C11-R${rowNumber}C12)`),
    c('Open + on the left', 'String', 'ShowHint'),
  ], 'ss:Collapsed="1"');
}
function toleranceDetails(index, rowNumber) {
  return [
    r([c(`Calculation ${index + 1} — Tolerance ±`, 'String', 'CardTitle', ' ss:MergeAcross="14"')], hidden()),
    r([c('INPUT', 'String', 'SideHeader', ' ss:MergeAcross="6"'), c('OUTPUT', 'String', 'SideHeader', ' ss:MergeAcross="7"')], hidden()),
    r([c('Tol+', 'String', 'CardLabel'), f(`=R${rowNumber}C7`, 'Input'), c('Nominal', 'String', 'CardLabel'), f(`=R${rowNumber}C8`, 'Input'), c('Tol-', 'String', 'CardLabel'), f(`=R${rowNumber}C9`, 'Input'), c('Unit', 'String', 'CardLabel'), f(`=R${rowNumber}C5`, 'FormulaText'), c('Tol+ result', 'String', 'CardLabel'), f(`=R${rowNumber}C10`), c('Nominal result', 'String', 'CardLabel'), f(`=R${rowNumber}C11`), c('Tol- result', 'String', 'CardLabel'), f(`=R${rowNumber}C12`), c('', 'String')], hidden()),
    r([c('Exact nominal', 'String', 'CardLabel', ' ss:MergeAcross="2"'), f(`=IF(R${rowNumber}C4="inch → mm",R${rowNumber}C8*${MM_PER_INCH},R${rowNumber}C8/${MM_PER_INCH})`, 'CardFormula'), c('Exact Tol+', 'String', 'CardLabel', ' ss:MergeAcross="2"'), f(`=IF(R${rowNumber}C4="inch → mm",R${rowNumber}C7*${MM_PER_INCH},R${rowNumber}C7/${MM_PER_INCH})`, 'CardFormula'), c('Exact Tol-', 'String', 'CardLabel', ' ss:MergeAcross="2"'), f(`=IF(R${rowNumber}C4="inch → mm",R${rowNumber}C9*${MM_PER_INCH},R${rowNumber}C9/${MM_PER_INCH})`, 'CardFormula'), c('Safe rounding', 'String', 'Callout', ' ss:MergeAcross="1"')], hidden()),
    r([c('Upper limit', 'String', 'CardLabel', ' ss:MergeAcross="5"'), f(`=R${rowNumber}C13`, 'BigResult'), c('Lower limit', 'String', 'CardLabel', ' ss:MergeAcross="5"'), f(`=R${rowNumber}C14`, 'BigResult'), c('Same logic as Markulator', 'String', 'Callout')], hidden()),
    r([c('', 'String', 'Spacer', ' ss:MergeAcross="14"')], hidden()),
  ];
}

function maxRow(item, index, rowNumber) {
  const limits = item.values?.limits || {};
  return r([
    c(index + 1, 'Number', 'Index'), c(date(item)), c(dir(item), 'String', 'InputText'),
    f(`=IF(R${rowNumber}C3="inch → mm","in","mm")`, 'FormulaText'), f(`=IF(R${rowNumber}C3="inch → mm","mm","in")`, 'FormulaText'),
    c(n(limits.max), 'Number', 'Input'), c(n(limits.min), 'Number', 'Input'),
    f(maxFormula(rowNumber)), f(minFormula(rowNumber)), f(`=IF(R${rowNumber}C3="inch → mm",ROUND(R${rowNumber}C8-R${rowNumber}C9,2),R${rowNumber}C8-R${rowNumber}C9)`),
    c('Open + on the left', 'String', 'ShowHint'),
  ], 'ss:Collapsed="1"');
}
function maxDetails(index, rowNumber) {
  return [
    r([c(`Calculation ${index + 1} — Maximum / Minimum`, 'String', 'CardTitle', ' ss:MergeAcross="10"')], hidden()),
    r([c('INPUT', 'String', 'SideHeader', ' ss:MergeAcross="4"'), c('OUTPUT', 'String', 'SideHeader', ' ss:MergeAcross="5"')], hidden()),
    r([c('Max input', 'String', 'CardLabel'), f(`=R${rowNumber}C6`, 'Input'), c('Min input', 'String', 'CardLabel'), f(`=R${rowNumber}C7`, 'Input'), c('Unit', 'String', 'CardLabel'), f(`=R${rowNumber}C4`, 'FormulaText'), c('Max result', 'String', 'CardLabel'), f(`=R${rowNumber}C8`), c('Min result', 'String', 'CardLabel'), f(`=R${rowNumber}C9`), c('Range', 'String', 'CardLabel'), f(`=R${rowNumber}C10`, 'BigResult')], hidden()),
    r([c('Exact max', 'String', 'CardLabel', ' ss:MergeAcross="2"'), f(`=IF(R${rowNumber}C3="inch → mm",R${rowNumber}C6*${MM_PER_INCH},R${rowNumber}C6/${MM_PER_INCH})`, 'CardFormula'), c('Exact min', 'String', 'CardLabel', ' ss:MergeAcross="2"'), f(`=IF(R${rowNumber}C3="inch → mm",R${rowNumber}C7*${MM_PER_INCH},R${rowNumber}C7/${MM_PER_INCH})`, 'CardFormula'), c('Safe rounding follows Markulator', 'String', 'Callout', ' ss:MergeAcross="3"')], hidden()),
    r([c('', 'String', 'Spacer', ' ss:MergeAcross="10"')], hidden()),
  ];
}

function sheet(name, columns, rows) {
  return `<Worksheet ss:Name="${xml(name)}"><Table>${columns.map((w) => `<Column ss:Width="${w}"/>`).join('')}${rows.join('')}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>4</SplitHorizontal><TopRowBottomPane>4</TopRowBottomPane><DoNotDisplayGridlines/></WorksheetOptions></Worksheet>`;
}
function buildTolerance(items) {
  const rows = [title('Tolerance ±', 15), note('Open each calculation with the + outline on the left. The blue cells are editable and the green cells are formulas.', 15), '<Row/>', header(['#', 'Saved At', 'Mode', 'Direction', 'Input Unit', 'Output Unit', 'Tol+ In', 'Nominal In', 'Tol- In', 'Tol+ Out', 'Nominal Out', 'Tol- Out', 'Upper', 'Lower', 'Show'])];
  let rowNumber = 5;
  if (!items.length) rows.push(note('No saved Tolerance ± calculations were available.', 15));
  items.forEach((item, i) => { rows.push(toleranceRow(item, i, rowNumber)); const details = toleranceDetails(i, rowNumber); rows.push(...details); rowNumber += 1 + details.length; });
  return sheet('Tolerance', [36, 116, 92, 96, 72, 78, 82, 94, 82, 92, 102, 92, 92, 92, 145], rows);
}
function buildMax(items) {
  const rows = [title('Maximum / Minimum', 11), note('Open each calculation with the + outline on the left. The blue cells are editable and the green cells are formulas.', 11), '<Row/>', header(['#', 'Saved At', 'Direction', 'Input Unit', 'Output Unit', 'Max In', 'Min In', 'Max Out', 'Min Out', 'Range', 'Show'])];
  let rowNumber = 5;
  if (!items.length) rows.push(note('No saved Maximum / Minimum calculations were available.', 11));
  items.forEach((item, i) => { rows.push(maxRow(item, i, rowNumber)); const details = maxDetails(i, rowNumber); rows.push(...details); rowNumber += 1 + details.length; });
  return sheet('Max-Min', [36, 116, 96, 72, 78, 88, 88, 94, 94, 88, 145], rows);
}
function buildMenu(toleranceCount, maxCount) {
  return sheet('Menu', [190, 130, 330], [title('Markulator Calculator Export', 3), note('Two calculator options are included. Use the + outline in Excel to show the calculation block under each saved result.', 3), '<Row/>', header(['Calculator option', 'Saved rows', 'Where to go']), r([c('Tolerance ±', 'String', 'Option'), c(toleranceCount, 'Number', 'BigResult'), c('Sheet: Tolerance')]), r([c('Maximum / Minimum', 'String', 'Option'), c(maxCount, 'Number', 'BigResult'), c('Sheet: Max-Min')])]);
}
function workbook(history) {
  const usable = history.filter((item) => item?.values && (item.values.tol || item.values.limits));
  const tolerance = usable.filter((item) => item.mode !== 'max-min');
  const max = usable.filter((item) => item.mode === 'max-min');
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>Markulator Calculator Export</Title><Author>Markulator</Author><Created>${new Date().toISOString()}</Created></DocumentProperties><Styles><Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Aptos" ss:Size="10" ss:Color="#172033"/><Alignment ss:Vertical="Center"/></Style><Style ss:ID="Title"><Font ss:Size="18" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/></Style><Style ss:ID="Note"><Font ss:Color="#475569" ss:Italic="1"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/></Style><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E293B" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:WrapText="1"/></Style><Style ss:ID="Cell"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders><Alignment ss:WrapText="1"/></Style><Style ss:ID="Index"><Font ss:Bold="1"/><Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="Input"><NumberFormat ss:Format="0.0000"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/></Style><Style ss:ID="InputText"><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/></Style><Style ss:ID="Formula"><NumberFormat ss:Format="0.0000"/><Font ss:Bold="1" ss:Color="#0F766E"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/></Style><Style ss:ID="FormulaText"><Font ss:Bold="1" ss:Color="#0F766E"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/></Style><Style ss:ID="ShowHint"><Font ss:Bold="1" ss:Color="#0369A1"/><Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/></Style><Style ss:ID="CardTitle"><Font ss:Size="13" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#155E75" ss:Pattern="Solid"/></Style><Style ss:ID="SideHeader"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0E7490" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="CardLabel"><Font ss:Bold="1" ss:Color="#334155"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style><Style ss:ID="CardFormula"><NumberFormat ss:Format="0.000000"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style><Style ss:ID="BigResult"><NumberFormat ss:Format="0.0000"/><Font ss:Size="12" ss:Bold="1" ss:Color="#065F46"/><Interior ss:Color="#A7F3D0" ss:Pattern="Solid"/></Style><Style ss:ID="Callout"><Font ss:Bold="1" ss:Color="#92400E"/><Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/></Style><Style ss:ID="Spacer"><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style><Style ss:ID="Option"><Font ss:Size="12" ss:Bold="1"/><Interior ss:Color="#ECFEFF" ss:Pattern="Solid"/></Style></Styles>${buildMenu(tolerance.length, max.length)}${buildTolerance(tolerance)}${buildMax(max)}</Workbook>`;
}
function download(history) { const blob = new Blob([workbook(history)], { type: 'application/vnd.ms-excel;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `Markulator-calculator-history-${new Date().toISOString().slice(0, 10)}.xls`; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1200); }
function flash(button, label, delay = 1250) { const language = lang(); setText(button, label); window.setTimeout(() => { setText(button, LABELS[language].export); button.disabled = false; }, delay); }
function exportClick(event) { event.preventDefault(); event.stopPropagation(); const button = event.currentTarget; const labels = LABELS[lang()]; const history = readHistory(); if (!history.length) { button.disabled = true; flash(button, labels.empty, 1000); return; } try { button.disabled = true; setText(button, labels.working); download(history); flash(button, labels.done, 1400); } catch (error) { console.error('Markulator Excel export failed:', error); flash(button, labels.failed, 1500); } }
function actions(header) { let box = header.querySelector('.history-actions'); if (box) return box; box = document.createElement('div'); box.className = 'history-actions'; const clear = Array.from(header.children).find((child) => child.matches?.('.clear-button')); if (clear) box.appendChild(clear); header.appendChild(box); return box; }
function ensureButton() { scheduled = false; const header = document.querySelector('.history-title'); if (!header) return; const labels = LABELS[lang()]; const box = actions(header); let button = box.querySelector('.history-excel-export-button'); if (!button) { button = document.createElement('button'); button.className = 'clear-button history-excel-export-button'; button.type = 'button'; button.addEventListener('click', exportClick); box.prepend(button); } if (!button.disabled) setText(button, labels.export); button.setAttribute('aria-label', labels.export); }
function schedule() { if (scheduled) return; scheduled = true; window.requestAnimationFrame(ensureButton); }
function bind() { ensureButton(); const root = document.getElementById('root'); if (!root || !('MutationObserver' in window)) return; observer?.disconnect?.(); observer = new MutationObserver((mutations) => { const shouldCheck = mutations.some((mutation) => Array.from(mutation.addedNodes || []).some((node) => node.nodeType === 1 && (node.matches?.('.history-title, .history-drawer-inner') || node.querySelector?.('.history-title, .history-drawer-inner')))); if (shouldCheck) schedule(); }); observer.observe(root, { childList: true, subtree: true }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true }); else bind();
