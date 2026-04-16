export type GameState = 'title' | 'playing' | 'gameover' | 'victory' | 'cutscene';

export type WeaponType = 'forest_blade' | 'vine_whip' | 'static_bolt' | 'iron_fist' | 'corruption_purge';

export type LeviAbility = 'mega_chomp' | 'toxic_spit' | 'belly_slam' | 'frenzy';

export type CJAbility = 'frag_grenade' | 'flashbang' | 'airstrike' | 'combat_roll';

export interface LeviAbilityDef {
  id: LeviAbility;
  name: string;
  description: string;
  color: string;
  glowColor: string;
}

export interface CJAbilityDef {
  id: CJAbility;
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

export const CJ_ABILITIES: Record<CJAbility, CJAbilityDef> = {
  frag_grenade: {
    id: 'frag_grenade', name: 'Frag Grenade', description: 'Throw an explosive grenade that deals AOE damage.',
    color: '#44aa44', glowColor: '#228822',
  },
  flashbang: {
    id: 'flashbang', name: 'Flashbang', description: 'Stun all enemies on screen for 3 seconds.',
    color: '#ffffaa', glowColor: '#dddd88',
  },
  airstrike: {
    id: 'airstrike', name: 'Air Strike', description: 'Call in an artillery barrage on the battlefield.',
    color: '#ff4444', glowColor: '#cc2222',
  },
  combat_roll: {
    id: 'combat_roll', name: 'Combat Roll', description: 'Dodge roll with invincibility frames. Double-tap direction.',
    color: '#4488ff', glowColor: '#2266cc',
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

export interface CJAbilityPickup {
  x: number;
  y: number;
  width: number;
  height: number;
  ability: CJAbility;
  collected: boolean;
}

export interface WeaponDef {
  id: WeaponType;
  name: string;
  description: string;
  damage: number;
  range: number;
  speed: number;
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
  isCJ: boolean;
  devouredEnemies: number;
  leviAbilities: LeviAbility[];
  cjAbilities: CJAbility[];
  grenadeCount: number;
  grenadeCooldown: number;
  ammo: number;
  maxAmmo: number;
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
  attackType: 'charge' | 'shoot' | 'stomp' | 'idle' | 'root_attack' | 'toxic_gas' | 'laser' | 'spawn' | 'cannon' | 'missiles' | 'machinegun';
  direction: number;
  bossType?: 'colossus' | 'rotten_core' | 'rotten_tank';
}

export interface Projectile extends Entity {
  isPlayerProjectile: boolean;
  damage: number;
  lifetime: number;
  isGrenade?: boolean;
  grenadeTimer?: number;
  aoeRadius?: number;
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

export interface AmmoPickup {
  x: number;
  y: number;
  width: number;
  height: number;
  ammoAmount: number;
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
  cjAbilityPickups: CJAbilityPickup[];
  ammoPickups: AmmoPickup[];
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
