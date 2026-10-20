// --- ranking.js ---
let currentShopSorted = [];

function renderShopRanking(monthData) {
  const shopMap = {};
  monthData.forEach(d => {
    let name = d.shop.replace(/セブン－イレブン.*/, 'セブン-イレブン')
                     .replace(/ファミリーマート.*/, 'ファミリーマート')
                     .replace(/ローソン.*/, 'ローソン')
                     .replace(/ＮｅｗＤａｙｓ.*/, 'NewDays')
                     .replace(/ネオス.*/, 'ネオス SPASE (オフィス)');
    if (!shopMap[name]) shopMap[name] = { amount: 0, count: 0, type: d.habitType, items: [] };
    shopMap[name].amount += d.amount;
    shopMap[name].count += 1;
    shopMap[name].items.push(d);
  });

  currentShopSorted = Object.entries(shopMap)
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const container = document.getElementById('shopRanking');
  container.innerHTML = '';
  const maxAmount = currentShopSorted[0]?.amount || 1;

  currentShopSorted.forEach((item, idx) => {
    const pct = Math.round((item.amount / maxAmount) * 100);
    const badgeColor = item.type === '居酒屋・バー' ? 'text-rose-400 bg-rose-500/10' :
                       item.type === 'コンビニ' ? 'text-amber-400 bg-amber-500/10' : 'text-indigo-400 bg-indigo-500/10';
    
    const detailsHtml = item.items
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
      .map(tx => `
        <div class="flex justify-between items-center py-1.5 border-b border-slate-700/40 last:border-0 text-[11px]">
          <div class="text-slate-300">
            <span class="font-mono text-slate-400">${tx.date.slice(5)}(${tx.dayOfWeek}) ${tx.time}</span>
            <span class="ml-2 text-slate-400">${tx.shop}</span>
          </div>
          <div class="font-bold text-slate-200">¥${tx.amount.toLocaleString()}</div>
        </div>
      `).join('');

    const div = document.createElement('div');
    div.className = "bg-slate-800/40 rounded-xl border border-slate-700/40 overflow-hidden select-none";
    div.innerHTML = `
      <div onclick="toggleDrilldown(${idx})" class="p-3 cursor-pointer hover:bg-slate-800/70 transition">
        <div class="flex justify-between items-center mb-1.5">
          <div class="flex items-center space-x-2 truncate pr-2">
            <span class="text-xs font-extrabold text-slate-500 w-4">${idx + 1}</span>
            <span class="text-xs font-bold text-white truncate">${item.name}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeColor}">${item.count}回</span>
          </div>
          <div class="flex items-center space-x-1.5">
            <span class="text-xs font-extrabold text-white">¥${item.amount.toLocaleString()}</span>
            <svg id="arrow-${idx}" class="w-4 h-4 text-slate-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
        <div class="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
          <div class="bg-indigo-500 h-full rounded-full" style="width: ${pct}%"></div>
        </div>
      </div>
      <div id="drill-${idx}" class="hidden bg-slate-900/80 px-3.5 py-2 border-t border-slate-700/50 max-h-48 overflow-y-auto">
        <div class="text-[10px] font-bold text-indigo-400 mb-1">利用履歴（平均 ¥${Math.round(item.amount / item.count).toLocaleString()} / 回）</div>
        ${detailsHtml}
      </div>
    `;
    container.appendChild(div);
  });
}

function toggleDrilldown(idx) {
  const el = document.getElementById(`drill-${idx}`);
  const arrow = document.getElementById(`arrow-${idx}`);
  const isHidden = el.classList.contains('hidden');
  el.classList.toggle('hidden', !isHidden);
  arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
}

function openHabitModal(habitName) {
  const filteredAll = rawData.filter(d => excludeNoise ? !d.isNoise : true);
  const monthData = filteredAll.filter(d => d.month === selectedMonth);
  const targetItems = monthData.filter(d => habitName === '外食' ? (d.habitType === '外食' || (d.category === '食費' && d.habitType === 'その他')) : d.habitType === habitName)
                               .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const total = targetItems.reduce((s, d) => s + d.amount, 0);
  const count = targetItems.length;
  const avg = count ? Math.round(total / count) : 0;

  const modalRoot = document.getElementById('habitModal');
  modalRoot.className = "fixed inset-0 z-50 select-none";
  modalRoot.style.webkitTouchCallout = "none";

  document.getElementById('modalHabitTitle').textContent = `${habitName} の明細`;
  document.getElementById('modalHabitDot').style.backgroundColor = habitColorMap[habitName] || '#6366f1';
  document.getElementById('modalHabitSummary').textContent = `${selectedMonth} 合計: ¥${total.toLocaleString()} (${count}回 / 平均 ¥${avg.toLocaleString()})`;

  const tabsContainer = document.getElementById('modalFilterTabs');
  tabsContainer.innerHTML = '';
  ['居酒屋・バー', 'コンビニ', '外食', 'カフェ', '自販機・オフィス'].forEach(k => {
    const btn = document.createElement('button');
    btn.className = `px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition ${k === habitName ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`;
    btn.textContent = k;
    btn.onclick = () => openHabitModal(k);
    tabsContainer.appendChild(btn);
  });

  const listContainer = document.getElementById('modalItemList');
  // 高さを260pxに固定（件数が少なくても縮まない）
  listContainer.className = "p-4 overflow-y-auto space-y-2 divide-y divide-slate-800/50 h-[260px] select-none";

  listContainer.innerHTML = targetItems.length === 0 ? `<div class="flex items-center justify-center h-full text-slate-500 text-xs">支出データはありません</div>` :
    targetItems.map(item => `
      <div class="pt-2 pb-1 flex justify-between items-start">
        <div class="pr-2">
          <div class="text-xs font-bold text-white">${item.shop}</div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">${item.date.slice(5)} (${item.dayOfWeek}) ${item.time} ・ ${item.service}</div>
        </div>
        <div class="text-xs font-extrabold text-white">¥${item.amount.toLocaleString()}</div>
      </div>
    `).join('');

  modalRoot.classList.remove('hidden');
}

function closeHabitModal() {
  document.getElementById('habitModal').classList.add('hidden');
}