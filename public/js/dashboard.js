const dateRangePreset = document.getElementById('dateRangePreset');
const metricsGrid = document.getElementById('metricsGrid');
const calendarSummary = document.getElementById('calendarSummary');

let chartInstances = {};

function setStatus(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.textContent = message || '';
  el.className = 'status-area' + (type ? ` ${type}` : '');
}

async function fetchJson(url) {
  const response = await authFetch(url);
  const data = await response.json();
  if (!response.ok) {
    const message = response.status === 401
      ? 'Please log in to view your dashboard.'
      : (data.error || 'Request failed');
    throw new Error(message);
  }
  return data;
}

function getDateRange() {
  const preset = dateRangePreset.value;
  if (preset === 'all') return {};

  const days = Number(preset);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

function buildQueryString() {
  const params = new URLSearchParams();
  const { startDate, endDate } = getDateRange();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  return params.toString();
}

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
  }
}

const METRIC_DEFINITIONS = [
  { key: 'pagesPerDay', label: 'Pages / Day', icon: '📖', accent: 'brown' },
  { key: 'readingSpeedPagesPerMinute', label: 'Reading Speed', unit: 'p/min', icon: '⚡', accent: 'rust' },
  { key: 'booksCompleted', label: 'Books Completed', icon: '✅', accent: 'sage' },
  { key: 'avgRating', label: 'Avg Rating', icon: '⭐', accent: 'gold', fallback: '—' },
  { key: 'mostReadGenre', label: 'Top Genre', icon: '🏷️', accent: 'teal', fallback: '—' },
  { key: 'totalSessions', label: 'Total Sessions', icon: '📚', accent: 'brown' },
];

function renderMetricCards(metrics) {
  metricsGrid.innerHTML = METRIC_DEFINITIONS.map((def) => {
    const raw = metrics[def.key];
    const value = raw === null || raw === undefined || raw === '' ? (def.fallback ?? 0) : raw;
    return `
      <div class="metric-card metric-card--${def.accent}">
        <div class="metric-icon">${def.icon}</div>
        <div class="metric-body">
          <div class="metric-value">${value}${def.unit ? `<span class="metric-unit">${def.unit}</span>` : ''}</div>
          <div class="metric-label">${def.label}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderGenreChart(genreBreakdown) {
  destroyChart('genre');
  const ctx = document.getElementById('genreChart');

  chartInstances.genre = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: genreBreakdown.map((g) => g.genre),
      datasets: [{
        label: 'Sessions',
        data: genreBreakdown.map((g) => g.sessionCount),
        backgroundColor: '#8b4513',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

async function renderPagesOverTime() {
  const qs = buildQueryString();
  const data = await fetchJson(`/api/library/reading-logs?${qs}&sort=date&limit=1000`);

  const byDate = {};
  data.logs.forEach((log) => {
    const day = log.date.slice(0, 10);
    byDate[day] = (byDate[day] || 0) + log.pagesRead;
  });

  const sortedDates = Object.keys(byDate).sort();

  destroyChart('pagesOverTime');
  const ctx = document.getElementById('pagesOverTimeChart');

  chartInstances.pagesOverTime = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates,
      datasets: [{
        label: 'Pages Read',
        data: sortedDates.map((d) => byDate[d]),
        borderColor: '#b5651d',
        backgroundColor: 'rgba(181, 101, 29, 0.15)',
        fill: true,
        tension: 0.3,
      }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });

  return data.logs;
}

function renderCompletionChart(logs) {
  // completionPercent (cumulative progress) is the right signal here — a
  // single session's own pagesRead almost never equals the book's full page
  // count, so checking pagesRead >= book.pages nearly always reads as "not
  // completed" even for sessions that actually finished a book.
  const completed = logs.filter((l) => (l.completionPercent || 0) >= 100).length;
  const inProgress = logs.length - completed;
  // ...rest of the function is unchanged

  destroyChart('completion');
  const ctx = document.getElementById('completionChart');

  chartInstances.completion = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed Sessions', 'In Progress'],
      datasets: [{
        data: [completed, inProgress],
        backgroundColor: ['#8b4513', '#e0d3c2'],
      }],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

function renderHeatmap(logs) {
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const grid = Array.from({ length: 7 }, () => 0);

    logs.forEach((log) => {
        // Use the UTC weekday, not the browser's local weekday — log.date is a
        // UTC-anchored calendar date, and mixing local/UTC time here is exactly
        // what caused this chart and the Reading Calendar below to disagree
        // about which weekday a given date actually falls on.
        const day = new Date(log.date).getUTCDay();
        grid[day] += log.pagesRead;
      });
  destroyChart('heatmap');
  const ctx = document.getElementById('heatmapChart');

  chartInstances.heatmap = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dayLabels,
      datasets: [{
        label: 'Pages Read by Day of Week',
        data: grid,
        backgroundColor: '#b5651d',
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  });
}

function renderCalendarSummary(logs) {
  const byDate = {};
  logs.forEach((log) => {
    const day = log.date.slice(0, 10);
    if (!byDate[day]) byDate[day] = { pages: 0, minutes: 0 };
    byDate[day].pages += log.pagesRead;
    byDate[day].minutes += log.minutes;
  });

  const loggedDates = Object.keys(byDate).sort();
  const anchorKey = loggedDates.length ? loggedDates[loggedDates.length - 1] : new Date().toISOString().slice(0, 10);
  const [anchorYear, anchorMonth, anchorDate] = anchorKey.split('-').map(Number);
  const anchorUTC = Date.UTC(anchorYear, anchorMonth - 1, anchorDate);

  // Built entirely from UTC timestamps so the date key and its weekday can
  // never disagree with each other, regardless of the viewer's local
  // timezone (that mismatch was the root cause of dates showing up under
  // the wrong weekday column).
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(anchorUTC - i * 86400000);
    const key = dt.toISOString().slice(0, 10);
    days.push({ date: key, weekday: dt.getUTCDay(), stats: byDate[key] || { pages: 0, minutes: 0 } });
  }

  const maxPages = Math.max(1, ...days.map((d) => d.stats.pages));
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const leadingBlanks = days.length ? days[0].weekday : 0;

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function formatFriendly(dateKey) {
    const [y, m, d] = dateKey.split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
  }

  const rangeLabel = days.length
    ? `${formatFriendly(days[0].date)} – ${formatFriendly(days[days.length - 1].date)}`
    : '';

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push('<div class="heatmap-cell heatmap-cell-empty"></div>');
  }

  days.forEach((d) => {
    const level = d.stats.pages === 0 ? 0 : Math.ceil((d.stats.pages / maxPages) * 4);
    const dayOfMonth = Number(d.date.slice(8, 10));
    const monthIndex = Number(d.date.slice(5, 7)) - 1;
    // Show "1 Aug" instead of a bare "1" on the first of a month, so a run of
    // days that crosses a month boundary (e.g. ...30, 31, 1, 2...) doesn't
    // read like day "1" of the same sequence.
    const cellLabel = dayOfMonth === 1 ? `${dayOfMonth} ${MONTH_NAMES[monthIndex]}` : String(dayOfMonth);
    const tooltip = `${formatFriendly(d.date)} — ${d.stats.pages} pages, ${d.stats.minutes} min`;
    cells.push(`
      <div class="heatmap-cell heatmap-level-${level}" title="${tooltip}">${cellLabel}</div>
    `);
  });

  calendarSummary.innerHTML = `
    <div class="heatmap-range-label">${rangeLabel}</div>
    <div class="heatmap-weekday-row">${dayLabels.map((l) => `<span>${l}</span>`).join('')}</div>
    <div class="heatmap-grid">${cells.join('')}</div>
    <div class="heatmap-legend">
      <span>Less</span>
      <span class="heatmap-cell heatmap-level-0"></span>
      <span class="heatmap-cell heatmap-level-1"></span>
      <span class="heatmap-cell heatmap-level-2"></span>
      <span class="heatmap-cell heatmap-level-3"></span>
      <span class="heatmap-cell heatmap-level-4"></span>
      <span>More</span>
    </div>
    <p class="heatmap-hint">Tap or hover a square to see its exact date, pages, and minutes.</p>
  `;
}

async function loadDashboard() {
  setStatus('dashboardStatus', 'Loading…', 'loading');
  try {
    const qs = buildQueryString();
    const metrics = await fetchJson(`/api/library/metrics?${qs}`);
    renderMetricCards(metrics);
    renderGenreChart(metrics.genreBreakdown);

    const logs = await renderPagesOverTime();
    renderCompletionChart(logs);
    renderHeatmap(logs);
    renderCalendarSummary(logs);

    setStatus('dashboardStatus', '', null);
  } catch (err) {
    setStatus('dashboardStatus', err.message, 'error');
  }
}

dateRangePreset.addEventListener('change', loadDashboard);

loadDashboard();