import { Bot, Activity, Zap } from "lucide-react";

export const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 glass-header mb-5">
      <div className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Enhanced Bot Icon with Multiple Animation Layers */}
          <div className="relative group">
            {/* Outer glow ring */}
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-full blur-md animate-spin-slow opacity-75 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Pulsing background circle */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full animate-pulse" />

            {/* Main bot icon */}
            <div className="relative bg-background/80 backdrop-blur-sm rounded-full p-2 border border-primary/20">
              <Bot className="h-6 w-6 md:h-8 md:w-8 text-primary animate-glow group-hover:scale-110 transition-all duration-300" />
            </div>

            {/* Floating particles effect */}
            <div
              className="absolute top-0 right-0 w-1 h-1 bg-accent rounded-full animate-bounce opacity-70"
              style={{ animationDelay: "0s" }}
            />
            <div
              className="absolute bottom-1 left-0 w-1 h-1 bg-primary rounded-full animate-bounce opacity-70"
              style={{ animationDelay: "0.5s" }}
            />
            <div
              className="absolute top-2 left-2 w-0.5 h-0.5 bg-accent/80 rounded-full animate-ping opacity-60"
              style={{ animationDelay: "1s" }}
            />
          </div>

          {/* Enhanced Title Section */}
          <div className="relative">
            <h1 className="text-xl md:text-3xl font-bold font-headline text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-clip-text animate-gradient-x">
              Latency Topology Visualizer
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium opacity-90 group-hover:opacity-100 transition-opacity duration-300">
              Visualizing Global Crypto Exchange Infrastructure
            </p>

            {/* Subtle underline animation */}
            <div className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-0 group-hover:w-full transition-all duration-500" />
          </div>
        </div>

        {/* Enhanced Status Indicator */}
        <div className="flex items-center gap-3">
          {/* Network activity indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur-sm border border-primary/10">
            <Activity className="w-3 h-3 text-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Active</span>
          </div>

          {/* Live data indicator with enhanced animation */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 backdrop-blur-sm border border-green-500/20">
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-xs text-green-400 font-medium hidden md:inline">
              Live Data
            </span>
            <Zap
              className="w-3 h-3 text-green-400 animate-bounce hidden lg:inline"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes glow {
          0%,
          100% {
            filter: drop-shadow(0 0 5px currentColor);
          }
          50% {
            filter: drop-shadow(0 0 15px currentColor)
              drop-shadow(0 0 25px currentColor);
          }
        }

        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 2s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
    </header>
  );
};

