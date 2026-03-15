"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { Transition, Target, TargetAndTransition } from "framer-motion";

interface RotatingTextProps {
  texts: string[];
  currentIndex: number;
  transition?: Transition;
  initial?: Target;
  animate?: TargetAndTransition;
  exit?: Target;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | number;
  splitBy?: "characters" | "words";
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

function splitIntoCharacters(text: string): string[] {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

    return Array.from(segmenter.segment(text), (s) => s.segment);
  }

  return Array.from(text);
}

export function RotatingText({
  texts,
  currentIndex,
  transition = { type: "spring", damping: 28, stiffness: 800 },
  initial = { y: "50%", opacity: 0 },
  animate = { y: 0, opacity: 1 },
  exit = { y: "-50%", opacity: 0 },
  staggerDuration = 0.008,
  staggerFrom = "first",
  splitBy = "characters",
  mainClassName,
  splitLevelClassName,
  elementLevelClassName,
}: RotatingTextProps) {
  const elements = useMemo(() => {
    const currentText = texts[currentIndex];

    if (splitBy === "characters") {
      const words = currentText.split(" ");

      return words.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1,
      }));
    }

    return currentText.split(" ").map((word, i, arr) => ({
      characters: [word],
      needsSpace: i !== arr.length - 1,
    }));
  }, [texts, currentIndex, splitBy]);

  function getStaggerDelay(index: number, total: number): number {
    if (staggerFrom === "first") return index * staggerDuration;
    if (staggerFrom === "last") return (total - 1 - index) * staggerDuration;
    if (staggerFrom === "center") {
      return Math.abs(Math.floor(total / 2) - index) * staggerDuration;
    }

    return Math.abs((staggerFrom as number) - index) * staggerDuration;
  }

  return (
    <motion.span
      className={[
        "relative inline-flex flex-wrap whitespace-pre-wrap",
        mainClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      layout
      transition={transition}
    >
      {/* Screen reader text */}
      <span className="sr-only">{texts[currentIndex]}</span>

      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={currentIndex}
          aria-hidden="true"
          className="inline-flex flex-wrap"
          layout
        >
          {elements.map((wordObj, wordIndex, array) => {
            const previousCharsCount = array
              .slice(0, wordIndex)
              .reduce((sum, w) => sum + w.characters.length, 0);
            const totalChars = array.reduce(
              (sum, w) => sum + w.characters.length,
              0,
            );

            return (
              <span
                key={wordIndex}
                className={["inline-flex", splitLevelClassName]
                  .filter(Boolean)
                  .join(" ")}
              >
                {wordObj.characters.map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    animate={animate}
                    className={["inline-block", elementLevelClassName]
                      .filter(Boolean)
                      .join(" ")}
                    exit={{
                      ...exit,
                      transition: { duration: 0.1, ease: "easeIn" },
                    }}
                    initial={initial}
                    transition={{
                      ...transition,
                      delay: getStaggerDelay(
                        previousCharsCount + charIndex,
                        totalChars,
                      ),
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordObj.needsSpace && (
                  <span className="whitespace-pre"> </span>
                )}
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
