"use client";

import { useEffect, useState } from "react";

type HeroTypewriterProps = {
  words: string[];
  className?: string;
  typingDelayMs?: number;
  deletingDelayMs?: number;
  pauseMs?: number;
};

export function HeroTypewriter({
  words,
  className = "",
  typingDelayMs = 90,
  deletingDelayMs = 50,
  pauseMs = 1200,
}: HeroTypewriterProps) {
  const safeWords = words.length > 0 ? words : [""];
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = safeWords[wordIndex] ?? "";
    let timeoutId: number | undefined;

    if (!isDeleting && text === currentWord) {
      timeoutId = window.setTimeout(() => {
        setIsDeleting(true);
      }, pauseMs);
    } else if (isDeleting && text === "") {
      setIsDeleting(false);
      setWordIndex((current) => (current + 1) % safeWords.length);
    } else {
      timeoutId = window.setTimeout(() => {
        const nextText = isDeleting
          ? currentWord.slice(0, Math.max(0, text.length - 1))
          : currentWord.slice(0, text.length + 1);

        setText(nextText);
      }, isDeleting ? deletingDelayMs : typingDelayMs);
    }

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    deletingDelayMs,
    isDeleting,
    pauseMs,
    safeWords,
    text,
    typingDelayMs,
    wordIndex,
  ]);

  const currentWord = safeWords[wordIndex] ?? "";
  const visibleText = text || currentWord.slice(0, 1);

  return (
    <span className={className}>
      <span className="sr-only">{safeWords.join(" ")}</span>
      <span
        aria-hidden="true"
        className="inline-flex w-fit items-center whitespace-nowrap align-baseline"
      >
        <span className="inline-block">{visibleText}</span>
        <span className="ml-1 inline-block h-[1.05em] w-[0.12em] shrink-0 rounded-full bg-current/80 align-[-0.18em] animate-pulse" />
      </span>
    </span>
  );
}
