# Generador de contratos (Google Apps Script)

Formulario web → crea la carpeta `Nombre Apellido - AAAA-MM-DD` en Drive con los contratos elegidos
(Confidencialidad y/o Trabajo), ya llenos.

```
templates/    PLANTILLA - *.docx   plantillas con marcadores {{TOKEN}} (sin resaltado)
apps-script/  Code.gs, Index.html, appsscript.json
```

## Puesta en marcha

1. **Subir plantillas.** Sube los dos `.docx` de `templates/` a Drive, ábrelos con Google Docs y usa
   *Archivo → Guardar como Documento de Google*. (Los `.docx` originales no se tocaron.)
2. **IDs.** Copia el ID de cada Google Doc (la parte larga de la URL entre `/d/` y `/edit`) y pégalo en `CONFIG.TEMPLATES` de `Code.gs`.
   Opcional: `PARENT_FOLDER_ID` = carpeta de Drive donde se crearán las carpetas (vacío = raíz de Mi unidad).
3. **Crear el proyecto.** En <https://script.google.com> → Nuevo proyecto. Pega `Code.gs` y crea un archivo HTML llamado `Index` con `Index.html`.
   Ajustes del proyecto → *Mostrar `appsscript.json`* y pega el de este repo (zona horaria y permisos).
   (O usa `clasp push` desde `apps-script/`.)
4. **Implementar.** *Implementar → Nueva implementación → Aplicación web*, ejecutar como **yo**, acceso **solo yo**.
   La primera vez pedirá permisos de Drive y Documentos.
5. Abre la URL de la aplicación web.

## Marcadores de las plantillas

| Marcador | Contratos | Origen |
|---|---|---|
| `NOMBRE` | ambos | texto en MAYÚSCULAS |
| `EDAD_LETRAS`, `EDAD_NUM` | ambos (trabajo solo letras) | edad |
| `ESTADO_CIVIL`, `NACIONALIDAD` | ambos | nacionalidad desde lista (default guatemalteco) u “Otra”; se pasan a femenino según la concordancia |
| `SEXO`, `EL_LA_TRABAJADOR` | trabajo | “femenino / masculino / no binario”, “la trabajadora / el trabajador”. Con *no binario* el formulario pregunta qué concordancia usar en el texto (masculina o femenina) |
| `PROFESION`, `DIRECCION` | ambos | texto libre |
| `DPI_NUM`, `DPI_LETRAS` | ambos | 13 dígitos → `#### ##### ####` y en letras |
| `FECHA_FIRMA` | ambos | “29 de septiembre del año dos mil veinticinco” |
| `FECHA_LEGALIZACION` | confidencialidad | fecha del notario (por defecto = firma) |
| `TITULO`, `TIPO_SERVICIO` | confidencialidad | rol: Técnico, Profesional u “Otro” escrito a mano (ej. “LA CONSULTORA”) en las 31 menciones; “servicios técnicos / profesionales / …” |
| `REP_EDAD_NUM` / `REP_EDAD_LETRAS` | confidencialidad / trabajo | edad de Mauricio (nac. 16‑may‑1975) calculada a la fecha de firma; cambia `REP_NACIMIENTO` en `Index.html` si hace falta |
| `FECHA_INICIO_TEXTO` | confidencialidad | “diez de marzo del dos mil veinticinco” |
| `INICIO_DIA_LETRAS/_NUM`, `INICIO_MES`, `INICIO_ANIO_LETRAS/_NUM` | trabajo | inicio de la relación laboral |
| `PUESTO`, `FUNCIONES` | trabajo | texto libre |
| `SALARIO_NUM/_LETRAS`, `BONIF_NUM/_LETRAS` | trabajo | monto y letras |

Para añadir un dato nuevo: pon `{{NUEVO_TOKEN}}` en la plantilla (Google Doc) y agrega la clave en `values()` de `Index.html`.
El script avisa si queda algún `{{...}}` sin reemplazar.

## Pendiente de avisar

Los datos de Mauricio no coinciden entre contratos (se dejaron tal cual):
- Acta de nombramiento: confidencialidad usa Notario Pérez Castellanos, 30‑oct‑2020 (reg. 605,422); trabajo usa Notario Almengor Roca, 16‑ago‑2023 (reg. 709,644).
- Cargo: “Presidente y Representante Legal” vs. “Presidente de Consejo de Administración y Representante Legal”.

Avisar a quien corresponda para confirmar cuál es el vigente.

## Límites conocidos

- No uses `$` ni `\` en los textos del formulario (Docs los interpreta en el reemplazo).
- Si ya existe una carpeta con el mismo nombre se crea `Nombre - fecha (2)`.
