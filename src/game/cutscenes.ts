import { Cutscene } from './types';

export const CUTSCENES: Record<string, Cutscene> = {
  intro: {
    id: 'intro',
    title: 'SUPER ZACHERY\'S REVENGE 2',
    chapterName: 'Journey Through the Dark Forest',
    lines: [
      { speaker: 'narrator', text: 'Long ago, this forest was alive… not with fear… but with balance.' },
      { speaker: 'narrator', text: 'But something buried deep beneath the roots… woke up.' },
      { speaker: 'narrator', text: 'It twisted life into something else… something obedient.' },
      { speaker: 'zachery', text: '...Not again.', style: 'whisper' },
      { speaker: 'narrator', text: 'And so… he returns.' },
    ],
  },

  chapter1_start: {
    id: 'chapter1_start',
    chapterName: 'Chapter 1: The Withered Entrance',
    lines: [
      { speaker: 'narrator', text: 'The forest edge reeks of rust and decay. Mechanical roots have twisted through the ancient trees.' },
      { speaker: 'narrator', text: 'Basic MechEggs patrol the broken paths. Weak Onioids lurk in the shadows.' },
      { speaker: 'zachery', text: 'The corruption is worse than last time. I have to push through.' },
    ],
  },

  chapter1_mid: {
    id: 'chapter1_mid',
    lines: [
      { speaker: 'narrator', text: 'Deeper into the withered entrance, the trees turn half-metal. Old machines lie shattered along the path.' },
      { speaker: 'zachery', text: 'These machines… someone built them here on purpose.' },
      { speaker: 'narrator', text: 'Mechanical roots pulse faintly beneath the soil, as if breathing.' },
    ],
  },

  chapter1_end: {
    id: 'chapter1_end',
    lines: [
      { speaker: 'narrator', text: 'Zachery finds a destroyed camp, littered with broken equipment.' },
      { speaker: 'zachery', text: '...They were here before me.' },
      { speaker: 'robot', text: 'DO NOT PROCEED… CORE… IS… AWAKE—', style: 'distorted' },
      { speaker: 'narrator', text: 'The broken robot shuts down violently, sparks flying.' },
      { speaker: 'zachery', text: '...Core?' },
    ],
  },

  chapter2_start: {
    id: 'chapter2_start',
    chapterName: 'Chapter 2: The Fog of Static',
    lines: [
      { speaker: 'narrator', text: 'A heavy fog rolls in, glitching in and out of existence. Something is distorting reality itself.' },
      { speaker: 'narrator', text: 'Cloaked Onioids appear from nowhere. Exploding MechEggs litter the path.' },
      { speaker: 'zachery', text: 'I can barely see. Have to rely on instinct.' },
    ],
  },

  chapter2_mid: {
    id: 'chapter2_mid',
    lines: [
      { speaker: 'voice', text: 'YOU ARE LATE…', style: 'distorted' },
      { speaker: 'zachery', text: 'Show yourself.' },
      { speaker: 'voice', text: 'YOU LEFT US TO ROT.', style: 'distorted' },
      { speaker: 'narrator', text: 'A massive silhouette flashes through the static — something ancient and terrible.' },
    ],
  },

  chapter2_end: {
    id: 'chapter2_end',
    lines: [
      { speaker: 'narrator', text: 'The fog thins. Ahead, the ground cracks open revealing metal beneath the earth.' },
      { speaker: 'zachery', text: 'It\'s not just the surface… the corruption goes underground.' },
      { speaker: 'narrator', text: 'A cold wind rises from the depths. The real darkness lies below.' },
    ],
  },

  chapter3_start: {
    id: 'chapter3_start',
    chapterName: 'Chapter 3: The Iron Roots',
    lines: [
      { speaker: 'narrator', text: 'The forest gives way to underground tunnels of metal roots. The machine has taken over completely.' },
      { speaker: 'narrator', text: 'Armored MechEggs and Heavy Onioid brutes guard every passage.' },
      { speaker: 'zachery', text: 'It goes deeper than I thought. This isn\'t just corruption — it\'s alive.' },
    ],
  },

  chapter3_mid: {
    id: 'chapter3_mid',
    lines: [
      { speaker: 'narrator', text: 'Pulsing mechanical veins line the walls, throbbing with a sickly light.' },
      { speaker: 'zachery', text: 'These veins… they\'re all connected to something deeper.' },
      { speaker: 'narrator', text: 'The ground trembles. Whatever lives below is aware of Zachery\'s presence.' },
    ],
  },

  chapter3_end: {
    id: 'chapter3_end',
    lines: [
      { speaker: 'narrator', text: 'Zachery reaches a massive underground chamber. The camera pans up…' },
      { speaker: 'narrator', text: 'Something HUGE breathes slowly in the darkness. Pulsing veins of metal cover the walls.' },
      { speaker: 'zachery', text: '...What did they create?', style: 'whisper' },
    ],
  },

  chapter4_start: {
    id: 'chapter4_start',
    chapterName: 'Chapter 4: The Rotting Heart',
    lines: [
      { speaker: 'narrator', text: 'Flesh and metal fuse together in grotesque harmony. A heartbeat echoes through the chamber.' },
      { speaker: 'narrator', text: 'Corrupted hybrids — fused egg and onion monstrosities — block the way.' },
      { speaker: 'zachery', text: 'Almost there. I can feel it pulsing.' },
    ],
  },

  chapter4_boss: {
    id: 'chapter4_boss',
    chapterName: 'The Rotting Heart — Boss Battle',
    lines: [
      { speaker: 'narrator', text: 'The ground shakes. Something rises from the corrupted earth.' },
      { speaker: 'narrator', text: 'The Rotten Colossus emerges — massive, decayed, mechanical-organic.' },
      { speaker: 'colossus', text: '...Zachery…', style: 'distorted' },
      { speaker: 'zachery', text: 'You… know me?' },
      { speaker: 'colossus', text: 'YOU… LEFT… US.', style: 'distorted' },
    ],
  },

  boss_phase1: { id: 'boss_phase1', lines: [{ speaker: 'colossus', text: 'FEEL… WHAT YOU CREATED.', style: 'distorted' }] },
  boss_phase2: { id: 'boss_phase2', lines: [
    { speaker: 'colossus', text: 'WE WERE… ALIVE.', style: 'distorted' },
    { speaker: 'zachery', text: 'I didn\'t know—!' },
    { speaker: 'colossus', text: 'YOU DIDN\'T CARE.', style: 'distorted' },
  ]},
  boss_phase3: { id: 'boss_phase3', lines: [
    { speaker: 'colossus', text: 'END… THIS…', style: 'distorted' },
    { speaker: 'zachery', text: '...I will.', style: 'whisper' },
  ]},

  // ═══════════════════════════════════════════
  // LEVI TAKES OVER — After Colossus Defeat
  // ═══════════════════════════════════════════

  colossus_ending: {
    id: 'colossus_ending',
    lines: [
      { speaker: 'narrator', text: 'Zachery\'s ancient arrow pierces through the Rotten Colossus.' },
      { speaker: 'narrator', text: 'The Colossus detonates in a cataclysmic explosion.' },
      { speaker: 'narrator', text: 'But the blast sends Zachery flying. He crashes into the cavern wall.' },
      { speaker: 'zachery', text: 'Ugh… I can\'t… move…', style: 'whisper' },
      { speaker: 'narrator', text: 'From the shadows, a figure emerges. Curly hair. Glasses. A hungry look in his eyes.' },
      { speaker: 'levi', text: 'Zachery! Are you okay?!' },
      { speaker: 'zachery', text: 'Levi… the Core… it\'s still alive down there. You have to finish it.', style: 'whisper' },
      { speaker: 'levi', text: '...Me? But I don\'t have weapons like you.' },
      { speaker: 'zachery', text: 'You don\'t need weapons. You have something better.', style: 'whisper' },
      { speaker: 'levi', text: '...My appetite?' },
      { speaker: 'zachery', text: 'Your POWER. Devour them, Levi. Eat everything the Core throws at you.', style: 'whisper' },
      { speaker: 'levi', text: 'Say less. 😤' },
      { speaker: 'narrator', text: 'Super Levi steps forward. The ground trembles beneath him.' },
      { speaker: 'narrator', text: 'A new hero rises. The forest\'s last hope.' },
    ],
  },

  // ═══════════════════════════════════════════
  // CHAPTER 5: LEVI'S DESCENT
  // ═══════════════════════════════════════════

  chapter5_start: {
    id: 'chapter5_start',
    chapterName: 'Chapter 5: The Descent',
    lines: [
      { speaker: 'narrator', text: 'Super Levi descends deeper into the corrupted underground.' },
      { speaker: 'narrator', text: 'The air grows thick. The enemies grow stronger. But so does Levi.' },
      { speaker: 'levi', text: 'These things are tougher down here. Good — I was getting bored.' },
      { speaker: 'narrator', text: 'His hunger grows with every step. Every devoured enemy fuels his power.' },
    ],
  },

  chapter5_mid: {
    id: 'chapter5_mid',
    lines: [
      { speaker: 'narrator', text: 'The tunnels twist deeper. Toxic fumes rise from cracks in the earth.' },
      { speaker: 'levi', text: 'Something\'s different down here. The enemies are… dripping with something.' },
      { speaker: 'narrator', text: 'Acid pools form where corrupted enemies fall. The Core\'s poison is everywhere.' },
      { speaker: 'levi', text: 'If I can eat their acid... maybe I can USE it.' },
    ],
  },

  // ═══════════════════════════════════════════
  // CHAPTER 6: THE LIVING FACTORY
  // ═══════════════════════════════════════════

  chapter6_start: {
    id: 'chapter6_start',
    chapterName: 'Chapter 6: The Living Factory',
    lines: [
      { speaker: 'narrator', text: 'The tunnels open into an enormous cavern — a factory of flesh and steel.' },
      { speaker: 'narrator', text: 'Conveyor belts of organic matter churn. This is where the Core makes its army.' },
      { speaker: 'levi', text: 'So this is where all those MechEggs come from. Gross.' },
      { speaker: 'levi', text: '...but also kind of delicious-looking?' },
      { speaker: 'narrator', text: 'The factory pulses with a heartbeat. The Core knows Levi is close.' },
    ],
  },

  chapter6_mid: {
    id: 'chapter6_mid',
    lines: [
      { speaker: 'narrator', text: 'Levi reaches the factory\'s central chamber. Massive vats of glowing liquid bubble.' },
      { speaker: 'core', text: 'YOU... CONSUME MY CHILDREN?', style: 'distorted' },
      { speaker: 'levi', text: 'Oh, you can talk? Cool. Yeah, they\'re pretty tasty actually.' },
      { speaker: 'core', text: 'I WILL MAKE AN ARMY FROM YOUR BONES.', style: 'distorted' },
      { speaker: 'levi', text: 'Bold talk from a tree that can\'t move. 😤' },
      { speaker: 'narrator', text: 'The factory shudders. The Core is preparing something.' },
    ],
  },

  // ═══════════════════════════════════════════
  // CHAPTER 7: THE ROTTEN CORE — FINAL BOSS
  // ═══════════════════════════════════════════

  rotten_core_intro: {
    id: 'rotten_core_intro',
    chapterName: 'Chapter 7: The Rotten Core',
    lines: [
      { speaker: 'narrator', text: 'The factory collapses behind Levi. He enters the deepest chamber.' },
      { speaker: 'narrator', text: 'What he thought was terrain… begins to MOVE.' },
      { speaker: 'narrator', text: 'Eyes ignite with sickly green light. Mechanical parts grind to life.' },
      { speaker: 'narrator', text: 'The Heart Tree — once the source of all life — has become something else.' },
      { speaker: 'core', text: 'YOU DEVOURED MY ARMY. MY FACTORY. MY CHILDREN.', style: 'distorted' },
      { speaker: 'core', text: 'NOW I WILL DEVOUR YOU.', style: 'distorted' },
      { speaker: 'levi', text: 'Nah. Only one of us gets to eat today. And I skipped breakfast.' },
    ],
  },

  core_phase2: {
    id: 'core_phase2',
    lines: [
      { speaker: 'narrator', text: 'The tree splits open. Mechanical systems activate within its trunk.' },
      { speaker: 'core', text: 'HOW... ARE YOU CONSUMING MY MINIONS?!', style: 'distorted' },
      { speaker: 'levi', text: 'They taste like metal and regret. Pretty good actually.' },
      { speaker: 'core', text: 'YOU... DISGUST ME.', style: 'distorted' },
      { speaker: 'levi', text: 'That\'s what they all say.' },
    ],
  },

  core_phase3: {
    id: 'core_phase3',
    lines: [
      { speaker: 'narrator', text: 'The Core splits wide open — exposing a pulsing, glowing heart of corrupted energy.' },
      { speaker: 'core', text: 'NO... STAY BACK... YOU CANNOT... EAT ME!', style: 'distorted' },
      { speaker: 'narrator', text: 'Mech-Eggs and Onioids pour from the Core\'s wounds. Its last desperate defense.' },
      { speaker: 'levi', text: 'More snacks? Don\'t mind if I do.' },
    ],
  },

  // ═══════════════════════════════════════════
  // CORE ENDING — Transition to CJ
  // ═══════════════════════════════════════════

  core_ending: {
    id: 'core_ending',
    lines: [
      { speaker: 'narrator', text: 'Super Levi opens his jaws impossibly wide.' },
      { speaker: 'narrator', text: 'He DEVOURS the Rotten Core whole — roots, metal, corruption and all.' },
      { speaker: 'narrator', text: 'The green glow fades from the forest. Mechanical parts crumble to dust.' },
      { speaker: 'levi', text: '*burp* ...that was a LOT.' },
      { speaker: 'narrator', text: 'But deep underground, something stirs. The roots were connected to something ELSE.' },
      { speaker: 'narrator', text: 'And inside Levi\'s stomach… a faint green pulse begins to glow.' },
      { speaker: 'levi', text: '...uh, Zachery? I don\'t feel so good.' },
      { speaker: 'zachery', text: '...Levi?', style: 'whisper' },
      { speaker: 'narrator', text: 'Then — static. A radio signal cuts through the silence.' },
      { speaker: 'cj', text: '*crackle* This is CJ. I\'m at the perimeter. I heard the explosion. What\'s your status?' },
      { speaker: 'zachery', text: 'CJ? Is that you? We need backup — Levi\'s down and something bigger is coming.', style: 'whisper' },
      { speaker: 'cj', text: 'Copy that. I\'m locked and loaded. Moving in.' },
      { speaker: 'narrator', text: 'From the forest edge, a new figure emerges. Military gear. Cold eyes. A Glock in hand.' },
      { speaker: 'narrator', text: 'CJ steps into the war zone. This isn\'t his first battle — but it might be his last.' },
    ],
  },

  // ═══════════════════════════════════════════
  // CHAPTER 8: CJ'S CAMPAIGN — BOOT CAMP
  // ═══════════════════════════════════════════

  chapter8_start: {
    id: 'chapter8_start',
    chapterName: 'Chapter 8: Boot Camp',
    lines: [
      { speaker: 'narrator', text: 'The corrupted forest has spread to the outer regions. Military camps have been overrun.' },
      { speaker: 'narrator', text: 'CJ was stationed here when the corruption hit. He survived. Most didn\'t.' },
      { speaker: 'cj', text: 'Base camp is trashed. These things are everywhere.' },
      { speaker: 'cj', text: 'Good thing I came prepared.' },
      { speaker: 'narrator', text: 'CJ checks his Glock. Full magazine. Grenades on his belt. Time to clean house.' },
    ],
  },

  chapter8_mid: {
    id: 'chapter8_mid',
    lines: [
      { speaker: 'narrator', text: 'CJ pushes through the overrun supply lines. Corrupted MechEggs have adapted to combat.' },
      { speaker: 'cj', text: 'They\'re armored now. Regular rounds barely scratch them.' },
      { speaker: 'narrator', text: 'Among the wreckage, CJ finds advanced military tech — experimental flashbang grenades.' },
      { speaker: 'cj', text: 'These should even the odds.' },
    ],
  },

  // ═══════════════════════════════════════════
  // CHAPTER 9: FORWARD OPERATING BASE
  // ═══════════════════════════════════════════

  chapter9_start: {
    id: 'chapter9_start',
    chapterName: 'Chapter 9: Forward Operating Base',
    lines: [
      { speaker: 'narrator', text: 'CJ reaches the Forward Operating Base. Or what\'s left of it.' },
      { speaker: 'narrator', text: 'The corruption has fused with military hardware — tanks, weapons, everything.' },
      { speaker: 'cj', text: 'They didn\'t just overrun the base. They ABSORBED it.' },
      { speaker: 'narrator', text: 'Radio chatter fills the air. Someone — or something — is broadcasting from the command center.' },
      { speaker: 'tank', text: 'INTRUDER DETECTED. ENGAGING DEFENSIVE PROTOCOLS.', style: 'distorted' },
      { speaker: 'cj', text: '...Did that tank just talk?' },
    ],
  },

  chapter9_mid: {
    id: 'chapter9_mid',
    lines: [
      { speaker: 'narrator', text: 'The war zone intensifies. Corrupted soldiers and machines patrol every corridor.' },
      { speaker: 'cj', text: 'Whatever turned these machines on, it\'s coming from deeper inside.' },
      { speaker: 'narrator', text: 'CJ finds air strike coordinates — the last resort weapon left by the fallen base.' },
      { speaker: 'cj', text: 'Air support\'s offline, but I can rig these targeting systems manually.' },
      { speaker: 'narrator', text: 'The ground rumbles. Something massive is moving inside the hangar.' },
    ],
  },

  // ═══════════════════════════════════════════
  // CHAPTER 10: THE ROTTEN TANK — CJ'S FINAL BOSS
  // ═══════════════════════════════════════════

  rotten_tank_intro: {
    id: 'rotten_tank_intro',
    chapterName: 'Chapter 10: The Rotten Tank',
    lines: [
      { speaker: 'narrator', text: 'The hangar doors blast open. Dust and metal fill the air.' },
      { speaker: 'narrator', text: 'A monstrosity rolls forward — part tank, part corrupted organism.' },
      { speaker: 'narrator', text: 'A Rotten Onion sits in the turret. A corrupted MechEgg forms the hull. Cannons glow with toxic energy.' },
      { speaker: 'tank', text: 'ORGANIC TARGET ACQUIRED. COMMENCING EXTERMINATION.', style: 'distorted' },
      { speaker: 'cj', text: 'A corrupted tank? Seriously?' },
      { speaker: 'cj', text: '...Alright. Let\'s see how you handle a real soldier.' },
    ],
  },

  tank_phase2: {
    id: 'tank_phase2',
    lines: [
      { speaker: 'narrator', text: 'The tank\'s armor cracks — revealing pulsing organic matter beneath the steel.' },
      { speaker: 'tank', text: 'DAMAGE SUSTAINED. ACTIVATING SECONDARY WEAPONS.', style: 'distorted' },
      { speaker: 'narrator', text: 'Missile pods emerge from the tank\'s sides. The Onion commander screeches orders.' },
      { speaker: 'cj', text: 'It\'s got missiles now? Fine. Let\'s dance.' },
    ],
  },

  tank_phase3: {
    id: 'tank_phase3',
    lines: [
      { speaker: 'narrator', text: 'The tank\'s hull splits open. The corrupted core is exposed — a fusion of egg and machine.' },
      { speaker: 'tank', text: 'CRITICAL DAMAGE. OVERRIDING SAFETY PROTOCOLS. FULL. POWER.', style: 'distorted' },
      { speaker: 'narrator', text: 'Machine gun turrets spin up. The tank becomes a whirlwind of destruction.' },
      { speaker: 'cj', text: 'This is it. Everything I\'ve got.' },
    ],
  },

  // ═══════════════════════════════════════════
  // ENDING — After Tank
  // ═══════════════════════════════════════════

  ending: {
    id: 'ending',
    lines: [
      { speaker: 'narrator', text: 'CJ empties his last magazine into the Rotten Tank\'s exposed core.' },
      { speaker: 'narrator', text: 'The tank shudders, groans, and collapses in a heap of twisted metal and corruption.' },
      { speaker: 'narrator', text: 'The Onion commander screams as green energy dissipates from the wreckage.' },
      { speaker: 'cj', text: 'Target eliminated.' },
      { speaker: 'narrator', text: 'CJ radios in. Static at first, then…' },
      { speaker: 'zachery', text: 'CJ? Did you make it?', style: 'whisper' },
      { speaker: 'cj', text: 'The base is clear. Tank\'s down. But Zachery…' },
      { speaker: 'cj', text: 'There\'s something else out here. Something the corruption was protecting.' },
      { speaker: 'narrator', text: 'CJ looks toward the horizon. Beyond the ruined base, a massive structure glows faintly.' },
      { speaker: 'narrator', text: 'Not natural. Not mechanical. Something… else entirely.' },
      { speaker: 'zachery', text: 'Don\'t go alone. We\'ll come to you.', style: 'whisper' },
      { speaker: 'levi', text: '...I\'m still hungry.' },
      { speaker: 'cj', text: 'Then we move together. All three of us.' },
      { speaker: 'narrator', text: 'Three heroes. One corrupted world. The real battle hasn\'t even begun.' },
      { speaker: 'narrator', text: 'TO BE CONTINUED...' },
    ],
  },

  // ═══════════════════════════════════════════
  // WEAPON / ABILITY DISCOVERY CUTSCENES
  // ═══════════════════════════════════════════

  weapon_vine_whip: {
    id: 'weapon_vine_whip', title: 'New Weapon Acquired', chapterName: 'Vine Whip',
    lines: [
      { speaker: 'narrator', text: 'Among the mechanical roots, a living vine still pulses with ancient life.' },
      { speaker: 'narrator', text: 'It reaches out to Zachery — not as a threat, but as an offering.' },
      { speaker: 'zachery', text: 'It\'s still alive… fighting the corruption from within.' },
      { speaker: 'narrator', text: 'Vine Whip: Extended reach, lashes enemies from a distance. Press 1-2 to switch weapons.' },
    ],
  },

  weapon_static_bolt: {
    id: 'weapon_static_bolt', title: 'New Weapon Acquired', chapterName: 'Static Bolt',
    lines: [
      { speaker: 'narrator', text: 'Deep in the fog, a fractured conduit sparks with unstable energy.' },
      { speaker: 'zachery', text: 'If I can channel this…' },
      { speaker: 'narrator', text: 'Static Bolt: Fires ranged energy projectiles. Effective at distance.' },
    ],
  },

  weapon_iron_fist: {
    id: 'weapon_iron_fist', title: 'New Weapon Acquired', chapterName: 'Iron Fist',
    lines: [
      { speaker: 'narrator', text: 'A fallen war machine lies crumpled in the metal tunnels. Its arm still intact.' },
      { speaker: 'zachery', text: 'Heavy… but it hits like nothing else.' },
      { speaker: 'narrator', text: 'Iron Fist: Devastating damage, slower attack speed. Crushes armored foes.' },
    ],
  },

  weapon_corruption_purge: {
    id: 'weapon_corruption_purge', title: 'New Ability Acquired', chapterName: 'Corruption Purge',
    lines: [
      { speaker: 'narrator', text: 'At the threshold of the Rotting Heart, the corruption is overwhelming.' },
      { speaker: 'zachery', text: 'Then I\'ll use it to undo what I\'ve done.' },
      { speaker: 'narrator', text: 'Corruption Purge: Area-of-effect blast that damages all nearby enemies.' },
    ],
  },

  // ═══ LEVI ABILITY CUTSCENES ═══

  ability_mega_chomp: {
    id: 'ability_mega_chomp', title: 'New Ability!', chapterName: 'Mega Chomp',
    lines: [
      { speaker: 'narrator', text: 'Levi tears into a particularly large MechEgg. Something inside it... resonates.' },
      { speaker: 'narrator', text: 'His jaw aches, then EXPANDS. His bite force triples.' },
      { speaker: 'levi', text: 'Whoa. I can eat even MORE now.' },
      { speaker: 'narrator', text: 'Mega Chomp: Greatly increased devour range and damage. Stores more enemies.' },
    ],
  },

  ability_toxic_spit: {
    id: 'ability_toxic_spit', title: 'New Ability!', chapterName: 'Toxic Spit',
    lines: [
      { speaker: 'narrator', text: 'The acid from devoured enemies pools in Levi\'s stomach.' },
      { speaker: 'narrator', text: 'Instead of harming him, it mutates. His body adapts.' },
      { speaker: 'levi', text: 'Oh that\'s nasty. But also... useful.' },
      { speaker: 'narrator', text: 'Toxic Spit: Press Down + J to fire acid projectiles. Ranged attack!' },
    ],
  },

  ability_belly_slam: {
    id: 'ability_belly_slam', title: 'New Ability!', chapterName: 'Belly Slam',
    lines: [
      { speaker: 'narrator', text: 'Levi\'s body feels heavier. Denser. The ground cracks where he lands.' },
      { speaker: 'narrator', text: 'All those devoured enemies have given him mass. Terrible, devastating mass.' },
      { speaker: 'levi', text: 'I\'m not fat. I\'m POWERFUL.' },
      { speaker: 'narrator', text: 'Belly Slam: Jump shockwave now has MASSIVE range and damage!' },
    ],
  },

  ability_frenzy: {
    id: 'ability_frenzy', title: 'New Ability!', chapterName: 'Feeding Frenzy',
    lines: [
      { speaker: 'narrator', text: 'Something snaps inside Levi. His hunger becomes RAGE.' },
      { speaker: 'narrator', text: 'His eyes glow orange. His attacks become a blur of teeth and fury.' },
      { speaker: 'levi', text: 'I\'M. STILL. HUNGRY.' },
      { speaker: 'narrator', text: 'Feeding Frenzy: Attack speed doubled! Devour always heals 3 HP!' },
    ],
  },

  // ═══ CJ ABILITY CUTSCENES ═══

  ability_frag_grenade: {
    id: 'ability_frag_grenade', title: 'New Equipment!', chapterName: 'Frag Grenade',
    lines: [
      { speaker: 'narrator', text: 'Among the ruins of the army camp, CJ finds a crate of military-grade explosives.' },
      { speaker: 'cj', text: 'M67 fragmentation grenades. Standard issue. My favorite.' },
      { speaker: 'narrator', text: 'Frag Grenade: Press Down + J to throw. Explodes on contact for massive AOE damage!' },
    ],
  },

  ability_flashbang: {
    id: 'ability_flashbang', title: 'New Equipment!', chapterName: 'Flashbang',
    lines: [
      { speaker: 'narrator', text: 'An experimental weapons crate sits among the supply wreckage. Still intact.' },
      { speaker: 'cj', text: 'Flashbangs. These should disorient anything — even corrupted machines.' },
      { speaker: 'narrator', text: 'Flashbang: Press Up + J to deploy. Stuns ALL enemies on screen for 3 seconds!' },
    ],
  },

  ability_combat_roll: {
    id: 'ability_combat_roll', title: 'New Technique!', chapterName: 'Combat Roll',
    lines: [
      { speaker: 'narrator', text: 'CJ finds tactical training manuals in the base command center.' },
      { speaker: 'cj', text: 'Evasive maneuvers. Roll, dodge, reposition. Basic but effective.' },
      { speaker: 'narrator', text: 'Combat Roll: Double-tap Left/Right to dodge roll with invincibility frames!' },
    ],
  },

  ability_airstrike: {
    id: 'ability_airstrike', title: 'New Equipment!', chapterName: 'Air Strike',
    lines: [
      { speaker: 'narrator', text: 'CJ finds a targeting laser among the fallen soldiers\' gear.' },
      { speaker: 'cj', text: 'The birds are still flying. If I can paint a target…' },
      { speaker: 'narrator', text: 'Air Strike: Press S + Up + J to call in artillery! Rains destruction from above!' },
    ],
  },
};

// Map of which cutscene plays before each level
export const LEVEL_CUTSCENE_BEFORE: Record<number, string[]> = {
  1: ['intro', 'chapter1_start'],
  2: ['chapter1_mid'],
  3: ['chapter1_end', 'chapter2_start'],
  4: ['chapter2_mid'],
  5: ['chapter2_end', 'chapter3_start'],
  6: ['chapter3_mid'],
  7: ['chapter3_end', 'chapter4_start'],
  8: ['chapter4_boss'],
  9: ['chapter5_start'],
  10: ['chapter5_mid'],
  11: ['chapter6_start'],
  12: ['chapter6_mid'],
  13: ['rotten_core_intro'],
  14: ['chapter8_start'],
  15: ['chapter8_mid'],
  16: ['chapter9_start'],
  17: ['chapter9_mid'],
  18: ['rotten_tank_intro'],
};

// Map of which weapon cutscene plays when a weapon is picked up
export const WEAPON_CUTSCENES: Record<string, string> = {
  vine_whip: 'weapon_vine_whip',
  static_bolt: 'weapon_static_bolt',
  iron_fist: 'weapon_iron_fist',
  corruption_purge: 'weapon_corruption_purge',
};

// Levi ability cutscenes
export const LEVI_ABILITY_CUTSCENES: Record<string, string> = {
  mega_chomp: 'ability_mega_chomp',
  toxic_spit: 'ability_toxic_spit',
  belly_slam: 'ability_belly_slam',
  frenzy: 'ability_frenzy',
};

// CJ ability cutscenes
export const CJ_ABILITY_CUTSCENES: Record<string, string> = {
  frag_grenade: 'ability_frag_grenade',
  flashbang: 'ability_flashbang',
  combat_roll: 'ability_combat_roll',
  airstrike: 'ability_airstrike',
};

export const VICTORY_CUTSCENE = 'ending';
