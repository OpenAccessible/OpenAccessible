/*!
 * Open Accessible Widget — Deutsch (German)
 * Loads via: <script src=".../widget.js" data-site="TOKEN" data-position="bottom-right" data-accent="#0f6b5c" data-lang="en" async></script>
 * Locale builds: es-widget.js, fr-widget.js, de-widget.js, ko-widget.js
 * Uses websites.widget_token from openaccessible.sql (+ Dictionary for word lookup).
 */
(function () {
  "use strict";
  if (window.__oaWidgetLoaded) return;
  window.__oaWidgetLoaded = true;

  var script = document.currentScript || (function () {
    var list = document.getElementsByTagName("script");
    return list[list.length - 1];
  })();

  var SITE = (script && script.getAttribute("data-site")) || "";
  var ATTR_POS = (script && script.getAttribute("data-position")) || "";
  var ATTR_ACCENT = (script && script.getAttribute("data-accent")) || "";
  var ATTR_LANG = (script && script.getAttribute("data-lang")) || "de";
  var API_BASE = (function () {
    if (!script || !script.src) return "/api";
    try {
      var u = new URL(script.src, window.location.href);
      return u.origin + u.pathname.replace(/\/[^/]*$/, "");
    } catch (e) {
      return "/api";
    }
  })();

  var STORAGE_KEY = "oa-widget:" + (SITE || "local") + ":de";
  var state = {
    open: false,
    lang: "de",
    tab: "text",
    settings: null,
    translating: false,
    translateStatus: "",
    translateError: false,
    prefs: {
      textSize: 0,
      readableFont: false,
      lineHeight: false,
      letterSpacing: false,
      highContrast: false,
      darkContrast: false,
      grayscale: false,
      saturation: false,
      highlightLinks: false,
      underlineLinks: false,
      reduceMotion: false,
      bigCursor: false,
      readingGuide: false,
      readingMask: false,
      hideImages: false,
      stopAnimations: false,
      textAlign: "",
      blindMode: false,
      translateLang: "",
    },
  };

  var LANG_NAMES = {
    en: "Englisch",
    es: "Spanisch",
    fr: "Französisch",
    de: "Deutsch",
    pt: "Portuguese",
    it: "Italian",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Koreanisch",
    ru: "Russian",
    ar: "Arabic",
    tr: "Turkish",
    nl: "Dutch",
    pl: "Polish",
    cs: "Czech",
    uk: "Ukrainian",
  };

  var i18n = {
    en: {
      title: "Barrierefreiheit",
      brand: "Open Accessible",
      subtitle: "Passen Sie diese Seite an Lesen, Sehen und Bewegung an",
      reset: "Alles zurücksetzen",
      close: "Schließen",
      active: "aktiv",
      search: "Tools suchen",
      profiles: "Schnellprofile",
      profileVision: "Seheinschränkung",
      profileDyslexia: "Legasthenie",
      profileMotion: "Weniger Bewegung",
      profileBlind: "Blindfreundlich",
      text: "Text",
      vision: "Sehen",
      navigation: "Navigation",
      assist: "Hilfe",
      textSize: "Textgröße",
      readableFont: "Lesbare Schrift",
      lineHeight: "Zeilenabstand",
      letterSpacing: "Zeichenabstand",
      highContrast: "Hoher Kontrast",
      darkContrast: "Dunkler Kontrast",
      grayscale: "Graustufen",
      saturation: "Geringe Sättigung",
      highlightLinks: "Links hervorheben",
      underlineLinks: "Links unterstreichen",
      reduceMotion: "Bewegung reduzieren",
      bigCursor: "Großer Cursor",
      readingGuide: "Leselineal",
      readingMask: "Lesemaske",
      hideImages: "Bilder ausblenden",
      stopAnimations: "Animationen stoppen",
      textAlign: "Textausrichtung",
      alignLeft: "Links",
      alignCenter: "Zentriert",
      alignRight: "Rechts",
      alignJustify: "Blocksatz",
      blindMode: "Blindfreundlicher Modus",
      blindHelp: "Großer Text, hoher Kontrast, Fokusrahmen und Hinweise für Screenreader",
      tts: "Text zu Sprache",
      ttsPage: "Seite vorlesen",
      ttsSelection: "Auswahl vorlesen",
      ttsStop: "Stopp",
      ttsStarted: "Vorlesen gestartet",
      ttsUnavailable: "Text zu Sprache ist in diesem Browser nicht verfügbar",
      ttsEmpty: "Nichts vorzulesen",
      translate: "Übersetzen",
      translateUi: "Panelsprache",
      translatePage: "Seite übersetzen",
      translateGo: "Jetzt übersetzen",
      translating: "Übersetze…",
      translateDone: "Übersetzung fertig",
      translateFailed: "Übersetzung fehlgeschlagen",
      translateUnreachable: "Übersetzungsdienst nicht erreichbar",
      translateEmpty: "Kein Seitentext zum Übersetzen gefunden",
      translatePick: "Zuerst eine Sprache wählen",
      dictionary: "Wörterbuch",
      dictPlaceholder: "Wort nachschlagen",
      dictGo: "Suchen",
      powered: "Bereitgestellt von Open Accessible",
      larger: "Größer",
      smaller: "Kleiner",
      on: "An",
      off: "Aus",
      announceOpen: "Barrierefreiheitsmenü geöffnet",
      announceClosed: "Barrierefreiheitsmenü geschlossen",
      announceBlindOn: "Blindfreundlicher Modus an",
      announceBlindOff: "Blindfreundlicher Modus aus",
      toolsCount: "Tools aktiv",
    },
    es: {
      title: "Accesibilidad",
      brand: "Open Accessible",
      subtitle: "Ajusta esta página a cómo lees, ves y te mueves",
      reset: "Restablecer",
      close: "Cerrar",
      active: "activos",
      search: "Buscar herramientas",
      profiles: "Perfiles rápidos",
      profileVision: "Baja visión",
      profileDyslexia: "Dislexia",
      profileMotion: "Menos movimiento",
      profileBlind: "Modo ceguera",
      text: "Texto",
      vision: "Visión",
      navigation: "Navegar",
      assist: "Ayuda",
      textSize: "Tamaño del texto",
      readableFont: "Fuente legible",
      lineHeight: "Espaciado de líneas",
      letterSpacing: "Espaciado de letras",
      highContrast: "Alto contraste",
      darkContrast: "Contraste oscuro",
      grayscale: "Escala de grises",
      saturation: "Baja saturación",
      highlightLinks: "Resaltar enlaces",
      underlineLinks: "Subrayar enlaces",
      reduceMotion: "Reducir movimiento",
      bigCursor: "Cursor grande",
      readingGuide: "Guía de lectura",
      readingMask: "Máscara de lectura",
      hideImages: "Ocultar imágenes",
      stopAnimations: "Detener animaciones",
      textAlign: "Alineación",
      alignLeft: "Izquierda",
      alignCenter: "Centro",
      alignRight: "Derecha",
      alignJustify: "Justificar",
      blindMode: "Modo para ceguera",
      blindHelp: "Texto grande, alto contraste y ayudas para lectores de pantalla",
      tts: "Texto a voz",
      ttsPage: "Leer página",
      ttsSelection: "Leer selección",
      ttsStop: "Detener",
      ttsStarted: "Lectura iniciada",
      ttsUnavailable: "Texto a voz no está disponible en este navegador",
      ttsEmpty: "No hay texto para leer",
      translate: "Traducir",
      translateUi: "Idioma del panel",
      translatePage: "Traducir página",
      translateGo: "Traducir ahora",
      translating: "Traduciendo…",
      translateDone: "Traducción terminada",
      translateFailed: "La traducción falló",
      translateUnreachable: "Servicio de traducción no disponible",
      translateEmpty: "No hay texto para traducir",
      translatePick: "Elige un idioma primero",
      dictionary: "Diccionario",
      dictPlaceholder: "Buscar una palabra",
      dictGo: "Buscar",
      powered: "Con Open Accessible",
      larger: "Mayor",
      smaller: "Menor",
      on: "Sí",
      off: "No",
      announceOpen: "Menú de accesibilidad abierto",
      announceClosed: "Menú de accesibilidad cerrado",
      announceBlindOn: "Modo para ceguera activado",
      announceBlindOff: "Modo para ceguera desactivado",
      toolsCount: "herramientas",
    },
    fr: {
      title: "Accessibilité",
      brand: "Open Accessible",
      subtitle: "Adaptez cette page à votre lecture, vision et mouvement",
      reset: "Réinitialiser",
      close: "Fermer",
      active: "actifs",
      search: "Rechercher",
      profiles: "Profils rapides",
      profileVision: "Basse vision",
      profileDyslexia: "Dyslexie",
      profileMotion: "Mouvement calme",
      profileBlind: "Mode malvoyant",
      text: "Texte",
      vision: "Vision",
      navigation: "Naviguer",
      assist: "Aide",
      textSize: "Taille du texte",
      readableFont: "Police lisible",
      lineHeight: "Interligne",
      letterSpacing: "Espacement des lettres",
      highContrast: "Contraste élevé",
      darkContrast: "Contraste sombre",
      grayscale: "Niveaux de gris",
      saturation: "Faible saturation",
      highlightLinks: "Surligner les liens",
      underlineLinks: "Souligner les liens",
      reduceMotion: "Réduire les animations",
      bigCursor: "Grand curseur",
      readingGuide: "Guide de lecture",
      readingMask: "Masque de lecture",
      hideImages: "Masquer les images",
      stopAnimations: "Arrêter les animations",
      textAlign: "Alignement",
      alignLeft: "Gauche",
      alignCenter: "Centre",
      alignRight: "Droite",
      alignJustify: "Justifier",
      blindMode: "Mode malvoyant",
      blindHelp: "Grand texte, contraste élevé et aides lecteurs d’écran",
      tts: "Synthèse vocale",
      ttsPage: "Lire la page",
      ttsSelection: "Lire la sélection",
      ttsStop: "Arrêter",
      ttsStarted: "Lecture démarrée",
      ttsUnavailable: "La synthèse vocale n’est pas disponible",
      ttsEmpty: "Rien à lire",
      translate: "Traduire",
      translateUi: "Langue du panneau",
      translatePage: "Traduire la page",
      translateGo: "Traduire maintenant",
      translating: "Traduction…",
      translateDone: "Traduction terminée",
      translateFailed: "Échec de la traduction",
      translateUnreachable: "Service de traduction inaccessible",
      translateEmpty: "Aucun texte à traduire",
      translatePick: "Choisissez d’abord une langue",
      dictionary: "Dictionnaire",
      dictPlaceholder: "Chercher un mot",
      dictGo: "Chercher",
      powered: "Propulsé par Open Accessible",
      larger: "Plus grand",
      smaller: "Plus petit",
      on: "Oui",
      off: "Non",
      announceOpen: "Menu d’accessibilité ouvert",
      announceClosed: "Menu d’accessibilité fermé",
      announceBlindOn: "Mode malvoyant activé",
      announceBlindOff: "Mode malvoyant désactivé",
      toolsCount: "outils",
    },
    de: {
      title: "Barrierefreiheit",
      brand: "Open Accessible",
      subtitle: "Passen Sie diese Seite an Lesen, Sehen und Bewegung an",
      reset: "Alles zurücksetzen",
      close: "Schließen",
      active: "aktiv",
      search: "Tools suchen",
      profiles: "Schnellprofile",
      profileVision: "Seheinschränkung",
      profileDyslexia: "Legasthenie",
      profileMotion: "Weniger Bewegung",
      profileBlind: "Blindfreundlich",
      text: "Text",
      vision: "Sehen",
      navigation: "Navigation",
      assist: "Hilfe",
      textSize: "Textgröße",
      readableFont: "Lesbare Schrift",
      lineHeight: "Zeilenabstand",
      letterSpacing: "Zeichenabstand",
      highContrast: "Hoher Kontrast",
      darkContrast: "Dunkler Kontrast",
      grayscale: "Graustufen",
      saturation: "Geringe Sättigung",
      highlightLinks: "Links hervorheben",
      underlineLinks: "Links unterstreichen",
      reduceMotion: "Bewegung reduzieren",
      bigCursor: "Großer Cursor",
      readingGuide: "Leselineal",
      readingMask: "Lesemaske",
      hideImages: "Bilder ausblenden",
      stopAnimations: "Animationen stoppen",
      textAlign: "Textausrichtung",
      alignLeft: "Links",
      alignCenter: "Zentriert",
      alignRight: "Rechts",
      alignJustify: "Blocksatz",
      blindMode: "Blindfreundlicher Modus",
      blindHelp: "Großer Text, hoher Kontrast, Fokusrahmen und Hinweise für Screenreader",
      tts: "Text zu Sprache",
      ttsPage: "Seite vorlesen",
      ttsSelection: "Auswahl vorlesen",
      ttsStop: "Stopp",
      ttsStarted: "Vorlesen gestartet",
      ttsUnavailable: "Text zu Sprache ist in diesem Browser nicht verfügbar",
      ttsEmpty: "Nichts vorzulesen",
      translate: "Übersetzen",
      translateUi: "Panelsprache",
      translatePage: "Seite übersetzen",
      translateGo: "Jetzt übersetzen",
      translating: "Übersetze…",
      translateDone: "Übersetzung fertig",
      translateFailed: "Übersetzung fehlgeschlagen",
      translateUnreachable: "Übersetzungsdienst nicht erreichbar",
      translateEmpty: "Kein Seitentext zum Übersetzen gefunden",
      translatePick: "Zuerst eine Sprache wählen",
      dictionary: "Wörterbuch",
      dictPlaceholder: "Wort nachschlagen",
      dictGo: "Suchen",
      powered: "Powered by Open Accessible",
      larger: "Größer",
      smaller: "Kleiner",
      on: "An",
      off: "Aus",
      announceOpen: "Barrierefreiheitsmenü geöffnet",
      announceClosed: "Barrierefreiheitsmenü geschlossen",
      announceBlindOn: "Blindfreundlicher Modus an",
      announceBlindOff: "Blindfreundlicher Modus aus",
      toolsCount: "Tools aktiv",
    },
    ko: {
      title: "접근성",
      brand: "Open Accessible",
      subtitle: "읽기, 보기, 움직임에 맞게 이 페이지를 조절하세요",
      reset: "모두 초기화",
      close: "닫기",
      active: "사용 중",
      search: "도구 검색",
      profiles: "빠른 프로필",
      profileVision: "저시력",
      profileDyslexia: "난독증",
      profileMotion: "움직임 완화",
      profileBlind: "시각장애 친화",
      text: "텍스트",
      vision: "시각",
      navigation: "탐색",
      assist: "보조",
      textSize: "글자 크기",
      readableFont: "읽기 쉬운 글꼴",
      lineHeight: "줄 간격",
      letterSpacing: "자간",
      highContrast: "고대비",
      darkContrast: "어두운 대비",
      grayscale: "회색조",
      saturation: "채도 낮추기",
      highlightLinks: "링크 강조",
      underlineLinks: "링크 밑줄",
      reduceMotion: "움직임 줄이기",
      bigCursor: "큰 커서",
      readingGuide: "읽기 가이드",
      readingMask: "읽기 마스크",
      hideImages: "이미지 숨기기",
      stopAnimations: "애니메이션 중지",
      textAlign: "텍스트 정렬",
      alignLeft: "왼쪽",
      alignCenter: "가운데",
      alignRight: "오른쪽",
      alignJustify: "양쪽",
      blindMode: "시각장애 친화 모드",
      blindHelp: "큰 글씨, 고대비, 포커스 윤곽, 스크린리더 힌트",
      tts: "텍스트 음성 변환",
      ttsPage: "페이지 읽기",
      ttsSelection: "선택 구간 읽기",
      ttsStop: "중지",
      ttsStarted: "읽기 시작",
      ttsUnavailable: "이 브라우저에서는 텍스트 음성 변환을 사용할 수 없습니다",
      ttsEmpty: "읽을 내용이 없습니다",
      translate: "번역",
      translateUi: "패널 언어",
      translatePage: "페이지 번역",
      translateGo: "지금 번역",
      translating: "번역 중…",
      translateDone: "번역 완료",
      translateFailed: "번역 실패",
      translateUnreachable: "번역 서비스에 연결할 수 없습니다",
      translateEmpty: "번역할 페이지 텍스트가 없습니다",
      translatePick: "먼저 언어를 선택하세요",
      dictionary: "사전",
      dictPlaceholder: "단어 검색",
      dictGo: "찾기",
      powered: "Powered by Open Accessible",
      larger: "크게",
      smaller: "작게",
      on: "켜짐",
      off: "꺼짐",
      announceOpen: "접근성 메뉴가 열렸습니다",
      announceClosed: "접근성 메뉴가 닫혔습니다",
      announceBlindOn: "시각장애 친화 모드 켜짐",
      announceBlindOff: "시각장애 친화 모드 꺼짐",
      toolsCount: "개 도구 사용 중",
    },
  };

  function t(key) {
    // Deutsch build: UI copy is always German.
    var pack = i18n.de || i18n.en;
    return pack[key] || i18n.en[key] || key;
  }

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        Object.keys(state.prefs).forEach(function (k) {
          if (parsed[k] !== undefined) state.prefs[k] = parsed[k];
        });
        if (parsed.lang && i18n[parsed.lang]) state.lang = parsed.lang;
        if (parsed.tab) state.tab = parsed.tab;
      }
    } catch (e) {}
  }

  function savePrefs() {
    try {
      var data = Object.assign({ lang: state.lang, tab: state.tab }, state.prefs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function toolEnabled(id) {
    var tools = (state.settings && state.settings.tools) || {};
    return tools[id] !== false;
  }

  function activeCount() {
    var n = 0;
    var p = state.prefs;
    if (p.textSize) n++;
    if (p.textAlign) n++;
    Object.keys(p).forEach(function (k) {
      if (k === "textSize" || k === "textAlign" || k === "translateLang") return;
      if (p[k] === true) n++;
    });
    if (p.translateLang) n++;
    return n;
  }

  function ensureFonts() {
    if (document.getElementById("oa-fonts")) return;
    var link = document.createElement("link");
    link.id = "oa-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }

  function icon(name, size) {
    var s = size || 20;
    var paths = {
      a11y: '<circle cx="12" cy="4" r="2"/><path d="M12 8v4m0 0l-4 8m4-8l4 8M7 11h10"/>',
      text: '<path d="M4 6h16M8 6v14M16 6v14"/>',
      font: '<path d="M5 19l5-14h4l5 14M8.2 13h7.6"/>',
      spacing: '<path d="M5 7v10M9 7v10M13 7v10M17 7v10M4 12h16"/>',
      lines: '<path d="M4 7h16M4 12h16M4 17h10"/>',
      eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
      eyeOff: '<path d="M3 3l18 18M10.6 10.6A3 3 0 0013.4 13.4M9.9 5.2A10.7 10.7 0 0112 5c6.5 0 10 7 10 7a17.5 17.5 0 01-4.1 4.7M6.1 6.1A17.4 17.4 0 002 12s3.5 7 10 7a10.4 10.4 0 005-.9"/>',
      moon: '<path d="M20 14.5A7.5 7.5 0 119.5 4 6 6 0 0020 14.5z"/>',
      drop: '<path d="M12 3s6 7 6 11a6 6 0 11-12 0c0-4 6-11 6-11z"/>',
      gray: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/>',
      nav: '<path d="M4 6h16M4 12h10M4 18h14"/>',
      assist: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M17.7 6.3l-2.1 2.1M8.4 15.6l-2.1 2.1"/><circle cx="12" cy="12" r="3"/>',
      close: '<path d="M6 6l12 12M18 6L6 18"/>',
      reset: '<path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5"/>',
      check: '<path d="M5 12l5 5L19 7"/>',
      speak: '<path d="M4 9v6h4l5 4V5L8 9H4zM16 9a3 3 0 010 6M18.5 7a6 6 0 010 10"/>',
      speakSel: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8l5 4-5 4"/>',
      stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
      book: '<path d="M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2V5z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
      translate: '<path d="M5 5h7M8.5 5v2M7 7c0 4 4 7 7 8M12 5c1.5 3 4 6 7 8"/><path d="M13 19l2.5-6L18 19M14 17h3"/>',
      size: '<path d="M4 18V8h3v10H4zm6 0V4h4v14h-4zm7 0v-6h3v6h-3z"/>',
      smaller: '<path d="M5 12h14M8 8l-3 4 3 4M16 8l3 4-3 4"/>',
      larger: '<path d="M4 18V8h3v10H4zm7 0V4h5v14h-5z"/>',
      contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 000-18z"/>',
      link: '<path d="M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1"/>',
      underline: '<path d="M7 5v7a5 5 0 0010 0V5M5 19h14"/>',
      cursor: '<path d="M5 3l14 8-6 2-2 6z"/>',
      guide: '<path d="M4 6h16M4 12h16M4 18h16"/><path d="M3 12h18" stroke-width="2.6"/>',
      mask: '<path d="M3 12h18M3 7h18M3 17h18"/><rect x="5" y="9" width="14" height="6" rx="1"/>',
      image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M3 16l5-4 4 3 3-2 6 4"/>',
      pause: '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>',
      motion: '<path d="M4 12h4l2-5 3 10 2-5h5"/>',
      align: '<path d="M4 6h16M4 12h10M4 18h14"/>',
      alignLeft: '<path d="M4 6h16M4 12h10M4 18h14"/>',
      alignCenter: '<path d="M4 6h16M7 12h10M5 18h14"/>',
      alignRight: '<path d="M4 6h16M10 12h10M6 18h14"/>',
      alignJustify: '<path d="M4 6h16M4 12h16M4 18h16"/>',
      alignNone: '<path d="M6 6h12M8 12h8M7 18h10M5 5l14 14"/>',
      search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5"/>',
      profiles: '<path d="M8 18v-1a3 3 0 013-3h2a3 3 0 013 3v1"/><circle cx="12" cy="8" r="3"/><path d="M4 18v-.8a2.5 2.5 0 012.2-2.5M20 18v-.8a2.5 2.5 0 00-2.2-2.5M6.5 8.2a2.4 2.4 0 10-.1-4.5M17.5 8.2a2.4 2.4 0 10.1-4.5"/>',
      spark: '<path d="M12 3l1.4 5.2L18 10l-4.6 1.8L12 17l-1.4-5.2L6 10l4.6-1.8z"/>',
      lang: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
      page: '<path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
      lookup: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5M9 11h4M11 9v4"/>',
      power: '<path d="M12 3v9"/><path d="M7.5 6.2a7 7 0 1010.3-.2"/>',
      active: '<path d="M12 3l2.2 6.6H21l-5.4 4 2.1 6.4L12 16.8 6.3 20l2.1-6.4L3 9.6h6.8z"/>',
      dyslexia: '<path d="M5 17V7h3.5a3.2 3.2 0 010 6.4H5M14 17l3-10h2l3 10M15.2 13h5.6"/>',
      blind: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
      visionLow: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M5 19h14"/>',
      highlight: '<path d="M5 20h14M8 16l8-8 3 3-8 8H8v-3z"/>',
      sat: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18"/><path d="M8 8c2 3 6 3 8 0"/>',
      type: '<path d="M4 7V5h16v2M12 5v14M9 19h6"/>',
      height: '<path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/>',
      letter: '<path d="M5 18l4-12h2l4 12M6.5 13h5M15 18V6h4"/>',
      play: '<path d="M8 5l12 7-12 7z"/>',
      glint: '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>',
    };
    var d = paths[name] || paths.a11y;
    return (
      '<svg class="oa-ico" viewBox="0 0 24 24" width="' +
      s +
      '" height="' +
      s +
      '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      d +
      "</svg>"
    );
  }

  function injectStyles(accent) {
    var css =
      ":root{--oa-accent:" +
      accent +
      ";--oa-accent-deep:#0a4d42;--oa-ink:#132028;--oa-ink-soft:#3a4d57;--oa-paper:#f3f7f6;--oa-sun:#d9a21b;--oa-line:rgba(19,32,40,.12);--oa-font-display:'Bricolage Grotesque',Georgia,serif;--oa-font-body:Figtree,system-ui,sans-serif;}" +
      "#oa-root{all:initial;font-family:var(--oa-font-body);color:var(--oa-ink);}" +
      "#oa-root *{box-sizing:border-box;}" +
      "#oa-fab{position:fixed;z-index:2147483000;width:60px;height:60px;border:0;cursor:pointer;" +
      "border-radius:18px 18px 8px 18px;background:linear-gradient(145deg,var(--oa-accent) 0%,var(--oa-accent-deep) 100%);" +
      "color:#fff;display:grid;place-items:center;box-shadow:0 14px 32px rgba(15,107,92,.35);" +
      "transition:transform .22s ease,box-shadow .22s ease;}" +
      "#oa-fab:hover{transform:translateY(-2px) scale(1.03);}" +
      "#oa-fab:focus-visible{outline:3px solid var(--oa-sun);outline-offset:3px;}" +
      "#oa-fab .oa-fab-ico{display:block;}" +
      "#oa-fab .oa-badge{position:absolute;top:-6px;right:-6px;min-width:22px;height:22px;padding:0 6px;" +
      "border-radius:999px;background:var(--oa-sun);color:#1f1800;font:700 .72rem var(--oa-font-body);" +
      "display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.18);}" +
      "#oa-fab[data-count='0'] .oa-badge{display:none;}" +
      "#oa-scrim{position:fixed;inset:0;z-index:2147483000;background:rgba(19,32,40,.28);opacity:0;pointer-events:none;" +
      "transition:opacity .25s ease;}" +
      "#oa-scrim[data-open='1']{opacity:1;pointer-events:auto;}" +
      "#oa-panel{position:fixed;z-index:2147483001;width:min(420px,calc(100vw - 1rem));" +
      "max-height:min(86vh,720px);display:flex;flex-direction:column;overflow-x:hidden;overflow-y:auto;" +
      "color:var(--oa-ink);-webkit-overflow-scrolling:touch;overscroll-behavior:contain;" +
      "background:radial-gradient(520px 220px at 100% 0%,rgba(15,107,92,.16),transparent 55%)," +
      "radial-gradient(420px 180px at 0% 8%,rgba(217,162,27,.12),transparent 50%)," +
      "linear-gradient(180deg,#eef5f3 0%,var(--oa-paper) 42%,#e7f0ed 100%);" +
      "border:1px solid var(--oa-line);border-radius:22px;box-shadow:0 28px 60px rgba(19,32,40,.28);" +
      "opacity:0;transform:translateY(12px) scale(.98);pointer-events:none;" +
      "transition:opacity .22s ease,transform .28s cubic-bezier(.2,.8,.2,1);}" +
      "#oa-panel[data-open='1']{opacity:1;transform:none;pointer-events:auto;}" +
      "#oa-panel .oa-head{padding:1.05rem 1.1rem .85rem;border-bottom:1px solid var(--oa-line);flex:0 0 auto;}" +
      "#oa-panel .oa-brand-row{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;}" +
      "#oa-panel .oa-brand{display:flex;align-items:center;gap:.65rem;min-width:0;}" +
      "#oa-panel .oa-mark{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:0 0 auto;" +
      "background:linear-gradient(145deg,var(--oa-accent),var(--oa-accent-deep));color:#fff;}" +
      "#oa-panel .oa-brand-text{min-width:0;}" +
      "#oa-panel .oa-brand-name{margin:0;font-family:var(--oa-font-display);font-size:1.2rem;font-weight:800;" +
      "letter-spacing:-.03em;line-height:1.1;}" +
      "#oa-panel .oa-sub{margin:.25rem 0 0;font-size:.82rem;color:var(--oa-ink-soft);line-height:1.35;}" +
      "#oa-panel .oa-head-actions{display:flex;gap:.35rem;flex:0 0 auto;}" +
      "#oa-panel .oa-icon-btn{width:36px;height:36px;border-radius:10px;border:1.5px solid var(--oa-line);" +
      "background:rgba(255,255,255,.72);color:var(--oa-ink);cursor:pointer;display:grid;place-items:center;" +
      "transition:background .15s ease,border-color .15s ease;}" +
      "#oa-panel .oa-icon-btn:hover{background:#fff;border-color:rgba(15,107,92,.35);}" +
      "#oa-panel .oa-icon-btn:focus-visible{outline:3px solid var(--oa-sun);outline-offset:2px;}" +
      "#oa-panel .oa-meta{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;margin-top:.85rem;}" +
      "#oa-panel .oa-chip{display:inline-flex;align-items:center;gap:.35rem;padding:.28rem .6rem;border-radius:8px;" +
      "background:rgba(15,107,92,.12);color:var(--oa-accent-deep);font-size:.75rem;font-weight:700;}" +
      "#oa-panel .oa-chip .oa-ico{width:14px;height:14px;}" +
      "#oa-panel .oa-search{flex:1;min-width:140px;display:flex;align-items:center;gap:.4rem;padding:.35rem .65rem;" +
      "border:1.5px solid var(--oa-line);border-radius:10px;background:rgba(255,255,255,.8);}" +
      "#oa-panel .oa-search .oa-ico{color:var(--oa-ink-soft);flex:0 0 auto;}" +
      "#oa-panel .oa-search input{border:0;background:transparent;width:100%;font:500 .85rem var(--oa-font-body);" +
      "color:var(--oa-ink);outline:none;}" +
      "#oa-panel .oa-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:.35rem;padding:.75rem 1.1rem 0;flex:0 0 auto;}" +
      "#oa-panel .oa-tab{border:1.5px solid transparent;background:transparent;border-radius:12px;padding:.55rem .35rem;" +
      "cursor:pointer;color:var(--oa-ink-soft);font:600 .78rem var(--oa-font-body);display:grid;gap:.2rem;place-items:center;" +
      "transition:background .15s ease,color .15s ease,border-color .15s ease;}" +
      "#oa-panel .oa-tab .oa-ico{width:18px;height:18px;}" +
      "#oa-panel .oa-tab[aria-selected='true']{background:#fff;border-color:var(--oa-line);color:var(--oa-accent-deep);" +
      "box-shadow:0 6px 16px rgba(19,32,40,.06);}" +
      "#oa-panel .oa-tab:focus-visible{outline:3px solid var(--oa-sun);outline-offset:2px;}" +
      "#oa-panel .oa-scroll{flex:0 0 auto;overflow:visible;padding:.85rem 1.1rem 1.1rem;}" +
      "#oa-panel .oa-sec-label{margin:0 0 .55rem;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;" +
      "color:var(--oa-accent-deep);font-weight:700;display:flex;align-items:center;gap:.4rem;}" +
      "#oa-panel .oa-sec-label .oa-ico{width:14px;height:14px;}" +
      "#oa-panel .oa-profiles{display:grid;grid-template-columns:1fr 1fr;gap:.45rem;margin-bottom:1rem;}" +
      "#oa-panel .oa-profile{border:1.5px solid var(--oa-line);background:rgba(255,255,255,.75);border-radius:14px;" +
      "padding:.7rem .75rem;cursor:pointer;text-align:left;font:600 .82rem var(--oa-font-body);color:var(--oa-ink);" +
      "display:flex;align-items:center;gap:.55rem;transition:border-color .15s ease,background .15s ease,transform .15s ease;}" +
      "#oa-panel .oa-profile:hover{border-color:rgba(15,107,92,.4);background:#fff;transform:translateY(-1px);}" +
      "#oa-panel .oa-profile-ico{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex:0 0 auto;" +
      "background:rgba(15,107,92,.12);color:var(--oa-accent-deep);}" +
      "#oa-panel .oa-profile-ico .oa-ico{width:16px;height:16px;}" +
      "#oa-panel .oa-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;}" +
      "#oa-panel .oa-tile{border:1.5px solid var(--oa-line);background:rgba(255,255,255,.78);border-radius:14px;" +
      "padding:.75rem .7rem;cursor:pointer;text-align:left;min-height:4.4rem;display:flex;flex-direction:column;" +
      "justify-content:space-between;gap:.55rem;transition:border-color .15s ease,background .15s ease,transform .15s ease;}" +
      "#oa-panel .oa-tile:hover{transform:translateY(-1px);border-color:rgba(15,107,92,.35);}" +
      "#oa-panel .oa-tile[aria-pressed='true']{background:rgba(15,107,92,.12);border-color:var(--oa-accent);}" +
      "#oa-panel .oa-tile-top{display:flex;align-items:flex-start;justify-content:space-between;gap:.4rem;}" +
      "#oa-panel .oa-tile-ico{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;" +
      "background:rgba(15,107,92,.12);color:var(--oa-accent-deep);}" +
      "#oa-panel .oa-tile[aria-pressed='true'] .oa-tile-ico{background:var(--oa-accent);color:#fff;}" +
      "#oa-panel .oa-tile-ico .oa-ico{width:17px;height:17px;}" +
      "#oa-panel .oa-tile-label{font:600 .84rem var(--oa-font-body);line-height:1.25;}" +
      "#oa-panel .oa-tile-state{font-size:.7rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;" +
      "color:var(--oa-ink-soft);}" +
      "#oa-panel .oa-tile[aria-pressed='true'] .oa-tile-state{color:var(--oa-accent-deep);}" +
      "#oa-panel .oa-block{margin-bottom:1rem;padding:0.9rem;border:1.5px solid var(--oa-line);border-radius:16px;" +
      "background:rgba(255,255,255,.7);}" +
      "#oa-panel .oa-block h3{margin:0 0 .55rem;font-family:var(--oa-font-display);font-size:1rem;font-weight:700;" +
      "display:flex;align-items:center;gap:.5rem;}" +
      "#oa-panel .oa-block h3 .oa-heading-ico{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;" +
      "background:linear-gradient(145deg,var(--oa-accent),var(--oa-accent-deep));color:#fff;flex:0 0 auto;}" +
      "#oa-panel .oa-block h3 .oa-heading-ico .oa-ico{width:16px;height:16px;}" +
      "#oa-panel .oa-help{margin:.15rem 0 .65rem;font-size:.82rem;color:var(--oa-ink-soft);line-height:1.4;}" +
      "#oa-panel .oa-help[data-error='1']{color:#8a2b2b;font-weight:600;}" +
      "#oa-panel .oa-size{display:flex;align-items:center;gap:.55rem;}" +
      "#oa-panel .oa-size-track{flex:1;height:8px;border-radius:999px;background:rgba(15,107,92,.15);overflow:hidden;}" +
      "#oa-panel .oa-size-fill{height:100%;width:0;background:linear-gradient(90deg,var(--oa-accent),var(--oa-sun));" +
      "border-radius:inherit;transition:width .2s ease;}" +
      "#oa-panel .oa-size-val{min-width:2ch;font-weight:700;font-variant-numeric:tabular-nums;}" +
      "#oa-panel .oa-btn{border:1.5px solid var(--oa-line);background:#fff;border-radius:10px;min-height:2.45rem;" +
      "padding:.4rem .75rem;cursor:pointer;font:600 .84rem var(--oa-font-body);color:var(--oa-ink);" +
      "display:inline-flex;align-items:center;justify-content:center;gap:.4rem;" +
      "transition:background .15s ease,border-color .15s ease;}" +
      "#oa-panel .oa-btn .oa-ico{width:16px;height:16px;flex:0 0 auto;}" +
      "#oa-panel .oa-btn:hover{border-color:rgba(15,107,92,.4);}" +
      "#oa-panel .oa-btn[aria-pressed='true']{background:rgba(15,107,92,.14);border-color:var(--oa-accent);}" +
      "#oa-panel .oa-btn-primary{background:var(--oa-accent);color:#fff;border-color:transparent;}" +
      "#oa-panel .oa-btn-primary:hover{background:var(--oa-accent-deep);}" +
      "#oa-panel .oa-inline{display:flex;flex-wrap:wrap;gap:.4rem;}" +
      "#oa-panel .oa-field{display:grid;gap:.35rem;margin-bottom:.65rem;}" +
      "#oa-panel .oa-field label{font-size:.78rem;font-weight:700;color:var(--oa-ink-soft);display:flex;align-items:center;gap:.35rem;}" +
      "#oa-panel .oa-field label .oa-ico{width:14px;height:14px;}" +
      "#oa-panel select,#oa-panel input.oa-input{width:100%;border:1.5px solid var(--oa-line);border-radius:10px;" +
      "min-height:2.45rem;padding:.4rem .7rem;background:#fff;font:500 .88rem var(--oa-font-body);color:var(--oa-ink);}" +
      "#oa-panel select:focus-visible,#oa-panel input.oa-input:focus-visible,#oa-panel .oa-btn:focus-visible," +
      "#oa-panel .oa-tile:focus-visible,#oa-panel .oa-profile:focus-visible{outline:3px solid var(--oa-sun);outline-offset:2px;}" +
      "#oa-dict-out{margin-top:.55rem;font-size:.88rem;color:var(--oa-ink-soft);line-height:1.45;min-height:1.2em;}" +
      "#oa-panel .oa-foot{flex:0 0 auto;padding:.75rem 1.1rem;border-top:1px solid var(--oa-line);" +
      "font-size:.78rem;color:var(--oa-ink-soft);display:flex;justify-content:space-between;align-items:center;gap:.5rem;}" +
      "#oa-panel .oa-foot a{color:var(--oa-accent-deep);font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:.35rem;}" +
      "#oa-panel .oa-foot a .oa-ico{width:14px;height:14px;}" +
      "#oa-panel .oa-foot a:hover{text-decoration:underline;}" +
      "#oa-panel .oa-empty{padding:1.5rem .5rem;text-align:center;color:var(--oa-ink-soft);font-size:.9rem;" +
      "display:grid;gap:.45rem;place-items:center;}" +
      "#oa-panel .oa-empty .oa-ico{opacity:.7;}" +
      "#oa-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}" +
      "@media (prefers-reduced-motion:reduce){#oa-fab,#oa-panel,#oa-scrim,#oa-panel .oa-tile,#oa-panel .oa-profile," +
      "#oa-panel .oa-size-fill{transition:none!important;}}" +
      "html.oa-readable-font,html.oa-readable-font body{font-family:Verdana,Arial,sans-serif!important;}" +
      "html.oa-line-height body,html.oa-line-height body *{line-height:1.8!important;}" +
      "html.oa-letter-spacing body,html.oa-letter-spacing body p,html.oa-letter-spacing body li,html.oa-letter-spacing body a{letter-spacing:.06em!important;}" +
      "html.oa-contrast{filter:contrast(1.35)!important;}" +
      "html.oa-dark{background:#111!important;filter:invert(1) hue-rotate(180deg)!important;}" +
      "html.oa-dark img,html.oa-dark video,html.oa-dark picture,html.oa-dark svg{filter:invert(1) hue-rotate(180deg)!important;}" +
      "html.oa-gray{filter:grayscale(1)!important;}" +
      "html.oa-sat{filter:saturate(.3)!important;}" +
      "html.oa-links a{background:#fff3a0!important;outline:2px solid #d9a21b!important;}" +
      "html.oa-underline a{text-decoration:underline!important;text-underline-offset:.18em!important;}" +
      "html.oa-motion *,html.oa-motion *::before,html.oa-motion *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;}" +
      "html.oa-cursor,html.oa-cursor *{cursor:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath fill='black' stroke='white' stroke-width='2' d='M6 4 L6 40 L18 30 L26 44 L32 41 L24 28 L40 28 Z'/%3E%3C/svg%3E\") 4 4, auto!important;}" +
      "html.oa-hide-images img,html.oa-hide-images picture,html.oa-hide-images video,html.oa-hide-images svg:not(#oa-root svg){opacity:0!important;visibility:hidden!important;}" +
      "html.oa-stop *{animation-play-state:paused!important;}" +
      "html.oa-align-left body{text-align:left!important;}" +
      "html.oa-align-center body{text-align:center!important;}" +
      "html.oa-align-right body{text-align:right!important;}" +
      "html.oa-align-justify body{text-align:justify!important;}" +
      "html.oa-blind :focus{outline:4px solid #d9a21b!important;outline-offset:3px!important;}" +
      "html.oa-blind a{text-decoration:underline!important;}" +
      "#oa-guide{position:fixed;left:0;right:0;height:3px;background:rgba(217,162,27,.85);z-index:2147482990;pointer-events:none;display:none;}" +
      "#oa-mask{position:fixed;inset:0;z-index:2147482980;pointer-events:none;display:none;" +
      "background:linear-gradient(#000000bb,#000000bb) top/100% var(--oa-mask-top,0) no-repeat," +
      "linear-gradient(#000000bb,#000000bb) bottom/100% var(--oa-mask-bot,0) no-repeat;}";

    var existing = document.getElementById("oa-styles");
    if (existing) existing.remove();
    var style = document.createElement("style");
    style.id = "oa-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function applyPrefs() {
    var html = document.documentElement;
    var p = state.prefs;
    var scale = 1 + p.textSize * 0.12;
    html.style.fontSize = p.textSize ? scale * 100 + "%" : "";
    html.classList.toggle("oa-readable-font", !!p.readableFont);
    html.classList.toggle("oa-line-height", !!p.lineHeight);
    html.classList.toggle("oa-letter-spacing", !!p.letterSpacing);
    html.classList.toggle("oa-contrast", !!p.highContrast);
    html.classList.toggle("oa-dark", !!p.darkContrast);
    html.classList.toggle("oa-gray", !!p.grayscale);
    html.classList.toggle("oa-sat", !!p.saturation);
    html.classList.toggle("oa-links", !!p.highlightLinks);
    html.classList.toggle("oa-underline", !!p.underlineLinks);
    html.classList.toggle("oa-motion", !!p.reduceMotion);
    html.classList.toggle("oa-cursor", !!p.bigCursor);
    html.classList.toggle("oa-hide-images", !!p.hideImages);
    html.classList.toggle("oa-stop", !!p.stopAnimations);
    html.classList.toggle("oa-blind", !!p.blindMode);
    ["left", "center", "right", "justify"].forEach(function (a) {
      html.classList.toggle("oa-align-" + a, p.textAlign === a);
    });
    var guide = document.getElementById("oa-guide");
    var mask = document.getElementById("oa-mask");
    if (guide) guide.style.display = p.readingGuide ? "block" : "none";
    if (mask) mask.style.display = p.readingMask ? "block" : "none";
    updateBadge();
    savePrefs();
  }

  function updateBadge() {
    var fab = document.getElementById("oa-fab");
    var badge = document.getElementById("oa-badge");
    var n = activeCount();
    if (fab) fab.setAttribute("data-count", String(n));
    if (badge) badge.textContent = String(n);
    var chip = document.getElementById("oa-active-chip");
    if (chip) chip.innerHTML = icon("active", 14) + "<span>" + n + " " + t("toolsCount") + "</span>";
  }

  function announce(msg) {
    var live = document.getElementById("oa-live");
    if (!live) return;
    live.textContent = "";
    setTimeout(function () {
      live.textContent = msg;
    }, 20);
  }

  function positionUi(pos) {
    var fab = document.getElementById("oa-fab");
    var panel = document.getElementById("oa-panel");
    var map = {
      "bottom-right": { fab: "right:1.1rem;bottom:1.1rem;", panel: "right:1.1rem;bottom:5.4rem;" },
      "bottom-left": { fab: "left:1.1rem;bottom:1.1rem;", panel: "left:1.1rem;bottom:5.4rem;" },
      "top-right": { fab: "right:1.1rem;top:1.1rem;", panel: "right:1.1rem;top:5.4rem;" },
      "top-left": { fab: "left:1.1rem;top:1.1rem;", panel: "left:1.1rem;top:5.4rem;" },
    };
    var spot = map[pos] || map["bottom-right"];
    fab.setAttribute("style", spot.fab);
    panel.setAttribute("style", spot.panel);
  }

  function setOpen(open) {
    state.open = open;
    var panel = document.getElementById("oa-panel");
    var fab = document.getElementById("oa-fab");
    var scrim = document.getElementById("oa-scrim");
    if (panel) panel.setAttribute("data-open", open ? "1" : "0");
    if (scrim) scrim.setAttribute("data-open", open ? "1" : "0");
    if (fab) fab.setAttribute("aria-expanded", open ? "true" : "false");
    announce(open ? t("announceOpen") : t("announceClosed"));
    if (open) {
      renderPanelBody();
      var closeBtn = document.getElementById("oa-close");
      if (closeBtn) closeBtn.focus();
    } else if (fab) {
      fab.focus();
    }
  }

  function togglePref(key) {
    state.prefs[key] = !state.prefs[key];
    if (key === "blindMode") {
      if (state.prefs.blindMode) {
        state.prefs.textSize = Math.max(state.prefs.textSize, 2);
        state.prefs.readableFont = true;
        state.prefs.highContrast = true;
        state.prefs.underlineLinks = true;
        state.prefs.reduceMotion = true;
        state.prefs.bigCursor = true;
        announce(t("announceBlindOn"));
      } else {
        announce(t("announceBlindOff"));
      }
    }
    applyPrefs();
    renderPanelBody();
  }

  function applyProfile(id) {
    if (id === "vision") {
      state.prefs.textSize = Math.max(state.prefs.textSize, 2);
      state.prefs.highContrast = true;
      state.prefs.bigCursor = true;
      state.prefs.underlineLinks = true;
    } else if (id === "dyslexia") {
      state.prefs.readableFont = true;
      state.prefs.lineHeight = true;
      state.prefs.letterSpacing = true;
      state.prefs.textSize = Math.max(state.prefs.textSize, 1);
    } else if (id === "motion") {
      state.prefs.reduceMotion = true;
      state.prefs.stopAnimations = true;
    } else if (id === "blind") {
      state.prefs.blindMode = true;
      state.prefs.textSize = Math.max(state.prefs.textSize, 2);
      state.prefs.readableFont = true;
      state.prefs.highContrast = true;
      state.prefs.underlineLinks = true;
      state.prefs.reduceMotion = true;
      state.prefs.bigCursor = true;
      announce(t("announceBlindOn"));
    }
    applyPrefs();
    renderPanelBody();
  }

  function resetAll() {
    Object.keys(state.prefs).forEach(function (k) {
      state.prefs[k] = typeof state.prefs[k] === "number" ? 0 : typeof state.prefs[k] === "string" ? "" : false;
    });
    applyPrefs();
    renderPanelBody();
  }

  // Keep utterance refs so Chrome does not GC them mid-speech.
  var speechQueue = [];
  var speechResumeTimer = null;

  function stopSpeech() {
    if (speechResumeTimer) {
      clearInterval(speechResumeTimer);
      speechResumeTimer = null;
    }
    speechQueue = [];
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  function pickVoice(lang) {
    if (!window.speechSynthesis || !window.speechSynthesis.getVoices) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    var want = String(lang || "en").toLowerCase();
    var base = want.slice(0, 2);
    var exact = null;
    var prefix = null;
    var english = null;
    for (var i = 0; i < voices.length; i++) {
      var code = String(voices[i].lang || "").toLowerCase();
      if (!exact && code === want) exact = voices[i];
      if (!prefix && code.indexOf(base) === 0) prefix = voices[i];
      if (!english && code.indexOf("en") === 0) english = voices[i];
    }
    return exact || prefix || english || voices[0];
  }

  function chunkText(text, size) {
    var chunks = [];
    var clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return chunks;
    var max = size || 180;
    var i = 0;
    while (i < clean.length) {
      var end = Math.min(i + max, clean.length);
      if (end < clean.length) {
        var slice = clean.slice(i, end);
        var breakAt = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("? "), slice.lastIndexOf("! "), slice.lastIndexOf(" "));
        if (breakAt > 40) end = i + breakAt + 1;
      }
      chunks.push(clean.slice(i, end).trim());
      i = end;
    }
    return chunks.filter(Boolean);
  }

  function speak(text) {
    if (!window.speechSynthesis) {
      announce(t("ttsUnavailable"));
      return;
    }
    var clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) {
      announce(t("ttsEmpty"));
      return;
    }

    stopSpeech();

    var lang = state.prefs.translateLang || state.lang || document.documentElement.lang || "en";
    var chunks = chunkText(clean, 200);
    var idx = 0;

    function speakNext() {
      if (idx >= chunks.length) {
        if (speechResumeTimer) {
          clearInterval(speechResumeTimer);
          speechResumeTimer = null;
        }
        return;
      }
      var u = new SpeechSynthesisUtterance(chunks[idx++]);
      u.lang = lang;
      var voice = pickVoice(lang);
      if (voice) u.voice = voice;
      u.rate = 1;
      u.pitch = 1;
      speechQueue.push(u);
      u.onend = function () {
        speakNext();
      };
      u.onerror = function () {
        speakNext();
      };
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(u);
      } catch (e) {
        announce(t("ttsUnavailable"));
      }
    }

    // Chrome: cancel() then immediate speak() often fails; voices may load async.
    setTimeout(function () {
      function start() {
        speakNext();
        speechResumeTimer = setInterval(function () {
          if (!window.speechSynthesis) return;
          if (!window.speechSynthesis.speaking) {
            clearInterval(speechResumeTimer);
            speechResumeTimer = null;
            return;
          }
          window.speechSynthesis.resume();
        }, 8000);
        announce(t("ttsStarted"));
      }
      if (window.speechSynthesis.getVoices && !window.speechSynthesis.getVoices().length) {
        var voiced = false;
        window.speechSynthesis.onvoiceschanged = function () {
          if (voiced) return;
          voiced = true;
          window.speechSynthesis.onvoiceschanged = null;
          start();
        };
        // Fallback if voiceschanged never fires
        setTimeout(function () {
          if (!voiced) {
            voiced = true;
            start();
          }
        }, 400);
        return;
      }
      start();
    }, 60);
  }

  function pageTextForSpeech() {
    var root = document.querySelector("main") || document.body;
    if (!root) return document.title || "";
    var clone = root.cloneNode(true);
    clone.querySelectorAll("#oa-root, #oa-guide, #oa-mask, script, style, noscript, [aria-hidden='true']").forEach(function (n) {
      n.remove();
    });
    return (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim();
  }

  function readSelection() {
    var sel = window.getSelection && String(window.getSelection());
    if (sel && sel.trim()) speak(sel.trim());
    else speak(pageTextForSpeech().slice(0, 1200) || document.title || "No selection");
  }

  function readPage() {
    speak(pageTextForSpeech().slice(0, 9000) || document.title || "No text");
  }

  function setTranslateStatus(msg, isError) {
    state.translateStatus = msg || "";
    state.translateError = !!isError;
    var elStatus = document.getElementById("oa-translate-status");
    if (elStatus) {
      elStatus.textContent = msg || "";
      elStatus.setAttribute("data-error", isError ? "1" : "0");
    }
  }

  function translatePage(tl) {
    if (!tl || state.translating) return;
    state.translating = true;
    setTranslateStatus(t("translating"), false);
    renderPanelBody();

    var nodes = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.tagName;
        if (/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|CODE|PRE|SVG|PATH)$/i.test(tag)) return NodeFilter.FILTER_REJECT;
        if (p.closest && (p.closest("#oa-root") || p.closest("#oa-guide") || p.closest("#oa-mask"))) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode() && nodes.length < 120) {
      nodes.push(walker.currentNode);
    }

    if (!nodes.length) {
      state.translating = false;
      setTranslateStatus(t("translateEmpty"), true);
      renderPanelBody();
      return;
    }

    var i = 0;
    var okCount = 0;
    var errMsg = "";

    function finish(error) {
      state.translating = false;
      if (error) {
        setTranslateStatus(error, true);
        announce(error);
      } else {
        setTranslateStatus(t("translateDone") + " (" + okCount + ")", false);
        announce(t("translateDone"));
      }
      renderPanelBody();
    }

    function next() {
      if (i >= nodes.length) {
        finish(okCount ? "" : errMsg || t("translateFailed"));
        return;
      }
      var node = nodes[i++];
      var original = String(node.nodeValue || "").trim();
      if (!original) {
        next();
        return;
      }
      setTranslateStatus(t("translating") + " " + i + "/" + nodes.length, false);

      fetch(API_BASE + "/translate.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ q: original.slice(0, 4500), tl: tl, sl: "auto" }),
      })
        .then(function (r) {
          return r.text().then(function (text) {
            var data = null;
            try {
              data = JSON.parse(text);
            } catch (e) {
              data = null;
            }
            return { httpOk: r.ok, data: data, raw: text };
          });
        })
        .then(function (res) {
          if (res.data && res.data.ok && res.data.translation) {
            node.nodeValue = res.data.translation;
            okCount++;
          } else {
            errMsg =
              (res.data && res.data.error) ||
              (res.httpOk ? t("translateFailed") : t("translateUnreachable"));
          }
        })
        .catch(function () {
          errMsg = t("translateUnreachable");
        })
        .finally(next);
    }
    next();
  }

  function lookupWord(word) {
    var out = document.getElementById("oa-dict-out");
    if (!out) return;
    out.textContent = "…";
    fetch(API_BASE + "/dictionary.php?word=" + encodeURIComponent(word), { headers: { Accept: "application/json" } })
      .then(function (r) {
        return r.json().then(function (d) {
          return { ok: r.ok && d.ok, d: d };
        });
      })
      .then(function (res) {
        if (res.ok) {
          var e = res.d.entry;
          out.textContent =
            e.word +
            " (" +
            (e.part_of_speech || "?") +
            "): " +
            e.definition +
            (e.example_sentence ? " — " + e.example_sentence : "");
        } else if (res.d.suggestions && res.d.suggestions.length) {
          out.textContent =
            "Try: " +
            res.d.suggestions
              .map(function (s) {
                return s.word;
              })
              .join(", ");
        } else {
          out.textContent = res.d.error || "Not found";
        }
      })
      .catch(function () {
        out.textContent = "Dictionary unavailable";
      });
  }

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function heading(iconName, label) {
    return (
      '<span class="oa-heading-ico">' +
      icon(iconName, 16) +
      "</span><span>" +
      label +
      "</span>"
    );
  }

  function btn(label, pressed, onClick, cls, iconName) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = cls || "oa-btn";
    b.innerHTML = (iconName ? icon(iconName, 16) : "") + "<span>" + label + "</span>";
    if (pressed !== null && pressed !== undefined) b.setAttribute("aria-pressed", pressed ? "true" : "false");
    b.addEventListener("click", onClick);
    return b;
  }

  function tile(label, key, iconName) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "oa-tile";
    b.setAttribute("aria-pressed", state.prefs[key] ? "true" : "false");
    b.innerHTML =
      '<span class="oa-tile-top">' +
      '<span class="oa-tile-ico">' +
      icon(iconName, 17) +
      "</span>" +
      '<span class="oa-tile-state">' +
      (state.prefs[key] ? t("on") : t("off")) +
      "</span></span>" +
      '<span class="oa-tile-label">' +
      label +
      "</span>";
    b.addEventListener("click", function () {
      togglePref(key);
    });
    return b;
  }

  function matchesSearch(label) {
    var q = (state.search || "").trim().toLowerCase();
    if (!q) return true;
    return String(label).toLowerCase().indexOf(q) !== -1;
  }

  function renderPanelBody() {
    var body = document.getElementById("oa-panel-body");
    if (!body) return;
    body.innerHTML = "";
    updateBadge();

    var profiles = el("div");
    profiles.appendChild(el("div", "oa-sec-label", icon("profiles", 14) + "<span>" + t("profiles") + "</span>"));
    var gridP = el("div", "oa-profiles");
    [
      ["vision", t("profileVision"), "visionLow"],
      ["dyslexia", t("profileDyslexia"), "dyslexia"],
      ["motion", t("profileMotion"), "motion"],
      ["blind", t("profileBlind"), "blind"],
    ].forEach(function (item) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "oa-profile";
      b.innerHTML =
        '<span class="oa-profile-ico">' + icon(item[2], 16) + "</span><span>" + item[1] + "</span>";
      b.addEventListener("click", function () {
        applyProfile(item[0]);
      });
      gridP.appendChild(b);
    });
    profiles.appendChild(gridP);
    if (!state.search) body.appendChild(profiles);

    var tab = state.tab || "text";

    function addTiles(items) {
      var grid = el("div", "oa-grid");
      var shown = 0;
      items.forEach(function (item) {
        if (!toolEnabled(item.key)) return;
        if (!matchesSearch(item.label)) return;
        grid.appendChild(tile(item.label, item.key, item.icon));
        shown++;
      });
      if (shown) body.appendChild(grid);
      return shown;
    }

    if (tab === "text") {
      if (toolEnabled("textSize") && matchesSearch(t("textSize"))) {
        var sizeBlock = el("div", "oa-block");
        sizeBlock.appendChild(el("h3", null, heading("size", t("textSize"))));
        var row = el("div", "oa-size");
        row.appendChild(
          btn(
            t("smaller"),
            null,
            function () {
              state.prefs.textSize = Math.max(-2, state.prefs.textSize - 1);
              applyPrefs();
              renderPanelBody();
            },
            "oa-btn",
            "smaller"
          )
        );
        var track = el("div", "oa-size-track");
        var fill = el("div", "oa-size-fill");
        fill.style.width = ((state.prefs.textSize + 2) / 7) * 100 + "%";
        track.appendChild(fill);
        row.appendChild(track);
        var val = el("span", "oa-size-val", String(state.prefs.textSize));
        row.appendChild(val);
        row.appendChild(
          btn(
            t("larger"),
            null,
            function () {
              state.prefs.textSize = Math.min(5, state.prefs.textSize + 1);
              applyPrefs();
              renderPanelBody();
            },
            "oa-btn",
            "larger"
          )
        );
        sizeBlock.appendChild(row);
        body.appendChild(sizeBlock);
      }

      addTiles([
        { key: "readableFont", label: t("readableFont"), icon: "font" },
        { key: "lineHeight", label: t("lineHeight"), icon: "height" },
        { key: "letterSpacing", label: t("letterSpacing"), icon: "letter" },
      ]);

      if (toolEnabled("textAlign") && matchesSearch(t("textAlign"))) {
        var align = el("div", "oa-block");
        align.appendChild(el("h3", null, heading("align", t("textAlign"))));
        var inline = el("div", "oa-inline");
        [
          ["", "—", "alignNone"],
          ["left", t("alignLeft"), "alignLeft"],
          ["center", t("alignCenter"), "alignCenter"],
          ["right", t("alignRight"), "alignRight"],
          ["justify", t("alignJustify"), "alignJustify"],
        ].forEach(function (pair) {
          inline.appendChild(
            btn(
              pair[1],
              state.prefs.textAlign === pair[0],
              function () {
                state.prefs.textAlign = pair[0];
                applyPrefs();
                renderPanelBody();
              },
              "oa-btn",
              pair[2]
            )
          );
        });
        align.appendChild(inline);
        body.appendChild(align);
      }
    }

    if (tab === "vision") {
      addTiles([
        { key: "highContrast", label: t("highContrast"), icon: "contrast" },
        { key: "darkContrast", label: t("darkContrast"), icon: "moon" },
        { key: "grayscale", label: t("grayscale"), icon: "gray" },
        { key: "saturation", label: t("saturation"), icon: "sat" },
        { key: "hideImages", label: t("hideImages"), icon: "eyeOff" },
      ]);
    }

    if (tab === "navigation") {
      addTiles([
        { key: "highlightLinks", label: t("highlightLinks"), icon: "highlight" },
        { key: "underlineLinks", label: t("underlineLinks"), icon: "underline" },
        { key: "reduceMotion", label: t("reduceMotion"), icon: "motion" },
        { key: "stopAnimations", label: t("stopAnimations"), icon: "pause" },
        { key: "bigCursor", label: t("bigCursor"), icon: "cursor" },
        { key: "readingGuide", label: t("readingGuide"), icon: "guide" },
        { key: "readingMask", label: t("readingMask"), icon: "mask" },
      ]);
    }

    if (tab === "assist") {
      if (toolEnabled("blindMode") && matchesSearch(t("blindMode"))) {
        var blind = el("div", "oa-block");
        blind.appendChild(el("h3", null, heading("blind", t("blindMode"))));
        blind.appendChild(el("p", "oa-help", t("blindHelp")));
        blind.appendChild(tile(t("blindMode"), "blindMode", "a11y"));
        body.appendChild(blind);
      }

      if (toolEnabled("tts") && matchesSearch(t("tts"))) {
        var tts = el("div", "oa-block");
        tts.appendChild(el("h3", null, heading("speak", t("tts"))));
        var ttsRow = el("div", "oa-inline");
        ttsRow.appendChild(btn(t("ttsPage"), null, readPage, "oa-btn oa-btn-primary", "play"));
        ttsRow.appendChild(btn(t("ttsSelection"), null, readSelection, "oa-btn", "speakSel"));
        ttsRow.appendChild(btn(t("ttsStop"), null, stopSpeech, "oa-btn", "stop"));
        tts.appendChild(ttsRow);
        body.appendChild(tts);
      }

      if (toolEnabled("translate") && matchesSearch(t("translate"))) {
        var tr = el("div", "oa-block");
        tr.appendChild(el("h3", null, heading("translate", t("translate"))));

        var uiField = el("div", "oa-field");
        uiField.appendChild(el("label", null, icon("lang", 14) + "<span>" + t("translateUi") + "</span>"));
        var sel = document.createElement("select");
        Object.keys(i18n).forEach(function (code) {
          var o = document.createElement("option");
          o.value = code;
          o.textContent = (LANG_NAMES[code] || code) + " (" + code.toUpperCase() + ")";
          if (state.lang === code) o.selected = true;
          sel.appendChild(o);
        });
        sel.addEventListener("change", function () {
          state.lang = sel.value;
          savePrefs();
          paintChrome();
          renderPanelBody();
        });
        uiField.appendChild(sel);
        tr.appendChild(uiField);

        var pageField = el("div", "oa-field");
        pageField.appendChild(el("label", null, icon("page", 14) + "<span>" + t("translatePage") + "</span>"));
        var sel2 = document.createElement("select");
        var langs =
          (state.settings && state.settings.languages) ||
          ["en", "es", "fr", "de", "pt", "it", "zh", "ja", "ko", "ru", "ar", "tr", "nl", "pl", "cs", "uk"];
        var opt0 = document.createElement("option");
        opt0.value = "";
        opt0.textContent = "—";
        sel2.appendChild(opt0);
        langs.forEach(function (code) {
          var o = document.createElement("option");
          o.value = code;
          o.textContent = (LANG_NAMES[code] || code) + " (" + code.toUpperCase() + ")";
          if (state.prefs.translateLang === code) o.selected = true;
          sel2.appendChild(o);
        });
        sel2.addEventListener("change", function () {
          state.prefs.translateLang = sel2.value;
          savePrefs();
        });
        pageField.appendChild(sel2);
        tr.appendChild(pageField);
        var goRow = el("div", "oa-inline");
        goRow.appendChild(
          btn(
            state.translating ? t("translating") : t("translateGo"),
            null,
            function () {
              if (!sel2.value) {
                setTranslateStatus(t("translatePick"), true);
                return;
              }
              state.prefs.translateLang = sel2.value;
              savePrefs();
              translatePage(sel2.value);
            },
            "oa-btn oa-btn-primary",
            "glint"
          )
        );
        tr.appendChild(goRow);
        var status = el("p", "oa-help");
        status.id = "oa-translate-status";
        status.textContent = state.translateStatus || (state.translating ? t("translating") : "");
        if (state.translateError) status.setAttribute("data-error", "1");
        tr.appendChild(status);
        body.appendChild(tr);
      }

      if (toolEnabled("dictionary") && matchesSearch(t("dictionary"))) {
        var dict = el("div", "oa-block");
        dict.appendChild(el("h3", null, heading("book", t("dictionary"))));
        var wrap = el("div", "oa-inline");
        var input = document.createElement("input");
        input.className = "oa-input";
        input.placeholder = t("dictPlaceholder");
        input.style.flex = "1";
        var go = btn(
          t("dictGo"),
          null,
          function () {
            lookupWord(input.value.trim());
          },
          "oa-btn oa-btn-primary",
          "lookup"
        );
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") lookupWord(input.value.trim());
        });
        wrap.appendChild(input);
        wrap.appendChild(go);
        dict.appendChild(wrap);
        var out = el("div");
        out.id = "oa-dict-out";
        dict.appendChild(out);
        body.appendChild(dict);
      }
    }

    if (!body.children.length) {
      body.appendChild(el("div", "oa-empty", icon("search", 28) + "<span>No matching tools</span>"));
    }
  }

  function paintChrome() {
    var brand = document.getElementById("oa-brand-name");
    var sub = document.getElementById("oa-sub");
    var close = document.getElementById("oa-close");
    var reset = document.getElementById("oa-reset");
    var search = document.getElementById("oa-search-input");
    if (brand) brand.textContent = t("brand");
    if (sub) sub.textContent = t("subtitle");
    if (close) close.setAttribute("aria-label", t("close"));
    if (reset) reset.setAttribute("aria-label", t("reset"));
    if (search) search.placeholder = t("search");
    var fab = document.getElementById("oa-fab");
    if (fab) fab.setAttribute("aria-label", t("title"));
    var resetFoot = document.getElementById("oa-reset-foot");
    if (resetFoot) resetFoot.innerHTML = icon("reset", 16) + "<span>" + t("reset") + "</span>";
    var powered = document.querySelector("#oa-panel .oa-foot a");
    if (powered) powered.innerHTML = icon("spark", 14) + "<span>" + t("powered") + "</span>";
    document.querySelectorAll("#oa-panel .oa-tab").forEach(function (tabEl) {
      var id = tabEl.getAttribute("data-tab");
      var labels = { text: t("text"), vision: t("vision"), navigation: t("navigation"), assist: t("assist") };
      var label = tabEl.querySelector(".oa-tab-label");
      if (label && labels[id]) label.textContent = labels[id];
      tabEl.setAttribute("aria-selected", state.tab === id ? "true" : "false");
    });
    updateBadge();
  }

  function buildUi(settings) {
    var accent = ATTR_ACCENT || settings.accent || "#0f6b5c";
    var pos = ATTR_POS || settings.position || "bottom-right";
    ensureFonts();
    injectStyles(accent);

    var root = document.createElement("div");
    root.id = "oa-root";
    root.setAttribute("data-oa-widget", "1");

    var live = document.createElement("div");
    live.id = "oa-live";
    live.setAttribute("aria-live", "polite");
    root.appendChild(live);

    var guide = document.createElement("div");
    guide.id = "oa-guide";
    guide.setAttribute("aria-hidden", "true");
    document.body.appendChild(guide);

    var mask = document.createElement("div");
    mask.id = "oa-mask";
    mask.setAttribute("aria-hidden", "true");
    document.body.appendChild(mask);

    document.addEventListener(
      "mousemove",
      function (e) {
        if (state.prefs.readingGuide) {
          guide.style.top = e.clientY + "px";
        }
        if (state.prefs.readingMask) {
          var band = 110;
          var top = Math.max(0, e.clientY - band / 2);
          var bot = Math.max(0, window.innerHeight - (top + band));
          mask.style.setProperty("--oa-mask-top", top + "px");
          mask.style.setProperty("--oa-mask-bot", bot + "px");
        }
      },
      { passive: true }
    );

    var scrim = document.createElement("div");
    scrim.id = "oa-scrim";
    scrim.setAttribute("data-open", "0");
    scrim.addEventListener("click", function () {
      setOpen(false);
    });

    var fab = document.createElement("button");
    fab.id = "oa-fab";
    fab.type = "button";
    fab.setAttribute("data-count", "0");
    fab.innerHTML = icon("a11y") + '<span id="oa-badge" class="oa-badge">0</span>';
    fab.querySelector("svg").classList.add("oa-fab-ico");
    fab.setAttribute("aria-haspopup", "dialog");
    fab.setAttribute("aria-expanded", "false");
    fab.addEventListener("click", function () {
      setOpen(!state.open);
    });

    var panel = document.createElement("div");
    panel.id = "oa-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "oa-brand-name");

    var head = el("div", "oa-head");
    var brandRow = el("div", "oa-brand-row");
    var brand = el("div", "oa-brand");
    brand.innerHTML =
      '<div class="oa-mark">' +
      icon("a11y") +
      '</div><div class="oa-brand-text"><p class="oa-brand-name" id="oa-brand-name"></p><p class="oa-sub" id="oa-sub"></p></div>';
    var headActions = el("div", "oa-head-actions");
    var reset = document.createElement("button");
    reset.type = "button";
    reset.id = "oa-reset";
    reset.className = "oa-icon-btn";
    reset.innerHTML = icon("reset");
    reset.addEventListener("click", resetAll);
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.id = "oa-close";
    closeBtn.className = "oa-icon-btn";
    closeBtn.innerHTML = icon("close");
    closeBtn.addEventListener("click", function () {
      setOpen(false);
    });
    headActions.appendChild(reset);
    headActions.appendChild(closeBtn);
    brandRow.appendChild(brand);
    brandRow.appendChild(headActions);
    head.appendChild(brandRow);

    var meta = el("div", "oa-meta");
    var chip = el("span", "oa-chip");
    chip.id = "oa-active-chip";
    chip.innerHTML = icon("active", 14) + "<span>0 " + t("toolsCount") + "</span>";
    var searchWrap = el("div", "oa-search");
    searchWrap.innerHTML = icon("search", 16);
    var searchInput = document.createElement("input");
    searchInput.id = "oa-search-input";
    searchInput.type = "search";
    searchInput.setAttribute("autocomplete", "off");
    searchInput.addEventListener("input", function () {
      state.search = searchInput.value;
      renderPanelBody();
    });
    searchWrap.appendChild(searchInput);
    meta.appendChild(chip);
    meta.appendChild(searchWrap);
    head.appendChild(meta);
    panel.appendChild(head);

    var tabs = el("div", "oa-tabs");
    tabs.setAttribute("role", "tablist");
    [
      ["text", "text"],
      ["vision", "eye"],
      ["navigation", "nav"],
      ["assist", "assist"],
    ].forEach(function (pair) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "oa-tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("data-tab", pair[0]);
      tab.innerHTML = icon(pair[1]) + '<span class="oa-tab-label"></span>';
      tab.addEventListener("click", function () {
        state.tab = pair[0];
        savePrefs();
        paintChrome();
        renderPanelBody();
      });
      tabs.appendChild(tab);
    });
    panel.appendChild(tabs);

    var body = el("div", "oa-scroll");
    body.id = "oa-panel-body";
    panel.appendChild(body);

    if (settings.branding !== false) {
      var foot = el("div", "oa-foot");
      foot.innerHTML =
        '<a href="https://openaccessible.com" target="_blank" rel="noopener">' +
        icon("spark", 14) +
        "<span>" +
        t("powered") +
        "</span></a><button type=\"button\" class=\"oa-btn\" id=\"oa-reset-foot\">" +
        icon("reset", 16) +
        "<span>" +
        t("reset") +
        "</span></button>";
      panel.appendChild(foot);
      foot.querySelector("#oa-reset-foot").addEventListener("click", resetAll);
    }

    root.appendChild(scrim);
    root.appendChild(fab);
    root.appendChild(panel);
    document.body.appendChild(root);

    positionUi(pos);
    paintChrome();
    renderPanelBody();
    applyPrefs();

    // Warm speech voices (Chrome loads them async)
    if (window.speechSynthesis && window.speechSynthesis.getVoices) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = function () {
        window.speechSynthesis.getVoices();
      };
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && state.open) setOpen(false);
    });
  }

  function pageLang() {
    var forced = String(ATTR_LANG || "").toLowerCase().split("-")[0];
    if (forced && i18n[forced]) return forced;
    var raw = (document.documentElement && document.documentElement.lang) || "";
    var code = String(raw).toLowerCase().split("-")[0];
    return i18n[code] ? code : "en";
  }

  function boot(settings) {
    state.settings = settings || {};
    state.lang = "de";
    loadPrefs();
    state.lang = "de";
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        buildUi(state.settings);
      });
    } else {
      buildUi(state.settings);
    }
  }

  function defaults() {
    return {
      position: "bottom-right",
      accent: "#0f6b5c",
      branding: true,
      languages: ["en", "es", "fr", "de", "pt", "it", "zh", "ja", "ko", "ru", "ar", "tr", "nl", "pl", "cs", "uk"],
      tools: {
        textSize: true,
        readableFont: true,
        lineHeight: true,
        letterSpacing: true,
        highContrast: true,
        darkContrast: true,
        grayscale: true,
        saturation: true,
        highlightLinks: true,
        underlineLinks: true,
        reduceMotion: true,
        bigCursor: true,
        readingGuide: true,
        readingMask: true,
        hideImages: true,
        stopAnimations: true,
        textAlign: true,
        tts: true,
        translate: true,
        blindMode: true,
        dictionary: true,
      },
    };
  }

  if (!SITE) {
    boot(defaults());
    return;
  }

  fetch(API_BASE + "/site.php?token=" + encodeURIComponent(SITE), { headers: { Accept: "application/json" } })
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      if (data && data.ok && data.settings) boot(data.settings);
      else boot(defaults());
    })
    .catch(function () {
      boot(defaults());
    });
})();
