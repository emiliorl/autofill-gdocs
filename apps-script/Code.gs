/**
 * Generador de contratos — Google Apps Script (web app)
 *
 * Flujo: el formulario (Index.html) calcula todos los textos (edad en letras,
 * fechas, DPI, etc.) y llama a generateContracts(). Aquí solo se crea la
 * carpeta "NOMBRE - AAAA-MM-DD", se copian las plantillas de Google Docs y se
 * reemplazan los marcadores {{TOKEN}}.
 */

const CONFIG = {
  // Carpeta de Drive donde se crean las carpetas de cada persona.
  // Déjalo vacío ('') para usar la raíz de "Mi unidad".
  PARENT_FOLDER_ID: 'https://drive.google.com/drive/folders/1ZEbJ0yLKnvxwNMSO3Dc2WFAmIohEITUs',

  // IDs de las plantillas (Google Docs). Ver README.md, paso 2.
  TEMPLATES: {
    confidencialidad: {
      label: 'Contrato de Confidencialidad',
      templateId: '1wafbKWQ-euxYJK5lkWyn-XWTA891eqe8mlnLARk2DCQ',
    },
    trabajo: {
      label: 'Contrato Individual de Trabajo',
      templateId: '1zmVVvxusN03HAczFMaUL9VN_DCTakT9DOtoMdOBrdWw',
    },
  },
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Generador de contratos')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Lo usa el formulario para avisar si falta configurar alguna plantilla. */
function getSetupStatus() {
  const out = {};
  Object.keys(CONFIG.TEMPLATES).forEach(function (key) {
    out[key] = isConfigured_(CONFIG.TEMPLATES[key].templateId);
  });
  return out;
}

/**
 * @param {{folderName:string, contracts:string[], values:Object<string,string>}} payload
 * @return {{folderUrl:string, folderName:string, files:{label:string,url:string}[], warnings:string[]}}
 */
function generateContracts(payload) {
  if (!payload || !payload.contracts || !payload.contracts.length) {
    throw new Error('Selecciona al menos un contrato.');
  }
  const values = payload.values || {};
  const selected = payload.contracts.map(function (key) {
    const tpl = CONFIG.TEMPLATES[key];
    if (!tpl) throw new Error('Contrato desconocido: ' + key);
    if (!isConfigured_(tpl.templateId)) {
      throw new Error('Falta el ID de la plantilla "' + tpl.label + '" en Code.gs (CONFIG).');
    }
    return { key: key, tpl: tpl };
  });

  const personName = String(values.NOMBRE || '').trim();
  if (!personName) throw new Error('Falta el nombre.');

  const parent = CONFIG.PARENT_FOLDER_ID
    ? DriveApp.getFolderById(idFrom_(CONFIG.PARENT_FOLDER_ID))
    : DriveApp.getRootFolder();
  const folder = parent.createFolder(uniqueFolderName_(parent, sanitize_(payload.folderName || personName)));

  const files = [];
  const warnings = [];
  selected.forEach(function (s) {
    const baseName = s.tpl.label + ' - ' + sanitize_(toTitle_(personName));
    const copy = DriveApp.getFileById(idFrom_(s.tpl.templateId)).makeCopy(baseName, folder);
    const doc = DocumentApp.openById(copy.getId());
    fillDocument_(doc, values);

    // Avisar si quedó algún {{TOKEN}} sin reemplazar (plantilla con marcador nuevo, etc.)
    const left = findLeftovers_(doc);
    if (left.length) warnings.push(s.tpl.label + ': sin completar → ' + left.join(', '));

    doc.saveAndClose();   // debe cerrarse antes de exportar para que el PDF incluya los cambios

    const entry = { label: s.tpl.label, url: copy.getUrl(), pdfUrl: '' };
    if (payload.pdf !== false) {
      const pdf = folder.createFile(copy.getAs(MimeType.PDF)).setName(baseName + '.pdf');
      entry.pdfUrl = pdf.getUrl();
    }
    files.push(entry);
  });

  return { folderUrl: folder.getUrl(), folderName: folder.getName(), files: files, warnings: warnings };
}

// ---------------------------------------------------------------- helpers

function fillDocument_(doc, values) {
  const containers = [doc.getBody()];
  if (doc.getHeader()) containers.push(doc.getHeader());
  if (doc.getFooter()) containers.push(doc.getFooter());

  Object.keys(values).forEach(function (key) {
    if (!/^[A-Z_]+$/.test(key)) return;
    const pattern = '\\{\\{' + key + '\\}\\}';
    const value = String(values[key] == null ? '' : values[key]);
    containers.forEach(function (c) { c.replaceText(pattern, value); });
  });
}

function findLeftovers_(doc) {
  const found = {};
  let r = doc.getBody().findText('\\{\\{[A-Z_]+\\}\\}');
  while (r) {
    const t = r.getElement().asText().getText();
    found[t.substring(r.getStartOffset(), r.getEndOffsetInclusive() + 1)] = true;
    r = doc.getBody().findText('\\{\\{[A-Z_]+\\}\\}', r);
  }
  return Object.keys(found);
}

/** Acepta un ID o una URL completa de Drive/Docs y devuelve solo el ID. */
function idFrom_(value) {
  const s = String(value).trim();
  const m = s.match(/\/(?:folders|d)\/([-\w]{20,})/) || s.match(/[?&]id=([-\w]{20,})/);
  return m ? m[1] : s;
}

function isConfigured_(id) {
  return !!id && id.indexOf('PEGAR_ID') !== 0;
}

function sanitize_(s) {
  return String(s).replace(/[\\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

function toTitle_(s) {
  return String(s).toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); });
}

function uniqueFolderName_(parent, base) {
  let name = base, n = 1;
  while (parent.getFoldersByName(name).hasNext()) {
    n += 1;
    name = base + ' (' + n + ')';
  }
  return name;
}
