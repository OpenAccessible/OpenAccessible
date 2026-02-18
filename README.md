# Open Accessible

**One embed. Open source.** A single-file accessibility widget for WCAG 2.2 AA: text-to-speech, contrast, translation, dyslexia font, and 30+ tools. No backend required—works offline with browser APIs and local storage.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://opensource.org/licenses/AGPL-3.0)

---

## Features

- **Visual & reading** — Color filters (grayscale, invert, sepia, color-blind modes), dark/light theme, contrast, OpenDyslexic font, letter/line/word spacing
- **Text-to-speech** — Read page, speak selection, word-by-word highlight; browser SpeechSynthesis or optional server TTS; voice picker and rate/pitch
- **Translation** — Translate selection or full page; OSS Translate (LibreTranslate API) by default, with apiBase and MyMemory fallback; chunked for long text
- **Dictionary** — Double-click a word for definition; optional API or small built-in list; play word/definition with TTS
- **Focus & navigation** — Keyboard support (Alt+A / Option+A to open), focus trap, skip link, enlarge focus, focus strip, reading guide
- **Presets** — High contrast, Reading, Minimal, Focus; save and apply custom presets
- **Voice commands** — Optional SpeechRecognition: “Open accessibility”, “Read page”, “Stop”, etc.
- **Localization** — Locale files for Korean, Español, French, German, Norwegian, Dutch, Mandarin (see `locales/`)

Preferences persist in `localStorage`. Optional backend (`apiBase`) adds dictionary, translation, synced preferences, and server TTS.

---

## Quick start

Add one script before `</body>`. No build step.

**From CDN (jsDelivr):**

```html
<script src="https://cdn.jsdelivr.net/gh/OpenAccessible/OpenAccessible@main/widget.js"></script>
```

**Self-host:** Download [widget.js](https://github.com/OpenAccessible/OpenAccessible/blob/main/widget.js) and serve it from your site:

```html
<script src="/path/to/widget.js"></script>
```

A floating accessibility button appears; users open the panel to adjust settings.

---

## Configuration

Optional: set `window.OpenAccessibleConfig` *before* the script loads:

```html
<script>
window.OpenAccessibleConfig = {
  apiBase: 'https://your-api.com/api/',   // optional: dictionary, translate, preferences, TTS
  apiKey: 'your-key',                     // optional: sent as X-API-Key
  userId: 'user-123',                     // optional: for synced preferences
  useServerTts: false,                     // true = use apiBase for TTS
  translateApiUrl: 'https://your-translate.com/translate'  // or '' to use only apiBase/MyMemory
};
</script>
<script src="https://cdn.jsdelivr.net/gh/OpenAccessible/OpenAccessible@main/widget.js"></script>
```

---

## Keyboard shortcuts


| Action | Windows | Mac |
|--------|---------|-----|
| Open or close panel | **Alt+A** | **<kbd>⌥ Option</kbd> + <kbd>S</kbd>**|
| Close panel or overlay | **Escape** | **<kbd>⎋ Escape</kbd>** |
| Read page (in panel) | **R** | **<kbd>R</kbd>** |
| Stop reading (in panel) | **S** | **<kbd>S</kbd>** |
| Move focus in panel | **Tab** / **Shift+Tab** | **<kbd>⇥ Tab</kbd>** / **<kbd>⇧ Shift</kbd> + <kbd>⇥ Tab</kbd>** |

---

## Project structure

```
OpenAccessible/
├── widget.js          # Single-file widget (~3000 lines)
├── locales/           # Optional UI translations
│   ├── Korean.js
│   ├── Espanol.js
│   ├── French.js
│   ├── German.js
│   ├── Norwegian.js
│   ├── Dutch.js
│   └── Mandarin.js
│
├── README.md          # This file
└── License            # License File
```


---

## License

[AGPL-3.0](https://opensource.org/licenses/AGPL-3.0). You can use, modify, and distribute the code; if you run a modified version as a service, you must share the source. See [LICENSE](LICENSE) in the repo.

---

## Contributing

- **Issues:** [GitHub Issues](https://github.com/OpenAccessible/OpenAccessible/issues)
- **Code:** Open a pull request. Ensure the widget still runs with no config and with `OpenAccessibleConfig` set.

---

**Open Accessible** — WCAG 2.2 AA · ADA · Section 508
