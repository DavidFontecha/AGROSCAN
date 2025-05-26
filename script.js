// Navegación de páginas
const pages = ['page0','page1','page2','page3'];
function show(id) {
  pages.forEach(p => document.getElementById(p).classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// Función para mostrar unidades adecuadas
function formatearUnidad(variable, valor) {
  const tipo = variable.toLowerCase();
  if (tipo === 'temperatura') return valor.toFixed(1) + ' °C';
  if (tipo === 'humedad') return valor.toFixed(1) + ' %';
  if (['n', 'p', 'k'].includes(tipo)) return valor.toFixed(2) + ' %';
  return valor.toFixed(2) + ' unidades';
}

// Elementos
const btnSuggest = document.getElementById('btnSuggest');
const btnBack0  = document.getElementById('btnBack0');
const btnBack1  = document.getElementById('btnBack1');
const btnBack2  = document.getElementById('btnBack2');
const soilForm  = document.getElementById('soilForm');
const ctxScore  = document.getElementById('scoreChart').getContext('2d');
const ctxSuggest= document.getElementById('suggestChart').getContext('2d');
const suggestions2 = document.getElementById('suggestions2');
const suggestions  = document.getElementById('suggestions');

// Forzar uso de punto decimal
document.querySelectorAll('input').forEach(el =>
  el.addEventListener('input', e => e.target.value = e.target.value.replace(',', '.'))
);

// Requisitos de cultivos
const reqs = {
  Aguacate: { minTemp:16, maxTemp:28, minMoist:60, maxMoist:80, minN:0.15, maxN:0.25, minP:0.01, maxP:0.02, minK:0.40, maxK:0.60 },
  Café:     { minTemp:15, maxTemp:24, minMoist:50, maxMoist:70, minN:0.20, maxN:0.30, minP:0.015, maxP:0.025, minK:0.30, maxK:0.50 },
  Plátano:  { minTemp:20, maxTemp:30, minMoist:80, maxMoist:90, minN:0.30, maxN:0.40, minP:0.02, maxP:0.03, minK:0.40, maxK:0.60 }
};

let mode, inputs, scores, chart1, chart2;

// Página 0: selección
document.querySelectorAll('#page0 .btn').forEach(btn =>
  btn.addEventListener('click', () => {
    mode = btn.dataset.mode;
    soilForm.reset();
    show('page1');
    btnSuggest.classList.toggle('hidden', mode !== 'Auto');
  })
);

// Botones “Volver”
btnBack0.addEventListener('click', () => show('page0'));
btnBack1.addEventListener('click', () => show(mode === 'Auto' ? 'page0' : 'page1'));
btnBack2.addEventListener('click', () => show('page2'));

// Envío de formulario
soilForm.addEventListener('submit', e => {
  e.preventDefault();
  inputs = {
    temp:  parseFloat(document.getElementById('temp').value),
    moist: parseFloat(document.getElementById('humedad').value),
    n:     parseFloat(document.getElementById('n').value),
    p:     parseFloat(document.getElementById('p').value),
    k:     parseFloat(document.getElementById('k').value)
  };

  // Calcular puntuaciones
  scores = {}; let best = null, bestScore = -1;
  Object.entries(reqs).forEach(([c,r]) => {
    const sc = ['Temp','Moist','N','P','K'].reduce((a,key)=>{
      const val = inputs[key.toLowerCase()];
      return a + ((val >= r['min'+key] && val <= r['max'+key]) ? 1 : 0);
    }, 0);
    scores[c] = sc;
    if (sc > bestScore) { bestScore = sc; best = c; }
  });

  let chosen = (mode === 'Auto' ? best : mode);
  if (mode === 'Auto' && bestScore === 0) chosen = 'Aguacate';

  // Mostrar texto de resultado
  const pct = ((scores[chosen] / 5) * 100).toFixed(1);
  document.getElementById('resultText').innerHTML = `<strong>${chosen}</strong> (${pct}% de cumplimiento)`;

  // Dibujar gráfica
  if (chart1) chart1.destroy();
  if (mode === 'Auto') {
    // Gráfica de los 3 cultivos
    const vals = Object.values(scores).map(v => v/5*100);
    const cols = vals.map(v => v<100 ? 'rgba(231,76,60,0.8)' : 'rgba(54,162,235,0.8)');
    chart1 = new Chart(ctxScore, {
      type: 'bar',
      data: { labels: Object.keys(scores), datasets: [{ label: '% Cumplimiento', data: vals, backgroundColor: cols }] },
      options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });
    // Sugerencias para el mejor cultivo
    const r = reqs[chosen];
    suggestions2.innerHTML = '';
    ['Temp','Moist','N','P','K'].forEach((key,i) => {
      const display = ['Temperatura','Humedad','N','P','K'][i];
      const val = inputs[key.toLowerCase()];
      const min = r['min'+key], max = r['max'+key];
      if (val < min) suggestions2.innerHTML += `<p><strong>${display}:</strong> aumenta ${formatearUnidad(display, min - val)}</p>`;
      else if (val > max) suggestions2.innerHTML += `<p><strong>${display}:</strong> reduce ${formatearUnidad(display, val - max)}</p>`;
    });
    suggestions2.classList.remove('hidden');
    btnSuggest.classList.remove('hidden');
  } else {
    // Sección específica: gráfica parámetros
    const r = reqs[chosen];
    const display = ['Temperatura','Humedad','N','P','K'];
    const keys = ['Temp','Moist','N','P','K'];
    const vals = keys.map(key => {
      const val = inputs[key.toLowerCase()];
      return Math.min(Math.max((val - r['min'+key]) / (r['max'+key] - r['min'+key]) * 100, 0), 100);
    });
    const cols = keys.map(key => {
      const val = inputs[key.toLowerCase()];
      return (val < r['min'+key] || val > r['max'+key]) ? 'rgba(231,76,60,0.8)' : 'rgba(54,162,235,0.8)';
    });
    chart1 = new Chart(ctxScore, {
      type: 'bar',
      data: { labels: display, datasets: [{ label: '% Cumplimiento', data: vals, backgroundColor: cols }] },
      options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });
    // Sugerencias específicas
    suggestions2.innerHTML = '';
    keys.forEach((key,i) => {
      const disp = display[i];
      const val = inputs[key.toLowerCase()];
      const min = r['min'+key], max = r['max'+key];
      if (val < min) suggestions2.innerHTML += `<p><strong>${disp}:</strong> aumenta ${formatearUnidad(disp, min - val)}</p>`;
      else if (val > max) suggestions2.innerHTML += `<p><strong>${disp}:</strong> reduce ${formatearUnidad(disp, val - max)}</p>`;
    });
    suggestions2.classList.remove('hidden');
    btnSuggest.classList.add('hidden');
  }
  show('page2');
});

// Ver sugerencias de otros (modo Auto)
btnSuggest.addEventListener('click', () => {
  const chosen = document.getElementById('resultText').textContent.split(' ')[0];
  const others = Object.keys(scores).filter(c => c !== chosen);
  const vals   = others.map(c => scores[c]/5*100);
  if (chart2) chart2.destroy();
  chart2 = new Chart(ctxSuggest, {
    type: 'bar',
    data: { labels: others, datasets: [{ label: '% Cumplimiento', data: vals, backgroundColor: ['rgba(231,76,60,0.8)','rgba(231,76,60,0.8)'] }] },
    options: { scales: { y: { beginAtZero: true, max: 100 } } }
  });
  suggestions.innerHTML = '';
  others.forEach(c => {
    const r = reqs[c];
    ['Temp','Moist','N','P','K'].forEach((key,i) => {
      const disp = ['Temperatura','Humedad','N','P','K'][i];
      const val = inputs[key.toLowerCase()];
      const min = r['min'+key], max = r['max'+key];
      if (val < min) suggestions.innerHTML += `<p><strong>${c} - ${disp}:</strong> aumenta ${formatearUnidad(disp, min - val)}</p>`;
      else if (val > max) suggestions.innerHTML += `<p><strong>${c} - ${disp}:</strong> reduce ${formatearUnidad(disp, val - max)}</p>`;
    });
  });
  show('page3');
});
