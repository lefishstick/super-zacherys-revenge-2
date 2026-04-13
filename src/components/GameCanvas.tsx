import { useEffect, useRef } from 'react';
import { useGameLoop } from '@/game/useGameLoop';
import TitleScreen from './TitleScreen';
import GameOverScreen from './GameOverScreen';

const GameCanvas = () => {
  const { canvasRef, gameState, score, currentLevel, startGame, CANVAS_W, CANVAS_H } = useGameLoop();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (gameState === 'playing') {
      if (!audioRef.current) {
        audioRef.current = new Audio('/audio/theme.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.4;
      }
      audioRef.current.play().catch(() => {});
    } else if (gameState === 'title') {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
  }, [gameState]);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden">
      <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="border-2 border-border rounded-lg shadow-[0_0_40px_hsl(var(--primary)/0.2)]"
          style={{ imageRendering: 'auto' }}
        />
        
        {gameState === 'title' && <TitleScreen onStart={startGame} />}
        {gameState === 'gameover' && <GameOverScreen score={score} onRestart={startGame} />}
        {gameState === 'victory' && <GameOverScreen score={score} onRestart={startGame} victory />}
      </div>
    </div>
  );
};

export default GameCanvas;
