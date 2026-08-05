const dateRangePreset = document.getElementById('dateRangePreset');
const genreFilterDashboard = document.getElementById('genreFilterDashboard');
const metricsGrid = document.getElementById('metricsGrid');
const calendarSummary = document.getElementById('calendarSummary');

let chartInstances = {};

function setStatus(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.textContent = message || '';
  el.className = 'status-area' + (type ? ` ${type}` : '');
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
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
  const genre = genreFilterDashboard.value;
  if (genre) params.set('genre', genre);
  return params.toString();
}

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
  }
}

function renderMetricCards(metrics) {
  const cards = [
    { label: 'Pages / Day', value: metrics.pagesPerDay },
    { label: 'Reading Speed (p/min)', value: metrics.readingSpeedPagesPerMinute },
    { label: 'Books Completed', value: metrics.booksCompleted },
    { label: 'Avg Rating', value: metrics.avgRating ?? '—' },
    { label: 'Most-Read Genre', value: metrics.mostReadGenre || '—' },
    { label: 'Total Sessions', value: metrics.totalSessions },
  ];

  metricsGrid.innerHTML = cards.map((c) => `
    <div class="metric-card">
      <div class="metric-value">${c.value}</div>
      <div class="metric-label">${c.label}</div>
    </div>
  `).join('');
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
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });

  const genres = genreBreakdown.map((g) => g.genre);
  genreFilterDashboard.innerHTML =
    '<option value="">All Genres</option>' +
    genres.map((g) => `<option value="${g}">${g}</option>`).join('');
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
    options: { responsive: true, plugins: { legend: { display: false } } },
  });

  return data.logs;
}

function renderCompletionChart(logs) {
  const completed = logs.filter((l) => l.bookId && l.pagesRead >= l.bookId.pages).length;
  const inProgress = logs.length - completed;

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
    options: { responsive: true },
  });
}

function renderHeatmap(logs) {
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const grid = Array.from({ length: 7 }, () => 0);

  logs.forEach((log) => {
    const day = new Date(log.date).getDay();
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

  const recent = Object.entries(byDate)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 14);

  calendarSummary.innerHTML = recent.map(([date, stats]) => `
    <div class="calendar-day">
      <div class="calendar-day-date">${date.slice(5)}</div>
      <div>${stats.pages}p · ${stats.minutes}m</div>
    </div>
  `).join('');
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
genreFilterDashboard.addEventListener('change', loadDashboard);

loadDashboard();