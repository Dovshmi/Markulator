const HISTORY_KEY = 'markulator-history-v1';
const MM_PER_INCH = 25.4;

const LABELS = {
  he: { export: 'ייצוא לאקסל', working: 'יוצר קובץ...', done: 'קובץ נוצר', empty: 'אין היסטוריה', failed: 'שגיאה בייצוא' },
  en: { export: 'Export Excel', working: 'Creating...', done: 'Excel ready', empty: 'No history', failed: 'Export failed' },
};

function getLanguage() {
  return document.documentElement.lang === 'en' ? 'en' : 'he';
}

function readHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function xml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function dateText(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return '';
  try {
    return new Date(timestamp).toLocaleString('en-GB', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return new Date(timestamp).toISOString();
  }
}

function num(value) {
  if (value === '' || value == null) return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : '';
}

function direction(item) {
  return item?.unitMode === 'mm-to-in' ? 'mm → inch' : 'inch → mm';
}

function cell(value, type = 'String', style = 'Cell') {
  if (value === '' || value == null) return `<Cell ss:StyleID="${style}"/>`;
  return `<Cell ss:StyleID="${style}"><Data ss:Type="${type}">${xml(value)}</Data></Cell>`;
}

function formulaCell(formula, style = 'Formula') {
  return `<Cell ss:StyleID="${style}" ss:Formula="${xml(formula)}"><Data ss:Type="Number">0</Data></Cell>`;
}

function headerRow(values) {
  return `<Row ss:Height="24">${values.map((value) => cell(value, 'String', 'Header')).join('')}</Row>`;
}

function titleRow(title, span) {
  return `<Row ss:Height="30"><Cell ss:StyleID="Title" ss:MergeAcross="${span - 1}"><Data ss:Type="String">${xml(title)}</Data></Cell></Row>`;
}

function noteRow(text, span) {
  return `<Row ss:Height="34"><Cell ss:StyleID="Note" ss:MergeAcross="${span - 1}"><Data ss:Type="String">${xml(text)}</Data></Cell></Row>`;
}

function toleranceOutputFormulas() {
  const p = 'RC[-3]';
  const n = 'RC[-2]';
  const m = 'RC[-1]';
  const pr = `ROUND(${p}*${MM_PER_INCH},2)`;
  const nr = `ROUND(${n}*${MM_PER_INCH},2)`;
  const mr = `ROUND(${m}*${MM_PER_INCH},2)`;
  const plusOver = `ROUND(${nr}+${pr},2)>(${n}*${MM_PER_INCH}+${p}*${MM_PER_INCH})`;
  return `=IF(RC[-6]="inch → mm",IF(${plusOver},IF(${pr}>0,${pr}-0.01,${pr}),${pr}),${p}/${MM_PER_INCH})`;
}

function toleranceNominalFormula() {
  const p = 'RC[-4]';
  const n = 'RC[-3]';
  const m = 'RC[-2]';
  const pr = `ROUND(${p}*${MM_PER_INCH},2)`;
  const nr = `ROUND(${n}*${MM_PER_INCH},2)`;
  const mr = `ROUND(${m}*${MM_PER_INCH},2)`;
  const plusOver = `ROUND(${nr}+${pr},2)>(${n}*${MM_PER_INCH}+${p}*${MM_PER_INCH})`;
  const minUnder = `ROUND(${nr}-${mr},2)<(${n}*${MM_PER_INCH}-${m}*${MM_PER_INCH})`;
  return `=IF(RC[-7]="inch → mm",${nr}+IF(${plusOver},IF(${pr}>0,0,-0.01),0)+IF(${minUnder},IF(${mr}>0,0,0.01),0),${n}/${MM_PER_INCH})`;
}

function toleranceMinusFormula() {
  const n = 'RC[-4]';
  const m = 'RC[-3]';
  const nr = `ROUND(${n}*${MM_PER_INCH},2)`;
  const mr = `ROUND(${m}*${MM_PER_INCH},2)`;
  const minUnder = `ROUND(${nr}-${mr},2)<(${n}*${MM_PER_INCH}-${m}*${MM_PER_INCH})`;
  return `=IF(RC[-8]="inch → mm",IF(${minUnder},IF(${mr}>0,${mr}-0.01,${mr}),${mr}),${m}/${MM_PER_INCH})`;
}

function toleranceRow(item, index) {
  const tol = item.values?.tol || {};
  return `<Row>
    ${cell(index + 1, 'Number')}
    ${cell(dateText(item.createdAt || item.id), 'String')}
    ${cell('Tolerance ±', 'String')}
    ${cell(direction(item), 'String', 'InputText')}
    ${formulaCell('=IF(RC[-1]="inch → mm","in","mm")')}
    ${formulaCell('=IF(RC[-2]="inch → mm","mm","in")')}
    ${cell(num(tol.positive), 'Number', 'Input')}
    ${cell(num(tol.nominal), 'Number', 'Input')}
    ${cell(num(tol.negative), 'Number', 'Input')}
    ${formulaCell(toleranceOutputFormulas())}
    ${formulaCell(toleranceNominalFormula())}
    ${formulaCell(toleranceMinusFormula())}
    ${formulaCell('=IF(RC[-9]="inch → mm",ROUND(RC[-2]+RC[-3],2),RC[-2]+RC[-3])')}
    ${formulaCell('=IF(RC[-10]="inch → mm",ROUND(RC[-3]-RC[-2],2),RC[-3]-RC[-2])')}
  </Row>`;
}

function maxMinRow(item, index) {
  const limits = item.values?.limits || {};
  const maxRounded = `ROUND(RC[-2]*${MM_PER_INCH},2)`;
  const minRounded = `ROUND(RC[-2]*${MM_PER_INCH},2)`;
  return `<Row>
    ${cell(index + 1, 'Number')}
    ${cell(dateText(item.createdAt || item.id), 'String')}
    ${cell('Maximum / Minimum', 'String')}
    ${cell(direction(item), 'String', 'InputText')}
    ${formulaCell('=IF(RC[-1]="inch → mm","in","mm")')}
    ${formulaCell('=IF(RC[-2]="inch → mm","mm","in")')}
    ${cell(num(limits.max), 'Number', 'Input')}
    ${cell(num(limits.min), 'Number', 'Input')}
    ${formulaCell(`=IF(RC[-5]="inch → mm",IF(${maxRounded}>RC[-2]*${MM_PER_INCH},${maxRounded}-0.01,${maxRounded}),RC[-2]/${MM_PER_INCH})`)}
    ${formulaCell(`=IF(RC[-6]="inch → mm",IF(${minRounded}<RC[-2]*${MM_PER_INCH},${minRounded}+0.01,${minRounded}),RC[-2]/${MM_PER_INCH})`)}
    ${formulaCell('=IF(RC[-7]="inch → mm",ROUND(RC[-2]-RC[-1],2),RC[-2]-RC[-1])')}
  </Row>`;
}

function worksheet(name, columns, rows) {
  return `<Worksheet ss:Name="${xml(name)}"><Table>
    ${columns.map((width) => `<Column ss:Width="${width}"/>`).join('')}
    ${rows.join('')}
  </Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>4</SplitHorizontal><TopRowBottomPane>4</TopRowBottomPane></WorksheetOptions></Worksheet>`;
}

function buildWorkbook(history) {
  const usable = history.filter((item) => item?.values && (item.values.tol || item.values.limits));
  const tolerance = usable.filter((item) => item.mode !== 'max-min');
  const maxMin = usable.filter((item) => item.mode === 'max-min');
  const created = new Date().toISOString().slice(0, 10);

  const summary = worksheet('Summary', [230, 90, 120, 120], [
    titleRow('Markulator History Export', 4),
    noteRow('Modern Excel export with editable inputs and live formulas based on the Markulator calculator logic.', 4),
    '<Row/>',
    headerRow(['Metric', 'Value', 'Release', 'Created']),
    `<Row>${cell('Total exported rows')}${cell(usable.length, 'Number', 'Formula')}${cell('Web v1.0')}${cell(created)}</Row>`,
    `<Row>${cell('Tolerance ± rows')}${cell(tolerance.length, 'Number', 'Formula')}${cell('Formula-driven')}${cell('')}</Row>`,
    `<Row>${cell('Max/Min rows')}${cell(maxMin.length, 'Number', 'Formula')}${cell('Formula-driven')}${cell('')}</Row>`,
    '<Row/>',
    noteRow('Edit the blue input cells in the calculator sheets. Green cells recalculate automatically. inch → mm uses Markulator protective rounding logic.', 4),
  ]);

  const toleranceSheet = worksheet('Tolerance History', [40, 115, 115, 95, 75, 80, 85, 100, 85, 95, 105, 95, 95, 95], [
    titleRow('Tolerance ± History', 14),
    noteRow('Blue cells are editable. Green cells contain Excel formulas that mirror Markulator.', 14),
    '<Row/>',
    headerRow(['#', 'Saved At', 'Mode', 'Direction', 'Input Unit', 'Output Unit', 'Tol+ Input', 'Nominal Input', 'Tol- Input', 'Tol+ Output', 'Nominal Output', 'Tol- Output', 'Upper Limit', 'Lower Limit']),
    ...(tolerance.length ? tolerance.map(toleranceRow) : [noteRow('No saved Tolerance ± calculations were available at export time.', 14)]),
  ]);

  const maxMinSheet = worksheet('Max-Min History', [40, 115, 125, 95, 75, 80, 90, 90, 95, 95, 90], [
    titleRow('Maximum / Minimum History', 11),
    noteRow('Blue cells are editable. Green cells contain Excel formulas that mirror Markulator.', 11),
    '<Row/>',
    headerRow(['#', 'Saved At', 'Mode', 'Direction', 'Input Unit', 'Output Unit', 'Max Input', 'Min Input', 'Max Output', 'Min Output', 'Range']),
    ...(maxMin.length ? maxMin.map(maxMinRow) : [noteRow('No saved Maximum / Minimum calculations were available at export time.', 11)]),
  ]);

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>Markulator History Export</Title><Author>Markulator</Author><Created>${new Date().toISOString()}</Created></DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Aptos" ss:Size="11" ss:Color="#0F172A"/><Alignment ss:Vertical="Center"/></Style>
    <Style ss:ID="Title"><Font ss:FontName="Aptos Display" ss:Size="18" ss:Bold="1" ss:Color="#0F172A"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Note"><Font ss:Color="#64748B" ss:Italic="1"/><Alignment ss:WrapText="1" ss:Vertical="Top"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders></Style>
    <Style ss:ID="Cell"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
    <Style ss:ID="Input"><NumberFormat ss:Format="0.0000"/><Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders></Style>
    <Style ss:ID="InputText"><Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders></Style>
    <Style ss:ID="Formula"><NumberFormat ss:Format="0.0000"/><Font ss:Bold="1" ss:Color="#0F766E"/><Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders></Style>
  </Styles>
  ${summary}
  ${toleranceSheet}
  ${maxMinSheet}
</Workbook>`;
}

function downloadExcel(history) {
  const workbookXml = buildWorkbook(history);
  const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Markulator-history-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function flashButton(button, label, delay = 1250) {
  const language = getLanguage();
  button.textContent = label;
  window.setTimeout(() => {
    button.textContent = LABELS[language].export;
    button.disabled = false;
  }, delay);
}

function handleExportClick(event) {
  event.preventDefault();
  event.stopPropagation();

  const button = event.currentTarget;
  const labels = LABELS[getLanguage()];
  const history = readHistory();

  if (!history.length) {
    button.disabled = true;
    flashButton(button, labels.empty, 1000);
    return;
  }

  try {
    button.disabled = true;
    button.textContent = labels.working;
    downloadExcel(history);
    flashButton(button, labels.done, 1400);
  } catch (error) {
    console.error('Markulator Excel export failed:', error);
    flashButton(button, labels.failed, 1500);
  }
}

function ensureActionsContainer(header) {
  let actions = header.querySelector('.history-actions');
  if (actions) return actions;

  actions = document.createElement('div');
  actions.className = 'history-actions';

  const clearButton = Array.from(header.children).find((child) => child.matches?.('.clear-button'));
  if (clearButton) actions.appendChild(clearButton);

  header.appendChild(actions);
  return actions;
}

function ensureExportButton() {
  const header = document.querySelector('.history-title');
  if (!header) return;

  const labels = LABELS[getLanguage()];
  const actions = ensureActionsContainer(header);
  let button = actions.querySelector('.history-excel-export-button');

  if (!button) {
    button = document.createElement('button');
    button.className = 'clear-button history-excel-export-button';
    button.type = 'button';
    button.addEventListener('click', handleExportClick);
    actions.prepend(button);
  }

  if (!button.disabled) button.textContent = labels.export;
  button.setAttribute('aria-label', labels.export);
}

function scheduleEnsureButton() {
  window.requestAnimationFrame(ensureExportButton);
}

function bindHistoryExcelExport() {
  ensureExportButton();

  const root = document.getElementById('root');
  if (!root || !('MutationObserver' in window)) return;

  const observer = new MutationObserver(scheduleEnsureButton);
  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'lang', 'dir', 'aria-hidden'],
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindHistoryExcelExport, { once: true });
} else {
  bindHistoryExcelExport();
}
