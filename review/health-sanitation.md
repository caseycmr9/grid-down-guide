# Fact-check log: health + sanitation
Checked 2026-11-16 by AI against the sources listed. NOT a substitute for review by a qualified person.

Files: `data/health.js` (13 articles), `data/sanitation.js` (7 articles). Both pass `node tools/validate.mjs`.

**Method note.** The shared web-search budget ran out partway through the first pass. A second pass (same day, see the "Second pass" section at the end) resolved most of the leftover items. Everything marked Confirmed/Corrected below was checked against a page I actually opened or, where stated, a search-result summary of an official page ("search result" = I saw the page title and summary in search output but did not open the page itself). Claims I could not open or see an official source for stay **Unverified** and are left unchanged or softened.

## Summary
- Claims checked: 140 rows in the Claims table (some rows group several related numbers; the second pass split grouped rows, adding 27 rows, so resolved and unresolved parts could be counted separately).
- After first pass: Confirmed 33 | Corrected 17 | Softened 10 | Unverified 53 (113 rows).
- After second pass (current): Confirmed 68 | Corrected 31 | Softened 14 | Unverified 27 (140 rows).
- Edits made: first pass 35 small surgical edits; second pass 22 more (see both Corrections tables). No article was rewritten, none deleted.
- Highest-risk items now backed by an official source: pediatric acetaminophen and ibuprofen doses (AAP charts), adult OTC doses (MedlinePlus, DailyMed labels), fever thresholds (AAP), insulin storage (FDA), hypoglycemia 15 g rule (CDC), DKA signs (CDC), postpartum bleeding signs (CDC), infant formula water and bottle sanitizing (CDC/AAP), bleach strengths (CDC), hantavirus cleanup (CDC), fish antibiotics (FDA), knocked-out tooth (AAE), 988 (988lifeline.org), burial distance and depth (WHO/PAHO field manual).

## Corrections made (first pass)
| Article | Was | Now | Source |
|---|---|---|---|
| common-illness-care | CALL: fever "for more than 3 days" | Adds "(more than 24 hours in a child under 2)" | AAP HealthyChildren, When to Call the Pediatrician |
| common-illness-care | Loperamide: no warning about dose | Adds: never exceed label (high doses cause dangerous heart rhythms); stop and get care if diarrhea lasts more than 2 days | MedlinePlus loperamide page |
| common-illness-care | Severe dehydration "no urine for 8-12 hours" only | Adds "or no wet diaper for 3 hours or more in a baby" | MedlinePlus Dehydration |
| infection-antibiotics | "Animal or fish antibiotics ... Do not rely on them." | "Do not take antibiotics made for animals or fish. The FDA says animal drugs should not be used to treat people ... some can cause serious harm." | FDA, Ornamental Fish Drugs and You |
| meds-stockpile | Acetaminophen, 96 lb and up: "20 mL" | "20 mL (about the same as 2 regular-strength 325 mg tablets)". AAP lists no children's-liquid dose at 96+ lb (uses adult tablets). | AAP acetaminophen dosing chart (PDF) |
| meds-stockpile | No age limit stated for ibuprofen row 12-17 lb | Adds: not for babies under 6 months; row is for babies 6 months or older | AAP ibuprofen chart; HealthyChildren; MedlinePlus |
| meds-stockpile | No under-2 caution for acetaminophen | Adds AAP advice to check with a doctor first for under 2; if unreachable use only the weight dose | AAP acetaminophen chart and HealthyChildren page |
| meds-stockpile | No loperamide safety bullet | Adds heart-rhythm warning, no fever/blood, stop after 2 days | MedlinePlus loperamide |
| meds-stockpile | No Poison Control number | Adds 1-800-222-1222 in the top warning (canonical value) | MedlinePlus ibuprofen page lists the number |
| chronic-conditions | "Unopened insulin keeps best in fridge. Once in use, ~28 days at room temp, below 86 F" | FDA: vials and cartridges, opened OR unopened, work up to 28 days unrefrigerated at 59-86 F (15-30 C); check label (some products differ); never use frozen insulin; keep from heat/sun | FDA insulin storage page; MedlinePlus insulin storage |
| chronic-conditions | Low blood sugar: "Recheck or repeat in 15 minutes ... seek help" | Adds regular soda; recheck and repeat if still low (below 70 mg/dL); snack with protein after; young children may need less than 15 g; unconscious: glucagon and **call 911** | CDC, Treatment for low blood sugar |
| chronic-conditions | Levothyroxine "Stock a year's supply if allowed" | "Stock as much as your doctor and insurance allow" | Softened (a year is rarely allowed) |
| chronic-conditions | Dialysis: "survival is usually days to a couple of weeks" | "dangerous fluid and potassium build-up can develop within days, and survival is limited to a few weeks at most" | Softened, unverified (see expert list) |
| childbirth | "Do not rush. Wait until the cord stops pulsing, usually 1-3 minutes." Cut 6 in / 8-10 in | Adds: unless baby is not breathing and needs help right away; cutting is not urgent, can leave uncut if help is coming; distances vary between sources, longer stump safer. Distances unchanged. | WHO delayed clamping 1-3 min (search summary), exception for resuscitation; distances Unverified |
| childbirth | Hemorrhage: "Soaking a pad every 5-10 minutes" | "Soaking through one or more pads in an hour, clots bigger than an egg" (500 mL / 2 cups kept) | CDC Hear Her, Urgent Maternal Warning Signs |
| childbirth | Mother care: fever "over 100.4" | "100.4 F or higher"; adds thoughts of harming herself or the baby; can appear for weeks | CDC Hear Her |
| babies-kids | Powdered formula: water "boiled and let cool for no more than 30 minutes" | Boil first; for babies under 2 months, born early, or weak immunity cool only about 5 minutes (still about 158 F / 70 C), mix, then cool the bottle; other babies: room temperature; test on wrist. Mixed formula: within 2 hours, within 1 hour of starting a feed, discard leftovers. | CDC Infant Formula Preparation and Storage; HealthyChildren (5 minutes) |
| babies-kids | Bottles: "1 tablespoon bleach per gallon, 1 minute" | "1 teaspoon unscented bleach per 1/2 gallon (8 cups) safe water, soak 2 minutes, air dry, do not rinse"; or boil 5 minutes; sanitize at least daily | CDC, How to Clean Infant Feeding Items During Emergencies |
| babies-kids | "1,000-1,400 kcal a day for ages 1-3" | "By ages 2-3 ... (a bit less at age 1)" | Softened (age-1 needs are lower) |
| babies-kids | Fever table: "Older children: more than 3 days" | Adds "repeatedly above 104 F (40 C)"; notes AAP uses 24 hours for any child under 2 | AAP When to Call the Pediatrician |
| babies-kids | Danger sign "No wet diaper in 8 hours" | "No wet diaper for 3 hours or more", adds dry mouth, sunken eyes | MedlinePlus Dehydration |
| babies-kids | "Yellow skin or eyes after the first 2 weeks" | Adds "in the first day of life, or still yellow after 2 weeks" | Confirmed in second pass (HealthyChildren, see Claims table) |
| dental | "reinserting within 30-60 minutes gives the best chance" | "best chance is to be treated within 30 minutes, though a tooth may still be saved after an hour or more"; do not dry or wrap in tissue; do not store in plain tap water; "cold milk" -> "milk" | AAE, Knocked Out Teeth |
| dental | "small tubes [fluoride toothpaste] keep for years" | "stock several tubes and check the expiration date" | Softened |
| herbal-remedies | Elderberry "may shorten flu a little" | "small studies suggest it may ease flu symptoms, but evidence is limited"; adds raw or unripe warning wording and pregnancy unknown | NCCIH, Elderberry |
| womens-health | "fewer than 10 movements in 2 hours after 28 weeks" | "moving much less than usual or stopping (any change from the baby's usual pattern matters)" | CDC Hear Her says there is no set number; change is what matters |
| womens-health | "about 300 more calories a day" | "roughly 300-450" | Softened (ACOG page would not open; range covers commonly cited 340/450) |
| mental-health | Sleep "Aim for 6-8 hours" | "Adults need at least 7 hours when possible" | Softened; commonly cited adult minimum (no page opened) |
| mental-health | 988 line | Adds free, 24 hours, chat at 988lifeline.org; 911 "if there is immediate danger" | 988lifeline.org |
| laundry-dishes | Wash water "at least 100 ft (30 m) from wells and streams" | "200 ft (60 m) from streams, lakes, springs; 100 ft (30 m) from wells" | Internal consistency with handwashing-hygiene and human-waste (200 ft from surface water) |
| trash-garbage | "cooked scraps can go to chickens or pigs" | "plant scraps ... Feeding meat scraps to pigs is banned or tightly regulated in many places because it spreads animal disease" | Softened; legal detail Unverified (see expert list) |
| trash-garbage | Bandages: "bury or burn" (contradicts DANGER box: do not burn medical waste in the open) | "double-bag, and bury. Do not burn them in the open." | Internal contradiction fixed |
| pests-vectors | Hantavirus: "wear gloves and a mask", "Open windows for 30 minutes" | Leave room 30 min with doors/windows open; rubber or plastic gloves; spray until very wet with fresh 1:9 bleach (1.5 cups/gal), 5 min; double-bag; HEPA half-mask respirator only for heavy infestation, cloth/surgical masks do not protect | CDC, How to Clean Up After Rodents |
| pests-vectors | Scabies: "Treat with permethrin 5% cream" | Treatment is a prescription cream; over-the-counter products do not cure scabies; ask a clinician | CDC scabies treatment page |
| disease-prevention | Isolation: "no fever for 24 hours" | "no fever for 24 hours without fever-reducing medicine" | Confirmed in second pass (CDC respiratory-virus precautions page, search result) |

## Claims checked
Verdicts below are the current ones (after the second pass). Rows marked "(2nd pass)" were Unverified or grouped in the first pass.

| Article | Claim | Verdict | Source |
|---|---|---|---|
| home-nursing | Fever = 100.4 F (38 C) or higher | Confirmed | AAP When to Call the Pediatrician; CDC Hear Her |
| home-nursing | Adult pulse 60-100 | Confirmed | MedlinePlus Vital Signs (medlineplus.gov/ency/article/002341.htm) |
| home-nursing | Adult breathing 12-20 per minute | Confirmed (MedlinePlus lists 12-18; 12-20 is the common clinical range) | MedlinePlus Vital Signs |
| home-nursing | Pediatric breathing rates (30-60, 24-40, 22-34, 18-30) (2nd pass) | Confirmed | NLM CHEMM Pediatric Basic and Advanced Life Support, chemm.nlm.nih.gov/pals.htm (search result summary; page itself would not load) |
| home-nursing | Pediatric resting pulse ranges (100-160, 90-150, 80-140, 70-120) (2nd pass) | Softened | NLM CHEMM (search result) lists wider awake ranges (for example 100-190 at 3 months to 2 years, 60-140 at 2-10); article ranges sit inside them. Column header changed to "Typical resting pulse" |
| home-nursing | Fever above 104 F or more than 3 days | Confirmed | AAP When to Call the Pediatrician |
| home-nursing | Armpit reads about 1 F lower (2nd pass) | Confirmed | MedlinePlus Temperature measurement (medlineplus.gov/ency/article/003400.htm, 0.5-1 F lower) and Cleveland Clinic axillary temperature page, both search results |
| home-nursing | Turn every 2 hours; check bony areas | Unverified | not opened (standard nursing practice) |
| home-nursing | No urine for 12 hours (adult) | Unverified | MedlinePlus says no urination needs immediate care but gives no hours |
| common-illness-care | Under 3 months with 100.4 F = emergency | Confirmed | AAP When to Call the Pediatrician (healthychildren.org/English/health-issues/conditions/fever/Pages/When-to-Call-the-Pediatrician.aspx) |
| common-illness-care | Fever duration threshold | Corrected | AAP (under 2: more than 24 h; 2 and up: more than 3 days) |
| common-illness-care | Never aspirin under 18 (2nd pass) | Confirmed (conservative: MedlinePlus says ask a doctor before giving aspirin to children or teens because of Reye syndrome and sets no age; article's absolute rule is stricter) | MedlinePlus aspirin (medlineplus.gov/druginfo/meds/a682878.html), opened |
| common-illness-care | Honey for cough: 1/2, 1, 2 tsp by age; not under 1 (2nd pass) | Confirmed (AAP ranges 1/2 tsp ages 1-5, 1 tsp ages 6-11, 2 tsp 12+; Mayo says 1/2-1 tsp for age 1+; CDC and AAP: no honey under 1) | HealthyChildren "How to Care for Your Child's Cold" and Mayo Clinic honey FAQ (search results) |
| common-illness-care | Saline rinse only with sterile/boiled water (2nd pass) | Corrected (boil time added: 3-5 minutes then cool; FDA; CDC uses 1 minute, so 3-5 covers both) | FDA, Is Rinsing Your Sinuses With Neti Pots Safe?; CDC How to Safely Rinse Sinuses (search results) |
| common-illness-care | ORS 1 tsp every 1-2 min; wait 15-30 min after vomiting (2nd pass) | Corrected (15-30 min wait not supported; WHO says 5-10 min; AAP says 1-2 tsp every 5 min for vomiting; WHO/CDC 2003 say 1 tsp every 1-2 min for diarrhea) | HealthyChildren "Vomiting Without Diarrhea" (opened); WHO diarrhoea manual and CDC MMWR (search results) |
| common-illness-care | Loperamide 12+, not with fever or blood | Confirmed in part (not for under 2; no fever/blood/black stool; stop if over 48 h) | MedlinePlus druginfo a682280 |
| common-illness-care | Severe dehydration signs | Corrected (baby: no wet diaper 3 h) | MedlinePlus Dehydration (medlineplus.gov/dehydration.html) |
| infection-antibiotics | Fish/animal antibiotics | Corrected | FDA (fda.gov/animal-veterinary/animal-health-literacy/ornamental-fish-drugs-and-you) |
| infection-antibiotics | Sepsis signs (pulse over 90, fast breathing) (2nd pass) | Corrected ("over 90" removed; CDC lists no numbers; added shortness of breath and extreme pain) | CDC About Sepsis (cdc.gov/sepsis/about/index.html), opened |
| infection-antibiotics | Cellulitis marking, abscess warm compresses, "open wound edges" | Unverified | not opened; "open the wound" is a wilderness-medicine technique, flagged for expert |
| infection-antibiotics | Pneumonia "over 20 breaths" (2nd pass) | Softened ("more than about 20 breaths a minute at rest") | no source gave an adult cutoff |
| infection-antibiotics | UTI, strep, rheumatic fever statements | Unverified | not opened |
| meds-stockpile | Children's acetaminophen mL by weight (160 mg/5 mL) | Confirmed | AAP chart (downloads.aap.org/HC/EN/Acetaminophen_Pictographic_Dosing_Chart_download.pdf); KidsHealth acetaminophen |
| meds-stockpile | Acetaminophen 96+ lb row | Corrected | AAP chart |
| meds-stockpile | Children's ibuprofen mL by weight (100 mg/5 mL) | Confirmed | AAP chart (downloads.aap.org/HC/EN/Dosing-Chart-Ibuprofen-updated2023.pdf); MedlinePlus patientinstructions/000772 |
| meds-stockpile | Acetaminophen every 4-6 h, max 5 doses/24 h | Confirmed | AAP chart; HealthyChildren acetaminophen page |
| meds-stockpile | Ibuprofen every 6-8 h, max 4 doses/24 h | Confirmed | AAP ibuprofen chart (q6h, 4 doses); HealthyChildren ibuprofen page (6-8 h) |
| meds-stockpile | Ibuprofen not under 6 months | Corrected (made explicit) | HealthyChildren ibuprofen; MedlinePlus |
| meds-stockpile | Acetaminophen under 2 only with doctor guidance | Corrected (added) | AAP chart header |
| meds-stockpile | Under 12 weeks fever = emergency | Confirmed | AAP (under 3 months / 12 weeks) |
| meds-stockpile | Adult OTC dose table: acetaminophen (3,000 mg max), ibuprofen (1,200 mg), naproxen (660 mg), aspirin, diphenhydramine (300 mg), loratadine (10 mg), loperamide (2nd pass) | Confirmed (table limits are at or below label limits: MedlinePlus acetaminophen max 4,000 mg/day from all sources; MedlinePlus ibuprofen every 4-6 h, max 6 doses in 24 h; DailyMed naproxen 220 mg labels: 1 tablet every 8-12 h, max 3 tablets (660 mg) in 24 h; DailyMed diphenhydramine 25 mg labels: 1-2 tablets every 4-6 h, max 6 doses in 24 h; MedlinePlus loratadine once a day; aspirin: MedlinePlus every 4-6 h, mg per label) | MedlinePlus druginfo a681004, a682159, a682878, a697038 (opened); DailyMed labels (search results) |
| meds-stockpile | Hydrocortisone 1% cream: 3-4 times a day, up to 7 days | Unverified | no Drug Facts page opened |
| meds-stockpile | No cough and cold medicine under 4 (2nd pass) | Confirmed (FDA: not recommended under 2, label "do not use under 4"; AAP: not under 4; one CDC page says under 6, which is stricter) | FDA "Should You Give Kids Medicine for Coughs and Colds?"; HealthyChildren "Coughs and Colds: Medicines or Home Remedies?" (search results) |
| meds-stockpile | Expiration claims (SLEP, do not rely on expired insulin, EpiPen, nitroglycerin, liquids) (2nd pass) | Softened (added FDA wording; the SLEP/military-stock sentence and the named-drug list are still not cited to an official page) | FDA "Don't Be Tempted to Use Expired Medicines" (opened: "no guarantee ... do not use it"; sub-potent antibiotics fail) |
| meds-stockpile | Naloxone available without prescription (2nd pass) | Confirmed | FDA press release, FDA Approves First Over-the-Counter Naloxone Nasal Spray (4 mg, March 2023) (search result) |
| meds-stockpile | Poison Control 1-800-222-1222 | Confirmed | MedlinePlus ibuprofen page |
| chronic-conditions | Insulin 28 days unrefrigerated, 59-86 F, never freeze | Corrected | FDA (fda.gov/drugs/emergency-preparedness-drugs/information-regarding-insulin-storage-and-switching-between-products-emergency); MedlinePlus patientinstructions/000962 |
| chronic-conditions | 15 g carbs: 4 oz juice, 3-4 glucose tablets, 1 tbsp sugar or honey; recheck 15 min | Confirmed | CDC (cdc.gov/diabetes/treatment/treatment-low-blood-sugar-hypoglycemia.html) |
| chronic-conditions | Unconscious: glucagon and 911 | Corrected (911 added) | CDC page says get emergency treatment |
| chronic-conditions | DKA signs (2nd pass) | Corrected (DKA can occur in type 2 too; added emergency triggers: blood sugar staying at or above 300 mg/dL, fruity breath, vomiting that will not stop) | CDC Diabetic Ketoacidosis (cdc.gov/diabetes/about/diabetic-ketoacidosis.html) and MedlinePlus ency/article/000320 (search results) |
| chronic-conditions | Seizure over 5 minutes = emergency; do not restrain; nothing in mouth; roll to side (2nd pass) | Confirmed | CDC First Aid for Seizures (cdc.gov/epilepsy/first-aid-for-seizures/index.html) and Epilepsy Foundation (search results) |
| chronic-conditions | Beta blocker abrupt-stop warning (2nd pass) | Confirmed (MedlinePlus propranolol: stopping suddenly may cause chest pain or heart attack; metoprolol and labetalol pages similar) | MedlinePlus druginfo a682607, a682864, a685034 (search results) |
| chronic-conditions | Nitroglycerin storage: "dark glass bottle" (2nd pass) | Corrected ("original glass bottle, cap tightly closed") | MedlinePlus nitroglycerin sublingual (a601086) and DailyMed labels (search results) |
| chronic-conditions | Heart failure daily weights (2nd pass) | Corrected (numbers added: more than 2-3 lb in a day or 5 lb in a week) | MedlinePlus heart failure home monitoring; AHA living-with-HF guide (search results). AHA handouts vary slightly (3 lb a day) |
| chronic-conditions | Dialysis survival | Softened | no source opened |
| chronic-conditions | Levothyroxine | Softened | no source opened |
| childbirth | Cord around neck: loosen over head; if tight, do not cut before birth | Unverified (sources disagree: Merck Manual describes a "somersault" maneuver and says not to clamp/cut before birth; a clinic protocol says clamp and cut if tight; WHO Eswatini/ENC protocols in search results say clamp, cut, then unwind) | msdmanuals.com/professional/multimedia/video/cord-around-the-neck; WHO platform protocols (search results) |
| childbirth | Delay clamping 1-3 minutes | Confirmed | WHO via search summary (not opened); exception when baby needs resuscitation |
| childbirth | Cord tie distances 6 in and 8-10 in | Unverified (WHO Essential Newborn Care guidance in search results ties at 2 cm and 5 cm from the baby's abdomen; another guide says leave a stump of at least 10 cm; EMS and older MedlinePlus text say 4-10 in. Not changed; see expert list) | WHO ENC guide (search result); EMS text |
| childbirth | Placenta 5-30 min, seek help after 1 hour | Confirmed | Ethiopia MoH protocol on platform.who.int (retained = not out 30 min; manual removal at 60); NICE via search summary |
| childbirth | Heavy bleeding threshold and signs | Corrected | CDC Hear Her; WHO PPH 500 mL and ACOG 1,000 mL (search summaries, not opened) |
| childbirth | Uterine (fundal) massage after placenta | Confirmed | Ethiopia MoH protocol ("gently massage the fundus") |
| childbirth | Newborn not breathing: dry, rub back, 5 puffs, then infant CPR (2nd pass) | Confirmed in part (dry the baby and stimulate by rubbing the back: WHO; 5 inflation breaths then ventilation about 30 per minute: Resuscitation Council UK 2025 guidelines. Lay mouth-over-nose-and-mouth technique and the move to compressions are not stated in what I saw; AHA/NRP differ) | WHO ENC guide; resus.org.uk 2025 newborn resuscitation guidelines (search results) |
| childbirth | Shoulder dystocia: knees to chest (McRoberts), pressure above pubic bone, then hands and knees (2nd pass) | Confirmed | McRoberts with or without suprapubic pressure is first-line in American, British and French guidance (PMC reviews, StatPearls); knee-chest/Gaskin position listed (search results) |
| childbirth | Cord prolapse: hands and knees, chest down, hips up; do not push cord back (2nd pass) | Confirmed (a Glasgow NHS guideline notes knee-chest is not suitable for ambulance transport) | StatPearls Umbilical Cord Prolapse (NBK542241); NHS Scotland home-birth cord prolapse guidance (search results) |
| childbirth | Breech: hands off | Unverified | not opened |
| childbirth | Newborn breathing about 30-60/min, feed 2-3 h, no bath for 24 h (2nd pass) | Confirmed (WHO: delay first bath 24 hours; feeds on demand 8-12 times a day; WHO refers newborns breathing 60 or more per minute, so "faster than 60" added to the watch list) | WHO postnatal care recommendations (NBK190090) and WHO neonatal guidelines (search results) |
| childbirth | Warning signs for mother (fever 100.4, headache, vision, leg pain, chest pain) | Confirmed | CDC Hear Her (cdc.gov/hearher/maternal-warning-signs/) |
| babies-kids | Formula water temperature and timing | Corrected | CDC infant formula page (cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html); HealthyChildren formula-with-water page |
| babies-kids | Formula use within 1 h of feed start; discard leftovers | Confirmed | CDC infant formula page |
| babies-kids | Bottle sanitizing | Corrected (re-confirmed in 2nd pass: CDC page text seen in search result gives 1 tsp bleach per 1/2 gallon, 2 minutes, air dry; or boil 5 minutes; sanitizing for babies under 2 months or sick; all items at least daily) | CDC How to Clean Infant Feeding Items During Emergencies (cdc.gov/infant-feeding-emergencies-toolkit/php/how-to-clean-infant-feeding-items-during-emergencies.html) |
| babies-kids | Safe sleep: back, firm flat surface, same room not same bed, nothing soft | Confirmed | CDC (cdc.gov/sudden-infant-death/sleep-safely/index.html) |
| babies-kids | Never sleep with baby on a couch (2nd pass) | Confirmed | NICHD Safe to Sleep (safetosleep.nichd.nih.gov/reduce-risk/safe-sleep-environment); AAP HealthyChildren safe-sleep page (search results) |
| babies-kids | Fever table by age | Softened (24 h under 2 added; 102.2 F for 3-36 months not in AAP) | AAP When to Call the Pediatrician |
| babies-kids | No honey under 1; no water/juice under 6 months; no diluted formula (2nd pass) | Confirmed | CDC and AAP on honey (search result); CDC foods-and-drinks page and AAP Choose Water page as opened in review/family.md; CDC facts page on diluted formula (family log) |
| babies-kids | Whole cow's milk as short-term stopgap after 6 months (2nd pass) | Confirmed (hedged wording matches HHS: over 6 months, ask a pediatrician, short-term only; an AAP shortage sheet says about a week). Time limit stays on expert list | HHS Information for Families During the Formula Shortage (hhs.gov/formula) and AAP shortage sheet (search results) |
| babies-kids | Wet diapers: 6 per day; none for 3 h = danger | Corrected | MedlinePlus Dehydration |
| babies-kids | Jaundice first day / after 2 weeks (2nd pass) | Confirmed (HealthyChildren: jaundice in the first 24 hours needs a bilirubin check right away; tell the doctor if it lasts past 2 weeks, or 4 weeks in mostly breastfed babies; MedlinePlus says 2-3 weeks) | HealthyChildren Jaundice in Newborns and Jaundiced Newborn symptom checker; MedlinePlus (search results) |
| babies-kids | Calories | Softened | no source opened |
| elderly-disabled | Oxygen kept at least 6 ft from flame (2nd pass) | Confirmed (ALA 5 ft, MedlinePlus 6 ft; article uses the larger) | lung.org Using Oxygen Safely; MedlinePlus patientinstructions/000049, both opened by the family pass (review/family.md) |
| elderly-disabled | CPAP battery pack; hearing aid battery life | Unverified | not opened |
| dental | Knocked-out tooth: handle by crown, reinsert, milk or cheek, baby teeth not reinserted | Confirmed | AAE (aae.org/patients/dental-symptoms/knocked-out-teeth/) |
| dental | Time window | Corrected | AAE (see dentist within 30 min; may save after an hour) |
| dental | Storage not in tap water | Confirmed | AAE |
| dental | Abscess warning signs | Unverified | not opened |
| dental | Post-extraction bleeding 30 min gauze; no straws 24 h | Unverified | not opened |
| dental | Clove oil; no aspirin on gum; no super glue | Unverified | not opened |
| herbal-remedies | Elderberry benefit and raw toxicity | Softened | NCCIH (nccih.nih.gov/health/elderberry) |
| herbal-remedies | Willow bark cautions (2nd pass) | Corrected (added breastfeeding and aspirin allergy; already had under 18, pregnancy, blood thinners) | NCCIH willow bark advice for children, pregnancy/nursing, aspirin sensitivity (search result); StatPearls (Reye syndrome); LactMed |
| herbal-remedies | St. John's wort weakens birth control and many medicines (2nd pass) | Confirmed | NCCIH St. John's Wort: Usefulness and Safety (nccih.nih.gov/health/st-johns-wort) (search result) |
| herbal-remedies | Colloidal silver turns skin gray and does not work (2nd pass) | Confirmed | NCCIH Colloidal Silver: What You Need To Know; FDA 1999 rule as summarized in search results |
| herbal-remedies | MMS / "miracle" bleach products are dangerous (2nd pass) | Confirmed | FDA warning letters and COVID-19 fraud page on chlorine dioxide products (fda.gov/consumers/health-fraud-scams, search result) |
| herbal-remedies | Comfrey, pennyroyal, tansy, wormwood, coltsfoot, lobelia not taken internally | Unverified | search found only a review noting pyrrolizidine alkaloids in comfrey; no FDA/NCCIH page seen for the list. Caution kept |
| herbal-remedies | Honey, ginger, peppermint, chamomile, aloe, yarrow, mullein vs foxglove, garlic | Unverified | NCCIH/FDA pages not opened; all entries are cautionary (none promise a cure) |
| herbal-remedies | Infusion and salve ratios | Unverified | not opened |
| womens-health | Fetal movement counting | Softened | CDC Hear Her |
| womens-health | Pregnancy warning signs (bleeding, headache, vision, swelling) | Confirmed | CDC Hear Her |
| womens-health | Extra calories | Softened | no source opened |
| womens-health | Folic acid 400 mcg; foods to avoid (2nd pass) | Confirmed | CDC About Folic Acid (400 mcg daily for women who could become pregnant); MedlinePlus Pregnancy and Nutrition (undercooked meat/eggs, unpasteurized milk) (search results) |
| womens-health | Emergency contraception timing (2nd pass) | Corrected (levonorgestrel works best within 72 hours; added ulipristal up to 5 days, may need a prescription) | PMC "Emergency contraception: an overview" and ACOG emergency contraception (search results). "Sold without prescription in the US" is unchanged and not re-verified |
| womens-health | Copper IUD up to 10 years (2nd pass) | Confirmed (labeled duration; some sources say 12) | search results (PMC reviews) |
| womens-health | Implant "3-5 years", pills 3-month supply, injections every 3 months, LAM rules | Unverified | no page seen |
| womens-health | Menstrual cup interval (2nd pass) | Softened (changed from 8-12 to 4-12 hours "depending on flow and the maker's directions"; FDA gives no cup time) | PMC case report on cups and TSS (search result) |
| womens-health | Tampon at most 8 hours (2nd pass) | Confirmed | FDA Tampons page (change every 4-8 hours) (search result) |
| womens-health | Ectopic and heavy-bleeding signs (2 pads/h for 2 h) | Unverified | not opened |
| mental-health | 988 call/text/chat | Confirmed | 988lifeline.org |
| mental-health | Ask directly about suicide; remove means | Unverified | not opened |
| mental-health | Sleep hours | Softened | no source opened |
| mental-health | Alcohol withdrawal timing (2nd pass) | Corrected ("usually within 6-96 hours" replaced by: usually starts 6-24 hours after the last drink; worst problems in the first few days and up to a week; sources differ on seizure and DT timing) | PMC reviews on alcohol withdrawal; NCBI TIP guide on substance abuse services (search results) |
| mental-health | Benzodiazepine abrupt stop can cause seizures (2nd pass) | Confirmed | NCBI "A Guide to Substance Abuse Services for Primary Care Clinicians" (search result) |
| foot-care | Blister care; trench foot; load 20-25% | Unverified | CDC trench foot page returned 404 |
| human-waste | Latrine 100 ft (30 m) from wells (2nd pass) | Confirmed (Sphere indicator: latrines at least 30 m from groundwater sources) | UNHCR Appendix 3 Excreta Disposal Guidelines quoting Sphere (search result; PDF returned 403 when opened) |
| human-waste | Cat hole 6-8 in deep, 200 ft from water, trails, camp (2nd pass) | Confirmed | Leave No Trace Principle 3 (lnt.org/why/7-principles/dispose-of-waste-properly/); NPS Leave No Trace page (search results) |
| human-waste | Pit latrine 6 ft deep; fill when 2 ft from top (2nd pass) | Corrected (added: keep the pit bottom at least 5 ft / 1.5 m above groundwater; if not possible use a bucket toilet or shallow trench) | Sphere handbook (2000 edition) as quoted in search result: bottom of any latrine at least 1.5 m above the water table |
| human-waste | Trench 2-3 ft deep, 1 ft wide; fill at 1 ft from surface; 200 ft from streams | Unverified | UNHCR PDF returned 403; Sphere dimensions not seen |
| human-waste | Hot compost 130 F (55 C) | Unverified | not opened |
| handwashing-hygiene | Scrub 20 seconds, cold water OK, steps | Confirmed | CDC Clean Hands (cdc.gov/clean-hands/about/index.html); CDC personal hygiene in emergencies |
| handwashing-hygiene | Sanitizer at least 60% alcohol; weaker on dirty hands | Confirmed | CDC Clean Hands; CDC personal hygiene in emergencies |
| handwashing-hygiene | Ash or sand when no soap (2nd pass) | Softened ("much better than water alone" changed to "better than water alone") | PMC rapid review of ash handwashing; Ethiopia cluster-randomized trial (ash better than water alone, not as good as soap); PubMed viral-reduction study (search results). No WHO/CDC page seen |
| handwashing-hygiene | Homemade sanitizer mix (2 parts alcohol : 1 part aloe) | Unverified | CDC says use 60% sanitizer if no soap; recipe not addressed |
| laundry-dishes | Dish sanitize 1 tbsp bleach per gallon | Confirmed | CDC How to Safely Clean and Sanitize with Bleach (cdc.gov/natural-disasters/safety/how-to-safely-clean-and-sanitize-with-bleach.html); CDC Keep Food Safe gives a stronger 1 cup per 5 gal, 1 min soak |
| laundry-dishes | Surfaces: 1/3 cup (5 tbsp) per gallon, wet 1 minute, fresh daily | Confirmed | CDC Cleaning and Disinfecting with Bleach (search summary of cdc.gov/hygiene/about/cleaning-and-disinfecting-with-bleach.html; page not opened) |
| laundry-dishes | Surfaces after vomit or diarrhea (norovirus): wet 5 minutes (2nd pass) | Corrected (added) | CDC norovirus prevention: 1,000-5,000 ppm bleach (5-25 tablespoons of household bleach per gallon), wet at least 5 minutes (search result). Article keeps the 5 tbsp low end |
| laundry-dishes | Mold on hard surfaces: 1 cup per gallon | Confirmed | CDC How to Safely Clean and Sanitize with Bleach |
| laundry-dishes | Never mix bleach with ammonia or other cleaners | Confirmed | CDC (page says ammonia or any other cleaner) |
| laundry-dishes | Unscented 5-6% bleach | Confirmed (CDC allows 5-9%; see expert list) | CDC bleach page |
| laundry-dishes | Hot wash at least 130 F, dry on high heat (lice) (2nd pass) | Confirmed | CDC Treatment of Head Lice (cdc.gov/lice/treatment/index.html: hot water 130 F, high-heat dry); CDC epidemic typhus page (search results). Bedbug use not separately confirmed |
| laundry-dishes | Wash-water disposal distance | Corrected | internal consistency; matches Sphere 30 m and LNT 200 ft figures above |
| trash-garbage | Sharps container three-quarters full (2nd pass) | Confirmed | FDA Sharps Disposal Containers (fda.gov/medical-devices/safely-using-sharps-needles-and-syringes-home-work-and-travel/sharps-disposal-containers) (search result) |
| trash-garbage | Sharps container type (2nd pass) | Corrected (was "a metal can or thick plastic bottle"; FDA says heavy-duty plastic such as a laundry-detergent container, not milk jugs, soda cans, glass or water bottles) | FDA Sharps Disposal Containers; What to Do if You Can't Find a Sharps Disposal Container (search results) |
| trash-garbage | Never burn plastic etc.; burial 200 ft; meat/carcass 3 ft deep | Unverified | not opened |
| trash-garbage | Feed scraps to pigs | Softened | legal detail Unverified |
| trash-garbage | Burn bandages vs do not burn medical waste | Corrected | internal contradiction |
| pests-vectors | Hantavirus cleanup: 1:9 bleach, 5 min, 30 min airing, gloves, no sweeping | Corrected | CDC (cdc.gov/healthy-pets/rodent-control/clean-up.html) |
| pests-vectors | Mouse hole 1/4 in; rat 1/2 in (2nd pass) | Confirmed | CDC How to Seal Up to Prevent Rodents and CDC MMWR RR-5109 (1/4 in); eXtension rodent exclusion (rats 1/2 in) (search results) |
| pests-vectors | Repellent types; OLE not under 3; sunscreen first; permethrin not on skin; empty standing water weekly | Confirmed | CDC Mosquito Bite Prevention (cdc.gov/mosquitoes/prevention/index.html) |
| pests-vectors | Repellent percentages (DEET 20-30%, picaridin 20%) | Unverified | CDC page lists no percentages |
| pests-vectors | Tick removal; 36 hours attachment; prophylaxis within 72 h; watch 30 days | Confirmed (36 h and 72 h); 30 days Unverified | CDC Lyme guidance for clinicians (search summary of cdc.gov/lyme/media/pdfs/Caring-for-Patients-after-a-Tick-Bite.pdf) |
| pests-vectors | Head lice permethrin 1%: repeat in 9-10 days (2nd pass) | Corrected (now "about 9 days, or as the label says"; CDC says retreat on day 9, 7-9 days depending on product) | CDC Clinical Care of Head Lice; CDC Treatment of Head Lice (search results) |
| pests-vectors | Head lice combing every 2-3 days for 2 weeks | Unverified | CDC pages seen do not state the schedule |
| pests-vectors | Scabies: wash above 122 F / seal 72 h; treat close contacts | Confirmed | CDC scabies treatment page |
| pests-vectors | Scabies: permethrin 5% | Corrected (prescription) | CDC scabies treatment page |
| pests-vectors | Bedbugs 30 min on high heat | Unverified | not opened |
| disease-prevention | Tetanus booster every 10 years, 5 for dirty wounds (2nd pass) | Confirmed | CDC Pink Book Tetanus chapter; ACIP/MMWR Tdap recommendations (search results) |
| disease-prevention | Norovirus: bleach not alcohol; 1-3 days (2nd pass) | Confirmed (hand sanitizer is not a substitute for handwashing; bleach 1,000-5,000 ppm, 5 minutes) | CDC How to Prevent Norovirus (cdc.gov/norovirus/prevention/index.html) (search result) |
| disease-prevention | Isolation until fever-free 24 h without medicine and getting better; no vomiting/diarrhea 48 h (2nd pass) | Confirmed (wording now adds "getting better overall") | CDC Preventing Spread of Respiratory Viruses When You're Sick (24 h fever-free without medicine, symptoms improving); CDC norovirus (48 h after symptoms stop) (search results) |
| disease-prevention | 1 latrine per 20 people (2nd pass) | Confirmed | Sphere indicator (maximum 20 people per latrine) as quoted in UNHCR Appendix 3 (search result) |
| disease-prevention | Cots 3 ft apart | Unverified | Sphere not reached |
| death-burial | Dead bodies after disasters do not cause epidemics; hazard is the disease the person had (2nd pass) | Confirmed | WHO/PAHO/ICRC Management of Dead Bodies after Disasters: A Field Manual for First Responders (cdn.who.int/media/docs/default-source/documents/publications/management-of-dead-bodies-after-disasters.pdf), opened and text extracted |
| death-burial | Burial 100 ft from wells, 4-6 ft deep, 3 ft cover (2nd pass) | Corrected (field manual: at least 200 m from streams, lakes, springs and from wells for 4 or fewer bodies; grave 1.5-3 m deep; 1.2 m above water table, 1.5 m in sand. Article changed to 650 ft / 200 m, about 5 ft deep, 4 ft above groundwater) | same WHO/PAHO/ICRC field manual, chapter 8, "Distance from water sources" and "Grave construction" |

## Corrections made (second pass)
See the table in the "Second pass" section below.

## Needs human expert review
- **Pediatric OTC doses**: the weight tables match the AAP pictographic charts exactly, but a pediatric nurse or pharmacist should confirm the under-2 acetaminophen note and the 12-17 lb rows. AAP itself says to ask a doctor under 2 (acetaminophen) and under 6 months (ibuprofen).
- **Adult OTC dose table**: now checked against MedlinePlus pages and DailyMed label summaries (limits are at or below labels). Hydrocortisone 1% cream use limits were not checked. A pharmacist should still sign off.
- **Emergency childbirth**: (1) tight cord around the neck: sources disagree (somersault maneuver without cutting vs clamp-and-cut, which is what WHO provider protocols say); (2) cord tie distances: WHO training uses ties at about 2 cm and 5 cm from the belly, EMS texts say 6-10 inches, one guide says leave at least 10 cm; the article keeps the longer, more conservative figures; (3) the "5 gentle puffs" is supported by Resuscitation Council UK, but AHA/NRP differ and neither source describes the lay mouth technique or the switch to compressions; (4) breech steps were not verified. A midwife or EMT should review.
- **Added "cutting the cord is not urgent / may leave uncut" note** (childbirth): editorial, based on common EMS dispatch practice; no single official page opened. Confirm.
- **Infected wounds "open the wound edges" and abscess drainage** (infection-antibiotics): wilderness-medicine technique that could harm if done by a lay reader; a clinician should decide whether to keep it.
- **Dialysis survival wording** (chronic-conditions): "a few weeks at most" is a soft statement; confirm with a nephrology nurse.
- **ORS pacing** (common-illness-care): WHO and CDC 2003 say 1 teaspoon every 1-2 minutes for diarrhea; AAP says 1-2 teaspoons every 5 minutes for vomiting. The article now says "about 1 teaspoon every 1-5 minutes". `dehydration-ors` (not in this assignment) should be checked so the two articles agree.
- **Bleach strength**: CDC allows 5-9% household bleach; this app's recipes (dishes 1 tbsp/gal, surfaces 1/3 cup/gal) assume ordinary strength and the DANGER box says 5-6%. Many store bottles are now 8.25%, about 1.5 times stronger. Not unsafe, but the lead may want to add "if yours is 8.25%, use about 2/3 of the amount" for dishes, consistent with the canonical water-treatment line (8 drops of 5-6%, 6 drops of 8.25%). For norovirus cleanup CDC recommends 5 to 25 tablespoons per gallon; the article keeps 5.
- **Burial distances**: now follow the WHO/PAHO/ICRC manual (650 ft / 200 m from water). That is far larger than the old 100 ft and may be hard to meet on a small lot; the article says to get as far as possible and follow local rules. A public-health or emergency-management professional should confirm the wording for small-scale burial. The 3 ft minimum soil cover is a practical figure not in the manual.
- **Sanitation distances and depths** (latrine 200 ft from surface water, trench 2-3 ft, pit 6 ft, trash burial 200 ft): 100 ft from wells, cat hole and 1 latrine per 20 are now sourced; the rest are conservative and internally consistent but not matched to Sphere/WHO tables (UNHCR PDF returned 403). Local health codes and well-setback rules vary; add "follow local rules".
- **Feeding meat scraps to pigs**: the legal point (US Swine Health Protection Act and state rules) was not opened. Softened to "banned or tightly regulated in many places".
- **Scabies and lice drugs**: permethrin 5% is prescription-only in the US; 1% lice lotion is OTC. In a no-clinic setting readers may not be able to get either. CDC notes some lice resistance to 1% permethrin.
- **Homemade hand sanitizer and wood-ash handwashing**: ash is better than water alone in studies but weaker than soap; no WHO/CDC page seen. Homemade sanitizer mix not verified; CDC advises 60% sanitizer when no soap.
- **Herbal remedies table**: willow bark, St. John's wort, colloidal silver and MMS are now sourced; comfrey/pennyroyal/tansy list, tea ratios and salve ratios are not. All entries are cautions or modest claims.
- **Emergency contraception and implant duration**: "sold without a prescription in the US" was not re-verified; implant labeled duration (3 vs 5 years) was not checked.
- **Mental health**: 988 chat confirmed. "Press 1 for veterans" and the Spanish text option were not confirmed, so they were not added. "Ask directly about suicide" and the 7-hour sleep figure were not checked against a page.
- **Still unchecked, lower risk**: turning every 2 hours, adult "no urine for 12 hours", dental abscess/extraction/clove oil/aspirin-on-gum/super-glue statements, foot care and trench foot, repellent percentages, tick-watch 30 days, bedbug 30 minutes, lice combing schedule, cots 3 feet apart, hot-compost 130 F, trash-burial 200 ft and 3 ft depths, CPAP/hearing-aid battery statements.
- **Articles outside this assignment**: `[[boiling-water]]` is now linked from babies-kids; it must exist (it is already used by disease-prevention). `dehydration-ors` holds the ORS recipe; see the ORS pacing bullet above.

## Second pass (2026-11-16)
Scope: the 53 Unverified rows of the first pass (plus the "Needs human expert review" bullets). About 60 search and fetch calls were used, highest risk first (doses and vital signs, infant and childbirth items, disinfection and burial, herbal, then lower-risk items). Search results often gave only a summary of an official page; those are marked "search result" above. Three official pages could not be read (NLM CHEMM, UNHCR Appendix 3, WHO ENC guide: DNS error, 403, size limit); one NCBI page returned a bot check.

**Counts.**
- Before: 113 rows: Confirmed 33, Corrected 17, Softened 10, **Unverified 53**.
- After: 140 rows (grouped rows were split so resolved and unresolved parts are counted separately): Confirmed 68, Corrected 31, Softened 14, **Unverified 27**.
- Of the 53 original Unverified rows: **27 fully resolved** (18 now Confirmed, 6 Corrected, 1 Softened, 2 split into one Confirmed and one Softened or Corrected row), **12 partly resolved** (the safety-relevant part is now sourced; a minor residual row stays Unverified), and **14 still wholly Unverified**. Exact per-row verdicts are in the Claims table.

### Corrections made in the second pass
| Article | Was | Now | Source |
|---|---|---|---|
| home-nursing | Pulse column "Resting pulse per minute" | "Typical resting pulse per minute" (ranges sit inside NLM awake ranges) | NLM CHEMM (search result) |
| common-illness-care | Nose rinse with "boiled-then-cooled water" | "boiled for 3-5 minutes and cooled until lukewarm"; adds that untreated water can cause serious nose and brain infections | FDA Neti Pots page; CDC sinus rinsing page (search results) |
| common-illness-care | "Wait 15-30 minutes after vomiting" | "Rest the stomach for 5-10 minutes after vomiting" | WHO diarrhoea manual (search result); HealthyChildren Vomiting Without Diarrhea (opened) |
| common-illness-care | "give 1 teaspoon (5 mL) every 1-2 minutes" | "about 1 teaspoon (5 mL) every 1-5 minutes (the AAP suggests 1-2 teaspoons every 5 minutes for a vomiting baby)" | HealthyChildren (opened); WHO, CDC MMWR (search results) |
| infection-antibiotics | Sepsis signs "fast pulse (over 90), fast breathing ... extreme weakness" | "fast or weak pulse, fast breathing or shortness of breath ... extreme pain or weakness" (no pulse number) | CDC About Sepsis (opened) |
| infection-antibiotics | Pneumonia "over 20 breaths a minute in an adult" | "more than about 20 breaths a minute at rest in an adult" | softened, no source |
| meds-stockpile | "there is no guarantee" (expired drugs) | "the FDA says that after the date there is no guarantee a medicine is safe and effective" | FDA Don't Be Tempted to Use Expired Medicines (opened) |
| chronic-conditions | DKA: "In type 1 diabetes this can quickly become diabetic ketoacidosis" | "In diabetes, especially type 1 ... Get emergency care for blood sugar that stays at 300 mg/dL or higher, fruity breath, or vomiting that will not stop." | CDC Diabetic Ketoacidosis (search result) |
| chronic-conditions | Nitroglycerin "in a dark glass bottle" | "in its original glass bottle with the cap tightly closed" | MedlinePlus nitroglycerin; DailyMed labels (search results) |
| chronic-conditions | Heart failure "fast weight gain" | "more than 2-3 lb (1-1.5 kg) in a day or 5 lb (2 kg) in a week ... seek medical advice" | MedlinePlus heart failure home monitoring; AHA (search results) |
| childbirth | Newborns breathe "30-60 times a minute. Watch for grunting ..." | "about 30-60 ... Watch for breathing faster than 60, grunting ..." | WHO postnatal guidance (search result: 60 or more = refer) |
| herbal-remedies | Willow bark: not for under 18, ulcers, bleeding, blood thinners, pregnancy | Adds breastfeeding and aspirin allergy | NCCIH willow bark (search result) |
| womens-health | Cup "empty every 8-12 hours" | "every 4-12 hours, depending on flow and the maker's directions" | PMC case report (search result) |
| womens-health | EC "pills work best within 72 hours" | "levonorgestrel pills work best within 72 hours (3 days) ... Another type (ulipristal) works for up to 5 days but may need a prescription" | PMC EC overview; ACOG (search results) |
| mental-health | Alcohol withdrawal "usually within 6-96 hours" | "usually starts 6-24 hours after the last drink, and the worst problems can come in the first few days and last up to a week" | PMC reviews; NCBI TIP guide (search results) |
| human-waste | Pit latrine "about 6 feet deep" | Adds: only where the bottom stays at least 5 ft (1.5 m) above groundwater; otherwise use a bucket toilet or shallow trench | Sphere 2000 via UNHCR (search result) |
| handwashing-hygiene | Ash or sand "much better than water alone" | "better than water alone" | PMC rapid review; Ethiopia trial (search results) |
| laundry-dishes | Surfaces wet "at least 1 minute" | Adds "(5 minutes after vomit or diarrhea, since norovirus is hard to kill)" | CDC norovirus prevention (search result) |
| trash-garbage | Sharps: "a metal can or thick plastic bottle with a lid" | "heavy-duty, puncture-resistant plastic container with a tight lid (a laundry-detergent bottle works). Do not use a milk jug, soda can, glass jar, or water bottle." | FDA Sharps Disposal Containers (search results) |
| pests-vectors | Permethrin 1% "repeat in 9-10 days" | "repeat in about 9 days, or as the label says" | CDC head lice pages (search results) |
| disease-prevention | Isolation "no fever for 24 hours without fever-reducing medicine, and no vomiting or diarrhea for 48 hours" | "getting better overall and have had no fever for 24 hours without fever-reducing medicine, and (for vomiting or diarrhea) have had no symptoms for 48 hours" | CDC respiratory-virus precautions; CDC norovirus (search results) |
| death-burial | Burial site "at least 100 feet (30 m) from wells, springs, and streams"; "Dig 4-6 feet (1.2-1.8 m) deep"; minimum 3 ft soil | "as far from water as you can ... WHO and PAHO advise at least 650 feet (200 m) from streams, lakes, springs, and drinking-water wells"; "about 5 feet (1.5 m) deep if possible (WHO suggests 1.5-3 m)"; bottom of grave at least 4 ft (1.2 m) above groundwater (5 ft in sand); 3 ft cover kept as the minimum if you cannot dig deeper; "follow local rules" | WHO/PAHO/ICRC Management of Dead Bodies after Disasters (opened) |
| (log) | first-pass jaundice and isolation additions were logged "Unverified" | now Confirmed (see Claims table) | HealthyChildren; CDC |

**Canonical-value note for the lead.** No canonical value in CONTENT_GUIDE.md was contradicted. The WHO/PAHO burial distance (200 m) and the nose-rinse boil time (3-5 min, FDA) are outside the canonical list but differ from the app's boil-1-minute rule, so they are called out here. Another article that gives burial distances (for example an old or disaster-category article) should be checked against the WHO manual.

**Dangerous or high-risk items still unverified** (all low-to-medium; none was found wrong):
1. Cord tie distances and the "tight cord: do not cut before the body is born" step in childbirth (sources disagree).
2. Breech delivery steps.
3. Abscess and wound "opening" advice in infection-antibiotics.
4. Adult "no urine for 12 hours" and "turn every 2 hours".
5. Hydrocortisone cream limits; emergency-contraception OTC status; implant duration.
6. Latrine/trench dimensions and 200 ft from surface water; trash burial depths.
