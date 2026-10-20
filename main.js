// --- main.js ---
let rawData = [], selectedMonth = "", excludeNoise = true;

window.onload = async function() {
  try {
    const data = await fetchExpenseData();
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
  } catch (err) {
    document.getElementById('loadingText').innerHTML = `エラー: ${err.message}`;
  }
};

function renderMonthTabs(months) {
  const container = document.getElementById('monthTabs');
  container.innerHTML = months.map(m => `
    <button onclick="selectedMonth='${m}';renderMonthTabs([${months.map(x=>`'${x}'`)}]);updateDashboard();" 
      class="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${m === selectedMonth ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}">
      ${m.split('-')[0]}年${parseInt(m.split('-')[1])}月
    </button>`).join('');
}

function updateDashboard() {
  const filtered = rawData.filter(d => excludeNoise ? !d.isNoise : true);
  const mData = filtered.filter(d => d.month === selectedMonth);
  const total = mData.reduce((s, d) => s + (d.amount || 0), 0);
  document.getElementById('kpiTotal').textContent = `¥${total.toLocaleString()}`;

  const micro = mData.filter(d => d.habitType === 'コンビニ' || d.habitType === '自販機・オフィス');
  document.getElementById('kpiMicro').textContent = `¥${micro.reduce((s, d) => s + (d.amount || 0), 0).toLocaleString()}`;
  document.getElementById('kpiMicroCount').textContent = `月間 ${micro.length} 回の少額決済`;

  renderHabitChart(mData);
  renderShopRanking(mData);
  renderHourChart(mData);
  renderCategoryChart(filtered);
  prepareSimulatorStats(mData);
  runSimulation();

  const top = (currentShopSorted && currentShopSorted[0]) ? currentShopSorted[0] : null;
  document.getElementById('nudgeText').innerHTML = `<p class="text-slate-300">当月最多: <strong>${top ? top.name : '--'} (${top ? top.count : 0}回/¥${top ? top.amount.toLocaleString() : 0})</strong></p>`;
}

async function triggerGeminiAnalysis() {
  const btn = document.getElementById('btnAiAnalyze'), box = document.getElementById('nudgeText');
  btn.disabled = true; btn.textContent = "分析中...";
  box.innerHTML = `<span class="text-indigo-300 text-xs">Geminiが解析中...</span>`;

  const mData = rawData.filter(d => excludeNoise ? !d.isNoise : true).filter(d => d.month === selectedMonth);
  const payload = {
    total: mData.reduce((s, d) => s + (d.amount || 0), 0),
    topShops: (currentShopSorted || []).slice(0, 5).map(s => ({ name: s.name, count: s.count, amount: s.amount, type: s.type })),
    recentItems: mData.slice(-10).map(d => `${(d.date||'').slice(5)} ${d.time||''} ${d.shop||''} ¥${d.amount||0}`)
  };

  try {
    box.innerHTML = await fetchGeminiAnalysis(selectedMonth, payload);
  } catch (err) {
    box.innerHTML = `<p class="text-rose-400">分析エラー: ${err.message}</p>`;
  } finally {
    btn.disabled = false; btn.textContent = "再分析";
  }
}

function switchTab(tab) {
  const isAna = tab === 'analytics';
  document.getElementById('viewAnalytics').classList.toggle('hidden', !isAna);
  document.getElementById('viewSimulator').classList.toggle('hidden', isAna);
  document.getElementById('tabBtnAnalytics').className = `flex flex-col items-center py-1 px-4 text-xs ${isAna ? 'text-indigo-400 font-bold' : 'text-slate-400 font-medium'}`;
  document.getElementById('tabBtnSimulator').className = `flex flex-col items-center py-1 px-4 text-xs ${!isAna ? 'text-indigo-400 font-bold' : 'text-slate-400 font-medium'}`;
}