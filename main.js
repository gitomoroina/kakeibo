// --- main.js ---
let rawData = [];
let selectedMonth = "";
let excludeNoise = true;

window.onload = async function() {
  try {
    const data = await fetchExpenseData();
    initApp(data);
  } catch (err) {
    document.getElementById('loadingText').innerHTML = `データ取得失敗:<br><span class="text-xs text-rose-400">${err.message}</span>`;
  }
};

function initApp(data) {
  rawData = data.filter(d => !d.isCharge);
  document.getElementById('loading').style.display = 'none';
  document.getElementById('mainContent').classList.remove('hidden');

  const months = [...new Set(rawData.map(d => d.month))].sort();
  selectedMonth = months[months.length - 1] || "2026-10";

  renderMonthTabs(months);
  document.getElementById('noiseToggle').addEventListener('change', (e) => {
    excludeNoise = e.target.checked;
    updateDashboard();
  });

  ['slideIzakaya', 'slideConveni', 'slideDrink'].forEach(id => {
    document.getElementById(id).addEventListener('input', runSimulation);
  });

  updateDashboard();
}

function renderMonthTabs(months) {
  const container = document.getElementById('monthTabs');
  container.innerHTML = '';
  months.forEach(m => {
    const btn = document.createElement('button');
    const active = m === selectedMonth;
    btn.className = `px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
    }`;
    const [y, mm] = m.split('-');
    btn.textContent = `${y}年${parseInt(mm)}月`;
    btn.onclick = () => { selectedMonth = m; renderMonthTabs(months); updateDashboard(); };
    container.appendChild(btn);
  });
}

function updateDashboard() {
  const filteredAll = rawData.filter(d => excludeNoise ? !d.isNoise : true);
  const monthData = filteredAll.filter(d => d.month === selectedMonth);

  const total = monthData.reduce((s, d) => s + d.amount, 0);
  document.getElementById('kpiTotal').textContent = `¥${total.toLocaleString()}`;

  const months = [...new Set(filteredAll.map(d => d.month))].sort();
  const idx = months.indexOf(selectedMonth);
  if (idx > 0) {
    const prevTotal = filteredAll.filter(d => d.month === months[idx - 1]).reduce((s, d) => s + d.amount, 0);
    const diff = total - prevTotal;
    document.getElementById('kpiMoM').innerHTML = `前月比 <span class="${diff > 0 ? 'text-rose-400' : 'text-emerald-400'}">${diff > 0 ? '+' : ''}¥${diff.toLocaleString()}</span>`;
  } else {
    document.getElementById('kpiMoM').textContent = '前月データなし';
  }

  const microItems = monthData.filter(d => d.habitType === 'コンビニ' || d.habitType === '自販機・オフィス');
  document.getElementById('kpiMicro').textContent = `¥${microItems.reduce((s, d) => s + d.amount, 0).toLocaleString()}`;
  document.getElementById('kpiMicroCount').textContent = `月間 ${microItems.length} 回の少額決済`;

  renderHabitChart(monthData);
  renderShopRanking(monthData);
  renderHourChart(monthData);
  renderCategoryChart(filteredAll);
  prepareSimulatorStats(monthData);
  runSimulation();

  const topShop = currentShopSorted[0];
  document.getElementById('nudgeText').innerHTML = `
    <p class="text-slate-300">当月の最多出費先は <strong>${topShop ? topShop.name : '--'}（${topShop ? topShop.count : 0}回 / ¥${topShop ? topShop.amount.toLocaleString() : 0}）</strong> です。右上の「AIで深掘り分析する」を押すと、Geminiが具体的な削減策を診断します。</p>
  `;
}

async function triggerGeminiAnalysis() {
  const btn = document.getElementById('btnAiAnalyze');
  const box = document.getElementById('nudgeText');
  btn.disabled = true;
  btn.textContent = "分析中...";
  box.innerHTML = `<div class="flex items-center space-x-2 text-indigo-300 py-2"><div class="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div><span>Geminiが解析中...</span></div>`;

  const filteredAll = rawData.filter(d => excludeNoise ? !d.isNoise : true);
  const monthData = filteredAll.filter(d => d.month === selectedMonth);
  const payload = {
    total: monthData.reduce((s, d) => s + d.amount, 0),
    topShops: currentShopSorted.slice(0, 6).map(s => ({ name: s.name, count: s.count, amount: s.amount, type: s.type })),
    recentItems: monthData.slice(-35).map(d => `${d.date}(${d.dayOfWeek}) ${d.time} ${d.shop} ¥${d.amount}`)
  };

  try {
    const html = await fetchGeminiAnalysis(selectedMonth, payload);
    box.innerHTML = html;
  } catch (err) {
    box.innerHTML = `<p class="text-rose-400">分析エラー: ${err.message}</p>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "再分析";
  }
}

function switchTab(tab) {
  const isAna = tab === 'analytics';
  document.getElementById('viewAnalytics').classList.toggle('hidden', !isAna);
  document.getElementById('viewSimulator').classList.toggle('hidden', isAna);
  document.getElementById('tabBtnAnalytics').className = `flex flex-col items-center py-1 px-4 text-xs ${isAna ? 'text-indigo-400 font-bold' : 'text-slate-400 font-medium'}`;
  document.getElementById('tabBtnSimulator').className = `flex flex-col items-center py-1 px-4 text-xs ${!isAna ? 'text-indigo-400 font-bold' : 'text-slate-400 font-medium'}`;
}