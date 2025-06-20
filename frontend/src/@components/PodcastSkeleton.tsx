// PodcastCardSkeleton.tsx
import { motion } from "framer-motion";
import clsx from "clsx";

const shimmerStyle = {
  backgroundImage:
    "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
};

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div className={clsx("relative overflow-hidden bg-slate-300/50", className, "rounded-md")}>
      <motion.div
        className="absolute inset-0"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        style={{ ...shimmerStyle }}
      />
    </div>
  );
}

export default function PodcastCardSkeleton() {
  return (
    <div className="relative cursor-pointer z-1 w-48 h-64 border border-sky-800/20 transition-all ease-out shadow-md shadow-black/60 m-3 min-w-48 bg-sky-500/30 rounded-lg overflow-hidden select-none">
      {/* Image shimmer */}
      <ShimmerBlock className="w-full h-47 rounded-lg" />

      {/* Content shimmer */}
      <div className="absolute inset-0 flex flex-col justify-end p-2 gap-1 bg-gradient-to-t from-black/60 via-black/30 to-transparent rounded-lg">
        <ShimmerBlock className="h-5 w-11/12" /> {/* Title */}
        <ShimmerBlock className="h-3 w-4/5" />   {/* Desc line 1 */}
        <div className="flex items-center gap-2 mt-1">
          <ShimmerBlock className="h-3 w-8 rounded-sm" />
          <ShimmerBlock className="h-3 w-16 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
