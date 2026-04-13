import { Level, Enemy, Boss } from './types';

const makeEnemy = (x: number, y: number, type: 'onion' | 'egg'): Enemy => ({
  x, y, width: 60, height: 70,
  velocityX: 0, velocityY: 0,
  type, health: type === 'onion' ? 3 : 2,
  maxHealth: type === 'onion' ? 3 : 2,
  isAlive: true, attackCooldown: 0, direction: -1,
});

const makeBoss = (x: number, y: number): Boss => ({
  x, y, width: 150, height: 150,
  velocityX: 0, velocityY: 0,
  health: 30, maxHealth: 30,
  isAlive: true, phase: 1,
  attackCooldown: 120, attackType: 'idle', direction: -1,
});

export const createLevel = (levelNum: number): Level => {
  const groundY = 500;
  
  if (levelNum === 1) {
    // Chapter 1: The Withered Entrance - continuous ground
    return {
      width: 3000,
      groundY,
      isBossLevel: false,
      platforms: [
        { x: 0, y: groundY, width: 3000, height: 100 },
        { x: 300, y: 380, width: 150, height: 20 },
        { x: 600, y: 320, width: 150, height: 20 },
        { x: 900, y: 360, width: 200, height: 20 },
        { x: 1200, y: 300, width: 120, height: 20 },
        { x: 1500, y: 380, width: 180, height: 20 },
        { x: 1800, y: 340, width: 150, height: 20 },
        { x: 2100, y: 300, width: 200, height: 20 },
        { x: 2500, y: 360, width: 150, height: 20 },
      ],
      enemies: [
        makeEnemy(500, groundY - 70, 'egg'),
        makeEnemy(850, groundY - 70, 'onion'),
        makeEnemy(1100, groundY - 70, 'egg'),
        makeEnemy(1400, groundY - 70, 'onion'),
        makeEnemy(1700, groundY - 70, 'egg'),
        makeEnemy(2000, groundY - 70, 'onion'),
        makeEnemy(2400, groundY - 70, 'egg'),
      ],
      boss: null,
    };
  }
  
  if (levelNum === 2) {
    // Chapter 2: The Fog of Static - continuous ground
    return {
      width: 3500,
      groundY,
      isBossLevel: false,
      platforms: [
        { x: 0, y: groundY, width: 3500, height: 100 },
        { x: 400, y: 380, width: 120, height: 20 },
        { x: 700, y: 300, width: 150, height: 20 },
        { x: 1050, y: 350, width: 130, height: 20 },
        { x: 1300, y: 280, width: 160, height: 20 },
        { x: 1800, y: 370, width: 140, height: 20 },
        { x: 2100, y: 310, width: 170, height: 20 },
        { x: 2700, y: 350, width: 150, height: 20 },
        { x: 3000, y: 290, width: 130, height: 20 },
      ],
      enemies: [
        makeEnemy(600, groundY - 70, 'onion'),
        makeEnemy(950, groundY - 70, 'egg'),
        makeEnemy(1200, groundY - 70, 'onion'),
        makeEnemy(1500, groundY - 70, 'egg'),
        makeEnemy(1800, groundY - 70, 'onion'),
        makeEnemy(2100, groundY - 70, 'egg'),
        makeEnemy(2400, groundY - 70, 'onion'),
        makeEnemy(2700, groundY - 70, 'egg'),
        makeEnemy(3000, groundY - 70, 'onion'),
      ],
      boss: null,
    };
  }

  if (levelNum === 3) {
    // Chapter 3: The Iron Roots - continuous ground, underground feel
    return {
      width: 4000,
      groundY,
      isBossLevel: false,
      platforms: [
        { x: 0, y: groundY, width: 4000, height: 100 },
        { x: 350, y: 370, width: 140, height: 20 },
        { x: 650, y: 310, width: 160, height: 20 },
        { x: 1000, y: 360, width: 130, height: 20 },
        { x: 1350, y: 280, width: 170, height: 20 },
        { x: 1700, y: 350, width: 140, height: 20 },
        { x: 2050, y: 300, width: 150, height: 20 },
        { x: 2400, y: 370, width: 120, height: 20 },
        { x: 2750, y: 320, width: 160, height: 20 },
        { x: 3100, y: 360, width: 140, height: 20 },
        { x: 3500, y: 300, width: 150, height: 20 },
      ],
      enemies: [
        makeEnemy(400, groundY - 70, 'egg'),
        makeEnemy(700, groundY - 70, 'onion'),
        makeEnemy(1050, groundY - 70, 'egg'),
        makeEnemy(1400, groundY - 70, 'onion'),
        makeEnemy(1750, groundY - 70, 'egg'),
        makeEnemy(2100, groundY - 70, 'onion'),
        makeEnemy(2450, groundY - 70, 'egg'),
        makeEnemy(2800, groundY - 70, 'onion'),
        makeEnemy(3150, groundY - 70, 'egg'),
        makeEnemy(3500, groundY - 70, 'onion'),
      ],
      boss: null,
    };
  }

  // Level 4 - Chapter 4: The Rotting Heart - Boss level
  return {
    width: 1200,
    groundY,
    isBossLevel: true,
    platforms: [
      { x: 0, y: groundY, width: 1200, height: 100 },
      { x: 200, y: 380, width: 120, height: 20 },
      { x: 500, y: 320, width: 150, height: 20 },
      { x: 850, y: 380, width: 120, height: 20 },
    ],
    enemies: [],
    boss: makeBoss(900, groundY - 150),
  };
};
