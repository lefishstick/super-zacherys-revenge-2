import { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Player, Enemy, Boss, Projectile, Particle, Platform, Level } from './types';
import { createLevel } from './levels';

import onionImg from '@/assets/OnionEnemy.png';
import eggImg from '@/assets/eggEnemy.png';
import bossImg from '@/assets/finalboss_2.png';
import playerImg from '@/assets/playermodel.png';

const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const MOVE_SPEED = 4;
const CANVAS_W = 960;
const CANVAS_H = 600;
const ATTACK_RANGE = 70;
const ATTACK_DAMAGE = 1;

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
  });

  const loadImages = useCallback(() => {
    const srcs = { player: playerImg, onion: onionImg, egg: eggImg, boss: bossImg };
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
    s.player = {
      x: 50, y: level.groundY - 60,
      width: 40, height: 55,
      velocityX: 0, velocityY: 0,
      health: s.player?.health ?? 10,
      maxHealth: 10,
      isAttacking: false, attackTimer: 0,
      facingRight: true, isJumping: false, onGround: false,
      invincibleTimer: 0, score: s.score,
    };
  }, []);

  const beginLevel = useCallback((levelNum: number) => {
    stateRef.current.gameState = 'playing';
    stateRef.current.bossPhaseTriggered = { 2: false, 3: false };
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
    setScore(0);
    setCurrentLevel(1);
    initLevel(1);
    setGameState('playing');
  }, [initLevel]);

  const update = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing' || !s.player || !s.level) return;
    
    const p = s.player;
    const level = s.level;
    const keys = s.keys;

    // Player movement
    if (keys.has('ArrowLeft') || keys.has('a')) {
      p.velocityX = -MOVE_SPEED;
      p.facingRight = false;
    } else if (keys.has('ArrowRight') || keys.has('d')) {
      p.velocityX = MOVE_SPEED;
      p.facingRight = true;
    } else {
      p.velocityX *= 0.8;
    }

    if ((keys.has('ArrowUp') || keys.has('w') || keys.has(' ')) && p.onGround) {
      p.velocityY = JUMP_FORCE;
      p.onGround = false;
      p.isJumping = true;
    }

    // Attack
    if (keys.has('z') || keys.has('j')) {
      if (!p.isAttacking && p.attackTimer <= 0) {
        p.isAttacking = true;
        p.attackTimer = 20;
        spawnParticles(
          p.x + (p.facingRight ? p.width + 20 : -20),
          p.y + p.height / 2,
          '#aaff44', 5
        );
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

    // Attack hitbox
    const atkX = p.facingRight ? p.x + p.width : p.x - ATTACK_RANGE;
    const atkY = p.y;

    // Update enemies
    for (const e of level.enemies) {
      if (!e.isAlive) continue;
      
      // Simple AI: patrol and chase player
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

      // Enemy platform collision
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

      // Player attack hits enemy
      if (p.isAttacking && p.attackTimer > 15) {
        if (
          atkX < e.x + e.width && atkX + ATTACK_RANGE > e.x &&
          atkY < e.y + e.height && atkY + p.height > e.y
        ) {
          e.health -= ATTACK_DAMAGE;
          e.velocityX = (p.facingRight ? 1 : -1) * 8;
          e.velocityY = -3;
          spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ff6644', 8);
          if (e.health <= 0) {
            e.isAlive = false;
            s.score += e.type === 'onion' ? 300 : 200;
            spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ffaa00', 15);
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

      if (b.attackCooldown <= 0) {
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

      b.velocityY += GRAVITY;
      if (b.attackType !== 'charge') b.velocityX *= 0.95;
      b.x += b.velocityX;
      b.y += b.velocityY;

      // Boss platform collision
      for (const plat of level.platforms) {
        if (
          b.x + b.width > plat.x && b.x < plat.x + plat.width &&
          b.y + b.height > plat.y && b.y + b.height < plat.y + plat.height + 20 &&
          b.velocityY >= 0
        ) {
          b.y = plat.y - b.height;
          b.velocityY = 0;
          if (b.attackType === 'stomp') {
            spawnParticles(b.x + b.width / 2, b.y + b.height, '#886633', 20);
            b.attackType = 'idle';
          }
        }
      }

      if (b.x < 0) { b.x = 0; b.velocityX *= -1; }
      if (b.x > level.width - b.width) { b.x = level.width - b.width; b.velocityX *= -1; }

      // Player attack hits boss
      if (p.isAttacking && p.attackTimer > 15) {
        if (
          atkX < b.x + b.width && atkX + ATTACK_RANGE > b.x &&
          atkY < b.y + b.height && atkY + p.height > b.y
        ) {
          b.health -= ATTACK_DAMAGE;
          spawnParticles(atkX + ATTACK_RANGE / 2, atkY + p.height / 2, '#ffaa00', 10);
          if (b.health <= 0) {
            b.isAlive = false;
            s.score += 2000;
            spawnParticles(b.x + b.width / 2, b.y + b.height / 2, '#ff4400', 30);
            spawnParticles(b.x + b.width / 2, b.y + b.height / 2, '#ffdd00', 30);
            s.gameState = 'victory';
            setGameState('victory');
          }
          // Phase transitions with cutscenes
          if (b.health < b.maxHealth * 0.3 && b.phase < 3) {
            b.phase = 3;
            if (!s.bossPhaseTriggered[3]) {
              s.bossPhaseTriggered[3] = true;
              window.dispatchEvent(new CustomEvent('boss_phase_cutscene', { detail: 'boss_phase3' }));
            }
          } else if (b.health < b.maxHealth * 0.6 && b.phase < 2) {
            b.phase = 2;
            if (!s.bossPhaseTriggered[2]) {
              s.bossPhaseTriggered[2] = true;
              window.dispatchEvent(new CustomEvent('boss_phase_cutscene', { detail: 'boss_phase2' }));
            }
          }
        }
      }

      // Boss damages player
      if (p.invincibleTimer <= 0) {
        if (
          p.x < b.x + b.width && p.x + p.width > b.x &&
          p.y < b.y + b.height && p.y + p.height > b.y
        ) {
          p.health -= 2;
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

      // Hit player
      if (!proj.isPlayerProjectile && p.invincibleTimer <= 0) {
        if (
          p.x < proj.x + proj.width && p.x + p.width > proj.x &&
          p.y < proj.y + proj.height && p.y + p.height > proj.y
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
        if (nextLevel <= 4) {
          setScore(s.score);
          // Use cutscene-based transition via GameCanvas
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
  }, [initLevel]);

  const drawForestBG = (ctx: CanvasRenderingContext2D, camX: number) => {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    skyGrad.addColorStop(0, '#0a1a0a');
    skyGrad.addColorStop(0.5, '#0d2810');
    skyGrad.addColorStop(1, '#1a3318');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Moon
    ctx.fillStyle = '#ccddaa';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(700 - camX * 0.05, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Background trees (parallax)
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

    // Mid trees
    ctx.fillStyle = '#0f2a0f';
    for (let i = 0; i < 15; i++) {
      const tx = i * 160 - (camX * 0.4) % 320 - 160;
      const th = 150 + Math.sin(i * 2.3) * 60;
      ctx.beginPath();
      ctx.moveTo(tx, CANVAS_H - 100);
      ctx.lineTo(tx + 25, CANVAS_H - 100 - th);
      ctx.lineTo(tx + 50, CANVAS_H - 100);
      ctx.fill();
    }

    // Fog particles
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#88ff88';
    for (let i = 0; i < 8; i++) {
      const fx = (i * 300 + Date.now() * 0.01) % (CANVAS_W + 200) - 100;
      const fy = 350 + Math.sin(Date.now() * 0.001 + i) * 30;
      ctx.beginPath();
      ctx.arc(fx, fy, 50 + Math.sin(i) * 20, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
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

    drawForestBG(ctx, camX);

    // Draw platforms
    for (const plat of s.level.platforms) {
      const px = plat.x - camX;
      if (px + plat.width < -50 || px > CANVAS_W + 50) continue;
      
      if (plat.height > 50) {
        // Ground
        const groundGrad = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.height);
        groundGrad.addColorStop(0, '#2a4a1a');
        groundGrad.addColorStop(0.1, '#1a3310');
        groundGrad.addColorStop(1, '#0a1a05');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(px, plat.y, plat.width, plat.height);
        // Grass line
        ctx.strokeStyle = '#44aa22';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px, plat.y);
        ctx.lineTo(px + plat.width, plat.y);
        ctx.stroke();
      } else {
        // Floating platform
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(px, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#2a5a15';
        ctx.fillRect(px, plat.y, plat.width, 4);
        // Vines
        ctx.strokeStyle = '#227711';
        ctx.lineWidth = 1;
        for (let v = px + 10; v < px + plat.width; v += 30) {
          ctx.beginPath();
          ctx.moveTo(v, plat.y + plat.height);
          ctx.lineTo(v + 5, plat.y + plat.height + 15);
          ctx.stroke();
        }
      }
    }

    // Draw enemies
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

      // Health bar
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
      const img = s.images.boss;
      if (img?.complete) {
        ctx.save();
        // Boss glow
        ctx.shadowColor = b.phase >= 3 ? '#ff0000' : b.phase >= 2 ? '#ff6600' : '#ff9900';
        ctx.shadowBlur = 20 + Math.sin(Date.now() * 0.005) * 10;
        if (b.direction > 0) {
          ctx.translate(bx + b.width, b.y);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, b.width, b.height);
        } else {
          ctx.drawImage(img, bx, b.y, b.width, b.height);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Boss health bar
      ctx.fillStyle = '#330000';
      ctx.fillRect(CANVAS_W / 2 - 150, 20, 300, 16);
      ctx.fillStyle = b.phase >= 3 ? '#ff2200' : b.phase >= 2 ? '#ff6600' : '#ff9900';
      ctx.fillRect(CANVAS_W / 2 - 150, 20, 300 * (b.health / b.maxHealth), 16);
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 2;
      ctx.strokeRect(CANVAS_W / 2 - 150, 20, 300, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px MedievalSharp';
      ctx.textAlign = 'center';
      ctx.fillText('THE ROTTEN COLOSSUS', CANVAS_W / 2, 52);
    }

    // Draw player
    const px = p.x - camX;
    const img = s.images.player;
    if (img?.complete) {
      ctx.save();
      if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer / 4) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      if (!p.facingRight) {
        ctx.translate(px + p.width, p.y);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, p.width, p.height);
      } else {
        ctx.drawImage(img, px, p.y, p.width, p.height);
      }
      ctx.restore();
    }

    // Attack effect
    if (p.isAttacking) {
      const ax = p.facingRight ? px + p.width : px - ATTACK_RANGE;
      ctx.fillStyle = 'rgba(170, 255, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(ax + ATTACK_RANGE / 2, p.y + p.height / 2, 25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw projectiles
    for (const proj of s.projectiles) {
      const ppx = proj.x - camX;
      ctx.fillStyle = proj.isPlayerProjectile ? '#aaff44' : '#ff4400';
      ctx.shadowColor = proj.isPlayerProjectile ? '#aaff44' : '#ff4400';
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
    // Health
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
    ctx.fillText(`Level ${s.levelNum}`, CANVAS_W - 15, 48);

    // Direction indicator if not boss level
    if (!s.level.isBossLevel) {
      const allDead = s.level.enemies.every(e => !e.isAlive);
      if (allDead) {
        ctx.fillStyle = '#aaff44';
        ctx.font = '14px MedievalSharp';
        ctx.textAlign = 'center';
        ctx.fillText('→ Go right to proceed →', CANVAS_W / 2, CANVAS_H - 20);
      }
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
