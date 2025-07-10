import React, {
  useEffect,
  useRef,
  useState,
  ReactNode,
  useMemo,
} from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

export interface SlidingTitleProps {
  children: ReactNode;
  speed?: number;
  wait?: number;
  className?: string;
}

export default function SlidingTitle({
  children,
  speed = 60,
  wait = 1000,
  className = "",
}: SlidingTitleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [distance, setDistance] = useState(0);
  const [key, setKey] = useState(0);


  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      const d = Math.max(0, content.scrollWidth - container.clientWidth + 10);
      setDistance(d);

      console.log(d, container.clientWidth, content.scrollWidth);
      setKey((k) => k + 1);
    };

    measure();

    const ro = new ResizeObserver(measure);
    containerRef.current && ro.observe(containerRef.current);
    contentRef.current && ro.observe(contentRef.current);

    return () => ro.disconnect();
  }, []);

  const variants = useMemo<Variants | undefined>(() => {
    if (distance === 0) return undefined;

    const scrollSec = distance / speed;
    const waitSec = wait / 1000;
    const total = waitSec * 2 + scrollSec;
    const pct = (s: number) => s / total;

    return {
      animate: {
        x: [0, 0, -distance, -distance, 0],
        transition: {
          duration: total,
          ease: "linear",
          times: [0, pct(waitSec), pct(waitSec + scrollSec), pct(waitSec + scrollSec + waitSec), 1],
          repeat: Infinity,
        },
      },
    };
  }, [distance, speed, wait]);

  return (
    <div
      ref={containerRef}
      className={`relative h-8 overflow-hidden whitespace-nowrap ${className}`}
      style={{
        width: "100%",
        minWidth: 0, // required in flex children
        display: "block", // don't rely on flex only
      }}
    >
      <motion.div
        key={key}
        ref={contentRef}
        className="absolute whitespace-nowrap"
        style={{
          display: "inline-block",
          willChange: distance > 0 ? "transform" : undefined,
        }}
        variants={variants}
        animate={variants ? "animate" : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
}
