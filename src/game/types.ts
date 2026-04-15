export type GameState = 'title' | 'playing' | 'gameover' | 'victory' | 'cutscene';

export type WeaponType = 'forest_blade' | 'vine_whip' | 'static_bolt' | 'iron_fist' | 'corruption_purge';

export type LeviAbility = 'mega_chomp' | 'toxic_spit' | 'belly_slam' | 'frenzy';

export interface LeviAbilityDef {
  id: LeviAbility;
  name: string;
  description: string;
  color: string;
  glowColor: string;
}

export const LEVI_ABILITIES: Record<LeviAbility, LeviAbilityDef> = {
  mega_chomp: {
    id: 'mega_chomp', name: 'Mega Chomp', description: 'Massively increased devour range and damage.',
    color: '#ff4400', glowColor: '#cc2200',
  },
  toxic_spit: {
    id: 'toxic_spit', name: 'Toxic Spit', description: 'Spit toxic acid at enemies from a distance.',
    color: '#88ff00', glowColor: '#66cc00',
  },
  belly_slam: {
    id: 'belly_slam', name: 'Belly Slam', description: 'Ground-pound that creates a massive shockwave.',
    color: '#ff8800', glowColor: '#cc6600',
  },
  frenzy: {
    id: 'frenzy', name: 'Feeding Frenzy', description: 'Devour heals fully and attack speed doubles.',
    color: '#ff0066', glowColor: '#cc0044',
  },
};

export interface LeviAbilityPickup {
  x: number;
  y: number;
  width: number;
  height: number;
  ability: LeviAbility;
  collected: boolean;
}

export interface WeaponDef {
  id: WeaponType;
  name: string;
  description: string;
  damage: number;
  range: number;
  speed: number; // attack cooldown in frames
  isRanged: boolean;
  projectileSpeed?: number;
  aoeRadius?: number;
  color: string;
  glowColor: string;
}

export const WEAPONS: Record<WeaponType, WeaponDef> = {
  forest_blade: {
    id: 'forest_blade', name: 'Forest Blade', description: 'A simple blade forged from ancient wood.',
    damage: 1, range: 70, speed: 20, isRanged: false, color: '#aaff44', glowColor: '#88cc22',
  },
  vine_whip: {
    id: 'vine_whip', name: 'Vine Whip', description: 'A living whip that lashes out with thorned reach.',
    damage: 1, range: 120, speed: 25, isRanged: false, color: '#44dd66', glowColor: '#22aa44',
  },
  static_bolt: {
    id: 'static_bolt', name: 'Static Bolt', description: 'Fires crackling bolts of corrupted energy.',
    damage: 2, range: 50, speed: 30, isRanged: true, projectileSpeed: 10, color: '#aaccff', glowColor: '#6699ff',
  },
  iron_fist: {
    id: 'iron_fist', name: 'Iron Fist', description: 'A heavy gauntlet torn from a fallen machine. Slow but devastating.',
    damage: 4, range: 60, speed: 40, isRanged: false, color: '#ffaa44', glowColor: '#ff6622',
  },
  corruption_purge: {
    id: 'corruption_purge', name: 'Corruption Purge', description: 'Unleashes a wave of cleansing energy in all directions.',
    damage: 3, range: 90, speed: 35, isRanged: false, aoeRadius: 130, color: '#ff44ff', glowColor: '#cc22cc',
  },
};

export interface WeaponPickup {
  x: number;
  y: number;
  width: number;
  height: number;
  weapon: WeaponType;
  collected: boolean;
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
}

export interface Player extends Entity {
  health: number;
  maxHealth: number;
  isAttacking: boolean;
  attackTimer: number;
  facingRight: boolean;
  isJumping: boolean;
  onGround: boolean;
  invincibleTimer: number;
  score: number;
  currentWeapon: WeaponType;
  weapons: WeaponType[];
  isLevi: boolean;
  devouredEnemies: number;
  leviAbilities: LeviAbility[];
}

export interface Enemy extends Entity {
  type: 'onion' | 'egg';
  health: number;
  maxHealth: number;
  isAlive: boolean;
  attackCooldown: number;
  direction: number;
}

export interface Boss extends Entity {
  health: number;
  maxHealth: number;
  isAlive: boolean;
  phase: number;
  attackCooldown: number;
  attackType: 'charge' | 'shoot' | 'stomp' | 'idle' | 'root_attack' | 'toxic_gas' | 'laser' | 'spawn';
  direction: number;
  bossType?: 'colossus' | 'rotten_core';
}

export interface Projectile extends Entity {
  isPlayerProjectile: boolean;
  damage: number;
  lifetime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HealthPickup {
  x: number;
  y: number;
  width: number;
  height: number;
  healAmount: number;
  collected: boolean;
}

export interface Level {
  platforms: Platform[];
  enemies: Enemy[];
  boss: Boss | null;
  width: number;
  groundY: number;
  isBossLevel: boolean;
  weaponPickups: WeaponPickup[];
  healthPickups: HealthPickup[];
  leviAbilityPickups: LeviAbilityPickup[];
  chapter: number;
}

export interface CutsceneLine {
  speaker: string;
  text: string;
  style?: 'normal' | 'distorted' | 'whisper';
}

export interface Cutscene {
  id: string;
  lines: CutsceneLine[];
  title?: string;
  chapterName?: string;
}
