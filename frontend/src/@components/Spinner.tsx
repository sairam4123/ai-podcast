import { cn } from "../lib/cn";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: "cyan" | "white" | "gray";
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const colorMap = {
  cyan: "text-cyan-400",
  white: "text-white",
  gray: "text-slate-400",
};

export default function Spinner({
  size = "md",
  className = "",
  color = "cyan",
}: SpinnerProps) {
  return (
    <div className={cn("relative", sizeMap[size], className)}>
      {/* Outer ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 border-current opacity-20",
          colorMap[color]
        )}
      />
      {/* Spinning arc */}
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 border-transparent border-t-current spinner",
          colorMap[color]
        )}
      />
    </div>
  );
}

// Full page loader
export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="xl" />
      {message && (
        <p className="text-cyan-400/80 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
}

// Inline loading indicator
export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}