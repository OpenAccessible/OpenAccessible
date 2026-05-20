(function initOpenAccessibleWidget() {
    if (window.__openAccessibleWidgetLoaded) return;
    window.__openAccessibleWidgetLoaded = true;
  
    const SETTINGS = [
      {
        id: "high_contrast",
        label: "High Contrast",
        icon: "contrast",
        whatItDoes: "Uses a dark background with bright text for stronger contrast.",
      },
      {
        id: "light_contrast",
        label: "Light Contrast",
        icon: "sun",
        whatItDoes: "Uses a clean light palette with darker text for easier reading.",
      },
      {
        id: "invert_colors",
        label: "Invert Colors",
        icon: "invert",
        whatItDoes: "Flips light and dark colors across the page (photo-negative style).",
      },
      {
        id: "grayscale",
        label: "Grayscale",
        icon: "grayscale",
        whatItDoes: "Removes color so the page appears in shades of gray.",
      },
      {
        id: "stop_animations",
        label: "Stop Animations",
        icon: "pause",
        whatItDoes: "Turns off motion from animations, transitions, and smooth scrolling.",
      },
      {
        id: "reading_guide",
        label: "Reading Guide",
        icon: "guide",
        whatItDoes: "Shows a horizontal bar that follows your pointer to help track lines.",
      },
      {
        id: "highlight_links",
        label: "Highlight Links",
        icon: "link",
        whatItDoes: "Makes links easier to spot with a highlighted background.",
      },
      {
        id: "highlight_focus",
        label: "Focus Highlight",
        icon: "focus",
        whatItDoes: "Makes the keyboard focus ring thicker and easier to see.",
      },
      {
        id: "large_cursor",
        label: "Large Cursor",
        icon: "cursor",
        whatItDoes: "Increases the size of the mouse pointer on the page.",
      },
      {
        id: "dyslexia_font",
        label: "Readable Font",
        icon: "font",
        whatItDoes: "Switches to a simpler, more readable font for body text.",
      },
      {
        id: "hide_images",
        label: "Hide Images",
        icon: "imageOff",
        whatItDoes: "Hides pictures while keeping the rest of the layout in place.",
      },
      {
        id: "letter_spacing_wide",
        label: "Letter spacing",
        icon: "letterWide",
        whatItDoes: "Adds extra space between letters in the page text.",
      },
      {
        id: "text_size_boost",
        label: "Larger text",
        icon: "textBig",
        whatItDoes: "Slightly increases the base text size across the page.",
      },
      {
        id: "line_height_boost",
        label: "Line spacing",
        icon: "lineSpread",
        whatItDoes: "Increases space between lines of text for easier reading.",
      },
      {
        id: "bold_text",
        label: "Bold text",
        icon: "boldStrong",
        whatItDoes: "Uses a heavier font weight so text stands out more.",
      },
      {
        id: "box_titles",
        label: "Box headings",
        icon: "titleFrame",
        whatItDoes: "Draws a visible box around headings to separate sections.",
      },
      {
        id: "boxed_links",
        label: "Box links",
        icon: "linkBox",
        whatItDoes: "Draws a visible box around links (including image links).",
      },
    ];
  
    const PROFILES = [
      {
        id: "blind",
        label: "Blind",
        icon: "blind",
        settings: [
          "highlight_focus",
          "highlight_links",
          "large_cursor",
          "letter_spacing_wide",
          "text_size_boost",
        ],
        textScale: 1.2,
        lineHeight: 1.2,
        letterSpacing: 0.03,
      },
      {
        id: "epilepsy",
        label: "Epilepsy Safe",
        icon: "epilepsy",
        settings: ["stop_animations", "high_contrast"],
        textScale: 1,
        lineHeight: 1.1,
        letterSpacing: 0,
      },
      {
        id: "adhd",
        label: "ADHD",
        icon: "adhd",
        settings: ["reading_guide", "highlight_links", "stop_animations"],
        textScale: 1.06,
        lineHeight: 1.3,
        letterSpacing: 0.02,
      },
      {
        id: "autism",
        label: "Autism",
        icon: "autism",
        settings: ["stop_animations", "light_contrast"],
        textScale: 1.05,
        lineHeight: 1.25,
        letterSpacing: 0.01,
      },
      {
        id: "motor",
        label: "Motor Impairment",
        icon: "motor",
        settings: ["highlight_focus", "large_cursor"],
        textScale: 1.1,
        lineHeight: 1.2,
        letterSpacing: 0.01,
      },
      {
        id: "vision",
        label: "Vision Impaired",
        icon: "vision",
        settings: [
          "high_contrast",
          "highlight_links",
          "text_size_boost",
          "boxed_links",
          "letter_spacing_wide",
        ],
        textScale: 1.25,
        lineHeight: 1.3,
        letterSpacing: 0.03,
      },
      {
        id: "cognitive",
        label: "Cognitive Support",
        icon: "cognitive",
        settings: [
          "dyslexia_font",
          "reading_guide",
          "highlight_links",
          "letter_spacing_wide",
          "line_height_boost",
          "box_titles",
          "boxed_links",
          "bold_text",
        ],
        textScale: 1.1,
        lineHeight: 1.35,
        letterSpacing: 0.02,
      },
    ];
  
    const STORAGE_KEY = "open_accessible_widget_state_v4";
    const CLASS_PREFIX = "oa11y_";
    const OA_CONFIG = window.__openAccessibleConfig || {};
    const OA_FEATURES = OA_CONFIG.features || {};
    const OA_TOKEN = OA_CONFIG.token || "";
    let OPENACCESSIBLE_DICTIONARY_URL =
      OA_CONFIG.endpoints?.dictionary || "https://api.openaccessible.com/api/v1/";
    let LIBRE_TRANSLATE_ORIGIN =
      OA_CONFIG.endpoints?.translate || "https://osstranslate-cbjjn-u5208.vm.elestio.app";
    const OA_ANALYTICS_URL = OA_CONFIG.endpoints?.analytics || "";

    function featureEnabled(key) {
      if (!OA_CONFIG.plan) return true;
      return Boolean(OA_FEATURES[key]);
    }

    function trackEvent(eventType, meta) {
      if (!OA_ANALYTICS_URL || !OA_TOKEN) return;
      try {
        fetch(OA_ANALYTICS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-OpenAccessible-Token": OA_TOKEN,
          },
          body: JSON.stringify({ event_type: eventType, meta: meta || {} }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    }
  
    /** Browser speech synthesis (read-aloud) locale hints â€” not tied to LibreTranslate codes. `region` picks the option icon. */
    const READ_ALOUD_LANG_OPTIONS = [
      { code: "en-US", label: "English (United States)", region: "americas" },
      { code: "en-GB", label: "English (United Kingdom)", region: "europe" },
      { code: "es-ES", label: "Spanish (Spain)", region: "europe" },
      { code: "es-MX", label: "Spanish (Mexico)", region: "americas" },
      { code: "fr-FR", label: "French", region: "europe" },
      { code: "de-DE", label: "German", region: "europe" },
      { code: "it-IT", label: "Italian", region: "europe" },
      { code: "pt-BR", label: "Portuguese (Brazil)", region: "americas" },
      { code: "pt-PT", label: "Portuguese (Portugal)", region: "europe" },
      { code: "nl-NL", label: "Dutch", region: "europe" },
      { code: "ja-JP", label: "Japanese", region: "asia" },
      { code: "ko-KR", label: "Korean", region: "asia" },
      { code: "zh-CN", label: "Chinese (Mandarin)", region: "asia" },
      { code: "hi-IN", label: "Hindi", region: "asia" },
      { code: "ar-SA", label: "Arabic", region: "middleEast" },
      { code: "ru-RU", label: "Russian", region: "europe" },
      { code: "pl-PL", label: "Polish", region: "europe" },
      { code: "sv-SE", label: "Swedish", region: "europe" },
      { code: "tr-TR", label: "Turkish", region: "europe" },
      { code: "vi-VN", label: "Vietnamese", region: "asia" },
    ];
  
    /** Icon key used in {@link SVG_ICONS} per read-aloud region. */
    const READ_ALOUD_REGION_ICON = {
      americas: "voiceAmericas",
      europe: "voiceEurope",
      asia: "voiceAsia",
      middleEast: "voiceMiddleEast",
    };
  
    const SVG_ICONS = {
      blind:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/></svg>',
      epilepsy:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h6l-1 8 9-13h-6l1-7Z"/></svg>',
      adhd:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 2"/></svg>',
      autism:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6v6H9zM3 9h6v6H3zM9 15h6v6H9zM15 9h6v6h-6z"/></svg>',
      motor:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V5a1 1 0 1 1 2 0v5"/><path d="M9 10V4a1 1 0 1 1 2 0v6"/><path d="M11 10V5a1 1 0 1 1 2 0v5"/><path d="M13 11V7a1 1 0 1 1 2 0v7a5 5 0 0 1-10 0v-3a1 1 0 1 1 2 0"/></svg>',
      vision:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/></svg>',
      cognitive:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 4a3.5 3.5 0 0 0-2 6.4A4 4 0 0 0 8 18h7a4 4 0 0 0 .5-7.6A3.5 3.5 0 0 0 14.5 4"/><path d="M9 12h6M10 15h4"/></svg>',
      contrast:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z"/></svg>',
      sun:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>',
      invert:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18Z"/><path d="M12 3a9 9 0 0 1 0 18"/></svg>',
      grayscale:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 4v16"/></svg>',
      pause:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
      guide:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/><path d="M18 16v4M16 18h4"/></svg>',
      link:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14 8 16a3 3 0 1 1-4-4l2-2a3 3 0 0 1 4 0"/><path d="m14 10 2-2a3 3 0 0 1 4 4l-2 2a3 3 0 0 1-4 0"/><path d="M8 12h8"/></svg>',
      focus:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>',
      cursor:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3 10 19l2-5 5-2Z"/></svg>',
      font:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 10 4h4l6 16"/><path d="M7 14h10"/></svg>',
      imageOff:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 17 5-5 4 4 3-3 6 6M9 9h.01M4 4l16 16"/></svg>',
      fallback:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
      fab: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5.5" r="2"/><path d="M12 10v13M9 21h6M8 14h8"/></svg>',
      letterWide:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h3M16 12h3"/><path d="M8 16 10 8h4l2 8"/><path d="M9 13h6"/></svg>',
      textBig:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 18V7h6"/><path d="M8 21h11"/><path d="M13 7V6"/></svg>',
      lineSpread:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h14M5 15h14"/><path d="M5 12h14"/><path d="M7 18h10"/></svg>',
      boldStrong:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 17V7h6a3 3 0 0 1 0 6H8"/><path d="M8 13h7a3 3 0 0 1 0 6H8"/></svg>',
      titleFrame:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M9 10h7M10 13h5"/></svg>',
      linkBox:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 12h-.5a2.5 2.5 0 0 1 0-5H11a2.5 2.5 0 0 1 2 4"/><path d="M14 13h.5a2.5 2.5 0 0 1 0 5H13"/></svg>',
      speechReadAloud:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M8 10v1a4 4 0 1 0 8 0v-1"/><path d="M12 17v5M19 18a7 7 0 1 1-14 0v-1"/><path d="M9 22h6"/></svg>',
      voiceAmericas:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8c2-2 5-3 8-3 4 0 7 2 8 5-1 3-3 5-6 6-2-1-3-3-3-5 0-2 1-3 2-4-2 0-4 1-5 3-1 2-1 4 0 6-2-1-3-3-4-5Z"/><path d="M9 16c1 2 3 3 5 3 2 0 4-1 5-3"/></svg>',
      voiceEurope:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4c-3 0-5 2-6 5 1 1 2 2 3 2 1-2 2-3 4-3 2 0 3 1 4 3 1 0 2-1 3-2-1-3-4-5-8-5Z"/><path d="M7 12c0 3 2 6 5 7 3-1 5-4 5-7-2 1-4 1-5-1-1 2-3 2-5 1Z"/></svg>',
      voiceAsia:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M8 9h4l1 3-2 4-3-1V9Z"/><path d="M15 10v5l3-2-2-5h-1Z"/><path d="M10 16h6"/></svg>',
      voiceMiddleEast:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17c2-6 8-14 13-13 2 6-6 17-13 17-2 0-3 0 0-4Z"/><path d="M8 17h8"/><circle cx="10" cy="11" r="1.25"/><circle cx="14" cy="11" r="1.25"/></svg>',
    };
  
    /** Classes applied on #oa11y-content-shell (page content root), never on document.body â€” keeps fixed widget positioning stable with filters plus scoped typography styles. */
    const SHELL_CLASS_SETTINGS = new Set([
      "invert_colors",
      "grayscale",
      "bold_text",
      "box_titles",
      "boxed_links",
    ]);
    // 
    const state = {
      activeProfile: null,
      settings: {},
      textScale: 1,
      lineHeight: 1,
      letterSpacing: 0,
      readerLang: "en-US",
      translateSource: "auto",
      translateTarget: "es",
    };
    SETTINGS.forEach((item) => {
      state.settings[item.id] = false;
    });
  
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: "OpenDyslexic";
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src:
          local("OpenDyslexic"),
          local("Open Dyslexic"),
          url("https://cdn.jsdelivr.net/npm/@fontsource/open-dyslexic/files/open-dyslexic-latin-400-normal.woff2")
            format("woff2");
      }
      :root {
        --oa11y-text-size-multiplier: 1;
        --oa11y-line-height-multiplier: 1;
        --oa11y-letter-spacing: 0;
      }
      html {
        font-size: calc(16px * var(--oa11y-text-size-multiplier));
        line-height: calc(1.5 * var(--oa11y-line-height-multiplier));
        letter-spacing: var(--oa11y-letter-spacing);
      }
      /*
       * Page content wrapper: invert/grayscale filters must NOT live on document.body â€”
       * filter creates a containing block and breaks position:fixed (widget would jump).
       */
      #oa11y-content-shell {
        display: block;
        min-height: 100%;
        isolation: isolate;
      }
      #oa11y-panel, #oa11y-panel * {
        box-sizing: border-box;
      }
      #oa11y-toggle {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483646;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 18px 12px 14px;
        border: 0;
        border-radius: 999px;
        cursor: pointer;
        color: #fff;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.02em;
        background: linear-gradient(135deg, #2563eb 0%, #6d28d9 55%, #7c3aed 100%);
        box-shadow:
          0 4px 14px rgba(37, 99, 235, 0.45),
          0 12px 40px rgba(15, 23, 42, 0.18);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      #oa11y-toggle:hover {
        box-shadow:
          0 6px 20px rgba(37, 99, 235, 0.5),
          0 16px 48px rgba(15, 23, 42, 0.22);
      }
      #oa11y-toggle:focus-visible {
        outline: 3px solid #fbbf24;
        outline-offset: 3px;
      }
      .oa11y-fab__icon {
        display: inline-flex;
        width: 26px;
        height: 26px;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
      .oa11y-fab__icon svg {
        width: 16px;
        height: 16px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .oa11y-fab__text {
        white-space: nowrap;
      }
      @media (prefers-reduced-motion: no-preference) {
        #oa11y-toggle:hover {
          transform: translateY(-2px);
        }
        #oa11y-toggle:active {
          transform: translateY(0);
        }
      }
      #oa11y-panel {
        --oa11y-surface: #ffffff;
        --oa11y-surface-2: #f8fafc;
        --oa11y-border: rgba(148, 163, 184, 0.35);
        --oa11y-text: #0f172a;
        --oa11y-muted: #64748b;
        --oa11y-accent: #4f46e5;
        --oa11y-accent-soft: rgba(79, 70, 229, 0.12);
        position: fixed;
        right: 18px;
        bottom: 76px;
        width: min(420px, calc(100vw - 28px));
        max-height: calc(100vh - 100px);
        overflow: hidden;
        z-index: 2147483646;
        display: none;
        border-radius: 18px;
        border: 1px solid var(--oa11y-border);
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        color: var(--oa11y-text);
        background: var(--oa11y-surface);
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.6) inset,
          0 24px 48px -12px rgba(15, 23, 42, 0.18),
          0 12px 24px -8px rgba(15, 23, 42, 0.12);
      }
      #oa11y-panel[data-open="true"] {
        display: block;
      }
      .oa11y-panel-scroll {
        max-height: calc(100vh - 100px);
        overflow-y: auto;
        padding: 16px;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
      }
      .oa11y-panel-scroll::-webkit-scrollbar {
        width: 8px;
      }
      .oa11y-panel-scroll::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 8px;
      }
      .oa11y-hero {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 14px;
        border-bottom: 1px solid rgba(226, 232, 240, 0.9);
      }
      .oa11y-hero-text h2 {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.2;
        background: linear-gradient(135deg, #1e293b 0%, #4f46e5 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .oa11y-tagline {
        margin: 0;
        font-size: 13px;
        color: var(--oa11y-muted);
        font-weight: 500;
        line-height: 1.35;
      }
      button.oa11y-close {
        flex-shrink: 0;
        width: 38px;
        height: 38px;
        border: 1px solid var(--oa11y-border);
        border-radius: 12px;
        background: var(--oa11y-surface-2);
        color: #475569;
        font-size: 22px;
        line-height: 1;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      }
      button.oa11y-close:hover {
        background: #f1f5f9;
        color: #0f172a;
        border-color: #cbd5e1;
      }
      button.oa11y-close:focus-visible {
        outline: 3px solid #c4b5fd;
        outline-offset: 2px;
      }
      .oa11y-section {
        margin-bottom: 16px;
      }
      .oa11y-section:last-of-type {
        margin-bottom: 0;
      }
      .oa11y-section-title {
        margin: 0 0 10px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: var(--oa11y-muted);
      }
      .oa11y-profile {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .oa11y-profile button {
        cursor: pointer;
        position: relative;
        border: 1px solid rgba(226, 232, 240, 0.95);
        border-radius: 14px;
        padding: 10px 8px;
        text-align: left;
        min-height: 82px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 6px;
        background: linear-gradient(155deg, #ffffff 0%, #f8fafc 100%);
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        color: var(--oa11y-text);
      }
      .oa11y-profile button:hover {
        border-color: #c7d2fe;
        box-shadow: 0 6px 16px rgba(79, 70, 229, 0.12);
      }
      .oa11y-profile button[aria-pressed="true"] {
        border-color: var(--oa11y-accent);
        background: linear-gradient(155deg, #eef2ff 0%, #e0e7ff 100%);
        box-shadow:
          0 0 0 2px var(--oa11y-accent-soft),
          0 10px 24px rgba(79, 70, 229, 0.15);
      }
      .oa11y-profile button:focus-visible {
        outline: none;
        box-shadow:
          0 0 0 3px #fef3c7,
          0 0 0 5px #4f46e5;
      }
      @media (prefers-reduced-motion: no-preference) {
        .oa11y-profile button:hover {
          transform: translateY(-2px);
        }
        .oa11y-profile button:active {
          transform: translateY(0);
        }
      }
      .oa11y-profile-icon {
        width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: rgba(79, 70, 229, 0.1);
        color: var(--oa11y-accent);
      }
      .oa11y-profile button[aria-pressed="true"] .oa11y-profile-icon {
        background: #fff;
        color: var(--oa11y-accent);
      }
      .oa11y-profile-icon svg,
      .oa11y-setting-icon svg {
        width: 100%;
        height: 100%;
        stroke: currentColor;
        fill: none;
        stroke-width: 1.85;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .oa11y-profile-label {
        font-size: 11.5px;
        font-weight: 700;
        line-height: 1.25;
        letter-spacing: -0.01em;
        color: #1e293b;
      }
      .oa11y-settings-card {
        border: 1px solid rgba(226, 232, 240, 0.95);
        border-radius: 14px;
        overflow: hidden;
        background: var(--oa11y-surface-2);
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
      }
      .oa11y-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 11px 12px;
        border-bottom: 1px solid rgba(241, 245, 249, 0.9);
        background: #fff;
      }
      .oa11y-setting-col {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .oa11y-setting-head {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        font-size: 13.5px;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
      }
      .oa11y-setting-head .oa11y-setting-icon {
        margin-top: 1px;
        order: -1;
      }
      .oa11y-setting-desc {
        display: block;
        margin: 0;
        padding-left: 42px;
        font-size: 12px;
        font-weight: 400;
        line-height: 1.35;
        color: #64748b;
      }
      .oa11y-row:last-child {
        border-bottom: 0;
      }
      .oa11y-row:hover {
        background: #fafbfc;
      }
      .oa11y-setting-icon {
        width: 32px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        background: linear-gradient(145deg, #eef2ff 0%, #e0e7ff 100%);
        color: var(--oa11y-accent);
        flex-shrink: 0;
      }
      .oa11y-setting-icon svg {
        width: 18px;
        height: 18px;
      }
      .oa11y-switch {
        position: relative;
        width: 48px;
        height: 28px;
        flex-shrink: 0;
        align-self: center;
      }
      .oa11y-switch input {
        opacity: 0;
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        cursor: pointer;
        z-index: 1;
      }
      .oa11y-slider {
        position: absolute;
        inset: 0;
        background: #e2e8f0;
        border-radius: 999px;
        transition: background 0.2s ease, box-shadow 0.2s ease;
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
      }
      .oa11y-slider::before {
        content: "";
        position: absolute;
        width: 22px;
        height: 22px;
        top: 3px;
        left: 3px;
        border-radius: 50%;
        background: linear-gradient(180deg, #fff 0%, #f1f5f9 100%);
        transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15);
      }
      .oa11y-switch input:checked + .oa11y-slider {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.12);
      }
      .oa11y-switch input:checked + .oa11y-slider::before {
        transform: translateX(20px);
      }
      .oa11y-switch input:focus-visible + .oa11y-slider {
        outline: 3px solid #c4b5fd;
        outline-offset: 3px;
      }
      .oa11y-reader {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .oa11y-btn {
        font-family: inherit;
        font-size: 12.5px;
        font-weight: 650;
        border-radius: 10px;
        padding: 9px 12px;
        cursor: pointer;
        border: 1px solid transparent;
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      }
      .oa11y-btn:focus-visible {
        outline: none;
        box-shadow:
          0 0 0 2px #fff,
          0 0 0 4px #4f46e5;
      }
      .oa11y-btn--primary {
        color: #fff;
        border-color: rgba(255, 255, 255, 0.2);
        background: linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #7c3aed 100%);
        box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
      }
      .oa11y-btn--primary:hover {
        box-shadow: 0 8px 20px rgba(79, 70, 229, 0.38);
      }
      .oa11y-btn--secondary {
        color: #334155;
        background: #fff;
        border-color: rgba(226, 232, 240, 0.95);
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
      }
      .oa11y-btn--secondary:hover {
        border-color: #c7d2fe;
        background: #f8fafc;
      }
      .oa11y-btn--ghost {
        color: #475569;
        background: transparent;
        border-color: rgba(226, 232, 240, 0.95);
      }
      .oa11y-btn--ghost:hover {
        background: #f8fafc;
        color: #0f172a;
      }
      @media (prefers-reduced-motion: no-preference) {
        .oa11y-btn:hover {
          transform: translateY(-1px);
        }
        .oa11y-btn:active {
          transform: translateY(0);
        }
      }
      .oa11y-footer {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid rgba(241, 245, 249, 0.95);
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .oa11y-footer__actions {
        display: flex;
        justify-content: flex-end;
      }
      .oa11y-footer__credit {
        margin: 0;
        font-size: 11.5px;
        color: var(--oa11y-muted, #64748b);
        text-align: center;
        line-height: 1.35;
      }
      #oa11y-panel .oa11y-footer__credit a {
        color: #4f46e5;
        font-weight: 600;
        text-decoration: none;
      }
      #oa11y-panel .oa11y-footer__credit a:hover {
        text-decoration: underline;
      }
      .oa11y-close,
      .oa11y-reader .oa11y-btn,
      .oa11y-profile button,
      .oa11y-footer .oa11y-btn {
        cursor: pointer;
      }
      .oa11y-tool-stack {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .oa11y-tool-card {
        border: 1px solid rgba(226, 232, 240, 0.95);
        border-radius: 12px;
        padding: 11px;
        background: #fff;
      }
      .oa11y-field-label {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: var(--oa11y-muted, #64748b);
        display: block;
        margin-bottom: 6px;
      }
      .oa11y-input,
      .oa11y-select,
      .oa11y-textarea {
        width: 100%;
        font-family: inherit;
        font-size: 13px;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid rgba(226, 232, 240, 0.98);
        background: #f8fafc;
        color: #0f172a;
        box-sizing: border-box;
      }
      .oa11y-input:focus-visible,
      .oa11y-select:focus-visible,
      .oa11y-textarea:focus-visible {
        outline: none;
        border-color: #a5b4fc;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
        background: #fff;
      }
      .oa11y-lang-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      #oa11y-panel .oa11y-voice-select {
        position: relative;
        width: 100%;
      }
      #oa11y-panel .oa11y-voice-select__btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: inherit;
        font-size: 13px;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid rgba(226, 232, 240, 0.98);
        background: #f8fafc;
        color: #0f172a;
        box-sizing: border-box;
        text-align: left;
        cursor: pointer;
        min-height: 40px;
      }
      #oa11y-panel .oa11y-voice-select__btn:focus-visible {
        outline: none;
        border-color: #a5b4fc;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
        background: #fff;
      }
      #oa11y-panel .oa11y-voice-select__btn[aria-expanded="true"] {
        border-color: #a5b4fc;
        background: #fff;
      }
      #oa11y-panel .oa11y-voice-select__icon {
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        display: grid;
        place-items: center;
        color: #4f46e5;
      }
      #oa11y-panel .oa11y-voice-select__icon svg {
        width: 100%;
        height: 100%;
        display: block;
      }
      #oa11y-panel .oa11y-voice-select__text {
        flex: 1;
        min-width: 0;
        line-height: 1.3;
      }
      #oa11y-panel .oa11y-voice-select__chev {
        flex-shrink: 0;
        color: #64748b;
        display: flex;
        opacity: 0.85;
        transition: transform 0.16s ease;
      }
      #oa11y-panel .oa11y-voice-select__btn[aria-expanded="true"] .oa11y-voice-select__chev {
        transform: rotate(180deg);
      }
      #oa11y-panel .oa11y-voice-select__list {
        position: fixed;
        z-index: 2147483647;
        margin: 0;
        padding: 5px;
        list-style: none;
        max-height: min(220px, calc(100vh - 24px));
        overflow: auto;
        border-radius: 10px;
        border: 1px solid rgba(226, 232, 240, 0.98);
        background: #fff;
        box-shadow: 0 10px 26px rgba(15, 23, 42, 0.12);
        box-sizing: border-box;
      }
      #oa11y-panel .oa11y-voice-select__option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        margin: 0;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        color: #0f172a;
        line-height: 1.3;
      }
      #oa11y-panel .oa11y-voice-select__option:not([aria-disabled="true"]):focus-visible {
        outline: none;
        background: rgba(99, 102, 241, 0.12);
        color: #1e1b4b;
      }
      #oa11y-panel .oa11y-voice-select__option:not([aria-disabled="true"]):hover {
        background: rgba(99, 102, 241, 0.08);
      }
      #oa11y-panel .oa11y-voice-select__option[aria-selected="true"] {
        background: rgba(99, 102, 241, 0.14);
        font-weight: 600;
      }
      #oa11y-panel .oa11y-voice-select__option .oa11y-voice-select__icon {
        color: #4f46e5;
      }
      #oa11y-panel .oa11y-tool-hint {
        font-size: 12px;
        color: var(--oa11y-muted, #64748b);
        margin: 0 0 8px;
        line-height: 1.38;
      }
      #oa11y-panel .oa11y-tool-hint a {
        color: #4f46e5;
        font-weight: 600;
        text-decoration: underline;
      }
      #oa11y-panel .oa11y-api-meta {
        font-size: 11.5px;
        color: var(--oa11y-muted, #64748b);
        margin: 6px 0 0;
      }
      #oa11y-panel .oa11y-api-out {
        font-size: 13px;
        line-height: 1.48;
        color: #1e293b;
        padding: 10px;
        border-radius: 10px;
        background: var(--oa11y-surface-2, #f8fafc);
        border: 1px solid rgba(226, 232, 240, 0.92);
        max-height: 180px;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-word;
        min-height: 2.75rem;
      }
      #oa11y-dict-modal,
      #oa11y-dict-modal * {
        box-sizing: border-box;
      }
      #oa11y-dict-modal {
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
        pointer-events: none;
      }
      #oa11y-dict-modal:not([hidden]) {
        display: flex;
        pointer-events: auto;
      }
      #oa11y-dict-modal .oa11y-dict-modal__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        pointer-events: auto;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      @keyframes oa11y-dict-panel-in {
        from {
          opacity: 0;
          transform: scale(0.96) translateY(10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      #oa11y-dict-modal .oa11y-dict-modal__panel {
        position: relative;
        z-index: 1;
        pointer-events: auto;
        width: min(492px, 100%);
        max-height: min(82vh, 600px);
        display: flex;
        flex-direction: column;
        border-radius: 20px;
        border: 1px solid rgba(226, 232, 240, 0.88);
        background: radial-gradient(
            140% 60% at 0% -20%,
            rgba(238, 242, 255, 0.9) 0%,
            #fff 45%
          ),
          #fff;
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.8) inset,
          0 28px 56px rgba(15, 23, 42, 0.18),
          0 14px 28px rgba(15, 23, 42, 0.1);
        color: #0f172a;
        overflow: hidden;
      }
      @media (prefers-reduced-motion: no-preference) {
        #oa11y-dict-modal:not([hidden]) .oa11y-dict-modal__panel {
          animation: oa11y-dict-panel-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      }
      #oa11y-dict-modal .oa11y-dict-modal__accent {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #4f46e5, #7c3aed, #9333ea, #6366f1);
        opacity: 0.95;
        pointer-events: none;
      }
      #oa11y-dict-modal .oa11y-dict-modal__toolbar {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        justify-content: space-between;
        padding: 17px 18px 14px;
        padding-top: 19px;
        border-bottom: 1px solid rgba(226, 232, 240, 0.75);
        flex-shrink: 0;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.98) 0%,
          rgba(248, 250, 252, 0.65) 100%
        );
      }
      #oa11y-dict-modal .oa11y-dict-modal__titles {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        min-width: 0;
        flex: 1;
      }
      #oa11y-dict-modal .oa11y-dict-modal__badge {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: #4f46e5;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.14), rgba(147, 51, 234, 0.1));
        border: 1px solid rgba(99, 102, 241, 0.2);
        padding: 4px 10px;
        border-radius: 999px;
      }
      #oa11y-dict-modal .oa11y-dict-modal__headword {
        margin: 0;
        font-size: clamp(1.35rem, 3.5vw, 1.6rem);
        font-weight: 800;
        line-height: 1.18;
        letter-spacing: -0.03em;
        word-break: break-word;
        color: #0f172a;
      }
      #oa11y-dict-modal .oa11y-dict-modal__close.oa11y-close {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        font-size: 22px;
        line-height: 1;
        flex-shrink: 0;
        transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
      }
      @media (prefers-reduced-motion: no-preference) {
        #oa11y-dict-modal .oa11y-dict-modal__close.oa11y-close:hover {
          transform: translateY(-1px);
        }
      }
      #oa11y-dict-modal .oa11y-dict-modal__scroll {
        flex: 1;
        min-height: 0;
        overflow: auto;
        overscroll-behavior: contain;
      }
      #oa11y-dict-modal .oa11y-dict-modal__definition {
        padding: 16px 20px;
        font-size: 14px;
        line-height: 1.6;
        color: #334155;
        word-break: break-word;
      }
      #oa11y-dict-modal .oa11y-dict-modal__loading {
        color: #64748b;
        font-size: 14px;
        font-style: italic;
        animation: none;
        line-height: 1.55;
      }
      @media (prefers-reduced-motion: no-preference) {
        #oa11y-dict-modal .oa11y-dict-modal__loading {
          animation: oa11y-dict-loading-pulse 1.35s ease-in-out infinite alternate;
        }
        @keyframes oa11y-dict-loading-pulse {
          from {
            opacity: 0.62;
          }
          to {
            opacity: 1;
          }
        }
      }
      #oa11y-dict-modal .oa11y-dict-modal__sense {
        padding-bottom: 14px;
        margin-bottom: 14px;
        border-bottom: 1px dashed rgba(148, 163, 184, 0.45);
      }
      #oa11y-dict-modal .oa11y-dict-modal__sense:last-child {
        padding-bottom: 0;
        margin-bottom: 0;
        border-bottom: 0;
      }
      #oa11y-dict-modal .oa11y-dict-modal__pos {
        display: inline-block;
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #4338ca;
        background: rgba(79, 70, 229, 0.1);
        border: 1px solid rgba(79, 70, 229, 0.16);
        padding: 3px 8px;
        border-radius: 7px;
        margin-bottom: 8px;
      }
      #oa11y-dict-modal .oa11y-dict-modal__sense-body {
        display: block;
        margin: 0;
        color: #1e293b;
        font-size: 14.5px;
        line-height: 1.62;
        letter-spacing: 0.01em;
      }
      #oa11y-dict-modal .oa11y-dict-modal__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        padding: 12px 18px;
        flex-shrink: 0;
        border-top: 1px solid rgba(241, 245, 249, 0.9);
        background: rgba(248, 250, 252, 0.96);
      }
      #oa11y-dict-modal .oa11y-dict-modal__footer-btns {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      #oa11y-dict-modal .oa11y-dict-modal__footer .oa11y-btn {
        font-size: 12px;
        padding: 8px 12px;
      }
      #oa11y-dict-modal .oa11y-dict-modal__footer .oa11y-btn:disabled {
        opacity: 0.42;
        cursor: not-allowed;
        pointer-events: none;
        transform: none;
        box-shadow: none;
      }
      #oa11y-dict-modal .oa11y-dict-modal__credit {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.03em;
        color: #94a3b8;
        white-space: nowrap;
      }
      body.${CLASS_PREFIX}high_contrast { background: #000 !important; color: #fff !important; }
      body.${CLASS_PREFIX}high_contrast a { color: #77d8ff !important; }
      body.${CLASS_PREFIX}light_contrast { background: #fff !important; color: #111 !important; }
      /*
       * Color filters live on #oa11y-content-shell so fixed-position UI does not jump.
       * FAB + panel live outside the shell, so mirror the same filter onto them when on.
       */
      #oa11y-content-shell.${CLASS_PREFIX}invert_colors:not(.${CLASS_PREFIX}grayscale) {
        filter: invert(1) hue-rotate(180deg);
      }
      #oa11y-content-shell.${CLASS_PREFIX}invert_colors:not(.${CLASS_PREFIX}grayscale) ~ #oa11y-toggle,
      #oa11y-content-shell.${CLASS_PREFIX}invert_colors:not(.${CLASS_PREFIX}grayscale) ~ #oa11y-panel,
      #oa11y-content-shell.${CLASS_PREFIX}invert_colors:not(.${CLASS_PREFIX}grayscale) ~ #oa11y-dict-modal {
        filter: invert(1) hue-rotate(180deg);
        isolation: isolate;
      }
      #oa11y-content-shell.${CLASS_PREFIX}grayscale:not(.${CLASS_PREFIX}invert_colors) {
        filter: grayscale(1);
      }
      #oa11y-content-shell.${CLASS_PREFIX}invert_colors.${CLASS_PREFIX}grayscale {
        filter: invert(1) hue-rotate(180deg) grayscale(1);
      }
      #oa11y-content-shell.${CLASS_PREFIX}grayscale:not(.${CLASS_PREFIX}invert_colors) ~ #oa11y-toggle,
      #oa11y-content-shell.${CLASS_PREFIX}grayscale:not(.${CLASS_PREFIX}invert_colors) ~ #oa11y-panel,
      #oa11y-content-shell.${CLASS_PREFIX}grayscale:not(.${CLASS_PREFIX}invert_colors) ~ #oa11y-dict-modal {
        filter: grayscale(1);
        isolation: isolate;
      }
      #oa11y-content-shell.${CLASS_PREFIX}invert_colors.${CLASS_PREFIX}grayscale ~ #oa11y-toggle,
      #oa11y-content-shell.${CLASS_PREFIX}invert_colors.${CLASS_PREFIX}grayscale ~ #oa11y-panel,
      #oa11y-content-shell.${CLASS_PREFIX}invert_colors.${CLASS_PREFIX}grayscale ~ #oa11y-dict-modal {
        filter: invert(1) hue-rotate(180deg) grayscale(1);
        isolation: isolate;
      }
      body.${CLASS_PREFIX}reading_guide::before {
        content: "";
        position: fixed;
        left: 0;
        right: 0;
        top: calc(var(--oa11y-mouse-y, 50vh) - 20px);
        height: 40px;
        background: rgba(255, 220, 80, 0.28);
        pointer-events: none;
        z-index: 2147483645;
      }
      /*
       * Link highlighting: text links get yellow wash. Thumbnail / â€œvisualâ€ links are tagged at runtime
       * (data-o11y-thumb) because many themes use stylesheet-only background-image â€” pure CSS canâ€™t see it.
       * Semi-transparent yellow so any mis-tagged link or layered media still shows through.
       */
      body.${CLASS_PREFIX}highlight_links a[href]:not([data-o11y-thumb]) {
        text-decoration: underline !important;
        text-decoration-thickness: .18rem !important;
        background-color: rgba(255, 241, 140, 0.42) !important;
        color: #000 !important;
      }
      body.${CLASS_PREFIX}highlight_links a[href][data-o11y-thumb] {
        text-decoration: underline !important;
        text-decoration-thickness: 0.14rem !important;
        text-underline-offset: 0.14em !important;
        text-decoration-color: #ca8a04 !important;
        background-color: transparent !important;
        color: inherit !important;
        outline: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      body.${CLASS_PREFIX}highlight_links a[href][data-o11y-thumb]
        > *:not([data-o11y-bg-tile]):not(:has([data-o11y-bg-tile])):not(:is(img, picture, svg, video, canvas)):not(:has(:is(img, picture, video, canvas))) {
        text-decoration: underline !important;
        text-decoration-thickness: 0.18rem !important;
        background-color: rgba(255, 241, 140, 0.52) !important;
        color: #000 !important;
        padding: 0.06em 0.22em !important;
        border-radius: 4px !important;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }
      body.${CLASS_PREFIX}highlight_focus *:focus {
        outline: 3px solid #ff7a00 !important;
        outline-offset: 3px !important;
      }
      body.${CLASS_PREFIX}large_cursor,
      body.${CLASS_PREFIX}large_cursor * {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='black'%3E%3Cpath d='M3 2l7.5 18 2.2-6.2L19 16z'/%3E%3C/svg%3E") 0 0, auto !important;
      }
      body.${CLASS_PREFIX}dyslexia_font {
        font-family: "OpenDyslexic", "Open Dyslexic", "Comic Sans MS", "Verdana", sans-serif !important;
        letter-spacing: max(0.02em, var(--oa11y-letter-spacing, 0em)) !important;
      }
      body.${CLASS_PREFIX}hide_images img { visibility: hidden !important; }
      body.${CLASS_PREFIX}stop_animations *,
      body.${CLASS_PREFIX}stop_animations *::before,
      body.${CLASS_PREFIX}stop_animations *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
      #oa11y-content-shell.${CLASS_PREFIX}bold_text,
      #oa11y-content-shell.${CLASS_PREFIX}bold_text * {
        font-weight: 650 !important;
      }
      #oa11y-content-shell.${CLASS_PREFIX}bold_text :where(h1, h2, h3, h4, h5, h6) {
        font-weight: 800 !important;
      }
      #oa11y-content-shell.${CLASS_PREFIX}box_titles :where(h1, h2, h3, h4, h5, h6) {
        border: 2px solid currentColor;
        padding: 0.35rem 0.65rem;
        border-radius: 10px;
        margin-block: 0.65rem !important;
        background: rgba(128, 128, 128, 0.12);
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }
      #oa11y-content-shell.${CLASS_PREFIX}boxed_links a[href]:not([data-o11y-thumb]) {
        border: 2px solid currentColor !important;
        padding: 0.25rem 0.55rem !important;
        border-radius: 8px !important;
        display: inline-block !important;
        margin: 0.15rem 0.08rem !important;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }
      #oa11y-content-shell.${CLASS_PREFIX}boxed_links a[href][data-o11y-thumb] {
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
        margin: 0.15rem 0.08rem !important;
        box-decoration-break: unset;
        -webkit-box-decoration-break: unset;
        box-shadow: inset 0 -2px 0 0 currentColor !important;
      }
      #oa11y-content-shell.${CLASS_PREFIX}boxed_links a[href][data-o11y-thumb]
        > *:not([data-o11y-bg-tile]):not(:has([data-o11y-bg-tile])):not(:is(img, picture, svg, video, canvas)):not(:has(:is(img, picture, video, canvas))) {
        border: 2px solid currentColor !important;
        padding: 0.25rem 0.55rem !important;
        border-radius: 8px !important;
        display: inline-block !important;
        margin: 0.12rem 0.06rem !important;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }
    `;
    document.head.appendChild(style);
    
    const SHELL_ID = "oa11y-content-shell";
    /** Wrap existing body contents so CSS filters never apply to body's fixed descendants (the widget). */
    function ensureContentShell() {
      if (document.getElementById(SHELL_ID)) return;
      const bodyEl = document.body;
      if (!bodyEl) return;
      const shell = document.createElement("div");
      shell.id = SHELL_ID;
      shell.dataset.oa11yShell = "true";
      while (bodyEl.firstChild) {
        shell.appendChild(bodyEl.firstChild);
      }
      bodyEl.appendChild(shell);
    }
  
    ensureContentShell();
  
    const toggle = document.createElement("button");
    toggle.id = "oa11y-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-controls", "oa11y-panel");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open accessibility widget");
    toggle.innerHTML = `
      <span class="oa11y-fab__icon" aria-hidden="true">${SVG_ICONS.fab}</span>
      <span class="oa11y-fab__text" aria-hidden="true">Accessibility</span>
    `;
    // Creates the panel element
    const panel = document.createElement("aside");
    panel.id = "oa11y-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("aria-labelledby", "oa11y-panel-heading");
    panel.innerHTML = `
      <div class="oa11y-panel-scroll">
        <div class="oa11y-hero">
          <div class="oa11y-hero-text">
            <h2 id="oa11y-panel-heading">Accessibility</h2>
            <p class="oa11y-tagline">Choose a profile or fine-tune display and reading.</p>
          </div>
          <button type="button" class="oa11y-close" id="oa11y-close" aria-label="Close accessibility panel">Ã—</button>
        </div>
        <section class="oa11y-section" aria-labelledby="oa11y-h-profiles">
          <h3 class="oa11y-section-title" id="oa11y-h-profiles">Profiles</h3>
          <div id="oa11y-profiles" class="oa11y-profile" role="group" aria-label="Accessibility profiles"></div>
        </section>
        <section class="oa11y-section" aria-labelledby="oa11y-h-controls">
          <h3 class="oa11y-section-title" id="oa11y-h-controls">Controls</h3>
          <div class="oa11y-settings-card">
            <div id="oa11y-settings" role="group" aria-label="Display and reading controls"></div>
          </div>
        </section>
        <section class="oa11y-section" aria-labelledby="oa11y-h-reader">
          <h3 class="oa11y-section-title" id="oa11y-h-reader">Reader</h3>
          <div class="oa11y-reader" role="group" aria-label="Read aloud">
            <button type="button" class="oa11y-btn oa11y-btn--primary" id="oa11y-read-page" aria-label="Read entire page aloud">Read page</button>
            <button type="button" class="oa11y-btn oa11y-btn--secondary" id="oa11y-read-selection" aria-label="Read selected text aloud">Read selection</button>
            <button type="button" class="oa11y-btn oa11y-btn--secondary" id="oa11y-stop-reading" aria-label="Stop read-aloud">Stop</button>
          </div>
        </section>
        <section class="oa11y-section" aria-labelledby="oa11y-h-language">
          <h3 class="oa11y-section-title" id="oa11y-h-language">Language</h3>
          <p class="oa11y-tool-hint">
            Speech language for reader features. Translating uses LibreTranslate separately below.
          </p>
          <div class="oa11y-tool-card oa11y-tool-stack" role="group" aria-labelledby="oa11y-h-language">
            <div>
              <label class="oa11y-field-label" id="oa11y-reader-lang-label" for="oa11y-reader-lang-btn">Read-aloud language</label>
              <div class="oa11y-voice-select" id="oa11y-reader-lang-root">
                <button
                  type="button"
                  id="oa11y-reader-lang-btn"
                  class="oa11y-voice-select__btn"
                  aria-haspopup="listbox"
                  aria-expanded="false"
                  aria-controls="oa11y-reader-lang-list"
                  aria-describedby="oa11y-reader-lang-hint">
                  <span class="oa11y-voice-select__icon" id="oa11y-reader-lang-btn-icon" aria-hidden="true"></span>
                  <span class="oa11y-voice-select__text" id="oa11y-reader-lang-btn-text"></span>
                  <span class="oa11y-voice-select__chev" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></svg>
                  </span>
                </button>
                <ul id="oa11y-reader-lang-list" class="oa11y-voice-select__list" role="listbox" tabindex="-1" hidden aria-labelledby="oa11y-reader-lang-label"></ul>
              </div>
              <p id="oa11y-reader-lang-hint" class="oa11y-tool-hint">
                Applies to browser text-to-speech (Read page / Read selection).
              </p>
            </div>
          </div>
        </section>
        <section class="oa11y-section" aria-labelledby="oa11y-heading-dictionary">
          <h3 class="oa11y-section-title" id="oa11y-heading-dictionary">Dictionary</h3>
          <p class="oa11y-tool-hint">
            Powered by
            <a href="https://openaccessible.com/" target="_blank" rel="noopener noreferrer" aria-label="Open Accessible, website openaccessible.com, opens in a new tab">Open Accessible</a>
            Â· Double-click any single highlighted word on the page to open a definition popup.
          </p>
          <div class="oa11y-tool-card oa11y-tool-stack" role="group" aria-labelledby="oa11y-heading-dictionary">
            <div>
              <label class="oa11y-field-label" for="oa11y-dict-word">Word</label>
              <input id="oa11y-dict-word" class="oa11y-input" type="text" maxlength="240" placeholder="Enter a word" autocomplete="off" spellcheck="true" />
            </div>
            <div class="oa11y-reader" role="group" aria-label="Dictionary actions">
              <button type="button" class="oa11y-btn oa11y-btn--primary" id="oa11y-dict-lookup" aria-label="Look up dictionary definition">Define</button>
              <button type="button" class="oa11y-btn oa11y-btn--secondary" id="oa11y-dict-selection" aria-label="Use selected text as dictionary word">Use selection</button>
            </div>
            <div id="oa11y-dict-result" class="oa11y-api-out" role="status" aria-live="polite">Type a word, then Define.</div>
          </div>
        </section>
        <section class="oa11y-section" aria-labelledby="oa11y-heading-translate">
          <h3 class="oa11y-section-title" id="oa11y-heading-translate">Translate</h3>
          <p class="oa11y-tool-hint">
            Powered by LibreTranslate â€”
            <a href="https://osstranslate-cbjjn-u5208.vm.elestio.app/" target="_blank" rel="noopener noreferrer" aria-label="LibreTranslate server, website osstranslate-cbjjn-u5208.vm.elestio.app, opens in a new tab">Translate server</a>
          </p>
          <div class="oa11y-tool-card oa11y-tool-stack" role="group" aria-labelledby="oa11y-heading-translate">
            <div class="oa11y-lang-row">
              <div>
                <label class="oa11y-field-label" for="oa11y-translate-source">From</label>
                <select id="oa11y-translate-source" class="oa11y-select"></select>
              </div>
              <div>
                <label class="oa11y-field-label" for="oa11y-translate-target">To</label>
                <select id="oa11y-translate-target" class="oa11y-select"></select>
              </div>
            </div>
            <div>
              <label class="oa11y-field-label" for="oa11y-translate-q">Text</label>
              <textarea id="oa11y-translate-q" class="oa11y-textarea" rows="3" maxlength="4500" spellcheck="true" placeholder="Paste text â€” or pull from selection"></textarea>
            </div>
            <div class="oa11y-reader" role="group" aria-label="Translation actions">
              <button type="button" class="oa11y-btn oa11y-btn--primary" id="oa11y-translate-run" aria-label="Translate text">Translate</button>
              <button type="button" class="oa11y-btn oa11y-btn--secondary" id="oa11y-translate-selection" aria-label="Use selected text in translation box">Use selection</button>
              <button type="button" class="oa11y-btn oa11y-btn--secondary" id="oa11y-translate-copy" aria-label="Copy translation result">Copy result</button>
              <button type="button" class="oa11y-btn oa11y-btn--secondary" id="oa11y-translate-read" aria-label="Read translation result aloud">Read result</button>
            </div>
            <p id="oa11y-translate-meta" class="oa11y-api-meta" hidden></p>
            <div id="oa11y-translate-result" class="oa11y-api-out" role="status" aria-live="polite">Translation appears here.</div>
          </div>
        </section>
        <footer class="oa11y-footer">
          <div class="oa11y-footer__actions">
            <button type="button" class="oa11y-btn oa11y-btn--ghost" id="oa11y-reset" aria-label="Reset all accessibility settings">Reset all</button>
          </div>
          <p class="oa11y-footer__credit">
            Powered by
            <a href="https://openaccessible.com/" target="_blank" rel="noopener noreferrer" aria-label="Open Accessible, website openaccessible.com, opens in a new tab">Open Accessible</a>         </p>
        </footer>
      </div>
    `;
  
    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    function applyPremiumGates() {
      const dictSection = panel.querySelector('[aria-labelledby="oa11y-heading-dictionary"]');
      const translateSection = panel.querySelector('[aria-labelledby="oa11y-heading-translate"]');
      if (dictSection) dictSection.hidden = !featureEnabled("dictionary");
      if (translateSection) translateSection.hidden = !featureEnabled("translate");
    }

    function applyWhitelabel() {
      if (!featureEnabled("whitelabel")) return;
      const wl = OA_CONFIG.branding?.whitelabel;
      if (!wl) return;

      const heading = panel.querySelector("#oa11y-panel-heading");
      const tagline = panel.querySelector(".oa11y-tagline");
      const fabText = toggle.querySelector(".oa11y-fab__text");
      const footerCredit = panel.querySelector(".oa11y-footer__credit");
      const dictCredit = document.querySelector("#oa11y-dict-modal .oa11y-dict-modal__credit");

      if (wl.brand_name && heading) heading.textContent = wl.brand_name;
      if (wl.tagline && tagline) tagline.textContent = wl.tagline;
      if (wl.fab_label && fabText) fabText.textContent = wl.fab_label;

      if (wl.primary_color) {
        panel.style.setProperty("--oa11y-accent", wl.primary_color);
        toggle.style.setProperty("--oa11y-accent", wl.primary_color);
      }

      if (wl.logo_url) {
        const hero = panel.querySelector(".oa11y-hero-text");
        if (hero && !hero.querySelector(".oa11y-whitelabel-logo")) {
          const img = document.createElement("img");
          img.src = wl.logo_url;
          img.alt = "";
          img.className = "oa11y-whitelabel-logo";
          img.width = 40;
          img.height = 40;
          img.style.cssText = "border-radius:10px;margin-bottom:8px;object-fit:contain;";
          hero.insertBefore(img, hero.firstChild);
        }
      }

      if (wl.hide_powered_by) {
        if (footerCredit) footerCredit.hidden = true;
        if (dictCredit) dictCredit.hidden = true;
        const dictHint = panel.querySelector('[aria-labelledby="oa11y-heading-dictionary"] .oa11y-tool-hint');
        if (dictHint) dictHint.hidden = true;
      }
    }

    applyPremiumGates();

    const dictModal = document.createElement("div");
    dictModal.id = "oa11y-dict-modal";
    dictModal.hidden = true;
    dictModal.setAttribute("role", "dialog");
    dictModal.setAttribute("aria-modal", "true");
    dictModal.setAttribute("aria-labelledby", "oa11y-dict-modal-heading");
    dictModal.innerHTML = `
      <div class="oa11y-dict-modal__backdrop" data-oa11y-dismiss="1" tabindex="-1" aria-hidden="true"></div>
      <div class="oa11y-dict-modal__panel">
        <div class="oa11y-dict-modal__accent"></div>
        <header class="oa11y-dict-modal__toolbar">
          <div class="oa11y-dict-modal__titles">
            <span class="oa11y-dict-modal__badge">Dictionary</span>
            <h2 id="oa11y-dict-modal-heading" class="oa11y-dict-modal__headword">Dictionary Word: </h2>
          </div>
          <button type="button" class="oa11y-dict-modal__close oa11y-close" aria-label="Close dictionary">&times;</button>
        </header>
        <div class="oa11y-dict-modal__scroll">
          <div class="oa11y-dict-modal__definition" aria-live="polite"></div>
        </div>
        <footer class="oa11y-dict-modal__footer">
          <div class="oa11y-dict-modal__footer-btns">
            <button type="button" class="oa11y-btn oa11y-btn--secondary oa11y-dict-modal__speak" disabled aria-disabled="true" aria-label="Read dictionary definition aloud">Read aloud</button>
            <button type="button" class="oa11y-btn oa11y-btn--secondary oa11y-dict-modal__copy" disabled aria-disabled="true" aria-label="Copy dictionary definition">Copy</button>
          </div>
          <span class="oa11y-dict-modal__credit">OpenAccessible dictionary</span>
        </footer>
      </div>
    `;
    document.body.appendChild(dictModal);
    applyWhitelabel();
    const dictModalHeadwordEl = dictModal.querySelector(".oa11y-dict-modal__headword");
    const dictModalDefinitionEl = dictModal.querySelector(".oa11y-dict-modal__definition");
    const dictModalCloseBtn = dictModal.querySelector(".oa11y-dict-modal__close");
    const dictModalSpeakBtn = dictModal.querySelector(".oa11y-dict-modal__speak");
    const dictModalCopyBtn = dictModal.querySelector(".oa11y-dict-modal__copy");
  
    const closeBtn = panel.querySelector("#oa11y-close");
    const resetBtn = panel.querySelector("#oa11y-reset");
    const profilesNode = panel.querySelector("#oa11y-profiles");
    const settingsNode = panel.querySelector("#oa11y-settings");
    const readPageBtn = panel.querySelector("#oa11y-read-page");
    const readSelectionBtn = panel.querySelector("#oa11y-read-selection");
    const stopReadingBtn = panel.querySelector("#oa11y-stop-reading");
    const readerVoiceRoot = panel.querySelector("#oa11y-reader-lang-root");
    const readerVoiceBtn = panel.querySelector("#oa11y-reader-lang-btn");
    const readerVoiceBtnIcon = panel.querySelector("#oa11y-reader-lang-btn-icon");
    const readerVoiceBtnText = panel.querySelector("#oa11y-reader-lang-btn-text");
    const readerVoiceList = panel.querySelector("#oa11y-reader-lang-list");
  
    /** @type {HTMLElement[]} */
    let readerVoiceOptionEls = [];
  
    const dictWordInput = panel.querySelector("#oa11y-dict-word");
    const dictLookupBtn = panel.querySelector("#oa11y-dict-lookup");
    const dictSelectionBtn = panel.querySelector("#oa11y-dict-selection");
    const dictResultEl = panel.querySelector("#oa11y-dict-result");
    const translateSourceSel = panel.querySelector("#oa11y-translate-source");
    const translateTargetSel = panel.querySelector("#oa11y-translate-target");
    const translateTextArea = panel.querySelector("#oa11y-translate-q");
    const translateRunBtn = panel.querySelector("#oa11y-translate-run");
    const translateSelectionBtn = panel.querySelector("#oa11y-translate-selection");
    const translateCopyBtn = panel.querySelector("#oa11y-translate-copy");
    const translateReadBtn = panel.querySelector("#oa11y-translate-read");
    const translateMetaEl = panel.querySelector("#oa11y-translate-meta");
    const translateResultEl = panel.querySelector("#oa11y-translate-result");
  
    /** @type {Array<{ code: string; name: string; targets?: string[] }>} */
    let translateLangList = [];
  
    function getIconSvg(name) {
      return SVG_ICONS[name] || SVG_ICONS.fallback;
    }
  
    /** Maps LibreTranslate language codes to browser speech synthesis locale hints. */
    function speechLangHintForTranslateTarget(ltCode) {
      const m = {
        en: "en-US",
        es: "es-ES",
        fr: "fr-FR",
        de: "de-DE",
        it: "it-IT",
        pt: "pt-PT",
        "pt-BR": "pt-BR",
        ru: "ru-RU",
        ja: "ja-JP",
        ko: "ko-KR",
        "zh-Hans": "zh-CN",
        "zh-Hant": "zh-TW",
        ar: "ar-SA",
        hi: "hi-IN",
        nl: "nl-NL",
        pl: "pl-PL",
        tr: "tr-TR",
        vi: "vi-VN",
        th: "th-TH",
      };
      if (m[ltCode]) return m[ltCode];
      return ltCode.includes("-") ? ltCode : state.readerLang;
    }
  
    function readerOptionIconRegionKey(region) {
      return READ_ALOUD_REGION_ICON[region] || "speechReadAloud";
    }
  
    function syncReaderVoiceButton() {
      if (!readerVoiceBtn || !readerVoiceBtnIcon || !readerVoiceBtnText) return;
      if (!READ_ALOUD_LANG_OPTIONS.some((o) => o.code === state.readerLang)) {
        state.readerLang = READ_ALOUD_LANG_OPTIONS[0].code;
      }
      const opt =
        READ_ALOUD_LANG_OPTIONS.find((o) => o.code === state.readerLang) ||
        READ_ALOUD_LANG_OPTIONS[0];
      readerVoiceBtnText.textContent = opt.label;
      readerVoiceBtn.setAttribute(
        "aria-label",
        `Read-aloud language, ${opt.label}, locale ${opt.code}`,
      );
      const iconKey = readerOptionIconRegionKey(opt.region);
      readerVoiceBtnIcon.innerHTML = getIconSvg(
        SVG_ICONS[iconKey] ? iconKey : "speechReadAloud",
      );
    }
    // Updates the aria-selected attribute on the reader voice options.
    function updateReaderVoiceAriaSelected(options) {
      options.forEach((el, idx) => {
        const row = READ_ALOUD_LANG_OPTIONS[idx];
        if (!row || !el) return;
        el.setAttribute(
          "aria-selected",
          row.code === state.readerLang ? "true" : "false",
        );
      });
    }
    // Closes the reader voice list.
    function closeReaderVoiceList() {
      if (!readerVoiceList || !readerVoiceBtn) return;
      readerVoiceList.hidden = true;
      readerVoiceBtn.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", onReaderVoiceOutsideClick);
    }
  
    /** @type {(event: MouseEvent) => void} */
    // Handles clicks outside the reader voice list.
    function onReaderVoiceOutsideClick(event) {
      if (!readerVoiceRoot) return;
      const node = /** @type {Node | undefined} */ (event.target instanceof Node ? event.target : undefined);
      if (node && readerVoiceRoot.contains(node)) return;
      closeReaderVoiceList();
    }
  
    // Selects a reader voice code.
    function selectReaderVoiceCode(code) {
      if (!READ_ALOUD_LANG_OPTIONS.some((o) => o.code === code)) return;
      state.readerLang = code;
      saveState();
      syncReaderVoiceButton();
      updateReaderVoiceAriaSelected(readerVoiceOptionEls);
      closeReaderVoiceList();
      readerVoiceBtn.focus();
    }
  
    // Focuses a reader voice option.
    function focusReaderVoiceOption(idx) {
      const n = readerVoiceOptionEls.length;
      if (!n) return;
      const j = ((idx % n) + n) % n;
      const el = readerVoiceOptionEls[j];
      el?.focus();
      el?.scrollIntoView?.({ block: "nearest" });
    }
  
    // Positions the reader voice list panel.
    function positionReaderVoiceListPanel() {
      if (!readerVoiceBtn || !readerVoiceList) return;
      const gap = 6;
      const r = readerVoiceBtn.getBoundingClientRect();
      const listH = readerVoiceList.offsetHeight || Math.min(220, window.innerHeight - 24);
      let top = r.bottom + gap;
      if (top + listH > window.innerHeight - 10) {
        top = Math.max(10, r.top - gap - listH);
      }
      const pad = 10;
      const width = Math.min(r.width, window.innerWidth - pad * 2);
      const left = Math.min(Math.max(pad, r.left), window.innerWidth - pad - width);
      readerVoiceList.style.left = `${left}px`;
      readerVoiceList.style.top = `${top}px`;
      readerVoiceList.style.width = `${width}px`;
    }
  
    function initReaderLangControl() {
      if (
        !readerVoiceRoot ||
        !readerVoiceBtn ||
        !readerVoiceBtnIcon ||
        !readerVoiceBtnText ||
        !readerVoiceList
      ) {
        return;
      }
  
      readerVoiceList.innerHTML = "";
      readerVoiceOptionEls = [];
      READ_ALOUD_LANG_OPTIONS.forEach((opt, idx) => {
        const li = document.createElement("li");
        li.setAttribute("role", "option");
        li.tabIndex = -1;
        li.className = "oa11y-voice-select__option";
        li.id = `oa11y-reader-lang-opt-${idx}`;
        li.dataset.code = opt.code;
        li.setAttribute("aria-label", `${opt.label}, locale ${opt.code}`);
        const iconSpan = document.createElement("span");
        iconSpan.className = "oa11y-voice-select__icon";
        iconSpan.setAttribute("aria-hidden", "true");
        const iconKey = readerOptionIconRegionKey(opt.region);
        iconSpan.innerHTML = getIconSvg(SVG_ICONS[iconKey] ? iconKey : "speechReadAloud");
        const labelSpan = document.createElement("span");
        labelSpan.textContent = opt.label;
        li.appendChild(iconSpan);
        li.appendChild(labelSpan);
        li.addEventListener("click", (e) => {
          e.stopPropagation();
          selectReaderVoiceCode(opt.code);
        });
        readerVoiceList.appendChild(li);
        readerVoiceOptionEls.push(li);
      });
  
      if (!READ_ALOUD_LANG_OPTIONS.some((o) => o.code === state.readerLang)) {
        state.readerLang = READ_ALOUD_LANG_OPTIONS[0].code;
      }
      syncReaderVoiceButton();
      updateReaderVoiceAriaSelected(readerVoiceOptionEls);
  
      const panelScroll = panel.querySelector(".oa11y-panel-scroll");
      // Repositions the reader voice list panel.
      const repositionReaderVoiceList = () => {
        if (readerVoiceBtn.getAttribute("aria-expanded") === "true") {
          positionReaderVoiceListPanel();
        }
      };
      window.addEventListener("resize", repositionReaderVoiceList);
      panelScroll?.addEventListener("scroll", repositionReaderVoiceList, { passive: true });
  
      readerVoiceBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = readerVoiceBtn.getAttribute("aria-expanded") === "true";
        if (open) {
          closeReaderVoiceList();
          return;
        }
        readerVoiceList.hidden = false;
        // Sets the aria-expanded attribute on the reader voice button to true.
        readerVoiceBtn.setAttribute("aria-expanded", "true");
        // Updates the aria-selected attribute on the reader voice options.
        updateReaderVoiceAriaSelected(readerVoiceOptionEls);
        // Repositions the reader voice list panel.
        positionReaderVoiceListPanel();
        // Repositions the reader voice list panel.
        window.requestAnimationFrame(() => positionReaderVoiceListPanel());
        // Adds a click event listener to the document to close the reader voice list when clicking outside.
        window.setTimeout(() => document.addEventListener("click", onReaderVoiceOutsideClick), 0);
      });
  
      readerVoiceBtn.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const open = readerVoiceBtn.getAttribute("aria-expanded") === "true";
          const cur = Math.max(
            0,
            READ_ALOUD_LANG_OPTIONS.findIndex((o) => o.code === state.readerLang),
          );
          if (!open) {
            readerVoiceList.hidden = false;
            readerVoiceBtn.setAttribute("aria-expanded", "true");
            updateReaderVoiceAriaSelected(readerVoiceOptionEls);
            positionReaderVoiceListPanel();
            window.requestAnimationFrame(() => positionReaderVoiceListPanel());
            window.setTimeout(() => document.addEventListener("click", onReaderVoiceOutsideClick), 0);
          }
          if (e.key === "ArrowDown") focusReaderVoiceOption(cur);
          else focusReaderVoiceOption(cur - 1);
          return;
        }
        if (e.key === "Escape") closeReaderVoiceList();
      });
  
      readerVoiceList.addEventListener("keydown", (e) => {
        const curIdx = readerVoiceOptionEls.indexOf(
          /** @type {HTMLElement} */ (document.activeElement),
        );
        if (e.key === "ArrowDown") {
          e.preventDefault();
          focusReaderVoiceOption(curIdx >= 0 ? curIdx + 1 : 0);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          focusReaderVoiceOption(
            curIdx > 0 ? curIdx - 1 : readerVoiceOptionEls.length - 1,
          );
        } else if (e.key === "Home") {
          e.preventDefault();
          focusReaderVoiceOption(0);
        } else if (e.key === "End") {
          e.preventDefault();
          focusReaderVoiceOption(readerVoiceOptionEls.length - 1);
        } else if (e.key === "Escape") {
          e.preventDefault();
          closeReaderVoiceList();
          readerVoiceBtn.focus();
        } else if (e.key === "Enter" || e.key === " ") {
          const ae = document.activeElement;
          const code =
            ae instanceof HTMLElement ? ae.dataset.code : undefined;
          if (code) {
            e.preventDefault();
            selectReaderVoiceCode(code);
          }
        }
      });
  
      if ("speechSynthesis" in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.addEventListener?.("voiceschanged", () => {
          window.speechSynthesis.getVoices();
        });
      }
    }
  
    /** Formats a language code into a label. */
    function translateLanguageLabel(code) {
      const row = translateLangList.find((l) => l.code === code);
      return row ? `${row.name} (${code})` : code;
    }
  
    function fallbackTranslateLanguages() {
      return [
        { code: "en", name: "English", targets: ["es", "fr", "de"] },
        { code: "es", name: "Spanish", targets: ["en"] },
        { code: "fr", name: "French", targets: ["en"] },
      ];
    }
  
    function targetLangCodes(sourceVal) {
      if (!translateLangList.length) return ["es", "en"];
      if (sourceVal === "auto") {
        const s = new Set();
        translateLangList.forEach((l) => {
          s.add(l.code);
          (l.targets || []).forEach((t) => s.add(t));
        });
        return [...s];
      }
      const entry = translateLangList.find((l) => l.code === sourceVal);
      return entry?.targets?.length ? [...entry.targets] : ["en"];
    }
  
    /** Hydrates the source language dropdown with the available languages. */
    function hydrateTranslateSources() {
      translateSourceSel.innerHTML = "";
      const autoOpt = document.createElement("option");
      autoOpt.value = "auto";
      autoOpt.textContent = "Auto-detect";
      translateSourceSel.appendChild(autoOpt);
      const sorted = [...translateLangList].sort((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      );
      sorted.forEach((lang) => {
        const opt = document.createElement("option");
        opt.value = lang.code;
        opt.textContent = `${lang.name} (${lang.code})`;
        translateSourceSel.appendChild(opt);
      });
      const want = state.translateSource;
      if ([...translateSourceSel.options].some((o) => o.value === want)) {
        translateSourceSel.value = want;
      } else {
        translateSourceSel.value = "auto";
        state.translateSource = "auto";
      }
    }
  
    /** Hydrates the target language dropdown with the available languages. */
    function hydrateTranslateTargets() {
      const codes = targetLangCodes(translateSourceSel.value).sort((a, b) =>
        translateLanguageLabel(a).localeCompare(translateLanguageLabel(b)),
      );
      const prev = translateTargetSel.value || state.translateTarget;
      translateTargetSel.innerHTML = "";
      codes.forEach((code) => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = translateLanguageLabel(code);
        translateTargetSel.appendChild(opt);
      });
      const pick = codes.includes(prev)
        ? prev
        : codes.includes(state.translateTarget)
          ? state.translateTarget
          : codes.includes("es")
            ? "es"
            : codes[0];
      translateTargetSel.value = pick || codes[0] || "";
      state.translateTarget = translateTargetSel.value;
    }
   /** Loads the list of languages from the LibreTranslate instance. */
    async function hydrateTranslateLanguages() {
      translateResultEl.textContent = "Loading languagesâ€¦";
      translateMetaEl.textContent = "";
      translateMetaEl.hidden = true;
      let usedFallback = false;
      try {
        const res = await fetch(`${LIBRE_TRANSLATE_ORIGIN}/languages`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        translateLangList = await res.json();
      } catch {
        translateLangList = fallbackTranslateLanguages();
        usedFallback = true;
      }
      hydrateTranslateSources();
      hydrateTranslateTargets();
      translateResultEl.textContent = "Translation appears here.";
      if (usedFallback) {
        translateMetaEl.textContent =
          "Using a short offline language list (network/CORS may block the full list).";
        translateMetaEl.hidden = false;
      }
    }
  
    /** Gets the selected text on the page. */
    function getSelectionSnippet() {
      return (typeof window.getSelection === "function" && window.getSelection().toString().trim()) || "";
    }
  
    let dictionaryModalEscapeHandler = null;
    let dictionaryModalPayload = { word: "", definition: "" };
  
    /** Escapes HTML characters in a string. */
    function escapeHtml(unsafe) {
      return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
  
    /** API may use abbreviations before ":" (e.g. pron â†’ pronoun). Only known keys become POS headings. */
    const DICTIONARY_POS_LABELS = {
      noun: "Noun",
      n: "Noun",
      verb: "Verb",
      v: "Verb",
      adjective: "Adjective",
      adj: "Adjective",
      adverb: "Adverb",
      adv: "Adverb",
      pronoun: "Pronoun",
      pron: "Pronoun",
      preposition: "Preposition",
      prep: "Preposition",
      conjunction: "Conjunction",
      conj: "Conjunction",
      interjection: "Interjection",
      interj: "Interjection",
      abbreviation: "Abbreviation",
      abbr: "Abbreviation",
      "intransitive verb": "Intransitive verb",
      "transitive verb": "Transitive verb",
      "auxiliary verb": "Auxiliary verb",
      "linking verb": "Linking verb",
      "phrasal verb": "Phrasal verb",
      "modal verb": "Modal verb",
      "proper noun": "Proper noun",
      "common noun": "Common noun",
      "mass noun": "Mass noun",
      "countable noun": "Countable noun",
      "collective noun": "Collective noun",
      "noun plural": "Noun plural",
      "noun pl": "Noun plural",
      "n plural": "Noun plural",
      "n. pl": "Noun plural",
      "n. pl.": "Noun plural",
      npl: "Noun plural",
      "n.pl": "Noun plural",
      "n.pl.": "Noun plural",
      "n pl": "Noun plural",
      plural: "Plural",
      pl: "Plural",
      "pl.": "Plural",
      "past tense": "Past tense",
      "past t.": "Past tense",
      "past tens.": "Past tense",
      "imperfect tense": "Imperfect tense",
      "impf. tense": "Imperfect tense",
      imperfect: "Imperfect tense",
      "past participle": "Past participle",
      "past part.": "Past participle",
      "past part": "Past participle",
      "p.p.": "Past participle",
      "pp.": "Past participle",
      "past tense and past participle": "Past tense and past participle",
      "past tense & past participle": "Past tense and past participle",
      "past tense and past part.": "Past tense and past participle",
      "past tense and past part": "Past tense and past participle",
      "past tense & past part.": "Past tense and past participle",
      "past tense & past part": "Past tense and past participle",
      "p.t. and p.p.": "Past tense and past participle",
      "pt. and pp.": "Past tense and past participle",
      comparative: "Comparative",
      comp: "Comparative",
      "comp.": "Comparative",
      superlative: "Superlative",
      superl: "Superlative",
      "superl.": "Superlative",
      supr: "Superlative",
      "supr.": "Superlative",
      indicative: "Indicative",
      indic: "Indicative",
      "indic.": "Indicative",
      "present participle": "Present participle",
      "pres. participle": "Present participle",
      "pres. part.": "Present participle",
      "pres. part": "Present participle",
      "pres participle": "Present participle",
      "verbal noun": "Verbal noun",
      "verb. noun": "Verbal noun",
      "verb. n.": "Verbal noun",
      "vbl. n.": "Verbal noun",
      "verb n.": "Verbal noun",
      "present participle and verbal noun": "Present participle and verbal noun",
      "present participle & verbal noun": "Present participle and verbal noun",
      "present participle and verbal n.": "Present participle and verbal noun",
      "present participle and verbal n": "Present participle and verbal noun",
      "present participle & verbal n.": "Present participle and verbal noun",
      "present participle & verbal n": "Present participle and verbal noun",
      "pres. part. and verbal noun": "Present participle and verbal noun",
      "pres. part. and verbal n.": "Present participle and verbal noun",
      "present participle and vbl. n.": "Present participle and verbal noun",
      "pres. participle & verbal noun": "Present participle and verbal noun",
      "noun singular": "Noun singular",
      "noun sg": "Noun singular",
      "n singular": "Noun singular",
      "n. sg": "Noun singular",
      "n. sg.": "Noun singular",
      nsg: "Noun singular",
      "n.sg": "Noun singular",
      "n.sg.": "Noun singular",
      "n sg": "Noun singular",
      "n.sing. & pl.": "Noun singular & plural",
      "n.sing. & pl": "Noun singular & plural",
      "n.sing.&pl.": "Noun singular & plural",
      "n.sing.&pl": "Noun singular & plural",
      "nsing.&pl": "Noun singular & plural",
      "nsing.&pl.": "Noun singular & plural",
      "n sing & pl": "Noun singular & plural",
      "noun singular & plural": "Noun singular & plural",
      "noun sing & pl": "Noun singular & plural",
      "possessive pronoun": "Possessive pronoun",
      "possessive pron": "Possessive pronoun",
      "possessive pron.": "Possessive pronoun",
      possessivepron: "Possessive pronoun",
      "possessive.pron": "Possessive pronoun",
      possessivepronoun: "Possessive pronoun",
      posspron: "Possessive pronoun",
      "poss pron": "Possessive pronoun",
      "poss. pron": "Possessive pronoun",
      "poss. pron.": "Possessive pronoun",
    };
  
    /** Try spacing / period / & variants so API strings like "N.sing. & pl." resolve reliably. */
    function dictionaryPosKeyCandidates(rawToken) {
      const raw = String(rawToken || "").trim();
      if (!raw) return [];
      const spaced = raw.replace(/\s+/g, " ").toLowerCase();
      /** @type {Set<string>} */
      const keys = new Set();
      function addVariant(s) {
        if (!s) return;
        keys.add(s);
        keys.add(s.replace(/\.+$/, ""));
        keys.add(s.replace(/\s*\.\s*/g, ".").replace(/\.+$/, ""));
        keys.add(s.replace(/\s+/g, "").replace(/\.+$/, ""));
        keys.add(s.replace(/\s*\.\s*/g, ".").replace(/\s+/g, "").replace(/\.+$/, ""));
      }
      addVariant(spaced);
      if (spaced.includes("&")) {
        addVariant(spaced.replace(/\s*&\s*/g, " and "));
      }
      if (/\band\b/.test(spaced)) {
        addVariant(spaced.replace(/\s+\band\b\s+/g, " & "));
      }
      const ampEven = spaced.replace(/\s*&\s*/g, " & ");
      addVariant(ampEven);
      const ampTight = spaced.replace(/\s*&\s*/g, "&").replace(/\s+/g, " ").trim();
      addVariant(ampTight);
      const ampPacked = spaced.replace(/\s*&\s*/g, "&");
      addVariant(ampPacked);
      keys.add(ampPacked.replace(/\s+/g, "").replace(/\.+$/, ""));
      keys.add(
        ampPacked.replace(/\s*\.\s*/g, ".").replace(/\s+/g, "").replace(/\.+$/, ""),
      );
      return [...keys];
    }
  
    function dictionaryPosExpandedLabel(rawToken) {
      for (const key of dictionaryPosKeyCandidates(rawToken)) {
        const label = DICTIONARY_POS_LABELS[key];
        if (label) return label;
      }
      return "";
    }
  
    function setDictionaryModalActionsEnabled(enabled) {
      dictModalSpeakBtn.disabled = !enabled;
      dictModalCopyBtn.disabled = !enabled;
      dictModalSpeakBtn.setAttribute("aria-disabled", String(!enabled));
      dictModalCopyBtn.setAttribute("aria-disabled", String(!enabled));
    }
  
    function clearDictionaryModalDefinition() {
      dictModalDefinitionEl.textContent = "";
      dictModalDefinitionEl.innerHTML = "";
    }
  
    function populateDictionaryModalDefinition(container, rawDefinition) {
      container.textContent = "";
      const trimmed = String(rawDefinition).trim();
      if (!trimmed) {
        container.textContent = "No definition available.";
        return;
      }
      const blocks = trimmed.split(/\n\s*\n+/);
      blocks.forEach((block) => {
        const chunk = block.trim();
        if (!chunk) return;
        const sense = document.createElement("section");
        sense.className = "oa11y-dict-modal__sense";
        const posHeaderRe = /^([A-Za-z][A-Za-z.&\s]{0,62})\s*:\s*([\s\S]*)$/im;
        const m = chunk.match(posHeaderRe);
        const posLabel = m ? dictionaryPosExpandedLabel(m[1]) : "";
        if (m && posLabel) {
          const pos = document.createElement("strong");
          pos.className = "oa11y-dict-modal__pos";
          pos.textContent = `${posLabel}:`;
          const body = document.createElement("div");
          body.className = "oa11y-dict-modal__sense-body";
          body.innerHTML = escapeHtml(m[2].trim()).replace(/\n+/g, "<br>");
          sense.appendChild(pos);
          sense.appendChild(body);
        } else {
          const body = document.createElement("div");
          body.className = "oa11y-dict-modal__sense-body";
          body.innerHTML = escapeHtml(chunk).replace(/\n+/g, "<br>");
          sense.appendChild(body);
        }
        container.appendChild(sense);
      });
    }
  
    function dictionaryModalSpeakDefinition() {
      const w = dictionaryModalPayload.word;
      const d = dictionaryModalPayload.definition;
      if (!w || !d) return;
      const line = `${w}. ${d}`.replace(/\s+/g, " ").trim().slice(0, 32000);
      speakText(line);
    }
  
    async function dictionaryModalCopyDefinition() {
      const w = dictionaryModalPayload.word;
      const d = dictionaryModalPayload.definition;
      if (!w || !d) return;
      try {
        await navigator.clipboard.writeText(`${w}\n\n${d}`);
      } catch {
        /**/
      }
    }
  
    function normalizeDictionaryWordToken(raw) {
      if (typeof raw !== "string") return "";
      const trimmed = raw.trim();
      if (!trimmed || /\s/.test(trimmed)) return "";
      const w = trimmed
        .replace(/^[\s"'\u201C\u201D\u2018\u2019,.;:!?()[\]{}-\u2013\u2014]+/u, "")
        .replace(/[\s"'\u201C\u201D\u2018\u2019,.;:!?()[\]{}-\u2013\u2014]+$/u, "")
        .trim();
      if (!w || w.length > 120) return "";
      if (!/^[A-Za-z\u00C0-\u00FF]+(?:[-'][A-Za-z\u00C0-\u00FF]+)*$/i.test(w)) return "";
      return w;
    }
  
    function closeDictionaryModal() {
      if (dictModal.hidden) return;
      dictModal.hidden = true;
      dictModalHeadwordEl.textContent = "";
      dictionaryModalPayload = { word: "", definition: "" };
      clearDictionaryModalDefinition();
      setDictionaryModalActionsEnabled(false);
      if (dictionaryModalEscapeHandler) {
        document.removeEventListener("keydown", dictionaryModalEscapeHandler);
        dictionaryModalEscapeHandler = null;
      }
    }
  
    async function fetchDictionaryEntry(term) {
      const word = term.trim().slice(0, 240);
      const url = `${OPENACCESSIBLE_DICTIONARY_URL}?word=${encodeURIComponent(word)}`;
      const res = await fetch(url);
      const raw = await res.text();
      let data = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = {};
      }
      if (!res.ok)
        throw new Error(
          (data && data.message) ||
            raw.trim().slice(0, 140) ||
            res.statusText ||
            "Lookup failed.",
        );
      if (!data.definition || String(data.definition).trim() === "")
        throw new Error(
          raw.trim().slice(0, 240) ? raw.trim().slice(0, 240) : "No definition returned.",
        );
      return { word: data.word ?? word, definition: data.definition };
    }
  
    async function openDictionaryModalFromWord(rawToken) {
      if (!featureEnabled("double_click_dictionary")) return;
      const word = normalizeDictionaryWordToken(rawToken);
      if (!word) return;
      dictionaryModalPayload = { word: "", definition: "" };
      setDictionaryModalActionsEnabled(false);
  
      dictModal.hidden = false;
      dictModalHeadwordEl.textContent = word;
      clearDictionaryModalDefinition();
      const loading = document.createElement("div");
      loading.className = "oa11y-dict-modal__loading";
      loading.setAttribute("role", "status");
      loading.textContent = "Looking up definitionâ€¦";
      dictModalDefinitionEl.appendChild(loading);
  
      if (dictionaryModalEscapeHandler)
        document.removeEventListener("keydown", dictionaryModalEscapeHandler);
      dictionaryModalEscapeHandler = (ev) => {
        if (ev.key === "Escape") closeDictionaryModal();
      };
      document.addEventListener("keydown", dictionaryModalEscapeHandler);
  
      try {
        dictModalCloseBtn.focus({ preventScroll: true });
      } catch {
        dictModalCloseBtn.focus();
      }
  
      try {
        const entry = await fetchDictionaryEntry(word);
        dictionaryModalPayload = {
          word: entry.word,
          definition: entry.definition,
        };
        dictModalHeadwordEl.textContent = entry.word;
        populateDictionaryModalDefinition(dictModalDefinitionEl, entry.definition);
        setDictionaryModalActionsEnabled(true);
      } catch (e) {
        dictionaryModalPayload = { word: "", definition: "" };
        clearDictionaryModalDefinition();
        dictModalDefinitionEl.textContent =
          typeof e.message === "string" ? e.message : "Could not load definition.";
        setDictionaryModalActionsEnabled(false);
      }
    }
  
    async function runDictionaryLookup() {
      if (!featureEnabled("dictionary")) {
        alert("Dictionary is a Premium feature. Upgrade at openaccessible.com");
        return;
      }
      const word = dictWordInput.value.trim().slice(0, 240);
      if (!word) {
        dictResultEl.textContent = "Enter a word, then Define.";
        return;
      }
      dictResultEl.textContent = "Looking upâ€¦";
      try {
        const entry = await fetchDictionaryEntry(word);
        dictResultEl.textContent = `${entry.word}\n\n${entry.definition}`;
      } catch (e) {
        dictResultEl.textContent = `Dictionary unavailable (${e.message || "network/CORS blocked"}). Try again later.`;
      }
    }
  
    async function runTranslate() {
      if (!featureEnabled("translate")) {
        return;
      }
      const q = translateTextArea.value.trim().slice(0, 4500);
      translateMetaEl.hidden = true;
      translateMetaEl.textContent = "";
      if (!q) {
        translateResultEl.textContent = "Add text to translate, or use selection.";
        return;
      }
      translateResultEl.textContent = "Translatingâ€¦";
      try {
        const res = await fetch(`${LIBRE_TRANSLATE_ORIGIN}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q,
            source: translateSourceSel.value === "auto" ? "auto" : translateSourceSel.value,
            target: translateTargetSel.value,
            format: "text",
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
        translateResultEl.textContent = data.translatedText ?? "";
        if (data.detectedLanguage?.language) {
          const conf =
            typeof data.detectedLanguage.confidence === "number"
              ? ` ~${Math.round(data.detectedLanguage.confidence)}%`
              : "";
          translateMetaEl.textContent = `Detected ${translateLanguageLabel(data.detectedLanguage.language)}${conf}`;
          translateMetaEl.hidden = false;
        }
        state.translateSource = translateSourceSel.value;
        state.translateTarget = translateTargetSel.value;
        saveState();
      } catch (e) {
        translateResultEl.textContent = `Translation failed: ${e.message || "blocked or unreachable"}`;
      }
    }
  
    async function copyTranslationOutput() {
      const t = translateResultEl.textContent.trim();
      if (
        !t ||
        t === "Translatingâ€¦" ||
        t === "Translation appears here." ||
        t.includes("Translation failed")
      )
        return;
      try {
        await navigator.clipboard.writeText(t);
        translateMetaEl.hidden = false;
        translateMetaEl.textContent = "Copied to clipboard.";
      } catch {
        translateMetaEl.hidden = false;
        translateMetaEl.textContent =
          "Copy failed (browser may block clipboard unless HTTPS/page focus). Select and copy manually.";
      }
    }
  
    function readTranslationOutputAloud() {
      const txt = translateResultEl.textContent.trim();
      if (
        !txt ||
        txt === "Translatingâ€¦" ||
        txt === "Translation appears here." ||
        txt.includes("Translation failed")
      )
        return;
      speakText(txt, speechLangHintForTranslateTarget(translateTargetSel.value));
    }
  
    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  
    function loadState() {
      try {
        const raw =
          localStorage.getItem(STORAGE_KEY) ||
          localStorage.getItem("open_accessible_widget_state_v3") ||
          localStorage.getItem("open_accessible_widget_state_v2");
        const parsed = JSON.parse(raw || "null");
        if (!parsed) return;
        state.activeProfile = parsed.activeProfile ?? null;
        state.textScale = parsed.textScale ?? 1;
        state.lineHeight = parsed.lineHeight ?? 1;
        state.letterSpacing = parsed.letterSpacing ?? 0;
        state.readerLang = parsed.readerLang ?? state.readerLang;
        state.translateSource = parsed.translateSource ?? state.translateSource;
        state.translateTarget = parsed.translateTarget ?? state.translateTarget;
        Object.keys(state.settings).forEach((key) => {
          state.settings[key] = Boolean(parsed.settings?.[key]);
        });
      } catch {
        // Ignore invalid persisted state.
      }
    }
  
    function normalizedLangTag(lang) {
      return String(lang || "").replace(/_/g, "-").trim();
    }
  
    /** @param {SpeechSynthesisVoice} voice */
    function voiceReadabilityScore(voice) {
      const hay = `${voice.name}\t${voice.voiceURI}`.toLowerCase();
      let s = 0;
      if (hay.includes("enhanced")) s += 5;
      if (hay.includes("premium")) s += 4;
      if (hay.includes("neural")) s += 4;
      if (hay.includes("natural")) s += 3;
      if (hay.includes("watson")) s += 3;
      if (hay.includes("google")) s += 2;
      if (hay.includes("microsoft")) s += 2;
      if (voice.localService) s += 2;
      return s;
    }
  
    /** Prefer higher-quality bundled / system voices for easier listening. */
    function pickReadableVoice(desiredLang) {
      try {
        const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
        const voices =
          synth && typeof synth.getVoices === "function"
            ? synth.getVoices()
            : [];
        if (!voices || voices.length === 0) return null;
  
        const wantRaw = normalizedLangTag(desiredLang || "en-US");
        const want = wantRaw.toLowerCase();
        const dash = want.indexOf("-");
        const langPrimary = dash > 0 ? want.slice(0, dash) : want;
  
        let pool = voices.filter((v) => {
          const vl = normalizedLangTag(v.lang).toLowerCase();
          return (
            vl === want ||
            (langPrimary &&
              (vl.startsWith(`${langPrimary}-`) || vl === langPrimary))
          );
        });
        if (pool.length === 0) pool = [...voices];
  
        pool.sort((a, b) => {
          const d = voiceReadabilityScore(b) - voiceReadabilityScore(a);
          if (d !== 0) return d;
          if (a.localService !== b.localService) return a.localService ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        return pool[0] || null;
      } catch {
        return null;
      }
    }
  
    function primeSpeechVoices() {
      if (!("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.getVoices();
      } catch {
        /* ignore */
      }
    }
  
    function speakText(text, speechLangOptional) {
      if (!("speechSynthesis" in window) || !text) return;
      window.speechSynthesis.cancel();
      primeSpeechVoices();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      const lang =
        speechLangOptional ||
        state.readerLang ||
        document.documentElement.lang ||
        "en-US";
      utterance.lang = lang;
      const voice = pickReadableVoice(lang);
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }
  
    function readCurrentSelection() {
      const selected = getSelectionSnippet();
      if (selected) {
        speakText(selected);
        return;
      }
      alert("Select text on the page first, then press Read Selection.");
    }
  
    function readPage() {
      const shell = document.getElementById(SHELL_ID);
      const text =
        shell && shell.innerText
          ? shell.innerText
          : (document.body && document.body.innerText) || "";
      speakText(text.replace(/\s+/g, " ").trim());
    }
  
    function stopReading() {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  
    const THUMB_LINK_ATTR = "data-o11y-thumb";
    /** Snapshot of `aria-label` before we append destination host for in-page links (highlight / box links). */
    const THUMB_ARIA_BACKUP = "data-o11y-thumb-aria-backup";
    const BG_TILE_MARK_ATTR = "data-o11y-bg-tile";
  
    /** @param {HTMLAnchorElement} a */
    function restoreThumbnailLinkAriaBackup(a) {
      if (!a.hasAttribute(THUMB_ARIA_BACKUP)) return;
      try {
        const raw = a.getAttribute(THUMB_ARIA_BACKUP);
        const parsed = raw ? JSON.parse(raw) : null;
        const prev = parsed && Object.prototype.hasOwnProperty.call(parsed, "ariaLabel")
          ? parsed.ariaLabel
          : undefined;
        if (prev === null || prev === undefined) a.removeAttribute("aria-label");
        else a.setAttribute("aria-label", String(prev));
      } catch {
        /* ignore */
      }
      a.removeAttribute(THUMB_ARIA_BACKUP);
    }
  
    /** @param {HTMLAnchorElement} link */
    function applyThumbnailLinkSiteAria(link) {
      if (link.hasAttribute(THUMB_ARIA_BACKUP)) return;
      let host = "";
      try {
        host = new URL(link.href, document.baseURI).hostname || "";
      } catch {
        /* ignore */
      }
      const prevAria = link.getAttribute("aria-label");
      link.setAttribute(
        THUMB_ARIA_BACKUP,
        JSON.stringify({ ariaLabel: prevAria === null ? null : prevAria }),
      );
      const text = link.textContent.replace(/\s+/g, " ").trim();
      const base = (prevAria && prevAria.trim()) || text || "Link";
      const sitePart = host ? ` Website: ${host}.` : "";
      link.setAttribute("aria-label", `${base}.${sitePart}`.trim());
    }
    let thumbnailMarkObserver = null;
    let thumbnailMarkTimer = 0;
  
    /** True when computed background-image is an actual raster/CSS url (not a bare gradient). */
    function elementHasRasterBackgroundImage(el) {
      try {
        const bi = getComputedStyle(el).backgroundImage;
        if (!bi || bi === "none") return false;
        if (/gradient\(/i.test(bi)) return false;
        return /url\s*\(/i.test(bi);
      } catch {
        return false;
      }
    }
  
    function clearThumbnailLinkMarks(shell) {
      if (!shell) return;
      shell.querySelectorAll(`a[${THUMB_LINK_ATTR}]`).forEach((node) => {
        if (node instanceof HTMLAnchorElement) {
          restoreThumbnailLinkAriaBackup(node);
          node.removeAttribute(THUMB_LINK_ATTR);
        }
      });
      shell.querySelectorAll(`a[${THUMB_ARIA_BACKUP}]`).forEach((node) => {
        if (node instanceof HTMLAnchorElement) restoreThumbnailLinkAriaBackup(node);
      });
      shell.querySelectorAll(`[${BG_TILE_MARK_ATTR}]`).forEach((n) =>
        n.removeAttribute(BG_TILE_MARK_ATTR),
      );
    }
  
    /** Mark nodes inside the anchor that paint a photo tile (captions excluded from yellow later). */
    function markRasterBackgroundTilesInAnchor(link) {
      if (elementHasRasterBackgroundImage(link)) {
        try {
          link.setAttribute(BG_TILE_MARK_ATTR, "1");
        } catch {
          /* ignore */
        }
      }
      const stars = link.getElementsByTagName("*");
      const cap = Math.min(stars.length, 180);
      for (let i = 0; i < cap; i++) {
        if (elementHasRasterBackgroundImage(stars[i])) {
          try {
            stars[i].setAttribute(BG_TILE_MARK_ATTR, "1");
          } catch {
            /* ignore */
          }
        }
      }
    }
  
    /** Heuristic: product / gallery links (media or CSS background tiles from stylesheets). */
    function anchorIsVisualThumbnailLink(link) {
      if (!(link instanceof HTMLAnchorElement) || !link.href) return false;
      const shell = document.getElementById(SHELL_ID);
      if (!shell || !shell.contains(link)) return false;
      if (link.closest("#oa11y-panel, #oa11y-toggle, #oa11y-dict-modal")) return false;
  
      if (link.querySelector("picture, video, canvas")) return true;
  
      const imgs = link.querySelectorAll("img");
      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        if (!(img instanceof HTMLImageElement)) continue;
        const ow = img.offsetWidth;
        const oh = img.offsetHeight;
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        if ((nw >= 28 && nh >= 28) || (ow >= 28 && oh >= 28)) return true;
      }
  
      const svg = link.querySelector("svg");
      if (svg) {
        try {
          const r = svg.getBoundingClientRect();
          if (r.width >= 40 && r.height >= 40) return true;
        } catch {
          /* ignore */
        }
      }
  
      if (elementHasRasterBackgroundImage(link)) return true;
  
      const stars = link.getElementsByTagName("*");
      const cap = Math.min(stars.length, 180);
      for (let j = 0; j < cap; j++) {
        if (elementHasRasterBackgroundImage(stars[j])) return true;
      }
  
      return false;
    }
  
    function disconnectThumbnailMarkObserver() {
      if (thumbnailMarkObserver) {
        thumbnailMarkObserver.disconnect();
        thumbnailMarkObserver = null;
      }
    }
  
    function scheduleThumbnailLinkMarkSync() {
      if (thumbnailMarkTimer) window.clearTimeout(thumbnailMarkTimer);
      thumbnailMarkTimer = window.setTimeout(() => {
        thumbnailMarkTimer = 0;
        syncThumbnailLinkMarks();
      }, 180);
    }
  
    /** Sets data-o11y-thumb / data-o11y-bg-tile inside #oa11y-content-shell for Highlight / Box links. */
    function syncThumbnailLinkMarks() {
      const shell = document.getElementById(SHELL_ID);
      const active =
        Boolean(state.settings.highlight_links) || Boolean(state.settings.boxed_links);
  
      if (!shell || !active) {
        clearThumbnailLinkMarks(shell || undefined);
        disconnectThumbnailMarkObserver();
        return;
      }
  
      clearThumbnailLinkMarks(shell);
  
      shell.querySelectorAll("a[href]").forEach((node) => {
        if (!(node instanceof HTMLAnchorElement)) return;
        if (node.closest("#oa11y-panel, #oa11y-toggle, #oa11y-dict-modal"))
          return;
        applyThumbnailLinkSiteAria(node);
      });
  
      shell.querySelectorAll("a[href]").forEach((node) => {
        if (!(node instanceof HTMLAnchorElement)) return;
        if (node.closest("#oa11y-panel, #oa11y-toggle, #oa11y-dict-modal"))
          return;
        if (!anchorIsVisualThumbnailLink(node)) return;
        try {
          node.setAttribute(THUMB_LINK_ATTR, "1");
        } catch {
          /* ignore */
        }
        markRasterBackgroundTilesInAnchor(node);
      });
  
      if (!thumbnailMarkObserver) {
        thumbnailMarkObserver = new MutationObserver(() =>
          scheduleThumbnailLinkMarkSync(),
        );
        thumbnailMarkObserver.observe(shell, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: [
            "class",
            "style",
            "src",
            "srcset",
            "data-src",
            "data-srcset",
            "data-bgset",
            "data-background-image",
            "loading",
          ],
        });
      }
    }
  
    function applyStateToDom() {
      const shell = document.getElementById(SHELL_ID);
      document.body.classList.remove(
        `${CLASS_PREFIX}invert_colors`,
        `${CLASS_PREFIX}grayscale`,
      );
      SETTINGS.forEach((item) => {
        const cls = `${CLASS_PREFIX}${item.id}`;
        if (SHELL_CLASS_SETTINGS.has(item.id)) {
          if (shell) shell.classList.toggle(cls, state.settings[item.id]);
          return;
        }
        document.body.classList.toggle(cls, state.settings[item.id]);
      });
      let letterRem = Number(state.letterSpacing) || 0;
      if (state.settings.letter_spacing_wide) letterRem += 0.08;
      document.documentElement.style.setProperty("--oa11y-letter-spacing", `${letterRem}rem`);
  
      let textMul = Number(state.textScale) || 1;
      if (state.settings.text_size_boost) textMul *= 1.22;
      document.documentElement.style.setProperty("--oa11y-text-size-multiplier", String(textMul));
  
      let lineMul = Number(state.lineHeight) || 1;
      if (state.settings.line_height_boost) lineMul *= 1.22;
      document.documentElement.style.setProperty("--oa11y-line-height-multiplier", String(lineMul));
  
      syncThumbnailLinkMarks();
      window.requestAnimationFrame(() => syncThumbnailLinkMarks());
    }
  
    window.addEventListener(
      "load",
      () => {
        syncThumbnailLinkMarks();
        window.requestAnimationFrame(() => syncThumbnailLinkMarks());
      },
      { once: true },
    );
  
    function renderProfiles() {
      profilesNode.innerHTML = "";
      PROFILES.forEach((profile) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerHTML = `
          <span class="oa11y-profile-icon" aria-hidden="true">${getIconSvg(profile.icon)}</span>
          <span class="oa11y-profile-label">${profile.label}</span>
        `;
        btn.setAttribute(
          "aria-label",
          `Apply ${profile.label} accessibility profile`,
        );
        btn.setAttribute("aria-pressed", String(state.activeProfile === profile.id));
        btn.addEventListener("click", () => {
          state.activeProfile = profile.id;
          Object.keys(state.settings).forEach((key) => {
            state.settings[key] = profile.settings.includes(key);
          });
          state.textScale = profile.textScale;
          state.lineHeight = profile.lineHeight;
          state.letterSpacing = profile.letterSpacing;
          applyStateToDom();
          renderProfiles();
          renderSettings();
          saveState();
          trackEvent("profile_apply", { profile_id: profile.id });
        });
        profilesNode.appendChild(btn);
      });
    }
  
    function renderSettings() {
      settingsNode.innerHTML = "";
      SETTINGS.forEach((item) => {
        const row = document.createElement("div");
        row.className = "oa11y-row";
  
        const inputId = `oa11y-setting-${item.id}`;
        const helpId = `oa11y-setting-help-${item.id}`;
  
        const headLabel = document.createElement("label");
        headLabel.className = "oa11y-setting-head";
        headLabel.htmlFor = inputId;
  
        const nameSpan = document.createElement("span");
        nameSpan.textContent = item.label;
  
        const iconWrap = document.createElement("span");
        iconWrap.className = "oa11y-setting-icon";
        iconWrap.setAttribute("aria-hidden", "true");
        iconWrap.innerHTML = getIconSvg(item.icon);
  
        headLabel.appendChild(nameSpan);
        headLabel.appendChild(iconWrap);
  
        const desc = document.createElement("span");
        desc.className = "oa11y-setting-desc";
        desc.id = helpId;
        desc.textContent = item.whatItDoes;
  
        const textCol = document.createElement("div");
        textCol.className = "oa11y-setting-col";
        textCol.appendChild(headLabel);
        textCol.appendChild(desc);
  
        const switchTrack = document.createElement("div");
        switchTrack.className = "oa11y-switch";
  
        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = inputId;
        input.setAttribute("aria-describedby", helpId);
        input.checked = state.settings[item.id];
        input.addEventListener("change", () => {
          state.settings[item.id] = input.checked;
          state.activeProfile = null;
          applyStateToDom();
          renderProfiles();
          saveState();
          trackEvent("setting_toggle", { setting_id: item.id, action: input.checked ? "on" : "off" });
        });
  
        const slider = document.createElement("span");
        slider.className = "oa11y-slider";
  
        switchTrack.appendChild(input);
        switchTrack.appendChild(slider);
        row.appendChild(textCol);
        row.appendChild(switchTrack);
        settingsNode.appendChild(row);
      });
    }
  
    function setPanelOpen(open) {
      panel.dataset.open = String(open);
      panel.setAttribute("aria-hidden", String(!open));
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute(
        "aria-label",
        open ? "Close accessibility widget" : "Open accessibility widget",
      );
    }
    function resetAll() {
      stopReading();
      state.activeProfile = null;
      state.textScale = 1;
      state.lineHeight = 1;
      state.letterSpacing = 0;
      Object.keys(state.settings).forEach((key) => {
        state.settings[key] = false;
      });
      applyStateToDom();
      renderProfiles();
      renderSettings();
      saveState();
    }
  
    toggle.addEventListener("click", () => setPanelOpen(panel.dataset.open !== "true"));
    closeBtn.addEventListener("click", () => setPanelOpen(false));
    resetBtn.addEventListener("click", resetAll);
    readPageBtn.addEventListener("click", readPage);
    readSelectionBtn.addEventListener("click", readCurrentSelection);
    stopReadingBtn.addEventListener("click", stopReading);
  
    dictModal.addEventListener("click", (ev) => {
      const t = ev.target;
      if (t instanceof Element && t.closest('[data-oa11y-dismiss="1"]'))
        closeDictionaryModal();
    });
    dictModalCloseBtn.addEventListener("click", () => closeDictionaryModal());
    dictModalSpeakBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      dictionaryModalSpeakDefinition();
    });
    dictModalCopyBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      void dictionaryModalCopyDefinition();
    });
  
    document.addEventListener(
      "dblclick",
      (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (
          target.closest("#oa11y-panel, #oa11y-toggle, #oa11y-dict-modal") ||
          target.closest("input, textarea, select, button, summary")
        )
          return;
        if (typeof target.closest === "function" && target.closest("[contenteditable]")) return;
  
        window.setTimeout(() => {
          const sel = window.getSelection()?.toString() ?? "";
          void openDictionaryModalFromWord(sel);
        }, 0);
      },
      true,
    );
  
    document.addEventListener("mousemove", (event) => {
      document.body.style.setProperty("--oa11y-mouse-y", `${event.clientY}px`);
    });
  
    loadState();
    initReaderLangControl();
    applyStateToDom();
    renderProfiles();
    renderSettings();
  
    translateSourceSel.addEventListener("change", () => {
      state.translateSource = translateSourceSel.value;
      hydrateTranslateTargets();
      saveState();
    });
    translateTargetSel.addEventListener("change", () => {
      state.translateTarget = translateTargetSel.value;
      saveState();
    });
    translateRunBtn.addEventListener("click", () => void runTranslate());
    translateSelectionBtn.addEventListener("click", () => {
      const s = getSelectionSnippet();
      if (!s) {
        alert("Select text on the page first.");
        return;
      }
      translateTextArea.value = s.slice(0, 4500);
    });
    translateCopyBtn.addEventListener("click", () => void copyTranslationOutput());
    translateReadBtn.addEventListener("click", readTranslationOutputAloud);
    dictLookupBtn.addEventListener("click", () => void runDictionaryLookup());
    dictSelectionBtn.addEventListener("click", () => {
      const s = getSelectionSnippet();
      if (!s) {
        alert("Select text on the page first.");
        return;
      }
      const m = s.match(/[A-Za-z\u00C0-\u00FF0-9'-]+/);
      dictWordInput.value = (m ? m[0] : s.split(/\s+/)[0] || s).slice(0, 240);
      void runDictionaryLookup();
    });
  
    void hydrateTranslateLanguages();
  })();
  
