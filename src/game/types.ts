export type GameState = 'title' | 'playing' | 'gameover' | 'victory';

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
  attackType: 'charge' | 'shoot' | 'stomp' | 'idle';
  direction: number;
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

export interface Level {
  platforms: Platform[];
  enemies: Enemy[];
  boss: Boss | null;
  width: number;
  groundY: number;
  isBossLevel: boolean;
}
