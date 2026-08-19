"use client";

import { motion } from "framer-motion";

interface CarriageProps {
  x: number;
  y: number;
  isReturning: boolean;
  mechanicalEffects: boolean;
}

export function Carriage({ x, y, isReturning, mechanicalEffects }: CarriageProps) {
  const vibration = mechanicalEffects ? (isReturning ? 1.8 : 0.45) : 0;

  return (
    <motion.div
      aria-hidden="true"
      className="typewriter-carriage"
      animate={{
        x: Math.max(0, x - 58),
        y: y + 30,
        rotate: mechanicalEffects ? [0, vibration, -vibration, 0] : 0,
      }}
      transition={{
        x: { duration: isReturning ? 0.22 : 0.105, ease: [0.19, 1, 0.22, 1] },
        y: { duration: 0.16, ease: [0.2, 0, 0.2, 1] },
        rotate: { duration: 0.12 },
      }}
    >
      <div className="typewriter-carriage-top" />
      <div className="typewriter-carriage-body">
        <span />
      </div>
    </motion.div>
  );
}
