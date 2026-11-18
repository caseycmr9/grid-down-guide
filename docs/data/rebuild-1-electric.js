(window.ARTICLES = window.ARTICLES || []).push(
  {
    id: 'rebuild-roadmap',
    cat: 'rebuild',
    title: 'Rebuilding Roadmap: What to Rebuild First and Why',
    summary: 'A realistic order for rebuilding after a long grid-down, how to choose between repair, salvage and making, and the safety rules for every project.',
    tags: ['rebuilding', 'roadmap', 'priorities', 'after collapse', 'long term', 'repair or make', 'primitive technology', 'where to start', 'recovery', 'workshop safety'],
    body: `
## Rebuild in this order
Work down this list. Do not start a later step while an earlier one is failing. A person can live only a short time without warmth, a few days without water and a few weeks without food. People can live without electricity.

1. **Water.** Safe drinking water every day. See [[water-needs]], [[water-safety]], [[water-filters]] and [[rain-catchment]].
2. **Shelter and heat.** A dry room and a safe way to heat it. See [[shelter-priorities]], [[heating-home]] and [[masonry-heaters-ovens]].
3. **Food.** Stored food first, then a garden, preserving and animals. See [[garden-planning]], [[food-safety-basics]] and [[livestock-overview]].
4. **Health and sanitation.** Waste disposal, clean hands, wound care. See [[human-waste]], [[handwashing-hygiene]] and [[first-aid-basics]].
5. **Power, tools, metal and housing.** These make life easier and let you build things that last. Start them only when steps 1 to 4 are steady. For the early days, read [[grid-down-timeline]].

## Then rebuild what saves the most work
| If you need | Start with |
|---|---|
| Light, a radio, phone charging | [[solar-system-design]] and [[battery-banks]] |
| Water moved uphill | [[water-pumping]] |
| Cooking and heat | [[masonry-heaters-ovens]] and [[rocket-stove-build]] |
| Edge tools, nails, hinges | [[forge-build]], [[blacksmithing-basics]] and scrap from [[metal-scavenging]] |
| A permanent house | [[building-site]] and [[foundations]] |
| Skilled neighbors | [[community-rebuilding]] |

## Repair, scavenge or make?
Decide in this order. Repair first, scavenge second, make last.

| Choice | Pick it when | Example |
|---|---|---|
| Repair | It still mostly works and you have the parts and skill. This is the fastest and cheapest. | A solar panel with a cracked junction box: [[solar-salvage-repair]] |
| Scavenge | Something usable already exists in empty buildings, cars or farms, and you can check that it is safe. | Steel from old vehicles: [[metal-scavenging]], [[scavenging-salvage]] |
| Make | You cannot repair or find it, or you need many. This takes the most time, people and skill. | Bricks, charcoal and lime: [[clay-pottery-kilns]], [[charcoal-making]], [[lime-mortar-concrete]] |

Scrap iron and steel are far easier to get than iron made from ore. That is why [[smelting-iron]] comes late.

## Before any project, ask three questions
- What is it for, and is there a simpler way to meet that need?
- Can I repair or salvage it instead of making it?
- What could hurt or kill me or someone else, and what stops it?

## Be honest about limits
- **Takes years:** fruit and nut trees, seasoned timber, making glass, making iron from ore, rebuilding a full power system.
- **Needs many people:** raising a timber frame, hauling logs, running a mill, bringing in a harvest. One person cannot do these safely. See [[post-and-beam]], [[log-cabin]] and [[mills-mechanical-power]].
- **Needs specialist knowledge:** house wiring, chimneys and heaters, foundations on poor soil, anything that holds steam under pressure. A mistake burns houses down or kills people. Build small, copy a proven plan, follow local code if any still exists, and have an experienced person check the work. See [[cabin-electrical]], [[masonry-heaters-ovens]] and [[foundations]].

Expect hand tools and 1800s-style technology: water wheels, forges, kilns, hand tools. Do not expect to rebuild a modern factory.

## How this section is laid out
- **Power:** [[electricity-basics]], [[solar-system-design]], [[solar-wiring]], [[battery-banks]], [[solar-salvage-repair]], [[cabin-electrical]], [[electricity-from-scratch]], [[wind-turbine-build]], [[micro-hydro]], [[pedal-hand-power]], [[water-pumping]], [[mills-mechanical-power]].
- **Building:** [[building-site]], [[foundations]], [[log-cabin]], [[post-and-beam]], [[masonry-walls]], [[roofing-materials]], [[doors-windows-insulation]], [[outbuildings]].
- **Primitive technology and materials:** [[clay-pottery-kilns]], [[charcoal-making]], [[lime-mortar-concrete]].
- **Metalworking:** [[metal-scavenging]], [[forge-build]], [[blacksmithing-basics]], [[casting-metals]], [[joining-metal]], [[smelting-iron]].
- **People:** [[community-rebuilding]].

Related basics: [[tools-essentials]], [[simple-machines]], [[measuring-squaring]] and [[sharpening-tools]].

## Safety rules for every project
1. **Protect eyes, ears and lungs.** Wear safety glasses or goggles for hammering, grinding, cutting and anything hot. Wear ear protection around loud work. Wear a dust mask or respirator for stone, concrete, lime and wood dust. Never breathe smoke or fumes.
2. **Respect fire.** Have water, sand or an extinguisher at hand before you light anything. Clear flammable things from the work area. See [[fire-safety]].
3. **Never work alone** on fire, heights, heavy lifts, trenches, machines or electricity. Tell someone where you are and when you will be back.
4. **Test small.** Make a small model first. Test a mortar mix, a weld, or a kiln at low heat before you trust it. Load-test a structure before people stand on it.
5. **Dress for the job.** Wear cotton or wool near sparks and flame, because synthetic cloth melts onto skin. Wear sturdy boots. Tie back long hair and loose sleeves near machines.
6. **Know first aid** for burns, bleeding and electric shock: [[burns]], [[severe-bleeding]], [[drowning-electric]].
7. **Write down what works:** measurements, mixes, temperatures, and what failed. Teach it to others. See [[community-rebuilding]].
8. **Stop when you are tired, hungry, thirsty or rushed.** That is when people get hurt.
`
  },
  {
    id: 'electricity-basics',
    cat: 'rebuild',
    title: 'Electricity Basics: Volts, Amps, Watts and Staying Alive',
    summary: 'Plain-language electricity: volts, amps, watts, Ohm law, fuses, wire size, voltage drop, a multimeter, and what makes a shock dangerous.',
    tags: ['volts', 'amps', 'watts', 'ohm', 'ohms law', 'multimeter', 'voltage drop', 'wire gauge', 'AWG', 'fuse', 'breaker', 'GFCI', 'electric shock', 'series', 'parallel', 'DC', 'AC', 'grounding'],
    body: `
> DANGER: Household power (120 or 240 volts), a string of solar panels and a big battery bank can each kill you or start a fire. Work on wiring only when it is dead: switched off, unplugged or disconnected, and proven dead with a meter. If you are not sure, stop.

## The words
| Word | Unit | Meaning |
|---|---|---|
| Voltage | volts (V) | the push on the electricity, like water pressure |
| Current | amps (A) | how much is flowing |
| Resistance | ohms (Ω) | how hard it is to flow, like a narrow pipe |
| Power | watts (W) | how fast energy is used |
| Energy | watt-hours (Wh) | watts times hours |

## The formulas
- **Ohm's law:** volts = amps × ohms. A 12 V battery across a 4 Ω load pushes 12 ÷ 4 = 3 A.
- **Power:** watts = volts × amps. A 60 W light on 12 V draws 60 ÷ 12 = 5 A.
- **Energy:** watt-hours = watts × hours. A 100 Ah, 12 V battery holds 100 × 12 = 1,200 Wh. It runs that 60 W light for about 20 hours (less after losses).

Low voltage means high amps. A 1,500 W heater draws 12.5 A at 120 V, but 125 A at 12 V. High amps need thick wire. This is why 12 V systems need fat cables.

[[fig:ohms-law-circuit]]

## DC and AC
- **DC** (direct current) flows one way. Batteries, solar panels and USB are DC.
- **AC** (alternating current) swings back and forth 60 times a second (60 Hz) in the US. Wall outlets are AC (120 V). An **inverter** turns DC into AC.
- A DC arc does not go out by itself the way many AC arcs do. Switch heavy loads off before you pull a DC plug or connector.

## Series and parallel
| Wiring | Voltage | Current or capacity | Example |
|---|---|---|---|
| Series (+ to −, end to end) | adds up | stays the same | Four 1.5 V cells make 6 V. Two 12 V batteries make 24 V. |
| Parallel (+ to +, − to −) | stays the same | adds up | Two 12 V, 100 Ah batteries make 12 V, 200 Ah. |

Join only matching parts: same voltage, same type, same age.

[[fig:battery-series-parallel]]

## How shock hurts and kills
Current through the body does the harm. The path matters (across the chest is worst), the time matters, and wet skin lets more current in. This is the OSHA table for a 60 Hz shock, hand to foot, lasting one second:

| Current | Probable effect |
|---|---|
| 1 mA | slight tingle |
| 5 mA | shock felt; you can usually let go, but the jerk can hurt you |
| 6 to 16 mA | painful; you start to lose muscle control and may not be able to let go |
| 18 to 99 mA | extreme pain, breathing may stop, death is possible |
| 100 to 2,000 mA | heart goes into fibrillation (quivering); death is likely |
| over 2,000 mA | cardiac arrest, deep burns, death is probable |

1 mA is one thousandth of an amp. A 15 A breaker allows 15,000 mA. Breakers protect wires, not people.

**What is safe to touch?**
- A 12 V or 24 V battery system is unlikely to shock you through dry, unbroken skin. It can still burn you and start fires.
- Treat anything above about 30 V as dangerous. Meter makers flag 30 V and up as unsafe, and call for protective gear above 50 V.
- Wall power, a solar string of several panels, and 48 V banks (they charge near 58 V) can kill.
- Never touch electrical gear with wet hands or while standing in water.
- Take off rings and watches. A ring across a battery terminal gets red hot.

If someone is shocked: cut the power first, do not touch them while they are in contact, then follow [[drowning-electric]] and [[cpr]].

## Fuses, breakers and GFCIs
- A **fuse** melts and a **breaker** trips when current is too high. Choose one that protects the **wire**, not just the device. Put it on the positive wire as close to the power source as you can.
- Check the voltage rating. DC ratings are lower than AC ratings, and a part used above its DC rating may not stop an arc.
- A **GFCI** outlet or breaker cuts power when current leaks to ground. A standard one trips at 6 mA or more and does not trip under 4 mA. It protects people in wet places.

## Wire size (AWG)
A smaller AWG number means thicker wire. Use the **60 °C column** of the code table for copper, as below, and never put a bigger fuse than the wire can carry.

| AWG | Safe amps | Biggest fuse or breaker |
|---|---|---|
| 14 | 15 | 15 A |
| 12 | 20 | 20 A |
| 10 | 30 | 30 A |
| 8 | 40 | 40 A |
| 6 | 55 | 50 A |
| 4 | 70 | 70 A |
| 2 | 95 | 90 A |
| 1/0 | 125 | 125 A |
| 2/0 | 145 | 125 A |

These values are for copper wire, up to three loaded wires in a bundle, and air up to about 86 °F (30 °C). Hot places, long bundles and conduit need thicker wire. Use the same table for fine-stranded battery cable.

## Voltage drop
A long, thin wire wastes power as heat and starves the load. Drop (volts) = 2 × one-way length (ft) × ohms per 1,000 ft ÷ 1,000 × amps.

Example: 10 A at 12 V over a 50 ft run (one way). The ohms are for warm copper wire.

| Wire | Ohms per 1,000 ft | Voltage lost | Share of 12 V |
|---|---|---|---|
| 12 AWG | 1.87 | 1.87 V | 15.6% |
| 8 AWG | 0.739 | 0.74 V | 6.2% |
| 4 AWG | 0.292 | 0.29 V | 2.4% |

Aim for 3% or less (one battery-system maker says under 2.5%). See [[solar-wiring]] for a length table.

## Grounding
The ground wire gives a fault a path so the breaker or GFCI trips. Never cut off a ground prong. Never use a plug adapter to defeat it.

## Using a multimeter
1. Look over the meter and leads. Never use damaged ones. Test the meter on a known source, such as a battery, first.
2. **DC volts:** black lead in COM, red lead in the V jack, dial on DC volts. Touch red to plus and black to minus. A full, rested 12 V lead-acid battery reads about 12.6 V.
3. **Continuity** (is the path unbroken?): power OFF and disconnected. Dial on the beep symbol. Touch both ends. A beep means connected. Use it on fuses and wires.
4. **Amps:** the meter goes **in series**, and the red lead goes in the A jack. **Never** put it across a battery or outlet. That is a short circuit that can blow the meter fuse, burn the leads and hurt you.

## When to get help
House wiring, 120 or 240 V circuits and anything tied to the utility are for a licensed electrician and local code. If none is available, build small and stay at 12 or 24 V. See [[solar-wiring]], [[cabin-electrical]] and [[generator-safety]].
`
  },
  {
    id: 'solar-system-design',
    cat: 'rebuild',
    title: 'Designing an Off-Grid Solar System',
    summary: 'Size an off-grid solar system step by step: loads, sun hours, panels, battery, controller and inverter, with worked examples from a phone kit to a household.',
    tags: ['solar sizing', 'off grid', 'panel size', 'battery size', 'charge controller', 'MPPT', 'PWM', 'inverter size', 'peak sun hours', 'watt hours', 'system voltage', 'cabin solar', 'depth of discharge'],
    body: `
Basic parts and a first kit are in [[solar-basics]]. This article shows how to size a whole system with real numbers. Do the math before you buy or build.

## The method
1. **List your loads.** For each device: watts × hours per day = watt-hours (Wh) per day. Read the label, or measure with a plug-in watt meter.
2. **Add inverter losses.** Divide the Wh of any AC load by 0.85, because an inverter wastes about 10 to 15%. DC loads (lights, USB, 12 V fans) skip this step.
3. **Pick sun hours for your worst month.** See the table below.
4. **Size the panels.** Panel watts = daily Wh ÷ (sun hours × 0.75). The 0.75 covers heat, dirt, wire and charging losses.
5. **Size the battery.** Battery Wh = daily Wh × days of backup ÷ depth of discharge. Amp-hours = Wh ÷ system volts. Use 2 days of backup (3 in a cloudy region). Use 50% depth of discharge for lead-acid and 80% for LiFePO4. See [[battery-banks]].
6. **Pick the system voltage.**
7. **Size the controller and inverter.**

## Sun hours
One "sun hour" is an hour of full-strength sun on the panel. Design for the worst month, which is usually December. These are cautious starting values, not measured data. December can be much lower than the yearly average: web tables put it near 1.5 in Seattle and 2 to 3 in Chicago, but 4 or more in Denver and about 5 in Phoenix. Treat those as rough.

| Where | Design sun hours |
|---|---|
| Far north or cloudy (Pacific Northwest, Alaska) | 1 to 2 |
| Most of the lower 48 states | 2 to 3 |
| Sunny south and desert | 4 |

The worked examples below use 3. If your number is lower, you need more panels and battery, so size up.

Summer is often 5 to 6 hours, so a winter-sized system makes extra in summer. Check your place on a solar resource map or the PVWatts tool when you can. A 100 W panel makes about 225 Wh at 3 sun hours (100 × 3 × 0.75).

## System voltage
Current = watts ÷ volts, so higher voltage means thinner, cheaper wire. A 1,000 W inverter pulls about 98 A from 12 V, 49 A from 24 V and 25 A from 48 V (including 15% loss).

| System | Use it for |
|---|---|
| 12 V | up to about 1,000 W of load and 400 W of panels |
| 24 V | up to about 2,000 W |
| 48 V | anything bigger |

## Charge controller
- **PWM:** cheap and simple. The panel voltage must match the battery (a "12 V" panel for a 12 V battery).
- **MPPT:** costs more, but lets you wire panels in higher-voltage strings, makes more power in cold weather and with a low battery, and suits larger arrays.
- **Size by amps:** controller amps ≥ panel watts ÷ battery volts × 1.25. Example: 400 W ÷ 12 V = 33.3 A, × 1.25 = 41.7 A, so buy a 50 A controller.
- **Size by volts:** cold raises panel voltage. Corrected Voc = Voc × [1 + (lowest temperature in °C − 25) × (coefficient ÷ 100)]. The coefficient is on the datasheet, often −0.3% to −0.36% per °C. At −25 °C that gives 1 + (−50 × −0.003) = 1.15 (1.18 at −0.36%). With no datasheet, multiply Voc by 1.25, the code table value for silicon panels down to −40 °C.
- Example: two panels with Voc 22 V in series make 44 V. 44 × 1.25 = 55 V. A 100 V controller is fine. A 50 V controller is not. A controller pushed over its voltage limit can be destroyed.
- **Check input amps too:** the controller's rated input current should be at least the array's total Isc × 1.25. Two 5.9 A panels in parallel: 11.8 × 1.25 = 14.8 A.

## Inverter
- Add the running watts of everything that can run at the same time. Choose an inverter with a continuous rating at least 25% higher.
- Motors (fridge, pump) need 2 to 3 times their running watts to start. Check the inverter's surge rating. See [[generator-safety]].
- Use a pure sine wave inverter for motors and electronics when you can.
- DC amps from the battery = watts ÷ (battery volts × 0.85). Cable and fuse sizes are in [[solar-wiring]].

## Three worked examples (3 sun hours)
| | Starter | Cabin | Household basics |
|---|---|---|---|
| Loads | phone 15 Wh, 2 lights (5 W × 4 h) 40 Wh, radio 20 Wh | 6 LED lights, laptop, 2 phones, radio, 12 V fridge 400 Wh, pump | fridge 1,200 Wh, 8 LED bulbs, well pump, laptop and router, 2 fans |
| Daily Wh | 75 | about 800 | about 3,650 |
| Panels needed | 33 W, so buy 50 W | 356 W, so buy 400 W | 1,621 W, so buy 1,800 W |
| Lead-acid battery | 25 Ah at 12 V | 270 Ah at 12 V | 304 Ah at 48 V |
| LiFePO4 battery | 16 Ah at 12 V | 167 Ah at 12 V | 190 Ah at 48 V |
| Voltage | 12 V | 12 V | 48 V |
| Controller | 10 A | 50 A | 60 A |
| Inverter | none | 600 W | 3,000 W with pump surge |

Cabin math: lights 6 × 6 W × 4 h = 144 Wh; laptop 50 W × 3 h = 150 Wh, divided by 0.85 = 176 Wh; the rest adds to 800 Wh. Panels: 800 ÷ (3 × 0.75) = 356 W. Lead battery: 800 × 2 ÷ 0.5 = 3,200 Wh ÷ 12 V = 267 Ah.

The household system has house wiring. Have it designed, wired and inspected by an electrician if you can. See [[cabin-electrical]].

## What solar cannot run
A 1,500 W space heater for 4 hours uses 6,000 Wh a day. At 3 sun hours that needs about 2,700 W of panels and a huge battery, more than the whole household example. Electric stoves, dryers, water heaters and air conditioners are the same. Use wood, insulation and passive solar ([[heating-home]], [[solar-builds]], [[cooking-without-power]]).

## Mounting
- Face the equator (true south in the Northern Hemisphere). True south is not compass south. See [[direction-sun-stars]].
- Tilt about your latitude. A steeper tilt favors winter and sheds snow.
- Check shade from 9 am to 3 pm in the worst month. A small shadow can cut output sharply.
- Bolt the frame down for wind and snow. Leave an air gap behind panels, because hot panels make less power.
- Salvaged panels cut cost a lot. See [[solar-salvage-repair]]. Build in stages, and start with the small kit.

Related: [[batteries-charging]], [[power-outage-basics]].
`
  },
  {
    id: 'solar-wiring',
    cat: 'rebuild',
    title: 'Wiring Solar Panels, Batteries and Inverters Safely',
    summary: 'Wire panels, controller, battery and inverter: series and parallel, wire size, voltage drop, fuses, connect order, grounding and fire-causing mistakes.',
    tags: ['solar wiring', 'MC4', 'fuse', 'breaker', 'wire gauge', 'voltage drop', 'battery cable', 'inverter cable', 'series parallel', 'combiner', 'grounding', 'lightning', 'DC arc', 'short circuit', 'polarity'],
    body: `
> DANGER: Solar panels make power whenever there is light, and you cannot switch them off. Two or three panels in series can pass 60 V, and a longer string can pass 100 V or more. Cover the panels with an opaque cloth or lay them face down before you touch their wires.

> DANGER: A battery can push hundreds or thousands of amps through a dropped wrench or a loose wire. That can weld metal, burn skin and start a fire. Fuse every positive wire at the battery. Remove rings and watches. Use insulated tools.

> DANGER: Never pull apart a connector that is carrying current. A DC arc is hard to put out and can burn the connector and your hand. Open the breaker or switch off the load first.

## Series, parallel, or both
Example: four 100 W panels. Each has Voc 22 V, Isc 5.9 A, Vmp 18 V, Imp 5.5 A. Read your own labels.

| Wiring | Voc | Isc | Vmp | Imp | Power |
|---|---|---|---|---|---|
| 1 panel | 22 V | 5.9 A | 18 V | 5.5 A | 99 W |
| 2 in series | 44 V | 5.9 A | 36 V | 5.5 A | 198 W |
| 2 in parallel | 22 V | 11.8 A | 18 V | 11 A | 198 W |
| 4 as two strings of 2 | 44 V | 11.8 A | 36 V | 11 A | 396 W |

- Series (+ of one to − of the next): voltages add, current stays the same.
- Parallel (all + together, all − together): current adds, voltage stays the same.
- Use the same model in a string. Keep Voc (cold-corrected) under the controller limit. See [[solar-system-design]].

[[fig:solar-panels-series-parallel]]

## The path
Panels, then (with three or more strings) a combiner box that holds the string fuses, then a DC breaker or disconnect, then the charge controller, then the battery. The inverter connects straight to the battery through its own fuse. Loads run through a fuse block. Put a fuse in the **positive** wire as close to the battery as you can (inches, not feet).

[[fig:solar-system-block-diagram]]

## Connectors and cable
- Use PV wire rated for sunlight and wet use outdoors. Use matching MC4-style connectors from one maker. Crimp with the right tool, never pliers. Tug-test each crimp.
- Use fine-stranded copper battery cable with crimped, heat-shrunk lugs. A soldered-only lug can let go when hot.
- Do not put a washer between the lug and the battery post. Tighten to the battery maker's torque. One maker lists 50 to 70 in-lb (6 to 8 N·m) for post terminals, and loose terminals can melt or burn.
- Use a bus bar for many connections. Make all series cables the same length, and all parallel cables the same length.

## Wire size and voltage drop
The table gives the longest **one-way** run for a 3% drop at **12 V**. At 24 V the lengths double; at 48 V they are four times longer. "No" means the wire cannot carry that current.

| Load | 12 AWG | 10 AWG | 8 AWG | 6 AWG | 4 AWG | 2 AWG | 1/0 AWG |
|---|---|---|---|---|---|---|---|
| 5 A | 19 ft | 30 ft | 48 ft | 77 ft | 123 ft | 195 ft | 310 ft |
| 10 A | 9 ft | 15 ft | 24 ft | 38 ft | 61 ft | 97 ft | 155 ft |
| 20 A | 4 ft | 7 ft | 12 ft | 19 ft | 30 ft | 48 ft | 77 ft |
| 30 A | no | 5 ft | 8 ft | 12 ft | 20 ft | 32 ft | 51 ft |
| 60 A | no | no | no | no | 10 ft | 16 ft | 25 ft |
| 100 A | no | no | no | no | no | no | 15 ft |

Battery cables should drop under 2.5%, so keep them short.

## Fuse sizing
**Panel strings:** fuse = 1.56 × the panel's Isc, rounded up to a standard size, but never above the "max series fuse" on the panel label. The 1.56 is 1.25 × 1.25. Example: 5.9 A × 1.56 = 9.2 A, so use a 10 A fuse. Fuse every string, and add a DC breaker between the array and the controller.

**Battery and inverter:** fuse ≈ 1.25 × the inverter's full-load DC amps. The code figures those amps at the lowest battery voltage the inverter will run, so the table below (nominal voltage, 85% efficiency) is a minimum. Use the DC amps and fuse size from your inverter manual when it gives them. The wire must carry at least the fuse rating. The fuse's DC voltage rating must exceed the full battery voltage, and its interrupt rating must exceed the battery's short-circuit current. Lithium banks can push huge short-circuit currents, so use a high-interrupt fuse such as Class T. The table assumes 3 ft of cable each way.

| Inverter | DC amps | Fuse | Copper cable |
|---|---|---|---|
| 300 W, 12 V | 29 A | 40 A | 8 AWG |
| 600 W, 12 V | 59 A | 80 A | 2 AWG |
| 1,000 W, 12 V | 98 A | 125 A | 1/0 AWG |
| 1,000 W, 24 V | 49 A | 70 A | 4 AWG |
| 2,000 W, 24 V | 98 A | 125 A | 1/0 AWG |
| 3,000 W, 48 V | 74 A | 100 A | 1/0 AWG |

If your inverter manual lists a fuse and cable size, use the manual. Above 100 A, use a higher system voltage.

## Connect in this order
1. Take out all fuses and open all breakers. Cover the panels.
2. Run all cables. Check each wire's polarity with a meter.
3. Connect the **battery to the controller first**. The controller reads battery voltage to set itself up.
4. Connect the panels to the controller through the breaker. Uncover them and close the breaker.
5. Connect the inverter and install its fuse. Switch it on.
6. Add loads one at a time.

To shut down, reverse it: loads off, inverter off, cover panels and open the breaker, then disconnect the battery. If your controller manual differs, follow it.

## Grounding and lightning
Bond all metal frames and rails together and to ground as your equipment manual and local code say. This helps a fault trip a breaker. It does not make the system lightning-proof. Stay away from the array in a thunderstorm.

## Fire causes to avoid
- Undersized wire, no fuse, or a fuse bigger than the wire.
- Loose or dirty connections.
- Reversed polarity.
- Mixing old and new batteries, or different types.
- AC-only fuses or switches on DC.
- Wire rubbing on sharp edges, with no grommet.

## Inspection checklist
- [ ] Every positive wire from the battery has a fuse
- [ ] Wire size matches fuse and run length
- [ ] All lugs crimped and torqued, nothing loose
- [ ] Polarity checked and wires labeled (+, −, fuse size)
- [ ] Panels grounded and mounted firmly
- [ ] No exposed copper or damaged insulation

## When to get an electrician
Get one for anything tied to house wiring or the utility, for 120 or 240 V circuits, and for arrays over about 60 V. Follow local code. See [[electricity-basics]], [[battery-banks]], [[cabin-electrical]] and [[generator-safety]].
`
  },
  {
    id: 'battery-banks',
    cat: 'rebuild',
    title: 'Battery Banks: Lead-Acid, Lithium, Care and Safety',
    summary: 'Choose, wire, charge and maintain lead-acid and lithium battery banks, with charge voltages, state of charge, hydrogen, acid, and lithium fire safety.',
    tags: ['battery bank', 'lead acid', 'AGM', 'gel', 'LiFePO4', 'lithium', 'deep cycle', 'depth of discharge', 'equalize', 'hydrometer', 'state of charge', 'battery acid', 'hydrogen', 'thermal runaway', 'salvage batteries', 'UPS battery', 'e-bike battery'],
    body: `
> DANGER: Charging lead-acid batteries makes hydrogen gas. Hydrogen can burn or explode at only about 4% in air (the flammable range is about 4% to 74%). Charge in open, ventilated space. No smoking, flames or sparks. Keep vent caps on.

> DANGER: Damaged, overheated or overcharged lithium-ion cells can go into thermal runaway: a fire that is hard to stop and can start again. Never charge or use a swollen, dented, leaking or hot lithium pack.

## Types compared
| Type | Usable part | Good | Watch out |
|---|---|---|---|
| Flooded lead-acid (deep-cycle, golf cart) | about 50% | Cheapest per Wh | Needs distilled water and ventilation; stay upright |
| AGM (sealed lead-acid) | about 50% | No watering, little gas | Hurt by overcharge; never equalize |
| Gel | about 50% | Sealed | Needs low charge voltage; never equalize |
| LiFePO4 | about 80% | Light; 2,000 or more cycles | No charging below 32 °F (0 °C); needs a battery management system (BMS) |
| NiMH (AA and AAA cells) | most of it | Reusable, for small gear | Small capacity; see [[batteries-charging]] |
| Salvaged lithium-ion (laptop, e-bike, tool packs) | varies | Free energy | Fire risk; see below |

Car starter batteries are made for short bursts, not deep use. See [[solar-basics]].

## Capacity math
Watt-hours = amp-hours × volts. A 100 Ah, 12 V battery holds 1,200 Wh. Lead-acid gives about 600 Wh of it at 50% depth of discharge. LiFePO4 gives about 960 Wh at 80%. Deeper discharges give fewer cycles, so take less to make it last. Heat shortens life, and cold cuts capacity.

## Series and parallel banks
| Bank (6 V, 225 Ah batteries) | Result |
|---|---|
| 2 in series | 12 V, 225 Ah |
| 2 in parallel | 6 V, 450 Ah |
| 4 as two series pairs in parallel | 12 V, 450 Ah (5,400 Wh) |

Use the same type, size, brand and age. Never mix lead-acid with lithium. Keep to three parallel strings or fewer. Make cables in each group equal in length.

## Charging: follow the label
These values are for a 12 V bank (6 lead-acid cells) and come from one battery maker's guide. Double them for 24 V and quadruple them for 48 V.

| Type | Absorption | Float | Equalize |
|---|---|---|---|
| Flooded | 14.1 to 14.7 V | 13.5 V | 16.2 V, only if the maker says |
| AGM | 14.4 V | 13.5 V | Never |
| Gel | 14.4 V | 13.5 V | Never |
| LiFePO4 (4 cells) | up to 14.6 V | not needed | Never |

- **Stages:** bulk (full current until the absorption voltage), absorption (voltage held while current drops), then float (a low voltage that keeps it full).
- A lithium cell must not go above 3.65 V. A 4-cell 12 V pack stops at 14.6 V. A 16-cell 48 V pack stops at 58.4 V.
- Lead-acid needs a bit more voltage when cold and less when hot, about 3 to 5 mV per cell per °C (18 to 30 mV per °C on 12 V). Use the controller's temperature sensor.
- Keep lead-acid charge current under about 13 to 20% of amp-hours. A 225 Ah flooded battery: 29 A.
- Never charge a frozen lead-acid battery, or any battery above 122 °F (50 °C). Keep lithium below 113 °F (45 °C) while charging.
- **Never charge lithium below 32 °F (0 °C).** Metal lithium plates onto the cell, which ruins it and makes it unsafe, and the pack may seem to charge normally.

**Equalizing** is a planned overcharge for 2 to 4 hours, **flooded batteries only**. It mixes the acid and clears sulfate. Do it when the specific gravity after a full charge is under 1.235 or cells differ by more than 0.030. Disconnect the inverter and electronics first, ventilate, and wear goggles.

## State of charge (lead-acid, 12 V)
Rest the battery with no charging or loads for at least 4 hours (24 hours is better).

| Charge | Volts | Specific gravity |
|---|---|---|
| 100% | 12.65 | 1.265 |
| 75% | 12.45 | 1.225 |
| 50% | 12.24 | 1.190 |
| 25% | 12.06 | 1.155 |
| 0% | 11.89 | 1.120 |

A **hydrometer** draws acid up and floats a scale. Deep-cycle batteries may read higher, so use the maker's numbers. A LiFePO4 voltage curve is flat, so voltage cannot show charge; use a battery monitor or the BMS.

## Water and acid
- Add only **distilled** water, only to **flooded** batteries, after a full charge. If plates are exposed, add just enough to cover them, then charge. Never add acid. Never add water to AGM or gel.
- Wear goggles and acid-resistant gloves. Clean terminals with 1 cup of baking soda in 1 gallon of water (60 ml per liter). Keep it out of the cells. Neutralize small spills with baking soda and water.

> WARNING: Battery acid is sulfuric acid. It burns skin and eyes.

If acid touches skin or eyes:
1. Flush at once with lots of clean water. Skin: at least 15 minutes. Eyes: hold the lids open and flush for at least 15 minutes, and 30 if you can (agency advice runs from 15 to 30).
2. Take off soaked clothing while you keep flushing.
3. Get medical help for any eye contact. If swallowed, rinse the mouth, do not make them vomit, do not try to neutralize it, and call Poison Control: 1-800-222-1222.

## Short circuits, weight and lead
Never lay tools on a battery. Take off jewelry. Use insulated wrenches. Lead is toxic: wash hands after handling, keep children away, and never burn or melt batteries. Big batteries are heavy, so lift with two people. Fuse every cable: see [[solar-wiring]].

## Salvaged batteries
- **Golf cart batteries** (6 V deep-cycle) are among the best finds.
- **UPS batteries** are small sealed 12 V lead-acid. Test them. Many are worn out.
- **Laptop, e-bike and power-tool packs** are lithium-ion. The cell types in most of them can start thermal runaway at about 300 to 410 °F (150 to 210 °C). LiFePO4 is safer, at about 518 °F (270 °C).
  - Do not open packs or cut cells.
  - Charge only with the matching charger and a BMS, outdoors or on a hard, non-flammable surface, never unattended or in bed.
  - Do not mix cells.
  - If a pack smokes, hisses or swells, leave the area and keep others away. Call for help if you can.

## Storage and disposal
Store lead-acid fully charged, cool and dry. Check flooded batteries every 4 to 6 weeks and AGM or gel every 2 to 3 months. Recharge when they fall to about 70 to 75%. Store lithium about half charged and cool. Tape the terminals of dead batteries. Return lead-acid to a recycler. Do not put lithium in the trash. See [[batteries-charging]].
`
  },
  {
    id: 'solar-salvage-repair',
    cat: 'rebuild',
    title: 'Salvaging, Testing and Repairing Panels, Inverters and Electronics',
    summary: 'Judge, test and repair salvaged solar panels, controllers, inverters and small electronics, learn basic parts and soldering, and know what never to open.',
    tags: ['salvage solar panel', 'used solar panel', 'test solar panel', 'open circuit voltage', 'short circuit current', 'junction box', 'bypass diode', 'soldering', 'power supply repair', 'capacitor', 'microwave', 'CRT', 'multimeter', 'scavenging electronics', 'repair'],
    body: `
> DANGER: A solar panel in light is live and you cannot switch it off. Cover it with an opaque cloth before you touch its wires or junction box. A broken panel in rain can leak current to the frame and ground, so keep your distance from damaged ones.

## What to look for
| Item | Good signs | Reject if |
|---|---|---|
| Solar panel | Straight frame, whole glass, readable label, good cables | Cracked glass, burn marks, brown or white cells, bubbles or peeling under the glass, melted junction box |
| Controller or inverter | Clean case, voltages on the label | Water damage, scorch marks, burnt smell, swollen capacitors |
| Motor or 12 V fan | Spins freely, smells normal | Seized shaft, melted wire |
| Car parts | 12 V fans and lamps, relays, blade fuses, heavy battery cable | Corroded or cracked cable |
| Batteries | See [[battery-banks]] | Swollen, leaking, hot |

Do not use a panel with dark burnt spots on the cells (a hot spot). It can overheat.

## Read the label
It shows power (W), **Vmp** and **Imp** (volts and amps at best output), **Voc** (open-circuit volts), **Isc** (short-circuit amps), and often a "max series fuse". These are for full sun at 77 °F (25 °C) panel temperature, so real output is lower.

No label? Count the cells. A silicon cell gives about 0.6 V open-circuit. 36 cells is about 22 V (a "12 V" panel). 60 cells is about 36 V. 72 cells is about 43 V. Measure it.

## Test a panel
1. Keep it covered. Check glass, frame and wires.
2. Set the meter to DC volts. Uncover the panel in direct sun, aimed at the sun.
3. Touch the leads to the plus and minus wires. This is **Voc**. In good sun it should be close to the label (within about 10%).
4. Best test: connect it to a controller and battery and watch the charging amps. A 100 W panel (Imp 5.5 A) might give 4 A in strong sun.
5. Optional amps test, small panels only: only if the label Isc is under your meter's amp limit (often 10 A). Move the red lead to the A jack, then touch the panel leads. Never do this on a battery.
6. Test two or three times. Write results on tape on the back.

| Result | Likely cause |
|---|---|
| Voc low by a third or more | shorted bypass diode or dead section |
| Voc fine, current low | shade, dirt, browning, cracked cells, poor light angle |
| No voltage | broken wire, bad junction box or connector |

Field studies found panels lose a median of about 0.5% of their output a year, so old ones are often still useful. That is typical, not a promise for one panel.

## Repair a junction box, diode or connector
1. Cover the panel fully. Work in shade.
2. Open the box. Look for burnt diodes, loose solder or water.
3. Test a diode with the meter's diode setting. It should read in one direction only.
4. Replace it with the same part, or one rated for more amps than the panel's Isc. A diode fitted backwards can block the panel's power.
5. Reseal with silicone. Replace broken MC4 connectors with matching ones, crimped properly.

## Making a small panel from salvaged cells
It is possible, but be realistic. Cells are thin and break easily. Wiring them in a string of 36 gives about 18 V working voltage (36 × 0.5 V), enough for a 12 V battery. You must solder tabbing ribbon, then cover the cells with glass or clear plastic and seal the edges against water. Homemade panels often fail in a season or two. Buy a cheap panel or salvage a whole one first.

## Power supplies, chargers and DC-DC converters
- A device with both sides low voltage (a car USB charger, a DC-DC "buck" converter) is safe to repair or reuse.
- Check in this order: fuse (power off, beep test), cord and plug, loose or cold solder joints, swollen capacitors, burnt parts. Then measure the output volts against the label.
- Replace a failed part with the same rating.
- **Do not open anything that plugs into a wall.** Capacitors inside can hold a shock after it is unplugged. Use it whole, or leave it.

## Parts you will meet
| Part | What it does | Remember |
|---|---|---|
| Resistor | limits current | gets hot if overloaded |
| Diode | one-way valve | the stripe marks the negative end |
| Capacitor | holds charge | polarity matters; it can hold a shock; a bulging top is bad |
| Transistor | electronic switch | easily ruined by heat or wrong voltage |
| Fuse | breaks when current is too high | replace only with the same rating |

## Soldering
1. Clean the parts. Keep the iron tip shiny and tinned.
2. Touch the iron to **both** parts for 2 to 3 seconds.
3. Feed solder into the joint, not onto the iron. Pull the solder away, then the iron.
4. Hold still until it sets. A good joint is smooth, shiny and cone-shaped. Dull or blobby means a cold joint. Redo it.
5. Use lead-free solder in a ventilated place. Blow fumes away from your face. Wash your hands after.
6. Never solder on a live circuit. Treat burns with [[burns]].

## What NOT to open
> DANGER: Leave these closed. They can kill you even after being unplugged for a long time. This guide gives no instructions for opening or reusing them.

- **Microwave ovens.** The transformer makes about 2,000 V, and the capacitor can keep a lethal charge long after unplugging, especially if the oven stopped heating.
- **CRT TVs and monitors.** A 27-inch screen runs at about 27,000 V, the tube can implode, and the glass contains lead.
- **Plug-in power supplies, UPS units and camera flash units.** Capacitors inside can hold a shock.
- Anything labeled with kV or high voltage.

Recycle them or leave them alone. For motors and wire, take small DC parts (fans, printer motors) instead. See [[electricity-from-scratch]], [[scavenging-salvage]] and [[metal-scavenging]].
`
  },
  {
    id: 'cabin-electrical',
    cat: 'rebuild',
    title: 'Wiring a Small Off-Grid Cabin: Lighting, Outlets and Protection',
    summary: 'Plan safe cabin wiring: 12 V lights, USB and outlets, fuse block, wire sizes, inverter circuits, GFCI, battery alarms, a worked example, and code limits.',
    tags: ['cabin wiring', 'off grid cabin', '12 volt lighting', 'LED', 'USB outlet', 'fuse block', 'GFCI', 'inverter wiring', 'wire colors', 'conduit', 'smoke alarm', 'CO alarm', 'electrical code', 'backfeed', 'junction box', 'grounding'],
    body: `
> DANGER: Cabin wiring at 120 or 240 V AC can kill people and burn buildings down. Follow your local electrical code, get a permit and inspection if they exist, and use a licensed electrician if you can reach one. If you cannot, build small and stay at 12 or 24 V DC.

> DANGER: Never plug a generator, inverter or solar system into a wall outlet or into wiring that is also tied to the utility. It can electrocute utility workers and start fires. See [[generator-safety]].

## Plan the circuits
Draw it on paper first. Power flows like this:
1. Panels, a DC breaker, then the charge controller.
2. Controller to the battery bank, with a main fuse on the battery positive.
3. Battery to a main disconnect (a switch or breaker rated for your voltage and amps), then to a fuse block with a negative bus bar, then to the DC circuits.
4. Battery to its own fuse, then the inverter, then any AC outlets.

Give each job its own fuse. One fault then does not darken the whole cabin. Sizing rules are in [[solar-wiring]].

[[fig:cabin-dc-circuit]]

## Worked example: a small 12 V cabin
Drop figures use the warm-copper formula from [[electricity-basics]]. Each fuse is below the wire's rating, so the fuse protects the wire.

| Circuit | Load | Amps | Wire and run | Drop | Fuse |
|---|---|---|---|---|---|
| Lights | 6 LEDs × 6 W = 36 W | 3 A | 12 AWG, 25 ft | 2.3% | 10 A |
| Outlets and USB | up to 60 W | 5 A | 10 AWG, 20 ft | 2.0% | 10 A |
| Water pump | 60 W | 5 A | 10 AWG, 20 ft | 2.0% | 15 A |
| 12 V fridge | about 45 W running | 3.75 A | 10 AWG, 20 ft | 1.5% | 15 A |
| 600 W inverter | at the battery | 59 A (67 A with a low battery) | 2 AWG, 3 ft | 0.7% | 80 A |

The same lights on 14 AWG would lose 3.7%, which is too much. All four DC circuits at once draw about 17 A. Check the labels on your own fridge and pump, because motors draw more when they start.

## Lighting
- Use 12 V LED bulbs or strips and read the watts on the label. Long strips get dim at the far end, so feed them with thicker wire.
- Use switches rated for DC at your voltage and amps. A switch made only for AC can burn out on DC.
- Put some lights on a separate fuse. Keep flashlights ready: [[lighting]].

## USB and DC outlets
- Use a 12 V to 5 V USB charging socket. Two ports at 2.4 A each use about 24 W, or about 2.4 A from 12 V with losses.
- Make 12 V outlets that cannot take a wall plug. Use car-style sockets or polarized plugs, and label them "12 V DC".
- Never use a standard wall outlet for DC.

## Wire, cable and protection
- **DC wiring:** stranded copper. Red is positive and black is negative by convention. Label both ends. Check polarity with a meter before connecting.
- **US AC wiring:** black and red are hot, white is neutral, green or bare is ground. Cable jackets are white for 14 AWG, yellow for 12 AWG and orange for 10 AWG. Other countries use other colors, so check local code.
- **Cable types:** NM-B is for dry indoor walls. UF-B is for damp, outdoor or buried runs.
- **Protection:** run wire in conduit where mice, squirrels or sunlight can reach it. Use grommets where it passes through metal or framing. Support cable so it does not hang. Keep it away from stoves and chimneys.
- **Splices** go only in covered boxes. Outdoors, use weatherproof gasketed boxes and let cables droop before the box so water drips off.

## AC from an inverter
- The safest plan is to plug devices into the inverter's own outlets, or use a short, heavy, GFCI-protected cord.
- Fixed AC wiring is house wiring. A 15 A circuit uses 14 AWG and a 20 A circuit uses 12 AWG, with a matching breaker. Put GFCI protection on outlets in kitchens, baths, outdoors, garages, basements and within 6 ft of a sink. In a cabin, treat every outlet this way. A GFCI trips at 6 mA or more.
- Read your inverter manual about grounding. It says whether neutral and ground are tied together inside. Do not add a second tie.

## Battery smoke and CO alarms
- **Smoke alarms:** in every bedroom or sleeping loft, outside each sleeping area, and on every level. Mount on the ceiling or high on a wall. Test monthly. Replace a 9 V battery yearly, and replace the whole alarm every 10 years.
- **CO alarms:** battery-powered or with battery backup, outside sleeping areas and on every level. Not in kitchens or above fuel-burning appliances. Mount away from vents. Any wood stove, propane or generator makes them essential. See [[fire-safety]] and [[heating-home]].

## Code and inspection
Code exists because wiring fails in ways that cannot be seen: a loose splice heats up for months, then ignites. If any inspector or electrician is reachable, use them. If not, have a second experienced person check your work against this checklist.

- [ ] Every circuit has a fuse or breaker at or below the wire's rating
- [ ] Drop is 3% or less
- [ ] Polarity checked and wires labeled
- [ ] Main disconnect easy to reach and labeled
- [ ] Wire protected from rodents, sun and sharp edges
- [ ] Splices in covered boxes, nothing loose
- [ ] Smoke and CO alarms tested
- [ ] A fire extinguisher by the door
`
  }
);
