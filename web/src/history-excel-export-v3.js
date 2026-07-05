const HISTORY_KEY = 'markulator-history-v1';
const MM_PER_INCH = 25.4;

const LABELS = {
  he: { export: 'ייצוא לאקסל', working: 'יוצר קובץ...', done: 'קובץ נוצר', empty: 'אין היסטוריה', failed: 'שגיאה בייצוא' },
  en: { export: 'Export Excel', working: 'Creating...', done: 'Excel ready', empty: 'No history', failed: 'Export failed' },
};

let scheduled = false;
let observer = null;

const xml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const language = () => document.documentElement.lang === 'en' ? 'en' : 'he';
const numberValue = (value) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : ''; };
const direction = (item) => item?.unitMode === 'mm-to-in' ? 'mm → inch' : 'inch → mm';
const dateText = (item) => { const ts = Number(item.createdAt || item.id); return Number.isFinite(ts) ? new Date(ts).toLocaleString('en-GB') : ''; };

function setButtonText(button, value) { if (button.textContent !== value) button.textContent = value; }
function readHistory() { try { const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }

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
function row(cells, attrs = '') { return `<Row${attrs ? ` ${attrs}` : ''}>${cells.join('')}</Row>`; }
function merged(text, span, style, attrs = '') { return row([cell(text, 'String', style, ` ss:MergeAcross="${span - 1}"`)], attrs); }
function header(values) { return row(values.map((value) => cell(value, 'String', 'Header')), 'ss:Height="26"'); }
function hiddenAttrs() { return 'ss:Hidden="1" ss:OutlineLevel="1"'; }
function blank(span, attrs = '') { return merged('', span, 'Spacer', attrs); }

function tolPlus(r) {
  const p = `R${r}C7`, n = `R${r}C8`;
  const pr = `ROUND(${p}*${MM_PER_INCH},2)`, nr = `ROUND(${n}*${MM_PER_INCH},2)`;
  const over = `ROUND(${nr}+${pr},2)>(${n}*${MM_PER_INCH}+${p}*${MM_PER_INCH})`;
  return `=IF(R${r}C4="inch → mm",IF(${over},IF(${pr}>0,${pr}-0.01,${pr}),${pr}),${p}/${MM_PER_INCH})`;
}
function tolNom(r) {
  const p = `R${r}C7`, n = `R${r}C8`, m = `R${r}C9`;
  const pr = `ROUND(${p}*${MM_PER_INCH},2)`, nr = `ROUND(${n}*${MM_PER_INCH},2)`, mr = `ROUND(${m}*${MM_PER_INCH},2)`;
  const over = `ROUND(${nr}+${pr},2)>(${n}*${MM_PER_INCH}+${p}*${MM_PER_INCH})`;
  const under = `ROUND(${nr}-${mr},2)<(${n}*${MM_PER_INCH}-${m}*${MM_PER_INCH})`;
  return `=IF(R${r}C4="inch → mm",${nr}+IF(${over},IF(${pr}>0,0,-0.01),0)+IF(${under},IF(${mr}>0,0,0.01),0),${n}/${MM_PER_INCH})`;
}
function tolMinus(r) {
  const n = `R${r}C8`, m = `R${r}C9`;
  const nr = `ROUND(${n}*${MM_PER_INCH},2)`, mr = `ROUND(${m}*${MM_PER_INCH},2)`;
  const under = `ROUND(${nr}-${mr},2)<(${n}*${MM_PER_INCH}-${m}*${MM_PER_INCH})`;
  return `=IF(R${r}C4="inch → mm",IF(${under},IF(${mr}>0,${mr}-0.01,${mr}),${mr}),${m}/${MM_PER_INCH})`;
}
function maxOut(r) {
  const max = `R${r}C6`, rounded = `ROUND(${max}*${MM_PER_INCH},2)`;
  return `=IF(R${r}C3="inch → mm",IF(${rounded}>${max}*${MM_PER_INCH},${rounded}-0.01,${rounded}),${max}/${MM_PER_INCH})`;
}
function minOut(r) {
  const min = `R${r}C7`, rounded = `ROUND(${min}*${MM_PER_INCH},2)`;
  return `=IF(R${r}C3="inch → mm",IF(${rounded}<${min}*${MM_PER_INCH},${rounded}+0.01,${rounded}),${min}/${MM_PER_INCH})`;
}

function toleranceSummary(item, index, r) {
  const tol = item.values?.tol || {};
  return row([
    cell(`OPEN ${index + 1}`, 'String', 'OpenIndex'), cell(dateText(item)), cell('Tolerance ±'), cell(direction(item), 'String', 'InputText'),
    textFormula(`=IF(R${r}C4="inch → mm","in","mm")`), textFormula(`=IF(R${r}C4="inch → mm","mm","in")`),
    cell(numberValue(tol.positive), 'Number', 'Input'), cell(numberValue(tol.nominal), 'Number', 'Input'), cell(numberValue(tol.negative), 'Number', 'Input'),
    formula(tolPlus(r)), formula(tolNom(r)), formula(tolMinus(r)),
    formula(`=IF(R${r}C4="inch → mm",ROUND(R${r}C11+R${r}C10,2),R${r}C11+R${r}C10)`, 'BigResult'),
    formula(`=IF(R${r}C4="inch → mm",ROUND(R${r}C11-R${r}C12,2),R${r}C11-R${r}C12)`, 'BigResult'),
    cell('Click the Excel + in the row margin', 'String', 'ShowHint'),
  ], 'ss:Collapsed="1" ss:Height="27"');
}
function toleranceOpenHint(index) {
  return row([
    cell('↳', 'String', 'OpenGuide'),
    cell(`Calculation ${index + 1} is hidden below this row`, 'String', 'OpenGuide', ' ss:MergeAcross="5"'),
    cell('Use the + button in the far-left Excel outline margin, or Data → Show Detail', 'String', 'OpenGuide', ' ss:MergeAcross="8"'),
  ], 'ss:Height="25"');
}
function toleranceCard(index, r) {
  const h = hiddenAttrs();
  return [
    row([cell(`Calculation ${index + 1} — Tolerance ±`, 'String', 'CardTitle', ' ss:MergeAcross="14"')], `${h} ss:Height="30"`),
    row([cell('INCH SIDE', 'String', 'InchHeader', ' ss:MergeAcross="6"'), cell('', 'String', 'RedDivider'), cell('MM SIDE', 'String', 'MmHeader', ' ss:MergeAcross="6"')], `${h} ss:Height="30"`),
    row([cell('MAX', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C8+R${r}C7`, 'BigInput', ' ss:MergeAcross="3"'), textFormula(`=R${r}C5`, 'UnitPill', ' ss:MergeAcross="1"'), cell('', 'String', 'RedDivider'), cell('MAX', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C13`, 'BigResult', ' ss:MergeAcross="3"'), textFormula(`=R${r}C6`, 'UnitPill', ' ss:MergeAcross="1"')], `${h} ss:Height="36"`),
    row([cell('NOM', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C8`, 'BigInput', ' ss:MergeAcross="3"'), textFormula(`=R${r}C5`, 'UnitPill', ' ss:MergeAcross="1"'), cell('', 'String', 'RedDivider'), cell('NOM', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C11`, 'BigResult', ' ss:MergeAcross="3"'), textFormula(`=R${r}C6`, 'UnitPill', ' ss:MergeAcross="1"')], `${h} ss:Height="36"`),
    row([cell('MIN', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C8-R${r}C9`, 'BigInput', ' ss:MergeAcross="3"'), textFormula(`=R${r}C5`, 'UnitPill', ' ss:MergeAcross="1"'), cell('', 'String', 'RedDivider'), cell('MIN', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C14`, 'BigResult', ' ss:MergeAcross="3"'), textFormula(`=R${r}C6`, 'UnitPill', ' ss:MergeAcross="1"')], `${h} ss:Height="36"`),
    row([cell('Tol +', 'String', 'SmallLabel'), formula(`=R${r}C7`, 'Input'), cell('Tol -', 'String', 'SmallLabel'), formula(`=R${r}C9`, 'Input'), cell('Exact conversion uses 25.4', 'String', 'Callout', ' ss:MergeAcross="2"'), cell('', 'String', 'RedDivider'), cell('Tol+ result', 'String', 'SmallLabel'), formula(`=R${r}C10`, 'Formula'), cell('Tol- result', 'String', 'SmallLabel'), formula(`=R${r}C12`, 'Formula'), cell('Safe rounding', 'String', 'Callout', ' ss:MergeAcross="1"')], `${h} ss:Height="30"`),
    blank(15, h),
  ];
}

function maxSummary(item, index, r) {
  const limits = item.values?.limits || {};
  return row([
    cell(`OPEN ${index + 1}`, 'String', 'OpenIndex'), cell(dateText(item)), cell(direction(item), 'String', 'InputText'),
    textFormula(`=IF(R${r}C3="inch → mm","in","mm")`), textFormula(`=IF(R${r}C3="inch → mm","mm","in")`),
    cell(numberValue(limits.max), 'Number', 'Input'), cell(numberValue(limits.min), 'Number', 'Input'),
    formula(maxOut(r), 'BigResult'), formula(minOut(r), 'BigResult'), formula(`=IF(R${r}C3="inch → mm",ROUND(R${r}C8-R${r}C9,2),R${r}C8-R${r}C9)`, 'BigResult'),
    cell('Click the Excel + in the row margin', 'String', 'ShowHint'),
  ], 'ss:Collapsed="1" ss:Height="27"');
}
function maxOpenHint(index) {
  return row([
    cell('↳', 'String', 'OpenGuide'),
    cell(`Calculation ${index + 1} is hidden below this row`, 'String', 'OpenGuide', ' ss:MergeAcross="4"'),
    cell('Use the + button in the far-left Excel outline margin, or Data → Show Detail', 'String', 'OpenGuide', ' ss:MergeAcross="5"'),
  ], 'ss:Height="25"');
}
function maxCard(index, r) {
  const h = hiddenAttrs();
  return [
    row([cell(`Calculation ${index + 1} — Maximum / Minimum`, 'String', 'CardTitle', ' ss:MergeAcross="10"')], `${h} ss:Height="30"`),
    row([cell('INCH SIDE', 'String', 'InchHeader', ' ss:MergeAcross="4"'), cell('', 'String', 'RedDivider'), cell('MM SIDE', 'String', 'MmHeader', ' ss:MergeAcross="4"')], `${h} ss:Height="30"`),
    row([cell('MAX', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C6`, 'BigInput', ' ss:MergeAcross="1"'), textFormula(`=R${r}C4`, 'UnitPill', ' ss:MergeAcross="1"'), cell('', 'String', 'RedDivider'), cell('MAX', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C8`, 'BigResult', ' ss:MergeAcross="1"'), textFormula(`=R${r}C5`, 'UnitPill', ' ss:MergeAcross="1"')], `${h} ss:Height="36"`),
    row([cell('MIN', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C7`, 'BigInput', ' ss:MergeAcross="1"'), textFormula(`=R${r}C4`, 'UnitPill', ' ss:MergeAcross="1"'), cell('', 'String', 'RedDivider'), cell('MIN', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C9`, 'BigResult', ' ss:MergeAcross="1"'), textFormula(`=R${r}C5`, 'UnitPill', ' ss:MergeAcross="1"')], `${h} ss:Height="36"`),
    row([cell('RANGE', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C6-R${r}C7`, 'BigInput', ' ss:MergeAcross="1"'), textFormula(`=R${r}C4`, 'UnitPill', ' ss:MergeAcross="1"'), cell('', 'String', 'RedDivider'), cell('RANGE', 'String', 'BigLabel', ' ss:MergeAcross="1"'), formula(`=R${r}C10`, 'BigResult', ' ss:MergeAcross="1"'), textFormula(`=R${r}C5`, 'UnitPill', ' ss:MergeAcross="1"')], `${h} ss:Height="36"`),
    row([cell('Exact max', 'String', 'SmallLabel'), formula(`=IF(R${r}C3="inch → mm",R${r}C6*${MM_PER_INCH},R${r}C6/${MM_PER_INCH})`, 'CardFormula'), cell('Exact min', 'String', 'SmallLabel'), formula(`=IF(R${r}C3="inch → mm",R${r}C7*${MM_PER_INCH},R${r}C7/${MM_PER_INCH})`, 'CardFormula'), cell('', 'String', 'RedDivider'), cell('Safe rounding follows Markulator', 'String', 'Callout', ' ss:MergeAcross="4"')], `${h} ss:Height="30"`),
    blank(11, h),
  ];
}

function worksheet(name, columns, rows, split = 4) {
  return `<Worksheet ss:Name="${xml(name)}"><Table>${columns.map((w) => `<Column ss:Width="${w}"/>`).join('')}${rows.join('')}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>${split}</SplitHorizontal><TopRowBottomPane>${split}</TopRowBottomPane><DoNotDisplayGridlines/><ShowOutlineSymbols/><OutlineSummaryBelow>False</OutlineSummaryBelow></WorksheetOptions></Worksheet>`;
}
function toleranceSheet(items) {
  const rows = [merged('Tolerance ± History', 15, 'Title', 'ss:Height="34"'), merged('History list. Each OPEN row has a visible guide row below it. Click the small + in the far-left Excel row margin, or use Data → Show Detail.', 15, 'Note', 'ss:Height="42"'), '<Row/>', header(['Open', 'Saved At', 'Mode', 'Direction', 'In Unit', 'Out Unit', 'Tol+ In', 'Nom In', 'Tol- In', 'Tol+ Out', 'Nom Out', 'Tol- Out', 'MAX Out', 'MIN Out', 'Open help'])];
  let rNum = 5;
  if (!items.length) rows.push(merged('No saved Tolerance ± calculations were available.', 15, 'Note'));
  items.forEach((item, index) => { rows.push(toleranceSummary(item, index, rNum), toleranceOpenHint(index)); const card = toleranceCard(index, rNum); rows.push(...card); rNum += 2 + card.length; });
  return worksheet('Tolerance', [68, 118, 92, 96, 70, 76, 82, 92, 82, 90, 100, 90, 94, 94, 220], rows);
}
function maxMinSheet(items) {
  const rows = [merged('Maximum / Minimum History', 11, 'Title', 'ss:Height="34"'), merged('History list. Each OPEN row has a visible guide row below it. Click the small + in the far-left Excel row margin, or use Data → Show Detail.', 11, 'Note', 'ss:Height="42"'), '<Row/>', header(['Open', 'Saved At', 'Direction', 'In Unit', 'Out Unit', 'MAX In', 'MIN In', 'MAX Out', 'MIN Out', 'Range', 'Open help'])];
  let rNum = 5;
  if (!items.length) rows.push(merged('No saved Maximum / Minimum calculations were available.', 11, 'Note'));
  items.forEach((item, index) => { rows.push(maxSummary(item, index, rNum), maxOpenHint(index)); const card = maxCard(index, rNum); rows.push(...card); rNum += 2 + card.length; });
  return worksheet('Max-Min', [68, 118, 98, 70, 76, 92, 92, 98, 98, 90, 220], rows);
}
function menuSheet(tolCount, maxCount) {
  return worksheet('Menu', [230, 130, 470], [merged('Markulator Excel Calculator Export', 3, 'Title', 'ss:Height="34"'), merged('First click Enable Editing. Then open Tolerance or Max-Min. Each saved calculation has an OPEN row, a visible guide row, and a hidden calculator block underneath.', 3, 'Note', 'ss:Height="44"'), '<Row/>', header(['Calculator sheet', 'Saved rows', 'Description']), row([cell('Tolerance ±', 'String', 'Option'), cell(tolCount, 'Number', 'BigResult'), cell('History list with expandable MAX / NOM / MIN calculator cards')]), row([cell('Maximum / Minimum', 'String', 'Option'), cell(maxCount, 'Number', 'BigResult'), cell('History list with expandable MAX / MIN / RANGE calculator cards')])], 4);
}
function workbook(history) {
  const usable = history.filter((item) => item?.values && (item.values.tol || item.values.limits));
  const tolerance = usable.filter((item) => item.mode !== 'max-min');
  const maxMin = usable.filter((item) => item.mode === 'max-min');
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>Markulator Calculator Export</Title><Author>Markulator</Author><Created>${new Date().toISOString()}</Created></DocumentProperties><Styles><Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Aptos" ss:Size="10" ss:Color="#172033"/><Alignment ss:Vertical="Center"/></Style><Style ss:ID="Title"><Font ss:Size="18" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style><Style ss:ID="Note"><Font ss:Color="#475569" ss:Italic="1"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Alignment ss:WrapText="1" ss:Vertical="Center"/></Style><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E293B" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/></Borders></Style><Style ss:ID="Cell"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders><Alignment ss:WrapText="1"/></Style><Style ss:ID="OpenIndex"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0284C7" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0369A1"/></Borders></Style><Style ss:ID="OpenGuide"><Font ss:Bold="1" ss:Color="#0369A1"/><Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#38BDF8"/></Borders></Style><Style ss:ID="Input"><NumberFormat ss:Format="0.0000"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#60A5FA"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#60A5FA"/></Borders><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="InputText"><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#60A5FA"/></Borders></Style><Style ss:ID="Formula"><NumberFormat ss:Format="0.0000"/><Font ss:Bold="1" ss:Color="#0F766E"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4ADE80"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4ADE80"/></Borders><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="FormulaText"><Font ss:Bold="1" ss:Color="#0F766E"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style><Style ss:ID="BigResult"><NumberFormat ss:Format="0.0000"/><Font ss:Size="15" ss:Bold="1" ss:Color="#065F46"/><Interior ss:Color="#A7F3D0" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#047857"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/></Borders></Style><Style ss:ID="BigInput"><NumberFormat ss:Format="0.0000"/><Font ss:Size="15" ss:Bold="1" ss:Color="#1E3A8A"/><Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#2563EB"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563EB"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#2563EB"/></Borders></Style><Style ss:ID="ShowHint"><Font ss:Bold="1" ss:Color="#0369A1"/><Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:WrapText="1"/></Style><Style ss:ID="CardTitle"><Font ss:Size="13" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#111827" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#111827"/></Borders></Style><Style ss:ID="InchHeader"><Font ss:Size="13" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#334155" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#334155"/></Borders></Style><Style ss:ID="MmHeader"><Font ss:Size="13" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F766E" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F766E"/></Borders></Style><Style ss:ID="RedDivider"><Interior ss:Color="#DC2626" ss:Pattern="Solid"/><Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#991B1B"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#991B1B"/></Borders></Style><Style ss:ID="BigLabel"><Font ss:Size="16" ss:Bold="1" ss:Color="#111827"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/></Borders></Style><Style ss:ID="SmallLabel"><Font ss:Bold="1" ss:Color="#334155"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders></Style><Style ss:ID="UnitPill"><Font ss:Bold="1" ss:Color="#0F172A"/><Interior ss:Color="#E2E8F0" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/></Borders></Style><Style ss:ID="CardFormula"><NumberFormat ss:Format="0.000000"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders></Style><Style ss:ID="Callout"><Font ss:Bold="1" ss:Color="#92400E"/><Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/></Borders></Style><Style ss:ID="Spacer"><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style><Style ss:ID="Option"><Font ss:Size="12" ss:Bold="1"/><Interior ss:Color="#ECFEFF" ss:Pattern="Solid"/></Style></Styles>${menuSheet(tolerance.length, maxMin.length)}${toleranceSheet(tolerance)}${maxMinSheet(maxMin)}</Workbook>`;
}
function download(history) { const blob = new Blob([workbook(history)], { type: 'application/vnd.ms-excel;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `Markulator-calculator-history-${new Date().toISOString().slice(0, 10)}.xls`; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1200); }
function flash(button, label, delay = 1250) { const currentLanguage = language(); setButtonText(button, label); window.setTimeout(() => { setButtonText(button, LABELS[currentLanguage].export); button.disabled = false; }, delay); }
function exportClick(event) { event.preventDefault(); event.stopPropagation(); const button = event.currentTarget; const labels = LABELS[language()]; const history = readHistory(); if (!history.length) { button.disabled = true; flash(button, labels.empty, 1000); return; } try { button.disabled = true; setButtonText(button, labels.working); download(history); flash(button, labels.done, 1400); } catch (error) { console.error('Markulator Excel export failed:', error); flash(button, labels.failed, 1500); } }
function actions(header) { let box = header.querySelector('.history-actions'); if (box) return box; box = document.createElement('div'); box.className = 'history-actions'; const clear = Array.from(header.children).find((child) => child.matches?.('.clear-button')); if (clear) box.appendChild(clear); header.appendChild(box); return box; }
function ensureButton() { scheduled = false; const header = document.querySelector('.history-title'); if (!header) return; const labels = LABELS[language()]; const box = actions(header); let button = box.querySelector('.history-excel-export-button'); if (!button) { button = document.createElement('button'); button.className = 'clear-button history-excel-export-button'; button.type = 'button'; button.addEventListener('click', exportClick); box.prepend(button); } if (!button.disabled) setButtonText(button, labels.export); button.setAttribute('aria-label', labels.export); }
function schedule() { if (scheduled) return; scheduled = true; window.requestAnimationFrame(ensureButton); }
function bind() { ensureButton(); const root = document.getElementById('root'); if (!root || !('MutationObserver' in window)) return; observer?.disconnect?.(); observer = new MutationObserver((mutations) => { const shouldCheck = mutations.some((mutation) => Array.from(mutation.addedNodes || []).some((node) => node.nodeType === 1 && (node.matches?.('.history-title, .history-drawer-inner') || node.querySelector?.('.history-title, .history-drawer-inner')))); if (shouldCheck) schedule(); }); observer.observe(root, { childList: true, subtree: true }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true }); else bind();
