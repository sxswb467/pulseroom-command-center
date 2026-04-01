const metricsGrid = document.getElementById('metrics-grid');
const panelsList = document.getElementById('panels-list');
const activityList = document.getElementById('activity-list');
const insightsList = document.getElementById('insights-list');
const sparklineCanvas = document.getElementById('sparkline');
const refreshButton = document.getElementById('refresh-btn');
const resetViewButton = document.getElementById('reset-view-btn');
const runCommandButton = document.getElementById('run-command-btn');
const commandForm = document.getElementById('command-form');
const formStatus = document.getElementById('form-status');
const streamStatus = document.getElementById('stream-status');
const lastUpdated = document.getElementById('last-updated');
const panelsMeta = document.getElementById('panels-meta');
const activityMeta = document.getElementById('activity-meta');
const chartRangeLabel = document.getElementById('chart-range-label');
const filterButtons = document.querySelectorAll('[data-filter-group]');
const commandLabelInput = commandForm.querySelector('input[name="label"]');

const timeFormatter = new Intl.DateTimeFormat(navigator.languages, {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit'
});

const filterOrder = {
  panel: ['all', 'healthy', 'watching', 'critical'],
  activity: ['all', 'low', 'medium', 'high'],
  range: ['6', '12', '24']
};

const defaultState = {
  panel: 'all',
  activity: 'all',
  range: '12'
};

const clientId = getClientId();
const uiState = loadStateFromUrl();
let latestSnapshot = null;
let savePreferencesTimer = null;

function getClientId() {
  const storageKey = 'pulseroom-client-id';
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const nextId = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `client-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(storageKey, nextId);
  return nextId;
}

function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    panel: filterOrder.panel.includes(params.get('panel')) ? params.get('panel') : defaultState.panel,
    activity: filterOrder.activity.includes(params.get('activity')) ? params.get('activity') : defaultState.activity,
    range: filterOrder.range.includes(params.get('range')) ? params.get('range') : defaultState.range
  };
}

function hasUrlOverride(key) {
  return new URLSearchParams(window.location.search).has(key);
}

function syncUrlState() {
  const params = new URLSearchParams(window.location.search);

  Object.entries(uiState).forEach(([key, value]) => {
    if (value === defaultState[key]) {
      params.delete(key);
      return;
    }
    params.set(key, value);
  });

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, '', nextUrl);
}

async function fetchPreferences() {
  const response = await fetch('/api/preferences', {
    headers: { 'x-client-id': clientId }
  });
  if (!response.ok) throw new Error('Unable to load preferences');
  return response.json();
}

function queuePreferenceSave() {
  window.clearTimeout(savePreferencesTimer);
  savePreferencesTimer = window.setTimeout(async () => {
    try {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId
        },
        body: JSON.stringify(uiState)
      });
    } catch (error) {
      console.error(error);
    }
  }, 160);
}

function applyServerPreferences(preferences) {
  if (!hasUrlOverride('panel')) uiState.panel = preferences.panel;
  if (!hasUrlOverride('activity')) uiState.activity = preferences.activity;
  if (!hasUrlOverride('range')) uiState.range = preferences.range;
  syncUrlState();
}

function formatNow() {
  return timeFormatter.format(new Date());
}

function setBusyState(isBusy) {
  refreshButton.disabled = isBusy;
  resetViewButton.disabled = isBusy;
  runCommandButton.disabled = isBusy;
  commandForm.querySelector('button[type="submit"]').disabled = isBusy;
  commandForm.setAttribute('aria-busy', String(isBusy));
}

function setStreamState(mode, message) {
  streamStatus.className = `status-chip ${mode}`;
  streamStatus.textContent = mode === 'is-live' ? 'Stream Healthy' : 'Stream Reconnecting';
  lastUpdated.textContent = message;
}

async function fetchSnapshot() {
  const response = await fetch('/api/dashboard');
  if (!response.ok) throw new Error('Unable to load dashboard');
  return response.json();
}

function metricCard(metric) {
  return `
    <article class="metric-card">
      <div class="metric-top">
        <p class="metric-label">${metric.label}</p>
        <span class="delta ${metric.trend}">${metric.delta}</span>
      </div>
      <div class="metric-value">${metric.value}</div>
      <p class="metric-foot">${metric.note}</p>
    </article>
  `;
}

function panelCard(panel) {
  return `
    <article class="surface-card">
      <div class="surface-top">
        <div>
          <h3>${panel.name}</h3>
          <p>${panel.summary}</p>
        </div>
        <span class="status-pill ${panel.status}">${panel.status}</span>
      </div>
      <div
        class="progress-track"
        role="progressbar"
        aria-label="${panel.name} progress"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${panel.progress}"
      >
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
        <span class="activity-time">${item.time}</span>
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

function emptyState(title, body) {
  return `
    <article class="empty-state">
      <h3>${title}</h3>
      <p>${body}</p>
    </article>
  `;
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const group = button.dataset.filterGroup;
    const value = button.dataset.filterValue;
    const isActive = uiState[group] === value;
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function updateMeta(panels, activity, sparkline) {
  const panelLabel = uiState.panel === 'all' ? 'all surfaces' : `${uiState.panel} surfaces`;
  const activityLabel = uiState.activity === 'all' ? 'all activity' : `${uiState.activity} alerts`;
  const rangeLabel = Number.parseInt(uiState.range, 10);

  panelsMeta.textContent = `Showing ${panels.length} ${panelLabel}`;
  activityMeta.textContent = `Showing ${activity.length} ${activityLabel}`;
  chartRangeLabel.textContent = `Showing the latest ${sparkline.length} updates`;

  if (rangeLabel === 24 && sparkline.length < 24) {
    chartRangeLabel.textContent = `Showing all ${sparkline.length} available updates`;
  }
}

function filteredSnapshot(snapshot) {
  const panels = uiState.panel === 'all'
    ? snapshot.panels
    : snapshot.panels.filter((panel) => panel.status === uiState.panel);

  const activity = uiState.activity === 'all'
    ? snapshot.activity
    : snapshot.activity.filter((item) => item.level === uiState.activity);

  const range = Number.parseInt(uiState.range, 10);
  const sparkline = snapshot.sparkline.slice(-range);

  return {
    ...snapshot,
    panels,
    activity,
    sparkline
  };
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

  const stroke = ctx.createLinearGradient(0, 0, width, height);
  stroke.addColorStop(0, 'rgba(181,79,63,1)');
  stroke.addColorStop(1, 'rgba(240,211,202,0.95)');

  ctx.beginPath();
  ctx.moveTo(mapped[0].x, mapped[0].y);
  for (let i = 1; i < mapped.length; i += 1) {
    const prev = mapped[i - 1];
    const curr = mapped[i];
    const xc = (prev.x + curr.x) / 2;
    const yc = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, xc, yc);
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.lineTo(mapped.at(-1).x, height);
  ctx.lineTo(mapped[0].x, height);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, 0, 0, height);
  fill.addColorStop(0, 'rgba(181,79,63,0.24)');
  fill.addColorStop(1, 'rgba(181,79,63,0.02)');
  ctx.fillStyle = fill;
  ctx.fill();

  const point = mapped.at(-1);
  ctx.beginPath();
  ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#f0d3ca';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(240,211,202,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function render(snapshot) {
  latestSnapshot = snapshot;
  const view = filteredSnapshot(snapshot);

  metricsGrid.innerHTML = view.metrics.map(metricCard).join('');
  panelsList.innerHTML = view.panels.length
    ? view.panels.map(panelCard).join('')
    : emptyState('No panels match this filter.', 'Try a broader health state to bring the full operating picture back into view.');
  activityList.innerHTML = view.activity.length
    ? view.activity.map(activityCard).join('')
    : emptyState('No activity matches this filter.', 'Switch severity levels or wait for the next stream event to arrive.');
  insightsList.innerHTML = view.insights.map(insightCard).join('');
  drawSparkline(view.sparkline);
  updateFilterButtons();
  updateMeta(view.panels, view.activity, view.sparkline);
  setStreamState('is-live', `Last updated ${formatNow()}`);
}

async function refreshDashboard() {
  setBusyState(true);
  try {
    const snapshot = await fetchSnapshot();
    render(snapshot);
  } finally {
    setBusyState(false);
  }
}

async function sendCommand(label, target) {
  setBusyState(true);
  try {
    const response = await fetch('/api/commands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, target })
    });

    if (!response.ok) {
      throw new Error('Command failed. Try a short, descriptive label and target.');
    }

    const result = await response.json();
    formStatus.textContent = `${result.activity.title} at ${result.activity.time}`;
    const snapshot = await fetchSnapshot();
    render(snapshot);
  } catch (error) {
    formStatus.textContent = error instanceof Error ? error.message : 'Command failed. Please try again.';
  } finally {
    setBusyState(false);
  }
}

function setFilterState(group, value, persist = true) {
  uiState[group] = value;
  syncUrlState();
  if (persist) queuePreferenceSave();
  if (latestSnapshot) render(latestSnapshot);
}

function cycleFilter(group, direction = 1) {
  const values = filterOrder[group];
  const currentIndex = values.indexOf(uiState[group]);
  const nextIndex = (currentIndex + direction + values.length) % values.length;
  setFilterState(group, values[nextIndex]);
}

function resetView(persist = true) {
  uiState.panel = defaultState.panel;
  uiState.activity = defaultState.activity;
  uiState.range = defaultState.range;
  syncUrlState();
  if (persist) queuePreferenceSave();
  if (latestSnapshot) render(latestSnapshot);
}

function handleFilterClick(event) {
  const button = event.target.closest('[data-filter-group]');
  if (!button) return;

  const { filterGroup, filterValue } = button.dataset;
  setFilterState(filterGroup, filterValue);
}

function isTypingTarget(target) {
  return target instanceof HTMLElement && (
    target.closest('input, textarea, select, [contenteditable="true"]') !== null
  );
}

async function handleShortcut(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (event.key === 'Escape' && isTypingTarget(event.target)) {
    event.target.blur();
    return;
  }

  if (isTypingTarget(event.target)) return;

  if (event.key === 'r' || event.key === 'R') {
    event.preventDefault();
    refreshButton.click();
    return;
  }

  if (event.key === '/') {
    event.preventDefault();
    commandLabelInput.focus();
    commandLabelInput.select();
    return;
  }

  if (event.key === 'p' || event.key === 'P') {
    event.preventDefault();
    cycleFilter('panel');
    return;
  }

  if (event.key === 'a' || event.key === 'A') {
    event.preventDefault();
    cycleFilter('activity');
    return;
  }

  if (event.key === '[') {
    event.preventDefault();
    cycleFilter('range', -1);
    return;
  }

  if (event.key === ']') {
    event.preventDefault();
    cycleFilter('range', 1);
  }
}

refreshButton.addEventListener('click', async () => {
  formStatus.textContent = 'Refreshing snapshot…';
  try {
    await refreshDashboard();
    formStatus.textContent = `Snapshot refreshed at ${formatNow()}`;
  } catch (error) {
    formStatus.textContent = error instanceof Error ? error.message : 'Refresh failed.';
  }
});

resetViewButton.addEventListener('click', () => {
  resetView();
  formStatus.textContent = 'View reset to the default dashboard state.';
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
  await sendCommand(label.trim(), target.trim());
});

document.addEventListener('click', handleFilterClick);
document.addEventListener('keydown', handleShortcut);
window.addEventListener('popstate', () => {
  const nextState = loadStateFromUrl();
  uiState.panel = nextState.panel;
  uiState.activity = nextState.activity;
  uiState.range = nextState.range;
  if (latestSnapshot) render(latestSnapshot);
});

async function init() {
  updateFilterButtons();

  try {
    const preferences = await fetchPreferences();
    applyServerPreferences(preferences);
  } catch (error) {
    console.error(error);
  }

  await refreshDashboard();

  const eventSource = new EventSource('/api/stream');
  eventSource.onopen = () => {
    setStreamState('is-live', `Last updated ${formatNow()}`);
  };
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    render(data);
  };
  eventSource.onerror = () => {
    setStreamState('is-retrying', 'Live stream interrupted. Manual refresh still works.');
  };
}

init().catch((error) => {
  console.error(error);
  formStatus.textContent = 'Unable to load the demo right now.';
  setStreamState('is-retrying', 'Initial load failed. Try refreshing the snapshot.');
});
