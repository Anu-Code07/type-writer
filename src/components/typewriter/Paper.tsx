"use client";

import { PropsWithChildren } from "react";
import { useSettingsStore } from "@/store/settingsStore";

const paperClasses = {
  ivory: "paper-ivory",
  white: "paper-white",
  dark: "paper-dark",
};

export function Paper({ children }: PropsWithChildren) {
  const paper = useSettingsStore((state) => state.paper);

  return <section className={`typewriter-paper ${paperClasses[paper]}`}>{children}</section>;
}
