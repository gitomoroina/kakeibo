// --- ranking.js ---
let currentShopSorted = [];

function renderShopRanking(monthData) {
  const container = document.getElementById('shopRanking');
  if (!container) return;
  container.innerHTML = '';

  const shopMap = {};
  monthData.forEach(d => {
    let raw = d.shop || '不明';
    let name = raw.replace(/セブン－イレブン.*/, 'セブン-イレブン')
                  .replace(/ファミリーマート.*/, 'ファミリーマート')
                  .replace(/ローソン.*/, 'ローソン')
                  .replace(/ＮｅｗＤａｙｓ.*/, 'NewDays')
                  .replace(/ネオス.*/, 'ネオス SPASE (オフィス)');
    if (!shopMap[name]) shopMap[name] = { amount: 0, count: 0, type: d.habitType || 'その他', items: [] };
    shopMap[name].amount += (d.amount || 0);
    shopMap[name].count += 1;
    shopMap[name].items.push(d);
  });

  currentShopSorted = Object.entries(shopMap)
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.amount - a.amount).slice(0, 10);

  if (currentShopSorted.length === 0) return;
  const max = currentShopSorted[0].amount || 1;

  container.innerHTML = currentShopSorted.map((item, idx) => {
    const pct = Math.round((item.amount / max) * 100);
    const color = item.type === '居酒屋・バー' ? 'text-rose-400 bg-rose-500/10' :
                  item.type === 'コンビニ' ? 'text-amber-400 bg-amber-500/10' : 'text-indigo-400 bg-indigo-500/10';
    const rows = item.items.map(tx => `
      <div class="flex justify-between py-1 border-b border-slate-700/40 text-[11px]">
        <span class="text-slate-400 font-mono">${(tx.date||'').slice(5)} ${tx.time||''} <span class="text-slate-300 ml-1">${tx.shop||''}</span></span>
        <span class="font-bold text-slate-200">¥${(tx.amount||0).toLocaleString()}</span>
      </div>`).join('');

    return `
      <div class="bg-slate-800/40 rounded-xl border border-slate-700/40 overflow-hidden select-none mb-2">
        <div onclick="toggleDrilldown(${idx})" class="p-3 cursor-pointer hover:bg-slate-800/70">
          <div class="flex justify-between items-center mb-1.5">
            <div class="flex items-center space-x-2 truncate"><span class="text-xs text-slate-500 font-bold">${idx+1}</span><span class="text-xs font-bold text-white truncate">${item.name}</span><span class="text-[10px] px-2 py-0.5 rounded-full ${color}">${item.count}回</span></div>
            <span class="text-xs font-extrabold text-white">¥${item.amount.toLocaleString()}</span>
          </div>
          <div class="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden"><div class="bg-indigo-500 h-full rounded-full" style="width: ${pct}%"></div></div>
        </div>
        <div id="drill-${idx}" class="hidden bg-slate-900/80 px-3 py-2 border-t border-slate-700/50 max-h-48 overflow-y-auto">${rows}</div>
      </div>`;
  }).join('');
}

function toggleDrilldown(idx) {
  const el = document.getElementById(`drill-${idx}`);
  if (el) el.classList.toggle('hidden');
}

function openHabitModal(habitName) {
  const monthData = rawData.filter(d => excludeNoise ? !d.isNoise : true).filter(d => d.month === selectedMonth);
  const items = monthData.filter(d => habitName === '外食' ? (d.habitType === '外食' || (d.category === '食費' && d.habitType === 'その他')) : d.habitType === habitName);
  const total = items.reduce((s, d) => s + (d.amount || 0), 0);

  document.getElementById('modalHabitTitle').textContent = `${habitName} の明細`;
  document.getElementById('modalHabitDot').style.backgroundColor = habitColorMap[habitName] || '#6366f1';
  document.getElementById('modalHabitSummary').textContent = `${selectedMonth} 合計: ¥${total.toLocaleString()} (${items.length}回)`;

  document.getElementById('modalFilterTabs').innerHTML = ['居酒屋・バー', 'コンビニ', '外食', 'カフェ', '自販機・オフィス'].map(k => `
    <button onclick="openHabitModal('${k}')" class="px-3 py-1 rounded-full text-[11px] font-bold ${k === habitName ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}">${k}</button>
  `).join('');

  const list = document.getElementById('modalItemList');
  list.style.cssText = "height: 260px !important; min-height: 260px !important; max-height: 260px !important; overflow-y: auto !important;";
  list.innerHTML = items.length === 0 ? '<div class="flex items-center justify-center h-full text-slate-500 text-xs">データなし</div>' :
    items.map(i => `
      <div class="pt-2 pb-1 flex justify-between items-start text-xs">
        <div><div class="font-bold text-white">${i.shop||'不明'}</div><div class="text-[10px] text-slate-400 font-mono">${(i.date||'').slice(5)} ${i.time||''}</div></div>
        <div class="font-extrabold text-white">¥${(i.amount||0).toLocaleString()}</div>
      </div>`).join('');

  document.getElementById('habitModal').classList.remove('hidden');
}

function closeHabitModal() { document.getElementById('habitModal').classList.add('hidden'); }