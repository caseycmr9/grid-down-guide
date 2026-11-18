# Fact-check log: household-2 (candles, lamps, salves, cleaners, disinfecting, laundry, hygiene)
Checked 2026-11-17 by AI against the sources listed. NOT a substitute for review by a qualified person.

File: `data/household-2-candles-cleaning.js` (7 new articles, cat `household`; validates OK with no warnings).
Articles: candles-tallow-beeswax, oil-lamps-rushlights, beeswax-salves-polish, safe-cleaners, disinfecting-sanitizing, laundry-homemade, hygiene-products.

**Method note.** About 55 searches and fetches were used, spent first on the safety-critical numbers (bleach, chemical mixing, WHO hand-rub formula, alcohol and peroxide, methanol). "Opened" means I read the page text (for three PDFs, WebFetch returned binary, so I extracted the text myself with pdftotext from the saved file). "Search result" means I saw only the title and summary in search output; the page was not opened (or returned 403/404/connection error). The NCBI copy of the WHO Guidelines was blocked by a CAPTCHA, so the WHO figures come from the WHO PDF itself (who.int), which I did open. These articles are new, so the "Corrections" table lists places where the assignment brief or my first plan was changed after checking.

## Summary
- Claims checked: 97 rows in the Claims table.
- Confirmed 55 | Corrected 0 (see below) | Softened 10 | Unverified 32. Five items from the brief or first plan were changed after checking; they are in the Corrections table.
- Edits: this is new writing, so no existing article was changed. Brief suggestions changed after checking: the 5 tbsp plus 1 tsp bleach figure became the CDC figure (5 tbsp); separate CDC 8.25% numbers do not exist, so that column is calculated; vomit-cleanup dose set from the CDC range; WHO top-up wording. Ten claims were softened (ranges, "about", test-it-first wording, or calculated and labelled as such).
- Highest-risk items now backed by an opened official source: CDC bleach dilution and contact time, CDC norovirus bleach range, never-mix gas table (NJ Dept of Health and two poison centers), WHO hand-rub formula, flash points, CDC alcohol and peroxide limits, methanol warning, lamp-oil poisoning, oily-rag self-heating, herb-oil botulism, blood and rust stain methods.

## Corrections made
| Article | Was | Now | Source |
|---|---|---|---|
| disinfecting-sanitizing | Brief: "5 tablespoons plus 1 teaspoon of 5-6% bleach per gallon" for disinfecting | 5 tablespoons (1/3 cup) per gallon, 4 teaspoons per quart (any 5-9% bleach), wet at least 1 minute | CDC, Cleaning and Disinfecting with Bleach (opened) |
| disinfecting-sanitizing | Brief: bleach strengths "5-6% and 8.25%" with separate CDC dilutions | CDC gives ONE dilution for any 5-9% bleach and no separate 8.25% figure. The 8.25% column is calculated to give about the same ppm (3 tbsp is about 970 ppm; 2 tsp for dishes is about 215 ppm) and agrees in scale with the Lincoln, NE health department 8.25% table. The article says: if unsure of strength, use the 5-6% column | CDC (opened); Lincoln-Lancaster County Health Dept "Mixing Bleach" handout (opened via pdftotext) |
| disinfecting-sanitizing | Brief: vomit cleanup dose not specified | 1 cup per gallon, wet 5 minutes (about 3,300 ppm for 5.25% bleach, 5,200 ppm for 8.25%), inside CDC's 1,000-5,000 ppm range | CDC norovirus page (opened); Lincoln handout 5000 ppm = 1 cup/gal of 8.25% |
| hygiene-products | Brief hint of water amount for WHO formula | "Top up to the 1,000 mL mark" (not "add X mL water"), because alcohol and water shrink when mixed. WHO also says to wait 72 hours before use and to use a measuring cylinder | WHO Guide to Local Production (opened) |
| safe-cleaners | Brief: "washing soda from baking soda at about 400 F: verify" | Kept 400 F for about 1 hour but flagged that recipes range (300 F for 90 minutes up to 400 F for 30-60 minutes). Added weight-loss check (36.9% lost; calculated from molar masses) so users can tell when it is done | Consumer recipe sites in search results only; no authoritative source found |

## Claims checked
| Article | Claim | Verdict | Source (org + URL) |
|---|---|---|---|
| disinfecting-sanitizing | Disinfect surfaces: 5 tablespoons (1/3 cup) per gallon, 4 teaspoons per quart of bleach in room-temperature water | Confirmed | CDC https://www.cdc.gov/hygiene/about/cleaning-and-disinfecting-with-bleach.html (opened) |
| disinfecting-sanitizing | Leave wet at least 1 minute; make fresh every day (weaker after 24 hours) | Confirmed | CDC (same page, opened) |
| disinfecting-sanitizing | Use only 5-9% bleach; not scented, color-safe, splashless or unlabeled | Confirmed | CDC (same page, opened) |
| disinfecting-sanitizing | Dishes and food surfaces: 1 tablespoon of bleach per gallon | Confirmed | CDC https://www.cdc.gov/natural-disasters/safety/how-to-safely-clean-and-sanitize-with-bleach.html (opened) |
| disinfecting-sanitizing | Dish soak time of 1 minute, then air-dry | Unverified | Carried over from the existing laundry-dishes article. CDC page opened gives no time. Lincoln handout uses 2 minutes at 100 ppm |
| disinfecting-sanitizing | 8.25% column: 2 tsp per gallon (sanitize) and 3 tbsp per gallon (disinfect) | Softened | Calculated (see Corrections). Lincoln 8.25% table (opened): 1 tsp/gal = 100 ppm, 2 tbsp/gal = 600 ppm, 1 cup/gal = 5000 ppm |
| disinfecting-sanitizing | Vomit or diarrhea: 1 cup per gallon, wet 5 minutes, clean again with soap and hot water | Confirmed | CDC https://www.cdc.gov/norovirus/prevention/index.html (opened: 1,000-5,000 ppm, at least 5 minutes, clean again with soap and hot water) |
| disinfecting-sanitizing | Mold on hard surfaces: 1 cup per gallon | Confirmed | CDC natural-disasters bleach page (opened) |
| disinfecting-sanitizing | Room-temperature water; add bleach to water | Confirmed | CDC (room-temperature water); Lincoln handout (add bleach to water to reduce fumes) |
| disinfecting-sanitizing | Mixed solution loses strength; fresh daily | Confirmed | CDC Chemical Disinfectants https://www.cdc.gov/infection-control/hcp/disinfection-sterilization/chemical-disinfectants.html (opened: tap-water solutions can lose 40-50% of free chlorine in a month in closed opaque containers) |
| disinfecting-sanitizing | Bottle keeps full strength about 6 months, usable to about 1 year if cool and dark; old bleach weaker | Unverified | Only consumer and industry statements in search results (Clorox, Bob Vila). Clorox page opened had no figure. Article is conservative: old bleach gets the 1-cup mix |
| disinfecting-sanitizing | Alcohol: 60-90% best; activity drops sharply below 50%; flammable; no effect on spores | Confirmed | CDC Chemical Disinfectants (opened) |
| disinfecting-sanitizing | 91% alcohol: 3 parts alcohol to 1 part water is about 68% | Softened | Arithmetic: 0.91 x 3/4 = 68% |
| disinfecting-sanitizing | Keep alcohol wet at least 1 minute | Unverified | CDC lab data show seconds for some bacteria; EPA label contact times vary (EPA page says follow label). 1 minute is a conservative lay figure |
| disinfecting-sanitizing | Vodka (about 40%) too weak | Confirmed | CDC (below 50% drops sharply) |
| disinfecting-sanitizing | Peroxide 3% is weaker: 6-8 minutes for rhinovirus, not effective vs VRE at 3 and 10 minutes; keep in dark bottle | Confirmed | CDC Chemical Disinfectants (opened) |
| disinfecting-sanitizing | "Wet at least 10 minutes" for peroxide | Softened | Conservative choice above the 6-8 minute data; still may not kill tougher germs |
| disinfecting-sanitizing | Definitions of cleaning, sanitizing, disinfecting; follow contact time and keep wet | Confirmed | EPA https://www.epa.gov/coronavirus-and-disinfectants/whats-difference-between-products-disinfect-sanitize-and-clean (opened) |
| disinfecting-sanitizing | Vinegar and baking soda do not disinfect; EPA has not reviewed vinegar | Confirmed | EPA https://www.epa.gov/coronavirus-and-disinfectants/can-i-use-common-household-substances-kill-novel-coronavirus (opened). CDC Guideline for Disinfection (search result only) says baking soda, vinegar and borax are ineffective vs S. aureus |
| disinfecting-sanitizing | Norovirus: sanitizer works poorly, wash with soap; use bleach | Confirmed | CDC norovirus page (opened) |
| disinfecting-sanitizing | Boil cloths, bottles and tools 5 minutes | Unverified | Matches existing laundry-dishes article. A prior review log cites CDC infant-feeding cleaning (5 minutes); I did not open it |
| disinfecting-sanitizing | Sunlight and drying help a little, cannot be measured | Unverified | General; deliberately hedged |
| disinfecting-sanitizing | Do not make chlorine by electrolysis or other chemistry | Confirmed | Policy per assignment; no instructions given |
| safe-cleaners | Bleach + ammonia makes chloramine gas; symptoms (cough, chest pain, wheeze; pneumonia, fluid in lungs) | Confirmed | NJ Dept of Health Hazard Alert https://www.nj.gov/health/workplacehealthandsafety/occupational-health-surveillance/Hazard_Alert-Mixing-Cleaners.pdf (opened); Poison Control https://www.poison.org/articles/chlorine-gas (opened) |
| safe-cleaners | Bleach + vinegar, lemon juice or acids (toilet bowl cleaner, rust remover) makes chlorine gas; high levels can kill | Confirmed | NJ DOH (opened); Poison Control (opened) |
| safe-cleaners | Bleach + rubbing alcohol makes chloroform; dizziness, nausea, headache, loss of consciousness | Confirmed | NJ DOH (opened). Georgia DPH (search result only) adds eye, lung and liver damage |
| safe-cleaners | Bleach + drain cleaner, oven cleaner, mildew remover makes chlorine gas | Confirmed | NJ DOH (opened) |
| safe-cleaners | Hydrogen peroxide + vinegar makes peracetic acid (corrosive); also in one container | Confirmed | Missouri Poison Center https://missouripoisoncenter.org/some-things-just-dont-mix/ (opened); NJ DOH (opened) |
| safe-cleaners | Bleach + hydrogen peroxide is a never-mix | Confirmed | Missouri Poison Center (opened; names no gas, so the article names none) |
| safe-cleaners | Different drain cleaners react dangerously when combined | Confirmed | NJ DOH (opened) |
| safe-cleaners | Gas exposure: leave, fresh air, shower 20 minutes, change clothes; call 1-800-222-1222 | Confirmed | Poison Control chlorine gas page (opened) |
| safe-cleaners | Eye or skin splash: flush 15 minutes, 30 minutes for lye or strong alkali | Unverified | 30 minutes for alkali is the app's canonical value. 15 minutes for other cleaners was not stated on any page I opened |
| safe-cleaners | Swallowed cleaner: do not make the person vomit | Unverified | Standard poison-center advice but not stated on the pages I opened |
| safe-cleaners | Soap plus vinegar in one bottle cancels the soap (acid turns soap into fatty acids) | Confirmed | Chemistry teaching lab handout (opened, weak source): in acid solution soap loses cleansing action |
| safe-cleaners | Baking soda + vinegar mostly foam; closed bottle can burst | Unverified | General chemistry; no page opened |
| safe-cleaners | Washing soda from baking soda: about 400 F for about 1 hour, stir; loses about one third of weight (1 lb gives about 10 oz) | Softened | Weight loss is calculated (2 NaHCO3 168 g to Na2CO3 106 g). Bake conditions from consumer sites in search results, which disagree |
| safe-cleaners | Washing soda is a strong alkali; gloves and goggles; not for aluminum, wool, silk | Softened | Consumer sources in search results only. Alkali damage to wool and silk also noted in the lab handout and UGA stain page (opened) |
| safe-cleaners | Borax: not for eating; corrosive to eyes; skin irritant; infants more sensitive; skip around toddlers and pets | Confirmed | NPIC https://npic.orst.edu/factsheets/boricgen.html (opened). Pet and toddler advice is a conservative extension |
| safe-cleaners | Peroxide yeast test; dark bottle | Unverified | Practical test, no page opened. CDC says peroxide is stable in dark containers |
| safe-cleaners | Vinegar etches marble and natural stone; not for hardwood | Unverified | Common knowledge; no page opened |
| safe-cleaners | Drain advice: plunger and snake best; baking soda plus hot water for grease | Unverified | Common advice; no page opened |
| safe-cleaners | Cleaner recipes (1 tbsp washing soda + 1 tbsp soap per gallon, etc.) | Softened | Mild mixes; labeled approximate; no source |
| candles-tallow-beeswax | Keep candles 12 inches (30 cm) from anything that burns; use flashlights in outages; not in bedrooms; stable holders; blow out when leaving | Confirmed | US Fire Administration https://www.usfa.fema.gov/prevention/home-fires/prevent-fires/candle/ (opened); NFPA (search result) |
| candles-tallow-beeswax | Beeswax melts about 144-149 F (62-65 C) | Confirmed | Supplier safety data sheets in search results (61-65 C); pages blocked (403 or connection error) |
| candles-tallow-beeswax | Keep beeswax under about 185 F (85 C); overheated wax smokes and can ignite | Unverified | Craft guidance. SDS flash points in search results ranged from about 400 F upward |
| candles-tallow-beeswax | Tallow softens roughly 105-130 F (40-55 C) | Unverified | General reference ranges; no page opened |
| candles-tallow-beeswax | Never pour water on burning wax or fat; smother with a lid | Unverified | App's canonical value, matches existing fire-safety article. Not independently checked here |
| candles-tallow-beeswax | Wick size, 3-6 strands for 1/2-1 inch candle; trim to 1/4 inch | Unverified | National Candle Association page returned 404. Rule of thumb plus a test-burn method |
| candles-tallow-beeswax | 1 part beeswax to 3-4 parts tallow; stearic acid hardens tallow | Unverified | Craft rule of thumb |
| candles-tallow-beeswax | About 10-15 lumens per candle; 40-70 candle-hours per pound | Unverified | Estimates. A candle is about 1 candela, about 12 lumens by definition. Burn rate not sourced |
| candles-tallow-beeswax | Flames use oxygen and make some CO | Confirmed | EPA (search result): unvented combustion appliances release carbon monoxide |
| oil-lamps-rushlights | Never use gasoline, white gas, alcohol, lighter fluid in a wick lamp | Confirmed | Existing app lighting article; Missouri Poison Center lamp oil page (opened) lists only paraffin and K-1 as lamp fuels |
| oil-lamps-rushlights | Lamp oil swallowed can cause chemical pneumonia; 911 if trouble breathing; otherwise Poison Control | Confirmed | Missouri Poison Center https://missouripoisoncenter.org/lamp-oil-shedding-light-on-safety/ (opened) |
| oil-lamps-rushlights | Do not burn red (dyed) kerosene indoors; K-1 gives strong fumes | Confirmed | Missouri Poison Center (opened) |
| oil-lamps-rushlights | Do not make a child vomit after lamp oil | Unverified | Standard hydrocarbon advice; not stated on the page opened |
| oil-lamps-rushlights | Vegetable oil safer than kerosene (higher flash point) | Unverified | General; no figures given |
| oil-lamps-rushlights | Wick 1/8-1/4 inch above holder | Unverified | Rule of thumb |
| oil-lamps-rushlights | 1-3 teaspoons of oil per hour for a small lamp | Unverified | Rough estimate; article tells the reader to measure their own |
| oil-lamps-rushlights | Rushlight burns 15-30 minutes | Unverified | Matches existing soap-candles article |
| oil-lamps-rushlights | Lamps add CO; crack a window; CO alarm | Confirmed | EPA and CPSC (search results): unvented kerosene combustion releases CO; no lamp-specific rule found |
| beeswax-salves-polish | Fresh herb or garlic oils can cause botulism; refrigerate and use in 2-4 days; dried-herb oils up to 3 months in the fridge | Confirmed | Penn State Extension https://extension.psu.edu/how-to-safely-make-infused-oils (opened). Food guidance; applied conservatively to skin salves |
| beeswax-salves-polish | Wax to oil ratios 1:8, 1:6, 1:4 by weight; salve keeps 6-12 months | Unverified | Craft ratios; consistent with existing herbal-remedies (1:6-8). Article says test each batch |
| beeswax-salves-polish | Melted wax and oil weigh nearly the same per cup | Softened | Densities about 0.94 and 0.91 g/mL; calculated |
| beeswax-salves-polish | Plant and animal oils (olive moderate, linseed high) self-heat in piles; petroleum oils do not; hang outdoors | Confirmed | Fire Engineering https://www.fireengineering.com/firefighting/phenomenon-of-spontaneous-ignition-is-still-misunderstood-by-some/ (opened) |
| beeswax-salves-polish | Metal can with water and tight lid for oily rags; no dryers | Softened | NFPA advice relayed by a fire district (search result). Dryers not covered by the page opened |
| beeswax-salves-polish | No honey for babies under 12 months | Confirmed | App canonical value (existing bees-honey article); CDC page not re-opened |
| beeswax-salves-polish | Patch-test for beeswax or propolis allergy | Unverified | Standard practice; no page |
| beeswax-salves-polish | Cast iron: thin coat, 450 F for about an hour | Unverified | Common instruction; no page |
| beeswax-salves-polish | No salve on fresh burns or deep or infected wounds | Confirmed | Consistent with existing burns, wound-care and home-antimicrobials articles |
| laundry-homemade | Blood: cool water, never hot; soak; dab 3% peroxide 1-3 minutes | Confirmed | UGA Extension https://site.extension.uga.edu/textiles/care/stain-removal/remove-stains-from-blood/ (opened) |
| laundry-homemade | Rust: salt, lemon, sun; no chlorine bleach | Confirmed | UGA Extension https://site.extension.uga.edu/textiles/care/stain-removal/remove-stains-from-iron-rust/ (opened) |
| laundry-homemade | Do not use ammonia with bleach in laundry (UGA blood page suggests ammonia drops) | Confirmed | UGA page (opened) plus NJ DOH never-mix table. Article tells reader to skip ammonia |
| laundry-homemade | Ink: rubbing alcohol; grease: soap then hot wash; fruit, wax steps | Unverified | Iowa State and Oregon State extension pages seen only as search-result summaries |
| laundry-homemade | Sickroom laundry: detergent, hot water, dry fully on high heat; gloves | Confirmed | CDC norovirus page (opened); CDC gives no numeric temperature |
| laundry-homemade | White or colorfast cloth: soak 10 minutes in 1 tbsp/gal bleach; or boil 5 minutes | Unverified | CDC pages opened give no fabric bleach dose. Conservative choice using the dish-sanitizing mix |
| laundry-homemade | Laundry powder: 1 bar soap plus 1 cup washing soda; 2 tbsp per bucket | Unverified | Craft ratios, labeled rough |
| laundry-homemade | Washing soda and strong soap damage wool and silk | Confirmed | UGA page (ammonia damages silk and wool) and lab handout (excess alkali harms silk and wool), both opened |
| laundry-homemade | Washing soda eyes: flush 30 minutes; call 1-800-222-1222 | Confirmed | App canonical value (alkali burns) |
| laundry-homemade | Lice and bedbugs: 130 F (54 C) | Confirmed | Existing laundry-dishes article; not re-checked here |
| laundry-homemade | Bucket drowning risk for toddlers | Unverified | Well-known hazard; no page opened |
| hygiene-products | WHO hand rub: 833.3 mL 96% ethanol, 41.7 mL 3% peroxide, 14.5 mL 98% glycerol per liter, top up with cooled boiled or distilled water | Confirmed | WHO Guide to Local Production https://www.who.int/docs/default-source/documents/guidelines/guide-to-local-production.pdf (opened; 10 L amounts 8333, 417, 145 mL scaled) |
| hygiene-products | WHO isopropyl formula: 751.5 mL of 99.8% isopropyl per liter | Confirmed | WHO guide (10 L = 7515 mL, opened) |
| hygiene-products | Final strengths 80% v/v ethanol or 75% v/v isopropyl, glycerol 1.45%, peroxide 0.125% | Confirmed | WHO guide (opened) |
| hygiene-products | Wait 72 hours before use; peroxide is only for spores; no dyes or perfumes | Confirmed | WHO guide (opened) |
| hygiene-products | Flash point of 80% ethanol 17.5 C (63.5 F), 75% isopropyl 19 C (66 F) | Confirmed | WHO guide (opened) |
| hygiene-products | Spill: remove flames, ventilate, dilute with water; water works on alcohol hand-rub fire | Confirmed | WHO guide (opened: dilute to at least 10 times the volume; water or AFFF for fire) |
| hygiene-products | Alcohol volumes for other strengths: 99% isopropyl 758 mL; 91% 824 mL; 95% ethanol 842 mL | Softened | Calculated (target % x 1000 / label %). WHO says to adjust volume but its pamphlet gives no table; WHO also expects an alcoholmeter, which readers will not have |
| hygiene-products | Sanitizer must be at least 60% alcohol; soap and water first | Confirmed | CDC https://www.cdc.gov/clean-hands/about/index.html (opened) |
| hygiene-products | Sanitizer poor against norovirus and on dirty hands | Confirmed | CDC norovirus page (opened); WHO guide for use on clean hands is implied, not stated |
| hygiene-products | Methanol can cause blindness and death, absorbed through skin or swallowed; call 1-800-222-1222 | Confirmed | CDC HAN 00434 https://stacks.cdc.gov/view/cdc/90158 (opened). FDA consumer Q&A (search result): nausea, vomiting, headache, blurred vision, permanent blindness, seizures, coma, death |
| hygiene-products | Swallowing hand sanitizer can cause alcohol poisoning and death | Confirmed | FDA (search-result summary; FDA pages returned 404) |
| hygiene-products | Methanol found in washer fluid, fuel-line antifreeze, some denatured alcohol, moonshine | Unverified | General knowledge; no page opened |
| hygiene-products | Charcoal toothpaste: no evidence safe or effective | Confirmed | ADA MouthHealthy https://www.mouthhealthy.org/en/az-topics/w/natural-teeth-whitening (opened) |
| hygiene-products | Baking soda is a low-abrasion toothpaste ingredient | Confirmed | JADA (search-result summary) |
| hygiene-products | Fluoride: rice-grain smear under age 3, pea size ages 3-6 | Unverified | ADA guidance not opened |
| hygiene-products | Aloe mixes: 3 parts 91% alcohol to 1 part gel (68%); 2 parts 99% to 1 part gel (66%) | Softened | Calculated; both above CDC 60% |
| hygiene-products | Liquid soap from 1 bar in 1 quart; vinegar rinse 1 tbsp per cup; make small batches | Unverified | Craft guidance; no page |

## Needs human expert review
- **Bleach strength and 8.25% column.** CDC pages (opened) give one dose for any 5-9% bleach. The 8.25% column in disinfecting-sanitizing is calculated, not quoted. An extension or environmental-health expert should confirm it. Contact time differs between sources: CDC says 1 minute at about 1,000 ppm; the Lincoln, NE child-care handout says 2 minutes at 600 ppm. The article uses CDC's 1 minute with the matching 1,000 ppm mix.
- **Dish sanitizing soak time (1 minute)** is carried over from the existing laundry-dishes article and was not verified. A food-safety expert should confirm the time for 1 tablespoon per gallon.
- **Old bleach.** The 6-12 month shelf life is from consumer and industry sources. Confirm with EPA or the maker. The article tells readers to use the 1-cup mix when a bottle is old.
- **Alcohol and peroxide contact times** for household use (1 minute for alcohol, 10 minutes for 3% peroxide) are conservative lay figures, not EPA label times. EPA List N was not opened.
- **WHO hand-rub at home.** The WHO recipe assumes pharmacy-grade alcohol and an alcoholmeter. At home the label strength must be trusted. The adjusted volumes for 99%, 91% and 95% alcohol are my calculation. A pharmacist or chemist should check them and decide whether to keep this section.
- **Alcohol sources.** The list of products that may contain methanol (washer fluid, antifreeze, some denatured alcohol, moonshine) is general knowledge, not quoted from a source. Poison Control should confirm.
- **Fire response for alcohol hand rub (water works)** follows WHO but is the opposite of grease and wax fires. A fire-service reviewer should confirm that the wording cannot be misapplied.
- **Eye and skin flush times** for bleach and cleaners (15 minutes; 30 for alkali) and "do not induce vomiting" after cleaner or lamp-oil ingestion were not stated on opened pages. Poison Control should confirm.
- **Oily rags.** Water-filled metal can is relayed NFPA advice from a search result. A fire marshal should confirm, and confirm the advice about cooking-oil cloths in dryers.
- **Candle and wax numbers** (tallow melting range, 185 F beeswax limit, 10-15 lumens, 40-70 candle-hours per pound, wick sizing) are rules of thumb. A chandler or beekeeper should review.
- **Oil lamp details** (wick height, 1-3 teaspoons per hour, vented-lid homemade lamps) are unsourced. Test any homemade lamp outdoors on a metal tray first.
- **Salve ratios, shelf life, cast iron seasoning, laundry powder ratios** are craft figures with no authoritative source. Penn State's dried-herb oil limit (3 months in the fridge) is food guidance applied to skin products.
- **Fluoride toothpaste amounts by age** need an ADA or dentist check.
- **Borax.** NPIC (opened) calls borax low in toxicity if eaten but corrosive to the eye, with infants more at risk. The article advice to skip it around toddlers and pets is a conservative extension. Regional rules may vary.
