import { useEffect, useRef, useState } from 'react';
import bossImg from '@/assets/finalboss_2.png';

interface TitleScreenProps {
  onStart: () => void;
}

interface Leaf {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  sway: number;
  swaySpeed: number;
  opacity: number;
  type: number; // 0-2 for different leaf shapes
}

interface TreeLeaf {
  id: number;
  x: number;
  y: number;
  swayAmount: number;
  swaySpeed: number;
  size: number;
  opacity: number;
}

const TitleScreen = ({ onStart }: TitleScreenProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>(0);
  const leavesRef = useRef<Leaf[]>([]);
  const treeLeavesRef = useRef<TreeLeaf[]>([]);
  const [ready, setReady] = useState(false);

  // Start title music
  useEffect(() => {
    const audio = new Audio('/audio/title_theme.mp3');
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;
    audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // Initialize forest scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Create tree canopy leaves (stationary, swaying)
    const treeLeaves: TreeLeaf[] = [];
    for (let i = 0; i < 80; i++) {
      treeLeaves.push({
        id: i,
        x: Math.random() * W,
        y: Math.random() * H * 0.5,
        swayAmount: 2 + Math.random() * 4,
        swaySpeed: 0.3 + Math.random() * 0.7,
        size: 8 + Math.random() * 16,
        opacity: 0.3 + Math.random() * 0.5,
      });
    }
    treeLeavesRef.current = treeLeaves;

    // Create falling leaves
    const leaves: Leaf[] = [];
    for (let i = 0; i < 20; i++) {
      leaves.push(createLeaf(i, W, H, true));
    }
    leavesRef.current = leaves;

    setReady(true);

    let t = 0;
    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // Sky gradient (dark forest)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, 'hsl(150, 20%, 4%)');
      skyGrad.addColorStop(0.4, 'hsl(150, 25%, 8%)');
      skyGrad.addColorStop(1, 'hsl(150, 15%, 6%)');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Distant trees (silhouettes)
      drawDistantTrees(ctx, W, H, t);

      // Mid-ground trees
      drawMidTrees(ctx, W, H, t);

      // Foreground tree trunks
      drawForegroundTrees(ctx, W, H);

      // Tree canopy leaves (swaying)
      for (const leaf of treeLeavesRef.current) {
        const sx = leaf.x + Math.sin(t * leaf.swaySpeed + leaf.id) * leaf.swayAmount;
        const sy = leaf.y + Math.cos(t * leaf.swaySpeed * 0.7 + leaf.id * 0.5) * (leaf.swayAmount * 0.5);
        drawLeafShape(ctx, sx, sy, leaf.size, leaf.opacity, t + leaf.id, leaf.id % 3);
      }

      // Falling leaves
      for (const leaf of leavesRef.current) {
        leaf.y += leaf.speed;
        leaf.x += Math.sin(t * leaf.swaySpeed + leaf.sway) * 0.8;
        leaf.rotation += leaf.speed * 2;

        if (leaf.y > H + 20) {
          Object.assign(leaf, createLeaf(leaf.id, W, H, false));
        }

        drawFallingLeaf(ctx, leaf, t);
      }

      // Ground with fallen leaves texture
      drawGround(ctx, W, H, t);

      // Fog/mist
      drawFog(ctx, W, H, t);

      // Vignette
      const vigGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7);
      vigGrad.addColorStop(0, 'transparent');
      vigGrad.addColorStop(1, 'rgba(5, 15, 8, 0.7)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, W, H);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="absolute inset-0 w-full h-full"
      />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <img
          src={bossImg}
          alt="Boss"
          className="w-28 h-28 object-contain animate-float opacity-50"
          style={{ filter: 'drop-shadow(0 0 24px hsl(25 90% 50% / 0.5))' }}
        />

        <h1 className="font-display text-3xl md:text-5xl font-black text-center leading-tight animate-pulse-glow text-primary drop-shadow-lg">
          Super Zachery's
          <br />
          Revenge 2
        </h1>

        <p className="font-game text-lg text-muted-foreground text-center tracking-wider drop-shadow-md">
          Journey Through the Dark Forest
        </p>

        <button
          onClick={onStart}
          className="mt-4 px-10 py-4 bg-primary text-primary-foreground font-game text-xl rounded-lg
            hover:bg-primary/90 transition-all duration-300
            shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)]
            active:scale-95"
        >
          ⚔️ Start Adventure ⚔️
        </button>

        <div className="mt-6 text-muted-foreground font-game text-sm text-center space-y-1 drop-shadow-md">
          <p>Arrow Keys / WASD — Move & Jump</p>
          <p>Z / J — Attack</p>
        </div>
      </div>
    </div>
  );
};

function createLeaf(id: number, W: number, H: number, randomY: boolean): Leaf {
  return {
    id,
    x: Math.random() * W,
    y: randomY ? Math.random() * H : -20 - Math.random() * 60,
    size: 5 + Math.random() * 10,
    rotation: Math.random() * 360,
    speed: 0.4 + Math.random() * 0.8,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.5 + Math.random() * 1,
    opacity: 0.4 + Math.random() * 0.5,
    type: Math.floor(Math.random() * 3),
  };
}

function drawLeafShape(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number, rot: number, type: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot * 0.02);
  ctx.globalAlpha = opacity;

  const colors = ['hsl(100, 40%, 30%)', 'hsl(120, 35%, 25%)', 'hsl(80, 45%, 35%)'];
  ctx.fillStyle = colors[type];

  ctx.beginPath();
  if (type === 0) {
    ctx.ellipse(0, 0, size * 0.5, size, 0, 0, Math.PI * 2);
  } else if (type === 1) {
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.8, 0, 0, size);
    ctx.quadraticCurveTo(-size * 0.8, 0, 0, -size);
  } else {
    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

function drawFallingLeaf(ctx: CanvasRenderingContext2D, leaf: Leaf, _t: number) {
  ctx.save();
  ctx.translate(leaf.x, leaf.y);
  ctx.rotate((leaf.rotation * Math.PI) / 180);
  ctx.globalAlpha = leaf.opacity;

  const colors = ['hsl(45, 60%, 40%)', 'hsl(30, 50%, 35%)', 'hsl(80, 40%, 30%)'];
  ctx.fillStyle = colors[leaf.type];

  ctx.beginPath();
  ctx.moveTo(0, -leaf.size);
  ctx.quadraticCurveTo(leaf.size * 0.7, -leaf.size * 0.3, leaf.size * 0.3, leaf.size * 0.5);
  ctx.quadraticCurveTo(0, leaf.size, -leaf.size * 0.3, leaf.size * 0.5);
  ctx.quadraticCurveTo(-leaf.size * 0.7, -leaf.size * 0.3, 0, -leaf.size);
  ctx.fill();
  ctx.restore();
}

function drawDistantTrees(ctx: CanvasRenderingContext2D, W: number, H: number, _t: number) {
  ctx.fillStyle = 'hsl(150, 20%, 8%)';
  for (let i = 0; i < 12; i++) {
    const x = (i / 12) * W + 20;
    const h = 100 + Math.sin(i * 2.3) * 40;
    const w = 30 + Math.sin(i * 1.7) * 15;
    // Triangle tree
    ctx.beginPath();
    ctx.moveTo(x, H * 0.65);
    ctx.lineTo(x - w, H * 0.65);
    ctx.lineTo(x - w / 2, H * 0.65 - h);
    ctx.fill();
  }
}

function drawMidTrees(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  ctx.fillStyle = 'hsl(150, 18%, 10%)';
  for (let i = 0; i < 8; i++) {
    const x = (i / 8) * W + 40;
    const h = 140 + Math.sin(i * 3.1) * 50;
    const w = 40 + Math.sin(i * 1.3) * 20;
    const sway = Math.sin(t * 0.3 + i) * 2;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, H * 0.7);
    ctx.lineTo(x + w / 2, H * 0.7);
    ctx.lineTo(x + sway, H * 0.7 - h);
    ctx.fill();
    // Trunk
    ctx.fillStyle = 'hsl(30, 20%, 12%)';
    ctx.fillRect(x - 4, H * 0.7 - 20, 8, 40);
    ctx.fillStyle = 'hsl(150, 18%, 10%)';
  }
}

function drawForegroundTrees(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = 'hsl(30, 15%, 8%)';
  // Left trunk
  ctx.fillRect(20, H * 0.3, 18, H * 0.7);
  ctx.fillRect(W - 50, H * 0.25, 20, H * 0.75);
  // Branches
  ctx.strokeStyle = 'hsl(30, 15%, 10%)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(29, H * 0.4);
  ctx.lineTo(70, H * 0.32);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W - 40, H * 0.35);
  ctx.lineTo(W - 90, H * 0.28);
  ctx.stroke();
}

function drawGround(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const groundY = H * 0.78;
  const grad = ctx.createLinearGradient(0, groundY, 0, H);
  grad.addColorStop(0, 'hsl(150, 20%, 10%)');
  grad.addColorStop(1, 'hsl(150, 15%, 5%)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundY, W, H - groundY);

  // Scattered ground leaves
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 15; i++) {
    const lx = (i / 15) * W + Math.sin(i * 4.2) * 30;
    const ly = groundY + 5 + Math.sin(i * 2.7) * 8;
    drawLeafShape(ctx, lx, ly, 6, 0.3, t * 0.01 + i, i % 3);
  }
  ctx.globalAlpha = 1;
}

function drawFog(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = 'hsl(150, 30%, 40%)';
  for (let i = 0; i < 4; i++) {
    const fx = Math.sin(t * 0.15 + i * 1.5) * 100 + W * 0.3 * i;
    const fy = H * 0.55 + Math.cos(t * 0.1 + i) * 20;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 200, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export default TitleScreen;
