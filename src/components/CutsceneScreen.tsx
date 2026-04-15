import { useState, useEffect, useCallback } from 'react';
import { Cutscene, CutsceneLine } from '@/game/types';

interface CutsceneScreenProps {
  cutscenes: Cutscene[];
  onComplete: () => void;
}

const SPEAKER_COLORS: Record<string, string> = {
  narrator: 'text-muted-foreground italic',
  zachery: 'text-primary font-bold',
  levi: 'text-game-fire font-bold',
  robot: 'text-game-toxic',
  voice: 'text-game-fire',
  colossus: 'text-game-boss font-bold',
  core: 'text-game-toxic font-bold',
};

const SPEAKER_LABELS: Record<string, string> = {
  narrator: '',
  zachery: 'Zachery',
  levi: 'Super Levi',
  robot: 'Broken Robot',
  voice: '???',
  colossus: 'The Rotten Colossus',
  core: 'The Rotten Core',
};

const CutsceneScreen = ({ cutscenes, onComplete }: CutsceneScreenProps) => {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showChapterTitle, setShowChapterTitle] = useState(true);

  const currentScene = cutscenes[sceneIndex];
  const currentLine: CutsceneLine | undefined = currentScene?.lines[lineIndex];

  // Typewriter effect
  useEffect(() => {
    if (!currentLine) return;
    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    const text = currentLine.text;
    const speed = currentLine.style === 'distorted' ? 60 : 30;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [currentLine, sceneIndex, lineIndex]);

  // Show chapter title briefly
  useEffect(() => {
    if (currentScene?.chapterName) {
      setShowChapterTitle(true);
      const t = setTimeout(() => setShowChapterTitle(false), 2500);
      return () => clearTimeout(t);
    } else {
      setShowChapterTitle(false);
    }
  }, [sceneIndex, currentScene?.chapterName]);

  const advance = useCallback(() => {
    if (showChapterTitle) {
      setShowChapterTitle(false);
      return;
    }
    if (isTyping) {
      // Skip to full text
      setDisplayedText(currentLine?.text ?? '');
      setIsTyping(false);
      return;
    }

    // Next line
    if (lineIndex < (currentScene?.lines.length ?? 0) - 1) {
      setLineIndex(lineIndex + 1);
    } else if (sceneIndex < cutscenes.length - 1) {
      setSceneIndex(sceneIndex + 1);
      setLineIndex(0);
    } else {
      onComplete();
    }
  }, [isTyping, lineIndex, sceneIndex, cutscenes.length, currentScene, currentLine, showChapterTitle, onComplete]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['enter', ' ', 'z', 'j', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [advance]);

  if (!currentScene) return null;

  const speakerLabel = currentLine ? SPEAKER_LABELS[currentLine.speaker] : '';
  const speakerClass = currentLine ? SPEAKER_COLORS[currentLine.speaker] || 'text-foreground' : '';
  const distorted = currentLine?.style === 'distorted';

  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-background z-30 cursor-pointer select-none"
      onClick={advance}
    >
      {/* Ambient particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary opacity-10 animate-float"
          style={{
            width: 3 + Math.random() * 5,
            height: 3 + Math.random() * 5,
            left: `${10 + Math.random() * 80}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${3 + Math.random() * 3}s`,
          }}
        />
      ))}

      {/* Chapter title overlay */}
      {showChapterTitle && currentScene.chapterName && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-40 animate-fade-in">
          {currentScene.title && (
            <h1 className="font-display text-2xl md:text-4xl text-primary animate-pulse-glow mb-2 text-center">
              {currentScene.title}
            </h1>
          )}
          <h2 className="font-display text-xl md:text-3xl text-foreground text-center">
            {currentScene.chapterName}
          </h2>
          <p className="font-game text-sm text-muted-foreground mt-4">Press any key to continue</p>
        </div>
      )}

      {/* Dialogue box */}
      {!showChapterTitle && currentLine && (
        <div className="relative z-10 w-full max-w-2xl px-6">
          {/* Dark vignette */}
          <div className="absolute inset-0 -m-32" style={{
            background: 'radial-gradient(ellipse at center, transparent 20%, hsl(150 20% 6%) 70%)',
          }} />

          <div className="relative bg-background/90 border border-border rounded-lg p-6 shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
            {speakerLabel && (
              <div className={`font-game text-sm mb-2 ${speakerClass}`}>
                {speakerLabel}
              </div>
            )}
            <p className={`font-game text-lg leading-relaxed ${speakerClass} ${
              distorted ? 'tracking-wider' : ''
            }`}
              style={distorted ? {
                textShadow: '0 0 10px hsl(var(--game-fire) / 0.5)',
                animation: 'flicker 0.3s infinite alternate',
              } : undefined}
            >
              {displayedText}
              {isTyping && <span className="animate-pulse ml-0.5">▌</span>}
            </p>
          </div>

          <p className="text-center font-game text-xs text-muted-foreground mt-4 opacity-60">
            Click or press Space to continue
          </p>
        </div>
      )}
    </div>
  );
};

export default CutsceneScreen;
