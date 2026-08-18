"use client";

import { Carriage } from "@/components/typewriter/Carriage";
import { Platen } from "@/components/typewriter/Platen";

interface TypewriterMechanismProps {
  cursorX: number;
  cursorY: number;
  returnPulse: number;
  isReturning: boolean;
  mechanicalEffects: boolean;
}

export function TypewriterMechanism({
  cursorX,
  cursorY,
  returnPulse,
  isReturning,
  mechanicalEffects,
}: TypewriterMechanismProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
      <Platen y={cursorY} returnPulse={returnPulse} mechanicalEffects={mechanicalEffects} />
      <Carriage
        x={cursorX}
        y={cursorY}
        isReturning={isReturning}
        mechanicalEffects={mechanicalEffects}
      />
    </div>
  );
}
