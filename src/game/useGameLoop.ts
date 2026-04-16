import { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Player, Enemy, Boss, Projectile, Particle, Platform, Level, WeaponType, WEAPONS, HealthPickup, LeviAbility, LEVI_ABILITIES, CJAbility, CJ_ABILITIES } from './types';
import { createLevel, TOTAL_LEVELS } from './levels';

import onionImg from '@/assets/OnionEnemy.png';
import eggImg from '@/assets/eggEnemy.png';
import bossImg from '@/assets/finalboss_2.png';
import playerImg from '@/assets/playermodel.png';
import rottenCoreImg from '/images/rotten-core.png';
import leviImg from '/images/levi.png';
import cjImg from '/images/cj.png';
import rottenTankImg from '/images/rotten-tank.png';

const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const MOVE_SPEED = 4;
const CANVAS_W = 960;
const CANVAS_H = 600;

export function useGameLoop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  
  const stateRef = useRef({
    gameState: 'title' as GameState,
    player: null as Player | null,
    level: null as Level | null,
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    cameraX: 0,
    keys: new Set<string>(),
    images: {} as Record<string, HTMLImageElement>,
    levelNum: 1,
    score: 0,
    transitioning: false,
    bossPhaseTriggered: { 2: false, 3: false } as Record<number, boolean>,
    // Boss finisher state
    finisher: {
      active: false,
      meter: 0,        // 0-100
      mashCount: 0,
      lastMashTime: 0,
      arrowPhase: 'none' as 'none' | 'flying' | 'impact' | 'exploding',
      arrowX: -100,
      arrowY: 0,
      arrowTargetX: 0,
      arrowTargetY: 0,
      explosionTimer: 0,
      explosionParticlesSpawned: false,
      screenShake: 0,
      jWasUp: true,
    },
  });

  const loadImages = useCallback(() => {
    const srcs = { player: playerImg, onion: onionImg, egg: eggImg, boss: bossImg, rottenCore: rottenCoreImg, levi: leviImg, cj: cjImg, rottenTank: rottenTankImg };
    Object.entries(srcs).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      stateRef.current.images[key] = img;
    });
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      s.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  };

  const initLevel = useCallback((levelNum: number) => {
    const s = stateRef.current;
    const level = createLevel(levelNum);
    s.level = level;
    s.levelNum = levelNum;
    s.projectiles = [];
    s.particles = [];
    s.cameraX = 0;
    s.transitioning = false;
    const isLevi = s.player?.isLevi ?? false;
    const isCJ = s.player?.isCJ ?? false;
    const leviMaxHP = 20;
    const zachMaxHP = 10;
    const cjMaxHP = 15;
    const maxHP = isCJ ? cjMaxHP : isLevi ? leviMaxHP : zachMaxHP;
    s.player = {
      x: 50, y: level.groundY - 60,
      width: 40, height: 55,
      velocityX: 0, velocityY: 0,
      health: s.player?.health ?? maxHP,
      maxHealth: maxHP,
      isAttacking: false, attackTimer: 0,
      facingRight: true, isJumping: false, onGround: false,
      invincibleTimer: 0, score: s.score,
      currentWeapon: s.player?.currentWeapon ?? 'forest_blade',
      weapons: s.player?.weapons ?? ['forest_blade'],
      isLevi,
      isCJ,
      devouredEnemies: s.player?.devouredEnemies ?? 0,
      leviAbilities: s.player?.leviAbilities ?? [],
      cjAbilities: s.player?.cjAbilities ?? [],
      grenadeCount: s.player?.grenadeCount ?? 3,
      grenadeCooldown: 0,
      ammo: s.player?.ammo ?? 30,
      maxAmmo: isCJ ? 30 : 0,
    };
  }, []);

  const resetFinisher = () => {
    const f = stateRef.current.finisher;
    f.active = false; f.meter = 0; f.mashCount = 0; f.arrowPhase = 'none';
    f.explosionTimer = 0; f.screenShake = 0; f.explosionParticlesSpawned = false;
  };

  const beginLevel = useCallback((levelNum: number) => {
    stateRef.current.gameState = 'playing';
    stateRef.current.bossPhaseTriggered = { 2: false, 3: false };
    resetFinisher();
    setCurrentLevel(levelNum);
    initLevel(levelNum);
    setGameState('playing');
  }, [initLevel]);

  const setGameStateTo = useCallback((state: GameState) => {
    stateRef.current.gameState = state;
    setGameState(state);
  }, []);

  const startGame = useCallback(() => {
    stateRef.current.score = 0;
    stateRef.current.gameState = 'playing';
    stateRef.current.player = null;
    stateRef.current.bossPhaseTriggered = { 2: false, 3: false };
    resetFinisher();
    setScore(0);
    setCurrentLevel(1);
    initLevel(1);
    setGameState('playing');
  }, [initLevel]);

  const startFinisher = useCallback(() => {
    const s = stateRef.current;
    const f = s.finisher;
    f.active = true;
    f.meter = 0;
    f.mashCount = 0;
    f.arrowPhase = 'none';
    f.arrowX = -100;
    f.explosionTimer = 0;
    f.explosionParticlesSpawned = false;
    f.screenShake = 0;
    f.jWasUp = true;
    if (s.level?.boss) {
      f.arrowTargetX = s.level.boss.x + s.level.boss.width / 2;
      f.arrowTargetY = s.level.boss.y + s.level.boss.height / 2;
    }
  }, []);

  const update = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing' || !s.player || !s.level) return;

    // === FINISHER MODE ===
    const f = s.finisher;
    if (f.active) {
      const keys = s.keys;
      
      if (f.arrowPhase === 'none') {
        // Mashing phase: track J presses (must release between presses)
        const jDown = keys.has('j') || keys.has('z');
        if (jDown && f.jWasUp) {
          f.mashCount++;
          f.meter = Math.min(100, f.meter + 3.5);
          f.lastMashTime = Date.now();
          f.jWasUp = false;
          f.screenShake = 4;
          if (s.level.boss) {
            const isRC = s.level.boss.bossType === 'rotten_core';
            spawnParticles(
              s.level.boss.x + s.level.boss.width / 2,
              s.level.boss.y + s.level.boss.height / 2,
              isRC ? (f.meter > 70 ? '#ff6600' : '#44ff22') : (f.meter > 70 ? '#ffdd00' : '#ff6600'), 3
            );
          }
        }
        if (!jDown) f.jWasUp = true;
        
        if (Date.now() - f.lastMashTime > 300) {
          f.meter = Math.max(0, f.meter - 0.4);
        }
        
        if (f.meter >= 100) {
          f.arrowPhase = 'flying';
          f.arrowX = -100;
          if (s.level.boss) {
            f.arrowTargetX = s.level.boss.x + s.level.boss.width / 2;
            f.arrowTargetY = s.level.boss.y + s.level.boss.height / 2;
          }
          f.arrowY = f.arrowTargetY;
        }
        
        if (s.level.boss) {
          s.level.boss.velocityX = 0;
          s.level.boss.velocityY = 0;
          s.level.boss.attackCooldown = 999;
        }
      } else if (f.arrowPhase === 'flying') {
        const isRC = s.level.boss?.bossType === 'rotten_core';
        if (isRC) {
          // LEVI DEVOUR: Player rushes toward boss
          const p = s.player!;
          const targetX = f.arrowTargetX - p.width / 2;
          const dx = targetX - p.x;
          p.x += Math.sign(dx) * 15;
          p.facingRight = dx > 0;
          spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#ff6600', 3);
          spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#ff8800', 2);
          if (Math.abs(dx) < 30) {
            f.arrowPhase = 'impact';
            f.explosionTimer = 0;
            f.screenShake = 25;
          }
        } else {
          // Arrow flies from left side across screen toward boss
          f.arrowX += 28;
          spawnParticles(f.arrowX, f.arrowY, '#ffdd00', 2);
          spawnParticles(f.arrowX, f.arrowY, '#ffffff', 1);
          if (f.arrowX >= f.arrowTargetX) {
            f.arrowPhase = 'impact';
            f.explosionTimer = 0;
            f.screenShake = 20;
          }
        }
      } else if (f.arrowPhase === 'impact') {
        const isRC = s.level.boss?.bossType === 'rotten_core';
        f.explosionTimer++;
        f.screenShake = Math.max(0, 20 - f.explosionTimer);
        
        if (!isRC) f.arrowX += 20;
        
        if (f.explosionTimer === 1) {
          const bx = f.arrowTargetX;
          const by = f.arrowTargetY;
          const colors = isRC ? ['#44ff22', '#ff6600', '#ffffff', '#88ff44'] : ['#ff4400', '#ffdd00', '#ffffff', '#ff8800'];
          for (let i = 0; i < 40; i++) {
            s.particles.push({
              x: bx, y: by,
              vx: (Math.random() - 0.5) * 16,
              vy: (Math.random() - 0.5) * 16,
              life: 40 + Math.random() * 30, maxLife: 70,
              color: colors[Math.floor(Math.random() * 4)],
              size: 4 + Math.random() * 8,
            });
          }
        }
        
        if (f.explosionTimer === 30) {
          f.arrowPhase = 'exploding';
          f.explosionTimer = 0;
        }
      } else if (f.arrowPhase === 'exploding') {
        const isRC = s.level.boss?.bossType === 'rotten_core';
        f.explosionTimer++;
        f.screenShake = Math.max(0, 15 - f.explosionTimer * 0.5);
        
        if (f.explosionTimer % 8 === 1 && f.explosionTimer < 50) {
          const bx = f.arrowTargetX;
          const by = f.arrowTargetY;
          const wave = f.explosionTimer / 8;
          const colors = isRC 
            ? ['#44ff22', '#88ff44', '#ff6600', '#ffffff', '#22aa11']
            : ['#ff2200', '#ffaa00', '#ffdd00', '#ff6600', '#ffffff'];
          for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            const speed = 4 + wave * 2;
            s.particles.push({
              x: bx, y: by,
              vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 3,
              vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 3,
              life: 50 + Math.random() * 30, maxLife: 80,
              color: colors[Math.floor(Math.random() * 5)],
              size: 3 + Math.random() * 10,
            });
          }
        }
        
        if (s.level.boss) {
          s.level.boss.isAlive = false;
        }
        
        if (f.explosionTimer > 90) {
          f.active = false;
          s.score += 2000;
          
          const bType = s.level?.boss?.bossType;
          
          if (bType === 'colossus') {
            // Colossus defeated — swap to Levi!
            if (s.player) {
              s.player.isLevi = true;
              s.player.isCJ = false;
              s.player.devouredEnemies = 0;
              s.player.maxHealth = 20;
              s.player.health = 20;
              s.player.leviAbilities = [];
            }
            window.dispatchEvent(new CustomEvent('switch_to_levi'));
            setScore(s.score);
            const nextLevel = s.levelNum + 1;
            const handler = (window as any).__handleLevelTransition;
            if (handler) {
              handler(nextLevel);
            } else {
              setCurrentLevel(nextLevel);
              initLevel(nextLevel);
            }
          } else if (bType === 'rotten_core') {
            // Rotten Core devoured — swap to CJ!
            if (s.player) {
              s.player.isLevi = false;
              s.player.isCJ = true;
              s.player.maxHealth = 15;
              s.player.health = 15;
              s.player.cjAbilities = [];
              s.player.ammo = 30;
              s.player.maxAmmo = 30;
              s.player.grenadeCount = 3;
            }
            window.dispatchEvent(new CustomEvent('switch_to_cj'));
            setScore(s.score);
            const nextLevel = s.levelNum + 1;
            const handler = (window as any).__handleLevelTransition;
            if (handler) {
              handler(nextLevel);
            } else {
              setCurrentLevel(nextLevel);
              initLevel(nextLevel);
            }
          } else {
            // Final boss (Rotten Tank) — victory!
            s.gameState = 'victory';
            setGameState('victory');
            setScore(s.score);
          }
        }
      }
      
      // Update particles during finisher
      s.particles = s.particles.filter(pt => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.1;
        pt.life--;
        return pt.life > 0;
      });
      
      return; // Skip normal update during finisher
    }
    
    const p = s.player;
    const level = s.level;
    const keys = s.keys;
    const weapon = WEAPONS[p.currentWeapon];

    // Weapon switching with number keys
    for (let i = 0; i < p.weapons.length; i++) {
      if (keys.has(`${i + 1}`)) {
        p.currentWeapon = p.weapons[i];
      }
    }

    // Player movement
    if (keys.has('arrowleft') || keys.has('a')) {
      p.velocityX = -MOVE_SPEED;
      p.facingRight = false;
    } else if (keys.has('arrowright') || keys.has('d')) {
      p.velocityX = MOVE_SPEED;
      p.facingRight = true;
    } else {
      p.velocityX *= 0.8;
    }

    if ((keys.has('arrowup') || keys.has('w') || keys.has(' ')) && p.onGround) {
      p.velocityY = JUMP_FORCE;
      p.onGround = false;
      p.isJumping = true;
      // Levi's jump shockwave
      if (p.isLevi) {
        const hasBellySlam = p.leviAbilities.includes('belly_slam');
        const shockRadius = hasBellySlam ? 200 : 120;
        const shockDmg = hasBellySlam ? 5 : 3;
        spawnParticles(p.x + p.width / 2, p.y + p.height, '#ff6600', hasBellySlam ? 25 : 15);
        // Damage nearby enemies with shockwave
        for (const e of level.enemies) {
          if (!e.isAlive) continue;
          const dx = (e.x + e.width / 2) - (p.x + p.width / 2);
          const dy = (e.y + e.height / 2) - (p.y + p.height / 2);
          if (Math.sqrt(dx * dx + dy * dy) < shockRadius) {
            e.health -= shockDmg;
            e.velocityY = -8;
            e.velocityX = dx > 0 ? 5 : -5;
            spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ff8800', 8);
            if (e.health <= 0) {
              e.isAlive = false;
              s.score += e.type === 'onion' ? 300 : 200;
              spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ffaa00', 15);
            }
          }
        }
        // Shockwave hits boss too
        if (level.boss?.isAlive) {
          const b = level.boss;
          const dx = (b.x + b.width / 2) - (p.x + p.width / 2);
          const dy = (b.y + b.height / 2) - (p.y + p.height / 2);
          if (Math.sqrt(dx * dx + dy * dy) < 150) {
            b.health -= 2;
            spawnParticles(b.x + b.width / 2, b.y + b.height / 2, '#ff8800', 10);
            if (b.health <= 0) { b.health = 0; startFinisher(); }
          }
        }
      }
    }

    // Attack
    if (keys.has('z') || keys.has('j')) {
      if (!p.isAttacking && p.attackTimer <= 0) {
        p.isAttacking = true;
        
        if (p.isCJ) {
          // CJ ATTACK: Glock shoot, grenade, flashbang, airstrike
          p.attackTimer = 12; // Fast fire rate
          if (p.cjAbilities.includes('frag_grenade') && p.grenadeCount > 0 && (keys.has('arrowdown') || keys.has('s'))) {
            // Throw grenade
            p.grenadeCount--;
            s.projectiles.push({
              x: p.x + (p.facingRight ? p.width : -15),
              y: p.y + p.height / 2 - 10,
              width: 12, height: 12,
              velocityX: (p.facingRight ? 1 : -1) * 8,
              velocityY: -6,
              isPlayerProjectile: true,
              damage: 6,
              lifetime: 45,
              isGrenade: true,
              grenadeTimer: 45,
              aoeRadius: 120,
            });
            spawnParticles(p.x + (p.facingRight ? p.width : 0), p.y + p.height / 2, '#44aa44', 8);
          } else if (p.cjAbilities.includes('flashbang') && (keys.has('arrowup') || keys.has('w'))) {
            // Flashbang — stun all enemies on screen
            p.attackTimer = 60; // Long cooldown
            spawnParticles(p.x + p.width / 2, p.y, '#ffffaa', 30);
            for (const e of level.enemies) {
              if (!e.isAlive) continue;
              const ex = e.x - s.cameraX;
              if (ex > -100 && ex < 1060) {
                e.attackCooldown = 180; // 3 seconds stun
                e.velocityX = 0;
                spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ffffaa', 10);
              }
            }
          } else if (p.cjAbilities.includes('airstrike') && keys.has('arrowdown') && (keys.has('arrowup') || keys.has('w'))) {
            // Airstrike
            p.attackTimer = 90;
            for (let i = 0; i < 8; i++) {
              const strikeX = p.x + (Math.random() - 0.5) * 400;
              setTimeout(() => {
                if (!s.level) return;
                s.projectiles.push({
                  x: strikeX, y: -20,
                  width: 15, height: 15,
                  velocityX: 0, velocityY: 12,
                  isPlayerProjectile: true,
                  damage: 5, lifetime: 60,
                });
                spawnParticles(strikeX, 50, '#ff4444', 8);
              }, i * 100);
            }
            spawnParticles(p.x + p.width / 2, p.y - 20, '#ff4444', 15);
          } else if (p.ammo > 0) {
            // Glock shot
            p.ammo--;
            s.projectiles.push({
              x: p.x + (p.facingRight ? p.width : -10),
              y: p.y + p.height / 2 - 5,
              width: 8, height: 4,
              velocityX: (p.facingRight ? 1 : -1) * 16,
              velocityY: 0,
              isPlayerProjectile: true,
              damage: 3,
              lifetime: 60,
            });
            spawnParticles(p.x + (p.facingRight ? p.width : 0), p.y + p.height / 2, '#ffdd44', 5);
            // Muzzle flash
            spawnParticles(p.x + (p.facingRight ? p.width + 10 : -10), p.y + p.height / 2, '#ffffff', 3);
          } else {
            // Pistol whip — melee when out of ammo
            p.attackTimer = 20;
            spawnParticles(p.x + (p.facingRight ? p.width + 10 : -10), p.y + p.height / 2, '#888888', 5);
          }
        } else if (p.isLevi) {
          // LEVI ATTACK: Devour, shoot devoured, or toxic spit
          const hasFrenzy = p.leviAbilities.includes('frenzy');
          p.attackTimer = hasFrenzy ? 12 : 20;
          if (p.leviAbilities.includes('toxic_spit') && (keys.has('arrowdown') || keys.has('s'))) {
            // Toxic spit — ranged acid attack
            s.projectiles.push({
              x: p.x + (p.facingRight ? p.width : -20),
              y: p.y + p.height / 2 - 10,
              width: 20, height: 20,
              velocityX: (p.facingRight ? 1 : -1) * 10,
              velocityY: 0,
              isPlayerProjectile: true,
              damage: 4,
              lifetime: 80,
            });
            spawnParticles(p.x + (p.facingRight ? p.width : 0), p.y + p.height / 2, '#88ff00', 10);
          } else if (p.devouredEnemies > 0 && (keys.has('arrowup') || keys.has('w'))) {
            // Shoot devoured enemy as projectile (hold up + attack)
            p.devouredEnemies--;
            s.projectiles.push({
              x: p.x + (p.facingRight ? p.width : -20),
              y: p.y + p.height / 2 - 10,
              width: 25, height: 25,
              velocityX: (p.facingRight ? 1 : -1) * 14,
              velocityY: -2,
              isPlayerProjectile: true,
              damage: 8,
              lifetime: 100,
            });
            spawnParticles(p.x + (p.facingRight ? p.width : 0), p.y + p.height / 2, '#ff4400', 10);
          } else {
            // Devour attack — close range, high damage, eats enemies
            spawnParticles(
              p.x + (p.facingRight ? p.width + 15 : -15),
              p.y + p.height / 2,
              '#ff6600', 8
            );
          }
        } else {
          p.attackTimer = weapon.speed;
          if (weapon.isRanged && weapon.projectileSpeed) {
            s.projectiles.push({
              x: p.x + (p.facingRight ? p.width : -15),
              y: p.y + p.height / 2 - 7,
              width: 15, height: 15,
              velocityX: (p.facingRight ? 1 : -1) * weapon.projectileSpeed,
              velocityY: 0,
              isPlayerProjectile: true,
              damage: weapon.damage,
              lifetime: 80,
            });
            spawnParticles(p.x + (p.facingRight ? p.width : 0), p.y + p.height / 2, weapon.color, 6);
          } else if (weapon.aoeRadius) {
            spawnParticles(p.x + p.width / 2, p.y + p.height / 2, weapon.color, 20);
          } else {
            spawnParticles(
              p.x + (p.facingRight ? p.width + 20 : -20),
              p.y + p.height / 2,
              weapon.color, 5
            );
          }
        }
      }
    }

    // Apply gravity
    p.velocityY += GRAVITY;
    p.x += p.velocityX;
    p.y += p.velocityY;

    // Clamp to level bounds
    if (p.x < 0) p.x = 0;
    if (p.x > level.width - p.width) p.x = level.width - p.width;

    // Platform collision
    p.onGround = false;
    for (const plat of level.platforms) {
      if (
        p.x + p.width > plat.x && p.x < plat.x + plat.width &&
        p.y + p.height > plat.y && p.y + p.height < plat.y + plat.height + 15 &&
        p.velocityY >= 0
      ) {
        p.y = plat.y - p.height;
        p.velocityY = 0;
        p.onGround = true;
        p.isJumping = false;
      }
    }

    // Attack timer
    if (p.attackTimer > 0) p.attackTimer--;
    if (p.attackTimer <= 0) p.isAttacking = false;
    if (p.invincibleTimer > 0) p.invincibleTimer--;

    // Weapon pickup collision
    for (const wp of level.weaponPickups) {
      if (wp.collected) continue;
      if (
        p.x < wp.x + wp.width && p.x + p.width > wp.x &&
        p.y < wp.y + wp.height && p.y + p.height > wp.y
      ) {
        wp.collected = true;
        if (!p.weapons.includes(wp.weapon)) {
          p.weapons.push(wp.weapon);
        }
        p.currentWeapon = wp.weapon;
        spawnParticles(wp.x + wp.width / 2, wp.y + wp.height / 2, WEAPONS[wp.weapon].color, 25);
        window.dispatchEvent(new CustomEvent('weapon_pickup', { detail: wp.weapon }));
      }
    }

    // Health pickup collision
    for (const hp of level.healthPickups) {
      if (hp.collected) continue;
      if (
        p.x < hp.x + hp.width && p.x + p.width > hp.x &&
        p.y < hp.y + hp.height && p.y + p.height > hp.y
      ) {
        hp.collected = true;
        const oldHealth = p.health;
        p.health = Math.min(p.maxHealth, p.health + hp.healAmount);
        if (p.health > oldHealth) {
          spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#44ff44', 15);
        }
      }
    }

    // Levi ability pickup collision
    for (const ap of level.leviAbilityPickups) {
      if (ap.collected) continue;
      if (
        p.x < ap.x + ap.width && p.x + p.width > ap.x &&
        p.y < ap.y + ap.height && p.y + p.height > ap.y
      ) {
        ap.collected = true;
        if (!p.leviAbilities.includes(ap.ability)) {
          p.leviAbilities.push(ap.ability);
        }
        const aDef = LEVI_ABILITIES[ap.ability];
        spawnParticles(ap.x + ap.width / 2, ap.y + ap.height / 2, aDef.color, 30);
        window.dispatchEvent(new CustomEvent('levi_ability_pickup', { detail: ap.ability }));
      }
    }

    // CJ ability pickup collision
    for (const cap of level.cjAbilityPickups) {
      if (cap.collected) continue;
      if (
        p.x < cap.x + cap.width && p.x + p.width > cap.x &&
        p.y < cap.y + cap.height && p.y + p.height > cap.y
      ) {
        cap.collected = true;
        if (!p.cjAbilities.includes(cap.ability)) {
          p.cjAbilities.push(cap.ability);
        }
        const aDef = CJ_ABILITIES[cap.ability];
        spawnParticles(cap.x + cap.width / 2, cap.y + cap.height / 2, aDef.color, 30);
        window.dispatchEvent(new CustomEvent('cj_ability_pickup', { detail: cap.ability }));
      }
    }

    // Ammo pickup collision
    for (const amp of level.ammoPickups) {
      if (amp.collected) continue;
      if (
        p.x < amp.x + amp.width && p.x + p.width > amp.x &&
        p.y < amp.y + amp.height && p.y + p.height > amp.y
      ) {
        amp.collected = true;
        p.ammo = Math.min(p.maxAmmo, p.ammo + amp.ammoAmount);
        spawnParticles(amp.x + amp.width / 2, amp.y + amp.height / 2, '#ffdd44', 15);
      }
    }

    // Grenade cooldown
    if (p.grenadeCooldown > 0) p.grenadeCooldown--;


    const atkRange = weapon.range;
    const atkX = p.facingRight ? p.x + p.width : p.x - atkRange;
    const atkY = p.y;
    const isAOE = !!weapon.aoeRadius;
    const aoeCenterX = p.x + p.width / 2;
    const aoeCenterY = p.y + p.height / 2;

    // Update enemies
    for (const e of level.enemies) {
      if (!e.isAlive) continue;
      
      const distToPlayer = p.x - e.x;
      if (Math.abs(distToPlayer) < 300) {
        e.direction = distToPlayer > 0 ? 1 : -1;
        e.velocityX = e.direction * (e.type === 'egg' ? 2.5 : 1.8);
      } else {
        e.attackCooldown++;
        if (e.attackCooldown > 120) {
          e.direction *= -1;
          e.attackCooldown = 0;
        }
        e.velocityX = e.direction * 1;
      }

      e.velocityY += GRAVITY;
      e.x += e.velocityX;
      e.y += e.velocityY;

      for (const plat of level.platforms) {
        if (
          e.x + e.width > plat.x && e.x < plat.x + plat.width &&
          e.y + e.height > plat.y && e.y + e.height < plat.y + plat.height + 15 &&
          e.velocityY >= 0
        ) {
          e.y = plat.y - e.height;
          e.velocityY = 0;
        }
      }

      const hasMegaChomp = p.leviAbilities.includes('mega_chomp');
      const hasFrenzy = p.leviAbilities.includes('frenzy');
      const leviDevourRange = hasMegaChomp ? 130 : 80;
      const leviDevourDmg = hasMegaChomp ? 6 : 4;
      if (p.isLevi) {
        // Levi devour attack
        if (p.isAttacking && p.attackTimer > (hasFrenzy ? 8 : 15)) {
          const dx = (e.x + e.width / 2) - (p.x + p.width / 2);
          const dy = (e.y + e.height / 2) - (p.y + p.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < leviDevourRange) {
            e.health -= leviDevourDmg;
            e.velocityX = (p.facingRight ? 1 : -1) * 10;
            e.velocityY = -4;
            spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ff6600', 10);
            if (e.health <= 0) {
              e.isAlive = false;
              s.score += e.type === 'onion' ? 300 : 200;
              p.devouredEnemies = Math.min(hasMegaChomp ? 8 : 5, p.devouredEnemies + 1);
              // Devour effect — enemy gets sucked in
              spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#ff8800', 20);
              spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ffaa00', 15);
              // Frenzy: always heal on devour; otherwise 40% chance
              if (hasFrenzy || Math.random() < 0.4) {
                const healAmt = hasFrenzy ? 3 : 1;
                p.health = Math.min(p.maxHealth, p.health + healAmt);
                spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#44ff44', 10);
              }
            }
          }
        }
      } else if (p.isAttacking && p.attackTimer > weapon.speed - 5 && !weapon.isRanged) {
        let hit = false;
        if (isAOE) {
          const dx = (e.x + e.width / 2) - aoeCenterX;
          const dy = (e.y + e.height / 2) - aoeCenterY;
          hit = Math.sqrt(dx * dx + dy * dy) < (weapon.aoeRadius ?? 0);
        } else {
          hit = atkX < e.x + e.width && atkX + atkRange > e.x &&
                atkY < e.y + e.height && atkY + p.height > e.y;
        }
        if (hit) {
          e.health -= weapon.damage;
          e.velocityX = (p.facingRight ? 1 : -1) * 8;
          e.velocityY = -3;
          spawnParticles(e.x + e.width / 2, e.y + e.height / 2, weapon.color, 8);
          if (e.health <= 0) {
            e.isAlive = false;
            s.score += e.type === 'onion' ? 300 : 200;
            spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ffaa00', 15);
            if (Math.random() < 0.4) {
              level.healthPickups.push({
                x: e.x + e.width / 2 - 12, y: e.y + e.height / 2 - 12,
                width: 24, height: 24, healAmount: 2, collected: false,
              });
            }
          }
        }
      }

      // Enemy damages player
      if (p.invincibleTimer <= 0) {
        if (
          p.x < e.x + e.width && p.x + p.width > e.x &&
          p.y < e.y + e.height && p.y + p.height > e.y
        ) {
          p.health--;
          p.invincibleTimer = 60;
          p.velocityX = (p.x < e.x ? -1 : 1) * 6;
          p.velocityY = -5;
          spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#ff0000', 10);
          if (p.health <= 0) {
            s.gameState = 'gameover';
            setGameState('gameover');
          }
        }
      }
    }

    // Boss logic
    if (level.boss && level.boss.isAlive) {
      const b = level.boss;
      b.attackCooldown--;

      const isRottenCore = b.bossType === 'rotten_core';
      const isRottenTank = b.bossType === 'rotten_tank';

      if (b.attackCooldown <= 0) {
        if (isRottenTank) {
          // ROTTEN TANK BOSS AI
          const rng = Math.random();
          if (b.phase === 1) {
            if (rng < 0.4) {
              b.attackType = 'cannon';
              const angle = Math.atan2(p.y - (b.y + b.height / 2), p.x - (b.x + b.width / 2));
              s.projectiles.push({
                x: b.x + b.width / 2, y: b.y + b.height / 3,
                width: 20, height: 20,
                velocityX: Math.cos(angle) * 8, velocityY: Math.sin(angle) * 8,
                isPlayerProjectile: false, damage: 3, lifetime: 80,
              });
              spawnParticles(b.x + b.width / 2, b.y + b.height / 3, '#ff6600', 10);
              b.attackCooldown = 60;
            } else if (rng < 0.7) {
              b.attackType = 'charge';
              b.direction = p.x < b.x ? -1 : 1;
              b.velocityX = b.direction * 7;
              b.attackCooldown = 80;
            } else {
              b.attackType = 'shoot';
              for (let i = 0; i < 3; i++) {
                const angle = Math.atan2(p.y - (b.y + b.height / 2), p.x - (b.x + b.width / 2)) + (i - 1) * 0.2;
                s.projectiles.push({
                  x: b.x + b.width / 2, y: b.y + b.height / 2,
                  width: 10, height: 10,
                  velocityX: Math.cos(angle) * 7, velocityY: Math.sin(angle) * 7,
                  isPlayerProjectile: false, damage: 2, lifetime: 60,
                });
              }
              spawnParticles(b.x + b.width / 2, b.y + b.height / 2, '#ffaa00', 8);
              b.attackCooldown = 50;
            }
          } else if (b.phase === 2) {
            if (rng < 0.3) {
              b.attackType = 'missiles';
              for (let i = 0; i < 4; i++) {
                s.projectiles.push({
                  x: b.x + b.width / 2 + (i - 1.5) * 30, y: b.y,
                  width: 12, height: 12,
                  velocityX: (Math.random() - 0.5) * 4, velocityY: -10,
                  isPlayerProjectile: false, damage: 3, lifetime: 100,
                });
              }
              spawnParticles(b.x + b.width / 2, b.y, '#ff4444', 12);
              b.attackCooldown = 55;
            } else if (rng < 0.6) {
              b.attackType = 'cannon';
              for (let i = 0; i < 2; i++) {
                const angle = Math.atan2(p.y - (b.y + b.height / 2), p.x - (b.x + b.width / 2)) + (i - 0.5) * 0.15;
                s.projectiles.push({
                  x: b.x + b.width / 2, y: b.y + b.height / 3,
                  width: 22, height: 22,
                  velocityX: Math.cos(angle) * 9, velocityY: Math.sin(angle) * 9,
                  isPlayerProjectile: false, damage: 4, lifetime: 70,
                });
              }
              b.attackCooldown = 50;
            } else {
              b.attackType = 'charge';
              b.direction = p.x < b.x ? -1 : 1;
              b.velocityX = b.direction * 8;
              b.attackCooldown = 70;
            }
          } else {
            // Phase 3: machine gun + spawns + everything
            if (rng < 0.25) {
              b.attackType = 'machinegun';
              for (let i = 0; i < 8; i++) {
                const angle = Math.atan2(p.y - (b.y + b.height / 2), p.x - (b.x + b.width / 2)) + (Math.random() - 0.5) * 0.4;
                s.projectiles.push({
                  x: b.x + b.width / 2, y: b.y + b.height / 2,
                  width: 8, height: 8,
                  velocityX: Math.cos(angle) * (10 + i), velocityY: Math.sin(angle) * (10 + i),
                  isPlayerProjectile: false, damage: 2, lifetime: 50,
                });
              }
              spawnParticles(b.x + b.width / 2, b.y + b.height / 2, '#ffdd44', 15);
              b.attackCooldown = 40;
            } else if (rng < 0.5) {
              b.attackType = 'spawn';
              const aliveEnemies = level.enemies.filter(e => e.isAlive).length;
              if (aliveEnemies < 4) {
                const spawnType = Math.random() < 0.5 ? 'egg' : 'onion';
                const enemy: Enemy = {
                  x: b.x + (Math.random() - 0.5) * 100, y: b.y + b.height - 70,
                  width: 60, height: 70,
                  velocityX: (Math.random() - 0.5) * 4, velocityY: -5,
                  type: spawnType as 'egg' | 'onion',
                  health: spawnType === 'onion' ? 5 : 4, maxHealth: spawnType === 'onion' ? 5 : 4,
                  isAlive: true, attackCooldown: 0, direction: p.x < b.x ? -1 : 1,
                };
                level.enemies.push(enemy);
                spawnParticles(enemy.x + 30, enemy.y + 35, '#ff6600', 10);
              }
              b.attackCooldown = 45;
            } else if (rng < 0.75) {
              b.attackType = 'missiles';
              for (let i = 0; i < 6; i++) {
                s.projectiles.push({
                  x: b.x + b.width / 2 + (i - 2.5) * 25, y: b.y,
                  width: 12, height: 12,
                  velocityX: (Math.random() - 0.5) * 6, velocityY: -12,
                  isPlayerProjectile: false, damage: 3, lifetime: 100,
                });
              }
              b.attackCooldown = 40;
            } else {
              b.attackType = 'charge';
              b.direction = p.x < b.x ? -1 : 1;
              b.velocityX = b.direction * 10;
              b.attackCooldown = 55;
            }
          }
        } else if (isRottenCore) {
          // ROTTEN CORE BOSS AI
          const rng = Math.random();
          if (b.phase === 1) {
            // Phase 1: Ancient Tree — root attacks, ground slams
            if (rng < 0.4) {
              b.attackType = 'root_attack';
              // Spawn root projectiles from ground
              for (let i = 0; i < 3; i++) {
                const rootX = p.x + (Math.random() - 0.5) * 200;
                s.projectiles.push({
                  x: rootX, y: level.groundY - 10,
                  width: 20, height: 20,
                  velocityX: 0, velocityY: -8 - Math.random() * 4,
                  isPlayerProjectile: false, damage: 2, lifetime: 60,
                });
                spawnParticles(rootX, level.groundY - 10, '#44aa22', 5);
              }
              b.attackCooldown = 70;
            } else if (rng < 0.7) {
              b.attackType = 'stomp';
              b.velocityY = -12;
              b.attackCooldown = 80;
            } else {
              b.attackType = 'shoot';
              const angle = Math.atan2(p.y - (b.y + b.height / 2), p.x - (b.x + b.width / 2));
              s.projectiles.push({
                x: b.x + b.width / 2, y: b.y + b.height / 2,
                width: 18, height: 18,
                velocityX: Math.cos(angle) * 6, velocityY: Math.sin(angle) * 6,
                isPlayerProjectile: false, damage: 2, lifetime: 100,
              });
              spawnParticles(b.x + b.width / 2, b.y + b.height / 2, '#66ff22', 8);
              b.attackCooldown = 50;
            }
          } else if (b.phase === 2) {
            // Phase 2: Corruption — lasers, toxic gas, ranged
            if (rng < 0.3) {
              b.attackType = 'laser';
              // Fire laser beam (multiple fast projectiles in a line)
              const angle = Math.atan2(p.y - (b.y + b.height / 2), p.x - (b.x + b.width / 2));
              for (let i = 0; i < 5; i++) {
                s.projectiles.push({
                  x: b.x + b.width / 2, y: b.y + b.height / 2,
                  width: 12, height: 12,
                  velocityX: Math.cos(angle) * (8 + i * 2), velocityY: Math.sin(angle) * (8 + i * 2),
                  isPlayerProjectile: false, damage: 2, lifetime: 60,
                });
              }
              spawnParticles(b.x + b.width / 2, b.y + b.height / 2, '#44ffaa', 12);
              b.attackCooldown = 60;
            } else if (rng < 0.6) {
              b.attackType = 'toxic_gas';
              // Spread toxic gas projectiles
              for (let i = 0; i < 6; i++) {
                const a = (Math.PI * 2 / 6) * i;
                s.projectiles.push({
                  x: b.x + b.width / 2, y: b.y + b.height / 2,
                  width: 15, height: 15,
                  velocityX: Math.cos(a) * 4, velocityY: Math.sin(a) * 4,
                  isPlayerProjectile: false, damage: 1, lifetime: 80,
                });
              }
              spawnParticles(b.x + b.width / 2, b.y + b.height / 2, '#88ff00', 15);
              b.attackCooldown = 55;
            } else {
              b.attackType = 'root_attack';
              for (let i = 0; i < 5; i++) {
                const rootX = 100 + Math.random() * (level.width - 200);
                s.projectiles.push({
                  x: rootX, y: level.groundY - 10,
                  width: 20, height: 20,
                  velocityX: 0, velocityY: -10 - Math.random() * 5,
                  isPlayerProjectile: false, damage: 2, lifetime: 50,
                });
                spawnParticles(rootX, level.groundY - 10, '#44aa22', 3);
              }
              b.attackCooldown = 65;
            }
          } else {
            // Phase 3: Exposed Core — everything + enemy spawns
            if (rng < 0.25) {
              b.attackType = 'spawn';
              // Spawn enemies
              const spawnType = Math.random() < 0.5 ? 'egg' : 'onion';
              const aliveEnemies = level.enemies.filter(e => e.isAlive).length;
              if (aliveEnemies < 4) {
                const enemy: Enemy = {
                  x: b.x + (Math.random() - 0.5) * 100,
                  y: b.y + b.height - 70,
                  width: 60, height: 70,
                  velocityX: (Math.random() - 0.5) * 4,
                  velocityY: -5,
                  type: spawnType as 'egg' | 'onion',
                  health: spawnType === 'onion' ? 4 : 3,
                  maxHealth: spawnType === 'onion' ? 4 : 3,
                  isAlive: true, attackCooldown: 0, direction: p.x < b.x ? -1 : 1,
                };
                level.enemies.push(enemy);
                spawnParticles(enemy.x + 30, enemy.y + 35, '#66ff22', 10);
              }
              b.attackCooldown = 40;
            } else if (rng < 0.5) {
              b.attackType = 'laser';
              // Triple laser
              for (let beam = -1; beam <= 1; beam++) {
                const baseAngle = Math.atan2(p.y - (b.y + b.height / 2), p.x - (b.x + b.width / 2));
                const angle = baseAngle + beam * 0.3;
                for (let i = 0; i < 4; i++) {
                  s.projectiles.push({
                    x: b.x + b.width / 2, y: b.y + b.height / 2,
                    width: 12, height: 12,
                    velocityX: Math.cos(angle) * (7 + i * 2), velocityY: Math.sin(angle) * (7 + i * 2),
                    isPlayerProjectile: false, damage: 3, lifetime: 60,
                  });
                }
              }
              spawnParticles(b.x + b.width / 2, b.y + b.height / 2, '#ff4422', 15);
              b.attackCooldown = 50;
            } else if (rng < 0.75) {
              b.attackType = 'toxic_gas';
              for (let i = 0; i < 10; i++) {
                const a = (Math.PI * 2 / 10) * i;
                s.projectiles.push({
                  x: b.x + b.width / 2, y: b.y + b.height / 2,
                  width: 15, height: 15,
                  velocityX: Math.cos(a) * 5, velocityY: Math.sin(a) * 5,
                  isPlayerProjectile: false, damage: 2, lifetime: 70,
                });
              }
              b.attackCooldown = 45;
            } else {
              b.attackType = 'charge';
              b.direction = p.x < b.x ? -1 : 1;
              b.velocityX = b.direction * 5;
              b.attackCooldown = 60;
            }
          }
        } else {
          // COLOSSUS BOSS AI (original)
          const rng = Math.random();
          if (rng < 0.4) {
            b.attackType = 'charge';
            b.direction = p.x < b.x ? -1 : 1;
            b.velocityX = b.direction * 6;
            b.attackCooldown = 90;
          } else if (rng < 0.7) {
            b.attackType = 'stomp';
            b.velocityY = -15;
            b.attackCooldown = 80;
          } else {
            b.attackType = 'shoot';
            s.projectiles.push({
              x: b.x + b.width / 2,
              y: b.y + b.height / 2,
              width: 15, height: 15,
              velocityX: (p.x < b.x ? -1 : 1) * 7,
              velocityY: -2,
              isPlayerProjectile: false,
              damage: 2,
              lifetime: 120,
            });
            b.attackCooldown = 60;
            spawnParticles(b.x + b.width / 2, b.y + b.height / 2, '#ff4400', 8);
          }
        }
      }

      b.velocityY += GRAVITY;
      if (b.attackType !== 'charge') b.velocityX *= 0.95;
      b.x += b.velocityX;
      b.y += b.velocityY;

      for (const plat of level.platforms) {
        if (
          b.x + b.width > plat.x && b.x < plat.x + plat.width &&
          b.y + b.height > plat.y && b.y + b.height < plat.y + plat.height + 20 &&
          b.velocityY >= 0
        ) {
          b.y = plat.y - b.height;
          b.velocityY = 0;
          if (b.attackType === 'stomp') {
            spawnParticles(b.x + b.width / 2, b.y + b.height, isRottenCore ? '#44aa22' : '#886633', 20);
            b.attackType = 'idle';
            // Rotten Core stomp spawns root projectiles
            if (isRottenCore) {
              for (let i = 0; i < 4; i++) {
                const rootX = b.x + b.width / 2 + (i - 1.5) * 80;
                s.projectiles.push({
                  x: rootX, y: level.groundY - 10,
                  width: 18, height: 18,
                  velocityX: 0, velocityY: -12,
                  isPlayerProjectile: false, damage: 2, lifetime: 40,
                });
                spawnParticles(rootX, level.groundY, '#66ff22', 5);
              }
            }
          }
        }
      }

      if (b.x < 0) { b.x = 0; b.velocityX *= -1; }
      if (b.x > level.width - b.width) { b.x = level.width - b.width; b.velocityX *= -1; }

      // Phase cutscene events
      const phaseEvents = isRottenTank
        ? { 2: 'tank_phase2', 3: 'tank_phase3' }
        : isRottenCore
        ? { 2: 'core_phase2', 3: 'core_phase3' }
        : { 2: 'boss_phase2', 3: 'boss_phase3' };

      // Player attack hits boss
      const bossHitCheck = () => {
        if (p.isLevi) {
          // Levi devour attack on boss — massive damage
          const hasMC = p.leviAbilities.includes('mega_chomp');
          const hasFr = p.leviAbilities.includes('frenzy');
          if (p.isAttacking && p.attackTimer > (hasFr ? 8 : 15)) {
            const dx = (b.x + b.width / 2) - (p.x + p.width / 2);
            const dy = (b.y + b.height / 2) - (p.y + p.height / 2);
            if (Math.sqrt(dx * dx + dy * dy) < (hasMC ? 140 : 100)) {
              b.health -= hasMC ? 6 : 4;
              spawnParticles(b.x + b.width / 2, b.y + b.height / 2, '#ff6600', 12);
              return true;
            }
          }
          return false;
        } else if (p.isAttacking && p.attackTimer > weapon.speed - 5 && !weapon.isRanged) {
          let hit = false;
          if (isAOE) {
            const dx = (b.x + b.width / 2) - aoeCenterX;
            const dy = (b.y + b.height / 2) - aoeCenterY;
            hit = Math.sqrt(dx * dx + dy * dy) < (weapon.aoeRadius ?? 0);
          } else {
            hit = atkX < b.x + b.width && atkX + atkRange > b.x &&
                  atkY < b.y + b.height && atkY + p.height > b.y;
          }
          if (hit) {
            b.health -= weapon.damage;
            spawnParticles(atkX + atkRange / 2, atkY + p.height / 2, weapon.color, 10);
            return true;
          }
          return false;
        }
        return false;
      };
      
      if (bossHitCheck()) {
        if (b.health <= 0) {
          b.health = 0;
          startFinisher();
        }
        if (b.health < b.maxHealth * 0.3 && b.phase < 3) {
          b.phase = 3;
          if (!s.bossPhaseTriggered[3]) {
            s.bossPhaseTriggered[3] = true;
            window.dispatchEvent(new CustomEvent('boss_phase_cutscene', { detail: phaseEvents[3] }));
          }
        } else if (b.health < b.maxHealth * 0.6 && b.phase < 2) {
          b.phase = 2;
          if (!s.bossPhaseTriggered[2]) {
            s.bossPhaseTriggered[2] = true;
            window.dispatchEvent(new CustomEvent('boss_phase_cutscene', { detail: phaseEvents[2] }));
          }
        }
      }
      // Boss damages player
      if (p.invincibleTimer <= 0) {
        if (
          p.x < b.x + b.width && p.x + p.width > b.x &&
          p.y < b.y + b.height && p.y + p.height > b.y
        ) {
          p.health -= isRottenCore ? 3 : 2;
          p.invincibleTimer = 90;
          p.velocityX = (p.x < b.x ? -1 : 1) * 10;
          p.velocityY = -8;
          spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#ff0000', 15);
          if (p.health <= 0) {
            s.gameState = 'gameover';
            setGameState('gameover');
          }
        }
      }
    }

    // Update projectiles
    s.projectiles = s.projectiles.filter(proj => {
      proj.x += proj.velocityX;
      proj.y += proj.velocityY;
      proj.lifetime--;
      if (proj.lifetime <= 0) return false;

      if (proj.isPlayerProjectile) {
        // Player projectile hits enemies
        for (const e of level.enemies) {
          if (!e.isAlive) continue;
          if (
            proj.x < e.x + e.width && proj.x + proj.width > e.x &&
            proj.y < e.y + e.height && proj.y + proj.height > e.y
          ) {
            e.health -= proj.damage;
            e.velocityX = proj.velocityX > 0 ? 5 : -5;
            e.velocityY = -3;
            spawnParticles(e.x + e.width / 2, e.y + e.height / 2, weapon.color, 8);
            if (e.health <= 0) {
              e.isAlive = false;
              s.score += e.type === 'onion' ? 300 : 200;
              spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ffaa00', 15);
              if (Math.random() < 0.4) {
                level.healthPickups.push({
                  x: e.x + e.width / 2 - 12, y: e.y + e.height / 2 - 12,
                  width: 24, height: 24, healAmount: 2, collected: false,
                });
              }
            }
            return false;
          }
        }
        // Player projectile hits boss
        if (level.boss?.isAlive) {
          const b = level.boss;
          if (
            proj.x < b.x + b.width && proj.x + proj.width > b.x &&
            proj.y < b.y + b.height && proj.y + proj.height > b.y
          ) {
            b.health -= proj.damage;
            spawnParticles(proj.x, proj.y, weapon.color, 10);
            if (b.health <= 0) {
              b.health = 0;
              startFinisher();
            }
            const isRC = b.bossType === 'rotten_core';
            const pe = isRC ? { 2: 'core_phase2', 3: 'core_phase3' } : { 2: 'boss_phase2', 3: 'boss_phase3' };
            if (b.health < b.maxHealth * 0.3 && b.phase < 3) {
              b.phase = 3;
              if (!s.bossPhaseTriggered[3]) {
                s.bossPhaseTriggered[3] = true;
                window.dispatchEvent(new CustomEvent('boss_phase_cutscene', { detail: pe[3] }));
              }
            } else if (b.health < b.maxHealth * 0.6 && b.phase < 2) {
              b.phase = 2;
              if (!s.bossPhaseTriggered[2]) {
                s.bossPhaseTriggered[2] = true;
                window.dispatchEvent(new CustomEvent('boss_phase_cutscene', { detail: pe[2] }));
              }
            }
            return false;
          }
        }
      } else {
        // Enemy projectile hits player
        if (p.invincibleTimer <= 0) {
          if (
            p.x < proj.x + proj.width && p.x + p.width > proj.x &&
            p.y < proj.y + proj.height && p.y + proj.height > proj.y
          ) {
            p.health -= proj.damage;
            p.invincibleTimer = 60;
            spawnParticles(proj.x, proj.y, '#ff0000', 8);
            if (p.health <= 0) {
              s.gameState = 'gameover';
              setGameState('gameover');
            }
            return false;
          }
        }
      }
      return true;
    });

    // Update particles
    s.particles = s.particles.filter(pt => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.1;
      pt.life--;
      return pt.life > 0;
    });

    // Camera
    s.cameraX = Math.max(0, Math.min(p.x - CANVAS_W / 3, level.width - CANVAS_W));

    // Check level completion (non-boss)
    if (!level.isBossLevel && !s.transitioning) {
      const allDead = level.enemies.every(e => !e.isAlive);
      if (allDead && p.x > level.width - 100) {
        s.transitioning = true;
        const nextLevel = s.levelNum + 1;
        if (nextLevel <= TOTAL_LEVELS) {
          setScore(s.score);
          const handler = (window as any).__handleLevelTransition;
          if (handler) {
            handler(nextLevel);
          } else {
            setCurrentLevel(nextLevel);
            initLevel(nextLevel);
          }
        }
      }
    }

    p.score = s.score;
    setScore(s.score);
  }, [initLevel, startFinisher]);

  const drawChapterBG = (ctx: CanvasRenderingContext2D, camX: number, chapter: number) => {
    const t = Date.now();
    
    if (chapter === 1) {
      // WITHERED ENTRANCE — Dark corrupted forest
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#0a1a0a');
      skyGrad.addColorStop(0.5, '#0d2810');
      skyGrad.addColorStop(1, '#1a3318');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#ccddaa';
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(700 - camX * 0.05, 80, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Distant corrupted trees
      ctx.fillStyle = '#0a1f0a';
      for (let i = 0; i < 20; i++) {
        const tx = i * 200 - (camX * 0.2) % 400 - 200;
        const th = 200 + Math.sin(i * 1.5) * 80;
        ctx.beginPath();
        ctx.moveTo(tx, CANVAS_H - 100);
        ctx.lineTo(tx + 30, CANVAS_H - 100 - th);
        ctx.lineTo(tx + 60, CANVAS_H - 100);
        ctx.fill();
      }
      // Mechanical roots glowing
      ctx.strokeStyle = '#44ff2266';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const rx = i * 250 - (camX * 0.3) % 500;
        ctx.beginPath();
        ctx.moveTo(rx, CANVAS_H - 100);
        ctx.quadraticCurveTo(rx + 40, CANVAS_H - 140 - Math.sin(t * 0.002 + i) * 20, rx + 80, CANVAS_H - 100);
        ctx.stroke();
      }
    } else if (chapter === 2) {
      // FOG OF STATIC — Eerie fog, glitching reality
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#0a0a1a');
      skyGrad.addColorStop(0.5, '#15152a');
      skyGrad.addColorStop(1, '#1a1a2a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Static glitch bars
      ctx.globalAlpha = 0.04;
      for (let i = 0; i < 6; i++) {
        const gy = (t * 0.5 + i * 150) % CANVAS_H;
        ctx.fillStyle = '#aaccff';
        ctx.fillRect(0, gy, CANVAS_W, 2 + Math.random() * 3);
      }
      ctx.globalAlpha = 1;
      // Fog layers
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#6688aa';
      for (let i = 0; i < 12; i++) {
        const fx = (i * 250 + t * 0.015) % (CANVAS_W + 300) - 150;
        const fy = 250 + Math.sin(t * 0.001 + i * 0.7) * 60;
        ctx.beginPath();
        ctx.arc(fx, fy, 80 + Math.sin(i * 2) * 30, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Dead tree silhouettes
      ctx.fillStyle = '#0f0f22';
      for (let i = 0; i < 15; i++) {
        const tx = i * 200 - (camX * 0.25) % 400 - 200;
        const th = 160 + Math.sin(i * 1.8) * 60;
        ctx.beginPath();
        ctx.moveTo(tx, CANVAS_H - 100);
        ctx.lineTo(tx + 15, CANVAS_H - 100 - th);
        ctx.lineTo(tx + 30, CANVAS_H - 100);
        ctx.fill();
        // Dead branches
        ctx.strokeStyle = '#1a1a33';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx + 15, CANVAS_H - 100 - th * 0.6);
        ctx.lineTo(tx - 20, CANVAS_H - 100 - th * 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx + 15, CANVAS_H - 100 - th * 0.4);
        ctx.lineTo(tx + 50, CANVAS_H - 100 - th * 0.6);
        ctx.stroke();
      }
    } else if (chapter === 3) {
      // IRON ROOTS — Industrial underground, metal tunnels
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#1a0f0a');
      skyGrad.addColorStop(0.3, '#2a1a10');
      skyGrad.addColorStop(0.7, '#1a1510');
      skyGrad.addColorStop(1, '#0f0a05');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Metal girders / pipes in background
      ctx.strokeStyle = '#3a2a1a';
      ctx.lineWidth = 8;
      for (let i = 0; i < 12; i++) {
        const gx = i * 180 - (camX * 0.15) % 360;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, CANVAS_H - 100);
        ctx.stroke();
        // Horizontal beams
        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.moveTo(gx, 150 + i * 30);
          ctx.lineTo(gx + 180, 150 + i * 30);
          ctx.stroke();
        }
      }
      // Pulsing veins on walls
      ctx.strokeStyle = '#ff440044';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const vx = i * 300 - (camX * 0.2) % 600;
        const pulse = Math.sin(t * 0.003 + i) * 0.3 + 0.5;
        ctx.globalAlpha = pulse * 0.3;
        ctx.beginPath();
        ctx.moveTo(vx, CANVAS_H - 100);
        ctx.bezierCurveTo(vx + 30, CANVAS_H - 200, vx + 60, CANVAS_H - 250, vx + 40, CANVAS_H - 350);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Sparks
      ctx.fillStyle = '#ffaa44';
      for (let i = 0; i < 5; i++) {
        if (Math.sin(t * 0.01 + i * 3) > 0.95) {
          const sx = (i * 400 + 200) - (camX * 0.3) % 800;
          ctx.globalAlpha = 0.6;
          ctx.fillRect(sx, 100 + i * 60, 2, 2);
          ctx.fillRect(sx + 3, 103 + i * 60, 2, 2);
          ctx.globalAlpha = 1;
        }
      }
    } else if (chapter === 4) {
      // ROTTING HEART — Flesh & metal, grotesque organic-mechanical
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#1a0505');
      skyGrad.addColorStop(0.3, '#2a0a0a');
      skyGrad.addColorStop(0.6, '#1a0808');
      skyGrad.addColorStop(1, '#0a0303');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Pulsing heartbeat glow
      const heartbeat = Math.sin(t * 0.005) * 0.5 + 0.5;
      ctx.globalAlpha = heartbeat * 0.06;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
      // Fleshy tendrils
      ctx.strokeStyle = '#660022';
      ctx.lineWidth = 6;
      for (let i = 0; i < 10; i++) {
        const tx = i * 250 - (camX * 0.2) % 500;
        const sway = Math.sin(t * 0.002 + i * 1.5) * 15;
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.bezierCurveTo(tx + sway, 150, tx - sway, 300, tx + sway * 0.5, CANVAS_H - 100);
        ctx.stroke();
      }
      // Metal bones
      ctx.fillStyle = '#2a2a2a';
      for (let i = 0; i < 8; i++) {
        const bx = i * 300 - (camX * 0.1) % 600 + 50;
        ctx.fillRect(bx, 200 + Math.sin(i) * 80, 4, 120);
        ctx.fillRect(bx - 10, 200 + Math.sin(i) * 80, 24, 4);
        ctx.fillRect(bx - 10, 316 + Math.sin(i) * 80, 24, 4);
      }
      // Corruption particles floating up
      ctx.fillStyle = '#ff2244';
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 15; i++) {
        const px = (i * 200 + t * 0.02) % CANVAS_W;
        const py = CANVAS_H - 100 - ((t * 0.03 + i * 80) % (CANVAS_H - 100));
        ctx.beginPath();
        ctx.arc(px, py, 2 + Math.sin(t * 0.005 + i) * 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (chapter === 5) {
      // THE ROTTEN CORE — Deep underground, massive tree roots, green toxic glow
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#050a05');
      skyGrad.addColorStop(0.3, '#0a1a08');
      skyGrad.addColorStop(0.6, '#081508');
      skyGrad.addColorStop(1, '#030a03');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Massive root system in background
      ctx.strokeStyle = '#1a3310';
      ctx.lineWidth = 12;
      for (let i = 0; i < 8; i++) {
        const rx = i * 300 - (camX * 0.1) % 600;
        const sway = Math.sin(t * 0.001 + i * 2) * 10;
        ctx.beginPath();
        ctx.moveTo(rx, CANVAS_H);
        ctx.bezierCurveTo(rx + sway + 40, CANVAS_H - 150, rx - sway + 20, CANVAS_H - 300, rx + sway, 0);
        ctx.stroke();
      }
      // Toxic green glow pulsing
      const toxicPulse = Math.sin(t * 0.003) * 0.5 + 0.5;
      ctx.globalAlpha = toxicPulse * 0.06;
      ctx.fillStyle = '#44ff22';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
      // Green energy veins on walls
      ctx.strokeStyle = '#44ff2288';
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const vx = i * 200 - (camX * 0.2) % 400;
        const pulse = Math.sin(t * 0.004 + i * 1.3) * 0.4 + 0.6;
        ctx.globalAlpha = pulse * 0.4;
        ctx.beginPath();
        ctx.moveTo(vx, CANVAS_H - 100);
        ctx.bezierCurveTo(vx + 20, CANVAS_H - 200, vx - 15, CANVAS_H - 320, vx + 10, CANVAS_H - 450);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Floating toxic particles
      ctx.fillStyle = '#66ff44';
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < 20; i++) {
        const px = (i * 150 + t * 0.015) % CANVAS_W;
        const py = CANVAS_H - 80 - ((t * 0.025 + i * 60) % (CANVAS_H - 80));
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + Math.sin(t * 0.006 + i) * 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Ground corruption cracks
      ctx.strokeStyle = '#44ff2244';
      ctx.lineWidth = 1;
      for (let i = 0; i < 15; i++) {
        const cx = i * 180 - (camX * 0.3) % 360;
        ctx.beginPath();
        ctx.moveTo(cx, CANVAS_H - 100);
        ctx.lineTo(cx + (Math.sin(i * 3) * 20), CANVAS_H - 100 - 15 - Math.random() * 10);
        ctx.stroke();
      }
    } else if (chapter === 6) {
      // THE LIVING FACTORY — Industrial bio-mechanical horror
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#0a0a0f');
      skyGrad.addColorStop(0.3, '#151520');
      skyGrad.addColorStop(0.6, '#1a1520');
      skyGrad.addColorStop(1, '#0a0808');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Conveyor belt lines
      ctx.strokeStyle = '#333340';
      ctx.lineWidth = 4;
      for (let i = 0; i < 15; i++) {
        const gx = i * 160 - (camX * 0.15) % 320;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx + 30, CANVAS_H - 100);
        ctx.stroke();
      }
      // Orange molten veins
      ctx.strokeStyle = '#ff440066';
      ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        const vx = i * 250 - (camX * 0.2) % 500;
        const pulse = Math.sin(t * 0.003 + i * 1.7) * 0.4 + 0.6;
        ctx.globalAlpha = pulse * 0.5;
        ctx.beginPath();
        ctx.moveTo(vx, CANVAS_H - 100);
        ctx.bezierCurveTo(vx + 30, CANVAS_H - 180, vx - 20, CANVAS_H - 280, vx + 15, CANVAS_H - 400);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Sparks & embers
      ctx.fillStyle = '#ff6600';
      for (let i = 0; i < 12; i++) {
        const px = (i * 200 + t * 0.02) % CANVAS_W;
        const py = CANVAS_H - 80 - ((t * 0.04 + i * 50) % (CANVAS_H - 80));
        ctx.globalAlpha = 0.3 + Math.sin(t * 0.008 + i) * 0.2;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (chapter === 7) {
      // THE ROTTEN CORE CHAMBER — Final boss arena
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#030803');
      skyGrad.addColorStop(0.3, '#0a1a08');
      skyGrad.addColorStop(0.5, '#081508');
      skyGrad.addColorStop(1, '#020502');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Massive pulsing roots
      ctx.strokeStyle = '#1a3310';
      ctx.lineWidth = 16;
      for (let i = 0; i < 10; i++) {
        const rx = i * 250 - (camX * 0.08) % 500;
        const sway = Math.sin(t * 0.001 + i * 1.8) * 12;
        ctx.beginPath();
        ctx.moveTo(rx, CANVAS_H);
        ctx.bezierCurveTo(rx + sway + 50, CANVAS_H - 180, rx - sway + 25, CANVAS_H - 350, rx + sway, -50);
        ctx.stroke();
      }
      // Intense toxic glow
      const toxicPulse = Math.sin(t * 0.004) * 0.5 + 0.5;
      ctx.globalAlpha = toxicPulse * 0.08;
      ctx.fillStyle = '#44ff22';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = toxicPulse * 0.04;
      ctx.fillStyle = '#ff2200';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
      // Floating spores
      ctx.fillStyle = '#66ff44';
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 25; i++) {
        const px = (i * 120 + t * 0.012) % CANVAS_W;
        const py = CANVAS_H - 60 - ((t * 0.02 + i * 45) % (CANVAS_H - 60));
        ctx.beginPath();
        ctx.arc(px, py, 2 + Math.sin(t * 0.005 + i) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    if (s.gameState !== 'playing' || !s.player || !s.level) return;

    const p = s.player;
    const camX = s.cameraX;
    const weapon = WEAPONS[p.currentWeapon];

    // Screen shake from finisher
    const f = s.finisher;
    if (f.screenShake > 0) {
      ctx.save();
      const shakeX = (Math.random() - 0.5) * f.screenShake * 2;
      const shakeY = (Math.random() - 0.5) * f.screenShake * 2;
      ctx.translate(shakeX, shakeY);
    }

    drawChapterBG(ctx, camX, s.level.chapter);

    // Chapter-themed platform colors
    const ch = s.level.chapter;
    const groundColors = ch === 1 ? ['#2a4a1a','#1a3310','#0a1a05','#44aa22']
      : ch === 2 ? ['#1a1a3a','#151530','#0a0a1a','#4455aa']
      : ch === 3 ? ['#3a2a1a','#2a1a10','#1a0f05','#aa6622']
      : ch === 5 ? ['#1a2a1a','#0a1a0a','#051005','#44ff22']
      : ch === 6 ? ['#2a2028','#1a1520','#0a0a10','#aa4466']
      : ch === 7 ? ['#1a2a1a','#0a1a0a','#051005','#44ff22']
      : ['#3a1a1a','#2a0a0a','#1a0505','#aa2222'];
    const platColors = ch === 1 ? ['#3a2a1a','#2a5a15','#227711']
      : ch === 2 ? ['#2a2a3a','#3344aa','#2233aa']
      : ch === 3 ? ['#4a3a2a','#aa7733','#886622']
      : ch === 5 ? ['#2a3a2a','#44aa22','#227711']
      : ch === 6 ? ['#3a2a30','#aa4466','#883355']
      : ch === 7 ? ['#2a3a2a','#44aa22','#227711']
      : ['#3a2020','#aa3333','#882222'];

    // Draw platforms
    for (const plat of s.level.platforms) {
      const px = plat.x - camX;
      if (px + plat.width < -50 || px > CANVAS_W + 50) continue;
      
      if (plat.height > 50) {
        const groundGrad = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.height);
        groundGrad.addColorStop(0, groundColors[0]);
        groundGrad.addColorStop(0.1, groundColors[1]);
        groundGrad.addColorStop(1, groundColors[2]);
        ctx.fillStyle = groundGrad;
        ctx.fillRect(px, plat.y, plat.width, plat.height);
        ctx.strokeStyle = groundColors[3];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px, plat.y);
        ctx.lineTo(px + plat.width, plat.y);
        ctx.stroke();
      } else {
        ctx.fillStyle = platColors[0];
        ctx.fillRect(px, plat.y, plat.width, plat.height);
        ctx.fillStyle = platColors[1];
        ctx.fillRect(px, plat.y, plat.width, 4);
        ctx.strokeStyle = platColors[2];
        ctx.lineWidth = 1;
        for (let v = px + 10; v < px + plat.width; v += 30) {
          ctx.beginPath();
          ctx.moveTo(v, plat.y + plat.height);
          ctx.lineTo(v + 5, plat.y + plat.height + 15);
          ctx.stroke();
        }
      }
    }

    // Draw weapon pickups
    for (const wp of s.level.weaponPickups) {
      if (wp.collected) continue;
      const wpx = wp.x - camX;
      if (wpx + wp.width < -50 || wpx > CANVAS_W + 50) continue;
      const wDef = WEAPONS[wp.weapon];
      const t = Date.now() * 0.003;
      const floatY = wp.y + Math.sin(t) * 5;
      
      // Glow
      ctx.save();
      ctx.shadowColor = wDef.glowColor;
      ctx.shadowBlur = 15 + Math.sin(t * 2) * 5;
      ctx.fillStyle = wDef.color;
      ctx.beginPath();
      ctx.arc(wpx + wp.width / 2, floatY + wp.height / 2, wp.width / 2 + 2, 0, Math.PI * 2);
      ctx.fill();
      // Inner diamond shape
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      const cx = wpx + wp.width / 2;
      const cy = floatY + wp.height / 2;
      ctx.moveTo(cx, cy - 8);
      ctx.lineTo(cx + 6, cy);
      ctx.lineTo(cx, cy + 8);
      ctx.lineTo(cx - 6, cy);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.restore();
      
      // Label
      ctx.fillStyle = wDef.color;
      ctx.font = '10px MedievalSharp';
      ctx.textAlign = 'center';
      ctx.fillText(wDef.name, wpx + wp.width / 2, floatY - 10);
    }

    // Draw health pickups
    for (const hp of s.level.healthPickups) {
      if (hp.collected) continue;
      const hpx = hp.x - camX;
      if (hpx + hp.width < -50 || hpx > CANVAS_W + 50) continue;
      const t = Date.now() * 0.003;
      const floatY = hp.y + Math.sin(t + hp.x) * 4;
      
      // Green glow
      ctx.save();
      ctx.shadowColor = '#44ff44';
      ctx.shadowBlur = 12 + Math.sin(t * 2) * 4;
      // Heart shape
      ctx.fillStyle = '#44ff44';
      const cx = hpx + hp.width / 2;
      const cy = floatY + hp.height / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 6);
      ctx.bezierCurveTo(cx - 8, cy - 2, cx - 12, cy - 8, cx, cy - 4);
      ctx.bezierCurveTo(cx + 12, cy - 8, cx + 8, cy - 2, cx, cy + 6);
      ctx.fill();
      // + symbol
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.9;
      ctx.fillRect(cx - 1, cy - 5, 2, 8);
      ctx.fillRect(cx - 4, cy - 2, 8, 2);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Draw Levi ability pickups
    for (const ap of s.level.leviAbilityPickups) {
      if (ap.collected) continue;
      const apx = ap.x - camX;
      if (apx + ap.width < -50 || apx > CANVAS_W + 50) continue;
      const aDef = LEVI_ABILITIES[ap.ability];
      const t = Date.now() * 0.003;
      const floatY = ap.y + Math.sin(t * 1.2 + ap.x) * 6;
      ctx.save();
      ctx.shadowColor = aDef.glowColor;
      ctx.shadowBlur = 18 + Math.sin(t * 2) * 6;
      ctx.fillStyle = aDef.color;
      ctx.beginPath();
      ctx.arc(apx + ap.width / 2, floatY + ap.height / 2, ap.width / 2 + 3, 0, Math.PI * 2);
      ctx.fill();
      // Fang icon
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.9;
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🦷', apx + ap.width / 2, floatY + ap.height / 2 + 5);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.restore();
      // Label
      ctx.fillStyle = aDef.color;
      ctx.font = '10px MedievalSharp';
      ctx.textAlign = 'center';
      ctx.fillText(aDef.name, apx + ap.width / 2, floatY - 10);
    }


    for (const e of s.level.enemies) {
      if (!e.isAlive) continue;
      const ex = e.x - camX;
      if (ex + e.width < -50 || ex > CANVAS_W + 50) continue;
      
      const img = s.images[e.type];
      if (img?.complete) {
        ctx.save();
        if (e.direction > 0) {
          ctx.translate(ex + e.width, e.y);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, e.width, e.height);
        } else {
          ctx.drawImage(img, ex, e.y, e.width, e.height);
        }
        ctx.restore();
      }

      if (e.health < e.maxHealth) {
        ctx.fillStyle = '#330000';
        ctx.fillRect(ex, e.y - 10, e.width, 5);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(ex, e.y - 10, e.width * (e.health / e.maxHealth), 5);
      }
    }

    // Draw boss
    if (s.level.boss?.isAlive) {
      const b = s.level.boss;
      const bx = b.x - camX;
      const isRC = b.bossType === 'rotten_core';
      const bossImage = isRC ? s.images.rottenCore : s.images.boss;
      
      if (bossImage?.complete) {
        ctx.save();
        if (isRC) {
          // Rotten Core: green toxic glow based on phase
          ctx.shadowColor = b.phase >= 3 ? '#ff2200' : b.phase >= 2 ? '#44ff22' : '#22aa11';
          ctx.shadowBlur = 25 + Math.sin(Date.now() * 0.003) * 15;
        } else {
          ctx.shadowColor = b.phase >= 3 ? '#ff0000' : b.phase >= 2 ? '#ff6600' : '#ff9900';
          ctx.shadowBlur = 20 + Math.sin(Date.now() * 0.005) * 10;
        }
        if (b.direction > 0) {
          ctx.translate(bx + b.width, b.y);
          ctx.scale(-1, 1);
          ctx.drawImage(bossImage, 0, 0, b.width, b.height);
        } else {
          ctx.drawImage(bossImage, bx, b.y, b.width, b.height);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Boss health bar
      const bossBarColor = isRC
        ? (b.phase >= 3 ? '#ff2200' : b.phase >= 2 ? '#44ff22' : '#22aa11')
        : (b.phase >= 3 ? '#ff2200' : b.phase >= 2 ? '#ff6600' : '#ff9900');
      ctx.fillStyle = '#330000';
      ctx.fillRect(CANVAS_W / 2 - 150, 20, 300, 16);
      ctx.fillStyle = bossBarColor;
      ctx.fillRect(CANVAS_W / 2 - 150, 20, 300 * (b.health / b.maxHealth), 16);
      ctx.strokeStyle = isRC ? '#44ff22' : '#ffaa00';
      ctx.lineWidth = 2;
      ctx.strokeRect(CANVAS_W / 2 - 150, 20, 300, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px MedievalSharp';
      ctx.textAlign = 'center';
      ctx.fillText(isRC ? 'THE ROTTEN CORE' : 'THE ROTTEN COLOSSUS', CANVAS_W / 2, 52);
      
      // Phase indicator for Rotten Core
      if (isRC) {
        const phaseNames = ['The Ancient Tree', 'The Corruption', 'Exposed Core'];
        ctx.fillStyle = bossBarColor;
        ctx.font = '10px MedievalSharp';
        ctx.fillText(`Phase ${b.phase}: ${phaseNames[b.phase - 1]}`, CANVAS_W / 2, 64);
      }
    }

    // Draw player
    const px = p.x - camX;
    const playerImage = p.isLevi ? s.images.levi : s.images.player;
    if (playerImage?.complete) {
      ctx.save();
      if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer / 4) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      // Levi glow effect
      if (p.isLevi) {
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 12 + Math.sin(Date.now() * 0.005) * 5;
      }
      if (!p.facingRight) {
        ctx.translate(px + p.width, p.y);
        ctx.scale(-1, 1);
        ctx.drawImage(playerImage, 0, 0, p.width, p.height);
      } else {
        ctx.drawImage(playerImage, px, p.y, p.width, p.height);
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    
    // Levi devour counter HUD
    if (p.isLevi && p.devouredEnemies > 0) {
      ctx.fillStyle = '#ff660088';
      ctx.fillRect(10, 42, 100, 18);
      ctx.fillStyle = '#ff8800';
      ctx.font = '12px MedievalSharp';
      ctx.textAlign = 'left';
      ctx.fillText(`🍖 Devoured: ${p.devouredEnemies}`, 14, 56);
    }

    // Attack effect
    if (p.isAttacking) {
      if (p.isLevi) {
        // Levi devour bite effect
        const biteX = p.facingRight ? px + p.width : px - 40;
        ctx.save();
        ctx.fillStyle = '#ff660088';
        ctx.beginPath();
        ctx.arc(biteX + 20, p.y + p.height / 2, 30, 0, Math.PI * 2);
        ctx.fill();
        // Chomping jaw lines
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 3;
        const chomp = Math.sin(Date.now() * 0.02) * 10;
        ctx.beginPath();
        ctx.moveTo(biteX, p.y + p.height / 2 - 15 + chomp);
        ctx.lineTo(biteX + 40, p.y + p.height / 2);
        ctx.lineTo(biteX, p.y + p.height / 2 + 15 - chomp);
        ctx.stroke();
        ctx.restore();
      } else if (weapon.aoeRadius) {
        ctx.strokeStyle = weapon.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5;
        const progress = 1 - (p.attackTimer / weapon.speed);
        ctx.beginPath();
        ctx.arc(px + p.width / 2, p.y + p.height / 2, weapon.aoeRadius * progress, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (!weapon.isRanged) {
        const ax = p.facingRight ? px + p.width : px - weapon.range;
        ctx.fillStyle = weapon.color + '66';
        if (weapon.id === 'vine_whip') {
          ctx.strokeStyle = weapon.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          const startX = p.facingRight ? px + p.width : px;
          ctx.moveTo(startX, p.y + p.height / 2);
          const endX = p.facingRight ? px + p.width + weapon.range : px - weapon.range;
          ctx.quadraticCurveTo(
            (startX + endX) / 2, p.y + p.height / 2 - 30,
            endX, p.y + p.height / 2 + 10
          );
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(ax + weapon.range / 2, p.y + p.height / 2, weapon.range / 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw projectiles
    for (const proj of s.projectiles) {
      const ppx = proj.x - camX;
      const projColor = proj.isPlayerProjectile ? weapon.color : '#ff4400';
      ctx.fillStyle = projColor;
      ctx.shadowColor = projColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ppx + proj.width / 2, proj.y + proj.height / 2, proj.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw particles
    for (const pt of s.particles) {
      const ptx = pt.x - camX;
      ctx.globalAlpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;
      ctx.fillRect(ptx, pt.y, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // HUD
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(10, 10, 204, 24);
    ctx.fillStyle = '#330000';
    ctx.fillRect(12, 12, 200, 20);
    const healthPct = p.health / p.maxHealth;
    const hGrad = ctx.createLinearGradient(12, 0, 212, 0);
    hGrad.addColorStop(0, '#ff2200');
    hGrad.addColorStop(1, '#ff6644');
    ctx.fillStyle = hGrad;
    ctx.fillRect(12, 12, 200 * healthPct, 20);
    ctx.strokeStyle = '#ffaa44';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, 200, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px MedievalSharp';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${p.health}/${p.maxHealth}`, 18, 27);

    // Score & Level
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ccddaa';
    ctx.font = '16px MedievalSharp';
    ctx.fillText(`Score: ${s.score}`, CANVAS_W - 15, 28);
    const chapterNames: Record<number, string> = {
      1: '1-1: The Withered Entrance',
      2: '1-2: Mechanical Roots',
      3: '2-1: Fog Entrance',
      4: '2-2: Static Depths',
      5: '3-1: Metal Tunnels',
      6: '3-2: Pulsing Veins',
      7: '4-1: Corrupted Approach',
      8: '4-2: The Rotting Heart',
      9: '5-1: The Descent',
      10: '5-2: Toxic Tunnels',
      11: '6-1: The Living Factory',
      12: '6-2: Approach to the Core',
      13: '7-1: The Rotten Core',
    };
    ctx.fillText(chapterNames[s.levelNum] || `Level ${s.levelNum}`, CANVAS_W - 15, 48);

    // Weapon HUD (bottom left)
    if (p.isLevi) {
      ctx.fillStyle = '#000000aa';
      ctx.fillRect(10, CANVAS_H - 60, 280, 50);
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, CANVAS_H - 60, 280, 50);
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 14px MedievalSharp';
      ctx.textAlign = 'left';
      ctx.fillText('🦷 SUPER LEVI', 20, CANVAS_H - 38);
      ctx.font = '10px MedievalSharp';
      ctx.fillStyle = '#ccaa88';
      const controls = ['J:Devour', '↑+J:Shoot', 'Jump:Shockwave'];
      if (p.leviAbilities.includes('toxic_spit')) controls.push('↓+J:Spit');
      ctx.fillText(controls.join('  '), 20, CANVAS_H - 18);
    } else {
      ctx.fillStyle = '#000000aa';
      ctx.fillRect(10, CANVAS_H - 60, 220, 50);
      ctx.strokeStyle = weapon.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(10, CANVAS_H - 60, 220, 50);
      ctx.fillStyle = weapon.color;
      ctx.font = 'bold 14px MedievalSharp';
      ctx.textAlign = 'left';
      ctx.fillText(`⚔ ${weapon.name}`, 20, CANVAS_H - 38);
      ctx.font = '11px MedievalSharp';
      ctx.fillStyle = '#aaaaaa';
      const slotText = p.weapons.map((w, i) => {
        const isActive = w === p.currentWeapon;
        return `[${i + 1}]${isActive ? '►' : ' '}${WEAPONS[w].name.substring(0, 8)}`;
      }).join('  ');
      ctx.fillText(slotText.length > 35 ? slotText.substring(0, 35) + '…' : slotText, 20, CANVAS_H - 18);
    }

    // Direction indicator
    if (!s.level.isBossLevel) {
      const allDead = s.level.enemies.every(e => !e.isAlive);
      if (allDead) {
        ctx.fillStyle = '#aaff44';
        ctx.font = '14px MedievalSharp';
        ctx.textAlign = 'center';
        ctx.fillText('→ Go right to proceed →', CANVAS_W / 2, CANVAS_H - 20);
      }
    }

    // === FINISHER RENDERING ===
    if (f.active) {
      // Darken screen edges
      ctx.fillStyle = '#00000066';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      
      if (f.arrowPhase === 'none') {
        const isRC = s.level?.boss?.bossType === 'rotten_core';
        const pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
        ctx.save();
        ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 60);
        ctx.scale(pulseScale, pulseScale);
        ctx.fillStyle = isRC ? '#ff6600' : '#ffdd00';
        ctx.font = 'bold 36px MedievalSharp';
        ctx.textAlign = 'center';
        ctx.fillText(isRC ? 'MASH J TO DEVOUR!' : 'MASH J TO FINISH!', 0, 0);
        ctx.restore();
        
        const meterW = 400;
        const meterH = 30;
        const meterX = (CANVAS_W - meterW) / 2;
        const meterY = CANVAS_H / 2 - 20;
        
        ctx.fillStyle = '#000000aa';
        ctx.fillRect(meterX - 2, meterY - 2, meterW + 4, meterH + 4);
        ctx.fillStyle = isRC ? '#001100' : '#220000';
        ctx.fillRect(meterX, meterY, meterW, meterH);
        
        const fillW = meterW * (f.meter / 100);
        const meterGrad = ctx.createLinearGradient(meterX, 0, meterX + fillW, 0);
        if (isRC) {
          meterGrad.addColorStop(0, '#ff4400');
          meterGrad.addColorStop(0.5, '#ff6600');
          meterGrad.addColorStop(1, '#ff8800');
        } else {
          meterGrad.addColorStop(0, '#ff4400');
          meterGrad.addColorStop(0.5, '#ffaa00');
          meterGrad.addColorStop(1, '#ffdd00');
        }
        ctx.fillStyle = meterGrad;
        ctx.fillRect(meterX, meterY, fillW, meterH);
        
        if (f.meter > 50) {
          ctx.shadowColor = isRC ? '#ff6600' : '#ffaa00';
          ctx.shadowBlur = f.meter / 5;
          ctx.strokeStyle = isRC ? '#ff8800' : '#ffdd00';
          ctx.lineWidth = 2;
          ctx.strokeRect(meterX, meterY, meterW, meterH);
          ctx.shadowBlur = 0;
        }
        
        ctx.strokeStyle = isRC ? '#ff6644' : '#ffaa44';
        ctx.lineWidth = 2;
        ctx.strokeRect(meterX, meterY, meterW, meterH);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px MedievalSharp';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(f.meter)}%`, CANVAS_W / 2, meterY + 22);
        
        if (s.level?.boss) {
          const b = s.level.boss;
          const bx = b.x - camX;
          const t = Date.now() * 0.005;
          ctx.fillStyle = isRC ? '#44ff22' : '#ffdd00';
          ctx.font = '20px serif';
          ctx.textAlign = 'center';
          for (let i = 0; i < 5; i++) {
            const angle = t + (Math.PI * 2 / 5) * i;
            const sx = bx + b.width / 2 + Math.cos(angle) * 50;
            const sy = b.y - 10 + Math.sin(angle) * 15;
            ctx.fillText('★', sx, sy);
          }
        }
      } else if (f.arrowPhase === 'flying') {
        const isRC = s.level?.boss?.bossType === 'rotten_core';
        if (isRC) {
          // Levi devour rush — player is already rendered, show "DEVOUR!" text
          ctx.fillStyle = '#ff6600';
          ctx.globalAlpha = 0.9;
          ctx.font = 'bold 28px MedievalSharp';
          ctx.textAlign = 'center';
          ctx.fillText("SUPER LEVI DEVOURS!", CANVAS_W / 2, CANVAS_H / 2 - 80);
          ctx.globalAlpha = 1;
        } else {
          // Draw the legendary arrow
          const ax = f.arrowX - camX;
          const ay = f.arrowY;
          ctx.save();
          ctx.shadowColor = '#ffdd00';
          ctx.shadowBlur = 30;
          ctx.fillStyle = '#ffdd00';
          ctx.beginPath();
          ctx.moveTo(ax + 40, ay);
          ctx.lineTo(ax, ay - 6);
          ctx.lineTo(ax + 8, ay);
          ctx.lineTo(ax, ay + 6);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#aa8844';
          ctx.fillRect(ax - 30, ay - 2, 30, 4);
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.moveTo(ax - 30, ay);
          ctx.lineTo(ax - 40, ay - 8);
          ctx.lineTo(ax - 25, ay);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(ax - 30, ay);
          ctx.lineTo(ax - 40, ay + 8);
          ctx.lineTo(ax - 25, ay);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.8;
          ctx.font = 'bold 18px MedievalSharp';
          ctx.textAlign = 'center';
          ctx.fillText("ZACHERY'S ARROW!", CANVAS_W / 2, CANVAS_H / 2 - 80);
          ctx.globalAlpha = 1;
        }
      } else if (f.arrowPhase === 'impact' || f.arrowPhase === 'exploding') {
        const isRC = s.level?.boss?.bossType === 'rotten_core';
        if (f.arrowPhase === 'impact' && f.explosionTimer < 5) {
          const flashColor = isRC ? `rgba(68, 255, 34, ${0.8 - f.explosionTimer * 0.15})` : `rgba(255, 255, 255, ${0.8 - f.explosionTimer * 0.15})`;
          ctx.fillStyle = flashColor;
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        }
        
        if (f.arrowPhase === 'impact' && !isRC) {
          const ax = f.arrowX - camX;
          const ay = f.arrowY;
          ctx.save();
          ctx.shadowColor = '#ffdd00';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#ffdd00';
          ctx.beginPath();
          ctx.moveTo(ax + 40, ay);
          ctx.lineTo(ax, ay - 6);
          ctx.lineTo(ax + 8, ay);
          ctx.lineTo(ax, ay + 6);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#aa8844';
          ctx.fillRect(ax - 30, ay - 2, 30, 4);
          ctx.shadowBlur = 0;
          ctx.restore();
        }
        
        if (f.arrowPhase === 'exploding') {
          const bx = f.arrowTargetX - camX;
          const by = f.arrowTargetY;
          const progress = f.explosionTimer / 90;
          const ringColors = isRC
            ? ['#44ff2288', '#88ff4466', '#22aa1144']
            : ['#ff440088', '#ffaa0066', '#ffdd0044'];
          
          for (let ring = 0; ring < 3; ring++) {
            const ringProgress = Math.min(1, (progress * 3 - ring * 0.3));
            if (ringProgress <= 0) continue;
            ctx.strokeStyle = ringColors[ring];
            ctx.lineWidth = 4 - ring;
            ctx.beginPath();
            ctx.arc(bx, by, ringProgress * 200, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          ctx.globalAlpha = Math.max(0, 1 - progress);
          ctx.fillStyle = isRC ? '#44ff22' : '#ffdd00';
          ctx.beginPath();
          ctx.arc(bx, by, 30 * (1 - progress), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    // Restore screen shake transform
    if (f.screenShake > 0) {
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    loadImages();

    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys.add(e.key.toLowerCase());
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    const loop = () => {
      update();
      render();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [loadImages, update, render]);

  return { canvasRef, gameState, score, currentLevel, startGame, beginLevel, setGameStateTo, CANVAS_W, CANVAS_H };
}
