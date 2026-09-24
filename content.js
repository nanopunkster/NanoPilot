// =====================================================================
// NANO PILOT - PAGE SCRIPT (runs on x.com)
// Adds the terminal bar under each post. It never posts: you click Reply.
// =====================================================================
(() => {
  const C = self.NRP_CONFIG;
  const S = C.selectors;
  let settings = { ...C.defaults };
  const cache = new Map(); // same post + same button = no new API call

  // ---------- Settings sync ----------
  chrome.storage.local.get(null).then(saved => {
    settings = { ...C.defaults, ...saved };
    document.querySelectorAll(".nrp-tone:not([data-touched])").forEach(sel => (sel.value = settings.tone));
    document.querySelectorAll(".nrp-search:not([data-touched])").forEach(b => setMode(b, settings.searchMode));
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    for (const k in changes) settings[k] = changes[k].newValue;
  });

  // ---------- Font (bundled; system mono is the backup) ----------
  (async () => {
    try {
      const buf = await (await fetch(chrome.runtime.getURL(C.font.file))).arrayBuffer();
      const face = new FontFace(C.font.family, buf);
      await face.load();
      document.fonts.add(face);
    } catch { /* falls back to system mono in styles.css */ }
  })();

  // ---------- Small helpers ----------
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const calm = matchMedia("(prefers-reduced-motion: reduce)");

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text; // textContent only: AI text is never run as HTML
    return n;
  }

  function button(cls, text, onClick) {
    const b = el("button", cls, text);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  // Stop X from treating clicks/keys in our bar as "open post" or shortcuts.
  function shield(node) {
    ["click", "mousedown", "mouseup", "pointerdown", "pointerup", "touchstart",
     "keydown", "keyup", "keypress"].forEach(ev => node.addEventListener(ev, e => e.stopPropagation()));
  }

  function send(msg) {
    try { return chrome.runtime.sendMessage(msg); }
    catch { return Promise.reject(new Error(C.ui.reloadNeeded)); }
  }

  const k = n => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n));

  // ---------- Read a post ----------
  function readPost(article) {
    const texts = [...article.querySelectorAll(S.tweetText)].map(n => n.innerText.trim());
    const nameEl = article.querySelector(S.userName);
    const author = nameEl ? nameEl.innerText.split("\n").filter(Boolean).slice(0, 2).join(" ") : "unknown";
    return { text: texts[0] || "(no text, media post)", quoted: texts[1] || "", author };
  }

  // ---------- Search mode button (auto / on / off) ----------
  // ---------- Fact-check toggle ----------
  function setMode(btn, id) {
    const mode = C.searchModes.find(m => m.id === id) || C.searchModes[0];
    btn.dataset.mode = mode.id;
    btn.textContent = `${mode.icon} ${C.ui.factCheck}`;
    btn.title = mode.title;
    btn.setAttribute("aria-pressed", mode.id === "auto" ? "mixed" : String(mode.id === "on"));
  }

  // One click flips ON / OFF (from auto it goes ON).
  function nextMode(btn) {
    btn.dataset.touched = "1";
    setMode(btn, btn.dataset.mode === "on" ? "off" : "on");
  }

  function wantsSearch(bar, styleId) {
    const mode = bar.querySelector(".nrp-search").dataset.mode;
    if (mode === "on") return true;
    if (mode === "off") return false;
    const style = styleId === C.customStyle.id ? C.customStyle : C.styles.find(s => s.id === styleId);
    return !!(style && style.search);
  }

  // ---------- The bar ----------
  function buildBar(article) {
    const bar = el("div", "nrp-bar");
    shield(bar);
    // Grid columns follow the number of styles in config.js, so it stays symmetric.
    const cols = Math.max(3, C.styles.length);
    const ctrl = Math.floor(cols / 2);
    bar.style.setProperty("--nrp-cols", cols);
    bar.style.setProperty("--nrp-ctrl-span", ctrl);
    bar.style.setProperty("--nrp-prompt-span", cols - ctrl);

    // header: prompt + cursor | search mode + tone
    const head = el("div", "nrp-head");
    const title = el("div", "nrp-prompt", C.ui.prompt);
    title.append(el("span", "nrp-cursor"));
    const controls = el("div", "nrp-controls");
    const search = button("nrp-btn nrp-search", "", () => nextMode(search));
    setMode(search, settings.searchMode);
    const tone = el("select", "nrp-tone");
    C.tones.forEach(t => { const o = el("option", "", t.label.toLowerCase()); o.value = t.id; tone.append(o); });
    tone.value = settings.tone;
    tone.addEventListener("change", () => (tone.dataset.touched = "1"));
    controls.append(search, tone);
    head.append(title, controls);

    // style buttons: equal grid
    const styles = el("div", "nrp-styles");
    C.styles.forEach(st => {
      const b = button("nrp-btn nrp-style", st.label, () => run(article, bar, st.id));
      b.title = st.hint || "";
      styles.append(b);
    });

    // keywords + write
    const inputRow = el("div", "nrp-inputrow");
    const field = el("label", "nrp-field");
    field.append(el("span", "nrp-caret", ">"));
    const input = el("input", "nrp-input");
    input.placeholder = C.customStyle.placeholder;
    input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); runCustom(); } });
    field.append(input);
    const runCustom = () => {
      if (!input.value.trim()) { input.focus(); return; }
      run(article, bar, C.customStyle.id);
    };
    inputRow.append(field, button("nrp-btn nrp-write", C.customStyle.label, runCustom));

    bar.append(head, styles, inputRow, el("div", "nrp-rule"), el("div", "nrp-out"));
    return bar;
  }

  // ---------- Generate ----------
  async function run(article, bar, styleId, force = false) {
    const out = bar.querySelector(".nrp-out");
    const payload = {
      ...readPost(article),
      style: styleId,
      tone: bar.querySelector(".nrp-tone").value,
      custom: bar.querySelector(".nrp-input").value.trim(), // keywords apply to every button
      research: wantsSearch(bar, styleId)
    };
    const key = JSON.stringify(payload);

    if (!force && cache.has(key)) { renderResults(out, article, cache.get(key), () => run(article, bar, styleId, true), true); return; }

    bar.classList.add("nrp-busy");
    out.replaceChildren(el("div", "nrp-status", payload.research ? C.ui.researching : C.ui.writing));

    const ping = setInterval(() => send({ type: "NRP_PING" }).catch(() => {}), C.keepAliveMs);
    try {
      const res = await send({ type: "NRP_GENERATE", payload });
      if (!res || !res.ok) throw new Error(res?.error || "No response");
      res.checked = payload.research;
      cache.set(key, res);
      if (cache.size > C.cacheSize) cache.delete(cache.keys().next().value);
      renderResults(out, article, res, () => run(article, bar, styleId, true), false);
    } catch (e) {
      const msg = /context invalidated|Receiving end/i.test(e.message) ? C.ui.reloadNeeded : e.message;
      out.replaceChildren(el("div", "nrp-status nrp-error", `! ${msg}`));
    } finally {
      clearInterval(ping);
      bar.classList.remove("nrp-busy");
    }
  }

  function renderResults(out, article, res, again, fromCache) {
    const list = el("div", "nrp-list");
    res.replies.forEach((text, i) => {
      const card = el("div", "nrp-card");
      const body = el("p", "nrp-text");
      const meta = el("div", "nrp-meta");
      const count = el("span", "nrp-count", `${text.length}/${res.maxChars}`);
      if (text.length > res.maxChars) count.classList.add("nrp-over");
      meta.append(
        count,
        button("nrp-btn nrp-mini", C.ui.copy, async () => { await copyText(text); toast(C.ui.copied); }),
        button("nrp-btn nrp-mini nrp-use", C.ui.use, () => insertReply(article, text))
      );
      card.append(el("span", "nrp-idx", `[${String(i + 1).padStart(2, "0")}]`), body, meta);
      list.append(card);
      typeIn(body, text, i * 120, fromCache);
    });

    const foot = el("div", "nrp-foot");
    const info = el("div", "nrp-info");
    if (res.sources.length) {
      info.append(el("span", "nrp-label", C.ui.sources));
      res.sources.forEach(s => {
        const a = el("a", "nrp-chip", new URL(s.url).hostname.replace(/^www\./, ""));
        a.href = s.url;
        a.title = s.title || s.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        info.append(a);
      });
    } else if (res.checked) {
      info.append(el("span", "nrp-label nrp-warn", C.ui.notVerified));
    } else {
      info.append(el("span", "nrp-label", C.ui.noSources));
    }
    const u = res.usage || {};
    const meter = [];
    if (fromCache) meter.push(`${C.ui.tokens} 0 (cache)`);
    else if (u.used) meter.push(`${C.ui.tokens} ${k(u.used)}`);
    if (u.left != null && !fromCache) meter.push(`${k(u.left)} ${C.ui.left}`);
    if (res.note) meter.push(res.note);
    if (meter.length) info.append(el("span", "nrp-label nrp-meter", meter.join(" | ")));

    const btns = el("div", "nrp-footbtns");
    btns.append(
      button("nrp-btn nrp-mini", C.ui.regenerate, again),
      button("nrp-btn nrp-mini", C.ui.close, () => out.replaceChildren()));
    foot.append(info, btns);

    out.replaceChildren(list, foot);
  }

  // Replies "type in" like a terminal. Skipped for reduced motion.
  function typeIn(node, text, delay, instant) {
    if (calm.matches || instant) { node.textContent = text; return; }
    node.textContent = "";
    node.classList.add("nrp-typing");
    const step = Math.max(1, Math.ceil(text.length / 45)); // done in ~0.7s whatever the length
    let i = 0;
    setTimeout(function tick() {
      i = Math.min(text.length, i + step);
      node.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(tick, 15);
      else node.classList.remove("nrp-typing");
    }, delay);
  }

  // ---------- Put text in X's reply box (you still click Reply) ----------
  async function insertReply(article, text) {
    await copyText(text); // backup, always on the clipboard

    const replyBtn = article.querySelector(S.replyButton);
    if (!replyBtn) { toast(C.ui.copied); return; }
    replyBtn.click();

    const editor = await waitFor(findEditor, C.editorWaitMs);
    if (!editor) { toast(C.ui.copied); return; }

    editor.focus();
    // Simulated paste: X's editor (Draft.js) accepts this without desyncing.
    const dt = new DataTransfer();
    dt.setData("text/plain", text);
    editor.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));

    await sleep(150);
    if (!editor.innerText.trim()) document.execCommand("insertText", false, text);
    toast(editor.innerText.trim() ? C.ui.inserted : C.ui.copied);
  }

  function findEditor() {
    const node = document.querySelector(`${S.dialog} ${S.editor}`);
    if (!node) return null;
    return node.isContentEditable ? node : node.querySelector('[contenteditable="true"]');
  }

  async function waitFor(fn, ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      const found = fn();
      if (found) return found;
      await sleep(100);
    }
    return null;
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard blocked, ignore */ }
  }

  function toast(msg) {
    let t = document.querySelector(".nrp-toast");
    if (!t) { t = el("div", "nrp-toast"); document.body.append(t); }
    t.textContent = `> ${msg}`;
    t.classList.add("nrp-show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("nrp-show"), 2600);
  }

  // ---------- Watch the feed ----------
  function scan() {
    document.querySelectorAll(S.tweet).forEach(article => {
      if (article.querySelector(":scope .nrp-bar")) return;
      const groups = article.querySelectorAll(S.actionBar);
      const actions = groups[groups.length - 1];
      const bar = buildBar(article);
      if (actions && actions.parentElement) actions.parentElement.insertBefore(bar, actions.nextSibling);
      else article.append(bar);
    });
  }

  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; scan(); });
  }).observe(document.body, { childList: true, subtree: true });
  scan();
})();
