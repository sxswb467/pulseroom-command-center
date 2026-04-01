const metricsGrid = document.getElementById('metrics-grid');
const panelsList = document.getElementById('panels-list');
const activityList = document.getElementById('activity-list');
const insightsList = document.getElementById('insights-list');
const sparklineCanvas = document.getElementById('sparkline');
const refreshButton = document.getElementById('refresh-btn');
const runCommandButton = document.getElementById('run-command-btn');
const commandForm = document.getElementById('command-form');
const formStatus = document.getElementById('form-status');

async function fetchSnapshot() {
  const response = await fetch('/api/dashboard');
  if (!response.ok) throw new Error('Unable to load dashboard');
  return response.json();
}

function metricCard(metric) {
  return `
    <article class="glass metric-card">
      <div class="metric-top">
        <span>${metric.label}</span>
        <span class="delta ${metric.trend}">${metric.delta}</span>
      </div>
      <div class="metric-value">${metric.value}</div>
    </article>
  `;
}

function panelCard(panel) {
  return `
    <article class="surface-card">
      <div class="surface-top">
        <div>
          <h4>${panel.name}</h4>
          <p>${panel.summary}</p>
        </div>
        <span class="status-pill ${panel.status}">${panel.status}</span>
      </div>
      <div class="progress-track" aria-label="${panel.name} progress">
        <div class="progress-bar" style="width:${panel.progress}%"></div>
      </div>
    </article>
  `;
}

function activityCard(item) {
  return `
    <article class="activity-item ${item.level}">
      <div class="activity-top">
        <strong>${item.title}</strong>
        <span>${item.time}</span>
      </div>
      <p>${item.detail}</p>
    </article>
  `;
}

function insightCard(item) {
  return `
    <article class="insight-item">
      <strong>${item.title}</strong>
      <p>${item.body}</p>
    </article>
  `;
}

function drawSparkline(points) {
  const ctx = sparklineCanvas.getContext('2d');
  const { width, height } = sparklineCanvas;
  ctx.clearRect(0, 0, width, height);

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const step = width / Math.max(points.length - 1, 1);

  const mapped = points.map((value, index) => {
    const x = index * step;
    const y = height - ((value - min) / range) * (height - 36) - 18;
    return { x, y };
  });

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(124,109,255,1)');
  gradient.addColorStop(1, 'rgba(45,225,252,1)');

  ctx.beginPath();
  ctx.moveTo(mapped[0].x, mapped[0].y);
  for (let i = 1; i < mapped.length; i += 1) {
    const prev = mapped[i - 1];
    const curr = mapped[i];
    const xc = (prev.x + curr.x) / 2;
    const yc = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, xc, yc);
  }
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.lineTo(mapped.at(-1).x, height);
  ctx.lineTo(mapped[0].x, height);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, 0, 0, height);
  fill.addColorStop(0, 'rgba(124,109,255,0.22)');
  fill.addColorStop(1, 'rgba(45,225,252,0.02)');
  ctx.fillStyle = fill;
  ctx.fill();

  mapped.forEach((point, index) => {
    if (index === mapped.length - 1) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#2de1fc';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(45,225,252,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

function render(snapshot) {
  metricsGrid.innerHTML = snapshot.metrics.map(metricCard).join('');
  panelsList.innerHTML = snapshot.panels.map(panelCard).join('');
  activityList.innerHTML = snapshot.activity.map(activityCard).join('');
  insightsList.innerHTML = snapshot.insights.map(insightCard).join('');
  drawSparkline(snapshot.sparkline);
}

async function sendCommand(label, target) {
  const response = await fetch('/api/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, target })
  });

  if (!response.ok) {
    throw new Error('Command failed');
  }

  const result = await response.json();
  formStatus.textContent = `${result.activity.title} at ${result.activity.time}`;
  const snapshot = await fetchSnapshot();
  render(snapshot);
}

refreshButton.addEventListener('click', async () => {
  const snapshot = await fetchSnapshot();
  render(snapshot);
});

runCommandButton.addEventListener('click', async () => {
  await sendCommand('Stabilize Flow', 'Launch Pulse');
});

commandForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(commandForm);
  const label = formData.get('label');
  const target = formData.get('target');
  if (typeof label !== 'string' || typeof target !== 'string') return;
  await sendCommand(label, target);
});

async function init() {
  const snapshot = await fetchSnapshot();
  render(snapshot);

  const eventSource = new EventSource('/api/stream');
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    render(data);
  };
  eventSource.onerror = () => {
    formStatus.textContent = 'Live stream interrupted. Manual refresh still works.';
  };
}

init().catch((error) => {
  console.error(error);
  formStatus.textContent = 'Unable to load the demo right now.';
});
