"use client";

import { useEffect, useRef } from "react";

export type CelebrationType = "achievement" | "levelup" | "streak";

export type CelebrationProps = {
  trigger: boolean;
  type: CelebrationType;
};

export function Celebration({ trigger, type }: CelebrationProps) {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!trigger || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    // Dynamically import canvas-confetti (client only)
    import("canvas-confetti").then((confettiModule) => {
      const confetti = confettiModule.default;

      switch (type) {
        case "achievement": {
          // Burst of colored confetti from center
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { x: 0.5, y: 0.5 },
            colors: ["#a855f7", "#3b82f6", "#f59e0b", "#10b981"],
            zIndex: 9999,
          });
          break;
        }

        case "levelup": {
          // Multiple bursts with star shapes
          const duration = 2000;
          const end = Date.now() + duration;

          const frameLevelUp = () => {
            confetti({
              particleCount: 5,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              shapes: ["star"],
              colors: ["#a855f7", "#6366f1", "#3b82f6"],
              zIndex: 9999,
            });
            confetti({
              particleCount: 5,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              shapes: ["star"],
              colors: ["#a855f7", "#6366f1", "#3b82f6"],
              zIndex: 9999,
            });

            if (Date.now() < end) {
              requestAnimationFrame(frameLevelUp);
            }
          };

          frameLevelUp();
          break;
        }

        case "streak": {
          // Side cannons (left and right)
          const fireLeft = () =>
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 45,
              origin: { x: 0, y: 0.6 },
              colors: ["#f97316", "#ef4444", "#eab308"],
              zIndex: 9999,
            });

          const fireRight = () =>
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 45,
              origin: { x: 1, y: 0.6 },
              colors: ["#f97316", "#ef4444", "#eab308"],
              zIndex: 9999,
            });

          fireLeft();
          fireRight();

          // Fire again after a short delay
          setTimeout(() => {
            fireLeft();
            fireRight();
          }, 400);
          break;
        }
      }
    });

    // Reset trigger tracking after animation completes
    const timeout = setTimeout(() => {
      hasTriggeredRef.current = false;
    }, 3000);

    return () => clearTimeout(timeout);
  }, [trigger, type]);

  // This component renders nothing visible; confetti renders to canvas overlay
  return null;
}
