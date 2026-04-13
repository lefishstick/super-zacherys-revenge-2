interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
  victory?: boolean;
}

const GameOverScreen = ({ score, onRestart, victory }: GameOverScreenProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 z-20">
      <div className="flex flex-col items-center gap-6">
        <h2 className={`font-display text-4xl md:text-6xl font-black ${
          victory ? 'text-primary animate-pulse-glow' : 'text-destructive'
        }`}>
          {victory ? '🏆 VICTORY! 🏆' : '💀 GAME OVER 💀'}
        </h2>
        
        {victory && (
          <p className="font-game text-lg text-foreground text-center max-w-md">
            The Rotten Colossus has been defeated! The Dark Forest is free once more. 
            Zachery's revenge is complete!
          </p>
        )}

        <p className="font-game text-2xl text-accent">
          Final Score: {score}
        </p>

        <button
          onClick={onRestart}
          className="mt-4 px-8 py-3 bg-primary text-primary-foreground font-game text-lg rounded-lg
            hover:bg-primary/90 transition-all shadow-[0_0_20px_hsl(var(--primary)/0.4)]
            active:scale-95"
        >
          {victory ? '🗡️ Play Again' : '⚔️ Try Again'}
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
