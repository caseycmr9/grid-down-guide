# Fact-check guide (read before checking any article)

Grid Down Guide is an offline survival handbook. People may act on it in a real emergency with no internet, no power and no professional help. All 210 articles were written by AI from memory. **Your job is to verify the checkable claims in your assigned files against authoritative current sources, and fix what is wrong.** Today's date is 2026-11-16: guidelines change (for example the 2025 AHA/ILCOR CPR & first-aid updates), so do not trust memory. Look things up.

## Scope
- You are assigned specific `data/<cat>.js` files. Edit **only those files** and write **one review log** at `review/<your-group>.md`. Never touch other files (other agents are editing them at the same time).
- Keep each article's `id`, `cat`, `priority`, general structure and the markdown-lite format (see `CONTENT_GUIDE.md`). Keep the voice: plain, direct, imperative, 7th-8th grade reading level. Never put a backtick or `${` inside a body.
- Do not rewrite for style. Change only what is wrong, unsafe, out of date, misleading, or missing something that could hurt someone. Small, surgical edits.
- You may add a short bullet, a WARNING callout or a sentence where an important safety fact is missing. Do not add long new sections.

## What to check (highest risk first)
1. **Life-safety numbers and procedures**: doses (and weight/age limits), compression rates/depths, ratios, temperatures, times, distances, concentrations, pressures, schedules, thresholds for "call for help".
2. **"Do not" rules**: things that kill when done wrong (mixing chemicals, tourniquet errors, carbon monoxide, botulism, feeding honey to infants, deadly lookalike plants, etc.).
3. Named standards and rules (USDA/NCHFP processing times and pressures, FDA/USDA safe temperatures, EPA/CDC water guidance, FEMA/NWS/NOAA instructions, hotlines and phone numbers, legal/regulatory statements such as FCC rules).
4. Lists of species, plants, symptoms and lookalikes.
5. Everything else: sanity-check (do the numbers add up, do the units match, do the steps work in the right order).

You do not need to verify opinions, general advice or obvious facts. Spend your effort where an error would hurt someone.

## How to verify
- Use WebSearch and WebFetch. Prefer primary/official sources: redcross.org, heart.org / cpr.heart.org, cdc.gov, who.int, nih.gov / medlineplus.gov, fda.gov, epa.gov, usda.gov, fsis.usda.gov, nchfp.uga.edu, ready.gov / fema.gov, weather.gov / noaa.gov, nols.edu / wms.org, extension.edu pages, poison.org, aap.org / healthychildren.org, fcc.gov / arrl.org, nrcs.usda.gov. Use secondary sources only to find the primary one.
- **Never invent a source.** Record only URLs you actually opened or saw in search results, and what they actually said.
- Do not "correct" an article from one weak or unofficial source. If good sources disagree, choose the more conservative guidance, say so briefly in the article if useful, and log it.
- If you cannot verify a number, do not leave a confident-sounding guess in place: soften it ("about", "follow the product label", "confirm with current NCHFP tables") or remove it, and log it as **Unverified**.
- The canonical values in `CONTENT_GUIDE.md` ("Accuracy and safety rules", rule 2) are what the rest of the app uses. If an official source disagrees with a canonical value, fix it in your files, and report it prominently in your final message so the lead can fix the other files.
- If an article contradicts another article you cannot edit, fix yours and report the conflict.

## Edits and validation
- After editing a file, run `node tools/validate.mjs data/<file>.js` from the `prepper-app` folder. Fix every ERROR. Keep summaries under 160 characters.
- Do not delete articles. Do not add new articles.

## Review log (required): `review/<your-group>.md`
This file will be handed to a human expert (nurse, EMT, extension agent, ham operator...) for sign-off, so make it easy to scan. Use this structure:

```
# Fact-check log: <group>
Checked 2026-11-16 by AI against the sources listed. NOT a substitute for review by a qualified person.

## Summary
(counts: claims checked / confirmed / corrected / softened / unverified)

## Corrections made
| Article | Was | Now | Source |
(every change that alters a fact, number, step or warning)

## Claims checked
| Article | Claim | Verdict (Confirmed / Corrected / Softened / Unverified) | Source (org + URL) |

## Needs human expert review
(bullets: anything you could not verify, anything where sources disagree, anything where regional law or local conditions matter)
```

## Final message (keep it under 300 words)
Counts, the list of corrections (before -> after, one line each), canonical-value conflicts, and anything the lead must do. Do not paste the log.
