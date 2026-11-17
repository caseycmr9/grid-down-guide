# Grid Down Guide

An offline survival and preparedness handbook that runs on any phone, tablet or computer. No internet, no app store, no accounts, no tracking.

- **232 guides, about 141,000 words** in 23 sections: first aid, water, shelter and fire, sanitation, power, disaster playbooks, stockpiling, health, gardening, livestock, food preservation, cooking, pantry recipes, hunting, wild plants, building, skills, navigation and radio, security, kids and family, courses and ham-radio study guide, quick reference.
- **33 line diagrams** (CPR, choking, bleeding, tourniquet, slings, splints, recovery position, shelters, fire lays, latrines, filters, signals, and more), drawn as small inline SVG that follows light, dark and red night modes.
- **Crisis mode:** 24 step-by-step scripts (CPR for adult/child/infant, choking, severe bleeding, stroke, anaphylaxis, burns, hypothermia, and more) with huge text, one step per screen, optional **Read aloud** using the phone's built-in offline voice, a built-in CPR beat and step timers.
- **My Plan:** a readiness score and next best step, an **Emergency Card** with printable wallet cards, an **inventory** with expiry tracking, maintenance reminders (with a calendar .ics export), a **print kit booklet**, and a **Share** page with a QR code made on the device. Everything stays on the device; a backup file can be downloaded and restored.
- **Region setting:** emergency numbers for the US, Canada, UK, Ireland, Australia, New Zealand, EU and elsewhere ("911" in the guides is swapped for the local number). Guidance is still written for the US.
- **8 offline tools:** CPR metronome, timers with a tourniquet clock, screen flashlight / SOS / Morse flasher, compass, water-treatment (bleach) calculator, supplies calculator, planting calendar with a **ZIP-code zone and frost-date finder** (works offline for about 40,500 US ZIP codes), unit converter.
- Full-text search, Emergency screen, saved guides, tick-box checklists (remembered on the device), print buttons for paper backups, text-size control, and a red night mode.
- Everything is plain files: HTML, CSS and JavaScript. No build tools or libraries are needed to run it.

## Put it on your phone or tablet

### Option A (recommended): host the `docs` folder, install it as an app
A progressive web app must be served over **https** once so the device can save it. After that it never needs a connection again.

1. **This repository is already set up for GitHub Pages**, which serves the `docs/` folder at **https://caseycmr9.github.io/grid-down-guide/**. (To host elsewhere, upload the contents of `docs/` to any static host such as Netlify Drop or Cloudflare Pages.)
2. Open the address on your phone or tablet **while you have signal**.
3. Wait for **✓ Offline ready** in the top bar.
4. Install it:
   - **iPhone / iPad (Safari):** Share button, then **Add to Home Screen**.
   - **Android (Chrome):** menu, then **Install app**.
   - **Windows / Mac / Chromebook (Chrome or Edge):** install icon in the address bar.
5. Turn on airplane mode, close the app, and open it again to test. Do this *before* you need it.

### Option B: one single file, no hosting
**`dist/grid-down-guide.html`** is the whole app in one file. Copy it to a USB stick, SD card, or phone storage and open it in any browser. Works on Android, Windows, Mac, Linux and Chromebook. (iPhone/iPad cannot reliably open local HTML files, so use Option A there.) You can also email it to yourself or keep copies on several devices.

### Keep paper and spare power
Use the **Print** button on the key guides (CPR, severe bleeding, water treatment, master checklist, numbers cheat sheet) and keep the pages in your kit with a charged power bank.

## Project layout

| Path | What it is |
|---|---|
| `index.html`, `css/`, `js/app.js`, `js/tools.js`, `js/md.js` | The app (router, search, tools, article renderer) |
| `js/crisis.js`, `js/personal.js`, `js/share.js`, `js/qr.js` | Crisis mode, My Plan (card, inventory, reminders), share and booklet, and a small offline QR-code encoder |
| `data/*.js` | The content: one file per section, each article is a plain-text block |
| `data/categories.js` | Section list, order and icons |
| `data/diagrams.js`, `data/crisis-steps.js` | The 33 diagrams and the 24 crisis step scripts |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline support and install info |
| `tools/build.mjs` | Validates content and builds `docs/` (the site) and `dist/` (the single file) |
| `tools/validate.mjs` | Checks every article (format, links, length) |
| `tools/master-list.json` | The planned article list with notes on what each must cover |
| `CONTENT_GUIDE.md`, `FACTCHECK_GUIDE.md`, `DIAGRAM_GUIDE.md` | Writing style and safety rules, how to fact-check an article, and how to draw a diagram |
| `review/` | Fact-check logs for a human expert to sign off (start with `review/README.md`) |
| `tools/place-figures.mjs`, `tools/figure-placements.json` | Inserts `[[fig:id]]` diagram markers into articles |
| `docs/`, `dist/grid-down-guide.html` | Built output (upload or copy these) |

## Changing things

Requires [Node.js](https://nodejs.org) (only for building; not needed to run the app).

```bash
node tools/validate.mjs --all     # check all content
node tools/build.mjs              # rebuild docs/ and dist/ (also updates the offline version stamp)
```

- **Rename the app:** change the title in `index.html`, `name` in `manifest.webmanifest`, and the heading in `js/app.js` (search for "Grid Down Guide").
- **Edit or add an article:** edit the file in `data/`, then rebuild. See `CONTENT_GUIDE.md` for the format. New ids must be added to `tools/master-list.json` or the validator will warn.
- **Publish an update:** run the build, then `git add -A`, `git commit`, `git push`. GitHub Pages redeploys `docs/` within a minute or two. Installed copies pick up the new version automatically the next time they are online and show "A new version was installed".
- **Test locally:** `python -m http.server 8765 --directory docs` then open http://127.0.0.1:8765

## Planting calendar data (ZIP, zone, frost dates)

`data/zonedata.js` is **generated** by `tools/build-zone-data.mjs` and is committed so the app works offline. It combines:

- **USDA Plant Hardiness Zone Map 2023**, zone by ZIP code (USDA Agricultural Research Service and the PRISM Group at Oregon State University), `https://prism.oregonstate.edu/phzm/`. This app is not the official map.
- **NOAA NCEI U.S. Climate Normals 1991-2020** for last/first 32 °F freeze dates (50% and about 10% probability), growing season and average temperatures, from weather stations.
- **US Census 2023 ZCTA centroids** to place each ZIP near the right station.

Each ZIP is matched to a nearby station, preferring one whose own hardiness zone agrees with the ZIP's zone, so mountain towns are not matched to warm valley stations. Frost dates are therefore **estimates**. To rebuild, download the three sources (see the header of the script) and run:

```bash
node tools/build-zone-data.mjs --usda <folder with the 4 phzm_*_zipcode_2023.csv> --gaz <2023_Gaz_zcta_national.txt> --noaa <folder of extracted station CSVs>
node tools/build.mjs
```

## Limits you should know about

- **Diagrams, not photographs.** Keep printed field guides for plants, mushrooms, snakes, knots, and anything you could get badly wrong.
- **Checked by AI, not certified.** The text was written with AI help and then checked against official sources in two passes (see `review/README.md`). About 16% of the roughly 1,200 logged claims are still unverified, and **no nurse, EMT, extension agent or other qualified person has reviewed it yet.** Please arrange that for the first-aid, health, plant and building sections.
- **No Spanish or other translations** yet: a translation mistake in first aid can hurt people, so it should be done with a human reviewer.
- Not yet tested on a physical phone or tablet.
- It is an educational reference, not medical or legal advice. Take a hands-on first aid / CPR class.
- Guidance follows widely accepted public sources (Red Cross / AHA, CDC, WHO, EPA, FEMA, USDA / NCHFP, NOAA, Wilderness Medical Society, university Extension services), written for the United States. Check local rules and conditions, and re-check numbers that matter (canning times, medication doses) against current official sources.
- Phone compasses, flashlight (camera LED) control, vibration and wake-lock depend on the device and browser.
