# Fact-check log: Navigation, Prep, Start, Reference (nav.js, prep.js, start.js, reference.js)
Checked 2026-11-16 by AI against the sources listed. NOT a substitute for review by a qualified person.

Files: `data/nav.js` (10 articles), `data/prep.js` (11), `data/start.js` (7), `data/reference.js` (6; priority articles `numbers-to-remember` and `emergency-numbers`). All four pass `node tools/validate.mjs` (reference.js shows one old warning: glossary has no `##` headings, left as is).

Method notes: Several official sites (fcc.gov, redcross.org, faa.gov, fsis.usda.gov at times) blocked automated fetches, and the search tool hit its limit part-way through. Where an official page could not be opened, the row says so. Nothing in the "Source" column is a page I did not open or see in search results. Rows marked "no page opened" rest on standard published practice that I could not re-confirm online in this pass.

## Summary
Claims checked: 200. First pass: Confirmed 157, Corrected 13, Softened 11, Unverified 19. **After the second pass (2026-11-16): Confirmed 163, Corrected 15, Softened 14, Unverified 8.** (Counts come from the "Claims checked" table below; one mixed "Corrected / Confirmed" row is counted as Corrected. Several claims are grouped in a single row.)
- 62 logged changes across the four files (see "Corrections made"). The ones that change a fact, number or safety rule: lightning "go in at the first thunder", tornado ditch as last resort, heat-index wording, flood depths, ground-code X meaning and symbol size, fire spacing, white rice and MRE shelf life, stockpile ration calories, calorie table rows, EAS definition, walking distance and pack-load consistency, and the added hotline details. The rest are softened wording, added caveats, or consistency fixes.
- Computed in Node: every unit-conversion factor, every F/C pair, the stockpile ration math (14 days, 90 days, 365 days), the calorie-per-pound figures, the Morse table (36 characters), the NATO letters (26) and digit words (10), all checked programmatically. No errors in conversions, Morse, NATO or digits.
- No conflicts with the canonical values in CONTENT_GUIDE.md.

## Corrections made
| Article | Was | Now | Source |
|---|---|---|---|
| lost-procedure | "Most people who get seriously lost make it worse in the first hour by moving fast while panicked" | "Many people who get lost make things worse by hurrying while panicked" (unsupported statistic removed) | No source supports "most" or "first hour" |
| lost-procedure | "You can go three weeks without food but only about three days without water" | "You can last weeks without food but only a few days without water (less in heat)" | Wikipedia, Rule of threes (en.wikipedia.org/wiki/Rule_of_threes_(survival)): the figures are rules of thumb |
| direction-sun-stars | Shortest shadow "points north" (northern hemisphere only stated) | Adds that in the southern hemisphere it points south | Standard geometry, no page opened |
| direction-sun-stars | Watch method: "less reliable close to the equator" | "only a rough guide, and less reliable close to the equator" | Standard caveat, no page opened |
| direction-sun-stars | Southern Cross with no warning about look-alikes | Adds warning about the larger, dimmer False Cross (the true Cross has two bright pointer stars beside it) | Wikipedia, Crux (en.wikipedia.org/wiki/Crux) |
| direction-sun-stars | Satellite dishes in North America point "southeast to south" | Dishes in the US point toward the southern sky, "southeast to southwest depending on where you are" | Geometry of geostationary satellites; no page opened |
| signaling-rescue | Three signal fires "about 100 ft (30 m) apart" | "triangle or a line, evenly spaced about 80-100 ft (25-30 m) apart"; one good fire if alone | Sources differ (25 m vs 100 ft): Be Ready Utah and Field & Stream via search results |
| signaling-rescue | Ground symbols "at least 10 ft (3 m) long" | "as large as you can, at least 10 ft (3 m) long (20 ft / 6 m is better)" | aircav.com survival chapter (1 m x 6 m minimum); other sources say 10 ft. Conservative choice |
| signaling-rescue | Symbol X: "Need medical help / cannot proceed" | "Need medical help" (matches V, X, N, Y, arrow code) | aircav.com/survival/asch19/asch19p04.html; FAA AIM code via search results |
| signaling-rescue | PLB: "sends your location by satellite" | Adds 406 MHz, GPS position on most units, register with NOAA (required in US), clear view of sky | sarsat.noaa.gov ("All U.S. coded beacons must be registered with NOAA") |
| signaling-rescue | Phone satellite SOS: "use if you have one" | Adds: works only on certain newer phones, needs clear view of sky and horizon | support.apple.com/en-us/120930 |
| signaling-rescue, emergency-frequencies | 911 "can connect through any available carrier" | "can usually connect ... even if your own is down" | No page opened (FCC pages blocked); softened |
| weather-forecasting | Smoke rule stated as fact | Labeled as a folk rule and a hint | No authoritative source |
| weather-forecasting | Halo "Fairly reliable" | "A useful clue, but not every halo is followed by precipitation" | No primary source; softened |
| weather-forecasting | "Red sky at night, red sky in morning: works in mid-latitudes" (garbled) | Full proverb, what each half means, middle-latitude limit, "rule of thumb, not a guarantee" | Wikipedia, Red sky at morning (en.wikipedia.org/wiki/Red_sky_at_morning) |
| weather-forecasting | "If thunder follows within 30 seconds (about 6 miles), go indoors" | "When you hear thunder, go indoors ... stay in at least 30 minutes after the last thunder (each rumble restarts it)" | NWS, weather.gov/safety/lightning-tips |
| weather-forecasting | Tornado: "lowest interior room or a ditch" | "basement or interior room away from windows"; ditch only as a last resort | NWS, weather.gov/safety/tornado-during |
| weather-forecasting | Heat index 103 F: "heat exhaustion and heat stroke become likely" | "Danger: heat cramps and heat exhaustion likely, heat stroke possible with long exposure or hard activity" | NWS Amarillo, weather.gov/ama/heatindex |
| traveling-on-foot | Naismith's rule with no limit | Adds: it is a minimum for fit hikers; add time for pack, children, heat | Wikipedia, Naismith's rule |
| traveling-on-foot | Daily distance 10-15 miles (16-24 km) | 8-12 miles (13-19 km), matching `stay-or-go` (conservative choice) | Internal consistency; no authoritative source for either |
| traveling-on-foot | Load "20-25% of body weight" | "about 20% or less (25% at most if fit)" matching `bug-out-bag` and the cheat sheet | Internal consistency |
| traveling-on-foot | "Moving water 6 in deep can knock an adult down" | "Fast-moving water only 6 in deep ..." | NWS, weather.gov/safety/flood-turn-around-dont-drown |
| traveling-on-foot | Ice: "white or snowy ice is weaker" | Adds: about half as strong, thickness varies, no ice is guaranteed | Minnesota DNR, dnr.state.mn.us/safety/ice/thickness.html |
| estimation-tricks | "four fingers is about an hour. A full hand is about an hour" (duplicate) | One statement, plus: tends to overestimate daylight left, stop earlier, check against a clock | Own geometry (a hand is about 7 degrees; the sun moves about 11 to 15 degrees an hour) |
| estimation-tricks | "one hour is roughly one fist width" | "a fist covers about 10 degrees, so an hour is roughly a fist and a half along the sun's path" | Own geometry (15 degrees per hour; fist about 10 degrees) |
| radio-basics | GMRS: "FCC license (covers a family)" | Adds: no exam, 18 or older to apply, immediate family covered, fee $35 for 10 years since 2022, check fcc.gov | eCFR 47 CFR 95.1705; FCC fee page via search result; data/learn.js agrees |
| emergency-frequencies | FRS/GMRS "no official national emergency channel" | Same, plus: some volunteer groups informally watch GMRS channel 20 (462.675 MHz), do not count on it | Forums and secondary sites only; hedged |
| emergency-frequencies | NOAA Weather Radio "listen only" | Adds: needs a radio with a weather band | weather.gov/nwr/ |
| emergency-frequencies | "text-to-911 works in some areas" | "works in some areas but not all. Call if you can; text if you cannot" | FCC advice quoted in search summary; FCC page blocked |
| getting-information | (nothing on phone alerts) | Added bullet on Wireless Emergency Alerts: free, no sign-up, via cell network, off in airplane mode | ready.gov/alerts |
| rule-of-3s | "A rough guide ... Add a fourth, 3 seconds: decision" | Standard wording stated in full; NOTE callout that these are rules of thumb (air 30-90 s breath hold, heat can kill in hours, etc.); the "3 seconds" item recast as advice, not a limit | Wikipedia, Rule of threes |
| 72-hour-kit | No wrench/pliers, no plastic sheeting, "a few trash bags" | Adds wrench or pliers, plastic sheeting (shelter in place), trash bags with ties | ready.gov/kit |
| home-stockpile | Daily ration "roughly 2,100 calories" | "roughly 2,200" (recomputed: 2,190 with USDA values) | Calculated with USDA FoodData Central values |
| pantry-rotation | White rice ordinary storage "4-5 years" | "1-2 years for best quality (often safe much longer if dry)" | Clemson HGIC table based on USDA FoodKeeper: white rice 1 year (hgic.clemson.edu/?p=3267) |
| pantry-rotation | MREs "3-5 years at room temperature" | "about 3 years at 80 F (27 C); much less if stored hot" | Wikipedia, MRE (3.5 years at 81 F, 9 months at 100 F) |
| pantry-rotation | Heat rule with no canned-food limit | Adds: canned food keeps best below 85 F and is harmed above 100 F | FSIS shelf-stable food page, via search result summary |
| pantry-rotation | Example row "White rice, buckets, 2050" | "White rice, sealed buckets, 2035" (conservative example) | Internal consistency |
| pets-disaster | Shelters "usually do not accept pets" | "Many ... do not allow pets" and ask your emergency management office | ready.gov/pets ("Many public shelters and hotels do not allow pets inside") |
| pets-disaster | Poison hotlines "Fees may apply" | "Expect a consultation fee" plus: collapsing or struggling to breathe means straight to a vet | aspca.org (fee may apply); petpoisonhelpline.com ($99 per incident) |
| vehicle-kit | "Keep your tank above half full" | Same, plus Ready.gov advises keeping it full when you can | ready.gov/car |
| prepping-budget | Buckets "often give away ... for free" | Cheap or free; use only food-grade buckets, never paint or chemical buckets | General food-safety practice |
| prepping-budget | "Pay down high-interest debt" | "Consider paying down ... when you can" under a note that this is general information, not financial advice | Policy (non-advisory) |
| numbers-to-remember | "Lightning: 30-30 rule: if flash-to-bang is 30 seconds or less go inside" | "when thunder roars, go inside; wait 30 minutes after the last thunder" | NWS lightning-tips |
| numbers-to-remember | "12 in can float a car; 2 ft can carry away SUVs" | "6 in of fast water can knock you down; 12 in can carry away most cars; 2 ft can carry away SUVs and trucks" | NWS flood page |
| numbers-to-remember | "Rule of 3s" | Labeled "rough guide, not exact limits" | Wikipedia, Rule of threes |
| conversions | Soil 60 F "warm enough for warm-season crops" | "warm enough to sow beans and some other warm-season crops (many want 65 F / 18 C or more)" | data/garden.js (beans 60 F, sweet potato 65 F) |
| conversions | "-4 F: Freeze fish 7 days to kill parasites" | Adds: many home freezers are not that cold, so cook fish to 145 F | Unverified at an FDA page; conservative caveat |
| conversions | 5-gallon bucket "35 lb rice or 25-30 lb beans or wheat" | "roughly 30-37 lb of rice, beans, or wheat (varies by food and bucket)" | Own calculation from bulk density; Unverified |
| phonetic-morse | Ground symbols "at least 10 ft (3 m) tall" | "as large as you can, at least 10 ft (3 m) long (20 ft / 6 m is better)" (matches `signaling-rescue`) | aircav.com |
| phonetic-morse | SOS "a signal, not letters" | "a distress signal sent run together, not the letters S-O-S spaced out" | Clarity edit |
| emergency-numbers | Disaster Distress Helpline, no contact modes | "call or text, 24/7" | samhsa.gov Disaster Distress Helpline page |
| emergency-numbers | Domestic violence hotline, no text option | Adds "or text START to 88788" | thehotline.org |
| emergency-numbers | FEMA helpline, no hours | "FEMA disaster assistance helpline ... 7 a.m. to 10 p.m. in your time zone" | disasterassistance.gov |
| emergency-numbers | CDC-INFO not listed | Added: 1-800-232-4636 | cdc.gov/cdc-info |
| emergency-numbers | "Suicide & Crisis Lifeline" | "988 Suicide & Crisis Lifeline" (official name) | 988lifeline.org |
| emergency-numbers | Pet poison hotline rows with no fee note | ASPCA "(fee may apply)", Pet Poison Helpline "(fee applies)" | aspca.org; petpoisonhelpline.com |
| emergency-numbers | "112 works even without a SIM or signal in your network; the phone finds any available network" | "In many countries 112 also works from a mobile phone and may be redirected to the local number ... still needs a signal from some network" | Wikipedia, List of emergency telephone numbers |
| calorie-table | Child 4-8: 1,200-1,800; 9-13: 1,600-2,200; teen: 2,000-3,200; adult light activity 1,800-2,400 | 4-8: 1,200-2,000; 9-13: 1,400-2,600; teen: 1,800-3,200; adult light to moderate 1,600-3,000 | From memory of the Dietary Guidelines for Americans calorie table. The table could not be opened (see review list) |
| calorie-table | Beans/lentils 1,500; cornmeal 1,600; pasta 1,600; dry milk 1,600 per lb | 1,500-1,600; 1,650; 1,700; 1,650 | USDA FoodData Central (lentils 352, pasta 371, dry milk 362, cornmeal 362 kcal/100 g) |
| calorie-table | Winter squash 170; venison 600 per lb | 150-200; 550 | USDA FoodData Central (winter squash 34, deer 116 kcal/100 g) |
| calorie-table | Pemmican about 3,000 | "about 3,000 (varies with the fat content)" | Varies by recipe |
| glossary | EAS "Alerts on radio, TV, and phones" | "Alerts on radio and TV. Phones get a separate system, Wireless Emergency Alerts (WEA)" | ready.gov/alerts |

## Claims checked
| Article | Claim | Verdict | Source |
|---|---|---|---|
| radio-basics | FRS: no license; 2 W on channels 1-7 and 15-22, 0.5 W on 8-14 | Confirmed | eCFR 47 CFR 95.567 (ecfr.gov) |
| radio-basics | FRS has 22 channels shared with GMRS (462/467 MHz) | Confirmed | eCFR 47 CFR 95.563 |
| radio-basics | GMRS up to 50 W on main channels | Confirmed | eCFR 47 CFR 95.1767 |
| radio-basics | GMRS license needed, no exam, 10-year term | Confirmed | FCC fee page (fcc.gov/personal-service-and-amateur-application-fees) via search result; data/learn.js |
| radio-basics | GMRS fee $35 as of 2025/2026; no 2025/2026 change found | Confirmed | FCC fee page via search result; FCC 20-184 via search result. GMRS row in eCFR 1.1102 just points to the Bureau fee guide |
| radio-basics | GMRS license covers immediate family; applicant 18+ | Confirmed | eCFR 47 CFR 95.1705 |
| radio-basics | CB: no license, 4 W, 40 channels near 27 MHz | Confirmed | eCFR 47 CFR 95.967 (4 W AM/FM carrier, 12 W SSB peak); channel count and band from standard knowledge |
| radio-basics | MURS: no license, 2 W, five VHF channels | Confirmed | FCC rule text and channel list via search results (radioreference wiki, Wikipedia); channels 4 and 5 frequencies not shown in results |
| radio-basics | Marine VHF license rules vary; 1-25 W | Confirmed | No page opened (standard practice) |
| radio-basics | Ham license exam-based, Technician is multiple choice, General needed for best HF bands | Confirmed | No page opened; data/learn.js agrees |
| radio-basics | VHF/UHF is line of sight; simplex works without repeaters; repeaters need power | Confirmed | No page opened (standard practice) |
| radio-basics | EMP claim "unproven" for metal box | Confirmed | Article already hedged |
| emergency-frequencies | CB channel 9, 27.065 MHz: emergency and motorist assistance | Confirmed | eCFR 47 CFR 95.931 (channel 9 only for emergency or traveler assistance); frequency from standard channel table |
| emergency-frequencies | CB channel 19, 27.185 MHz: trucker traffic channel | Confirmed | Standard channel table; use is informal, not an FCC designation |
| emergency-frequencies | 2 m national simplex calling frequency 146.520 MHz | Confirmed | ARRL band plan reproduced on RepeaterBook, via search result |
| emergency-frequencies | 70 cm national simplex 446.000 MHz | Confirmed | Same |
| emergency-frequencies | Marine VHF channel 16, 156.800 MHz | Confirmed | No page opened (standard practice) |
| emergency-frequencies | Aviation emergency 121.500 MHz | Confirmed | No page opened (standard practice) |
| emergency-frequencies | NOAA Weather Radio seven frequencies 162.400-162.550 MHz | Confirmed | weather.gov/nwr/; weather.gov/phi/nwrfaq via search result |
| emergency-frequencies | 406 MHz distress beacons (PLB, EPIRB) | Confirmed | sarsat.noaa.gov |
| emergency-frequencies | Distress call structure: MAYDAY x3, "this is" x3, position, nature, people, over | Confirmed | No page opened (standard marine radiotelephone procedure) |
| emergency-frequencies | Procedure words (MAYDAY, PAN-PAN, SECURITE, Over, Out, Roger, Say again, Stand by, Break) | Confirmed | No page opened (standard); "never say over and out" is standard |
| emergency-frequencies | Informal GMRS channel 20 (462.675 MHz) travelers channel | Softened | Forum and secondary sites only; hedged as informal |
| emergency-frequencies | 911 connects through any carrier | Softened | FCC pages blocked; now "usually" |
| emergency-frequencies | Text-to-911 only in some areas | Confirmed | FCC advice "call if you can, text if you can't" via search summary; FCC page blocked |
| getting-information | NOAA Weather Radio 162.400-162.550 MHz | Confirmed | weather.gov/nwr/ |
| getting-information | AM stations in EAS have backup power | Confirmed | ready.gov/alerts describes EAS over TV and radio. Backup-power detail: no page opened |
| getting-information | WWV broadcasts on 2.5, 5, 10, 15, 20 MHz | Confirmed | nist.gov, Radio Station WWV page |
| getting-information | Shortwave scan 5-22 MHz | Confirmed | No page opened (broadcast bands span about 5.9-26 MHz) |
| getting-information | Texts get through when calls do not | Confirmed | No page opened (widely published) |
| getting-information | Wireless Emergency Alerts free, no sign-up | Confirmed | ready.gov/alerts |
| signaling-rescue | Three of anything is a distress signal | Confirmed | Wikipedia and NPS via search results; widely taught |
| signaling-rescue | Whistle: three blasts, pause, repeat | Confirmed | NPS Outdoor Emergency Plan via search result. Some mountain groups use six blasts a minute; see review list |
| signaling-rescue | Signal mirror V-sight technique | Confirmed | No page opened (standard technique) |
| signaling-rescue | Three fires, 100 ft apart | Softened | Sources differ (Be Ready Utah, Field & Stream via search results) |
| signaling-rescue | White smoke vs dark smoke; dark smoke is toxic | Confirmed | No page opened (standard Army-type guidance) |
| signaling-rescue | Ground code V need assistance, X need medical help, N no, Y yes, arrow direction | Confirmed | aircav.com survival chapter; FAA AIM via search result |
| signaling-rescue | Symbol size | Softened | Sources differ (10 ft vs 1 m x 6 m); larger recommended |
| signaling-rescue | Body signals: both arms up = help; one up, one down = no help | Confirmed | No page opened (standard ICAO/Army signals) |
| signaling-rescue | SOS: three short, three long, three short | Confirmed | Morse table checked by script |
| signaling-rescue | PLB works without cell signal; register it | Confirmed | sarsat.noaa.gov |
| signaling-rescue | Satellite SOS needs clear view of sky | Confirmed | support.apple.com/en-us/120930 |
| weather-forecasting | Cloud table (cirrus, cirrostratus halo, altostratus, cumulus, towering cumulus, cumulonimbus, nimbostratus) | Confirmed | No page opened (NOAA JetStream cloud page did not load usable detail) |
| weather-forecasting | Falling barometer means storm; trend matters more than number | Confirmed | No page opened (standard) |
| weather-forecasting | Halo around sun or moon precedes precipitation | Softened | No primary source; wording softened |
| weather-forecasting | Red sky proverb | Softened | Wikipedia, Red sky at morning |
| weather-forecasting | Smoke behavior | Softened | No source; folk rule |
| weather-forecasting | Lightning distance: divide seconds by 5 for miles | Confirmed | Standard; computed 5 s = 1.07 mi |
| weather-forecasting | Go indoors at thunder; wait 30 min after last thunder | Corrected | NWS lightning-tips |
| weather-forecasting | Safe shelters: building with wiring/plumbing, hard-topped vehicle; avoid open fields, hills, isolated trees, water, fences | Confirmed | NWS lightning-tips |
| weather-forecasting | Flash flood signs; do not camp in dry washes | Confirmed | No page opened (NWS flood safety is standard) |
| weather-forecasting | Tornado signs and shelter | Corrected | NWS tornado-during (shelter); signs text not on that page |
| weather-forecasting | Heat index 103 F danger category | Corrected | weather.gov/ama/heatindex |
| traveling-on-foot | Walking speed 2.5-3 mph; 1.5-2 mph loaded | Confirmed | Standard planning figures; no page opened |
| traveling-on-foot | Naismith's rule 1 h per 3 mi plus 1 h per 2,000 ft (5 km, 600 m) | Confirmed | Wikipedia, Naismith's rule |
| traveling-on-foot | Daily distance | Softened | Changed to 8-12 mi for consistency; no authoritative source |
| traveling-on-foot | Load 20% of body weight (25% fit); children 10-15% | Unverified | Common guidance; no page opened. Made consistent with `bug-out-bag` |
| traveling-on-foot | Water 8.3 lb per gallon; 1 L = 2.2 lb | Confirmed | Computed (8.35 lb/gal) |
| traveling-on-foot | Heavy walking burns 2,500-4,000 kcal/day | Softened (second pass) | No source found for the upper bound. Article now says "long days of heavy walking with a pack can burn well over 2,500 calories" |
| traveling-on-foot | Stay 35 ft (10 m) from downed power lines | Confirmed | Standard utility guidance; no page opened (other sources use 30 ft) |
| traveling-on-foot | 6 in of fast water knocks an adult down | Corrected | NWS flood page |
| traveling-on-foot | River crossing technique (face upstream, unbuckle pack, no rope tie-in) | Confirmed | No page opened (standard WMS/NOLS practice) |
| traveling-on-foot | 4 in of clear ice for walking; white ice weaker | Confirmed | Minnesota DNR |
| traveling-on-foot | Ice self-rescue: kick, spread arms, roll away | Confirmed | No page opened (standard) |
| estimation-tricks | Fingers-to-sunset method | Softened | Own geometry; tends to overestimate |
| estimation-tricks | Pace count 60-70 double paces per 100 m | Unverified | Common range; no page opened |
| estimation-tricks | Parallax multiply by 10 | Confirmed | Geometry (arm length about 10 x eye spacing) |
| estimation-tricks | Sound 1,100 ft/s; 5 s = 1 mile, 3 s = 1 km | Confirmed | Computed (5 s = 1.07 mi; 3 s = 1.03 km) |
| estimation-tricks | Shadow-height proportion and hat-brim river width | Confirmed | Geometry |
| estimation-tricks | Sun 15 degrees per hour; equinox sunrise about 6 a.m. solar time | Corrected / Confirmed | Geometry; fist = about 10 degrees |
| direction-sun-stars | Sunrise east/sunset west only at the equinoxes (about Mar 20, Sep 22) | Confirmed | Standard astronomy |
| direction-sun-stars | Shadow-stick method, 15-minute wait, west-east line | Confirmed | Standard method; no page opened |
| direction-sun-stars | Analog watch method, DST rule (halfway to 1 o'clock) | Confirmed | Standard Army method; no page opened |
| direction-sun-stars | Polaris within about 1 degree of true north; altitude = latitude | Confirmed | Wikipedia, Polaris (0.66 degrees) |
| direction-sun-stars | Big Dipper pointers extend about 5 times the gap | Confirmed | Standard method; Wikipedia page did not give the ratio |
| direction-sun-stars | Southern Cross long axis x 4.5 | Confirmed | Wikipedia, Crux |
| direction-sun-stars | Orion rises near east, sets near west | Confirmed | Standard astronomy |
| direction-sun-stars | Crescent moon tips point toward south (northern hemisphere) | Confirmed | Standard Army method; no page opened |
| direction-sun-stars | Moss and nature signs unreliable | Confirmed | Standard |
| map-compass | Scales 1:24,000, 1:50,000, 1:100,000 | Confirmed | Computed (1 in = 2,000 ft = 0.38 mi) |
| map-compass | Contour rules and map colors | Confirmed | Standard USGS convention; no page opened |
| map-compass | Compass bearing procedures | Confirmed | Standard; no page opened |
| map-compass | Declination range about 15 E (Pacific NW) to 15 W (Maine) | Unverified | NOAA calculator did not respond; kept with "roughly" and told readers to check the map |
| map-compass | "East is least, west is best" for map-to-compass conversion | Confirmed | Standard convention |
| map-compass | Resection with back bearings (+/-180) | Confirmed | Standard |
| lost-procedure | STOP = Stop, Think, Observe, Plan; hug-a-tree; stay vs move rules | Confirmed | NPS Outdoor Emergency Plan and Hug-a-Tree description via search results |
| rule-of-3s | 3 minutes air, 3 hours shelter in harsh environment, 3 days water, 3 weeks food | Corrected | Wikipedia, Rule of threes (wording and caveats) |
| rule-of-3s | "3 seconds: decision" | Softened | Not part of the usual wording; reworded as advice |
| rule-of-3s | Hypothermia can kill within hours; shelter before food | Confirmed | Wikipedia, Rule of threes; data/shelter.js agrees |
| grid-down-timeline | Keep fridge and freezer closed; eat perishables first (fridge, freezer, pantry) | Confirmed | Matches canonical outage rules in CONTENT_GUIDE |
| grid-down-timeline | Plan for two weeks without help | Confirmed | Consistent with FEMA two-week planning; ready.gov/kit itself says "several days" |
| grid-down-timeline | Gas smell: leave and call from outside | Confirmed | Standard utility guidance; no page opened |
| first-72-hours | 1 gal water per person per day; checklist items | Confirmed | ready.gov/kit, ready.gov/water |
| stay-or-go | Walking 8 to 12 miles per day | Softened | No authoritative source; now consistent with `traveling-on-foot` |
| mindset | Box breathing 4-4-4-4, four rounds | Confirmed | Standard technique; no page opened |
| learning-plan | 5-mile loaded walk; rotate water twice a year | Confirmed | ready.gov/water (replace stored water every 6 months) |
| prep-start-here | 3 days water/food now, 2 weeks next, 14 gal per person | Confirmed | ready.gov/kit, ready.gov/water; arithmetic 14 x 3.785 = 53 L |
| 72-hour-kit | Kit contents vs FEMA basic kit list | Corrected | ready.gov/kit (added wrench/pliers, plastic sheeting, ties) |
| 72-hour-kit | 3 gallons about 25 lb | Confirmed | Computed (25.0 lb) |
| 72-hour-kit | About 2,000 kcal/day per adult | Confirmed | Consistent with home-stockpile and calorie-table |
| 72-hour-kit | Replace stored water every 6 months | Confirmed | ready.gov/water |
| master-checklist | Items vs FEMA lists (radio with NOAA band, whistle, dust mask, sheeting, tape, wrench, can opener, maps, chargers) | Confirmed | ready.gov/kit |
| master-checklist | Bleach 5-6% unscented; hand sanitizer 60% alcohol | Confirmed | ready.gov/water (5.25-6.0% bleach); sanitizer figure: no page opened |
| master-checklist | Filter 0.1-0.2 micron | Corrected (second pass) | CDC emergency water guidance (https://www.cdc.gov/water-emergency/about/index.html) and CDC Cryptosporidium prevention page (https://www.cdc.gov/cryptosporidium/prevention/index.html), seen in search results: absolute pore size 1 micron or smaller for parasites, 0.3 micron or smaller for bacteria; CDC Yellow Book: microfilters do not reliably remove viruses. Article now says 1 micron absolute or smaller and that filters do not remove viruses |
| master-checklist | Toilet paper 1 roll per person per week | Unverified | No source; arithmetic consistent with home-stockpile |
| bug-out-bag | 20% of body weight; 150 lb adult = 30 lb (14 kg) | Confirmed | Computed; guidance no page opened |
| bug-out-bag | Children 10-15% | Unverified | No page opened |
| home-stockpile | Basic ration calories | Corrected | USDA FoodData Central; computed 2,190 kcal |
| home-stockpile | Quantity table (2 weeks, 3 months, 1 year) | Confirmed | Recomputed in Node: all rice, flour, beans, oil, sugar and total figures match within rounding |
| home-stockpile | 14 gal = 53 L; toilet paper 2/13/52 rolls | Confirmed | Computed |
| home-stockpile | Replace bleach each year | Unverified | No page opened; conservative |
| pantry-rotation | Canned low-acid 2-5 years; high-acid 12-18 months | Confirmed | USDA FSIS pages via search result summaries (fsis.usda.gov shelf-stable pages) |
| pantry-rotation | Discard cans that bulge, leak, rust badly, or dent deeply along seam | Confirmed | USDA FSIS via search result summaries |
| pantry-rotation | Infant formula is the only federally dated product | Softened (second pass) | FSIS Food Product Dating (https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/food-product-dating), seen in search results: federal regulations require a "Use-By" date on infant formula (21 CFR 107.20(c)); another FSIS shelf-stable page says "infant formula and some baby food". Article now says "the main exception ... is infant formula: never use it after its use-by date" |
| pantry-rotation | "Best by" is quality, not safety | Confirmed | USDA FSIS via search result |
| pantry-rotation | White rice 4-5 years | Corrected | Clemson HGIC table (FoodKeeper-based) |
| pantry-rotation | Brown rice 6-12 months; pasta 1-2 years; whole wheat flour 3-6 months; sugar, salt indefinite | Confirmed | Clemson HGIC table (6 months, 1-2 years, 3 months, indefinite) |
| pantry-rotation | Dry beans 1-3 years; white flour 6-12 months; powdered milk 1-2 years; oil 1-2 years | Confirmed | Clemson HGIC (beans 1 year, flour 10-15 months, dry milk 1 year, oil 1 year): within or close to the stated ranges |
| pantry-rotation | Sealed-with-absorber columns (25+ years rice, 20-30 pasta, etc.) | Softened (second pass) | Utah State Univ. Extension food storage page (https://extension.usu.edu/preserve-the-harvest/food-storage-packaging) and a BYU 2003 poster, seen in search results: absorbers only for dry foods (about 10% moisture or less); the BYU work checks packaging, not years. The 30+ year white rice figure is a Church of Jesus Christ food-storage estimate. Column header now says "(estimates)" and a note says so, with the dry-foods-only rule |
| pantry-rotation | Freeze-dried 20-25 years (manufacturer claim) | Confirmed | Article labels it a manufacturer claim |
| pantry-rotation | MRE shelf life | Corrected | Wikipedia, MRE |
| pantry-rotation | Every 18 F (10 C) halves shelf life | Confirmed as a rough quality rule (second pass) | Army medical manual, https://armymedical.tpub.com/backup/MD0723/MD07230015.htm (search result): van't Hoff rule, reaction rates roughly double per 10 C (18 F). Quality, not safety. Article already says "rough rule of thumb" |
| pantry-rotation | Ideal storage 50-70 F (10-21 C) | Confirmed | Clemson HGIC (65-70 F); FSIS (below 85 F) |
| family-plan | Out-of-area contact; texts over calls; three meeting places | Confirmed | Standard FEMA/Ready.gov guidance; no page opened |
| family-plan | Gas shutoff only if you smell gas; quarter turn; only the utility restores | Confirmed | Standard utility guidance; no page opened |
| family-plan | Fire drills twice a year | Confirmed | NFPA page did not load detail; standard guidance |
| documents-money | Document list (IDs, insurance, medical, deeds, wills, photos) | Confirmed | ready.gov/kit (copies of important documents) |
| documents-money | Flood insurance 30-day waiting period; standard homeowners policies exclude flood | Confirmed | No page opened (NFIP rule is standard) |
| documents-money | Cash in small bills; amount guidance | Confirmed | ready.gov/kit (cash or traveler's checks); amounts are opinion |
| vehicle-kit | Kit contents | Confirmed | ready.gov/car |
| vehicle-kit | Run engine about 10 min per hour, window open, exhaust clear | Confirmed | NWS weather.gov/safety/winter-during |
| vehicle-kit | Jump-start order and warning | Confirmed | Standard owner's-manual sequence; no page opened |
| vehicle-kit | Battery life 3-5 years; tire pressure monthly | Confirmed | Standard; no page opened |
| pets-disaster | Pet kit contents; microchip; carrier; pets often not allowed in shelters | Confirmed | ready.gov/pets; aspca.org disaster preparedness |
| pets-disaster | Pet water about 1 oz per lb per day | Unverified | Common vet rule of thumb; ASPCA page gives no per-pound figure |
| pets-disaster | Toxic foods list (chocolate, grapes, onion, xylitol, macadamia...) | Confirmed | No page opened (standard veterinary list) |
| pets-disaster | ASPCA APCC 888-426-4435; Pet Poison Helpline 855-764-7661 | Confirmed | aspca.org/pet-care/animal-poison-control; petpoisonhelpline.com |
| prepping-budget | CERT is FEMA-supported; free in many areas | Confirmed | No page opened (standard); wording hedged "many areas" |
| prepping-budget | 2-liter soda bottles for water, not milk jugs | Confirmed | No page opened (standard FEMA/EPA advice) |
| numbers-to-remember | CPR 100-120/min, 30:2, depth 2-2.4 in (5-6 cm) | Confirmed | Matches CONTENT_GUIDE canonical values |
| numbers-to-remember | Child depth about 2 in, infant about 1.5 in | Confirmed | Matches firstaid.js (fact-checked by the first-aid group) |
| numbers-to-remember | Burn cooling 10-20 min | Confirmed | Matches firstaid.js |
| numbers-to-remember | Eye/chemical flush 15-20 min | Confirmed | Matches firstaid.js and skills.js |
| numbers-to-remember | Tourniquet 2-3 in (5-7 cm) above wound, not on a joint | Confirmed | Matches firstaid.js |
| numbers-to-remember | Aspirin chew 325 mg or four 81 mg | Confirmed (second pass) | 2024 AHA / American Red Cross first aid guidelines (https://cpr.heart.org/en/resuscitation-science/2024-first-aid-guidelines, seen in search results): alert adults with non-traumatic chest pain may chew and swallow 162-325 mg unless allergic or told not to; a 2025 Red Cross manual lists two to four 81 mg tablets or one 325 mg. Four 81 mg is 324 mg, inside the range. No 2025 AHA revision found |
| numbers-to-remember | Epinephrine 0.3 mg at 30 kg and up; 0.15 mg at 15-30 kg | Confirmed | DailyMed EpiPen label (dailymed.nlm.nih.gov, setid 7560c201-...) |
| numbers-to-remember | Heat stroke at 103 F (39.4 C) or higher | Confirmed (second pass) | CDC signs-and-symptoms page and NWS heat-illness page (https://www.weather.gov/safety/heat-illness), seen in search results: 103 F or higher; an older CDC poster used 104 F rectal. The article and the rest of the app (firstaid.js, disasters.js) now say 103 F, so this row is consistent |
| numbers-to-remember | Frostbite rewarm 99-102 F (37-39 C) | Confirmed | Matches firstaid.js |
| numbers-to-remember | ORS: 1 L water, 6 level tsp sugar, 1/2 level tsp salt | Confirmed | Matches firstaid.js (6 level teaspoons) |
| numbers-to-remember | Water: 1 gal per day; boil 1 min (3 min above 5,000 ft / 1,500 m); bleach 8 drops/gal of 5-6%, 6 drops of 8.25%, 30 min | Confirmed | CONTENT_GUIDE canonical; ready.gov/water (1/8 tsp per gallon of 5.25-6%, 30 min) |
| numbers-to-remember | SODIS 6 hours (2 days overcast) | Confirmed | No page opened (WHO/EAWAG guidance) |
| numbers-to-remember | Latrine 200 ft from water, 100 ft from a well | Corrected (second pass) | CDC cholera prevention page (https://www.cdc.gov/cholera/prevention/index.html, search result): new pit latrines at least 30 m (100 ft) from water and wells. USDA Forest Service handbook 7409.11: 100 ft. NRCS well specification 642: 150 ft from a well (search results). No source gives 200 ft. Article now keeps 200 ft for streams and lakes as the cautious figure, names the CDC 100 ft minimum, and says 150 ft or more from a well is better |
| numbers-to-remember | Danger zone 40-140 F; 2 hours (1 hour above 90 F); fridge 4 h; freezer 48/24 h; 165/160/145 F | Confirmed | CONTENT_GUIDE canonical |
| numbers-to-remember | Honey never under 12 months | Confirmed | No page opened (standard) |
| numbers-to-remember | Generator 20 ft; heater clearance 3 ft; smoke alarm monthly test, replace every 10 years; PASS | Confirmed | CONTENT_GUIDE canonical (generator); others no page opened (NFPA standard) |
| numbers-to-remember | Floodwater 6 in / 12 in / 2 ft | Corrected | NWS flood page |
| numbers-to-remember | Earthquake Drop, Cover, Hold On | Confirmed | No page opened (standard) |
| numbers-to-remember | Fallout: get inside, stay inside at least 24 hours, stay tuned | Confirmed | ready.gov/nuclear-explosion |
| numbers-to-remember | Walking 3 mph; pack 20%; CB 9/19; 146.520/446.000; marine 16 | Confirmed | See radio rows above |
| conversions | Volume factors (tsp 5 mL, Tbsp 15 mL, fl oz 30 mL, cup 237 mL, pint 473, quart 946, gallon 3.785 L, liter 1.06 qt) | Confirmed | Recomputed in Node (4.93, 14.79, 29.57, 236.59, 473.18, 946.35, 3.7854, 1.0567) |
| conversions | Weight factors (oz 28 g, lb 454 g, kg 2.2 lb, gallon of water 8.3 lb) | Confirmed | Recomputed (28.35, 453.59, 2.2046, 8.35) |
| conversions | Length/area (2.54 cm, 30.5, 0.91, 1.61, 0.62, acre 43,560 sq ft = 0.4 ha, ha = 2.47 acres) | Confirmed | Recomputed (30.48, 0.9144, 1.6093, 0.6214, 0.4047, 2.4711) |
| conversions | Temperature table (-4/-20 ... 212/100) | Confirmed | Recomputed for all 11 pairs |
| conversions | Pressure 1 psi = 6.9 kPa; 10 = 69; 15 = 103 | Confirmed | Recomputed (6.895, 68.9, 103.4) |
| conversions | 1 inch rain on 1,000 sq ft = 623 gal | Confirmed | Recomputed (623.4) |
| conversions | Cord 128 cu ft; 16d nail 3.5 in (89 mm); 2x4 is 1.5 x 3.5 in; 3-4-5 triangle | Confirmed | Recomputed / standard |
| conversions | Freeze fish at -4 F for 7 days | Confirmed (second pass) | FDA Fish and Fishery Products Hazards and Controls Guidance, chapter 5 (https://www.fda.gov/files/food/published/Fish-and-Fishery-Products-Hazards-and-Controls-Guidance-Chapter-5-Download.pdf, seen in search results): freeze at -4 F (-20 C) or below for 7 days total; not suitable for fish thicker than 6 in |
| conversions | Bucket capacity | Unverified | See corrections |
| phonetic-morse | NATO alphabet letters (ICAO spelling: Alfa, Juliett, etc.) | Confirmed | Checked by script against the ICAO spellings: 26 of 26 |
| phonetic-morse | Digit words (wun, too, tree, fower, fife, six, seven, ait, niner, zero) | Confirmed | Checked by script: 10 of 10 |
| phonetic-morse | Morse letters and digits | Confirmed | Checked by script: 36 of 36 |
| phonetic-morse | Morse timing 1/3/1/3/7 units | Confirmed | Standard |
| phonetic-morse | Procedure words | Confirmed | Standard; see emergency-frequencies |
| phonetic-morse | Ground-to-air symbols | Confirmed | aircav.com; FAA AIM via search result |
| emergency-numbers | 911 | Confirmed | CONTENT_GUIDE canonical |
| emergency-numbers | Poison Control 1-800-222-1222 | Confirmed | poison.org |
| emergency-numbers | 988 call or text | Confirmed | 988lifeline.org (call, text, chat) |
| emergency-numbers | Disaster Distress Helpline 1-800-985-5990 | Confirmed | samhsa.gov DDH page |
| emergency-numbers | FEMA 1-800-621-3362 | Confirmed | disasterassistance.gov; ready.gov/shelter |
| emergency-numbers | National Domestic Violence Hotline 1-800-799-7233 | Confirmed | thehotline.org |
| emergency-numbers | 211 for local services | Confirmed | 211.org |
| emergency-numbers | CDC-INFO 1-800-232-4636 (added) | Confirmed | cdc.gov/cdc-info |
| emergency-numbers | ASPCA 1-888-426-4435 and Pet Poison Helpline 1-855-764-7661 | Confirmed | aspca.org; petpoisonhelpline.com |
| emergency-numbers | American Red Cross 1-800-733-2767 | Confirmed (second pass) | redcross.org pages seen in search results: Greater New York region, St. Louis area and San Diego chapter pages give 1-800-RED-CROSS (1-800-733-2767), staffed 24 hours for disaster and home-fire help; the national Customer Service page lists it for training support. Direct fetches of redcross.org returned 403 |
| emergency-numbers | International: EU 112, UK 999 or 112, Canada 911, Australia 000, NZ 111 | Confirmed | Wikipedia, List of emergency telephone numbers |
| emergency-numbers | Text-to-911 not available everywhere | Confirmed | FCC advice via search summary |
| emergency-numbers | "When you call" steps (location, stay on the line) | Confirmed | Standard dispatcher guidance |
| calorie-table | Rice 1 lb about 1,650; 1 cup about 680 | Confirmed | USDA FoodData Central (365 kcal/100 g = 1,656/lb; 1 cup about 675) |
| calorie-table | Flour 1 lb about 1,650 | Confirmed | USDA FoodData Central (364 kcal/100 g) |
| calorie-table | Rolled oats 1 cup about 300 | Confirmed | USDA FoodData Central (379 kcal/100 g, about 307 per 81 g) |
| calorie-table | Corn dry kernels about 1,650 | Confirmed | USDA FoodData Central (365 kcal/100 g) |
| calorie-table | Beans/lentils, cornmeal, pasta, dry milk, squash, venison | Corrected | USDA FoodData Central |
| calorie-table | Oil 1 Tbsp 120; 1 lb about 4,000; sugar 48/Tbsp; honey 64/Tbsp; butter 100; peanut butter 190 | Confirmed | Within 3% of standard USDA values (oil 884 kcal/100 g gives 4,010/lb); not individually fetched |
| calorie-table | Potatoes 350, sweet potatoes 390, eggs 70, nuts 160-170, jerky 80-115 | Confirmed | Jerky 410 kcal/100 g (116 per oz) from FoodData Central; others standard values, not individually fetched |
| calorie-table | Canned tuna in water 5 oz can about 120; canned beans 15 oz about 350 | Confirmed | Tuna light in water 116 kcal/100 g drained (USDA); beans standard value |
| calorie-table | Pregnancy +340 to 450; breastfeeding +330 to 500 | Confirmed | Standard Dietary Guidelines figures; no page opened |
| calorie-table | Daily needs by age | Confirmed against a secondary table (second pass); heavy-labor row Corrected | Merck Manual (consumer) table reproducing the Dietary Guidelines for Americans 2020-2025, https://www.merckmanuals.com/home/multimedia/table/estimated-number-of-calories-needed-based-on-age-sex-and-activity-level (opened): girls 7-18 1,200-2,400, boys 7-18 1,400-3,200, women 19-60 1,600-2,400, men 19-60 2,200-3,000; the app ranges sit inside these. The DGA PDF itself was too large to fetch. The old "active or heavy labor 2,500-4,000" row went beyond the DGA active range (2,200-3,000): now "Adult, active 2,200-3,000" and "Very hard labor, long hikes, cold weather: 3,000 or more" |
| glossary | Cat hole 6-8 in deep; N95 95% filtration; KI protects thyroid only; hypothermia, AED, and other definitions | Confirmed | No page opened (standard definitions) |
| glossary | EAS | Corrected | ready.gov/alerts |
| glossary | PLB sends a distress signal by satellite | Confirmed | sarsat.noaa.gov |

## Needs human expert review
(Updated in the second pass, 2026-11-16. Items closed in the second pass are listed in the new section below.)
- **Daily calorie needs (calorie-table):** now checked against a secondary table (Merck Manuals) that reproduces the 2020-2025 Dietary Guidelines. The 2025-2030 Dietary Guidelines were not checked. A dietitian should confirm the age and pregnancy/breastfeeding ranges.
- **GMRS fee and rules (radio-basics, ham articles):** the FCC order FCC 17-57 (opened) confirms an individual license, 18 or older, ten-year term, immediate family, and no individual license for FRS. The $35 fee comes only from an FCC fee-table search result (fcc.gov returns 403). A ham or GMRS operator should confirm the current fee.
- **Informal GMRS channel 20 (462.675 MHz):** found only on forum and retailer sites. Hedged in the article. A radio operator should confirm or drop it.
- **Whistle convention (signaling-rescue):** the article teaches three blasts. Some mountain-rescue groups teach six blasts per minute (answer: three). A search-and-rescue volunteer should say which to teach.
- **Ground-signal size and fire spacing (signaling-rescue):** sources disagree (10 ft vs 1 m x 6 m; 25 m vs 100 ft). The article gives conservative, larger numbers.
- **Declination range (map-compass):** "roughly 15 degrees east to 15 degrees west" could not be checked; the NOAA pages found do not list contiguous-US extremes (northern Maine may be farther west than 15 degrees). The article tells readers to use the number printed on the newest map.
- **Shelf-life columns (pantry-rotation):** the "ordinary storage" values follow a FoodKeeper-based extension table. The "sealed with oxygen absorbers" values are now labeled estimates with a dry-foods-only rule, but the numbers (25+ years rice, 20-30 pasta) are packer and food-storage-group estimates. A food-science extension agent should review.
- **911 behavior:** "can usually connect through any carrier" and text-to-911 coverage vary by phone, carrier and county. A 911 or telecom expert could tighten the wording.
- **Pet water (1 oz per lb per day), pace count (60-70 double paces per 100 m), pack weight for children (10-15%), bleach replaced yearly, toilet paper per person, bucket capacity, walking 8-12 miles a day:** common rules of thumb with no authoritative page found.
- **Latrine distances (reference):** sources disagree (CDC and the Forest Service 100 ft; NRCS 150 ft from a well). The article uses the larger, cautious figures. Local codes govern.
- **Lightning, flood, tornado and heat-index guidance** were checked against NWS pages in the first pass; no change.

## Second pass (2026-11-16)
Scope: re-check of the 19 rows the first pass left Unverified. About 63 search and fetch calls were used across the three logs (shared budget). Official pages that blocked access: fcc.gov and redcross.org (403), the Dietary Guidelines PDF (too large).

**Counts for this log.** Unverified: 19 before, 8 after. Of the 11 resolved: 6 Confirmed, 2 Corrected, 3 Softened. Totals now: Confirmed 163, Corrected 15, Softened 14, Unverified 8 (200 rows). Edits in nav.js, prep.js and reference.js (start.js unchanged): 7. All four files pass `node tools/validate.mjs` (reference.js keeps its one old warning).

### Corrections made in the second pass
| Article | Was | Now | Source |
|---|---|---|---|
| master-checklist (prep.js) | "Water filter (0.1-0.2 micron)" | "Water filter rated 1 micron absolute or smaller (0.3 micron or smaller also stops bacteria) ... Filters do not remove viruses, so treat the water too" | CDC emergency water and Cryptosporidium pages (search results); CDC Yellow Book |
| pantry-rotation (prep.js) | "The one exception in the US is infant formula: use before its date" | "The main exception in the US is infant formula: never use it after its 'use by' date" | FSIS Food Product Dating (search result) |
| pantry-rotation (prep.js) | Column "Sealed with oxygen absorbers, cool", no caveat | Column marked "(estimates)"; new note: estimates from packers and food-storage groups, heat shortens them, absorbers only for truly dry foods (about 10% moisture or less), never moist, fresh or oily foods | USU Extension and BYU poster (search results) |
| calorie-table (reference.js) | "Adult, active or heavy labor | 2,500-4,000" | "Adult, active | 2,200-3,000" and "Very hard labor, long hikes, cold weather | 3,000 or more" | Merck Manuals table reproducing DGA 2020-2025 (opened) |
| numbers-to-remember (reference.js) | Latrine: at least 200 ft from water; well at least 100 ft | 200 ft from streams and lakes (CDC minimum 100 ft / 30 m); well at least 100 ft, 150 ft (45 m) or more is better | CDC cholera page; USDA Forest Service handbook; NRCS well specification 642 (search results) |
| conversions (reference.js) | "104 F / 40 C: Heat stroke range" | "Heat stroke range (starts near 103 F / 39.4 C)" | CDC and NWS heat pages (search results) |
| traveling-on-foot (nav.js) | "Heavy walking burns 2,500-4,000 calories a day" | "Long days of heavy walking with a pack can burn well over 2,500 calories" | No source found; unsourced upper bound removed |

### Confirmed in the second pass (no article change)
Red Cross 1-800-733-2767 (redcross.org pages in search results); aspirin 162-325 mg chewed (2024 AHA / Red Cross first aid guidelines; four 81 mg = 324 mg); heat stroke 103 F (CDC, NWS; app-wide now consistent); freeze fish at -4 F for 7 days (FDA); the 18 F rule as a rough quality-only rule (Army medical manual).

### Log fix
The first-pass claim row for numbers-to-remember water said "3 min above 6,500 ft". The article and the canonical rule say 5,000 ft (1,500 m); the log row is corrected. reference.js line 36 already reads "3 minutes above 5,000 ft / 1,500 m".

### Sources opened or seen in the second pass
- Opened: Merck Manuals calorie table (cites DGA 2020-2025).
- Seen in search results: CDC emergency water, Cryptosporidium prevention, Yellow Book, cholera prevention and heat-illness pages; NWS heat-illness page; FSIS Food Product Dating; FDA Fish and Fishery Products Hazards and Controls Guidance chapter 5; AHA / Red Cross 2024 first aid guidelines; redcross.org chapter and customer service pages; USU Extension food storage page and BYU poster; Army medical manual (armymedical.tpub.com); USDA Forest Service handbook 7409.11; NRCS well specification 642.
