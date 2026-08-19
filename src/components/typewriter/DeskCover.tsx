"use client";

import { JournalCover } from "@/components/journal/JournalCover";
import { getCoverPalette } from "@/lib/journal";

interface DeskCoverProps {
  coverName: string;
  title: string;
  onBeginOpen?: () => void;
  onOpen: () => void;
}

export function DeskCover({ coverName, title, onBeginOpen, onOpen }: DeskCoverProps) {
  return (
    <div className="desk-cover-scene">
      <JournalCover
        kicker="Manuscript"
        title={title}
        authorName={coverName}
        palette={getCoverPalette("desk-manuscript")}
        onBeginOpen={onBeginOpen}
        onOpen={onOpen}
      />
    </div>
  );
}
