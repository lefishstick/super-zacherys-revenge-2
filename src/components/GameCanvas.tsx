import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameLoop } from '@/game/useGameLoop';
import { CUTSCENES, LEVEL_CUTSCENE_BEFORE, VICTORY_CUTSCENE, WEAPON_CUTSCENES, LEVI_ABILITY_CUTSCENES, CJ_ABILITY_CUTSCENES } from '@/game/cutscenes';
import { Cutscene } from '@/game/types';
import TitleScreen from './TitleScreen';
import GameOverScreen from './GameOverScreen';
import CutsceneScreen from './CutsceneScreen';

const GameCanvas = () => {
  const { canvasRef, gameState, score, currentLevel, startGame, beginLevel, setGameStateTo, CANVAS_W, CANVAS_H } = useGameLoop();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const leviAudioRef = useRef<HTMLAudioElement | null>(null);
  const cjAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isLevi, setIsLevi] = useState(false);
  const [isCJ, setIsCJ] = useState(false);
  const [cutsceneQueue, setCutsceneQueue] = useState<Cutscene[]>([]);
  const [showCutscene, setShowCutscene] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);
  const [showVictoryCutscene, setShowVictoryCutscene] = useState(false);

  // Listen for Levi switch event
  useEffect(() => {
    const handler = () => {
      setIsLevi(true);
      // Switch music
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      if (!leviAudioRef.current) {
        leviAudioRef.current = new Audio('/audio/levi-theme.mp3');
        leviAudioRef.current.loop = true;
        leviAudioRef.current.volume = 0.4;
      }
      leviAudioRef.current.play().catch(() => {});
    };
    window.addEventListener('switch_to_levi', handler);
    return () => window.removeEventListener('switch_to_levi', handler);
  }, []);

  // Listen for CJ switch event
  useEffect(() => {
    const handler = () => {
      setIsCJ(true);
      setIsLevi(false);
      audioRef.current?.pause();
      leviAudioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      if (leviAudioRef.current) leviAudioRef.current.currentTime = 0;
      if (!cjAudioRef.current) {
        cjAudioRef.current = new Audio('/audio/cj-theme.mp3');
        cjAudioRef.current.loop = true;
        cjAudioRef.current.volume = 0.4;
      }
      cjAudioRef.current.play().catch(() => {});
    };
    window.addEventListener('switch_to_cj', handler);
    return () => window.removeEventListener('switch_to_cj', handler);
  }, []);

  useEffect(() => {
    if (gameState === 'playing' || gameState === 'cutscene') {
      if (isCJ) {
        if (!cjAudioRef.current) {
          cjAudioRef.current = new Audio('/audio/cj-theme.mp3');
          cjAudioRef.current.loop = true;
          cjAudioRef.current.volume = 0.4;
        }
        cjAudioRef.current.play().catch(() => {});
      } else if (isLevi) {
        if (!leviAudioRef.current) {
          leviAudioRef.current = new Audio('/audio/levi-theme.mp3');
          leviAudioRef.current.loop = true;
          leviAudioRef.current.volume = 0.4;
        }
        leviAudioRef.current.play().catch(() => {});
      } else {
        if (!audioRef.current) {
          audioRef.current = new Audio('/audio/theme.mp3');
          audioRef.current.loop = true;
          audioRef.current.volume = 0.4;
        }
        audioRef.current.play().catch(() => {});
      }
    } else if (gameState === 'title' || gameState === 'gameover') {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      leviAudioRef.current?.pause();
      if (leviAudioRef.current) leviAudioRef.current.currentTime = 0;
      cjAudioRef.current?.pause();
      if (cjAudioRef.current) cjAudioRef.current.currentTime = 0;
    }
  }, [gameState, isLevi]);

  // When game signals a cutscene-before-level
  useEffect(() => {
    if (gameState === 'cutscene') {
      // Already handled
    }
  }, [gameState]);

  const handleStart = useCallback(() => {
    // Show intro cutscenes before level 1
    const sceneIds = LEVEL_CUTSCENE_BEFORE[1] || [];
    const scenes = sceneIds.map(id => CUTSCENES[id]).filter(Boolean);
    if (scenes.length > 0) {
      setCutsceneQueue(scenes);
      setShowCutscene(true);
      setPendingLevel(1);
      setGameStateTo('cutscene');
    } else {
      startGame();
    }
  }, [startGame, setGameStateTo]);

  // Handle level transitions with cutscenes
  const handleLevelTransition = useCallback((nextLevel: number) => {
    const sceneIds = LEVEL_CUTSCENE_BEFORE[nextLevel] || [];
    const scenes = sceneIds.map(id => CUTSCENES[id]).filter(Boolean);
    if (scenes.length > 0) {
      setCutsceneQueue(scenes);
      setShowCutscene(true);
      setPendingLevel(nextLevel);
      setGameStateTo('cutscene');
    } else {
      beginLevel(nextLevel);
    }
  }, [beginLevel, setGameStateTo]);

  // Expose level transition handler
  useEffect(() => {
    (window as any).__handleLevelTransition = handleLevelTransition;
    return () => { delete (window as any).__handleLevelTransition; };
  }, [handleLevelTransition]);

  // Handle victory cutscene
  useEffect(() => {
    if (gameState === 'victory' && !showVictoryCutscene) {
      const scene = CUTSCENES[VICTORY_CUTSCENE];
      if (scene) {
        setCutsceneQueue([scene]);
        setShowCutscene(true);
        setShowVictoryCutscene(true);
      }
    }
  }, [gameState, showVictoryCutscene]);

  // Handle boss phase cutscenes
  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      const scene = CUTSCENES[e.detail];
      if (scene) {
        setCutsceneQueue([scene]);
        setShowCutscene(true);
        setGameStateTo('cutscene');
      }
    };
    window.addEventListener('boss_phase_cutscene' as any, handler);
    return () => window.removeEventListener('boss_phase_cutscene' as any, handler);
  }, [setGameStateTo]);

  // Handle weapon pickup cutscenes
  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      const cutsceneId = WEAPON_CUTSCENES[e.detail];
      if (cutsceneId) {
        const scene = CUTSCENES[cutsceneId];
        if (scene) {
          setCutsceneQueue([scene]);
          setShowCutscene(true);
          setGameStateTo('cutscene');
        }
      }
    };
    window.addEventListener('weapon_pickup' as any, handler);
    return () => window.removeEventListener('weapon_pickup' as any, handler);
  }, [setGameStateTo]);

  // Handle Levi ability pickup cutscenes
  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      const cutsceneId = LEVI_ABILITY_CUTSCENES[e.detail];
      if (cutsceneId) {
        const scene = CUTSCENES[cutsceneId];
        if (scene) {
          setCutsceneQueue([scene]);
          setShowCutscene(true);
          setGameStateTo('cutscene');
        }
      }
    };
    window.addEventListener('levi_ability_pickup' as any, handler);
    return () => window.removeEventListener('levi_ability_pickup' as any, handler);
  }, [setGameStateTo]);

  // Handle CJ ability pickup cutscenes
  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      const cutsceneId = CJ_ABILITY_CUTSCENES[e.detail];
      if (cutsceneId) {
        const scene = CUTSCENES[cutsceneId];
        if (scene) {
          setCutsceneQueue([scene]);
          setShowCutscene(true);
          setGameStateTo('cutscene');
        }
      }
    };
    window.addEventListener('cj_ability_pickup' as any, handler);
    return () => window.removeEventListener('cj_ability_pickup' as any, handler);
  }, [setGameStateTo]);

  const handleCutsceneComplete = useCallback(() => {
    setShowCutscene(false);
    setCutsceneQueue([]);
    
    if (showVictoryCutscene) {
      // Victory cutscene done, show final screen
      return;
    }
    
    if (pendingLevel !== null) {
      if (pendingLevel === 1) {
        startGame();
      } else {
        beginLevel(pendingLevel);
      }
      setPendingLevel(null);
    } else {
      // Resuming from boss phase cutscene
      setGameStateTo('playing');
    }
  }, [pendingLevel, startGame, beginLevel, setGameStateTo, showVictoryCutscene]);

  const handleRestart = useCallback(() => {
    setShowVictoryCutscene(false);
    setShowCutscene(false);
    setIsLevi(false);
    setIsCJ(false);
    leviAudioRef.current?.pause();
    if (leviAudioRef.current) leviAudioRef.current.currentTime = 0;
    cjAudioRef.current?.pause();
    if (cjAudioRef.current) cjAudioRef.current.currentTime = 0;
    handleStart();
  }, [handleStart]);

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
        
        {gameState === 'title' && <TitleScreen onStart={handleStart} />}
        {showCutscene && cutsceneQueue.length > 0 && (
          <CutsceneScreen cutscenes={cutsceneQueue} onComplete={handleCutsceneComplete} />
        )}
        {gameState === 'gameover' && <GameOverScreen score={score} onRestart={handleRestart} />}
        {gameState === 'victory' && !showCutscene && (
          <GameOverScreen score={score} onRestart={handleRestart} victory />
        )}
      </div>
    </div>
  );
};

export default GameCanvas;
