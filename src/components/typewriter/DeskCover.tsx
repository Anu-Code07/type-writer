"use client";

import { JournalCover } from "@/components/journal/JournalCover";
import { getCoverPalette } from "@/lib/journal";

interface DeskCoverProps {
  coverName: string;
  kicker: string;
  title: string;
  onBeginOpen?: () => void;
  onOpen: () => void;
  onRenameKicker: (kicker: string) => void;
  onRenameTitle: (title: string) => void;
}

export function DeskCover({
  coverName,
  kicker,
  title,
  onBeginOpen,
  onOpen,
  onRenameKicker,
  onRenameTitle,
}: DeskCoverProps) {
  return (
    <div className="desk-cover-scene">
      <JournalCover
        kicker={kicker}
        title={title}
        authorName={coverName}
        palette={getCoverPalette("desk-manuscript")}
        onBeginOpen={onBeginOpen}
        onOpen={onOpen}
        onRenameKicker={onRenameKicker}
        onRenameTitle={onRenameTitle}
      />
    </div>
  );
}
