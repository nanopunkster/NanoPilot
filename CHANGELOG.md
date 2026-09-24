# Changelog

## 1.5.0
- New button set, one job each: **ROAST** (laugh), **LOVE** (feel good), **SMART** (learn), **ASK** (reply).
- AGREE and TECHNICAL merged into SMART, the fact-checked one.
- New **ASK** style: one sharp question to start a conversation.
- Auto fact-check now only on SMART and WRITE (saves tokens).

## 1.4.0
- Renamed to **Nano Pilot**. Made by @nanovisuals.
- New style: **LOVE**. Genuine, specific positivity. Fact-check off in auto mode.
- Bar grid now sizes itself from the number of styles in `config.js` (4 columns now).
- Terminal prompt is now `nano@pilot:~$`.
- Default voice: `Nano (@nanovisuals), solo dev and visual artist.`
- Added MIT licence and a banner image.

## 1.3.0
- New provider: **ChatGPT (OpenAI)** via the Responses API, with built-in `web_search` (search size "low" to save tokens).
- Popup: OpenAI key and model fields (default `gpt-5.4`).
- Source links from OpenAI citations. Inline markdown links are stripped from reply text.
- Auto-retry without the reasoning setting for models that don't accept it.
- Token meter works with OpenAI too.
- Web search dropdown now uses short labels.
- New permission: `api.openai.com`.

## 1.2.0
- New **fact-check toggle** on every post: ON / OFF with one click, glows when on.
- Red **not verified** warning when fact-check was on but no sources came back.
- Popup: web search default (auto / on / off).

## 1.1.0
- Replies now stay on **the post and your keywords**. Your voice no longer pulls in your own projects.
- Keywords now apply to **every** button.
- **Terminal redesign:** Share Tech Mono font, 3-column grid, blinking cursor, spinner, scanner divider, type-in replies. Respects reduced motion.
- Token savers: search auto mode, shorter prompt, long posts trimmed, cache for repeat clicks, lower max tokens.
- Live token meter (used, and left per minute on Groq).
- Popup: **Reset voice** button.

## 1.0.2
- Groq rate limits: auto-wait up to 10s, then backup model `openai/gpt-oss-20b`.
- Clear message when both models are maxed.
- Per-post search toggle.

## 1.0.1
- Fixed Groq error "Tool choice is required, but model did not call a tool". Search is now optional per call (`toolChoice` in config).

## 1.0.0
- First release: ROAST / AGREE / TECHNICAL / WRITE, 6 tones, Claude or Groq with web search, source chips, fills X's reply box.
- Groq uses Browser Search on GPT-OSS models (Groq's compound models were shut down on 21 Sept 2026).
