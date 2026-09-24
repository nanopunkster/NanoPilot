// NANO PILOT - SETTINGS POPUP
// Every field with data-key saves to chrome.storage under that key.
const C = self.NRP_CONFIG;
const $ = s => document.querySelector(s);
const fields = () => document.querySelectorAll("[data-key]");

function fill(select, items) {
  items.forEach(i => { const o = document.createElement("option"); o.value = i.id; o.textContent = i.label; select.append(o); });
}
fill($("#provider"), C.providers);
fill($("#tone"), C.tones);
fill($("#searchMode"), C.searchModes);

// number ranges come from config
for (const [key, [min, max]] of Object.entries(C.limits)) {
  const input = $(`[data-key="${key}"]`);
  if (input) { input.min = min; input.max = max; }
}

function showProvider() {
  const p = $("#provider").value;
  document.querySelectorAll("[data-provider]").forEach(f => (f.hidden = f.dataset.provider !== p));
}

function read() {
  const out = {};
  fields().forEach(el => {
    const k = el.dataset.key;
    if (el.type === "checkbox") out[k] = el.checked;
    else if (el.type === "number") out[k] = el.value === "" ? C.defaults[k] : Number(el.value);
    else out[k] = el.value.trim();
  });
  return out;
}

function status(msg, bad = false) {
  const p = $("#status");
  p.textContent = msg;
  p.className = bad ? "bad" : "";
}

async function load() {
  const s = { ...C.defaults, ...(await chrome.storage.local.get(null)) };
  fields().forEach(el => {
    const v = s[el.dataset.key];
    if (el.type === "checkbox") el.checked = !!v;
    else el.value = v ?? "";
  });
  showProvider();
}

$("#provider").addEventListener("change", showProvider);
$("#resetVoice").addEventListener("click", async () => {
  $('[data-key="persona"]').value = C.defaults.persona;
  await chrome.storage.local.set({ persona: C.defaults.persona });
  status(C.ui.resetVoice);
});
$("#save").addEventListener("click", async () => {
  await chrome.storage.local.set(read());
  status("Saved. Refresh X to see changes.");
});
$("#test").addEventListener("click", async () => {
  await chrome.storage.local.set(read());
  status("Testing...");
  try {
    const r = await chrome.runtime.sendMessage({ type: "NRP_TEST" });
    r && r.ok ? status(`Works: ${r.detail}`) : status(`Error: ${r?.error || "no answer"}`, true);
  } catch (e) {
    status(`Error: ${e.message}`, true);
  }
});

load();
