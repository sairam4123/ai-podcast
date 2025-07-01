import { motion } from "framer-motion";
import clsx from "clsx";
import { cn } from "../lib/cn";

type ShimmerProps = {
  className?: string;
  rounded?: string; // e.g., "rounded-md", "rounded-full"
};

export default function Shimmer({ className = "", rounded = "rounded-md" }: ShimmerProps) {
  return (
    <div className={clsx("relative overflow-hidden", rounded, className)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
          ease: "easeInOut",
        }}
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
          width: "100%",
        }}
      />
      <div className="h-full w-full bg-slate-200 opacity-80" />
    </div>
  );
}

const shimmerStyle = {
  backgroundImage:
    "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
};

export function ShimmerBlock({ className = "", children }: { className?: string, children?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-300/50",
        "rounded-md",
        className,
      )}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        style={{ ...shimmerStyle }}
      >
      </motion.div>
      {children}
    </div>
  );
}
