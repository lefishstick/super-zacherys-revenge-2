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

  ending: {
    id: 'ending',
    lines: [
      { speaker: 'narrator', text: 'Zachery\'s ancient arrow — a relic from his first journey — answers his call one final time.' },
      { speaker: 'narrator', text: 'It pierces through the Rotten Colossus like a bolt of pure light.' },
      { speaker: 'narrator', text: 'The Colossus detonates in a cataclysmic explosion, corruption shattering into dust.' },
      { speaker: 'narrator', text: 'The chamber falls silent. The metal roots crumble away.' },
      { speaker: 'narrator', text: 'Zachery kneels among the ruins of what was once alive.' },
      { speaker: 'zachery', text: '...I won\'t make that mistake again.', style: 'whisper' },
      { speaker: 'narrator', text: 'The forest stirs. New growth pushes through the rust. Perhaps… redemption is possible.' },
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
};

// Map of which weapon cutscene plays when a weapon is picked up
export const WEAPON_CUTSCENES: Record<string, string> = {
  vine_whip: 'weapon_vine_whip',
  static_bolt: 'weapon_static_bolt',
  iron_fist: 'weapon_iron_fist',
  corruption_purge: 'weapon_corruption_purge',
};

export const VICTORY_CUTSCENE = 'ending';
