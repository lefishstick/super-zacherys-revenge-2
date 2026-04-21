import { CHAPTER_NAMES, chapterStartLevel, heroForChapter } from '@/game/saveSystem';

interface DevModeScreenProps {
  onPick: (level: number, hero: 'zachery' | 'levi' | 'cj' | 'jesse') => void;
  onBack: () => void;
}

const HERO_COLORS: Record<string, string> = {
  zachery: 'text-green-400',
  levi: 'text-purple-400',
  cj: 'text-orange-400',
  jesse: 'text-yellow-300',
};

const HERO_LABELS: Record<string, string> = {
  zachery: 'Zachery',
  levi: 'Super Levi',
  cj: 'Sgt. CJ',
  jesse: 'Jesse',
};

const DevModeScreen = ({ onPick, onBack }: DevModeScreenProps) => {
  const chapters = Array.from({ length: 11 }, (_, i) => i + 1);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 p-6 overflow-y-auto">
      <h2 className="font-display text-4xl text-primary mb-2">DEV MODE</h2>
      <p className="font-game text-sm text-muted-foreground mb-6">Jump straight to any chapter — full kit included.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl w-full">
        {chapters.map(ch => {
          const lvl = chapterStartLevel(ch);
          const hero = heroForChapter(ch, lvl);
          return (
            <button
              key={ch}
              onClick={() => onPick(lvl, hero)}
              className="p-4 rounded-lg border-2 border-border bg-card/80 hover:bg-card hover:border-primary transition-all text-left active:scale-95"
            >
              <div className="font-display text-lg text-primary">Chapter {ch}</div>
              <div className="font-game text-sm text-foreground/90 truncate">{CHAPTER_NAMES[ch]}</div>
              <div className={`font-game text-xs mt-1 ${HERO_COLORS[hero]}`}>
                Level {lvl} · {HERO_LABELS[hero]}
              </div>
            </button>
          );
        })}

        <button
          onClick={() => onPick(21, 'jesse')}
          className="p-4 rounded-lg border-2 border-yellow-500/50 bg-card/80 hover:bg-card hover:border-yellow-400 transition-all text-left active:scale-95"
        >
          <div className="font-display text-lg text-yellow-300">Ch 11 · Jesse</div>
          <div className="font-game text-sm text-foreground/90 truncate">Jesse Joins</div>
          <div className="font-game text-xs mt-1 text-yellow-300">Level 21 · Jesse</div>
        </button>

        <button
          onClick={() => onPick(22, 'cj')}
          className="p-4 rounded-lg border-2 border-red-500/50 bg-card/80 hover:bg-card hover:border-red-400 transition-all text-left active:scale-95"
        >
          <div className="font-display text-lg text-red-400">Final Boss</div>
          <div className="font-game text-sm text-foreground/90 truncate">Mother of All Rot</div>
          <div className="font-game text-xs mt-1 text-orange-400">Level 22 · All Heroes</div>
        </button>
      </div>

      <button
        onClick={onBack}
        className="mt-6 px-8 py-3 bg-secondary text-secondary-foreground font-game rounded-lg hover:bg-secondary/80 transition-all active:scale-95"
      >
        ← Back
      </button>
    </div>
  );
};

export default DevModeScreen;
