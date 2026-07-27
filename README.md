# Reveal - Stepped

[![reveal.js plugin](https://img.shields.io/badge/reveal.js-plugin-2C4A6E.svg)](https://revealjs.com) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Build long quotes and source texts **sentence by sentence** in [reveal.js](https://revealjs.com), instead of dropping the whole paragraph on your audience at once. Their eyes stay on the line you are talking about — not three sentences ahead.

You write the text normally. Stepped splits it into sentences itself and turns each one into a native reveal fragment.

**[Live demo](https://florianloyns.github.io/reveal.js-stepped/demo.html)**

## Why

Put a dense paragraph on screen and you lose the room for fifteen seconds: everyone reads it, at their own speed, in their own order. By the time you say "note the second clause", half of them are already at the end and the other half have given up.

Revealing it sentence by sentence solves that, but doing it by hand means wrapping every sentence in a `<span class="fragment">` — and re-doing it every time you edit the quote. That friction is why nobody does it. Stepped removes the friction: you paste the text, it does the wrapping.

## Installation

**Requires** reveal.js 4.2 or newer. Tested with reveal.js 5.x.

```console
npm install reveal.js-stepped
```

Or copy the `stepped` folder into your reveal.js `plugin/` folder.

## Setup

```html
<script src="dist/reveal.js"></script>
<script src="plugin/stepped/stepped.js"></script>
<script>
  Reveal.initialize({ plugins: [ RevealStepped ] });
</script>
```

## Usage

Write the text. That is all.

```html
<blockquote class="stepped">
  The training conveys the professional and personal competences required.
  It qualifies in particular for the care of people of all ages. This includes,
  e.g., assessing the need for care.
</blockquote>
```

Arrow keys step through the sentences, because these are ordinary reveal fragments — so the presenter view, remotes, the URL fragment index and printing all behave as usual.

## Two ways to do it

**Build** (default) — sentences appear one after another. What you have discussed steps back, the current one stands out, what is still to come is not there yet. Use it for quotes you develop line by line, when reading ahead would spoil the point.

**Focus** — the whole text is on screen from the start, but only the current sentence is awake; the rest stays legible in the background. Use it for source work, where the audience needs to see the sentence *in* its context.

```html
<blockquote class="stepped" data-mode="focus" data-marker="true"> … </blockquote>
```

| Attribute | Values | Description |
|---|---|---|
| `data-mode` | `build` `focus` | Reveal one by one, or dim everything but the current sentence |
| `data-marker` | `true` `false` | Put a highlighter behind the current sentence |
| `data-numbered` | `true` `false` | Number the sentences — handy for "look at sentence 4" |
| `data-by` | `sentence` `line` `manual` | Split by sentence, by line break, or at `\|` characters |

## When the split gets it wrong

The splitter knows German and English abbreviations (`z. B.`, `d. h.`, `vgl.`, `Dr.`, `approx.`), ordinals (`1. Januar` stays together), initials (`F. Loyns`), closing quotation marks and brackets, and reference numbers (`vgl. Müller 2020, S. 45.` *does* end a sentence). Markup is never torn apart: if an `<em>` spans two sentences, no break is made inside it.

It will still be wrong occasionally. Two ways out:

```html
<!-- split by hand at | -->
<blockquote class="stepped" data-by="manual">
  One step. | Another step, even though there is no full stop here |
</blockquote>

<!-- or mark the steps yourself -->
<blockquote class="stepped">
  <span class="step">First step.</span>
  <span class="step">Second step.</span>
</blockquote>
```

Explicit `.step` elements always win — the text is then left untouched.

## Configuration

```js
Reveal.initialize({
  stepped: {
    mode: 'build',      // 'build' | 'focus'
    by: 'sentence',     // 'sentence' | 'line' | 'manual'
    dim: 0.3,           // how far the context recedes in focus mode
    past: 0.5,          // how far discussed sentences recede in build mode
    showMarker: false,
    numbered: false,
    accent: '#12294A',
    marker: 'rgba(217,147,10,.28)'
  },
  plugins: [ RevealStepped ]
});
```

Per-slide `data-*` attributes always beat the global setting.

## Notes

In the overview and when printing, the full text is shown — a handout should not have holes in it. Respects `prefers-reduced-motion`. Without JavaScript the text is simply there and readable, so nothing is lost.

## Imprint

Responsible: Florian Loyns — [imprint & privacy notice](https://florianloyns.com/Impressum/) (German)

## License

MIT — see [LICENSE](LICENSE). Built for [reveal.js](https://revealjs.com) by Hakim El Hattab.
