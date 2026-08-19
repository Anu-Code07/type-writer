"use client";

import { useState } from "react";

interface CoverInlineFieldProps {
  value: string;
  className: string;
  ariaLabel: string;
  fallback: string;
  onSave: (value: string) => void;
}

export function CoverInlineField({ value, className, ariaLabel, fallback, onSave }: CoverInlineFieldProps) {
  const [draft, setDraft] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  const commit = () => {
    const nextValue = draft.trim() || fallback;

    setIsEditing(false);

    if (nextValue !== value) {
      onSave(nextValue);
    }
  };

  return (
    <input
      className={`${className} is-editable`}
      value={isEditing ? draft : value}
      aria-label={ariaLabel}
      title="Click to rename"
      maxLength={48}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onFocus={() => {
        setDraft(value);
        setIsEditing(true);
      }}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        event.stopPropagation();

        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }

        if (event.key === "Escape") {
          setDraft(value);
          setIsEditing(false);
          event.currentTarget.blur();
        }
      }}
    />
  );
}
