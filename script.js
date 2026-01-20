console.log("script.js loaded");

let naps = [];
let napStartTime = null;

const STORAGE_KEY = "babySleepData_v1";

const AGE_RULES = {
  "0-3": { wake: 1.25, naps: 5 },
  "3-4": { wake: 1.5, naps: 4 },
  "4-6": { wake: 2, naps: 3 },
  "6-9": { wake: 2.5, naps: 3 },
  "9-12": { wake: 3, naps: 2 }
};

function saveData() {
  const data = {
    naps,
    wakeTime: document.getElementById("wakeTime").value,
    age: document.getElementById("age").value,
    dark: document.body.classList.contains("dark")
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    naps = data.naps || [];
    document.getElementById("wakeTime").value = data.wakeTime || "";
    document.getElementById("age").value = data.age || "0-3";
    if (data.dark) document.body.classList.add("dark");
    renderNaps();
    recalculateBedtime();
  } catch {}
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  saveData();
}

function generatePlan() {
  recalculateBedtime();
  saveData();
}

function startNap() {
  napStartTime = new Date();
}

function endNap() {
  if (!napStartTime) return;

  const end = new Date();
  const duration = Math.round(((end - napStartTime) / 60000) / 6) / 10;

  naps.push({
    start: napStartTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    end: end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    duration,
    source: "timer"
  });

  napStartTime = null;
  saveData();
  renderNaps();
  recalculateBedtime();
}

function addManualNap() {
  const start = document.getElementById("manualNapStart").value;
  const end = document.getElementById("manualNapEnd").value;
  if (!start || !end) return;

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  let s = sh * 60 + sm;
  let e = eh * 60 + em;
  if (e <= s) e += 1440;

  const duration = Math.round(((e - s) / 60) * 10) / 10;

  naps.push({ start, end, duration, source: "manual" });
  saveData();
  renderNaps();
  recalculateBedtime();
}

function renderNaps() {
  const list = document.getElementById("napList");
  list.innerHTML = "";
  naps.forEach((n, i) => {
    const div = document.createElement("div");
    div.className = "nap";
    div.textContent = `Nap ${i+1}: ${n.start}–${n.end} (${n.duration}h)`;
    list.appendChild(div);
  });
}

function recalculateBedtime() {
  const wake = document.getElementById("wakeTime").value;
  if (!wake) return;

  const [h, m] = wake.split(":").map(Number);
  let minutes = h * 60 + m;

  const totalNap = naps.reduce((a, n) => a + n.duration * 60, 0);
  const bedtime = minutes + (14 * 60) - totalNap;

  const bh = Math.floor((bedtime % 1440) / 60);
  const bm = Math.round(bedtime % 60);

  document.getElementById("bedtime").textContent =
    `${bh.toString().padStart(2,"0")}:${bm.toString().padStart(2,"0")}`;
}

loadData();
