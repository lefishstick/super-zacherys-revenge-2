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
    chapterName: 'The Rotting Heart — Final Battle',
    lines: [
      { speaker: 'narrator', text: 'The ground shakes. Something rises from the corrupted earth.' },
      { speaker: 'narrator', text: 'The Rotten Colossus emerges — massive, decayed, mechanical-organic.' },
      { speaker: 'colossus', text: '...Zachery…', style: 'distorted' },
      { speaker: 'zachery', text: 'You… know me?' },
      { speaker: 'colossus', text: 'YOU… LEFT… US.', style: 'distorted' },
    ],
  },

  boss_phase1: {
    id: 'boss_phase1',
    lines: [
      { speaker: 'colossus', text: 'FEEL… WHAT YOU CREATED.', style: 'distorted' },
    ],
  },

  boss_phase2: {
    id: 'boss_phase2',
    lines: [
      { speaker: 'colossus', text: 'WE WERE… ALIVE.', style: 'distorted' },
      { speaker: 'zachery', text: 'I didn\'t know—!' },
      { speaker: 'colossus', text: 'YOU DIDN\'T CARE.', style: 'distorted' },
    ],
  },

  boss_phase3: {
    id: 'boss_phase3',
    lines: [
      { speaker: 'colossus', text: 'END… THIS…', style: 'distorted' },
      { speaker: 'zachery', text: '...I will.', style: 'whisper' },
    ],
  },

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
  // CHAPTER 5: THE ROTTEN CORE — LEVI'S CHAPTER
  // ═══════════════════════════════════════════

  chapter5_start: {
    id: 'chapter5_start',
    chapterName: 'Chapter 5: The Rotten Core',
    lines: [
      { speaker: 'narrator', text: 'Super Levi descends into the deepest chamber of the corrupted forest.' },
      { speaker: 'narrator', text: 'The air is thick with toxic energy. Roots of metal and flesh intertwine everywhere.' },
      { speaker: 'levi', text: 'Smells terrible down here. Kinda making me hungry though.' },
      { speaker: 'narrator', text: 'And then… silence. An unnatural, absolute silence.' },
      { speaker: 'levi', text: 'Alright big tree... let\'s do this.' },
    ],
  },

  rotten_core_intro: {
    id: 'rotten_core_intro',
    chapterName: 'The Heart Tree Awakens',
    lines: [
      { speaker: 'narrator', text: 'The ground begins to tremble. Roots burst through the earth around Levi.' },
      { speaker: 'narrator', text: 'What he thought was terrain… begins to MOVE.' },
      { speaker: 'narrator', text: 'Eyes ignite with sickly green light. Mechanical parts grind to life.' },
      { speaker: 'narrator', text: 'The Heart Tree — once the source of all life in this forest — has become something else.' },
      { speaker: 'core', text: 'ANOTHER ONE? YOU ARE NOT... THE ONE WHO CAME BEFORE.', style: 'distorted' },
      { speaker: 'levi', text: 'Nah. I\'m worse. I\'m HUNGRY.' },
      { speaker: 'core', text: 'FOOLISH... MORSEL.', style: 'distorted' },
      { speaker: 'levi', text: 'We\'ll see who\'s the morsel here.' },
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

  ending: {
    id: 'ending',
    lines: [
      { speaker: 'narrator', text: 'Super Levi opens his jaws impossibly wide.' },
      { speaker: 'narrator', text: 'He DEVOURS the Rotten Core whole — roots, metal, corruption and all.' },
      { speaker: 'narrator', text: 'The green glow fades from the forest. Mechanical parts crumble to dust.' },
      { speaker: 'narrator', text: 'The forest falls silent. Not the unnatural silence of corruption — but the peaceful quiet of healing.' },
      { speaker: 'levi', text: '*burp* ...that was a lot.' },
      { speaker: 'narrator', text: 'Levi carries Zachery out of the cavern. New growth pushes through the rust.' },
      { speaker: 'zachery', text: 'You actually ate it. The whole thing.', style: 'whisper' },
      { speaker: 'levi', text: 'I told you. Never underestimate my appetite.' },
      { speaker: 'narrator', text: 'The forest breathes again. Two heroes, one legacy.' },
      { speaker: 'narrator', text: 'But deep underground… something stirs in Levi\'s stomach…' },
      { speaker: 'levi', text: '...was that a bad idea?' },
      { speaker: 'narrator', text: '...to be continued?' },
    ],
  },

  // ═══════════════════════════════════════════
  // WEAPON DISCOVERY CUTSCENES
  // ═══════════════════════════════════════════

  weapon_vine_whip: {
    id: 'weapon_vine_whip',
    title: 'New Weapon Acquired',
    chapterName: 'Vine Whip',
    lines: [
      { speaker: 'narrator', text: 'Among the mechanical roots, a living vine still pulses with ancient life.' },
      { speaker: 'narrator', text: 'It reaches out to Zachery — not as a threat, but as an offering.' },
      { speaker: 'zachery', text: 'It\'s still alive… fighting the corruption from within.' },
      { speaker: 'narrator', text: 'The vine coils around his arm, thorns extending outward. A symbiotic bond.' },
      { speaker: 'zachery', text: 'Together, then.' },
      { speaker: 'narrator', text: 'Vine Whip: Extended reach, lashes enemies from a distance. Press 1-2 to switch weapons.' },
    ],
  },

  weapon_static_bolt: {
    id: 'weapon_static_bolt',
    title: 'New Weapon Acquired',
    chapterName: 'Static Bolt',
    lines: [
      { speaker: 'narrator', text: 'Deep in the fog, a fractured conduit sparks with unstable energy.' },
      { speaker: 'narrator', text: 'The static that distorts reality here is raw, chaotic power.' },
      { speaker: 'zachery', text: 'If I can channel this…' },
      { speaker: 'narrator', text: 'Zachery plunges his hand into the conduit. Pain — then control.' },
      { speaker: 'voice', text: 'THAT POWER… IS NOT YOURS.', style: 'distorted' },
      { speaker: 'zachery', text: 'It is now.' },
      { speaker: 'narrator', text: 'Static Bolt: Fires ranged energy projectiles. Effective at distance.' },
    ],
  },

  weapon_iron_fist: {
    id: 'weapon_iron_fist',
    title: 'New Weapon Acquired',
    chapterName: 'Iron Fist',
    lines: [
      { speaker: 'narrator', text: 'A fallen war machine lies crumpled in the metal tunnels. Its arm still intact.' },
      { speaker: 'narrator', text: 'The gauntlet hums with residual power — built for destruction.' },
      { speaker: 'zachery', text: 'Heavy… but it hits like nothing else.' },
      { speaker: 'narrator', text: 'He rips the gauntlet free. The machine\'s last gift to the living.' },
      { speaker: 'narrator', text: 'Iron Fist: Devastating damage, slower attack speed. Crushes armored foes.' },
    ],
  },

  weapon_corruption_purge: {
    id: 'weapon_corruption_purge',
    title: 'New Ability Acquired',
    chapterName: 'Corruption Purge',
    lines: [
      { speaker: 'narrator', text: 'At the threshold of the Rotting Heart, the corruption is overwhelming.' },
      { speaker: 'narrator', text: 'But deep within Zachery, something resonates — a memory of what was lost.' },
      { speaker: 'zachery', text: 'I remember now. I was part of this. I helped create it.', style: 'whisper' },
      { speaker: 'narrator', text: 'Guilt becomes power. Regret becomes a weapon.' },
      { speaker: 'zachery', text: 'Then I\'ll use it to undo what I\'ve done.' },
      { speaker: 'narrator', text: 'A wave of pure energy erupts from within him — the Corruption Purge.' },
      { speaker: 'narrator', text: 'Corruption Purge: Area-of-effect blast that damages all nearby enemies.' },
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
  9: ['chapter5_start', 'rotten_core_intro'],
};

// Map of which weapon cutscene plays when a weapon is picked up
export const WEAPON_CUTSCENES: Record<string, string> = {
  vine_whip: 'weapon_vine_whip',
  static_bolt: 'weapon_static_bolt',
  iron_fist: 'weapon_iron_fist',
  corruption_purge: 'weapon_corruption_purge',
};

export const VICTORY_CUTSCENE = 'ending';
