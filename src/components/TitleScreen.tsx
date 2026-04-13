import bossImg from '@/assets/finalboss_2.png';

interface TitleScreenProps {
  onStart: () => void;
}

const TitleScreen = ({ onStart }: TitleScreenProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Dark forest vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary to-background opacity-80" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, hsl(150 20% 6%) 80%)',
      }} />
      
      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary opacity-20 animate-float"
          style={{
            width: 4 + Math.random() * 6,
            height: 4 + Math.random() * 6,
            left: `${10 + Math.random() * 80}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Boss image as decoration */}
        <img
          src={bossImg}
          alt="Boss"
          className="w-32 h-32 object-contain animate-float opacity-60"
          style={{ filter: 'drop-shadow(0 0 20px hsl(25 90% 50% / 0.5))' }}
        />

        <h1 className="font-display text-3xl md:text-5xl font-black text-center leading-tight animate-pulse-glow text-primary">
          Super Zachery's
          <br />
          Revenge 2
        </h1>
        
        <p className="font-game text-lg text-muted-foreground text-center tracking-wider">
          Journey Through the Dark Forest
        </p>

        <button
          onClick={onStart}
          className="mt-6 px-10 py-4 bg-primary text-primary-foreground font-game text-xl rounded-lg
            hover:bg-primary/90 transition-all duration-300
            shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)]
            active:scale-95"
        >
          ⚔️ Start Adventure ⚔️
        </button>

        <div className="mt-8 text-muted-foreground font-game text-sm text-center space-y-1">
          <p>Arrow Keys / WASD — Move & Jump</p>
          <p>Z / J — Attack</p>
        </div>
      </div>
    </div>
  );
};

export default TitleScreen;
