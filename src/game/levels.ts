import { Level, Enemy, Boss, WeaponPickup, HealthPickup } from './types';

const makeEnemy = (x: number, y: number, type: 'onion' | 'egg', healthMult = 1): Enemy => ({
  x, y, width: 60, height: 70,
  velocityX: 0, velocityY: 0,
  type, health: Math.ceil((type === 'onion' ? 3 : 2) * healthMult),
  maxHealth: Math.ceil((type === 'onion' ? 3 : 2) * healthMult),
  isAlive: true, attackCooldown: 0, direction: -1,
});

const makeBoss = (x: number, y: number): Boss => ({
  x, y, width: 150, height: 150,
  velocityX: 0, velocityY: 0,
  health: 30, maxHealth: 30,
  isAlive: true, phase: 1,
  attackCooldown: 120, attackType: 'idle', direction: -1,
});

const makeWeaponPickup = (x: number, y: number, weapon: WeaponPickup['weapon']): WeaponPickup => ({
  x, y, width: 30, height: 30, weapon, collected: false,
});

const makeHealthPickup = (x: number, y: number, healAmount = 3): HealthPickup => ({
  x, y, width: 24, height: 24, healAmount, collected: false,
});

export const TOTAL_LEVELS = 8;

export const createLevel = (levelNum: number): Level => {
  const groundY = 500;

  switch (levelNum) {
    case 1: {
      return {
        width: 2800, groundY, isBossLevel: false, chapter: 1,
        platforms: [
          { x: 0, y: groundY, width: 2800, height: 100 },
          { x: 350, y: 400, width: 140, height: 20 },
          { x: 600, y: 350, width: 120, height: 20 },
          { x: 900, y: 380, width: 160, height: 20 },
          { x: 1200, y: 330, width: 130, height: 20 },
          { x: 1500, y: 370, width: 150, height: 20 },
          { x: 1800, y: 310, width: 140, height: 20 },
          { x: 2100, y: 360, width: 170, height: 20 },
          { x: 2450, y: 340, width: 120, height: 20 },
        ],
        enemies: [
          makeEnemy(500, groundY - 70, 'egg'),
          makeEnemy(900, groundY - 70, 'egg'),
          makeEnemy(1300, groundY - 70, 'onion'),
          makeEnemy(1700, groundY - 70, 'egg'),
          makeEnemy(2200, groundY - 70, 'onion'),
        ],
        boss: null,
        weaponPickups: [],
        healthPickups: [
          makeHealthPickup(1000, groundY - 30),
          makeHealthPickup(2000, groundY - 30),
        ],
      };
    }

    case 2: {
      return {
        width: 3200, groundY, isBossLevel: false, chapter: 1,
        platforms: [
          { x: 0, y: groundY, width: 3200, height: 100 },
          { x: 280, y: 390, width: 180, height: 20 },
          { x: 550, y: 330, width: 100, height: 20 },
          { x: 750, y: 380, width: 200, height: 20 },
          { x: 1050, y: 300, width: 120, height: 20 },
          { x: 1300, y: 360, width: 160, height: 20 },
          { x: 1600, y: 310, width: 140, height: 20 },
          { x: 1900, y: 370, width: 180, height: 20 },
          { x: 2200, y: 290, width: 130, height: 20 },
          { x: 2500, y: 350, width: 150, height: 20 },
          { x: 2850, y: 320, width: 140, height: 20 },
        ],
        enemies: [
          makeEnemy(400, groundY - 70, 'egg'),
          makeEnemy(700, groundY - 70, 'onion'),
          makeEnemy(1000, groundY - 70, 'egg'),
          makeEnemy(1350, groundY - 70, 'onion'),
          makeEnemy(1650, groundY - 70, 'egg'),
          makeEnemy(2000, groundY - 70, 'onion'),
          makeEnemy(2400, groundY - 70, 'egg'),
          makeEnemy(2800, groundY - 70, 'onion'),
        ],
        boss: null,
        weaponPickups: [makeWeaponPickup(1600, groundY - 40, 'vine_whip')],
        healthPickups: [
          makeHealthPickup(800, groundY - 30),
          makeHealthPickup(1800, groundY - 30),
          makeHealthPickup(2600, groundY - 30),
        ],
      };
    }

    case 3: {
      return {
        width: 3000, groundY, isBossLevel: false, chapter: 2,
        platforms: [
          { x: 0, y: groundY, width: 3000, height: 100 },
          { x: 350, y: 400, width: 100, height: 20 },
          { x: 500, y: 350, width: 90, height: 20 },
          { x: 650, y: 300, width: 110, height: 20 },
          { x: 900, y: 380, width: 130, height: 20 },
          { x: 1200, y: 320, width: 100, height: 20 },
          { x: 1450, y: 370, width: 120, height: 20 },
          { x: 1700, y: 280, width: 140, height: 20 },
          { x: 1950, y: 350, width: 110, height: 20 },
          { x: 2250, y: 310, width: 130, height: 20 },
          { x: 2550, y: 370, width: 100, height: 20 },
          { x: 2780, y: 300, width: 120, height: 20 },
        ],
        enemies: [
          makeEnemy(450, groundY - 70, 'onion'),
          makeEnemy(700, groundY - 70, 'egg'),
          makeEnemy(1000, groundY - 70, 'onion'),
          makeEnemy(1300, groundY - 70, 'egg'),
          makeEnemy(1550, groundY - 70, 'onion'),
          makeEnemy(1800, groundY - 70, 'egg'),
          makeEnemy(2100, groundY - 70, 'onion'),
          makeEnemy(2400, groundY - 70, 'egg'),
          makeEnemy(2700, groundY - 70, 'onion'),
        ],
        boss: null,
        weaponPickups: [],
        healthPickups: [
          makeHealthPickup(600, groundY - 30),
          makeHealthPickup(1400, groundY - 30),
          makeHealthPickup(2300, groundY - 30),
        ],
      };
    }

    case 4: {
      return {
        width: 3500, groundY, isBossLevel: false, chapter: 2,
        platforms: [
          { x: 0, y: groundY, width: 3500, height: 100 },
          { x: 300, y: 420, width: 120, height: 20 },
          { x: 450, y: 360, width: 100, height: 20 },
          { x: 600, y: 300, width: 110, height: 20 },
          { x: 800, y: 250, width: 130, height: 20 },
          { x: 1100, y: 380, width: 160, height: 20 },
          { x: 1400, y: 310, width: 120, height: 20 },
          { x: 1650, y: 260, width: 140, height: 20 },
          { x: 1900, y: 350, width: 150, height: 20 },
          { x: 2200, y: 280, width: 120, height: 20 },
          { x: 2500, y: 370, width: 130, height: 20 },
          { x: 2800, y: 300, width: 140, height: 20 },
          { x: 3100, y: 340, width: 160, height: 20 },
        ],
        enemies: [
          makeEnemy(500, groundY - 70, 'onion', 1.3),
          makeEnemy(800, groundY - 70, 'egg', 1.3),
          makeEnemy(1100, groundY - 70, 'onion'),
          makeEnemy(1400, groundY - 70, 'egg', 1.3),
          makeEnemy(1700, groundY - 70, 'onion', 1.3),
          makeEnemy(2000, groundY - 70, 'egg'),
          makeEnemy(2300, groundY - 70, 'onion', 1.3),
          makeEnemy(2600, groundY - 70, 'egg', 1.3),
          makeEnemy(2900, groundY - 70, 'onion'),
          makeEnemy(3200, groundY - 70, 'egg', 1.3),
        ],
        boss: null,
        weaponPickups: [makeWeaponPickup(1650, 230, 'static_bolt')],
        healthPickups: [
          makeHealthPickup(900, groundY - 30),
          makeHealthPickup(1600, groundY - 30),
          makeHealthPickup(2400, groundY - 30),
          makeHealthPickup(3000, groundY - 30),
        ],
      };
    }

    case 5: {
      return {
        width: 3800, groundY, isBossLevel: false, chapter: 3,
        platforms: [
          { x: 0, y: groundY, width: 3800, height: 100 },
          { x: 300, y: 380, width: 250, height: 20 },
          { x: 700, y: 320, width: 200, height: 20 },
          { x: 1050, y: 370, width: 180, height: 20 },
          { x: 1400, y: 290, width: 220, height: 20 },
          { x: 1800, y: 360, width: 200, height: 20 },
          { x: 2150, y: 300, width: 180, height: 20 },
          { x: 2500, y: 370, width: 240, height: 20 },
          { x: 2900, y: 310, width: 200, height: 20 },
          { x: 3300, y: 350, width: 180, height: 20 },
        ],
        enemies: [
          makeEnemy(450, groundY - 70, 'egg', 1.5),
          makeEnemy(800, groundY - 70, 'onion', 1.5),
          makeEnemy(1150, groundY - 70, 'egg', 1.5),
          makeEnemy(1500, groundY - 70, 'onion', 1.5),
          makeEnemy(1900, groundY - 70, 'egg', 1.5),
          makeEnemy(2250, groundY - 70, 'onion', 1.5),
          makeEnemy(2600, groundY - 70, 'egg', 1.5),
          makeEnemy(2950, groundY - 70, 'onion', 1.5),
          makeEnemy(3350, groundY - 70, 'egg', 1.5),
        ],
        boss: null,
        weaponPickups: [],
        healthPickups: [
          makeHealthPickup(600, groundY - 30),
          makeHealthPickup(1300, groundY - 30),
          makeHealthPickup(2000, groundY - 30),
          makeHealthPickup(2800, groundY - 30),
        ],
      };
    }

    case 6: {
      return {
        width: 4000, groundY, isBossLevel: false, chapter: 3,
        platforms: [
          { x: 0, y: groundY, width: 4000, height: 100 },
          { x: 250, y: 400, width: 140, height: 20 },
          { x: 450, y: 340, width: 120, height: 20 },
          { x: 700, y: 280, width: 150, height: 20 },
          { x: 950, y: 380, width: 180, height: 20 },
          { x: 1250, y: 310, width: 130, height: 20 },
          { x: 1500, y: 260, width: 160, height: 20 },
          { x: 1800, y: 370, width: 140, height: 20 },
          { x: 2100, y: 290, width: 170, height: 20 },
          { x: 2400, y: 350, width: 130, height: 20 },
          { x: 2700, y: 270, width: 150, height: 20 },
          { x: 3000, y: 360, width: 180, height: 20 },
          { x: 3350, y: 300, width: 140, height: 20 },
          { x: 3650, y: 340, width: 160, height: 20 },
        ],
        enemies: [
          makeEnemy(400, groundY - 70, 'onion', 1.7),
          makeEnemy(750, groundY - 70, 'egg', 1.7),
          makeEnemy(1100, groundY - 70, 'onion', 1.7),
          makeEnemy(1400, groundY - 70, 'egg', 1.7),
          makeEnemy(1700, groundY - 70, 'onion', 2),
          makeEnemy(2050, groundY - 70, 'egg', 1.7),
          makeEnemy(2350, groundY - 70, 'onion', 2),
          makeEnemy(2650, groundY - 70, 'egg', 1.7),
          makeEnemy(3000, groundY - 70, 'onion', 2),
          makeEnemy(3400, groundY - 70, 'egg', 2),
          makeEnemy(3700, groundY - 70, 'onion', 2),
        ],
        boss: null,
        weaponPickups: [makeWeaponPickup(2100, groundY - 40, 'iron_fist')],
        healthPickups: [
          makeHealthPickup(500, groundY - 30),
          makeHealthPickup(1200, groundY - 30),
          makeHealthPickup(1900, groundY - 30),
          makeHealthPickup(2800, groundY - 30),
          makeHealthPickup(3500, groundY - 30),
        ],
      };
    }

    case 7: {
      return {
        width: 3500, groundY, isBossLevel: false, chapter: 4,
        platforms: [
          { x: 0, y: groundY, width: 3500, height: 100 },
          { x: 300, y: 390, width: 130, height: 20 },
          { x: 550, y: 330, width: 110, height: 20 },
          { x: 800, y: 370, width: 150, height: 20 },
          { x: 1100, y: 290, width: 120, height: 20 },
          { x: 1350, y: 360, width: 140, height: 20 },
          { x: 1650, y: 300, width: 130, height: 20 },
          { x: 1950, y: 370, width: 160, height: 20 },
          { x: 2250, y: 280, width: 140, height: 20 },
          { x: 2550, y: 350, width: 120, height: 20 },
          { x: 2850, y: 310, width: 150, height: 20 },
          { x: 3150, y: 360, width: 130, height: 20 },
        ],
        enemies: [
          makeEnemy(400, groundY - 70, 'egg', 2),
          makeEnemy(700, groundY - 70, 'onion', 2),
          makeEnemy(1000, groundY - 70, 'egg', 2),
          makeEnemy(1250, groundY - 70, 'onion', 2),
          makeEnemy(1500, groundY - 70, 'egg', 2.5),
          makeEnemy(1800, groundY - 70, 'onion', 2),
          makeEnemy(2100, groundY - 70, 'egg', 2.5),
          makeEnemy(2400, groundY - 70, 'onion', 2.5),
          makeEnemy(2700, groundY - 70, 'egg', 2),
          makeEnemy(3000, groundY - 70, 'onion', 2.5),
          makeEnemy(3300, groundY - 70, 'egg', 2.5),
        ],
        boss: null,
        weaponPickups: [makeWeaponPickup(1650, groundY - 40, 'corruption_purge')],
        healthPickups: [
          makeHealthPickup(500, groundY - 30),
          makeHealthPickup(1100, groundY - 30),
          makeHealthPickup(1700, groundY - 30),
          makeHealthPickup(2300, groundY - 30),
          makeHealthPickup(3100, groundY - 30),
        ],
      };
    }

    case 8:
    default: {
      return {
        width: 1200, groundY, isBossLevel: true, chapter: 4,
        platforms: [
          { x: 0, y: groundY, width: 1200, height: 100 },
          { x: 150, y: 380, width: 120, height: 20 },
          { x: 450, y: 320, width: 150, height: 20 },
          { x: 750, y: 380, width: 120, height: 20 },
          { x: 300, y: 250, width: 100, height: 20 },
          { x: 650, y: 250, width: 100, height: 20 },
        ],
        enemies: [],
        boss: makeBoss(900, groundY - 150),
        weaponPickups: [],
        healthPickups: [
          makeHealthPickup(200, groundY - 30, 5),
          makeHealthPickup(550, groundY - 30, 5),
        ],
      };
    }
  }
};
