// --- charts.js ---
const habitColorMap = {
  '居酒屋・バー': '#f43f5e',
  'コンビニ': '#f59e0b',
  '外食': '#10b981',
  'カフェ': '#8b5cf6',
  '自販機・オフィス': '#0ea5e9'
};

let charts = {};
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', 'Noto Sans JP', sans-serif";

function renderHabitChart(monthData) {
  const habitTotals = {};
  const habitKeys = ['居酒屋・バー', 'コンビニ', '外食', 'カフェ', '自販機・オフィス'];
  habitKeys.forEach(h => habitTotals[h] = 0);

  monthData.forEach(d => {
    if (habitTotals[d.habitType] !== undefined) habitTotals[d.habitType] += d.amount;
    else if (d.category === '食費') habitTotals['外食'] += d.amount;
  });

  const canvas = document.getElementById('habitChart');
  const ctx = canvas.getContext('2d');
  if (charts.habit) charts.habit.destroy();

  charts.habit = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: habitKeys,
      datasets: [{
        data: habitKeys.map(k => habitTotals[k]),
        backgroundColor: habitKeys.map(k => habitColorMap[k]),
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 12, padding: 10, font: { size: 11 }, color: '#e2e8f0' },
          onClick: (e, item) => openHabitModal(habitKeys[item.index])
        }
      }
    }
  });

  // 長押し検知（長押し成功で振動 → 指を離した時にモーダル表示）
  let pressTimer = null;
  let isLongPressTriggered = false;
  let targetHabit = null;
  let startX = 0, startY = 0;

  const cancel = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    isLongPressTriggered = false;
    targetHabit = null;
  };

  canvas.onpointerdown = (e) => {
    startX = e.clientX;
    startY = e.clientY;
    isLongPressTriggered = false;
    targetHabit = null;

    pressTimer = setTimeout(() => {
      if (!charts.habit) return;
      const elements = charts.habit.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
      if (elements && elements.length > 0) {
        isLongPressTriggered = true;
        targetHabit = habitKeys[elements[0].index];
        if (navigator.vibrate) navigator.vibrate(40); // 長押し検知の合図
      }
    }, 400);
  };

  canvas.onpointerup = (e) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    if (isLongPressTriggered && targetHabit) {
      e.preventDefault();
      openHabitModal(targetHabit);
    }
    isLongPressTriggered = false;
    targetHabit = null;
  };

  canvas.onpointercancel = cancel;
  canvas.onpointerleave = cancel;
  canvas.onpointermove = (e) => {
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) cancel();
  };
  canvas.oncontextmenu = (e) => e.preventDefault();
}

function renderHourChart(monthData) {
  const hours = new Array(24).fill(0);
  monthData.forEach(d => { hours[d.hour] += d.amount; });

  const ctx = document.getElementById('hourChart').getContext('2d');
  if (charts.hour) charts.hour.destroy();

  charts.hour = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hours.map((_, i) => `${i}時`),
      datasets: [{
        label: '支出額',
        data: hours,
        backgroundColor: hours.map((_, i) => (i >= 20 || i <= 2) ? '#f43f5e' : '#6366f1'),
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { font: { size: 10 } } }
      }
    }
  });
}

function renderCategoryChart(filteredAll) {
  const months = [...new Set(filteredAll.map(d => d.month))].sort().slice(-3);
  const cats = [...new Set(filteredAll.map(d => d.category))];
  const palette = {
    '食費': '#10b981', 'エンタメ': '#8b5cf6', '日用品': '#0ea5e9', '交通費': '#f59e0b',
    '通信費': '#64748b', '医療費': '#ec4899', '衣類': '#14b8a6', 'その他': '#475569',
    '旅行': '#f97316', '特別費': '#ef4444', '立替金': '#a855f7', '立替精算': '#6366f1'
  };

  const datasets = cats.map(c => ({
    label: c,
    data: months.map(m => filteredAll.filter(d => d.month === m && d.category === c).reduce((s, d) => s + d.amount, 0)),
    backgroundColor: palette[c] || '#64748b',
    borderRadius: 4
  }));

  const ctx = document.getElementById('categoryChart').getContext('2d');
  if (charts.cat) charts.cat.destroy();

  charts.cat = new Chart(ctx, {
    type: 'bar',
    data: { labels: months, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}