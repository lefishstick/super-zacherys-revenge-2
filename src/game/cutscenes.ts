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

  chapter3_start: {
    id: 'chapter3_start',
    chapterName: 'Chapter 3: The Iron Roots',
    lines: [
      { speaker: 'narrator', text: 'The forest gives way to underground tunnels of metal roots. The machine has taken over completely.' },
      { speaker: 'narrator', text: 'Armored MechEggs and Heavy Onioid brutes guard every passage.' },
      { speaker: 'zachery', text: 'It goes deeper than I thought. This isn\'t just corruption — it\'s alive.' },
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
      { speaker: 'narrator', text: 'The Rotten Colossus collapses. The chamber falls silent.' },
      { speaker: 'narrator', text: 'Slowly, the corruption begins to recede. The metal roots crumble to dust.' },
      { speaker: 'narrator', text: 'Zachery kneels among the ruins of what was once alive.' },
      { speaker: 'zachery', text: '...I won\'t make that mistake again.', style: 'whisper' },
      { speaker: 'narrator', text: 'The forest stirs. New growth pushes through the rust. Perhaps… redemption is possible.' },
    ],
  },
};

// Map of which cutscene plays before/after each level
export const LEVEL_CUTSCENE_BEFORE: Record<number, string[]> = {
  1: ['intro', 'chapter1_start'],
  2: ['chapter1_end', 'chapter2_start'],
  3: ['chapter2_mid', 'chapter3_start'],
  4: ['chapter3_end', 'chapter4_start'],
};

export const VICTORY_CUTSCENE = 'ending';
