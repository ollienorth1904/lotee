/* Lotería del Horror Moderno 2.0 ("lotee") - MIT License. Vanilla JS, no dependencies, works offline. */
(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var app = $('#app');
var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- settings ---------- */
var DEF = { lang: 'es', voice: true, sfx: true, drone: false, auto: false, speed: 'normal', calm: reduceMotion };
var S = Object.assign({}, DEF);
try { Object.assign(S, JSON.parse(localStorage.getItem('lotee.settings') || '{}')); } catch (e) {}
function save() { try { localStorage.setItem('lotee.settings', JSON.stringify(S)); } catch (e) {} applyCalm(); }
function applyCalm() { document.body.classList.toggle('calm', !!S.calm); }
var SPEEDS = { manual: 0, slow: 9000, normal: 6000, fast: 3500 };

/* ---------- strings ---------- */
var T = {
 es: { sub:'del Horror Moderno', solo:'Jugar contra rivales', pass:'Pasa y juega', caller:'Modo Cantor', baraja:'La Baraja', rules:'Cómo se juega', settings:'Ajustes',
  install:'Instalar en el teléfono', iosHint:'En iPhone: Compartir ⎋ → “Agregar a inicio”.', offline:'Funciona sin internet. Sin anuncios, sin rastreo.',
  setupSolo:'Contra rivales', setupPass:'Pasa y juega', pattern:'Figura para ganar', tabla:'Tu tabla', random:'Al azar', rivals:'Rivales', players:'Jugadores',
  names:'Nombres', speed:'Velocidad del cantor', manual:'Manual', slow:'Lento', normal:'Normal', fast:'Rápido', automark:'Marcado automático',
  start:'¡Empezar!', back:'Volver', next:'Siguiente', pause:'Pausa', play:'Seguir', lot:'¡Lotería!', called:'cantadas', of:'de',
  waiting:'Toca “Siguiente” para la primera carta', ready:'¡Ya llenaste! Grita lotería', menu:'Menú', resume:'Seguir jugando', restart:'Otra ronda', quit:'Salir al inicio',
  falseClaim:'¡Falsa lotería! Aviso: a la segunda quedas fuera.', outRound:'¡Fuera de la ronda por falsas loterías!', youWin:'¡Ganaste!', wins:'ganó',
  winCard:'Con la carta', deckEnd:'Se acabó la baraja.', voice:'Voz del cantor', sfx:'Efectos de sonido', drone:'Zumbido de ambiente', calm:'Menos efectos (sin parpadeo)',
  language:'Idioma', close:'Cerrar', undo:'Deshacer', shuffle:'Barajar de nuevo', verify:'Verificar tabla', fullscreen:'Pantalla completa',
  verifyTitle:'¿Qué tabla gritó?', verifyOk:'¡Buena! Completó', verifyNo:'Todavía no completa ninguna figura.', twist:'El giro', story:'La historia', trad:'Carta tradicional',
  grito:'Grito', you:'Tú', player:'Jugador', turnOf:'Tablero de', away:'le falta 1', out:'fuera', strikes:'avisos', newRound:'Nueva ronda', callerStart:'Toca “Siguiente” para cantar la primera carta.',
  pats:{ row:'Línea (fila)', col:'Columna', diag:'Diagonal', corners:'Cuatro esquinas', centro:'Centro', llena:'Llena' },
  cardsLeft:'quedan', printed:'Tablas impresas 1–12', randomBoards:'Tablas al azar', ai:'rival', soundOn:'Sonido', backToGame:'Volver al juego'
 },
 en: { sub:'of Modern Horror', solo:'Play vs. rivals', pass:'Pass & play', caller:'Caller mode', baraja:'The Deck', rules:'How to play', settings:'Settings',
  install:'Install on your phone', iosHint:'On iPhone: Share ⎋ → “Add to Home Screen”.', offline:'Works offline. No ads, no tracking.',
  setupSolo:'Versus rivals', setupPass:'Pass & play', pattern:'Winning pattern', tabla:'Your tabla', random:'Random', rivals:'Rivals', players:'Players',
  names:'Names', speed:'Caller speed', manual:'Manual', slow:'Slow', normal:'Normal', fast:'Fast', automark:'Auto-mark assist',
  start:'Start!', back:'Back', next:'Next card', pause:'Pause', play:'Resume', lot:'¡Lotería!', called:'called', of:'of',
  waiting:'Tap “Next card” for the first card', ready:'Pattern complete! Shout lotería', menu:'Menu', resume:'Keep playing', restart:'New round', quit:'Back to title',
  falseClaim:'False lotería! Warning: a second one puts you out.', outRound:'Out for this round for false claims!', youWin:'You win!', wins:'wins',
  winCard:'On the card', deckEnd:'The deck is empty.', voice:'Caller voice', sfx:'Sound effects', drone:'Ambient drone', calm:'Fewer effects (no flicker)',
  language:'Language', close:'Close', undo:'Undo', shuffle:'Reshuffle', verify:'Check a tabla', fullscreen:'Full screen',
  verifyTitle:'Which tabla called it?', verifyOk:'Good! It completes', verifyNo:'No pattern completed yet.', twist:'The twist', story:'The story', trad:'Traditional card',
  grito:'Grito', you:'You', player:'Player', turnOf:'Board of', away:'1 to go', out:'out', strikes:'strikes', newRound:'New round', callerStart:'Tap “Next card” to call the first card.',
  pats:{ row:'Line (row)', col:'Column', diag:'Diagonal', corners:'Four corners', centro:'Center', llena:'Full board' },
  cardsLeft:'left', printed:'Printed tablas 1–12', randomBoards:'Random tablas', ai:'rival', soundOn:'Sound', backToGame:'Back to game'
 }
};
function t(k) { var d = T[S.lang] || T.es; return d[k] != null ? d[k] : T.es[k]; }
function patName(p) { return t('pats')[p]; }

/* ---------- patterns ---------- */
var PAT = {
 row: [[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15]],
 col: [[0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15]],
 diag: [[0,5,10,15],[3,6,9,12]],
 corners: [[0,3,12,15]],
 centro: [[5,6,9,10]],
 llena: [[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]]
};
var PAT_KEYS = ['row','col','diag','corners','centro','llena'];
var PAT_ICON = { row:[4,5,6,7], col:[2,6,10,14], diag:[0,5,10,15], corners:[0,3,12,15], centro:[5,6,9,10], llena:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] };
function winLine(covered, pat) { var L = PAT[pat]; for (var i = 0; i < L.length; i++) { if (L[i].every(function (c) { return covered.has(c); })) return L[i]; } return null; }
function missing(covered, pat) { var best = 99; PAT[pat].forEach(function (l) { var m = l.filter(function (c) { return !covered.has(c); }).length; if (m < best) best = m; }); return best; }
function patSvg(cells) {
 var s = '<svg viewBox="0 0 40 40" aria-hidden="true">';
 for (var i = 0; i < 16; i++) { var x = (i % 4) * 10, y = Math.floor(i / 4) * 10; s += '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="8" height="8" rx="1.5" fill="' + (cells.indexOf(i) >= 0 ? '#f08a1c' : 'rgba(241,228,199,.25)') + '"/>'; }
 return s + '</svg>';
}
var BEAN = '<svg class="bean" viewBox="0 0 50 39" aria-hidden="true"><ellipse cx="25" cy="21" rx="23" ry="16" fill="#000" opacity=".35"/><path d="M6 19c0-9 9-16 20-16 12 0 19 7 18 15-1 6-5 7-9 6-4-1-6 2-8 6-3 5-8 7-13 5C8 33 6 26 6 19z" fill="#7b4a2b"/><path d="M10 16c2-6 8-10 15-10" stroke="#e3b48a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><circle cx="18" cy="22" r="2" fill="#4a2a17"/><circle cx="30" cy="14" r="1.6" fill="#4a2a17"/><circle cx="24" cy="27" r="1.4" fill="#4a2a17"/></svg>';

/* ---------- data ---------- */
var DATA = null, CARD = {};
function cardImg(n) { return CARD[n].img; }
function thumb(n) { return CARD[n].thumb; }
function shuffle(a, rnd) { rnd = rnd || Math.random; a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
function allNums() { return DATA.cards.map(function (c) { return c.n; }); }
function randomTabla() { return shuffle(allNums()).slice(0, 16); }
function gritoOf(n) { var c = CARD[n]; return S.lang === 'en' ? c.grito_en : c.grito_es; }
function gritoAlt(n) { var c = CARD[n]; return S.lang === 'en' ? c.grito_es : c.grito_en; }

/* ---------- audio (WebAudio, generated; unlocked on first tap for iOS) ---------- */
var AC = null, droneNodes = null, unlocked = false;
function quiet(p) { if (p && p.catch) p.catch(function () {}); }
function ac() { if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } return AC; }
function unlock() {
 if (unlocked) return; unlocked = true;
 try { var c = ac(); if (c) { if (c.state === 'suspended') quiet(c.resume()); var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } } catch (e) {}
 try { if (window.speechSynthesis) { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {}
 if (S.drone) startDrone();
}
['pointerdown', 'touchend', 'keydown', 'click'].forEach(function (ev) { document.addEventListener(ev, unlock, { capture: true, passive: true }); });
document.addEventListener('visibilitychange', function () {
 if (!AC) return;
 if (document.hidden) { AC.suspend && quiet(AC.suspend()); if (window.speechSynthesis) speechSynthesis.cancel(); } else if (AC.resume) quiet(AC.resume());
});
function chime() {
 if (!S.sfx) return; var c = ac(); if (!c || c.state !== 'running') return;
 var now = c.currentTime, g = c.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.07, now + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4); g.connect(c.destination);
 [523.25, 784.0, 1046.5].forEach(function (f, i) { var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * (1 + i * 0.002); var og = c.createGain(); og.gain.value = [1, .5, .25][i]; o.connect(og); og.connect(g); o.start(now); o.stop(now + 1.5); });
}
function thud(bad) {
 if (!S.sfx) return; var c = ac(); if (!c || c.state !== 'running') return;
 var now = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = bad ? 'sawtooth' : 'triangle';
 o.frequency.setValueAtTime(bad ? 140 : 220, now); o.frequency.exponentialRampToValueAtTime(bad ? 55 : 110, now + (bad ? .5 : .12));
 g.gain.setValueAtTime(bad ? .12 : .09, now); g.gain.exponentialRampToValueAtTime(0.0001, now + (bad ? .55 : .15)); o.connect(g); g.connect(c.destination); o.start(now); o.stop(now + .6);
}
function fanfare() {
 if (!S.sfx) return; var c = ac(); if (!c || c.state !== 'running') return; var now = c.currentTime;
 [392, 523.25, 659.25, 784, 1046.5].forEach(function (f, i) { var o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; var s = now + i * .11; g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(.08, s + .02); g.gain.exponentialRampToValueAtTime(0.0001, s + .9); o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + 1); });
}
function startDrone() {
 var c = ac(); if (!c || droneNodes) return; if (c.state === 'suspended') quiet(c.resume());
 var now = c.currentTime, master = c.createGain(); master.gain.setValueAtTime(0.0001, now); master.gain.exponentialRampToValueAtTime(0.05, now + 3);
 var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 6; lp.connect(master); master.connect(c.destination);
 var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 120; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
 var oscs = [[55, 'sawtooth', .5], [55.6, 'sawtooth', .5], [82.4, 'sine', .35], [41.2, 'sine', .6]].map(function (d) { var o = c.createOscillator(), g = c.createGain(); o.type = d[1]; o.frequency.value = d[0]; g.gain.value = d[2]; o.connect(g); g.connect(lp); o.start(); return o; });
 droneNodes = { master: master, oscs: oscs.concat([lfo]) };
}
function stopDrone() {
 if (!droneNodes || !AC) return; var d = droneNodes; droneNodes = null; var now = AC.currentTime;
 d.master.gain.cancelScheduledValues(now); d.master.gain.setValueAtTime(d.master.gain.value, now); d.master.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
 setTimeout(function () { d.oscs.forEach(function (o) { try { o.stop(); } catch (e) {} }); }, 1400);
}

/* ---------- voice (built-in speechSynthesis) ---------- */
var voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function pickVoice(lang) {
 if (!voices.length) loadVoices();
 var pref = lang === 'es' ? ['es-MX', 'es-US', 'es-419', 'es'] : ['en-US', 'en-GB', 'en'];
 for (var i = 0; i < pref.length; i++) { var p = pref[i].toLowerCase(); var v = voices.find(function (v) { return v.lang && v.lang.replace('_', '-').toLowerCase().indexOf(p) === 0; }); if (v) return v; }
 return null;
}
function say(text, lang, rate) {
 if (!S.voice || !window.speechSynthesis) return;
 try { var u = new SpeechSynthesisUtterance(text); var v = pickVoice(lang); if (v) u.voice = v; u.lang = v ? v.lang : (lang === 'es' ? 'es-MX' : 'en-US'); u.rate = rate || 0.95; u.pitch = 0.9; speechSynthesis.speak(u); } catch (e) {}
}
function sing(n) {
 if (!S.voice || !window.speechSynthesis) return; try { speechSynthesis.cancel(); } catch (e) {}
 say(gritoOf(n), S.lang, 0.95); say(CARD[n].name, 'es', 0.9);
}

/* ---------- wake lock (keeps phone screen on while playing) ---------- */
var wake = null;
function keepAwake(on) {
 try { if (on && 'wakeLock' in navigator && !wake) navigator.wakeLock.request('screen').then(function (w) { wake = w; w.addEventListener('release', function () { wake = null; }); }).catch(function () {});
  if (!on && wake) { wake.release(); wake = null; } } catch (e) {}
}

/* ---------- toast ---------- */
var toastT = 0;
function toast(msg, bad) { var el = $('#toast'); el.textContent = msg; el.className = 'on' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(function () { el.className = ''; }, 2600); }

/* ---------- modal ---------- */
var modalClose = null;
function openModal(html, onClose, cls) {
 closeModal(true);
 var m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
 m.innerHTML = '<div class="sheet ' + (cls || '') + '">' + html + '</div>';
 m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
 document.body.appendChild(m); modalClose = onClose || null;
 var f = m.querySelector('[data-close], button'); if (f) try { f.focus({ preventScroll: true }); } catch (e) {}
 $$('[data-close]', m).forEach(function (b) { b.addEventListener('click', function () { closeModal(); }); });
 pauseAuto(true);
 return m;
}
function closeModal(silent) {
 var m = $('.modal'); if (!m) return false; m.remove(); var cb = modalClose; modalClose = null; if (!silent && cb) cb(); if (!silent) pauseAuto(false); return true;
}
function cardModal(n) {
 var c = CARD[n];
 openModal('<button class="icon-btn close" data-close aria-label="' + t('close') + '">✕</button>' +
  '<img class="bigcard" src="' + c.img + '" alt="' + esc(c.n + '. ' + c.name) + '">' +
  '<h2 style="text-align:center">' + c.n + '. ' + esc(c.name) + '</h2>' +
  '<dl class="cardinfo"><dt>' + t('grito') + '</dt><dd><i>“' + esc(gritoOf(n)) + '”</i><br><small style="opacity:.7">' + esc(gritoAlt(n)) + '</small></dd>' +
  (c.traditional !== c.name ? '<dt>' + t('trad') + '</dt><dd>' + esc(c.traditional) + '</dd>' : '') +
  '<dt>' + t('twist') + '</dt><dd>' + esc(c.twist) + '</dd><dt>' + t('story') + '</dt><dd>' + esc(c.story) + '</dd></dl>');
}

/* ---------- navigation (Android back button closes modal / returns) ---------- */
var current = 'title';
function go(name, arg) {
 closeModal(true); stopTimers();
 if (name !== 'game' && name !== 'caller') keepAwake(false);
 if (current === 'title' && name !== 'title') { try { history.pushState({ s: name }, ''); } catch (e) {} }
 current = name; SCREENS[name](arg); window.scrollTo(0, 0);
}
window.addEventListener('popstate', function () {
 if (closeModal()) { try { history.pushState({ s: current }, ''); } catch (e) {} return; }
 if (current !== 'title') { current = 'title'; stopTimers(); keepAwake(false); SCREENS.title(); }
});

/* ---------- title ---------- */
var deferredInstall = null;
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; if (current === 'title') SCREENS.title(); });
var isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

var SCREENS = {};
SCREENS.title = function () {
 app.innerHTML = '<section class="screen title"><div class="title-inner">' +
  '<div class="title-fan" aria-hidden="true"><img src="assets/cards/back.webp" alt=""><img src="' + cardImg(14) + '" alt=""><img src="' + cardImg(1) + '" alt=""></div>' +
  '<h1 class="title-logo">Lotería</h1><div class="title-sub">' + t('sub') + ' <b>2.0</b></div>' +
  '<nav class="menu">' +
  '<button class="btn mari" data-go="solo">🂠 ' + t('solo') + '</button>' +
  '<button class="btn" data-go="pass">👥 ' + t('pass') + '</button>' +
  '<button class="btn" data-go="caller">📣 ' + t('caller') + '</button>' +
  '<div class="row" style="justify-content:stretch"><button class="btn ghost" style="flex:1" data-go="baraja">' + t('baraja') + '</button><button class="btn ghost" style="flex:1" data-go="rules">' + t('rules') + '</button></div>' +
  '<button class="btn ghost" data-act="settings">⚙ ' + t('settings') + '</button>' +
  (deferredInstall ? '<button class="btn gold" data-act="install">⬇ ' + t('install') + '</button>' : '') +
  '</nav>' +
  '<div class="lang" role="group" aria-label="' + t('language') + '"><button class="chip" data-lang="es" aria-pressed="' + (S.lang === 'es') + '">Español</button><button class="chip" data-lang="en" aria-pressed="' + (S.lang === 'en') + '">English</button></div>' +
  (isIOS && !standalone ? '<p class="foot">' + t('iosHint') + '</p>' : '') +
  '<p class="foot">' + t('offline') + '</p>' +
  '</div></section>';
 bindCommon();
 $$('[data-lang]').forEach(function (b) { b.onclick = function () { S.lang = b.dataset.lang; document.documentElement.lang = S.lang; save(); SCREENS.title(); }; });
 var ib = $('[data-act="install"]'); if (ib) ib.onclick = function () { deferredInstall.prompt(); deferredInstall.userChoice.finally(function () { deferredInstall = null; SCREENS.title(); }); };
};
function bindCommon(root) {
 $$('[data-go]', root).forEach(function (b) { b.onclick = function () { var g = b.dataset.go; if (g === 'solo' || g === 'pass') go('setup', g); else go(g); }; });
 $$('[data-act="settings"]', root).forEach(function (b) { b.onclick = settingsModal; });
}

/* ---------- settings ---------- */
function toggleRow(key, label) { return '<button class="btn ghost" style="width:100%;justify-content:space-between;display:flex;align-items:center;margin:6px 0" data-tog="' + key + '" aria-pressed="' + !!S[key] + '"><span>' + label + '</span><span>' + (S[key] ? 'ON' : 'OFF') + '</span></button>'; }
function settingsModal() {
 var m = openModal('<button class="icon-btn close" data-close aria-label="' + t('close') + '">✕</button><h2>' + t('settings') + '</h2>' +
  '<h3>' + t('language') + '</h3><div class="opts"><button class="chip" data-lang="es" aria-pressed="' + (S.lang === 'es') + '">Español</button><button class="chip" data-lang="en" aria-pressed="' + (S.lang === 'en') + '">English</button></div>' +
  '<h3>' + t('soundOn') + '</h3>' + toggleRow('voice', '🗣 ' + t('voice')) + toggleRow('sfx', '🔔 ' + t('sfx')) + toggleRow('drone', '〰 ' + t('drone')) +
  '<h3>' + t('speed') + '</h3><div class="opts">' + ['manual', 'slow', 'normal', 'fast'].map(function (k) { return '<button class="chip" data-speed="' + k + '" aria-pressed="' + (S.speed === k) + '">' + t(k) + '</button>'; }).join('') + '</div>' +
  '<h3>⚙</h3>' + toggleRow('auto', '✋ ' + t('automark')) + toggleRow('calm', '🕯 ' + t('calm')), function () { rerender(); });
 $$('[data-tog]', m).forEach(function (b) { b.onclick = function () { var k = b.dataset.tog; S[k] = !S[k]; save(); b.setAttribute('aria-pressed', S[k]); b.lastChild.textContent = S[k] ? 'ON' : 'OFF';
  if (k === 'drone') { S.drone ? startDrone() : stopDrone(); } if (k === 'voice' && !S.voice && window.speechSynthesis) speechSynthesis.cancel(); if (k === 'auto' && S.auto && G && !G.over) autoMarkAll(); }; });
 $$('[data-lang]', m).forEach(function (b) { b.onclick = function () { S.lang = b.dataset.lang; document.documentElement.lang = S.lang; save(); closeModal(); settingsModal(); }; });
 $$('[data-speed]', m).forEach(function (b) { b.onclick = function () { S.speed = b.dataset.speed; save(); $$('[data-speed]', m).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }; });
}
function rerender() { if (current === 'title') SCREENS.title(); else if (current === 'game') renderGame(); else if (current === 'caller') renderCaller(); else if (current === 'baraja') SCREENS.baraja(); else if (current === 'rules') SCREENS.rules(); else if (current === 'setup') SCREENS.setup(SETUP.mode); }

/* ---------- setup ---------- */
var AI_NAMES = [['Doña Ánima', '🕯'], ['Don Calaca', '💀'], ['La Comadre Niebla', '🌫'], ['El Tío Tecolote', '🦉'], ['La Tejedora', '🕷']];
var SETUP = { mode: 'solo', pattern: 'row', tabla: 1, rivals: 2, players: 2, names: [], prand: false, privals: 0 };
SCREENS.setup = function (mode) {
 SETUP.mode = mode || SETUP.mode; var solo = SETUP.mode === 'solo';
 var tablas = '';
 if (solo) {
  tablas = '<h3>' + t('tabla') + '</h3><div class="tablas">' + DATA.tablas.map(function (b, i) {
   return '<button class="tpick" data-tabla="' + (i + 1) + '" aria-pressed="' + (SETUP.tabla === i + 1) + '" aria-label="Tabla ' + (i + 1) + '"><div class="mini">' + b.map(function (n) { return '<img loading="lazy" src="' + thumb(n) + '" alt="">'; }).join('') + '</div><div class="lbl">Tabla ' + (i + 1) + '</div></button>';
  }).join('') + '<button class="tpick rand" data-tabla="0" aria-pressed="' + (SETUP.tabla === 0) + '"><div class="mini">🎲</div><div class="lbl">' + t('random') + '</div></button></div>';
 }
 var ppl = '';
 if (!solo) {
  ppl = '<h3>' + t('players') + '</h3><div class="stepper"><button class="icon-btn" data-step="players:-1" aria-label="−">−</button><output>' + SETUP.players + '</output><button class="icon-btn" data-step="players:1" aria-label="+">+</button></div>' +
   '<h3>' + t('names') + '</h3><div class="players">' + Array.from({ length: SETUP.players }, function (_, i) { return '<input data-name="' + i + '" maxlength="16" autocomplete="off" value="' + esc(SETUP.names[i] || (t('player') + ' ' + (i + 1))) + '" aria-label="' + t('player') + ' ' + (i + 1) + '">'; }).join('') + '</div>' +
   '<h3>' + t('tabla') + '</h3><div class="opts"><button class="chip" data-prand="0" aria-pressed="' + !SETUP.prand + '">' + t('printed') + '</button><button class="chip" data-prand="1" aria-pressed="' + SETUP.prand + '">' + t('randomBoards') + '</button></div>';
 }
 var rk = solo ? 'rivals' : 'privals', rmin = solo ? 1 : 0, rmax = solo ? 5 : 4;
 app.innerHTML = '<section class="screen"><header class="topbar"><button class="icon-btn" data-act="back" aria-label="' + t('back') + '">←</button><div class="ttl">' + (solo ? t('setupSolo') : t('setupPass')) + '</div><button class="icon-btn" data-act="settings" aria-label="' + t('settings') + '">⚙</button></header>' +
  '<div class="scroll"><h3>' + t('pattern') + '</h3><div class="opts">' + PAT_KEYS.map(function (p) { return '<button class="chip pat" data-pat="' + p + '" aria-pressed="' + (SETUP.pattern === p) + '">' + patSvg(PAT_ICON[p]) + patName(p) + '</button>'; }).join('') + '</div>' +
  ppl + tablas +
  '<h3>' + t('rivals') + '</h3><div class="stepper"><button class="icon-btn" data-step="' + rk + ':-1" aria-label="−">−</button><output>' + SETUP[rk] + '</output><button class="icon-btn" data-step="' + rk + ':1" aria-label="+">+</button>' +
  '<span style="opacity:.75;font-size:.9rem">' + AI_NAMES.slice(0, SETUP[rk]).map(function (a) { return a[1]; }).join(' ') + '</span></div>' +
  '<h3>' + t('speed') + '</h3><div class="opts">' + ['manual', 'slow', 'normal', 'fast'].map(function (k) { return '<button class="chip" data-speed="' + k + '" aria-pressed="' + (S.speed === k) + '">' + t(k) + '</button>'; }).join('') + '</div>' +
  '<h3>' + t('automark') + '</h3><div class="opts"><button class="chip" data-auto aria-pressed="' + !!S.auto + '">' + (S.auto ? 'ON' : 'OFF') + '</button></div>' +
  '</div><div class="startbar"><button class="btn mari" data-act="start">' + t('start') + '</button></div></section>';
 bindCommon();
 $('[data-act="back"]').onclick = function () { history.back(); };
 $$('[data-pat]').forEach(function (b) { b.onclick = function () { SETUP.pattern = b.dataset.pat; $$('[data-pat]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }; });
 $$('[data-tabla]').forEach(function (b) { b.onclick = function () { SETUP.tabla = +b.dataset.tabla; $$('[data-tabla]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }; });
 $$('[data-speed]').forEach(function (b) { b.onclick = function () { S.speed = b.dataset.speed; save(); $$('[data-speed]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }; });
 $$('[data-prand]').forEach(function (b) { b.onclick = function () { SETUP.prand = b.dataset.prand === '1'; $$('[data-prand]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }; });
 var ab = $('[data-auto]'); ab.onclick = function () { S.auto = !S.auto; save(); ab.setAttribute('aria-pressed', S.auto); ab.textContent = S.auto ? 'ON' : 'OFF'; };
 $$('[data-name]').forEach(function (inp) { inp.oninput = function () { SETUP.names[+inp.dataset.name] = inp.value; }; });
 $$('[data-step]').forEach(function (b) { b.onclick = function () { var p = b.dataset.step.split(':'), k = p[0], d = +p[1]; var lim = { rivals: [1, 5], privals: [0, 4], players: [2, 6] }[k]; SETUP[k] = Math.max(lim[0], Math.min(lim[1], SETUP[k] + d)); var y = $('.scroll').scrollTop; SCREENS.setup(SETUP.mode); $('.scroll').scrollTop = y; }; });
 $('[data-act="start"]').onclick = function () { newGame(); };
};

/* ---------- game engine ---------- */
var G = null, autoT = 0;
function makePlayer(name, human, board, av) { return { name: name, human: human, board: board, marks: new Set(), strikes: 0, out: false, pend: 0, av: av || '🙂' }; }
function newGame(sameConfig) {
 closeModal(true); stopTimers();
 var solo = SETUP.mode === 'solo', players = [], used = [];
 if (solo) {
  var b = SETUP.tabla ? DATA.tablas[SETUP.tabla - 1].slice() : randomTabla(); if (SETUP.tabla) used.push(SETUP.tabla - 1);
  players.push(makePlayer(t('you'), true, b, '🫘'));
 } else {
  var order = shuffle(DATA.tablas.map(function (_, i) { return i; }));
  for (var i = 0; i < SETUP.players; i++) { var tb = SETUP.prand ? randomTabla() : DATA.tablas[order[i]].slice(); if (!SETUP.prand) used.push(order[i]); var nm = (SETUP.names[i] || '').trim() || (t('player') + ' ' + (i + 1)); var p = makePlayer(nm, true, tb, String(i + 1)); p.tablaNo = SETUP.prand ? 0 : order[i] + 1; players.push(p); }
 }
 var nr = solo ? SETUP.rivals : SETUP.privals;
 var free = shuffle(DATA.tablas.map(function (_, i) { return i; }).filter(function (i) { return used.indexOf(i) < 0; }));
 for (var r = 0; r < nr; r++) { var bb = free.length ? DATA.tablas[free.pop()].slice() : randomTabla(); players.push(makePlayer(AI_NAMES[r][0], false, bb, AI_NAMES[r][1])); }
 if (solo && !SETUP.tabla) players[0].tablaNo = 0; else if (solo) players[0].tablaNo = SETUP.tabla;
 G = { mode: SETUP.mode, pattern: SETUP.pattern, deck: shuffle(allNums()), drawn: [], called: new Set(), players: players, active: 0, over: false, paused: false, winner: null, line: null, started: false };
 current = 'game'; keepAwake(true); renderGame();
}
function stopTimers() { clearTimeout(autoT); autoT = 0; if (G) G.players.forEach(function (p) { clearTimeout(p.pend); p.pend = 0; }); if (C) { clearTimeout(C.timer); C.timer = 0; } }
function anyPending() { return G.players.some(function (p) { return p.pend; }); }
function scheduleAuto() {
 clearTimeout(autoT); autoT = 0; var ms = SPEEDS[S.speed];
 if (!G || G.over || !ms || G.paused || !G.started || $('.modal') || current !== 'game') return;
 autoT = setTimeout(function () { autoT = 0; if (anyPending()) { autoT = setTimeout(scheduleAuto, 800); return; } draw(); }, ms);
}
function pauseAuto(p) {
 if (current === 'game' && G) { if (p) { clearTimeout(autoT); autoT = 0; } else scheduleAuto(); }
 if (current === 'caller' && C) { if (p) { clearTimeout(C.timer); C.timer = 0; } else callerAuto(); }
}
function coveredOf(p) { var s = new Set(); p.marks.forEach(function (i) { if (G.called.has(p.board[i])) s.add(i); }); return s; }
function draw() {
 if (!G || G.over) return;
 if (!G.deck.length) { toast(t('deckEnd')); return; }
 G.started = true;
 var n = G.deck.pop(); G.drawn.push(n); G.called.add(n);
 showCall(n, true); sing(n); chime();
 G.players.forEach(function (p, pi) {
  var i = p.board.indexOf(n); if (i < 0) return;
  if (!p.human) p.marks.add(i); else if (S.auto && !p.out) { p.marks.add(i); }
 });
 G.players.forEach(function (p) {
  if (p.human || p.out || p.pend) return;
  if (winLine(coveredOf(p), G.pattern)) { var base = { manual: 2600, slow: 3200, normal: 2400, fast: 1700 }[S.speed] || 2400; p.pend = setTimeout(function () { p.pend = 0; claim(p); }, base + Math.random() * 1200); }
 });
 updateBoard(); updateHistory(); updateRivals(); updateClaimHint(); updateCounter();
 if (!G.deck.length) setTimeout(function () { if (!G.over) toast(t('deckEnd')); }, 1500);
 scheduleAuto();
}
function autoMarkAll() { G.players.forEach(function (p) { if (p.human && !p.out) p.board.forEach(function (n, i) { if (G.called.has(n)) p.marks.add(i); }); }); updateBoard(); updateRivals(); updateClaimHint(); }
function claim(p) {
 if (!G || G.over || p.out) return;
 var line = winLine(coveredOf(p), G.pattern);
 if (line) { finish(p, line); return; }
 p.strikes++; thud(true);
 var bad = []; p.marks.forEach(function (i) { if (!G.called.has(p.board[i])) bad.push(i); });
 if (p.strikes >= 2) { p.out = true; toast((G.mode === 'pass' ? p.name + ': ' : '') + t('outRound'), true); }
 else toast((G.mode === 'pass' ? p.name + ': ' : '') + t('falseClaim'), true);
 updateBoard(bad); updateRivals();
 if (G.players.filter(function (x) { return x.human && !x.out; }).length === 0 && !G.players.some(function (x) { return !x.human; })) { G.over = true; }
}
function finish(p, line) {
 G.over = true; G.winner = p; G.line = line; stopTimers(); fanfare();
 try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} say('¡Lotería!', 'es', 1);
 updateBoard(); updateRivals();
 setTimeout(function () { winModal(); }, reduceMotion ? 50 : 500);
}
function winModal() {
 var p = G.winner, last = G.drawn[G.drawn.length - 1];
 var title = p.human ? (G.mode === 'pass' ? p.name + ' ' + t('wins') : t('youWin')) : p.av + ' ' + p.name + ' ' + t('wins');
 var bd = '<div class="board" style="width:min(260px,62vw)">' + p.board.map(function (n, i) { return '<div class="cell' + (G.line.indexOf(i) >= 0 ? ' win' : '') + '"><img src="' + thumb(n) + '" alt="">' + (p.marks.has(i) ? BEAN : '') + '</div>'; }).join('') + '</div>';
 var m = openModal('<div class="win"><p class="win-title">¡Lotería!</p><p class="win-sub">' + esc(title) + '</p>' + bd +
  '<p style="text-align:center;margin:10px 0 4px;font-size:.9rem;opacity:.85">' + patName(G.pattern) + ' · ' + t('winCard') + ' <b>' + esc(CARD[last].name) + '</b> · ' + G.drawn.length + ' ' + t('called') + '</p>' +
  '<div class="row" style="justify-content:center;margin-top:10px"><button class="btn mari" data-again>' + t('restart') + '</button><button class="btn ghost" data-view>' + t('backToGame') + '</button><button class="btn ghost" data-home>' + t('quit') + '</button></div></div>', null, 'win-sheet');
 $('[data-again]', m).onclick = function () { closeModal(true); newGame(); };
 $('[data-view]', m).onclick = function () { closeModal(true); };
 $('[data-home]', m).onclick = function () { closeModal(true); go('title'); };
 if (p.human && !S.calm && !reduceMotion) petals();
}
function petals() { var w = document.createElement('div'); w.className = 'petals'; for (var i = 0; i < 40; i++) { var e = document.createElement('i'); e.style.left = Math.random() * 100 + 'vw'; e.style.animationDuration = 2.5 + Math.random() * 3 + 's'; e.style.animationDelay = Math.random() * 1.5 + 's'; e.style.background = Math.random() < .5 ? '#f08a1c' : '#f0c96a'; w.appendChild(e); } document.body.appendChild(w); setTimeout(function () { w.remove(); }, 7000); }

function humans() { return G.players.filter(function (p) { return p.human; }); }
function activePlayer() { return humans()[G.active] || humans()[0]; }
function renderGame() {
 var p = activePlayer(), manual = !SPEEDS[S.speed];
 app.innerHTML = '<section class="game">' +
  '<header class="topbar"><button class="icon-btn" data-act="menu" aria-label="' + t('menu') + '">☰</button>' +
  '<div class="ttl"><span class="pat" style="display:inline-flex;gap:6px;align-items:center">' + patSvg(PAT_ICON[G.pattern]).replace('<svg', '<svg width="20" height="20"') + patName(G.pattern) + '</span></div>' +
  '<span class="callnum" id="counter"></span>' +
  '<button class="icon-btn" data-act="voice" aria-pressed="' + !!S.voice + '" aria-label="' + t('voice') + '">' + (S.voice ? '🔊' : '🔇') + '</button>' +
  '<button class="icon-btn" data-act="settings" aria-label="' + t('settings') + '">⚙</button></header>' +
  '<div class="callerbar"><div class="cardslot"><div class="flip" id="flip"><div class="face back"><img src="assets/cards/back.webp" alt=""></div><div class="face front"><img id="callimg" alt=""></div></div></div>' +
  '<div class="callinfo"><div><div class="callnum" id="callnum"></div><div class="callname" id="callname"></div><div class="grito" id="grito">' + t('waiting') + '</div></div>' +
  '<div class="callbtns"><button class="btn" id="nextbtn"></button><button class="btn lot" id="lotbtn">' + t('lot') + '</button></div></div></div>' +
  '<div class="rivals" id="rivals"></div>' +
  '<div class="history" id="history" aria-label="history"></div>' +
  '<div class="boardarea" id="boardarea"><div class="board" id="board" role="grid"></div></div></section>';
 bindCommon();
 $('[data-act="menu"]').onclick = gameMenu;
 $('[data-act="voice"]').onclick = function (e) { S.voice = !S.voice; save(); e.currentTarget.setAttribute('aria-pressed', S.voice); e.currentTarget.textContent = S.voice ? '🔊' : '🔇'; if (!S.voice && window.speechSynthesis) speechSynthesis.cancel(); };
 $('#nextbtn').onclick = function () { if (G.over) { newGame(); return; } if (!SPEEDS[S.speed]) draw(); else if (!G.started) { draw(); } else { G.paused = !G.paused; updateNextBtn(); if (!G.paused) { if (!anyPending()) draw(); else scheduleAuto(); } else { clearTimeout(autoT); autoT = 0; } } };
 $('#lotbtn').onclick = function () { var p = activePlayer(); if (G.over) { if (G.winner) winModal(); return; } if (p.out) { toast(t('outRound'), true); return; } claim(p); };
 $('#board').addEventListener('click', function (e) { var c = e.target.closest('.cell'); if (!c || G.over) return; var p = activePlayer(); if (p.out) { toast(t('outRound'), true); return; } var i = +c.dataset.i; if (p.marks.has(i)) p.marks.delete(i); else { p.marks.add(i); thud(false); } updateBoard(); updateRivals(); updateClaimHint(); });
 $('#history').addEventListener('click', function (e) { var im = e.target.closest('img'); if (im) cardModal(+im.dataset.n); });
 $('#rivals').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) { G.active = +b.dataset.tab; updateBoard(); updateRivals(); updateClaimHint(); } });
 var last = G.drawn[G.drawn.length - 1]; if (last) showCall(last, false);
 updateBoard(); updateHistory(); updateRivals(); updateClaimHint(); updateCounter(); updateNextBtn(); sizeGame(); scheduleAuto();
}
function updateNextBtn() { var b = $('#nextbtn'); if (!b) return; var manual = !SPEEDS[S.speed]; b.textContent = G.over ? t('restart') : (manual || !G.started) ? '▶ ' + t('next') : (G.paused ? '▶ ' + t('play') : '⏸ ' + t('pause')); b.disabled = !G.over && !G.deck.length; }
function updateCounter() { var c = $('#counter'); if (c) c.textContent = G.drawn.length + '/54'; updateNextBtn(); }
function showCall(n, animate) {
 var c = CARD[n], img = $('#callimg'), flip = $('#flip'); if (!img) return;
 $('#callnum').textContent = '#' + c.n; $('#callname').textContent = c.name;
 $('#grito').innerHTML = '“' + esc(gritoOf(n)) + '”<small>' + esc(gritoAlt(n)) + '</small>';
 if (!animate || reduceMotion) { img.src = c.img; flip.classList.add('show'); return; }
 flip.style.transition = 'none'; flip.classList.remove('show'); void flip.offsetWidth; flip.style.transition = '';
 var done = false, go2 = function () { if (done) return; done = true; requestAnimationFrame(function () { flip.classList.add('show'); }); };
 img.onload = go2; img.src = c.img; if (img.complete) go2(); setTimeout(go2, 400);
}
function updateBoard(bad) {
 var b = $('#board'); if (!b) return; var p = activePlayer(); bad = bad || [];
 b.classList.toggle('locked', !!p.out);
 b.innerHTML = p.board.map(function (n, i) {
  var win = G.over && G.winner === p && G.line.indexOf(i) >= 0;
  return '<button class="cell' + (win ? ' win' : '') + (bad.indexOf(i) >= 0 ? ' bad' : '') + '" data-i="' + i + '" role="gridcell" aria-pressed="' + p.marks.has(i) + '" aria-label="' + esc(CARD[n].n + ' ' + CARD[n].name) + '"><img src="' + cardImg(n) + '" alt="" decoding="async">' + (p.marks.has(i) ? BEAN : '') + '</button>';
 }).join('');
}
function updateHistory() {
 var h = $('#history'); if (!h) return;
 h.innerHTML = G.drawn.length ? G.drawn.slice().reverse().map(function (n) { return '<img src="' + thumb(n) + '" data-n="' + n + '" alt="' + esc(CARD[n].name) + '" title="' + esc(CARD[n].name) + '">'; }).join('') : '<span class="empty">' + t('called') + ': 0</span>';
}
function updateRivals() {
 var r = $('#rivals'); if (!r) return; var hs = humans();
 var tabs = G.mode === 'pass' ? hs.map(function (p, i) { return '<button class="rival tab' + (p.out ? ' out' : '') + '" data-tab="' + i + '" aria-pressed="' + (i === G.active) + '"><span class="av">' + esc(p.av) + '</span>' + esc(p.name) + ' · ' + p.marks.size + '</button>'; }).join('') : '';
 var ais = G.players.filter(function (p) { return !p.human; }).map(function (p) {
  var m = missing(coveredOf(p), G.pattern), won = G.winner === p;
  return '<span class="rival' + (m === 1 && !G.over ? ' hot' : '') + (p.out ? ' out' : '') + '"><span class="av">' + p.av + '</span>' + esc(p.name) + ' · ' + (won ? '¡Lotería!' : m === 0 ? '…' : m === 1 ? t('away') : p.marks.size + '/16') + '</span>';
 }).join('');
 r.innerHTML = tabs + ais; r.style.display = (tabs + ais) ? '' : 'none';
}
function updateClaimHint() { var b = $('#lotbtn'); if (!b) return; var p = activePlayer(); var ready = !G.over && !p.out && !!winLine(coveredOf(p), G.pattern); b.classList.toggle('ready', ready && S.auto); }
function gameMenu() {
 var m = openModal('<button class="icon-btn close" data-close aria-label="' + t('close') + '">✕</button><h2>' + t('menu') + '</h2><div class="menu" style="margin:10px auto">' +
  '<button class="btn mari" data-close>' + t('resume') + '</button><button class="btn" data-m="restart">' + t('restart') + '</button>' +
  '<button class="btn ghost" data-m="baraja">' + t('baraja') + '</button><button class="btn ghost" data-m="rules">' + t('rules') + '</button><button class="btn ghost" data-m="quit">' + t('quit') + '</button></div>');
 $$('[data-m]', m).forEach(function (b) { b.onclick = function () { var a = b.dataset.m; closeModal(true); if (a === 'restart') newGame(); else if (a === 'quit') go('title'); else if (a === 'baraja') barajaModal(); else rulesModal(); }; });
}
function sizeGame() {
 var area = $('#boardarea'), board = $('#board'); if (!area || !board) return;
 var land = innerWidth > innerHeight * 1.25;
 var slot = $('.callerbar .cardslot');
 if (slot) { if (land) { var cb = $('.callerbar'); slot.style.width = Math.max(80, Math.min(innerHeight * 0.34, (cb ? cb.clientWidth : innerWidth * 0.42) * 0.42, cb ? (cb.clientHeight - 80) * 0.75 : 999, 260)) + 'px'; } else { slot.style.width = Math.max(78, Math.min(150, innerHeight * 0.16, innerWidth * 0.3)) + 'px'; } }
 board.style.width = '0px';
 var w = area.clientWidth - 16, hh = area.clientHeight - 12; if (hh < 120) hh = 120;
 board.style.width = Math.floor(Math.min(w, hh * 0.76, 720)) + 'px';
}
window.addEventListener('resize', function () { if (current === 'game') sizeGame(); });
window.addEventListener('orientationchange', function () { setTimeout(function () { if (current === 'game') sizeGame(); }, 250); });

/* ---------- baraja ---------- */
function galleryHtml() { return '<div class="gallery">' + DATA.cards.map(function (c) { return '<button data-card="' + c.n + '" aria-label="' + esc(c.n + ' ' + c.name) + '"><img loading="lazy" src="' + c.thumb + '" alt=""><span>“' + esc(gritoOf(c.n)) + '”</span></button>'; }).join('') + '</div>'; }
SCREENS.baraja = function () {
 app.innerHTML = '<section class="screen"><header class="topbar"><button class="icon-btn" data-act="back" aria-label="' + t('back') + '">←</button><div class="ttl">' + t('baraja') + ' · 54</div><button class="icon-btn" data-act="settings" aria-label="' + t('settings') + '">⚙</button></header><div class="scroll">' + galleryHtml() + '</div></section>';
 bindCommon(); $('[data-act="back"]').onclick = function () { history.back(); };
 $('.gallery').addEventListener('click', function (e) { var b = e.target.closest('[data-card]'); if (b) cardModal(+b.dataset.card); });
};
function barajaModal() { var m = openModal('<button class="icon-btn close" data-close aria-label="' + t('close') + '">✕</button><h2>' + t('baraja') + '</h2>' + galleryHtml()); $('.gallery', m).addEventListener('click', function (e) { var b = e.target.closest('[data-card]'); if (b) { closeModal(true); cardModal(+b.dataset.card); } }); }

/* ---------- rules ---------- */
function rulesHtml() {
 var es = S.lang === 'es';
 var pats = '<div class="patgrid">' + PAT_KEYS.map(function (p) { return '<div>' + patSvg(PAT_ICON[p]) + patName(p) + '</div>'; }).join('') + '</div>';
 return es ?
  '<p>La lotería viene de la lotería de números traída de España e Italia; en México se volvió juego de figuras en ferias y casas. Esta baraja es un remix de horror moderno de las 54 cartas tradicionales.</p>' +
  '<h3>Cómo se juega</h3><ol><li>Antes de la ronda se elige la figura para ganar.</li><li>El cantor saca una carta a la vez y la “canta”: primero el grito, luego el nombre.</li><li>Si la carta está en tu tabla, ponle un frijol (toca la casilla). Tú cuidas tu tabla.</li><li>Quien complete la figura grita <b>¡Lotería!</b> El cantor verifica cada carta marcada contra las cantadas.</li><li><b>Falsa lotería:</b> la primera vez es aviso; a la segunda quedas fuera de la ronda.</li><li>Luego se barajan las 54 cartas y otra persona canta.</li></ol>' +
  '<h3>Figuras</h3>' + pats + '<p>La fila, la columna y las dos diagonales cuentan como línea en su figura. “Llena” es toda la tabla.</p>' +
  '<h3>Modo Cantor</h3><p>Para noches de juego con las tablas impresas: pon el teléfono o la laptop en la tele, canta con “Siguiente” y usa “Verificar tabla” cuando alguien grite lotería.</p>'
  :
  '<p>Lotería grew out of the number lotteries brought from Spain and Italy; in Mexico it became a picture game played at fairs and at home. This deck is a modern-horror remix of the 54 traditional cards.</p>' +
  '<h3>How to play</h3><ol><li>Agree on the winning pattern before the round.</li><li>The caller (el cantor) draws one card at a time and “sings” it: the grito first, then the name.</li><li>If the card is on your tabla, drop a bean on it (tap the cell). You are responsible for your own board.</li><li>Whoever completes the pattern shouts <b>¡Lotería!</b> The caller checks every marked card against the called ones.</li><li><b>False lotería:</b> the first one is a warning; a second one puts you out for the round.</li><li>Then all 54 cards are reshuffled and someone else calls.</li></ol>' +
  '<h3>Patterns</h3>' + pats + '<p>Any row, any column and either diagonal count for their pattern. “Llena” is the whole board.</p>' +
  '<h3>Caller mode</h3><p>For game nights with the printed tablas: put a phone or laptop on the TV, call cards with “Next card” and use “Check a tabla” when someone shouts lotería.</p>';
}
SCREENS.rules = function () {
 app.innerHTML = '<section class="screen"><header class="topbar"><button class="icon-btn" data-act="back" aria-label="' + t('back') + '">←</button><div class="ttl">' + t('rules') + '</div><button class="icon-btn" data-act="settings" aria-label="' + t('settings') + '">⚙</button></header><div class="scroll rules">' + rulesHtml() + '</div></section>';
 bindCommon(); $('[data-act="back"]').onclick = function () { history.back(); };
};
function rulesModal() { openModal('<button class="icon-btn close" data-close aria-label="' + t('close') + '">✕</button><h2>' + t('rules') + '</h2><div class="rules">' + rulesHtml() + '</div>'); }

/* ---------- caller mode ---------- */
var C = null;
SCREENS.caller = function () { C = { deck: shuffle(allNums()), drawn: [], timer: 0, running: false }; keepAwake(true); renderCaller(); };
function renderCaller() {
 var canFs = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
 app.innerHTML = '<section class="caller"><header class="topbar"><button class="icon-btn" data-act="back" aria-label="' + t('back') + '">←</button><div class="ttl">' + t('caller') + '</div><span class="callnum" id="ccount"></span>' +
  '<button class="icon-btn" data-act="voice" aria-pressed="' + !!S.voice + '" aria-label="' + t('voice') + '">' + (S.voice ? '🔊' : '🔇') + '</button>' +
  (canFs ? '<button class="icon-btn" data-act="fs" aria-label="' + t('fullscreen') + '">⛶</button>' : '') + '<button class="icon-btn" data-act="settings" aria-label="' + t('settings') + '">⚙</button></header>' +
  '<div class="caller-main"><div class="cardslot"><div class="flip" id="flip"><div class="face back"><img src="assets/cards/back.webp" alt=""></div><div class="face front"><img id="callimg" alt=""></div></div></div>' +
  '<div class="caller-text"><div class="callnum" id="callnum"></div><div class="callname" id="callname">' + t('caller') + '</div><div class="grito" id="grito">' + t('callerStart') + '</div></div></div>' +
  '<div class="caller-ctrl"><button class="btn ghost" id="cundo">↶ ' + t('undo') + '</button><button class="btn mari" id="cnext">▶ ' + t('next') + '</button><button class="btn ghost" id="cauto"></button><button class="btn ghost" id="cverify">✔ ' + t('verify') + '</button><button class="btn ghost" id="cshuffle">⟲ ' + t('shuffle') + '</button></div>' +
  '<div class="history" id="history"></div></section>';
 bindCommon();
 $('[data-act="back"]').onclick = function () { history.back(); };
 $('[data-act="voice"]').onclick = function (e) { S.voice = !S.voice; save(); e.currentTarget.textContent = S.voice ? '🔊' : '🔇'; e.currentTarget.setAttribute('aria-pressed', S.voice); };
 var fs = $('[data-act="fs"]'); if (fs) fs.onclick = function () { var d = document.documentElement; if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else (d.requestFullscreen || d.webkitRequestFullscreen).call(d); };
 $('#cnext').onclick = callerNext; $('#cundo').onclick = callerUndo;
 $('#cauto').onclick = function () { C.running = !C.running; if (C.running && !SPEEDS[S.speed]) { S.speed = 'normal'; save(); } callerUpdate(); if (C.running) callerNext(); else { clearTimeout(C.timer); C.timer = 0; } };
 $('#cshuffle').onclick = function () { clearTimeout(C.timer); C = { deck: shuffle(allNums()), drawn: [], timer: 0, running: false }; renderCaller(); toast(t('newRound')); };
 $('#cverify').onclick = verifyModal;
 $('#history').addEventListener('click', function (e) { var im = e.target.closest('img'); if (im) cardModal(+im.dataset.n); });
 var last = C.drawn[C.drawn.length - 1]; if (last) callerShow(last, false); callerUpdate();
}
function callerShow(n, anim) { showCall(n, anim); }
function callerUpdate() {
 $('#ccount').textContent = C.drawn.length + '/54 · ' + C.deck.length + ' ' + t('cardsLeft');
 $('#cauto').textContent = C.running ? '⏸ ' + t('pause') : '▶ Auto';
 $('#cundo').disabled = !C.drawn.length; $('#cnext').disabled = !C.deck.length;
 var h = $('#history'); h.innerHTML = C.drawn.slice().reverse().map(function (n) { return '<img src="' + thumb(n) + '" data-n="' + n + '" alt="' + esc(CARD[n].name) + '">'; }).join('') || '<span class="empty">' + t('called') + ': 0</span>';
}
function callerNext() {
 if (!C.deck.length) { toast(t('deckEnd')); C.running = false; callerUpdate(); return; }
 var n = C.deck.pop(); C.drawn.push(n); callerShow(n, true); sing(n); chime(); callerUpdate(); callerAuto();
}
function callerAuto() { clearTimeout(C.timer); C.timer = 0; if (C.running && current === 'caller' && !$('.modal')) C.timer = setTimeout(callerNext, SPEEDS[S.speed] || 6000); }
function callerUndo() {
 if (!C.drawn.length) return; C.deck.push(C.drawn.pop()); var last = C.drawn[C.drawn.length - 1];
 if (last) callerShow(last, false); else { $('#flip').classList.remove('show'); $('#callname').textContent = t('caller'); $('#callnum').textContent = ''; $('#grito').textContent = t('callerStart'); }
 callerUpdate();
}
function verifyModal() {
 var called = new Set(C.drawn);
 var m = openModal('<button class="icon-btn close" data-close aria-label="' + t('close') + '">✕</button><h2>' + t('verifyTitle') + '</h2><div class="opts">' + DATA.tablas.map(function (_, i) { return '<button class="chip" data-vt="' + i + '">' + (i + 1) + '</button>'; }).join('') + '</div><div id="vres"></div>');
 $$('[data-vt]', m).forEach(function (b) { b.onclick = function () {
  $$('[data-vt]', m).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
  var bd = DATA.tablas[+b.dataset.vt], cov = new Set(); bd.forEach(function (n, i) { if (called.has(n)) cov.add(i); });
  var ok = PAT_KEYS.filter(function (p) { return winLine(cov, p); });
  var lines = []; ok.forEach(function (p) { lines = lines.concat(winLine(cov, p)); });
  $('#vres', m).innerHTML = '<p style="font-family:Alfa,serif;font-size:1.1rem;color:' + (ok.length ? '#f0c96a' : '#f1e4c7') + '">' + (ok.length ? t('verifyOk') + ': ' + ok.map(patName).join(', ') : t('verifyNo')) + '</p>' +
   '<div class="board" style="width:min(280px,70vw);margin:0 auto">' + bd.map(function (n, i) { return '<div class="cell' + (lines.indexOf(i) >= 0 ? ' win' : '') + '"><img src="' + thumb(n) + '" alt="">' + (cov.has(i) ? BEAN : '') + '</div>'; }).join('') + '</div>';
 }; });
}
document.addEventListener('keydown', function (e) {
 if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
 if (e.key === 'Escape') { closeModal(); return; }
 if ($('.modal')) return;
 if (current === 'caller' && C) { if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); callerNext(); } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); callerUndo(); } }
 else if (current === 'game' && G && !G.over) { if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); if (!SPEEDS[S.speed] || !G.started) draw(); } else if (e.key === 'l' || e.key === 'L') claim(activePlayer()); }
});

/* ---------- service worker ---------- */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
 window.addEventListener('load', function () { navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function (e) { console.warn('SW', e); }); });
}

/* ---------- boot ---------- */
applyCalm(); document.documentElement.lang = S.lang;
fetch('data/cards.json').then(function (r) { return r.json(); }).then(function (d) {
 DATA = d; d.cards.forEach(function (c) { CARD[c.n] = c; });
 SCREENS.title();
 // warm the card art in the background (cached by the service worker for offline use)
 setTimeout(function () { d.cards.forEach(function (c) { var i = new Image(); i.decoding = 'async'; i.src = c.thumb; }); }, 1200);
}).catch(function (e) { app.innerHTML = '<p style="padding:2rem">Error loading cards: ' + esc(e.message) + '</p>'; });

/* test/debug hook (local only, no network) */
window.__lotee = { get G() { return G; }, get C() { return C; }, draw: draw, claim: function (i) { claim(G.players[i || 0]); }, newGame: newGame, SETUP: SETUP, S: S, PAT: PAT, winLine: winLine, coveredOf: function (p) { return coveredOf(p); } };
})();
