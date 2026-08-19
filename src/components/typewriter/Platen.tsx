"use client";

import { motion } from "framer-motion";

interface PlatenProps {
  y: number;
  returnPulse: number;
  mechanicalEffects: boolean;
}

export function Platen({ y, returnPulse, mechanicalEffects }: PlatenProps) {
  return (
    <motion.div
      aria-hidden="true"
      className="typewriter-platen"
      animate={{
        y: y + 51,
        scaleY: mechanicalEffects && returnPulse > 0 ? [1, 0.94, 1] : 1,
      }}
      transition={{
        y: { duration: 0.16, ease: [0.2, 0, 0.2, 1] },
        scaleY: { duration: 0.18 },
      }}
    >
      <div className="typewriter-platen-roller" />
    </motion.div>
  );
}
