# Diagram guide (read before drawing anything)

Grid Down Guide is an offline survival handbook with no pictures so far. We are adding simple, **correct**, clear line diagrams as inline SVG. A wrong or confusing diagram is worse than none: if you cannot draw something clearly and correctly, **leave it out and say so**.

## File and format
Write `data/diagrams.js` (and nothing else in the app). Exactly this shape:

```js
window.GDG_DIAGRAMS = Object.assign(window.GDG_DIAGRAMS || {}, {
  'cpr-hand-position': {
    title: 'CPR hand position (adult)',
    caption: 'Heel of one hand on the center of the chest, other hand on top, arms straight.',
    alt: 'Side view of a person kneeling beside someone lying on their back, arms straight, hands on the center of the chest.',
    svg: '<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">...</svg>'
  },
  'next-id': { ... }
});
```
- Ids: lowercase-hyphen. `svg` is one single-quoted JS string on one line (escape any apostrophe), or a template literal with no backticks or `${` inside.
- `viewBox` only (no width/height attributes). Landscape, roughly 400x260 to 400x320. Keep each SVG under about 6 KB (hard limit 14,000 characters); the whole file should stay under about 150 KB.
- No `<script>`, `<foreignObject>`, event attributes, external hrefs, `<image>`, or web fonts.
- No `id` attributes unless needed (markers, patterns); if you use one, prefix it with the diagram id so ids never collide when two diagrams are on the same page.

## Styling: use ONLY these classes (they follow light, dark and red night themes). Never use hard-coded colors.
| Class | Use |
|---|---|
| `ln` | main outline stroke (no fill), thick |
| `thin`, `dash` | thin lines; dashed guide/motion lines |
| `fl` | neutral filled shape (body, ground, objects) |
| `fa` | green highlight fill+stroke: the right place/hands/correct thing |
| `fd` | red fill+stroke: wound, danger, "do not" |
| `fw` | orange fill+stroke: caution |
| `fn` | blue fill+stroke: water, cold, informational |
| `la` `ld` `lw` `ln-note` | colored strokes, no fill (arrows, motion): green, red, orange, blue |
| `solid-a` `solid-d` `solid-t` | solid fills (arrowheads, dots): green, red, text color |
| `num` + `num-t` | numbered step badge: `<circle class="num" cx cy r="12"/><text class="num-t" x y>1</text>` |
| `text` default | 15px semibold; add `s` (small 12.5px), `m` (muted), `a` (green), `d` (red), `big` (20px) |

Arrowheads: draw them as small filled polygons with `solid-a` / `solid-d` / `solid-t` (preferred; no markers needed).

## Drawing style
- Simple, bold, high-contrast shapes. People = head circle, rounded-rect torso, thick limb strokes. Hands = simple rounded shapes. No gradients, shadows or fine detail.
- At phone width the diagram is ~350 px wide: labels must be short (1-4 words), at least 12.5 px at viewBox scale, and must not overlap anything. Prefer numbered badges (1, 2, 3) with the steps explained in the caption/article.
- Show the key point: position, angle, direction, order, a measurement. One idea per diagram.
- Everything shown must **match the article text exactly** (read the article first; if you show a number, it must be the same number). Never show a number you are not sure of.
- No gore, no nudity, no brand names, no weapons used on people.

## Checking your work (required)
Build a contact sheet in your scratchpad folder (not in the project): an HTML page that loads `css/style.css` and `data/diagrams.js` and renders every diagram inside `<figure class="fig">` blocks, in a 380 px wide column. Screenshot it with headless Chrome, for example:
`"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --window-size=420,2400 --screenshot=<out.png> file:///<path-to-sheet.html>`
then open the PNG with the Read tool and look at every diagram. Fix overlaps, clipped text, unclear shapes. Also check once with `<html data-theme="dark">` and once with `data-theme="night"`. Re-check after fixes.

## Placement list (required)
Write `tools/figure-placements.json`, an array that says where each diagram belongs:

```json
[ { "fig": "cpr-hand-position", "article": "cpr", "heading": "Hand position", "where": "start" } ]
```
- `article`: an existing article id (see `tools/master-list.json`). `heading`: the exact text of a `##` or `###` heading in that article's body (read `data/<cat>.js`). `where`: `start` (right after the heading line) or `end` (end of that section, before the next heading).
- Choose the spot where the reader is doing exactly that step. A diagram may be placed in more than one article (list each placement). Do **not** edit the article files yourself (another agent is editing them); the lead will insert `[[fig:id]]` lines using your list.

## Priority list (do the first-aid and survival-critical ones first; skip anything you cannot do clearly and correctly)
First aid: CPR hand position (adult, side view), infant CPR (two fingers just below the nipple line), recovery position (steps), choking (back blows and abdominal thrusts hand position; infant: face-down on forearm), direct pressure/pressure bandage, tourniquet placement (above the wound, tightened, time written), arm sling, splinting a forearm, tilting head/lifting chin airway, shock position, burn cooling, snakebite do/don't (keep still, below heart level not required; read the article), heat vs cold illness signs chart (optional).
Navigation/survival: finding Polaris from the Big Dipper, shadow-stick direction method, a simple compass rose with declination idea, lean-to and debris-hut cross-sections, fire lays (teepee, log cabin, lean-to), a cat-hole/latrine layout, a rocket stove cross-section, sand/charcoal/gravel filter layers, generator placement (20 ft away, downwind, never in garage), canning jar headspace, safe food temperature thermometer (40-140 F danger zone), a raised bed/garden spacing plan, hanging food from a tree, how to cut up a rabbit or field-dress (only if clearly correct), earthquake drop-cover-hold on, a three-bucket or tippy-tap handwashing station.
Knots (bowline, square knot, clove hitch, taut-line hitch, sheet bend): include **only** if each is drawn so that a beginner could tie it correctly from the picture; otherwise skip them all.
Aim for roughly 20-30 diagrams total, quality over count.

## Final message (under 250 words)
List of diagram ids, any you skipped and why, anything you could not verify.
