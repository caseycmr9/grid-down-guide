# Fact-check log: family
Checked 2026-11-16 by AI against the sources listed. NOT a substitute for review by a qualified person.

Files: `data/family.js` (6 new articles: kids-explain-crisis, kids-activities, kids-safety-skills, infant-feeding-crisis, power-dependent-medical, community-mutual-aid). It passes `node tools/validate.mjs data/family.js` (OK; one soft length warning on infant-feeding-crisis, about 1,050 words).

**Method note.** These are new articles, written and checked in one pass. The shared web-search budget ran out partway through, so the children's-stress, kids-safety and neighbor articles lean on pages I could open (Ready.gov, FEMA CERT, AAP water safety, SAMHSA) and on general, widely taught guidance that is flagged Unverified below. "Seen in search results" means I only saw a search summary of that page, not the page itself. Several official PDFs (AAP shortage sheet, CDC emergency-formula PDFs, NCTSN pages) returned 403/404 or were script-rendered and could not be read.

## Summary
- Claims checked: 81 rows in the Claims table (some rows group related numbers; one row was split in the second pass).
- After first pass: Confirmed 60 | Softened 6 | Unverified 14 (80 rows). Separately, 4 of my own first-draft statements were corrected after checking (see Corrections made).
- After second pass (current): Confirmed 63 | Corrected 1 | Softened 6 | Unverified 11 (81 rows). See "Second pass" at the end.
- Highest-risk items backed by an opened official source: no diluting formula / no homemade formula (HealthyChildren, CDC), no honey under 12 months (CDC), no water under 6 months (AAP), boil 1 min / 3 min above 6,500 ft for formula water (CDC), 2-hour and 1-hour formula limits and 4-hour power rule (CDC), powder not sterile for under-2-month-olds (CDC), insulin 28 days at 59-86 F (FDA and ADA), oxygen fire distances (ALA, MedlinePlus), generator 20 ft and CO (Ready.gov), dialysis hotlines and plan (CDC, NKF), infant dehydration signs and the 3-hour no-urine rule (AAP).
- Articles marked `priority: 1`: infant-feeding-crisis, power-dependent-medical.

## Corrections made
These are changes to my own first drafts after checking (no existing article was edited).

| Article | Was (draft) | Now | Source |
|---|---|---|---|
| power-dependent-medical | Oxygen kept "at least 10 feet" from flame (copied from the elderly-disabled article) | "At least 6 feet (2 m); farther is safer; supplier's rules come first". Sources give 5 ft (ALA) and 6 ft (ATS, MedlinePlus); no opened source says 10 ft | lung.org Using Oxygen Safely; MedlinePlus Oxygen safety |
| kids-activities | "Swallowed button battery or magnet: go to a hospital or call 911" | Button battery: go to a hospital now, do not wait for symptoms, do not induce vomiting, call Poison Control 1-800-222-1222 (also a National Battery Ingestion Hotline exists). Magnet: urgent medical care (unverified detail) | poison.org/battery |
| infant-feeding-crisis | Home ORS recipe for babies (via link) presented as normal | Premixed or packet ORS first; the home recipe is "a last resort for babies" | HealthyChildren, Diarrhea in Babies |
| infant-feeding-crisis | One rule for all babies on cooling boiled water | Two rules: under 2 months, born early, or weak immunity: ready-to-feed if at all possible, else wait about 5 minutes after boiling (about 158 F / 70 C), mix, then cool the bottle; others: boil 1 minute and cool | CDC Infant Formula Preparation and Storage; CDC emergency formula pages |

## Claims checked
| Article | Claim | Verdict | Source (org + URL) |
|---|---|---|---|
| infant-feeding-crisis | Breastfeeding is the safest way to feed an infant in a disaster | Confirmed | CDC, cdc.gov/infant-feeding-emergencies-toolkit/php/facts.html and /special-considerations.html |
| infant-feeding-crisis | Ready-to-feed formula is the safest formula in an emergency; needs no water; sterile | Confirmed | CDC facts.html; CDC FAQ PDF (cdc.gov/infant-feeding-emergencies-toolkit/media/pdfs/FAQ-IYCF-E-508.pdf) |
| infant-feeding-crisis | Use bottled water for powder; if none, boil 1 minute (3 min above 6,500 ft) and cool | Confirmed | CDC special-considerations.html; CDC food-safety-for-infants-after-a-disaster page |
| infant-feeding-crisis | Disinfected (bleach-treated) water is also acceptable for formula | Confirmed (via search summary; page text not opened) | CDC emergency formula pages, search results |
| infant-feeding-crisis | Do not dilute formula; follow can amounts exactly | Confirmed | CDC facts.html; HealthyChildren "feed our baby if running low on money" |
| infant-feeding-crisis | Diluted formula can cause seizures | Softened ("can cause seizures and serious illness"); seizure wording seen in HHS family flier via search summary only | HHS (hhs.gov/formula), search results |
| infant-feeding-crisis | Never make homemade formula (lacks nutrients, contamination risk) | Confirmed | HealthyChildren (AAP "strongly advises against"); CDC powdered-infant-formula page |
| infant-feeding-crisis | No honey before 12 months (infant botulism), including on pacifiers | Confirmed | CDC, cdc.gov/infant-toddler-nutrition/foods-and-drinks/foods-and-drinks-to-avoid-or-limit.html |
| infant-feeding-crisis | No plain water under 6 months | Confirmed | AAP via HealthyChildren, Choose Water for Healthy Hydration |
| infant-feeding-crisis | No juice before 12 months | Confirmed | CDC foods-and-drinks-to-avoid-or-limit.html |
| infant-feeding-crisis | No cow's milk or plant milk as main drink before 12 months; cow's milk can cause intestinal bleeding and is poor in iron | Confirmed (bleeding: CDC; iron: AAP via news summary) | CDC foods-and-drinks page; HealthyChildren low-on-money page |
| infant-feeding-crisis | Tea under 6 months is unsafe | Unverified as a named item; covered by "liquids only from breast milk or formula" | HealthyChildren Choose Water |
| infant-feeding-crisis | Powder is not sterile; under 2 months, premature, or weak immunity should get ready-to-feed; Cronobacter | Confirmed | CDC emergency powdered-formula page; CDC preparation-and-storage page |
| infant-feeding-crisis | Wait about 5 minutes after boiling, water about 158 F (70 C), then cool the formula (high-risk babies) | Confirmed (routine guidance; applied to emergencies as the conservative choice) | CDC preparation-and-storage page |
| infant-feeding-crisis | Measure water first, then add scoop; shake, do not stir; warming not required; never microwave; test on wrist | Confirmed | CDC emergency powdered-formula pages |
| infant-feeding-crisis | Use within 2 h of mixing and within 1 h after feeding starts; discard leftovers; mix fresh each feed without a fridge | Confirmed | CDC emergency powdered-formula pages |
| infant-feeding-crisis | Discard fridge formula if power out 4 hours or more | Confirmed | CDC special-considerations.html |
| infant-feeding-crisis | Discard cans that are dented, rusted, puffy, unsealed or exposed to unsafe water | Confirmed | CDC emergency powdered-formula page |
| infant-feeding-crisis | Bottles and nipples are hard to clean; use new disposable cup each feeding; discard nipples touched by floodwater | Confirmed | CDC special-considerations.html; CDC FAQ PDF |
| infant-feeding-crisis | Cup-feeding technique (upright, sip from the rim, never pour) | Unverified (general lactation teaching; CDC says ask a lactation provider) | CDC FAQ PDF refers to a lactation provider |
| infant-feeding-crisis | Wash bottle parts, boil 5 minutes, air-dry (2nd pass) | Confirmed (CDC text seen in search result: boil items in safe water 5 minutes, air dry, do not dry with a towel; sanitizing is for babies under 2 months or sick, and all items at least daily; throw out nipples that touched floodwater) | CDC, How to Clean Infant Feeding Items During Emergencies, cdc.gov/infant-feeding-emergencies-toolkit/php/how-to-clean-infant-feeding-items-during-emergencies.html (search result) |
| infant-feeding-crisis | Hand sanitizer at least 60% alcohol if no soap and safe water | Confirmed | CDC emergency powdered-formula page |
| infant-feeding-crisis | Stress can slow letdown but milk is still made; switching to formula lowers supply; hand expression without power | Confirmed | CDC facts.html; CDC FAQ PDF |
| infant-feeding-crisis | Relactation is possible with frequent nursing/expression; needs lactation support | Confirmed | CDC FAQ PDF; CDC facts.html |
| infant-feeding-crisis | Breast milk storage: fresh 4 h room temp (up to 77 F) / 4 days fridge; thawed 24 h fridge, never refreeze; leftover within 2 h | Confirmed | CDC FAQ PDF, Human Milk Storage Guidelines |
| infant-feeding-crisis | Newborn feeds 8-12 times in 24 hours | Confirmed | CDC newborn-basics page; HealthyChildren How to Tell if Baby is Getting Enough Milk |
| infant-feeding-crisis | Women's Health and Breastfeeding Helpline 1-800-994-9662, weekdays | Confirmed (hours 9-6 ET shown in CDC FAQ PDF) | CDC FAQ PDF; womenshealth.gov (search results) |
| infant-feeding-crisis | Do not use unscreened breast milk from strangers/internet | Confirmed (search summary of FDA and AAP) | FDA "Use of Donor Human Milk" and AAP, seen in search results |
| infant-feeding-crisis | Formula amounts: week 1 1-2 oz; end of month 1 3-4 oz every 3-4 h; 6 months 6-8 oz, 4-5 feeds; 2 1/2 oz per pound per day, up to about 32 oz | Confirmed | HealthyChildren, amount-and-schedule-of-formula-feedings |
| infant-feeding-crisis | "Plan up to about 1 quart (1 L) of water a day for mixing" | Softened (derived from the 32 oz daily limit, not stated by a source) | Derived |
| infant-feeding-crisis | Switching to another regular formula is fine for most babies; specialty formulas need a doctor | Confirmed | HealthyChildren low-on-money page |
| infant-feeding-crisis | Do not stretch formula with solid foods | Confirmed (search summary of AAP shortage sheet) | AAP "Baby Formula Shortages" (publications.aap.org), seen in search results |
| infant-feeding-crisis | Ask pediatrician, WIC, 211 for formula help | Confirmed | HealthyChildren low-on-money page; AAP sheet via search results |
| infant-feeding-crisis | Whole cow's milk as a brief stopgap over 6 months in a shortage (AAP 2022) (2nd pass) | Confirmed in part (HHS formula-shortage page in search results: if you cannot find any formula and the baby is over 6 months, ask a pediatrician about pasteurized, unflavored whole cow's milk as a short-term option, and start iron-rich foods; AAP "Baby Formula Shortages" sheet in search results says an urgent short-term replacement for 6-12 months, about a week. The article's "days, not weeks" and "ask a doctor first" are at least as cautious. The AAP PDF itself and the current AAP view were not opened) | HHS, hhs.gov/formula; AAP, publications.aap.org Baby Formula Shortages (search results). See Needs human expert review |
| infant-feeding-crisis | 6+ wet diapers/day by day 5-7; content 1-3 h between feeds | Confirmed | HealthyChildren How to Tell if Baby is Getting Enough Milk; CDC newborn-basics |
| infant-feeding-crisis | Fewer than 6 wet diapers or fewer than 3 stools by day 5 is a warning | Confirmed | CDC newborn-basics |
| infant-feeding-crisis | Dehydration signs: fewer wet diapers, sleepy, sunken soft spot, no tears | Confirmed | HealthyChildren Choose Water for Healthy Hydration |
| infant-feeding-crisis | With diarrhea: call if no urine for 3 hours or more; keep breastfeeding; premixed ORS, not homemade | Confirmed | HealthyChildren Diarrhea in Babies |
| infant-feeding-crisis | Fever 100.4 F (38 C) or higher under 3 months is an emergency | Confirmed (matches AAP and the babies-kids article) | HealthyChildren Diarrhea in Babies |
| power-dependent-medical | Insulin vials/cartridges, opened or unopened, last up to 28 days unrefrigerated at 59-86 F; fridge 36-46 F until expiry | Confirmed | FDA, fda.gov/drugs/emergency-preparedness-drugs/information-regarding-insulin-storage-and-switching-between-products-emergency; ADA, diabetes.org/sites/default/files/2024-04/ddrc-storing-insulin-2018.pdf |
| power-dependent-medical | Never freeze insulin; do not use frozen insulin; keep it from ice | Confirmed | FDA; ADA |
| power-dependent-medical | Insulin warmer than 86 F may still be used in an emergency, replace ASAP | Confirmed | FDA; ADA |
| power-dependent-medical | Some insulin products differ from 28 days: check label | Confirmed | FDA (Awiqli 12 weeks example); search summary of labels |
| power-dependent-medical | Discard refrigerated medicines after more than a day without power unless label says otherwise | Confirmed | Ready.gov, ready.gov/power-outages |
| power-dependent-medical | Oxygen: no smoking, open flame, gas stove, aerosols, petroleum products; 5-6 ft minimum; tanks not in closets/trunks; never change flow rate | Confirmed (5 ft ALA, 6 ft MedlinePlus; article uses the larger) | lung.org Using Oxygen Safely; MedlinePlus patientinstructions/000049 |
| power-dependent-medical | Do not use candles near oxygen (use flashlights) | Softened (ALA/MedlinePlus say keep open flame and candles away; "use flashlights" is my inference from that) | MedlinePlus; ALA |
| power-dependent-medical | Generators outdoors only, at least 20 ft from home; CO alarms with battery backup; cool before refueling | Confirmed | Ready.gov, ready.gov/power-outages |
| power-dependent-medical | Ask provider before lowering oxygen flow rate to stretch supply; keep backup cylinders | Confirmed | PG&E medical devices page (pge.com/en/newsroom/safety-action-center/emergency-preparedness/medical-devices.html); ALA |
| power-dependent-medical | Ventilator users keep a hand-held resuscitation bag; caregivers must be trained | Confirmed (bag: PG&E; training: ADA-network checklist in search results) | PG&E; search results (ADA National Network power planning checklist) |
| power-dependent-medical | Keep a lightweight manual wheelchair and a spare charged battery | Confirmed | PG&E; Ready.gov, ready.gov/disability |
| power-dependent-medical | Utility medical programs give notice but do not guarantee power or priority restoration | Confirmed | Portland General Electric (portlandgeneral.com/outages-safety/be-prepared/powering-medical-equipment); PG&E page (Medical Baseline customers still shut off) |
| power-dependent-medical | HHS emPOWER Map is for planners (de-identified Medicare data) and does not enroll individuals | Confirmed | empowerprogram.hhs.gov/about-empowermap.html |
| power-dependent-medical | Register with local emergency management / disability registries | Confirmed | Ready.gov, ready.gov/disability |
| power-dependent-medical | Dialysis: call unit, emergency diet, KCER hotline 1-866-901-3773, NKF 1-855-653-2273 | Confirmed | CDC, cdc.gov/kidney-disease/caring/index.html; NKF (kidney.org) |
| power-dependent-medical | Home hemo: 2-week supplies, know how to stop treatment if power fails; PD: know manual (CAPD) exchanges, 2-week supplies | Confirmed | NKF, kidney.org/kidney-topics/planning-emergencies-guide-people-kidney-disease |
| power-dependent-medical | Missed dialysis: pounding heartbeat, shortness of breath, chest pain, nausea/vomiting need emergency care (high potassium) | Confirmed | NKF hyperkalemia page (kidney.org/atoz/content/hyperkalemia) |
| power-dependent-medical | Medical-needs shelters: backup power, caregiver usually required, bring about a week of medicine | Softened (Florida county health department pages seen in search results only) | floridahealth.gov county pages, search results |
| power-dependent-medical | Heated humidifier is a major share of CPAP power; ask doctor before turning it off | Unverified (vendor pages only; wording kept as "ask your doctor") | Search results (vendor pages) |
| power-dependent-medical | Inhaler with spacer can stand in for a nebulizer (ask doctor first) | Softened (supported by trials/meta-analyses in acute asthma, seen in search results; not guidance for home outages) | PubMed/PMC studies in search results |
| power-dependent-medical | Gravity or syringe feeding backup only if the care team taught you | Unverified (supplier and university tip sheets in search results; no opened official source) | Search results (UIC DSCC, suppliers) |
| power-dependent-medical | Battery hours = Wh x 0.8 / watts; volts x amps = watts | Unverified as a standard (common rule of thumb; 0.8 is a typical inverter/battery loss allowance) | General engineering |
| power-dependent-medical | Air mattress failure: reposition every 2 hours | Confirmed (consistent with the home-nursing article) | data/health.js |
| power-dependent-medical | Ostomy: no power needed, keep extra supplies | Unverified (no quantity stated; "ask your ostomy nurse") | UOAA search results |
| kids-explain-crisis | Younger children regress (bedwetting, sleep problems, separation anxiety); older children show anger, school problems, withdrawal | Confirmed | Ready.gov, ready.gov/coping-with-disaster |
| kids-explain-crisis | Hug and touch, answer simply, share feelings or draw, extra one-on-one time, chores, limit repeated news images, restore routine | Confirmed | Ready.gov, ready.gov/coping-with-disaster |
| kids-explain-crisis | Seek help if stress persists, worsens or interferes with school or relationships | Confirmed (wording kept free of a time limit) | Ready.gov, ready.gov/coping-with-disaster |
| kids-explain-crisis | Disaster Distress Helpline 1-800-985-5990, call or text, 24/7; 988 for suicidal thoughts | Confirmed | SAMHSA, samhsa.gov/find-help/helplines/disaster-distress-helpline; 988 canonical |
| kids-explain-crisis | Age-by-age wording, "use the word died", do not promise "nothing bad will happen" | Unverified (standard psychological-first-aid style advice; NCTSN pages are script-rendered and would not load) | NCTSN (not readable) |
| kids-activities | Button battery swallowed: immediate care, do not wait, do not induce vomiting, Poison Control 1-800-222-1222 | Confirmed | poison.org/battery |
| kids-activities | Swallowed magnets (especially more than one) need emergency care now, even if the child seems well (2nd pass) | Corrected (was "needs urgent medical care"; now "especially more than one ... go to an emergency room now, even if the child seems fine"). Reason: two or more magnets can pull together through the bowel wall; symptoms can be absent or delayed | CPSC news release and safety alert on small and high-powered magnets; HealthyChildren, Dangers of Magnetic Toys (call the pediatrician or go to the nearest emergency department right away); NASPGHAN/ESPGHAN magnet algorithm (search results) |
| kids-activities | No hiding in freezers/trunks; small-parts risk for under 3 | Unverified (general child-safety knowledge) | Not opened |
| kids-safety-skills | Bathe not alone until about age 6; swim lessons after first birthday; touch supervision; life jackets; empty buckets; floaties do not prevent drowning | Confirmed | AAP via HealthyChildren, Water-Safety-And-Young-Children |
| kids-safety-skills | Two ways out of each room, practice twice a year in the dark, crawl low, feel doors, stop-drop-roll, do not hide from firefighters | Confirmed | Ready.gov, ready.gov/home-fires |
| kids-safety-skills | 3-foot kid-free zone around stoves and fires (2nd pass) | Confirmed (NFPA 2026 educational messages: 3-foot safety zone around the stove, a 3-foot zone for kids and pets around heating equipment and fireplaces; Red Cross uses "kid-free zone" of 3 feet around the stove) | NFPA Educational Messages Desk Reference 2026; NFPA heating safety tip sheet; Red Cross Fire Prevention Week (search results) |
| kids-safety-skills | Some children sleep through smoke alarms; assign an adult | Unverified (USFA says to wake babies and very young children and help them out, which supports assigning an adult; the "sleep through alarms" wording itself was not seen) | USFA Fire Safety for Children; USFA caregivers checklist (search results) |
| kids-safety-skills | Whistle: three blasts means help | Confirmed (internal) | data/nav.js signaling-rescue |
| kids-safety-skills | Teaching 911 by age, separation rules, code word, contact card not showing the child's name | Unverified (standard child-safety advice; no source opened) | Not opened |
| kids-safety-skills | CPR / Stop the Bleed class age limits vary, ask the provider | Softened (AHA and Red Cross pages returned 403; Stop the Bleed page gives no age) | stopthebleed.org |
| community-mutual-aid | CERT teaches fire safety, light search and rescue, team organization, disaster medical operations; 3,200+ local programs; free online courses open to anyone | Confirmed | FEMA, fema.gov/cert |
| community-mutual-aid | Hot food above 140 F (60 C), cold below 40 F (4 C) | Confirmed (canonical value in CONTENT_GUIDE.md) | CONTENT_GUIDE.md |
| community-mutual-aid | Block-captain size, wellness-check method, signals, conflict panel | Unverified (organizing advice, not a checkable fact; consistent with community-security) | Not applicable |

## Needs human expert review
- **Cow's milk as a stopgap (infant-feeding-crisis, step 5 of "If formula runs out").** The AAP's own HealthyChildren page that I opened says whole cow's milk is not recommended under 12 months. The 2022 shortage guidance that allowed a brief stopgap after 6 months is now supported by an HHS formula-shortage page and an AAP shortage sheet, both seen only in search results (the AAP PDF returned 403 in the first pass); HHS says to ask a pediatrician first, and the AAP sheet says about a week. Canadian pediatric groups reportedly disagree, and the guidance was written for the 2022 shortage. A pediatrician should decide whether to keep this line; the article's "days, not weeks" is at least as cautious as the sources.
- **Cup-feeding technique** (upright, sip from the rim, never pour): general lactation teaching, not read from CDC. A lactation consultant should confirm the wording is safe for newborns.
- **Cooling rule for formula water.** CDC emergency pages say boil 1 minute and cool; CDC routine pages add "wait about 5 minutes" for babies under 2 months, born early, or with weak immunity. The existing babies-kids article was rewritten by another agent to the same two-tier rule (see review/health-sanitation.md). Confirm both articles stay in step.
- **Bottle sanitizing by boiling 5 minutes.** Resolved in the second pass: CDC's cleaning page text (search result) gives boil 5 minutes, air dry, no towel. Nothing further needed.
- **CPAP, nebulizer, tube-feeding and ventilator advice** (power-dependent-medical): backup-plan content is conventional, but I found no opened official source for the humidifier-off tip, the inhaler-plus-spacer substitution, or gravity feeding. Each line says "ask your doctor", but a respiratory therapist, dietitian and pharmacist should review. Home ventilator battery hours were not stated because I found no official figure.
- **Oxygen distance.** Sources give 5 ft (ALA) and 6 ft (ATS, MedlinePlus). The elderly-disabled article now also says 6 ft (it was 10 ft when this log was first written), so the two articles agree. A respiratory therapist or fire-safety officer may still want to confirm one figure for the whole app.
- **Medical-needs shelters** differ by state (Florida county pages only). Local law and local programs matter. Utility "medical baseline" or "life support" programs also differ by company and state.
- **Kids' CPR and Stop the Bleed ages.** Not verified; the article tells readers to ask the class provider.
- **Children's stress guidance** (kids-explain-crisis): based on Ready.gov plus standard psychological-first-aid practice. A child-trauma clinician or school counselor should confirm the age table, the "use the word died" advice and the crisis wording.
- **Existing-article conflicts to note for the lead:** (1) babies-kids and common-illness-care now say "no wet diaper for 3 hours or more", and elderly-disabled now says 6 ft for oxygen, so both earlier mismatches are fixed in the health files; `dehydration-ors` (not in this assignment) should be checked for the 3-hour rule; (2) dehydration-ors gives the WHO home ORS recipe without noting that AAP says homemade solutions may not be right for babies; (3) common-illness-care now paces ORS as about 1 teaspoon every 1-5 minutes (WHO 1-2 minutes for diarrhea; AAP 1-2 teaspoons every 5 minutes for vomiting), so dehydration-ors and infant-feeding-crisis should not give a conflicting pace.

## Second pass (2026-11-16)
Scope: the 14 Unverified rows. A few searches and fetches were spent on the family items (about 10 of roughly 60 total shared with the health and sanitation second pass), highest risk first: bottle boiling and the cow's-milk stopgap (infant feeding), swallowed magnets, then the fire-safety 3-foot zone. Most results are search-result summaries of official pages, marked as such.

**Counts.**
- Before: 80 rows: Confirmed 60, Softened 6, Unverified 14.
- After: 81 rows (the magnet row was split in two): Confirmed 63, Corrected 1, Softened 6, Unverified 11.
- Of the 14 original Unverified rows: 4 resolved (bottle boiling Confirmed, cow's-milk stopgap Confirmed in part, magnets Corrected, 3-foot zone Confirmed) and 10 still Unverified (tea under 6 months, cup-feeding technique, CPAP humidifier, gravity feeding, battery-hours rule of thumb, ostomy supplies, age-by-age wording for children, sleeping through alarms, teaching 911 by age, block-captain organizing). The split magnet row leaves one residual Unverified row (freezer/trunk hiding and small parts under 3), so 11 rows remain.

### Corrections made in the second pass
| Article | Was | Now | Source |
|---|---|---|---|
| kids-activities | "A swallowed magnet also needs urgent medical care." | "A swallowed magnet, especially more than one, is also an emergency: go to an emergency room now, even if the child seems fine." | CPSC small and high-powered magnet warnings; HealthyChildren Dangers of Magnetic Toys; NASPGHAN/ESPGHAN algorithm (search results) |

No other text in `data/family.js` was changed. `node tools/validate.mjs data/family.js` passes (the one soft length warning on infant-feeding-crisis is unchanged).

### Still unverified (none looks wrong; none changed)
- **Cup-feeding technique** and **tea under 6 months**: CDC publishes a cup-feeding handout (seen in search results, not opened); the article already sends readers to a lactation provider.
- **CPAP humidifier, gravity/syringe tube feeding, ostomy supplies, battery-hours formula**: all are phrased "ask your doctor/care team" or are a stated rule of thumb; no official page found.
- **Children's stress wording** and **teaching 911 by age**: standard psychological-first-aid and child-safety advice; NCTSN pages are script-rendered and could not be read.
- **Some children sleep through alarms**: USFA advises waking babies and very young children and helping them out, which supports the article's advice to assign an adult.
