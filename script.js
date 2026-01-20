console.log("script.js loaded");

const STORAGE_KEY = "babySleepScheduler_v2";
const THEME_KEY = "babySleepTheme";

let dynamic = null;
let napTimerStart = null;

const rules = {
  "0-3": { wake:60, nap:60, naps:5 },
  "3-4": { wake:90, nap:75, naps:4 },
  "4-6": { wake:120, nap:90, naps:3 },
  "6-9": { wake:150, nap:90, naps:2 },
  "9-12": { wake:180, nap:90, naps:2 }
};

function minutes(t){ const [h,m]=t.split(":").map(Number); return h*60+m; }
function time(m){ return `${String(Math.floor(m/60)%24).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`; }

function generate() {
  const wake = document.getElementById("wake").value;
  const age = document.getElementById("age").value;
  if (!wake) return alert("Enter wake time");

  const r = rules[age];
  dynamic = {
    wake,
    age,
    wakeWindow: r.wake,
    napLength: r.nap,
    naps: []
  };

  render();
}

function render() {
  if (!dynamic) return;

  let cur = minutes(dynamic.wake);
  let html = "";

  const plannedNaps = Math.max(dynamic.naps.length + 1, rules[dynamic.age].naps);

  for (let i=0; i<plannedNaps; i++) {
    const nap = dynamic.naps[i];
    if (nap) {
      html += `<div>Nap ${i+1}: ${time(nap.start)}–${time(nap.end)}</div>`;
      cur = nap.end;
    } else {
      const s = cur + dynamic.wakeWindow;
      const e = s + dynamic.napLength;
      html += `<div>Nap ${i+1} (planned): ${time(s)}–${time(e)}</div>`;
      cur = e;
    }
  }

  const bedtimeMin = minutes(dynamic.wake) + 13*60;
  const bedtimeMax = minutes(dynamic.wake) + 14*60;

  html += `<div><strong>Bedtime:</strong> ${time(bedtimeMin)}–${time(bedtimeMax)}</div>`;

  document.getElementById("output").innerHTML = html;
  document.getElementById("output").classList.remove("muted");
}

function startNap() {
  napTimerStart = new Date();
  document.getElementById("napStatus").innerText = "Nap running…";
}

function endNap() {
  if (!napTimerStart || !dynamic) return;

  const end = new Date();
  const startMin = napTimerStart.getHours()*60 + napTimerStart.getMinutes();
  const endMin = end.getHours()*60 + end.getMinutes();

  dynamic.naps.push({ start:startMin, end:endMin });
  napTimerStart = null;

  document.getElementById("napStatus").innerText =
    `Recorded ${dynamic.naps.length} nap(s)`;

  render();
}

function saveDay() {
  if (!dynamic) return alert("Generate first");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dynamic));
  alert("Saved ✓");
}

function loadDay() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  dynamic = JSON.parse(raw);
  document.getElementById("wake").value = dynamic.wake;
  document.getElementById("age").value = dynamic.age;
  render();
}

/* ---------- Dark mode ---------- */
function toggleTheme() {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme();
}
function applyTheme() {
  document.body.classList.toggle("dark", localStorage.getItem(THEME_KEY)==="dark");
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  loadDay();
});
