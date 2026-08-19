"use client";

import { RefObject, useEffect, useMemo, useState } from "react";

interface CursorPosition {
  x: number;
  y: number;
  line: number;
  column: number;
  lineHeight: number;
  charWidth: number;
}

const measureCursor = (
  content: string,
  cursorIndex: number,
  containerWidth: number,
  fontSize: number,
): CursorPosition => {
  const lineHeight = fontSize * 1.72;
  const charWidth = fontSize * 0.61;
  const maxColumns = Math.max(18, Math.floor(containerWidth / charWidth));
  const contentBeforeCursor = content.slice(0, cursorIndex);
  const physicalLines = contentBeforeCursor.split("\n");
  let visualLine = 0;
  let column = 0;

  physicalLines.forEach((line, index) => {
    const wrappedLines = Math.floor(line.length / maxColumns);
    const wrappedColumn = line.length % maxColumns;
    visualLine += wrappedLines;
    column = wrappedColumn;

    if (index < physicalLines.length - 1) {
      visualLine += 1;
      column = 0;
    }
  });

  return {
    x: column * charWidth,
    y: visualLine * lineHeight,
    line: visualLine,
    column,
    lineHeight,
    charWidth,
  };
};

export const useCursorPosition = (
  content: string,
  cursorIndex: number,
  fontSize: number,
  containerRef: RefObject<HTMLElement | null>,
) => {
  const [containerWidth, setContainerWidth] = useState(640);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => setContainerWidth(element.clientWidth);
    const resizeObserver = new ResizeObserver(updateWidth);

    updateWidth();
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  return useMemo(
    () => measureCursor(content, cursorIndex, containerWidth, fontSize),
    [containerWidth, content, cursorIndex, fontSize],
  );
};
