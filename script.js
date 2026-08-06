/* =========================================================
   Encuesta de Integración Docente — IED Los Rosales
   Lógica de formulario + envío a Google Apps Script
   ========================================================= */

// ⚠️ Reemplaza esta URL por la de tu implementación de Apps Script
// (Implementar > Nueva implementación > Aplicación web > URL termina en /exec)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwb6ZbdU_wAjqRYk-x0Evyip1icPKT2Ca49ChmbPSgIZaa4VnCXqfI044XlHVVmLOkowA/exec';

const MAX_ACTIVIDADES = 3;

document.addEventListener('DOMContentLoaded', () => {
  initProgressBar();
  initScrollReveal();
  initCheckedStates();
  initImpedimentoOtro();
  initMontoOtro();
  initFondoComunToggle();
  initActividadesLimit();
  initFormSubmit();
});

/* ---------- Barra de progreso ---------- */
function initProgressBar() {
  const fill = document.getElementById('progressFill');
  const form = document.getElementById('surveyForm');

  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    fill.style.width = pct + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ---------- Revelado de tarjetas al hacer scroll ---------- */
function initScrollReveal() {
  const sections = document.querySelectorAll('[data-section]');
  if (!('IntersectionObserver' in window)) {
    sections.forEach(s => s.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  sections.forEach(s => observer.observe(s));
}

/* ---------- Estados visuales "seleccionado" (fallback sin :has()) ---------- */
function initCheckedStates() {
  document.querySelectorAll('.option').forEach(option => {
    const input = option.querySelector('input');
    if (!input) return;

    const sync = () => {
      if (input.type === 'radio') {
        const group = document.getElementsByName(input.name);
        group.forEach(r => r.closest('.option, .scale-option')?.classList.toggle('is-checked', r.checked));
      } else {
        option.classList.toggle('is-checked', input.checked);
      }
    };

    input.addEventListener('change', sync);
    sync();
  });
}

/* ---------- Campo "Otro" en impedimentos ---------- */
function initImpedimentoOtro() {
  const check = document.getElementById('impedimentoOtroCheck');
  const text = document.getElementById('impedimentoOtro');

  check.addEventListener('change', () => {
    text.disabled = !check.checked;
    if (check.checked) {
      text.focus();
    } else {
      text.value = '';
    }
  });
}

/* ---------- Campo "Otro valor" en aporte ---------- */
function initMontoOtro() {
  const check = document.getElementById('montoOtroCheck');
  const text = document.getElementById('montoOtro');
  const radios = document.querySelectorAll('input[name="montoAporte"]');

  check.addEventListener('change', () => {
    text.disabled = !check.checked;
    if (check.checked) {
      radios.forEach(r => (r.checked = false));
      document.querySelectorAll('input[name="montoAporte"]').forEach(r =>
        r.closest('.option')?.classList.remove('is-checked')
      );
      text.focus();
    } else {
      text.value = '';
    }
  });

  radios.forEach(r => r.addEventListener('change', () => {
    check.checked = false;
    text.disabled = true;
    text.value = '';
  }));
}

/* ---------- Mostrar/ocultar monto de aporte según Sí/No ---------- */
function initFondoComunToggle() {
  const radios = document.querySelectorAll('input[name="fondoComun"]');
  const montoWrap = document.getElementById('montoWrap');

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      const showMonto = radio.value === 'Sí' && radio.checked;
      montoWrap.hidden = !showMonto;
      if (!showMonto) {
        montoWrap.querySelectorAll('input').forEach(i => {
          if (i.type === 'radio' || i.type === 'checkbox') i.checked = false;
          if (i.type === 'text') { i.value = ''; i.disabled = true; }
          i.closest('.option')?.classList.remove('is-checked');
        });
      }
    });
  });
}

/* ---------- Límite de 3 actividades ---------- */
function initActividadesLimit() {
  const boxes = document.querySelectorAll('input[name="actividades"]');
  const counter = document.getElementById('actividadesCounter');

  function update() {
    const checked = Array.from(boxes).filter(b => b.checked);
    counter.textContent = `${checked.length} de ${MAX_ACTIVIDADES} seleccionadas`;
    counter.classList.toggle('is-full', checked.length >= MAX_ACTIVIDADES);
    boxes.forEach(b => {
      if (!b.checked) b.disabled = checked.length >= MAX_ACTIVIDADES;
    });
  }

  boxes.forEach(b => b.addEventListener('change', update));
  update();
}

/* ---------- Validación y envío ---------- */
function initFormSubmit() {
  const form = document.getElementById('surveyForm');
  const submitBtn = document.getElementById('submitBtn');
  const globalError = document.getElementById('globalError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isValid = validateForm(form);
    globalError.style.display = isValid ? 'none' : 'block';

    if (!isValid) {
      const firstError = form.querySelector('.field.has-error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');

    const payload = collectPayload(form);

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Apps Script no admite CORS estándar; la respuesta será opaca
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      showSuccess();
    } catch (err) {
      // Solo falla aquí si hay un problema real de red (sin conexión, URL inválida, etc.)
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
      globalError.textContent = 'No pudimos enviar tus respuestas. Verifica tu conexión e inténtalo de nuevo.';
      globalError.style.display = 'block';
      console.error('Error al enviar la encuesta:', err);
    }
  });
}

function validateForm(form) {
  let valid = true;

  // Campos required estándar (radios)
  document.querySelectorAll('.field[data-required]').forEach(field => {
    const inputs = field.querySelectorAll('input[required], input[name]');
    const name = inputs[0]?.name;
    if (!name) return;

    if (field.querySelector('#actividadesGroup')) {
      const checked = field.querySelectorAll('input[name="actividades"]:checked');
      const ok = checked.length >= 1 && checked.length <= MAX_ACTIVIDADES;
      field.classList.toggle('has-error', !ok);
      if (!ok) valid = false;
      return;
    }

    const group = form.querySelectorAll(`input[name="${name}"]`);
    const checked = Array.from(group).some(i => i.checked);
    field.classList.toggle('has-error', !checked);
    if (!checked) valid = false;
  });

  return valid;
}

function collectPayload(form) {
  const data = new FormData(form);

  return {
    sede: data.get('sede') || '',
    jornada: data.get('jornada') || '',
    motivacion: data.get('motivacion') || '',
    impedimentos: data.getAll('impedimentos'),
    impedimentoOtro: data.get('impedimentoOtro') || '',
    actividades: data.getAll('actividades'),
    fondoComun: data.get('fondoComun') || '',
    montoAporte: data.get('montoOtroCheck') ? (data.get('montoOtro') || '') : (data.get('montoAporte') || ''),
    mejorMomento: data.get('mejorMomento') || '',
    lugarPreferido: data.get('lugarPreferido') || '',
    canalComunicacion: data.get('canalComunicacion') || '',
    propuesta: data.get('propuesta') || '',
    userAgent: navigator.userAgent
  };
}

function showSuccess() {
  document.getElementById('surveyForm').hidden = true;
  const success = document.getElementById('successScreen');
  success.hidden = false;
  success.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
