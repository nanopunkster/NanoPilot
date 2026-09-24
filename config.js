// =====================================================================
// NANO PILOT - CONFIG
// Edit anything here. Every label, prompt, model and X selector lives
// in this one file. After editing: chrome://extensions -> reload icon.
// =====================================================================

self.NRP_CONFIG = {

  // ---------- Reply styles (the buttons under each post) ----------
  styles: [
    // Each button has ONE job: what the reply should do to the reader.
    {
      id: "roast",
      label: "ROAST",
      hint: "Make them laugh",
      search: false,          // AUTO mode: jokes rarely need facts, saves tokens
      prompt: "Make them laugh. Roast the post or its take. Witty and sharp. Punch at the idea, never at identity. No slurs, no threats, nothing about looks, race, gender or religion."
    },
    {
      id: "love",
      label: "LOVE",
      hint: "Make them feel good",
      search: false,          // AUTO mode: love doesn't need sources
      prompt: "Make them feel good. Show genuine love for the post. Name the specific thing that is great about it and celebrate the work or the person. Warm and real. No generic 'great post', no fake flattery."
    },
    {
      id: "smart",
      label: "SMART",
      hint: "Make them learn something",
      search: true,           // AUTO mode: the fact-checked one
      prompt: "Make them learn something. Add one real, specific insight on the post's topic: a fact, stat, mechanism, example or correction. Plain words, no jargon walls. Never just 'this' or 'so true'."
    },
    {
      id: "ask",
      label: "ASK",
      hint: "Make them reply",
      search: false,
      prompt: "Make them want to reply. Ask one sharp, specific question about the post that the author would enjoy answering. Curious and real, not bait, not a quiz. A short lead-in is fine."
    }
  ],

  // ---------- Custom word input ----------
  customStyle: {
    id: "custom",
    label: "WRITE",
    placeholder: "keywords (work with every button)",
    search: true,
    prompt: "Build every reply around the user's keywords."
  },

  // ---------- Tones (dropdown on each bar) ----------
  tones: [
    { id: "dry",      label: "Dry",      prompt: "Deadpan and understated. Short. The humour comes from saying less." },
    { id: "shitpost", label: "Shitpost", prompt: "Funny dry shitpost. Low effort on purpose, absurd, meme energy, lowercase is fine, ironic. Still clever, never cringe." },
    { id: "hype",     label: "Hype",     prompt: "Loud, genuine, positive energy. Punchy." },
    { id: "savage",   label: "Savage",   prompt: "Blunt and cutting, confident, zero hedging. Still no attacks on identity." },
    { id: "chill",    label: "Chill",    prompt: "Relaxed and friendly, like talking to a mate." },
    { id: "builder",  label: "Builder",  prompt: "Solo builder voice: practical, shipping-focused, Solana and gamedev perspective, says what you would actually do." }
  ],

  // ---------- Fact-check toggle (web search) ----------
  // Popup sets the default. On each post one click flips ON / OFF.
  searchModes: [
    { id: "auto", label: "auto (SMART + WRITE search)", icon: "[~]", title: "Default auto: only SMART and WRITE fact-check (see search: in styles)" },
    { id: "on",   label: "always on", icon: "[\u25A0]", title: "Default ON: always fact-check on the web. Sources on every reply" },
    { id: "off",  label: "always off", icon: "[ ]", title: "Default OFF: never search. Fast and cheap" }
  ],

  // ---------- AI providers ----------
  providers: [
    { id: "claude", label: "Claude (Anthropic)" },
    { id: "groq",   label: "Groq" },
    { id: "openai", label: "ChatGPT (OpenAI)" }
  ],

  endpoints: {
    claude: "https://api.anthropic.com/v1/messages",
    groq:   "https://api.groq.com/openai/v1/chat/completions",
    openai: "https://api.openai.com/v1/responses"
  },

  claude: {
    apiVersion: "2023-06-01",
    webSearchTool: "web_search_20250305",   // basic web search, works on all current models
    maxTokens: 1000,
    maxPauseLoops: 3                         // resumes long web-search turns (pause_turn)
  },

  groq: {
    searchTool: "browser_search",           // Groq built-in search (GPT-OSS models only)
    toolChoice: "auto",                     // "auto" = searches when needed. "required" = must search (can error)
    reasoningModelPrefix: "openai/gpt-oss", // only these models get reasoning_effort
    reasoningEffort: "low",                 // Groq docs recommend low with browser search
    maxTokens: 1024,
    temperature: 0.9,
    maxWaitSec: 10,                          // rate limit: auto-wait if Groq asks for less than this
    backupModel: "openai/gpt-oss-20b"        // rate limit: try this model next ("" = off). Has its own free limit
  },

  openai: {
    searchTool: "web_search",               // Responses API built-in web search
    searchContextSize: "low",               // low / medium / high. low = fewest tokens
    reasoningEffort: "low",                 // sent only if the model accepts it (auto-retries without)
    maxTokens: 2000
  },

  // ---------- Defaults (overridden by the popup settings) ----------
  defaults: {
    provider: "claude",
    claudeKey: "",
    claudeModel: "claude-sonnet-5",
    groqKey: "",
    groqModel: "openai/gpt-oss-120b",
    openaiKey: "",
    openaiModel: "gpt-5.4",
    tone: "shitpost",
    searchMode: "auto",
    maxSearches: 2,
    replyCount: 3,
    maxChars: 280,
    persona: "Nano (@nanovisuals), solo dev and visual artist."
  },

  // Safe ranges for number settings
  limits: {
    maxSearches: [1, 10],
    replyCount:  [1, 5],
    maxChars:    [50, 4000]
  },

  // ---------- Text cleanup applied to every reply ----------
  replace: [
    ["\u2014", ", "],   // em dash
    ["\u2013", "-"]     // en dash
  ],
  maxSources: 4,
  maxPostChars: 800,      // long posts get trimmed before sending (saves tokens)
  cacheSize: 30,          // same post + same button = no new API call ("again" skips cache)

  // ---------- Font (bundled, falls back to system mono) ----------
  font: {
    family: "Share Tech Mono",
    file: "fonts/ShareTechMono-Regular.ttf"
  },

  // ---------- X page selectors (update here if X changes its HTML) ----------
  selectors: {
    tweet:       'article[data-testid="tweet"]',
    tweetText:   '[data-testid="tweetText"]',
    userName:    '[data-testid="User-Name"]',
    actionBar:   '[role="group"]',
    replyButton: '[data-testid="reply"]',
    dialog:      '[role="dialog"]',
    editor:      '[data-testid="tweetTextarea_0"]'
  },

  // ---------- Timing ----------
  editorWaitMs: 3000,   // how long to wait for X's reply box to open
  keepAliveMs: 20000,   // keeps the background worker awake during long searches
  requestTimeoutMs: 90000,

  // ---------- UI words ----------
  ui: {
    researching: "searching web > writing...",
    writing: "writing...",
    prompt: "nano@pilot:~$",
    factCheck: "fact-check",
    use: "use",
    copy: "cp",
    copied: "Copied. Paste it into the reply box.",
    inserted: "Dropped into the reply box. Check it, then hit Reply.",
    regenerate: "again",
    close: "x",
    sources: "src:",
    noSources: "not fact-checked",
    notVerified: "\u26A0 not verified: no sources found",
    tokens: "tok",
    left: "left/min",
    reloadNeeded: "Extension was updated. Refresh this page.",
    noKey: "Add your API key in the extension popup first.",
    openaiIncomplete: "OpenAI stopped early (token limit). Raise openai.maxTokens in config.js.",
    rateLimited: "Groq free limit hit. Wait a minute, or set search to off.",
    viaBackup: "backup",
    resetVoice: "Voice reset and saved."
  }
};
