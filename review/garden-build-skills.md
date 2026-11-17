# Fact-check log: garden, build, skills
Checked 2026-11-16 by AI against the sources listed. NOT a substitute for review by a qualified person.

Files: `data/garden.js` (16 articles), `data/build.js` (11), `data/skills.js` (11). All three pass `node tools/validate.mjs`.

**Limits of this pass (read first).** The shared web-search budget ran out partway through, and many guessed Extension/FDA/CDC page addresses returned 404. Only pages actually opened (or seen in search results, marked "search result") are cited. Everything else was marked **Unverified**, even when it matched common Extension ranges. A second pass on 2026-11-16 closed many of those rows: see the final section "Second pass (2026-11-16)". Items marked "Confirmed (arithmetic)" were checked by calculation, not by a source.

## Summary
- Claims checked: 98 rows in the tables below (some rows group several routine numbers).
- Confirmed: 29 rows (18 against an opened source, 11 by arithmetic or physics).
- Corrected: 12 rows, plus 7 more rows where a safety statement was added or softened. See "Corrections made" (about 24 edits).
- Unverified: 52 rows after the first pass; **47 rows after the second pass** (26 claim rows resolved: 19 Confirmed, 7 Corrected; 5 rows closed outright and 13 split so only a routine remainder stays Unverified; the table grew from 98 to 119 rows because of the splits). What remains is mostly routine growing numbers, traditional skills and building rules of thumb. The ones that matter most are listed under "Needs human expert review".
- Canonical-value conflicts: none with the CONTENT_GUIDE canonical list. The first-pass cross-file conflict on kidney-bean boil time is now resolved (see below). New in the second pass: CDC advises 30 minutes of eye irrigation for lye, the app teaches 15-20 minutes for chemical eye flushes elsewhere (soap-candles now says at least 20, CDC 30).

## Corrections made
| Article | Was | Now | Source |
|---|---|---|---|
| growing-beans-corn-squash | Red kidney beans "must boil at least 10 minutes" | Soak at least 5 h, pour off water, boil hard in fresh water **at least 30 minutes**; never use a slow cooker or low heat; toxic raw or undercooked | FDA Bad Bug Book, 2nd ed., chapter "Phytohaemagglutinin" (https://www.fda.gov/media/83271/download, opened and text-extracted): 10 min at 100 C destroys the toxin in lab work, but "consumers should boil the beans for at least 30 minutes"; slow cookers "should not be used". Also K-State, https://www.k-state.edu/news/you-asked-it/articles/2017/10/cooking-dry-beans-safely.html |
| compost-fertilizer | Pile "should reach 130-160 F", turn every 1-2 weeks; hot pile "kills most weed seeds and germs" | 131-160 F; keep the whole pile at 131 F (55 C) or hotter for at least 3 days to kill most germs; move cool outer material into the hot middle; "kills most germs and many weed seeds" | USDA National Organic Program rule 7 CFR 205.203 (eCFR, opened): 131-170 F for 3 days (static/in-vessel) or 15 days with 5 turns (windrow). Oregon State Extension (https://extension.oregonstate.edu/es/node/99066/printable/print, opened): hold all material at 131 F for at least 3 days; weed seeds may need longer |
| compost-fertilizer | Browns:greens 3:1 by volume, no carbon:nitrogen ratio given | Added "roughly 25-30 parts carbon to 1 part nitrogen" | 7 CFR 205.203 (initial C:N 25:1-40:1); UC ANR and NDSU Extension pages seen in search results (preferred 25-30:1) |
| compost-fertilizer | "apply raw manure at least 90 / 120 days before harvest" (called a "rule of thumb") | "work raw manure into the soil" 90 days (edible part does not touch soil) / 120 days (touches soil); named as the USDA organic rule | 7 CFR 205.203(c)(1), eCFR (opened) |
| compost-fertilizer | Rabbit manure "can go straight on beds" | Gentler, will not burn plants, but still follow the waiting periods on food crops | Softened for food safety: the 90/120-day rule applies to raw manure generally (7 CFR 205.203) |
| garden-planning | 730,000 cal/yr at 15,000-25,000 cal per 100 sq ft = "4,000-8,000 sq ft (370-740 m2)" | 3,000-5,000 sq ft (280-465 m2); beginners plan on the high end or more | Arithmetic: 730,000 / 15,000 x 100 = 4,870 sq ft; / 25,000 = 2,920 sq ft |
| soil-basics | Potatoes "do better at 5.0-6.0" | Tolerate 5.0-6.5; lower end means less scab | UMN Extension, https://extension.umn.edu/vegetables/growing-potatoes (opened): pH 6-6.5, tolerate as low as 5 |
| growing-potatoes-roots, harvest-curing | Cure potatoes 10-14 days at 50-60 F | 50-65 F (10-18 C) | UMN Extension potatoes page: cure at 60-65 F for 10 days or more |
| harvest-curing | Garlic cure 2-3 weeks | 2-4 weeks | UMN Extension, https://extension.umn.edu/vegetables/growing-garlic (opened): 3-4 weeks |
| frost-dates-calendar | "light frost 29-32 F; hard freeze 28 F or lower" only | Renamed "light freeze" 29-32 F; hard freeze about 28 F (-2 C) or lower; added frost can form on clear calm nights when forecast low is 33-36 F | NWS Huntsville (https://www.weather.gov/hun/spring_freeze, opened): frost advisory 33-36 F; hard freeze at or below 28 F. WRCC (https://wrcc-archive.dri.edu/Climate/Education/freeze_frost.php, opened): light freeze 29-32 F, moderate 25-28 F, severe 24 F and below. NWS offices differ on "hard freeze" |
| season-extension | Cold frame 12 in back / 8 in front | About 18 in back / 12 in front | Consistency with garden-structures (18-24 in back / 12-16 in front); not a source correction |
| herb-garden | "Basil and cilantro keep better chopped and frozen in oil" | Frozen (not oil by default); if in oil keep frozen; herbs or garlic in oil at room temperature can grow botulism bacteria; fridge oil thrown away after 4 days. Also added: never give honey to a child under 1 year (thyme honey syrup bullet) | CDC botulism prevention page (https://www.cdc.gov/botulism/prevention/index.html, opened): "Refrigerate homemade oils made with garlic or herbs. Throw the oils away after 4 days." The honey/infant rule is the app's standard safety rule; that CDC page did not mention honey |
| wood-timber-basics | "12-15% for indoor work" | About 6-8% for furniture and floors in a heated home; air-dried wood outdoors stops at about 12-15%, so let boards sit indoors for weeks first | Purdue Extension FNR-403-W (https://www.extension.purdue.edu/extmedia/FNR/FNR_403_W.pdf, opened): interior lumber dried to 6-8%. Penn State Extension (https://extension.psu.edu/air-drying-lumber-from-your-own-forest, opened): outdoor EMC 12-15%; "air-dried lumber is likely not dry enough for most interior home uses" |
| framing-roofing | "Put collar ties across every third pair"; no tie against wall spread | Tie opposite rafters together low in the roof (ceiling joists or 2x4 rafter ties in the lower third) so the roof cannot push walls out; 1x4 collar ties in the upper third, no more than 4 ft apart; check a span table | Knox County (TN) Code Administration 2018 IRC rafter handout (https://www.KnoxCounty.org/codes/pdfs/construction_info/RafterInformation.pdf, opened): collar ties 1x4 min, upper third, not more than 4 ft on center; rafter ties 2x4 min, lower third |
| garden-structures | 4x8 ft bed 12 in deep holds "about 1 cubic yard" | About 1.2 cubic yards (32 cu ft) | Arithmetic: 32 / 27 = 1.19 |
| simple-machines | Dry soil "2,000-2,500 lb" per cubic yard | 2,000-2,700 lb | Arithmetic from the table's own 75-100 lb per cu ft x 27 |
| earth-building | Adobe brick "25-30 lb" | About 25-35 lb | Arithmetic: 10x14x4 in = 0.32 cu ft x 90-110 lb per cu ft |
| getting-around | "1-10-1 rule: 1 minute cold shock, 10 minutes useful movement, 1 hour to unconsciousness" | Water below 70 F (21 C) is dangerous; cold shock in the first minutes (worst 50-60 F), arm and leg strength fades quickly, people often drown long before hypothermia; life jacket matters most | Cold Water Boot Camp, https://www.coldwatersafety.org/1-10-1-myth (calls the 1-10-1 timeline a myth), /water-temperature-safety-guide and /survival-estimates (all opened) |
| soap-candles | "about a 6-8% superfat"; "Add lye to water"; eye flush only | "about 6-9% superfat"; "add lye to **cool** water"; eye flush with lids held open + 911/Poison Control 1-800-222-1222; **new bullet**: if swallowed rinse mouth, do not make the person vomit, call Poison Control or 911 | SoapCalc NaOH SAP values (https://soapcalc.net/oil-list, opened): olive 0.135, beef tallow 0.143, sheep tallow 0.138, lard 0.141. Recipe superfat works out to 8.9% (olive), 9.1% (beef tallow), 5.8% (sheep tallow), 7.8% (lard). NIOSH Pocket Guide sodium hydroxide (https://www.cdc.gov/niosh/npg/npgd0565.html, opened): eyes "irrigate immediately", skin "water flush immediately", swallowed "medical attention immediately". "Do not make the person vomit" is standard poison-control advice, not on that page |
| knots (whipping) | Press molten nylon flat "with a wet finger" after a few seconds | Melt outdoors; never touch molten nylon (sticks to skin, deep burns); let it cool completely | Safety-conservative edit; no source opened |
| cordage-rope | Paracord "7 inner strands" | "usually 7 inner strands (the military spec allows 7-9)"; added glove/skin/poison caution for nettle, dogbane, milkweed | Wikipedia "Parachute cord" (secondary, opened): Type III 550 lb, 7-9 core yarns. Plant caution: no source opened |
| leather-hides | Sinew thread: "wet a few fibers in your mouth"; sumac leaves and hemlock bark listed with no lookalike warning; smoking hide not marked outdoors; no prion warning | Wet with water; true sumac only, never poison sumac; hemlock = the evergreen tree, not poison hemlock; smoke outdoors; **new WARNING**: never use brain of a sick-looking animal, and not deer/elk/moose brain or spinal cord where chronic wasting disease (CWD) occurs | Safety additions. The CDC CWD pages could not be opened (404), so the CWD and sumac statements are **Unverified** and need expert review |
| home-industries | Charcoal can with no container-history warning; ash lye from "hardwood"; homemade vinegar with no strength warning | Can/drum must never have held fuel, solvents or chemicals; ash from clean, untreated wood; home-made vinegar has unknown strength, do not use for canning or storage pickling (use store-bought 5%); ash-lye warning now includes skin/eye flush | Conservative safety additions, no source opened. NCHFP 5%-vinegar rule not re-opened |
| garden-pests | No warning on household chemicals; Bt "safe for people" | **New WARNING**: never mix household chemicals for sprays, follow pesticide labels; Bt "low risk to people; follow the label" | Conservative safety additions, no source opened |
| build felling | "at least 2 tree-heights away" | Same number, now labeled the OSHA minimum for logging crews | 29 CFR 1910.266(h)(1)(iv) (https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.266, opened): "No employee shall approach a feller closer than two tree lengths". The briefing's "2.5 tree heights" could not be found in any opened source, so 2 was kept |
| earth-building | Clearance bullet | Added: a factory-built stove's label and manual list its tested clearances: follow those | Conservative addition |

## Claims checked
Verdict key: Confirmed = matches an opened source; Confirmed (arith) = checked by calculation; Corrected / Softened / Added = see table above; **Unverified** = no source opened this session.

### garden.js
| Article | Claim | Verdict | Source |
|---|---|---|---|
| garden-planning | Calories per lb x lb per 100 sq ft table is internally consistent | Confirmed (arith) | calculation; calories per lb themselves **Unverified** (USDA FoodData not opened) |
| garden-planning | Space per person (730,000 cal/yr) | Corrected | arithmetic |
| garden-planning | 6-8 h sun, 3-4 ft beds, 18-24 in paths, 400-1,000 sq ft first garden | **Unverified** | none |
| soil-basics | Jar test settling times, loam 40/40/20, ribbon test | **Unverified** | none |
| soil-basics | Veg pH 6.0-7.0, blueberry 4.5-5.5 | **Unverified** | none |
| soil-basics | Potato pH | Corrected | UMN Extension potatoes |
| soil-basics | Vinegar / baking-soda kitchen pH test; "pine needles lower pH" | **Unverified** (crude test; pine-needle effect is doubtful, not checked) | none |
| soil-basics | Lead warning (old paint, roads) | **Unverified** (conservative) | none |
| compost-fertilizer | 3x3x3 ft minimum pile | Confirmed (second pass) | UNH Extension (https://extension.unh.edu/resource/composting-home-gardener-fact-sheet), Illinois Extension (https://extension.illinois.edu/composting/how-it-works) and Clemson HGIC (https://hgic.clemson.edu/factsheet/composting/), all seen in search results: at least 3 ft per side (Illinois 3-5 ft) |
| compost-fertilizer | 3:1 browns:greens, C:N 25-30:1 | Confirmed | 7 CFR 205.203; UC ANR / NDSU (search results) |
| compost-fertilizer | 131 F for 3 days pathogen kill | Corrected (added) | 7 CFR 205.203; OSU Extension |
| compost-fertilizer | Manure 90 / 120 days | Confirmed (wording tightened) | 7 CFR 205.203(c)(1) |
| compost-fertilizer | Wood ash 2 lb per 100 sq ft per year | Confirmed; pH limit tightened (second pass) | Univ. of Wisconsin Extension (https://forest.extension.wisc.edu/2023/01/20/using-wood-ash-in-the-home-garden/) and UVM Extension (https://uvm.edu/news/extension/wood-ashes-home-garden), seen in search results: 15-20 lb per 1,000 sq ft per year (1.5-2 lb per 100 sq ft). Search-result summaries of Purdue, Rutgers and Alabama Extension say to avoid ash on soil near pH 6.5-7 or high in potassium, so the article now says none at pH 6.5 or higher |
| compost-fertilizer | Do-not-compost list (meat, dairy, pet waste) | Confirmed (second pass) | Penn State Extension, Missouri Extension G6958 (https://extension.missouri.edu/publications/g6958) and UC Sacramento Master Gardeners, seen in search results |
| compost-fertilizer | Cover crops; 4-bed rotation | **Unverified** | none |
| seeds-starting | Germination test method and how to read it | Corrected (second pass) | Illinois Extension, "Will my seeds still grow?" (https://extension.illinois.edu/sites/default/files/infosheet_seed_viability.pdf, opened and text-extracted): 10 seeds on a damp paper towel in a bag; 7-9 sprout, plant thicker; 6 or fewer, buy new seed. Article now says 6 or fewer of 10: sow much more thickly or replace the seed |
| seeds-starting | Depth 2-3x seed width; soil temps; 70-75 F indoors; hardening off 7-10 days | **Unverified** | none (Purdue HO-66-W and Oregon State planting tables, seen in search results, are consistent with the app for carrot, beet, pea, spinach and kale seed depths) |
| seeds-starting | Seed life table | Corrected (second pass) | Illinois Extension seed viability sheet (same PDF, opened; it cites Colorado State and Iowa State Extension): onion 1, parsnip 1, leek 2, corn 2, pepper 2, carrot, bean, pea 3, beet, chard, tomato, squash 4, cabbage 4, cucumber, radish, melon 5, lettuce 6. Purdue (search result) agrees on onion, parsnip, corn, pepper, tomato, cucumber. Parsnip 1-2 years was too long: it is 1 year |
| seed-saving | Isolation distances: tomato, pepper, corn | Corrected (second pass) | Illinois Extension, "How to Save Seeds" (https://extension.illinois.edu/sites/default/files/how_to_save_seeds_062021.pdf, opened and text-extracted; table from Seed Savers Exchange, columns garbled by text extraction, values match the search-result summary): tomato 10-50 ft, pepper 300-1,600 ft, corn 800 ft to 1/2 mile (the text says wind-pollinated crops such as corn should be a mile apart); bagging flowers or staggering flowering times also works |
| seed-saving | Brassica isolation 1/2 mile; hand pollination of squash | Confirmed (second pass) | Same Illinois sheet: brassicas 800 ft to 1/2 mile; hand pollination and bagging described |
| seed-saving | Wet-seed fermentation | Corrected (second pass) | Same Illinois sheet: ferment 2-4 days, stir daily, viable seed sinks. Article was 2-3 days |
| frost-dates-calendar | Light freeze 29-32 F, hard freeze 28 F | Confirmed (NWS offices vary) | WRCC; NWS Huntsville |
| frost-dates-calendar | Frost forms at forecast lows 33-36 F | Added | NWS Huntsville |
| frost-dates-calendar | Zone / frost-date table (labeled "very approximate"); minimum soil temps; weeks-before/after rules | **Unverified** | none |
| growing-potatoes-roots | Plant 4 in deep, 12 in apart, rows 30-36 in | Confirmed (UMN 3-5 in, 10-12 in, 30-36 in) | UMN Extension potatoes |
| growing-potatoes-roots | Water 1-2 in per week | Confirmed in part (UMN: 1 inch per week) | UMN Extension potatoes |
| growing-potatoes-roots | Cure temperature | Corrected | UMN Extension |
| growing-potatoes-roots | Store 38-40 F, 4-8 months | Confirmed (UMN: 32-40 F, 95% RH) | UMN Extension |
| growing-potatoes-roots | Green potato / sprout toxicity warning | Confirmed | UMN Extension: remove green, do not eat extensive green, sprouts toxic |
| growing-potatoes-roots | Sweet potato cure 80-85 F, store 55-60 F | Confirmed (second pass) | Penn State Extension, https://extension.psu.edu/sweetpotato-curing-and-storage (search result): 80-85 F, 85-95% humidity, 4-7 days, then 55-60 F. Other Extension pages give 3-5 or 10-14 days |
| growing-potatoes-roots | Sweet potato slips; root-crop table | **Unverified** | none |
| growing-beans-corn-squash | Kidney bean boil time | Corrected | FDA Bad Bug Book |
| growing-beans-corn-squash | Squash cure 10 days 80-85 F, store 50-55 F | Confirmed (second pass) | Illinois Extension winter squash and harvest pages (https://web.extension.illinois.edu/veggies/wsquash.cfm, search result): 10 days at 80-85 F, store at 50-55 F. Penn State says keep above 50 F and Missouri lists 55-60 F, so 50-55 F is the cool edge |
| growing-beans-corn-squash | Bean/corn/squash depths, spacing, days | **Unverified** | none (acorn squash curing exception not checked) |
| growing-beans-corn-squash | Pellagra / nixtamalization | **Unverified** (well established) | none |
| growing-grains | Yields, seeding rate, 13% moisture, ergot warning | **Unverified** | none |
| veg-quick-reference | Garlic storage "6-10 months" | Corrected (second pass) | Illinois Extension garlic page (https://extension.illinois.edu/herbs/garlic, opened): softneck about 6-8 months, hardneck about 3-4 months. Oregon State (search result): hardneck up to 6 months. Article now says softneck 6-8, hardneck 3-4 |
| veg-quick-reference | Spot check: carrot, beet, pea, spinach, kale depth, spacing, days | Confirmed (second pass, 5 crops) | Purdue HO-66-W, Oregon State and Illinois Extension planting guides, seen in search results: values sit inside the published ranges |
| veg-quick-reference | Remaining crop rows (timing, depth, spacing, days, storage); potato row consistent with UMN | **Unverified** as a set | none |
| watering-mulching | 1 inch of water = 0.62 gal per sq ft; 62 gal per 100 sq ft; 12 buckets | Confirmed (arith) | calculation |
| watering-mulching | 1 inch per week; mulch depth; greywater limits; shade cloth 30-50% | **Unverified** | none |
| garden-pests | Fence heights, hardware cloth, row cover | **Unverified** | none |
| garden-pests | Soap spray 1-2 tsp per quart; late blight handling | **Unverified** | none |
| garden-pests | Household-chemical warning; Bt wording | Added / Softened | conservative |
| harvest-curing | Potato and garlic curing | Corrected | UMN Extension |
| harvest-curing | Squash and sweet potato cure and storage; garlic storage | Confirmed / Corrected (second pass) | See the growing-beans-corn-squash, growing-potatoes-roots and veg-quick-reference rows above |
| harvest-curing | Onion, apple, cabbage storage numbers; weevil freeze 3-4 days; green tomato ripening 55-70 F | **Unverified** | none |
| harvest-curing / growing-grains | Corn "below about 14%" vs grain "13% or less" | **Unverified**, minor inconsistency left in place | none |
| fruit-nuts-perennials | Rhubarb leaves are poisonous, eat stalks only | Confirmed (second pass) | NDSU Extension, https://www.ag.ndsu.edu/news/columns/prairie-fare/prairie-fare-can-rhubarb-become-toxic (opened): "Do not eat any rhubarb leaves" |
| fruit-nuts-perennials | Elderberry berries must be cooked | Confirmed (second pass) | UMN Extension (https://extension.umn.edu/cottage-food-connection/elderberries-safe-way) and Oregon State elderberry bulletin, seen in search results: raw berries, stems and leaves contain cyanogenic glycosides; cook berries (UMN: boil at least 10 minutes) |
| fruit-nuts-perennials | Years to harvest table; chill hours below 45 F; pollination | **Unverified** | none |
| season-extension | Cold-frame size | Corrected (consistency) | n/a |
| season-extension | Sprout food-safety warning (who should avoid raw sprouts) | Confirmed; wording tightened to "cook thoroughly" (second pass) | Virginia Tech Extension FST-344 (https://pubs.ext.vt.edu/FST/FST-344/FST-344.html, opened): children, elderly, immunocompromised people and pregnant women should avoid raw sprouts. FDA consumer guidance seen in search results says high-risk groups should avoid raw or lightly cooked sprouts (fda.gov media 77178 returned 404 when opened) |
| season-extension | Vent above 70 F; row cover; hotbed; 6-mil plastic | **Unverified** | none |
| herb-garden | Herbs/garlic in oil botulism risk | Corrected / Added | CDC botulism prevention |
| herb-garden | Honey and infants | Added | app standard rule |
| herb-garden | Comfrey internal use, yarrow in pregnancy; drying times | **Unverified** (official pages); secondary sources agree | Drugs.com monographs and a trade report on FDA/FTC action against comfrey products (search results): oral comfrey not recommended (liver damage); oral yarrow avoided in pregnancy (Natural Medicines via Drugs.com). NIH/NCCIH and FDA pages were not found or opened. Both are conservative warnings and were kept |

### build.js
| Article | Claim | Verdict | Source |
|---|---|---|---|
| tools-essentials | Tool weights and sizes; 10 ft clear zone; oily-rag disposal | **Unverified** | none |
| measuring-squaring | 3-4-5 rule, diagonals check, area, cubic yards, board feet, rafter formula | Confirmed (arith) | geometry/calculation |
| measuring-squaring | Water level, A-frame level, pace length, batter boards 3 ft | **Unverified** | none |
| wood-timber-basics | Actual lumber sizes (1x4 to 4x4) | Confirmed | Wikipedia "Dimensional lumber" (secondary, opened) matches all six rows |
| wood-timber-basics | About 1 year per inch of thickness | Confirmed (folk rule; "most lumber dries quicker") | Penn State Extension |
| wood-timber-basics | Moisture targets (<20% framing/firewood; indoor) | Corrected (indoor) | Purdue; Penn State |
| wood-timber-basics | Rot-resistant species list; CCA before 2004 | **Unverified** | none |
| felling-splitting-firewood | Keep everyone 2 tree-lengths away | Confirmed | OSHA 1910.266(h) |
| felling-splitting-firewood | Notch 1/4-1/3 of diameter; back cut 1-2 in above and never below the notch; 45 degree escape paths; no felling in gusty wind | Confirmed (second pass) | Purdue Extension S-78 (https://www.extension.purdue.edu/extmedia/S/S-78.html, opened): notch about 1/3 diameter, back cut at least 2 in higher, escape at 45 degrees, avoid windy days. Oregon State EC 1124 (https://extension.oregonstate.edu/sites/extd8/files/documents/ec1124.pdf, opened and text-extracted): undercut about 1/3 diameter (1/4-1/3 elsewhere in the same bulletin), back cut at least as high as the notch (many loggers 1 in higher) and never lower, 45 degree escape path, do not fell when treetops are moving |
| felling-splitting-firewood | Hinge about 1/10 of diameter | Confirmed (second pass) | Search results for the OSHA logging training supplement (obis.osha.gov tree_trim_supplement.pdf, could not be opened), Univ. of Kentucky FOR-60 and Oregon State EC 1124 (opened: 1-1.5 in hinge on stumps under 24 in) |
| felling-splitting-firewood | "15 mph" wind limit | Corrected (second pass) | No source gives 15 mph. Oregon State: do not fell when treetops are moving. Article now says "if gusts are strong or the treetops are moving, wait" |
| felling-splitting-firewood | Bucking cuts; 6-8 lb maul | **Unverified** | none |
| felling-splitting-firewood | Seasoning times; 3-6 cords per winter | **Unverified**; cord = 128 cu ft Confirmed (arith) | none |
| fasteners-joinery | Penny nail sizes 6d-60d | Confirmed | Wikipedia "Nail (fastener)" (secondary, opened) |
| fasteners-joinery | Nail length rule, pilot holes, pegs, mortise 1/3, lashing steps | **Unverified** | none |
| framing-roofing | Collar ties / rafter ties | Corrected | Knox County 2018 IRC handout |
| framing-roofing | Joist and rafter spans; 4:12 shingle minimum; 200 sq ft permit exemption (hedged "check local codes"); snow 15-20 lb per sq ft; thatch 45 degrees; sod 50-100 lb per sq ft | **Unverified** (second pass added a WARNING that the span and header figures are rough; the Knox County handout opened earlier has no span table, only the AWC calculator inputs of 20 psf live load and 10 psf dead load) | none |
| framing-roofing | Rafter length 6.7 ft | Confirmed (arith) | calculation |
| earth-building | 15-25% clay, cob/adobe/rammed-earth dimensions, 63% oven door | **Unverified** | none |
| earth-building | Stove 36 in from combustibles, stovepipe 18 in, chimney 3-2-10 | Confirmed (second pass) | Univ. of Maryland Extension FS-940 (https://extension.umd.edu/sites/extension.umd.edu/files/publications/FS-940_Considerations_for_wood_pellet_stove_installation.pdf, opened and text-extracted): NFPA 211 (2010) table gives 36 in to ceiling, front, sides and rear for a radiant stove and 18 in for stove pipe; chimney at least 3 ft above the roof opening and 2 ft above anything within 10 ft; always follow the stove manual. Missouri Extension G1730 and G1732 (opened/search results) agree. NFPA 211 itself was not opened |
| rocket-stove-build | 4 in pipe = 12.5 sq in (80 sq cm); pot gap = 1/4 of riser width | Confirmed (arith) | calculation (gap area equals riser area) |
| rocket-stove-build | Boil 1 L in 10-15 min; bucket build dimensions; Dakota hole sizes; avoid galvanized | **Unverified** | none |
| solar-builds | 120 F scald limit | Confirmed (second pass) | CPSC childproofing guide and safety alerts (search results): set water heaters to 120 F or lower; a CDC-hosted study says a serious burn takes about 10 minutes at 120 F and about 3 seconds at 140 F |
| solar-builds | Box oven 250-300 F; panel cooker 200-250 F; dehydrator 120-140 F; screening materials | **Unverified**. The article has no photovoltaic, battery, fuse or wire-gauge content | none |
| garden-structures | Bed volume | Corrected | arithmetic |
| garden-structures | 55-gal barrel about 460 lb | Confirmed (arith) | 55 x 8.34 |
| garden-structures | Coop, hutch, fence dimensions; avoid CCA / creosote | **Unverified** | none |
| simple-machines | Lever MA = effort arm / load arm; pulley and ramp ratios; 12 ft / 3 ft ramp = 4:1; capstan friction | Confirmed (arith / physics) | calculation |
| simple-machines | Weight table; 1/5 working-load rule | **Unverified**; soil per cubic yard Corrected | none |
| simple-machines | About 50 lb repeated lifting | Confirmed | CDC NIOSH Lifting Equation (https://www.cdc.gov/niosh/docs/94-110/, opened): 51 lb load constant under ideal conditions |

### skills.js
| Article | Claim | Verdict | Source |
|---|---|---|---|
| knots | Steps for 10 knots; trucker's hitch about 3:1; "knot weakens rope by a third or more" | **Unverified** (standard teaching) | none |
| knots | Nylon end melting | Softened | n/a |
| cordage-rope | 550 paracord breaking strength | Confirmed | Wikipedia "Parachute cord" |
| cordage-rope | Reverse-wrap steps, fiber sources, soaking times | **Unverified** | none |
| sharpening-tools | Knife angle from blade-width ratios (1/3 = 20 degrees, 1/4 = 15 degrees) | Confirmed (arith): arcsin(1/3) = 19.5, arcsin(1/4) = 14.5 | calculation |
| sharpening-tools | Axe 20-25 degrees per side; grit ranges | **Unverified** | none |
| sewing-mending | Stitches, repairs, dubbin recipe | **Unverified** (no safety-critical numbers) | none |
| soap-candles | Olive oil 123 g lye, tallow/lard 130 g lye per 1,000 g fat; no lye excess | Confirmed | SoapCalc SAP values; superfat 5.8-9.1%; still lye-light even at Wikipedia SAP ranges (olive 131-140, lard 137-145 g NaOH per kg) |
| soap-candles | Water = 2x lye (33% lye solution); unit conversions (1,000 g = 2 lb 3 oz; 123 g = 4.3 oz; 130 g = 4.6 oz) | Confirmed (arith) | calculation |
| soap-candles | Add lye to water; heat; gloves, goggles; no aluminum; flush skin 15-20 min | Confirmed | Wikipedia "Sodium hydroxide" (secondary): exothermic, aluminum reacts, flush at least 10-15 min; NIOSH |
| soap-candles | No vinegar or other neutralizer on skin or eyes; flush skin at least 15 minutes; do not induce vomiting; eye flush time | Confirmed and strengthened (second pass) | CDC Medical Management Guidelines for Sodium Hydroxide (https://wwwn.cdc.gov/TSP/PHS/PHS.aspx?phsid=246&toxid=45, opened): brush off solids first, flush at least 15 minutes, "Neutralizing substances should not be used", "do not induce emesis", eyes at least 30 minutes. UNMC chemical-burn guidance and a BASF medical sheet (search results) agree. Article now says eyes at least 20 minutes (CDC advises 30 for lye), no neutralizer by mouth |
| soap-candles | pH 10 or less; arm test; rebatch | **Unverified** | none |
| soap-candles | Trace, mold, 24 h, 4-6 week cure; candle wick trim 1/4 in; rush light times | **Unverified** | none |
| soap-candles | Never mix bleach with vinegar/ammonia | Confirmed (standard; matches app rule) | no page opened |
| leather-hides | Salt, rawhide lye/lime soak 3-7 days, brain-tan quantities, bark tanning times | **Unverified** | none |
| leather-hides | CWD caution | Confirmed; wording tightened (second pass) | CDC chronic wasting disease page (https://www.cdc.gov/chronic-wasting/about/index.html, seen in search results): avoid handling or eating brain or spinal cord of any deer or elk; do not shoot, handle or eat animals that look sick; do not touch or eat animals found dead; consider testing. Article now says brain and spinal cord of deer, elk or moose, and "found dead" |
| leather-hides | Sumac and hemlock lookalike cautions; sinew | Added / Softened | none opened |
| home-industries | Charcoal method, yield 15-25% | **Unverified** | none |
| home-industries | Seawater 3.5% salt, 4-5 oz per gallon | Confirmed (arith): 3,785 g x 3.5% = 132-136 g = 4.7-4.8 oz | calculation |
| home-industries | Quicklime reacts violently with water; handling | Confirmed; warning strengthened (second pass) | NIOSH Pocket Guide, calcium oxide (https://www.cdc.gov/niosh/npg/npgd0093.html) and PubChem, seen in search results: reacts with water and releases heat (reports up to 800 C), irritates eyes, skin and lungs. "Add small lumps to a lot of water, a little at a time, outdoors" is standard slaking practice; no page seen states it, so treat that sentence as conservative practice |
| home-industries | Ash lye egg test | **Unverified** | none |
| home-industries | Vinegar acidity caution | Added | n/a |
| barter-trade | IRS taxes barter at fair market value | Confirmed | IRS Topic 420 (https://www.irs.gov/taxtopics/tc420, opened) |
| barter-trade | Pre-1965 US dimes/quarters/halves are 90% silver | **Unverified** (partly supported) | US Mint pages seen in search results confirm the 1965 switch to clad coins, 40% silver halves for 1965-1970 and "traditional 90 percent silver half dollars"; none seen states 90% for dimes and quarters |
| getting-around | Cold-water rule | Corrected | coldwatersafety.org |
| getting-around | Walking speed, pack 20-25% of body weight, animal load shares, bicycle numbers | **Unverified** | none |
| improvised-repair | Ladder 1 ft out per 4 ft (4:1) | Confirmed | OSHA 29 CFR 1926.1053(b)(5)(i) (opened): setback "approximately one-quarter of the working length" |
| improvised-repair | Flat-tire steps; compact spare 60 psi; jump-start order; 30-min radiator wait; frozen pipe; toilet flush 1-2 gal | **Unverified** | none |
| scavenging-salvage | N95 is not protection against asbestos | Confirmed | OSHA 1926.1101(h)(3)(i)(A) (opened): employers "must not select or use filtering facepiece respirators" for asbestos |
| scavenging-salvage | Lead paint in houses built before 1978 | Confirmed (second pass) | EPA lead pages seen in search results (https://www.epa.gov/lead/protect-your-family-sources-lead, https://www.epa.gov/lead/lead-renovation-repair-and-painting-program): residential lead paint banned in 1978; assume pre-1978 homes contain it |
| scavenging-salvage | Asbestos "pre-1980" | Corrected (second pass) | EPA page seen in search results: before 1987 builders often used asbestos-containing materials. Article now says "older buildings (EPA: common before 1987)" |
| scavenging-salvage | HT/MB pallet marks; hantavirus droppings | **Unverified** | none |

## Cross-file conflicts the lead must handle
- **Kidney beans (RESOLVED, checked by grep 2026-11-16):** `data/cook.js` and `data/recipes.js` now both say soak 5 hours, discard soak water, boil hard at least 30 minutes, never a slow cooker. Nothing left to do.
- Dry-bean boil line in `data/cook.js` (line ~270) now reads "Boil hard 10 minutes (30 minutes for kidney beans)". Fine.
- The FDA phrase "10 minutes at 100 C destroys the toxin" appears in the Bad Bug Book as laboratory data; the 30-minute figure is the consumer recommendation.

## Sources actually opened this session
- FDA Bad Bug Book 2nd ed. (PDF), https://www.fda.gov/media/83271/download. K-State, https://www.k-state.edu/news/you-asked-it/articles/2017/10/cooking-dry-beans-safely.html
- eCFR, 7 CFR 205.203 (fetched via https://www.ecfr.gov/api/versioner/v1/full/2024-01-01/title-7.xml?part=205&section=205.203). Seen only in search results: USDA AMS https://www.ams.usda.gov/grades-standards/soil-building-manures-composts
- Oregon State Extension, https://extension.oregonstate.edu/es/node/99066/printable/print. Seen only in search results: UC ANR compost PDF, NDSU home composting page
- OSHA 29 CFR 1910.266, 1926.1053, 1926.1101 (osha.gov standard pages) and the OSHA Logging eTool felling-hazards page
- NWS Huntsville, https://www.weather.gov/hun/spring_freeze. WRCC, https://wrcc-archive.dri.edu/Climate/Education/freeze_frost.php
- Purdue Extension FNR-403-W. Penn State Extension, https://extension.psu.edu/air-drying-lumber-from-your-own-forest. Seen only in search results: Missouri Extension G5550 (15-20% moisture adequate for unheated buildings)
- UMN Extension potatoes and garlic pages (extension.umn.edu/vegetables/growing-potatoes, /growing-garlic)
- CDC botulism prevention, https://www.cdc.gov/botulism/prevention/index.html. CDC NIOSH Pocket Guide sodium hydroxide, https://www.cdc.gov/niosh/npg/npgd0565.html. CDC NIOSH lifting equation, https://www.cdc.gov/niosh/docs/94-110/
- SoapCalc oil list, https://soapcalc.net/oil-list. IRS Topic 420, https://www.irs.gov/taxtopics/tc420
- Cold Water Boot Camp: https://www.coldwatersafety.org/1-10-1-myth, /water-temperature-safety-guide, /survival-estimates
- Knox County (TN) Code Administration rafter handout (2018 IRC), https://www.KnoxCounty.org/codes/pdfs/construction_info/RafterInformation.pdf
- Secondary (Wikipedia, used only to find or sanity-check tables): Saponification value, Sodium hydroxide, Nail (fastener), Dimensional lumber, Parachute cord

## Needs human expert review
(Updated in the second pass, 2026-11-16.)
- **Felling and bucking:** notch depth, back-cut position, 45 degree escape path and the wind rule now match Purdue Extension S-78 and Oregon State EC 1124. Still for a certified logger or arborist: the bucking cuts (compression and tension sides), the 6-8 lb maul, and whether to teach two tree lengths (the OSHA minimum for logging crews) or more for bystanders. The briefing's "2.5 tree heights" was never found in a source.
- **Chimney, stovepipe and stove clearances (36 in, 18 in, 3-2-10):** now match Univ. of Maryland Extension FS-940, which cites NFPA 211 (2010). NFPA 211 and the IRC themselves were not opened. A chimney professional or building official should confirm for the adopted local code. The stove's listing label always governs.
- **Roof and floor spans, header sizes, snow loads, permit exemptions:** still unverified (the Knox County handout has no span table). The article now carries a WARNING that these are rough rules of thumb. A builder or engineer should check them. Local codes and permit rules vary.
- **Collar/rafter-tie correction** rests on a county code office's 2018 IRC handout (Knox County, TN). Confirm against the adopted code edition.
- **Lye soap:** skin flush, no neutralizer, no vomiting, and the eye-flush time now match the CDC sodium hydroxide guideline. Still for a soapmaker or chemist: the 6-9% superfat claim, the pH 10 target, the forearm test, and rebatching. Conflict to note: CDC advises 30 minutes of eye irrigation for lye, while the rest of the app teaches 15-20 minutes for chemical eye flushes (firstaid.js); soap-candles now says at least 20 minutes (CDC: 30 for lye).
- **Quicklime and ash lye:** the quicklime warning rests on general chemistry plus a NIOSH/PubChem search-result summary. The "a little at a time" wording and the ash-lye egg test are not sourced.
- **Hide-tanning cautions:** the CWD wording now matches the CDC CWD page (seen in search results). The "true sumac, not poison sumac" and "hemlock tree, not poison hemlock" wording is still unsourced.
- **Garden toxicity warnings:** rhubarb leaves (NDSU, opened) and cooked elderberries (UMN and Oregon State, search results) are sourced. Comfrey (no internal use) and yarrow (avoid in pregnancy) are backed only by secondary sites (Drugs.com, a trade report). An herbalist or pharmacist should confirm. Solanine and green-potato warnings were confirmed earlier (UMN).
- **Seed saving:** isolation distances now follow Illinois Extension / Seed Savers Exchange ranges, which are wide and differ between sources. Pepper and corn may need more distance than a home garden has; bagging flowers or growing one variety is the practical advice.
- **Crop tables, frost-date-by-zone table, planting windows:** only five crops were spot-checked (all consistent). A local Extension agent should review the rest for regional fit. The app's Planting Calendar tool is the better source for frost dates.
- **Greywater, pesticide, and soap-spray advice:** conservative but unverified. Local rules on greywater and pesticides vary.
- **Corn moisture:** harvest-curing says "below about 14%", growing-grains says "13% or less" for grain; reconcile when a source is available.
- **Junk silver (pre-1965 coins):** US Mint pages seen confirm the 1965 switch and 90% silver halves, but none stated 90% for dimes and quarters.
- **Solar builds:** the articles contain no photovoltaic, battery, fuse or wire-gauge content, so there is nothing electrical to check. The temperature figures (box oven 250-300 F, dehydrator 120-140 F) remain unverified. The 120 F scald limit is confirmed (CPSC).
- **Regional law:** building-permit exemptions, barter and sales regulations, manure and compost rules for sale, wildlife disease rules (CWD), and open-burning rules vary by location.

## Second pass (2026-11-16)
Scope: re-check of the rows the first pass left Unverified, highest risk first (lye and soap, stove and chimney clearances, felling, garden toxicity, shelf-life and seed-life numbers). About 63 search and fetch calls were used across the three logs (shared budget), then the search tool was left alone. Official pages that blocked access (fcc.gov, redcross.org, osha.gov grant PDFs, fda.gov/media/77178) are noted in the rows above.

**Counts for this log.** Unverified claim rows: 52 before, 47 after. 26 claim rows were newly resolved (19 Confirmed, 7 Corrected). Article edits in garden.js, build.js and skills.js: 17 (about 20 changed facts). All three files pass `node tools/validate.mjs`.

### Corrections made in the second pass
| Article | Was | Now | Source |
|---|---|---|---|
| seeds-starting | Seed life: onion, leek, parsnip 1-2; corn 2; pepper 2-3; carrot, beans, peas 3; beet, chard, tomato 4; lettuce and cabbage family 4-5; squash, cucumber, radish, melon 5 | Onion, parsnip 1; leek, corn, pepper 2; carrot, beans, peas 3; beet, chard, tomato, squash 4; cabbage family 3-5; cucumber, radish, melon, lettuce 5 | Illinois Extension seed viability sheet (cites Colorado State and Iowa State Extension), opened |
| seeds-starting | Germination test: "5 of 10: sow twice as thickly" | "6 or fewer of 10: sow much more thickly, or replace the seed" | Illinois Extension seed viability sheet |
| seed-saving | Tomato varieties 10-25 ft apart | 10-50 ft (3-15 m) | Illinois Extension "How to Save Seeds" (Seed Savers Exchange table), opened |
| seed-saving | Pepper varieties 50 ft apart | Peppers cross more than people expect; guides list several hundred feet; grow one variety or bag the flowers | Same |
| seed-saving | Corn: a quarter mile or plant two weeks apart | At least half a mile (0.8 km), or plant so they flower two weeks apart | Same (800 ft to 1/2 mile in the table; "a mile" in the text) |
| seed-saving | Wet seeds: leave 2-3 days | 2-4 days | Same |
| veg-quick-reference, harvest-curing | Garlic cured: 6-10 months | Softneck 6-8 months, hardneck 3-4 | Illinois Extension garlic page, opened; OSU (search result): hardneck up to 6 |
| compost-fertilizer | Wood ash: none if soil pH is above 7 | None if soil pH is 6.5 or higher (rate of about 2 lb per 100 sq ft kept) | Univ. of Wisconsin and UVM Extension (15-20 lb per 1,000 sq ft); Purdue, Rutgers, Alabama (search-result summaries) |
| felling-splitting-firewood | Wait if gusts are "about 15 mph or more" | Wait if gusts are strong or the treetops are moving | Oregon State EC 1124 (opened): do not fell when treetops are moving; no source gives 15 mph |
| felling-splitting-firewood | Back cut about 1-2 in above the notch | Same, plus: never cut it lower than the notch (the tree can slide back toward you) | Oregon State EC 1124 (opened) |
| framing-roofing | Floor and roof spans with only "check span tables if you can" | Added a WARNING that span and header figures are rough, not engineered; check the local code span tables or ask a builder | Knox County handout has no span table; precaution only |
| soap-candles | Skin: "Flush ... 15-20 minutes. Do not use vinegar on skin" | Brush off dry lye, remove wet clothing, flush 15-20 minutes; no vinegar or other neutralizer on skin or in eyes (makes heat, can deepen the burn) | CDC Medical Management Guidelines for Sodium Hydroxide, opened |
| soap-candles | Eyes: flush at least 15-20 minutes | At least 20 minutes (CDC advises 30 for lye) | Same |
| soap-candles | Swallowed: rinse mouth, do not make vomit | Adds: do not give vinegar or anything to "neutralize" it | Same ("do not induce emesis"; neutralizing substances should not be used) |
| home-industries | Quicklime: "reacts violently with water and burns skin"; add lime to water | Also: gets very hot, can spatter, burns eyes; work outdoors in goggles and gloves; add small lumps to a lot of water a little at a time | NIOSH Pocket Guide (calcium oxide) and PubChem, search results (heat of reaction up to 800 C reported) |
| leather-hides | CWD: do not use brain or spinal cord of deer, elk, moose "in areas where CWD occurs" | Do not use them at all, especially where CWD occurs; also never use brain from an animal found dead | CDC CWD page, search result |
| scavenging-salvage | Asbestos: "Pre-1980" materials | "Older buildings (EPA: common before 1987)" | EPA page, search result |
| season-extension | "cook sprouts for young children, pregnant women ..." | "cook sprouts thoroughly for ..." | Virginia Tech Extension FST-344 (opened); FDA consumer guidance (search result) |

### Confirmed in the second pass (no article change)
Compost pile at least 3 ft per side; do-not-compost list; hand pollination and brassica isolation; sweet potato cure and storage; squash cure and storage; hinge about 1/10 of diameter and notch 1/4-1/3; 45 degree escape path; stove 36 in, stovepipe 18 in and the 3-2-10 chimney rule (NFPA 211 via Maryland Extension); 120 F scald limit; rhubarb leaves; cooked elderberries; lead paint before 1978; spot check of five crop rows. Details are in the claim table above.

### Still Unverified and potentially risky
- Roof and floor spans, header sizes, snow load figures (warning added, not sourced).
- Comfrey and yarrow cautions (secondary sources only; both conservative).
- Pre-1965 coin silver content for dimes and quarters; sumac and hemlock lookalike wording; brain-tanning quantities; the ash-lye egg test.
- Solar-oven, panel-cooker and dehydrator temperature figures.

### Sources opened or seen in the second pass
- Opened: CDC Medical Management Guidelines for Sodium Hydroxide (wwwn.cdc.gov/TSP/PHS/PHS.aspx?phsid=246&toxid=45); NDSU Extension rhubarb column; Missouri Extension G1730; Purdue Extension S-78; Oregon State Extension EC 1124 (PDF, text-extracted); Univ. of Maryland Extension FS-940 (PDF, text-extracted); Illinois Extension "Will my seeds still grow?" and "How to Save Seeds" (PDFs, text-extracted) and garlic page; Virginia Tech Extension FST-344; Knox County rafter handout (PDF, no span table).
- Seen in search results only: UNMC chemical-burn first aid; BASF sodium hydroxide medical sheet; UNH, Illinois, Clemson, Penn State and Missouri composting pages; Univ. of Wisconsin and UVM wood-ash pages; Penn State sweet potato curing; Illinois winter squash pages; UMN and Oregon State elderberry pages; Purdue, Oregon State and Illinois planting guides; OSHA logging training supplement; Univ. of Kentucky FOR-60; CPSC tap water scald pages; CDC CWD page; NIOSH calcium oxide and PubChem; EPA lead pages; US Mint coinage pages; Drugs.com comfrey and yarrow monographs.
