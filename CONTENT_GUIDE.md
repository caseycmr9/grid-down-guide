# Content Guide (read before writing any article)

This app is an **offline survival / prepper reference** for ordinary people who may have **no prior knowledge, no internet, no power, and no professional help**. Articles are the product. Quality, accuracy, and clarity matter more than anything else. People may act on this in a real emergency.

## Where your assignment is
`tools/master-list.json` lists every article: `[id, title, brief, priority?]`, grouped by category id. You are assigned specific categories. Write **every** article listed for your categories, using the exact `id`, and the `cat` key it is listed under. Use the title as given (you may tighten wording slightly). The brief says what must be covered; you may add more. A 4th element of `1` means set `priority: 1` (these appear on the Emergency screen).

Do not edit any file except your own `data/<category>.js` files. Do not touch other categories.

## File format
One file per category: `data/<cat>.js`, exactly this shape:

```js
(window.ARTICLES = window.ARTICLES || []).push(
  {
    id: 'cpr',
    cat: 'firstaid',
    title: 'CPR: Adult, Child & Infant',
    summary: 'One sentence (under 160 chars) shown in lists.',
    priority: 1,                       // only if the master list gives priority 1
    tags: ['cardiac arrest', 'heart', 'resuscitation'],   // search keywords & synonyms people might type
    body: `
## First heading
Paragraph text.

- bullet
- bullet
`
  },
  {
    id: 'next-article',
    ...
  }
);
```

Rules for the JS: the body is a template literal. **Never put a backtick or `${` inside a body.** Straight quotes are fine. Unicode is fine (°, –, ½, µ). Write long files in chunks if needed (e.g. create the file with the first few articles, then append) — but the final file must be one valid push call. Run the validator often.

## Body syntax ("markdown-lite")
- `## Heading` and `### Subheading` only. **Never use `# `** — the title is added by the app.
- Paragraphs separated by a blank line.
- Bullets: `- item`. Numbered steps: `1. item` (use for any procedure). One level of nesting allowed: indent child bullets by 2+ spaces. A wrapped line may continue on the next line if indented 2+ spaces.
- Interactive checklist (saved on the device): `- [ ] item`
- Callouts (must begin with `> ` and a keyword): `> WARNING: ...`, `> DANGER: ...`, `> TIP: ...`, `> NOTE: ...`, `> IMPORTANT: ...`, `> STOP: ...`, `> CALL: ...` (get professional help). Multi-line callouts: continue with more `> ` lines.
- Tables (pipe tables, header + separator row, every row same number of cells):
  ```
  | Item | Amount |
  |---|---|
  | Water | 1 gal |
  ```
- Bold `**text**`, italic `*text*`. Horizontal rule `---` (rarely).
- Cross-links to other articles: `[[article-id]]` (label = that article's title) or `[[article-id|custom label]]`. **Only link to ids that exist in master-list.json.** Link generously where it genuinely helps (e.g. burns → cpr when needed; water treatment → water-safety). The app also has a Tools tab (CPR Metronome, Timers incl. tourniquet clock, Supplies Calculator, Water Treatment Calculator, Planting Calendar, Unit Converter, Flashlight/SOS/Morse, Compass); mention them by name in plain text where relevant.
- Diagrams: a line containing only `[[fig:diagram-id]]` shows a diagram from `data/diagrams.js` (see `DIAGRAM_GUIDE.md`). Do not add these yourself; `tools/place-figures.mjs` inserts them from `tools/figure-placements.json`. Do not write text such as "see the picture" unless the figure is there.
- No raw HTML. No photographs. Do not describe pictures that aren't there.

## Writing style
- Reader may be frightened, cold, tired, and reading on a phone. Plain, direct, short sentences. About 7th–8th grade reading level. Imperative voice ("Press hard on the wound").
- **Lead with the single most important action.** For emergencies, start with a short "Do this first" numbered list, then explain.
- Procedures = numbered steps, one action per step. Reference = bullets and tables. Avoid walls of text; use `##` headings every few paragraphs.
- Typical length 250–500 words; safety-critical articles may run to 700; big reference articles (tables) may go to ~900. No filler, no history lessons, no marketing, no "in this article".
- US units first with metric in parentheses (e.g. 1 gallon (4 L), 40 °F (4 °C)). The audience is mostly in the US, but note where laws/availability vary.
- Assume nothing: define a term the first time it appears.
- Add a short **When to get help** / **Warning signs** section wherever professional care would matter, phrased for people who may or may not be able to reach it ("If you can reach a doctor or call 911, do so now. If not, ...").
- Honest limits: if a thing is a last resort, unreliable, or dangerous, say so plainly.

## Accuracy and safety rules (non-negotiable)
1. Only state facts you are confident of from authoritative sources: American Red Cross / American Heart Association, CDC, WHO, EPA, FDA, USDA / National Center for Home Food Preservation (NCHFP), NOLS / Wilderness Medical Society, university Extension services, FEMA/Ready.gov, NOAA/NWS. **If you are not sure of a number (dose, time, temperature, ratio, frequency, distance), do not guess**: give conservative guidance, point to "follow the label / current NCHFP tables / ask a local expert", or leave it out.
2. Critical numbers must be exact and consistent with the rest of this app. Canonical values: CPR 100–120 compressions/min, 30:2, adult depth 2–2.4 in (5–6 cm); water minimum 1 gal (4 L) per person per day; boil 1 min (3 min above 5,000 ft / 1,500 m, the EPA rule); bleach for water 8 drops/gal of 5–6% (6 drops of 8.25%), wait 30 min; danger zone 40–140 °F (4–60 °C); fridge ~4 h, full freezer ~48 h, half-full ~24 h without power; poultry 165 °F (74 °C), ground meat 160 °F (71 °C), whole cuts/fish 145 °F (63 °C); generator ≥ 20 ft (6 m) from home; US Poison Control 1-800-222-1222; 988 crisis line; 911.
3. Use **WARNING/DANGER callouts** for the mistakes that kill: carbon monoxide, botulism, deadly plant lookalikes, tourniquet errors, mixing chemicals, hypothermia handling, etc.
4. Never give instructions for weapons, explosives, drugs, or harming people. Self-defense content = awareness, avoidance, de-escalation, safe handling and legal basics only.
5. Medical: this is first aid and home care, not a substitute for a clinician. Say when something is a true emergency. For prescription-only treatment (antibiotics, etc.) be honest: explain what can and cannot be done without them, and urge planning with a doctor now.
6. Foraging/plant ID: this app has **no pictures**. Text descriptions are never enough to safely eat an unknown wild plant. Always tell readers to confirm with a printed regional field guide and an experienced person, and never to eat anything they are not 100% sure of. Lead with the deadly lookalikes.
7. Food preservation: only tested methods. Low-acid foods are **pressure canned** only. When giving times/pressures, stay with NCHFP values you are sure of and say "confirm against current NCHFP tables".
8. Prefer measurements you can make with ordinary household items (spoons, cups, fingers, a clock).
9. Don't contradict other articles; link to them instead of repeating long content. Each article should stand alone for the reader who lands on it from search, but short repeats of the key safety fact are fine.
10. No brand names except as unavoidable generic examples (e.g. "EpiPen-type auto-injector", "N95").

## Process
1. Read this guide and your assigned entries in `tools/master-list.json`.
2. Write your `data/<cat>.js` file(s).
3. Run `node tools/validate.mjs data/<cat>.js` (from the `prepper-app` folder) after each file. Fix every ERROR; fix warnings where reasonable (thin articles under 150 words should be expanded unless the topic is truly tiny).
4. Re-read your safety-critical articles once for numerical accuracy and internal consistency before finishing.
5. Final report (keep it SHORT): files written, article count, word count, any article where you were unsure of a fact and how you handled it, and any ids you linked to that you think should exist but don't.
