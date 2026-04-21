import { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Player, Enemy, Boss, Projectile, Particle, Platform, Level, WeaponType, WEAPONS, HealthPickup, LeviAbility, LEVI_ABILITIES, CJAbility, CJ_ABILITIES, Companion } from './types';
import { createLevel, TOTAL_LEVELS } from './levels';

import onionImg from '@/assets/OnionEnemy.png';
import eggImg from '@/assets/eggEnemy.png';
import bossImg from '@/assets/finalboss_2.png';
import playerImg from '@/assets/playermodel.png';

// Images in public/ can be referenced by string paths
const rottenCoreImg = '/images/rotten-core.png';
const leviImg = '/images/levi.png';
const cjImg = '/images/cj.png';
const rottenTankImg = '/images/rotten-tank.png';
const jesseImg = '/images/jesse.png';

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
    // Combat roll state
    rollState: {
      isRolling: false,
      rollTimer: 0,
      rollDir: 1,
      lastLeftTime: 0,
      lastRightTime: 0,
      leftWasUp: true,
      rightWasUp: true,
    },
    // Pending airstrike bombs (replaces setTimeout)
    pendingAirstrikes: [] as { x: number; frameDelay: number }[],
    airstrikeWarnings: [] as { x: number; timer: number }[],
    // Flashbang flash overlay timer
    flashbangFlash: 0,
    // Track if E key was just pressed (edge detect)
    eWasUp: true,
    // CJ special selector: 0=grenade, 1=flashbang, 2=airstrike
    cjSpecialIndex: 0,
    eWasUpCycle: true,
    // Chapter 11: Companion AI heroes
    companions: [] as Companion[],
    // Chapter 11: Q key hero cycling
    qWasUp: true,
    heroOrder: ['zachery', 'levi', 'cj'] as ('zachery' | 'levi' | 'cj')[],
    activeHeroIndex: 2, // which hero the player controls (starts as CJ after ch10)
    // Chapter 11: Mech-worm suck mechanic
    suckState: {
      active: false,
      meter: 0,
      jWasUp: true,
    },
  });

  const loadImages = useCallback(() => {
    const srcs = { player: playerImg, onion: onionImg, egg: eggImg, boss: bossImg, rottenCore: rottenCoreImg, levi: leviImg, cj: cjImg, rottenTank: rottenTankImg, jesse: jesseImg };
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
    const isJesse = s.player?.isJesse ?? false;
    const leviMaxHP = 20;
    const zachMaxHP = 10;
    const cjMaxHP = 15;
    const jesseMaxHP = 18;
    const maxHP = isJesse ? jesseMaxHP : isCJ ? cjMaxHP : isLevi ? leviMaxHP : zachMaxHP;
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
      isJesse,
      devouredEnemies: s.player?.devouredEnemies ?? 0,
      leviAbilities: s.player?.leviAbilities ?? [],
      cjAbilities: s.player?.cjAbilities ?? [],
      grenadeCount: s.player?.grenadeCount ?? 3,
      grenadeCooldown: 0,
      ammo: s.player?.ammo ?? 30,
      maxAmmo: isCJ ? 30 : 0,
    };
    
    // Chapter 11+: Initialize AI companion heroes
    if (level.chapter >= 11) {
      // Jesse joins at level 21 (mid-chapter 11)
      if (levelNum >= 21 && !s.heroOrder.includes('jesse')) {
        s.heroOrder = [...s.heroOrder, 'jesse'];
        window.dispatchEvent(new CustomEvent('switch_to_jesse'));
      }
      const heroHP = (h: 'zachery' | 'levi' | 'cj' | 'jesse') =>
        h === 'levi' ? 20 : h === 'jesse' ? 18 : h === 'cj' ? 15 : 10;
      const makeComp = (heroType: 'zachery' | 'levi' | 'cj' | 'jesse', xOff: number): Companion => ({
        x: 50 + xOff, y: level.groundY - 60,
        width: 40, height: 55,
        velocityY: 0, onGround: false,
        facingRight: true,
        health: heroHP(heroType),
        maxHealth: heroHP(heroType),
        heroType,
        attackTimer: 0,
        invincibleTimer: 0,
      });
      const activeHero = s.heroOrder[s.activeHeroIndex];
      // Make sure player type matches
      s.player.isCJ = activeHero === 'cj';
      s.player.isLevi = activeHero === 'levi';
      s.player.isJesse = activeHero === 'jesse';
      s.player.maxHealth = heroHP(activeHero);
      if (s.player.health > s.player.maxHealth) s.player.health = s.player.maxHealth;
      s.companions = s.heroOrder
        .filter(h => h !== activeHero)
        .map((h, i) => makeComp(h, -40 - i * 50));
      s.suckState.active = false;
      s.suckState.meter = 0;
    } else {
      s.companions = [];
    }
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

  // Start at a specific level with a fully-loaded hero (for save resume / dev mode)
  const startAtLevel = useCallback((levelNum: number, hero: 'zachery' | 'levi' | 'cj' | 'jesse' = 'zachery') => {
    const s = stateRef.current;
    s.score = 0;
    s.gameState = 'playing';
    s.bossPhaseTriggered = { 2: false, 3: false };
    resetFinisher();
    setScore(0);

    const allWeapons = ['forest_blade', 'vine_whip', 'static_bolt', 'iron_fist', 'corruption_purge'];
    const allLevi = ['mega_chomp', 'toxic_spit', 'belly_slam', 'frenzy'];
    const allCJ = ['frag_grenade', 'flashbang', 'combat_roll', 'airstrike'];

    // Seed player with full kit for the chosen hero
    s.player = {
      x: 50, y: 0,
      width: 40, height: 55,
      velocityX: 0, velocityY: 0,
      health: hero === 'levi' ? 20 : hero === 'jesse' ? 18 : hero === 'cj' ? 15 : 10,
      maxHealth: hero === 'levi' ? 20 : hero === 'jesse' ? 18 : hero === 'cj' ? 15 : 10,
      isAttacking: false, attackTimer: 0,
      facingRight: true, isJumping: false, onGround: false,
      invincibleTimer: 0, score: 0,
      currentWeapon: hero === 'cj' ? 'iron_fist' : 'forest_blade',
      weapons: allWeapons,
      isLevi: hero === 'levi',
      isCJ: hero === 'cj',
      isJesse: hero === 'jesse',
      devouredEnemies: 0,
      leviAbilities: allLevi,
      cjAbilities: allCJ,
      grenadeCount: 3,
      grenadeCooldown: 0,
      ammo: 30,
      maxAmmo: hero === 'cj' ? 30 : 0,
    };

    // Reset hero order so chapter 11 init logic re-evaluates companions properly
    s.heroOrder = ['zachery', 'levi', 'cj'];
    s.activeHeroIndex = hero === 'zachery' ? 0 : hero === 'levi' ? 1 : 2;
    if (hero === 'jesse') {
      s.heroOrder = ['zachery', 'levi', 'cj', 'jesse'];
      s.activeHeroIndex = 3;
    }

    setCurrentLevel(levelNum);
    initLevel(levelNum);
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
        const isTank = s.level.boss?.bossType === 'rotten_tank';
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
        } else if (isTank) {
          // CJ BULLET BARRAGE: CJ dashes toward tank spraying bullets
          const p = s.player!;
          const targetX = f.arrowTargetX - p.width - 30;
          const dx = targetX - p.x;
          p.x += Math.sign(dx) * 12;
          p.facingRight = dx > 0;
          // Muzzle flash particles every other frame
          if (Math.floor(f.explosionTimer) % 2 === 0) {
            const muzzX = p.facingRight ? p.x + p.width + 15 : p.x - 15;
            const muzzY = p.y + p.height / 2 - 5;
            spawnParticles(muzzX, muzzY, '#ffee44', 4);
            spawnParticles(muzzX, muzzY, '#ffffff', 2);
            // Bullet streak toward boss
            s.particles.push({
              x: muzzX, y: muzzY + (Math.random() - 0.5) * 20,
              vx: (p.facingRight ? 1 : -1) * (18 + Math.random() * 6),
              vy: (Math.random() - 0.5) * 2,
              life: 12, maxLife: 12,
              color: '#ffee88', size: 3,
            });
            // Spent shell casing ejection
            s.particles.push({
              x: p.x + p.width / 2, y: p.y + p.height / 2 - 10,
              vx: (p.facingRight ? -3 : 3) + (Math.random() - 0.5) * 2,
              vy: -4 - Math.random() * 3,
              life: 25, maxLife: 25,
              color: '#ccaa22', size: 3,
            });
          }
          f.explosionTimer++;
          f.screenShake = 5;
          if (Math.abs(dx) < 35) {
            f.arrowPhase = 'impact';
            f.explosionTimer = 0;
            f.screenShake = 30;
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
        const isTank = s.level.boss?.bossType === 'rotten_tank';
        f.explosionTimer++;
        f.screenShake = Math.max(0, 20 - f.explosionTimer);
        
        if (!isRC && !isTank) f.arrowX += 20;
        
        if (f.explosionTimer === 1) {
          const bx = f.arrowTargetX;
          const by = f.arrowTargetY;
          if (isTank) {
            // Massive bullet impact burst — yellow/white/orange
            for (let i = 0; i < 60; i++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 6 + Math.random() * 14;
              s.particles.push({
                x: bx + (Math.random() - 0.5) * 40, y: by + (Math.random() - 0.5) * 40,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 35 + Math.random() * 25, maxLife: 60,
                color: ['#ffee44','#ffffff','#ff8800','#ffcc00','#ff4400'][Math.floor(Math.random() * 5)],
                size: 3 + Math.random() * 9,
              });
            }
            // Casings rain from above
            for (let i = 0; i < 20; i++) {
              s.particles.push({
                x: bx + (Math.random() - 0.5) * 200, y: by - 80,
                vx: (Math.random() - 0.5) * 5,
                vy: -2 - Math.random() * 5,
                life: 40 + Math.random() * 20, maxLife: 60,
                color: '#ccaa22', size: 3,
              });
            }
          } else {
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
        }
        
        if (f.explosionTimer === 30) {
          f.arrowPhase = 'exploding';
          f.explosionTimer = 0;
        }
      } else if (f.arrowPhase === 'exploding') {
        const isRC = s.level.boss?.bossType === 'rotten_core';
        const isTank = s.level.boss?.bossType === 'rotten_tank';
        f.explosionTimer++;
        f.screenShake = Math.max(0, 15 - f.explosionTimer * 0.5);
        
        if (isTank) {
          // Multiple staggered mini bullet explosions across the tank body
          if (f.explosionTimer % 5 === 1 && f.explosionTimer < 70) {
            const bx = f.arrowTargetX + (Math.random() - 0.5) * 100;
            const by = f.arrowTargetY + (Math.random() - 0.5) * 60;
            for (let i = 0; i < 18; i++) {
              const ang = (Math.PI * 2 / 18) * i;
              const spd = 3 + (f.explosionTimer / 70) * 5;
              s.particles.push({
                x: bx, y: by,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 35 + Math.random() * 20, maxLife: 55,
                color: ['#ffee44','#ff8800','#ff4400','#ffffff'][Math.floor(Math.random() * 4)],
                size: 2 + Math.random() * 7,
              });
            }
            // Accompanying casing spray
            s.particles.push({
              x: bx, y: by,
              vx: (Math.random() - 0.5) * 6,
              vy: -5 - Math.random() * 4,
              life: 30, maxLife: 30,
              color: '#ccaa22', size: 3,
            });
          }
        } else if (f.explosionTimer % 8 === 1 && f.explosionTimer < 50) {
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
          } else if (bType === 'mech_worm') {
            // Iron Maw destroyed — true ending!
            window.dispatchEvent(new CustomEvent('play_cutscene', { detail: 'true_ending' }));
            setTimeout(() => {
              s.gameState = 'victory';
              setGameState('victory');
              setScore(s.score);
            }, 500);
          } else if (bType === 'rotten_tank') {
            // Rotten Tank defeated → advance into Chapter 11 (level 19)
            // Player remains CJ; cutscenes ('ending' + 'chapter11_start') play before level 19
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
            // Fallback victory
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

    // ─── CHAPTER 11: Q key hero cycling ────────────────────────────────────
    if (level.chapter >= 11 && s.companions.length > 0 && !s.suckState.active) {
      const qDown = keys.has('q');
      if (qDown && s.qWasUp) {
        s.qWasUp = false;
        // Cycle to next hero
        const prevIdx = s.activeHeroIndex;
        s.activeHeroIndex = (s.activeHeroIndex + 1) % s.heroOrder.length;
        const newHero = s.heroOrder[s.activeHeroIndex];
        const prevHero = s.heroOrder[prevIdx];

        // Find the companion who is the new hero
        const newCompIdx = s.companions.findIndex(c => c.heroType === newHero);
        if (newCompIdx !== -1) {
          const newComp = s.companions[newCompIdx];
          // The old player becomes a companion at their current position
          const oldX = p.x; const oldY = p.y; const oldFacing = p.facingRight;
          const oldHealth = p.health; const oldMaxHealth = p.maxHealth;

          // Swap player to be the new hero
          p.x = newComp.x; p.y = newComp.y;
          p.facingRight = newComp.facingRight;
          p.health = newComp.health; p.maxHealth = newComp.maxHealth;
          p.isCJ = newHero === 'cj';
          p.isLevi = newHero === 'levi';
          p.isJesse = newHero === 'jesse';
          if (p.isCJ) { p.ammo = p.ammo || 30; p.maxAmmo = 30; }
          else { p.maxAmmo = 0; }
          if (newHero === 'jesse') {
            window.dispatchEvent(new CustomEvent('switch_to_jesse'));
          } else if (newHero === 'cj') {
            window.dispatchEvent(new CustomEvent('switch_to_cj'));
          } else if (newHero === 'levi') {
            window.dispatchEvent(new CustomEvent('switch_to_levi'));
          } else {
            window.dispatchEvent(new CustomEvent('switch_to_zachery'));
          }
          p.velocityX = 0; p.velocityY = 0;

          // Replace companion slot with old hero
          s.companions[newCompIdx] = {
            x: oldX, y: oldY,
            width: 40, height: 55,
            velocityY: 0, onGround: p.onGround,
            facingRight: oldFacing,
            health: oldHealth, maxHealth: oldMaxHealth,
            heroType: prevHero,
            attackTimer: 0,
            invincibleTimer: 0,
          };

          // Spawn swap particles
          spawnParticles(p.x + 20, p.y + 28, '#ffffff', 10);
          spawnParticles(p.x + 20, p.y + 28, '#aaddff', 8);
        }
      }
      if (!keys.has('q')) s.qWasUp = true;
    }

    // ─── CHAPTER 11: Suck escape mechanic ──────────────────────────────────
    if (s.suckState.active) {
      const jDown = keys.has('j') || keys.has('z');
      if (jDown && s.suckState.jWasUp) {
        s.suckState.jWasUp = false;
        s.suckState.meter = Math.min(100, s.suckState.meter + 5);
        // Small flash on mash
        spawnParticles(p.x + 20, p.y + 28, '#ffffff', 3);
      }
      if (!jDown) s.suckState.jWasUp = true;
      // Decay slightly
      s.suckState.meter = Math.max(0, s.suckState.meter - 0.3);

      // Lock player inside the worm maw
      if (level.boss && level.boss.isAlive) {
        const b = level.boss;
        p.x = b.x + b.width / 2 - p.width / 2;
        p.y = b.y + 20;
        p.velocityX = 0; p.velocityY = 0;
        p.facingRight = false;
      }

      // Escape when meter full
      if (s.suckState.meter >= 100) {
        s.suckState.active = false;
        s.suckState.meter = 0;
        // Damage the boss
        if (level.boss) {
          level.boss.health -= 12;
          if (level.boss.health < 0) level.boss.health = 0;
        }
        spawnParticles(p.x + 20, p.y + 28, '#ffee44', 20);
        spawnParticles(p.x + 20, p.y + 28, '#ffffff', 15);
        // Launch player away from boss
        p.velocityY = -12;
        if (level.boss) p.velocityX = p.x < level.boss.x ? -6 : 6;
        p.invincibleTimer = 60;
      }
      // While sucked, skip normal player update but still update everything else
      // (boss, enemies, companions, particles)
    }

    // ─── CHAPTER 11: Companion AI update ────────────────────────────────────
    if (level.chapter >= 11 && s.companions.length > 0) {
      for (const comp of s.companions) {
        if (comp.invincibleTimer > 0) comp.invincibleTimer--;
        if (comp.attackTimer > 0) comp.attackTimer--;

        // Gravity
        if (!comp.onGround) comp.velocityY += GRAVITY;
        comp.y += comp.velocityY;

        // Ground collision
        comp.onGround = false;
        for (const plat of level.platforms) {
          if (comp.x + comp.width > plat.x && comp.x < plat.x + plat.width &&
              comp.y + comp.height >= plat.y && comp.y + comp.height <= plat.y + comp.velocityY + 10 &&
              comp.velocityY >= 0) {
            comp.y = plat.y - comp.height;
            comp.velocityY = 0;
            comp.onGround = true;
          }
        }

        // Follow the player (target position: 60-80px behind)
        const followX = p.x - (comp.heroType === s.companions[0]?.heroType ? 60 : 110);
        const dx = followX - comp.x;
        if (Math.abs(dx) > 10) {
          comp.x += Math.sign(dx) * Math.min(3.5, Math.abs(dx));
          comp.facingRight = dx > 0;
        }
        // Jump if player is higher and companion is on ground
        if (p.y < comp.y - 80 && comp.onGround) {
          comp.velocityY = JUMP_FORCE * 0.9;
          comp.onGround = false;
        }

        // Auto-attack nearby enemies (once per 50 frames)
        if (comp.attackTimer <= 0) {
          for (const e of level.enemies) {
            if (!e.isAlive) continue;
            const ex = Math.abs(e.x - comp.x);
            if (ex < 120) {
              // Deal damage to nearest enemy
              e.health -= comp.heroType === 'levi' ? 3 : comp.heroType === 'jesse' ? 3 : comp.heroType === 'cj' ? 2 : 2;
              if (e.health <= 0) {
                e.health = 0; e.isAlive = false;
                s.score += 100;
                spawnParticles(e.x + e.width / 2, e.y + e.height / 2,
                  comp.heroType === 'levi' ? '#ff6600' : comp.heroType === 'cj' ? '#ffee44' : comp.heroType === 'jesse' ? '#ff8822' : '#aaff44', 8);
              }
              comp.attackTimer = 50;
              comp.facingRight = e.x > comp.x;
              break;
            }
          }
          // Also damage the boss if close
          if (level.boss && level.boss.isAlive && !s.suckState.active) {
            const bx = Math.abs(level.boss.x + level.boss.width / 2 - comp.x);
            if (bx < 150) {
              level.boss.health -= 1;
              comp.attackTimer = 40;
              comp.facingRight = level.boss.x > comp.x;
              spawnParticles(level.boss.x + level.boss.width / 2, level.boss.y + 30,
                comp.heroType === 'cj' ? '#ffee44' : comp.heroType === 'jesse' ? '#ff8822' : '#aaff44', 4);
            }
          }
        }

        // Companions take damage from enemies
        if (comp.invincibleTimer <= 0) {
          for (const e of level.enemies) {
            if (!e.isAlive) continue;
            const ex = Math.abs(e.x - comp.x);
            if (ex < 60) {
              comp.health = Math.max(0, comp.health - 1);
              comp.invincibleTimer = 60;
              break;
            }
          }
        }
      }
    }

    // Weapon switching with number keys
    for (let i = 0; i < p.weapons.length; i++) {
      if (keys.has(`${i + 1}`)) {
        p.currentWeapon = p.weapons[i];
      }
    }

    // Player movement
    if (s.suckState.active) {
      // Skip movement when sucked
    } else if (keys.has('arrowleft') || keys.has('a')) {
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

    // === J KEY: Primary attack only (no modifier combos) ===
    if (keys.has('z') || keys.has('j')) {
      if (!p.isAttacking && p.attackTimer <= 0) {
        p.isAttacking = true;

        if (p.isCJ) {
          // CJ J = shoot glock (primary only)
          p.attackTimer = 12;
          if (p.ammo > 0) {
            p.ammo--;
            s.projectiles.push({
              x: p.x + (p.facingRight ? p.width : -10),
              y: p.y + p.height / 2 - 3,
              width: 10, height: 5,
              velocityX: (p.facingRight ? 1 : -1) * 18,
              velocityY: 0,
              isPlayerProjectile: true,
              damage: 3, lifetime: 60,
              isGlockBullet: true,
            });
            spawnParticles(p.x + (p.facingRight ? p.width + 5 : -5), p.y + p.height / 2, '#ffee88', 4);
            spawnParticles(p.x + (p.facingRight ? p.width + 12 : -12), p.y + p.height / 2, '#ffffff', 2);
          } else {
            // Pistol whip when empty
            p.attackTimer = 22;
            spawnParticles(p.x + (p.facingRight ? p.width + 10 : -10), p.y + p.height / 2, '#aaaaaa', 6);
          }

        } else if (p.isLevi) {
          // LEVI J = devour (primary melee)
          const hasFrenzy = p.leviAbilities.includes('frenzy');
          p.attackTimer = hasFrenzy ? 12 : 20;
          spawnParticles(p.x + (p.facingRight ? p.width + 15 : -15), p.y + p.height / 2, '#ff6600', 10);

        } else if (p.isJesse) {
          // JESSE J = throw bouncing basketball
          p.attackTimer = 16;
          s.projectiles.push({
            x: p.x + (p.facingRight ? p.width : -14),
            y: p.y + p.height / 2 - 8,
            width: 16, height: 16,
            velocityX: (p.facingRight ? 1 : -1) * 12,
            velocityY: -2,
            isPlayerProjectile: true,
            damage: 4, lifetime: 110,
            isBasketball: true,
            bouncesLeft: 3,
          });
          spawnParticles(p.x + (p.facingRight ? p.width : 0), p.y + p.height / 2, '#ff8822', 6);

        } else {
          // ZACHERY: attack with current weapon
          p.attackTimer = weapon.speed;
          if (weapon.isRanged && weapon.projectileSpeed) {
            s.projectiles.push({
              x: p.x + (p.facingRight ? p.width : -15),
              y: p.y + p.height / 2 - 7,
              width: 15, height: 15,
              velocityX: (p.facingRight ? 1 : -1) * weapon.projectileSpeed,
              velocityY: 0,
              isPlayerProjectile: true,
              damage: weapon.damage, lifetime: 80,
              weaponId: weapon.id,
            });
            spawnParticles(p.x + (p.facingRight ? p.width : 0), p.y + p.height / 2, weapon.color, 8);
          } else if (weapon.aoeRadius) {
            spawnParticles(p.x + p.width / 2, p.y + p.height / 2, weapon.color, 24);
          } else {
            spawnParticles(p.x + (p.facingRight ? p.width + 20 : -20), p.y + p.height / 2, weapon.color, 6);
          }
        }
      }
    }

    // === E KEY: Special abilities for CJ and Levi ===
    const eDown = keys.has('e');
    if (eDown && s.eWasUp) {
      s.eWasUp = false;

      if (p.isCJ) {
        // Cycle cjSpecialIndex when E held and no cooldown
        // Determine available specials in order
        const availableSpecials: ('grenade' | 'flashbang' | 'airstrike')[] = [];
        if (p.cjAbilities.includes('frag_grenade')) availableSpecials.push('grenade');
        if (p.cjAbilities.includes('flashbang')) availableSpecials.push('flashbang');
        if (p.cjAbilities.includes('airstrike')) availableSpecials.push('airstrike');

        if (availableSpecials.length > 0 && p.attackTimer <= 0) {
          // Keep index in bounds
          s.cjSpecialIndex = s.cjSpecialIndex % availableSpecials.length;
          const special = availableSpecials[s.cjSpecialIndex];
          // Advance index for next press
          s.cjSpecialIndex = (s.cjSpecialIndex + 1) % availableSpecials.length;

          if (special === 'grenade' && p.grenadeCount > 0) {
            p.grenadeCount--;
            p.attackTimer = 22;
            s.projectiles.push({
              x: p.x + (p.facingRight ? p.width : -15),
              y: p.y + p.height / 2 - 5,
              width: 14, height: 14,
              velocityX: (p.facingRight ? 1 : -1) * 9,
              velocityY: -3,
              isPlayerProjectile: true,
              damage: 8, lifetime: 55,
              isGrenade: true, grenadeTimer: 55, aoeRadius: 130,
            });
            spawnParticles(p.x + (p.facingRight ? p.width : 0), p.y + p.height / 2, '#44aa44', 12);

          } else if (special === 'flashbang') {
            p.attackTimer = 70;
            s.flashbangFlash = 25;
            spawnParticles(p.x + p.width / 2, p.y, '#ffffff', 40);
            spawnParticles(p.x + p.width / 2, p.y, '#ffffaa', 30);
            for (const e of level.enemies) {
              if (!e.isAlive) continue;
              const ex = e.x - s.cameraX;
              if (ex > -100 && ex < 1060) {
                e.stunTimer = 180;
                e.velocityX = 0;
                spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ffffaa', 12);
                spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ffffff', 8);
              }
            }
            if (level.boss?.isAlive) level.boss.attackCooldown = 120;

          } else if (special === 'airstrike') {
            p.attackTimer = 100;
            for (let i = 0; i < 8; i++) {
              const strikeX = p.x + (Math.random() - 0.5) * 500;
              s.pendingAirstrikes.push({ x: strikeX, frameDelay: i * 6 });
              s.airstrikeWarnings.push({ x: strikeX, timer: i * 6 + 20 });
            }
            spawnParticles(p.x + p.width / 2, p.y - 20, '#ff4444', 20);
            spawnParticles(p.x + p.width / 2, p.y - 10, '#ffaa00', 15);
          }
        }

      } else if (p.isJesse && p.attackTimer <= 0) {
        // JESSE E = football pass — fast piercing spiral
        p.attackTimer = 28;
        p.isAttacking = true;
        s.projectiles.push({
          x: p.x + (p.facingRight ? p.width : -22),
          y: p.y + p.height / 2 - 6,
          width: 22, height: 12,
          velocityX: (p.facingRight ? 1 : -1) * 22,
          velocityY: 0,
          isPlayerProjectile: true,
          damage: 7, lifetime: 70,
          isFootball: true,
        });
        spawnParticles(p.x + (p.facingRight ? p.width : 0), p.y + p.height / 2, '#aa5533', 10);
        spawnParticles(p.x + (p.facingRight ? p.width + 10 : -10), p.y + p.height / 2, '#ffffff', 4);

      } else if (p.isLevi && p.attackTimer <= 0) {
        // LEVI E = ranged special
        const hasFrenzy = p.leviAbilities.includes('frenzy');
        p.attackTimer = hasFrenzy ? 15 : 25;
        p.isAttacking = true;
        if (p.devouredEnemies > 0) {
          // Shoot devoured enemy as high-damage projectile
          p.devouredEnemies--;
          s.projectiles.push({
            x: p.x + (p.facingRight ? p.width : -25),
            y: p.y + p.height / 2 - 12,
            width: 26, height: 26,
            velocityX: (p.facingRight ? 1 : -1) * 14,
            velocityY: -2,
            isPlayerProjectile: true,
            damage: 8, lifetime: 100,
            isDevouredShot: true,
          });
          spawnParticles(p.x + (p.facingRight ? p.width : 0), p.y + p.height / 2, '#ff4400', 12);
        } else if (p.leviAbilities.includes('toxic_spit')) {
          // Toxic spit ranged acid blob
          s.projectiles.push({
            x: p.x + (p.facingRight ? p.width : -22),
            y: p.y + p.height / 2 - 10,
            width: 20, height: 20,
            velocityX: (p.facingRight ? 1 : -1) * 10,
            velocityY: 0,
            isPlayerProjectile: true,
            damage: 4, lifetime: 80,
            isToxicSpit: true,
          });
          spawnParticles(p.x + (p.facingRight ? p.width : 0), p.y + p.height / 2, '#88ff00', 12);
        }
      }
    }
    if (!eDown) s.eWasUp = true;

    // Process pending airstrike bombs (frame-based, not setTimeout)
    s.pendingAirstrikes = s.pendingAirstrikes.filter(strike => {
      strike.frameDelay--;
      if (strike.frameDelay <= 0) {
        s.projectiles.push({
          x: strike.x, y: -30,
          width: 18, height: 18,
          velocityX: 0, velocityY: 14,
          isPlayerProjectile: true,
          damage: 8, lifetime: 70,
          isAirstrikeBomb: true,
        });
        spawnParticles(strike.x, 0, '#ff4444', 6);
        return false;
      }
      return true;
    });

    // Decrement airstrike warning timers
    s.airstrikeWarnings = s.airstrikeWarnings.filter(w => {
      w.timer--;
      return w.timer > 0;
    });

    // Decrement flashbang flash
    if (s.flashbangFlash > 0) s.flashbangFlash--;

    // === COMBAT ROLL (double-tap A or D) ===
    if (p.isCJ && p.cjAbilities.includes('combat_roll')) {
      const rs = s.rollState;
      const leftDown = keys.has('a') || keys.has('arrowleft');
      const rightDown = keys.has('d') || keys.has('arrowright');
      const now = Date.now();

      if (leftDown && rs.leftWasUp) {
        if (now - rs.lastLeftTime < 250 && !rs.isRolling) {
          // Double-tap left — roll left
          rs.isRolling = true;
          rs.rollTimer = 28;
          rs.rollDir = -1;
          p.invincibleTimer = 28;
          spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#4488ff', 12);
        }
        rs.lastLeftTime = now;
        rs.leftWasUp = false;
      }
      if (!leftDown) rs.leftWasUp = true;

      if (rightDown && rs.rightWasUp) {
        if (now - rs.lastRightTime < 250 && !rs.isRolling) {
          // Double-tap right — roll right
          rs.isRolling = true;
          rs.rollTimer = 28;
          rs.rollDir = 1;
          p.invincibleTimer = 28;
          spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#4488ff', 12);
        }
        rs.lastRightTime = now;
        rs.rightWasUp = false;
      }
      if (!rightDown) rs.rightWasUp = true;

      if (rs.isRolling) {
        rs.rollTimer--;
        p.velocityX = rs.rollDir * 11;
        p.facingRight = rs.rollDir > 0;
        if (rs.rollTimer % 4 === 0) {
          spawnParticles(p.x + p.width / 2, p.y + p.height - 5, '#4488ff', 4);
        }
        if (rs.rollTimer <= 0) {
          rs.isRolling = false;
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

      // Stun timer — enemy is frozen when > 0
      if (e.stunTimer > 0) {
        e.stunTimer--;
        e.velocityX *= 0.85;
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
        // Stun sparkle effect
        if (e.stunTimer % 8 === 0) {
          spawnParticles(e.x + e.width / 2, e.y - 5, '#ffffaa', 3);
        }
        // Still check if enemy can damage the player while stunned
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
        continue;
      }

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
      const isMechWorm = b.bossType === 'mech_worm';

      // ─── MECH-WORM BOSS AI ─────────────────────────────────────────────────
      if (isMechWorm) {
        // The worm always moves left/right along the ground, reversing at walls
        const wormSpeed = b.phase === 3 ? 3.5 : b.phase === 2 ? 2.8 : 2.2;
        if (b.attackType !== 'suck') {
          b.velocityX = b.direction * wormSpeed;
          // Reverse at level edges
          if (b.x <= 50) { b.direction = 1; }
          if (b.x + b.width >= level.width - 50) { b.direction = -1; }
          // Track player: prefer to face the player
          if (p.x < b.x + b.width / 2) b.direction = -1;
          else b.direction = 1;
        }

        if (b.attackCooldown <= 0 && !s.suckState.active) {
          const rng = Math.random();
          const playerDist = Math.abs(p.x - (b.x + b.width / 2));
          if (b.phase >= 2 && rng < 0.3 && playerDist < 300) {
            // SUCK ATTACK — inhale the player
            b.attackType = 'suck';
            b.suckTimer = 0;
            b.velocityX = 0;
            b.attackCooldown = 200;
          } else if (rng < 0.5) {
            // Charge
            b.attackType = 'charge';
            b.velocityX = b.direction * (b.phase === 3 ? 9 : b.phase === 2 ? 7 : 5.5);
            b.attackCooldown = b.phase >= 3 ? 60 : 80;
          } else {
            // Spit acid bolts
            b.attackType = 'shoot';
            const numBolts = b.phase === 3 ? 5 : b.phase === 2 ? 3 : 2;
            for (let i = 0; i < numBolts; i++) {
              const angle = Math.atan2(p.y - (b.y + 40), p.x - (b.x + b.width / 2)) + (i - (numBolts - 1) / 2) * 0.25;
              s.projectiles.push({
                x: b.x + (b.direction < 0 ? 30 : b.width - 30), y: b.y + 40,
                width: 14, height: 14,
                velocityX: Math.cos(angle) * 8, velocityY: Math.sin(angle) * 8,
                isPlayerProjectile: false, damage: 2, lifetime: 80,
              });
            }
            spawnParticles(b.x + b.width / 2, b.y + 40, '#88ff44', 10);
            b.attackCooldown = b.phase >= 3 ? 45 : b.phase >= 2 ? 55 : 70;
          }
        }

        // Suck attack: ramp up the pull
        if (b.attackType === 'suck') {
          if (b.suckTimer === undefined) b.suckTimer = 0;
          b.suckTimer!++;
          spawnParticles(b.x + (b.direction < 0 ? 20 : b.width - 20), b.y + 40,
            '#44ff88', 2);
          // After warning frames, pull player in
          if (b.suckTimer! > 40 && !s.suckState.active) {
            const mouthX = b.x + (b.direction < 0 ? 0 : b.width);
            const playerDist2 = Math.abs(p.x - mouthX);
            if (playerDist2 < 280) {
              // Pull force toward mouth
              p.velocityX += (mouthX - p.x) * 0.04;
              // Capture player if very close
              if (playerDist2 < 60) {
                s.suckState.active = true;
                s.suckState.meter = 0;
                s.suckState.jWasUp = true;
                b.attackType = 'idle';
                b.attackCooldown = 150;
              }
            }
          }
          if (b.suckTimer! > 120) {
            b.attackType = 'idle';
            b.attackCooldown = 80;
          }
        }

        // Worm phase transitions
        const phaseCutscenes = { 2: 'worm_phase2', 3: 'worm_phase3' };
        if (b.health < b.maxHealth * 0.3 && b.phase < 3) {
          b.phase = 3;
          if (!s.bossPhaseTriggered[3]) {
            s.bossPhaseTriggered[3] = true;
            window.dispatchEvent(new CustomEvent('boss_phase_cutscene', { detail: phaseCutscenes[3] }));
          }
        } else if (b.health < b.maxHealth * 0.6 && b.phase < 2) {
          b.phase = 2;
          if (!s.bossPhaseTriggered[2]) {
            s.bossPhaseTriggered[2] = true;
            window.dispatchEvent(new CustomEvent('boss_phase_cutscene', { detail: phaseCutscenes[2] }));
          }
        }

        // Projectile hits worm
        for (const proj of s.projectiles) {
          if (!proj.isPlayerProjectile) continue;
          if (proj.x > b.x && proj.x < b.x + b.width && proj.y > b.y && proj.y < b.y + b.height) {
            b.health -= proj.damage;
            proj.lifetime = 0;
            spawnParticles(proj.x, proj.y, '#44ff88', 8);
            if (b.health <= 0) { b.health = 0; startFinisher(); }
          }
        }

        // Melee attack from player hits worm
        if (!p.isLevi && p.isAttacking && p.attackTimer > weapon.speed - 5 && !weapon.isRanged) {
          const atkSide = p.facingRight ? p.x + p.width : p.x - weapon.range;
          const atkW = weapon.range;
          if (atkSide < b.x + b.width && atkSide + atkW > b.x &&
              p.y < b.y + b.height && p.y + p.height > b.y) {
            b.health -= weapon.damage;
            spawnParticles(b.x + b.width / 2, b.y + 40, weapon.color, 8);
            if (b.health <= 0) { b.health = 0; startFinisher(); }
          }
        }
        // Levi devour on worm
        if (p.isLevi && p.isAttacking && p.attackTimer > 15) {
          const hasMC = p.leviAbilities.includes('mega_chomp');
          const dx = (b.x + b.width / 2) - (p.x + p.width / 2);
          const dy = (b.y + b.height / 2) - (p.y + p.height / 2);
          if (Math.sqrt(dx * dx + dy * dy) < (hasMC ? 140 : 100)) {
            b.health -= hasMC ? 6 : 4;
            spawnParticles(b.x + b.width / 2, b.y + 40, '#ff6600', 12);
            if (b.health <= 0) { b.health = 0; startFinisher(); }
          }
        }

        // Boss touches player — damage unless sucking (suck handles its own)
        if (p.invincibleTimer <= 0 && !s.suckState.active) {
          if (p.x < b.x + b.width && p.x + p.width > b.x &&
              p.y < b.y + b.height && p.y + p.height > b.y) {
            p.health -= 3;
            p.invincibleTimer = 90;
            p.velocityX = (p.x < b.x ? -1 : 1) * 10;
            p.velocityY = -8;
            spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#ff0000', 15);
            if (p.health <= 0) { s.gameState = 'gameover'; setGameState('gameover'); }
          }
        }
      } else if (b.attackCooldown <= 0) {
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
                  isAlive: true, attackCooldown: 0, direction: p.x < b.x ? -1 : 1, stunTimer: 0,
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
                  isAlive: true, attackCooldown: 0, direction: p.x < b.x ? -1 : 1, stunTimer: 0,
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

    // Helper: grenade/airstrike AOE explosion
    const triggerExplosion = (cx: number, cy: number, radius: number, dmg: number, isAirstrike = false) => {
      const color = isAirstrike ? '#ff4400' : '#44aa44';
      spawnParticles(cx, cy, color, 20);
      spawnParticles(cx, cy, '#ffaa00', 15);
      spawnParticles(cx, cy, '#ffffff', 8);
      for (const e of level.enemies) {
        if (!e.isAlive) continue;
        const dx = (e.x + e.width / 2) - cx;
        const dy = (e.y + e.height / 2) - cy;
        if (Math.sqrt(dx * dx + dy * dy) < radius) {
          e.health -= dmg;
          e.velocityX = dx > 0 ? 7 : -7;
          e.velocityY = -6;
          spawnParticles(e.x + e.width / 2, e.y + e.height / 2, color, 10);
          if (e.health <= 0) {
            e.isAlive = false;
            s.score += e.type === 'onion' ? 300 : 200;
            spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ffaa00', 18);
            if (Math.random() < 0.4) {
              level.healthPickups.push({
                x: e.x + e.width / 2 - 12, y: e.y + e.height / 2 - 12,
                width: 24, height: 24, healAmount: 2, collected: false,
              });
            }
          }
        }
      }
      if (level.boss?.isAlive) {
        const b = level.boss;
        const dx = (b.x + b.width / 2) - cx;
        const dy = (b.y + b.height / 2) - cy;
        if (Math.sqrt(dx * dx + dy * dy) < radius * 1.3) {
          b.health -= dmg;
          spawnParticles(b.x + b.width / 2, b.y + b.height / 2, color, 12);
          if (b.health <= 0) { b.health = 0; startFinisher(); }
          const pe = b.bossType === 'rotten_core' ? { 2: 'core_phase2', 3: 'core_phase3' } : b.bossType === 'rotten_tank' ? { 2: 'tank_phase2', 3: 'tank_phase3' } : { 2: 'boss_phase2', 3: 'boss_phase3' };
          if (b.health < b.maxHealth * 0.3 && b.phase < 3 && !s.bossPhaseTriggered[3]) {
            b.phase = 3; s.bossPhaseTriggered[3] = true;
            window.dispatchEvent(new CustomEvent('boss_phase_cutscene', { detail: pe[3] }));
          } else if (b.health < b.maxHealth * 0.6 && b.phase < 2 && !s.bossPhaseTriggered[2]) {
            b.phase = 2; s.bossPhaseTriggered[2] = true;
            window.dispatchEvent(new CustomEvent('boss_phase_cutscene', { detail: pe[2] }));
          }
        }
      }
    };

    // Update projectiles
    s.projectiles = s.projectiles.filter(proj => {
      proj.velocityY += proj.isGrenade ? GRAVITY * 0.6 : proj.isBasketball ? GRAVITY * 0.4 : 0;
      proj.x += proj.velocityX;
      proj.y += proj.velocityY;
      proj.lifetime--;

      // Basketball: bounces off ground/platforms (limited bounces)
      if (proj.isBasketball) {
        for (const plat of level.platforms) {
          if (
            proj.x + proj.width > plat.x && proj.x < plat.x + plat.width &&
            proj.y + proj.height > plat.y && proj.y + proj.height < plat.y + plat.height + 14 &&
            proj.velocityY >= 0
          ) {
            proj.y = plat.y - proj.height;
            proj.velocityY = -8;
            proj.bouncesLeft = (proj.bouncesLeft ?? 0) - 1;
            spawnParticles(proj.x + proj.width / 2, proj.y + proj.height, '#ff8822', 4);
            if ((proj.bouncesLeft ?? 0) < 0) {
              return false;
            }
          }
        }
      }

      // Grenade — bounce off ground/platforms, explode on timer
      if (proj.isGrenade) {
        let onPlatform = false;
        for (const plat of level.platforms) {
          if (
            proj.x + proj.width > plat.x && proj.x < plat.x + plat.width &&
            proj.y + proj.height > plat.y && proj.y + proj.height < plat.y + plat.height + 12 &&
            proj.velocityY >= 0
          ) {
            proj.y = plat.y - proj.height;
            proj.velocityY *= -0.35;
            proj.velocityX *= 0.75;
            onPlatform = true;
          }
        }
        if (proj.lifetime <= 0) {
          // Explode!
          triggerExplosion(proj.x + proj.width / 2, proj.y + proj.height / 2, proj.aoeRadius ?? 130, proj.damage);
          return false;
        }
        return true;
      }

      // Airstrike bomb — explode when it hits the ground or a platform
      if (proj.isAirstrikeBomb) {
        let exploded = false;
        for (const plat of level.platforms) {
          if (
            proj.x + proj.width > plat.x && proj.x < plat.x + plat.width &&
            proj.y + proj.height > plat.y && proj.y + proj.height < plat.y + plat.height + 10 &&
            proj.velocityY >= 0
          ) {
            exploded = true;
          }
        }
        if (exploded || proj.lifetime <= 0) {
          triggerExplosion(proj.x + proj.width / 2, proj.y + proj.height / 2, 100, proj.damage, true);
          return false;
        }
        return true;
      }

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
            // Football pierces — keeps going through enemies
            if (proj.isFootball) continue;
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
    } else if (chapter === 8) {
      // BOOT CAMP — Military base, camo green/brown
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#1a1a10'); skyGrad.addColorStop(0.5, '#2a2a18');
      skyGrad.addColorStop(1, '#1a1a0a');
      ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#2a3a1a';
      for (let i = 0; i < 12; i++) {
        const bx = i * 200 - (camX * 0.15) % 400;
        ctx.fillRect(bx, 150 + Math.sin(i) * 40, 60, 200);
        ctx.fillRect(bx - 10, 150 + Math.sin(i) * 40, 80, 10);
      }
      ctx.strokeStyle = '#4a5a3a'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const wx = i * 300 - (camX * 0.2) % 600;
        ctx.beginPath(); ctx.moveTo(wx, CANVAS_H - 100);
        ctx.lineTo(wx + 150, CANVAS_H - 100); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx, CANVAS_H - 100);
        ctx.lineTo(wx, CANVAS_H - 130); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx + 150, CANVAS_H - 100);
        ctx.lineTo(wx + 150, CANVAS_H - 130); ctx.stroke();
      }
    } else if (chapter === 9) {
      // FORWARD OPERATING BASE — Industrial military, steel and fire
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#0f0f0f'); skyGrad.addColorStop(0.4, '#1a1a1a');
      skyGrad.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#2a2a2a';
      for (let i = 0; i < 15; i++) {
        const gx = i * 160 - (camX * 0.12) % 320;
        ctx.fillRect(gx, 0, 8, CANVAS_H - 100);
      }
      ctx.strokeStyle = '#ff440044'; ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        const vx = i * 250 - (camX * 0.2) % 500;
        const pulse = Math.sin(t * 0.003 + i) * 0.4 + 0.6;
        ctx.globalAlpha = pulse * 0.4;
        ctx.beginPath(); ctx.moveTo(vx, CANVAS_H - 100);
        ctx.bezierCurveTo(vx + 20, CANVAS_H - 200, vx - 15, CANVAS_H - 300, vx + 10, 0);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Embers
      ctx.fillStyle = '#ff6600';
      for (let i = 0; i < 15; i++) {
        const px = (i * 180 + t * 0.025) % CANVAS_W;
        const py = CANVAS_H - 80 - ((t * 0.035 + i * 50) % (CANVAS_H - 80));
        ctx.globalAlpha = 0.3; ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (chapter === 10) {
      // ROTTEN TANK ARENA — Hangar, red alert lighting
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#1a0505'); skyGrad.addColorStop(0.3, '#2a0a0a');
      skyGrad.addColorStop(1, '#0a0303');
      ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const alertPulse = Math.sin(t * 0.005) * 0.5 + 0.5;
      ctx.globalAlpha = alertPulse * 0.06;
      ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#333333';
      for (let i = 0; i < 12; i++) {
        const gx = i * 180 - (camX * 0.1) % 360;
        ctx.fillRect(gx, 0, 10, CANVAS_H - 100);
      }
    } else if (chapter === 11) {
      // THE IRON CONVERGENCE — Ruined industrial wasteland, worm burrow trails
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, '#0a1a0a'); skyGrad.addColorStop(0.4, '#0f2a0f');
      skyGrad.addColorStop(1, '#061006');
      ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // Toxic green pulse across sky
      const toxicPulse = Math.sin(t * 0.003) * 0.5 + 0.5;
      ctx.globalAlpha = toxicPulse * 0.04;
      ctx.fillStyle = '#44ff44'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalAlpha = 1;
      // Background ruined pillars
      ctx.fillStyle = '#1a2a1a';
      for (let i = 0; i < 8; i++) {
        const px2 = (i * 280 - camX * 0.2) % (CANVAS_W + 280) - 100;
        ctx.fillRect(px2, CANVAS_H * 0.3, 40, CANVAS_H * 0.7);
      }
      // Worm burrow trails in the ground
      ctx.strokeStyle = '#224422';
      ctx.lineWidth = 8;
      for (let i = 0; i < 5; i++) {
        const trailX = ((i * 500 - camX * 0.3) % (CANVAS_W + 500)) - 200;
        ctx.beginPath();
        ctx.moveTo(trailX, CANVAS_H - 100);
        ctx.bezierCurveTo(trailX + 100, CANVAS_H - 140, trailX + 200, CANVAS_H - 80, trailX + 400, CANVAS_H - 120);
        ctx.stroke();
      }
      // Mid-distance broken metal debris
      ctx.fillStyle = '#1a3a1a';
      for (let i = 0; i < 10; i++) {
        const dx = ((i * 200 + 50 - camX * 0.5) % (CANVAS_W + 200)) - 50;
        const dh = 30 + (i * 17) % 60;
        ctx.fillRect(dx, CANVAS_H - 100 - dh, 20, dh);
      }
      // Glowing circuit vines
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#44ff44';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const vx = ((i * 250 - camX * 0.7) % (CANVAS_W + 250)) - 50;
        ctx.beginPath();
        ctx.moveTo(vx, CANVAS_H - 100);
        ctx.lineTo(vx + 30, CANVAS_H - 200);
        ctx.lineTo(vx + 10, CANVAS_H - 300);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  };

  const safeRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      // Fallback for older browsers
      ctx.rect(x, y, w, h);
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
      : ch === 8 ? ['#2a3a1a','#1a2a10','#0f1a05','#6a8a44']
      : ch === 9 ? ['#2a2a2a','#1a1a1a','#0f0f0f','#888888']
      : ch === 10 ? ['#3a1a1a','#2a0a0a','#1a0505','#aa4444']
      : ['#3a1a1a','#2a0a0a','#1a0505','#aa2222'];
    const platColors = ch === 1 ? ['#3a2a1a','#2a5a15','#227711']
      : ch === 2 ? ['#2a2a3a','#3344aa','#2233aa']
      : ch === 3 ? ['#4a3a2a','#aa7733','#886622']
      : ch === 5 ? ['#2a3a2a','#44aa22','#227711']
      : ch === 6 ? ['#3a2a30','#aa4466','#883355']
      : ch === 7 ? ['#2a3a2a','#44aa22','#227711']
      : ch === 8 ? ['#3a3a2a','#6a8a44','#4a6a33']
      : ch === 9 ? ['#3a3a3a','#888888','#666666']
      : ch === 10 ? ['#3a2020','#aa4444','#883333']
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
        // Rich themed floating platform
        const pw = plat.width;
        const ph = plat.height;
        const py = plat.y;
        const pt = Date.now() * 0.001;

        if (ch === 1 || ch === 7) {
          // ── Forest: wooden log with mossy top and hanging vines ──
          const woodGrad = ctx.createLinearGradient(0, py, 0, py + ph);
          woodGrad.addColorStop(0, '#6b3a2a');
          woodGrad.addColorStop(0.35, '#8b4a2a');
          woodGrad.addColorStop(1, '#3a1a0a');
          ctx.fillStyle = woodGrad;
          ctx.beginPath(); ctx.roundRect(px, py, pw, ph, [4, 4, 2, 2]); ctx.fill();
          // wood grain lines
          ctx.strokeStyle = '#4a2a15'; ctx.lineWidth = 1;
          for (let gx = px + 15; gx < px + pw - 5; gx += 20) {
            ctx.beginPath(); ctx.moveTo(gx, py + 3); ctx.lineTo(gx - 2, py + ph); ctx.stroke();
          }
          // mossy top
          const mossGrad = ctx.createLinearGradient(0, py, 0, py + 6);
          mossGrad.addColorStop(0, '#3a8a22'); mossGrad.addColorStop(1, '#226611');
          ctx.fillStyle = mossGrad;
          ctx.beginPath(); ctx.roundRect(px, py, pw, 6, [4, 4, 0, 0]); ctx.fill();
          ctx.fillStyle = '#44aa33';
          for (let bx = px + 8; bx < px + pw - 8; bx += 14) {
            ctx.beginPath(); ctx.arc(bx, py + 1, 4, Math.PI, 0); ctx.fill();
          }
          // hanging vines
          ctx.lineWidth = 1.5;
          for (let vx = px + 12; vx < px + pw - 6; vx += 22) {
            const vLen = 12 + Math.sin(pt + vx * 0.1) * 4;
            ctx.strokeStyle = '#226611';
            ctx.beginPath();
            ctx.moveTo(vx, py + ph);
            ctx.bezierCurveTo(vx - 3, py + ph + vLen * 0.5, vx + 3, py + ph + vLen * 0.7, vx, py + ph + vLen);
            ctx.stroke();
            ctx.fillStyle = '#33aa22';
            ctx.beginPath(); ctx.ellipse(vx, py + ph + vLen, 3, 5, 0.2, 0, Math.PI * 2); ctx.fill();
          }

        } else if (ch === 2) {
          // ── Night/Space: glowing crystal shard platform ──
          const crystalGrad = ctx.createLinearGradient(0, py, 0, py + ph);
          crystalGrad.addColorStop(0, '#2a3a88'); crystalGrad.addColorStop(0.5, '#151a55'); crystalGrad.addColorStop(1, '#070a22');
          ctx.fillStyle = crystalGrad;
          ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 3); ctx.fill();
          // glowing top edge
          ctx.shadowColor = '#4466ff'; ctx.shadowBlur = 10 + Math.sin(pt * 2) * 4;
          ctx.strokeStyle = '#6688ff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(px + 2, py + 1); ctx.lineTo(px + pw - 2, py + 1); ctx.stroke();
          ctx.shadowBlur = 0;
          // crystal shards on top
          ctx.fillStyle = '#aabbff';
          for (let cx2 = px + 10; cx2 < px + pw - 10; cx2 += 18) {
            const sh = 6 + Math.sin(cx2 * 0.3) * 3;
            ctx.beginPath(); ctx.moveTo(cx2, py - sh); ctx.lineTo(cx2 - 4, py); ctx.lineTo(cx2 + 4, py); ctx.closePath(); ctx.fill();
          }
          // glowing drips below
          for (let dx = px + 12; dx < px + pw - 8; dx += 24) {
            ctx.fillStyle = 'rgba(68,102,255,0.18)';
            ctx.beginPath(); ctx.moveTo(dx - 4, py + ph); ctx.lineTo(dx + 4, py + ph); ctx.lineTo(dx, py + ph + 12); ctx.closePath(); ctx.fill();
          }

        } else if (ch === 3) {
          // ── Desert: cracked sandstone slab ──
          const sandGrad = ctx.createLinearGradient(0, py, 0, py + ph);
          sandGrad.addColorStop(0, '#c89a50'); sandGrad.addColorStop(0.4, '#a07830'); sandGrad.addColorStop(1, '#604818');
          ctx.fillStyle = sandGrad;
          ctx.beginPath(); ctx.roundRect(px, py, pw, ph, [3, 3, 1, 1]); ctx.fill();
          // cracks
          ctx.strokeStyle = '#604818'; ctx.lineWidth = 1;
          for (const seed of [0.2, 0.5, 0.75]) {
            const cx2 = px + pw * seed;
            ctx.beginPath(); ctx.moveTo(cx2, py + 2); ctx.lineTo(cx2 + 3, py + ph * 0.45); ctx.lineTo(cx2 - 2, py + ph * 0.75); ctx.stroke();
          }
          // sandy top strip
          ctx.fillStyle = '#e8b860'; ctx.fillRect(px, py, pw, 5);
          // floating dust
          ctx.fillStyle = 'rgba(232,184,96,0.35)';
          for (let dx = px + 5; dx < px + pw - 5; dx += 16) {
            const yOff = Math.sin(pt * 1.5 + dx * 0.05) * 3;
            ctx.beginPath(); ctx.arc(dx, py + ph + 6 + yOff, 2, 0, Math.PI * 2); ctx.fill();
          }

        } else if (ch === 5) {
          // ── Jungle: mossy glowing stone with mushrooms and vines ──
          const stoneGrad = ctx.createLinearGradient(0, py, 0, py + ph);
          stoneGrad.addColorStop(0, '#2a5a2a'); stoneGrad.addColorStop(0.5, '#1a3a1a'); stoneGrad.addColorStop(1, '#0a1a0a');
          ctx.fillStyle = stoneGrad;
          ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 2); ctx.fill();
          // glowing moss top
          ctx.shadowColor = '#44ff22'; ctx.shadowBlur = 6 + Math.sin(pt * 3) * 2;
          ctx.fillStyle = '#44cc22'; ctx.fillRect(px, py, pw, 5); ctx.shadowBlur = 0;
          ctx.fillStyle = '#33aa22';
          for (let mx = px + 5; mx < px + pw - 5; mx += 18) {
            ctx.beginPath(); ctx.arc(mx + 4, py + 3, 5, Math.PI, 0); ctx.fill();
          }
          // glowing mushrooms
          for (let mx = px + 18; mx < px + pw - 10; mx += 38) {
            ctx.shadowColor = '#ffaa22'; ctx.shadowBlur = 6;
            ctx.fillStyle = '#ffaa22';
            ctx.beginPath(); ctx.arc(mx, py - 5, 5, Math.PI, 0); ctx.fill(); ctx.shadowBlur = 0;
            ctx.fillStyle = '#cc8811'; ctx.fillRect(mx - 1, py - 5, 2, 5);
          }
          // hanging vines
          ctx.strokeStyle = '#226622'; ctx.lineWidth = 1.5;
          for (let vx = px + 10; vx < px + pw - 8; vx += 20) {
            const vl = 14 + Math.sin(pt * 0.8 + vx) * 5;
            ctx.beginPath(); ctx.moveTo(vx, py + ph); ctx.quadraticCurveTo(vx + 4, py + ph + vl * 0.5, vx, py + ph + vl); ctx.stroke();
          }

        } else if (ch === 6) {
          // ── Dark Dungeon: stone with purple rune glow ──
          const darkGrad = ctx.createLinearGradient(0, py, 0, py + ph);
          darkGrad.addColorStop(0, '#3a2a40'); darkGrad.addColorStop(1, '#150a20');
          ctx.fillStyle = darkGrad;
          ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 2); ctx.fill();
          // block seams
          ctx.strokeStyle = '#1a0a25'; ctx.lineWidth = 1;
          for (const frac of [0.33, 0.66]) {
            ctx.beginPath(); ctx.moveTo(px + pw * frac, py); ctx.lineTo(px + pw * frac, py + ph); ctx.stroke();
          }
          // glowing purple top
          ctx.shadowColor = '#aa44ff'; ctx.shadowBlur = 8 + Math.sin(pt * 2) * 4;
          ctx.strokeStyle = '#cc66ff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(px, py + 1); ctx.lineTo(px + pw, py + 1); ctx.stroke(); ctx.shadowBlur = 0;
          // rune symbols
          ctx.fillStyle = `rgba(170,68,255,${0.5 + Math.sin(pt * 3) * 0.3})`;
          ctx.font = '10px serif'; ctx.textAlign = 'center';
          for (let rx = px + 28; rx < px + pw - 15; rx += 44) {
            ctx.fillText('ᚱ', rx, py + ph * 0.7 + 4);
          }
          ctx.textAlign = 'left';
          // corner spikes
          ctx.fillStyle = '#4a2a55';
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 3, py - 8); ctx.lineTo(px + 6, py); ctx.fill();
          ctx.beginPath(); ctx.moveTo(px + pw, py); ctx.lineTo(px + pw + 3, py - 8); ctx.lineTo(px + pw - 6, py); ctx.fill();

        } else if (ch === 8) {
          // ── Military / Swamp: camouflage concrete with rivets ──
          const concGrad = ctx.createLinearGradient(0, py, 0, py + ph);
          concGrad.addColorStop(0, '#5a6a3a'); concGrad.addColorStop(1, '#2a3a1a');
          ctx.fillStyle = concGrad;
          ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 1); ctx.fill();
          // top bar
          ctx.fillStyle = '#8a9a5a'; ctx.fillRect(px, py, pw, 4);
          // rivet bolts
          for (const bx of [8, pw / 2, pw - 8]) {
            if (bx < 0 || bx > pw) continue;
            ctx.fillStyle = '#aabb77'; ctx.beginPath(); ctx.arc(px + bx, py + 2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#667733'; ctx.beginPath(); ctx.arc(px + bx, py + 2, 1.5, 0, Math.PI * 2); ctx.fill();
          }
          // camo blobs
          ctx.fillStyle = 'rgba(42,58,20,0.55)';
          ctx.beginPath(); ctx.ellipse(px + pw * 0.28, py + ph * 0.65, 11, 6, 0.3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(px + pw * 0.7, py + ph * 0.5, 9, 5, -0.2, 0, Math.PI * 2); ctx.fill();

        } else if (ch === 9) {
          // ── Stone City: steel grate with warning stripes ──
          const steelGrad = ctx.createLinearGradient(0, py, 0, py + ph);
          steelGrad.addColorStop(0, '#5a5a5a'); steelGrad.addColorStop(0.4, '#3a3a3a'); steelGrad.addColorStop(1, '#1a1a1a');
          ctx.fillStyle = steelGrad;
          ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 2); ctx.fill();
          // yellow/black warning stripe top
          const sW = 12; let striping = true;
          for (let sx = px; sx < px + pw; sx += sW) {
            ctx.fillStyle = striping ? '#ffcc00' : '#222222';
            ctx.fillRect(sx, py, Math.min(sW, px + pw - sx), 5); striping = !striping;
          }
          // rivets
          for (let rx = px + 10; rx < px + pw - 5; rx += 26) {
            ctx.fillStyle = '#888888'; ctx.beginPath(); ctx.arc(rx, py + 12, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#bbbbbb'; ctx.beginPath(); ctx.arc(rx - 1, py + 11, 1.5, 0, Math.PI * 2); ctx.fill();
          }
          // grate lines
          ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
          for (let gx = px + 8; gx < px + pw; gx += 8) {
            ctx.beginPath(); ctx.moveTo(gx, py + 6); ctx.lineTo(gx, py + ph); ctx.stroke();
          }

        } else if (ch === 10) {
          // ── Lava / Hell: obsidian with glowing lava cracks ──
          const obsGrad = ctx.createLinearGradient(0, py, 0, py + ph);
          obsGrad.addColorStop(0, '#2a1010'); obsGrad.addColorStop(0.5, '#1a0808'); obsGrad.addColorStop(1, '#0a0404');
          ctx.fillStyle = obsGrad;
          ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 2); ctx.fill();
          // lava cracks
          ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 6 + Math.sin(pt * 4) * 3;
          ctx.strokeStyle = `rgba(255,${Math.floor(68 + Math.sin(pt * 3) * 40)},0,0.9)`; ctx.lineWidth = 1.5;
          for (const [s1, s2] of [[0.15, 0.6], [0.45, 0.82], [0.72, 0.5]]) {
            ctx.beginPath(); ctx.moveTo(px + pw * s1, py + 1); ctx.lineTo(px + pw * (s1 + s2) / 2, py + ph * 0.5); ctx.lineTo(px + pw * s2, py + ph - 1); ctx.stroke();
          }
          ctx.shadowBlur = 0;
          // glowing hot top
          ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 10 + Math.sin(pt * 2) * 5;
          ctx.fillStyle = '#ff3300'; ctx.fillRect(px, py, pw, 3); ctx.shadowBlur = 0;
          // dripping lava
          const dripPhase = (pt * 0.5) % 1;
          for (let dx = px + 16; dx < px + pw - 10; dx += 28) {
            const dripY = py + ph + dripPhase * 14;
            const alpha = 1 - dripPhase;
            ctx.fillStyle = `rgba(255,80,0,${alpha})`;
            ctx.beginPath(); ctx.arc(dx, dripY, 3 * alpha, 0, Math.PI * 2); ctx.fill();
          }

        } else {
          // ── CJ Chapter / Default: military with warning-stripe edges ──
          const cjGrad = ctx.createLinearGradient(0, py, 0, py + ph);
          cjGrad.addColorStop(0, '#2a3a20'); cjGrad.addColorStop(1, '#111a08');
          ctx.fillStyle = cjGrad;
          ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 2); ctx.fill();
          // left warning stripe band
          ctx.save(); ctx.beginPath(); ctx.rect(px, py, 18, ph); ctx.clip();
          ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 4;
          for (let d = -ph; d < 18; d += 10) { ctx.beginPath(); ctx.moveTo(px + d, py); ctx.lineTo(px + d + ph, py + ph); ctx.stroke(); }
          ctx.restore();
          // right warning stripe band
          ctx.save(); ctx.beginPath(); ctx.rect(px + pw - 18, py, 18, ph); ctx.clip();
          ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 4;
          for (let d = -ph; d < 18; d += 10) { ctx.beginPath(); ctx.moveTo(px + pw - 18 + d, py); ctx.lineTo(px + pw - 18 + d + ph, py + ph); ctx.stroke(); }
          ctx.restore();
          // top bar
          ctx.fillStyle = '#4a6a28'; ctx.fillRect(px + 18, py, pw - 36, 4);
          // center rivet
          ctx.fillStyle = '#88aa44'; ctx.beginPath(); ctx.arc(px + pw / 2, py + ph / 2, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#aaccaa'; ctx.beginPath(); ctx.arc(px + pw / 2 - 1, py + ph / 2 - 1, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // Draw weapon pickups — each with a unique icon
    for (const wp of s.level.weaponPickups) {
      if (wp.collected) continue;
      const wpx = wp.x - camX;
      if (wpx + wp.width < -50 || wpx > CANVAS_W + 50) continue;
      const wDef = WEAPONS[wp.weapon];
      const wt = Date.now() * 0.003;
      const floatY = wp.y + Math.sin(wt) * 5;
      const cx = wpx + wp.width / 2;
      const cy = floatY + wp.height / 2;
      ctx.save();
      // Floating glow base
      ctx.shadowColor = wDef.glowColor;
      ctx.shadowBlur = 14 + Math.sin(wt * 2) * 5;
      ctx.fillStyle = wDef.color + '44';
      ctx.beginPath(); ctx.arc(cx, cy, wp.width / 2 + 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      if (wp.weapon === 'forest_blade') {
        // Sword icon: diagonal blade
        ctx.strokeStyle = '#aaff44'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.shadowColor = '#88ff22'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(cx - 8, cy + 8); ctx.lineTo(cx + 8, cy - 8); ctx.stroke();
        ctx.fillStyle = '#aaff44'; ctx.beginPath(); ctx.arc(cx + 8, cy - 8, 3, 0, Math.PI * 2); ctx.fill();
        // Guard
        ctx.strokeStyle = '#226600'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 4, cy + 2); ctx.lineTo(cx + 4, cy - 2); ctx.stroke();

      } else if (wp.weapon === 'vine_whip') {
        // Whip: wavy green line
        ctx.strokeStyle = '#44dd66'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.shadowColor = '#22aa44'; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + 4);
        ctx.quadraticCurveTo(cx - 3, cy - 8, cx + 4, cy + 2);
        ctx.quadraticCurveTo(cx + 9, cy + 8, cx + 12, cy - 2);
        ctx.stroke();
        ctx.fillStyle = '#33aa22'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.ellipse(cx + 12, cy - 2, 4, 3, 0.4, 0, Math.PI * 2); ctx.fill();

      } else if (wp.weapon === 'static_bolt') {
        // Lightning orb icon
        ctx.shadowColor = '#88ccff'; ctx.shadowBlur = 12;
        const sbGrad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, 9);
        sbGrad.addColorStop(0, '#ffffff'); sbGrad.addColorStop(0.5, '#aaccff'); sbGrad.addColorStop(1, '#4466cc');
        ctx.fillStyle = sbGrad; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
        // Lightning bolt symbol
        ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.moveTo(cx + 2, cy - 7); ctx.lineTo(cx - 3, cy + 1); ctx.lineTo(cx + 1, cy + 1); ctx.lineTo(cx - 2, cy + 7); ctx.lineTo(cx + 4, cy - 1); ctx.lineTo(cx, cy - 1); ctx.closePath(); ctx.fill();

      } else if (wp.weapon === 'iron_fist') {
        // Fist silhouette
        ctx.shadowColor = '#ff8822'; ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath(); ctx.roundRect(cx - 9, cy - 7, 18, 14, 4); ctx.fill();
        ctx.fillStyle = '#cc5500'; ctx.shadowBlur = 0;
        for (let ki = 0; ki < 4; ki++) { ctx.beginPath(); ctx.arc(cx - 8 + ki * 5.5, cy - 7, 3, Math.PI, 0); ctx.fill(); }

      } else if (wp.weapon === 'corruption_purge') {
        // Expanding ring icon
        ctx.shadowColor = '#dd22ff'; ctx.shadowBlur = 14;
        ctx.strokeStyle = '#ff44ff'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#aa22cc'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ff88ff'; ctx.shadowBlur = 0;
        for (let si = 0; si < 6; si++) { const sa = (si / 6) * Math.PI * 2 + wt * 3; ctx.beginPath(); ctx.arc(cx + Math.cos(sa) * 9, cy + Math.sin(sa) * 9, 2, 0, Math.PI * 2); ctx.fill(); }
      }

      ctx.shadowBlur = 0;
      ctx.restore();
      // Label
      ctx.fillStyle = wDef.color;
      ctx.font = 'bold 10px MedievalSharp';
      ctx.textAlign = 'center';
      ctx.fillText(wDef.name, cx, floatY - 14);
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

    // Draw CJ ability pickups
    for (const cap of s.level.cjAbilityPickups) {
      if (cap.collected) continue;
      const capx = cap.x - camX;
      if (capx + cap.width < -50 || capx > CANVAS_W + 50) continue;
      const aDef = CJ_ABILITIES[cap.ability];
      const t2 = Date.now() * 0.003;
      const floatY2 = cap.y + Math.sin(t2 * 1.2 + cap.x) * 6;
      ctx.save();
      ctx.shadowColor = aDef.glowColor;
      ctx.shadowBlur = 18 + Math.sin(t2 * 2) * 6;
      ctx.fillStyle = aDef.color;
      ctx.beginPath();
      ctx.arc(capx + cap.width / 2, floatY2 + cap.height / 2, cap.width / 2 + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.9; ctx.font = '14px serif'; ctx.textAlign = 'center';
      ctx.fillText('⚙', capx + cap.width / 2, floatY2 + cap.height / 2 + 5);
      ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.restore();
      ctx.fillStyle = aDef.color; ctx.font = '10px MedievalSharp'; ctx.textAlign = 'center';
      ctx.fillText(aDef.name, capx + cap.width / 2, floatY2 - 10);
    }

    // Draw ammo pickups
    for (const amp of s.level.ammoPickups) {
      if (amp.collected) continue;
      const amx = amp.x - camX;
      if (amx + amp.width < -50 || amx > CANVAS_W + 50) continue;
      const t2 = Date.now() * 0.003;
      const floatY2 = amp.y + Math.sin(t2 + amp.x) * 4;
      ctx.save();
      ctx.shadowColor = '#ffdd44'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffdd44';
      ctx.fillRect(amx + 2, floatY2 + 2, amp.width - 4, amp.height - 4);
      ctx.fillStyle = '#000'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('A', amx + amp.width / 2, floatY2 + amp.height / 2 + 4);
      ctx.shadowBlur = 0; ctx.restore();
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

      // Stunned overlay — yellow tint + spinning stars
      if (e.stunTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ffffaa';
        ctx.fillRect(ex, e.y, e.width, e.height);
        ctx.globalAlpha = 1;
        // Spinning star icons above the enemy
        const starAngle = (Date.now() * 0.004 + e.x * 0.01);
        for (let si = 0; si < 3; si++) {
          const sa = starAngle + (Math.PI * 2 / 3) * si;
          const sx = ex + e.width / 2 + Math.cos(sa) * 18;
          const sy = e.y - 16 + Math.sin(sa) * 5;
          ctx.fillStyle = '#ffee22';
          ctx.font = '12px serif';
          ctx.textAlign = 'center';
          ctx.fillText('★', sx, sy);
        }
        ctx.restore();
      }
    }

    // Draw boss
    if (s.level.boss?.isAlive) {
      const b = s.level.boss;
      const bx = b.x - camX;
      const isRC = b.bossType === 'rotten_core';
      const isRT = b.bossType === 'rotten_tank';
      const isWorm = b.bossType === 'mech_worm';

      if (isWorm) {
        // MECH-WORM: draw as a segmented mechanical serpent
        ctx.save();
        const t = Date.now();
        const phaseGlow = b.phase >= 3 ? '#ff2200' : b.phase >= 2 ? '#44ff88' : '#22cc44';
        ctx.shadowColor = phaseGlow;
        ctx.shadowBlur = 20 + Math.sin(t * 0.006) * 12;

        // PLANT TENDRILS overlay (phases 1-2): writhing vines erupt from body
        if (b.phase <= 2) {
          ctx.save();
          for (let v = 0; v < 8; v++) {
            const vbase = bx + (v / 7) * b.width;
            const vsway = Math.sin(t * 0.003 + v * 0.7) * 18;
            const vlen = 60 + Math.sin(t * 0.004 + v) * 20;
            ctx.strokeStyle = '#3a8a3a';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#22ff44';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(vbase, b.y);
            ctx.quadraticCurveTo(vbase + vsway, b.y - vlen / 2, vbase + vsway * 1.5, b.y - vlen);
            ctx.stroke();
            // Petal at the tip
            ctx.fillStyle = '#aa44ff';
            ctx.beginPath();
            ctx.arc(vbase + vsway * 1.5, b.y - vlen, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Body segments (5 segments from tail to head)
        const segW = b.width / 5;
        const segH = b.height;
        const mouthSide = b.direction < 0 ? 0 : b.width - segW;

        for (let seg = 4; seg >= 0; seg--) {
          const segX = bx + (b.direction < 0 ? seg : 4 - seg) * segW;
          const wobble = Math.sin(t * 0.005 + seg * 0.8) * 4;
          const isHead = seg === 0;
          const segColor = isHead ? '#2a5a2a' : (seg % 2 === 0 ? '#1a3a1a' : '#223322');
          
          ctx.fillStyle = segColor;
          ctx.beginPath();
          safeRoundRect(ctx, segX, b.y + wobble, segW - 4, segH, isHead ? 8 : 4);
          ctx.fill();

          // Metal bands / armor rings
          ctx.fillStyle = '#446644';
          ctx.fillRect(segX + 2, b.y + wobble + 8, segW - 8, 6);
          ctx.fillRect(segX + 2, b.y + wobble + segH - 16, segW - 8, 6);

          // Circuit lines
          ctx.strokeStyle = phaseGlow;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(segX + 4, b.y + wobble + segH / 2 - 8);
          ctx.lineTo(segX + segW - 8, b.y + wobble + segH / 2 - 8);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Head: huge maw
        const headX = bx + mouthSide;
        const wobbleHead = Math.sin(t * 0.005) * 4;
        ctx.fillStyle = '#1a4a1a';
        ctx.beginPath();
        safeRoundRect(ctx, headX, b.y + wobbleHead - 6, segW + 10, segH + 12, 10);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes (2 glowing eyes on head)
        const eyeY = b.y + wobbleHead + 18;
        const eyeX1 = headX + (b.direction < 0 ? 10 : 6);
        const eyeX2 = headX + (b.direction < 0 ? 20 : 16);
        ctx.fillStyle = b.attackType === 'suck' ? '#ff2200' : phaseGlow;
        ctx.shadowColor = b.attackType === 'suck' ? '#ff2200' : phaseGlow;
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(eyeX1, eyeY, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeX2, eyeY + 12, 7, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Maw / mouth
        const mawOpen = b.attackType === 'suck' ? 1.0 : 0.4;
        const mawX = headX + (b.direction < 0 ? -14 : segW);
        ctx.fillStyle = b.attackType === 'suck' ? '#ff440044' : '#00220088';
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.ellipse(mawX + (b.direction < 0 ? 7 : -5), b.y + wobbleHead + segH / 2,
          16, segH / 2 * mawOpen, 0, 0, Math.PI * 2);
        ctx.fill();
        // Teeth
        if (b.attackType === 'suck') {
          ctx.fillStyle = '#44ff88';
          ctx.shadowColor = '#44ff88';
          ctx.shadowBlur = 15;
          for (let t2 = 0; t2 < 4; t2++) {
            const ty = b.y + wobbleHead + 20 + t2 * 18;
            ctx.fillRect(mawX + (b.direction < 0 ? 2 : -12), ty, 10, 8);
          }
          ctx.shadowBlur = 0;
        }

        // Suck vortex effect
        if (b.attackType === 'suck' && b.suckTimer !== undefined && b.suckTimer > 20) {
          ctx.globalAlpha = Math.min(0.7, (b.suckTimer! - 20) / 60);
          const vortexX = mawX + (b.direction < 0 ? 0 : 0);
          const vortexY = b.y + wobbleHead + segH / 2;
          const vortGrad = ctx.createRadialGradient(vortexX, vortexY, 5, vortexX, vortexY, 140);
          vortGrad.addColorStop(0, '#44ff8888');
          vortGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = vortGrad;
          ctx.beginPath();
          ctx.arc(vortexX, vortexY, 140, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        ctx.restore();

        // Boss health bar
        const wormBarColor = b.phase >= 3 ? '#ff2200' : b.phase >= 2 ? '#44ff88' : '#22cc44';
        ctx.fillStyle = '#001100';
        ctx.fillRect(CANVAS_W / 2 - 175, 20, 350, 16);
        ctx.fillStyle = wormBarColor;
        ctx.fillRect(CANVAS_W / 2 - 175, 20, 350 * (b.health / b.maxHealth), 16);
        ctx.strokeStyle = wormBarColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(CANVAS_W / 2 - 175, 20, 350, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px MedievalSharp';
        ctx.textAlign = 'center';
        ctx.fillText('THE MOTHER OF ALL ROT', CANVAS_W / 2, 52);
        const wormPhaseNames = ['The Awakening', 'The Bloom', 'Mechanized Wrath'];
        ctx.fillStyle = wormBarColor;
        ctx.font = '10px MedievalSharp';
        ctx.fillText(`Phase ${b.phase}: ${wormPhaseNames[b.phase - 1]}`, CANVAS_W / 2, 64);
      } else {
        const bossImage = isRT ? s.images.rottenTank : isRC ? s.images.rottenCore : s.images.boss;
        
        if (bossImage?.complete) {
          ctx.save();
          if (isRT) {
            ctx.shadowColor = b.phase >= 3 ? '#ff2200' : b.phase >= 2 ? '#ff6600' : '#ffaa00';
            ctx.shadowBlur = 20 + Math.sin(Date.now() * 0.004) * 10;
          } else if (isRC) {
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
        const bossBarColor = isRT
          ? (b.phase >= 3 ? '#ff2200' : b.phase >= 2 ? '#ff6600' : '#ffaa00')
          : isRC
          ? (b.phase >= 3 ? '#ff2200' : b.phase >= 2 ? '#44ff22' : '#22aa11')
          : (b.phase >= 3 ? '#ff2200' : b.phase >= 2 ? '#ff6600' : '#ff9900');
        ctx.fillStyle = '#330000';
        ctx.fillRect(CANVAS_W / 2 - 150, 20, 300, 16);
        ctx.fillStyle = bossBarColor;
        ctx.fillRect(CANVAS_W / 2 - 150, 20, 300 * (b.health / b.maxHealth), 16);
        ctx.strokeStyle = isRT ? '#ff6600' : isRC ? '#44ff22' : '#ffaa00';
        ctx.lineWidth = 2;
        ctx.strokeRect(CANVAS_W / 2 - 150, 20, 300, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px MedievalSharp';
        ctx.textAlign = 'center';
        ctx.fillText(isRT ? 'THE ROTTEN TANK' : isRC ? 'THE ROTTEN CORE' : 'THE ROTTEN COLOSSUS', CANVAS_W / 2, 52);
        
        if (isRC || isRT) {
          const phaseNames = isRT ? ['Armored Assault', 'Missile Barrage', 'Full Power'] : ['The Ancient Tree', 'The Corruption', 'Exposed Core'];
          ctx.fillStyle = bossBarColor;
          ctx.font = '10px MedievalSharp';
          ctx.fillText(`Phase ${b.phase}: ${phaseNames[b.phase - 1]}`, CANVAS_W / 2, 64);
        }
      }
    }

    // Draw companions (Chapter 11 — the inactive heroes follow as AI)
    if (s.companions.length > 0) {
      for (const comp of s.companions) {
        if (comp.health <= 0) continue;
        const compX = comp.x - camX;
        const compImage = comp.heroType === 'cj' ? s.images.cj
          : comp.heroType === 'levi' ? s.images.levi
          : comp.heroType === 'jesse' ? s.images.jesse
          : s.images.player;
        if (compImage?.complete) {
          ctx.save();
          // Flicker when hit
          if (comp.invincibleTimer > 0 && Math.floor(comp.invincibleTimer / 4) % 2 === 0) {
            ctx.globalAlpha = 0.4;
          }
          // Hero-specific glow
          if (comp.heroType === 'cj') {
            ctx.shadowColor = '#4488ff'; ctx.shadowBlur = 10;
          } else if (comp.heroType === 'levi') {
            ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 10;
          } else {
            ctx.shadowColor = '#44ff88'; ctx.shadowBlur = 8;
          }
          // Slightly transparent so they're clearly AI companions
          ctx.globalAlpha = (ctx.globalAlpha ?? 1) * 0.8;
          if (!comp.facingRight) {
            ctx.translate(compX + comp.width, comp.y);
            ctx.scale(-1, 1);
            ctx.drawImage(compImage, 0, 0, comp.width, comp.height);
          } else {
            ctx.drawImage(compImage, compX, comp.y, comp.width, comp.height);
          }
          ctx.shadowBlur = 0;
          ctx.restore();
          // Small companion HP bar under their feet
          const barW = comp.width;
          const barH = 4;
          const barY = comp.y + comp.height + 3;
          ctx.fillStyle = '#330000';
          ctx.fillRect(compX, barY, barW, barH);
          ctx.fillStyle = comp.heroType === 'cj' ? '#4488ff' : comp.heroType === 'levi' ? '#ff6600' : '#44ff88';
          ctx.fillRect(compX, barY, barW * (comp.health / comp.maxHealth), barH);
          // Label above their head
          ctx.fillStyle = '#ffffffcc';
          ctx.font = 'bold 9px MedievalSharp';
          ctx.textAlign = 'center';
          ctx.fillText(comp.heroType === 'cj' ? 'CJ' : comp.heroType === 'levi' ? 'LEVI' : 'ZACH', compX + comp.width / 2, comp.y - 5);
        }
      }
    }

    // Draw player
    const px = p.x - camX;
    const playerImage = p.isJesse ? s.images.jesse : p.isCJ ? s.images.cj : p.isLevi ? s.images.levi : s.images.player;
    const isRolling = s.rollState.isRolling;
    if (playerImage?.complete) {
      ctx.save();
      if (p.invincibleTimer > 0 && !isRolling && Math.floor(p.invincibleTimer / 4) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      // Character glow effects
      if (p.isCJ) {
        const rollGlow = isRolling ? 25 : 10;
        ctx.shadowColor = isRolling ? '#88ccff' : '#4488ff';
        ctx.shadowBlur = rollGlow + Math.sin(Date.now() * 0.005) * 4;
      } else if (p.isLevi) {
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 12 + Math.sin(Date.now() * 0.005) * 5;
      }

      if (isRolling) {
        // Combat roll: squish & stretch — player appears low and fast
        const rollProgress = 1 - s.rollState.rollTimer / 28;
        const squishX = 1.3 + Math.sin(rollProgress * Math.PI) * 0.3;
        const squishY = 0.55 + Math.sin(rollProgress * Math.PI) * 0.1;
        const centerX = px + p.width / 2;
        const bottomY = p.y + p.height;
        ctx.translate(centerX, bottomY);
        if (!p.facingRight) ctx.scale(-1, 1);
        ctx.scale(squishX, squishY);
        ctx.drawImage(playerImage, -p.width / 2, -p.height, p.width, p.height);
        // Roll speed lines
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 2;
        for (let li = 0; li < 3; li++) {
          const lx = centerX - (s.rollState.rollDir > 0 ? 1 : -1) * (20 + li * 14);
          const ly = p.y + p.height * 0.4 + li * 12;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx - (s.rollState.rollDir > 0 ? 1 : -1) * 18, ly);
          ctx.stroke();
        }
      } else if (!p.facingRight) {
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

    // ── Attack effect visuals (full remake) ──
    if (p.isAttacking) {
      const at = Date.now() * 0.001;
      ctx.save();

      if (p.isCJ) {
        // CJ: dramatic muzzle flash + shell casing
        const muzzX = p.facingRight ? px + p.width + 12 : px - 18;
        const muzzY = p.y + p.height / 2 - 4;
        // Outer flare
        ctx.shadowColor = '#ff9900'; ctx.shadowBlur = 24;
        ctx.fillStyle = '#ffcc44';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const ang = (i / 5) * Math.PI * 2 + at * 20;
          const r = 10 + Math.random() * 5;
          const ri = 4;
          ctx.lineTo(muzzX + Math.cos(ang) * r, muzzY + Math.sin(ang) * r);
          ctx.lineTo(muzzX + Math.cos(ang + Math.PI / 5) * ri, muzzY + Math.sin(ang + Math.PI / 5) * ri);
        }
        ctx.closePath(); ctx.fill();
        // Bright core
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(muzzX, muzzY, 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

      } else if (p.isLevi) {
        // Levi: massive chomping jaw with drool & darkness aura
        const biteX = p.facingRight ? px + p.width - 5 : px + 5;
        const biteDir = p.facingRight ? 1 : -1;
        const chomp = Math.abs(Math.sin(at * 15)) * 18;
        // Darkness aura
        const auraGrad = ctx.createRadialGradient(biteX + biteDir * 20, p.y + p.height / 2, 0, biteX + biteDir * 20, p.y + p.height / 2, 44);
        auraGrad.addColorStop(0, 'rgba(255,80,0,0.6)'); auraGrad.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath(); ctx.arc(biteX + biteDir * 20, p.y + p.height / 2, 44, 0, Math.PI * 2); ctx.fill();
        // Top jaw
        ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 12;
        ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(biteX, p.y + p.height / 2 - chomp);
        ctx.quadraticCurveTo(biteX + biteDir * 25, p.y + p.height / 2 - chomp * 0.4, biteX + biteDir * 44, p.y + p.height / 2);
        ctx.stroke();
        // Bottom jaw
        ctx.beginPath();
        ctx.moveTo(biteX, p.y + p.height / 2 + chomp);
        ctx.quadraticCurveTo(biteX + biteDir * 25, p.y + p.height / 2 + chomp * 0.4, biteX + biteDir * 44, p.y + p.height / 2);
        ctx.stroke();
        // Teeth
        ctx.fillStyle = '#ffeecc'; ctx.shadowBlur = 0;
        for (let t2 = 0; t2 < 4; t2++) {
          const tx = biteX + biteDir * (8 + t2 * 9);
          const th = 6 + Math.sin(t2) * 2;
          ctx.beginPath(); ctx.moveTo(tx - 3, p.y + p.height / 2 - chomp * 0.5); ctx.lineTo(tx, p.y + p.height / 2 - chomp * 0.5 + th); ctx.lineTo(tx + 3, p.y + p.height / 2 - chomp * 0.5); ctx.fill();
          ctx.beginPath(); ctx.moveTo(tx - 3, p.y + p.height / 2 + chomp * 0.5); ctx.lineTo(tx, p.y + p.height / 2 + chomp * 0.5 - th); ctx.lineTo(tx + 3, p.y + p.height / 2 + chomp * 0.5); ctx.fill();
        }

      } else if (weapon.id === 'forest_blade') {
        // Forest Blade: green glowing arc slash
        const slashX = p.facingRight ? px + p.width : px;
        const slashDir = p.facingRight ? 1 : -1;
        const progress = Math.max(0, 1 - p.attackTimer / weapon.speed);
        ctx.shadowColor = '#88ff44'; ctx.shadowBlur = 16;
        ctx.strokeStyle = '#aaff44'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(slashX, p.y + p.height / 2, weapon.range * 0.7, -Math.PI * 0.4 * slashDir, Math.PI * 0.4 * slashDir, slashDir < 0);
        ctx.stroke();
        // Leaf shards along slash
        ctx.fillStyle = '#44cc22'; ctx.shadowBlur = 6;
        for (let li = 0; li < 5; li++) {
          const ang = (-0.4 + li * 0.2) * Math.PI * slashDir;
          const lr = weapon.range * 0.65 * (0.7 + progress * 0.3);
          ctx.beginPath(); ctx.ellipse(slashX + Math.cos(ang) * lr, p.y + p.height / 2 + Math.sin(ang) * lr, 5, 3, ang + Math.PI / 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;

      } else if (weapon.id === 'vine_whip') {
        // Vine Whip: animated thorned multi-segment whip
        const wStartX = p.facingRight ? px + p.width : px;
        const wEndX = p.facingRight ? px + p.width + weapon.range : px - weapon.range;
        const wMidX = (wStartX + wEndX) / 2;
        const wProgress = Math.max(0, 1 - p.attackTimer / weapon.speed);
        const wCurX = wStartX + (wEndX - wStartX) * wProgress;
        const wAmp = 22 * Math.sin(at * 12);
        ctx.shadowColor = '#22cc44'; ctx.shadowBlur = 8;
        // Main vine segments
        ctx.strokeStyle = '#2a8822'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(wStartX, p.y + p.height / 2);
        ctx.quadraticCurveTo(wMidX * wProgress + wStartX * (1 - wProgress), p.y + p.height / 2 - wAmp, wCurX, p.y + p.height / 2 + Math.sin(at * 8) * 10);
        ctx.stroke();
        // Bright vine overlay
        ctx.strokeStyle = '#44dd66'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(wStartX, p.y + p.height / 2);
        ctx.quadraticCurveTo(wMidX * wProgress + wStartX * (1 - wProgress), p.y + p.height / 2 - wAmp, wCurX, p.y + p.height / 2 + Math.sin(at * 8) * 10);
        ctx.stroke();
        // Thorns
        ctx.fillStyle = '#88ff44'; ctx.shadowBlur = 4;
        for (let ti = 1; ti <= 4; ti++) {
          const tFrac = ti / 5 * wProgress;
          const tx2 = wStartX + (wCurX - wStartX) * tFrac;
          const ty2 = p.y + p.height / 2 + Math.sin(tFrac * Math.PI) * (-wAmp);
          const tAng = (p.facingRight ? 0.4 : -0.4) * Math.PI;
          ctx.beginPath(); ctx.moveTo(tx2, ty2); ctx.lineTo(tx2 + Math.cos(tAng) * 7, ty2 + Math.sin(tAng) * 7); ctx.lineTo(tx2 + 2, ty2); ctx.fill();
        }
        // Leaf at tip
        ctx.fillStyle = '#33aa22'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.ellipse(wCurX, p.y + p.height / 2 + Math.sin(at * 8) * 10, 7, 4, p.facingRight ? -0.4 : 0.4, 0, Math.PI * 2); ctx.fill();

      } else if (weapon.id === 'iron_fist') {
        // Iron Fist: massive orange fist silhouette + shockwave ring
        const fistX = p.facingRight ? px + p.width + 10 : px - 10;
        const fistDir = p.facingRight ? 1 : -1;
        const progress = Math.max(0, 1 - p.attackTimer / weapon.speed);
        const fistOff = progress * 30 * fistDir;
        // Shockwave rings
        ctx.shadowColor = '#ff6622'; ctx.shadowBlur = 20;
        ctx.strokeStyle = '#ff8844'; ctx.lineWidth = 3; ctx.globalAlpha = 1 - progress;
        ctx.beginPath(); ctx.arc(fistX + fistOff, p.y + p.height / 2, weapon.range * progress, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = (1 - progress) * 0.5;
        ctx.beginPath(); ctx.arc(fistX + fistOff, p.y + p.height / 2, weapon.range * progress * 0.6, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        // Fist knuckle silhouette
        ctx.fillStyle = '#ffaa44'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.roundRect(fistX + fistOff - 14, p.y + p.height / 2 - 12, 28, 24, 5); ctx.fill();
        ctx.fillStyle = '#cc5500'; ctx.shadowBlur = 0;
        for (let ki = 0; ki < 4; ki++) {
          ctx.beginPath(); ctx.arc(fistX + fistOff - 9 + ki * 6, p.y + p.height / 2 - 12, 4, Math.PI, 0); ctx.fill();
        }

      } else if (weapon.id === 'corruption_purge') {
        // Corruption Purge: expanding concentric purple rings + sparks
        const progress = Math.max(0, 1 - p.attackTimer / weapon.speed);
        for (let ri = 0; ri < 3; ri++) {
          const rProgress = Math.max(0, progress - ri * 0.15);
          ctx.globalAlpha = Math.max(0, (1 - rProgress) * 0.8);
          ctx.shadowColor = '#dd22ff'; ctx.shadowBlur = 18;
          ctx.strokeStyle = ri === 0 ? '#ff44ff' : ri === 1 ? '#cc22dd' : '#8800aa';
          ctx.lineWidth = 4 - ri;
          ctx.beginPath(); ctx.arc(px + p.width / 2, p.y + p.height / 2, weapon.aoeRadius! * rProgress, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        // Spark bursts at ring edge
        ctx.fillStyle = '#ff88ff';
        for (let si = 0; si < 8; si++) {
          const sang = (si / 8) * Math.PI * 2 + at * 6;
          const sr = weapon.aoeRadius! * progress;
          ctx.beginPath(); ctx.arc(px + p.width / 2 + Math.cos(sang) * sr, p.y + p.height / 2 + Math.sin(sang) * sr, 3, 0, Math.PI * 2); ctx.fill();
        }
      }

      ctx.restore();
    }

    // Draw airstrike warning markers (red X on ground before bombs land)
    for (const w of s.airstrikeWarnings) {
      const wx = w.x - camX;
      const blink = Math.floor(w.timer / 3) % 2 === 0;
      if (blink) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#ff2200';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 8;
        const gy = s.level!.groundY;
        ctx.beginPath();
        ctx.moveTo(wx - 12, gy - 14); ctx.lineTo(wx + 12, gy - 2);
        ctx.moveTo(wx + 12, gy - 14); ctx.lineTo(wx - 12, gy - 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // Draw projectiles
    for (const proj of s.projectiles) {
      const ppx = proj.x - camX;
      ctx.save();

      if (proj.isGrenade) {
        // Grenade: dark green sphere with bright fuse spark
        const cx = ppx + proj.width / 2;
        const cy = proj.y + proj.height / 2;
        const timeLeft = proj.lifetime;
        const blinkFast = timeLeft < 20 && Math.floor(timeLeft / 3) % 2 === 0;
        ctx.shadowColor = blinkFast ? '#ff4400' : '#44aa44';
        ctx.shadowBlur = blinkFast ? 18 : 10;
        // Body
        const gBody = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, proj.width / 2);
        gBody.addColorStop(0, '#88dd44');
        gBody.addColorStop(0.6, '#336622');
        gBody.addColorStop(1, '#1a3310');
        ctx.fillStyle = gBody;
        ctx.beginPath();
        ctx.arc(cx, cy, proj.width / 2, 0, Math.PI * 2);
        ctx.fill();
        // Grenade ridges
        ctx.strokeStyle = '#225511';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, proj.width / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
        // Fuse at top
        ctx.strokeStyle = blinkFast ? '#ff6600' : '#ffcc44';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 1, cy - proj.height / 2 + 1);
        ctx.quadraticCurveTo(cx + 5, cy - proj.height / 2 - 4, cx + 3, cy - proj.height / 2 - 8);
        ctx.stroke();
        // Fuse spark
        if (Math.random() > 0.4) {
          ctx.fillStyle = blinkFast ? '#ff4400' : '#ffee00';
          ctx.beginPath();
          ctx.arc(cx + 3, cy - proj.height / 2 - 8, 2 + Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (proj.isAirstrikeBomb) {
        // Airstrike bomb: red teardrop falling fast with trail
        const cx = ppx + proj.width / 2;
        const cy = proj.y + proj.height / 2;
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 15;
        // Bomb body
        const bGrad = ctx.createRadialGradient(cx, cy - 2, 1, cx, cy, proj.width / 2);
        bGrad.addColorStop(0, '#ff6644');
        bGrad.addColorStop(0.5, '#cc2200');
        bGrad.addColorStop(1, '#880000');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, proj.width / 2, proj.height / 2 + 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Nose cone
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - proj.height / 2);
        ctx.lineTo(cx + 4, cy - proj.height / 2);
        ctx.lineTo(cx, cy - proj.height / 2 - 7);
        ctx.closePath();
        ctx.fill();
        // Fins
        ctx.fillStyle = '#cc3300';
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy + proj.height / 2);
        ctx.lineTo(cx - 4, cy + proj.height / 2 - 6);
        ctx.lineTo(cx, cy + proj.height / 2 - 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 7, cy + proj.height / 2);
        ctx.lineTo(cx + 4, cy + proj.height / 2 - 6);
        ctx.lineTo(cx, cy + proj.height / 2 - 2);
        ctx.closePath();
        ctx.fill();
        // Speed trail
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.ellipse(cx, cy - proj.height / 2 - 10, 4, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (proj.isGlockBullet) {
        // Glock bullet: yellow-white elongated streak with motion trail
        const bx = ppx + proj.width / 2;
        const by = proj.y + proj.height / 2;
        const bDir = proj.velocityX > 0 ? 1 : -1;
        ctx.shadowColor = '#ffee44'; ctx.shadowBlur = 8;
        // Trail
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath(); ctx.ellipse(bx - bDir * 14, by, 12, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#ffee88';
        ctx.beginPath(); ctx.ellipse(bx - bDir * 7, by, 7, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        // Bullet head
        ctx.fillStyle = '#ffffcc';
        ctx.beginPath(); ctx.ellipse(bx, by, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

      } else if (proj.isBasketball) {
        // Basketball: orange ball with seams, slight glow
        const bx = ppx + proj.width / 2;
        const by = proj.y + proj.height / 2;
        const r = proj.width / 2;
        ctx.shadowColor = '#ff8822'; ctx.shadowBlur = 10;
        const bg = ctx.createRadialGradient(bx - 3, by - 3, 1, bx, by, r);
        bg.addColorStop(0, '#ffaa55');
        bg.addColorStop(1, '#cc4400');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Seams
        ctx.strokeStyle = '#331100'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx - r, by); ctx.lineTo(bx + r, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, by - r); ctx.lineTo(bx, by + r); ctx.stroke();
      } else if (proj.isFootball) {
        // Football: brown spiraling ovoid
        const fx = ppx + proj.width / 2;
        const fy = proj.y + proj.height / 2;
        const ang = (Date.now() * 0.04) % (Math.PI * 2);
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(proj.velocityX > 0 ? 0 : Math.PI);
        ctx.shadowColor = '#aa5533'; ctx.shadowBlur = 8;
        const fg = ctx.createRadialGradient(-2, -2, 1, 0, 0, proj.width / 2);
        fg.addColorStop(0, '#cc7744');
        fg.addColorStop(1, '#552200');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.ellipse(0, 0, proj.width / 2, proj.height / 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Laces
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.stroke();
        for (let l = -3; l <= 3; l += 2) {
          ctx.beginPath(); ctx.moveTo(l, -2); ctx.lineTo(l, 2); ctx.stroke();
        }
        ctx.restore();
        // Spiral spin sparkle
        ctx.fillStyle = '#ffffff';
        const sparkX = fx - Math.cos(ang) * 12 * (proj.velocityX > 0 ? 1 : -1);
        const sparkY = fy + Math.sin(ang) * 4;
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (proj.isToxicSpit) {
        // Toxic spit: bubbling green acid blob
        const tx2 = ppx + proj.width / 2;
        const ty2 = proj.y + proj.height / 2;
        const pt2 = Date.now() * 0.005;
        ctx.shadowColor = '#44ff00'; ctx.shadowBlur = 12;
        // Main blob with wobble
        const wobX = Math.sin(pt2 * 3) * 2;
        const wobY = Math.cos(pt2 * 4) * 2;
        const blobGrad = ctx.createRadialGradient(tx2 - 3, ty2 - 3, 1, tx2, ty2, proj.width / 2);
        blobGrad.addColorStop(0, '#aaffaa'); blobGrad.addColorStop(0.5, '#44cc00'); blobGrad.addColorStop(1, '#116600');
        ctx.fillStyle = blobGrad;
        ctx.beginPath(); ctx.ellipse(tx2 + wobX, ty2 + wobY, proj.width / 2 + 2, proj.height / 2, Math.sin(pt2) * 0.3, 0, Math.PI * 2); ctx.fill();
        // Bubbles
        ctx.fillStyle = '#88ff44'; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(tx2 - 4, ty2 - 4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tx2 + 5, ty2 + 2, 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

      } else if (proj.isDevouredShot) {
        // Devoured enemy projectile: spinning orange-red enemy ball
        const dx2 = ppx + proj.width / 2;
        const dy2 = proj.y + proj.height / 2;
        const da = Date.now() * 0.01;
        ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 16;
        // Outer spinning ring
        ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(dx2, dy2, proj.width / 2 + 3, 0, Math.PI * 2); ctx.stroke();
        // Core
        const dGrad = ctx.createRadialGradient(dx2 - 3, dy2 - 3, 1, dx2, dy2, proj.width / 2);
        dGrad.addColorStop(0, '#ffaa44'); dGrad.addColorStop(0.5, '#cc3300'); dGrad.addColorStop(1, '#660000');
        ctx.fillStyle = dGrad;
        ctx.beginPath(); ctx.arc(dx2, dy2, proj.width / 2, 0, Math.PI * 2); ctx.fill();
        // Spinning face bits
        ctx.fillStyle = '#ff8822'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(dx2 + Math.cos(da) * 7, dy2 + Math.sin(da) * 7, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(dx2 + Math.cos(da + Math.PI) * 7, dy2 + Math.sin(da + Math.PI) * 7, 3, 0, Math.PI * 2); ctx.fill();

      } else if (proj.weaponId === 'static_bolt') {
        // Static Bolt: crackling electric sphere with lightning arcs
        const sx = ppx + proj.width / 2;
        const sy = proj.y + proj.height / 2;
        const st = Date.now() * 0.006;
        ctx.shadowColor = '#88ccff'; ctx.shadowBlur = 18;
        // Core orb
        const sGrad = ctx.createRadialGradient(sx - 2, sy - 2, 1, sx, sy, proj.width / 2);
        sGrad.addColorStop(0, '#ffffff'); sGrad.addColorStop(0.4, '#aaccff'); sGrad.addColorStop(1, '#4466cc');
        ctx.fillStyle = sGrad;
        ctx.beginPath(); ctx.arc(sx, sy, proj.width / 2, 0, Math.PI * 2); ctx.fill();
        // Lightning arc bolts
        ctx.strokeStyle = '#aaddff'; ctx.lineWidth = 1.5;
        for (let li = 0; li < 4; li++) {
          const baseAng = (li / 4) * Math.PI * 2 + st * 3;
          const lr2 = proj.width / 2 + 6;
          ctx.beginPath();
          ctx.moveTo(sx + Math.cos(baseAng) * (proj.width / 2 - 1), sy + Math.sin(baseAng) * (proj.width / 2 - 1));
          const midAng = baseAng + 0.3 * (Math.sin(st * 5 + li) > 0 ? 1 : -1);
          ctx.lineTo(sx + Math.cos(midAng) * lr2 * 0.7, sy + Math.sin(midAng) * lr2 * 0.7);
          ctx.lineTo(sx + Math.cos(baseAng + 0.1) * lr2, sy + Math.sin(baseAng + 0.1) * lr2);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

      } else {
        // Enemy projectile or generic
        const projColor = proj.isPlayerProjectile ? weapon.color : '#ff4400';
        const gx2 = ppx + proj.width / 2; const gy2 = proj.y + proj.height / 2;
        ctx.shadowColor = projColor; ctx.shadowBlur = 12;
        const eGrad = ctx.createRadialGradient(gx2 - 2, gy2 - 2, 1, gx2, gy2, proj.width / 2 + 2);
        eGrad.addColorStop(0, '#ffffff'); eGrad.addColorStop(0.3, projColor); eGrad.addColorStop(1, projColor + '44');
        ctx.fillStyle = eGrad;
        ctx.beginPath(); ctx.arc(gx2, gy2, proj.width / 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Draw particles
    for (const pt of s.particles) {
      const ptx = pt.x - camX;
      ctx.globalAlpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;
      ctx.fillRect(ptx, pt.y, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // Flashbang flash overlay
    if (s.flashbangFlash > 0) {
      const flashAlpha = s.flashbangFlash / 25;
      ctx.fillStyle = `rgba(255, 255, 220, ${flashAlpha * 0.85})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

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
      14: '8-1: Army Camp',
      15: '8-2: Training Grounds',
      16: '9-1: Forward Base',
      17: '9-2: War Zone',
      18: '10-1: The Rotten Tank',
      19: '11-1: The Iron Convergence',
      20: '11-2: Worm Tunnels',
      21: '11-3: The Maw Awakens',
      22: '11-4: The Mother of All Rot',
    };
    ctx.fillText(chapterNames[s.levelNum] || `Level ${s.levelNum}`, CANVAS_W - 15, 48);

    // Chapter 11: Q-key hero swap hint
    if (s.level?.chapter === 11 && s.companions.length > 0) {
      const heroColors: Record<string, string> = { zachery: '#44ff88', levi: '#ff6600', cj: '#4488ff', jesse: '#ffee22' };
      const heroName = s.heroOrder[s.activeHeroIndex];
      const heroColor = heroColors[heroName] || '#ffffff';
      ctx.fillStyle = '#000000aa';
      ctx.fillRect(CANVAS_W / 2 - 120, CANVAS_H - 40, 240, 28);
      ctx.strokeStyle = heroColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(CANVAS_W / 2 - 120, CANVAS_H - 40, 240, 28);
      ctx.fillStyle = heroColor;
      ctx.font = 'bold 11px MedievalSharp';
      ctx.textAlign = 'center';
      const displayName = heroName === 'zachery' ? 'ZACHERY' : heroName === 'levi' ? 'LEVI' : heroName === 'jesse' ? 'JESSE' : 'CJ';
      ctx.fillText(`[Q] SWITCH HERO  |  ACTIVE: ${displayName}`, CANVAS_W / 2, CANVAS_H - 21);
    }

    // Weapon HUD (bottom left)
    if (p.isCJ) {
      ctx.fillStyle = '#000000aa';
      ctx.fillRect(10, CANVAS_H - 60, 300, 50);
      ctx.strokeStyle = '#4488ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, CANVAS_H - 60, 300, 50);
      ctx.fillStyle = '#4488ff';
      ctx.font = 'bold 14px MedievalSharp';
      ctx.textAlign = 'left';
      ctx.fillText('🔫 SGT. CJ', 20, CANVAS_H - 38);
      ctx.font = '11px MedievalSharp';
      ctx.fillStyle = '#88aacc';
      ctx.fillText(`Ammo: ${p.ammo}/${p.maxAmmo}  |  Grenades: ${p.grenadeCount}`, 20, CANVAS_H - 22);
      // CJ special selector display
      const cjSpecials: { label: string; key: string }[] = [];
      if (p.cjAbilities.includes('frag_grenade')) cjSpecials.push({ label: '💣 Grenade', key: 'frag_grenade' });
      if (p.cjAbilities.includes('flashbang')) cjSpecials.push({ label: '💥 Flashbang', key: 'flashbang' });
      if (p.cjAbilities.includes('airstrike')) cjSpecials.push({ label: '🚀 Airstrike', key: 'airstrike' });
      if (cjSpecials.length > 0) {
        const selIdx = s.cjSpecialIndex % cjSpecials.length;
        let hx = 160;
        ctx.font = '10px MedievalSharp';
        ctx.fillText('E:', hx, CANVAS_H - 38); hx += 22;
        cjSpecials.forEach((sp, si) => {
          const isSelected = si === (selIdx === 0 ? cjSpecials.length - 1 : selIdx - 1);
          ctx.fillStyle = isSelected ? '#ffee44' : '#667788';
          if (isSelected) { ctx.fillStyle = '#ffee44aa'; ctx.fillRect(hx - 2, CANVAS_H - 50, 80, 16); ctx.fillStyle = '#ffee44'; }
          ctx.fillText(sp.label, hx, CANVAS_H - 38);
          hx += 84;
        });
      }
      if (p.cjAbilities.includes('combat_roll')) {
        ctx.fillStyle = '#99aabb'; ctx.font = '10px MedievalSharp';
        ctx.fillText('2×←/→:Roll', 160, CANVAS_H - 24);
      }
    } else if (p.isJesse) {
      ctx.fillStyle = '#000000aa';
      ctx.fillRect(10, CANVAS_H - 60, 260, 50);
      ctx.strokeStyle = '#ffee22';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, CANVAS_H - 60, 260, 50);
      ctx.fillStyle = '#ffee22';
      ctx.font = 'bold 14px MedievalSharp';
      ctx.textAlign = 'left';
      ctx.fillText('🏀 JUBELENDE JESSE', 20, CANVAS_H - 38);
      ctx.font = '10px MedievalSharp';
      ctx.fillStyle = '#ffddaa';
      ctx.fillText('J: Basketball (bounces)   E: Football (pierce)', 20, CANVAS_H - 18);
    } else if (p.isLevi) {
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
      const controls = ['J:Devour', 'Jump:Shockwave'];
      if (p.leviAbilities.includes('toxic_spit') || p.devouredEnemies > 0) {
        const eLabel = p.devouredEnemies > 0 ? `E:Launch(${p.devouredEnemies})` : 'E:Spit';
        controls.push(eLabel);
      }
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

    // === SUCK ESCAPE OVERLAY ===
    if (s.suckState.active) {
      // Vignette pulse — swallowed by the worm
      const suckPulse = Math.sin(Date.now() * 0.012) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(0, 30, 0, ${0.55 + suckPulse * 0.2})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // "MASH J TO ESCAPE!" text
      ctx.save();
      const suckScale = 1 + Math.sin(Date.now() * 0.015) * 0.08;
      ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 60);
      ctx.scale(suckScale, suckScale);
      ctx.fillStyle = '#44ff88';
      ctx.shadowColor = '#44ff88';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 30px MedievalSharp';
      ctx.textAlign = 'center';
      ctx.fillText('MASH J TO ESCAPE!', 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();

      // Escape meter
      const mW = 360;
      const mH = 28;
      const mX = (CANVAS_W - mW) / 2;
      const mY = CANVAS_H / 2 - 20;
      ctx.fillStyle = '#001100aa';
      ctx.fillRect(mX - 2, mY - 2, mW + 4, mH + 4);
      ctx.fillStyle = '#001a00';
      ctx.fillRect(mX, mY, mW, mH);
      const escapePct = s.suckState.meter / 100;
      const escGrad = ctx.createLinearGradient(mX, mY, mX + mW, mY);
      escGrad.addColorStop(0, '#006600');
      escGrad.addColorStop(0.5, '#22ff44');
      escGrad.addColorStop(1, '#88ffaa');
      ctx.fillStyle = escGrad;
      ctx.fillRect(mX, mY, mW * escapePct, mH);
      ctx.strokeStyle = '#44ff88';
      ctx.lineWidth = 2;
      ctx.strokeRect(mX, mY, mW, mH);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px MedievalSharp';
      ctx.textAlign = 'center';
      ctx.fillText(`ESCAPE POWER: ${Math.floor(s.suckState.meter)}%`, CANVAS_W / 2, mY + mH + 20);
    }

    // === FINISHER RENDERING ===
    if (f.active) {
      // Darken screen edges
      ctx.fillStyle = '#00000066';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      
      if (f.arrowPhase === 'none') {
        const isRC = s.level?.boss?.bossType === 'rotten_core';
        const isTank = s.level?.boss?.bossType === 'rotten_tank';
        const pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
        ctx.save();
        ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 60);
        ctx.scale(pulseScale, pulseScale);
        const isWormBoss = s.level?.boss?.bossType === 'mech_worm';
        ctx.fillStyle = isTank ? '#4488ff' : isRC ? '#ff6600' : isWormBoss ? '#44ff88' : '#ffdd00';
        ctx.font = 'bold 36px MedievalSharp';
        ctx.textAlign = 'center';
        const finisherText = isTank ? 'MASH J — EMPTY THE MAG!' : isRC ? 'MASH J TO DEVOUR!' : isWormBoss ? 'MASH J — TRIPLE STRIKE!' : 'MASH J TO FINISH!';
        ctx.fillText(finisherText, 0, 0);
        ctx.restore();
        
        const meterW = 400;
        const meterH = 30;
        const meterX = (CANVAS_W - meterW) / 2;
        const meterY = CANVAS_H / 2 - 20;
        
        const isWormFinisher = s.level?.boss?.bossType === 'mech_worm';
        ctx.fillStyle = '#000000aa';
        ctx.fillRect(meterX - 2, meterY - 2, meterW + 4, meterH + 4);
        ctx.fillStyle = isRC ? '#001100' : isTank ? '#001133' : isWormFinisher ? '#001a00' : '#220000';
        ctx.fillRect(meterX, meterY, meterW, meterH);
        
        const fillW = meterW * (f.meter / 100);
        const meterGrad = ctx.createLinearGradient(meterX, 0, meterX + fillW, 0);
        if (isRC) {
          meterGrad.addColorStop(0, '#ff4400');
          meterGrad.addColorStop(0.5, '#ff6600');
          meterGrad.addColorStop(1, '#ff8800');
        } else if (isTank) {
          meterGrad.addColorStop(0, '#1144bb');
          meterGrad.addColorStop(0.5, '#2266ee');
          meterGrad.addColorStop(1, '#44aaff');
        } else if (isWormFinisher) {
          meterGrad.addColorStop(0, '#006600');
          meterGrad.addColorStop(0.33, '#44ff88');
          meterGrad.addColorStop(0.66, '#4488ff');
          meterGrad.addColorStop(1, '#ff6600');
        } else {
          meterGrad.addColorStop(0, '#ff4400');
          meterGrad.addColorStop(0.5, '#ffaa00');
          meterGrad.addColorStop(1, '#ffdd00');
        }
        ctx.fillStyle = meterGrad;
        ctx.fillRect(meterX, meterY, fillW, meterH);
        
        if (f.meter > 50) {
          ctx.shadowColor = isRC ? '#ff6600' : isTank ? '#44aaff' : isWormFinisher ? '#44ff88' : '#ffaa00';
          ctx.shadowBlur = f.meter / 5;
          ctx.strokeStyle = isRC ? '#ff8800' : isTank ? '#66bbff' : isWormFinisher ? '#66ffaa' : '#ffdd00';
          ctx.lineWidth = 2;
          ctx.strokeRect(meterX, meterY, meterW, meterH);
          ctx.shadowBlur = 0;
        }
        
        ctx.strokeStyle = isRC ? '#ff6644' : isTank ? '#4488cc' : isWormFinisher ? '#44ff88' : '#ffaa44';
        ctx.lineWidth = 2;
        ctx.strokeRect(meterX, meterY, meterW, meterH);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px MedievalSharp';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(f.meter)}%`, CANVAS_W / 2, meterY + 22);

        // Worm finisher: show all 3 hero icons converging
        if (isWormFinisher && s.level?.boss) {
          const b = s.level.boss;
          const bx = b.x - camX;
          const t2 = Date.now() * 0.006;
          const heroLabels = [{ label: 'ZACH', color: '#44ff88' }, { label: 'LEVI', color: '#ff6600' }, { label: 'CJ', color: '#4488ff' }];
          heroLabels.forEach((h, i) => {
            const angle = t2 + (Math.PI * 2 / 3) * i;
            const sx = bx + b.width / 2 + Math.cos(angle) * 60;
            const sy = b.y - 20 + Math.sin(angle) * 20;
            ctx.fillStyle = h.color;
            ctx.shadowColor = h.color;
            ctx.shadowBlur = 10;
            ctx.font = 'bold 11px MedievalSharp';
            ctx.textAlign = 'center';
            ctx.fillText(h.label, sx, sy);
            ctx.shadowBlur = 0;
          });
        } else if (s.level?.boss) {
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
        const isTank = s.level?.boss?.bossType === 'rotten_tank';
        if (isTank) {
          // CJ BULLET BARRAGE — cinematic sprint text
          const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.08;
          ctx.save();
          ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 80);
          ctx.scale(pulse, pulse);
          ctx.shadowColor = '#ffee44';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#ffee44';
          ctx.font = 'bold 32px MedievalSharp';
          ctx.textAlign = 'center';
          ctx.fillText('BULLET BARRAGE!', 0, 0);
          ctx.shadowBlur = 0;
          ctx.restore();
          
          // Draw muzzle flash streaks across screen (decorative)
          for (let i = 0; i < 4; i++) {
            const streakY = CANVAS_H * 0.3 + i * 40 + Math.sin(Date.now() * 0.03 + i) * 10;
            const streakX = ((Date.now() * 0.4 + i * 200) % (CANVAS_W + 200)) - 100;
            ctx.save();
            ctx.shadowColor = '#ffee44';
            ctx.shadowBlur = 8;
            const streakGrad = ctx.createLinearGradient(streakX - 40, streakY, streakX + 4, streakY);
            streakGrad.addColorStop(0, 'rgba(255,238,68,0)');
            streakGrad.addColorStop(0.6, 'rgba(255,238,68,0.7)');
            streakGrad.addColorStop(1, '#ffffff');
            ctx.fillStyle = streakGrad;
            ctx.fillRect(streakX - 40, streakY - 2, 44, 4);
            ctx.shadowBlur = 0;
            ctx.restore();
          }
          
          // Shell casings raining down (decorative)
          for (let i = 0; i < 5; i++) {
            const cx2 = ((Date.now() * 0.15 + i * 137) % CANVAS_W);
            const cy2 = ((Date.now() * 0.25 + i * 89) % CANVAS_H);
            ctx.save();
            ctx.fillStyle = '#ccaa22';
            ctx.fillRect(cx2, cy2, 4, 8);
            ctx.restore();
          }
        } else if (isRC) {
          // Levi devour rush — player is already rendered, show "DEVOUR!" text
          ctx.fillStyle = '#ff6600';
          ctx.globalAlpha = 0.9;
          ctx.font = 'bold 28px MedievalSharp';
          ctx.textAlign = 'center';
          ctx.fillText("SUPER LEVI DEVOURS!", CANVAS_W / 2, CANVAS_H / 2 - 80);
          ctx.globalAlpha = 1;
        } else if (s.level?.boss?.bossType === 'mech_worm') {
          // TRIPLE STRIKE: all three heroes converge on the worm
          const t3 = Date.now();
          const heroData = [
            { color: '#44ff88', label: 'ZACHERY', trail: '#22aa44' },
            { color: '#ff6600', label: 'LEVI', trail: '#aa3300' },
            { color: '#4488ff', label: 'CJ', trail: '#2244aa' },
          ];
          heroData.forEach((h, i) => {
            const prog = Math.min(1, (t3 % 600) / 600);
            const startX = CANVAS_W * (i * 0.33 + 0.1);
            const endX = f.arrowTargetX - camX;
            const curX = startX + (endX - startX) * prog;
            const curY = CANVAS_H / 2 + Math.sin(prog * Math.PI) * -60 + (i - 1) * 30;
            // Trail
            ctx.strokeStyle = h.trail;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(startX, CANVAS_H / 2 + (i - 1) * 30);
            ctx.lineTo(curX, curY);
            ctx.stroke();
            ctx.globalAlpha = 1;
            // Hero dot
            ctx.fillStyle = h.color;
            ctx.shadowColor = h.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(curX, curY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          });
          // "TRIPLE STRIKE!" text
          const tScale = 1 + Math.sin(t3 * 0.02) * 0.1;
          ctx.save();
          ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 80);
          ctx.scale(tScale, tScale);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#44ff88';
          ctx.shadowBlur = 20;
          ctx.font = 'bold 30px MedievalSharp';
          ctx.textAlign = 'center';
          ctx.fillText('TRIPLE STRIKE!', 0, 0);
          ctx.shadowBlur = 0;
          ctx.restore();
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
        const isTank = s.level?.boss?.bossType === 'rotten_tank';
        if (f.arrowPhase === 'impact' && f.explosionTimer < 5) {
          const alpha = 0.8 - f.explosionTimer * 0.15;
          const flashColor = isRC
            ? `rgba(68, 255, 34, ${alpha})`
            : isTank
            ? `rgba(255, 238, 68, ${alpha})`
            : `rgba(255, 255, 255, ${alpha})`;
          ctx.fillStyle = flashColor;
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        }
        
        // For CJ/tank impact: show "OBLITERATED!" text
        if (f.arrowPhase === 'impact' && isTank && f.explosionTimer > 5) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, (f.explosionTimer - 5) / 10);
          ctx.shadowColor = '#ffee44';
          ctx.shadowBlur = 30;
          ctx.fillStyle = '#ffee44';
          ctx.font = 'bold 48px MedievalSharp';
          ctx.textAlign = 'center';
          ctx.fillText('OBLITERATED!', CANVAS_W / 2, CANVAS_H / 2 - 50);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
          ctx.restore();
        }
        
        if (f.arrowPhase === 'impact' && !isRC && !isTank) {
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
          const progress = isTank ? f.explosionTimer / 90 : f.explosionTimer / 90;
          const ringColors = isRC
            ? ['#44ff2288', '#88ff4466', '#22aa1144']
            : isTank
            ? ['#ffee4488', '#ff880066', '#ff440044']
            : ['#ff440088', '#ffaa0066', '#ffdd0044'];
          
          for (let ring = 0; ring < 3; ring++) {
            const ringProgress = Math.min(1, (progress * 3 - ring * 0.3));
            if (ringProgress <= 0) continue;
            ctx.strokeStyle = ringColors[ring];
            ctx.lineWidth = isTank ? 3 - ring * 0.5 : 4 - ring;
            ctx.beginPath();
            ctx.arc(bx, by, ringProgress * (isTank ? 220 : 200), 0, Math.PI * 2);
            ctx.stroke();
          }
          
          if (isTank) {
            // "OBLITERATED!" lingers during explode phase
            ctx.save();
            ctx.globalAlpha = Math.max(0, 0.9 - progress * 0.8);
            ctx.shadowColor = '#ffee44';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ffee44';
            ctx.font = 'bold 48px MedievalSharp';
            ctx.textAlign = 'center';
            ctx.fillText('OBLITERATED!', CANVAS_W / 2, CANVAS_H / 2 - 50);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.restore();
          }
          
          ctx.globalAlpha = Math.max(0, 1 - progress);
          ctx.fillStyle = isRC ? '#44ff22' : isTank ? '#ffee44' : '#ffdd00';
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

  return { canvasRef, gameState, score, currentLevel, startGame, startAtLevel, beginLevel, setGameStateTo, CANVAS_W, CANVAS_H };
}
