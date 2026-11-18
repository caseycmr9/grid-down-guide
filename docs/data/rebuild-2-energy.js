(window.ARTICLES = window.ARTICLES || []).push(
  {
    id: 'electricity-from-scratch',
    cat: 'rebuild',
    title: 'Making Electricity From Scratch: Magnets, Coils, Alternators and Motors',
    summary: 'How generators work and the realistic ways to make power: motor as generator, car alternator, homemade magnet alternator. Magnet dangers and honest output.',
    tags: ['generator', 'alternator', 'magnet', 'neodymium', 'coil', 'faraday', 'induction', 'dynamo', 'motor as generator', 'rectifier', 'homemade generator', 'lemon battery', 'copper wire', 'axial flux'],
    body: `
## What is realistic
Making a spark is easy. Making **useful power** is hard. From easiest to hardest:
1. **A permanent-magnet DC motor used as a generator.** An afternoon's work.
2. **A car alternator.** Easy to find, but it needs a power feed and high speed.
3. **A homemade magnet-and-coil alternator.** Days to weeks. Follow a proven plan, such as Hugh Piggott's *A Wind Turbine Recipe Book*, instead of inventing your own.
4. **Lemon or potato cells.** Science demonstrations only.

Read [[electricity-basics]] first, and store what you make in a battery ([[battery-banks]]).

> DANGER: Strong neodymium magnets snap together hard. They **crush fingers and break bones**, and they shatter into sharp chips. Wear gloves and eye protection. Handle one magnet at a time, keep them apart with wood or plastic spacers, and keep steel tools away from them.

> DANGER: Keep strong magnets away from anyone with a pacemaker or other implant. Makers advise at least 8 inches (20 cm); use 12 inches (30 cm) to be safe. Ask the person's doctor.

> DANGER: If anyone swallows more than one magnet, go to an emergency department at once. They can pull together through the gut wall and cause life-threatening injury. Keep magnets from children.

> WARNING: Neodymium magnets lose strength for good when hot. Many are rated only to about 175 °F (80 °C). Never drill, cut or grind them; the dust can catch fire.

## How a generator works
A wire that moves through a magnetic field has a voltage pushed into it. This is **Faraday's law**. The voltage depends on how fast the magnetic field through a coil changes, times the number of turns. So you get more voltage from **stronger magnets**, **more turns of wire** and **faster spinning**.

A load makes the generator **harder to turn**. Power out is always less than power in; plan on losing a third or more as heat and friction.

A coil generator makes **AC** (alternating current). A battery needs **DC**, so you pass the output through a **rectifier**, a group of diodes that let current flow only one way.

## Option 1: a permanent-magnet DC motor as a generator
Good sources: treadmill, mobility-scooter, wheelchair and power-tool motors. Look for **magnets inside** (no field winding) and a label showing volts and rpm.

Voltage rises in step with speed. Example: a motor marked 24 V at 3,000 rpm makes about 8 V per 1,000 rpm. To push current into a 12 V battery you need about 14 V plus 0.7 V lost in a diode, or about 14.5 V. That takes roughly 1,800 rpm.

Hand crank at 60 rpm: about 30:1 step-up. Pedaling at 70 rpm: about 26:1. See [[mills-mechanical-power]] for gears and pulleys.

Wire it: motor plus, then a **diode** (stripe toward the battery), then a **fuse**, then battery plus. The diode stops the battery from spinning the motor when you stop. Rate both above the motor's current.

## Option 2: a car alternator
A car alternator has no magnets. It needs about 12 V fed to its **field coil** before it makes power, and the field uses power. It also needs speed: usually 1,000 rpm or more before it charges well. Pedal or hand drive would need a step-up of 15:1 or more.

- Find the wiring diagram for your model and keep its regulator.
- Fuse the output wire close to the battery.
- **Never disconnect the battery while it spins.** The voltage spike may ruin the regulator.

Alternators suit engines, not slow wind or water.

## Option 3: build an axial-flux alternator

[[fig:axial-flux-alternator]]

Two steel discs carry neodymium magnets, north and south alternating, facing each other across a gap. Between them sits a fixed ring of flat coils set in resin. Spin the discs and AC appears in the coils. Three-phase wiring gives smooth power.

1. Pick a plan whose sizes fit your speed and battery voltage (12, 24 or 48 V).
2. Build a coil winder. Wind every coil with the **same number of turns**. Twice the turns gives about twice the volts at the same speed.
3. Check each coil's resistance with a multimeter. They should all read nearly the same.
4. Lay the coils in a mold, join them in three groups, and cast them in resin. Ventilate; wear gloves.
5. Glue magnets to the discs in a jig. **Test every magnet face** against a marked reference magnet so poles alternate. One wrong magnet cuts output.
6. Mount the discs on a shaft with good bearings. They pull hard on each other, so use the plan's spacers and bolts to keep them from snapping together.
7. Spin it with a drill or by hand and measure AC volts between phases. All three should match. Keep bare copper off the frame and off other turns.

**Wire:** drawing copper wire is hard. Salvage enamel-coated **magnet wire** from motors, transformers and speakers, and scrape the enamel off the ends before joining.

> DANGER: Do not strip parts from microwave ovens, old picture-tube TVs or monitors, or mains power supplies. Their capacitors can hold a deadly charge long after unplugging. See [[solar-salvage-repair]].

## Rectifier and battery
Use a **three-phase bridge rectifier** (six diodes) rated for at least twice the expected current, bolted to a metal heat sink. Each diode drops about 0.7 V, so a bridge costs about 1.4 V.

Add a **fuse** near the battery and a **charge controller with a diversion (dump) load** ([[wind-turbine-build]]). Size wire and fuses with [[solar-wiring]].

> WARNING: Treat alternator wires as live whenever the machine turns. An alternator running with its output disconnected can make far more voltage than the battery. That can shock you and destroy the rectifier. Guard every spinning part.

## Test it
1. Spin at a steady, counted speed and measure open-circuit volts. Write down **volts per 100 rpm**.
2. Connect through the rectifier to a battery and read the charging current with a meter rated for it.
3. **Watts = volts × amps.**

## Honest output
- A person on a pedal drive makes about 75–100 W of mechanical power for an hour, or roughly 40–70 W of electricity after losses. See [[pedal-hand-power]].
- A hand-built wind alternator in a good site makes tens to a few hundred watts. See [[wind-turbine-build]].
- **A lemon cell** (zinc and copper) makes about 0.9 V and under 1 mA, less than a milliwatt. Charging a phone from one would take over a year. It teaches chemistry, not power.
`
  },
  {
    id: 'wind-turbine-build',
    cat: 'rebuild',
    title: 'Wind Power: Siting, Towers and Building a Small Turbine',
    summary: 'Is wind worth it, how to site and raise a tower safely, and how to build a small turbine with tested numbers, overspeed protection and a dump load.',
    tags: ['wind turbine', 'windmill', 'tower', 'guyed', 'blades', 'tip speed ratio', 'betz', 'swept area', 'dump load', 'furling', 'wind power', 'alternator'],
    body: `
## Is wind worth it?
Wind pays off only where it blows hard and often. Check first:
- Small-wind guides from the US Department of Energy call for an **average wind speed of at least about 9 to 10 mph (4 to 4.5 m/s)** at the turbine's hub height. Below that, use solar ([[solar-basics]]).
- Over a year, small turbines average only **9–22%** of their top output (University of Missouri Extension).
- Wind at tower-top height is stronger than at the ground. If you can, measure for a few months with a cheap anemometer.

## The power formula
**Power in the wind (W) = 0.5 × air density × swept area × speed³**

Air density is 1.225 kg/m³ at sea level, and about 14% less at 5,000 ft (1,500 m). **Swept area** is the circle the blades cover: π × blade length². Speed is in meters per second (mph × 0.447).

Speed is **cubed**. Doubling wind speed gives **8 times** the power.

| Wind speed | Power in the wind, per square meter |
|---|---|
| 5 mph (2.2 m/s) | 7 W |
| 10 mph (4.5 m/s) | 55 W |
| 15 mph (6.7 m/s) | 185 W |
| 20 mph (8.9 m/s) | 440 W |
| 30 mph (13.4 m/s) | 1,480 W |

**The Betz limit:** no turbine can take more than 16/27, or **59.3%**, of the wind's power. Real machines lose more in blades, alternator, wire and rectifier.

### Worked example: an 8 ft (2.4 m) rotor
- Swept area: 4.67 m² (50 ft²).
- At 12 mph (5.4 m/s), the wind carries about **440 W** through the rotor. The Betz limit is about 260 W.
- A good homemade turbine might put **roughly 60–110 W** into the battery. This is an estimate that assumes 15–25% overall efficiency.
- In a study of hand-built turbines, the average output levelled off near 91 W per m² above 22 mph. For this rotor, that is about **425 W** at the top. Individual machines varied a lot.
- At the 9–22% average: about **0.9 to 2.2 kWh a day**. A 400 W solar array makes about 1.2 kWh a day.

## Siting
- Put the bottom of the blades **at least 30 ft (9 m) above the tallest obstacle within 500 ft (150 m)**. Many makers advise a tower of 65 ft (20 m) or more. Towers under 45 ft usually cut output badly.
- Choose open ground, ridges and shores. Plan for trees to grow.
- Keep the **fall zone** clear: at least tower height plus blade length around the base. No houses, roads or power lines.
- In the US, call **811** a few business days before digging anchors.

## Towers
- **Guyed pole** (cable-supported): cheap, needs three or four anchors that hold in your soil.
- **Tilt-up:** hinged at the base and lowered by winch, so you work at ground level. Best for beginners.
- Use a tower rated for the turbine's weight and your winds.

> DANGER: Falls kill. OSHA requires fall protection above 6 ft in construction work. Never climb without a harness and a person watching from the ground. Never climb in wind, rain, ice or storms.

> DANGER: A tower being raised can fall on helpers. Raise it only on a calm day, with enough people, tag lines and a plan. Everyone stays outside the fall zone. Keep a full tower length away from power lines.

## Turbine types
| Type | Good | Bad |
|---|---|---|
| Horizontal axis, 3 blades | Efficient, most proven plans | Needs a tail, furling and a tall tower |
| Vertical axis | Takes wind from any side; generator near ground | Usually less efficient; few proven home designs |

## Building one

[[fig:wind-turbine-parts]]

1. **Alternator:** a permanent-magnet one ([[electricity-from-scratch]]) or a direct-drive e-bike hub motor. A car alternator is a poor fit.
2. **Tip speed ratio (TSR)** is blade-tip speed divided by wind speed. Three-blade rotors work best at about **5 to 7**.
3. **Rotor speed (rpm) = TSR × wind speed (m/s) × 60 ÷ (π × diameter in m).** At 6 m/s (13 mph) and TSR 6, a 4 ft rotor turns about 560 rpm, an 8 ft rotor about 280 rpm, a 12 ft rotor about 190 rpm. The tips of the 8 ft rotor move 36 m/s (80 mph).
4. **Match the alternator to the rotor.** Spin the alternator and note its volts per rpm. It must reach battery voltage at the rpm your rotor makes in light wind.
5. **Blades:** carve three identical blades from dry, straight-grained wood ([[wood-timber-basics]]). Round the front edge, thin the back edge, and angle the blade more steeply near the hub than at the tip. Seal with paint. Use a proven plan for angles.
6. **Balance:** weigh and balance the blades on a pivot, then the whole rotor. An unbalanced rotor shakes itself and the tower apart.
7. **Tail and furling:** the tail points the rotor into the wind. A hinged tail or offset rotor turns the rotor sideways in high wind to cap speed.
8. **Cable:** let the cable hang in a loose loop (or use slip rings) so the turbine can turn without cutting it. Check it for wear.
9. **Wiring:** three wires down the tower to a rectifier, a fuse near the battery, and a controller with a dump load. See [[solar-wiring]] and [[battery-banks]].

> DANGER: **Never let a turbine run with the battery disconnected or with no load.** With nothing to slow it, it overspeeds, makes high voltage and can fly apart. Fit a heavy-duty switch that brakes it by shorting its three phases, and use it before every climb or repair. It slows the rotor but may not stop it, so never work on a turbine in strong wind.

> DANGER: Blades are deadly. Stay out of the rotor's circle, and never work under a turning machine.

## The dump load
When the battery is full, the controller sends extra power to a **dump (diversion) load**: a heating element or resistor bank rated for the voltage and the turbine's full output. Heat water with it. The turbine always has a load.

## Grounding, storms, upkeep
- Ground the tower with a rod and stay away in thunderstorms. See [[cabin-electrical]].
- Look over bolts, guy cables, bearings and blade edges after every big wind. Replace cracked blades.
- Lower a tilt-up tower before extreme storms.
- Blades make noise, so keep it away from bedrooms. In normal times, check zoning and height limits.
`
  },
  {
    id: 'micro-hydro',
    cat: 'rebuild',
    title: 'Micro-Hydro Power: Streams, Water Wheels and Turbines',
    summary: 'Measure head and flow, estimate watts, choose a wheel or turbine, and run a small stream power system safely. Worked numbers and drowning warnings.',
    tags: ['micro hydro', 'hydropower', 'water wheel', 'pelton', 'turbine', 'stream', 'head', 'flow', 'penstock', 'intake', 'water power', 'overshot', 'undershot', 'hydro'],
    body: `
## Why hydro is special
Sun sets and wind drops. A steady stream runs **day and night, all year**, if it does not dry up or freeze. Even a tiny stream can beat a solar panel. You need **head** (the vertical drop) and **flow** (how much water).

## Measure head

[[fig:micro-hydro-layout]]

Head is the **vertical** drop from the intake to the turbine, not the length of pipe.
- **Gauge method (most accurate):** run a pipe or hose from the intake down to the turbine site, fill it with no air trapped, shut the bottom end with a pressure gauge, and read it. **Head in feet = psi × 2.31.** One foot of head is 0.433 psi.
- **Level method:** a helper holds a tall pole downhill. Sight along a carpenter's level from the top. Add up each step's drop as you go down.

**Net head** is the head left after friction losses in the pipe. Use net head in the formulas.

## Measure flow
**Bucket method:** divert the whole stream through a pipe into a bucket and time it. A 5-gallon bucket that fills in 10 seconds is 5 ÷ 10 × 60 = **30 gallons per minute (gpm)**.

For a bigger stream, float an orange over 10 ft and time it. Speed (ft per second) = 10 ÷ seconds. Measure the average width and depth in feet. **Flow ≈ 0.8 × width × depth × speed** in cubic feet per second (1 cubic foot per second = 449 gpm). The 0.8 is a rough allowance for slow water near the bed and banks.

**Measure in the driest season.** Take only part of the flow. Leave water in the stream for fish and neighbors.

## How much power?
**Watts ≈ net head (ft) × flow (gpm) ÷ 10.** This rule of thumb assumes about 50–55% overall efficiency, typical for small systems.

In metric: **watts = 9.81 × head (m) × flow (L/s) × efficiency.**

| Net head | Flow | Power | Energy per day |
|---|---|---|---|
| 10 ft (3 m) | 20 gpm | 20 W | 0.5 kWh |
| 20 ft (6 m) | 50 gpm | 100 W | 2.4 kWh |
| 50 ft (15 m) | 50 gpm | 250 W | 6 kWh |
| 100 ft (30 m) | 100 gpm | 1,000 W | 24 kWh |

A 100 W stream makes 2,400 Wh a day. A 100 W solar panel makes about 300 Wh ([[solar-basics]]), so that small stream equals about eight panels.

## Choose a wheel or turbine
| Site | Choice |
|---|---|
| High head, small flow | **Pelton or Turgo:** a water jet hits cups on a wheel |
| Medium head, medium flow | **Crossflow** turbine |
| Low head, large flow | **Propeller** turbine or a water wheel |

These are rough guides; follow a proven plan.

Water wheels need less head but are big and slow. Approximate heads from a published review:
- **Overshot** (water poured on top): about 8–33 ft (2.5–10 m)
- **Breast:** about 5–10 ft (1.5–3 m)
- **Undershot** (stream pushes the bottom): about 1–7 ft (0.3–2 m)

Historic tests found about **65%** efficiency for overshot wheels and **25%** for undershot. Careful modern builds do better (published figures for good overshot wheels run 80 to 90%). Plan on the low end for a home build.

A wheel often turns under 20 rpm. An alternator needing 600 rpm from a 12 rpm wheel needs a **50:1** step-up, in two or three belt or gear stages. See [[mills-mechanical-power]].

### A small Pelton-style wheel
A jet's speed is √(2 × 9.81 × head in m). At 100 ft (30 m) of head the jet moves about **24.5 m/s (55 mph)**. Cups work best when they move at about **half the jet speed**. A 1 ft (0.3 m) wheel then spins about **780 rpm**, which suits a small alternator without gears. For 100 gpm the nozzle opening is about 0.7 in (18 mm) across. This ignores friction, so test and adjust.

> DANGER: A high-head jet can injure eyes and skin. Enclose the wheel and nozzle in a guard box, and keep faces and hands clear.

## Intake and pipe
- **Intake:** put it in a calm part of the stream. Use a coarse trash rack and a fine screen that is easy to clean. Return water to the stream below. A fish screen keeps fish out.
- **Penstock** (the pipe to the turbine): a larger pipe loses less head. Check the maker's friction tables, and aim to lose under about 10% of the head.
- **Pressure:** 0.433 psi per foot. A 100 ft drop is **43.3 psi** at the bottom. Choose pipe and fittings rated well above that. Sunlight and heat weaken plastic pipe. Steel or heavy-wall PVC is used on pressure lines.
- **Water hammer:** closing a valve fast stops moving water and causes a pressure spike that can burst pipe. Close valves **slowly**.

## Electricity
Wire up as in [[wind-turbine-build]]: alternator ([[electricity-from-scratch]]), rectifier, fuse, batteries ([[battery-banks]]) and a **dump load**.

> DANGER: Hydro cannot be "turned off" by the weather. The water keeps coming. If the batteries are full and there is no dump load, the wheel overspeeds. Always run a diversion load. Never let the alternator run with its output disconnected.

## Rules and neighbors
In normal times, diverting a stream usually needs a **water right or permit**. Check your state or county law. Downstream neighbors and fish need the same water, so agree on a share and keep some flow in the stream.

## Safety around moving water
> DANGER: **Moving water kills.** Just 6 inches (15 cm) of fast water can knock an adult off their feet (National Weather Service). Never wade a stream in high flow. Work with a partner, a rope, and a life jacket. Cold water drains strength fast. See [[drowning-electric]] and [[flood]].

> DANGER: Never swim or wade near a weir, low dam, or intake. Water falling over a dam can trap and drown strong swimmers, and open pipe ends can pull a person in. Keep children well away from the intake, pipe openings and tailrace.

> WARNING: Floods and ice wreck intakes. Build the intake to be rebuilt cheaply. Clear ice and debris only when it is safe to stand there. Belts and gears on the wheel can pull in hands and clothing; guard them. See [[mills-mechanical-power]].
`
  },
  {
    id: 'pedal-hand-power',
    cat: 'rebuild',
    title: 'Human, Animal and Biomass Power: Pedal Generators, Hand Cranks, Biogas and Wood Gas',
    summary: 'What people, animals, stoves and manure can really supply. Realistic watts, plus strong warnings on biogas, wood gas (carbon monoxide) and steam.',
    tags: ['pedal generator', 'bicycle generator', 'hand crank', 'biogas', 'methane', 'wood gas', 'gasifier', 'steam engine', 'stirling', 'thermoelectric', 'draft animal', 'treadmill', 'human power'],
    body: `
## Be honest about the numbers
A healthy adult can make about **75–100 W of mechanical power for an hour**. Over a full work shift, about 75 W. Fit people reach more for short bursts. After the generator and drive lose their share, you get roughly **40–70 W of electricity**.

| Source | Realistic output |
|---|---|
| Person pedaling, one hour | about 40–70 Wh of electricity |
| Hand-crank radio or charger | a few watts at best |
| Thermoelectric plate on a stove | about 2–5 W |
| Horse, steady all day | about 750 W (1 horsepower) |
| Biogas from 9–15 kg of cow dung a day | about 0.4 m³ of gas |

## Pedal generator
Mount a bicycle on a stand so the rear wheel turns a small roller on a generator ([[electricity-from-scratch]]).

- **Drive example:** 70 pedal rpm with a 44/16 gear turns the wheel about 193 rpm. A 26 in wheel on a 1.5 in roller (ratio 17:1) spins the generator about **3,300 rpm**.
- **What an hour gives:** about 50 Wh. A phone needs 12–15 Wh ([[batteries-charging]]), so that is **3 to 4 phone charges**. A 3 W LED light for 4 hours (12 Wh) needs about 15 minutes of pedaling.
- **What it cannot do:** a laptop at 50 W needs a person pedaling the whole time. A refrigerator needs 20–40 hours of pedaling per day. Pedal power is for small loads.

Wire to a battery with a diode and fuse, never straight to a device. Guard the chain, roller and belt. Pedal in steady turns, not sprints.

> WARNING: Stands tip and rollers pinch. Secure the bike on a wide base, guard the roller, and keep fingers, hair and loose clothing away. A flywheel keeps spinning after you stop.

## Hand cranks
Arms are weaker than legs and tire sooner. Small hand-crank chargers give a few watts at best, so a full phone charge can take hours of cranking. Keep them for a radio or a light.

## Stove thermoelectric chargers
A thermoelectric plate turns a **heat difference** into electricity. Mounted on a wood stove or rocket stove ([[rocket-stove-build]]) with a cool side, it can make about 2–5 W. That charges a phone slowly. Plates get very hot: guard them and keep clear of fuel.

## Draft animals and treadmills
A horse can work about **1 horsepower (746 W)** steadily across a ten-hour day. That is about 8–10 people. A treadmill or a walking "sweep" turns a shaft. But the animal needs land, feed and care ([[goats-sheep-cattle]]).

> WARNING: Animals can kick, bolt or panic. Gears and shafts around them need guards. Keep children away.

## Biogas from manure
Manure in a **sealed tank with no air** gives off biogas: about **60% methane and 40% carbon dioxide**, with traces of hydrogen sulfide. Yield: about **0.03–0.04 m³ of gas per kg of fresh cow dung**. So **9–15 kg of dung a day gives about 0.4 m³**. Biogas holds about 6 kWh per m³, so 0.4 m³ is about 2.4 kWh of heat, like a 1,000 W burner for 2.4 hours.

A simple digester is a sealed tank with an inlet for manure and water, an outlet for slurry, and a gas holder (a floating drum or a bag) with a pipe to the stove. Digesters work best at **95–104 °F (35–40 °C)**. In cold weather they slow or stop. They need daily feeding and weeks to start. The leftover slurry is fertilizer but still holds germs ([[compost-fertilizer]]).

> DANGER: **Methane explodes** when it is 5–15% of the air. Keep the digester, the gas holder and all pipes **outdoors**, far from the house, with **no flame, sparks or smoking nearby**. Find leaks with soapy water, never a flame.

> DANGER: **Never enter a digester, a manure pit or a tank.** Biogas displaces air and kills by suffocation. **Hydrogen sulfide** can kill in minutes at high levels and can no longer be smelled at deadly doses. Carbon dioxide is heavier than air and pools low. Airing it out does not make it safe.

## Wood gas (gasifiers)
Heating wood with too little air makes a fuel gas that can run an engine. It is **very dangerous**. The gas is rich in **carbon monoxide (CO)**, often 20 to 30% of the gas. NIOSH treats 1,200 ppm (0.12%) as immediately dangerous to life or health. Gas that is only 10% CO is more than 80 times that level. During World War II in Sweden, producer-gas vehicles caused deaths and about 10,000 recorded chronic poisonings.

> DANGER: **Wood gas is an advanced project.** Do not build from a drawing you found online. Study dedicated sources, learn from someone with experience, and test only outdoors with a partner and a CO alarm. Never run one in a garage or shed. See [[generator-safety]].

Burning wood in a stove ([[rocket-stove-build]], [[masonry-heaters-ovens]]) or making charcoal ([[charcoal-making]]) is far safer.

## Steam and Stirling engines
Water turns into steam with about **1,600 times** the volume. A sealed boiler that fails can explode with great force. Small steam engines are also very inefficient.

> DANGER: **Steam is an advanced project.** Never build a sealed boiler without a proper safety valve and pressure gauge, never wire down or plug a safety valve, and never let the water run low. Learn from an experienced boiler operator first.

A **Stirling engine** runs on outside heat with no boiler. Hobby-size ones produce only a few watts. Do not count on them.
`
  },
  {
    id: 'water-pumping',
    cat: 'rebuild',
    title: 'Pumping Water Without the Grid: Hand Pumps, Rams and Solar or Wind Pumps',
    summary: 'Lift and move water with no grid: suction limits, pressure from height, hand and ram pumps, solar and wind pumps, with worked sizing numbers.',
    tags: ['water pump', 'hand pump', 'ram pump', 'hydraulic ram', 'suction lift', 'well', 'siphon', 'gravity feed', 'solar pump', 'windmill pump', 'pressure', 'head', 'windlass', 'bucket', 'archimedes screw'],
    body: `
## Two limits that decide everything
**1. Suction has a limit.** A pump at the top of a well does not pull water. Air pressure pushes it up. Air pressure is 14.7 psi, which can hold up a column of water about 34 ft (10.3 m) high, and real pumps manage less. Plan on **about 25 ft (7.6 m)** of lift for cold water at sea level. Less at altitude: about 22 ft at 2,000 ft, 17 ft at 6,000 ft and 14 ft at 10,000 ft. Warm water lowers it more. For deeper water, the pump must sit **down in the water** and push it up. See [[wells-springs]].

**2. Height makes pressure.** Water pressure is **0.433 psi per foot** of height (head). One psi equals 2.31 ft.

| Height of water | Pressure |
|---|---|
| 5 ft (1.5 m) | 2.2 psi |
| 10 ft (3 m) | 4.3 psi |
| 30 ft (9 m) | 13 psi |
| 50 ft (15 m) | 21.7 psi |
| 100 ft (30 m) | 43.3 psi |
| 200 ft (61 m) | 86.6 psi |

## Gravity and siphons
A tank 30 ft above a tap gives 13 psi, no matter how big the tank. A **siphon** moves water over a rise with no pump. The outlet must be **lower** than the water you draw from. Fill the tube with water, keep both ends under water, and keep the highest point (the crest) no more than about 15 ft (4.5 m) above the source, and lower at altitude. Any air in the tube stops the flow.

## Hand pumps and lifting
- **Suction (pitcher) pump** at the top: shallow wells only, within the 25 ft limit. Pour clean water in to **prime** it. An air leak anywhere kills suction.
- **Piston (deep-well) pump:** the cylinder sits down in the water and a rod lifts the water column. The force on the rod is the **cylinder area × 0.433 psi × depth**.

| Cylinder | 50 ft deep | 100 ft deep | 200 ft deep |
|---|---|---|---|
| 1.5 in | 38 lb | 77 lb | 153 lb |
| 2 in | 68 lb | 136 lb | 272 lb |

The handle's lever lowers the push you feel. A smaller cylinder is easier to work but needs more strokes. A 1.5 in cylinder with a 6 in stroke moves about 0.046 gallon, or 22 strokes per gallon.

- **Rope and bucket with a windlass:** a crank 12 in long on a drum 4 in in radius gives 3:1. A full 5-gallon bucket weighs about 42 lb, so you feel about 14 lb at the handle, plus rope and friction.
- **Bucket chain, rope pump and Archimedes screw** (a spiral inside a tilted tube) lift large amounts through short heights.

> DANGER: A windlass handle can spin back and break an arm. Fit a ratchet or brake and never let go while loaded. Cover the well and keep children away. Never climb into a well. See [[wells-springs]].

## Hydraulic ram pump

[[fig:hydraulic-ram-layout]]

A ram uses falling water to push **a small part of it higher**. It needs no fuel and works 24 hours a day. You need a stream or spring with at least **3 ft (1 m) of fall** to the pump.

**How it works:** water rushes down the **drive pipe** and out a waste valve. When it speeds up enough, the valve slams shut. The sudden stop makes a pressure spike that pushes some water through a check valve into an air chamber and up the **delivery pipe**. Then the waste valve reopens. This repeats about 40–60 times a minute.

**Rules** (extension and provincial guides):
- Drive pipe length: **5 to 12 times the fall**. Use straight, rigid steel or Schedule 40 PVC pipe.
- Delivery pipe: about **half** the drive pipe's diameter.
- Efficiency falls as lift rises. Lift divided by fall: at 3 about 85%, at 5–6 about 75%, at 10 about 60%, at 15 about 40%. **For a home-built ram, assume half of these** until tested.
- **Gallons a day = 1,440 × efficiency × drive flow (gpm) ÷ (lift ÷ fall).**

**Worked example:** fall 6 ft, lift 30 ft (ratio 5), drive flow 10 gpm, home-built efficiency 0.375 (half of 75%).
1,440 × 0.375 × 10 ÷ 5 = **1,080 gallons a day** (0.75 gpm). The drive pipe should be 36–72 ft long. Of 14,400 gallons that run through each day, only about 1,080 reach the tank. The rest goes back to the stream.

Build one from plumbing parts: a tee, two check valves, a union, and a capped pipe as the air chamber with a small air inlet. Follow a proven plan. The waste valve needs patient tuning.

> WARNING: Each stroke is a hammer blow. Use pressure-rated parts, fix the pump down firmly, and keep hands clear while it runs.

> NOTE: Stream and spring water is not safe to drink as pumped. Filter and disinfect it ([[water-filters]], [[chemical-disinfection]]).

## Solar DC pumps
Energy to lift water: **Wh = gallons × feet × 0.00314**. Divide by about **0.3** for small pump systems, then divide by (sun hours × 0.75) for panel watts. See [[solar-basics]].

**Example:** 300 gallons a day lifted 60 ft.
- 300 × 60 × 0.00314 = 57 Wh
- 57 ÷ 0.3 = 189 Wh
- 189 ÷ (4 sun hours × 0.75) = **63 W** of panels, so a 100 W panel has room to spare

Pump during the day into a tank. The tank is your battery, so you may not need one. Use a DC pump rated for your depth, and read its curve.

## Windmill pumps
A many-bladed windmill moves a rod up and down that works a piston pump in the well. It is slow and tough and needs no battery. It fills a tank, which stores the water. It needs a tower and a way to stop it in storms. See [[wind-turbine-build]].

## Keep water clean and pumps working
- Keep tanks covered, screened and dark ([[water-storage]], [[rain-catchment]]), and treat water before drinking.
- Seal the well top and keep animals away.
- **Freezing:** bury pipe below frost depth. Hand pumps have a small drain hole that empties them. Drain rams and exposed pipes in a freeze.
- Keep spare leathers, seals, check valves, pipe and fittings. Clean screens and valves.
`
  },
  {
    id: 'mills-mechanical-power',
    cat: 'rebuild',
    title: 'Mechanical Power: Water Wheels, Windmills, Belts, Gears and Grain Mills',
    summary: 'Use rotation directly: gear and belt ratios, flywheels, cranks, bearings, quern and mill stones. Guards, shutoffs and dust-explosion warnings included.',
    tags: ['gear ratio', 'belt', 'pulley', 'flywheel', 'crank', 'cam', 'bearing', 'quern', 'millstone', 'grain mill', 'water wheel', 'windmill', 'sawmill', 'line shaft', 'torque', 'grinding grain'],
    body: `
## Speed trades for torque
A machine cannot give out more power than it takes in. **Power = torque × speed.** If you slow a shaft down by a ratio, you multiply its twisting force (torque) by the same ratio, minus losses. Speeding a shaft up does the reverse.

- **Gears:** speed-up ratio = teeth on the driving (input) gear ÷ teeth on the driven (output) gear. A bigger gear driving a smaller one speeds it up.
- **Belts and pulleys:** speed-up ratio = driving (input) pulley diameter ÷ driven (output) pulley diameter.
- Stages **multiply**.

**Worked example:** a water wheel turns 12 rpm. A 60-tooth gear drives a 12-tooth pinion: 5:1, so 60 rpm. A belt from a 24 in pulley to a 4 in pulley: 6:1, so 360 rpm. Total **30:1**.

Say the wheel gives 400 W. At 12 rpm that is a huge torque of about 318 N·m (235 lb-ft). At 360 rpm the same power is only about 10.6 N·m (7.8 lb-ft). Allow about **10% loss per stage**, so two stages leave about 324 W.

The slow side of a gear train is the strong side. A wheel and its first gear can break bones and shafts. Treat it with respect.

[[fig:gear-belt-speed-ratio]]


## Belts, pulleys and line shafts
- **Flat belts** (leather, canvas, rubber) ride on pulleys with a slightly rounded crown that keeps them centered. **V-belts** (car belts work) grip better in grooved pulleys.
- A belt should be tight enough not to slip, but not so tight it wears bearings. Keep each stage to about 5:1 or less. Add a second stage for more.
- **Belt speed = π × diameter × rpm.** A 6 in pulley at 1,750 rpm moves its belt at about 2,750 ft per minute.
- A **line shaft** is one long shaft that carries power from a wheel to many machines by belts. Keep bearings aligned and pulleys balanced.

## Flywheels, cranks and cams
- A **flywheel** stores energy and smooths jerky power. Example: a ring-shaped 50 lb (23 kg), 2 ft (0.6 m) flywheel at 300 rpm stores about 1,040 J. That is like a 100 lb weight dropped 7–8 ft. Its rim moves about 21 mph.
- A **crank** turns rotation into back-and-forth motion. **Stroke = 2 × crank radius.** A 6 in crank gives a 12 in stroke.
- Example: a wheel at 10 rpm with a 6 in crank works a pump rod 10 strokes a minute. A 3 in piston moves about 3.7 gallons a minute. Lifting 30 ft needs about 92 lb on the rod ([[water-pumping]]).
- A **cam** (a lobe on a shaft) lifts a rod or hammer once per turn.

## Bearings and oil
- **Wood bearings:** end-grain hardwood blocks, kept oiled, greased or wet, work for slow heavy shafts. Make them easy to replace.
- **Bronze or brass bushings** with oil suit slow, heavy loads.
- **Ball and roller bearings** can be salvaged from cars, bikes, skates and old machines. Keep dirt and water out and keep them greased.
- Line up the shafts and bolt everything to a rigid, level frame.
- Oil **while the machine is stopped** when you can. Inspect belts, pulleys and bearings at least every two months.

## Guards and shutoffs
> DANGER: Belts, shafts, gears, chains and flywheels grab sleeves, hair, gloves and fingers in a flash. OSHA rules require guards on flywheels, pulleys, belts, gears and shafts within 7 ft (2.1 m) of the floor. Copy them: **enclose every moving part** that anyone can reach. Never use a cracked pulley or flywheel.

> DANGER: A water wheel or windmill keeps pushing when you are done. Build a **gate to stop the water** (or a brake and tie-down for the wind) and a way to lock it. Stop the machine and block it before you reach in, clear a jam or oil it.

- Tight clothing, hair tied back, no gloves or loose cuffs near moving parts.
- Never work alone near a running line shaft.

## Hand querns and grain mills
- **Saddle quern:** a hand stone rubbed on a flat or dished stone. One study of volunteers found it roughly **4 times less efficient** than a rotary quern. A day's flour was very hard work.
- **Rotary quern:** two round stones. The lower stays still, the upper turns on a handle, and grain drops through a center hole. For a household it may take an hour or more a day.
- **Steel plate mills,** salvaged hand-crank types, work well. Grain also cracks in a mortar.

**Choosing and dressing stones:** pick a hard, rough, tight-grained stone that does not shed sand when rubbed. Soft stone puts grit in flour and wears teeth. Cut shallow **furrows** (grooves) in each face. They carry flour outward. The flat parts between are the **lands**. Re-cut the furrows with a hammer and chisel when they wear. Raise the top stone for coarse flour and lower it for fine. **Never run the stones empty.**

> WARNING: Cutting stone throws sharp chips and silica dust. Wear eye protection and a snug-fitting respirator (N95 at the least; a half-mask with P100 filters is better), work outdoors and wet the stone. See [[tools-essentials]].

> DANGER: **Flour and grain dust explode.** Dust in the air plus a spark, flame or hot bearing can explode. OSHA says 1/8 inch of settled grain dust is enough fuel. Keep mills clean and ventilated. No flame, no smoking, no sparks, and keep bearings cool. See [[fire-safety]].

## Water mills, sawmills and windmills
- **Water mill:** wheel, gears, then stone. Get head and flow from [[micro-hydro]]. A wheel at 12 rpm needs about 8:1 to turn a stone at about 100 rpm; your stone's plan sets the right speed.
- **Sash sawmill:** a crank on the wheel moves a straight saw up and down in a frame while a carriage feeds the log. It is slow, but it saves huge labor in ripping boards ([[wood-timber-basics]]).
- **Windmill:** sails turn a shaft. It needs a brake and a way to stop or shorten the sails in storms. Keep people out of the sail circle.
- More on levers and pulleys: [[simple-machines]]. For joints, [[fasteners-joinery]] and [[blacksmithing-basics]].
`
  }
);
