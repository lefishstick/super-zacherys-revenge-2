import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameLoop } from '@/game/useGameLoop';
import { CUTSCENES, LEVEL_CUTSCENE_BEFORE, VICTORY_CUTSCENE, WEAPON_CUTSCENES, LEVI_ABILITY_CUTSCENES, CJ_ABILITY_CUTSCENES } from '@/game/cutscenes';
import { Cutscene } from '@/game/types';
import TitleScreen from './TitleScreen';
import GameOverScreen from './GameOverScreen';
import CutsceneScreen from './CutsceneScreen';
import DevModeScreen from './DevModeScreen';
import { saveSlot, levelToChapter, heroForChapter, type SaveSlot } from '@/game/saveSystem';

// Chapter start levels — checkpoints are set at chapter boundaries
const CHAPTER_START_LEVEL: Record<number, number> = {
  1: 1, 2: 3, 3: 5, 4: 7, 5: 9, 6: 11, 7: 13, 8: 14, 9: 16, 10: 18, 11: 19,
};

function getChapterForLevel(level: number): number {
  let chapter = 1;
  for (const [ch, startLvl] of Object.entries(CHAPTER_START_LEVEL)) {
    if (level >= startLvl) chapter = Number(ch);
  }
  return chapter;
}

const GameCanvas = () => {
  const { canvasRef, gameState, score, currentLevel, startGame, startAtLevel, beginLevel, setGameStateTo, CANVAS_W, CANVAS_H } = useGameLoop();
  const [showDevMode, setShowDevMode] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const leviAudioRef = useRef<HTMLAudioElement | null>(null);
  const cjAudioRef = useRef<HTMLAudioElement | null>(null);
  const jesseAudioRef = useRef<HTMLAudioElement | null>(null);
  const wormAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isLevi, setIsLevi] = useState(false);
  const [isCJ, setIsCJ] = useState(false);
  const [isJesse, setIsJesse] = useState(false);
  const [cutsceneQueue, setCutsceneQueue] = useState<Cutscene[]>([]);
  const [showCutscene, setShowCutscene] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);
  const [showVictoryCutscene, setShowVictoryCutscene] = useState(false);
  const [checkpointLevel, setCheckpointLevel] = useState(1);

  // Update checkpoint whenever a new chapter starts
  useEffect(() => {
    const chapter = getChapterForLevel(currentLevel);
    const startLvl = CHAPTER_START_LEVEL[chapter] ?? 1;
    if (currentLevel === startLvl) {
      setCheckpointLevel(startLvl);
    }
  }, [currentLevel]);

  // Auto-save active slot whenever level changes during play
  useEffect(() => {
    if (activeSlot === null) return;
    if (gameState !== 'playing' && gameState !== 'cutscene') return;
    const chapter = levelToChapter(currentLevel);
    const hero = isJesse ? 'jesse' : isCJ ? 'cj' : isLevi ? 'levi' : 'zachery';
    saveSlot(activeSlot, { level: currentLevel, chapter, hero, score });
  }, [activeSlot, currentLevel, score, gameState, isJesse, isCJ, isLevi]);

  // ── UNIFIED MUSIC MANAGEMENT ─────────────────────────────────────────────
  // Single source of truth: pause everything, then start exactly one track
  // based on current game state. Prevents multiple themes overlapping.
  useEffect(() => {
    const ensure = (ref: React.MutableRefObject<HTMLAudioElement | null>, src: string, vol: number) => {
      if (!ref.current) {
        ref.current = new Audio(src);
        ref.current.loop = true;
        ref.current.volume = vol;
      }
      return ref.current;
    };
    const stopAll = () => {
      [audioRef, leviAudioRef, cjAudioRef, jesseAudioRef, wormAudioRef].forEach(r => {
        if (r.current) { r.current.pause(); }
      });
    };

    if (gameState !== 'playing' && gameState !== 'cutscene') {
      stopAll();
      [audioRef, leviAudioRef, cjAudioRef, jesseAudioRef, wormAudioRef].forEach(r => {
        if (r.current) r.current.currentTime = 0;
      });
      return;
    }

    stopAll();
    let toPlay: HTMLAudioElement | null = null;
    if (currentLevel === 22) {
      toPlay = ensure(wormAudioRef, '/audio/great-worm-boss.mp3', 0.5);
    } else if (isJesse) {
      toPlay = ensure(jesseAudioRef, '/audio/jesse-theme.mp3', 0.4);
    } else if (isCJ) {
      toPlay = ensure(cjAudioRef, '/audio/cj-theme.mp3', 0.4);
    } else if (isLevi) {
      toPlay = ensure(leviAudioRef, '/audio/levi-theme.mp3', 0.4);
    } else {
      toPlay = ensure(audioRef, '/audio/theme.mp3', 0.4);
    }
    toPlay?.play().catch(() => {});
  }, [gameState, currentLevel, isLevi, isCJ, isJesse]);

  // Hero swap events — STATE ONLY. Audio is handled by the unified music effect above.
  useEffect(() => {
    const onLevi = () => { setIsLevi(true); setIsCJ(false); setIsJesse(false); };
    const onCJ = () => { setIsCJ(true); setIsLevi(false); setIsJesse(false); };
    const onJesse = () => { setIsJesse(true); setIsCJ(false); setIsLevi(false); };
    const onZach = () => { setIsLevi(false); setIsCJ(false); setIsJesse(false); };
    window.addEventListener('switch_to_levi', onLevi);
    window.addEventListener('switch_to_cj', onCJ);
    window.addEventListener('switch_to_jesse', onJesse);
    window.addEventListener('switch_to_zachery', onZach);
    return () => {
      window.removeEventListener('switch_to_levi', onLevi);
      window.removeEventListener('switch_to_cj', onCJ);
      window.removeEventListener('switch_to_jesse', onJesse);
      window.removeEventListener('switch_to_zachery', onZach);
    };
  }, []);

  // When game signals a cutscene-before-level
  useEffect(() => {
    if (gameState === 'cutscene') {
      // Already handled
    }
  }, [gameState]);

  const handleStart = useCallback((slotIndex?: number) => {
    if (slotIndex !== undefined) setActiveSlot(slotIndex);
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

  const handleContinueSlot = useCallback((slot: SaveSlot) => {
    setActiveSlot(slot.slot);
    const hero = slot.hero ?? heroForChapter(levelToChapter(slot.level), slot.level);
    setIsLevi(hero === 'levi');
    setIsCJ(hero === 'cj');
    setIsJesse(hero === 'jesse');
    startAtLevel(slot.level, hero);
  }, [startAtLevel]);

  const handleDevPick = useCallback((level: number, hero: 'zachery' | 'levi' | 'cj' | 'jesse') => {
    setActiveSlot(null); // dev mode doesn't auto-save
    setIsLevi(hero === 'levi');
    setIsCJ(hero === 'cj');
    setIsJesse(hero === 'jesse');
    setShowDevMode(false);
    startAtLevel(level, hero);
  }, [startAtLevel]);

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

  // Handle direct cutscene play events (e.g. true_ending after mech_worm)
  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      const scene = CUTSCENES[e.detail];
      if (scene) {
        setCutsceneQueue([scene]);
        setShowCutscene(true);
        setGameStateTo('cutscene');
      }
    };
    window.addEventListener('play_cutscene' as any, handler);
    return () => window.removeEventListener('play_cutscene' as any, handler);
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
    setCheckpointLevel(1);
    leviAudioRef.current?.pause();
    if (leviAudioRef.current) leviAudioRef.current.currentTime = 0;
    cjAudioRef.current?.pause();
    if (cjAudioRef.current) cjAudioRef.current.currentTime = 0;
    handleStart();
  }, [handleStart]);

  const handleContinue = useCallback(() => {
    setShowCutscene(false);
    // Determine character state for checkpoint level
    if (checkpointLevel >= 14) {
      setIsCJ(true);
      setIsLevi(false);
    } else if (checkpointLevel >= 9) {
      setIsLevi(true);
      setIsCJ(false);
    }
    handleLevelTransition(checkpointLevel);
  }, [checkpointLevel, handleLevelTransition]);

  const checkpointChapter = getChapterForLevel(checkpointLevel);

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
        
        {gameState === 'title' && !showDevMode && (
          <TitleScreen
            onStart={() => handleStart()}
            onContinueSlot={handleContinueSlot}
            onDevMode={() => setShowDevMode(true)}
          />
        )}
        {gameState === 'title' && showDevMode && (
          <DevModeScreen onPick={handleDevPick} onBack={() => setShowDevMode(false)} />
        )}
        {showCutscene && cutsceneQueue.length > 0 && (
          <CutsceneScreen cutscenes={cutsceneQueue} onComplete={handleCutsceneComplete} />
        )}
        {gameState === 'gameover' && (
          <GameOverScreen
            score={score}
            onRestart={handleRestart}
            onContinue={checkpointLevel > 0 ? handleContinue : undefined}
            checkpointChapter={checkpointChapter}
          />
        )}
        {gameState === 'victory' && !showCutscene && (
          <GameOverScreen score={score} onRestart={handleRestart} victory />
        )}
      </div>
    </div>
  );
};

export default GameCanvas;
