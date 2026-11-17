// Crisis mode: one-step-at-a-time scripts, spoken aloud by Read Aloud.
// Every number and sequence here must match data/firstaid.js and CONTENT_GUIDE.md canonical values.
// Fact-checked 2026-11-16 against 2025 AHA CPR & ECC guidelines and 2024 AHA/Red Cross first aid guidelines (see review/firstaid.md).
window.GDG_CRISIS = [
  {
    id: "cpr-adult",
    title: "CPR: adult or teen not breathing",
    icon: "❤️",
    article: "cpr",
    tool: "cpr",
    steps: [
      { t: "Check the scene is safe.", d: "Look for traffic, fire, fallen wires, or gas." },
      { t: "Tap their shoulders hard and shout: Are you OK?" },
      { t: "Shout for help. Call 911 on speaker.", d: "Send someone to bring an AED.", danger: "Do not leave them to look for a phone." },
      { t: "Look at the chest for breathing, no more than 10 seconds.", d: "Gasping is not breathing. Not breathing normally? Start CPR now.", timer: 10 },
      { t: "Lay them on their back on a firm, flat surface." },
      { fig: 'cpr-hand-position', t: "Put the heel of one hand on the center of the chest.", d: "Lower half of the breastbone. Other hand on top, fingers locked, arms straight." },
      { t: "Push hard and fast, 30 times.", d: "2 to 2.4 inches (5 to 6 cm) deep, 100 to 120 a minute. Let the chest come all the way back up.", beat: true },
      { fig: 'airway-head-tilt-chin-lift', t: "If you are trained, give 2 breaths.", d: "Tilt the head back, lift the chin, pinch the nose. Blow 1 second each, until the chest rises. Not trained? Keep pushing nonstop." },
      { t: "Go straight back to pushing. Repeat 30 pushes, 2 breaths.", d: "Keep any pause under 10 seconds.", beat: true },
      { t: "When the AED comes, turn it on and follow its voice.", d: "Bare and dry the chest. Put the pads where the pictures show. Keep pushing until the pads are on." },
      { t: "Stand clear while it checks or shocks.", d: "Start pushing again right after the shock.", danger: "No one may touch the person during a shock." },
      { t: "Keep going until they wake or help takes over.", d: "Swap the person pushing every 2 minutes if you can.", beat: true }
    ]
  },
  {
    id: "cpr-child",
    title: "CPR: child (age 1 to puberty) not breathing",
    icon: "❤️",
    article: "cpr",
    tool: "cpr",
    steps: [
      { t: "Check the scene is safe." },
      { t: "Tap their shoulders and shout: Are you OK?" },
      { t: "Shout for help. Call 911 on speaker.", d: "Send someone to bring an AED.", danger: "Do not leave the child to look for a phone." },
      { t: "Look at the chest for breathing, no more than 10 seconds.", d: "Gasping is not breathing.", timer: 10 },
      { t: "Lay the child on their back on a firm surface." },
      { t: "Push hard and fast in the center of the chest, 30 times.", d: "Use one or two hands. About 2 inches (5 cm) deep, one third of the chest, 100 to 120 a minute.", beat: true },
      { t: "Give 2 breaths.", d: "Tilt the head back, lift the chin, pinch the nose, seal your mouth over theirs. 1 second each, until the chest rises.", danger: "Breaths matter more for children. Give them if you can." },
      { t: "Repeat 30 pushes and 2 breaths.", d: "With two trained rescuers, use 15 pushes to 2 breaths.", beat: true },
      { t: "When the AED comes, turn it on and follow its voice.", d: "Use child pads or child mode if it has them. Adult pads are OK if not, but they must not touch." },
      { t: "Stand clear while it checks or shocks.", d: "Start pushing again right after.", danger: "No one may touch the child during a shock." },
      { t: "Keep going until the child wakes or help takes over.", beat: true }
    ]
  },
  {
    id: "cpr-infant",
    title: "CPR: baby under 1 year not breathing",
    icon: "❤️",
    article: "cpr",
    tool: "cpr",
    steps: [
      { t: "Check the scene is safe." },
      { t: "Tap the baby and shout their name." },
      { t: "Shout for help. Call 911 on speaker.", d: "Send someone to bring an AED." },
      { t: "Look at the chest for breathing, no more than 10 seconds.", d: "Gasping is not breathing.", timer: 10 },
      { t: "Lay the baby on their back on a firm, flat surface." },
      { fig: 'infant-cpr-position', t: "Place the heel of one hand below the nipple line.", d: "Center of the chest. Or wrap both hands around the chest and use two thumbs." },
      { t: "Push hard and fast, 30 times.", d: "About 1.5 inches (4 cm) deep, one third of the chest, 100 to 120 a minute. Let the chest come back up.", beat: true },
      { t: "Cover the mouth and nose with your mouth. Give 2 gentle puffs.", d: "Just enough to see the chest rise." },
      { t: "Repeat 30 pushes and 2 puffs.", d: "With two trained rescuers, use 15 pushes to 2 puffs.", beat: true },
      { t: "AED here? Put one pad on the chest, one on the back.", d: "Use child pads or child mode if it has them. Follow its voice." },
      { t: "Keep going until the baby moves or help takes over.", beat: true }
    ]
  },
  {
    id: "choking-adult-child",
    title: "Choking: adult or child over 1 (awake)",
    icon: "😮",
    article: "choking",
    steps: [
      { t: "Ask: Are you choking?", d: "If they can cough or speak, let them keep coughing. Stay with them." },
      { t: "Cannot breathe, cough, or speak? Tell them you will help." },
      { t: "Shout for someone to call 911." },
      { t: "Stand to the side. Lean them forward, supporting their chest." },
      { fig: 'choking-back-blows', t: "Give 5 hard back blows between the shoulder blades.", d: "Use the heel of your hand." },
      { t: "Stand behind them. Wrap your arms around their waist.", d: "Pregnant or very large person: wrap your arms around the chest instead." },
      { fig: 'choking-abdominal-thrusts', t: "Make a fist just above the belly button.", d: "Thumb side in, well below the breastbone. Grab the fist with your other hand. Pregnant or very large: fist on the center of the breastbone." },
      { t: "Give 5 quick, hard thrusts in and up.", d: "For chest thrusts, pull straight back." },
      { t: "Repeat 5 back blows and 5 thrusts until it comes out.", danger: "If they go limp, lower them to the floor and start CPR." },
      { t: "Once it is out, get them checked.", d: "Thrusts can hurt organs. Watch for belly pain, vomiting, or noisy breathing." }
    ]
  },
  {
    id: "choking-infant",
    title: "Choking: baby under 1 year",
    icon: "😮",
    article: "choking",
    steps: [
      { t: "Can the baby cough or cry?", d: "If coughing hard, let them cough and watch closely." },
      { t: "No sound or breathing? Shout for someone to call 911." },
      { fig: 'choking-infant', t: "Sit down. Lay the baby face down along your forearm.", d: "Rest your arm on your thigh. Hold the jaw to support the head. Head lower than chest." },
      { t: "Give 5 firm back blows between the shoulder blades.", d: "Use the heel of your hand." },
      { t: "Turn the baby face up on your other forearm, head low." },
      { t: "Give 5 chest thrusts with the heel of one hand.", d: "Center of the breastbone, just below the nipple line, about 1.5 inches (4 cm) deep.", danger: "Never do belly thrusts on a baby." },
      { t: "Repeat 5 back blows and 5 chest thrusts until it comes out." },
      { t: "If the baby goes limp, start baby CPR.", d: "Before each set of puffs, look in the mouth. Take out an object only if you see it." },
      { t: "Once it is out, get the baby checked." }
    ]
  },
  {
    id: "choking-unresponsive",
    title: "Choking person goes limp or passes out",
    icon: "😮",
    article: "choking",
    tool: "cpr",
    steps: [
      { t: "Lower them carefully to the ground, on their back." },
      { t: "Shout for help. Call 911 on speaker.", d: "Send someone to bring an AED." },
      { t: "Start CPR: push hard and fast in the center of the chest.", d: "30 pushes. About 2 inches (5 cm) deep for adults and children, 1.5 inches (4 cm) for a baby.", beat: true },
      { t: "Open the mouth and look for the object." },
      { t: "If you can see it, take it out.", danger: "Never sweep blindly with your finger. It can push it deeper." },
      { t: "Give 2 breaths.", d: "If the chest does not rise, tilt the head again and try once more." },
      { t: "Go back to 30 pushes.", beat: true },
      { t: "Keep repeating: pushes, look in the mouth, breaths.", d: "Keep going until it comes out, they breathe, or help takes over.", beat: true }
    ]
  },
  {
    id: "severe-bleeding",
    title: "Severe bleeding",
    icon: "🔴",
    article: "severe-bleeding",
    steps: [
      { t: "Check the scene is safe. Put on gloves if you can.", d: "Plastic bags work if you have no gloves." },
      { t: "Shout for help. Call 911.", d: "Ask for a tourniquet and a first aid kit." },
      { t: "Find where the blood is coming from.", d: "Cut or tear clothing away so you can see the wound." },
      { fig: 'pressure-bandage', t: "Press hard on the wound with a thick cloth.", d: "Use both hands and your body weight. Do not peek." },
      { t: "Blood soaks through? Add more cloth on top and keep pressing.", danger: "Do not remove the first layers." },
      { t: "Deep wound? Stuff gauze or cloth deep into it.", d: "Push it all the way to the bottom and fill the whole hole." },
      { t: "Press hard on the packed wound for 10 minutes.", d: "3 minutes is enough with clotting gauze. Keep pressing if it still bleeds.", timer: 600 },
      { fig: 'tourniquet-placement', t: "Arm or leg still bleeding? Put on a tourniquet.", d: "2 to 3 inches (5 to 7 cm) above the wound, not on a joint. Not sure where? Put it high on the limb." },
      { t: "Twist the rod until the bleeding stops completely, then lock it.", d: "It will hurt a lot. That is normal." },
      { t: "Write down the time the tourniquet went on.", d: "Write it on the tourniquet or the forehead. Use the Tourniquet Clock." },
      { t: "Still bleeding? Put a second tourniquet just above the first." },
      { t: "Keep them lying down and warm. Treat for shock.", d: "Tell the next medical person the tourniquet time.", danger: "Never loosen or remove a tourniquet." }
    ]
  },
  {
    id: "recovery-position",
    title: "Passed out but breathing",
    icon: "🚑",
    article: "first-aid-basics",
    steps: [
      { t: "Check they are breathing normally.", d: "Not breathing, or only gasping? Start CPR instead.", timer: 10 },
      { t: "Shout for help. Call 911 on speaker." },
      { t: "Kneel beside them and straighten their legs.", danger: "Possible neck or back injury? Only roll them if they vomit or you must leave." },
      { t: "Put the arm nearest you out at a right angle, palm up." },
      { t: "Bring the far arm across. Hold their hand against their cheek." },
      { t: "Pull the far knee up, foot flat on the ground." },
      { t: "Pull the knee toward you to roll them onto their side." },
      { t: "Tilt the head back a little to keep the airway open." },
      { fig: 'recovery-position', t: "Bend the top leg: hip and knee at right angles." },
      { t: "Stay with them and keep checking their breathing.", d: "After about 30 minutes, roll them to the other side.", danger: "If breathing stops, roll them onto their back and start CPR." }
    ]
  },
  {
    id: "heart-attack",
    title: "Heart attack: chest pain or pressure",
    icon: "💔",
    article: "heart-stroke",
    steps: [
      { t: "Call 911 now.", d: "Do not wait to see if it passes." },
      { t: "Have them stop and sit down, knees bent.", d: "Half sitting up is usually most comfortable." },
      { t: "Have them chew one 325 mg aspirin, then swallow.", d: "Or four 81 mg low-dose tablets. Only if alert and able to swallow.", danger: "Skip aspirin if allergic, bleeding problem, told never to take it, or possible stroke." },
      { t: "Prescribed nitroglycerin? Help them take it.", d: "1 tablet under the tongue every 5 minutes, up to 3.", danger: "Not if they took a Viagra-type drug in the last 48 hours." },
      { t: "Loosen tight clothing. Keep them calm and warm." },
      { t: "Do not let them walk around or drive." },
      { t: "Stay with them and watch their breathing." },
      { t: "If they collapse and stop breathing, start CPR.", d: "Send someone for an AED." }
    ]
  },
  {
    id: "stroke",
    title: "Stroke: face, arm, or speech problem",
    icon: "🧠",
    article: "heart-stroke",
    steps: [
      { t: "Ask them to smile. Does one side of the face droop?" },
      { t: "Ask them to raise both arms. Does one drift down?" },
      { t: "Ask them to repeat a short sentence. Is speech slurred?", d: "Sudden loss of balance or vision are also warning signs." },
      { t: "Any of these signs? Call 911 now.", d: "Call even if the signs go away." },
      { t: "Write down the time they were last normal.", d: "Tell the responders." },
      { t: "Give nothing to eat or drink.", danger: "Do not give aspirin for a possible stroke." },
      { t: "Lay them down with the head slightly raised.", d: "Drowsy or vomiting? Roll them onto their side." },
      { t: "Diabetic? Check blood sugar if you can.", d: "Low sugar can look like a stroke. If awake and low, give sugar." },
      { t: "Stay with them. Keep them warm and calm.", danger: "If they stop breathing, start CPR." }
    ]
  },
  {
    id: "anaphylaxis",
    title: "Severe allergic reaction (anaphylaxis)",
    icon: "🤧",
    article: "allergic-reaction",
    steps: [
      { t: "Trouble breathing, swelling, or faint after a trigger? Get epinephrine now.", d: "Do not wait to see if it gets worse." },
      { t: "Inject epinephrine into the outer middle thigh.", d: "It works through clothing. 0.3 mg for 66 lb (30 kg) or more. 0.15 mg for 33 to 66 lb." },
      { t: "Press until it clicks. Hold it there.", d: "Hold for the time printed on the device. Nasal spray: follow its label." },
      { t: "Call 911.", d: "Everyone who gets epinephrine needs medical care." },
      { t: "Lay them flat with legs raised.", d: "Hard to breathe? Let them sit up. Vomiting? Roll onto the side.", danger: "Do not let them stand up or walk." },
      { t: "Not better in 5 to 15 minutes? Give a second dose.", d: "Use a new device. Also give it if symptoms come back.", timer: 300 },
      { t: "If they stop breathing, start CPR." },
      { t: "Watch them for at least 4 to 6 hours.", d: "Symptoms can come back. Antihistamines are an add-on only." }
    ]
  },
  {
    id: "seizure",
    title: "Seizure (fit, convulsion)",
    icon: "🚑",
    article: "chronic-conditions",
    steps: [
      { t: "Stay calm. Start timing the seizure.", timer: 300 },
      { t: "Ease them to the floor. Move hard objects away." },
      { t: "Put something soft under their head." },
      { t: "Do not hold them down.", danger: "Never put anything in their mouth." },
      { t: "Loosen anything tight around the neck." },
      { t: "Longer than 5 minutes? Call 911.", d: "Also call for a first seizure, an injury, a seizure in water, or trouble breathing." },
      { t: "When the jerking stops, roll them onto their side." },
      { t: "Stay with them until they are fully awake.", d: "Confusion for a while afterward is normal." },
      { t: "Check their breathing.", danger: "Not breathing normally after the seizure? Start CPR." }
    ]
  },
  {
    id: "burns",
    title: "Burns and scalds",
    icon: "🔥",
    article: "burns",
    steps: [
      { t: "Stop the burning. Move away from the heat.", d: "Clothes on fire: stop, drop, and roll. Electricity: turn the power off first." },
      { t: "Big, deep, or face burn, or hoarse voice? Call 911.", d: "Soot around the nose or mouth means the airway may swell. That is an emergency." },
      { fig: 'burn-cooling', t: "Cool the burn under cool running water for 10 to 20 minutes.", d: "Chemical burn: brush off powder first, then flush at least 20 minutes.", danger: "Do not use ice or ice water.", timer: 1200 },
      { t: "Take off rings, watches, and tight clothes near the burn.", d: "Leave any clothing that is stuck to the skin." },
      { t: "Cover loosely with plastic wrap or a clean non-stick dressing.", danger: "No butter, oil, toothpaste, or powder. Do not pop blisters." },
      { t: "Keep the rest of the body warm." },
      { t: "Give pain medicine as the label says." },
      { t: "Large burn? Give sips of water if awake. Watch for shock." }
    ]
  },
  {
    id: "drowning",
    title: "Drowning: pulled from the water",
    icon: "🌊",
    article: "drowning-electric",
    tool: "cpr",
    steps: [
      { t: "Reach or throw something. Do not go in.", d: "A pole, branch, rope, or anything that floats.", danger: "Never jump into cold or fast water after someone." },
      { t: "Get them onto dry ground, on their back." },
      { t: "Shout for help. Call 911 on speaker." },
      { t: "Look at the chest for breathing, no more than 10 seconds.", timer: 10 },
      { t: "Not breathing? Give 5 rescue breaths.", d: "Tilt the head back, lift the chin, pinch the nose. 1 second each." },
      { t: "Start CPR: 30 pushes, then 2 breaths.", d: "About 2 inches (5 cm) deep, 100 to 120 a minute. Keep repeating.", beat: true },
      { t: "If they vomit, roll them to the side and clear the mouth.", danger: "Do not push on the belly to drain water." },
      { t: "Breathing again? Roll them onto their side." },
      { t: "Remove wet clothes. Dry and warm them." },
      { t: "Get them checked and watch them for 4 to 8 hours.", d: "Breathing problems can start later." }
    ]
  },
  {
    id: "heat-stroke",
    title: "Heat stroke: hot and confused",
    icon: "🥵",
    article: "heat-illness",
    steps: [
      { t: "Hot and confused or acting strange? Treat it as heat stroke.", d: "They may still be sweating. Cool first, transport second." },
      { t: "Move them into shade or a cool place." },
      { t: "Take off extra clothing." },
      { t: "Put them in cold water up to the neck.", d: "A tub, stream, or pool. Add ice if you have it. Usually 10 to 15 minutes." },
      { t: "No tub? Soak the skin with cold water and fan nonstop.", d: "Put ice packs or cold wet towels on the neck, armpits, and groin. Swap them as they warm." },
      { t: "Once cooling has started, call 911 or arrange transport." },
      { t: "Stop cooling at about 101 to 102 °F (38.3 to 38.9 °C).", d: "Keep checking. They can overheat again." },
      { t: "Confused or drowsy? Give nothing by mouth.", danger: "No aspirin or acetaminophen. They do not help heat stroke." },
      { t: "Seizure or vomiting? Roll them onto their side.", danger: "If they stop breathing, start CPR." }
    ]
  },
  {
    id: "hypothermia",
    title: "Hypothermia: dangerously cold",
    icon: "🥶",
    article: "hypothermia-frostbite",
    steps: [
      { t: "Handle them gently.", d: "Rough handling can stop a very cold heart." },
      { t: "Get them out of the wind, rain, and cold." },
      { t: "Call 911 if you can." },
      { t: "Unresponsive? Check breathing for up to 60 seconds.", d: "Breathing can be very slow. None? Start CPR, and keep going longer than usual.", timer: 60 },
      { t: "Remove wet clothing. Cut it off if needed." },
      { t: "Put a pad or blankets under them." },
      { t: "Wrap the whole body and head in dry blankets.", d: "Add a plastic or waterproof layer on the outside." },
      { t: "Put warm, not hot, bottles on the chest, armpits, and groin.", d: "Wrap them in cloth. Or share body heat skin to skin." },
      { t: "Awake and can swallow? Give warm, sweet drinks.", danger: "No alcohol." },
      { t: "Keep them lying flat and still.", danger: "Do not rub the arms or legs. No hot bath." },
      { t: "Stay with them. Keep checking their breathing.", danger: "Do not leave them alone." }
    ]
  },
  {
    id: "poisoning-overdose",
    title: "Poisoning or overdose",
    icon: "☠️",
    article: "poisoning-overdose",
    steps: [
      { t: "Check the scene is safe.", d: "Fumes or gas? Get everyone into fresh air first." },
      { t: "Unresponsive or breathing badly? Call 911 now." },
      { t: "Possible opioids and you have naloxone? Spray it into one nostril.", d: "Signs: very slow or no breathing, blue or gray lips, tiny pupils." },
      { t: "Not breathing? Give rescue breaths or start CPR.", d: "Naloxone does not replace breathing for them." },
      { t: "No response in 2 to 3 minutes? Give another naloxone dose.", d: "Use a new spray in the other nostril.", timer: 120 },
      { t: "Breathing? Roll them onto their side." },
      { t: "Call Poison Control: 1-800-222-1222.", d: "Free, 24 hours. Have their age, weight, what they took, how much, and when." },
      { t: "Do not make them vomit.", danger: "No salt water, milk, or home remedies unless Poison Control says so." },
      { t: "Keep the container, pills, or plant to show responders." },
      { t: "Stay with them and watch their breathing.", d: "Naloxone can wear off in 30 to 90 minutes. The overdose can come back." }
    ]
  },
  {
    id: "carbon-monoxide",
    title: "Carbon monoxide: headache, dizzy, several sick",
    icon: "☠️",
    article: "poisoning-overdose",
    steps: [
      { t: "Get everyone out into fresh air now.", d: "Signs: headache, dizziness, nausea, confusion, sleepiness. Several people sick at once is a clue." },
      { t: "Cannot get out? Open doors and windows." },
      { t: "Call 911.", d: "Anyone who passed out, is confused, or has chest pain needs care. Pregnant women and children are at extra risk." },
      { t: "Not breathing? Start CPR in the fresh air." },
      { t: "Shut off the source only if it is safe." },
      { t: "Stay out until the place is aired out and the source fixed.", danger: "Never run a generator, grill, or camp stove indoors." }
    ]
  },
  {
    id: "shock",
    title: "Shock: pale, cold, clammy, fast pulse",
    icon: "😨",
    article: "shock",
    steps: [
      { t: "Stop any bleeding first." },
      { t: "Call 911 if you can." },
      { t: "Lay them flat on their back." },
      { fig: 'shock-position', t: "Raise their legs about 12 inches (30 cm).", danger: "Not with a head, neck, spine, leg, or pelvis injury, or trouble breathing." },
      { t: "Cover them, and put a blanket underneath too." },
      { t: "Loosen tight clothing." },
      { t: "Give nothing to eat or drink for now.", d: "You can wet their lips." },
      { t: "Check breathing and pulse every 5 minutes.", d: "Be ready to start CPR.", timer: 300 },
      { t: "Vomiting or drowsy? Roll them onto their side.", d: "A pregnant woman should lie on her left side." }
    ]
  },
  {
    id: "broken-bone",
    title: "Broken bone",
    icon: "🦴",
    article: "fractures-sprains",
    steps: [
      { t: "Stop any bleeding first.", d: "Bone through the skin? Press around it, not on it. Do not push it back in." },
      { t: "Keep the injured part still.", danger: "Do not try to straighten it." },
      { t: "Check fingers or toes: warm, pink, can feel and move?" },
      { fig: 'forearm-splint', t: "Pad a splint: boards, sticks, rolled magazines, or a pillow." },
      { t: "Splint it in the position you found it.", d: "Keep the joints above and below the break still too." },
      { t: "Tie above and below the break, not on it.", d: "Firm, but not tight. Leave fingers or toes showing." },
      { t: "Check the fingers or toes again.", d: "Then every 15 to 30 minutes.", danger: "Numb, cold, pale, or blue? Loosen the splint at once." },
      { t: "Put on a cold pack wrapped in cloth for 20 minutes.", timer: 1200 },
      { t: "Thigh or pelvis hurt? Keep them flat and treat for shock.", d: "These breaks bleed heavily inside. Get help." }
    ]
  },
  {
    id: "snakebite",
    title: "Snakebite",
    icon: "🐍",
    article: "bites-stings",
    steps: [
      { t: "Move away from the snake.", danger: "Do not try to catch or kill it." },
      { t: "Call 911. Get to a hospital with antivenom fast." },
      { t: "Stay calm and still. Have others carry them if possible.", d: "Walking speeds the spread of venom." },
      { t: "Remove rings, watches, and tight clothes from the bitten limb." },
      { fig: 'snakebite-care', t: "Keep the limb still, at about heart level.", d: "Do not raise it." },
      { t: "Do not cut, suck, ice, or tie off the bite.", danger: "No tourniquet, electric shock, alcohol, caffeine, or snakebite kit." },
      { t: "Mark the edge of the swelling and write the time.", d: "Mark it again every 15 to 30 minutes." },
      { t: "Watch their breathing on the way to care.", d: "Treat for shock if needed." }
    ]
  },
  {
    id: "electric-shock",
    title: "Electric shock",
    icon: "⚡",
    article: "drowning-electric",
    steps: [
      { t: "Do not touch them while they touch the power.", danger: "Downed power line? Stay at least 35 feet (10 m) away." },
      { t: "Turn off the power at the breaker, or unplug it.", d: "Cannot? Stand on something dry and push them free with dry wood or plastic." },
      { t: "Call 911." },
      { t: "Look at the chest for breathing, no more than 10 seconds.", d: "Lightning victims carry no charge. They are safe to touch.", timer: 10 },
      { t: "Not breathing? Start CPR. Use an AED if you have one." },
      { t: "Cool and cover any burns.", d: "There may be an entry and an exit burn." },
      { t: "Get them checked, even if they seem fine.", d: "Electricity can hurt the heart and muscles inside." }
    ]
  },
  {
    id: "head-neck-spine-injury",
    title: "Head, neck, or back injury",
    icon: "🤕",
    article: "head-spine-injury",
    steps: [
      { t: "Tell them to stay still.", danger: "Do not move them unless they are in danger or cannot breathe." },
      { t: "Call 911 if you can." },
      { t: "Hold the head still, in line with the body.", d: "Hands on both sides of the head, or rolled clothing packed on both sides." },
      { t: "Unresponsive? Open the airway with a jaw thrust.", d: "Fingers behind the jaw angles. Lift the jaw forward without tilting the head.", danger: "Breathing comes before the spine. Tilt the head if you must." },
      { t: "Not breathing? Start CPR." },
      { t: "Check they can feel and move their hands and feet." },
      { t: "Keep them warm." },
      { t: "Leave a helmet on.", d: "Remove it only if it blocks breathing or CPR." },
      { t: "Must move them? Log roll with three people.", d: "One person holds the head and calls the moves. Keep head, neck, and body in a straight line." },
      { t: "Watch for danger signs for the next 3 days.", d: "Worse headache, repeated vomiting, confusion, unequal pupils, seizure. Get urgent care." }
    ]
  },
  {
    id: "low-blood-sugar",
    title: "Low blood sugar: shaky, sweaty, confused",
    icon: "🚑",
    article: "chronic-conditions",
    steps: [
      { t: "Awake and able to swallow? Give 15 grams of fast sugar.", d: "4 oz (120 mL) juice, 3 to 4 glucose tablets, or 1 tablespoon sugar or honey.", danger: "Cannot swallow or passed out? Put nothing in the mouth." },
      { t: "Wait 15 minutes, then check again.", timer: 900 },
      { t: "Still shaky or confused? Give 15 grams of sugar again." },
      { t: "Passed out? Use glucagon if you have it. Call 911.", d: "Roll them onto their side." },
      { t: "Not breathing? Start CPR." }
    ]
  }
];
