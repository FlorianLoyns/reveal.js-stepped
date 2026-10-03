/*!
 * reveal.js-stepped 1.0.2
 * Build long quotes and source texts sentence by sentence instead of dropping
 * them on the audience at once — so their eyes are on the line you are talking
 * about. Splits German and English prose into sentences by itself (abbreviations,
 * ordinals and initials included) and turns each one into a native reveal fragment.
 * Baut Zitate und Quellentexte Satz für Satz auf und führt so den Blick.
 * @author  Florian Loyns
 * @license MIT
 * Docs & options: see README.
 */

'use strict';

  /* ---- Druck: überall gleich erkannt und gleich ausgegeben ----
     reveal.js baut die Druckansicht mit ?print-pdf in der URL (oder view:'print'
     in der Konfiguration) und setzt dann nur Klassen an <html>; @media print greift
     erst im Druckdialog. Darum jede Druckregel zweimal: für den Druckdialog und
     für die ?print-pdf-Ansicht – so sieht die Vorschau im Browser aus wie das PDF. */
  function isPrintView(deck){
    if (/(?:\?|&)print-pdf\b/i.test(window.location.search)) return true;
    var c = deck && deck.getConfig ? deck.getConfig() : null;
    return !!(c && c.view === 'print');
  }
  function printCSS(css){
    var pdf = css.replace(/(^|\})([^{}]+)\{/g, function (m, vor, sel) {
      return vor + sel.split(',').map(function (s) { return 'html.print-pdf ' + s.trim(); }).join(',') + '{';
    });
    return '@media print{' + css + '}' + pdf;
  }

  /* Wörter, nach deren Punkt kein Satz endet. Ohne diese Liste zerfällt jedes
     "z. B." und jeder "Dr. Meyer" in zwei Schritte. */
  var ABBR = ('z.b|d.h|u.a|u.ä|o.ä|s.o|s.u|v.a|i.d.r|u.u|z.t|z.zt|i.e|e.g|a.a.o|'
    + 'ca|ggf|bzw|evtl|inkl|exkl|max|min|vgl|ebd|ff|f|s|nr|abb|tab|kap|abs|art|'
    + 'dr|prof|dipl|med|phil|rer|nat|jur|hrsg|bd|jg|jh|jhd|st|hl|'
    + 'mio|mrd|tsd|usw|etc|bspw|sog|bzgl|engl|dt|lat|griech|frz|'
    + 'mr|mrs|ms|prof|fig|eq|approx|vol|no|pp|cf|ed|eds|al').split('|');

  function isAbbr(word){
    word = word.toLowerCase().replace(/[^a-zäöüß.]/g, '');
    if (!word) return false;
    for (var i = 0; i < ABBR.length; i++){
      if (word === ABBR[i] || word === ABBR[i] + '.') return true;
    }
    return false;
  }

  /* Darf an dieser Stelle (Punkt bei Index p) getrennt werden? */
  function breakable(plain, p){
    var before = plain.slice(Math.max(0, p - 32), p);
    var lastWord = (before.match(/[^\s]+$/) || [''])[0];
    if (isAbbr(lastWord + '.')) return false;
    /* Einzelner Kleinbuchstabe: der erste Teil einer gesperrten Abkürzung
       wie "z. B.", "d. h.", "u. a." – dort steht der Punkt mittendrin. */
    if (/(^|\s)[a-zäöü]$/.test(before)) return false;
    /* Initiale: "F. Loyns" */
    if (/(^|\s)[A-ZÄÖÜ]$/.test(before)) return false;
    /* Ordnungszahl: "1. Januar", "23. Auflage" – nicht trennen.
       Aber eine Verweiszahl nach einer Abkürzung beendet sehr wohl einen Satz:
       "… vgl. Müller 2020, S. 45." Deshalb dort trennen lassen. */
    if (/(^|\s)\d{1,2}$/.test(before)){
      var vorZahl = (before.replace(/\s*\d{1,2}$/, '').match(/[^\s]+$/) || [''])[0];
      if (!isAbbr(vorZahl)) return false;
    }
    return true;
  }

  /* Zerlegt einen HTML-String in Sätze. Getrennt wird nur, wenn gerade kein
     Tag offen ist – so wird eine Auszeichnung, die über zwei Sätze läuft,
     nie zerrissen. */
  function splitSentences(html){
    var parts = [], buf = '', depth = 0, plain = '';
    for (var i = 0; i < html.length; i++){
      var ch = html[i];
      buf += ch;
      if (ch === '<'){
        var close = html.indexOf('>', i);
        if (close < 0) close = html.length - 1;
        var tag = html.slice(i, close + 1);
        buf += html.slice(i + 1, close + 1);
        if (/^<\s*\//.test(tag)) depth = Math.max(0, depth - 1);
        else if (!/\/\s*>$/.test(tag) && !/^<\s*(br|img|hr|input|wbr)\b/i.test(tag)) depth++;
        i = close;
        continue;
      }
      plain += ch;
      if (depth > 0) continue;
      if (ch === '.' || ch === '!' || ch === '?' || ch === '…'){
        /* mehrere Satzzeichen zusammenfassen: "?!" oder "..." */
        while (i + 1 < html.length && /[.!?…]/.test(html[i+1])){ buf += html[i+1]; plain += html[i+1]; i++; }
        /* schliessende Anführungszeichen und Klammern gehören noch zum Satz:
           „Der Mensch ist Mensch." Das sagt Kant nicht wörtlich. */
        while (i + 1 < html.length && /["“”»«’')\]]/.test(html[i+1])){
          buf += html[i+1]; plain += html[i+1]; i++;
        }
        var rest = html.slice(i + 1);
        /* Es folgt Leerraum und danach etwas, das wie ein Satzanfang aussieht */
        var m = rest.match(/^(\s+)(?=[«»„"'(\[]?[A-ZÄÖÜ])/);
        if (m && breakable(plain, plain.length - 1)){
          parts.push(buf.trim());
          buf = '';
          i += m[1].length;
        }
      }
    }
    if (buf.trim()) parts.push(buf.trim());
    return parts.map(function(x){ return x.replace(/\s+/g, ' ').trim(); });
  }

  /* Manuelle Trennung: "|" im Text, oder eigene <span class="step">…</span> */
  function splitManual(html){
    return html.split('|').map(function(s){ return s.trim(); }).filter(Boolean);
  }
  function splitLines(html){
    return html.split(/<br\s*\/?>|\r?\n/).map(function(s){ return s.trim(); }).filter(Boolean);
  }

  function injectCSS(o){
    if (document.getElementById('stepped-css')) return;
    var css =
      /* Aufbauen: noch nicht gezeigte Schritte sind weg (reveal-Standard),
         gezeigte treten zurück, der aktuelle steht vorn. */
      ".reveal .stepped .stp{transition:opacity .3s ease,color .3s ease,background-color .3s ease}"
    + ".reveal .stepped.stp-build .stp.visible{opacity:" + o.past + "}"
    + ".reveal .stepped.stp-build .stp.current-fragment{opacity:1}"
      /* Fokussieren: alles steht da, aber nur der aktuelle Satz ist wach.
         Der Kontext bleibt lesbar – wichtig bei Quellentexten. */
    + ".reveal .stepped.stp-focus .stp{opacity:" + o.dim + ";visibility:visible}"
    + ".reveal .stepped.stp-focus .stp.current-fragment{opacity:1}"
    + ".reveal .stepped .stp.current-fragment{color:" + o.accent + "}"
      /* Kein Schritt aktiv (noch nicht begonnen oder schon darüber hinaus):
         der Text steht wieder ganz normal da, statt blass liegen zu bleiben. */
    + ".reveal .stepped.stp-idle .stp,.reveal .stepped.stp-idle .stp.visible{opacity:1}"
      /* Textmarker auf dem aktuellen Satz */
    + ".reveal .stepped.stp-marker .stp.current-fragment{background:" + o.marker + ";"
      + "box-shadow:0 0 0 4px " + o.marker + ";border-radius:2px}"
      /* Nummerierung für Verweise im Gespräch: „schaut auf Satz 4" */
    + ".reveal .stepped.stp-num .stp{counter-increment:stp}"
    + ".reveal .stepped.stp-num{counter-reset:stp}"
    + ".reveal .stepped.stp-num .stp::before{content:counter(stp);font-size:.62em;font-weight:700;"
      + "vertical-align:super;color:" + o.accent + ";opacity:.55;margin-right:.25em}"
      /* Im Druck und in der Übersicht steht der Text vollständig da */
    + printCSS(".reveal .stepped .stp{opacity:1 !important;visibility:visible !important;background:none !important;box-shadow:none !important;color:inherit !important}")
    + ".reveal.overview .stepped .stp{opacity:1 !important;visibility:visible !important}"
    + "@media (prefers-reduced-motion:reduce){.reveal .stepped .stp{transition:none}}";
    var s = document.createElement('style');
    s.id = 'stepped-css'; s.textContent = css;
    document.head.appendChild(s);
  }

  var Plugin = {
    id: 'stepped',

    init: function (deck) {
      var d = document;
      var c = (deck.getConfig && deck.getConfig().stepped) || {};
      var o = {
        by: c.by || 'sentence',          // 'sentence' | 'line' | 'manual'
        mode: c.mode || 'build',         // 'build' | 'focus'
        accent: c.accent || '#12294A',
        marker: c.marker || 'rgba(217,147,10,.28)',
        dim: (c.dim != null) ? c.dim : 0.3,      // Sättigung im Fokus-Modus
        past: (c.past != null) ? c.past : 0.5,   // schon Besprochenes im Aufbau-Modus
        showMarker: (c.showMarker != null) ? c.showMarker : false,
        numbered: (c.numbered != null) ? c.numbered : false
      };
      injectCSS(o);

      function build(host){
        if (host.getAttribute('data-stp-init')) return;
        host.setAttribute('data-stp-init', '1');

        var by = host.dataset.by || o.by;
        var mode = host.dataset.mode || o.mode;
        var marker = (host.dataset.marker != null) ? host.dataset.marker !== 'false' : o.showMarker;
        var numbered = (host.dataset.numbered != null) ? host.dataset.numbered !== 'false' : o.numbered;

        host.classList.add(mode === 'focus' ? 'stp-focus' : 'stp-build');
        if (marker) host.classList.add('stp-marker');
        if (numbered) host.classList.add('stp-num');

        /* Bereits ausgezeichnete Schritte gewinnen – dann rühren wir den Text nicht an */
        var manual = host.querySelectorAll(':scope > .step, :scope > p > .step');
        var pieces;
        if (manual.length){
          pieces = [].map.call(manual, function(el){ return el.innerHTML; });
          [].forEach.call(manual, function(el){ el.classList.add('stp', 'fragment'); });
          reindex(host);
          return;
        }

        /* Absatzweise arbeiten, damit die Absatzstruktur erhalten bleibt */
        var blocks = host.querySelectorAll(':scope > p');
        var targets = blocks.length ? [].slice.call(blocks) : [host];

        targets.forEach(function(el){
          var html = el.innerHTML;
          if (by === 'manual')      pieces = splitManual(html);
          else if (by === 'line')   pieces = splitLines(html);
          else                      pieces = splitSentences(html);
          if (pieces.length < 2 && targets.length === 1 && by === 'sentence'){
            /* nichts zu zerlegen – trotzdem als ein Schritt führen */
          }
          el.innerHTML = pieces.map(function(p){
            return '<span class="stp fragment">' + p + '</span>';
          }).join(' ');
        });
        reindex(host);
      }

      /* Fortlaufende Fragment-Indizes über alle Absätze hinweg, sonst springt
         reveal beim Absatzwechsel zurück an den Anfang. */
      function reindex(host){
        var all = host.querySelectorAll('.stp');
        [].forEach.call(all, function(el, i){ el.setAttribute('data-fragment-index', i); });
      }

      function run(){ [].forEach.call(d.querySelectorAll('.stepped'), build); syncIdle(); }

      /* Liegt in diesem Block gerade ein Schritt vorn? Wenn nicht, ist der Block "idle"
         und zeigt den vollen Text – sonst bliebe ein Zitat dauerhaft blass, sobald man
         über den letzten Satz hinausgeklickt hat. */
      function syncIdle(){
        [].forEach.call(d.querySelectorAll('.stepped'), function(h){
          h.classList.toggle('stp-idle', !h.querySelector('.stp.current-fragment'));
        });
      }

      run();
      if (deck.on){
        deck.on('ready', run);
        deck.on('slidechanged', run);
        deck.on('fragmentshown', syncIdle);
        deck.on('fragmenthidden', syncIdle);
      }

      Plugin.rebuild = run;
      Plugin.split = splitSentences;   // für Tests und eigene Skripte
    }
  };

export default Plugin;
