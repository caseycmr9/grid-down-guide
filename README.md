# Grid Down Guide

An offline survival and preparedness handbook that runs on any phone, tablet or computer. No internet, no app store, no accounts, no tracking.

- **210 guides, about 112,000 words** in 20 sections: first aid, water, shelter and fire, sanitation, power, disaster playbooks, stockpiling, health, gardening, livestock, food preservation, cooking, hunting, wild plants, building, skills, navigation and radio, security, quick reference.
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
| `index.html`, `css/`, `js/app.js`, `js/tools.js`, `js/md.js` | The app |
| `data/*.js` | The content: one file per section, each article is a plain-text block |
| `data/categories.js` | Section list, order and icons |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline support and install info |
| `tools/build.mjs` | Validates content and builds `docs/` (the site) and `dist/` (the single file) |
| `tools/validate.mjs` | Checks every article (format, links, length) |
| `tools/master-list.json` | The planned article list with notes on what each must cover |
| `CONTENT_GUIDE.md` | Writing style and safety rules for article authors |
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

- **No pictures.** Keep printed field guides for plants, mushrooms, snakes, knots, and anything you could get badly wrong.
- It is an educational reference, not medical or legal advice. Take a hands-on first aid / CPR class.
- Guidance follows widely accepted public sources (Red Cross / AHA, CDC, WHO, EPA, FEMA, USDA / NCHFP, NOAA, Wilderness Medical Society, university Extension services), written for the United States. Check local rules and conditions, and re-check numbers that matter (canning times, medication doses) against current official sources.
- Phone compasses, flashlight (camera LED) control, vibration and wake-lock depend on the device and browser.
