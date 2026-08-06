# Encuesta de Integración Docente — IED Los Rosales

Aplicación web estática (GitHub Pages) + Google Apps Script + Google Sheets
para recopilar de forma **anónima** las preferencias del cuerpo docente
sobre las actividades de integración institucional.

Sigue la misma arquitectura que `encuestas-tareas`: sitio estático →
`fetch` en modo `no-cors` → Apps Script → hoja de cálculo, con creación
automática de la pestaña de respuestas si no existe.

```
encuesta-integracion-docente/
├── index.html          → Formulario (8 secciones, sin campo de nombre)
├── css/style.css        → Estilo institucional (rosalesAzul/Verde/Ambar)
├── js/script.js          → Validación, lógica condicional y envío
├── apps-script/Code.gs   → Backend (pegar en Extensiones > Apps Script)
└── README.md
```

---

## 1. Crear la hoja de cálculo

1. Crea una hoja de cálculo nueva en Google Sheets.
2. Nómbrala **`Encuesta Integración Docente 2026`**.
3. No crees ninguna pestaña manualmente: el script crea la pestaña
   **`Respuestas`** (con encabezados en negrita, fondo azul institucional)
   la primera vez que llega una respuesta.

## 2. Publicar el backend (Apps Script)

1. Dentro de esa hoja: **Extensiones → Apps Script**.
2. Borra el contenido por defecto de `Code.gs` y pega el archivo
   `apps-script/Code.gs` de esta carpeta.
3. Guarda el proyecto (por ejemplo, `Backend Encuesta Integración`).
4. **Implementar → Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo** (tu cuenta)
   - Quién tiene acceso: **Cualquier usuario**
5. Autoriza los permisos que Google solicite (es tu propio script).
6. Copia la URL que termina en `/exec`. La necesitas en el paso 3.

> Cada vez que edites `Code.gs`, debes ir a **Gestionar implementaciones →
> lápiz de edición → Nueva versión → Implementar** para que el cambio
> quede activo en la misma URL. Si solo guardas el archivo sin crear una
> nueva versión, el sitio seguirá usando el código anterior.

## 3. Conectar el sitio con el backend

1. Abre `js/script.js`.
2. Reemplaza la constante:
   ```js
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/TU_ID_DE_IMPLEMENTACION/exec';
   ```
   con la URL real que copiaste en el paso anterior.

## 4. Publicar en GitHub Pages

```bash
# Desde esta carpeta
git init
git add .
git commit -m "Encuesta de Integración Docente — IED Los Rosales"
git branch -M main
git remote add origin https://github.com/hayzar/encuesta-integracion-docente.git
git push -u origin main
```

Luego, en GitHub: **Settings → Pages → Branch: `main` / carpeta `/ (root)`
→ Save**. El sitio quedará disponible en:

```
https://hayzar.github.io/encuesta-integracion-docente/
```

## 5. Probar antes de compartir

1. Abre la URL `/exec` de Apps Script directamente en el navegador:
   debe responder `{"status":"ok", ...}`.
2. Abre el sitio de GitHub Pages y envía una respuesta de prueba.
3. Verifica que aparezca la fila en la pestaña **Respuestas** de la hoja
   (puede tardar unos segundos).
4. Borra la fila de prueba antes de compartir el enlace con el equipo.

---

## Notas de diseño

- **Anónima**: no se solicita nombre, correo ni identificación en
  ningún punto del formulario, tal como pediste. Si en el futuro
  necesitas gestionar los cobros del fondo común (pregunta 5), lo más
  simple es cruzar manualmente la lista de quienes aceptaron aportar
  con la coordinación de bienestar, o abrir una segunda encuesta breve
  y con nombre solo para ese trámite.
- **Selección máxima de 3** en "Actividades que te motivarían": las
  casillas restantes se deshabilitan automáticamente al llegar al
  límite (`js/script.js → initActividadesLimit`).
- **Lógica condicional**: la sección de monto de aporte solo aparece
  si la respuesta a "¿fondo común?" es "Sí"; el campo "Otro" de cada
  pregunta se habilita solo si se marca esa opción.
- **`mode: 'no-cors'`**: Apps Script no permite leer la respuesta desde
  el navegador con CORS estándar, así que el sitio muestra la pantalla
  de éxito apenas la petición se envía sin error de red. Es el mismo
  patrón usado en tus otras encuestas (`encuestas-tareas`).
- Tipografías: **Newsreader** (títulos) + **Inter** (interfaz), cargadas
  desde Google Fonts. Si necesitas que funcione sin conexión a internet
  externa, puedes auto-alojar las fuentes dentro de `css/`.

## Personalizaciones rápidas

- **Nombres reales de sedes**: reemplaza "Sede 1" / "Sede 2" por los
  nombres reales en `index.html` (aparecen 3 veces: pregunta 1 y en
  la pregunta de lugar preferido) y en `apps-script/Code.gs` si quieres
  que los encabezados los reflejen.
- **Fecha límite**: si quieres cerrar la encuesta en una fecha fija,
  puedo añadir un control de fecha en `script.js` que oculte el
  formulario después de esa fecha y muestre un mensaje de cierre.
