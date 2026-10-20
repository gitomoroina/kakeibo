// --- simulator.js ---
let userStats = { izakayaAvg: 3000, conveniAvg: 450, drinkMonthlyTotal: 3000 };

function prepareSimulatorStats(monthData) {
  const izakaya = monthData.filter(d => d.habitType === '居酒屋・バー');
  const conveni = monthData.filter(d => d.habitType === 'コンビニ');
  const drink = monthData.filter(d => d.habitType === '自販機・オフィス' || d.habitType === 'カフェ');

  const izaSum = izakaya.reduce((s, d) => s + d.amount, 0);
  const conSum = conveni.reduce((s, d) => s + d.amount, 0);
  const drkSum = drink.reduce((s, d) => s + d.amount, 0);

  userStats.izakayaAvg = izakaya.length ? Math.round(izaSum / izakaya.length) : 3000;
  userStats.conveniAvg = conveni.length ? Math.round(conSum / conveni.length) : 450;
  userStats.drinkMonthlyTotal = drkSum || 2500;

  document.getElementById('simIzakayaStats').textContent = `当月: ${izakaya.length}回 (計¥${izaSum.toLocaleString()})`;
  document.getElementById('unitIzakaya').textContent = `（平均単価: ¥${userStats.izakayaAvg.toLocaleString()}/回 で算出）`;
  document.getElementById('simConveniStats').textContent = `当月: ${conveni.length}回 (計¥${conSum.toLocaleString()})`;
  document.getElementById('unitConveni').textContent = `（平均単価: ¥${userStats.conveniAvg.toLocaleString()}/回 で算出）`;
  document.getElementById('simDrinkStats').textContent = `当月: ${drink.length}回 (計¥${drkSum.toLocaleString()})`;
}

function runSimulation() {
  const izaCut = parseInt(document.getElementById('slideIzakaya').value);
  const conCutWeekly = parseInt(document.getElementById('slideConveni').value);
  const drkCutPct = parseInt(document.getElementById('slideDrink').value);

  document.getElementById('valIzakaya').textContent = izaCut;
  document.getElementById('valConveni').textContent = conCutWeekly;
  document.getElementById('valDrink').textContent = drkCutPct;

  const monthlySave = (izaCut * userStats.izakayaAvg) +
                      (conCutWeekly * 4.3 * userStats.conveniAvg) +
                      (userStats.drinkMonthlyTotal * (drkCutPct / 100));

  const mRound = Math.round(monthlySave);
  const yRound = mRound * 12;

  const r = 0.05 / 12;
  const n = 60;
  const futureValue = Math.round(mRound * ((Math.pow(1 + r, n) - 1) / r));

  document.getElementById('resMonthly').textContent = `¥${mRound.toLocaleString()}`;
  document.getElementById('resYearly').textContent = `¥${yRound.toLocaleString()}`;
  document.getElementById('resInvest').textContent = `¥${futureValue.toLocaleString()}`;

  let reward = "";
  if (yRound >= 150000) reward = `年間 <strong>¥${yRound.toLocaleString()}</strong> あれば、毎年「2泊3日の地方温泉＆地酒巡り旅」に2〜3回行ってもお釣りが来ます。`;
  else if (yRound >= 70000) reward = `年間 <strong>¥${yRound.toLocaleString()}</strong> あれば、欲しかったハイエンドなガジェットやギアが毎年1つ実質タダで手に入ります。`;
  else if (yRound > 0) reward = `年間 <strong>¥${yRound.toLocaleString()}</strong> あれば、希少な銘柄の日本酒（四合瓶）を年間${Math.floor(yRound/3500)}本楽しめます。`;
  else reward = `スライダーを動かして、無理のない削減ラインを探ってみましょう。`;
  document.getElementById('resReward').innerHTML = reward;
}