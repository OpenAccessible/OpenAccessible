/**
 * OpenAccessible - SAAS-Ready Accessibility Widget
 * Single-file embeddable widget: Color, Dyslexia/Dictionary, Contrast, Language,
 * Size, Cursor, Highlight, TTS, Text Align, Screen Reader/Braille support & more.
 * @license GPU v3
 *
 * Structure:
 * - defaultState / state: user preferences (persisted to localStorage)
 * - API: optional backend (apiBase) for dictionary, TTS, translate, preferences
 * - Panel: settings UI; toolbar: floating button + position
 * - Dictionary: double-click word -> modal with word, definition, and Play word/Play definition audio
 * - TTS: browser SpeechSynthesis or server (eSpeak) for Read page, Speak selection, dictionary modal
 */
(function (global) {
    'use strict';
  
    // --- Constants ---
    const STORAGE_KEY = 'openaccessible_prefs';
    const WIDGET_VERSION = '1.0.0';
    const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="Universal Access icon - body moved up more"><circle cx="256" cy="256" r="220" fill="#0F172A"/><circle cx="256" cy="256" r="240" fill="none" stroke="#22D3EE" stroke-width="14"/><circle cx="256" cy="256" r="220" fill="none" stroke="#22D3EE" stroke-width="8" opacity="0.75"/><g transform="translate(0,-22)" fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round"><circle cx="256" cy="150" r="44" fill="#FFFFFF" stroke="none"/><g stroke="#0F172A" stroke-width="14" stroke-linecap="round"><circle cx="238" cy="142" r="10" fill="#0F172A" stroke="none"/><circle cx="274" cy="142" r="10" fill="#0F172A" stroke="none"/><path d="M256 152 L254 162" fill="none"/><path d="M238 172 Q256 188 274 172" fill="none"/></g><path d="M132 224 L380 224" stroke-width="36"/><path d="M256 210 V334" stroke-width="44"/><path d="M256 334 L206 432" stroke-width="36"/><path d="M256 334 L306 432" stroke-width="36"/><path d="M206 444 L172 444" stroke-width="30"/><path d="M306 444 L340 444" stroke-width="30"/></g></svg>';
  
    // --- Default state (all user preferences) ---
    const defaultState = {
      colorFilter: 'none',           // none | grayscale | invert | sepia | protanopia | deuteranopia | tritanopia | dark | light
      dyslexiaFont: false,
      contrast: 1,                   // 1 = normal, higher = more contrast
      fontSize: 100,                 // %
      cursorSize: 'default',         // default | large | xl
      highlightLinks: false,
      highlightHeadings: false,
      highlightFocus: true,
      ttsEnabled: false,
      ttsRate: 1,
      ttsPitch: 1,
      ttsVoice: null,
      textAlign: '',                 // '' | left | center | right | justify
      language: '',
      reduceMotion: false,
      underlineLinks: false,
      readingGuide: false,
      readingGuidePos: 0,
      toolbarPosition: 'bottom-right', // top-left | top-right | bottom-left | bottom-right
      dictionaryEnabled: false,
      simplifiedWords: false,
      screenReaderHints: true,
      letterSpacing: 'normal',       // normal | wide | wider
      lineHeight: 'normal',          // normal | relaxed | loose
      wordSpacing: 'normal',
      highlightAsRead: false,         // highlight words as TTS speaks
      translateTargetLang: '',        // e.g. es, fr
      monospaceFont: false,
      focusStrip: false,
      enlargeFocus: false,
      showLinkUrl: false,
      reduceTransparency: false,
      highlightForms: false,
      contentWidth: 'full',          // full | narrow | narrower
    };
  
    // --- Mutable state and DOM refs ---
    let state = { ...defaultState };
    let apiBase = '';
    let apiKey = '';
    let apiUserId = '';
    let $root = null;
    let $panel = null;
    let activeHighlights = [];
    let readingGuideEl = null;
    let ttsUtterance = null;
    let ttsSynth = null;
    let useServerTts = false;
    let serverTtsQueue = [];
    let serverTtsAudio = null;
    let serverTtsAbort = null;
    let iconUrl = '';
    let accountVerifyUrl = 'https://api.openaccessible.com/v1/verify';
    let hasOpenAccessibleAccount = false;
  
    // --- Storage & events ---
    function readStorage() {
      try {
        const raw = global.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          state = { ...defaultState, ...parsed };
        }
      } catch (_) {}
    }
  
    function writeStorage() {
      try {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (_) {}
    }
  
    function emit(name, detail) {
      try {
        global.dispatchEvent(new CustomEvent('openaccessible:' + name, { detail }));
      } catch (_) {}
    }
  
    function getScriptBase() {
      const s = document.currentScript || document.querySelector('script[src*="widget"]');
      if (s && s.src) return s.src.replace(/\/[^/?#]+(?:\?.*)?$/, '/');
      return '';
    }

    function getFontsBase() {
      if (apiBase && apiBase.replace) return apiBase.replace(/\?.*$/, '') + '/fonts/';
      return getScriptBase() + 'api/fonts/';
    }
  
    function renderIcon(className) {
      const c = className || 'oa-icon';
      if (iconUrl) {
        const img = document.createElement('img');
        img.src = iconUrl;
        img.alt = '';
        img.className = c;
        img.setAttribute('aria-hidden', 'true');
        return img;
      }
      const wrap = document.createElement('span');
      wrap.innerHTML = ICON_SVG;
      const el = wrap.firstElementChild || wrap;
      el.className = (el.className ? el.className + ' ' : '') + c;
      return el;
    }
  
    // --- Inject widget and panel styles (including word modal, dark theme) ---
    function injectStyles() {
      const id = 'openaccessible-styles';
      if (document.getElementById(id)) return;
      const css = `
        .openaccessible-widget-root{--oa-zoom:1;--oa-contrast:1;--oa-cursor:default;--oa-align:left;--oa-ls:normal;--oa-lh:normal;--oa-ws:normal;font-family:'Ubuntu',sans-serif !important;}
        .openaccessible-widget-root.oa-color-grayscale{filter:grayscale(1);}
        .openaccessible-widget-root.oa-color-invert{filter:invert(1);}
        .openaccessible-widget-root.oa-color-sepia{filter:sepia(1);}
        .openaccessible-widget-root.oa-color-protanopia{filter:url(#oa-protanopia);}
        .openaccessible-widget-root.oa-color-deuteranopia{filter:url(#oa-deuteranopia);}
        .openaccessible-widget-root.oa-color-tritanopia{filter:url(#oa-tritanopia);}
        .openaccessible-widget-root.oa-color-dark{filter:brightness(0.85) contrast(1.2);background:#1a1a1a !important;color:#f1f5f9 !important;}
        .openaccessible-widget-root.oa-color-light{filter:brightness(1.1) contrast(1.1);background:#f5f5f5 !important;color:#111 !important;}
        .openaccessible-widget-root.oa-dyslexia,.openaccessible-widget-root.oa-dyslexia body,.openaccessible-widget-root.oa-dyslexia .oa-panel,.openaccessible-widget-root.oa-dyslexia *{font-family:'OpenDyslexic',sans-serif !important;}
        .openaccessible-widget-root.oa-highlight-links a{outline:2px solid #0a7ea4 !important;outline-offset:2px;}
        .openaccessible-widget-root.oa-highlight-headings h1,.openaccessible-widget-root.oa-highlight-headings h2,.openaccessible-widget-root.oa-highlight-headings h3,.openaccessible-widget-root.oa-highlight-headings h4,.openaccessible-widget-root.oa-highlight-headings h5,.openaccessible-widget-root.oa-highlight-headings h6{outline:2px dashed #0a7ea4;outline-offset:4px;}
        .openaccessible-widget-root.oa-focus-visible *:focus-visible{outline:3px solid #0a7ea4 !important;outline-offset:2px !important;}
        .openaccessible-widget-root.oa-underline-links a{text-decoration:underline !important;}
        .openaccessible-widget-root.oa-reduce-motion *,.openaccessible-widget-root.oa-reduce-motion *::before,.openaccessible-widget-root.oa-reduce-motion *::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;}
        .openaccessible-widget-root.oa-reading-guide::after{content:'';position:fixed;left:0;top:var(--oa-guide-y,0);width:100%;height:120px;background:rgba(10,126,164,0.12);pointer-events:none;z-index:99998;}
        .openaccessible-widget-root[data-oa-align="center"]{text-align:center;}
        .openaccessible-widget-root[data-oa-align="right"]{text-align:right;}
        .openaccessible-widget-root[data-oa-align="justify"]{text-align:justify;}
        .openaccessible-widget-root.oa-ls-wide{letter-spacing:0.12em !important;}
        .openaccessible-widget-root.oa-ls-wider{letter-spacing:0.2em !important;}
        .openaccessible-widget-root.oa-lh-relaxed{line-height:1.6 !important;}
        .openaccessible-widget-root.oa-lh-loose{line-height:1.9 !important;}
        .openaccessible-widget-root.oa-ws-wide{word-spacing:0.2em !important;}
        .openaccessible-widget-root.oa-monospace{font-family:ui-monospace,monospace !important;}
        .openaccessible-widget-root.oa-focus-strip .oa-focus-strip-mask{position:fixed;left:0;right:0;top:0;bottom:0;background:linear-gradient(to bottom,rgba(0,0,0,0.55) 0%,transparent 35%,transparent 65%,rgba(0,0,0,0.55) 100%);pointer-events:none;z-index:2147483643;}
        .oa-selection-bar{position:fixed;z-index:2147483644;display:flex;gap:6px;padding:6px 10px;background:#0F172A;color:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.3);align-items:center;font-size:13px;}
        .oa-selection-bar .oa-btn-bar{padding:6px 12px;border:none;border-radius:6px;background:#22D3EE;color:#0F172A;cursor:pointer;font-weight:500;}
        .oa-selection-bar .oa-btn-bar:hover{background:#67e8f9;}
        .oa-reading-view{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:90%;max-width:520px;max-height:80vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 24px 48px rgba(0,0,0,0.2);z-index:2147483644;padding:24px;}
        .oa-reading-view h4{margin:0 0 16px;font-size:1rem;}
        .oa-reading-view .oa-reading-content{line-height:1.8;}
        .oa-reading-view .oa-word{transition:background 0.1s;}
        .oa-reading-view .oa-word.oa-current{background:#22D3EE;color:#0F172A;}
        .oa-reading-view-close{position:absolute;top:12px;right:12px;border:none;background:#e2e8f0;border-radius:8px;cursor:pointer;padding:6px 10px;font-size:14px;}
        body.oa-widget-dark .oa-reading-view{background:#1e293b;}
        body.oa-widget-dark .oa-reading-view .oa-word.oa-current{background:#67e8f9;color:#0F172A;}
        body.oa-widget-dark .oa-translate-overlay{background:#1e293b;color:#e2e8f0;}
        body.oa-widget-dark .oa-selection-bar{background:#1e293b;}
        .oa-translate-overlay{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:90%;max-width:560px;max-height:85vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 24px 48px rgba(0,0,0,0.25);z-index:2147483644;padding:24px;}
        .oa-translate-overlay h4{margin:0 0 12px;}
        .oa-translate-overlay .oa-translated-text{white-space:pre-wrap;}
        .openaccessible-widget-root.oa-enlarge-focus *:focus-visible{outline-width:4px !important;}
        .openaccessible-widget-root.oa-highlight-forms input:focus,.openaccessible-widget-root.oa-highlight-forms select:focus,.openaccessible-widget-root.oa-highlight-forms textarea:focus,.openaccessible-widget-root.oa-highlight-forms button:focus{outline:3px solid #22D3EE !important;outline-offset:2px;}
        .openaccessible-widget-root.oa-reduce-transparency .oa-panel,.openaccessible-widget-root.oa-reduce-transparency .oa-reading-view,.openaccessible-widget-root.oa-reduce-transparency .oa-translate-overlay{background:#fff !important;}
        body.oa-widget-dark .openaccessible-widget-root.oa-reduce-transparency .oa-panel,.openaccessible-widget-root.oa-reduce-transparency .oa-reading-view,.openaccessible-widget-root.oa-reduce-transparency .oa-translate-overlay{background:#1e293b !important;}
        .openaccessible-widget-root.oa-content-narrow main,.openaccessible-widget-root.oa-content-narrow [role="main"],.openaccessible-widget-root.oa-content-narrow .oa-content-wrap{max-width:65ch !important;margin-left:auto !important;margin-right:auto !important;}
        .openaccessible-widget-root.oa-content-narrower main,.openaccessible-widget-root.oa-content-narrower [role="main"],.openaccessible-widget-root.oa-content-narrower .oa-content-wrap{max-width:45ch !important;margin-left:auto !important;margin-right:auto !important;}
        .oa-overlay-list{list-style:none;margin:0;padding:8px 0;max-height:280px;overflow:auto;}
        .oa-overlay-list li{padding:8px 12px;border-radius:8px;cursor:pointer;}
        .oa-overlay-list li:hover{background:rgba(34,211,238,0.15);}
        .oa-overlay-list li a{color:inherit;text-decoration:none;}
        .oa-toolbar{position:fixed;z-index:2147483646;font-family:system-ui,-apple-system,sans-serif;}
        .oa-toolbar[data-pos="bottom-right"]{bottom:20px;right:20px;}
        .oa-toolbar[data-pos="bottom-left"]{bottom:20px;left:20px;}
        .oa-toolbar[data-pos="top-right"]{top:20px;right:20px;}
        .oa-toolbar[data-pos="top-left"]{top:20px;left:20px;}
        .oa-toolbar-btn{width:56px;height:56px;border:none;border-radius:50%;background:#0F172A;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(15,23,42,0.4),0 0 0 3px rgba(34,211,238,0.2);transition:transform 0.2s ease,box-shadow 0.2s ease;}
        .oa-toolbar-btn:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(15,23,42,0.5),0 0 0 3px #22D3EE;}
        .oa-toolbar-btn:focus-visible{outline:none;box-shadow:0 6px 24px rgba(15,23,42,0.5),0 0 0 3px #22D3EE;}
        .oa-toolbar-btn.active{box-shadow:0 4px 20px rgba(34,211,238,0.35),0 0 0 3px #22D3EE;}
        .oa-toolbar-btn .oa-icon{width:32px;height:32px;display:block;}
        .oa-panel{position:fixed;z-index:2147483645;background:#fff;border-radius:16px;box-shadow:0 24px 48px rgba(15,23,42,0.15),0 0 0 1px rgba(0,0,0,0.06);max-width:380px;max-height:88vh;overflow:auto;padding:0;font-size:14px;}
        .oa-panel[data-pos="bottom-right"]{bottom:88px;right:20px;}
        .oa-panel[data-pos="bottom-left"]{bottom:88px;left:20px;}
        .oa-panel[data-pos="top-right"]{top:88px;right:20px;}
        .oa-panel[data-pos="top-left"]{top:88px;left:20px;}
        .oa-panel-header{display:flex;align-items:center;gap:12px;padding:16px 20px;background:linear-gradient(135deg,#0F172A 0%,#1e293b 100%);color:#fff;border-radius:16px 16px 0 0;}
        .oa-panel-header .oa-icon-wrap{display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .oa-panel-header .oa-icon{width:28px;height:28px;}
        .oa-panel-header h3{margin:0;font-size:1.1rem;font-weight:600;letter-spacing:0.02em;}
        .oa-tts-actions{display:flex;gap:8px;margin-bottom:12px;}
        .oa-btn-tts{padding:8px 14px;border-radius:8px;border:1px solid #22D3EE;background:#f0fdfa;color:#0e7490;cursor:pointer;font-size:13px;font-weight:500;}
        .oa-btn-tts:hover{background:#ccfbf1;}
        .oa-btn-tts:focus-visible{outline:2px solid #22D3EE;outline-offset:2px;}
        .oa-panel-body{padding:20px;}
        .oa-panel .oa-close{position:absolute;top:12px;right:12px;width:32px;height:32px;padding:0;background:rgba(255,255,255,0.1);border:none;border-radius:8px;cursor:pointer;font-size:18px;line-height:1;color:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;}
        .oa-panel .oa-close:hover{background:rgba(255,255,255,0.2);}
        .oa-section{margin-bottom:20px;}
        .oa-section:last-child{margin-bottom:0;}
        .oa-section-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#22D3EE;margin-bottom:10px;}
        .oa-section label{display:block;margin-bottom:6px;font-weight:500;color:#334155;}
        .oa-opt{display:flex;align-items:center;gap:10px;margin:8px 0;}
        .oa-opt input[type="checkbox"]{width:20px;height:20px;accent-color:#22D3EE;}
        .oa-opt select{flex:1;padding:8px 12px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;}
        .oa-opt select:focus{border-color:#22D3EE;outline:none;}
        .oa-opt input[type="range"]{flex:1;accent-color:#22D3EE;}
        .oa-panel .oa-reset{padding:10px 16px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;color:#475569;font-size:13px;font-weight:500;cursor:pointer;margin-top:8px;}
        .oa-panel .oa-reset:hover{background:#f1f5f9;}
        body.oa-widget-dark .oa-panel{background:#1e293b;box-shadow:0 24px 48px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.08);}
        body.oa-widget-dark .oa-panel-body{background:#1e293b;}
        body.oa-widget-dark .oa-section-title{color:#67e8f9;}
        body.oa-widget-dark .oa-section label{color:#cbd5e1;}
        body.oa-widget-dark .oa-opt select{background:#334155;border-color:#475569;color:#e2e8f0;}
        body.oa-widget-dark .oa-opt select:focus{border-color:#67e8f9;}
        body.oa-widget-dark .oa-panel .oa-reset{background:#334155;border-color:#475569;color:#cbd5e1;}
        body.oa-widget-dark .oa-panel .oa-reset:hover{background:#475569;}
        body.oa-widget-dark .oa-btn-tts{background:#334155;border-color:#67e8f9;color:#67e8f9;}
        body.oa-widget-dark .oa-btn-tts:hover{background:#475569;}
        body.oa-widget-dark .oa-toolbar-btn{background:#1e293b;box-shadow:0 4px 20px rgba(0,0,0,0.5),0 0 0 3px rgba(34,211,238,0.25);}
        body.oa-widget-dark .oa-toolbar-btn:hover{box-shadow:0 6px 24px rgba(0,0,0,0.5),0 0 0 3px #22D3EE;}
        body.oa-widget-dark .oa-toolbar-btn.active{box-shadow:0 4px 20px rgba(34,211,238,0.4),0 0 0 3px #22D3EE;}
        body.oa-widget-light .oa-panel{background:#f8fafc;box-shadow:0 24px 48px rgba(15,23,42,0.12),0 0 0 1px rgba(0,0,0,0.06);}
        body.oa-widget-light .oa-panel-body{background:#f8fafc;}
        body.oa-widget-light .oa-section label{color:#334155;}
        body.oa-widget-light .oa-toolbar-btn{background:#1e293b;}
        body.oa-cursor-large{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath fill='%23000' d='M2 2 L2 28 L8 22 L14 28 L16 26 L10 20 L16 18 Z'/%3E%3Cpath fill='%23fff' d='M2 2 L2 26 L6 22 L12 26 L14 24 L8 20 L14 18 Z'/%3E%3C/svg%3E") 0 0, auto;}
        body.oa-cursor-xl{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath fill='%23000' d='M3 3 L3 42 L12 33 L21 42 L24 39 L15 30 L24 27 Z'/%3E%3Cpath fill='%23fff' d='M3 3 L3 39 L9 33 L18 39 L21 36 L12 30 L21 27 Z'/%3E%3C/svg%3E") 0 0, auto;}
        .oa-word-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:20px;}
        .oa-word-modal{background:#fff;border-radius:16px;box-shadow:0 24px 48px rgba(0,0,0,0.2);max-width:400px;width:100%;padding:24px;position:relative;}
        .oa-word-modal .oa-word-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#22D3EE;margin:0 0 4px;}
        .oa-word-modal h2{margin:0 0 16px;font-size:1.5rem;font-weight:700;color:#0F172A;}
        .oa-word-modal .oa-pron-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#22D3EE;margin:0 0 4px;}
        .oa-word-modal .oa-word-pron{margin:0 0 12px;font-size:14px;font-style:italic;color:#64748b;}
        .oa-word-modal .oa-def-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#22D3EE;margin:0 0 4px;}
        .oa-word-modal .oa-word-def{margin:0 0 20px;font-size:15px;line-height:1.5;color:#334155;}
        .oa-word-modal .oa-word-audio{display:flex;gap:10px;flex-wrap:wrap;}
        .oa-word-modal .oa-btn-audio{padding:10px 16px;border-radius:10px;border:1px solid #22D3EE;background:#f0fdfa;color:#0e7490;cursor:pointer;font-size:14px;font-weight:500;}
        .oa-word-modal .oa-btn-audio:hover{background:#ccfbf1;}
        .oa-word-modal .oa-btn-audio:focus-visible{outline:2px solid #22D3EE;outline-offset:2px;}
        .oa-word-modal .oa-close-modal{position:absolute;top:16px;right:16px;width:36px;height:36px;padding:0;background:#f1f5f9;border:none;border-radius:10px;cursor:pointer;font-size:20px;line-height:1;color:#475569;}
        .oa-word-modal .oa-close-modal:hover{background:#e2e8f0;}
        body.oa-widget-dark .oa-word-modal-backdrop{background:rgba(0,0,0,0.7);}
        body.oa-widget-dark .oa-word-modal{background:#1e293b;box-shadow:0 24px 48px rgba(0,0,0,0.5);}
        body.oa-widget-dark .oa-word-modal .oa-word-label,body.oa-widget-dark .oa-word-modal .oa-def-label,body.oa-widget-dark .oa-word-modal .oa-pron-label{color:#67e8f9;}
        body.oa-widget-dark .oa-word-modal h2{color:#f1f5f9;}
        body.oa-widget-dark .oa-word-modal .oa-word-pron{color:#94a3b8;}
        body.oa-widget-dark .oa-word-modal .oa-word-def{color:#cbd5e1;}
        body.oa-widget-dark .oa-word-modal .oa-btn-audio{background:#334155;border-color:#67e8f9;color:#67e8f9;}
        body.oa-widget-dark .oa-word-modal .oa-btn-audio:hover{background:#475569;}
        body.oa-widget-dark .oa-word-modal .oa-close-modal{background:#334155;color:#cbd5e1;}
        body.oa-widget-dark .oa-word-modal .oa-close-modal:hover{background:#475569;}
        .oa-panel-footer{margin-top:0;padding:16px 20px;text-align:center;font-size:12px;background:linear-gradient(135deg,#0F172A 0%,#1e293b 100%);color:#fff;border-radius:0 0 16px 16px;}
        .oa-panel-footer a{color:#22D3EE;text-decoration:none;}
        .oa-panel-footer a:hover{text-decoration:underline;color:#67e8f9;}
        .oa-panel-footer .oa-account-badge{display:inline-block;margin-top:4px;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,0.15);color:#e2e8f0;font-size:11px;}
        .oa-panel-footer .oa-account-badge-hidden{display:none;}
      `;
      const el = document.createElement('style');
      el.id = id;
      el.textContent = css;
      document.head.appendChild(el);
    }
  
    function ensureSvgFilters() {
      let svg = document.getElementById('openaccessible-filters');
      if (svg) return;
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'openaccessible-filters';
      svg.setAttribute('aria-hidden', 'true');
      svg.style.cssText = 'position:absolute;width:0;height:0;';
      svg.innerHTML = `
        <defs>
          <filter id="oa-protanopia"><feColorMatrix type="matrix" values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"/></filter>
          <filter id="oa-deuteranopia"><feColorMatrix type="matrix" values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"/></filter>
          <filter id="oa-tritanopia"><feColorMatrix type="matrix" values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"/></filter>
        </defs>
      `;
      document.body.appendChild(svg);
    }
  
    // --- Apply current state to document (colors, font size, dyslexia font, etc.) ---
    function applyToDocument() {
      ensureFontsInjected();
      if (!$root) $root = document.documentElement;
      $root.classList.add('openaccessible-widget-root');
      $root.style.setProperty('font-size', state.fontSize + '%');
      $root.style.setProperty('filter', state.contrast !== 1 ? `contrast(${state.contrast})` : '');
      $root.dataset.oaAlign = state.textAlign || '';
  
      ['grayscale','invert','sepia','protanopia','deuteranopia','tritanopia','dark','light'].forEach(c => $root.classList.remove('oa-color-' + c));
      if (state.colorFilter && state.colorFilter !== 'none') $root.classList.add('oa-color-' + state.colorFilter);
  
      $root.classList.toggle('oa-dyslexia', !!state.dyslexiaFont);
      if (state.dyslexiaFont) ensureFontsInjected();
      var panel = document.getElementById('openaccessible-panel');
      if (panel) panel.classList.toggle('oa-dyslexia', !!state.dyslexiaFont);
      $root.classList.toggle('oa-highlight-links', !!state.highlightLinks);
      $root.classList.toggle('oa-highlight-headings', !!state.highlightHeadings);
      $root.classList.toggle('oa-focus-visible', !!state.highlightFocus);
      $root.classList.toggle('oa-underline-links', !!state.underlineLinks);
      $root.classList.toggle('oa-reduce-motion', !!state.reduceMotion);
      $root.classList.toggle('oa-reading-guide', !!state.readingGuide);
      $root.classList.toggle('oa-ls-wide', state.letterSpacing === 'wide');
      $root.classList.toggle('oa-ls-wider', state.letterSpacing === 'wider');
      $root.classList.toggle('oa-lh-relaxed', state.lineHeight === 'relaxed');
      $root.classList.toggle('oa-lh-loose', state.lineHeight === 'loose');
      $root.classList.toggle('oa-ws-wide', state.wordSpacing === 'wide');
      $root.classList.toggle('oa-monospace', !!state.monospaceFont);
      $root.classList.toggle('oa-focus-strip', !!state.focusStrip);
      $root.classList.toggle('oa-enlarge-focus', !!state.enlargeFocus);
      $root.classList.toggle('oa-show-link-url', !!state.showLinkUrl);
      $root.classList.toggle('oa-reduce-transparency', !!state.reduceTransparency);
      $root.classList.toggle('oa-highlight-forms', !!state.highlightForms);
      $root.classList.remove('oa-content-narrow', 'oa-content-narrower');
      if (state.contentWidth === 'narrow') $root.classList.add('oa-content-narrow');
      if (state.contentWidth === 'narrower') $root.classList.add('oa-content-narrower');
  
      if (state.focusStrip) ensureFocusStripMask();
      else removeFocusStripMask();
      if (state.readingGuide) {
        $root.style.setProperty('--oa-guide-y', (state.readingGuidePos || 0) + 'px');
      }
  
      document.body.classList.remove('oa-cursor-large', 'oa-cursor-xl');
      if (state.cursorSize === 'large') document.body.classList.add('oa-cursor-large');
      if (state.cursorSize === 'xl') document.body.classList.add('oa-cursor-xl');
  
      if (state.colorFilter && ['protanopia','deuteranopia','tritanopia'].includes(state.colorFilter)) ensureSvgFilters();
  
      document.body.classList.remove('oa-widget-dark', 'oa-widget-light');
      if (state.colorFilter === 'dark') document.body.classList.add('oa-widget-dark');
      if (state.colorFilter === 'light') document.body.classList.add('oa-widget-light');
      initLinkUrlOnFocus();
    }
  
    function ensureFontsInjected() {
      if (document.getElementById('openaccessible-fonts')) return;
      const base = getFontsBase();
      const style = document.createElement('style');
      style.id = 'openaccessible-fonts';
      style.textContent =
        '@font-face{font-family:"Ubuntu";src:url("' + base + 'Ubuntu-Regular.ttf") format("truetype");font-weight:400;font-style:normal;}' +
        '@font-face{font-family:"OpenDyslexic";src:url("' + base + 'OpenDyslexic-Regular.otf") format("opentype");font-weight:400;font-style:normal;}';
      document.head.appendChild(style);
    }
  
    // --- Sync panel controls (checkboxes, ranges, selects) from state ---
    function syncPanelFromState() {
      if (!$panel) return;
      const get = (name) => $panel.querySelector(`[data-oa-opt="${name}"]`);
      const set = (name, value) => {
        const el = get(name);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = !!value;
        else if (el.type === 'range') el.value = value;
        else el.value = value || '';
      };
      set('colorFilter', state.colorFilter);
      set('dyslexiaFont', state.dyslexiaFont);
      set('contrast', state.contrast);
      set('fontSize', state.fontSize);
      set('cursorSize', state.cursorSize);
      set('highlightLinks', state.highlightLinks);
      set('highlightHeadings', state.highlightHeadings);
      set('highlightFocus', state.highlightFocus);
      set('ttsEnabled', state.ttsEnabled);
      set('ttsRate', state.ttsRate);
      set('ttsPitch', state.ttsPitch);
      set('textAlign', state.textAlign);
      set('language', state.language);
      set('reduceMotion', state.reduceMotion);
      set('underlineLinks', state.underlineLinks);
      set('readingGuide', state.readingGuide);
      set('toolbarPosition', state.toolbarPosition);
      set('dictionaryEnabled', state.dictionaryEnabled);
      set('screenReaderHints', state.screenReaderHints);
      set('letterSpacing', state.letterSpacing);
      set('lineHeight', state.lineHeight);
      set('wordSpacing', state.wordSpacing);
      set('highlightAsRead', state.highlightAsRead);
      set('translateTargetLang', state.translateTargetLang);
      set('monospaceFont', state.monospaceFont);
      set('focusStrip', state.focusStrip);
      set('simplifiedWords', state.simplifiedWords);
      set('enlargeFocus', state.enlargeFocus);
      set('showLinkUrl', state.showLinkUrl);
      set('reduceTransparency', state.reduceTransparency);
      set('highlightForms', state.highlightForms);
      set('contentWidth', state.contentWidth);
    }
  
    function applyFromPanel() {
      if (!$panel) return;
      const get = (name, asNumber) => {
        const el = $panel.querySelector(`[data-oa-opt="${name}"]`);
        if (!el) return undefined;
        if (el.type === 'checkbox') return el.checked;
        if (asNumber || el.type === 'range') return Number(el.value) || 0;
        return el.value || '';
      };
      state.colorFilter = get('colorFilter') || 'none';
      state.dyslexiaFont = get('dyslexiaFont');
      state.contrast = parseFloat(get('contrast', true)) || 1;
      state.fontSize = parseInt(get('fontSize', true), 10) || 100;
      state.cursorSize = get('cursorSize') || 'default';
      state.highlightLinks = get('highlightLinks');
      state.highlightHeadings = get('highlightHeadings');
      state.highlightFocus = get('highlightFocus');
      state.ttsEnabled = get('ttsEnabled');
      state.ttsRate = parseFloat(get('ttsRate', true)) || 1;
      state.ttsPitch = parseFloat(get('ttsPitch', true)) || 1;
      state.textAlign = get('textAlign') || '';
      state.language = get('language') || '';
      state.reduceMotion = get('reduceMotion');
      state.underlineLinks = get('underlineLinks');
      state.readingGuide = get('readingGuide');
      state.toolbarPosition = get('toolbarPosition') || 'bottom-right';
      state.dictionaryEnabled = get('dictionaryEnabled');
      state.screenReaderHints = get('screenReaderHints');
      state.letterSpacing = get('letterSpacing') || 'normal';
      state.lineHeight = get('lineHeight') || 'normal';
      state.wordSpacing = get('wordSpacing') || 'normal';
      state.highlightAsRead = get('highlightAsRead');
      state.translateTargetLang = get('translateTargetLang') || '';
      state.monospaceFont = get('monospaceFont');
      state.focusStrip = get('focusStrip');
      state.simplifiedWords = get('simplifiedWords');
      state.enlargeFocus = get('enlargeFocus');
      state.showLinkUrl = get('showLinkUrl');
      state.reduceTransparency = get('reduceTransparency');
      state.highlightForms = get('highlightForms');
      state.contentWidth = get('contentWidth') || 'full';
      writeStorage();
      applyToDocument();
      updateToolbarPosition();
      syncApiPreferences('save');
      emit('change', state);
    }
  
    // --- Position floating toolbar (top/bottom left/right) ---
    function updateToolbarPosition() {
      const pos = state.toolbarPosition || 'bottom-right';
      if ($panel) $panel.setAttribute('data-pos', pos);
      const tb = document.getElementById('openaccessible-toolbar');
      if (tb) tb.setAttribute('data-pos', pos);
    }
  
    function updateToolbarActive(open) {
      const tb = document.getElementById('openaccessible-toolbar');
      const btn = tb && tb.querySelector('[data-oa-open]');
      if (btn) btn.classList.toggle('active', !!open);
    }
  
    // --- Build settings panel DOM (sections: Reading, Size, Highlight, TTS, Translate, etc.) ---
    function createPanel() {
      if ($panel) return $panel;
      const pos = state.toolbarPosition || 'bottom-right';
      $panel = document.createElement('div');
      $panel.id = 'openaccessible-panel';
      $panel.className = 'oa-panel';
      $panel.setAttribute('role', 'dialog');
      $panel.setAttribute('aria-label', 'Accessibility settings');
      $panel.setAttribute('data-pos', pos);
      $panel.innerHTML = `
        <div class="oa-panel-header">
          <span class="oa-icon-wrap"></span>
          <h3>Accessibility</h3>
        </div>
        <button type="button" class="oa-close" aria-label="Close panel" data-oa-close>&times;</button>
        <div class="oa-panel-body">
        <div class="oa-section">
          <div class="oa-section-title">Color &amp; contrast</div>
          <div class="oa-opt">
            <label>Filter</label>
            <select data-oa-opt="colorFilter">
              <option value="none">None</option>
              <option value="grayscale">Grayscale</option>
              <option value="invert">Invert</option>
              <option value="sepia">Sepia</option>
              <option value="protanopia">Protanopia</option>
              <option value="deuteranopia">Deuteranopia</option>
              <option value="tritanopia">Tritanopia</option>
              <option value="dark">Dark theme</option>
              <option value="light">Light theme</option>
            </select>
          </div>
          <div class="oa-opt">
            <label>Contrast</label>
            <input type="range" data-oa-opt="contrast" min="1" max="2" step="0.1" value="1">
            <span data-oa-contrast-value>1</span>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">Reading &amp; dyslexia</div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="dyslexiaFont" id="oa-dyslexia">
            <label for="oa-dyslexia">OpenDyslexic font</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="simplifiedWords" id="oa-simplify">
            <label for="oa-simplify">Simplify words (readability)</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="dictionaryEnabled" id="oa-dict">
            <label for="oa-dict">Dictionary (double-click word)</label>
          </div>
          <div class="oa-opt" style="margin-top:4px;">
            <span style="font-size:12px;color:#64748b;">Double-click a word to open a modal with the word, definition, and audio to hear the word or definition.</span>
          </div>
          <div class="oa-opt">
            <label>Letter spacing</label>
            <select data-oa-opt="letterSpacing">
              <option value="normal">Normal</option>
              <option value="wide">Wide</option>
              <option value="wider">Wider</option>
            </select>
          </div>
          <div class="oa-opt">
            <label>Line height</label>
            <select data-oa-opt="lineHeight">
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
              <option value="loose">Loose</option>
            </select>
          </div>
          <div class="oa-opt">
            <label>Word spacing</label>
            <select data-oa-opt="wordSpacing">
              <option value="normal">Normal</option>
              <option value="wide">Wide</option>
            </select>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">Size &amp; cursor</div>
          <div class="oa-opt">
            <label>Font size %</label>
            <input type="range" data-oa-opt="fontSize" min="80" max="150" step="5" value="100">
            <span data-oa-font-value>100</span>
          </div>
          <div class="oa-opt">
            <label>Cursor</label>
            <select data-oa-opt="cursorSize">
              <option value="default">Default</option>
              <option value="large">Large</option>
              <option value="xl">Extra large</option>
            </select>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">Highlight &amp; focus</div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="highlightLinks" id="oa-hlinks">
            <label for="oa-hlinks">Highlight links</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="highlightHeadings" id="oa-hhead">
            <label for="oa-hhead">Highlight headings</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="highlightFocus" id="oa-hfocus" checked>
            <label for="oa-hfocus">Highlight focus</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="underlineLinks" id="oa-ulinks">
            <label for="oa-ulinks">Underline links</label>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">Text-to-Speech</div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="ttsEnabled" id="oa-tts">
            <label for="oa-tts">Enable TTS</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="highlightAsRead" id="oa-highlight-read">
            <label for="oa-highlight-read">Highlight words as you read</label>
          </div>
          <div class="oa-opt">
            <label>Rate</label>
            <input type="range" data-oa-opt="ttsRate" min="0.5" max="2" step="0.1" value="1">
          </div>
          <div class="oa-opt">
            <label>Pitch</label>
            <input type="range" data-oa-opt="ttsPitch" min="0.5" max="2" step="0.1" value="1">
          </div>
          <div class="oa-opt">
            <label>Voice</label>
            <select data-oa-opt="ttsVoice"><option value="">Default</option></select>
          </div>
          <div class="oa-tts-actions">
            <button type="button" class="oa-btn-tts" data-oa-tts-read aria-label="Read page">Read</button>
            <button type="button" class="oa-btn-tts" data-oa-tts-stop aria-label="Stop">Stop</button>
            <button type="button" class="oa-btn-tts" data-oa-speak-selection aria-label="Speak selection">Speak selection</button>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">Translate</div>
          <div class="oa-opt">
            <label>Translate to</label>
            <select data-oa-opt="translateTargetLang">
              <option value="">Off</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ar">Arabic</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="hi">Hindi</option>
              <option value="nl">Dutch</option>
              <option value="ru">Russian</option>
            </select>
          </div>
          <div class="oa-tts-actions">
            <button type="button" class="oa-btn-tts" data-oa-translate-selection aria-label="Translate selection">Translate selection</button>
            <button type="button" class="oa-btn-tts" data-oa-translate-page aria-label="Translate page">Translate page</button>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">Text alignment</div>
          <div class="oa-opt">
            <select data-oa-opt="textAlign">
              <option value="">Default</option>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">Language</div>
          <div class="oa-opt">
            <select data-oa-opt="language">
              <option value="">Default</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ar">Arabic</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </select>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">Quick presets</div>
          <div class="oa-tts-actions">
            <button type="button" class="oa-btn-tts" data-oa-preset-spacing>More spacing</button>
            <button type="button" class="oa-btn-tts" data-oa-preset-contrast>High contrast</button>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">Navigation</div>
          <div class="oa-tts-actions">
            <button type="button" class="oa-btn-tts" data-oa-headings>Headings</button>
            <button type="button" class="oa-btn-tts" data-oa-images>Image descriptions</button>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">Visibility &amp; focus</div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="enlargeFocus" id="oa-enlarge-focus">
            <label for="oa-enlarge-focus">Enlarge focus indicator</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="showLinkUrl" id="oa-show-link-url">
            <label for="oa-show-link-url">Show link URL on focus</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="reduceTransparency" id="oa-reduce-transparency">
            <label for="oa-reduce-transparency">Reduce transparency</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="highlightForms" id="oa-highlight-forms">
            <label for="oa-highlight-forms">Highlight form fields</label>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">Layout</div>
          <div class="oa-opt">
            <label>Content width</label>
            <select data-oa-opt="contentWidth">
              <option value="full">Full</option>
              <option value="narrow">Narrow (65ch)</option>
              <option value="narrower">Narrower (45ch)</option>
            </select>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">More</div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="monospaceFont" id="oa-mono">
            <label for="oa-mono">Monospace font</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="focusStrip" id="oa-focus-strip">
            <label for="oa-focus-strip">Focus strip (dim except line)</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="reduceMotion" id="oa-motion">
            <label for="oa-motion">Reduce motion</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="readingGuide" id="oa-guide">
            <label for="oa-guide">Reading guide</label>
          </div>
          <div class="oa-opt">
            <input type="checkbox" data-oa-opt="screenReaderHints" id="oa-sr" checked>
            <label for="oa-sr">Screen reader / Braille hints</label>
          </div>
          <div class="oa-opt">
            <label>Toolbar position</label>
            <select data-oa-opt="toolbarPosition">
              <option value="bottom-right">Bottom right</option>
              <option value="bottom-left">Bottom left</option>
              <option value="top-right">Top right</option>
              <option value="top-left">Top left</option>
            </select>
          </div>
        </div>
  
        <div class="oa-section">
          <div class="oa-section-title">Settings</div>
          <div class="oa-tts-actions">
            <button type="button" class="oa-btn-tts" data-oa-export>Export settings</button>
            <button type="button" class="oa-btn-tts" data-oa-import>Import settings</button>
          </div>
          <input type="file" accept=".json,application/json" data-oa-import-file style="display:none">
          <p class="oa-shortcut-hint" style="margin:8px 0 0;font-size:12px;color:#64748b;">Shortcut: Alt+A to open/close</p>
        </div>
  
        <div class="oa-section">
          <button type="button" class="oa-reset" data-oa-reset>Reset all</button>
        </div>
        </div>
        <div class="oa-panel-footer" id="oa-panel-footer">
          <a href="https://openaccessible.com" target="_blank" rel="noopener noreferrer">Powered by OpenAccessible</a>
          <div class="oa-account-badge oa-account-badge-hidden" id="oa-account-badge" aria-hidden="true">Account linked</div>
        </div>
      `;
  
      $panel.querySelector('.oa-icon-wrap').appendChild(renderIcon('oa-icon'));
      $panel.querySelector('[data-oa-close]').addEventListener('click', function () { togglePanel(false); updateToolbarActive(false); });
      $panel.querySelector('[data-oa-reset]').addEventListener('click', reset);
      $panel.querySelector('[data-oa-tts-read]').addEventListener('click', readPageWithTTS);
      $panel.querySelector('[data-oa-tts-stop]').addEventListener('click', stopTTS);
      $panel.querySelector('[data-oa-speak-selection]').addEventListener('click', speakSelection);
      $panel.querySelector('[data-oa-translate-selection]').addEventListener('click', translateSelection);
      $panel.querySelector('[data-oa-translate-page]').addEventListener('click', translatePage);
      $panel.querySelector('[data-oa-preset-spacing]').addEventListener('click', applyMoreSpacingPreset);
      $panel.querySelector('[data-oa-preset-contrast]').addEventListener('click', applyHighContrastPreset);
      $panel.querySelector('[data-oa-headings]').addEventListener('click', showHeadingsOutline);
      $panel.querySelector('[data-oa-images]').addEventListener('click', showImageDescriptions);
      $panel.querySelector('[data-oa-export]').addEventListener('click', exportSettings);
      $panel.querySelector('[data-oa-import]').addEventListener('click', function () { $panel.querySelector('[data-oa-import-file]').click(); });
      $panel.querySelector('[data-oa-import-file]').addEventListener('change', importSettingsFromFile);
  
      $panel.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', applyFromPanel);
        el.addEventListener('input', function () {
          if (this.type === 'range') {
            const v = this.dataset.oaOpt;
            if (v === 'contrast') ($panel.querySelector('[data-oa-contrast-value]') || {}).textContent = this.value;
            if (v === 'fontSize') ($panel.querySelector('[data-oa-font-value]') || {}).textContent = this.value;
          }
          applyFromPanel();
        });
      });
  
      document.body.appendChild($panel);
      if (state.dyslexiaFont) $panel.classList.add('oa-dyslexia');
  
      const voiceSelect = $panel.querySelector('[data-oa-opt="ttsVoice"]');
      if (voiceSelect && global.speechSynthesis) {
        function fillVoices() {
          const voices = global.speechSynthesis.getVoices();
          voiceSelect.innerHTML = '<option value="">Default</option>';
          voices.forEach(v => {
            const o = document.createElement('option');
            o.value = v.name;
            o.textContent = v.name + (v.lang ? ' (' + v.lang + ')' : '');
            voiceSelect.appendChild(o);
          });
          if (state.ttsVoice) voiceSelect.value = state.ttsVoice;
        }
        fillVoices();
        if (global.speechSynthesis.onvoiceschanged !== undefined) global.speechSynthesis.onvoiceschanged = fillVoices;
      }
  
      syncPanelFromState();
      updateFooterAccountBadge();
      return $panel;
    }
  
    // --- Check OpenAccessible.com for valid account/token and show "Account linked" in footer ---
    function checkOpenAccessibleAccount() {
      if (!apiKey || !accountVerifyUrl) return;
      var url = accountVerifyUrl.replace(/\?.*$/, '') + (accountVerifyUrl.indexOf('?') >= 0 ? '&' : '?') + 'token=' + encodeURIComponent(apiKey);
      fetch(url, { method: 'GET', headers: { 'X-API-Key': apiKey } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && (data.valid === true || data.account === true || data.authenticated === true)) {
            hasOpenAccessibleAccount = true;
            updateFooterAccountBadge();
          }
        })
        .catch(function () {});
    }
  
    function updateFooterAccountBadge() {
      var badge = document.getElementById('oa-account-badge');
      if (!badge) return;
      if (hasOpenAccessibleAccount) {
        badge.classList.remove('oa-account-badge-hidden');
        badge.setAttribute('aria-hidden', 'false');
      } else {
        badge.classList.add('oa-account-badge-hidden');
        badge.setAttribute('aria-hidden', 'true');
      }
    }
  
    // --- Floating toolbar (open panel button, position from state) ---
    function createToolbar() {
      if (document.getElementById('openaccessible-toolbar')) return;
      const pos = state.toolbarPosition || 'bottom-right';
      const bar = document.createElement('div');
      bar.id = 'openaccessible-toolbar';
      bar.className = 'oa-toolbar';
      bar.setAttribute('data-pos', pos);
      bar.setAttribute('role', 'toolbar');
      bar.setAttribute('aria-label', 'Accessibility');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'oa-toolbar-btn';
      btn.setAttribute('aria-label', 'Open accessibility settings');
      btn.setAttribute('title', 'Accessibility');
      btn.setAttribute('data-oa-open', '');
      btn.appendChild(renderIcon('oa-icon'));
      btn.addEventListener('click', function () {
        const open = (document.getElementById('openaccessible-panel') || {}).style.display !== 'block';
        togglePanel(open);
        btn.classList.toggle('active', open);
      });
      bar.appendChild(btn);
      document.body.appendChild(bar);
    }
  
    function togglePanel(open) {
      const panel = document.getElementById('openaccessible-panel');
      if (!panel) createPanel();
      const p = document.getElementById('openaccessible-panel');
      if (open) {
        p.style.display = 'block';
        syncPanelFromState();
        updateToolbarActive(true);
        const first = p.querySelector('.oa-close, [data-oa-opt]');
        if (first && first.focus) first.focus();
      } else {
        p.style.display = 'none';
        updateToolbarActive(false);
      }
      emit('panel', { open: !!open });
    }
  
    function reset() {
      state = { ...defaultState };
      writeStorage();
      applyToDocument();
      syncPanelFromState();
      updateToolbarPosition();
      syncApiPreferences('save');
      emit('reset', state);
    }
  
    // --- TTS: split long text into chunks for server (sentence boundaries when possible) ---
    function chunkTextForTts(text, maxLen) {
      maxLen = maxLen || 500;
      const chunks = [];
      let rest = text.replace(/\s+/g, ' ').trim();
      while (rest.length > 0) {
        if (rest.length <= maxLen) {
          chunks.push(rest);
          break;
        }
        const slice = rest.slice(0, maxLen);
        const lastPeriod = slice.lastIndexOf('.');
        const lastQuestion = slice.lastIndexOf('?');
        const lastExclaim = slice.lastIndexOf('!');
        const lastBreak = Math.max(lastPeriod, lastQuestion, lastExclaim);
        const splitAt = lastBreak > maxLen >> 1 ? lastBreak + 1 : maxLen;
        chunks.push(rest.slice(0, splitAt).trim());
        rest = rest.slice(splitAt).trim();
      }
      return chunks.filter(Boolean);
    }
  
    // --- TTS: play next chunk from server queue ---
    function playNextServerTts() {
      if (serverTtsQueue.length === 0 || serverTtsAbort) {
        serverTtsAudio = null;
        emit('tts:stop', {});
        return;
      }
      const text = serverTtsQueue.shift();
      requestServerTts(text, function (url) {
        if (serverTtsAbort) return;
        if (!url) {
          playNextServerTts();
          return;
        }
        const audio = new Audio(url);
        serverTtsAudio = audio;
        audio.onended = audio.onerror = function () { playNextServerTts(); };
        audio.play().catch(function () { playNextServerTts(); });
      });
    }
  
    // --- TTS: request audio URL from API (action=tts), then onUrl(url) or onUrl(null) ---
    function requestServerTts(text, onUrl) {
      if (!apiBase || !text.trim()) { if (onUrl) onUrl(null); return; }
      const url = apiBase.replace(/\?.*$/, '') + '?action=tts';
      const opts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 3000),
          lang: state.language || document.documentElement.lang || 'en',
          rate: state.ttsRate || 1
        })
      };
      if (apiKey) opts.headers['X-API-Key'] = apiKey;
      const ac = new AbortController();
      serverTtsAbort = function () { ac.abort(); };
      fetch(url, { ...opts, signal: ac.signal })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.url) onUrl(data.url);
          else if (onUrl) onUrl(null);
        })
        .catch(function () { if (onUrl) onUrl(null); });
    }
  
    // --- TTS: stop all playback (server queue + browser SpeechSynthesis) ---
    function stopTTS() {
      serverTtsAbort = true;
      serverTtsQueue = [];
      if (serverTtsAudio) {
        try { serverTtsAudio.pause(); serverTtsAudio.currentTime = 0; } catch (_) {}
        serverTtsAudio = null;
      }
      if (global.speechSynthesis) global.speechSynthesis.cancel();
      ttsUtterance = null;
      closeReadingView();
      emit('tts:stop', {});
    }
  
    function speakElement(el) {
      if (!state.ttsEnabled && !el.hasAttribute('data-oa-tts-force')) return;
      stopTTS();
      const text = (el.innerText || el.textContent || '').trim().slice(0, 5000);
      if (!text) return;
      if (useServerTts && apiBase) {
        serverTtsAbort = null;
        serverTtsQueue = chunkTextForTts(text, 500);
        emit('tts:start', {});
        playNextServerTts();
        return;
      }
      if (!global.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = state.ttsRate || 1;
      u.pitch = state.ttsPitch || 1;
      u.lang = state.language || document.documentElement.lang || 'en';
      global.speechSynthesis.speak(u);
    }
  
    function speakSelection() {
      const sel = global.getSelection();
      const text = (sel && sel.toString() || '').trim();
      if (!text) {
        showTooltip(null, 'Select some text first, then click Speak selection.');
        return;
      }
      stopTTS();
      if (useServerTts && apiBase) {
        serverTtsAbort = null;
        serverTtsQueue = chunkTextForTts(text.slice(0, 5000), 500);
        emit('tts:start', {});
        playNextServerTts();
        return;
      }
      if (!global.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(text.slice(0, 5000));
      u.rate = state.ttsRate || 1;
      u.pitch = state.ttsPitch || 1;
      u.lang = state.language || document.documentElement.lang || 'en';
      if (state.ttsVoice && global.speechSynthesis.getVoices) {
        const v = global.speechSynthesis.getVoices().find(function (x) { return x.name === state.ttsVoice; });
        if (v) u.voice = v;
      }
      global.speechSynthesis.speak(u);
      emit('tts:start', {});
    }
  
    let selectionBarEl = null;
    // --- Selection bar: Speak / Translate after user selects text ---
    function showSelectionBar(x, y) {
      hideSelectionBar();
      const bar = document.createElement('div');
      bar.className = 'oa-selection-bar';
      bar.innerHTML = '<button type="button" class="oa-btn-bar" data-oa-bar-speak>Speak</button><button type="button" class="oa-btn-bar" data-oa-bar-translate>Translate</button>';
      bar.style.left = Math.max(10, Math.min(x - 80, global.innerWidth - 200)) + 'px';
      bar.style.top = (y - 48) + 'px';
      bar.querySelector('[data-oa-bar-speak]').addEventListener('click', function () { speakSelection(); hideSelectionBar(); });
      bar.querySelector('[data-oa-bar-translate]').addEventListener('click', function () { translateSelection(); hideSelectionBar(); });
      document.body.appendChild(bar);
      selectionBarEl = bar;
    }
    function hideSelectionBar() {
      if (selectionBarEl && selectionBarEl.parentNode) selectionBarEl.remove();
      selectionBarEl = null;
    }
  
    let readingViewEl = null;
    let readingViewWordSpans = [];
    function readPageWithTTS() {
      stopTTS();
      const text = (document.body.innerText || document.body.textContent || '').trim();
      if (!text) return;
      const max = 20000;
      const toSpeak = text.slice(0, max);
      if (state.highlightAsRead && global.speechSynthesis && !useServerTts) {
        openReadingViewAndSpeak(toSpeak);
        return;
      }
      if (useServerTts && apiBase) {
        serverTtsAbort = null;
        serverTtsQueue = chunkTextForTts(toSpeak, 500);
        emit('tts:start', {});
        playNextServerTts();
        return;
      }
      if (!global.speechSynthesis) return;
      ttsSynth = global.speechSynthesis;
      ttsUtterance = new SpeechSynthesisUtterance(toSpeak);
      ttsUtterance.rate = state.ttsRate || 1;
      ttsUtterance.pitch = state.ttsPitch || 1;
      ttsUtterance.lang = state.language || document.documentElement.lang || 'en';
      if (state.ttsVoice) {
        const voices = ttsSynth.getVoices();
        const v = voices.find(function (x) { return x.name === state.ttsVoice; });
        if (v) ttsUtterance.voice = v;
      }
      ttsSynth.speak(ttsUtterance);
      emit('tts:start', {});
    }
  
    function openReadingViewAndSpeak(fullText) {
      const words = fullText.split(/\s+/).filter(Boolean);
      if (words.length === 0) return;
      if (readingViewEl) readingViewEl.remove();
      const wrap = document.createElement('div');
      wrap.className = 'oa-reading-view';
      wrap.setAttribute('role', 'dialog');
      wrap.setAttribute('aria-label', 'Reading view');
      const html = ['<h4>Reading</h4><button type="button" class="oa-reading-view-close" aria-label="Close">Ã—</button><div class="oa-reading-content">'];
      words.forEach(function (w, i) {
        html.push('<span class="oa-word" data-oa-widx="' + i + '">' + escapeHtml(w) + '</span> ');
      });
      html.push('</div>');
      wrap.innerHTML = html.join('');
      wrap.querySelector('.oa-reading-view-close').addEventListener('click', function () { closeReadingView(); stopTTS(); });
      document.body.appendChild(wrap);
      readingViewEl = wrap;
      readingViewWordSpans = wrap.querySelectorAll('.oa-word');
      const u = new SpeechSynthesisUtterance(fullText);
      u.rate = state.ttsRate || 1;
      u.pitch = state.ttsPitch || 1;
      u.lang = state.language || document.documentElement.lang || 'en';
      if (state.ttsVoice && global.speechSynthesis.getVoices) {
        const v = global.speechSynthesis.getVoices().find(function (x) { return x.name === state.ttsVoice; });
        if (v) u.voice = v;
      }
      u.onboundary = function (e) {
        if (e.name !== 'word' || readingViewWordSpans.length === 0) return;
        var idx = Math.min(Math.floor((e.charIndex / fullText.length) * words.length), words.length - 1);
        readingViewWordSpans.forEach(function (s) { s.classList.remove('oa-current'); });
        var span = readingViewEl && readingViewEl.querySelector('[data-oa-widx="' + idx + '"]');
        if (span) { span.classList.add('oa-current'); span.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      };
      u.onend = function () { readingViewWordSpans.forEach(function (s) { s.classList.remove('oa-current'); }); };
      global.speechSynthesis.speak(u);
      ttsUtterance = u;
      emit('tts:start', {});
    }
    function closeReadingView() {
      if (readingViewEl && readingViewEl.parentNode) readingViewEl.remove();
      readingViewEl = null;
      readingViewWordSpans = [];
    }
    function escapeHtml(s) {
      var d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }
  
    function translateSelection() {
      const sel = global.getSelection();
      const text = (sel && sel.toString() || '').trim();
      if (!text) {
        showTooltip(null, 'Select text first, then click Translate selection.');
        return;
      }
      const lang = state.translateTargetLang || 'es';
      requestTranslate(text, lang, function (translated) {
        if (translated) showTooltip(sel.anchorNode, translated);
        else showTooltip(sel.anchorNode, 'Translation unavailable. Set Translate to a language and try again.');
      });
    }
  
    function translatePage() {
      const text = (document.body.innerText || document.body.textContent || '').trim().slice(0, 8000);
      if (!text) return;
      const lang = state.translateTargetLang || 'es';
      if (!lang) {
        showTooltip(null, 'Choose a language under Translate to, then click Translate page.');
        return;
      }
      requestTranslate(text, lang, function (translated) {
        if (!translated) { showTooltip(null, 'Translation failed.'); return; }
        const overlay = document.createElement('div');
        overlay.className = 'oa-translate-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-label', 'Translated page');
        overlay.innerHTML = '<h4>Translated page (' + lang + ')</h4><button type="button" class="oa-reading-view-close" aria-label="Close">Ã—</button><div class="oa-translated-text"></div>';
        overlay.querySelector('.oa-translated-text').textContent = translated;
        overlay.querySelector('.oa-reading-view-close').addEventListener('click', function () { overlay.remove(); });
        document.body.appendChild(overlay);
      });
    }
  
    function requestTranslate(text, targetLang, onDone) {
      if (!apiBase) {
        onDone(null);
        return;
      }
      const url = apiBase.replace(/\?.*$/, '') + '?action=translate';
      const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.slice(0, 5000), target: targetLang }) };
      if (apiKey) opts.headers['X-API-Key'] = apiKey;
      fetch(url, opts).then(function (r) { return r.json(); }).then(function (data) {
        onDone(data && data.translated ? data.translated : null);
      }).catch(function () { onDone(null); });
    }
  
    function applyMoreSpacingPreset() {
      state.letterSpacing = 'wide';
      state.lineHeight = 'relaxed';
      state.wordSpacing = 'wide';
      writeStorage();
      applyToDocument();
      if ($panel) syncPanelFromState();
      syncApiPreferences('save');
    }
  
    function applyHighContrastPreset() {
      state.colorFilter = 'dark';
      state.contrast = 1.3;
      state.highlightFocus = true;
      state.enlargeFocus = true;
      writeStorage();
      applyToDocument();
      if ($panel) syncPanelFromState();
      syncApiPreferences('save');
    }
  
    function showHeadingsOutline() {
      var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (headings.length === 0) {
        showTooltip(null, 'No headings found on this page.');
        return;
      }
      var overlay = document.createElement('div');
      overlay.className = 'oa-translate-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-label', 'Page headings');
      var html = ['<h4>Headings</h4><button type="button" class="oa-reading-view-close" aria-label="Close">Ã—</button><ul class="oa-overlay-list">'];
      headings.forEach(function (h, i) {
        var tag = h.tagName.toLowerCase();
        var text = (h.textContent || '').trim().slice(0, 80);
        var id = h.id || ('oa-h-' + i);
        if (!h.id) h.id = id;
        html.push('<li><a href="#' + id + '" data-oa-close-overlay>' + tag + ': ' + escapeHtml(text) + '</a></li>');
      });
      html.push('</ul>');
      overlay.innerHTML = html.join('');
      overlay.querySelector('.oa-reading-view-close').addEventListener('click', function () { overlay.remove(); });
      overlay.querySelectorAll('[data-oa-close-overlay]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          var id = a.getAttribute('href').slice(1);
          var el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          overlay.remove();
        });
      });
      document.body.appendChild(overlay);
    }
  
    function showImageDescriptions() {
      var imgs = document.querySelectorAll('img');
      var list = [];
      imgs.forEach(function (img, i) {
        var alt = img.getAttribute('alt');
        var src = (img.src || '').slice(-40);
        list.push({ alt: alt === null ? '(no description)' : (alt || '(empty alt)'), src: src });
      });
      if (list.length === 0) {
        showTooltip(null, 'No images found on this page.');
        return;
      }
      var overlay = document.createElement('div');
      overlay.className = 'oa-translate-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-label', 'Image descriptions');
      var html = ['<h4>Image descriptions</h4><button type="button" class="oa-reading-view-close" aria-label="Close">Ã—</button><ul class="oa-overlay-list">'];
      list.forEach(function (item) {
        html.push('<li>' + escapeHtml(item.alt) + ' <span style="font-size:11px;color:#94a3b8;">' + escapeHtml(item.src) + '</span></li>');
      });
      html.push('</ul>');
      overlay.innerHTML = html.join('');
      overlay.querySelector('.oa-reading-view-close').addEventListener('click', function () { overlay.remove(); });
      document.body.appendChild(overlay);
    }
  
    function exportSettings() {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'openaccessible-settings.json';
      a.click();
      URL.revokeObjectURL(a.href);
      showTooltip(null, 'Settings exported.');
    }
  
    function importSettingsFromFile(e) {
      var file = e.target.files[0];
      if (!file) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var data = JSON.parse(r.result);
          if (data && typeof data === 'object') {
            state = { ...defaultState, ...data };
            writeStorage();
            applyToDocument();
            if ($panel) syncPanelFromState();
            syncApiPreferences('save');
            showTooltip(null, 'Settings imported.');
          }
        } catch (_) {
          showTooltip(null, 'Invalid settings file.');
        }
        e.target.value = '';
      };
      r.readAsText(file);
    }
  
    function initLinkUrlOnFocus() {
      document.body.removeEventListener('focusin', onLinkFocusIn);
      if (!state.showLinkUrl) return;
      document.body.addEventListener('focusin', onLinkFocusIn);
    }
    function onLinkFocusIn(e) {
      if (!state.showLinkUrl) return;
      var target = e.target;
      if (target.tagName !== 'A' || !target.href) return;
      var url = target.getAttribute('href') || target.href;
      clearTimeout(window._oaLinkUrlTimer);
      window._oaLinkUrlTimer = setTimeout(function () {
        showTooltip(target, url.length > 80 ? url.slice(0, 77) + '...' : url);
      }, 400);
    }
  
    // --- Dictionary: double-click word -> fetch definition (API or local) -> show word modal with audio ---
    var dictionaryListenerAttached = false;
    function initDictionary() {
      if (dictionaryListenerAttached) return;
      dictionaryListenerAttached = true;
      document.body.addEventListener('dblclick', function (e) {
        if (!state.dictionaryEnabled) return;
        var sel = global.getSelection();
        var text = (sel && sel.toString() || '').trim();
        if (!text || text.length > 80) return;
        e.preventDefault();
        e.stopPropagation();
        var apiUrl = apiBase ? (apiBase.replace(/\?.*$/, '') + '?action=dictionary&word=' + encodeURIComponent(text)) : '';
        if (apiUrl) {
          var opts = { method: 'GET' };
          if (apiKey) opts.headers = { 'X-API-Key': apiKey };
          fetch(apiUrl, opts)
            .then(function (r) { return r.json(); })
            .then(function (d) {
              var def = (d && d.definition) ? d.definition : (getLocalDefinition(text) || 'No definition found.');
              var pron = (d && (d.pronunciation || d.how_to_say)) ? (d.pronunciation || d.how_to_say) : null;
              showWordModal(text, def, pron);
            })
            .catch(function () {
              showWordModal(text, getLocalDefinition(text) || 'Definition not available.', null);
            });
        } else {
          showWordModal(text, getLocalDefinition(text) || 'Double-click a word for definition. Set API for more words.', null);
        }
      });
    }
    // Fallback when no API: built-in dictionary (2000 words)
    var LOCAL_DICT_STR = 'word|definition\naccessibility|Making something usable by people with disabilities.\ncontrast|Difference in brightness between text and background.\ndyslexia|A condition that can make reading and spelling harder.\nread|To look at and understand written text.\ntext|Written or printed words.\nspeech|Spoken language; also a feature that reads text aloud.\nhighlight|To mark something so it stands out.\ncursor|The on-screen pointer you move with the mouse.\nfont|A set of letters and symbols in one style.\nsize|How big or small something is.\npage|A single side of a sheet of paper or a web document.\nlink|A clickable connection to another page or resource.\nbutton|A control you click to perform an action.\nhelp|Support or assistance.\ndictionary|A reference list of words and their meanings.\nthe|Used to refer to something already mentioned.\nand|Connects words or phrases.\nwidget|A small control or application on a screen.\nsettings|Options that control how something works.\ntranslate|To change text from one language to another.\nlanguage|A system of words and grammar used to communicate.\nspeak|To say something using your voice.\nlisten|To pay attention to sound or what someone says.\nopen|Not closed; or to start or reveal something.\nclose|To shut; or near in distance.\nmenu|A list of options to choose from.\noption|One thing you can choose.\nclick|To press a button on a mouse or screen.\nselect|To choose something.\nfocus|To give attention to; or the element that receives input next.\nscreen|The display that shows images and text.\nreader|Someone or something that reads; a screen reader helps people hear content.\ndefinition|A clear and precise explanation of the meaning of a word.\nmore|Additional; a greater amount.\nreset|To set back to the original or default state.\nstop|To end or cause to end.\nvoice|The sound a person makes when speaking; or a TTS voice option.\nrate|Speed; how fast something happens.\npitch|How high or low a sound is.\nfilter|A setting that changes how colors or content appear.\ngrayscale|Shades of gray only; no color.\ninvert|To reverse or turn inside out; e.g. dark becomes light.\nsepia|A brownish tone often used for old-style photos.\ntheme|A set of colors and styles applied to the interface.\ndark|With little or no light; dark mode uses dark backgrounds.\nlight|With brightness; light mode uses light backgrounds.\nzoom|To make content appear larger or smaller.\nlarge|Big; of great size.\nsmall|Little; of limited size.\nnormal|Usual; not changed or special.\nwide|Broad; covering a large distance from side to side.\nspacing|The amount of space between letters or lines.\nletter|A character used in writing; e.g. A or b.\nline|A row of text; or a straight mark.\nrelaxed|At ease; here, more space between lines for easier reading.\nloose|Not tight; here, even more space between lines.\nheading|A title or label for a section of content.\nunderline|A line drawn under text for emphasis.\nmotion|Movement; animation.\nreduce|To make less or smaller.\nguide|Something that shows the way; the reading guide highlights a band of text.\ntoolbar|A strip of buttons or controls on screen.\nposition|Where something is placed; e.g. top or bottom of the screen.\nexport|To save or download data to a file.\nimport|To load or bring in data from a file.\nkeyboard|The set of keys used to type; keyboard shortcut is a key combination.\nshortcut|A quick way to do something, e.g. a key combination.\npreset|A saved set of options applied with one action.\nnavigation|Moving through content; e.g. headings or links.\nimage|A picture or graphic.\ndescription|Words that explain what something is or shows.\nalt|Short for alternative; alt text describes an image for screen readers.\nform|A set of fields where you enter information.\nfield|A place to type or select one piece of information.\nlabel|Text that names or describes a control or field.\ncontent|The text and media that make up a page.\nwidth|How wide something is from side to side.\nnarrow|Not wide; limited width for easier reading.\nfull|Complete; using the whole space.\nlayout|The way things are arranged on a page.\nvisibility|Whether and how well something can be seen.\ntransparency|How see-through something is; reduce transparency means more solid colors.\nindicator|Something that shows a state; e.g. focus indicator shows what is selected.\nbraille|A system of raised dots read by touch; used by some people who are blind.\nskip|To pass over; skip link jumps to main content.\nmain|Most important; main content is the primary part of the page.\ndemo|A short example or demonstration.\nfeature|A function or capability of a product.\nembed|To place something inside a page; e.g. embed the widget.\npreference|A setting or choice you save.\nsave|To store for later use.\nload|To bring in or restore saved data.\ndefault|The starting or usual value when nothing is changed.\ncustom|Made to suit you; customized.\ncolor|The hue or shade of something; e.g. red or blue.\nblind|Unable to see; some users rely on screen readers or Braille.\ndeuteranopia|A type of color blindness affecting green vision.\nprotanopia|A type of color blindness affecting red vision.\ntritanopia|A type of color blindness affecting blue vision.\ngreeting|A word or phrase used when meeting or addressing someone.\nhello|A greeting or way to say hi.\nworld|The earth and all people and things on it.\nexample|Something that shows how something works.\nsection|A part or division of a page or document.\nlist|A series of items shown one after another.\nitem|One thing in a group or list.\nnext|The one that comes after.\nprevious|The one that came before.\nfirst|Coming before all others.\nlast|Coming after all others.\nstart|To begin.\nbegin|To start.\nend|To finish; or the final part.\nfinish|To complete or end.\ncontinue|To keep going.\ncancel|To stop and not complete an action.\nconfirm|To agree or say yes to something.\nsubmit|To send a form or request.\nsend|To cause something to go to another place or person.\nreceive|To get something that was sent.\nerror|Something that went wrong; an error message explains the problem.\nsuccess|When something worked as intended.\nwarning|A message that something might be wrong or risky.\nnotice|A message or piece of information for the user.\nmessage|Words sent or shown to communicate something.\ntitle|The name of a page or document.\nname|What something or someone is called.\nsearch|To look for something by typing or choosing terms.\nfind|To discover or locate something.\nshow|To make something visible.\nhide|To make something not visible.\nenable|To turn on or allow.\ndisable|To turn off or prevent.\non|Active; enabled.\noff|Not active; disabled.\ncheck|To mark as selected; or to verify.\nuncheck|To remove a check; to deselect.\ntoggle|To switch between two states; e.g. on and off.\nincrease|To make larger or more.\ndecrease|To make smaller or less.\nadjust|To change slightly to improve.\nslider|A control you drag to set a value, e.g. volume or size.\ndropdown|A list that appears when you click; you pick one option.\ncheckbox|A control you check or uncheck for yes or no.\nradio|A control where you pick one option from several.\ninput|A place where you type or enter data.\noutput|What is produced or shown as a result.\nresult|What you get from an action or search.\ninformation|Facts or details about something.\ndetail|A small part of the whole; more specific information.\nsimple|Easy to understand or use.\ncomplex|Having many parts; not simple.\nclear|Easy to understand; or to remove.\nsupport|Help or assistance; or to hold up.\nassist|To help.\nease|Lack of difficulty; to make easier.\neasy|Not hard to do or understand.\nhard|Difficult; or firm to the touch.\ndifficult|Not easy.\nunderstand|To grasp the meaning of something.\nmeaning|What something is intended to express.\nintend|To mean or plan to do.\nexplain|To make clear with words.\ndescribe|To say what something is like.\nabout|Concerning; on the subject of.\nabove|Higher than; over.\nbelow|Lower than; under.\nafter|Following in time or order.\nbefore|Earlier than; in front of.\nagain|One more time; once more.\nalways|At all times; every time.\nnever|Not ever; at no time.\noften|Many times; frequently.\nsometimes|From time to time; not always.\nusually|Normally; in most cases.\nhere|In this place.\nthere|In that place.\nwhere|At or in what place.\nwhen|At what time.\nwhy|For what reason.\nhow|In what way; by what means.\nwhat|Which thing or things.\nwhich|Used to ask about one or more from a set.\nwho|What or which person.\nwhom|The person that; used as object.\nwhose|Belonging to which person.\nother|Different from the one mentioned.\nanother|One more; a different one.\neach|Every one of two or more, considered separately.\nevery|All of a group; each one.\nall|The whole amount or number.\nsome|An unspecified amount or number.\nmany|A large number of.\nfew|A small number of.\nmost|The greatest amount or number.\nleast|The smallest amount or number.\nnumber|A count or quantity; e.g. 1 or 2.\namount|How much there is of something.\nway|A method or direction; how something is done.\nplace|A location or position.\ntime|Seconds, minutes, hours; or an occasion.\nday|A period of 24 hours.\nweek|A period of seven days.\nmonth|A period of about 30 days.\nyear|A period of 12 months.\ntoday|This present day.\ntomorrow|The day after today.\nyesterday|The day before today.\nnow|At the present time.\nthen|At that time; next.\nsoon|In a short time.\nlater|After the present time.\nearly|Before the usual or expected time.\nlate|After the usual or expected time.\nquick|Fast; done in a short time.\nslow|Not fast; taking a long time.\nfast|Moving or happening quickly.\nnew|Recently made or begun; not old.\nold|Having existed for a long time.\ngood|Of high quality; satisfactory.\nbad|Of poor quality; not good.\nbetter|Of higher quality; improved.\nbest|Of the highest quality.\ngreat|Very good; large in size or importance.\nhigh|Far above the ground or average.\nlow|Near the ground or below average.\nright|Correct; or the opposite of left.\nleft|The side opposite right; or past tense of leave.\nwrong|Not correct; mistaken.\ntrue|In accordance with fact; real.\nfalse|Not true; incorrect.\nyes|Used to agree or confirm.\nno|Used to refuse or deny.\nplease|Used to make a request polite.\nthanks|An expression of gratitude.\nthank|To express gratitude.\nwelcome|Received with pleasure; or you\'re welcome as a response to thanks.\nsorry|Used to apologize or express regret.\nback|The rear; or to return.\nforward|Toward the front; or to send on.\nup|Toward a higher position.\ndown|Toward a lower position.\nin|Inside; within.\nout|Outside; not in.\nover|Above; covering.\nunder|Below; beneath.\nthrough|From one end to the other; by means of.\nbetween|In the space that separates two things.\namong|In the middle of; surrounded by.\nwith|In the company of; using.\nwithout|Not having; lacking.\nfrom|Starting at; originating in.\ninto|To the inside of.\nonto|On top of; to the surface of.\nduring|Throughout the course of.\nuntil|Up to the time that.\nwhile|During the time that.\nbecause|For the reason that.\nalthough|Even though; in spite of.\nhowever|Nevertheless; but.\ntherefore|For that reason; so.\nalso|In addition; too.\ntoo|As well; more than enough.\nonly|Just; no more than.\njust|Exactly; only; very recently.\neven|Equal; or used for emphasis.\nstill|Up to now; not moving.\nalready|Before now; by this time.\nyet|Up until now; still.\nonce|One time; formerly.\ntwice|Two times.\neverywhere|In every place.\nnowhere|In no place.\nsomething|An unspecified thing.\nanything|Any thing at all.\nnothing|Not anything.\neverything|All things.\nsomeone|An unspecified person.\nanyone|Any person.\nnoone|No person; nobody.\neveryone|Every person; everybody.\nthing|An object, idea, or event.\nperson|A human being.\npeople|Human beings; persons.\npart|A piece or section of a whole.\nkind|Type; sort.\nsort|Type; kind.\ntype|A category or class.\ngroup|A set of people or things together.\nset|A collection of things that belong together.\npiece|A part of something.\nbit|A small piece or amount.\nlot|A large amount or number.\nwhole|All of something; complete.\nhalf|One of two equal parts.\nthird|One of three equal parts.\nquarter|One of four equal parts.\npercent|Out of one hundred; e.g. 50 percent is half.\npoint|A dot; or a single idea or fact.\nstep|One of a series of actions; or a stage in a process.\nlevel|A position or stage; or how flat something is.\norder|Sequence; or a request for goods.\nchange|To make or become different.\ndifferent|Not the same; other.\nsame|Identical; not different.\nsimilar|Alike; almost the same.\nown|Belonging to oneself.\nturn|To rotate; or one\'s chance to do something.\ntry|To attempt; to make an effort.\nattempt|To try to do something.\nneed|To require; something necessary.\nwant|To wish for; to desire.\nlike|To enjoy; similar to.\nlove|To feel strong affection for.\nknow|To have information or understanding.\nthink|To use the mind; to believe.\nbelieve|To accept as true.\nfeel|To experience an emotion or sensation.\nremember|To keep in mind; to recall.\nforget|To fail to remember.\nlearn|To gain knowledge or skill.\nteach|To help someone learn.\nwork|To do a job; or a task or job.\nplay|To have fun; or a drama or game.\ngo|To move or travel.\ncome|To move toward here.\nleave|To go away from.\narrive|To reach a place.\nreturn|To come or go back.\nenter|To go or come in.\nexit|To go out; or a way out.\nadd|To put with something else; to combine.\nremove|To take away.\ndelete|To remove or erase.\ncopy|To duplicate; a duplicate.\npaste|To insert copied content.\ncut|To divide or remove with a sharp edge.\nundo|To reverse the last action.\nredo|To do again what was undone.\nrefresh|To load again; to update the page.\nreload|To load the page again.\ndownload|To copy from the internet to your device.\nupload|To send from your device to the internet.\ninstall|To set up software for use.\nupdate|To make current; to improve with new data.\nversion|A particular form or release of something.\ncurrent|Present; up to date.\nlatest|Most recent.\nolder|More old; previous version.\nnewer|More new; more recent.\ncreate|To make or bring something into existence.\nedit|To change or correct text or content.\nview|To look at or see; or a way of displaying something.\nshare|To let others see or use something.\nprint|To produce a paper copy; or to output.\nfolder|A place to store files or other items.\nfile|A document or set of data with a name.\ndocument|A piece of writing or a file with content.\nbrowser|A program used to view web pages.\nwebsite|A set of pages on the internet.\ninternet|A global network that connects computers.\nemail|Messages sent electronically.\npassword|A secret code used to sign in.\naccount|A record that lets you use a service.\nsignin|To enter your account.\nsignout|To leave your account.\nprofile|Information about a user.\nnotification|A message that alerts you.\nalert|A warning or notice.\npopup|A window that appears on top.\ntab|A separate page in a browser.\nscroll|To move content up or down.\nexpand|To make larger or show more.\ncollapse|To hide or make smaller.\nattach|To add a file to a message.\nreply|To respond to a message.\ninbox|Where received messages appear.\ntrash|Where deleted items go.\ndirectory|A container for files or folders.\npermission|Right to do or see something.\nprivacy|Keeping your information safe.\nsecurity|Protection from harm or unauthorized access.\nbackup|A copy kept for safety.\nrestore|To bring back from a backup.\nsync|To keep data the same across devices.\ndevice|A computer, phone, or other machine.\napp|A program or application.\nicon|A small picture that represents something.\ndesktop|The main screen on a computer.\nwindow|A separate area on the screen.\nminimize|To shrink a window to the taskbar.\nmaximize|To make a window full size.\npointer|The on-screen arrow you move.\nscrollbar|A bar you drag to scroll.\ntooltip|A short hint that appears on hover.\nhover|To hold the pointer over something.\ndrag|To move something by clicking and moving.\ndrop|To release after dragging.\ndouble-click|To press the mouse button twice quickly.\nright-click|To press the right mouse button.\nkey|A button on the keyboard.\nspacebar|The long key that types a space.\nshift|A key used for capital letters.\ncontrol|A key used with others for shortcuts.\nescape|A key that cancels or closes.\narrow|A key that moves the cursor.\nhome|The key that goes to the start.\nbold|Dark, thick text for emphasis.\nitalic|Slanted text for emphasis.\nstrikethrough|A line through text.\nbullet|A dot or symbol before a list item.\nnumbered|Having numbers in order.\nindent|To move text inward.\nalign|To line up text.\nparagraph|A block of text.\nsentence|A complete thought in words.\nability|The power or skill to do something.\nable|Having the power or skill to do something.\naccept|To agree to take or receive.\nachieve|To reach a goal or succeed.\naction|Something done; a deed.\nactive|Doing something; in use.\nactivity|Something you do; movement.\nactual|Real; existing in fact.\naddress|A location or place; or to speak to.\nadult|A grown-up person.\nadvance|To move forward; progress.\nadvantage|A benefit or gain.\nadvice|Suggestions about what to do.\naffect|To have an effect on.\nafford|To have enough money or time.\nafraid|Feeling fear.\nafternoon|The time between noon and evening.\nagainst|In opposition to.\nage|How old someone or something is.\nagency|An organization that does something.\nagent|A person or thing that acts.\nago|In the past.\nagree|To have the same opinion.\nagreement|When people agree.\nahead|In front; forward.\naim|A goal; or to point at.\nair|The gas we breathe.\nalbum|A collection of songs or photos.\nallow|To let someone do something.\nalmost|Nearly; not quite.\nalone|Without others.\nalong|From one end to the other.\namazing|Very surprising or good.\nanalysis|A careful study of something.\nanalyze|To study something carefully.\nanimal|A living thing that can move.\nannounce|To say something publicly.\nannual|Once a year.\nanswer|A reply; or to reply.\nanxious|Worried or nervous.\nany|One or some.\nanybody|Any person.\nanyway|In any case.\nanywhere|In any place.\napart|Separate; away from.\napartment|A set of rooms to live in.\napparent|Easy to see; clear.\nappear|To be seen; to show up.\nappearance|The way something looks.\napplication|A form or program.\napply|To put on or request.\nappointment|A set time to meet.\nappreciate|To be grateful for.\napproach|To come near; or a way of doing.\nappropriate|Right for the situation.\napprove|To agree to; to allow.\narea|A region or space.\nargue|To disagree with reasons.\nargument|A reason or disagreement.\narise|To happen; to get up.\narm|The body part from shoulder to hand.\naround|On all sides; about.\narrange|To put in order.\narrangement|The way things are ordered.\narrival|The act of arriving.\nart|Paintings, music, or creative work.\narticle|A piece of writing.\nartist|A person who makes art.\nartistic|Related to art; creative.\nas|In the role of; when.\nask|To put a question.\naspect|One part or side of something.\nassess|To judge or evaluate.\nassessment|A judgment or evaluation.\nasset|Something of value.\nassign|To give a task or role.\nassignment|A task given to someone.\nassistance|Help; support.\nassistant|A person who helps.\nassociate|To connect; or a partner.\nassociation|A group or connection.\nassume|To suppose; to take on.\nassumption|Something assumed.\nassure|To make sure; to promise.\nat|In a place or time.\natmosphere|The air or mood.\nattack|To try to harm; or an act of harm.\nattend|To be present at.\nattention|Focus; notice.\nattitude|A way of thinking or feeling.\nattract|To draw toward.\nattractive|Pleasing to look at.\naudience|People who watch or listen.\nauthor|A person who writes.\nauthority|Power or right to decide.\nautomatic|Working by itself.\navailable|Ready to use or get.\naverage|The usual amount; ordinary.\navoid|To keep away from.\naward|A prize; or to give a prize.\naware|Knowing about.\nawareness|Knowledge of something.\naway|Not here; at a distance.\nbaby|A very young child.\nbackground|The area behind; past experience.\nbag|A container to carry things.\nbalance|To keep steady; or equality.\nball|A round object used in games.\nband|A group of musicians.\nbank|A place to keep money.\nbar|A long piece; or a place that serves drinks.\nbase|The bottom or starting point.\nbasic|Simple; fundamental.\nbasis|The foundation or reason.\nbattle|A fight or struggle.\nbe|To exist; to have a quality.\nbear|To carry; to tolerate.\nbeat|To hit again and again; to defeat.\nbeautiful|Very pleasing to see.\nbeauty|The quality of being beautiful.\nbecome|To grow to be.\nbed|A place to sleep.\nbedroom|A room for sleeping.\nbeer|An alcoholic drink.\nbeginning|The start.\nbehavior|The way someone acts.\nbehind|At the back of.\nbeing|A living thing; existence.\nbelief|Something believed.\nbell|Something that rings.\nbelong|To be part of.\nbelt|A strip worn around the waist.\nbench|A long seat.\nbend|To curve or fold.\nbeneath|Under.\nbenefit|An advantage; or to gain.\nbeside|Next to.\nbesides|In addition to.\nbet|To risk money on a result.\nbeyond|On the other side of.\nbid|To offer a price.\nbig|Large in size.\nbill|Money owed; or a proposed law.\nbird|An animal with feathers that flies.\nbirth|When a baby is born.\nbirthday|The day someone was born.\nbite|To cut with teeth.\nblack|The color of coal.\nblame|To say someone is responsible.\nblank|Empty; with nothing written.\nblock|To stop; or a solid piece.\nblood|The red liquid in the body.\nblow|To move air.\nblue|The color of the sky.\nboard|A flat piece of wood; a group.\nboat|A vehicle that floats on water.\nbody|The physical form of a person.\nbone|The hard part inside the body.\nbook|Written pages bound together.\nborder|The edge or boundary.\nboring|Not interesting.\nborn|Brought into life.\nborrow|To take with permission to return.\nboss|The person in charge.\nboth|The two together.\nbother|To trouble or annoy.\nbottle|A container with a narrow neck.\nbottom|The lowest part.\nboundary|A line that divides.\nbowl|A round dish.\nbox|A container with sides.\nboy|A male child.\nbrain|The organ that thinks.\nbranch|A part of a tree; a division.\nbrand|A name for a product.\nbread|Food made from flour.\nbreak|To separate into pieces.\nbreakfast|The first meal of the day.\nbreast|The chest area.\nbreath|Air taken in and out.\nbreathe|To take air in and out.\nbridge|A structure over water or a gap.\nbrief|Short in time.\nbright|Giving much light.\nbrilliant|Very bright or clever.\nbring|To carry here.\nbroad|Wide.\nbroadcast|To send by radio or TV.\nbrother|A male sibling.\nbrown|A dark color like earth.\nbrush|To clean or paint with a tool.\nbudget|A plan for spending money.\nbuild|To make by putting parts together.\nbuilder|A person who builds.\nbuilding|A structure with walls and roof.\nburn|To be on fire.\nbus|A large vehicle for many passengers.\nbusiness|Buying and selling; a company.\nbusy|Having much to do.\nbut|However; except.\nbutter|A yellow spread from cream.\nbuy|To get by paying.\nbuyer|A person who buys.\nby|Near; through the action of.\ncabinet|A piece of furniture with doors.\ncake|A sweet baked food.\ncall|To speak to; to name.\ncalm|Peaceful; not excited.\ncamera|A device that takes photos.\ncamp|To stay in a tent.\ncampaign|A planned series of actions.\ncan|To be able to.\ncancer|A serious disease.\ncandidate|A person who might be chosen.\ncap|A hat; or a lid.\ncapability|The ability to do something.\ncapable|Able to do something.\ncapacity|The amount something can hold.\ncapital|A city that is the seat of government.\ncapture|To catch or record.\ncar|A vehicle with wheels.\ncard|A piece of stiff paper.\ncare|Attention; or to look after.\ncareer|A job or profession over time.\ncareful|Taking care.\ncarefully|In a careful way.\ncarry|To take from one place to another.\ncase|An instance; a container.\ncash|Money in coins or notes.\ncast|To throw; actors in a show.\ncat|A small furry animal.\ncatch|To grab; to get.\ncategory|A class or group.\ncause|To make happen; a reason.\ncell|A small room; a unit of life.\ncenter|The middle.\ncentral|In or of the center.\ncentury|A period of 100 years.\nceremony|A formal event.\ncertain|Sure; particular.\ncertainly|Without doubt.\nchain|A series of connected links.\nchair|A seat with a back.\nchairman|The person in charge of a meeting.\nchallenge|Something difficult; or to dare.\nchampion|A winner.\nchance|Luck; an opportunity.\nchannel|A TV station; a path.\nchapter|A section of a book.\ncharacter|A letter; a person in a story.\ncharge|To ask for payment; to accuse.\ncharity|Help for those in need.\nchart|A graph or map.\ncheese|A food made from milk.\nchemical|A substance used in chemistry.\nchest|The front of the body.\nchief|Most important; leader.\nchild|A young person.\nchoice|The act of choosing.\nchoose|To pick.\nchurch|A building for worship.\ncircle|A round shape.\ncircumstance|A condition or fact.\ncitizen|A person who belongs to a country.\ncity|A large town.\ncivil|Relating to citizens.\nclaim|To say something is true.\nclass|A group; a lesson.\nclassic|Of the highest quality.\nclassroom|A room for teaching.\nclean|Not dirty.\nclearly|In a clear way.\nclient|A customer.\nclimate|The weather over time.\nclimb|To go up.\nclock|A device that shows time.\nclosed|Shut; not open.\nclothes|Things worn on the body.\ncloud|White or gray mass in the sky.\nclub|A group or organization.\ncoach|A person who trains others.\ncoal|Black fuel from the ground.\ncode|A system of rules or symbols.\ncoffee|A drink made from beans.\ncold|Low in temperature.\ncolleague|A person you work with.\ncollect|To gather together.\ncollection|A group of things gathered.\ncollege|A place of higher learning.\ncolumn|A vertical section.\ncombination|A mix of things.\ncombine|To mix together.\ncomedy|Something funny.\ncomfort|Ease; or to ease.\ncomfortable|At ease.\ncommand|An order; or to order.\ncomment|A remark; or to remark.\ncommercial|Related to business.\ncommission|A group or a fee.\ncommit|To do; to promise.\ncommitment|A promise or dedication.\ncommittee|A group that decides.\ncommon|Shared; usual.\ncommunicate|To share information.\ncommunication|Sharing information.\ncommunity|A group of people in an area.\ncompany|A business.\ncompare|To look at similarities.\ncomparison|Looking at similarities.\ncompete|To try to win.\ncompetition|A contest.\ncompetitive|Wanting to win.\ncomplaint|An expression of unhappiness.\ncomplete|To finish; whole.\ncompletely|Fully.\ncomplexity|The state of being complex.\ncomplicate|To make difficult.\nconcentrate|To focus.\nconcentration|Focus.\nconcept|An idea.\nconcern|Worry; or to worry.\nconcerned|Worried.\nconclude|To end; to decide.\nconclusion|The end; a decision.\ncondition|A state; a requirement.\nconduct|To carry out; behavior.\nconference|A meeting.\nconfidence|Trust in oneself.\nconfident|Sure of oneself.\nconflict|A disagreement or fight.\nconfuse|To make unclear.\nconfused|Unable to think clearly.\nconfusion|Lack of clarity.\ncongress|A formal meeting; a law-making body.\nconnect|To join.\nconnection|A link.\nconsequence|A result.\nconservative|Resistant to change.\nconsider|To think about.\nconsiderable|Large; important.\nconsideration|Thought; care.\nconsist|To be made of.\nconstant|Always the same.\nconstruct|To build.\nconstruction|Building.\nconsult|To ask for advice.\nconsultant|A person who gives advice.\nconsume|To use up; to eat.\nconsumer|A person who buys.\ncontact|To get in touch.\ncontain|To hold inside.\ncontest|A competition.\ncontext|The situation around something.\ncontinuous|Without stopping.\ncontract|A written agreement.\ncontribute|To give or add.\ncontribution|Something given.\nconvenient|Easy to use or reach.\nconvention|A large meeting; a custom.\nconversation|A talk between people.\nconvert|To change into.\nconvince|To make believe.\ncook|To prepare food.\ncookie|A small sweet baked good.\ncooking|Preparing food.\ncool|A bit cold; good.\ncore|The center.\ncorner|Where two edges meet.\ncorporate|Related to a company.\ncorrect|Right; true.\ncost|The price; or to have a price.\ncould|Past of can.\ncouncil|A group that decides.\ncount|To add up; a nobleman.\ncountry|A nation.\ncounty|A division of a state.\ncouple|Two; a pair.\ncourse|A path; a class.\ncourt|Where trials happen.\ncover|To put over; a lid.\ncraft|Skill; or to make by hand.\ncrash|To hit and break.\ncrazy|Mad; very enthusiastic.\ncreation|Something created.\ncreative|Good at creating.\ncredit|Trust; or money lent.\ncrime|An illegal act.\ncriminal|Related to crime.\ncrisis|A dangerous situation.\ncriterion|A standard for judging.\ncritical|Very important; fault-finding.\ncriticism|Judgment or comment.\ncriticize|To find fault.\ncross|To go across.\ncrowd|A large group of people.\ncrucial|Very important.\ncry|To shed tears.\nculture|The arts and customs of a group.\ncup|A small container for drinks.\ncurious|Wanting to know.\ncurrency|Money in use.\ncurve|A bent line.\ncustomer|A person who buys.\ncycle|A repeated series.\ndad|Father.\ndaily|Every day.\ndamage|Harm; or to harm.\ndance|To move to music.\ndanger|Risk of harm.\ndangerous|Risky.\ndare|To be brave enough.\ndata|Facts or information.\ndate|A day; or to go out with.\ndaughter|A female child.\ndead|Not alive.\ndeal|An agreement; or to handle.\ndealer|A person who sells.\ndear|Loved; expensive.\ndeath|The end of life.\ndebate|A formal argument.\ndebt|Money owed.\ndecade|Ten years.\ndecide|To make a choice.\ndecision|A choice made.\ndeclare|To say formally.\ndecline|To refuse; to decrease.\ndeep|Far down.\ndeeply|Very much.\ndefeat|To beat.\ndefend|To protect.\ndefense|Protection.\ndefine|To state the meaning.\ndefinitely|Certainly.\ndegree|A level; a title from a university.\ndelay|To put off.\ndeliver|To bring to.\ndelivery|The act of delivering.\ndemand|To ask strongly.\ndemocracy|Rule by the people.\ndemocratic|Favoring democracy.\ndemonstrate|To show.\ndemonstration|A show or protest.\ndeny|To say no.\ndepartment|A division of an organization.\ndepend|To rely on.\ndependent|Relying on.\ndeposit|To put in; money put in.\ndepression|Sadness; economic slump.\ndepth|How deep.\ndesert|Dry land.\ndeserve|To be worthy of.\ndesign|To plan; a plan.\ndesigner|A person who designs.\ndesire|To want; a want.\ndesk|A table for work.\ndespite|In spite of.\ndestroy|To ruin.\ndestruction|Ruin.\ndetailed|With many details.\ndetermine|To decide.\ndetermined|Having decided.\ndevelop|To grow or create.\ndevelopment|Growth; new product.\ndevote|To give fully.\ndialog|A conversation.\ndie|To stop living.\ndiet|What one eats.\ndiffer|To be different.\ndifference|What is not the same.\ndifficulty|Trouble.\ndig|To break up ground.\ndigital|Using numbers; electronic.\ndimension|Size or aspect.\ndinner|The main evening meal.\ndirect|Straight; or to guide.\ndirection|The way to go.\ndirectly|In a direct way.\ndirector|A person who directs.\ndirty|Not clean.\ndisagree|To not agree.\ndisappear|To vanish.\ndisaster|A great misfortune.\ndiscipline|Training; punishment.\ndiscount|A reduction in price.\ndiscover|To find.\ndiscovery|Something found.\ndiscuss|To talk about.\ndiscussion|A talk about something.\ndisease|An illness.\ndish|A plate; a type of food.\ndismiss|To send away.\ndisorder|Lack of order.\ndisplay|To show.\ndistance|How far.\ndistant|Far away.\ndistinct|Clearly different.\ndistinction|A difference.\ndistinguish|To tell apart.\ndistribute|To give out.\ndistribution|Giving out.\ndistrict|An area.\ndivide|To split.\ndivision|A part; splitting.\ndivorce|End of a marriage.\ndo|To perform.\ndoctor|A medical professional.\ndog|A domestic animal.\ndollar|A unit of money.\ndomain|An area of control.\ndomestic|Of the home; within a country.\ndominant|Most important.\ndominate|To control.\ndoor|An opening in a wall.\ndouble|Twice as much.\ndoubt|Uncertainty.\ndraft|A first version.\ndrama|A play; excitement.\ndramatic|Like drama; sudden.\ndraw|To make a picture.\ndream|Thoughts while sleeping.\ndress|Clothing; or to put on clothes.\ndrink|To swallow liquid.\ndrive|To operate a vehicle.\ndriver|A person who drives.\ndrug|A medicine or illegal substance.\ndry|Not wet.\ndue|Owed; expected.\ndust|Fine dirt.\nduty|Something one must do.\neconomic|Related to money and trade.\neconomy|The system of money and trade.\nedge|The border or line where something ends.\neducation|Learning and teaching.\neffect|A result or impact.\neffective|Working well.\nefficiency|Doing something without waste.\nefficient|Using time and resources well.\neffort|Hard work or attempt.\negg|An oval object laid by birds.\nelection|A vote to choose a leader.\nelectric|Using electricity.\nelement|A basic part.\neliminate|To remove completely.\nelse|Other; different.\nembarrass|To make someone feel ashamed.\nemerge|To come out or appear.\nemergency|A sudden serious situation.\nemotion|A strong feeling.\nemphasis|Special importance.\nemploy|To give work to.\nemployee|A person who works for someone.\nemployer|A person who hires others.\nemployment|Having a job.\nempty|Containing nothing.\nencounter|To meet; or a meeting.\nencourage|To give hope or support.\nenergy|Power; vitality.\nengage|To take part; to hire.\nengine|A machine that provides power.\nengineer|A person who designs or builds.\nenhance|To improve.\nenjoy|To take pleasure in.\nenormous|Very large.\nenough|As much as needed.\nensure|To make sure.\nenterprise|A business or project.\nentertainment|Things that amuse.\nentire|Whole; complete.\nentitle|To give the right to.\nentry|A way in; something written.\nenvironment|Surroundings; the natural world.\nequal|The same in amount or value.\nequipment|Tools and machines.\nespecially|More than usual.\nessential|Very important; necessary.\nestablish|To set up.\nestate|Property; land.\nestimate|To guess; a rough calculation.\nevening|The time before night.\nevent|Something that happens.\neventually|In the end.\never|At any time.\neverybody|Every person.\nevidence|Proof or signs.\nevil|Very bad.\nexact|Precise.\nexactly|Precisely.\nexamination|A test or inspection.\nexamine|To look at closely.\nexcellent|Very good.\nexcept|Not including.\nexception|Something that does not follow the rule.\nexchange|To swap.\nexcite|To make eager.\nexcitement|Feeling of eagerness.\nexclude|To leave out.\nexcuse|A reason given.\nexecute|To carry out.\nexercise|Physical activity; or to do it.\nexpansion|Growth.\nexpect|To think something will happen.\nexpectation|What you expect.\nexpense|Cost; money spent.\nexpensive|Costing a lot.\nexperience|Knowledge from doing; or to have it.\nexperiment|A test to discover.\nexpert|A person with great skill.\nexplanation|Words that explain.\nexplore|To travel to discover.\nexpress|To show or say.\nexpression|A word or phrase; a look.\nextend|To make longer.\nextension|An addition.\nextent|How far; degree.\nexternal|On the outside.\nextra|More than usual.\nextract|To take out.\nextraordinary|Very unusual.\nextreme|Very great.\neye|The organ of sight.\nface|The front of the head.\nfact|Something that is true.\nfactor|Something that has an effect.\nfail|To not succeed.\nfailure|Lack of success.\nfair|Just; light in color.\nfaith|Trust; belief.\nfall|To drop down.\nfamiliar|Known.\nfamily|Parents and children.\nfamous|Known by many.\nfan|Someone who admires; a device for air.\nfarm|Land for growing crops.\nfarmer|A person who farms.\nfashion|Style of clothing.\nfat|Having too much flesh; or grease.\nfather|A male parent.\nfault|Responsibility for a mistake.\nfavor|Kindness; or to prefer.\nfavorite|Most liked.\nfear|To be afraid of.\nfee|Payment for a service.\nfeed|To give food to.\nfeedback|Comments about something.\nfeeling|An emotion.\nfemale|Of the female sex.\nfight|To struggle against.\nfigure|A number; a shape.\nfill|To make full.\nfilm|A movie.\nfinal|Last.\nfinally|At last.\nfinance|Money matters.\nfinancial|Related to money.\nfinding|Something discovered.\nfinger|One of five on the hand.\nfire|Burning; or to dismiss.\nfirm|Solid; a company.\nfish|An animal that lives in water.\nfit|Suitable; or to be the right size.\nfix|To repair.\nflat|Smooth and level.\nflexible|Able to bend.\nflight|A trip by plane.\nfloat|To stay on the surface.\nfloor|The ground; a level of a building.\nflow|To move smoothly.\nflower|A plant\'s bloom.\nfold|To bend over.\nfollow|To come after.\nfollowing|Next.\nfood|What you eat.\nfoot|The end of the leg.\nforce|Strength; or to make do.\nforeign|From another country.\nforest|A large area of trees.\nforever|For all time.\nformal|Official; proper.\nformer|Earlier.\nformula|A set method.\nforth|Forward.\nfortune|Luck; wealth.\nfound|To start; past of find.\nfoundation|The base.\nframe|A border or structure.\nfree|Not costing money; not confined.\nfreedom|The state of being free.\nfreeze|To turn to ice.\nfrequency|How often.\nfrequent|Happening often.\nfresh|New; not stale.\nfriend|A person you like.\nfriendly|Kind and welcoming.\nfriendship|Being friends.\nfront|The forward part.\nfruit|Food from plants.\nfuel|What makes engines run.\nfully|Completely.\nfunction|To work; a purpose.\nfund|Money set aside.\nfundamental|Basic.\nfunny|Causing laughter.\nfurniture|Tables\nfuture|Time to come.\ngain|To get.\ngame|An activity with rules.\ngap|A space or break.\ngarage|A place for cars.\ngarden|A place to grow plants.\ngas|A substance like air.\ngate|A barrier that opens.\ngather|To collect.\ngeneral|Overall; not specific.\ngenerally|Usually.\ngenerate|To produce.\ngeneration|People born around the same time.\ngenerous|Give freely.\ngentle|Soft; kind.\ngenuine|Real.\ngesture|A movement that expresses something.\nget|To obtain.\ngirl|A female child.\ngive|To hand over.\nglad|Happy.\nglass|A hard transparent material.\nglobal|Worldwide.\ngoal|An aim.\ngold|A yellow precious metal.\ngovernment|The ruling body.\ngrade|A level; a score.\ngrand|Imposing.\ngrant|To give; money given.\ngrass|Green plants on the ground.\ngreen|The color of grass.\nground|The surface of the earth.\ngrow|To get bigger.\ngrowth|The process of growing.\nguarantee|To promise.\nguard|To protect.\nguess|To estimate.\nguest|A person who is invited.\nguilty|Responsible for a wrong.\nhabit|Something you do often.\nhair|What grows on the head.\nhall|A corridor; a large room.\nhand|The part at the end of the arm.\nhandle|To deal with; a part to hold.\nhang|To attach from above.\nhappen|To occur.\nhappy|Pleased.\nhardly|Almost not.\nharm|To hurt.\nhead|The top of the body.\nhealth|Condition of the body.\nhealthy|In good health.\nhear|To perceive sound.\nheart|The organ that pumps blood.\nheat|Hotness.\nheavy|Weighing a lot.\nheight|How tall.\nhence|For this reason.\nhighly|Very.\nhill|A raised area of land.\nhire|To employ.\nhistory|Past events.\nhit|To strike.\nhold|To grasp.\nhole|An opening.\nholiday|A day off.\nhonest|Telling the truth.\nhope|To want and expect.\nhorizon|Where the sky meets the land.\nhospital|A place for medical care.\nhost|A person who receives guests.\nhot|Having high temperature.\nhotel|A place to stay when traveling.\nhour|60 minutes.\nhouse|A building to live in.\nhuge|Very large.\nhuman|A person.\nhundred|The number 100.\nhungry|Wanting food.\nhunt|To search for.\nhurry|To move quickly.\nhurt|To cause pain.\nhusband|A married man.\nidea|A thought.\nideal|Perfect.\nidentify|To recognize.\nidentity|Who you are.\nignore|To not pay attention to.\nill|Sick.\nillness|A disease.\nillustrate|To explain with pictures.\nimagine|To form a mental picture.\nimpact|An effect.\nimplement|To put into action.\nimplementation|Putting into action.\nimply|To suggest.\nimportance|Being important.\nimportant|Mattering a lot.\nimpose|To force.\nimpossible|Not possible.\nimpress|To make a strong effect.\nimpression|An effect or idea.\nimprove|To make better.\nimprovement|A change for the better.\ninch|A unit of length.\nincident|An event.\ninclude|To contain.\nincome|Money earned.\nincorporate|To include.\nincreasingly|More and more.\nindeed|In fact.\nindependence|Being independent.\nindependent|Not dependent.\nindex|A list of contents.\nindicate|To point out.\nindication|A sign.\nindividual|Single person.\nindustrial|Related to industry.\nindustry|Business and manufacturing.\ninevitable|Cannot be avoided.\ninfect|To pass on disease.\ninflation|Rise in prices.\ninfluence|To affect.\ninform|To tell.\ninitial|First.\ninitially|At first.\ninitiative|A first step.\ninjury|Harm to the body.\ninner|Inside.\ninnocent|Not guilty.\ninnovation|A new idea.\ninquiry|A question.\ninside|The inner part.\ninsight|Understanding.\ninsist|To demand.\ninspection|A close look.\ninspiration|Something that inspires.\ninstance|An example.\ninstead|In place of.\ninstruction|Teaching; a direction.\ninstrument|A tool or musical device.\ninsurance|Protection against loss.\nintention|What you plan.\ninterest|Curiosity; or money earned.\ninterested|Caring about.\ninteresting|Arousing curiosity.\ninternal|Inside.\ninternational|Between nations.\ninterpret|To explain the meaning.\ninterview|A meeting to assess.\nintroduce|To present.\nintroduction|A presentation.\ninvest|To put money in.\ninvestigate|To look into.\ninvestigation|A formal inquiry.\ninvestment|Money invested.\ninvite|To ask to come.\ninvolve|To include.\ninvolved|Complicated; included.\nissue|A topic; or to give out.\ncomplain|To say something is wrong.\ncomputer|An electronic machine.\nconsiderably|Much.\nconstantly|Always.\ncooperation|Working together.\ncope|To deal with.\ncurtain|Fabric over a window.\ndepress|To make sad.\ndisk|A round flat object.\ndozen|Twelve.\ndrawer|A sliding compartment.\ndump|To drop heavily.\near|Organ for hearing.\nearn|To get by working.\nearth|The planet.\neast|The direction of sunrise.\neastern|Of the east.\neat|To consume food.\neconomics|Study of economy.\nedition|A version.\neditor|One who edits.\neducate|To teach.\neffectively|In an effective way.\neither|One of two.\nelderly|Old.\nelect|To choose by vote.\nelectricity|A form of energy.\nelectronic|Using electronics.\nelsewhere|Somewhere else.\nemotional|Related to emotions.\nemphasize|To stress.\nencouragement|Support.\nengineering|The field of design.\nentirely|Completely.\nentrance|A way in.\nenvironmental|About the environment.\nepisode|One part of a series.\nequally|In equal way.\nequivalent|Equal in value.\nera|A period of time.\nessay|A short piece of writing.\nestablishment|Something established.\netc|And so on.\nethnic|Of a culture.\neuropean|Of Europe.\nevaluate|To assess.\nevaluation|Assessment.\neveryday|Daily.\nexam|A test.\nexcited|Thrilled.\nexciting|Thrilling.\nexecutive|A top manager.\nexist|To be.\nexistence|Being.\nexperienced|Having experience.\nextremely|Very.\nfacility|A building or equipment.\nfairly|Reasonably.\nfiction|Made-up story.\nflavor|Taste.\nfly|To move through air.\nfrequently|Often.\nfun|Enjoyment.\ngentleman|A man.\ngolf|A sport.\ngrandmother|Mother\'s mother.\ngrandfather|Father\'s father.\ngun|A weapon.\nguy|A man.\nhell|A bad place.\nhelpful|Giving help.\nhero|A brave person.\nhistorian|One who studies history.\nhistoric|Important in history.\nhistorical|Of history.\nhomework|School work at home.\nhousing|Homes.\nillegal|Against the law.\nimplication|What is suggested.\nincluding|Containing.\nincreased|Grown.\nincreasing|Growing.\ninformal|Not formal.\ninstitution|An organization.\ninstructor|Teacher.\nintelligence|Smarts.\nintense|Strong.\nintensity|Strength.\ninteraction|Communication.\ninterpretation|Explanation.\ninterrupt|To break in.\ninterval|A space.\ninvasion|An attack.\ninvestor|One who invests.\ninvolvement|Participation.\niron|A metal.\nisland|Land in water.\nit|That thing.\nits|Belonging to it.\nitself|It.\njacket|Outer garment.\njob|Work.\njoin|To connect.\njoint|Shared.\njoke|Something funny.\njournal|A diary.\njournalist|A reporter.\njourney|A trip.\njoy|Happiness.\njudge|To decide.\njudgment|A decision.\njuice|Liquid from fruit.\njump|To leap.\njunior|Younger.\njury|Decision makers.\njustice|Fairness.\njustify|To give reason.\nkeep|To hold.\nkick|To hit with foot.\nkid|A child.\nkill|To cause death.\nking|Male ruler.\nkiss|To touch with lips.\nkitchen|Room for cooking.\nknee|Joint in leg.\nknife|A blade.\nknock|To hit.\nknowledge|What is known.\nlab|Laboratory.\nlabor|Work.\nlaboratory|A lab.\nlack|To not have.\nlady|A woman.\nlake|Water body.\nland|Ground.\nlandscape|The view.\nlane|A path.\nlargely|Mostly.\nlaugh|To make sound of joy.\nlaw|A rule.\nlawyer|Legal advisor.\nlay|To put down.\nlayer|A level.\nlead|To guide.\nleader|One who leads.\nleadership|Leading.\nleading|Main.\nleague|A group.\nlean|To tilt.\nlearning|Gaining knowledge.\nlegal|Of the law.\nlegislation|Laws.\nlength|How long.\nlesson|Something taught.\nlet|To allow.\nlibrary|Place for books.\nlicense|Permission.\nlie|To say false.\nlife|Being alive.\nlifestyle|Way of living.\nlifetime|All of life.\nlift|To raise.\nlimit|A boundary.\nliterally|Actually.\nliterary|Of literature.\nliterature|Written works.\nlittle|Small.\nlive|To be alive.\nliving|Alive.\nloan|Money lent.\nlocal|Nearby.\nlocate|To find.\nlocation|A place.\nlock|To secure.\nlong|Not short.\nlook|To see.\nlose|To not win.\nloss|Losing.\nlost|Cannot find.\nlovely|Beautiful.\nlover|One who loves.\nluck|Chance.\nlucky|Having luck.\nlunch|Midday meal.\nmachine|A device.\nmad|Angry.\nmagazine|A periodical.\nmail|Post.\nmainly|Mostly.\nmaintain|To keep.\nmaintenance|Upkeep.\nmajor|Large.\nmajority|Most.\nmake|To create.\nmaker|One who makes.\nmale|Man or boy.\nmall|Shopping center.\nman|Adult male.\nmanage|To run.\nmanagement|Running.\nmanager|One who manages.\nmanner|Way.\nmanufacturing|Making goods.\nmap|A chart.\nmargin|Edge.\nmark|A sign.\nmarket|Place to buy.\nmarketing|Selling.\nmarriage|Being married.\nmarried|Wed.\nmarry|To wed.\nmass|Bulk.\nmassive|Huge.\nmaster|To learn fully.\nmatch|To fit.\nmaterial|Stuff.\nmath|Mathematics.\nmatter|Substance.\nmaximum|Most.\nmaybe|Perhaps.\nmeal|Food serving.\nmean|To intend.\nmeans|Method.\nmeanwhile|At the same time.\nmeasure|To find size.\nmeasurement|A size.\nmechanism|A system.\nmedia|News outlets.\nmedical|Of medicine.\nmedicine|Treatment.\nmedium|Middle.\nmeet|To encounter.\nmeeting|A gathering.\nmember|Part of group.\nmembership|Being a member.\nmemory|Recall.\nmental|Of the mind.\nmention|To refer to.\nmere|Only.\nmerely|Only.\nmethod|A way.\nmiddle|Center.\nmidnight|12 at night.\nmight|May.\nmilitary|Armed forces.\nmillion|1,000,000.\nmind|The brain.\nminimum|Least.\nminor|Small.\nminority|Smaller part.\nminute|60 seconds.\nmissing|Lost.\nmission|A task.\nmistake|An error.\nmix|To combine.\nmixture|A blend.\nmobile|Movable.\nmode|A way.\nmodel|A copy.\nmodern|Current.\nmoment|An instant.\nmoney|Currency.\nmoral|Good.\nmoreover|Besides.\nmorning|Early day.\nmortgage|Home loan.\nmostly|Mainly.\nmother|Female parent.\nmotor|Engine.\nmount|To climb.\nmouse|Small rodent.\nmouth|Opening for food.\nmove|To go.\nmovement|Motion.\nmovie|A film.\nmuch|A lot.\nmultiple|Many.\nmurder|Killing.\nmuscle|Body tissue.\nmuseum|Place for art.\nmusic|Sounds.\nmusical|Of music.\nmusician|One who plays music.\nmust|Have to.\nmutual|Shared.\nmyself|Me.\nmystery|Something unknown.\nnail|Finger tip.\nnarrative|A story.\nnation|A country.\nnational|Of a nation.\nnative|Original.\nnatural|Of nature.\nnaturally|By nature.\nnature|The world.\nnear|Close.\nnearby|Close by.\nnearly|Almost.\nnecessarily|Of necessity.\nnecessary|Needed.\nneck|Between head and body.\nnegative|Bad.\nnegotiate|To discuss.\nnegotiation|Discussion.\nneighbor|Person next door.\nneighborhood|Area.\nneither|Not either.\nnerve|Courage.\nnervous|Anxious.\nnetwork|A system.\nnevertheless|However.\nnews|Information.\nnewspaper|A paper.\nnice|Pleasant.\nnight|Dark time.\nnine|9.\nnobody|No person.\nnoise|Sound.\nnone|Not any.\nnor|And not.\nnormally|Usually.\nnorth|A direction.\nnorthern|Of north.\nnose|Smell organ.\nnot|Negative.\nnote|A short note.\nnotion|An idea.\nnovel|A book.\nnumerous|Many.\nnurse|Caregiver.\nobject|A thing.\nobjective|A goal.\nobligation|A duty.\nobservation|Watching.\nobserve|To watch.\nobtain|To get.\nobvious|Clear.\nobviously|Clearly.\noccasion|A time.\noccasionally|Sometimes.\noccur|To happen.\nocean|The sea.\nodd|Strange.\noffense|Crime.\noffer|To give.\noffice|Workplace.\nofficer|Official.\nofficial|Formal.\noil|Liquid fat.\nokay|Alright.\nolympic|Of Olympics.\none|1.\nongoing|Continuing.\nonline|On the internet.\nopening|A start.\noperate|To work.\noperation|Surgery; action.\noperator|One who operates.\nopinion|A view.\nopponent|Rival.\nopportunity|A chance.\noppose|To be against.\nopposite|Reverse.\nopposition|Against.\nor|Either.\norange|A color.\nordinary|Normal.\norganic|Natural.\norganization|A group.\norganize|To arrange.\norientation|Direction.\norigin|Start.\noriginal|First.\noriginally|At first.\nothers|Other people.\notherwise|Or else.\nought|Should.\nours|Belonging to us.\nourselves|Us.\noutcome|Result.\noutline|A summary.\noutside|External.\noverall|Total.\novercome|To defeat.\nowe|To be in debt.\nowner|One who owns.\npace|Speed.\npack|To fill.\npackage|A parcel.\npain|Hurt.\npaint|To color.\npainting|A picture.\npair|Two.\npanel|A group.\npants|Trousers.\npaper|Sheet material.\nparent|Mother or father.\npark|Green space.\nparking|Place to leave car.\nparticipant|One who takes part.\nparticipate|To take part.\nparticipation|Taking part.\nparticular|Specific.\nparticularly|Especially.\npartly|In part.\npartner|A mate.\npartnership|Being partners.\nparty|A celebration.\npass|To go by.\npassage|A path.\npassenger|Rider.\npassion|Strong feeling.\npast|Before now.\npath|A way.\npatient|Sick person.\npattern|A design.\npause|To stop briefly.\npay|To give money.\npayment|Money paid.\npeace|Calm.\npeak|Top.\npeer|Equal.\npen|Writing tool.\npenalty|Punishment.\npercentage|A part.\nperfect|Flawless.\nperfectly|Completely.\nperform|To do.\nperformance|How one does.\nperhaps|Maybe.\nperiod|A time.\npermanent|Lasting.\npermit|To allow.\npersonal|Private.\npersonality|Character.\npersonally|In person.\npersonnel|Staff.\nperspective|Viewpoint.\nphase|A stage.\nphenomenon|An occurrence.\nphone|Telephone.\nphoto|Picture.\nphotograph|A photo.\nphrase|A group of words.\nphysical|Of the body.\nphysically|In body.\npicture|An image.\npile|A stack.\npilot|One who flies.\npin|A fastener.\npink|A color.\npipe|A tube.\nplan|A scheme.\nplane|Airplane.\nplanet|A world.\nplanning|Making plans.\nplant|A growing thing.\nplastic|A material.\nplate|A dish.\nplatform|A stage.\nplayer|One who plays.\npleasure|Enjoyment.\nplenty|Enough.\nplus|And.\npocket|A pouch.\npoem|Verse.\npoet|Writer of verse.\npoetry|Verse.\npole|A rod.\npolicy|A rule.\npolitical|Of politics.\npolitician|Office holder.\npolitics|Government.\npoll|A survey.\npool|Water hole.\npoor|Not rich.\npop|Popular.\npopular|Liked.\npopulation|People.\nport|Harbor.\npositive|Good.\npossess|To have.\npossibility|A chance.\npossible|Able to be.\npossibly|Perhaps.\npost|To mail.\npotential|Possible.\npotentially|Maybe.\npound|Weight unit.\npour|To flow.\npoverty|Being poor.\npower|Strength.\npowerful|Strong.\npractical|Useful.\npractice|To do often.\npray|To ask God.\nprefer|To like more.\npregnancy|Being pregnant.\npregnant|With child.\npreparation|Getting ready.\nprepare|To get ready.\npresence|Being there.\npresent|Here now.\npresentation|A show.\npreserve|To keep.\npresident|Leader.\npress|To push.\npressure|Force.\npretend|To fake.\npretty|Nice looking.\nprevent|To stop.\npreviously|Before.\nprice|Cost.\nprimary|First.\nprime|Best.\nprincipal|Main.\nprinciple|A rule.\nprior|Before.\npriority|Importance.\nprivate|Personal.\nprobably|Likely.\nproblem|A difficulty.\nprocedure|A process.\nproceed|To go on.\nprocess|A method.\nproduce|To make.\nproducer|One who makes.\nproduct|Something made.\nproduction|Making.\nprofessional|Pro.\nprofessor|Teacher.\nprofit|Gain.\nprogram|A plan.\nprogress|Advance.\nproject|A plan.\npromise|To pledge.\npromote|To advance.\npromotion|Advancement.\nprompt|Quick.\nproof|Evidence.\nproper|Correct.\nproperly|Correctly.\nproperty|Ownership.\nproposal|A plan.\npropose|To suggest.\nproposed|Suggested.\nprotect|To guard.\nprotection|Guard.\nprove|To show true.\nprovide|To give.\nprovider|One who gives.\nprovince|A region.\nprovision|Supply.\npsychological|Of the mind.\npsychology|Study of mind.\npublic|Open.\npublication|Publishing.\npublish|To issue.\npull|To drag.\npurchase|To buy.\npure|Clean.\npurpose|Aim.\npursue|To chase.\npush|To shove.\nput|To place.\nqualify|To meet standards.\nquality|Grade.\nquarterback|Football position.\nquestion|An inquiry.\nquickly|Rapidly.\nquiet|Silent.\nquietly|Silently.\nquit|To stop.\nquite|Very.\nquote|To cite.\nrace|A contest.\nrain|Precipitation.\nraise|To lift.\nrange|Extent.\nrank|Position.\nrapid|Fast.\nrapidly|Quickly.\nrare|Uncommon.\nrarely|Seldom.\nrather|Instead.\nratio|Proportion.\nraw|Uncooked.\nreach|To get to.\nreact|To respond.\nreaction|Response.\nreading|Looking at text.\nready|Prepared.\nreal|Actual.\nreality|What is real.\nrealize|To understand.\nreally|Truly.\nreason|A cause.\nreasonable|Fair.\nreasonably|Fairly.\nrecall|To remember.\nrecent|Lately.\nrecently|Lately.\nrecognition|Acknowledgment.\nrecognize|To know.\nrecommend|To suggest.\nrecommendation|A suggestion.\nrecord|To write down.\nrecover|To get better.\nrecovery|Getting better.\nreference|A mention.\nreflect|To think.\nreflection|Thought.\nreform|To improve.\nrefuse|To say no.\nregard|To consider.\nregarding|About.\nregion|An area.\nregional|Of a region.\nregister|To sign up.\nregular|Usual.\nregularly|Often.\nregulation|A rule.\nreinforce|To strengthen.\nreject|To refuse.\nrelate|To connect.\nrelation|Connection.\nrelationship|Connection.\nrelative|Family.\nrelatively|Quite.\nrelax|To rest.\nrelease|To let go.\nrelevant|Related.\nreliable|Trustworthy.\nrelief|Ease.\nreligion|Faith.\nreligious|Of religion.\nrely|To depend.\nremain|To stay.\nremaining|Left.\nremarkable|Notable.\nremind|To cause to remember.\nremote|Far.\nrepeat|To do again.\nrepeatedly|Again and again.\nreplace|To substitute.\nreport|To tell.\nreporter|One who reports.\nrepresent|To stand for.\nrepresentation|Standing for.\nrepresentative|Agent.\nreputation|Standing.\nrequest|To ask.\nrequire|To need.\nrequirement|A need.\nresearch|Study.\nresearcher|One who researches.\nreserve|To save.\nresident|One who lives.\nresist|To oppose.\nresolution|Decision.\nresolve|To decide.\nresort|To turn to.\nresource|Supply.\nrespect|Esteem.\nrespond|To reply.\nresponse|A reply.\nresponsibility|Duty.\nresponsible|Accountable.\nrest|To relax.\nrestaurant|Place to eat.\nrestrict|To limit.\nretain|To keep.\nretire|To stop working.\nretirement|After work.\nreveal|To show.\nrevenue|Income.\nreview|To look at.\nrevolution|Overthrow.\nreward|Prize.\nrice|A grain.\nrich|Wealthy.\nrid|Free of.\nride|To travel.\nring|A circle.\nrise|To go up.\nrisk|Danger.\nriver|Water flow.\nroad|A street.\nrock|Stone.\nrole|A part.\nroll|To turn.\nromantic|Loving.\nroom|A space.\nroot|Base of plant.\nrope|Cord.\nrough|Not smooth.\nround|Circular.\nroute|A path.\nroutine|Habit.\nrow|A line.\nrule|A law.\nrun|To move fast.\nrural|Country.\nrush|To hurry.\nsafe|Secure.\nsafety|Security.\nsale|Selling.\nsalt|Seasoning.\nsample|A specimen.\nsand|Tiny stones.\nsatellite|Orbiter.\nsatisfaction|Contentment.\nsatisfy|To please.\nscale|A range.\nscene|A view.\nschedule|A plan.\nscheme|A plan.\nscholar|Learned person.\nscholarship|Award.\nschool|Place to learn.';
    var localDict = (function(){ var o={}; var parts = LOCAL_DICT_STR.split('\n'); for (var i=0;i<parts.length;i++){ var p = parts[i].indexOf('|'); if (p>0) { var w = parts[i].slice(0,p); var d = parts[i].slice(p+1).replace(/\\p/g,'|').replace(/\\\\/g,'\\'); o[w]=d; } } return o; })();
    function getLocalDefinition(word) { var w = word.toLowerCase().replace(/[^a-z]/g,''); return localDict[w] || null; }

  
    // --- Tooltip: short-lived popup (e.g. link URL on focus, export/import messages) ---
    function showTooltip(near, text) {
      const id = 'oa-tooltip-' + Date.now();
      const tip = document.createElement('div');
      tip.id = id;
      tip.setAttribute('role', 'tooltip');
      tip.style.cssText = 'position:fixed;max-width:280px;padding:10px 12px;background:#1a1a2e;color:#eee;border-radius:8px;font-size:14px;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
      tip.textContent = text;
      document.body.appendChild(tip);
      const rect = (near && near.getBoundingClientRect) ? near.getBoundingClientRect() : { left: 100, top: 100 };
      tip.style.left = Math.min(rect.left, global.innerWidth - 300) + 'px';
      tip.style.top = (rect.top - tip.offsetHeight - 8) + 'px';
      if (tip.getBoundingClientRect().top < 0) tip.style.top = (rect.bottom + 8) + 'px';
      setTimeout(() => {
        const t = document.getElementById(id);
        if (t) t.remove();
      }, 6000);
    }
  
    // --- Dictionary modal audio: server TTS if apiBase, else browser SpeechSynthesis ---
    function speakTextForModal(text, done) {
      if (!text || !text.trim()) { if (done) done(); return; }
      var t = text.trim().slice(0, 3000);
      if (apiBase) {
        requestServerTts(t, function (url) {
          if (!url) {
            speakTextForModalBrowser(t, done);
            return;
          }
          var audio = new Audio(url);
          audio.onended = audio.onerror = function () { emit('tts:stop', {}); if (done) done(); };
          emit('tts:start', {});
          audio.play().catch(function () { if (done) done(); });
        });
        return;
      }
      speakTextForModalBrowser(t, done);
    }
    function speakTextForModalBrowser(t, done) {
      if (!global.speechSynthesis) { if (done) done(); return; }
      // Use widget rate/pitch/voice for consistency
      global.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(t);
      u.rate = state.ttsRate || 1;
      u.pitch = state.ttsPitch || 1;
      u.lang = state.language || document.documentElement.lang || 'en';
      if (state.ttsVoice && global.speechSynthesis.getVoices) {
        var v = global.speechSynthesis.getVoices().find(function (x) { return x.name === state.ttsVoice; });
        if (v) u.voice = v;
      }
      u.onend = u.onerror = function () { if (done) done(); };
      global.speechSynthesis.speak(u);
      emit('tts:start', {});
    }
  
    // --- Dictionary modal: word + definition + optional pronunciation, Play word / Play definition buttons ---
    function showWordModal(word, definition, pronunciation) {
      var prev = document.getElementById('oa-word-modal-root');
      if (prev) prev.remove();
      var root = document.createElement('div');
      root.id = 'oa-word-modal-root';
      root.className = 'oa-word-modal-backdrop';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-labelledby', 'oa-word-modal-title');
      var modal = document.createElement('div');
      modal.className = 'oa-word-modal';
      var wordDisplay = (word && String(word).trim()) ? escapeHtml(String(word).trim()) : 'â€”';
      var defDisplay = (definition && String(definition).trim()) ? escapeHtml(String(definition).trim()) : 'No definition available.';
      var pronText = (pronunciation && String(pronunciation).trim()) ? escapeHtml(String(pronunciation).trim()) : '\u2014';
      var pronDisplay = '<p class="oa-pron-label">Pronunciation</p><p class="oa-word-pron">' + pronText + '</p>';
      modal.innerHTML =
        '<button type="button" class="oa-close-modal" aria-label="Close">\u00D7</button>' +
        '<p class="oa-word-label">Word</p>' +
        '<h2 id="oa-word-modal-title">' + wordDisplay + '</h2>' +
        pronDisplay +
        '<p class="oa-def-label">Definition</p>' +
        '<p class="oa-word-def">' + defDisplay + '</p>' +
        '<div class="oa-word-audio">' +
        '<button type="button" class="oa-btn-audio" data-oa-speak-word aria-label="Play word">\u25B6 Play word</button>' +
        '<button type="button" class="oa-btn-audio" data-oa-speak-def aria-label="Play definition">\u25B6 Play definition</button>' +
        '</div>';
      root.appendChild(modal);
      function closeModal() {
        stopTTS();
        document.removeEventListener('keydown', onKey);
        root.remove();
      }
      function onKey(e) {
        if (e.key === 'Escape') closeModal();
      }
      root.addEventListener('click', function (e) {
        if (e.target === root) closeModal();
      });
      modal.querySelector('.oa-close-modal').addEventListener('click', closeModal);
      modal.querySelector('[data-oa-speak-word]').addEventListener('click', function () {
        speakTextForModal(word, null);
      });
      modal.querySelector('[data-oa-speak-def]').addEventListener('click', function () {
        speakTextForModal(definition, null);
      });
      document.body.appendChild(root);
      document.addEventListener('keydown', onKey);
      var focusEl = modal.querySelector('.oa-close-modal');
      if (focusEl) focusEl.focus();
    }
    function escapeHtml(s) {
      if (!s) return '';
      // Avoid XSS when showing API/local definition in modal
      var div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
    }
  
    // --- Focus strip: dimmed overlay so only a band of content is visible ---
    function ensureFocusStripMask() {
      if (document.getElementById('openaccessible-focus-strip')) return;
      const el = document.createElement('div');
      el.id = 'openaccessible-focus-strip';
      el.className = 'oa-focus-strip-mask';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
  
    function removeFocusStripMask() {
      const el = document.getElementById('openaccessible-focus-strip');
      if (el) el.remove();
    }
  
    // --- Reading guide: CSS var --oa-guide-y follows scroll for highlight band ---
    function initReadingGuide() {
      document.addEventListener('scroll', function () {
        if (!state.readingGuide) return;
        document.documentElement.style.setProperty('--oa-guide-y', (global.scrollY + 80) + 'px');
      }, { passive: true });
    }
  
    // --- Skip link and main landmark for screen reader users ---
    function injectSkipLink() {
      if (!state.screenReaderHints) return;
      let skip = document.getElementById('openaccessible-skip');
      if (skip) return;
      skip = document.createElement('a');
      skip.id = 'openaccessible-skip';
      skip.href = '#openaccessible-main';
      skip.textContent = 'Skip to main content';
      skip.style.cssText = 'position:absolute;left:-9999px;z-index:2147483647;padding:8px 16px;background:#0a7ea4;color:#fff;top:0;';
      skip.addEventListener('focus', function () { this.style.left = '8px'; this.style.top = '8px'; });
      skip.addEventListener('blur', function () { this.style.left = '-9999px'; });
      document.body.insertBefore(skip, document.body.firstChild);
      let main = document.getElementById('main') || document.querySelector('main') || document.querySelector('[role="main"]');
      if (!main) {
        main = document.createElement('div');
        main.id = 'openaccessible-main';
        main.setAttribute('role', 'main');
        main.style.display = 'none';
        document.body.appendChild(main);
      }
      main.id = 'openaccessible-main';
    }
  
    // --- Load or save preferences from/to API (preferences_load / preferences_save) ---
    function syncApiPreferences(action) {
      if (!apiBase) return;
      const q = new URLSearchParams();
      q.set('action', action === 'save' ? 'preferences_save' : 'preferences_load');
      if (apiUserId) q.set('user_id', apiUserId);
      const url = apiBase.replace(/\?.*$/, '') + '?' + q.toString();
      const opts = { method: action === 'save' ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' } };
      if (apiKey) opts.headers['X-API-Key'] = apiKey;
      if (action === 'save') opts.body = JSON.stringify({ ...state, user_id: apiUserId || undefined });
      fetch(url, opts)
        .then(r => r.json())
        .then(data => {
          if (action === 'load' && data && data.preferences) {
            state = { ...defaultState, ...data.preferences };
            writeStorage();
            applyToDocument();
            if ($panel) syncPanelFromState();
          }
        })
        .catch(() => {});
    }
  
    // --- Public init: opts.apiBase, opts.apiKey, opts.useServerTts, opts.accountVerifyUrl, etc. ---
    function init(opts) {
      opts = opts || {};
      apiBase = opts.apiBase || opts.apiUrl || '';
      apiKey = opts.apiKey || '';
      apiUserId = opts.userId || opts.user_id || '';
      useServerTts = !!opts.useServerTts;
      iconUrl = opts.iconUrl || (getScriptBase() + 'icon.svg');
      if (opts.accountVerifyUrl !== undefined) accountVerifyUrl = opts.accountVerifyUrl;
      if (opts.root && typeof opts.root === 'string') $root = document.querySelector(opts.root) || document.documentElement;
      else if (opts.root && opts.root.nodeType) $root = opts.root;
      readStorage();
      if (apiBase) syncApiPreferences('load');
      injectStyles();
      applyToDocument();
      if (state.dyslexiaFont) ensureFontsInjected();
      createToolbar();
      createPanel();
      document.getElementById('openaccessible-panel').style.display = 'none';
      if (apiKey && accountVerifyUrl) checkOpenAccessibleAccount();
      initDictionary();
      initReadingGuide();
      injectSkipLink();
      document.body.addEventListener('click', function (e) {
        const t = e.target;
        if (t && t.closest && t.closest('#openaccessible-toolbar')) return;
        if (t && t.closest && t.closest('#openaccessible-panel')) return;
        if (t && t.closest && t.closest('.oa-selection-bar')) return;
        if (state.ttsEnabled && t.hasAttribute('data-oa-tts')) speakElement(t);
      });
      document.addEventListener('mouseup', function (e) {
        setTimeout(function () {
          const sel = global.getSelection();
          const text = (sel && sel.toString() || '').trim();
          if (text && sel.rangeCount > 0 && !e.target.closest('#openaccessible-toolbar') && !e.target.closest('#openaccessible-panel')) {
            try {
              var r = sel.getRangeAt(0);
              var rect = r.getBoundingClientRect();
              showSelectionBar(rect.left + rect.width / 2, rect.bottom);
            } catch (_) { hideSelectionBar(); }
          } else if (!text) hideSelectionBar();
        }, 10);
      });
      global.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { togglePanel(false); closeReadingView(); hideSelectionBar(); return; }
        if ((e.altKey || e.metaKey) && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          var open = (document.getElementById('openaccessible-panel') || {}).style.display !== 'block';
          togglePanel(open);
          var tb = document.getElementById('openaccessible-toolbar');
          var btn = tb && tb.querySelector('[data-oa-open]');
          if (btn) btn.classList.toggle('active', open);
        }
      });
      emit('ready', { state, version: WIDGET_VERSION });
      return { getState: () => ({ ...state }), setState: (s) => { state = { ...state, ...s }; applyToDocument(); writeStorage(); }, openPanel: () => togglePanel(true), closePanel: () => togglePanel(false), reset, stopTTS };
    }
  
    // --- Auto-init on load: use OpenAccessibleConfig if set, else init({}) ---
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        if (global.OpenAccessibleConfig) init(global.OpenAccessibleConfig);
        else init({});
      });
    } else {
      if (global.OpenAccessibleConfig) init(global.OpenAccessibleConfig);
      else init({});
    }
    
    global.OpenAccessible = { init, version: WIDGET_VERSION };
  })(typeof window !== 'undefined' ? window : this);
  