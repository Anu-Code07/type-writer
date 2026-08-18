"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";

interface CursorProps {
  x: number;
  y: number;
  lineHeight: number;
  isVisible: boolean;
}

export function Cursor({ x, y, lineHeight, isVisible }: CursorProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <motion.span
      aria-hidden="true"
      className="typewriter-cursor"
      animate={{ opacity: [1, 1, 0.18, 0.18, 1], x, y }}
      transition={{
        opacity: { duration: 1.25, repeat: Infinity, ease: "linear" },
        x: { duration: 0.08, ease: [0.2, 0, 0.2, 1] },
        y: { duration: 0.12, ease: [0.2, 0, 0.2, 1] },
      }}
      style={
        {
          height: lineHeight * 0.92,
        } as CSSProperties
      }
    />
  );
}
