// --- api.js ---
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwzSy0yahWPZtqiJbwwCWXg2iPxefyAyYeUmzarxp15Y317pVRvCZPdTZDpQmGHyck/exec";

async function fetchExpenseData() {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    return new Promise((resolve) => {
      google.script.run.withSuccessHandler(resolve).getExpenseData();
    });
  }
  const res = await fetch(`${GAS_API_URL}?mode=api`);
  return await res.json();
}

async function fetchGeminiAnalysis(month, payload) {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    return new Promise((resolve) => {
      google.script.run.withSuccessHandler(resolve).analyzeWithGemini(month, payload);
    });
  }
  const url = `${GAS_API_URL}?mode=ai&month=${encodeURIComponent(month)}&payload=${encodeURIComponent(JSON.stringify(payload))}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.html;
}